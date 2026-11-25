import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";
import { Button, Card, cx } from "../components";
import styles from "./Lesson.module.css";
import { Architecture } from "./Architecture";
import { CodeBlock, InlineText } from "./Markdown";
import { Predict } from "./Predict";
import type { Answer } from "./Predict";
import { traceSearch } from "./traceSearch";
import type { TraceState } from "./traceSearch";
import type { Visual, VisualCall, WalkthroughStep } from "./types";

/**
 * Motion helpers (D-065). They use the Web Animations API on top of the final
 * layout, so the drawing is always correct and the motion is only a bonus:
 * nothing moves when the browser lacks the API or asks for reduced motion.
 */
function canAnimate(): boolean {
  if (typeof window === "undefined" || typeof Element === "undefined") {
    return false;
  }
  if (!("animate" in Element.prototype)) return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Slides an element from where `from` was to where it is now. */
function slideFrom(el: Element | null | undefined, from: DOMRect) {
  if (!el) return;
  const to = el.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  el.animate(
    [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
    { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
  );
}

/** A short pop for a value that changed in place. */
function pop(el: Element | null | undefined) {
  el?.animate(
    [
      { transform: "scale(0.6)", opacity: 0.3 },
      { transform: "scale(1.15)", opacity: 1, offset: 0.6 },
      { transform: "none" },
    ],
    { duration: 420, easing: "ease-out" },
  );
}

/** Where each marker label sits, by label. */
function markerIndexes(visual: Visual | null): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of visual?.markers ?? []) out.set(m.label, m.index);
  return out;
}

/**
 * Animates a row of cells or nodes after a step: marker labels slide from
 * their previous cell, swapped values trade places, and changed values pop.
 * `items` are the row's elements in index order.
 */
function animateRow(
  items: Element[],
  visual: Visual,
  previous: Visual | null,
  valueClass: string,
  markerClass: string,
) {
  if (!canAnimate() || !previous) return;
  if (previous.cells.length !== visual.cells.length) return;
  const rects = items.map((el) => el.getBoundingClientRect());
  const before = markerIndexes(previous);
  for (const m of visual.markers ?? []) {
    const from = before.get(m.label);
    if (from === undefined || from === m.index) continue;
    const rect = rects[from];
    const marker = items[m.index]?.querySelector(`.${markerClass}`);
    if (rect) slideFrom(marker, rect);
  }
  const swap: number[] = visual.swap ?? [];
  if (swap.length === 2) {
    const [a = 0, b = 0] = swap;
    const ra = rects[a];
    const rb = rects[b];
    if (ra && rb) {
      slideFrom(items[a]?.querySelector(`.${valueClass}`), rb);
      slideFrom(items[b]?.querySelector(`.${valueClass}`), ra);
    }
  }
  visual.cells.forEach((cell, i) => {
    if (swap.includes(i) || previous.cells[i] === cell) return;
    pop(items[i]?.querySelector(`.${valueClass}`));
  });
}

function Cells({
  visual,
  previous,
}: {
  visual: Visual;
  previous: Visual | null;
}) {
  const { t } = useTranslation();
  const listRef = useRef<HTMLOListElement>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    animateRow(
      Array.from(list.children),
      visual,
      previous,
      styles.cellValue ?? "",
      styles.cellMarker ?? "",
    );
  }, [visual, previous]);
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
      <ol
        ref={listRef}
        className={styles.cells}
        aria-label={t("walkthrough.items")}
      >
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
  const listRef = useRef<HTMLOListElement>(null);
  const next = visual.next ?? [];
  const masked = hidden.includes("next");
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nodes = Array.from(list.children).map(
      (item) => item.firstElementChild ?? item,
    );
    animateRow(
      nodes,
      visual,
      previous,
      styles.cellValue ?? "",
      styles.cellMarker ?? "",
    );
    // A pointer that changed flips into place.
    if (!canAnimate() || masked || !previous?.next) return;
    const prevNext = previous.next;
    const next = visual.next ?? [];
    nodes.forEach((node, i) => {
      if (prevNext[i] === next[i]) return;
      node.querySelector(`.${styles.nodeNext}`)?.animate(
        [
          { transform: "rotateX(90deg)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 380, easing: "ease-out" },
      );
    });
    Array.from(list.querySelectorAll(`.${styles.nodeLink}`)).forEach(
      (link, i) => {
        const was = prevNext[i] === i + 1 || prevNext[i + 1] === i;
        const is = next[i] === i + 1 || next[i + 1] === i;
        if (
          was !== is ||
          prevNext[i] !== next[i] ||
          prevNext[i + 1] !== next[i + 1]
        ) {
          link.animate(
            [
              { transform: "scale(0.2) rotate(-180deg)", opacity: 0 },
              { transform: "none", opacity: 1 },
            ],
            { duration: 420, easing: "ease-out" },
          );
        }
      },
    );
  }, [visual, previous, masked]);
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
    <ol
      ref={listRef}
      className={styles.nodes}
      aria-label={t("walkthrough.items")}
    >
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
function Tree({
  visual,
  previous,
}: {
  visual: Visual;
  previous: Visual | null;
}) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const cells = visual.cells;
  const sameShape =
    previous?.tree === true && previous.cells.length === cells.length;
  // Nodes that appeared since the previous step grow in; values that changed pop.
  const grown = (i: number) =>
    previous !== null &&
    sameShape === true &&
    (previous.cells[i] ?? "") === "" &&
    (cells[i] ?? "") !== "";
  // Edges on the way from the root to each marked node light up.
  const onPath = new Set<number>();
  for (const m of visual.markers ?? []) {
    for (let i = m.index; i > 0; i = Math.floor((i - 1) / 2)) onPath.add(i);
  }
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !canAnimate() || !previous?.tree) return;
    const before = markerIndexes(previous);
    for (const m of visual.markers ?? []) {
      const from = before.get(m.label);
      if (from === undefined || from === m.index) continue;
      const a = svg.querySelector(`[data-node="${from}"] circle`);
      const label = svg.querySelector(`[data-marker="${m.index}"]`);
      if (a && label) slideFrom(label, a.getBoundingClientRect());
    }
    if (previous.cells.length !== visual.cells.length) return;
    visual.cells.forEach((cell, i) => {
      const was = previous.cells[i] ?? "";
      if (was !== "" && cell !== "" && was !== cell) {
        pop(svg.querySelector(`[data-node="${i}"] text`));
      }
    });
  }, [visual, previous]);
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
        ref={svgRef}
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
                  className={cx(
                    styles.treeEdge,
                    onPath.has(child) && styles.graphEdgeActive,
                  )}
                  data-path={onPath.has(child) ? "true" : undefined}
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
            <g key={i} data-node={i} aria-current={marks ? "true" : undefined}>
              <circle
                className={cx(
                  styles.treeNode,
                  marks && styles.treeNodeCurrent,
                  grown(i) && styles.graphFresh,
                )}
                cx={x}
                cy={y}
                r={TREE_RADIUS}
              />
              <text
                className={styles.treeValue}
                x={x}
                y={y}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              >
                {cell}
              </text>
              {marks && (
                <text
                  className={styles.treeMarker}
                  data-marker={i}
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
        {(visual.weights ?? []).map((weight, e) => {
          const [a = 0, b = 0] = visual.edges?.[e] ?? [];
          const from = point(a);
          const to = point(b);
          const x = (from.x + to.x) / 2;
          const y = (from.y + to.y) / 2;
          const width = 10 + weight.length * 7;
          const lit = active.has(`${a}-${b}`);
          return (
            <g
              key={`w${e}`}
              data-weight={weight}
              className={cx(
                styles.graphWeight,
                lit && styles.graphWeightActive,
              )}
            >
              <rect
                x={x - width / 2}
                y={y - 9}
                width={width}
                height={18}
                rx={5}
              />
              <text x={x} y={y}>
                {weight}
              </text>
            </g>
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
const TIMELINE_ROW = 34;
const TIMELINE_BAR = 20;
const TIMELINE_LABEL = 40;
const TIMELINE_TOP = 26;
const TIMELINE_RIGHT = 48;

/**
 * Interval timeline (D-066): each cell is a bar on a shared time axis. Kept
 * bars are filled and ticked, the marked bar is outlined, and an optional
 * sweep line marks a point in time. Newly kept bars pop and the marker and
 * the line slide from where they were.
 */
function Timeline({
  visual,
  previous,
  masked,
}: {
  visual: Visual;
  previous: Visual | null;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const intervals = visual.intervals ?? [];
  const shown = masked && previous ? previous : visual;
  const starts = intervals.map(([a = 0]) => a);
  const ends = intervals.map(([, b = 0]) => b);
  const lo = Math.min(...starts, shown.line ?? Infinity);
  const hi = Math.max(...ends, shown.line ?? -Infinity, lo + 1);
  const span = hi - lo;
  const unit = Math.max(18, Math.min(56, 460 / span));
  const x = (v: number) => TIMELINE_LABEL + (v - lo) * unit;
  const width = TIMELINE_LABEL + span * unit + TIMELINE_RIGHT;
  const height = TIMELINE_TOP + intervals.length * TIMELINE_ROW + 8;
  const every = span <= 16 ? 1 : span <= 32 ? 2 : 5;
  const ticks: number[] = [];
  for (let v = Math.ceil(lo / every) * every; v <= hi; v += every)
    ticks.push(v);
  const chosen = new Set(shown.chosen ?? []);
  const marks = new Map<number, string[]>();
  for (const m of visual.markers ?? []) {
    marks.set(m.index, [...(marks.get(m.index) ?? []), m.label]);
  }
  const svgRef = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !canAnimate() || !previous || masked) return;
    const scale = svg.getBoundingClientRect().width / width || 1;
    const shift = (el: Element | null, dx: number, dy: number) => {
      if (!el || (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5)) return;
      el.animate(
        [
          { transform: `translate(${dx * scale}px, ${dy * scale}px)` },
          { transform: "none" },
        ],
        { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      );
    };
    const before = new Set(previous.chosen ?? []);
    for (const i of visual.chosen ?? []) {
      if (!before.has(i)) pop(svg.querySelector(`[data-bar="${i}"]`));
    }
    const was = markerIndexes(previous);
    for (const m of visual.markers ?? []) {
      const from = was.get(m.label);
      if (from === undefined || from === m.index) continue;
      shift(
        svg.querySelector(`[data-marker="${m.index}"]`),
        0,
        (from - m.index) * TIMELINE_ROW,
      );
    }
    if (
      visual.line !== null &&
      visual.line !== undefined &&
      previous.line !== null &&
      previous.line !== undefined
    ) {
      shift(
        svg.querySelector("[data-line]"),
        (previous.line - visual.line) * unit,
        0,
      );
    }
  }, [visual, previous, masked, width, unit]);
  return (
    <div className={styles.treeWrap}>
      <svg
        ref={svgRef}
        className={styles.tree}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("walkthrough.timeline")}
        style={{ maxWidth: `min(100%, ${Math.max(width, 240)}px)` }}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line
              className={styles.timelineTick}
              x1={x(v)}
              x2={x(v)}
              y1={TIMELINE_TOP - 4}
              y2={height - 4}
            />
            <text
              className={styles.timelineTime}
              x={x(v)}
              y={TIMELINE_TOP - 10}
            >
              {v}
            </text>
          </g>
        ))}
        {intervals.map(([a = 0, b = 0], i) => {
          const y =
            TIMELINE_TOP + i * TIMELINE_ROW + (TIMELINE_ROW - TIMELINE_BAR) / 2;
          const kept = chosen.has(i);
          const current = marks.has(i);
          return (
            <g key={i}>
              <text
                className={styles.timelineName}
                x={TIMELINE_LABEL - 8}
                y={y + TIMELINE_BAR / 2}
              >
                {visual.cells[i]}
              </text>
              <rect
                data-bar={i}
                data-kept={kept ? "true" : undefined}
                className={cx(
                  styles.timelineBar,
                  kept && styles.timelineKept,
                  current && styles.timelineCurrent,
                )}
                x={x(a)}
                y={y}
                width={Math.max((b - a) * unit, 6)}
                height={TIMELINE_BAR}
                rx={6}
              />
              {kept && (
                <text
                  className={styles.timelineCheck}
                  x={x(a) + 8}
                  y={y + TIMELINE_BAR / 2}
                >
                  ✓
                </text>
              )}
              {current && (
                <text
                  data-marker={i}
                  className={styles.timelineMarker}
                  x={x(b) + Math.max(0, 6 - (b - a) * unit) + 6}
                  y={y + TIMELINE_BAR / 2}
                >
                  {marks.get(i)?.join(", ")}
                </text>
              )}
            </g>
          );
        })}
        {shown.line !== null && shown.line !== undefined && (
          <line
            data-line="true"
            className={styles.timelineLine}
            x1={x(shown.line)}
            x2={x(shown.line)}
            y1={TIMELINE_TOP - 4}
            y2={height - 4}
          />
        )}
      </svg>
    </div>
  );
}

/**
 * Table view (D-068): the cells in rows, with optional row and column
 * labels. The marked cell is outlined and the cells it reads are shaded and
 * marked with a dot, so the view does not rely on colour alone.
 */
function Table({
  visual,
  previous,
}: {
  visual: Visual;
  previous: Visual | null;
}) {
  const { t } = useTranslation();
  const tableRef = useRef<HTMLTableElement>(null);
  useLayoutEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    animateRow(
      Array.from(table.querySelectorAll("td[data-cell]")),
      visual,
      previous,
      styles.tableValue ?? "",
      styles.tableMarker ?? "",
    );
  }, [visual, previous]);
  const rows = Math.max(1, visual.rows ?? 1);
  const columns = Math.ceil(visual.cells.length / rows);
  const reads = new Set(visual.reads ?? []);
  const labels = new Map<number, string[]>();
  for (const m of visual.markers ?? []) {
    labels.set(m.index, [...(labels.get(m.index) ?? []), m.label]);
  }
  const rowLabels = visual.rowLabels ?? null;
  const columnLabels = visual.columnLabels ?? null;
  return (
    <div className={styles.tableWrap}>
      <table
        ref={tableRef}
        className={styles.dpTable}
        aria-label={t("walkthrough.table")}
      >
        {columnLabels && (
          <thead>
            <tr>
              {rowLabels && <th aria-hidden="true" />}
              {columnLabels.map((label, c) => (
                <th key={c} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }, (_, r) => (
            <tr key={r}>
              {rowLabels && <th scope="row">{rowLabels[r]}</th>}
              {Array.from({ length: columns }, (_, c) => {
                const i = r * columns + c;
                const marks = labels.get(i);
                const read = reads.has(i);
                return (
                  <td
                    key={c}
                    data-cell={i}
                    data-read={read ? "true" : undefined}
                    aria-current={marks ? "true" : undefined}
                    className={cx(
                      styles.tableCell,
                      read && styles.tableRead,
                      marks && styles.tableCurrent,
                    )}
                  >
                    <span className={styles.tableValue}>{visual.cells[i]}</span>
                    <span className={styles.tableMarker}>
                      {marks?.join(", ") ?? (read ? "•" : "")}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

/**
 * A stack as a row of items, bottom on the left and top on the right (D-065).
 * Pushed items drop in on the right; items popped in this step fade out after
 * the top. While a prediction hides "stack", it shows "?".
 */
/**
 * The code in view with the lines this step runs lit (D-077). The code is the step's own, or the
 * latest code of an earlier step, so a whole function can be shown once and followed line by line.
 */
function CodeLines({ code, lines }: { code: string; lines: number[] }) {
  const { t } = useTranslation();
  const [first = 1, last = first] = lines;
  const lit = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = lit.current;
    const box = node?.closest("pre");
    if (!node || !box) return;
    // Keep the lit line in view inside the code box without moving the page.
    const top = node.offsetTop - box.clientHeight / 3;
    box.scrollTop = Math.max(0, top);
  }, [first]);
  return (
    <figure className={cx(styles.code, styles.codeLines)}>
      <figcaption className={styles.codeHeader}>
        <span>
          {first === last
            ? t("walkthrough.codeLine").replace("{line}", String(first))
            : t("walkthrough.codeLines")
                .replace("{first}", String(first))
                .replace("{last}", String(last))}
        </span>
      </figcaption>
      <pre>
        <code>
          {code.split("\n").map((text, i) => {
            const number = i + 1;
            const on = number >= first && number <= last;
            return (
              <span
                key={i}
                ref={number === first ? lit : undefined}
                className={cx(styles.codeLine, on && styles.codeLineOn)}
                aria-current={on ? "step" : undefined}
              >
                <span className={styles.codeNumber} aria-hidden="true">
                  {number}
                </span>
                {text || " "}
                {"\n"}
              </span>
            );
          })}
        </code>
      </pre>
    </figure>
  );
}

/**
 * Recursive calls as a staircase (D-078): each call is a box indented by its depth. The running
 * call is lit, a call waiting for the one it made is dashed, and a finished call shows its result.
 * Calls that were not in the previous step slide in; a result that just arrived pops.
 */
const CALL_STATE_KEYS = {
  active: "walkthrough.callActive",
  waiting: "walkthrough.callWaiting",
  done: "walkthrough.callDone",
} as const;

function CallStair({
  calls,
  previous,
  masked,
}: {
  calls: VisualCall[];
  previous: VisualCall[] | null | undefined;
  /** While a prediction is open, a result that just arrived shows as "?". */
  masked: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className={styles.calls}>
      <span className={styles.queueLabel}>{t("walkthrough.calls")}</span>
      <ol className={styles.callList} aria-label={t("walkthrough.calls")}>
        {calls.map((call, i) => {
          const before = previous?.[i];
          const isNew = previous != null && before?.text !== call.text;
          const justReturned =
            previous != null &&
            call.state === "done" &&
            before?.state !== "done";
          return (
            <li
              key={`${i}-${call.text}`}
              className={cx(
                styles.call,
                call.state === "active" && styles.callActive,
                call.state === "waiting" && styles.callWaiting,
                call.state === "done" && styles.callDone,
                isNew && styles.callIn,
              )}
              data-depth={call.depth}
              style={{ marginLeft: `calc(${call.depth} * var(--call-step))` }}
            >
              <span className={styles.callText}>{call.text}</span>
              <span className={styles.callState}>
                {call.state === "done" && call.result != null ? (
                  <span className={cx(justReturned && styles.callPop)}>
                    → {masked && justReturned ? "?" : call.result}
                  </span>
                ) : (
                  t(CALL_STATE_KEYS[call.state])
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StackStrip({
  visual,
  previous,
  masked,
}: {
  visual: Visual;
  previous: Visual | null;
  masked: boolean;
}) {
  const { t } = useTranslation();
  const stack = visual.stack ?? [];
  const before = previous?.stack ?? [];
  let common = 0;
  while (
    common < stack.length &&
    common < before.length &&
    stack[common] === before[common]
  ) {
    common++;
  }
  const popped = previous ? before.slice(common) : [];
  return (
    <div className={styles.queue}>
      <span className={styles.queueLabel}>{t("walkthrough.stack")}</span>
      <ol className={styles.queueItems} aria-label={t("walkthrough.stack")}>
        {masked ? (
          <li className={styles.queueItem}>?</li>
        ) : (
          <>
            {stack.map((item, i) => (
              <li
                key={`${i}-${item}`}
                className={cx(
                  styles.queueItem,
                  previous && i >= common && styles.stackIn,
                  i === stack.length - 1 && styles.stackTop,
                )}
              >
                {item}
              </li>
            ))}
            {popped.map((item, i) => (
              <li
                key={`out-${i}-${item}`}
                className={cx(styles.queueItem, styles.queueOut)}
                aria-hidden="true"
              >
                {item}
              </li>
            ))}
            {stack.length === 0 && popped.length === 0 && (
              <li className={styles.queueEmpty}>{t("walkthrough.empty")}</li>
            )}
          </>
        )}
      </ol>
    </div>
  );
}

/**
 * An interactive graph (D-064): pick a start vertex and BFS or DFS, then step
 * or play through the search.
 */
function Explorer({ visual }: { visual: Visual }) {
  const { t } = useTranslation();
  const [start, setStart] = useState(0);
  const [kind, setKind] = useState<"bfs" | "dfs">("bfs");
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const states = traceSearch(
    visual.cells.length,
    visual.edges ?? [],
    visual.directed === true,
    start,
    kind,
  );
  const last = states.length - 1;
  const running = playing && at < last;
  useEffect(() => {
    if (!running) return;
    const timer = setTimeout(() => setAt((i) => Math.min(last, i + 1)), 900);
    return () => clearTimeout(timer);
  }, [running, at, last]);
  const state = states[Math.min(at, last)]!;
  const prev = at > 0 ? states[at - 1]! : null;
  const label = (v: number) => visual.cells[v] ?? String(v);
  const toVisual = (s: TraceState): Visual => ({
    ...visual,
    predict: null,
    queue: null,
    rings: null,
    visited: s.order,
    activeEdges: s.active,
    markers: s.curr >= 0 ? [{ index: s.curr, label: "curr" }] : [],
  });
  const shown = toVisual(state);
  const restart = (nextStart: number, nextKind: "bfs" | "dfs") => {
    setStart(nextStart);
    setKind(nextKind);
    setAt(0);
    setPlaying(false);
  };
  return (
    <div className={styles.explorer}>
      <p className={styles.explorerTitle}>{t("walkthrough.exploreTitle")}</p>
      <div className={styles.explorerControls}>
        <label className={styles.speed}>
          <span>{t("walkthrough.startAt")}</span>
          <select
            value={start}
            onChange={(e) => restart(Number(e.target.value), kind)}
          >
            {visual.cells.map((cell, i) => (
              <option key={i} value={i}>
                {cell}
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label={t("walkthrough.search")}>
          <Button
            size="sm"
            variant={kind === "bfs" ? "primary" : "secondary"}
            aria-pressed={kind === "bfs"}
            onClick={() => restart(start, "bfs")}
          >
            {t("walkthrough.bfs")}
          </Button>{" "}
          <Button
            size="sm"
            variant={kind === "dfs" ? "primary" : "secondary"}
            aria-pressed={kind === "dfs"}
            onClick={() => restart(start, "dfs")}
          >
            {t("walkthrough.dfs")}
          </Button>
        </div>
      </div>
      <Graph
        visual={shown}
        previous={prev ? toVisual(prev) : null}
        masked={false}
      />
      {kind === "bfs" ? (
        <QueueStrip
          visual={{ ...shown, queue: state.frontier }}
          previous={prev ? { ...shown, queue: prev.frontier } : null}
          masked={false}
        />
      ) : (
        <StackStrip
          visual={{ ...shown, stack: state.frontier.map(label) }}
          previous={prev ? { ...shown, stack: prev.frontier.map(label) } : null}
          masked={false}
        />
      )}
      <p className={styles.visitOrder}>
        {t("walkthrough.visitOrder")}:{" "}
        <strong>{state.order.map(label).join(" → ") || "·"}</strong>
      </p>
      <div className={styles.stepButtons}>
        <Button
          size="sm"
          variant="secondary"
          disabled={at === 0}
          onClick={() => {
            setPlaying(false);
            setAt(at - 1);
          }}
        >
          {t("lesson.previous")}
        </Button>
        <Button
          size="sm"
          disabled={at >= last}
          onClick={() => {
            setPlaying(false);
            setAt(at + 1);
          }}
        >
          {t("lessonMore.nextStep")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          aria-pressed={running}
          onClick={() => {
            if (running) {
              setPlaying(false);
              return;
            }
            if (at >= last) setAt(0);
            setPlaying(true);
          }}
        >
          {running ? t("walkthrough.pause") : t("walkthrough.play")}
        </Button>
      </div>
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

/**
 * One walkthrough drawing without animation or prediction, for a frame of a
 * lesson figure (D-072).
 */
export function StillVisual({ visual }: { visual: Visual }) {
  return (
    <>
      {visual.arch ? (
        <Architecture arch={visual.arch} />
      ) : visual.intervals ? (
        <Timeline visual={visual} previous={null} masked={false} />
      ) : visual.edges ? (
        <Graph visual={visual} previous={null} masked={false} />
      ) : visual.tree ? (
        <Tree visual={visual} previous={null} />
      ) : visual.next ? (
        <Nodes visual={visual} previous={null} hidden={[]} />
      ) : visual.rows ? (
        <Table visual={visual} previous={null} />
      ) : (
        <Cells visual={visual} previous={null} />
      )}
      {visual.vars && visual.vars.length > 0 && (
        <Variables visual={visual} hidden={[]} />
      )}
    </>
  );
}

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
  // The code panel follows the latest code at or before this step (D-077).
  const codeInView =
    steps
      .slice(0, index + 1)
      .reverse()
      .find((s) => s.code)?.code ?? null;
  // The stage keeps the tallest height it has reached, so the controls
  // under it stay in place while stepping back and forth.
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageHeight, setStageHeight] = useState(0);
  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const measure = () =>
      setStageHeight((tallest) => Math.max(tallest, node.scrollHeight));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [index]);
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
  // A prediction can hide the value of the marked cell until it is answered.
  const markedCells = new Set((visual?.markers ?? []).map((m) => m.index));
  const shownCells: Visual | null =
    visual && hidden.includes("cell")
      ? {
          ...visual,
          cells: visual.cells.map((c, i) => (markedCells.has(i) ? "?" : c)),
        }
      : visual;

  return (
    <div className={styles.visualizer}>
      <Card heading={t("lessonMore.stepByStep")}>
        <span className={styles.stepCount}>
          {t("walkthrough.step")} {index + 1} {t("lesson.stepOf")}{" "}
          {steps.length}
        </span>
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
        <div
          ref={stageRef}
          className={styles.stage}
          style={stageHeight ? { minHeight: stageHeight } : undefined}
        >
          {visual &&
            (visual.arch ? (
              <Architecture arch={visual.arch} />
            ) : visual.edges && visual.explore ? (
              <Explorer key={index} visual={visual} />
            ) : visual.intervals ? (
              <Timeline
                visual={visual}
                previous={previousVisual}
                masked={waiting}
              />
            ) : visual.edges ? (
              <Graph
                visual={shownCells ?? visual}
                previous={previousVisual}
                masked={waiting}
              />
            ) : visual.tree ? (
              <Tree visual={visual} previous={previousVisual} />
            ) : visual.next ? (
              <Nodes
                visual={visual}
                previous={steps[index - 1]?.visual ?? null}
                hidden={hidden}
              />
            ) : visual.rows ? (
              <Table visual={shownCells ?? visual} previous={previousVisual} />
            ) : (
              <Cells visual={shownCells ?? visual} previous={previousVisual} />
            ))}
          {visual?.queue && (
            <QueueStrip
              visual={visual}
              previous={previousVisual}
              masked={hidden.includes("queue")}
            />
          )}
          {visual?.stack && (
            <StackStrip
              visual={visual}
              previous={previousVisual}
              masked={hidden.includes("stack")}
            />
          )}
          {visual?.calls && (
            <CallStair
              calls={visual.calls}
              previous={previousVisual?.calls}
              masked={waiting}
            />
          )}
          {visual && <Variables visual={visual} hidden={hidden} />}
        </div>
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
              {step.lines && codeInView ? (
                <CodeLines code={codeInView} lines={step.lines} />
              ) : (
                step.code && <CodeBlock code={step.code} />
              )}
            </>
          )}
        </div>
      </Card>
      {hasVisuals && (
        <Card>
          <StateTable steps={steps} index={index} answers={answers} />
        </Card>
      )}
    </div>
  );
}
