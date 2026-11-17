import { useState } from "react";
import { useTranslation, localizeLabel } from "../i18n";
import { useApiGet } from "../api/useApiGet";
import { Badge, Button, Card, ErrorState, LoadingState } from "../components";
import styles from "./Admin.module.css";
import type { LoggedAttempt } from "./types";

/** Graded attempts with text, scores, and feedback (FR-18.1). */
export function GradingLog() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [applied, setApplied] = useState("");
  const query = applied ? `?problemId=${encodeURIComponent(applied)}` : "";
  const { state, reload } = useApiGet<LoggedAttempt[]>(
    `/api/v1/admin/attempts${query}`,
  );

  return (
    <section className={styles.section}>
      <form
        className={styles.filter}
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(filter.trim());
        }}
      >
        <label htmlFor="problem-filter">{t("admin.problemId")}</label>
        <input
          id="problem-filter"
          value={filter}
          placeholder={t("admin.exampleId")}
          onChange={(event) => setFilter(event.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">
          {t("admin.filter")}
        </Button>
      </form>
      {state.status === "loading" && <LoadingState label={t("admin.loadingAttempts")} />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && state.data.length === 0 && (
        <p className={styles.muted}>{t("admin.noAttempts")}</p>
      )}
      {state.status === "ready" &&
        state.data.map((attempt) => (
          <Card key={attempt.id}>
            <div className={styles.attemptHead}>
              <strong>{attempt.problemId}</strong>
              <Badge tone={attempt.total >= 70 ? "success" : "warning"}>
                {attempt.total} / 100
              </Badge>
              {attempt.mode === "practice" && <Badge tone="xp">{t("level.practice")}</Badge>}
              <span className={styles.muted}>
                {attempt.userEmail} ·{" "}
                {new Date(attempt.createdAt).toLocaleString()}
              </span>
            </div>
            <p className={styles.explanation}>{attempt.explanation}</p>
            <p className={styles.muted}>
              {t("admin.pattern")} {attempt.pattern} · {t("admin.steps")} {attempt.steps} · {t("admin.complexity")}{" "}
              {attempt.complexity} · {t("admin.edgeCases")} {attempt.edgeCases} · {t("admin.hints")}{" "}
              {attempt.hintsUsed} · +{attempt.xpGained} XP · {attempt.grader} ·{" "}
              {attempt.gradingMs} ms
            </p>
            <p className={styles.feedback}>{attempt.feedback}</p>
          </Card>
        ))}
    </section>
  );
}
