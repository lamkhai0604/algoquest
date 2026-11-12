import { Card } from "../components";
import type { Difficulty } from "../game/types";
import {
  BASE_XP,
  CRITERIA,
  DIFFICULTY_BONUS,
  HINT_PENALTY_PERCENT,
  PASS_TOTAL,
  QUICK_CHECK_XP,
  TIME_BONUS,
  TIME_LIMIT_MINUTES,
} from "./rules";
import styles from "./ScoringGuide.module.css";

const PLAYABLE: Difficulty[] = ["Easy", "Medium"];

interface ScoringGuideProps {
  /** "problem" for the solve page, "test" for the level-up test. */
  variant?: "problem" | "test";
}

/** How an explanation is scored and what it earns (D-044). */
export function ScoringGuide({ variant = "problem" }: ScoringGuideProps) {
  return (
    <Card heading="How your answer is scored" className={styles.guide}>
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
            answer key. <strong>{PASS_TOTAL} or more</strong> solves the
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
                    {BASE_XP + DIFFICULTY_BONUS[difficulty] + TIME_BONUS} XP
                  </strong>
                </li>
              ))}
              <li>
                <span>Lesson quick check</span>
                <strong>{QUICK_CHECK_XP} XP</strong>
              </li>
            </ul>
            <p className={styles.note}>
              Each problem includes a{" "}
              <strong>+{TIME_BONUS} XP time bonus</strong> for finishing within{" "}
              {TIME_LIMIT_MINUTES.Easy} minutes (Easy) or{" "}
              {TIME_LIMIT_MINUTES.Medium} minutes (Medium) of active time. The
              clock pauses when you leave the page. After the limit you can
              still solve the problem, without the bonus.
            </p>
            <p className={styles.note}>
              Each hint takes {HINT_PENALTY_PERCENT}% off the problem&apos;s XP.
              XP is earned once, the first time you solve a problem; the next
              problem opens when this one is solved.
            </p>
          </section>
        ) : (
          <section>
            <h3 className={styles.heading}>Test score</h3>
            <p className={styles.note}>
              The test score is the average of the three problem scores, rounded
              down. {PASS_TOTAL}–99 opens the Easy problems of the next level;
              100 opens the whole level. Below {PASS_TOTAL}, you can take the
              test again.
            </p>
          </section>
        )}
      </div>
    </Card>
  );
}
