# คลังข้อสอบ A-Level 🌾

A Thai-language **A-Level / TCAS 2568 question bank** with a sunny pixel-farm RPG theme.
Built with React 19, Vite, and TypeScript. Questions are extracted from official PDF answer
sheets via a Google Gemini AI pipeline and served as static JSON.

---

## Features

- 7 subjects — ชีววิทยา, เคมี, ฟิสิกส์, คณิตศาสตร์ 1 & 2, ภาษาอังกฤษ, วิทยาศาสตร์ประยุกต์
- Multiple-choice answers with instant correct / wrong feedback
- Reveal-answer mode (ดูเฉลย) and AI-generated explanations
- Progress tracking (seen / correct) persisted in `localStorage`, per subject & year
- KaTeX rendering for math equations
- Pixel-farm RPG UI — sunny sky, parchment quest board, wooden buttons (CSS-only, no extra deps)
- `prefers-reduced-motion` safe

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, CSS Modules |
| Math rendering | KaTeX |
| Data pipeline | Node.js + `pdfjs-dist` + Google Gemini AI (`@google/generative-ai`) |
| Storage | `better-sqlite3` (pipeline) → static JSON (frontend) |
| Fonts | Press Start 2P (pixel labels) + IBM Plex Sans Thai (Thai body) |

---

## Getting started

### Prerequisites

- Node.js 18+
- A Google Gemini API key (pipeline only)

### 1 — Install dependencies

```bash
npm install
```

### 2 — Run the question extraction pipeline (optional)

> Skip this if `public/data/` already contains JSON files.

Place raw PDF files in `pdf/` then:

```bash
# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Run the pipeline
npm run pipeline:tsx
```

This writes extracted questions to `data/question-bank.sqlite` and exports them to
`public/data/` as JSON files consumed by the frontend.

### 3 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### 4 — Build for production

```bash
npm run build
```

Output goes to `dist/`. The app is a fully static SPA — deploy to any static host
(Vercel, Netlify, GitHub Pages).

---

## Project structure

```
├── public/data/        # Exported question JSON files (frontend source of truth)
├── src/
│   ├── components/     # QuestionCard, ProgressBar, SubjectFilterBar, …
│   ├── hooks/          # useQuestionBank, useProgress
│   ├── types.ts        # Shared TypeScript interfaces
│   └── index.css       # Global farm-theme CSS tokens
├── pipeline/           # PDF → Gemini → SQLite extraction scripts
├── data/               # SQLite database + pipeline state
└── pdf/                # Source PDF files (git-ignored)
```

---

## Data source

Questions sourced from [mytcas.com](https://www.mytcas.com/answers/) — TCAS 2568 official
answer sheets.

---

## License

MIT
