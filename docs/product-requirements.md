# StudyLens Product Requirements Document (PRD)

## 1. Project Vision
StudyLens is an AI-powered learning and accessibility assistant delivered through a browser extension. It helps learners understand difficult educational webpage content by turning selected or relevant page text into clearer explanations, translations, audio, and step-by-step guidance.

**Product Principle:** StudyLens should help the learner understand and act—not merely display a polished panel.

## 2. Problem Statement
Educational pages often contain dense language, unfamiliar terms, long paragraphs, and instructions that are difficult for some learners to process. Learners may need the same material simplified, translated, read aloud, or broken into manageable steps.

## 3. Target Users
- Students learning from NCERT and other educational webpages.
- Learners who benefit from plain-language explanations and smaller steps.
- Learners who prefer Hindi or Kannada alongside English.
- Users who benefit from adjustable reading presentation and text-to-speech.

## 4. Core User Journeys

### Journey A — Selected Text
1. Learner opens a supported webpage.
2. Learner selects a paragraph.
3. StudyLens detects the selection and opens its panel.
4. Learner chooses Simplify, Explain, Translate, or Guide me.
5. Extension sends the selected text and action to the backend.
6. Backend validates input and invokes the configured AI provider.
7. A structured result appears in the panel.
8. Learner can copy the result or listen to it.

### Journey B — Page-Level Reading
1. Learner opens StudyLens.
2. Extension extracts the main readable content and page structure.
3. Learner chooses a page-level action.
4. The backend processes only the relevant content, subject to size limits.
5. The result is displayed with a clear indication of whether it represents selected text or page content.

### Journey C — Guided Steps
1. Learner selects an instruction or process.
2. Chooses Guide me.
3. AI returns concise numbered steps.
4. Learner marks steps complete in the UI.
5. The UI never claims to have performed an external action.

## 5. MVP Features & Priorities

| Feature | Required MVP Behaviour | Priority |
| :--- | :--- | :--- |
| **Simplify selected text** | Send selected text to the AI service and return a faithful plain-language rewrite. Preserve key facts and meaning. | P0 |
| **Explain selected text** | Explain the passage in learner-friendly language; define difficult terms when useful. | P0 |
| **Translate** | Translate selected text or a chosen page section into English, Hindi, or Kannada. Clearly identify the target language. | P0 |
| **Listen** | Read the current original or generated text aloud; provide play/pause or stop and sensible voice/language options. | P0 |
| **Step-by-step guide** | Turn a process, instruction, or complex explanation into ordered, actionable steps grounded in the source. | P0 |
| **Page understanding** | Extract page title, URL, headings, main text, links, buttons, forms, and tables where relevant. | P0 |
| **Clear reading view** | Present extracted/selected content in a focused, readable view with adjustable font size and contrast/theme. | P1 |
| **Request history** | Optional minimal history for debugging or user continuity; avoid storing page content by default. | P2 |

## 6. Out of Scope for First MVP
- Autonomous clicking, form submission, purchasing, or navigating websites on the user's behalf.
- A full LMS, student account system, analytics dashboard, or social features.
- Training a custom foundation model.
- Complex PDF OCR, scanned-document understanding, or guaranteed support for every website.
- A separate microservice for every feature. Keep the first architecture small and testable.

## 7. Initial Supported Content Scope
- Primary focus: NCERT-style educational HTML pages.
- Secondary focus: Ordinary text-based webpages.
- Excluded: Embedded PDFs, scanned documents, highly dynamic single-page applications (SPAs) without static text equivalents.

## 8. Definition of Done (MVP)
- A new developer can clone the repository, install dependencies, configure environment variables, run tests, and launch the MVP using only the README.
- The extension loads in Chrome through the documented unpacked-extension workflow.
- A learner can select real webpage text and receive a genuine AI-generated simplification.
- Explain, translation, and guided steps operate on the provided text—not hardcoded example content.
- Hindi and Kannada translation can be demonstrated with real input text.
- Speech reads the displayed result and can be stopped reliably.
- The system handles empty selection, unsupported pages, very long text, offline backend, invalid action, and AI-provider failure.
- No API keys or secrets are present in the extension bundle or Git history.
- There is one canonical API contract, one active UI implementation, and no unused duplicate server/feature implementations.