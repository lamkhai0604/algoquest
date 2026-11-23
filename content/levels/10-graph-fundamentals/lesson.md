# Graph Fundamentals

## Learning objectives

- Describe a graph with vertices and edges, and tell directed from undirected graphs.
- Build an adjacency list from an edge list, and know when an adjacency matrix fits.
- Visit every reachable vertex with breadth-first search (a queue) and depth-first search (recursion or a stack), using a visited set.
- Find the fewest edges between two vertices with breadth-first search, and count connected components.
- Treat a grid as a graph whose vertices are cells and whose edges join neighbouring cells.

## Problem hook

```figure
{"kind": "image", "src": "/lesson-images/graph-metro.webp", "alt": "A metro map with ripples spreading from one station"}
```

A city has 300 metro stations and 400 tunnels between them. A rider at Station 12 asks: "What is the fewest number of stops to Station 205?"

There is no first or last station and no left or right. Lists, trees and heaps do not fit. Stations and tunnels form a **graph**, and the answer comes from spreading out from Station 12 one ring of stations at a time until Station 205 appears. Every station and tunnel is looked at about once, so even a large network answers in a few milliseconds.

## Intuition

**A graph is things and connections.** The things are **vertices** (also called nodes); the connections are **edges**. Stations and tunnels, people and friendships, web pages and links, cells of a map and their neighbours: all graphs.

**Directed or undirected.** A friendship goes both ways: an **undirected** edge. "A follows B" goes one way: a **directed** edge, drawn as an arrow. In an undirected graph, the **degree** of a vertex is its number of edges; in a directed graph, a vertex has an **in-degree** (arrows in) and an **out-degree** (arrows out).

**How problems give a graph.** Usually as a vertex count `n` (vertices `0` to `n − 1`) and an **edge list** such as `[[0, 1], [1, 2]]`, or as a **grid** of cells.

**The adjacency list** is the usual way to store a graph in code: for each vertex, the list of its neighbours. Build it in one pass over the edges. For an undirected edge `[a, b]`, add `b` to `a`'s list **and** `a` to `b`'s list. It uses O(V + E) memory. An **adjacency matrix** is a V × V table where cell `[a][b]` says whether the edge exists: O(1) to check one edge, but O(V²) memory, so it suits small or dense graphs.

**Breadth-first search (BFS)** visits vertices in rings: the start, then every vertex 1 edge away, then 2 edges away, and so on. It uses a **queue** (Level 6): take a vertex from the front, and add each neighbour not seen before to the back. Because rings are visited in order, the first time BFS reaches a vertex is along the **fewest edges**. That makes BFS the tool for shortest paths when every edge counts the same.

```figure
{
  "kind": "visual",
  "caption": "BFS from **A** reaches the vertices in rings: the start, then every vertex 1 edge away, then 2, 3 and 4.",
  "frames": [
    {"op": "start at A", "visual": {"cells": ["A", "B", "C", "D", "E", "F"], "edges": [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], "visited": [0], "rings": [0, -1, -1, -1, -1, -1]}},
    {"op": "ring 1: B, C", "visual": {"cells": ["A", "B", "C", "D", "E", "F"], "edges": [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], "visited": [0, 1, 2], "rings": [0, 1, 1, -1, -1, -1]}},
    {"op": "ring 2: D", "visual": {"cells": ["A", "B", "C", "D", "E", "F"], "edges": [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], "visited": [0, 1, 2, 3], "rings": [0, 1, 1, 2, -1, -1]}},
    {"op": "rings 3 and 4: E, F", "visual": {"cells": ["A", "B", "C", "D", "E", "F"], "edges": [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5]], "visited": [0, 1, 2, 3, 4, 5], "rings": [0, 1, 1, 2, 3, 4]}}
  ]
}
```

**Depth-first search (DFS)** goes as far as it can along one path, then backs up and tries the next branch. With recursion (Level 7) it is a few lines: visit a vertex, then call DFS on each unvisited neighbour. A stack does the same without recursion. DFS is natural for "visit everything that is connected" and "count the groups".

**The visited set is not optional.** Graphs can have cycles: 0 → 1 → 2 → 0. Without remembering which vertices were already seen, a search loops forever. Mark a vertex when it is **added** to the queue (BFS) or **entered** (DFS), so it is never added twice.

**Connected components.** In an undirected graph, a **component** is a group of vertices that can all reach each other. To count components, loop over every vertex; each time you find one not yet visited, that is a new component, and one BFS or DFS from it marks its whole group.

**Grids are graphs.** Each cell is a vertex, and its up, down, left and right neighbours are its edges. No adjacency list is needed: compute the neighbours with a list of four directions, and check that they are inside the grid.

**Cost.** BFS and DFS look at each vertex once and each edge once or twice: **O(V + E)** time, and O(V) memory for the visited set and the queue or recursion. On an R × C grid that is O(R · C).

## When to use

Look for these signals in a problem statement:

- Items with **connections**: roads, flights, friendships, links, prerequisites, wires.
- "Is there a way from A to B", "can everyone be reached": BFS or DFS from A.
- "The fewest steps, moves, hops or minutes" when every step costs the same: BFS.
- "How many groups, islands, regions or networks": count connected components.
- A grid of cells with "neighbouring" or "adjacent" cells: a grid graph.
- Something that **spreads** one step per minute from several places at once: BFS that starts with all of them in the queue.

## Template code

**Build an adjacency list** from `n` and an undirected edge list.

```javascript
function buildGraph(n, edges) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);   // undirected: both directions
  }
  return graph;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<List<Integer>> buildGraph(int n, int[][] edges) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int v = 0; v < n; v++) graph.add(new ArrayList<>());
    for (int[] e : edges) {
      graph.get(e[0]).add(e[1]);
      graph.get(e[1]).add(e[0]); // undirected: both directions
    }
    return graph;
  }
}
```

**BFS: the fewest edges from `start` to every vertex.** `-1` means unreachable.

```javascript
function fewestEdges(graph, start) {
  const dist = new Array(graph.length).fill(-1);
  dist[start] = 0;                     // marked when added
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const v = queue[head];             // take from the front
    for (const next of graph[v]) {
      if (dist[next] === -1) {
        dist[next] = dist[v] + 1;
        queue.push(next);              // add to the back
      }
    }
  }
  return dist;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.List;

class Solution {
  public int[] fewestEdges(List<List<Integer>> graph, int start) {
    int[] dist = new int[graph.size()];
    Arrays.fill(dist, -1);
    dist[start] = 0;                     // marked when added
    ArrayDeque<Integer> queue = new ArrayDeque<>();
    queue.add(start);
    while (!queue.isEmpty()) {
      int v = queue.poll();              // take from the front
      for (int next : graph.get(v)) {
        if (dist[next] == -1) {
          dist[next] = dist[v] + 1;
          queue.add(next);               // add to the back
        }
      }
    }
    return dist;
  }
}
```

**DFS on a grid: the size of the region around one cell.** Cells with `1` are land.

```javascript
function regionSize(grid, r, c) {
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return 0;
  if (grid[r][c] !== 1) return 0;
  grid[r][c] = 2;                        // mark visited
  return 1 + regionSize(grid, r + 1, c) + regionSize(grid, r - 1, c)
           + regionSize(grid, r, c + 1) + regionSize(grid, r, c - 1);
}
```

```java
class Solution {
  public int regionSize(int[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return 0;
    if (grid[r][c] != 1) return 0;
    grid[r][c] = 2;                      // mark visited
    return 1 + regionSize(grid, r + 1, c) + regionSize(grid, r - 1, c)
             + regionSize(grid, r, c + 1) + regionSize(grid, r, c - 1);
  }
}
```

## Complexity

| Task | Time | Extra space |
| --- | --- | --- |
| Build an adjacency list | O(V + E) | O(V + E) |
| Build an adjacency matrix | O(V² + E) | O(V²) |
| Check one edge: list / matrix | O(degree) / O(1) | — |
| BFS or DFS over the whole graph | O(V + E) | O(V) |
| BFS or DFS over an R × C grid | O(R · C) | O(R · C) |
| Count connected components | O(V + E) | O(V) |

- Recursive DFS uses the call stack: as deep as the longest path it follows, up to O(V). On very large grids, an explicit stack or BFS avoids a stack overflow.

## Common mistakes

- **No visited set.** A cycle sends the search around forever.
- **Marking too late in BFS.** Marking a vertex when it is taken out of the queue lets the same vertex be added many times; mark it when it is added.
- **Forgetting the second direction** of an undirected edge when building the adjacency list.
- **Using DFS for the fewest steps.** DFS finds a path, not the shortest one; BFS finds the shortest when every edge counts the same.
- **Going outside the grid.** Check the row and column bounds before reading a neighbour.
- **Missing isolated vertices.** A vertex with no edges is still a component of its own; loop over all `n` vertices, not only those in the edge list.

## Edge cases

- **Start equals target:** 0 edges.
- **No edges at all:** every vertex is its own component, and only the start is reachable.
- **Target unreachable:** return the "not found" value, such as `-1` or `false`.
- **One vertex, or a 1 × 1 grid.**
- **Several edges into the same vertex,** and a graph that is one long chain.

## Worked example

**Problem:** given `n` vertices, an undirected edge list and a `start` vertex, return how many vertices can be reached from `start`, counting `start` itself.

**Explanation in words:** "I build an adjacency list, then run BFS from `start`. A vertex is marked as seen when it is added to the queue, so each vertex enters once, and I count it then. When the queue is empty, the count is every vertex connected to `start`. Each vertex and edge is handled once: O(V + E) time, and O(V + E) space for the lists, the seen array and the queue."

```javascript
function reachableCount(n, edges, start) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const seen = new Array(n).fill(false);
  seen[start] = true;
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    for (const next of graph[queue[head]]) {
      if (!seen[next]) {
        seen[next] = true;
        queue.push(next);
      }
    }
  }
  return queue.length;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int reachableCount(int n, int[][] edges, int start) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int v = 0; v < n; v++) graph.add(new ArrayList<>());
    for (int[] e : edges) {
      graph.get(e[0]).add(e[1]);
      graph.get(e[1]).add(e[0]);
    }
    boolean[] seen = new boolean[n];
    seen[start] = true;
    int[] queue = new int[n];
    int head = 0, tail = 0;
    queue[tail++] = start;
    while (head < tail) {
      for (int next : graph.get(queue[head++])) {
        if (!seen[next]) {
          seen[next] = true;
          queue[tail++] = next;
        }
      }
    }
    return tail;
  }
}
```
