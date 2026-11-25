# Gemini Decisions Studio

An interactive, responsive multimodal decision-making, calibration, and deterministic routing workbench built with **Next.js**, **TypeScript**, and the **Gemini Decisions API** (`gemini-decision-1` on `v1beta`).

Designed around the core principles of the [Gemini Decisions API](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/): evaluate 1 to 1,000 independent closed-ended questions in one forward pass over shared multimodal input, returning calibrated probabilities, confidence scores, and **0 output tokens**.

## Features

- **All 3 Decisions API Question Types**:
  - **`noul` (Yes/No)**: Calibrated probability `P(yes)` in `[0.01, 0.99]` with `confidence` and optional `true_description` / `false_description` criteria.
  - **`choice` (Single-Select)**: Scores 2–255 fixed option IDs with normalized probabilities summing to `1` and `confidence`.
  - **`score` (Ordered Rubric)**: Evaluates 2–255 ordered rubric levels, returning the probability-weighted expected `score`, per-level `probabilities`, `legend`, and `confidence`.
- **Multimodal Shared Input**:
  - Plain text and serialized JSON (with one-click formatting).
  - Drag-and-drop or browse **images** (`PNG`, `JPEG`, `WEBP`, `GIF`, etc.), **PDFs** (`application/pdf`), **audio** (`WAV`, `MP3`, `OGG`, `WEBM`), and **video** (`MP4`, `WEBM`).
  - Attach public or signed **HTTPS media URLs** and tune `resolution` (`low`, `medium`, `high`, `ultra_high`) for images and video.
- **4 Prebuilt Domain Workflows**:
  1. **Support & Refund Triage** (JSON order + customer message → defect check, action routing, churn risk)
  2. **Doorstep Parcel Visual Audit** (generated sample PNG + courier note → damage detection, placement zone, quality score)
  3. **Invoice & PDF Compliance Gate** (PDF/invoice text → PO number check, expense category, audit risk)
  4. **Agent Router & Policy Guardrail** (prompt safety gate + specialist agent selection + complexity score)
- **Deterministic Policy Composition**:
  - Compose `AND` / `OR` routing rules in code over `.noul`, `.confidence`, `.score`, and `.choice` with per-condition evaluation traces and configurable fallback actions.
- **Zero-Output-Token Telemetry & Cost Estimator**:
  - Reports request latency, `0` output tokens, per-modality input token breakdown (`text`, `image`, `audio`), and Paid Tier cost estimation (`$0.10 / 1M` input tokens).
- **Live API + Offline Simulator**:
  - Runs live against `ai.decisions.create({ model: "gemini-decision-1", ... })` when `GEMINI_API_KEY` is provided (via `.env.local` or the UI connection modal).
  - Includes a built-in deterministic Simulator Mode for offline testing and threshold tuning without spending quota.
- **Code & cURL Exporter**:
  - Generates ready-to-copy **TypeScript (`@google/genai`)**, **Python (`google-genai`)**, and **REST (`cURL`)** snippets for your active input and question schema.
- **Responsive Multi-Device UI**:
  - **Mobile (`< 768px`)**: Section switcher (`All`, `Input`, `Questions`, `Rules`, `Results`) plus a sticky bottom evaluation bar.
  - **Tablet (`768px–1279px`)**: 2-column layout with a sticky Results pane.
  - **Desktop & Ultrawide (`1280px+`)**: Full 3-column workbench.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode)
- **AI SDK**: `@google/genai` (`apiVersion: "v1beta"`, model: `gemini-decision-1`)
- **Styling**: Tailwind CSS v4 + `lucide-react`
- **Testing**: Vitest

## Project Structure

```text
gemini-decisions-studio/
├── src/
│   ├── app/
│   │   ├── api/decisions/route.ts   # GET status & POST evaluate endpoint
│   │   ├── globals.css              # Tailwind v4 & dark workbench styles
│   │   ├── icon.svg                 # App SVG favicon
│   │   ├── layout.tsx               # Root layout & metadata
│   │   └── page.tsx                 # Responsive 3-column studio page
│   ├── components/
│   │   ├── ApiKeyModal.tsx          # Connection & Simulator mode settings
│   │   ├── CodeExportModal.tsx      # TypeScript / Python / cURL exporter
│   │   ├── InputComposer.tsx        # Text/JSON & multimodal input composer
│   │   ├── QuestionBuilder.tsx      # noul / choice / score question editor
│   │   ├── ResultsPanel.tsx         # Telemetry, probability bars & history
│   │   └── RuleBuilder.tsx          # Deterministic policy rule builder
│   └── lib/decisions/
│       ├── __tests__/decisions.test.ts
│       ├── code-generator.ts        # SDK & REST snippet generators
│       ├── rule-engine.ts           # Deterministic threshold rule evaluator
│       ├── sample-media.ts          # Client-side canvas PNG sample generator
│       ├── simulator.ts             # Offline calibrated response simulator
│       ├── templates.ts             # Curated domain templates
│       ├── types.ts                 # Shared request/response/rule types
│       └── validation.ts            # Key, option & payload validation
├── .editorconfig
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── vitest.config.mjs
```

## Getting Started

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local` and add your Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey):

```powershell
Copy-Item .env.example .env.local
```

```env
GEMINI_API_KEY=your_api_key_here
```

> **Note:** Even without `GEMINI_API_KEY`, the app works immediately in **Simulator Mode**, or you can paste a session key inside the UI via the **Simulator Mode** button in the header.

### 2. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or specify a custom port with `npx next dev -p 3010`).

### 3. Run Tests & Production Build

```bash
npx tsc --noEmit
npm test
npm run build
npm start
```

## API Endpoints

- `GET /api/decisions` — Returns `{ hasServerApiKey, model: "gemini-decision-1", apiVersion: "v1beta" }`.
- `POST /api/decisions` — Accepts `{ inputBlocks, questions, forceSimulate? }` and optional `x-gemini-api-key` header. Validates all question keys (`[A-Za-z0-9_-]{1,64}`), option keys, and rubric levels before calling `ai.decisions.create(...)` or the local simulator.

## License

This project is licensed under the [MIT License](LICENSE).
