import { Badge, Button, Card } from "../components";
import type { Difficulty } from "../game/types";
import { CRITERIA, MAX_LENGTH, maxXp } from "./rules";
import styles from "./Solve.module.css";

interface ExplainFormProps {
  difficulty: Difficulty;
  seconds: number;
  hintsUsed: number;
  text: string;
  onTextChange: (text: string) => void;
  submitting: boolean;
  error: string | null;
  onSubmit: () => void;
}

/** The explanation box with its rubric, counter, and Submit (FR-04). */
export function ExplainForm({
  difficulty,
  seconds,
  hintsUsed,
  text,
  onTextChange,
  submitting,
  error,
  onSubmit,
}: ExplainFormProps) {
  const length = text.trim().length;
  const tooLong = length > MAX_LENGTH;
  return (
    <Card heading="Explain your approach">
      <p className={styles.muted}>
        Talk it through like an interview. No code needed.
      </p>
      <div className={styles.rubric}>
        {CRITERIA.map((criterion) => (
          <Badge key={criterion.key} tone="primary">
            {criterion.label} · {criterion.max}
          </Badge>
        ))}
      </div>
      <label className={styles.label} htmlFor="explanation">
        Your explanation
      </label>
      <textarea
        id="explanation"
        className={styles.textarea}
        rows={10}
        value={text}
        disabled={submitting}
        aria-invalid={tooLong}
        aria-describedby="explanation-count"
        onChange={(event) => onTextChange(event.target.value)}
      />
      <div className={styles.formFooter}>
        <span className={styles.muted}>
          Up to {maxXp(difficulty, seconds, hintsUsed)} XP
        </span>
        <span
          id="explanation-count"
          className={tooLong ? styles.over : styles.muted}
        >
          {length} / {MAX_LENGTH}
        </span>
      </div>
      {tooLong && (
        <p className={styles.error} role="alert">
          Your explanation is longer than {MAX_LENGTH} characters.
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <Button
        onClick={onSubmit}
        disabled={submitting || length === 0 || tooLong}
      >
        {submitting ? "Grading your explanation…" : "Submit for grading"}
      </Button>
    </Card>
  );
}
