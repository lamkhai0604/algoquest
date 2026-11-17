import { Link } from "react-router";
import styles from "./AppFooter.module.css";
import { useTranslation } from "../i18n";

const REPO_URL = "https://github.com/lamkhai0604/algoquest";

/** Site footer: brand, a few links, and the year. */
export function AppFooter() {
  const year = new Date().getFullYear();
  const { t } = useTranslation();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandBlock}>
          <span className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              A
            </span>
            AlgoQuest
          </span>
          <span className={styles.tagline}>
            {t("footer.tagline")}
          </span>
        </div>
        <nav aria-label={t("footer.navigation")} className={styles.links}>
          <Link to="/">{t("nav.map")}</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
      <p className={styles.copy}>© {year} AlgoQuest</p>
    </footer>
  );
}
