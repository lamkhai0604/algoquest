import { Card, XpBar } from "../components";
import styles from "./Pages.module.css";

/** Level map shell. Levels are loaded from the API in T-203. */
export function HomePage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your quest</h1>
      <p className={styles.lead}>
        Learn one pattern per level, explain your approach in words, and earn
        XP.
      </p>
      <Card heading="Level map">
        <p className={styles.muted}>
          Levels appear here once the content is connected.
        </p>
        <XpBar label="Level 1 · Big-O & Basics" value={0} max={300} />
      </Card>
    </div>
  );
}
