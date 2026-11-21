import { Link } from "react-router";
import { Badge, Card } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Pages.module.css";

const TOPICS = [
  "misc.systemDesignTopic1",
  "misc.systemDesignTopic2",
  "misc.systemDesignTopic3",
  "misc.systemDesignTopic4",
  "misc.systemDesignTopic5",
  "misc.systemDesignTopic6",
] as const;

/** Placeholder for the planned System Design track (D-067). */
export function SystemDesignPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {t("misc.systemDesignTitle")} <Badge>{t("common.comingSoon")}</Badge>
      </h1>
      <p className={styles.lead}>{t("misc.systemDesignLead")}</p>
      <Card>
        <h2 className={styles.planned}>{t("misc.systemDesignPlanned")}</h2>
        <ul className={styles.topics}>
          {TOPICS.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ul>
      </Card>
      <p className={styles.muted}>{t("misc.systemDesignNote")}</p>
      <p>
        <Link to="/">{t("misc.backQuest")}</Link>
      </p>
    </div>
  );
}
