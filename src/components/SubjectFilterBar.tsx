import type { SubjectMeta } from '../types';
import styles from './SubjectFilterBar.module.css';

interface Props {
  subjects: SubjectMeta[];
  active: string | null;
  onSelect: (subject: string) => void;
}

export function SubjectFilterBar({ subjects, active, onSelect }: Props) {
  return (
    <div className={styles.bar}>
      {subjects.map((s) => (
        <button
          key={s.subject}
          className={`${styles.pill} ${active === s.subject ? styles.active : ''}`}
          onClick={() => onSelect(s.subject)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
