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

  it("Level 12: the pointers move by the sum rule and the window is the range between them", () => {
    const steps = walkthrough("12-two-pointers");
    const nums = steps[0]!.visual!.cells.map(Number);
    const target = Number(value(steps[0]!, "target"));
    let left = 0;
    let right = nums.length - 1;
    let compared = 0;
    for (const step of steps.slice(1)) {
      const v = step.visual!;
      const at = (label: string) =>
        v.markers!.find((m) => m.label === label)!.index;
      expect([at("left"), at("right")]).toEqual([left, right]);
      expect(v.window).toEqual([left, right]);
      const sum = nums[left]! + nums[right]!;
      if (step.title.startsWith("Compare")) {
        compared++;
        expect(value(step, "sum")).toBe(
          `${nums[left]} + ${nums[right]} = ${sum}`,
        );
        if (sum < target) left++;
        else if (sum > target) right--;
      }
    }
    expect(nums[left]! + nums[right]!).toBe(target);
    expect(compared).toBe(5);
  });

  it("Level 13: the window matches a reference longest-unique-run scan", () => {
    const steps = walkthrough("13-sliding-window");
    const text = steps[0]!.visual!.cells;
    // Reference: the window after each letter enters, and the best length.
    const states: { window: number[]; best: number }[] = [];
    let left = 0;
    let best = 0;
    text.forEach((c, right) => {
      while (text.slice(left, right).includes(c)) left++;
      best = Math.max(best, right - left + 1);
      states.push({ window: [left, right], best });
    });
    const shown = steps.map((step) => ({
      window: step.visual!.window!,
      best: Number(value(step, "best")),
    }));
    expect(shown).toEqual(states);
    for (const step of steps) {
      const [from = 0, to = 0] = step.visual!.window!;
      expect(value(step, "in window")).toBe(text.slice(from, to + 1).join(" "));
    }
    expect(value(steps.at(-1)!, "result")).toBe(String(best));
  });

  it("Level 14: the prefix array grows by one total per step and queries subtract two totals", () => {
    const steps = walkthrough("14-prefix-sum");
    const nums = steps[0]!.visual!.cells.map(Number);
    const prefix = [0];
    for (const x of nums) prefix.push(prefix.at(-1)! + x);
    let built = 1;
    for (const step of steps) {
      const shown = JSON.parse(value(step, "prefix")!) as number[];
      expect(shown).toEqual(prefix.slice(0, shown.length));
      expect(shown.length).toBeGreaterThanOrEqual(built);
      built = shown.length;
      const w = step.visual!.window;
      if (w && w.length === 2) {
        const [l = 0, r = 0] = w;
        const sum = prefix[r + 1]! - prefix[l]!;
        expect(value(step, "query")).toBe(
          `prefix[${r + 1}] − prefix[${l}] = ${prefix[r + 1]} − ${prefix[l]} = ${sum}`,
        );
      }
    }
    expect(built).toBe(nums.length + 1);
  });

  it("Level 15: each look halves the range like a reference binary search", () => {
    const steps = walkthrough("15-binary-search");
    const nums = steps[0]!.visual!.cells.map(Number);
    const target = Number(value(steps[0]!, "target"));
    let lo = 0;
    let hi = nums.length - 1;
    let looks = 0;
    for (const step of steps.filter((s) => s.title.startsWith("Check"))) {
      expect(step.visual!.window).toEqual([lo, hi]);
      const mid = lo + Math.floor((hi - lo) / 2);
      const at = step.visual!.markers!.find((m) => m.label.includes("mid"));
      expect(at?.index).toBe(mid);
      looks++;
      if (nums[mid] === target) break;
      if (nums[mid]! < target) lo = mid + 1;
      else hi = mid - 1;
      expect(Number(value(step, "left in range"))).toBe(hi - lo + 1);
    }
    expect(nums[lo + Math.floor((hi - lo) / 2)]).toBe(target);
    expect(looks).toBeLessThanOrEqual(Math.ceil(Math.log2(nums.length + 1)));
  });

  it("Level 16: slow and fast follow Floyd's algorithm on the next pointers", () => {
    const steps = walkthrough("16-fast-and-slow-pointers");
    const next = steps[0]!.visual!.next!;
    const at = (step: WalkthroughStep, label: string) =>
      step.visual!.markers!.find((m) => m.label.split(", ").includes(label))!
        .index;
    let slow = 0;
    let fast = 0;
    let k = 1;
    do {
      slow = next[slow]!;
      fast = next[next[fast]!]!;
      expect([at(steps[k]!, "slow"), at(steps[k]!, "fast")]).toEqual([
        slow,
        fast,
      ]);
      k++;
    } while (slow !== fast);
    let a = 0;
    k++; // the "find the start" step
    while (a !== slow) {
      a = next[a]!;
      slow = next[slow]!;
      expect([at(steps[k]!, "a"), at(steps[k]!, "slow")]).toEqual([a, slow]);
      k++;
    }
    expect(k).toBe(steps.length);
    expect(value(steps.at(-1)!, "result")).toBe(`[${a}]`);
  });

  it("Level 17: the stack and answers match a reference next-greater scan", () => {
    const steps = walkthrough("17-monotonic-stack");
    const nums = steps[0]!.visual!.cells.map(Number);
    const answer: string[] = nums.map(() => "?");
    const stack: number[] = [];
    nums.forEach((x, i) => {
      while (stack.length && x > nums[stack.at(-1)!]!)
        answer[stack.pop()!] = String(x);
      stack.push(i);
      const step = steps[i + 1]!;
      expect(value(step, "stack")).toBe(
        `[${stack.map((j) => nums[j]).join(", ")}]`,
      );
      expect(value(step, "answer")).toBe(`[${answer.join(", ")}]`);
    });
    for (const j of stack) answer[j] = "-1";
    expect(value(steps.at(-1)!, "result")).toBe(`[${answer.join(", ")}]`);
  });

  it("Level 18: Kahn's algorithm frees courses in the order shown", () => {
    const steps = walkthrough("18-dfs-and-bfs-patterns");
    const first = steps[0]!.visual!;
    const n = first.cells.length;
    const out: number[][] = Array.from({ length: n }, () => []);
    const indegree = new Array<number>(n).fill(0);
    for (const [a = 0, b = 0] of first.edges!) {
      out[a]!.push(b);
      indegree[b]!++;
    }
    const queue = indegree.flatMap((d, v) => (d === 0 ? [v] : []));
    expect(first.queue).toEqual(queue);
    const order: number[] = [];
    for (const step of steps.slice(1).filter((s) => !s.visual!.explore)) {
      const v = queue.shift()!;
      order.push(v);
      for (const w of out[v]!) if (--indegree[w]! === 0) queue.push(w);
      expect(step.visual!.markers![0]!.index).toBe(v);
      expect(step.visual!.queue).toEqual(queue);
      expect(value(step, "order")).toBe(order.join(" → "));
    }
    expect(order).toHaveLength(n);
    expect(steps.at(-1)!.visual!.explore).toBe(true);
  });

  it("Level 19: the decision tree grows in depth-first order, one subset per leaf", () => {
    const steps = walkthrough("19-backtracking");
    const numbers = [1, 2, 3];
    const visits: { index: number; path: number[] }[] = [];
    const walk = (i: number, depth: number, path: number[]) => {
      visits.push({ index: i, path });
      if (depth === numbers.length) return;
      walk(2 * i + 1, depth + 1, [...path, numbers[depth]!]);
      walk(2 * i + 2, depth + 1, path);
    };
    walk(0, 0, []);
    expect(steps).toHaveLength(visits.length);
    let leaves = 0;
    steps.forEach((step, k) => {
      const { index, path } = visits[k]!;
      expect(step.visual!.markers![0]!.index).toBe(index);
      expect(value(step, "path")).toBe(`[${path.join(", ")}]`);
      // Only nodes reached so far are drawn.
      const drawn = step.visual!.cells.filter((c) => c !== "").length;
      expect(drawn).toBe(k + 1);
      if (index >= 7) leaves++;
      expect(Number(value(step, "subsets found"))).toBe(leaves);
    });
    expect(leaves).toBe(2 ** numbers.length);
  });

  it("Level 20: activity selection keeps each meeting that starts after the last kept end", () => {
    const steps = walkthrough("20-greedy-and-intervals");
    const intervals = steps[0]!.visual!.intervals!;
    const ends = intervals.map(([, e = 0]) => e);
    expect(ends).toEqual([...ends].sort((a, b) => a - b));
    let last = -Infinity;
    const kept: number[] = [];
    steps.slice(1).forEach((step, i) => {
      const [s = 0, e = 0] = intervals[i]!;
      if (s >= last) {
        kept.push(i);
        last = e;
      }
      expect(step.visual!.markers![0]!.index).toBe(i);
      expect(step.visual!.chosen).toEqual(kept);
      expect(step.visual!.line).toBe(last);
      expect(Number(value(step, "kept"))).toBe(kept.length);
    });
    expect(kept).toHaveLength(3);
  });

  it("Level 21: each dp cell is the better of skipping or taking the house", () => {
    const steps = walkthrough("21-dynamic-programming-fundamentals");
    const gifts = JSON.parse(value(steps[0]!, "gifts")!) as number[];
    const dp: number[] = [];
    gifts.forEach((g, i) => {
      dp.push(
        i === 0
          ? g
          : i === 1
            ? Math.max(gifts[0]!, g)
            : Math.max(dp[i - 1]!, dp[i - 2]! + g),
      );
      const step = steps[i + 1]!;
      expect(step.visual!.markers![0]!.index).toBe(i);
      expect(step.visual!.cells.slice(0, i + 1)).toEqual(dp.map(String));
      expect(step.visual!.cells.slice(i + 1).every((c) => c === "?")).toBe(
        true,
      );
      if (i >= 2) expect(step.visual!.window).toEqual([i - 2, i - 1]);
    });
    expect(value(steps.at(-1)!, "result")).toBe(String(dp.at(-1)));
  });

  it("Level 22: each problem names a signal and a pattern, in order", () => {
    const steps = walkthrough("22-mixed-pattern-problems");
    const problems = steps.slice(1);
    expect(problems).toHaveLength(steps[0]!.visual!.cells.length);
    problems.forEach((step, i) => {
      expect(step.visual!.markers![0]!.index).toBe(i);
      expect(value(step, "signal")).toBeTruthy();
      expect(value(step, "pattern")).toBeTruthy();
    });
    expect(value(problems[2]!, "pattern")).toBe("BFS");
    expect(value(problems[5]!, "pattern")).toBe("Dynamic programming");
  });

  it("Level 23: the table fills the longest common subsequence cell by cell", () => {
    const steps = walkthrough("23-dynamic-programming-1d-and-2d");
    const first = steps[0]!.visual!;
    const a = first.rowLabels!.slice(1).join("");
    const b = first.columnLabels!.slice(1).join("");
    const cols = b.length + 1;
    const dp = Array.from({ length: a.length + 1 }, () =>
      new Array<number>(cols).fill(0),
    );
    let k = 1;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const match = a[i - 1] === b[j - 1];
        dp[i]![j] = match
          ? dp[i - 1]![j - 1]! + 1
          : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
        const v = steps[k++]!.visual!;
        expect(v.markers![0]!.index).toBe(i * cols + j);
        expect(v.cells[i * cols + j]).toBe(String(dp[i]![j]));
        expect(v.reads).toEqual(
          match
            ? [(i - 1) * cols + j - 1]
            : [(i - 1) * cols + j, i * cols + j - 1],
        );
      }
    }
    expect(k).toBe(steps.length);
    expect(value(steps.at(-1)!, "result")).toBe(
      String(dp[a.length]![b.length]),
    );
  });

  it("Level 24: multi-source BFS fills the grid one wave at a time", () => {
    const steps = walkthrough("24-graph-and-grid-problems");
    const first = steps[0]!.visual!;
    const cols = first.columnLabels!.length;
    const grid = first.cells;
    const dist: number[] = grid.map((c) => (c === "S" ? 0 : -1));
    let wave = grid.flatMap((c, i) => (c === "S" ? [i] : []));
    const waves: number[][] = [];
    while (wave.length) {
      waves.push(wave);
      const next: number[] = [];
      for (const i of wave) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nr = r + dr;
          const nc = c + dc;
          const j = nr * cols + nc;
          if (nr < 0 || nc < 0 || nc >= cols || j >= grid.length) continue;
          if (grid[j] === "#" || dist[j] !== -1) continue;
          dist[j] = dist[i]! + 1;
          next.push(j);
        }
      }
      wave = next;
    }
    expect(steps).toHaveLength(waves.length + 1);
    waves.forEach((w, k) => {
      const v = steps[k + 1]!.visual!;
      for (const i of w) expect(v.cells[i]).toBe(String(k));
      expect(v.reads ?? []).toEqual(k === 0 ? [] : [...waves[k - 1]!]);
    });
  });

  it("Level 25: Dijkstra settles towns in order of distance", () => {
    const steps = walkthrough("25-shortest-path-and-topological-sort");
    const first = steps[0]!.visual!;
    const n = first.cells.length;
    const adj: [number, number][][] = Array.from({ length: n }, () => []);
    first.edges!.forEach(([a = 0, b = 0], e) => {
      const w = Number(first.weights![e]);
      adj[a]!.push([b, w]);
      adj[b]!.push([a, w]);
    });
    const dist = new Array<number>(n).fill(Infinity);
    dist[0] = 0;
    const done: number[] = [];
    steps.slice(1).forEach((step) => {
      let u = -1;
      for (let i = 0; i < n; i++) {
        if (!done.includes(i) && (u < 0 || dist[i]! < dist[u]!)) u = i;
      }
      done.push(u);
      for (const [v, w] of adj[u]!) {
        if (!done.includes(v)) dist[v] = Math.min(dist[v]!, dist[u]! + w);
      }
      expect(step.visual!.markers![0]!.index).toBe(u);
      expect(step.visual!.visited).toEqual(done);
      first.cells.forEach((name, i) => {
        expect(value(step, name)).toBe(dist[i] === Infinity ? "∞" : String(dist[i]));
      });
    });
    expect(done).toHaveLength(n);
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
      "12-two-pointers",
      "13-sliding-window",
      "14-prefix-sum",
      "15-binary-search",
      "16-fast-and-slow-pointers",
      "17-monotonic-stack",
      "18-dfs-and-bfs-patterns",
      "19-backtracking",
      "20-greedy-and-intervals",
      "21-dynamic-programming-fundamentals",
      "22-mixed-pattern-problems",
      "23-dynamic-programming-1d-and-2d",
      "24-graph-and-grid-problems",
      "25-shortest-path-and-topological-sort",
    ]) {
      for (const step of walkthrough(folder)) {
        const predict = step.visual?.predict;
        if (!predict) continue;
        expect(predict.options[predict.answer]).toBeDefined();
        for (const name of predict.hides ?? []) {
          if (name === "next") expect(step.visual?.next).toBeTruthy();
          else if (name === "cell")
            expect(step.visual?.markers?.length).toBeTruthy();
          else expect(value(step, name)).toBeDefined();
        }
      }
    }
  });
});
