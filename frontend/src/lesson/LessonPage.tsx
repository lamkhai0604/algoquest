import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { useApiGet } from "../api/useApiGet";
import { ButtonLink, cx, ErrorState, LoadingState } from "../components";
import pages from "../pages/Pages.module.css";
import styles from "./Lesson.module.css";
import { MarkdownBlocks } from "./Markdown";
import { parseMarkdown } from "./parseMarkdown";
import type { Block } from "./parseMarkdown";
import { QuickCheck } from "./QuickCheck";
import type { Lesson } from "./types";
import { Walkthrough } from "./Walkthrough";

/** The walkthrough is lesson part 4: it sits before the template code. */
const AFTER_WALKTHROUGH = "Template code";

function splitAtWalkthrough(blocks: Block[]): [Block[], Block[]] {
  const at = blocks.findIndex(
    (block) => block.type === "heading" && block.text === AFTER_WALKTHROUGH,
  );
  if (at < 0) return [blocks, []];
  return [blocks.slice(0, at), blocks.slice(at)];
}

function LessonBody({ lesson }: { lesson: Lesson }) {
  const [before, after] = useMemo(() => {
    const blocks = parseMarkdown(lesson.markdown).filter(
      (block) => !(block.type === "heading" && block.level === 1),
    );
    return splitAtWalkthrough(blocks);
  }, [lesson.markdown]);

  return (
    <>
      <MarkdownBlocks blocks={before} />
      <Walkthrough steps={lesson.walkthrough} />
      <MarkdownBlocks blocks={after} />
      <QuickCheck questions={lesson.quickCheck} />
      <div className={pages.row}>
        <ButtonLink to={`/levels/${lesson.level}`}>
          Go to the problems
        </ButtonLink>
      </div>
    </>
  );
}

/** Lesson page (FR-03): lesson text, walkthrough, and quick check. */
export function LessonPage() {
  const number = Number(useParams().number);
  const { state, reload } = useApiGet<Lesson>(
    `/api/v1/levels/${number}/lesson`,
  );
  const title =
    state.status === "ready" ? `Lesson: ${state.data.title}` : "Lesson";

  return (
    <div className={cx(pages.page, styles.lessonPage)}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <Link to="/">Level map</Link> /{" "}
        <Link to={`/levels/${number}`}>Level {number}</Link> /{" "}
        <span>Lesson</span>
      </nav>
      <h1 className={pages.title}>{title}</h1>
      {state.status === "loading" && <LoadingState label="Loading lesson…" />}
      {state.status === "error" && (
        <ErrorState message={state.message} onRetry={reload} />
      )}
      {state.status === "ready" && <LessonBody lesson={state.data} />}
    </div>
  );
}
