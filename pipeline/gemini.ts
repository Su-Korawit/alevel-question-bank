import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import fs from 'fs';
import path from 'path';
import { SYSTEM_INSTRUCTION, buildUserMessage } from './prompt.js';
import type { Subject } from './config.js';
import { ERRORS_DIR } from './config.js';

export interface RawQuestion {
  number: number;
  questionText: string;
  choices: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string | null;
  };
  correctAnswer: string;
  hasImage: boolean;
  pageNumber: number | null;
  explanation: string | null;
}

function getApiKey(): string {
  const key = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('No Gemini API key found. Set VITE_GEMINI_API_KEY in .env');
  return key;
}

export async function uploadPdf(filepath: string, displayName: string): Promise<string> {
  const fileManager = new GoogleAIFileManager(getApiKey());
  console.log(`  Uploading ${path.basename(filepath)}...`);
  const result = await fileManager.uploadFile(filepath, {
    mimeType: 'application/pdf',
    displayName,
  });
  console.log(`  Uploaded → ${result.file.uri}`);
  return result.file.uri;
}

export async function extractQuestionsFromPdf(
  fileUri: string,
  subject: Subject,
  year: string,
  sourcePdf: string
): Promise<RawQuestion[]> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
    },
  });

  console.log(`  Extracting questions from ${subject} ${year}...`);
  const result = await model.generateContent([
    {
      fileData: {
        mimeType: 'application/pdf',
        fileUri,
      },
    },
    buildUserMessage(subject, year),
  ]);

  const raw = result.response.text().trim();

  // Strip markdown fences if Gemini adds them despite instructions
  let cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

  // Gemini sometimes emits single backslashes in LaTeX (e.g. \circ) which are invalid
  // JSON escape sequences. Fix by consuming each \X pair and doubling only invalid ones.
  // This correctly handles \\circ (valid \\) vs \circ (invalid \c).
  cleaned = cleaned.replace(/\\([\s\S])/g, (_, ch) => {
    if ('"\\\/bfnrtu'.includes(ch)) return '\\' + ch; // valid JSON escape — leave alone
    return '\\\\' + ch; // invalid — double the backslash
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    if (!fs.existsSync(ERRORS_DIR)) fs.mkdirSync(ERRORS_DIR, { recursive: true });
    const errFile = path.join(ERRORS_DIR, `${sourcePdf}.raw.txt`);
    fs.writeFileSync(errFile, raw, 'utf-8');
    throw new Error(`Gemini returned invalid JSON for ${sourcePdf}. Raw saved to ${errFile}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Gemini response is not an array for ${sourcePdf}`);
  }

  return parsed as RawQuestion[];
}
