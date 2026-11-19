# Phase 1 Data Model: External API Resilience

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Date**: 2026-11-18

## Overview

The feature has no persistent storage. The model describes the untrusted upstream payloads, the validated domain values consumed by the UI, the outcome of each independent lookup, and the existing fallback content. Every external response crosses a trust boundary and must be narrowed at runtime before use.

## Entities

### CreatorProfile

Public creator information rendered in the side panel.

| Field | Type | Required | Validation | Used by UI |
|---|---|---|---|---|
| `creatorName` | string | Yes | Non-empty after trimming whitespace | Heading and verified badge label |
| `creatorPlatform` | string | Yes | Non-empty after trimming whitespace | Platform pill |
| `creatorLocation` | string | Yes | Non-empty after trimming whitespace | Location pill |
| `creatorPhraseMotivation` | string | Yes | Non-empty after trimming whitespace | Motivational paragraph |
| `creatorEmail` | string | Yes | Non-empty after trimming whitespace; format not validated | Contact link text and `mailto:` target |

Container shape: `{ creator: CreatorProfile }`.

No field is intentionally optional in the current type or UI. If any field fails validation, the whole profile is rejected and the complete default profile is used.

**Canonical fallback (`FALLBACK`)**:

| Field | Value |
|---|---|
| `creatorName` | `UPeter` |
| `creatorPlatform` | `Youtuber, Streamer` |
| `creatorLocation` | `Fortaleza, Brasil` |
| `creatorPhraseMotivation` | `Amo jogos digitais e compartilhar minha paixão através de livestreams.` |
| `creatorEmail` | `upeter2019@gmail.com` |

### VideoLookup

One independent YouTube search result, used for exactly one section.

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| `items` | array | Yes | Must be an array | An empty array is structurally valid and maps to the section's empty state |
| `items[0].id.videoId` | string | Yes when `items` is non-empty | Non-empty after trimming whitespace | The only video data the UI consumes |
| `items[1..n]` | unknown | No | Not inspected | Later entries are never read and carry no type guarantee |

The validated TypeScript contract states exactly this:

```ts
export type VideoData = {
  items: [] | [{ id: { videoId: string } }, ...unknown[]];
};
```

The union does not claim that every entry has an identifier. The consumer destructures the first entry (`const [first] = data.items`), which narrows the union without additional validation.

The following upstream fields are explicitly **not** modeled or required: `snippet.title`, `snippet.description`, `snippet.thumbnails`, and any later `items` entries. Card titles and descriptions are static UI text, not upstream data.

The validated type is intentionally minimal so it truthfully represents what the application checks and consumes.

### VideoSection

A rendered area backed by one `VideoLookup`.

| Section | Source | Empty-state label |
|---|---|---|
| Featured video | Main channel, latest video, any duration | `Vídeo não disponível` |
| Latest live | Main channel, latest completed live | `Live não disponível` |
| Latest series | Series channel, latest video, any duration | `Série não disponível` |

All three sections always render. A missing or invalid video ID produces the section's empty state; it never produces a broken iframe.

### ExternalRequestOutcome

The result of one lookup attempt. Outcomes are independent per lookup.

| Outcome | Trigger | UI result | Request made? |
|---|---|---|---|
| `valid` | Response parses and passes the relevant runtime guard | Validated data is rendered | Yes |
| `missing_configuration` | Required setting is absent, empty, or whitespace-only | Section fallback | No |
| `timeout` | The application's deadline elapses before the caller-visible operation settles | Section fallback | Yes; origin cancellation is best-effort and may not occur during Next.js background revalidation |
| `http_error` | Response status is not OK | Section fallback | Yes |
| `network_error` | Request rejects before a response is available | Section fallback | Yes |
| `invalid_payload` | Body cannot be parsed, or parsed data fails the runtime guard | Section fallback | Yes |

Only `valid` may reach the UI. All other outcomes map to fallback content. A late result after `timeout` is discarded for the current render and cannot change the rendered outcome; Next.js may still cache a late 200 for a future render.

### TimingSemantics

The deadline has three distinct scopes. Only the first is guaranteed by the application.

| Scope | Behavior |
|---|---|
| Application wait | Bounded by `EXTERNAL_REQUEST_TIMEOUT_MS`; the lookup resolves to its fallback at the deadline |
| Origin HTTP request | `AbortController` is signalled; cancellation is best-effort. Next.js removes the caller signal during stale/background and foreground fetch revalidations, so the origin request can continue |
| Next.js cache update | Not bounded; fetch-cache and route-cache writes may complete after the deadline, and a late 200 may be used by a future render |

### FallbackContent

Existing content shown when an outcome is not `valid`.

| Scope | Fallback |
|---|---|
| Creator profile | Complete `FALLBACK` profile; never a partial merge with invalid upstream data |
| Featured video | `Vídeo não disponível` empty card |
| Latest live | `Live não disponível` empty card |
| Latest series | `Série não disponível` empty card |

No new fallback copy or visual design is introduced.

## Relationships

```text
Home page
├── CreatorProfile  <── one Gist lookup ──> default profile on failure
├── VideoSection: featured <── one YouTube lookup ──> "Vídeo não disponível"
├── VideoSection: live     <── one YouTube lookup ──> "Live não disponível"
└── VideoSection: series   <── one YouTube lookup ──> "Série não disponível"
```

- The four lookups are independent; no lookup consumes another lookup's result.
- The two main-channel video lookups share the `LATEST_VIDEO` configuration value. If it is invalid, both fall back independently; the series lookup and creator lookup are unaffected.
- The page composes all four outcomes; one fallback never suppresses the other sections.

## Validation rules

1. Values are treated as `unknown` until narrowed by a type guard. No `as` assertion substitutes for validation.
2. Objects and arrays are checked explicitly; null, primitives, and malformed containers are rejected.
3. Strings must contain at least one non-whitespace character.
4. Creator validation is all-or-nothing: any invalid field rejects the profile and selects the complete fallback.
5. Video validation is limited to the collection and the first entry's identifier. Empty collections are accepted and rendered as the section's empty state. Later entries are not validated and are not covered by the type guarantee.
6. Video metadata that the UI does not display never causes rejection.
7. Configuration is validated before the request; a missing setting is not a malformed payload and does not create a network request.
8. Error and log messages never include configuration values, request URLs, or response payloads.
9. The deadline bounds the application's wait, not Next.js origin-request execution or cache-write completion. A late 200 may enter the fetch cache for a future render; it cannot change the current result.

## State transitions

```text
[Start lookup]
   │
   ├─ configuration missing/empty/whitespace ──────────────> [Fallback]  (no request)
   │
   └─ configuration present
        │
        └─ [Request with caller deadline (initial 5s)]
             │
             ├─ deadline reached ───────────────────────────> [Fallback]  (current result; origin/cache may continue)
             ├─ network/body error ─────────────────────────> [Fallback]
             ├─ HTTP status not OK ─────────────────────────> [Fallback]
             └─ response parsed
                  │
                  ├─ runtime guard fails ───────────────────> [Fallback]
                  └─ runtime guard passes ──────────────────> [Validated data rendered]
```

Each lookup follows this transition independently. A failure transition in one lookup never changes the state of another lookup.
