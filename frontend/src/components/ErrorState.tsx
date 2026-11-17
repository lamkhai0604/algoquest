import { Button } from "./Button";
import { useTranslation } from "../i18n";
import styles from "./States.module.css";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.state} role="alert">
      <strong className={styles.title}>{title === "Something went wrong" ? t("common.errorTitle") : title}</strong>
      <span>{message}</span>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
