import { Badge, Button, ButtonLink, Card, XpBar } from "../components";
import { CRITERIA, PASS_TOTAL } from "./rules";
import styles from "./Solve.module.css";
import type { AttemptResult } from "./types";

interface Props {
  result: AttemptResult;
  level: number;
  onTryAgain: () => void;
}

/** The graded result: total, criteria, feedback, and XP (FR-05.2, FR-08). */
export function FeedbackPanel({ result, level, onTryAgain }: Props) {
  return (
    <div className={styles.feedback}>
      <Card className={styles.scoreCard}>
        <Badge tone={result.solved ? "success" : "warning"}>
          {result.solved ? "Solved" : "Not solved yet"}
        </Badge>
        <p className={styles.total} aria-label={`Score ${result.total} of 100`}>
          <strong>{result.total}</strong> / 100
        </p>
        <p className={styles.muted}>{PASS_TOTAL} or more solves the problem.</p>
      </Card>
      <Card heading="Score by criterion">
        <ul className={styles.criteria}>
          {CRITERIA.map((criterion) => (
            <li key={criterion.key}>
              <span>{criterion.label}</span>
              <span className={styles.points}>
                {result[criterion.key]} / {criterion.max}
              </span>
              <span className={styles.track} aria-hidden="true">
                <span
                  className={styles.fill}
                  style={{
                    width: `${(result[criterion.key] / criterion.max) * 100}%`,
                  }}
                />
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card heading="Feedback">
        <p className={styles.feedbackText}>{result.feedback}</p>
      </Card>
      <Card heading="XP earned">
        <p className={styles.xp}>+{result.xpGained} XP</p>
        {result.solved && result.xpGained === 0 && (
          <p className={styles.muted}>
            XP is earned the first time a problem is solved.
          </p>
        )}
        <XpBar
          label={`Level ${level} XP`}
          value={result.levelXp}
          max={result.levelTarget}
        />
      </Card>
      <div className={styles.actions}>
        <ButtonLink to={`/levels/${level}`}>Back to the problems</ButtonLink>
        {!result.solved && (
          <Button variant="secondary" onClick={onTryAgain}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
