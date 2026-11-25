import { cx } from "../components";
import { useTranslation } from "../i18n";
import styles from "./Lesson.module.css";
import { useShuffledOrder } from "./shuffle";
import type { QuickCheckQuestion } from "./types";

export function QuickCheckQuestionCard({
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
  const { t } = useTranslation();
  const correct = picked === question.answer;
  const order = useShuffledOrder(question.options.length, question.question);
  return (
    <fieldset className={styles.question}>
      <legend>
        {number}. {question.question}
      </legend>
      {order.map((index) => (
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
          {question.options[index]}
        </button>
      ))}
      {picked !== null && (
        <p className={styles.answer} role="status">
          <strong>
            {correct ? t("lessonMore.correct") : t("lessonMore.incorrect")}
          </strong>{" "}
          {correct ? question.explanation : t("lessonMore.tryAnother")}
        </p>
      )}
    </fieldset>
  );
}
