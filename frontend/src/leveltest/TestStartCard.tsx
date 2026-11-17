import { useState } from "react";
import { useTranslation } from "../i18n";
import { useNavigate } from "react-router";
import { api } from "../api";
import { Badge, Button, Card } from "../components";
import { useGame } from "../game/gameContext";
import type { Level } from "../game/types";
import type { LevelTest } from "./types";
import styles from "./LevelTest.module.css";

/** The level-up test entry on the level page (FR-10, FR-11 placeholder). */
export function TestStartCard({ level }: { level: Level }) {
  const { rules } = useGame();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = () => {
    setStarting(true);
    setError(null);
    api
      .post<LevelTest>(`/api/v1/levels/${level.number}/tests`)
      .then((test) => navigate(`/tests/${test.id}`))
      .catch((failure: unknown) => {
        setError(failure instanceof Error ? failure.message : t("common.retry"));
        setStarting(false);
      });
  };

  return (
    <Card heading={t("testMore.levelTest")}>
      <p className={styles.muted}>
        {t("testMore.summary")} {rules.passScore} {t("testMore.summaryTail")}
      </p>
      {level.bestTestScore !== null && (
        <p className={styles.muted}>
          {t("testMore.bestScore")} <strong>{level.bestTestScore}</strong> / 100
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        {level.testOpen ? (
          <Button onClick={start} disabled={starting}>
            {level.bestTestScore === null
              ? t("testMore.start")
              : t("testMore.retake")}
          </Button>
        ) : (
          <span className={styles.muted}>
            {t("testMore.opensAt")} ({level.target} XP).
          </span>
        )}
        <span className={styles.hardMode}>
          <Button variant="secondary" disabled>
            {t("testMore.hardMode")}
          </Button>
          <Badge tone="warning">{t("common.comingSoon")}</Badge>
        </span>
      </div>
    </Card>
  );
}
