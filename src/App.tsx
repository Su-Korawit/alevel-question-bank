import { useState, useEffect } from 'react';
import { useQuestionBank } from './hooks/useQuestionBank';
import { useProgress } from './hooks/useProgress';
import { SubjectFilterBar } from './components/SubjectFilterBar';
import { YearFilterBar } from './components/YearFilterBar';
import { ProgressBar } from './components/ProgressBar';
import { QuestionCard } from './components/QuestionCard';
import { NavigationControls } from './components/NavigationControls';
import styles from './App.module.css';

export function App() {
  const [subject, setSubject] = useState<string | null>(null);
  const [year, setYear] = useState<string | null>(null);

  const { index, subjects, questions, loading, error } = useQuestionBank(subject, year);
  const progress = useProgress(subject, year);

  // Auto-select first year when subject changes
  useEffect(() => {
    if (!subject || !index) return;
    const meta = index.subjects.find((s) => s.subject === subject);
    if (meta && meta.years.length > 0) {
      setYear(meta.years[meta.years.length - 1]); // latest year
    }
  }, [subject, index]);

  // Auto-select first subject once index loads
  useEffect(() => {
    if (subjects.length > 0 && !subject) {
      setSubject(subjects[0].subject);
    }
  }, [subjects, subject]);

  const currentQuestion = questions[progress.currentIndex] ?? null;
  const availableYears =
    subject && index
      ? (index.subjects.find((s) => s.subject === subject)?.years ?? [])
      : [];

  function handleSubjectSelect(s: string) {
    setSubject(s);
    setYear(null);
  }

  function handlePrev() {
    if (progress.currentIndex > 0) {
      progress.setIndex(progress.currentIndex - 1);
    }
  }

  function handleNext() {
    if (progress.currentIndex < questions.length - 1) {
      const nextIdx = progress.currentIndex + 1;
      progress.setIndex(nextIdx);
      progress.markSeen(questions[nextIdx].id);
    }
  }

  function handleAnswered(correct: boolean) {
    if (!currentQuestion) return;
    progress.markSeen(currentQuestion.id);
    if (correct) progress.markCorrect(currentQuestion.id);
  }

  // Mark first question seen on load
  useEffect(() => {
    if (questions.length > 0 && questions[0]) {
      progress.markSeen(questions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, year, questions.length]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>คลังข้อสอบ A-Level</h1>
        <p className={styles.subtitle}>TCAS 2568</p>
      </header>

      <main className={styles.main}>
        {loading && !subjects.length && (
          <div className={styles.loading}>กำลังโหลด...</div>
        )}

        {error && (
          <div className={styles.error}>
            <strong>ไม่พบข้อมูล:</strong> {error}
            <p className={styles.errorHint}>กรุณารัน pipeline ก่อน: <code>npx tsx pipeline/index.ts</code></p>
          </div>
        )}

        {subjects.length > 0 && (
          <>
            <SubjectFilterBar
              subjects={subjects}
              active={subject}
              onSelect={handleSubjectSelect}
            />

            <YearFilterBar
              years={availableYears}
              active={year}
              onSelect={setYear}
            />

            {questions.length > 0 && (
              <ProgressBar
                current={progress.currentIndex + 1}
                total={questions.length}
                seenCount={progress.seenCount}
                correctCount={progress.correctCount}
                onReset={progress.reset}
              />
            )}

            {loading && <div className={styles.loading}>กำลังโหลดข้อสอบ...</div>}

            {!loading && questions.length === 0 && subject && year && (
              <div className={styles.empty}>ยังไม่มีข้อสอบสำหรับวิชานี้</div>
            )}

            {!loading && currentQuestion && (
              <>
                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  questionNumber={currentQuestion.number}
                  onAnswered={handleAnswered}
                />
                <NavigationControls
                  currentIndex={progress.currentIndex}
                  total={questions.length}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              </>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <span className={styles.footerText}>ข้อสอบจาก</span>
        <a
          href="https://www.mytcas.com/answers/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          <img
            src="https://www.mytcas.com/img/logo69-alt.svg"
            alt="mytcas.com"
            className={styles.footerLogo}
          />
        </a>
      </footer>
    </div>
  );
}
