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
  const { rules } = useGame();
  return (
    <details className={styles.guide}>
      <summary className={styles.summary}>
        <h3 className={styles.title}>How your answer is scored</h3>
        <span className={styles.toggle} aria-hidden="true" />
      </summary>
      <div className={styles.columns}>
        <section>
          <h3 className={styles.heading}>Four criteria, 100 points</h3>
          <ul className={styles.list}>
            {CRITERIA.map((criterion) => (
              <li key={criterion.key}>
                <span>{criterion.label}</span>
                <strong>{criterion.max}</strong>
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            An AI grader compares your explanation with the teacher&apos;s
            answer key. <strong>{rules.passScore} or more</strong> solves the
            problem.
          </p>
        </section>
        {variant === "problem" ? (
          <section>
            <h3 className={styles.heading}>XP for the first solve</h3>
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
                <span>Lesson quick check</span>
                <strong>{rules.quickCheckXp} XP</strong>
              </li>
            </ul>
            <p className={styles.note}>
              Each problem includes a{" "}
              <strong>+{rules.timeBonus} XP time bonus</strong> for finishing
              within {timeLimitMinutes("Easy", rules)} minutes (Easy) or{" "}
              {timeLimitMinutes("Medium", rules)} minutes (Medium) of active
              time. The clock pauses when you leave the page. After the limit
              you can still solve the problem, without the bonus.
            </p>
            <p className={styles.note}>
              Each hint takes {rules.hintPenaltyPercent}% off the problem&apos;s
              XP. XP is earned once, the first time you solve a problem; the
              next problem opens when this one is solved.
            </p>
          </section>
        ) : (
          <section>
            <h3 className={styles.heading}>Test score</h3>
            <p className={styles.note}>
              The test score is the average of the three problem scores, rounded
              down. {rules.passScore}–99 opens the Easy problems of the next
              level; 100 opens the whole level. Below {rules.passScore}, you can
              take the test again.
            </p>
          </section>
        )}
      </div>
    </details>
  );
}
