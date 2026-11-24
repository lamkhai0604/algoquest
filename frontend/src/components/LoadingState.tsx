import styles from "./States.module.css";
import { useTranslation } from "../i18n";

/**
 * A loading notice: a spinner with its label, over a few grey placeholder bars in the shape of the
 * content that is coming, so the page does not jump when it arrives. `lines={0}` drops the bars,
 * for small places such as a panel or a list inside a card.
 */
export function LoadingState({
  label = "Loading…",
  lines = 3,
}: {
  label?: string;
  lines?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.state} role="status">
      <span className={styles.loadingLine}>
        <span className={styles.spinner} aria-hidden="true" />
        <span>
          {label === "Loading…" ? t("common.loadingEllipsis") : label}
        </span>
      </span>
      {lines > 0 && (
        <span className={styles.skeleton} aria-hidden="true">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className={styles.skeletonBar} />
          ))}
        </span>
      )}
    </div>
  );
}
