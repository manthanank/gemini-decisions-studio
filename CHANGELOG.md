# Changelog

All notable changes to **Gemini Decisions Studio** will be documented in this file.

## [1.0.0] - 2026-11-25

### Added
- Initial release of **Gemini Decisions Studio** powered by `gemini-decision-1` (`@google/genai` on `v1beta`).
- Full support for `noul`, `choice`, and `score` question types with calibrated probability visualizations.
- Multimodal input composer supporting text, formatted JSON, images, PDFs, audio, video, HTTPS URLs, and per-media resolution settings.
- Four curated domain templates: Support & Refund Triage, Doorstep Parcel Visual Audit, Invoice & PDF Compliance Gate, and Agent Router & Policy Guardrail.
- Deterministic policy composition rule builder with condition-by-condition evaluation traces.
- Built-in offline calibrated Simulator Mode and server-side/session API key management.
- TypeScript, Python, and REST (`cURL`) code export modal.
- Responsive layout across mobile, tablet, laptop, and ultrawide screens.
- Vitest unit test suite covering request validation and deterministic routing rules.
