import { useState, useCallback, useEffect } from 'react';

interface ProgressState {
  seenIds: Set<string>;
  correctIds: Set<string>;
  currentIndex: number;
}

function loadProgress(key: string): ProgressState {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { seenIds: new Set(), correctIds: new Set(), currentIndex: 0 };
    const parsed = JSON.parse(raw);
    return {
      seenIds: new Set(parsed.seenIds ?? []),
      correctIds: new Set(parsed.correctIds ?? []),
      currentIndex: parsed.currentIndex ?? 0,
    };
  } catch {
    return { seenIds: new Set(), correctIds: new Set(), currentIndex: 0 };
  }
}

function saveProgress(key: string, state: ProgressState) {
  localStorage.setItem(
    key,
    JSON.stringify({
      seenIds: Array.from(state.seenIds),
      correctIds: Array.from(state.correctIds),
      currentIndex: state.currentIndex,
    })
  );
}

export function useProgress(subject: string | null, year: string | null) {
  const storageKey = subject && year ? `progress_${subject}_${year}` : '';

  const [progress, setProgress] = useState<ProgressState>(() =>
    storageKey ? loadProgress(storageKey) : { seenIds: new Set(), correctIds: new Set(), currentIndex: 0 }
  );

  const update = useCallback(
    (fn: (prev: ProgressState) => ProgressState) => {
      setProgress((prev) => {
        const next = fn(prev);
        if (storageKey) saveProgress(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  // Reload progress from localStorage when subject/year changes
  useEffect(() => {
    if (storageKey) {
      setProgress(loadProgress(storageKey));
    } else {
      setProgress({ seenIds: new Set(), correctIds: new Set(), currentIndex: 0 });
    }
  }, [storageKey]);

  const markSeen = useCallback(
    (id: string) => {
      update((prev) => {
        if (prev.seenIds.has(id)) return prev;
        const next = { ...prev, seenIds: new Set(prev.seenIds).add(id) };
        return next;
      });
    },
    [update]
  );

  const markCorrect = useCallback(
    (id: string) => {
      update((prev) => {
        if (prev.correctIds.has(id)) return prev;
        return { ...prev, correctIds: new Set(prev.correctIds).add(id) };
      });
    },
    [update]
  );

  const setIndex = useCallback(
    (index: number) => {
      update((prev) => ({ ...prev, currentIndex: index }));
    },
    [update]
  );

  const reset = useCallback(() => {
    const fresh: ProgressState = { seenIds: new Set(), correctIds: new Set(), currentIndex: 0 };
    if (storageKey) saveProgress(storageKey, fresh);
    setProgress(fresh);
  }, [storageKey]);

  return {
    currentIndex: progress.currentIndex,
    seenCount: progress.seenIds.size,
    correctCount: progress.correctIds.size,
    isSeen: (id: string) => progress.seenIds.has(id),
    isCorrect: (id: string) => progress.correctIds.has(id),
    markSeen,
    markCorrect,
    setIndex,
    reset,
  };
}
