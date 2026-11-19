# StudyLens — Privacy and Security Requirements

This document states the policy **and** what has actually been verified in code today. Policy statements are requirements for all future phases; they are not claims that future behaviour is already tested.

## 1. Verification boundary (current state, end of Phase 2)

Verified by inspecting the repository and running the automated suite:
- **No database exists.** No schema, migration, or persistence code.
- **No AI processing is reachable from the API.** `/api/v1/process` validates then returns `INTERNAL_ERROR`. The Groq adapter exists and is unit-tested, but the route does not call it.
- **No request-body logging.** Backend logs only `requestId`, `method`, `route`, `status`, `latencyMs`.
- **No provider logging.** `groq.provider.ts` contains no `console.*` call. Selected text and model output are never logged.
- **API key used exactly once**, in the outbound `Authorization` header. Asserted by inspection and by the test `never puts the api key in the result`.
- **No key in HTTP responses.** `describeConfig()` emits `credentialsPresent` as a boolean, and only for the active provider. Guarded by two regression tests.
- **Provider error messages are fixed safe strings.** Provider error bodies (which can echo request content) are discarded, never forwarded. Guarded by `maps 401 to INTERNAL_ERROR and hides provider detail`.
- **Extension holds no credentials.** `BackendClient` sends only `Content-Type`. Asserted by `never sends an Authorization header`.
- **No selected text persisted by the extension.** React state only; no `storage` permission.
- **Plain-text rendering only.** No `innerHTML`, no `eval`.
- **`.env` is git-ignored**; `.env.example` carries an empty `GROQ_API_KEY`.
- **Automated tests make zero network calls.** All provider tests inject `fetchImpl`; no token spend.

Not yet verifiable (no implementation):
- Real provider data handling under live traffic (Phase 3).
- Prompt-injection resistance in practice — the system prompt isolates source text, but this is untested against adversarial pages.
- Structured-output enforcement via `json_schema` (Phase 3).
- Speech, history, reading-view flows (Phase 4).
- HTTPS transport in a deployed environment.

## 2b. Provider credential policy (implemented)
- Keys live only in backend environment variables, loaded from the git-ignored root `.env`.
- `.env.example` must contain `GROQ_API_KEY=` with no value. It is a tracked file.
- Startup fails fast with a clear message if `AI_PROVIDER=groq` and no key is present.
- `AI_PROVIDER=mock` requires no credentials and is the default for development and CI.
- Test fixtures use obviously fake values (`gsk_test_key`, `gsk_super_secret`, `gsk_leftover`).

## 2c. Incident record — committed API key (Phase 2)
A real Groq key was briefly placed in `.env.example` and committed locally. GitHub push protection rejected the push, so the secret never reached the remote. The key was rotated, the template blanked, and the local commit amended before a successful push. Full details in `docs/phase-2-completion-report.md` §4.

Rule going forward: **never write a real credential into any tracked file, including templates.** Do not use GitHub's "allow this secret" unblock link for a live key.

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