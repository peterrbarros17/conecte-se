# Quickstart Validation Guide: External API Resilience

**Feature**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md) | **Contracts**: [contracts/external-integrations.md](./contracts/external-integrations.md) | **Data model**: [data-model.md](./data-model.md)

This guide validates the feature after implementation. It contains commands and expected outcomes only; implementation details belong in `tasks.md` and the code.

## Prerequisites

- Node.js >= 20.9 (project `engines` and `.nvmrc`)
- npm
- Dependencies installed:

```bash
npm install
```

## Automated validation

### 1. Full test suite

```bash
npm test
```

Expected:

- All existing and new tests pass.
- No test performs a real external request.
- Timeout tests finish without waiting real seconds.
- Helper tests prove: the abort controller is triggered at the deadline, a late success or rejection is ignored, no unhandled rejection is produced, and the timer is cleared on success and on failure.
- Composition tests prove: all four lookups start before any finishes, and one failure or timeout does not block the others.
- Covered scenarios: valid creator/video responses, HTTP errors, network failures, timeouts, malformed payloads, missing configuration, isolation between the four lookups, and all fallbacks.
- Empty video collections are accepted; later video entries and unused metadata are not validated.

### 2. Project gate

```bash
npm run verify
```

Expected:

- `eslint` passes.
- `tsc --noEmit` passes.
- `jest` passes.

### 3. Production build

```bash
npm run build
```

Expected:

- The build completes.
- With no external configuration, the build still succeeds using fallbacks because configuration is checked before any request.
- With configuration present but an unavailable network, each lookup stops being awaited at its deadline and the build still succeeds with fallbacks.
- The generated static page contains the default creator profile and the three "not available" labels when configuration is absent.
- The build command completes without an unhandled rejection or a leaked timeout timer.

The deadline bounds application waiting. Next.js may finish internal fetch-cache or route-cache bookkeeping after the page result is produced; that is expected and not a build failure.

## Manual validation

### Setup

```bash
cp .env.example .env.local
```

Fill `.env.local` with valid values (do not commit it):

```text
LATEST_VIDEO=<youtube-data-api-key>
LATEST_SERIE=<youtube-data-api-key>
GIST=<gist-json-filename>
```

Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

Restart the dev server after changing environment values. Production ISR may keep the previous result for the existing 300-second window.

### Scenario matrix

| # | Setup | Expected result |
|---|---|---|
| 1 | All values valid | Real creator profile and three video embeds render; layout and copy are unchanged |
| 2 | `GIST` empty or invalid filename | Default creator profile (`UPeter`, platform, location, phrase, email) renders; all video sections still render normally |
| 3 | `LATEST_VIDEO` empty or invalid | Featured video and latest live show `Vídeo não disponível` / `Live não disponível`; creator and series render normally |
| 4 | `LATEST_SERIE` empty or invalid | Latest series shows `Série não disponível`; creator, featured video, and live render normally |
| 5 | All settings empty | Default creator profile, three "not available" video cards, social links, and support section all render; no page-level error |
| 6 | Network unavailable or an external service returns an error | Affected section falls back; unrelated sections still render |
| 7 | External service returns malformed data | Affected section falls back; no blank profile fields and no broken iframe |
| 8 | External service never responds | Affected section falls back at the deadline; other sections are not blocked; automated tests verify this deterministically |
| 9 | External service responds after the deadline | The already-rendered fallback does not change; a late 200 may be cached by Next.js and used on a later refresh |

The timeout value is a single implementation constant, initially 5000 ms. Adjust it only with observed build/refresh diagnostics; the manual scenarios above should not be used to infer a specific latency SLO.

### What to inspect

- Creator panel: name, platform, location, motivation phrase, email link.
- Video areas: either an iframe with a real video ID or the existing dashed empty-state card with the correct label.
- Page structure: background, social links, support section, theme toggle, and footer remain intact.
- Browser console: no client-side error introduced by the feature.
- Server console: failure diagnostics name the integration but never show the API key, `GIST` value, request URL, or response payload.

## Contract references

- Validated creator and video shapes and rejection rules: [contracts/external-integrations.md](./contracts/external-integrations.md)
- Field-by-field validation and outcome states: [data-model.md](./data-model.md)
- User-visible fallbacks and success criteria: [spec.md](./spec.md)
