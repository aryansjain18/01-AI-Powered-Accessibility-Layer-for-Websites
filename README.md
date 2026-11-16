# StudyLens

AI-powered learning and accessibility assistant, delivered as a Chrome extension backed by a Node.js API.

## Overview
StudyLens helps learners understand difficult educational webpage content by turning selected or relevant page text into simpler explanations, translations (English / Hindi / Kannada), speech, and step-by-step guidance.

Primary content scope: NCERT-style educational HTML pages, with extraction kept general enough for ordinary text-based webpages.

## Current implementation status

| Area | Status |
| --- | --- |
| Product requirements, ADRs, architecture | Documented |
| API contract + shared TypeScript types | Implemented and aligned |
| Shared contract unit tests | Implemented (`npm test`) |
| Backend `/health` | Implemented |
| Backend `POST /api/v1/process` | Input validation implemented; **AI processing not implemented** (returns `INTERNAL_ERROR`) |
| Chrome extension (manifest, side panel, content script) | **Not implemented** — Phase 1 (M1) |
| Database / request history | **Not implemented** — no schema exists |
| Speech, translation, steps features | **Not implemented** — Phase 3 (M4) |

`npm run build` intentionally fails at the extension step until Phase 1. Use `npm run build:baseline` to build what exists today.

## Features (target MVP)

P0: Simplify, Explain, Translate (en/hi/kn), Listen, Step-by-step guide, Page understanding.
P1: Clear reading view.
P2: Minimal request history (metadata only, off by default).

Out of scope: autonomous clicking/form submission, LMS/accounts/analytics, custom model training, PDF OCR, per-feature microservices.

## Technology stack
- Extension: Chrome Manifest V3, React + TypeScript (Phase 1)
- Backend: Node.js 20+, Express 4, TypeScript 5
- Shared: TypeScript contracts + runtime validation
- Tests: Node built-in test runner (`node --test`)
- Package manager: npm workspaces
- AI: provider-independent adapter (Phase 2)
- SQLite: optional metadata only, not created yet

## Repository structure

```
.
├── docs/
│   ├── product-requirements.md
│   ├── architecture.md
│   ├── api-contract.md
│   ├── privacy-security.md
│   ├── setup-and-demo.md
│   ├── phase-0-completion-report.md
│   └── decisions/ADR-001-product-and-platform-decisions.md
├── shared/          # canonical API types + validation + tests
│   └── src/{contracts,tests}
├── backend/         # Express API
│   └── src/server.ts
├── extension/       # Chrome MV3 (Phase 1); build guard script only for now
│   └── scripts/
├── .env.example
├── .gitignore
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Prerequisites
- Node.js **20 or newer** (`node -v`)
- npm **10 or newer** (`npm -v`)
- Google Chrome (needed from Phase 1 onward)
- Git

## Installation

```bash
git clone <repository-url>
cd <repository-folder>
npm install
cp .env.example .env
```

Edit `.env` if you need a different port. No API key is required yet — AI processing is not wired.

## Build

```bash
npm run build:baseline   # builds shared + backend (works today)
npm run build            # also runs the extension build: FAILS by design until Phase 1
```

## Test

```bash
npm test        # shared contract unit tests (node --test)
npm run typecheck
```

Automated tests currently cover the shared API contract only. Backend HTTP tests and extension tests arrive in Phase 1–2.

## Run the backend

```bash
npm run dev:backend     # watch mode (tsx)
# or
npm run build:backend && npm run start:backend
```

Health check, in a second terminal:

```bash
curl http://localhost:3000/health
```

Expected:
```json
{"status":"ok","service":"studylens-backend","version":"1.0.0","timestamp":"..."}
```

Stop the server with `Ctrl+C`. If port 3000 is busy: `kill $(lsof -t -i:3000)`.

In GitHub Codespaces, the server binds to `0.0.0.0`; use the forwarded port URL from the **Ports** tab in a browser. `curl http://localhost:3000/health` works inside the Codespace terminal.

## Load the extension in Chrome — UPCOMING (Phase 1)

Not available yet. There is no `manifest.json` and no bundled UI. When Phase 1 lands, the workflow will be:
1. `npm run build:extension`
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. **Load unpacked** → select `extension/dist`
5. Open the StudyLens side panel on an educational page

## Environment variables

| Variable | Default | Used now | Purpose |
| --- | --- | --- | --- |
| `PORT` | `3000` | Yes | Backend port |
| `HOST` | `0.0.0.0` | Yes | Bind address (use `0.0.0.0` in Codespaces/Docker) |
| `NODE_ENV` | `development` | Yes | Runtime mode label |
| `ALLOWED_ORIGINS` | empty | Yes | Extra CORS origins, comma-separated |
| `MAX_TEXT_LENGTH` | `5000` | Informational | Enforced value lives in shared contract |
| `AI_PROVIDER` | `openai` | No (Phase 2) | Provider selection |
| `AI_MODEL` | `gpt-4o-mini` | No (Phase 2) | Model id |
| `AI_API_KEY` | empty | No (Phase 2) | Backend-only secret |
| `AI_TIMEOUT_MS` | `30000` | No (Phase 2) | Provider timeout |
| `AI_MAX_RETRIES` | `1` | No (Phase 2) | Provider retries |
| `ENABLE_REQUEST_HISTORY` | `false` | No | Metadata-only history flag |

`.env` is git-ignored; only `.env.example` is committed.

## Architecture overview

Webpage → content script (selection/extraction) → background service worker → React side panel → `POST /api/v1/process` → backend validation → AI provider adapter → structured result → side panel.

Decisions locked: Chrome desktop, Chrome side panel, selected-text-first, provider-independent adapter, no raw-text persistence, NCERT-style HTML first. See `docs/architecture.md` and ADR-001.

## Privacy summary
Only the text needed for the requested action is sent. No passwords or private form values are extracted. No raw page text is stored. API keys stay on the backend. Webpage content is untrusted; AI-generated HTML/scripts are never executed. Details and the current verification boundary: `docs/privacy-security.md`.

## Known limitations
- No extension bundle, manifest, or UI yet.
- `/api/v1/process` validates input but performs no AI work.
- No database, no history, no speech, no translation yet.
- Only shared-contract unit tests exist.
- Provider/rate-limit error codes are specified but not yet emitted.

## Documentation
- [Product requirements](docs/product-requirements.md)
- [Architecture](docs/architecture.md)
- [API contract](docs/api-contract.md)
- [Privacy & security](docs/privacy-security.md)
- [Setup & demo](docs/setup-and-demo.md)
- [Phase 0 report](docs/phase-0-completion-report.md)
- [ADR-001](docs/decisions/ADR-001-product-and-platform-decisions.md)

## License
MIT