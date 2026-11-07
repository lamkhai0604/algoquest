import { Link } from "react-router";
import styles from "./AppHeader.module.css";
import { cx } from "./cx";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderStats {
  streakDays: number;
  totalXp: number;
  hintsLeft: number;
}

export function AppHeader({ stats }: { stats: HeaderStats }) {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brand}>
        <span className={styles.logo} aria-hidden="true">A</span>
        AlgoQuest
      </Link>
      <div className={styles.stats}>
        <span className={styles.stat} title="Day streak">
          🔥 <strong>{stats.streakDays}</strong>
          <span className={styles.unit}>day streak</span>
        </span>
        <span className={cx(styles.stat, styles.xp)} title="Total XP">
          ★ <strong>{stats.totalXp}</strong>
          <span className={styles.unit}>XP</span>
        </span>
        <span className={styles.stat} title="Hints left">
          💡 <strong>{stats.hintsLeft}</strong>
          <span className={styles.unit}>hints</span>
        </span>
        <ThemeToggle />
      </div>
    </header>
  );
}
