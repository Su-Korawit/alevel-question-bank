import type { RawQuestion } from './gemini.js';
import type { QuestionRow } from './db.js';
import type { Subject } from './config.js';

function buildId(subject: string, year: string, number: number): string {
  // Handle decimal question numbers like 36.1 → q36_1
  if (!Number.isInteger(number)) {
    const [main, sub] = String(number).split('.');
    return `${subject}_${year}_q${String(main).padStart(2, '0')}_${sub ?? '0'}`;
  }
  return `${subject}_${year}_q${String(number).padStart(2, '0')}`;
}

function isValidAnswer(answer: string): boolean {
  return ['A', 'B', 'C', 'D', 'E'].includes(answer.toUpperCase());
}

export interface ValidationError {
  index: number;
  number: number | null;
  reason: string;
}

export interface ExtractionResult {
  valid: Array<Omit<QuestionRow, 'created_at'>>;
  errors: ValidationError[];
}

export function processRawQuestions(
  raw: RawQuestion[],
  subject: Subject,
  year: string,
  sourcePdf: string
): ExtractionResult {
  const valid: Array<Omit<QuestionRow, 'created_at'>> = [];
  const errors: ValidationError[] = [];
  const seenNumbers = new Set<number>();

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i];

    if (!q || typeof q !== 'object') {
      errors.push({ index: i, number: null, reason: 'Not an object' });
      continue;
    }

    if (typeof q.number !== 'number' || q.number < 1) {
      errors.push({ index: i, number: null, reason: `Invalid number: ${q.number}` });
      continue;
    }

    if (seenNumbers.has(q.number)) {
      errors.push({ index: i, number: q.number, reason: `Duplicate question number: ${q.number}` });
      continue;
    }

    if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim() === '') {
      errors.push({ index: i, number: q.number, reason: 'Empty questionText' });
      continue;
    }

    if (!q.choices || typeof q.choices !== 'object') {
      errors.push({ index: i, number: q.number, reason: 'Missing choices' });
      continue;
    }

    const { A, B, C, D, E } = q.choices;
    if (!A || !B || !C || !D) {
      errors.push({ index: i, number: q.number, reason: 'Missing one or more choices A-D' });
      continue;
    }

    if (!q.correctAnswer || !isValidAnswer(String(q.correctAnswer))) {
      // Some PDFs have questions without a visible answer key — skip with warning
      errors.push({ index: i, number: q.number, reason: `Missing/invalid correctAnswer: ${q.correctAnswer}` });
      continue;
    }

    seenNumbers.add(q.number);

    const id = buildId(subject, year, q.number);
    const imagePath = q.hasImage
      ? `/data/images/${id}.png`
      : null;

    valid.push({
      id,
      subject,
      year,
      number: q.number,
      question_text: q.questionText.trim(),
      choice_a: String(A),
      choice_b: String(B),
      choice_c: String(C),
      choice_d: String(D),
      choice_e: E ? String(E) : null,
      correct_answer: q.correctAnswer.toUpperCase(),
      has_image: q.hasImage ? 1 : 0,
      image_path: imagePath,
      page_number: typeof q.pageNumber === 'number' ? q.pageNumber : null,
      explanation: q.explanation ? String(q.explanation) : null,
      source_pdf: sourcePdf,
    });
  }

  return { valid, errors };
}
