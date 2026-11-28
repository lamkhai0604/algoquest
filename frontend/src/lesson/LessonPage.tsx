import { useMemo, useState } from "react";
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
import { useTranslation } from "../i18n";
import { QuickNotes } from "../notes/QuickNotes";
import { useCanKeepNotes } from "../notes/useCanKeepNotes";
import styles from "./Lesson.module.css";
import {
  CodeLanguageContext,
  saveLanguage,
  savedLanguage,
} from "./codeLanguage";
import { InlineText, MarkdownBlocks } from "./Markdown";
import { parseMarkdown } from "./parseMarkdown";
import { Predict } from "./Predict";
import type { Answer } from "./Predict";
import type { Block } from "./parseMarkdown";
import { QuickCheck } from "./QuickCheck";
import type { Lesson } from "./types";
import { Walkthrough } from "./Walkthrough";
import { hasLevelTest, levelLabel } from "../game/levelLabel";

/** The five learner steps; the lesson text's sections are shared among them. */
const STEPS = [
  {
    key: "understand",
    title: "lesson.understand",
    hint: "lesson.hookIntuition",
  },
  { key: "visualize", title: "lesson.visualize", hint: "lesson.stepThrough" },
  { key: "learn", title: "lesson.learn", hint: "lesson.codeComplexity" },
  { key: "check", title: "lesson.check", hint: "lesson.quickCheck" },
  { key: "practice", title: "lesson.practice", hint: "lesson.problems" },
] as const;

const UNDERSTAND = ["problem-hook", "intuition", "when-to-use"];
/** The intuition question goes right before this section, after the examples. */
const AFTER_INTUITION = "when-to-use";
const OBJECTIVES = "objectives";

/** Stable section IDs, with backward compatibility for English heading text. */
function sectionId(title: string): string {
  const tagged = /^\[([a-z-]+)\]\s+/.exec(title);
  if (tagged) return tagged[1] ?? "";
  const legacy: Record<string, string> = {
    "Learning objectives": "objectives",
    "Problem hook": "problem-hook",
    Intuition: "intuition",
    "When to use": "when-to-use",
  };
  return legacy[title] ?? "learn";
}

function readableHeading(block: Block): Block {
  if (block.type !== "heading") return block;
  return { ...block, text: block.text.replace(/^\[[a-z-]+\]\s+/, "") };
}

interface Sections {
  objectives: Block[];
  /** The first "###" part of the objectives (Key terms), shown under When to use. */
  keyTerms: { title: string; blocks: Block[] } | null;
  understand: Block[];
  learn: Block[];
  intuitionCut: number | null;
}

/** Splits the lesson text at its "##" headings into the steps that show them. */
function splitSections(markdown: string): Sections {
  const sections: Sections = {
    objectives: [],
    keyTerms: null,
    understand: [],
    learn: [],
    intuitionCut: null,
  };
  let target: Block[] = sections.understand;
  for (const block of parseMarkdown(markdown)) {
    if (block.type === "heading" && block.level === 1) continue;
    if (
      block.type === "heading" &&
      block.level === 3 &&
      target === sections.objectives &&
      sections.keyTerms === null
    ) {
      sections.keyTerms = { title: block.text, blocks: [] };
      target = sections.keyTerms.blocks;
      continue;
    }
    if (block.type === "heading" && block.level === 2) {
      const id = sectionId(block.text);
      if (id === OBJECTIVES) {
        target = sections.objectives;
        continue;
      }
      target = UNDERSTAND.includes(id) ? sections.understand : sections.learn;
      if (id === AFTER_INTUITION)
        sections.intuitionCut = sections.understand.length;
    }
    target.push(readableHeading(block));
  }
  return sections;
}

/** A key term written as "**Term.** Definition": the term and the rest. */
function splitTerm(item: string): { term: string; definition: string } | null {
  const match = /^\*\*(.+?)\*\*\s*(.*)$/.exec(item);
  if (!match) return null;
  return {
    term: (match[1] ?? "").replace(/[.:]$/, ""),
    definition: match[2] ?? "",
  };
}

/**
 * Key terms as a full-width section under When to use, closed at first, with
 * the terms in a grid of cards.
 */
function KeyTerms({ title, blocks }: { title: string; blocks: Block[] }) {
  const items = blocks.flatMap((block) =>
    block.type === "list" ? block.items : [],
  );
  const rest = blocks.filter((block) => block.type !== "list");
  return (
    <details className={cx(styles.learnSection, styles.keyTerms)}>
      <summary>
        {title} ({items.length})
      </summary>
      <div className={styles.learnBody}>
        {rest.length > 0 && <MarkdownBlocks blocks={rest} />}
        <dl className={styles.termGrid}>
          {items.map((item, index) => {
            const parts = splitTerm(item);
            return (
              <div key={index} className={styles.termCard}>
                {parts ? (
                  <>
                    <dt>
                      <InlineText text={parts.term} />
                    </dt>
                    <dd>
                      <InlineText text={parts.definition} />
                    </dd>
                  </>
                ) : (
                  <dd>
                    <InlineText text={item} />
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </details>
  );
}

/** The Learn step as one collapsible section per "##" heading; the first starts open. */
function LearnSections({ blocks }: { blocks: Block[] }) {
  const groups: { title: string; blocks: Block[] }[] = [];
  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      groups.push({ title: block.text, blocks: [] });
    } else if (groups.length === 0) {
      groups.push({ title: "", blocks: [block] });
    } else {
      groups[groups.length - 1]?.blocks.push(block);
    }
  }
  return (
    <div className={styles.learnSections}>
      {groups.map((group, index) =>
        group.title ? (
          <details
            key={group.title}
            className={styles.learnSection}
            open={index === 0}
          >
            <summary>{group.title}</summary>
            <div className={styles.learnBody}>
              <MarkdownBlocks blocks={group.blocks} />
            </div>
          </details>
        ) : (
          <MarkdownBlocks key={index} blocks={group.blocks} />
        ),
      )}
    </div>
  );
}

function StepTabs({
  current,
  onSelect,
}: {
  current: number;
  onSelect: (step: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div
      id="lesson-steps"
      className={styles.steps}
      role="tablist"
      aria-label={t("lesson.steps")}
    >
      {STEPS.map((step, i) => (
        <button
          key={step.key}
          type="button"
          role="tab"
          id={`step-tab-${i + 1}`}
          aria-selected={i === current}
          aria-controls="lesson-step"
          aria-label={`${t("lesson.step")} ${i + 1}: ${t(step.title)}`}
          className={cx(
            styles.stepTab,
            i < current && styles.stepTabDone,
            i === current && styles.stepTabOn,
          )}
          onClick={() => onSelect(i)}
        >
          <span className={styles.stepTabTitle}>
            {i + 1}
            <span className={styles.stepTabName}> · {t(step.title)}</span>
          </span>
          <span className={styles.stepTabHint}>{t(step.hint)}</span>
        </button>
      ))}
    </div>
  );
}

function PracticeStep({ level }: { level: number }) {
  const { t } = useTranslation();
  const { levels, rules } = useGame();
  const info =
    levels.status === "ready"
      ? levels.data.find((l) => l.number === level)
      : undefined;
  const practiceAt = info
    ? Math.ceil((info.target * rules.practiceOpenPercent) / 100)
    : null;
  return (
    <Card heading={t("lesson.practice")}>
      <div className={styles.prose}>
        <p>{t("lessonMore.practiceIntro")}</p>
        {info && (
          <ul>
            <li>
              {info.solved} of {info.problems} {t("lessonMore.problemsSolved")}{" "}
              {info.xp} / {info.target} XP.
            </li>
            <li>
              {info.practiceOpen
                ? t("lessonMore.practiceOpen")
                : `${t("lessonMore.practiceOpens")} ${practiceAt} XP.`}
            </li>
            {hasLevelTest(level) && (
              <li>
                {info.testOpen
                  ? t("lessonMore.testOpen")
                  : t("lessonMore.testLocked")}
              </li>
            )}
          </ul>
        )}
      </div>
      <div className={`${pages.row} ${styles.practiceAction}`}>
        <ButtonLink to={`/levels/${level}`}>
          {t("lessonMore.goProblems")}
        </ButtonLink>
      </div>
    </Card>
  );
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
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
  const [intuitionAnswer, setIntuitionAnswer] = useState<Answer>();
  const [language, setLanguage] = useState(savedLanguage);
  const codeLanguage = useMemo(
    () => ({
      language,
      setLanguage: (next: string) => {
        setLanguage(next);
        saveLanguage(next);
      },
    }),
    [language],
  );
  const cut = sections.intuitionCut ?? sections.understand.length;

  return (
    <CodeLanguageContext.Provider value={codeLanguage}>
      <StepTabs current={current} onSelect={select} />
      <p className={styles.stepCaption}>
        {t("lesson.step")} {current + 1} {t("lesson.stepOf")} {STEPS.length} ·{" "}
        {t(STEPS[current]?.title ?? "lesson.understand")}
      </p>
      <div
        id="lesson-step"
        role="tabpanel"
        aria-labelledby={`step-tab-${current + 1}`}
        className={styles.stepPanel}
      >
        {current === 0 && (
          <div className={styles.split}>
            <div className={styles.main}>
              <MarkdownBlocks blocks={sections.understand.slice(0, cut)} />
              {lesson.intuition && (
                <Predict
                  legend={t("lessonMore.intuition")}
                  predict={lesson.intuition}
                  answer={intuitionAnswer}
                  onAnswer={setIntuitionAnswer}
                />
              )}
              <MarkdownBlocks blocks={sections.understand.slice(cut)} />
            </div>
            {sections.objectives.length > 0 && (
              <Card
                heading={t("lessonMore.objectives")}
                className={styles.side}
              >
                <MarkdownBlocks blocks={sections.objectives} />
              </Card>
            )}
            {sections.keyTerms && (
              <div className={styles.full}>
                <KeyTerms
                  title={sections.keyTerms.title}
                  blocks={sections.keyTerms.blocks}
                />
              </div>
            )}
          </div>
        )}
        {current === 1 && <Walkthrough steps={lesson.walkthrough} />}
        {current === 2 && (
          <div className={styles.reading}>
            <LearnSections blocks={sections.learn} />
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
            ← {t("lesson.previous")}
          </Button>
        ) : (
          <span />
        )}
        {next && (
          <Button onClick={() => select(current + 1)}>
            {t("lesson.next")}: {t(next.title)} →
          </Button>
        )}
      </div>
    </CodeLanguageContext.Provider>
  );
}

/** Lesson page (FR-03): the lesson in five steps, from hook to practice. */
export function LessonPage() {
  const { t, locale } = useTranslation();
  const number = Number(useParams().number);
  const canKeepNotes = useCanKeepNotes();
  const { state, reload } = useApiGet<Lesson>(
    `/api/v1/levels/${number}/lesson?lang=${locale}`,
  );

  return (
    <div className={cx(pages.page, styles.lessonPage)}>
      <div className={pages.topBar}>
        <BackButton
          to={`/levels/${number}`}
          label={`${t("lesson.backToLevel")} ${levelLabel(number)}`}
        />
        <nav className={styles.crumbs} aria-label={t("level.breadcrumb")}>
          <Link to="/">{t("nav.map")}</Link> /{" "}
          <Link to={`/levels/${number}`}>{levelLabel(number)}</Link> /{" "}
          <span>{t("lesson.lesson")}</span>
        </nav>
      </div>
      <div className={styles.titleRow}>
        <h1 className={pages.title}>
          {state.status === "ready"
            ? `${t("lesson.lesson")}: ${state.data.title}`
            : t("lesson.lesson")}
        </h1>
        {canKeepNotes && <QuickNotes level={number} />}
      </div>
      {state.status === "loading" && (
        <LoadingState label={t("lesson.loading")} />
      )}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && <LessonBody lesson={state.data} />}
    </div>
  );
}
