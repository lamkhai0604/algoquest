import { Link } from "react-router";
import styles from "./AppFooter.module.css";

const REPO_URL = "https://github.com/lamkhai0604/algoquest";

/** Site footer: brand, a few links, and the year. */
export function AppFooter() {
  const year = new Date().getFullYear();
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
            Learn algorithms step by step, one level at a time.
          </span>
        </div>
        <nav aria-label="Footer" className={styles.links}>
          <Link to="/">Learning Path</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </div>
      <p className={styles.copy}>© {year} AlgoQuest</p>
    </footer>
  );
}
