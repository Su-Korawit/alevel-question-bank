export interface Question {
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

export interface SubjectMeta {
  subject: string;
  label: string;
  years: string[];
  questionCounts: Record<string, number>;
}

export interface IndexFile {
  version: number;
  generatedAt: string;
  subjects: SubjectMeta[];
}

export interface SubjectYearFile {
  subject: string;
  year: string;
  generatedAt: string;
  questions: Question[];
}
