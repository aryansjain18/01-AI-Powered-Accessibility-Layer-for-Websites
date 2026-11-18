# StudyLens — Privacy and Security Requirements

This document states the policy **and** what has actually been verified in code today. Policy statements are requirements for all future phases; they are not claims that future behaviour is already tested.

## 1. Verification boundary (current state, end of Phase 1)

Verified by inspecting the repository and testing in the browser:
- **No database exists.** No schema, migration, SQLite file, or persistence code in `backend/src`.
- **No AI processing exists.** `POST /api/v1/process` validates input then returns `INTERNAL_ERROR`. No provider SDK installed.
- **No request-body logging.** Backend logs only `requestId`, `method`, `route`, `status`, `latencyMs`.
- **No selected text is persisted by the extension.** Captured text lives in React component state only. There is no `chrome.storage` usage and no `storage` permission.
- **The extension makes no network calls.** No `fetch` to the backend in Phase 1.
- **Only the selection is read.** `window.getSelection().toString()` — no DOM scraping, no form values, no password fields.
- **Plain-text rendering only.** The panel renders `{selection.text}` as a React text node. No `innerHTML`, no `eval`, no script execution.
- **Permissions are minimal:** `sidePanel`, `activeTab`, `tabs`. No `<all_urls>` host permission.
- `.env` is git-ignored; `.env.example` has an empty `AI_API_KEY`.

Not yet verifiable (no implementation):
- Provider-side data handling and prompt-injection resistance (Phase 2).
- Speech, history, and reading-view data flows (Phase 3).
- Backend transmission of selected text over HTTPS (Phase 2).

## 2a. Selection capture policy (implemented)

- Reads only the user's current selection; never unrelated page content.
- Trims whitespace; rejects empty and whitespace-only selections.
- Enforces the 5000-character limit and reports `truncated: true` when shortened.
- Captures `pageTitle` and `pageUrl` as context only — no cookies, tokens, or full DOM.
- Unsupported schemes (`chrome://`, `vivaldi://`, Web Store) are rejected before any capture attempt.
- Captured text is held in memory for the lifetime of the panel and discarded on clear or close.

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