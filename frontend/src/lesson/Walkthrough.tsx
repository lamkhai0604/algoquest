import { useEffect, useState } from "react";
import { useTranslation } from "../i18n";
import { Button, Card, cx } from "../components";
import styles from "./Lesson.module.css";
import { CodeBlock, InlineText } from "./Markdown";
import { Predict } from "./Predict";
import type { Answer } from "./Predict";
import type { Visual, WalkthroughStep } from "./types";

function Cells({ visual }: { visual: Visual }) {
  const { t } = useTranslation();
  const labels = new Map<number, string[]>();
  for (const marker of visual.markers ?? []) {
    labels.set(marker.index, [
      ...(labels.get(marker.index) ?? []),
      marker.label,
    ]);
  }
  if (visual.cells.length === 0) return null;
  const swap: number[] = visual.swap ?? [];
  return (
    <>
      <ol className={styles.cells} aria-label={t("walkthrough.items")}>
        {visual.cells.map((cell, index) => {
          const marks = labels.get(index);
          const swapped = swap.includes(index);
          return (
            <li
              key={index}
              className={cx(
                styles.cell,
                marks && styles.cellCurrent,
                swapped && styles.cellSwapped,
              )}
              aria-current={marks ? "true" : undefined}
            >
              <span className={styles.cellIndex}>[{index}]</span>
              <span className={styles.cellValue}>{cell}</span>
              <span className={styles.cellMarker}>
                {marks?.join(", ") ?? (swapped ? "⇄" : "")}
              </span>
            </li>
          );
        })}
      </ol>
      {swap.length === 2 && (
        <p className={styles.swapNote}>
          {t("lessonMore.swapped")} [{swap[0]}] {t("lessonMore.and")} [{swap[1]}
          ]
        </p>
      )}
    </>
  );
}

/**
 * A linked list: each cell is a node, drawn with where its next pointer goes.
 * Arrows join neighbouring nodes that point at each other; a node whose
 * pointer changed since the previous step is highlighted. While a prediction
 * hides "next", the pointers show "?".
 */
function Nodes({
  visual,
  previous,
  hidden,
}: {
  visual: Visual;
  previous: Visual | null;
  hidden: string[];
}) {
  const { t } = useTranslation();
  const next = visual.next ?? [];
  const masked = hidden.includes("next");
  const labels = new Map<number, string[]>();
  for (const marker of visual.markers ?? []) {
    labels.set(marker.index, [
      ...(labels.get(marker.index) ?? []),
      marker.label,
    ]);
  }
  const before =
    previous?.next && previous.next.length === next.length
      ? previous.next
      : null;
  const target = (i: number) =>
    masked ? "?" : next[i] === -1 ? "null" : `[${next[i]}]`;
  const link = (i: number) => {
    if (masked) return "";
    const forward = next[i] === i + 1;
    const back = next[i + 1] === i;
    return forward && back ? "⇄" : forward ? "→" : back ? "←" : "";
  };
  return (
    <ol className={styles.nodes} aria-label={t("walkthrough.items")}>
      {visual.cells.map((cell, index) => {
        const marks = labels.get(index);
        const changed =
          !masked && before !== null && before[index] !== next[index];
        return (
          <li key={index} className={styles.nodeItem}>
            <div
              className={cx(
                styles.cell,
                styles.node,
                marks && styles.cellCurrent,
                changed && styles.cellSwapped,
              )}
              aria-current={marks ? "true" : undefined}
            >
              <span className={styles.cellIndex}>[{index}]</span>
              <span className={styles.cellValue}>{cell}</span>
              <span className={styles.nodeNext}>next {target(index)}</span>
              <span className={styles.cellMarker}>
                {marks?.join(", ") ?? ""}
              </span>
            </div>
            {index < visual.cells.length - 1 && (
              <span className={styles.nodeLink} aria-hidden="true">
                {link(index)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Horizontal room per node on the lowest level of a tree drawing. */
const TREE_SLOT = 64;
const TREE_ROW = 72;
const TREE_RADIUS = 20;

/**
 * A binary tree in array positions (D-059): the children of cell i are cells
 * 2i + 1 and 2i + 2, and an empty cell is no node. Drawn as an SVG that
 * scales to the width, so five levels still fit on a phone.
 */
function Tree({ visual }: { visual: Visual }) {
  const { t } = useTranslation();
  const cells = visual.cells;
  const levels = Math.max(1, Math.floor(Math.log2(cells.length)) + 1);
  const width = TREE_SLOT * 2 ** (levels - 1);
  const height = TREE_ROW * levels + 8;
  const labels = new Map<number, string[]>();
  for (const marker of visual.markers ?? []) {
    labels.set(marker.index, [
      ...(labels.get(marker.index) ?? []),
      marker.label,
    ]);
  }
  const place = (i: number) => {
    const level = Math.floor(Math.log2(i + 1));
    const slot = i - (2 ** level - 1);
    return {
      x: ((slot + 0.5) * width) / 2 ** level,
      y: TREE_RADIUS + 6 + level * TREE_ROW,
    };
  };
  const present = (i: number) => i < cells.length && cells[i] !== "";
  return (
    <div className={styles.treeWrap}>
      <svg
        className={styles.tree}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("walkthrough.items")}
        style={{ maxWidth: `min(100%, ${Math.max(width, 240)}px)` }}
      >
        {cells.map((_, i) =>
          [2 * i + 1, 2 * i + 2]
            .filter((child) => present(i) && present(child))
            .map((child) => {
              const from = place(i);
              const to = place(child);
              return (
                <line
                  key={`${i}-${child}`}
                  className={styles.treeEdge}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                />
              );
            }),
        )}
        {cells.map((cell, i) => {
          if (!present(i)) return null;
          const { x, y } = place(i);
          const marks = labels.get(i);
          return (
            <g key={i} aria-current={marks ? "true" : undefined}>
              <circle
                className={cx(styles.treeNode, marks && styles.treeNodeCurrent)}
                cx={x}
                cy={y}
                r={TREE_RADIUS}
              />
              <text className={styles.treeValue} x={x} y={y}>
                {cell}
              </text>
              {marks && (
                <text
                  className={styles.treeMarker}
                  x={x}
                  y={y + TREE_RADIUS + 14}
                >
                  {marks.join(", ")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Variables({ visual, hidden }: { visual: Visual; hidden: string[] }) {
  if (!visual.vars?.length) return null;
  return (
    <dl className={styles.vars}>
      {visual.vars.map((variable) => (
        <div key={variable.name} className={styles.var}>
          <dt>{variable.name}</dt>
          <dd>{hidden.includes(variable.name) ? "?" : variable.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The state table: one row per step reached so far, one column per variable. */
function StateTable({
  steps,
  index,
  answers,
}: {
  steps: WalkthroughStep[];
  index: number;
  answers: Record<number, Answer>;
}) {
  const { t } = useTranslation();
  const names: string[] = [];
  for (const step of steps) {
    for (const variable of step.visual?.vars ?? []) {
      if (!names.includes(variable.name)) names.push(variable.name);
    }
  }
  if (names.length === 0) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.stateTable}>
        <caption>{t("walkthrough.state")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("walkthrough.step")}</th>
            {names.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {steps.slice(0, index + 1).map((step, i) => {
            const hidden =
              step.visual?.predict && answers[i] === undefined
                ? (step.visual.predict.hides ?? [])
                : [];
            return (
              <tr key={i} className={cx(i === index && styles.rowCurrent)}>
                <th scope="row">{i + 1}</th>
                {names.map((name) => {
                  const value = step.visual?.vars?.find(
                    (v) => v.name === name,
                  )?.value;
                  return (
                    <td key={name}>
                      {value === undefined
                        ? "·"
                        : hidden.includes(name)
                          ? "?"
                          : value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The step-by-step example (FR-03.2). Steps with a visual show the items,
 * markers, and variable values; a step with a prediction asks first and shows
 * its text once the learner answers. Arrow keys step, R resets.
 */
export function Walkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const count = steps.length;

  // Arrow keys step and R resets while the walkthrough is on screen, unless
  // the learner is typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") {
        setIndex((i) => Math.min(count - 1, i + 1));
      } else if (event.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (event.key === "r" || event.key === "R") {
        setIndex(0);
        setAnswers({});
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count]);

  const step = steps[index];
  if (!step) return null;

  const visual = step.visual ?? null;
  const predict = visual?.predict ?? null;
  const waiting = predict !== null && answers[index] === undefined;
  const hidden = waiting ? (predict?.hides ?? []) : [];
  const last = index === steps.length - 1;
  const hasVisuals = steps.some((s) => s.visual);

  const go = (target: number) =>
    setIndex(Math.min(steps.length - 1, Math.max(0, target)));
  const reset = () => {
    setIndex(0);
    setAnswers({});
  };

  return (
    <div className={styles.visualizer}>
      <Card heading={t("lessonMore.stepByStep")}>
        <span className={styles.stepCount}>
          {t("walkthrough.step")} {index + 1} {t("lesson.stepOf")}{" "}
          {steps.length}
        </span>
        {visual &&
          (visual.tree ? (
            <Tree visual={visual} />
          ) : visual.next ? (
            <Nodes
              visual={visual}
              previous={steps[index - 1]?.visual ?? null}
              hidden={hidden}
            />
          ) : (
            <Cells visual={visual} />
          ))}
        {visual && <Variables visual={visual} hidden={hidden} />}
        {predict && (
          <Predict
            predict={predict}
            answer={answers[index]}
            onAnswer={(answer) => setAnswers({ ...answers, [index]: answer })}
          />
        )}
        <div className={styles.step} aria-live="polite">
          <h3 className={styles.stepTitle}>{step.title}</h3>
          {waiting ? (
            <p className={styles.stepHidden}>{t("lessonMore.answerFirst")}</p>
          ) : (
            <>
              <p>
                <InlineText text={step.body} />
              </p>
              {step.code && <CodeBlock code={step.code} />}
            </>
          )}
        </div>
        <div className={styles.stepButtons}>
          <Button
            variant="secondary"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            {t("lesson.previous")}
          </Button>
          <Button disabled={last} onClick={() => go(index + 1)}>
            {t("lessonMore.nextStep")}
          </Button>
          <Button variant="secondary" onClick={reset}>
            {t("lesson.reset")}
          </Button>
        </div>
        <p className={styles.keys}>{t("walkthrough.keyboard")}</p>
      </Card>
      {hasVisuals && (
        <Card>
          <StateTable steps={steps} index={index} answers={answers} />
        </Card>
      )}
    </div>
  );
}
