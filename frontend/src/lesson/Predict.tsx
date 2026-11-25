import { cx } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Lesson.module.css";
import { InlineText } from "./Markdown";
import { useShuffledOrder } from "./shuffle";
import type { Prediction } from "./types";

/** A prediction is answered with an option index, or skipped with "shown". */
export type Answer = number | "shown";

/** A question answered before the explanation is shown. Earns no XP. */
export function Predict({
  predict,
  answer,
  onAnswer,
  legend,
}: {
  predict: Prediction;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  legend?: string;
}) {
  const { t } = useTranslation();
  const done = answer !== undefined;
  const order = useShuffledOrder(predict.options.length, predict.question);
  return (
    <fieldset className={styles.predict}>
      <legend>{legend ?? t("lessonMore.predictBefore")}</legend>
      <p>
        <InlineText text={predict.question} />
      </p>
      <div className={styles.predictOptions}>
        {order.map((index) => (
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
            {predict.options[index]}
          </button>
        ))}
      </div>
      {done ? (
        <p className={styles.answer} role="status">
          <strong>
            {answer === predict.answer
              ? t("lessonMore.correct")
              : answer === "shown"
                ? t("lessonMore.answer")
                : t("lessonMore.incorrect")}
          </strong>{" "}
          <InlineText text={predict.explanation} />
        </p>
      ) : (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => onAnswer("shown")}
        >
          {t("lessonMore.showAnswer")}
        </button>
      )}
    </fieldset>
  );
}
