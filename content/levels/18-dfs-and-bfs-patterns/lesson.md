# DFS & BFS Patterns

## Learning objectives

- Choose between breadth-first and depth-first search from what the question asks.
- Find shortest paths in a grid with BFS, and start BFS from many sources at once.
- Order tasks with dependencies using topological order (Kahn's algorithm), and detect when no order exists.
- Split a graph into two groups with two-colouring, or show that it cannot be done.
- Find shortest paths when edges have different costs, using a priority queue (Dijkstra's algorithm).

## Problem hook

A university has 2,000 courses, and many say "take this one first". A student asks: in what order can I take them all, and is that even possible?

Trying every order of 2,000 courses is out of the question. But some courses have no prerequisites at all, so they can come first. Taking them removes a requirement from other courses, which may now have none left, so they can come next. Repeating this lists every course in a valid order in one pass over the courses and their links, and if some courses are never freed, the requirements go in a circle and no order exists.

## Intuition

**BFS or DFS?** Both visit everything reachable in O(V + E).

- **BFS** explores in rings, so it finds the **fewest steps** when every step costs the same. Use it for shortest paths in unweighted graphs and grids, and for anything that spreads one step at a time.
- **DFS** follows one path to the end before backing up. Use it to explore every path, count components, detect cycles, and when the answer depends on finishing a whole branch first.

**Grids and many sources.** A grid is a graph whose edges go up, down, left and right. To find the distance from the **nearest** of several sources (exits, chargers, fires), put **all** sources in the queue at distance 0 before the search starts. BFS then grows from all of them at once, and each cell is reached first from its nearest source.

**Topological order (Kahn's algorithm).** In a directed graph, an edge a → b means "a before b". Count each vertex's **in-degree** (arrows pointing in). Every vertex with in-degree 0 can go first: put them in a queue. Take one out, add it to the order, and remove its outgoing edges by lowering its neighbours' in-degrees; any neighbour that reaches 0 joins the queue. If the order ends with fewer than V vertices, the remaining ones wait on each other in a **cycle**, and no order exists.

**Two-colouring.** To split people into two teams where every edge joins people on different teams, colour the start vertex A, its neighbours B, their neighbours A, and so on with BFS or DFS. If an edge ever joins two vertices of the same colour, it is impossible: the graph has an odd cycle.

**Different costs: Dijkstra's algorithm.** When edges have non-negative costs (minutes, prices), the fewest steps is not the cheapest route. Keep a min-heap (Level 9) of (distance, vertex). Always take the vertex with the smallest known distance; its distance is then final. Relax its edges: if going through it makes a neighbour cheaper, record the new distance and push it. This takes O((V + E) log V).

## When to use

Look for these signals in a problem statement:

- "Fewest steps", "shortest path", "minimum moves" with equal costs: BFS.
- Several starting points spreading at once: multi-source BFS.
- "Prerequisites", "dependencies", "must come before", "build order", "is there a cycle" in directed graphs: topological order.
- "Two groups", "two teams", "no two connected items together": two-colouring.
- "Cheapest", "fastest", "least total cost" with edge weights: Dijkstra.
- "All paths", "every way", "explore each branch": DFS.

## Template code

**Shortest path in a grid with BFS.** Cells with 0 are open, 1 is a wall; −1 means unreachable.

```javascript
function gridSteps(grid, sr, sc, tr, tc) {
  const R = grid.length, C = grid[0].length;
  const dist = grid.map((row) => row.map(() => -1));
  if (grid[sr][sc] === 1) return -1;
  dist[sr][sc] = 0;
  const queue = [[sr, sc]];
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    if (r === tr && c === tc) return dist[r][c];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= R || nc >= C) continue;
      if (grid[nr][nc] === 1 || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;   // marked when queued
      queue.push([nr, nc]);
    }
  }
  return -1;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;

class Solution {
  public int gridSteps(int[][] grid, int sr, int sc, int tr, int tc) {
    int rows = grid.length, cols = grid[0].length;
    int[][] dist = new int[rows][cols];
    for (int[] row : dist) Arrays.fill(row, -1);
    if (grid[sr][sc] == 1) return -1;
    dist[sr][sc] = 0;
    ArrayDeque<int[]> queue = new ArrayDeque<>();
    queue.add(new int[] {sr, sc});
    int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!queue.isEmpty()) {
      int[] cell = queue.poll();
      int r = cell[0], c = cell[1];
      if (r == tr && c == tc) return dist[r][c];
      for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        if (grid[nr][nc] == 1 || dist[nr][nc] != -1) continue;
        dist[nr][nc] = dist[r][c] + 1;   // marked when queued
        queue.add(new int[] {nr, nc});
      }
    }
    return -1;
  }
}
```

**Topological order with Kahn's algorithm.** Edges `[a, b]` mean a before b; an empty result means a cycle.

```javascript
function topoOrder(n, edges) {
  const out = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [a, b] of edges) {
    out[a].push(b);
    indegree[b]++;
  }
  const queue = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  const order = [];
  for (let head = 0; head < queue.length; head++) {
    const v = queue[head];
    order.push(v);
    for (const w of out[v]) {
      indegree[w]--;
      if (indegree[w] === 0) queue.push(w);   // all its requirements are done
    }
  }
  return order.length === n ? order : [];      // fewer than n: a cycle
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int[] topoOrder(int n, int[][] edges) {
    List<List<Integer>> out = new ArrayList<>();
    for (int v = 0; v < n; v++) out.add(new ArrayList<>());
    int[] indegree = new int[n];
    for (int[] e : edges) {
      out.get(e[0]).add(e[1]);
      indegree[e[1]]++;
    }
    ArrayDeque<Integer> queue = new ArrayDeque<>();
    for (int v = 0; v < n; v++) if (indegree[v] == 0) queue.add(v);
    int[] order = new int[n];
    int k = 0;
    while (!queue.isEmpty()) {
      int v = queue.poll();
      order[k++] = v;
      for (int w : out.get(v)) {
        if (--indegree[w] == 0) queue.add(w);  // all its requirements are done
      }
    }
    return k == n ? order : new int[0];        // fewer than n: a cycle
  }
}
```

## Complexity

| Pattern | Time | Extra space |
| --- | --- | --- |
| BFS or DFS over a graph | O(V + E) | O(V) |
| BFS over an R × C grid, single or many sources | O(R · C) | O(R · C) |
| Topological order (Kahn) | O(V + E) | O(V + E) |
| Two-colouring | O(V + E) | O(V) |
| Dijkstra with a binary heap | O((V + E) log V) | O(V + E) |

## Common mistakes

- **Using DFS for the fewest steps.** The first path DFS finds is not the shortest.
- **Running BFS once per source** for "nearest of many"; start one BFS with every source in the queue.
- **Forgetting vertices with no edges** in topological order: they have in-degree 0 and belong in the order.
- **Not checking the order's length,** which hides a cycle.
- **Using BFS with weighted edges,** or Dijkstra with negative weights.
- **Skipping the "already final" check** in Dijkstra when the same vertex appears in the heap more than once.

## Edge cases

- **Start equals target:** 0 steps.
- **The start or target is a wall,** or no path exists.
- **Several valid topological orders:** state which one the problem wants.
- **A graph in several pieces:** colour or order every piece, not only the one containing vertex 0.
- **Self-loops and repeated edges.**

## Worked example

**Problem:** n people and a list of rival pairs. Return whether everyone can be split into two teams so that no rival pair is on the same team.

**Explanation in words:** "This is two-colouring. I build an adjacency list and keep a colour per person, starting unset. For every person not yet coloured, I start a BFS: colour them 0, and give each neighbour the opposite colour. If a neighbour already has the same colour as the current person, two rivals would share a team, so I return false. The outer loop covers groups that are not connected. Each person and pair is handled once: O(V + E) time and O(V + E) space."

```javascript
function twoTeams(n, rivals) {
  const graph = Array.from({ length: n }, () => []);
  for (const [a, b] of rivals) {
    graph[a].push(b);
    graph[b].push(a);
  }
  const team = new Array(n).fill(-1);
  for (let s = 0; s < n; s++) {
    if (team[s] !== -1) continue;
    team[s] = 0;
    const queue = [s];
    for (let head = 0; head < queue.length; head++) {
      const v = queue[head];
      for (const w of graph[v]) {
        if (team[w] === -1) {
          team[w] = 1 - team[v];
          queue.push(w);
        } else if (team[w] === team[v]) {
          return false;
        }
      }
    }
  }
  return true;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
  public boolean twoTeams(int n, int[][] rivals) {
    List<List<Integer>> graph = new ArrayList<>();
    for (int v = 0; v < n; v++) graph.add(new ArrayList<>());
    for (int[] e : rivals) {
      graph.get(e[0]).add(e[1]);
      graph.get(e[1]).add(e[0]);
    }
    int[] team = new int[n];
    Arrays.fill(team, -1);
    for (int s = 0; s < n; s++) {
      if (team[s] != -1) continue;
      team[s] = 0;
      ArrayDeque<Integer> queue = new ArrayDeque<>();
      queue.add(s);
      while (!queue.isEmpty()) {
        int v = queue.poll();
        for (int w : graph.get(v)) {
          if (team[w] == -1) {
            team[w] = 1 - team[v];
            queue.add(w);
          } else if (team[w] == team[v]) {
            return false;
          }
        }
      }
    }
    return true;
  }
}
```
