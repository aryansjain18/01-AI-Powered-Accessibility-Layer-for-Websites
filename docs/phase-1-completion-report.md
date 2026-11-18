# Phase 1 Completion Report — Extension Shell and Selection Capture

Status: **CLOSED ✅**
Branch: `rebuild`
Objective: A loadable Chrome MV3 extension with a React side panel that captures selected text from real webpages and displays it in the UI. **No AI processing in this phase.**

## 1. Acceptance checklist (12/12)

| # | Condition | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Chrome accepts the unpacked extension without errors | ✅ | Loads from `extension/dist`; no manifest errors |
| 2 | React Side Panel opens from the toolbar | ✅ | `chrome.action.onClicked` → `sidePanel.open({windowId})` |
| 3 | Selection from a real webpage captured correctly | ✅ | Wikipedia *Photosynthesis*, 976 chars captured |
| 4 | Selected text appears in the React interface | ✅ | Screenshot: badge + title + text + char count |
| 5 | Empty selection displays a useful fallback | ✅ | "No text selected. Highlight some text…" |
| 6 | Unsupported pages handled gracefully | ✅ | `chrome://extensions` → helpful message, no crash |
| 7 | Content script and service worker communicate correctly | ✅ | Console: `capture, chars = 976` → panel renders |
| 8 | Only necessary permissions requested | ✅ | `sidePanel`, `activeTab`, `tabs` (justified below) |
| 9 | No selected text persisted unnecessarily | ✅ | React state only; no `chrome.storage`, no backend call |
| 10 | Extension build succeeds | ✅ | Two Vite passes, no TS errors |
| 11 | All existing Phase 0 tests still pass | ✅ | 13/13 shared tests green |
| 12 | Phase 1 documentation and report updated | ✅ | This file + README + setup + architecture + privacy |

## 2. Task results

| Task | Outcome |
| --- | --- |
| 1.1 Workspace & build | Vite + React 18 + TS 5. Two-pass build: app (ESM) then content (IIFE). Phase 0 build guard removed. |
| 1.2 Manifest V3 | `extension/public/manifest.json`, copied to `dist/`. Side panel path `src/sidepanel/index.html`. |
| 1.3 React Side Panel | Header, hint, Capture button, loading / empty / error / ready states, plain-text rendering, scrollable long text. |
| 1.4 Selection capture | `window.getSelection()` → trim → 5000-char limit → `truncated` flag → `SourceInfo` from shared contract. |
| 1.5 Messaging | Typed messages + runtime guards. Panel → background (`REQUEST_SELECTION`) → content (`CAPTURE_SELECTION`) → response chain. |
| 1.6 Toolbar & no-selection | Toolbar opens panel then pushes result; retry button; unsupported-page detection via `isSupportedUrl`. |
| 1.7 Tests | 18 new extension unit tests; 31 total with Phase 0. |
| 1.8 Real-page validation | 7/7 manual cases passed (see §4). |
| 1.9 Documentation | README, setup-and-demo, architecture, privacy-security updated. |

## 3. Automated test results

Command: `npm test` (repo root)

| Suite | Tests | Pass | Fail |
| --- | --- | --- | --- |
| `@studylens/shared` — API contract (Phase 0) | 13 | 13 | 0 |
| `@studylens/extension` — `buildSelection` | 7 | 7 | 0 |
| `@studylens/extension` — message guards | 11 | 11 | 0 |
| **Total** | **31** | **31** | **0** |

`buildSelection` coverage: normal capture, whitespace trimming, empty rejection, whitespace-only rejection, truncation over 5000, exact-limit acceptance, missing-title fallback.

Message-guard coverage: valid/invalid `REQUEST_SELECTION`, valid/invalid `CAPTURE_SELECTION`, non-object rejection, valid payload, empty-text rejection, wrong source type, http/https/file acceptance, browser-internal-page rejection.

Build verification: `npm run build:extension` → `tsc --noEmit` clean, app pass emits `background.js` (ESM) + `sidepanel.js` + HTML/CSS, content pass emits `content.js` (IIFE, **0 import statements**).

## 4. Real-page manual validation (7/7)

| # | Page / scenario | Expected | Result |
| --- | --- | --- | --- |
| 1 | Wikipedia *Photosynthesis* — select first paragraph | Text + title + count | ✅ |
| 2 | NCERT / educational article — select paragraph | Correct capture | ✅ |
| 3 | Long article — multi-paragraph, multi-line selection | Full text preserved, scrollable | ✅ |
| 4 | Selection > 5000 characters | Truncation warning, count = 5000 | ✅ |
| 5 | Nothing selected → click icon | Empty-state fallback | ✅ |
| 6 | Clear selection → re-highlight → Capture selection | Resets then re-captures | ✅ |
| 7 | `chrome://extensions` active → click icon | Unsupported-page message, no crash | ✅ |

Evidence: page console showed `[StudyLens content] ready on https://en.wikipedia.org/wiki/Photosynthesis` and `[StudyLens content] capture, chars = 976`; side panel rendered the matching paragraph with "Selected text" badge, page title, and "976 characters".

## 5. Permissions justification

| Permission | Why it is needed |
| --- | --- |
| `sidePanel` | Required to declare and open the Chrome Side Panel (the chosen interaction model). |
| `activeTab` | Grants temporary access to the page the user explicitly acted on via the toolbar. |
| `tabs` | Needed to read `tab.url` of the active tab to detect unsupported pages (`chrome://`, Web Store) and to resolve the correct target tab for capture. |
| Content-script matches `http://*/*`, `https://*/*` | The content script must be present on ordinary webpages to read the selection. No `<all_urls>` host permission is requested. |

Not requested: `scripting` (no programmatic injection), `storage` (nothing persisted), `history`, `cookies`, `webRequest`, broad host permissions.

## 6. Problems encountered and resolved

| Problem | Root cause | Resolution |
| --- | --- | --- |
| "Side panel file path must exist" | Manifest pointed at `sidepanel.html`; Vite emitted `src/sidepanel/index.html` | Corrected `default_path` |
| `The message port closed before a response was received` | Background used `sender.tab.id`, which is undefined for side-panel messages, so capture went to the wrong tab | Resolve target via `chrome.tabs.query({active:true,currentWindow:true})`; reply with `sendResponse` |
| `Cannot use import statement outside a module` | Content script bundled as ESM with a shared chunk; Chrome runs content scripts as classic scripts | Separate single-input Vite pass emitting IIFE; pure logic split into `capture.ts` |
| `inlineDynamicImports` build conflict | Vite forces that flag for IIFE output, illegal with multiple inputs | Two independent build passes |
| Extension test runner failures (ESM/CJS) | Tests compiled without their dependencies into an ESM package | Compile tests **and** deps to `dist-tests/` with a `{"type":"commonjs"}` marker |

## 7. Known limitations (carried forward)

- No AI processing: `POST /api/v1/process` still returns `INTERNAL_ERROR` by design (Phase 2 / M3).
- The extension makes **no** backend calls in this phase.
- No speech, translation, steps, or reading view yet (Phase 3 / M4).
- No request history or database.
- `MAX_TEXT_LENGTH` is duplicated as a local constant in `capture.ts` to keep the content script dependency-free; it mirrors the shared contract value of 5000.
- Automated tests cover pure logic only; browser messaging is verified manually.

## 8. Decisions unchanged

Chrome desktop · Chrome Side Panel · Selected-text-first · provider-independent AI adapter · no raw-text persistence · NCERT-style educational HTML as primary scope.

## 9. Next phase

**Phase 2 (M2/M3): Backend skeleton hardening and first AI vertical slice** — provider adapter, real `/api/v1/process` implementation, extension → backend wiring, and the first genuine Simplify result.