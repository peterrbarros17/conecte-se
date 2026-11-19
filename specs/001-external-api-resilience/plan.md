# Implementation Plan: External API Resilience

**Branch**: `feature/improve-external-api-resilience` | **Date**: 2026-11-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-external-api-resilience/spec.md`

**Note**: This plan was produced by `/speckit.plan`; it defines the technical approach for the approved specification.

## Summary

Harden the four external lookups used by the home page — creator profile (GitHub Gist), featured video, latest live, and latest series (YouTube Data API) — without changing the rendered interface or the existing cache strategy. The plan adds a finite deadline to how long the application waits for each lookup (initial value: 5000 ms, adjustable in one place), runtime validation of only the fields the UI consumes, pre-request configuration checks, and four-way concurrent execution. Existing fallbacks, routes, visual structure, and the 300-second video revalidation window are preserved. No new dependency is introduced. The deadline governs the current render and fallback selection; it does not claim to cancel all framework-internal background work or bound Next.js cache writes (see "Timeout semantics").

## Technical Context

**Language/Version**: TypeScript 5.x; Node.js >= 20.9 (project `engines` and `.nvmrc`); Next.js 16.4.4; React 19.3.

**Primary Dependencies**: Next.js App Router, React, `next-themes`, `react-icons`; Jest 29 and React Testing Library for tests. No new dependencies.

**Storage**: N/A. Remote GitHub Gist and YouTube Data API; existing Next.js fetch data cache only.

**Testing**: Jest 29 + React Testing Library; colocated `.spec.ts` / `.spec.tsx`; mocked `fetch`; fake timers for timeout tests.

**Target Platform**: Node.js server during build and ISR revalidation; web browsers for the rendered page.

**Project Type**: Single Next.js web application (App Router).

**Performance Goals**: The application's wait for each lookup is bounded by one constant, initially 5000 ms. The four independent lookups start together, so the external-lookup phase that a generation or refresh actually awaits is bounded by the slowest awaited lookup rather than their sum. This bounds the current page render and fallback selection, not Next.js internal origin-request cancellation, a background fetch refresh the render does not await, or cache-write completion. The value is an initial engineering decision without a measured baseline; it is not a latency guarantee. The page remains statically generated with ISR, and time-based revalidation serves stale content immediately.

**Constraints**: Preserve the existing cache configuration (`revalidate: false` for the pinned Gist; `revalidate: 300` for YouTube), routes, markup, fallback copy, and successful-data behavior. Secrets stay server-side. No new runtime dependency. `unstable_rethrow` must run before fallback handling. The timeout must not bypass, lengthen, or shorten the existing cache options. `npm run verify` and `npm run build` must pass.

**Scale/Scope**: One home page, four external lookups, four rendered areas (creator panel, featured video, live, series). No new screens or APIs.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|---|---|---|
| I. Simplicity and Maintenance | Small shared request helper and validation module; no new dependency; no speculative layers | PASS |
| II. Type Safety | `unknown` narrowing with type guards; no `any`; `VideoData` union states exactly what is validated (first item only) | PASS |
| III. Testability | Unit tests cover success, HTTP/network failure, timeout, abort, late result, timer cleanup, invalid payload, config failure, concurrency, isolation, and fallbacks; fetch mocked | PASS |
| IV. Separation of Responsibilities | External access, config checks, and validation stay in `src/api`; shared contracts in `src/types`; loaders/components render; `src/app` only composes | PASS |
| V. Resilience | Finite caller-side deadline, per-lookup fallback, four-way concurrency, control-flow rethrow, no silent catches; background limitations documented | PASS |
| VI. Security | Configuration read server-side; safe error messages; no URL, key, or env value in logs or user output | PASS |
| Technical constraints | Next.js App Router, React, TypeScript, existing architecture, existing cache, no new infrastructure | PASS |

No violations; `Complexity Tracking` is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-external-api-resilience/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── external-integrations.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md             # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── api/
│   ├── externalRequest.ts          # NEW: config check, finite-deadline JSON request
│   ├── externalRequest.spec.ts     # NEW: timeout, abort, late result, timer cleanup
│   ├── validation.ts               # NEW: runtime guards for consumed fields
│   ├── fetchCreatorData.ts         # MODIFIED: config check, timeout, validation
│   ├── fetchVideosData.ts          # MODIFIED: config check, timeout, validation
│   ├── fetchCreatorData.spec.ts    # NEW
│   └── fetchVideosData.spec.ts     # NEW
├── app/
│   ├── page.tsx                    # MODIFIED: concurrent loaders, pass creator data
│   └── page.spec.tsx               # NEW: four-way start, isolation, fallbacks
├── components/
│   ├── CreatorInformation/
│   │   ├── index.tsx               # MODIFIED: getCreatorData loader + presentational component
│   │   └── CreatorInformation.spec.tsx # NEW
│   └── ReleasedVideos/
│       ├── index.tsx               # MODIFIED: concurrent video lookups with per-lookup isolation
│       └── ReleasedVideos.spec.ts  # NEW
└── types/
    └── videoDataType.ts            # MODIFIED: exact validated subset (empty or first entry known)
```

**Structure Decision**: Keep the existing single-project layout and the current `app` / `api` / `components` / `types` separation. New integration plumbing stays in `src/api`; no new service layer or dependency is introduced.

## Design

### 1. Finite request deadline (caller-side)

Add `src/api/externalRequest.ts` with:

- `EXTERNAL_REQUEST_TIMEOUT_MS = 5000` as the initial value of a single adjustable constant.
- `requireConfig(value, label)`: trims the value and throws a safe error when missing, empty, or whitespace-only.
- `fetchJsonWithTimeout(url, init, serviceLabel)`: a single request path that
  - creates an `AbortController` and an explicit `setTimeout` deadline,
  - races the full caller-visible operation (`fetch` + HTTP status check + body parse) against the deadline,
  - aborts the controller when the deadline wins,
  - returns parsed `unknown` data,
  - throws safe errors only (`<service> request timed out`, `<service> responded with <status>`, `<service> request failed`, `<service> returned invalid data`),
  - clears the timer in `finally` on success, failure, and timeout.

#### Timeout semantics

The helper bounds **how long the application waits**. It does not control every operation that may continue inside Next.js. In short: the strategy bounds the caller wait whenever the page awaits a lookup; it bounds the HTTP request only on the non-stale path; it never bounds Next's internal cache update or a background refresh the caller does not await. The three clocks are distinct:

| Clock | What it covers | Guaranteed by this plan | Not guaranteed |
|---|---|---|---|
| Caller wait | Time the page/loader keeps waiting for `fetchJsonWithTimeout`, including `fetch`, the HTTP status check, and body parsing | Bounded by `EXTERNAL_REQUEST_TIMEOUT_MS`; at the deadline the lookup fails and the fallback is selected | — |
| Origin HTTP execution | The actual GitHub Gist / YouTube request and response body | `AbortController.abort()` is invoked and is passed to `fetch`; where Next.js and Node.js honor the signal, the request is canceled | When Next.js performs a stale/background fetch revalidation it deliberately removes the caller's `signal`, so that origin request can outlive the deadline. Even with a signal, HTTP cancellation is cooperative, not instantaneous. |
| Next.js internal cache update | Next.js writing fetch data or the regenerated route to its cache | Nothing; the deadline does not apply to this clock | Cache writes can occur after the page has already selected a fallback. Only HTTP 200 responses are cached. A late 200 can populate the fetch cache and affect a **future** render. |

Execution contexts:

- **Build / first static generation (no cached fetch entry)**: the page awaits the lookup; the caller signal is passed through, so the deadline bounds generation and usually cancels the origin request.
- **Time-based ISR route refresh**: Next.js uses stale-while-revalidate by default, so the visitor receives the stale page immediately and regeneration happens in the background. The deadline bounds any lookup that regeneration actually awaits; it does not bound a fetch-cache refresh Next.js starts on its own, the visitor wait (there is none), or subsequent route/cache write bookkeeping.
- **Stale fetch-cache entry inside a render**: Next.js returns the cached response immediately and starts its own background refresh with the caller signal removed. The helper already completed from cache, so it does not own or bound that background refresh.
- **Foreground fetch revalidation (when Next.js decides it must persist fresh data)**: Next.js also removes the caller signal on a stale revalidation. The helper stops waiting at the deadline, but the origin request and cache write may continue.

**Why this is the compatible strategy**: fully owning HTTP cancellation and cache timing would require bypassing Next's fetch cache and managing requests and storage manually. That would violate FR-015 and add cache infrastructure. The explicit race is the smallest change that guarantees the approved user-visible behavior — bounded waiting, fallback selection, and no late change to the current result — while preserving the existing cache options. The remaining background work is documented below as an accepted limitation.

Late-result rules:

- `Promise.race` attaches handlers to both branches, so a late rejection cannot become an unhandled rejection. Next.js also attaches its own catch to pending revalidations.
- A late success cannot change the current rendered result because the lookup has already resolved to its fallback.
- If Next.js owns the underlying request, a late 200 may still be written to the fetch cache and influence a future render. This is not a change to the result already produced, but it means "late result is ignored" applies to the current render, not to future cache contents.

#### Why 5000 ms (initial value, not a measured optimum)

This project has no measured baseline for these endpoints, so the plan does not invent one.

**Benefits**

- One finite ceiling for all four lookups; because they are concurrent, the awaited external phase of a build or background refresh is roughly one deadline, not four.
- Large enough to absorb ordinary cold DNS/TLS and transient latency, small enough that a fully unresponsive service does not hold a build or background refresh indefinitely.
- A single named constant keeps behavior predictable and makes fake-timer tests deterministic.

**Risks**

- A healthy but slow response taking longer than 5 seconds produces a fallback. The fallback route HTML may then be cached for the existing revalidation window (up to 300 seconds for the home route), so a transient miss can remain visible until the next refresh.
- This is a generation/refresh cost, not a per-visit wait, so the value mainly trades build/refresh duration against tolerance for slow upstreams; without measurements, that trade-off cannot be optimized.
- A single value for both providers may not fit both services if operational data later shows materially different latency profiles.

**Decision**: keep 5000 ms as an initial, adjustable engineering decision. Revisit only with observed build/refresh diagnostics or timeout frequency; do not treat it as a performance guarantee or an SLO.

### 2. Runtime validation

Add `src/api/validation.ts`:

- `isCreatorDataType(value: unknown): value is CreatorDataType`
  - top-level object, `creator` object;
  - `creatorName`, `creatorPlatform`, `creatorLocation`, `creatorPhraseMotivation`, `creatorEmail` are strings with non-whitespace content;
  - no field is optional in the current contract.
- `isVideoData(value: unknown): value is VideoData`
  - top-level object with an `items` array;
  - an empty array is structurally valid and produces the existing "not available" state without being treated as a malformed payload;
  - when non-empty, `items[0].id.videoId` is a string with non-whitespace content;
  - later entries, title, description, and thumbnails are not inspected.

Update `src/types/videoDataType.ts` so the type states exactly what the guard proves:

```ts
export type VideoData = {
  items: [] | [{ id: { videoId: string } }, ...unknown[]];
};
```

This union is intentional: an empty list is valid, the first entry is guaranteed to expose `id.videoId`, and every later entry remains `unknown`. It does **not** claim that all items have a video ID, which the guard does not check. The consumer should read the first entry with destructuring, which narrows the union without adding validation:

```ts
const [first] = data.items;
if (first) {
  latestVideo = first.id.videoId;
}
```

Unused snippet/thumbnail declarations are removed so the validated return type is truthful. The YouTube request URL keeps `part=snippet,id`; no request-shape change is necessary.

### 3. Integration clients

- `fetchCreatorData`: read and trim `GIST` before any request; keep the pinned URL and `revalidate: false`; call `fetchJsonWithTimeout`; validate with `isCreatorDataType`; return validated data.
- `fetchDataVideo` and `fetchDataLive`: read and trim the supplied API key before any request; keep the current URLs and `revalidate: 300`; call `fetchJsonWithTimeout`; validate with `isVideoData`; return validated data.
- Missing configuration throws before `fetch`, so no doomed request is made. Error messages name the missing setting, never its value.

### 4. Concurrent execution and fallbacks

- `getReleasedVideos` creates the three request promises before awaiting and resolves them with `Promise.all`:
  - each lookup is wrapped by a small local resolver that calls `unstable_rethrow` first, then logs a safe message and returns `""` on failure;
  - each resolver reads the first entry with destructuring (`const [first] = data.items`) and uses `first.id.videoId`; the `if (first)` test only narrows the type and does not validate the payload again;
  - one failure or delay cannot prevent the other two lookups from starting or completing.
- `CreatorInformation/index.tsx` gains an exported `getCreatorData` loader:
  - calls `fetchCreatorData`, rethrows control-flow errors first, logs a safe message, and returns the existing `FALLBACK` on failure.
  - the default component becomes presentational and receives the validated creator data as a prop; its markup, labels, and styles are unchanged.
- `src/app/page.tsx` starts both loaders together:
  - `const [videos, creatorData] = await Promise.all([getReleasedVideos(), getCreatorData()])`
  - renders existing sections with the resolved values.
  - This is the minimal composition change needed for four-way concurrency; the visual output is unchanged.

**Why this is the smallest path**: the page currently awaits `getReleasedVideos()` before returning JSX, and `CreatorInformation` fetches inside itself. Therefore the creator lookup cannot start until React reaches the component, which is after the video lookups finish. To start all four together, the creator lookup must move to a loader invoked by the page at the same time as `getReleasedVideos`, and the component must receive the resolved value. That requires exactly three production files: `page.tsx` (start both loaders), `ReleasedVideos/index.tsx` (start its three lookups together), and `CreatorInformation/index.tsx` (loader plus presentational component). The video card components, layout, and fallback copy are untouched.

Alternatives considered and rejected:

| Alternative | Why it is larger or riskier |
|---|---|
| Keep the self-fetching creator component and wrap sections in `Suspense` or async wrappers | Requires restructuring the page layout and introduces streaming/fallback semantics that the current page does not have. |
| Render the async creator component without awaiting, and turn the video areas into self-fetching async components | Moves the existing video JSX into new wrappers or components, changes composition more, and makes the page shell depend on streaming behavior. |
| Pass a promise into `CreatorInformation` and keep it self-fetching | Still changes the component's interface; adds a promise prop and keeps data access inside the view. |
| Fetch all four directly in `page.tsx` | Duplicates client calls and moves per-lookup fallback logic into the page, violating separation of responsibilities. |

All components remain React Server Components; no client boundary is introduced. `CreatorInformation` becomes synchronous but remains server-rendered, and its markup, classes, and fallback values are unchanged.

### 5. Error handling and security

- Every existing catch block keeps `unstable_rethrow(error)` as its first statement.
- Logs contain a fixed context label plus a safe error message; they never contain the request URL, API key, `GIST` value, or response payload.
- HTTP status is the only response detail surfaced in a safe error. Validation errors never echo incoming data.
- Visitors continue to see only the existing neutral fallbacks.

### 6. Cache and compatibility

- No cache option is added, removed, or retimed. `revalidate: false` remains on the pinned Gist request; `revalidate: 300` remains on both YouTube requests.
- No route, metadata, layout, style, or fallback copy changes.
- The only component-interface change is `CreatorInformation` receiving data instead of fetching internally; all rendering and exported UI behavior stay equivalent. The `VideoData` type is narrowed to the exact validated subset.
- A 200 response with a well-formed envelope but an invalid payload is still cached under the existing policy: the Gist response indefinitely (`revalidate: false`) and video responses for 300 seconds. The fallback therefore remains until the cache entry is replaced; this is preserved existing behavior, not introduced by the feature.
- A non-200 response is not cached, and a failure before any response is available does not enter the fetch cache. A timeout is a caller-side decision, though: when Next.js still owns the underlying request, a late 200 can be written to the fetch cache and used by a future render, even though the current render already selected the fallback.

## Guarantees and limitations

### Guaranteed by this design

1. The application stops waiting for each lookup at `EXTERNAL_REQUEST_TIMEOUT_MS`; the loader then selects the existing fallback.
2. A result arriving after the deadline cannot change the content already produced for the current generation or refresh.
3. The four lookups start before any of them is awaited.
4. One lookup's failure, timeout, or delay cannot prevent the other lookups from starting or completing.
5. The helper clears its timer on success, failure, and timeout; the abandoned branch is handled by `Promise.race`, so it does not create an unhandled rejection.

### Not guaranteed by this design

1. **Origin cancellation during Next.js background/stale revalidation**: Next.js removes the caller `signal` when it revalidates a stale fetch entry, so the Gist/YouTube request may continue after the deadline. The fallback still applies to the current render.
2. **Next.js cache writes within the deadline**: fetch-cache writes and route regeneration bookkeeping use Next's own post-render pipeline and are not bounded by this constant.
3. **Late responses never entering the cache**: a late 200 may be cached by Next.js and affect a future render, even though it cannot change the current result.
4. **Total background regeneration wall-clock**: the deadline bounds the lookups the render awaits, not all internal work Next.js performs afterward.
5. **5000 ms being an optimal or measured value**: it is an initial, adjustable engineering decision with no performance baseline.

These limitations are accepted because eliminating them would require bypassing Next's fetch cache or introducing a custom request/cache layer, both of which violate the preserved cache strategy and the project's simplicity constraint.

## Testing Strategy

| Area | Tests |
|---|---|
| Request helper (`externalRequest.spec.ts`) | timeout triggers `AbortController` (`signal.aborted` is true); late `fetch` success after timeout is ignored; late rejection after timeout does not produce an unhandled rejection; timer cleared on success; timer cleared on failure and timeout; HTTP error and body-parse failure paths; safe error text excludes URL and configured value |
| Creator client | valid response; HTTP error; network failure; timeout; invalid/partial/whitespace payloads; missing `GIST` makes no request; error text excludes the configured value |
| Video clients | valid response; HTTP error; network failure; timeout; non-array `items`; missing/non-text/empty/whitespace first ID; empty list accepted; later invalid entries do not invalidate; metadata ignored; missing key makes no request |
| Video loader | all three succeed; one fails while others succeed; all fail; lookups start before any resolves; one timeout does not delay the other two beyond one deadline |
| Creator loader | success returns data; failure returns the complete fallback; control-flow errors are rethrown |
| Creator component | renders provided data; markup and contact link unchanged |
| Home composition | all four lookups start before any resolves; creator failure does not block videos; video failures do not block creator; a single timeout leaves only its section in fallback; all failures render full fallbacks; total lookup phase is bounded by one deadline rather than four |

Timeout tests use Jest fake timers with a never-settling `fetch` or `res.json()` mock and advance by `EXTERNAL_REQUEST_TIMEOUT_MS`. Required assertions:

- **Abort fired**: capture the `signal` passed to the mocked `fetch` and assert `signal.aborted === true` after the deadline.
- **Late result ignored**: keep the promise's resolver, advance past the deadline, resolve or reject it afterward, flush microtasks, and assert the loader still returns the fallback.
- **No unhandled rejection**: install a `process.on("unhandledRejection")` probe around the test (and remove it afterward); after a late rejection and microtask flush, assert it was never called.
- **Timers cleared**: after a successful resolution and after a failure/timeout, assert `jest.getTimerCount() === 0`.
- **Four started before any finished**: use four deferred promises, invoke the page/loaders, assert each mocked client has been called before resolving any of them, then resolve and await.
- **Isolation**: make one deferred reject or reach its timeout while the other three resolve; assert only the affected section falls back and the other results are intact.

No test performs real network access. `npm run build` is required because server-side integration and page composition change.

Verification commands:

```bash
npm test
npm run verify
npm run build
```

## Risks and Mitigations

- **Next.js drops the caller signal during stale/background revalidation**: the explicit race still guarantees the application stops waiting at the deadline and selects the fallback. The origin request may continue; this is documented and accepted because bypassing the fetch cache would violate FR-015.
- **Next.js cache writes outlive the deadline**: cache updates are Next's responsibility and are not bounded by the helper. The current render is unaffected; the limitation is listed explicitly rather than implied away.
- **Late request settling after timeout**: `Promise.race` attaches handlers to both branches; Next attaches its own catch to pending revalidations. The losing promise cannot become an unhandled rejection or mutate the current rendered output, though Next may still cache a late 200 for a future render.
- **Timer leakage in tests or build**: the helper clears its timer in `finally`; tests assert `jest.getTimerCount() === 0` on both success and failure.
- **Five seconds is unmeasured**: presented as an initial, adjustable constant. The constant is centralized; adjust only with observed timeout/build diagnostics, not speculation.
- **Over-validation**: guards inspect only consumed fields; video metadata and later entries are explicitly excluded, and the type union states that limitation.
- **Interface change to `CreatorInformation`**: required for four-way concurrency; rendered output and fallback behavior remain identical, and page-level tests cover isolation.
- **Invalid 200 response stays cached**: preserved by decision. Gist `revalidate: false` can keep an invalid 200 indefinitely and video `revalidate: 300` for its window; no cache bypass is introduced.

## Post-Design Constitution Re-check

All gates remain PASS after design. The added helper and guards are justified by four call sites and the runtime-validation requirement. No new dependency, infrastructure, `any`, or type suppression is introduced. Fallback, cache, and control-flow behavior remain compatible.

## Complexity Tracking

No constitution violations. No exceptions require justification.
