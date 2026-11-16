# StudyLens — Privacy and Security Requirements

This document states the policy **and** what has actually been verified in code today. Policy statements are requirements for all future phases; they are not claims that future behaviour is already tested.

## 1. Verification boundary (current state, Phase 0)

Verified by inspecting the repository:
- **No database exists.** There is no schema, no migration, no SQLite file, and no persistence code anywhere in `backend/src`.
- **No AI processing exists.** `POST /api/v1/process` validates input and then returns `INTERNAL_ERROR`. No provider SDK is installed and no provider call is made.
- **No request-body logging exists.** The only logging in `backend/src/server.ts` emits `requestId`, `method`, `route`, `status`, `latencyMs`, and on unexpected failure an `errorCode`. `req.body`, source text, and model output are never logged.
- **No extension code exists**, so no client-side storage, permissions, or extraction behaviour can be assessed yet.
- `.env` is excluded by `.gitignore`; `.env.example` contains placeholder names only, with an empty `AI_API_KEY`.

Not yet verifiable (no implementation to inspect):
- Extraction of only the requested text from a live webpage.
- Exclusion of passwords/private form values during DOM extraction.
- Provider-side data handling.
- Speech, history, and reading-view data flows.
- Extension permission minimisation.

These must be re-verified when the corresponding code lands (Phases 1–3, and the Phase 6 security review).

## 2. Data transmission policy (requirement)
- Transmit only the text needed for the action the learner requested: the selection, or the extracted main content.
- Send `source.pageTitle` and `source.pageUrl` only as context; never send cookies, tokens, or full DOM.
- Never extract or transmit passwords, payment details, or private form values.
- Enforce `MAX_TEXT_LENGTH` (5000 chars) and a 64 KiB body limit; report truncation via `source.truncated`.
- HTTPS only in deployed environments.

## 3. Data storage policy (requirement)
- **No raw page text or selected text is stored by default.** This includes server logs, databases, and browser storage.
- If logging is enabled, permitted fields are: action, timestamp, status, latency, error code, request ID.
- Request history is P2 and off by default (`ENABLE_REQUEST_HISTORY=false`). If ever enabled, it stores metadata only — never source text or generated text.
- Any future database must use migrations and parameterised queries, and its files must stay out of Git.

## 4. Secret management (requirement)
- AI provider keys live only in backend environment variables.
- No secrets in extension source, extension bundle, browser storage, or Git history.
- `.env.example` carries placeholder names only.
- Before each release, scan the extension bundle and Git history for key material.

## 5. Origin and host access (partially implemented)
- Implemented: CORS allows `chrome-extension://` origins, requests with no `Origin` header, and origins explicitly listed in `ALLOWED_ORIGINS`. Methods limited to `GET`, `POST`.
- Required in Phase 1: minimise `host_permissions`; prefer `activeTab` and dynamic permission grants over broad `<all_urls>`.
- Every extension permission must be justified in the README when added.

## 6. Untrusted input policy (requirement)
- All webpage text is untrusted data, never instructions.
- Prompts must isolate source text and ignore embedded instructions that try to override system/developer rules.
- Validate all external input (implemented in `validateProcessRequest`) and all AI output (Phase 2).
- **Never execute AI-generated HTML, JavaScript, or scripts.** Render results as text in the side panel; no `innerHTML` of model output, no `eval`.
- Never silently modify the original webpage; the reading view must be reversible.

## 7. Review checklist

| Item | Status |
| --- | --- |
| Data transmission policy documented | Done |
| Data storage policy documented | Done |
| No raw-text persistence implementation present | Verified (nothing exists) |
| No request-body logging in server code | Verified |
| API key handling documented; `.env` ignored | Verified |
| Input validation implemented | Verified (shared validator + tests) |
| CORS restricted | Implemented for backend |
| Extension permission minimisation | Pending Phase 1 |
| AI output validation / prompt-injection handling | Pending Phase 2 |
| Full security test pass | Pending Phase 6 |