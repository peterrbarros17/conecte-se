# External Integration Contracts

**Feature**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md) | **Data model**: [data-model.md](../data-model.md)

These contracts define the boundary between untrusted external responses, the server-side integration clients, and the UI. They are behavioral contracts, not implementation code.

## Trust boundary

- Upstream GitHub Gist and YouTube Data API payloads are **untrusted**.
- Configuration values are server-only secrets or settings and must never reach the browser, logs, or user-facing text.
- Only data that passes runtime validation may cross into the UI.
- Every lookup is independent: its outcome cannot change another lookup's outcome.

## Configuration contract

| Setting | Required by | Valid value | Invalid value behavior |
|---|---|---|---|
| `GIST` | Creator lookup | Non-empty after trimming whitespace | `missing_configuration`; no request; creator fallback |
| `LATEST_VIDEO` | Featured video and latest live | Non-empty after trimming whitespace | `missing_configuration`; no request; both affected sections fall back independently |
| `LATEST_SERIE` | Latest series | Non-empty after trimming whitespace | `missing_configuration`; no request; series fallback |

Rules:

- Validation happens before the corresponding request.
- Error messages may name the setting, never its value.
- A shared setting failure affects only the lookups that use it. It does not prevent the other lookups from starting.

## Deadline contract

| Property | Contract |
|---|---|
| Scope | The application's wait for each lookup, including `fetch`, HTTP status checking, and body reading/parsing |
| Limit | Finite, defined as a single implementation constant (initial value in the plan: 5000 ms; adjustable in one place) |
| On expiry | The application stops waiting; outcome is `timeout`; fallback is selected |
| Origin cancellation | `AbortController` is signalled, but cancellation is best-effort. Next.js removes the caller `signal` during stale/background and foreground fetch revalidations, so the origin request may continue after the deadline. |
| Next.js cache writes | Not bounded by the deadline. Fetch-cache and route-cache writes may complete later. |
| Late result | Cannot change the current render. A late 200 may still be written to the fetch cache by Next.js and used by a future render. |
| Interaction with cache | The existing `next.revalidate` options are passed through unchanged |

Execution context:

- **Build / first generation**: the page waits; the deadline bounds generation and usually cancels the origin request.
- **Time-based ISR refresh**: stale content is served immediately; the deadline bounds any lookup the background regeneration awaits, not the visitor wait, a fetch-cache refresh Next starts on its own, or Next's post-render cache bookkeeping.
- **Stale fetch-cache entry**: Next.js returns cached data and refreshes in the background with the caller signal removed; that refresh is outside this deadline.
- **Foreground fetch revalidation**: Next.js can also drop the signal; the application stops waiting at the deadline while the origin/cache work continues.

## Creator upstream contract

### Accepted shape (subset consumed by the UI)

```json
{
  "creator": {
    "creatorName": "UPeter",
    "creatorPlatform": "Youtuber, Streamer",
    "creatorLocation": "Fortaleza, Brasil",
    "creatorPhraseMotivation": "Example phrase.",
    "creatorEmail": "contact@example.com"
  }
}
```

### Validation

| Condition | Result |
|---|---|
| Top level is an object with a `creator` object | Continue |
| All five fields are strings with non-whitespace content | `valid` |
| Any required field absent, not text, empty, or whitespace-only | `invalid_payload`; use the complete default profile |
| Body is not valid data or cannot be parsed | `invalid_payload`; use the complete default profile |

No field is optional. There is no partial merge: one invalid field selects the whole fallback profile.

## Video upstream contract

### Accepted shape (subset consumed by the UI)

Empty result:

```json
{
  "items": []
}
```

First entry usable:

```json
{
  "items": [
    {
      "id": {
        "videoId": "dQw4w9WgXcQ"
      }
    }
  ]
}
```

Validated TypeScript contract:

```ts
export type VideoData = {
  items: [] | [{ id: { videoId: string } }, ...unknown[]];
};
```

### Validation

| Condition | Result |
|---|---|
| Top level is an object with an `items` array | Continue |
| `items` is empty | `valid`; render the section's existing empty state |
| `items[0].id.videoId` is a non-whitespace string | `valid`; render the embed |
| `items` is absent or not an array | `invalid_payload`; section fallback |
| First entry lacks an ID, or the ID is empty, whitespace-only, or not text | `invalid_payload`; section fallback without an iframe |
| `items` has later entries of any shape | Ignored; they are never read and carry no type guarantee |
| `snippet`, `title`, `description`, or `thumbnails` absent or malformed | Ignored; does not invalidate the response |

Only the first entry is consumed. Later entries and descriptive metadata are outside this contract.

## Client function contracts

All functions execute server-side only.

### `fetchCreatorData()`

| Aspect | Contract |
|---|---|
| Inputs | Server environment `GIST` |
| Success | Returns validated `CreatorDataType` |
| Failure | Throws a safe error for missing configuration, timeout, HTTP/network failure, parse failure, or invalid payload |
| Side effects | One HTTP GET; no cache option change (`revalidate: false`) |
| Secrets | Error message must not include the `GIST` value or request URL |

### `fetchDataVideo(apiKey, channelId, size)`

| Aspect | Contract |
|---|---|
| Inputs | Server-side API key, channel identifier, duration filter |
| Success | Returns validated `VideoData` (consumed subset) |
| Failure | Throws a safe error for missing key, timeout, HTTP/network failure, parse failure, or invalid payload |
| Side effects | One HTTP GET; no cache option change (`revalidate: 300`) |
| Secrets | Error message must not include the API key or request URL |

### `fetchDataLive(apiKey, channelId)`

Same contract as `fetchDataVideo`, using the completed-live query and `revalidate: 300`.

## Loader contracts

### `getCreatorData()`

| Outcome | Result |
|---|---|
| Valid upstream data | Returns it |
| Missing configuration, timeout, HTTP/network failure, invalid payload, parse failure | Returns the complete `FALLBACK` profile |
| Timeout with a late response | Returns the complete `FALLBACK`; the late value does not change this result |
| Application control-flow signal | Rethrows before fallback handling |
| Logging | Server-side safe label and message; no secret or URL |

### `getReleasedVideos()`

| Outcome | Result |
|---|---|
| All three lookups valid | Returns the three video IDs |
| Some lookups fail | Returns IDs for successful lookups and `""` for failed ones |
| All lookups fail | Returns three empty IDs |
| One lookup times out | The other two still return their results; the timed-out section gets `""` |
| Application control-flow signal | Rethrows before fallback handling |
| Execution | All three lookups start before any is awaited |
| Logging | One safe entry per failed lookup; no secret or URL |

## UI fallback contract

| Section | Valid data | Any non-valid outcome |
|---|---|---|
| Creator panel | Upstream name, platform, location, phrase, email | Complete default profile |
| Featured video | Embed for the returned ID | `Vídeo não disponível` empty card |
| Latest live | Embed for the returned ID | `Live não disponível` empty card |
| Latest series | Embed for the returned ID | `Série não disponível` empty card |

Fallbacks are always rendered within the existing page structure. No section is hidden or replaced by an error page.

## Cache contract

| Request | Cache option | Must remain unchanged |
|---|---|---|
| GitHub Gist | `revalidate: false` | Yes |
| YouTube video | `revalidate: 300` | Yes |
| YouTube live | `revalidate: 300` | Yes |

No cache tags, bypasses, new storage, or TTL changes are introduced. A response already accepted by the platform cache may continue to be used for its existing window.

- A 200 response with an invalid payload is cached under the existing TTL: indefinitely for the Gist (`revalidate: false`) and for 300 seconds for video. The fallback remains until that entry is replaced.
- A late 200 from a Next-owned background revalidation may be cached after the deadline and used by a future render. It cannot change the current result.
- The deadline does not bound cache writes or route-regeneration bookkeeping.

## Error taxonomy

| Outcome | User sees | Server log |
|---|---|---|
| `missing_configuration` | Section fallback | Safe setting name only |
| `timeout` | Section fallback | Safe timeout message |
| `http_error` | Section fallback | HTTP status only |
| `network_error` | Section fallback | Safe failure message |
| `invalid_payload` | Section fallback | Safe validation message; no payload echo |
| `valid` | Real content | No error entry |
