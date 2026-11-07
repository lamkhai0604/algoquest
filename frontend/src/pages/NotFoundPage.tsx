import { Link } from "react-router";
import styles from "./Pages.module.css";

export function NotFoundPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.lead}>
        <Link to="/">Back to your quest</Link>
      </p>
    </div>
  );
}
