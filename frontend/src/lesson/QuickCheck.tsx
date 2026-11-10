import { useState } from "react";
import { Card, cx } from "../components";
import styles from "./Lesson.module.css";
import type { QuickCheckQuestion } from "./types";

function Question({
  question,
  number,
}: {
  question: QuickCheckQuestion;
  number: number;
}) {
  const [picked, setPicked] = useState<number | null>(null);
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
          className={cx(
            styles.option,
            picked === index && (correct ? styles.right : styles.wrong),
          )}
          onClick={() => setPicked(index)}
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

/** Quick check with immediate feedback; it earns no XP (FR-03.3). */
export function QuickCheck({ questions }: { questions: QuickCheckQuestion[] }) {
  return (
    <Card heading="Quick check">
      {questions.map((question, index) => (
        <Question key={index} question={question} number={index + 1} />
      ))}
    </Card>
  );
}
