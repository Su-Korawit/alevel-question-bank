import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_PATH, DATA_DIR } from './config.js';

export interface QuestionRow {
  id: string;
  subject: string;
  year: string;
  number: number;
  question_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e: string | null;
  correct_answer: string;
  has_image: number;
  image_path: string | null;
  page_number: number | null;
  explanation: string | null;
  source_pdf: string;
  created_at: string;
}

let _db: Database.Database | null = null;

export function openDatabase(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
      id            TEXT PRIMARY KEY,
      subject       TEXT NOT NULL,
      year          TEXT NOT NULL,
      number        REAL NOT NULL,
      question_text TEXT NOT NULL,
      choice_a      TEXT NOT NULL,
      choice_b      TEXT NOT NULL,
      choice_c      TEXT NOT NULL,
      choice_d      TEXT NOT NULL,
      choice_e      TEXT,
      correct_answer TEXT NOT NULL,
      has_image     INTEGER NOT NULL DEFAULT 0,
      image_path    TEXT,
      page_number   INTEGER,
      explanation   TEXT,
      source_pdf    TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_subject_year_number
      ON questions(subject, year, number);
    CREATE INDEX IF NOT EXISTS idx_subject_year
      ON questions(subject, year);
  `);
  return _db;
}

export function insertQuestion(db: Database.Database, q: Omit<QuestionRow, 'created_at'>): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO questions
      (id, subject, year, number, question_text, choice_a, choice_b, choice_c, choice_d,
       choice_e, correct_answer, has_image, image_path, page_number, explanation, source_pdf)
    VALUES
      (@id, @subject, @year, @number, @question_text, @choice_a, @choice_b, @choice_c, @choice_d,
       @choice_e, @correct_answer, @has_image, @image_path, @page_number, @explanation, @source_pdf)
  `);
  stmt.run(q);
}

export function getAllBySubjectYear(
  db: Database.Database,
  subject: string,
  year: string
): QuestionRow[] {
  return db
    .prepare('SELECT * FROM questions WHERE subject = ? AND year = ? ORDER BY number ASC')
    .all(subject, year) as QuestionRow[];
}

export function getDistinctSubjectYears(
  db: Database.Database
): Array<{ subject: string; year: string; count: number }> {
  return db
    .prepare(
      'SELECT subject, year, COUNT(*) as count FROM questions GROUP BY subject, year ORDER BY subject, year'
    )
    .all() as Array<{ subject: string; year: string; count: number }>;
}
