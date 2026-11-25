import { cx } from "../components";
import styles from "./Lesson.module.css";
import type { VisualArch, VisualComponent } from "./types";

/**
 * A system design diagram drawn in 3D (D-079). Components stand on an
 * isometric floor grid, links are dashed lines on the floor, and the request
 * of this step moves along its path and back as a few dots. The drawing is
 * plain SVG; the motion uses SVG animation, so nothing moves when the browser
 * asks for reduced motion and the path is shown by its highlighted links.
 * While a prediction is open the path is hidden, so it does not give the
 * answer away. Extra flows move at the same time as the main path, and a
 * component may carry a short note above its label (T-645).
 */

/** Grid unit in pixels, and how tall a request dot flies above the floor. */
const UNIT = 30;
const FLY = 12;
const PAD = 22;

/** Request colours: going, answered, and lost. */
const GOING = "#3b82f6";
const ANSWERED = "#10b981";
const LOST = "#ef4444";

/** Seconds a request dot needs per link, and how many dots run at once. */
const SECONDS_PER_LINK = 0.7;
const DOTS = 3;

const SHAPES: Record<
  VisualComponent["kind"],
  { width: number; height: number; color: string }
> = {
  client: { width: 1.9, height: 6, color: "#60a5fa" },
  dns: { width: 1.2, height: 16, color: "#14b8a6" },
  cdn: { width: 1.4, height: 16, color: "#06b6d4" },
  lb: { width: 1.5, height: 16, color: "#0ea5e9" },
  server: { width: 1.3, height: 32, color: "#64748b" },
  cache: { width: 1.3, height: 16, color: "#8b5cf6" },
  db: { width: 1.6, height: 28, color: "#d97706" },
  queue: { width: 2, height: 12, color: "#db2777" },
};
const HOT = "#f97316";
const DOWN = "#9ca3af";

function iso(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * UNIT * 0.866, (x + y) * UNIT * 0.5 - z];
}

const pts = (list: [number, number][]) =>
  list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(" ");

function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

function Block({ node }: { node: VisualComponent }) {
  const shape = SHAPES[node.kind];
  const color =
    node.state === "down" ? DOWN : node.state === "hot" ? HOT : shape.color;
  const h = shape.height;
  const r = shape.width / 2;
  const { x, y } = node;
  const a = iso(x - r, y - r);
  const b = iso(x + r, y - r);
  const c = iso(x + r, y + r);
  const d = iso(x - r, y + r);
  const up = (p: [number, number]): [number, number] => [p[0], p[1] - h];
  const left = pts([d, c, up(c), up(d)]);
  const right = pts([c, b, up(b), up(c)]);
  const top = pts([up(a), up(b), up(c), up(d)]);
  const details = [];
  if (node.kind === "server") {
    for (let i = 1; i <= 3; i++) {
      const [x1, y1] = iso(x - r + 0.15, y + r, (h * i) / 4);
      const [x2, y2] = iso(x + r - 0.15, y + r, (h * i) / 4);
      details.push(
        <line
          key={i}
          className={styles.archDetail}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        />,
      );
    }
  }
  if (node.kind === "db") {
    for (let i = 1; i <= 2; i++) {
      details.push(
        <polyline
          key={i}
          className={styles.archDetail}
          points={pts([
            iso(x - r, y + r, (h * i) / 3),
            iso(x + r, y + r, (h * i) / 3),
            iso(x + r, y - r, (h * i) / 3),
          ])}
        />,
      );
    }
  }
  const people =
    node.kind === "client"
      ? (
          [
            [-0.45, -0.35],
            [0.4, -0.3],
            [0, 0.4],
          ] as const
        ).map(([dx, dy], i) => {
          const [px, py] = iso(x + dx, y + dy, h);
          return (
            <g key={i}>
              <rect
                x={px - 4}
                y={py - 14}
                width={8}
                height={12}
                rx={4}
                fill="#2563eb"
              />
              <circle cx={px} cy={py - 18} r={4} fill="#fbbf77" />
            </g>
          );
        })
      : null;
  const [lx, ly] = iso(x, y, h + (node.kind === "client" ? 28 : 12));
  const [mx, my] = iso(x, y, h - 6);
  return (
    <g
      className={cx(
        node.state === "hot" && styles.archHot,
        node.state === "down" && styles.archDown,
      )}
      data-component={node.kind}
      data-state={node.state ?? undefined}
    >
      <polygon points={left} fill={color} />
      <polygon points={left} className={styles.archShadeLeft} />
      <polygon points={right} fill={color} />
      <polygon points={right} className={styles.archShadeRight} />
      <polygon points={top} fill={color} />
      {details}
      {people}
      {node.state === "down" && (
        <text className={styles.archMark} x={mx} y={my}>
          ✖
        </text>
      )}
      <text className={styles.archLabel} x={lx} y={ly}>
        {node.label}
      </text>
      {node.note && (
        <text className={styles.archNote} x={lx} y={ly - 15}>
          {node.note}
        </text>
      )}
    </g>
  );
}

interface RouteFlow {
  path: number[];
  drop: boolean;
}

export function Architecture({
  arch,
  masked = false,
}: {
  arch: VisualArch;
  /** While a prediction is open, the paths and the moving requests stay hidden. */
  masked?: boolean;
}) {
  const { nodes, links } = arch;
  // The main path and any extra flows (T-645) move at the same time.
  const flows: RouteFlow[] = masked
    ? []
    : [
        ...(arch.path && arch.path.length >= 2
          ? [{ path: arch.path, drop: Boolean(arch.drop) }]
          : []),
        ...(arch.flows ?? [])
          .filter((flow) => flow.path.length >= 2)
          .map((flow) => ({ path: flow.path, drop: Boolean(flow.drop) })),
      ];
  const onPath = new Set<string>();
  for (const flow of flows) {
    for (let i = 0; i + 1 < flow.path.length; i++) {
      const a = flow.path[i]!;
      const b = flow.path[i + 1]!;
      onPath.add(`${Math.min(a, b)}-${Math.max(a, b)}`);
    }
  }
  const hasNotes = nodes.some((node) => node.note);

  // Bounds of every corner, top, label and note, so the view fits the drawing.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const shape = SHAPES[node.kind];
    const r = shape.width / 2;
    for (const [dx, dy] of [
      [-r, -r],
      [r, -r],
      [r, r],
      [-r, r],
    ] as const) {
      const [px, py] = iso(node.x + dx, node.y + dy);
      minX = Math.min(minX, px - 40);
      maxX = Math.max(maxX, px + 40);
      maxY = Math.max(maxY, py);
      minY = Math.min(minY, py - shape.height - (hasNotes ? 62 : 44));
    }
  }
  const width = maxX - minX + PAD * 2;
  const height = maxY - minY + PAD * 2;
  const viewBox = `${(minX - PAD).toFixed(0)} ${(minY - PAD).toFixed(0)} ${width.toFixed(0)} ${height.toFixed(0)}`;

  const order = nodes
    .map((node, i) => ({ node, i }))
    .sort((p, q) => p.node.x + p.node.y - (q.node.x + q.node.y));

  // Each request goes along its path and back, or stops at the end if lost.
  const motions = flows.map((flow) => {
    const stops = flow.path.map((i) => iso(nodes[i]!.x, nodes[i]!.y, FLY));
    const route = flow.drop
      ? stops
      : [...stops, ...stops.slice(0, -1).reverse()];
    const seconds = Math.max(1, route.length - 1) * SECONDS_PER_LINK;
    const motion = route
      .map(
        ([a, b], i) => `${i === 0 ? "M" : "L"}${a.toFixed(1)} ${b.toFixed(1)}`,
      )
      .join(" ");
    return { flow, seconds, motion };
  });
  const animate = flows.length > 0 && !reducedMotion();
  const dots = flows.length > 1 ? 2 : DOTS;

  return (
    <svg
      className={styles.arch}
      viewBox={viewBox}
      role="img"
      aria-label={
        flows.length > 0
          ? flows
              .map((flow) => flow.path.map((i) => nodes[i]!.label).join(" → "))
              .join("; ")
          : nodes.map((node) => node.label).join(", ")
      }
    >
      {links.map((link) => {
        const a = link[0] ?? 0;
        const b = link[1] ?? 0;
        const [x1, y1] = iso(nodes[a]!.x, nodes[a]!.y);
        const [x2, y2] = iso(nodes[b]!.x, nodes[b]!.y);
        const active = onPath.has(`${Math.min(a, b)}-${Math.max(a, b)}`);
        return (
          <line
            key={`${a}-${b}`}
            className={cx(styles.archLink, active && styles.archLinkActive)}
            data-active={active ? "true" : undefined}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
          />
        );
      })}
      {order.map(({ node, i }) => (
        <Block key={i} node={node} />
      ))}
      {animate &&
        motions.flatMap(({ flow, seconds, motion }, f) =>
          Array.from({ length: dots }, (_, k) => {
            // Flows start at different moments so their dots do not overlap.
            const begin = (-(seconds * (k + f / flows.length)) / dots).toFixed(
              2,
            );
            return (
              <circle
                key={`${f}-${motion}-${k}`}
                className={styles.archDot}
                data-dot={`${f}-${k}`}
                data-flow={f}
                r={5.5}
                fill={GOING}
              >
                <animateMotion
                  dur={`${seconds}s`}
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                  path={motion}
                  calcMode="linear"
                />
                <animate
                  attributeName="fill"
                  dur={`${seconds}s`}
                  begin={`${begin}s`}
                  repeatCount="indefinite"
                  calcMode="discrete"
                  values={
                    flow.drop ? `${GOING};${LOST}` : `${GOING};${ANSWERED}`
                  }
                  keyTimes={flow.drop ? "0;0.85" : "0;0.5"}
                />
              </circle>
            );
          }),
        )}
    </svg>
  );
}
