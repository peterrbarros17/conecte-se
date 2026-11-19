---

description: "Task list for the External API Resilience feature"
---

# Tasks: External API Resilience

**Input**: Design documents from `/specs/001-external-api-resilience/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Included because the feature specification explicitly requires test coverage (spec.md "Assumptions") and Constitution Principle III requires automated tests for new behavior and integrations. Tests are written first and must FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/` at repository root; colocated tests use `.spec.ts` / `.spec.tsx`
- Stack (plan.md): TypeScript 5.x strict, Node.js >= 20.9, Next.js 16.4.4 App Router, React 19, Jest 29 + React Testing Library
- Source layout: `src/app/` (composition), `src/api/` (external access + guards), `src/components/` (UI), `src/types/` (shared contracts)
- No new dependencies or infrastructure (research.md R10, Constitution Principles I and IV)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the existing toolchain and configuration already satisfy the plan; no project initialization or new dependency is required.

- [ ] T001 Verify the existing single-project toolchain in `package.json`, `tsconfig.json`, `jest.config.ts`, and `jest.setup.ts`: Next.js 16 App Router, TypeScript `strict: true`, `@/*` path alias to `./src/*`, and Jest 29 with colocated `.spec.ts`/`.spec.tsx` tests; add nothing (no new dependency per research.md R10)
- [ ] T002 [P] Verify `.env.example` documents only the setting names `LATEST_VIDEO`, `LATEST_SERIE`, and `GIST` with empty values (no secrets), and that no new configuration variable is needed per contracts/external-integrations.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared request and validation infrastructure used by all four external lookups and all four user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create `src/api/externalRequest.ts` exporting `EXTERNAL_REQUEST_TIMEOUT_MS = 5000`, `requireConfig(value, label)` (trims; throws a safe error naming the setting when absent, empty, or whitespace-only), and `fetchJsonWithTimeout(url, init, serviceLabel)`: create an `AbortController`, pass its `signal` to `fetch`, race the full caller-visible operation (`fetch` + `res.ok` status check + body parse) against an explicit `setTimeout`, call `abort()` when the deadline wins, pass `next.revalidate` options through unchanged, clear the timer in `finally` on success/failure/timeout, and throw only safe messages (`"<service> request timed out"`, `"<service> responded with <status>"`, `"<service> request failed"`, `"<service> returned invalid data"`) that never include URLs, keys, env values, or payloads
- [ ] T004 [P] Create `src/api/validation.ts` exporting `isCreatorDataType(value: unknown): value is CreatorDataType` and `isVideoData(value: unknown): value is VideoData`; use explicit `unknown` narrowing only (no `as`, no `any`): creator requires a top-level object with a `creator` object whose `creatorName`, `creatorPlatform`, `creatorLocation`, `creatorPhraseMotivation`, and `creatorEmail` are "strings with non-whitespace content" and "No field is optional in the current contract" (all-or-nothing); video requires "an `items` array", accepts "an empty array ... as structurally valid", and when non-empty requires "`items[0].id.videoId` is a string with non-whitespace content" while "later entries, title, description, and thumbnails are not inspected"
- [ ] T005 [P] Rewrite `src/types/videoDataType.ts` so `VideoData` is exactly `items: [] | [{ id: { videoId: string } }, ...unknown[]]`, removing the unused `snippet`/title/description/thumbnails declarations, so the type states precisely what `isVideoData` proves (empty list valid, first entry's `videoId` known, later entries `unknown`)
- [ ] T006 [P] Create `src/api/externalRequest.spec.ts` with mocked `fetch` covering `requireConfig` missing/empty/whitespace behavior, successful JSON parse, HTTP non-OK status, network rejection, body-parse failure, timer cleared on success and failure (`jest.getTimerCount() === 0`), and assertions that error text contains no URL, key, env value, or payload (timeout-specific cases are added in T018)
- [ ] T007 [P] Create `src/api/validation.spec.ts` covering the guard matrix: creator valid object, each of the five fields missing/non-text/empty/whitespace, non-object top level; video valid first ID, empty array accepted, missing `items`, non-array `items`, missing/non-text/empty/whitespace first ID, later invalid entries ignored, and absent/malformed metadata ignored

**Checkpoint**: Shared deadline, configuration check, guards, and validated type are ready; user story implementation can now begin.

---

## Phase 3: User Story 1 - Section-level fallback when an external service fails (Priority: P1) 🎯 MVP

**Goal**: Any failure of one integration - HTTP error, network error, missing/empty configuration, invalid payload, or timeout - selects that section's existing fallback while every unrelated section still renders real content.

**Independent Test**: Simulate each external failure mode in isolation with mocked `fetch`/clients, load the page, and assert only the affected section shows its fallback (default creator profile or "not available" card) while all other sections display real content; with all integrations healthy, output matches the pre-change page.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation.**

- [ ] T008 [P] [US1] Create `src/api/fetchCreatorData.spec.ts`: valid creator response, HTTP error, network rejection, missing/empty/whitespace `GIST` makes no `fetch` call, invalid payload throws a safe error, and error text excludes the configured value and request URL
- [ ] T009 [P] [US1] Create `src/api/fetchVideosData.spec.ts`: valid video response, HTTP error, network rejection, missing/empty/whitespace key makes no `fetch` call for both `fetchDataVideo` and `fetchDataLive`, and invalid payload throws a safe error
- [ ] T010 [P] [US1] Create `src/components/CreatorInformation/CreatorInformation.spec.tsx`: rendered component displays the supplied `creator` fields and unchanged `mailto:` contact link; `getCreatorData` returns the complete `FALLBACK` on client failure and rethrows a control-flow signal before fallback handling
- [ ] T011 [P] [US1] Create `src/components/ReleasedVideos/ReleasedVideos.spec.ts`: `getReleasedVideos` returns IDs for successful lookups and `""` for each failing lookup, returns three empty IDs when all fail, and rethrows control-flow signals before fallback handling
- [ ] T012 [P] [US1] Create `src/app/page.spec.tsx` with mocked loader modules: creator failure leaves featured video, live, series, social links, and support intact; video failures leave the real creator profile intact; every integration failing still renders the full page with all fallbacks

### Implementation for User Story 1

- [ ] T013 [P] [US1] Rewrite `src/api/fetchCreatorData.ts` to call `requireConfig(process.env.GIST, "GIST")` before any request, keep the pinned commit URL and `next: { revalidate: false }`, route the request through `fetchJsonWithTimeout` with a "GitHub Gist" service label, validate the returned `unknown` with `isCreatorDataType`, and return the validated `CreatorDataType`
- [ ] T014 [P] [US1] Rewrite both `fetchDataVideo` and `fetchDataLive` in `src/api/fetchVideosData.ts` to call `requireConfig(apiKey, "LATEST_VIDEO")` before any request, keep the existing URLs, query parameters, and `next: { revalidate: 300 }`, route requests through `fetchJsonWithTimeout` with a "YouTube API" service label, validate with `isVideoData`, and return the validated subset
- [ ] T015 [US1] Refactor `src/components/CreatorInformation/index.tsx`: add exported async `getCreatorData(): Promise<CreatorDataType>` that calls `fetchCreatorData`, calls `unstable_rethrow(error)` first in its catch, logs a fixed safe label plus safe message, and returns the existing `FALLBACK`; make the default export a synchronous presentational component accepting `{ creatorData }: { creatorData: CreatorDataType }` with `FALLBACK`, markup, classes, labels, and email link unchanged (depends on T013)
- [ ] T016 [US1] Refactor `getReleasedVideos` in `src/components/ReleasedVideos/index.tsx`: for each of the three lookups use a local resolver that calls `unstable_rethrow(error)` first, logs one fixed safe message per failed lookup, and returns `""`; read the first entry by destructuring (`const [first] = data.items; if (first) { ... = first.id.videoId; }`) without re-validating; keep channel IDs and card components untouched (concurrency is added in T030)
- [ ] T017 [US1] Update `src/app/page.tsx` to import and call `getCreatorData()` and pass the result as `<CreatorInformation creatorData={creatorData} />`; keep all markup, sections, fallback copy, and social/support components unchanged (depends on T015)

**Checkpoint**: User Story 1 is fully functional and independently testable - every single-integration failure produces only its section's fallback.

---

## Phase 4: User Story 2 - External waits are bounded (Priority: P2)

**Goal**: Each lookup has a finite 5000 ms caller-side deadline; at expiry the section fallback is selected and a late success or rejection cannot change the current result, create an unhandled rejection, or leave a timer running.

**Independent Test**: At the helper layer in `src/api/externalRequest.spec.ts`, mock a never-settling `fetch`, advance Jest fake timers by `EXTERNAL_REQUEST_TIMEOUT_MS`, and assert `signal.aborted === true`, a safe timeout error, late success/rejection ignored, and `jest.getTimerCount() === 0`. At the client and loader layers, simulate rejections (including a safe timeout error) and assert error propagation and per-section isolation - never wait for a loader-owned deadline.

### Tests for User Story 2 ⚠️

- [ ] T018 [P] [US2] Extend `src/api/externalRequest.spec.ts` with fake-timer deadline cases: abort fired at 5000 ms with the signal captured from mocked `fetch`, late success ignored, late rejection ignored without becoming an unhandled rejection, and timer cleared on timeout (`jest.getTimerCount() === 0`). Keep the losing deferred's rejection locally observed by the test (attach the test's own `.catch` to record it) and treat Jest's built-in unhandled-rejection reporting as the primary failure signal. If a `process.on("unhandledRejection")` probe is used, note that it is process-global and may be delivered asynchronously or unreliably under Jest/jsdom: use a named handler that only records events, flush microtasks before asserting the recorded count is zero, and always remove that exact handler in `afterEach` and in a `try/finally` inside the test - never use `process.removeAllListeners()` and never let the probe affect other tests
- [ ] T019 [P] [US2] Extend `src/api/fetchCreatorData.spec.ts`: mock `fetchJsonWithTimeout` from `src/api/externalRequest.ts` to reject with a safe timeout error and assert `fetchCreatorData` propagates the error without issuing another request and without exposing URLs or configured values; this verifies propagation only - abort and timer assertions belong to T018
- [ ] T020 [P] [US2] Extend `src/api/fetchVideosData.spec.ts`: mock `fetchJsonWithTimeout` to reject with a safe timeout error and assert both `fetchDataVideo` and `fetchDataLive` propagate it without extra requests or secret leakage; no abort/timer assertions here (T018 owns them)
- [ ] T021 [P] [US2] Extend `src/components/CreatorInformation/CreatorInformation.spec.tsx`: mock `fetchCreatorData` to reject with a safe error (including a simulated timeout error) and assert `getCreatorData` returns the complete `FALLBACK` and rethrows control-flow signals; do not leave a deferred promise pending or expect the loader to own a deadline
- [ ] T022 [P] [US2] Extend `src/components/ReleasedVideos/ReleasedVideos.spec.ts`: mock one video client to reject (including a simulated timeout error) while the other two resolve, and assert only that lookup's ID is `""` and the other IDs remain intact; do not leave a deferred promise pending or assume a loader-level deadline

### Implementation for User Story 2

- [ ] T023 [US2] Document the caller-side timeout scope in `src/api/externalRequest.ts` with a concise comment: the 5000 ms value is an initial adjustable engineering decision, it bounds application waiting only, Next.js may drop the signal during stale/background revalidation, and cache writes may finish later (no behavior change, no new dependency)

**Checkpoint**: Bounded waits are verified end to end; late results cannot alter the current generation or refresh.

---

## Phase 5: User Story 3 - Malformed external data is rejected instead of displayed (Priority: P3)

**Goal**: Runtime guards reject non-data bodies and payloads missing displayed fields; affected sections fall back with no blank creator fields and no broken video iframe, and diagnostics contain no secrets or payload echoes.

**Independent Test**: Feed the malformed-payload matrix to each client and to the page; assert fallback content, no blank profile fields, no iframe for an unusable first ID, and safe log/error text.

### Tests for User Story 3 ⚠️

- [ ] T024 [P] [US3] Extend `src/api/fetchCreatorData.spec.ts` with the malformed matrix: top level not an object, `creator` not an object, and each of `creatorName`, `creatorPlatform`, `creatorLocation`, `creatorPhraseMotivation`, `creatorEmail` absent, `null`, numeric, empty, and whitespace-only; assert every case throws a safe error with no payload echo, while a valid payload still resolves
- [ ] T025 [P] [US3] Extend `src/api/fetchVideosData.spec.ts` with the video matrix: `items` absent/non-array; first entry without `id` or `videoId`; first `videoId` empty, whitespace-only, or non-text; empty array accepted; later invalid entries and absent/malformed `snippet`, title, description, and thumbnails ignored
- [ ] T026 [US3] Extend `src/app/page.spec.tsx`: with malformed creator data assert all five default `FALLBACK` fields are rendered (no blank fields); with a malformed featured payload assert the "Vídeo não disponível" empty card is present and no `iframe` is rendered, while unrelated sections still show real content

### Implementation for User Story 3

- [ ] T027 [US3] Harden catch-block diagnostics in `src/components/CreatorInformation/index.tsx` and `src/components/ReleasedVideos/index.tsx` so each log uses only a fixed context label and a safe error message, never the request URL, API key, `GIST` value, response payload, or raw error cause, while keeping `unstable_rethrow(error)` as the first statement and visitor-facing fallbacks unchanged

**Checkpoint**: All malformed-payload scenarios fall back safely with no page-level failure, blank field, or broken frame.

---

## Phase 6: User Story 4 - Independent requests run concurrently (Priority: P4)

**Goal**: Creator, featured video, live, and series lookups all start before any is awaited; combined with the helper's deadline (verified in T018), the awaited external phase is bounded by the slowest lookup, and a failure in one lookup does not delay the others.

**Independent Test**: Install deferred promises at the client boundary, invoke the page/loaders without awaiting first, assert all mocked clients were called before any deferred resolves, then settle every deferred (one with a safe rejection for the isolation case) and assert the resulting IDs/sections. No test leaves a promise pending or relies on a loader-level timeout.

### Tests for User Story 4 ⚠️

- [ ] T028 [P] [US4] Extend `src/app/page.spec.tsx` with the four-deferred start-order test: mock `fetchCreatorData`, `fetchDataVideo`, and `fetchDataLive` with deferred promises, call `Home()` without awaiting it first, assert all four client mocks were called before resolving any deferred, then resolve all four, await the returned element, and assert real content appears in all four sections; do not use timers or leave a deferred pending
- [ ] T029 [P] [US4] Extend `src/components/ReleasedVideos/ReleasedVideos.spec.ts` with the start-order/isolation test: mock the three video clients with deferred promises, call `getReleasedVideos()` without awaiting it first, assert all three mocks were called before any deferred settles, then resolve two with valid data and reject one with a safe error; await and assert only the rejected lookup's ID is `""` and the other two are intact; every deferred must settle and no deadline is assumed

### Implementation for User Story 4

- [ ] T030 [US4] Refactor `getReleasedVideos` in `src/components/ReleasedVideos/index.tsx` to create all three resolver promises before awaiting any of them and resolve them with `Promise.all`, preserving the per-lookup `unstable_rethrow`, safe logging, `""` fallbacks, and destructuring from T016
- [ ] T031 [US4] Refactor `src/app/page.tsx` to start both loaders together with `const [videos, creatorData] = await Promise.all([getReleasedVideos(), getCreatorData()])` and render the existing sections from those values; the JSX, layout, and fallback copy must remain identical

**Checkpoint**: All four user stories are independently functional; four-way concurrency is in place without changing rendered output.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification against the Constitution, cache compatibility, and the quickstart scenarios.

- [ ] T032 [P] Audit `src/api/` and `src/components/` for secret, request-URL, or payload leakage in `console.error` and thrown errors; confirm no secret uses a `NEXT_PUBLIC_` prefix and no env value or API key appears in logs, tests, or source
- [ ] T033 [P] Verify cache options are unchanged: `next: { revalidate: false }` remains on the pinned Gist request in `src/api/fetchCreatorData.ts` and `next: { revalidate: 300 }` remains on both YouTube requests in `src/api/fetchVideosData.ts`; no cache tags, bypasses, or new storage introduced (FR-015)
- [ ] T034 [P] Verify type safety in `src/types/videoDataType.ts`, `src/types/creatorDataType.ts`, and all new `src/api/*.ts` files: no `any`, no `@ts-ignore`/`@ts-expect-error`, no unused exports, and no type assertion replacing runtime validation
- [ ] T035 Run `npm run verify` (lint, typecheck, test) from the repository root using the scripts in `package.json` and fix any failures until all three commands pass
- [ ] T036 Run `npm run build` from the repository root with the three settings treated as absent in an isolated command environment, without modifying, emptying, renaming, or deleting the user's `.env.local` or `.env.example`: use `env GIST= LATEST_VIDEO= LATEST_SERIE= npm run build` so Next's env loader (which does not override variables already present in `process.env`) ignores any local file values; do not use `env -u`, which would let `.env.local` supply them. Confirm the build of `src/app/page.tsx` succeeds with the default creator profile and the three "not available" labels, with no unhandled rejection or leaked timer, and verify the local env files were left unchanged
- [ ] T037 [P] Validate the quickstart.md scenario matrix (scenarios 1-9) manually when valid environment values are available; otherwise record which scenarios were deferred and why

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup; BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational completion
  - US1 (P1) establishes the clients, loaders, and page composition the later stories exercise
  - US2 (P2) and US3 (P3) can run in parallel with each other after US1 (they add focused timeout and malformed-payload tests to files introduced in US1 and foundational)
  - US4 (P4) depends on US1's loaders and page composition; its concurrency refactor should land after US2/US3 tests so the final start-order and rejection-isolation assertions cover the completed behavior
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2); no dependencies on other stories. MVP increment.
- **User Story 2 (P2)**: Depends on Foundational (helper exists) and US1 (clients/loaders/page exist); independently testable via fake timers at the helper layer and mocked rejections at client/loader layers
- **User Story 3 (P3)**: Depends on US1 (clients/loaders/page exist) and Foundational guards; independently testable via the malformed-payload matrix
- **User Story 4 (P4)**: Depends on US1; independently testable via deferred start-order assertions and rejection-driven isolation; final ordering avoids rewriting code while US2/US3 tests are authored

### Within Each User Story

- Write the tests in the story's "Tests" subsection FIRST and confirm they FAIL before implementation
- Foundational helpers and guards before clients; clients before loaders; loaders before page composition
- Safe logging and `unstable_rethrow` first in every catch before any fallback
- Story checkpoint must pass before moving to the next priority

### Parallel Opportunities

- T002 can run alongside T001
- T004, T005, T006, and T007 can run in parallel after Setup (different files; T003's helper tests can be authored first)
- T013 and T014 (different API client files), and all US1 test files T008, T009, T010, T011, T012, can be authored in parallel
- US2 and US3 test tasks can be split between two developers after US1
- T032, T033, T034, and T037 can run in parallel during Polish

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests together first (each must FAIL before implementation):
Task: "Create src/api/fetchCreatorData.spec.ts (T008)"
Task: "Create src/api/fetchVideosData.spec.ts (T009)"
Task: "Create src/components/CreatorInformation/CreatorInformation.spec.tsx (T010)"
Task: "Create src/components/ReleasedVideos/ReleasedVideos.spec.ts (T011)"
Task: "Create src/app/page.spec.tsx (T012)"

# Then implement the two independent API clients in parallel:
Task: "Rewrite src/api/fetchCreatorData.ts (T013)"
Task: "Rewrite src/api/fetchVideosData.ts (T014)"

# Then sequentially: T015 -> T016 -> T017, then re-run T008-T012.
```

## Parallel Example: User Story 2

```bash
# Helper owns the deadline; clients propagate errors; loaders map rejections to fallbacks:
Task: "Extend src/api/externalRequest.spec.ts (T018)"
Task: "Extend src/api/fetchCreatorData.spec.ts (T019)"
Task: "Extend src/api/fetchVideosData.spec.ts (T020)"
Task: "Extend src/components/CreatorInformation/CreatorInformation.spec.tsx (T021)"
Task: "Extend src/components/ReleasedVideos/ReleasedVideos.spec.ts (T022)"

# Then apply the timeout-scope comment in src/api/externalRequest.ts (T023).
```

## Parallel Example: User Story 3

```bash
# Malformed-payload matrices at the client layer are independent:
Task: "Extend src/api/fetchCreatorData.spec.ts (T024)"
Task: "Extend src/api/fetchVideosData.spec.ts (T025)"

# Then the page-level fallback assertions (T026) and safe-logging hardening (T027).
```

## Parallel Example: User Story 4

```bash
# Deferred start-order assertions target different test files (no fake timers, no pending promises):
Task: "Extend src/app/page.spec.tsx (T028)"
Task: "Extend src/components/ReleasedVideos/ReleasedVideos.spec.ts (T029)"

# Then the two implementation edits in sequence:
Task: "Promise.all in src/components/ReleasedVideos/index.tsx (T030)"
Task: "Promise.all in src/app/page.tsx (T031)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verify toolchain and config names)
2. Complete Phase 2: Foundational (helper, guards, narrowed type, their tests) - CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (clients, loaders, page composition, fallbacks)
4. **STOP and VALIDATE**: Run T008-T017; confirm every single-integration failure isolates to its section
5. Deploy/demo if ready - the page is resilient without concurrency tuning

### Incremental Delivery

1. Setup + Foundational -> shared request/validation foundation ready
2. Add User Story 1 -> per-section fallbacks -> test independently -> deploy/demo (MVP)
3. Add User Story 2 -> bounded waits and late-result safety -> test independently -> deploy/demo
4. Add User Story 3 -> malformed payload rejection -> test independently -> deploy/demo
5. Add User Story 4 -> four-way concurrency -> test independently -> deploy/demo
6. Polish -> verification gates and quickstart matrix; each story adds value without breaking earlier ones

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational and US1 are done:
   - Developer A: User Story 2 (timeout tests and semantics)
   - Developer B: User Story 3 (malformed-payload tests and safe logging)
   - Developer C: User Story 4 (concurrency refactor and tests) after A/B merge their test files
3. Stories complete and integrate independently; no story changes another story's fallback or cache behavior

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps each task to its spec.md user story for traceability; Setup, Foundational, and Polish tasks have no story label
- The deadline bounds application waiting and fallback selection only; Next.js origin cancellation during stale/background revalidation and cache writes are documented limitations (plan.md "Timeout semantics", research.md R2/R8)
- Cache options are preserved exactly: `revalidate: false` for the pinned Gist, `revalidate: 300` for both YouTube requests
- No new dependency, no infrastructure, no `any`, and no secret or payload value in logs or UI (Constitution Principles I, II, V, VI)
- Layer ownership: `fetchJsonWithTimeout` owns the deadline, abort, late-result handling, and timer cleanup; clients propagate safe errors; loaders map client rejections to fallbacks; concurrency tests only prove start order and isolation
- Every test task can be authored before its corresponding implementation because it targets an existing module boundary and mocks the dependency; tests that reference a not-yet-created module are expected to FAIL until that task lands
- Verify tests fail before implementing; commit after each task or logical group; stop at each story checkpoint to validate independently
