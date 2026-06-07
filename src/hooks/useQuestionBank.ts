import { useState, useEffect, useRef } from 'react';
import type { IndexFile, SubjectMeta, Question } from '../types';

interface QuestionBankState {
  index: IndexFile | null;
  subjects: SubjectMeta[];
  questions: Question[];
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, Question[]>();

export function useQuestionBank(subject: string | null, year: string | null) {
  const [state, setState] = useState<QuestionBankState>({
    index: null,
    subjects: [],
    questions: [],
    loading: true,
    error: null,
  });

  // Load index.json once
  useEffect(() => {
    fetch('/data/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load index.json: ${r.status}`);
        return r.json() as Promise<IndexFile>;
      })
      .then((index) => {
        setState((s) => ({ ...s, index, subjects: index.subjects, loading: false }));
      })
      .catch((e: Error) => {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      });
  }, []);

  // Load subject+year JSON when selection changes
  useEffect(() => {
    if (!subject || !year) {
      setState((s) => ({ ...s, questions: [] }));
      return;
    }

    const key = `${subject}_${year}`;
    if (cache.has(key)) {
      setState((s) => ({ ...s, questions: cache.get(key)! }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));
    fetch(`/data/${key}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${key}.json: ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const questions: Question[] = data.questions;
        cache.set(key, questions);
        setState((s) => ({ ...s, questions, loading: false }));
      })
      .catch((e: Error) => {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      });
  }, [subject, year]);

  return state;
}
