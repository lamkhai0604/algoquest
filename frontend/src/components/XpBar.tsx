import styles from "./XpBar.module.css";

export interface XpBarProps {
  value: number;
  max: number;
  label: string;
}

/** Level progress in XP. The value is clamped to 0..max. */
export function XpBar({ value, max, label }: XpBarProps) {
  const safeMax = Math.max(max, 1);
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((clamped / safeMax) * 100);
  return (
    <div className={styles.wrapper}>
      <div className={styles.labels}>
        <span>{label}</span>
        <span className={styles.amount}>
          {clamped} / {safeMax} XP
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={clamped}
      >
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
