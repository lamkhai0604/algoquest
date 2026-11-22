import { Card } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Pages.module.css";

export function KnowledgePage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t("nav.knowledge")}</h1>
      <Card>
        <h2 className={styles.planned}>{t("misc.knowledgeTopic")}</h2>
        <p>{t("misc.knowledgeStatus")}</p>
      </Card>
    </div>
  );
}
