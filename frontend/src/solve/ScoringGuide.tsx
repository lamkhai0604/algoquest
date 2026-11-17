import { useTranslation } from "../i18n";
import type { Difficulty } from "../game/types";
import { useGame } from "../game/gameContext";
import { CRITERIA, difficultyBonus, timeLimitMinutes } from "./rules";
import styles from "./ScoringGuide.module.css";

const PLAYABLE: Difficulty[] = ["Easy", "Medium"];

interface ScoringGuideProps {
  /** "problem" for the solve page, "test" for the level-up test. */
  variant?: "problem" | "test";
}

/**
 * How an explanation is scored and what it earns (D-044). Collapsed by
 * default so the page stays short; one click opens it.
 */
export function ScoringGuide({ variant = "problem" }: ScoringGuideProps) {
  const { t } = useTranslation();
  const { rules } = useGame();
  return (
    <details className={styles.guide}>
      <summary className={styles.summary}>
        <h3 className={styles.title}>{t("solve.scoring")}</h3>
        <span className={styles.toggle} aria-hidden="true" />
      </summary>
      <div className={styles.columns}>
        <section>
          <h3 className={styles.heading}>{t("solve.criteria")}</h3>
          <ul className={styles.list}>
            {CRITERIA.map((criterion) => (
              <li key={criterion.key}>
                <span>{criterion.label}</span>
                <strong>{criterion.max}</strong>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            {t("scoringText.graderIntro")}{" "}
            <strong>{rules.passScore} {t("scoringText.orMore")}</strong> {t("scoringText.solves")}
          </p>
        </section>
        {variant === "problem" ? (
          <section>
            <h3 className={styles.heading}>{t("solve.firstSolve")}</h3>
            <ul className={styles.list}>
              {PLAYABLE.map((difficulty) => (
                <li key={difficulty}>
                  <span>{difficulty}</span>
                  <strong>
                    {rules.baseXp +
                      difficultyBonus(difficulty, rules) +
                      rules.timeBonus}{" "}
                    XP
                  </strong>
                </li>
              ))}
              <li>
                <span>{t("solve.quickCheck")}</span>
                <strong>{rules.quickCheckXp} XP</strong>
              </li>
            </ul>
            <p className={styles.note}>
              Each problem includes a{" "}
              <strong>+{rules.timeBonus} {t("scoringText.timeBonus")}</strong> {t("scoringText.within")}{" "}
              {timeLimitMinutes("Easy", rules)} {t("scoringText.minutes")} ({t("common.difficultyEasy")}) {t("scoringText.or")}{" "}
              {timeLimitMinutes("Medium", rules)} {t("scoringText.minutes")} ({t("common.difficultyMedium")}) {t("scoringText.active")}
            </p>
            <p className={styles.note}>
              {t("scoringText.hintStart")} {rules.hintPenaltyPercent}% {t("scoringText.hintEnd")}
            </p>
          </section>
        ) : (
          <section>
            <h3 className={styles.heading}>{t("solve.testScore")}</h3>
            <p className={styles.note}>
              {t("scoringText.testStart")} {rules.passScore}–99 {t("scoringText.nextOpen")}{" "}
              {rules.passScore}, {t("scoringText.retake")}
            </p>
          </section>
        )}
      </div>
    </details>
  );
}
