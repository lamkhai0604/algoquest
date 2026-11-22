import { useEffect, useRef, useState, type ReactNode } from "react";
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
  /** The signed-in user; stats and the account menu are shown only when present. */
  account?: HeaderAccount;
}

/**
 * A button that opens a small panel under it. The panel closes on Escape,
 * on a click outside, and when one of its links is followed (D-071).
 */
function Menu({
  label,
  trigger,
  triggerClassName,
  children,
}: {
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className={styles.menu} ref={ref}>
      <button
        type="button"
        className={cx(styles.trigger, triggerClassName)}
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div
          className={styles.panel}
          role="group"
          aria-label={label}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function LanguageSelect() {
  const { locale, t } = useTranslation();
  return (
    <select
      className={styles.select}
      aria-label={t("language.selector")}
      value={locale}
      onChange={(event) => setLocale(event.target.value === "vi" ? "vi" : "en")}
    >
      <option value="en">EN</option>
      <option value="vi">VI</option>
    </select>
  );
}

export function AppHeader({ stats, account }: AppHeaderProps) {
  const { t } = useTranslation();
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            {APP_INITIAL}
          </span>
          <span className={styles.brandName}>{APP_NAME}</span>
        </Link>
        {account && (
          <nav className={styles.nav} aria-label={t("common.main")}>
            <NavLink to="/" end>
              {t("nav.map")}
            </NavLink>
            <NavLink to="/knowledge">{t("nav.knowledge")}</NavLink>
            <NavLink to="/profile">{t("nav.profile")}</NavLink>
            {account.isAdmin && <NavLink to="/admin">{t("nav.admin")}</NavLink>}
          </nav>
        )}
      </div>
      <div className={styles.right}>
        {account ? (
          <>
            <Menu
              label={t("nav.progress")}
              triggerClassName={styles.statsTrigger}
              trigger={
                <>
                  <span
                    className={styles.chip}
                    title={t("game.dayStreakTitle")}
                  >
                    🔥 {stats.streakDays}
                  </span>
                  <span
                    className={cx(styles.chip, styles.xp)}
                    title={t("game.xp")}
                  >
                    ★ {stats.totalXp}
                  </span>
                  <span className={styles.chip} title={t("game.hintsLeft")}>
                    💡 {stats.hintsLeft}
                  </span>
                </>
              }
            >
              <dl className={styles.statList}>
                <div>
                  <dt>🔥 {t("game.dayStreakTitle")}</dt>
                  <dd>
                    {stats.streakDays} {t("nav.streakDays")}
                  </dd>
                </div>
                <div>
                  <dt>★ {t("game.xp")}</dt>
                  <dd className={styles.xp}>{stats.totalXp} XP</dd>
                </div>
                <div>
                  <dt>💡 {t("game.hintsLeft")}</dt>
                  <dd>
                    {stats.hintsLeft} {t("nav.hintsToday")}
                  </dd>
                </div>
              </dl>
              <Link to="/profile" className={styles.panelLink}>
                {t("nav.profile")} →
              </Link>
            </Menu>
            <Menu
              label={t("nav.accountMenu")}
              triggerClassName={styles.accountTrigger}
              trigger={
                <span className={styles.avatar} aria-hidden="true">
                  {account.name.trim().charAt(0).toUpperCase() || "?"}
                </span>
              }
            >
              <div className={styles.who}>
                <span className={styles.name}>{account.name}</span>
                {account.isDemo && (
                  <span className={styles.demo}>{t("nav.demo")}</span>
                )}
              </div>
              <Link to="/profile" className={styles.panelLink}>
                {t("nav.profile")}
              </Link>
              <div className={styles.row}>
                <span>{t("nav.language")}</span>
                <LanguageSelect />
              </div>
              <div className={styles.row}>
                <span>{t("nav.theme")}</span>
                <ThemeToggle />
              </div>
              <Button variant="ghost" size="sm" onClick={account.onSignOut}>
                {t("nav.signOut")}
              </Button>
            </Menu>
          </>
        ) : (
          <>
            <LanguageSelect />
            <ThemeToggle />
          </>
        )}
      </div>
    </header>
  );
}
