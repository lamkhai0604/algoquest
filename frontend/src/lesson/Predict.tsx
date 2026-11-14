import { cx } from "../components";
import styles from "./Lesson.module.css";
import { InlineText } from "./Markdown";
import type { Prediction } from "./types";

/** A prediction is answered with an option index, or skipped with "shown". */
export type Answer = number | "shown";

/** A question answered before the explanation is shown. Earns no XP. */
export function Predict({
  predict,
  answer,
  onAnswer,
  legend = "Predict before you reveal",
}: {
  predict: Prediction;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  legend?: string;
}) {
  const done = answer !== undefined;
  return (
    <fieldset className={styles.predict}>
      <legend>{legend}</legend>
      <p>
        <InlineText text={predict.question} />
      </p>
      <div className={styles.predictOptions}>
        {predict.options.map((option, index) => (
          <button
            key={index}
            type="button"
            className={cx(
              styles.option,
              done && index === predict.answer && styles.right,
              answer === index && index !== predict.answer && styles.wrong,
            )}
            aria-pressed={answer === index}
            disabled={done}
            onClick={() => onAnswer(index)}
          >
            {option}
          </button>
        ))}
      </div>
      {done ? (
        <p className={styles.answer} role="status">
          <strong>
            {answer === predict.answer
              ? "Correct."
              : answer === "shown"
                ? "Answer:"
                : "Not quite."}
          </strong>{" "}
          <InlineText text={predict.explanation} />
        </p>
      ) : (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => onAnswer("shown")}
        >
          Show the answer
        </button>
      )}
    </fieldset>
  );
}
