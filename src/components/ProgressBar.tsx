import styles from './ProgressBar.module.css';

interface Props {
  current: number;
  total: number;
  seenCount: number;
  correctCount: number;
  onReset: () => void;
}

export function ProgressBar({ current, total, seenCount, correctCount, onReset }: Props) {
  const pct = total > 0 ? Math.round((seenCount / total) * 100) : 0;
  return (
    <div className={styles.wrap}>
      <div className={styles.stats}>
        <span>ข้อ {current} / {total}</span>
        <span className={styles.dot}>·</span>
        <span>เห็นแล้ว {seenCount} ข้อ</span>
        <span className={styles.dot}>·</span>
        <span className={styles.correct}>ถูก {correctCount}</span>
        {seenCount > 0 && (
          <>
            <span className={styles.dot}>·</span>
            <button className={styles.reset} onClick={onReset}>รีเซ็ต</button>
          </>
        )}
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
