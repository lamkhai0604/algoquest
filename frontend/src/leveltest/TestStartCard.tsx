import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { Badge, Button, Card } from "../components";
import type { Level } from "../game/types";
import type { LevelTest } from "./types";
import styles from "./LevelTest.module.css";

/** The level-up test entry on the level page (FR-10, FR-11 placeholder). */
export function TestStartCard({ level }: { level: Level }) {
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
        setError(failure instanceof Error ? failure.message : "Try again.");
        setStarting(false);
      });
  };

  return (
    <Card heading="Level-up test">
      <p className={styles.muted}>
        3 new problems, about 2 hours. A score of 70 to 99 opens the next
        level&apos;s Easy problems; 100 opens the whole level. Retakes are
        always allowed.
      </p>
      {level.bestTestScore !== null && (
        <p className={styles.muted}>
          Best score: <strong>{level.bestTestScore}</strong> / 100
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
              ? "Start the test"
              : "Retake the test"}
          </Button>
        ) : (
          <span className={styles.muted}>
            Opens when the level bar is full ({level.target} XP).
          </span>
        )}
        <span className={styles.hardMode}>
          <Button variant="secondary" disabled>
            Hard mode
          </Button>
          <Badge tone="warning">Coming soon</Badge>
        </span>
      </div>
    </Card>
  );
}
