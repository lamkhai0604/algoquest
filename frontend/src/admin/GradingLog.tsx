import { useState } from "react";
import { useApiGet } from "../api/useApiGet";
import { Badge, Button, Card, ErrorState, LoadingState } from "../components";
import styles from "./Admin.module.css";
import type { LoggedAttempt } from "./types";

/** Graded attempts with text, scores, and feedback (FR-18.1). */
export function GradingLog() {
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
        <label htmlFor="problem-filter">Problem ID</label>
        <input
          id="problem-filter"
          value={filter}
          placeholder="for example L1-max-temperature"
          onChange={(event) => setFilter(event.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>
      {state.status === "loading" && <LoadingState label="Loading attempts…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && state.data.length === 0 && (
        <p className={styles.muted}>No graded attempts yet.</p>
      )}
      {state.status === "ready" &&
        state.data.map((attempt) => (
          <Card key={attempt.id}>
            <div className={styles.attemptHead}>
              <strong>{attempt.problemId}</strong>
              <Badge tone={attempt.total >= 70 ? "success" : "warning"}>
                {attempt.total} / 100
              </Badge>
              {attempt.mode === "practice" && <Badge tone="xp">Practice</Badge>}
              <span className={styles.muted}>
                {attempt.userEmail} ·{" "}
                {new Date(attempt.createdAt).toLocaleString()}
              </span>
            </div>
            <p className={styles.explanation}>{attempt.explanation}</p>
            <p className={styles.muted}>
              Pattern {attempt.pattern} · Steps {attempt.steps} · Complexity{" "}
              {attempt.complexity} · Edge cases {attempt.edgeCases} · Hints{" "}
              {attempt.hintsUsed} · +{attempt.xpGained} XP · {attempt.grader} ·{" "}
              {attempt.gradingMs} ms
            </p>
            <p className={styles.feedback}>{attempt.feedback}</p>
          </Card>
        ))}
    </section>
  );
}
