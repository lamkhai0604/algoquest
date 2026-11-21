import { describe, expect, it } from "vitest";
import type { WalkthroughStep } from "./types";

/** The real walkthroughs in content/, checked against reference algorithms. */
const FILES = import.meta.glob<WalkthroughStep[]>(
  "../../../content/levels/*/walkthrough.json",
  { eager: true, import: "default" },
);

function walkthrough(folder: string): WalkthroughStep[] {
  const steps = FILES[`../../../content/levels/${folder}/walkthrough.json`];
  if (!steps) throw new Error(`no walkthrough for ${folder}`);
  return steps;
}

const value = (step: WalkthroughStep, name: string) =>
  step.visual?.vars?.find((v) => v.name === name)?.value;

describe("lesson visualizers match their reference algorithms", () => {
  it("Level 1: best is the running maximum at every step", () => {
    const steps = walkthrough("1-big-o-and-basics");
    let checked = 0;
    for (const step of steps) {
      const marker = step.visual?.markers?.[0];
      const best = value(step, "best");
      if (!step.visual || marker === undefined || best === undefined) continue;
      const seen = step.visual.cells.slice(0, marker.index + 1).map(Number);
      expect(Number(best)).toBe(Math.max(...seen));
      expect(value(step, "current")).toBe(step.visual.cells[marker.index]);
      checked++;
    }
    expect(checked).toBe(4);
    expect(value(steps.at(-1)!, "result")).toBe("9");
  });

  it("Level 2: the last step shows the run-length encoding of the cells", () => {
    const steps = walkthrough("2-arrays-and-strings");
    const text = steps[0]!.visual!.cells.join("");
    const encoded = text.replace(
      /(.)\1*/g,
      (run, ch: string) => `${ch}${run.length}`,
    );
    expect(value(steps.at(-1)!, "result")).toBe(`"${encoded}"`);
  });

  it("Level 3: the duplicate is found at the first repeated value", () => {
    const steps = walkthrough("3-hashing");
    const cells = steps[0]!.visual!.cells;
    const seen = new Set<string>();
    const repeat = cells.findIndex((c) => seen.has(c) || !seen.add(c));
    const last = steps.at(-1)!;
    expect(last.visual!.markers![0]!.index).toBe(repeat);
    expect(value(last, "result")).toBe("true");
  });

  it("Level 4: each swap turns the previous cells into the next, ending sorted", () => {
    const steps = walkthrough("4-sorting-fundamentals");
    const start = steps[0]!.visual!.cells.map(Number);
    const cells = [...start];
    let swaps = 0;
    for (const step of steps.slice(1)) {
      const swap = step.visual?.swap;
      if (swap) {
        const [a, b] = swap;
        [cells[a], cells[b]] = [cells[b]!, cells[a]!];
        swaps++;
      }
      expect(step.visual!.cells.map(Number)).toEqual(cells);
    }
    expect(cells).toEqual([...start].sort((a, b) => a - b));
    // Insertion sort swaps once per out-of-order pair.
    let pairs = 0;
    start.forEach((x, i) =>
      start.slice(i + 1).forEach((y) => (pairs += y < x ? 1 : 0)),
    );
    expect(pairs).toBeGreaterThan(0);
    expect(swaps).toBe(pairs);
    expect(value(steps.at(-1)!, "swaps")).toBe(String(pairs));
  });

  it("Level 5: the pointers change one node at a time, ending reversed", () => {
    const steps = walkthrough("5-linked-lists");
    const n = steps[0]!.visual!.cells.length;
    // The reference reversal: after node k turns around, nodes 0..k point back.
    const expected: number[][] = [
      Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1)),
    ];
    for (let k = 0; k < n; k++) {
      const next = [...expected.at(-1)!];
      next[k] = k - 1;
      expected.push(next);
    }
    const seen: number[][] = [];
    for (const step of steps) {
      const next = step.visual!.next!;
      expect(step.visual!.cells).toEqual(steps[0]!.visual!.cells);
      if (JSON.stringify(seen.at(-1)) !== JSON.stringify(next)) seen.push(next);
    }
    expect(seen).toEqual(expected);
    // Walking from the head marker of the last step gives the result.
    const last = steps.at(-1)!;
    const head = last.visual!.markers!.find((m) => m.label === "head")!.index;
    const values: string[] = [];
    for (let i = head; i !== -1; i = last.visual!.next![i]!) {
      values.push(last.visual!.cells[i]!);
    }
    expect(value(last, "result")).toBe(`[${values.join(", ")}]`);
  });

  it("Level 6: the stack after each character matches a bracket check", () => {
    const steps = walkthrough("6-stack-queue-deque");
    const text = steps[0]!.visual!.cells;
    const stack: string[] = [];
    const after: string[] = [];
    for (const ch of text) {
      if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
      else stack.pop();
      after.push(stack.length === 0 ? "empty" : stack.join(" "));
    }
    const shown = steps.map((step) => value(step, "stack (bottom → top)"));
    expect(shown).toEqual(["empty", ...after, "empty"]);
    // Each middle step points at the character it just read.
    steps.slice(1, -1).forEach((step, i) => {
      expect(step.visual!.markers![0]!.index).toBe(i);
    });
    expect(value(steps.at(-1)!, "result")).toBe("true");
  });

  it("Level 7: the call stack grows to the base case, then each call returns its sum", () => {
    const steps = walkthrough("7-recursion-divide-and-conquer");
    const a = [3, 1, 4];
    const depths = steps.map((step) => step.visual!.cells.length);
    expect(depths).toEqual([1, 2, 3, 4, 3, 2, 1, 0]);
    for (const step of steps) {
      step.visual!.cells.forEach((cell, i) => expect(cell).toBe(`sum(${i})`));
      expect(value(step, "call stack depth")).toBe(
        String(step.visual!.cells.length),
      );
    }
    // Returns arrive newest call first: sum(3), sum(2), sum(1), sum(0).
    const returned = steps
      .map((step) => value(step, "last return"))
      .filter((v) => v !== "·")
      .map((v) => Number(v!.split("=").at(-1)));
    const expected = [3, 2, 1, 0].map((i) =>
      a.slice(i).reduce((x, y) => x + y, 0),
    );
    expect(returned).toEqual(expected);
  });

  it("Level 8: the tree is a valid BST and the search follows the BST rule", () => {
    const steps = walkthrough("8-trees-and-bst");
    const cells = steps[0]!.visual!.cells;
    const at = (i: number) =>
      i < cells.length && cells[i] !== "" ? Number(cells[i]) : null;
    // In-order values of a BST increase.
    const inOrder: number[] = [];
    const walk = (i: number) => {
      if (at(i) === null) return;
      walk(2 * i + 1);
      inOrder.push(at(i)!);
      walk(2 * i + 2);
    };
    walk(0);
    expect(inOrder).toEqual([...inOrder].sort((a, b) => a - b));
    // The search path for the target, by the BST rule.
    const target = Number(value(steps[0]!, "target"));
    const path: number[] = [];
    for (let i = 0; at(i) !== null;) {
      path.push(i);
      if (at(i) === target) break;
      i = target < at(i)! ? 2 * i + 1 : 2 * i + 2;
    }
    const shown: number[] = [];
    for (const step of steps) {
      expect(step.visual!.tree).toBe(true);
      expect(step.visual!.cells).toEqual(cells);
      const index = step.visual!.markers![0]!.index;
      if (shown.at(-1) !== index) shown.push(index);
    }
    expect(shown).toEqual(path);
    expect(at(path.at(-1)!)).toBe(target);
  });

  it("Level 9: the push sifts up one swap at a time and keeps the heap rule", () => {
    const steps = walkthrough("9-heap-priority-queue");
    const start = steps[0]!.visual!.cells.map(Number);
    const pushed = Number(value(steps[0]!, "push"));
    // Reference sift-up, recording the array after each change.
    const heap = [...start, pushed];
    const states = [start, [...heap]];
    for (let i = heap.length - 1; i > 0;) {
      const parent = (i - 1) >> 1;
      if (heap[i]! >= heap[parent]!) break;
      [heap[i], heap[parent]] = [heap[parent]!, heap[i]!];
      states.push([...heap]);
      i = parent;
    }
    const shown: number[][] = [];
    for (const step of steps) {
      expect(step.visual!.tree).toBe(true);
      const cells = step.visual!.cells.map(Number);
      if (JSON.stringify(shown.at(-1)) !== JSON.stringify(cells))
        shown.push(cells);
    }
    expect(shown).toEqual(states);
    const last = states.at(-1)!;
    last.forEach((v, i) => {
      if (i > 0) expect(last[(i - 1) >> 1]!).toBeLessThanOrEqual(v);
    });
  });

  it("Level 10: breadth-first search visits, queues and measures like the reference", () => {
    const steps = walkthrough("10-graph-fundamentals");
    const first = steps[0]!.visual!;
    const n = first.cells.length;
    const graph: number[][] = Array.from({ length: n }, () => []);
    for (const [a = 0, b = 0] of first.edges!) {
      graph[a]!.push(b);
      graph[b]!.push(a);
    }
    for (const list of graph) list.sort((x, y) => x - y);
    // Reference BFS from 0, recording the state after each vertex is taken.
    const dist = new Array<number>(n).fill(-1);
    dist[0] = 0;
    const queue = [0];
    const show = () => ({
      queue: `[${queue.join(", ")}]`,
      visited: dist.flatMap((d, v) => (d >= 0 ? [v] : [])),
      dist: dist.flatMap((d, v) => (d >= 0 ? [`${v}=${d}`] : [])).join(", "),
    });
    const states = [{ curr: undefined as number | undefined, ...show() }];
    while (queue.length) {
      const v = queue.shift()!;
      for (const next of graph[v]!)
        if (dist[next] === -1) {
          dist[next] = dist[v]! + 1;
          queue.push(next);
        }
      states.push({ curr: v, ...show() });
      if (v === n - 1) break;
    }
    const shown = steps.map((step) => ({
      curr: step.visual!.markers?.[0]?.index,
      queue: value(step, "queue"),
      visited: step.visual!.visited,
      dist: value(step, "dist"),
    }));
    expect(shown).toEqual(states);
    for (const step of steps) {
      expect(step.visual!.edges).toEqual(first.edges);
      expect(step.visual!.positions).toEqual(first.positions);
    }
    expect(value(steps.at(-1)!, "result")).toBe(`${dist[n - 1]} tunnels`);
    // Animation data (D-061): the queue strip matches the queue text, each
    // travelled edge joins the current vertex to a vertex new in that step,
    // and the rings are the final distances.
    steps.forEach((step, k) => {
      const v = step.visual!;
      expect(`[${(v.queue ?? []).join(", ")}]`).toBe(value(step, "queue"));
      const before = new Set(steps[k - 1]?.visual?.visited ?? []);
      const fresh = (v.visited ?? []).filter((x) => !before.has(x));
      const curr = v.markers?.[0]?.index;
      expect(v.activeEdges ?? []).toEqual(
        k === 0 ? [] : fresh.map((x) => [curr, x]),
      );
    });
    expect(steps.at(-1)!.visual!.rings).toEqual(dist);
  });

  it("Level 11: each step clears the lowest 1 bit and counts it", () => {
    const steps = walkthrough("11-bit-manipulation-and-math");
    let n = parseInt(steps[0]!.visual!.cells.join(""), 2);
    const states = [n];
    while (n !== 0) {
      n &= n - 1;
      states.push(n);
    }
    const shown: number[] = [];
    for (const step of steps) {
      const bits = parseInt(step.visual!.cells.join(""), 2);
      if (shown.at(-1) !== bits) shown.push(bits);
      expect(value(step, "count")).toBe(String(shown.length - 1));
    }
    expect(shown).toEqual(states);
    expect(value(steps.at(-1)!, "result")).toBe(String(states.length - 1));
  });

  it("every prediction's answer is one of its options", () => {
    for (const folder of [
      "1-big-o-and-basics",
      "2-arrays-and-strings",
      "3-hashing",
      "4-sorting-fundamentals",
      "5-linked-lists",
      "6-stack-queue-deque",
      "7-recursion-divide-and-conquer",
      "8-trees-and-bst",
      "9-heap-priority-queue",
      "10-graph-fundamentals",
      "11-bit-manipulation-and-math",
    ]) {
      for (const step of walkthrough(folder)) {
        const predict = step.visual?.predict;
        if (!predict) continue;
        expect(predict.options[predict.answer]).toBeDefined();
        for (const name of predict.hides ?? []) {
          if (name === "next") expect(step.visual?.next).toBeTruthy();
          else expect(value(step, name)).toBeDefined();
        }
      }
    }
  });
});
