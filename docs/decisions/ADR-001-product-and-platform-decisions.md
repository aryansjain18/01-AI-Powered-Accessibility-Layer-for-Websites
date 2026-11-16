
# ADR-001: Product and Platform Decisions

## Status

Accepted

## Context

StudyLens requires clear decisions on its target platform, interaction model, AI architecture, and technical constraints to ensure a focused MVP development effort.

## Decisions

### 1. AI Provider and Model

- **Decision:** Use a provider-independent AI adapter pattern.
- **Development configuration:** OpenAI GPT-4o-mini is the initially selected development model.
- **Reasoning:** The adapter allows switching between providers such as OpenAI, Anthropic, or local models without changing extension or core backend logic.
- **Implementation status:** AI provider integration is not implemented in Phase 0. The model configuration is preparatory only.

### 2. Initial Platform

- **Decision:** Chrome Desktop using Manifest V3.
- **Reasoning:** Chrome Desktop provides a stable initial platform for educational web browsing. Mobile and Firefox support are outside the MVP scope.

### 3. Supported Content

- **Decision:** NCERT and educational HTML pages first.
- **Reasoning:** Educational pages provide a focused starting point for reliable text extraction. General web support can be expanded later.

### 4. Primary Interaction Model

- **Decision:** Chrome Side Panel.
- **Reasoning:** The Side Panel provides sufficient vertical space for explanations and step-by-step guidance while remaining connected to the active tab.

### 5. Initial Processing Path

- **Decision:** Selected Text First.
- **Reasoning:** Selected text provides a deterministic input and reduces the complexity of page-level extraction.

### 6. Request History and Privacy

- **Decision:** No raw-text persistence by default.
- **Reasoning:** This minimizes privacy risks and storage requirements. Metadata-only logging may be used for debugging, but submitted content and generated output must not be logged.

## Consequences

- The backend will use an adapter interface for AI providers.
- The extension will use the Chrome Side Panel API.
- Initial content extraction will prioritize educational HTML.
- The shared API contract will remain the source of truth for request validation.
- AI integration is a later implementation task.
- Privacy documentation must distinguish policy from behaviour already verified in code.
