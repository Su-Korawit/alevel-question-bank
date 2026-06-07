import { useState } from 'react';
import type { Question } from '../types';
import { LatexRenderer } from './LatexRenderer';
import styles from './QuestionCard.module.css';

const CHOICE_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
const CHOICE_COLORS: Record<string, string> = {
  selected_correct: styles.correct,
  selected_wrong: styles.wrong,
  revealed_correct: styles.correct,
};

interface Props {
  question: Question;
  questionNumber: number;
  onAnswered?: (correct: boolean) => void;
}

export function QuestionCard({ question, questionNumber, onAnswered }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  function handleChoice(choice: string) {
    if (selected !== null) return;
    setSelected(choice);
    const correct = choice === question.correctAnswer;
    onAnswered?.(correct);
  }

  function getChoiceClass(choice: string) {
    if (!selected && !revealed) return styles.choice;
    if (choice === question.correctAnswer) return `${styles.choice} ${styles.correct}`;
    if (selected === choice && choice !== question.correctAnswer) return `${styles.choice} ${styles.wrong}`;
    return `${styles.choice} ${styles.dimmed}`;
  }

  const choiceEntries = CHOICE_LABELS
    .filter((label) => question.choices[label])
    .map((label) => ({ label, text: question.choices[label]! }));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.number}>ข้อ {questionNumber}</span>
      </div>

      <div className={styles.questionText}>
        <LatexRenderer text={question.questionText} />
      </div>

      {question.hasImage && question.imagePath && (
        <div className={styles.imageWrap}>
          <img
            src={question.imagePath}
            alt={`Diagram for question ${questionNumber}`}
            className={styles.image}
          />
        </div>
      )}

      <div className={styles.choices}>
        {choiceEntries.map(({ label, text }) => (
          <button
            key={label}
            className={getChoiceClass(label)}
            onClick={() => handleChoice(label)}
            disabled={selected !== null || revealed}
          >
            <span className={styles.choiceLabel}>{label}.</span>
            <LatexRenderer text={text} />
          </button>
        ))}
      </div>

      {!selected && !revealed && (
        <button
          className={styles.revealBtn}
          onClick={() => setRevealed(true)}
        >
          ดูเฉลย
        </button>
      )}

      {(selected !== null || revealed) && (
        <div className={styles.answer}>
          <span className={styles.answerLabel}>เฉลย:</span>
          <span className={styles.answerValue}>{question.correctAnswer}</span>
          {question.explanation && (
            <p className={styles.explanation}>
              <LatexRenderer text={question.explanation} />
            </p>
          )}
        </div>
      )}
    </div>
  );
}
