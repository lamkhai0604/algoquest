export interface TraceState {
  curr: number;
  order: number[];
  frontier: number[];
  active: number[][];
}

/**
 * The searches the explorer plays (D-064): neighbours in increasing index
 * order; BFS marks a vertex when it joins the queue, DFS with an explicit
 * stack when it is taken off the stack.
 */
export function traceSearch(
  n: number,
  edges: number[][],
  directed: boolean,
  start: number,
  kind: "bfs" | "dfs",
): TraceState[] {
  const graph: number[][] = Array.from({ length: n }, () => []);
  for (const [a = 0, b = 0] of edges) {
    graph[a]?.push(b);
    if (!directed) graph[b]?.push(a);
  }
  for (const list of graph) list.sort((x, y) => x - y);
  const states: TraceState[] = [
    { curr: -1, order: [], frontier: [start], active: [] },
  ];
  const order: number[] = [];
  if (kind === "bfs") {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length > 0) {
      const v = queue.shift()!;
      order.push(v);
      const active: number[][] = [];
      for (const w of graph[v] ?? []) {
        if (seen.has(w)) continue;
        seen.add(w);
        queue.push(w);
        active.push([v, w]);
      }
      states.push({ curr: v, order: [...order], frontier: [...queue], active });
    }
  } else {
    const done = new Set<number>();
    const stack: [number, number][] = [[start, -1]];
    while (stack.length > 0) {
      const [v, from] = stack.pop()!;
      if (done.has(v)) continue;
      done.add(v);
      order.push(v);
      const next = (graph[v] ?? []).filter((w) => !done.has(w));
      for (let k = next.length - 1; k >= 0; k--) stack.push([next[k]!, v]);
      states.push({
        curr: v,
        order: [...order],
        frontier: stack.map(([w]) => w),
        active: from >= 0 ? [[from, v]] : [],
      });
    }
  }
  return states;
}
