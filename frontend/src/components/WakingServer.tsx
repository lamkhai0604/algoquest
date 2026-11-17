import styles from "./States.module.css";
import { useTranslation } from "../i18n";

/** Shown while the free backend host starts up after sleeping (D-037). */
export function WakingServer({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <div className={styles.waking} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      {t("common.waking")}
    </div>
  );
}
