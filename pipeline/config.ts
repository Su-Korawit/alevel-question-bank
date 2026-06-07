import path from 'path';
import fs from 'fs';

export const YEAR_MAP: Record<string, string> = {
  tcas68: '2568',
  tcas67: '2567',
  tcas66: '2566',
  tcas65: '2565',
  tcas64: '2564',
};

export const SUBJECTS_IN_SCOPE = ['math1', 'math2', 'eng', 'phy', 'bio', 'chem', 'sci'] as const;
export type Subject = (typeof SUBJECTS_IN_SCOPE)[number];

export const SUBJECT_LABELS: Record<Subject, string> = {
  math1: 'คณิตศาสตร์ 1',
  math2: 'คณิตศาสตร์ 2',
  eng: 'ภาษาอังกฤษ',
  phy: 'ฟิสิกส์',
  bio: 'ชีววิทยา',
  chem: 'เคมี',
  sci: 'วิทยาศาสตร์ประยุกต์',
};

export interface PdfDescriptor {
  filename: string;
  subject: Subject;
  year: string;
  filepath: string;
}

export const ROOT_DIR = path.resolve('D:\\Ikkyusan\\Desktop\\A-Level');
export const PDF_DIR = path.join(ROOT_DIR, 'pdf');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data');
export const IMAGES_DIR = path.join(PUBLIC_DATA_DIR, 'images');
export const DB_PATH = path.join(DATA_DIR, 'question-bank.sqlite');
export const STATE_PATH = path.join(DATA_DIR, 'pipeline-state.json');
export const ERRORS_DIR = path.join(DATA_DIR, 'errors');

export function discoverPdfs(): PdfDescriptor[] {
  const files = fs.readdirSync(PDF_DIR);
  const results: PdfDescriptor[] = [];

  for (const filename of files) {
    const match = filename.match(/^tcas(\d+)-(.+)-a-level\.pdf$/);
    if (!match) continue;

    const tcasKey = `tcas${match[1]}`;
    const subjectRaw = match[2] as Subject;

    if (!YEAR_MAP[tcasKey]) continue;
    if (!SUBJECTS_IN_SCOPE.includes(subjectRaw)) continue;

    results.push({
      filename,
      subject: subjectRaw,
      year: YEAR_MAP[tcasKey],
      filepath: path.join(PDF_DIR, filename),
    });
  }

  return results.sort((a, b) => a.subject.localeCompare(b.subject));
}
