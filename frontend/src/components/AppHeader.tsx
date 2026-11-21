import { APP_INITIAL, APP_NAME } from "../config/brand";
import { Link, NavLink } from "react-router";
import styles from "./AppHeader.module.css";
import { setLocale, useTranslation } from "../i18n";
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
  /** Marks a visitor's demo account (D-062). */
  isDemo?: boolean;
  onSignOut: () => void;
}

interface AppHeaderProps {
  stats: HeaderStats;
  /** The signed-in user; stats and sign-out are shown only when present. */
  account?: HeaderAccount;
}

export function AppHeader({ stats, account }: AppHeaderProps) {
  const { locale, t } = useTranslation();
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            {APP_INITIAL}
          </span>
          {APP_NAME}
        </Link>
        {account && (
          <nav className={styles.nav} aria-label={t("common.main")}>
            <NavLink to="/" end>
              {t("nav.map")}
            </NavLink>
            <NavLink to="/profile">{t("nav.profile")}</NavLink>
            {account.isAdmin && <NavLink to="/admin">{t("nav.admin")}</NavLink>}
            <NavLink to="/system-design">
              {t("nav.systemDesign")}
              <span className={styles.soon}>{t("nav.soon")}</span>
            </NavLink>
          </nav>
        )}
      </div>
      <div className={styles.stats}>
        {account && (
          <>
            <span className={styles.stat} title={t("game.dayStreakTitle")}>
              🔥 <strong>{stats.streakDays}</strong>
              <span className={styles.unit}>{t("game.dayStreak")}</span>
            </span>
            <span className={cx(styles.stat, styles.xp)} title={t("game.xp")}>
              ★ <strong>{stats.totalXp}</strong>
              <span className={styles.unit}>XP</span>
            </span>
            <span className={styles.stat} title={t("game.hintsLeft")}>
              💡 <strong>{stats.hintsLeft}</strong>
              <span className={styles.unit}>{t("game.hints")}</span>
            </span>
            <Link
              to="/profile"
              className={styles.account}
              aria-label={`${account.name}${t("common.yourProfile")}`}
            >
              <span className={styles.avatar} aria-hidden="true">
                {account.name.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className={styles.name}>{account.name}</span>
            </Link>
            {account.isDemo && (
              <span className={styles.demo}>{t("nav.demo")}</span>
            )}
            <Button variant="ghost" size="sm" onClick={account.onSignOut}>
              {t("nav.signOut")}
            </Button>
          </>
        )}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="sr-only">{t("language.selector")}</span>
          <select
            aria-label={t("language.selector")}
            value={locale}
            onChange={(event) =>
              setLocale(event.target.value === "vi" ? "vi" : "en")
            }
          >
            <option value="en">EN</option>
            <option value="vi">VI</option>
          </select>
        </label>
        <ThemeToggle />
      </div>
    </header>
  );
}
