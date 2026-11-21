import { Link } from "react-router";
import { Badge, Card } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Pages.module.css";

const TOPICS = [
  "topic1",
  "topic2",
  "topic3",
  "topic4",
  "topic5",
  "topic6",
] as const;

/** Placeholder for the planned System Design track (D-067). */
export function SystemDesignPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {t("systemDesign.title")} <Badge>{t("common.comingSoon")}</Badge>
      </h1>
      <p className={styles.lead}>{t("systemDesign.lead")}</p>
      <Card>
        <h2 className={styles.planned}>{t("systemDesign.planned")}</h2>
        <ul className={styles.topics}>
          {TOPICS.map((key) => (
            <li key={key}>{t(`systemDesign.${key}`)}</li>
          ))}
        </ul>
      </Card>
      <p className={styles.muted}>{t("systemDesign.note")}</p>
      <p>
        <Link to="/">{t("misc.backQuest")}</Link>
      </p>
    </div>
  );
}
