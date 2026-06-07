import styles from './YearFilterBar.module.css';

interface Props {
  years: string[];
  active: string | null;
  onSelect: (year: string) => void;
}

export function YearFilterBar({ years, active, onSelect }: Props) {
  if (years.length <= 1) return null;
  return (
    <div className={styles.bar}>
      <span className={styles.label}>ปีการศึกษา:</span>
      {years.map((y) => (
        <button
          key={y}
          className={`${styles.pill} ${active === y ? styles.active : ''}`}
          onClick={() => onSelect(y)}
        >
          {y}
        </button>
      ))}
    </div>
  );
}
