# StudyLens — Setup and Demo Guide

## 1. Prerequisites
- Node.js >= 20 (`node -v`)
- npm >= 10 (`npm -v`)
- Git
- Google Chrome (only needed from Phase 1)

## 2. Clone and install

```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

`npm install` at the root installs all three workspaces (`shared`, `backend`, `extension`) and links `@studylens/shared` into the backend.

## 3. Environment setup

```bash
cp .env.example .env
```

The canonical filename is **`.env.example`** (with the leading dot), copied to **`.env`** at the repository root. The backend loads `<repo>/.env` automatically.

Defaults work out of the box: `PORT=3000`, `HOST=0.0.0.0`. No API key is needed yet.

Verify `.env` is ignored:
```bash
git check-ignore -v .env      # should print a .gitignore rule
git status --short            # .env must NOT appear
```

## 4. Build

```bash
npm run build:baseline
```
Builds `shared` then `backend`. Output goes to `shared/dist` and `backend/dist`.

```bash
npm run build
```
Runs the baseline build **and** the extension build. The extension build exits with code 1 on purpose: the extension is not implemented until Phase 1. A failing exit code here is expected, not a broken environment.

## 5. Test

```bash
npm test
```
Runs the shared contract unit tests with Node's built-in runner. Expected: 13 passing tests, 0 failing.

```bash
npm run typecheck
```
Type-checks `shared` and `backend` without emitting files.

Coverage today: shared API contract validation only. No backend HTTP tests, no extension tests yet.

## 6. Start the backend

Terminal A:
```bash
npm run dev:backend
```
Expected output:
```
StudyLens backend listening on http://0.0.0.0:3000 (env=development)
Health check: curl http://localhost:3000/health
```

Alternative (compiled):
```bash
npm run build:backend
npm run start:backend
```

## 7. Health check

Terminal B:
```bash
curl http://localhost:3000/health
```
Expected:
```json
{"status":"ok","service":"studylens-backend","version":"1.0.0","timestamp":"2026-11-16T06:04:13.394Z"}
```

## 8. Contract smoke checks (no AI yet)

Empty text → 400:
```bash
curl -i -X POST http://localhost:3000/api/v1/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"simplify","text":"   ","source":{"type":"selection"}}'
```

Translate without language → 400:
```bash
curl -i -X POST http://localhost:3000/api/v1/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"translate","text":"Hello","source":{"type":"selection"}}'
```

Unsupported language → 400 `UNSUPPORTED_LANGUAGE`:
```bash
curl -i -X POST http://localhost:3000/api/v1/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"translate","text":"Hello","source":{"type":"selection"},"targetLanguage":"fr"}'
```

Valid request → 500 `INTERNAL_ERROR` (AI not implemented; this is correct for Phase 0):
```bash
curl -i -X POST http://localhost:3000/api/v1/process \
  -H 'Content-Type: application/json' \
  -d '{"action":"simplify","text":"Plants make food using sunlight.","source":{"type":"selection"}}'
```

Every response carries an `X-Request-Id` header and a `requestId` field.

## 9. Chrome unpacked-extension instructions — UPCOMING (Phase 1)

There is no extension to load yet. Planned workflow once Phase 1 is complete:
1. `npm run build:extension`
2. Visit `chrome://extensions/`
3. Toggle **Developer mode** on
4. Click **Load unpacked**, choose `extension/dist`
5. Pin StudyLens, open an NCERT page, select text, open the side panel

## 10. Demo script — target end state (not runnable yet)

Available after Phase 3 (M4):
1. Open an NCERT lesson page.
2. Select a dense paragraph.
3. Open the StudyLens side panel; confirm it shows "Selected text".
4. Click **Make it simple** → verify the rewrite matches the selected content.
5. Click **My language** → Hindi, then Kannada → verify the target language label.
6. Click **Guide me** → verify numbered steps and checkboxes.
7. Click **Listen** → verify speech starts and stops.
8. Toggle **Clear reading view** → verify font size and contrast controls.

Today, only steps in sections 4–8 of this guide are demonstrable.

## 11. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `EADDRINUSE ... 3000` | Old server still running | `kill $(lsof -t -i:3000)` then restart |
| `curl: (7) Failed to connect` | Server not running, or run in the same blocking terminal | Start server in Terminal A, curl in Terminal B |
| Browser `ERR_CONNECTION_REFUSED` in Codespaces | Browser is on your laptop, server is remote | Use the forwarded URL from the **Ports** tab |
| `Cannot GET /` | No route at `/` | Use `/health` |
| `TS18003 No inputs were found` | Workspace has no `src` files | Ensure `shared/src` and `backend/src` exist |
| `Cannot find module '@studylens/shared'` | Shared not built or not linked | `npm install` then `npm run build:shared` |
| `npm run build` exits 1 at extension | Expected in Phase 0 | Use `npm run build:baseline` |