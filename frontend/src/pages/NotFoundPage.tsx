import { Link } from "react-router";
import { useTranslation } from "../i18n";
import styles from "./Pages.module.css";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("misc.notFound")}</h1>
      <p className={styles.lead}>
        <Link to="/">{t("misc.backQuest")}</Link>
      </p>
    </div>
  );
}
