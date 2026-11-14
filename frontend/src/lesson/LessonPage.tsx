import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useApiGet } from "../api/useApiGet";
import {
  BackButton,
  Button,
  ButtonLink,
  Card,
  cx,
  ErrorState,
  LoadingState,
} from "../components";
import { useGame } from "../game/gameContext";
import pages from "../pages/Pages.module.css";
import styles from "./Lesson.module.css";
import { MarkdownBlocks } from "./Markdown";
import { parseMarkdown } from "./parseMarkdown";
import type { Block } from "./parseMarkdown";
import { QuickCheck } from "./QuickCheck";
import type { Lesson } from "./types";
import { Walkthrough } from "./Walkthrough";

/** The five learner steps; the lesson text's sections are shared among them. */
const STEPS = [
  { key: "understand", title: "Understand", hint: "Hook & intuition" },
  { key: "visualize", title: "Visualize", hint: "Step through it" },
  { key: "learn", title: "Learn", hint: "Code & complexity" },
  { key: "check", title: "Check", hint: "Quick check" },
  { key: "practice", title: "Practice", hint: "Problems" },
] as const;

const UNDERSTAND = ["Problem hook", "Intuition", "When to use"];
const OBJECTIVES = "Learning objectives";

interface Sections {
  objectives: Block[];
  understand: Block[];
  learn: Block[];
}

/** Splits the lesson text at its "##" headings into the steps that show them. */
function splitSections(markdown: string): Sections {
  const sections: Sections = { objectives: [], understand: [], learn: [] };
  let target: Block[] = sections.understand;
  for (const block of parseMarkdown(markdown)) {
    if (block.type === "heading" && block.level === 1) continue;
    if (block.type === "heading" && block.level === 2) {
      if (block.text === OBJECTIVES) {
        target = sections.objectives;
        continue;
      }
      target = UNDERSTAND.includes(block.text)
        ? sections.understand
        : sections.learn;
    }
    target.push(block);
  }
  return sections;
}

function StepTabs({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (step: number) => void;
}) {
  return (
    <div
      id="lesson-steps"
      className={styles.steps}
      role="tablist"
      aria-label="Lesson steps"
    >
      {STEPS.map((step, i) => (
        <button
          key={step.key}
          type="button"
          role="tab"
          id={`step-tab-${i + 1}`}
          aria-selected={i === current}
          aria-controls="lesson-step"
          aria-label={`Step ${i + 1}: ${step.title}`}
          className={cx(
            styles.stepTab,
            i < current && styles.stepTabDone,
            i === current && styles.stepTabOn,
          )}
          onClick={() => onSelect(i)}
        >
          <span className={styles.stepTabTitle}>
            {i + 1}
            <span className={styles.stepTabName}> · {step.title}</span>
          </span>
          <span className={styles.stepTabHint}>{step.hint}</span>
        </button>
      ))}
    </div>
  );
}

function PracticeStep({ level }: { level: number }) {
  const { levels, rules } = useGame();
  const info =
    levels.status === "ready"
      ? levels.data.find((l) => l.number === level)
      : undefined;
  const practiceAt = info
    ? Math.ceil((info.target * rules.practiceOpenPercent) / 100)
    : null;
  return (
    <Card heading="Practice">
      <div className={styles.prose}>
        <p>
          Solve the problems in order and explain your approach in words. The AI
          grades your reasoning; passing code in JavaScript or Java earns double
          XP.
        </p>
        {info && (
          <ul>
            <li>
              {info.solved} of {info.problems} problems solved, {info.xp} /{" "}
              {info.target} XP.
            </li>
            <li>
              {info.practiceOpen
                ? "The practice round is open."
                : `The practice round opens at ${practiceAt} XP.`}
            </li>
            <li>
              {info.testOpen
                ? "The level-up test is open."
                : "The level-up test opens when the level bar is full."}
            </li>
          </ul>
        )}
      </div>
      <div className={pages.row}>
        <ButtonLink to={`/levels/${level}`}>Go to the problems</ButtonLink>
      </div>
    </Card>
  );
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const [params, setParams] = useSearchParams();
  const sections = useMemo(
    () => splitSections(lesson.markdown),
    [lesson.markdown],
  );
  const requested = Number(params.get("step"));
  const current =
    requested >= 1 && requested <= STEPS.length ? requested - 1 : 0;
  const select = (step: number) => {
    setParams({ step: String(step + 1) });
    document.getElementById("lesson-steps")?.scrollIntoView?.();
  };
  const next = STEPS[current + 1];
  const previous = STEPS[current - 1];

  return (
    <>
      <StepTabs current={current} onSelect={select} />
      <div
        id="lesson-step"
        role="tabpanel"
        aria-labelledby={`step-tab-${current + 1}`}
        className={styles.stepPanel}
      >
        {current === 0 && (
          <div className={styles.split}>
            <div className={styles.main}>
              <MarkdownBlocks blocks={sections.understand} />
            </div>
            {sections.objectives.length > 0 && (
              <Card heading="After this lesson you can" className={styles.side}>
                <MarkdownBlocks blocks={sections.objectives} />
              </Card>
            )}
          </div>
        )}
        {current === 1 && <Walkthrough steps={lesson.walkthrough} />}
        {current === 2 && (
          <div className={styles.reading}>
            <MarkdownBlocks blocks={sections.learn} />
          </div>
        )}
        {current === 3 && (
          <QuickCheck
            level={lesson.level}
            questions={lesson.quickCheck}
            done={lesson.quickCheckDone}
          />
        )}
        {current === 4 && <PracticeStep level={lesson.level} />}
      </div>
      <div className={styles.stepNav}>
        {previous ? (
          <Button variant="secondary" onClick={() => select(current - 1)}>
            ← {previous.title}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button onClick={() => select(current + 1)}>
            Next: {next.title} →
          </Button>
        )}
      </div>
    </>
  );
}

/** Lesson page (FR-03): the lesson in five steps, from hook to practice. */
export function LessonPage() {
  const number = Number(useParams().number);
  const { state, reload } = useApiGet<Lesson>(
    `/api/v1/levels/${number}/lesson`,
  );

  return (
    <div className={cx(pages.page, styles.lessonPage)}>
      <div className={pages.topBar}>
        <BackButton
          to={`/levels/${number}`}
          label={`Back to Level ${number}`}
        />
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link to="/">Learning Path</Link> /{" "}
          <Link to={`/levels/${number}`}>Level {number}</Link> /{" "}
          <span>Lesson</span>
        </nav>
      </div>
      <h1 className={pages.title}>
        {state.status === "ready" ? `Lesson: ${state.data.title}` : "Lesson"}
      </h1>
      {state.status === "loading" && <LoadingState label="Loading lesson…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && <LessonBody lesson={state.data} />}
    </div>
  );
}
