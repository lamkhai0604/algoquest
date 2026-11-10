import { Link, NavLink } from "react-router";
import styles from "./AppHeader.module.css";
import { Button } from "./Button";
import { cx } from "./cx";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderStats {
  streakDays: number;
  totalXp: number;
  hintsLeft: number;
}

export interface HeaderAccount {
  name: string;
  /** Shows the Admin link (FR-18: users with at least one admin permission). */
  isAdmin?: boolean;
  onSignOut: () => void;
}

interface AppHeaderProps {
  stats: HeaderStats;
  /** The signed-in user; stats and sign-out are shown only when present. */
  account?: HeaderAccount;
}

export function AppHeader({ stats, account }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            A
          </span>
          AlgoQuest
        </Link>
        {account && (
          <nav className={styles.nav} aria-label="Main">
            <NavLink to="/" end>
              Map
            </NavLink>
            <NavLink to="/profile">Profile</NavLink>
            {account.isAdmin && <NavLink to="/admin">Admin</NavLink>}
          </nav>
        )}
      </div>
      <div className={styles.stats}>
        {account && (
          <>
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
            <span className={styles.name}>{account.name}</span>
            <Button variant="ghost" size="sm" onClick={account.onSignOut}>
              Sign out
            </Button>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
