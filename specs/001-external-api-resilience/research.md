# Phase 0 Research: External API Resilience

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-18

## Context and observed behavior

The four external lookups run inside an async App Router page. The current production build metadata (`.next/prerender-manifest.json`) shows `/` as `compute: "static"` with `initialRevalidateSeconds: 300`; external calls therefore happen during build and ISR revalidation, not on every visitor request. The page awaits `getReleasedVideos()` before rendering `CreatorInformation`, which serializes the creator lookup after the three video lookups.

Current integration characteristics:

- GitHub Gist: pinned commit URL, `next: { revalidate: false }`, no deadline, `res.json()` trusted as `CreatorDataType`.
- YouTube: two helpers / three lookups, API key in the query string, `next: { revalidate: 300 }`, no deadline, `res.json()` trusted as `VideoData`.
- Error responses: non-OK status throws; each lookup has its own `try/catch` with `unstable_rethrow` and a fallback.
- Only the creator name and video list presence are checked; unused video metadata is declared but not consumed.
- Missing configuration currently produces a failed request and then a fallback.

Next.js 16.4.4 internals relevant to this feature:

- Only `status === 200` fetch responses enter the data cache (`node_modules/next/dist/server/lib/patch-fetch.js`, cache condition around line 703). 4xx/5xx responses are retried on the next revalidation.
- A caller-provided `signal` is removed when the fetch is revalidated in the background (`patch-fetch.js`, request-input field handling around lines 659–679). A timeout that relies only on `signal` is therefore not guaranteed during stale revalidation.
- When a fetch-cache entry is stale in a request context, Next.js returns the cached response immediately and starts `doOriginalFetch(true)` in the background, using its own pending-revalidation tracking (`patch-fetch.js` around lines 803–828). That background request is not owned by the caller.
- When Next.js must persist fresh data, it can run a foreground fetch revalidation that also drops the caller signal (`patch-fetch.js` around lines 929–978).
- `createCachedDynamicResponse` returns a response to the caller immediately but writes the fetch cache from a separate clone; the write is registered as pending work (`patch-fetch.js` around lines 199–245).
- Next.js registers pending revalidations with its post-render `waitUntil` pipeline and waits for them after the response (`node_modules/next/dist/server/app-render/app-render.js` around lines 1672–1684; `render-result.js` around lines 200–202). Cache writes are therefore not bounded by a caller-side timer.
- The official Next.js 16.4.4 docs state that time-based revalidation uses stale-while-revalidate: cached content is served immediately and regeneration happens in the background (`node_modules/next/dist/docs/01-app/02-guides/how-revalidation-works.md`). The ISR guide confirms the stale page is returned before background regeneration (`01-app/02-guides/incremental-static-regeneration.md`).
- `unstable_rethrow` in `next/navigation` rethrows router errors, CSR bailouts, dynamic-server errors, hanging-promise rejections, and prerender interrupts, including those found through `error.cause`.

## Decisions

### R1. Per-request deadline of 5000 ms (initial, adjustable)

**Decision**: Use a single named deadline, `EXTERNAL_REQUEST_TIMEOUT_MS = 5000`, as the initial value for all four lookups.

**Rationale**: The project has no measured latency baseline for these endpoints, so 5000 ms is an engineering starting point, not an optimum. It is long enough to absorb ordinary cold DNS/TLS and transient latency, short enough that a completely unresponsive service does not hold a build or background refresh indefinitely, and because the four lookups are concurrent the awaited external phase is bounded by roughly one deadline rather than four. A single constant keeps tests deterministic and behavior predictable.

**Benefits**: bounded build/refresh waiting; one value to tune; deterministic fake-timer tests; 5 seconds leaves room for ordinary cold DNS/TLS without leaving the wait open-ended. These are design expectations, not measured guarantees.

**Risks**: a healthy response slower than 5 seconds produces a fallback, and the fallback route HTML may remain cached for the existing revalidation window; one value may not fit both providers if operational data later shows different profiles; the value is not an SLO.

**Limitations**: without measurements, the value cannot be defended as optimal. It should be revisited only with observed build/refresh diagnostics or timeout frequency.

**Alternatives considered**:
- 3 seconds: faster fallback, but more risk of false fallbacks on cold connections; also unmeasured.
- 8–10 seconds: safer for slow networks, but makes an unresponsive service hold generation longer.
- Different limits per provider: rejected as unnecessary complexity without evidence.
- No deadline: rejected by FR-002.

### R2. Deadline implementation: abort controller + explicit race (caller-side bound)

**Decision**: Implement one helper that races the complete caller-visible operation (`fetch`, HTTP status check, and body parsing) against an explicit `setTimeout` deadline, while passing an `AbortController.signal` to `fetch`.

**Rationale**: The explicit race guarantees a finite application wait even when Next.js drops the custom signal during stale background revalidation. Including body parsing covers the case where headers arrive quickly but the body stalls. `AbortController` still cancels the request on paths where Next honors the signal. An explicit timer is controllable by Jest fake timers, unlike `AbortSignal.timeout`.

**Three distinct clocks**:

| Clock | Guarantee |
|---|---|
| Caller wait | Bounded by `EXTERNAL_REQUEST_TIMEOUT_MS`; the lookup fails and selects its fallback. |
| Origin HTTP execution | Abort is best-effort. It is passed through on a normal build/first render, but Next.js removes it for stale/background and foreground fetch revalidations, so the origin request can outlive the deadline. |
| Next.js cache update | Not bounded. Fetch-cache and route-cache writes can occur after the fallback has been selected; a late 200 can affect a future render. |

**Why not stronger**: fully controlling cancellation and cache timing requires bypassing Next's fetch cache (`cache: 'no-store'`) and implementing a custom cache or request layer. That violates FR-015 (preserve cache/timing, no new infrastructure) and the simplicity principle. The chosen strategy guarantees the user-visible contract — bounded waiting, fallback, and no change to the current result — while documenting background work as an accepted limitation.

**Alternatives considered**:
- `AbortSignal.timeout` only: simpler, but defeated by Next's signal removal during stale revalidation and harder to drive with fake timers.
- Race only, no signal: guarantees the caller deadline but leaves an avoidable request running where abort would work.
- Bypass Next's fetch cache and manage requests manually: would bound cancellation but changes the approved cache strategy and adds infrastructure.
- Third-party timeout wrapper: rejected; native platform capability is sufficient and no dependency is justified.

### R3. Runtime validation with hand-written type guards

**Decision**: Add two guards over `unknown`: one for the complete displayed creator profile and one for the consumed video subset. Reject creator data unless all five displayed fields are non-whitespace strings. Reject video data unless `items` is an array and, when non-empty, `items[0].id.videoId` is a non-whitespace string. Empty video collections remain structurally valid and map to the existing empty state.

**Rationale**: TypeScript does not validate runtime data. The guards cover exactly the fields the UI reads, so normal upstream payloads are not rejected for missing unused metadata. Hand-written guards avoid a schema dependency and keep the project's minimal dependency set.

**Alternatives considered**:
- Schema library (Zod/Valibot): more expressive, but a new dependency is not proportional to four lookups.
- Validating in components: violates the API/UI separation in the constitution.
- Trusting declared types: explicitly rejected by the constitution and the feature spec.

### R4. Narrow the `VideoData` contract to exactly what is validated

**Decision**: Change `VideoData` to:

```ts
export type VideoData = {
  items: [] | [{ id: { videoId: string } }, ...unknown[]];
};
```

Remove snippet/title/description/thumbnail declarations.

**Rationale**: The guard validates only the collection and `items[0].id.videoId`. A plain `Array<{ id: { videoId: string } }>` would falsely guarantee every later item has an ID. The tuple union states the exact truth: empty is valid, the first item is known, later items are `unknown` and are never consumed. Consumers destructure the first item (`const [first] = data.items`) to narrow the union without adding validation. The YouTube request URL does not need to change, so wire behavior stays the same.

**Alternatives considered**:
- Item type applied to the whole array: type lies about later entries; rejected.
- Validate all entries: explicitly unnecessary and rejected by the approved decision.
- Keep the broad type with optional metadata: leaves dead fields and a less truthful contract.
- Create a second parallel type: unnecessary duplication.

### R5. Four-way concurrency via loaders and `Promise.all`

**Decision**: Make `getReleasedVideos` start its three lookups before awaiting, and make the page start `getReleasedVideos()` and a new `getCreatorData()` together with `Promise.all`. Convert `CreatorInformation` into a presentational component that receives the validated creator data.

**Rationale**: The page's current top-level `await` and the self-fetching creator component serialize the creator lookup after the videos. `Promise.all` starts all four requests immediately and preserves the layout. Moving the creator fetch into a loader mirrors the existing `getReleasedVideos` pattern, keeps fallback logic out of JSX, and makes page-level isolation testable. Visual output is unchanged. The composition change is limited to three production files: `page.tsx`, `CreatorInformation/index.tsx`, and `ReleasedVideos/index.tsx` (only its loader); the API clients and video type changes are required by the separate timeout and validation decisions. The video card components, layout classes, and fallback copy are untouched, and every component remains a Server Component.

**Why this is the smallest viable path**: because `page.tsx` awaits the video loader before returning JSX, a self-fetching creator component cannot start until that await finishes, regardless of where it appears in the tree. The creator lookup therefore has to be moved to a loader invoked by the page alongside the video loader, and the component has to receive the result. Any alternative that keeps the fetch inside the component either preserves the serialization or adds structural indirection.

**Alternatives considered**:
- Keep the self-fetching creator component and wrap video sections in async wrappers: the page layout separates the featured video and the live/series block, so a single wrapper cannot cover both without restructuring the layout.
- Wrap the whole content area in `Suspense`: adds fallback/streaming behavior that the current page does not use and changes what is rendered before data resolves.
- Pass a promise into `CreatorInformation`: still changes its interface, adds a promise prop, and keeps data access in the view.
- Fetch all four directly in `page.tsx`: duplicates client calls and moves per-lookup fallback logic into the page.
- Await videos, then start creator: rejected; it preserves the serialization this feature removes.

### R6. Pre-request configuration detection

**Decision**: Trim configuration values and throw a safe error before any request when `GIST`, `LATEST_VIDEO`, or `LATEST_SERIE` is missing, empty, or whitespace-only.

**Rationale**: FR-011 requires identifying the failure before the request. This avoids a doomed network call, makes builds deterministic without credentials, and still routes through the existing fallback path. Error messages name the setting but never include its value.

**Alternatives considered**:
- Keep sending `key=undefined` / `undefined.json`: current behavior, but explicitly replaced by the approved decision.
- Branch on configuration in UI components: violates separation and duplicates logic.
- Fail the page/build: violates graceful degradation.

### R7. Safe, consistent error handling

**Decision**: Keep `unstable_rethrow` as the first action in every catch; log a fixed context label plus a safe error message; never log request URLs, environment values, response payloads, or raw causes. API clients throw only safe messages (`timed out`, `responded with <status>`, `request failed`, `returned invalid data`, `missing configuration`).

**Rationale**: The YouTube key is part of the request URL, so logging full errors/URLs can leak it. Existing visitor-facing behavior is neutral fallbacks and must remain so. Safe messages are still useful for diagnosing which integration failed.

**Alternatives considered**:
- Log the full error object: risks leaking a URL or cause chain.
- Silent catches: forbidden by the constitution.
- Expose errors in the UI: changes behavior and can leak details.

### R8. Preserve existing cache and revalidation

**Decision**: Keep `revalidate: false` for the pinned Gist request and `revalidate: 300` for both YouTube requests. Do not add cache tags, bypasses, or new cache infrastructure.

**Rationale**: FR-015 and the approved decision require preserving the current strategy. The timeout helper passes the `next` options through unchanged. Only 200 responses are cached by Next.js; error responses are retried on the next revalidation, which is acceptable.

**Accepted cache consequences**:

- A 200 response with an invalid payload is cached under the existing TTL: indefinitely for the Gist (`revalidate: false`) and for 300 seconds for video. The fallback persists until that entry is replaced.
- A late 200 from a Next-owned background revalidation can be written after the deadline and used by a future render. It cannot change the current result.
- Cache writes and route regeneration bookkeeping are not bounded by the caller deadline.

**Alternatives considered**:
- Bypass cache on validation failure: out of scope and would add cache complexity.
- Add a shorter TTL for failures: not requested and would change refresh behavior.
- Add Redis or another cache: explicitly out of scope.

### R9. Testing with mocked time and network

**Decision**: Test the request helper, API clients, and loaders with mocked `fetch`, Jest fake timers, deferred promises, and mocked API functions at the page level. Await async server components before passing them to React Testing Library.

**Required coverage**:

- Timeout aborts the controller (`signal.aborted` is true).
- A late success or late rejection after timeout is ignored by the current result.
- No unhandled rejection is produced by the abandoned branch.
- The deadline timer is cleared on success, failure, and timeout (`jest.getTimerCount() === 0`).
- All four lookups are called before any deferred promise resolves.
- One lookup timing out or failing does not prevent the other three from starting or completing, and the total lookup phase is bounded by one deadline rather than four.

**Rationale**: Tests must be deterministic and must not depend on real external services (constitution). Fake timers exercise the explicit deadline without waiting five seconds. Deferred promises prove concurrency and isolation. Page-level tests can await the async `Home` component after the creator component becomes presentational, then render the resulting tree. Unhandled-rejection checks catch a common failure mode when racing promises.

**Alternatives considered**:
- Real network calls: forbidden by the constitution and flaky.
- Snapshot-only tests: do not prove fallback or isolation behavior.
- End-to-end browser tests: no existing E2E infrastructure; not proportional to the feature.

### R10. No new dependencies

**Decision**: Use native `fetch`, `AbortController`, `setTimeout`, `Promise.all`, and TypeScript narrowing only.

**Rationale**: The Node.js >= 20.9 baseline provides all required capabilities. The constitution requires a technical justification for every dependency; none is needed here.

## Resolved unknowns

No `NEEDS CLARIFICATION` items remain. The approved decisions resolve timeout ownership, concurrency scope, validation strictness, cache preservation, and configuration handling. Verification of the current contract found no intentionally optional creator field: all five are required strings and all are rendered.

The timeout investigation also resolved the scope question: the 5000 ms constant bounds the application's wait and fallback selection, not origin-request cancellation during Next.js background revalidation or Next.js cache writes. Those residual behaviors are documented in R2 and R8, and the plan treats them as accepted limitations rather than guarantees.
