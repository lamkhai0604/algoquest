import { describe, expect, it } from "vitest";
import { traceSearch } from "./traceSearch";

// 0 - 1, 0 - 2, 1 - 3, 2 - 3, 3 - 4
const EDGES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [3, 4],
];

describe("traceSearch", () => {
  it("visits by rings in BFS and marks a vertex when it is queued", () => {
    const states = traceSearch(5, EDGES, false, 0, "bfs");
    expect(states.at(-1)!.order).toEqual([0, 1, 2, 3, 4]);
    expect(states[1]!.frontier).toEqual([1, 2]);
    expect(states[1]!.active).toEqual([
      [0, 1],
      [0, 2],
    ]);
  });

  it("goes deep first in DFS, smallest neighbour first", () => {
    const states = traceSearch(5, EDGES, false, 0, "dfs");
    expect(states.at(-1)!.order).toEqual([0, 1, 3, 2, 4]);
    expect(states[2]!.active).toEqual([[1, 3]]);
  });

  it("follows edge direction in a directed graph and can start anywhere", () => {
    const states = traceSearch(5, EDGES, true, 3, "bfs");
    expect(states.at(-1)!.order).toEqual([3, 4]);
  });
});
