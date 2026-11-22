import { useState } from "react";
import { useTranslation } from "../i18n";
import { api } from "../api";
import { Badge, Card } from "../components";
import { useGame } from "../game/gameContext";
import styles from "./Lesson.module.css";
import { QuickCheckQuestionCard } from "./QuickCheckQuestionCard";
import type { QuickCheckQuestion, QuickCheckResult } from "./types";

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
  const { reloadLevels, rules } = useGame();
  const { t } = useTranslation();
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
        setError(t("lessonMore.quickCheckError"));
      });
  };

  return (
    <Card heading={t("lesson.quickCheck")}>
      <p className={styles.checkNote}>
        {t("lessonMore.quickCheckNote")} {rules.quickCheckXp}{" "}
        {t("lessonMore.quickCheckOnce")}
      </p>
      {questions.map((question, index) => (
        <QuickCheckQuestionCard
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
          <Badge tone="success">{t("lessonMore.quickCheckDone")}</Badge>
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
