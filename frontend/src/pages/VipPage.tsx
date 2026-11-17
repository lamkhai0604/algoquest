import { BackButton, Badge, Card } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Pages.module.css";

/** VIP placeholder (FR-15): sample content only, no payment or sign-up. */
export function VipPage() {
  const { t } = useTranslation();
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <BackButton to="/" label={t("profile.back")} />
        <h1 className={styles.title}>AlgoQuest VIP</h1>
      </div>
      <Card>
        <Badge tone="warning">{t("common.comingSoon")}</Badge>
        <p className={styles.lead}>{t("misc.vipLead")}</p>
        <ul>
          {(["misc.vipHints", "misc.vipHard", "misc.vipReport"] as const).map(
            (key) => (
              <li key={key}>{t(key)}</li>
            ),
          )}
        </ul>
      </Card>
    </div>
  );
}
