import { useEffect, useRef } from "react";
import styles from "./GraphBackground.module.css";

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
}

interface Palette {
  idle: string;
  visited: string;
  frontier: string;
  label: string;
}

const STEP_MS = 360;
const PAUSE_MS = 1400;

function palette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) =>
    css.getPropertyValue(name).trim() || fallback;
  return {
    idle: read("--color-border", "#32284a"),
    visited: read("--color-primary", "#b369c6"),
    frontier: read("--color-xp", "#f5c451"),
    label: read("--color-text-muted", "#ac9fbc"),
  };
}

function reducedMotion(): boolean {
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Each node joins its three nearest neighbours. */
function connect(nodes: Node[]): [number, number][] {
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(({ j }) => j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      });
  });
  return edges;
}

/**
 * Sign-in background (D-045): a breadth-first search spreading across a
 * drifting graph, one layer at a time, in the theme's colours. Drawn on one
 * canvas with no library; it pauses while the tab is hidden and stays still
 * when the system asks for reduced motion.
 */
export function GraphBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const still = reducedMotion();
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let source = 0;
    let level = 0;
    let lastStep = 0;
    let frame = 0;

    const startSearch = () => {
      nodes.forEach((node) => (node.depth = -1));
      source = Math.floor(Math.random() * nodes.length);
      const start = nodes[source];
      if (start) start.depth = 0;
      level = 0;
    };

    const build = () => {
      const ratio = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(18, Math.round((width * height) / 26000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        depth: -1,
      }));
      edges = connect(nodes);
      startSearch();
    };

    /** Visits the next layer; false when the search has run out of nodes. */
    const step = () => {
      let grew = false;
      for (const [a, b] of edges) {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        if (!nodeA || !nodeB) continue;
        if (nodeA.depth === level && nodeB.depth < 0) {
          nodeB.depth = level + 1;
          grew = true;
        } else if (nodeB.depth === level && nodeA.depth < 0) {
          nodeA.depth = level + 1;
          grew = true;
        }
      }
      level++;
      return grew;
    };

    const draw = () => {
      const colors = palette();
      context.clearRect(0, 0, width, height);
      for (const [a, b] of edges) {
        const nodeA = nodes[a];
        const nodeB = nodes[b];
        if (!nodeA || !nodeB) continue;
        const linked =
          nodeA.depth >= 0 &&
          nodeB.depth >= 0 &&
          Math.abs(nodeA.depth - nodeB.depth) === 1;
        const fresh = linked && Math.max(nodeA.depth, nodeB.depth) >= level;
        context.strokeStyle = fresh
          ? colors.frontier
          : linked
            ? colors.visited
            : colors.idle;
        context.globalAlpha = fresh ? 0.8 : linked ? 0.5 : 0.55;
        context.lineWidth = fresh ? 1.6 : 1;
        context.beginPath();
        context.moveTo(nodeA.x, nodeA.y);
        context.lineTo(nodeB.x, nodeB.y);
        context.stroke();
      }
      context.font = "10px ui-monospace, Menlo, Consolas, monospace";
      nodes.forEach((node, index) => {
        const visited = node.depth >= 0;
        const fresh = node.depth === level || index === source;
        context.globalAlpha = visited ? 0.9 : 0.7;
        context.fillStyle = fresh
          ? colors.frontier
          : visited
            ? colors.visited
            : colors.idle;
        context.beginPath();
        context.arc(node.x, node.y, index === source ? 5 : 3, 0, Math.PI * 2);
        context.fill();
        if (visited) {
          context.globalAlpha = 0.55;
          context.fillStyle = colors.label;
          context.fillText(String(node.depth), node.x + 6, node.y - 6);
        }
      });
      const visited = nodes.filter((node) => node.depth >= 0).length;
      context.globalAlpha = 0.6;
      context.fillStyle = colors.label;
      context.font = "12px ui-monospace, Menlo, Consolas, monospace";
      context.fillText(
        `bfs(source=${source})  depth=${level}  visited=${visited}/${nodes.length}`,
        20,
        height - 24,
      );
      context.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (document.visibilityState === "hidden") return;
      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
      }
      if (now - lastStep > STEP_MS) {
        lastStep = now;
        if (!step()) {
          lastStep = now + PAUSE_MS;
          startSearch();
        }
      }
      draw();
    };

    build();
    if (still) {
      while (step());
      draw();
    } else {
      frame = requestAnimationFrame(tick);
    }
    const onResize = () => {
      build();
      if (still) {
        while (step());
        draw();
      }
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
  );
}
