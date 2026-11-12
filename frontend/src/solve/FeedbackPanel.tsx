import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Celebration,
  XpBar,
} from "../components";
import { useGame } from "../game/gameContext";
import { CRITERIA } from "./rules";
import styles from "./Solve.module.css";
import type { AttemptResult } from "./types";

interface Props {
  result: AttemptResult;
  level: number;
}

/**
 * The graded result: total, criteria, feedback, and XP (FR-05.2, FR-08).
 * A perfect score gets a short celebration (D-042).
 */
export function FeedbackPanel({ result, level }: Props) {
  const { rules } = useGame();
  return (
    <div className={styles.feedback}>
      {result.total === 100 && <Celebration />}
      <Card className={styles.scoreCard}>
        <Badge tone={result.solved ? "success" : "warning"}>
          {result.solved ? "Solved" : "Not solved yet"}
        </Badge>
        <p className={styles.total} aria-label={`Score ${result.total} of 100`}>
          <strong>{result.total}</strong> / 100
        </p>
        <p className={styles.muted}>
          {rules.passScore} or more solves the problem.
        </p>
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
        {result.mode === "practice" && result.solved && (
          <p className={styles.muted}>Marked Done in the practice round.</p>
        )}
        {result.mode === "explain" &&
          result.solved &&
          result.xpGained === 0 && (
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
    </div>
  );
}

interface ActionsProps extends Props {
  /** The next problem in the level, offered once this one is solved. */
  nextProblemId?: string | null;
  /** Asks to start the problem again (after a confirmation). */
  onRetry?: () => void;
}

/** Back, Retry, and Next under a graded result (D-042). */
export function ResultActions({
  result,
  level,
  nextProblemId,
  onRetry,
}: ActionsProps) {
  return (
    <div className={styles.resultActions}>
      <ButtonLink to={`/levels/${level}`} variant="secondary">
        ← Back to the problems
      </ButtonLink>
      {onRetry && result.mode === "explain" ? (
        <Button variant="secondary" onClick={onRetry}>
          ↻ Retry
        </Button>
      ) : (
        <span aria-hidden="true" />
      )}
      {nextProblemId && result.solved && result.mode === "explain" ? (
        <ButtonLink to={`/problems/${nextProblemId}`}>
          Next problem →
        </ButtonLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
