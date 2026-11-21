import { useEffect, useId, useState } from "react";
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
  // A shaded range of cells, such as a sliding window (D-063).
  const [from, to] =
    visual.window && visual.window.length === 2 ? visual.window : [-1, -2];
  const inWindow = (index: number) =>
    from !== undefined && to !== undefined && index >= from && index <= to;
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
                inWindow(index) && styles.cellInWindow,
              )}
              data-window={inWindow(index) ? "true" : undefined}
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
      {from !== undefined && to !== undefined && from >= 0 && (
        <p className={styles.windowNote}>
          {t("walkthrough.window")} [{from}]–[{to}] ·{" "}
          {t("walkthrough.windowSize")} {to - from + 1}
        </p>
      )}
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

/** Room per grid step in a graph drawing, and the vertex radius. */
const GRAPH_STEP = 72;
const GRAPH_RADIUS = 20;
const GRAPH_MARGIN = 30;

/** Ring colours, one class per distance; larger distances reuse the last. */
const RING_CLASSES = [
  styles.ring0,
  styles.ring1,
  styles.ring2,
  styles.ring3,
  styles.ring4,
];
const ringClass = (ring: number) =>
  RING_CLASSES[Math.min(ring, RING_CLASSES.length - 1)];

/**
 * A graph (D-060): the cells are vertices, placed on a small grid by
 * `positions` or on a circle, with edges, arrows for a directed graph, and
 * visited vertices shaded. An SVG that scales to the width. Vertices visited
 * in this step pulse and the edges this step travels glow (D-061); while a
 * prediction is open, the graph keeps the previous step's state so it does
 * not give the answer away.
 */
function Graph({
  visual,
  previous,
  masked,
}: {
  visual: Visual;
  previous: Visual | null;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const cells = visual.cells;
  const n = cells.length;
  const grid = cells.map((_, i) => {
    const at = visual.positions?.[i];
    if (at) return { x: at[0] ?? 0, y: at[1] ?? 0 };
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    return { x: 3 + 2.6 * Math.cos(angle), y: 2 + 1.8 * Math.sin(angle) };
  });
  const minX = Math.min(...grid.map((g) => g.x));
  const minY = Math.min(...grid.map((g) => g.y));
  const maxX = Math.max(...grid.map((g) => g.x));
  const maxY = Math.max(...grid.map((g) => g.y));
  const point = (i: number) => {
    const g = grid[i] ?? { x: minX, y: minY };
    return {
      x: GRAPH_MARGIN + (g.x - minX) * GRAPH_STEP,
      y: GRAPH_MARGIN + (g.y - minY) * GRAPH_STEP,
    };
  };
  const width = 2 * GRAPH_MARGIN + (maxX - minX) * GRAPH_STEP;
  const height = 2 * GRAPH_MARGIN + (maxY - minY) * GRAPH_STEP + 14;
  const before = new Set(previous?.visited ?? []);
  const visited = masked ? before : new Set(visual.visited ?? []);
  const fresh = (i: number) =>
    !masked && previous !== null && visited.has(i) && !before.has(i);
  const rings = masked ? null : (visual.rings ?? null);
  const active = new Set(
    masked
      ? []
      : (visual.activeEdges ?? []).flatMap(([a, b]) => [
          `${a}-${b}`,
          `${b}-${a}`,
        ]),
  );
  const labels = new Map<number, string[]>();
  for (const marker of visual.markers ?? []) {
    labels.set(marker.index, [
      ...(labels.get(marker.index) ?? []),
      marker.label,
    ]);
  }
  const maxRing = Math.max(-1, ...(rings ?? []));
  const arrowId = useId();
  return (
    <div className={styles.treeWrap}>
      <svg
        className={styles.tree}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("walkthrough.items")}
        style={{ maxWidth: `min(100%, ${Math.max(width, 240)}px)` }}
      >
        {visual.directed && (
          <defs>
            <marker
              id={arrowId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path className={styles.graphArrow} d="M 0 0 L 10 5 L 0 10 z" />
            </marker>
          </defs>
        )}
        {(visual.edges ?? []).map(([a = 0, b = 0]) => {
          const from = point(a);
          const to = point(b);
          const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
          const dx = ((to.x - from.x) / length) * GRAPH_RADIUS;
          const dy = ((to.y - from.y) / length) * GRAPH_RADIUS;
          const lit = active.has(`${a}-${b}`);
          return (
            <line
              key={`${a}-${b}`}
              className={cx(styles.treeEdge, lit && styles.graphEdgeActive)}
              data-active={lit ? "true" : undefined}
              x1={from.x + dx}
              y1={from.y + dy}
              x2={to.x - dx}
              y2={to.y - dy}
              markerEnd={visual.directed ? `url(#${arrowId})` : undefined}
            />
          );
        })}
        {cells.map((cell, i) => {
          const { x, y } = point(i);
          const marks = labels.get(i);
          const ring = rings?.[i] ?? -1;
          return (
            <g
              key={i}
              aria-current={marks ? "true" : undefined}
              data-visited={visited.has(i) ? "true" : undefined}
            >
              <circle
                className={cx(
                  styles.treeNode,
                  ring >= 0
                    ? ringClass(ring)
                    : marks
                      ? styles.treeNodeCurrent
                      : visited.has(i) && styles.graphVisited,
                  fresh(i) && styles.graphFresh,
                )}
                cx={x}
                cy={y}
                r={GRAPH_RADIUS}
              />
              <text className={styles.treeValue} x={x} y={y}>
                {cell}
              </text>
              {marks && (
                <text
                  className={styles.treeMarker}
                  x={x}
                  y={y + GRAPH_RADIUS + 14}
                >
                  {marks.join(", ")}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {rings && maxRing >= 0 && (
        <p className={styles.ringLegend}>
          <span>{t("walkthrough.rings")}</span>
          {Array.from({ length: maxRing + 1 }, (_, ring) => (
            <span key={ring} className={styles.ringKey}>
              <span className={cx(styles.ringSwatch, ringClass(ring))} />
              {ring}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/**
 * The queue of a breadth-first search as a strip of vertices, front on the
 * left (D-061). New vertices slide in at the back; the vertex taken from the
 * front this step fades out. While a prediction hides the queue, it shows "?".
 */
function QueueStrip({
  visual,
  previous,
  masked,
}: {
  visual: Visual;
  previous: Visual | null;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const queue = visual.queue ?? [];
  const before = previous?.queue ?? [];
  const label = (v: number) => visual.cells[v] ?? String(v);
  // The front of the previous queue, when it left in this step.
  const taken =
    !masked && before.length > 0 && before[0] !== queue[0] ? before[0] : null;
  const added = new Set(
    queue.slice(Math.max(0, before.length - (taken === null ? 0 : 1))),
  );
  return (
    <div className={styles.queue}>
      <span className={styles.queueLabel}>{t("walkthrough.queue")}</span>
      <ol className={styles.queueItems} aria-label={t("walkthrough.queue")}>
        {masked ? (
          <li className={styles.queueItem}>?</li>
        ) : (
          <>
            {taken !== null && taken !== undefined && (
              <li
                key={`out-${taken}`}
                className={cx(styles.queueItem, styles.queueOut)}
                aria-hidden="true"
              >
                {label(taken)}
              </li>
            )}
            {queue.map((v) => (
              <li
                key={v}
                className={cx(
                  styles.queueItem,
                  previous && added.has(v) && styles.queueIn,
                )}
              >
                {label(v)}
              </li>
            ))}
            {queue.length === 0 && (
              <li className={styles.queueEmpty}>{t("walkthrough.empty")}</li>
            )}
          </>
        )}
      </ol>
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
/** Milliseconds per step for each playback speed. */
const SPEEDS = { slow: 2200, normal: 1400, fast: 700 } as const;
type Speed = keyof typeof SPEEDS;

export function Walkthrough({ steps }: { steps: WalkthroughStep[] }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const count = steps.length;
  const current = steps[index];
  const waitingNow =
    current?.visual?.predict != null && answers[index] === undefined;
  // Playback moves on by itself, and holds at a prediction until it is
  // answered and at the last step.
  const running = playing && index < count - 1 && !waitingNow;

  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(
      () => setIndex((i) => Math.min(count - 1, i + 1)),
      SPEEDS[speed],
    );
    return () => clearTimeout(timer);
  }, [running, index, speed, count]);

  // Arrow keys step and R resets while the walkthrough is on screen, unless
  // the learner is typing somewhere.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") {
        setPlaying(false);
        setIndex((i) => Math.min(count - 1, i + 1));
      } else if (event.key === "ArrowLeft") {
        setPlaying(false);
        setIndex((i) => Math.max(0, i - 1));
      } else if (event.key === "r" || event.key === "R") {
        setPlaying(false);
        setIndex(0);
        setAnswers({});
      } else if (event.key === " " && !target?.closest("button")) {
        event.preventDefault();
        setPlaying((p) => !p);
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

  const go = (target: number) => {
    setPlaying(false);
    setIndex(Math.min(steps.length - 1, Math.max(0, target)));
  };
  const reset = () => {
    setPlaying(false);
    setIndex(0);
    setAnswers({});
  };
  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (last) setIndex(0);
    setPlaying(true);
  };
  const previousVisual = steps[index - 1]?.visual ?? null;

  return (
    <div className={styles.visualizer}>
      <Card heading={t("lessonMore.stepByStep")}>
        <span className={styles.stepCount}>
          {t("walkthrough.step")} {index + 1} {t("lesson.stepOf")}{" "}
          {steps.length}
        </span>
        {visual &&
          (visual.edges ? (
            <Graph visual={visual} previous={previousVisual} masked={waiting} />
          ) : visual.tree ? (
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
        {visual?.queue && (
          <QueueStrip
            visual={visual}
            previous={previousVisual}
            masked={hidden.includes("queue")}
          />
        )}
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
          <Button
            variant="secondary"
            onClick={togglePlay}
            aria-pressed={running}
          >
            {running ? t("walkthrough.pause") : t("walkthrough.play")}
          </Button>
          <label className={styles.speed}>
            <span>{t("walkthrough.speed")}</span>
            <select
              value={speed}
              onChange={(event) => setSpeed(event.target.value as Speed)}
            >
              <option value="slow">{t("walkthrough.slow")}</option>
              <option value="normal">{t("walkthrough.normal")}</option>
              <option value="fast">{t("walkthrough.fast")}</option>
            </select>
          </label>
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
