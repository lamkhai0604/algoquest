import styles from "./States.module.css";
import { useTranslation } from "../i18n";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className={styles.state} role="status">
      <span className={styles.spinner} aria-hidden="true" />
      <span>{label === "Loading…" ? t("common.loadingEllipsis") : label}</span>
    </div>
  );
}
