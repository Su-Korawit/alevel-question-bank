# คลังข้อสอบ A-Level TCAS 2568

ระบบดึงและแสดงข้อสอบ A-Level จากไฟล์ PDF อย่างเป็นทางการของ TCAS 2568 โดยใช้ Gemini Vision API และ React frontend

ข้อมูลข้อสอบมาจาก [mytcas.com/answers](https://www.mytcas.com/answers/)

---

## วิชาที่รองรับ

| วิชา | จำนวนข้อ |
|------|---------|
| ชีววิทยา (bio) | 32 |
| เคมี (chem) | 28 |
| ภาษาอังกฤษ (eng) | 80 |
| คณิตศาสตร์ 1 (math1) | 25 |
| คณิตศาสตร์ 2 (math2) | 25 |
| ฟิสิกส์ (phy) | 24 |
| วิทยาศาสตร์ประยุกต์ (sci) | 26 |
| **รวม** | **240** |

---

## Tech Stack

- **Pipeline**: Node.js + TypeScript (`tsx`)
- **AI Extraction**: Google Gemini 2.5 Flash (Files API + Vision)
- **Storage**: SQLite (`better-sqlite3`) + JSON exports
- **Frontend**: React 19 + Vite
- **Math Rendering**: KaTeX
- **PDF Image Extraction**: pdfjs-dist + node-canvas

---

## Getting Started

### Prerequisites

- Node.js 20+
- Google Gemini API key

### Installation

```bash
npm install
```

Create a `.env` file:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### Run the extraction pipeline

Place PDF files in `pdf/` following the naming convention:
```
tcas68-{subject}-a-level.pdf
```
e.g. `tcas68-math1-a-level.pdf`, `tcas68-eng-a-level.pdf`

Then run:

```bash
npm run pipeline:tsx
```

The pipeline is resumable — it skips already-processed PDFs and reuses cached Gemini file URIs (valid 48h).

### Run the frontend

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
├── pdf/                    # Source PDFs (not committed)
├── pipeline/
│   ├── index.ts            # Main orchestrator
│   ├── config.ts           # Subject/year mapping, PDF discovery
│   ├── gemini.ts           # Gemini Files API + extraction
│   ├── prompt.ts           # Extraction prompt with LaTeX rules
│   ├── extractor.ts        # Validate output, assign stable IDs
│   ├── imageExtractor.ts   # Extract page images from PDF
│   ├── db.ts               # SQLite schema + queries
│   ├── exporter.ts         # SQLite → public/data/*.json
│   └── state.ts            # Resumable pipeline state
├── data/                   # Pipeline state + SQLite (gitignored)
├── public/data/            # Generated JSON exports (gitignored)
└── src/
    ├── App.tsx
    ├── types.ts
    ├── hooks/
    │   ├── useQuestionBank.ts
    │   └── useProgress.ts
    └── components/
        ├── QuestionCard.tsx
        ├── LatexRenderer.tsx
        ├── SubjectFilterBar.tsx
        ├── YearFilterBar.tsx
        ├── ProgressBar.tsx
        └── NavigationControls.tsx
```

---

## Question IDs

Each question has a stable ID: `{subject}_{year}_q{nn}`

Examples: `math1_2568_q01`, `eng_2568_q42`, `bio_2568_q15`

IDs are permanent once assigned and designed for use with external apps (e.g., RPG learning games).

---

## Notes

- Questions Q26–Q30 in Physics are open-ended (not MCQ) and are intentionally skipped
- Bio Q36–Q40 sub-questions (36.1, 36.2 etc.) are non-MCQ and skipped
- LaTeX formulas are rendered inline with KaTeX using `$...$` syntax
- Image extraction for diagram questions currently fails gracefully (pdfjs limitation with embedded raster images in Node.js)
