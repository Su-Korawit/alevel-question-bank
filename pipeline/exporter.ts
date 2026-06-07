import fs from 'fs';
import path from 'path';
import type Database from 'better-sqlite3';
import {
  getAllBySubjectYear,
  getDistinctSubjectYears,
  type QuestionRow,
} from './db.js';
import { SUBJECT_LABELS, PUBLIC_DATA_DIR, type Subject } from './config.js';

export interface QuestionJson {
  id: string;
  subject: string;
  year: string;
  number: number;
  questionText: string;
  choices: { A: string; B: string; C: string; D: string; E?: string };
  correctAnswer: string;
  hasImage: boolean;
  imagePath: string | null;
  pageNumber: number | null;
  explanation: string | null;
}

export interface SubjectYearFile {
  subject: string;
  year: string;
  generatedAt: string;
  questions: QuestionJson[];
}

export interface IndexFile {
  version: number;
  generatedAt: string;
  subjects: Array<{
    subject: string;
    label: string;
    years: string[];
    questionCounts: Record<string, number>;
  }>;
}

function rowToJson(row: QuestionRow): QuestionJson {
  return {
    id: row.id,
    subject: row.subject,
    year: row.year,
    number: row.number,
    questionText: row.question_text,
    choices: {
      A: row.choice_a,
      B: row.choice_b,
      C: row.choice_c,
      D: row.choice_d,
      ...(row.choice_e ? { E: row.choice_e } : {}),
    },
    correctAnswer: row.correct_answer,
    hasImage: row.has_image === 1,
    imagePath: row.image_path,
    pageNumber: row.page_number,
    explanation: row.explanation,
  };
}

export function exportAllToJson(db: Database.Database): void {
  if (!fs.existsSync(PUBLIC_DATA_DIR)) {
    fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
  }

  const pairs = getDistinctSubjectYears(db);
  const now = new Date().toISOString();

  // Group by subject for the index
  const subjectMap = new Map<string, { years: string[]; counts: Record<string, number> }>();

  for (const { subject, year, count } of pairs) {
    const rows = getAllBySubjectYear(db, subject, year);
    const questions = rows.map(rowToJson);

    const outFile: SubjectYearFile = { subject, year, generatedAt: now, questions };
    const outPath = path.join(PUBLIC_DATA_DIR, `${subject}_${year}.json`);
    fs.writeFileSync(outPath, JSON.stringify(outFile, null, 2), 'utf-8');
    console.log(`  Exported ${subject}_${year}.json (${count} questions)`);

    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { years: [], counts: {} });
    }
    const entry = subjectMap.get(subject)!;
    entry.years.push(year);
    entry.counts[year] = count;
  }

  // Build index.json
  const subjects = Array.from(subjectMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([subject, { years, counts }]) => ({
      subject,
      label: SUBJECT_LABELS[subject as Subject] ?? subject,
      years: years.sort(),
      questionCounts: counts,
    }));

  const index: IndexFile = { version: 1, generatedAt: now, subjects };
  fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
  console.log('  Exported index.json');
}
