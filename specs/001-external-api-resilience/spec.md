# Feature Specification: External API Resilience

**Feature Branch**: `feature/improve-external-api-resilience`

**Created**: 2026-11-15

**Status**: Draft (revised 2026-11-18 with approved investigation decisions)

**Input**: User description: "Improve the reliability and resilience of external API integrations (GitHub Gist creator information and YouTube Data API video information) while preserving current application behavior and user experience." Revised after auditing the existing integration, fallback, and rendering behavior, then updated to incorporate approved decisions on timeout definition, concurrency, validation scope, cache preservation, and configuration handling.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Section-level fallback when an external service fails (Priority: P1)

A visitor opens the Conecte-se home page while one external service is failing with an error, is unreachable, has missing or empty configuration, returns an invalid payload, or does not respond. The sections that depend on that service show their existing fallback, and every section that does not depend on it renders its real content.

**Why this priority**: The application already isolates request errors per section, but recovery is incomplete for hangs, partially malformed payloads, and configuration problems detected late. Closing those gaps is the core user-facing guarantee of this feature.

**Independent Test**: Simulate each external failure mode in isolation, load the page, and verify that only the affected section changes to its fallback while all other sections display real content.

**Acceptance Scenarios**:

1. **Given** the creator profile source fails in any way (HTTP error, network error, missing or empty configuration, invalid payload, or timeout) and the video sources are healthy, **When** the visitor opens the home page, **Then** the default creator profile is displayed and the featured video, live, and series sections show their real content.
2. **Given** one video lookup fails and the other two succeed, **When** the visitor opens the home page, **Then** only the affected video section shows its "not available" state and the other sections render normally.
3. **Given** all video lookups fail and the creator profile source is healthy, **When** the visitor opens the home page, **Then** the real creator profile is displayed and the three video sections show their "not available" states.
4. **Given** every external integration fails simultaneously, **When** the visitor opens the home page, **Then** the full page still renders with the default creator profile, all "not available" video states, social links, and support section.
5. **Given** every external integration is healthy, **When** the visitor opens the home page, **Then** the same content and visual structure as before this change are displayed.

---

### User Story 2 - External waits are bounded (Priority: P2)

When external content is generated or refreshed, a non-responsive service cannot keep the application waiting indefinitely. The application stops waiting at a finite, defined limit, its fallback is used, and any response that arrives later is ignored for the current result.

**Why this priority**: Without a defined limit, a single unresponsive service can block content generation or refresh and prevent otherwise available information from being shown.

**Independent Test**: Simulate a service that never responds and verify that the application stops waiting at the configured limit and finishes with the expected fallback; verify that a response arriving later does not change the result already produced for that generation or refresh.

**Acceptance Scenarios**:

1. **Given** the creator profile source never responds, **When** content is generated or refreshed, **Then** the creator section uses the default profile once the limit is reached and does not wait indefinitely.
2. **Given** a video source never responds, **When** content is generated or refreshed, **Then** that video section uses its "not available" state once the limit is reached while the other sections complete normally.
3. **Given** all external sources never respond, **When** content is generated or refreshed, **Then** all sections complete with their fallbacks within their individual limits.
4. **Given** a response arrives after the application has stopped waiting, **When** the fallback has already been selected, **Then** the late response causes no error, no duplicate content, and no visible change to the result already produced.

---

### User Story 3 - Malformed external data is rejected instead of displayed (Priority: P3)

A visitor opens the page while an external service returns an unexpected payload: a non-data body, missing displayed fields, or fields of the wrong type. The application does not crash or render blank fields or broken video frames; the affected section shows its fallback.

**Why this priority**: The current guard only checks the creator name and the presence of video list entries. Partially malformed data can therefore render blank profile fields or an unusable embed. Explicit validation of the data actually displayed is required.

**Independent Test**: Feed a matrix of malformed payloads to each integration and verify that each affected section falls back and that no page-level or section-level failure occurs.

**Acceptance Scenarios**:

1. **Given** the creator payload lacks any displayed field or provides a non-text value, **When** the visitor opens the home page, **Then** the default creator profile is displayed instead of blank or broken fields.
2. **Given** the creator payload contains only a usable name but lacks the platform, location, motivational phrase, or email, **When** the visitor opens the home page, **Then** the default creator profile is displayed.
3. **Given** a video payload has no usable list of videos, **When** the visitor opens the home page, **Then** the corresponding section shows its "not available" state.
4. **Given** a video payload has a non-empty list whose first entry lacks a non-empty text video identifier or provides a non-text identifier, **When** the visitor opens the home page, **Then** that section shows its "not available" state and no broken embed is rendered.
5. **Given** a service responds with a non-data body such as an error page or invalid data format, **When** the visitor opens the home page, **Then** the response is treated as a failure and the fallback is displayed.
6. **Given** a video payload provides a usable video identifier but omits descriptive fields that the interface does not display, **When** the visitor opens the home page, **Then** the video still renders as it does today.
7. **Given** an invalid payload is rejected, **When** the failure is recorded for diagnosis, **Then** the record contains no credentials, secret values, or unnecessary internal details.

---

### User Story 4 - Independent requests run concurrently (Priority: P4)

When external content is generated or refreshed, the four independent lookups — creator profile, featured video, live, and series — run at the same time. The total wait is determined by the slowest lookup rather than by the sum of all lookups, and a failure or delay in one lookup does not prevent the others.

**Why this priority**: The current implementation runs the external lookups sequentially, so one slow service delays the others beyond its own duration. Running them concurrently removes this artificial coupling and improves content readiness.

**Independent Test**: Simulate multiple lookups with known equal delays and verify that total wait reflects concurrent execution rather than sequential accumulation.

**Acceptance Scenarios**:

1. **Given** the creator profile, featured video, live, and series lookups all respond successfully, **When** content is generated or refreshed, **Then** the four lookups are executed concurrently and total wait is close to the slowest lookup rather than the sum of the four.
2. **Given** one lookup is slow or fails, **When** content is generated or refreshed, **Then** it delays only its own section beyond its limit and does not add its full duration to unrelated lookups.
3. **Given** the main channel shares configuration across two video lookups, **When** that shared configuration is missing or empty, **Then** both affected sections fall back independently without preventing the creator lookup or the series lookup.

---

### Edge Cases

- The creator payload is valid data but one or more displayed fields are missing, empty, or of the wrong type; the current behavior renders blank or broken fields, so it must fall back.
- The creator payload has no usable top-level creator data; the default profile must be displayed.
- A video payload contains an empty list; the existing "not available" state must be displayed.
- A video payload has no list or a non-list value; the section must fall back.
- The first video entry lacks an identifier, or the identifier is empty or not text; the section must fall back without rendering a broken frame.
- A response body is not data (for example, an error page) or cannot be parsed; it must be treated as a failure.
- A service never responds and reaches the defined limit; the application must stop waiting, select the fallback, and not wait for that lookup afterward.
- A response arrives after the application stops waiting; it must not change the result already produced, although framework-internal caching may retain it for a future refresh.
- One or more required configuration values are missing, empty, or whitespace-only; the failure must be identified before the corresponding external request is made and the appropriate fallback must be used.
- The main channel's two lookups share one configuration value; if that value is unusable, both sections fall back independently without preventing the series lookup or the creator lookup.
- Several integrations fail at once, including the creator profile and all video lookups; the page must remain fully renderable.
- Application control-flow signals (such as framework-level redirects or not-found signals) must be propagated before fallback handling rather than converted into fallbacks.
- A previous successful or failed response may remain cached for the existing content-refresh window; this feature does not change that behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST isolate failures per external integration so that a transport error, HTTP error, timeout, invalid payload, or missing configuration in one integration never prevents unrelated sections from rendering. *(Existing behavior for request errors; must extend to timeouts, validation failures, and pre-request configuration failures.)*
- **FR-002**: Every external lookup MUST have a finite, defined upper limit on how long the application waits for it; reaching that limit MUST be treated as a failure of that lookup, and a result that arrives after the application stops waiting MUST NOT alter the content already produced for the current generation or refresh. The limit bounds application waiting, not the completion of framework-internal background work or cache updates. The exact limit value will be determined during technical planning with justification based on the execution context.
- **FR-003**: Creator profile data MUST be validated at runtime before use, requiring a creator object with text values for every field the interface displays: name, platform, location, motivational phrase, and email. A field that is absent, not text, or contains only whitespace is invalid. If any required field is invalid, the complete default creator profile MUST be used. No field is intentionally optional in the current data contract or interface usage (verified 2026-11-17). *(Current behavior checks only the name.)*
- **FR-004**: Video data MUST be validated at runtime before use, requiring a usable collection and, when the collection is non-empty, a non-empty text identifier on the first entry (`items[0].id.videoId`), which is the only entry displayed; a whitespace-only identifier is not usable. Descriptive fields that the interface does not display MUST NOT be required. *(Current behavior validates only collection presence.)*
- **FR-005**: Invalid, incomplete, empty, or unexpected payloads MUST be treated as failures and MUST NOT be consumed by the interface.
- **FR-006**: When the creator profile integration fails, times out, returns invalid data, or lacks required configuration, the system MUST display the existing default creator profile and continue rendering the page. *(Fallback copy already exists; extend it to validation, timeout, and pre-request configuration failures.)*
- **FR-007**: When a video integration fails, times out, returns invalid data, or lacks required configuration, the system MUST display the existing "not available" state for that section and MUST NOT render a broken embed. *(Fallback state already exists; extend it to validation, timeout, and pre-request configuration failures.)*
- **FR-008**: All four independent lookups — creator profile, featured video, live, and series — MUST be executed concurrently rather than sequentially. A delay or failure in any one lookup MUST NOT prevent the other lookups from starting or completing. *(Current implementation is sequential.)*
- **FR-009**: Successful integrations MUST continue to display the same creator information and video content, in the same layout, as before this change.
- **FR-010**: Errors MUST be handled consistently across integrations; diagnostic records MUST be produced on the server without credentials, secret values, or unnecessary internal details, and visitor-facing content MUST remain neutral and unchanged. *(Existing logging already avoids exposing errors to visitors; new timeout, validation, and configuration failures must follow the same rule.)*
- **FR-011**: Missing, empty, or whitespace-only service configuration values MUST be identified before executing the corresponding external request and MUST be handled as integration failures with the appropriate fallback, not as unhandled errors. *(Current behavior results in fallback through a failed request; detection must move before the request.)*
- **FR-012**: Application control-flow signals MUST be propagated before any fallback handling, preserving the existing framework behavior. *(Already applied in all integration catch blocks.)*
- **FR-013**: Existing routes, fallback copy, visual structure, and the public interfaces between the page, its components, and its data sources MUST be preserved unless a change is strictly required. Adjusting page composition to achieve concurrency is permitted only if the rendered result and public interfaces remain compatible.
- **FR-014**: The page MUST remain fully renderable, with all fallbacks applied, when any combination of external integrations fails.
- **FR-015**: The current caching and revalidation strategy MUST be preserved, including the existing creator-content cache behavior and the existing 300-second revalidation window for video content. This feature MUST NOT introduce a new caching infrastructure or change cache timing.

### Key Entities

- **Creator Profile**: Public creator information displayed in the side panel — name, platform, location, motivational phrase, and contact email. All five fields are displayed and required for a valid profile. Has a canonical default version used when live data is unavailable.
- **Video Reference**: The identifier used to embed the featured video, the latest live, and the latest series. Only the first lookup result and its non-empty text video identifier are displayed; descriptive metadata is not used by the interface.
- **External Request Outcome**: The result of an integration attempt, exactly one of: validated data, unavailability due to missing configuration, unavailability due to timeout, unavailability due to transport or service error, or unavailability due to invalid payload. Only validated data may reach the interface.
- **Fallback Content**: The default creator profile and the existing section-level "not available" states shown when an outcome is not validated data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of tested single-integration failures — missing configuration, transport error, HTTP error, timeout, or invalid payload — every unrelated section still displays its real content.
- **SC-002**: In 100% of simulated non-responsive requests, the application stops waiting at the configured finite limit, completes the current content generation or refresh with the expected fallback, and does not wait for that lookup afterward. Framework-internal background work and cache updates are outside this criterion. The limit value is defined in technical planning with justification based on the execution context.
- **SC-003**: The malformed-payload test matrix produces 0 page-level failures, 0 blank displayed profile fields, and 0 broken video frames; 100% of invalid cases show the intended fallback.
- **SC-004**: With all integrations healthy, visible content and layout remain unchanged, with 0 regressions in existing interface tests.
- **SC-005**: With equal simulated delays for independent lookups, total external data acquisition time does not grow with the number of lookups; it is bounded by the slowest lookup rather than the sum, using the current sequential behavior as the reference baseline.
- **SC-006**: In 100% of simulated failure cases, no credential, secret value, or internal implementation detail is exposed to visitors or written to diagnostic records.
- **SC-007**: With every external integration failing, the page remains fully usable: default creator profile, all video fallback states, social links, and support section are present.
- **SC-008**: External content refresh behavior and timing remain unchanged; the existing creator-content cache behavior and the 300-second video revalidation window are preserved, and no caching infrastructure is introduced.

## Assumptions

- **Compatibility baseline (audited 2026-11-17)**: request errors are already isolated per section and produce the existing creator and video fallbacks; the four external lookups run sequentially; no request has a time limit; only the creator name is checked before use; and missing or empty configuration currently results in fallback through a failed request. Existing fallbacks, layout, and successful-data behavior are the reference to preserve.
- **Content refresh model**: the home page is served as periodically refreshed cached content, so external calls occur when content is generated or refreshed rather than on every visit. This feature preserves the current strategy: creator content keeps its existing cache behavior and video content keeps its existing 300-second revalidation window.
- The default creator profile already present in the application remains the canonical fallback, and the existing "not available" labels remain the canonical video fallbacks; no new fallback copy or visual design is introduced.
- The per-request timeout limit is an implementation decision to be documented in technical planning with justification based on the execution context. The specification requires only that the limit is finite and applied consistently to every external request; it sets no absolute duration. The value chosen in planning is an initial engineering decision without a measured baseline and may be adjusted with operational evidence; it is not a performance guarantee.
- The deadline bounds how long the application waits for each lookup. It does not guarantee cancellation of framework-internal HTTP work or completion of cache updates; those may continue after the fallback is selected without changing the result already produced.
- A late successful response may still be written to the framework's fetch cache and used by a future content refresh. This is not a change to the current result; the existing cache strategy is preserved.
- Only the first video lookup result is used, preserving current behavior. If that entry is unusable, the section falls back rather than scanning further entries.
- Creator validation requires all five displayed fields as non-empty text values. No field is intentionally optional in the current contract or interface usage.
- Video title, description, and thumbnail fields are declared in the data contract but are not displayed by the interface; they are therefore not required by validation.
- Requests are attempted once per generation or refresh; automatic retries, circuit breakers, and caching infrastructure are out of scope, consistent with the project's preference for simple fallbacks.
- The existing dependency set is sufficient for runtime validation and finite waits; no new dependency is assumed.
- The creator and video integrations are independent and can run concurrently. Achieving this may require adjusting page composition, provided public interfaces and rendered output remain compatible.
- Missing or empty configuration values are detected before the corresponding request is made and handled as integration failures. No new configuration variables are required.
- The creator email is validated as usable display text; email-format validation is out of scope because the interface only renders it as a contact link.
- Diagnostic logging remains server-side and is retained for troubleshooting; visitor-facing messages remain generic and unchanged.
- Tests must cover successful responses, network and HTTP failures, timeouts, invalid response structures, isolation of a single failed integration, pre-request configuration failures, and fallback behavior.
- Existing automated tests and their conventions remain valid, with new tests added alongside the relevant code as required by the project Constitution.
