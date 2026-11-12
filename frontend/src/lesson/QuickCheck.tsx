import { useState } from "react";
import { api } from "../api";
import { Badge, Card, cx } from "../components";
import { useGame } from "../game/gameContext";
import { QUICK_CHECK_XP } from "../solve/rules";
import styles from "./Lesson.module.css";
import type { QuickCheckQuestion, QuickCheckResult } from "./types";

function Question({
  question,
  number,
  picked,
  locked,
  onPick,
}: {
  question: QuickCheckQuestion;
  number: number;
  picked: number | null;
  locked: boolean;
  onPick: (index: number) => void;
}) {
  const correct = picked === question.answer;
  return (
    <fieldset className={styles.question}>
      <legend>
        {number}. {question.question}
      </legend>
      {question.options.map((option, index) => (
        <button
          key={index}
          type="button"
          aria-pressed={picked === index}
          disabled={locked}
          className={cx(
            styles.option,
            picked === index && (correct ? styles.right : styles.wrong),
          )}
          onClick={() => onPick(index)}
        >
          {option}
        </button>
      ))}
      {picked !== null && (
        <p className={styles.answer} role="status">
          <strong>{correct ? "Correct." : "Not quite."}</strong>{" "}
          {correct ? question.explanation : "Try another option."}
        </p>
      )}
    </fieldset>
  );
}

interface QuickCheckProps {
  level: number;
  questions: QuickCheckQuestion[];
  /** Finished before: shown with the right answers and no XP to earn. */
  done: boolean;
}

/**
 * Quick check with immediate feedback (FR-03.3). Answering every question
 * correctly is sent to the server once and earns 5 XP once per level (D-041).
 */
export function QuickCheck({ level, questions, done }: QuickCheckProps) {
  const { reloadLevels } = useGame();
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    questions.map((question) => (done ? question.answer : null)),
  );
  const [finished, setFinished] = useState(done);
  const [gained, setGained] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pick = (questionIndex: number, option: number) => {
    const next = picks.map((value, index) =>
      index === questionIndex ? option : value,
    );
    setPicks(next);
    const allRight = questions.every(
      (question, index) => next[index] === question.answer,
    );
    if (!allRight || finished) return;
    setFinished(true);
    api
      .post<QuickCheckResult>(`/api/v1/levels/${level}/quick-check`, {
        answers: next,
      })
      .then((result) => {
        setGained(result.xpGained);
        if (result.xpGained > 0) reloadLevels();
      })
      .catch(() => {
        setFinished(false);
        setError("Your result was not saved. Answer again to retry.");
      });
  };

  return (
    <Card heading="Quick check">
      <p className={styles.checkNote}>
        Answer every question correctly to finish the lesson and earn{" "}
        {QUICK_CHECK_XP} XP once.
      </p>
      {questions.map((question, index) => (
        <Question
          key={index}
          question={question}
          number={index + 1}
          picked={picks[index] ?? null}
          locked={finished}
          onPick={(option) => pick(index, option)}
        />
      ))}
      {finished && (
        <p className={styles.checkDone} role="status">
          <Badge tone="success">Quick check complete</Badge>
          {gained > 0 && <strong> +{gained} XP</strong>}
        </p>
      )}
      {error && (
        <p className={styles.checkNote} role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}
