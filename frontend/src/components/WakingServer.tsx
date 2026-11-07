import styles from "./States.module.css";

/** Shown while the free backend host starts up after sleeping (D-037). */
export function WakingServer({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={styles.waking} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      Waking the server… this can take about a minute.
    </div>
  );
}
