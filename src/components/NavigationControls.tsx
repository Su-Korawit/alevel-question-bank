import styles from './NavigationControls.module.css';

interface Props {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function NavigationControls({ currentIndex, total, onPrev, onNext }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        className={styles.btn}
        onClick={onPrev}
        disabled={currentIndex === 0}
        aria-label="ข้อก่อนหน้า"
      >
        ← ก่อนหน้า
      </button>
      <span className={styles.counter}>
        {currentIndex + 1} / {total}
      </span>
      <button
        className={styles.btn}
        onClick={onNext}
        disabled={currentIndex >= total - 1}
        aria-label="ข้อถัดไป"
      >
        ถัดไป →
      </button>
    </div>
  );
}
