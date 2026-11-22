# Graph & Grid Problem Solving

## Learning objectives

- Model a problem as a graph when it does not look like one: grid cells, board positions, lock combinations, word changes.
- Run BFS from many sources at once to find the nearest of several targets.
- Add extra information to a search state, such as keys held or walls left to break, when position alone is not enough.
- Use union-find to answer "are these connected?" while edges keep arriving.
- Choose between BFS, DFS and union-find by what the question asks.

## Problem hook

A warehouse robot has a floor map with shelves and two charging stations. For every free spot, the planner wants to know how far the nearest charger is.

Nothing in that request says "graph". But every free cell is a place the robot can stand, and every step to a neighbouring cell is a move between places. Once the floor is seen as vertices and edges, the question becomes a search, and a single BFS that starts from both chargers at the same time answers it for every cell in one pass. Most hard grid and puzzle problems start with this change of view.

## Intuition

**Step 1: name the vertices and edges.**

- **Grid:** each cell is a vertex; up, down, left and right moves are edges (sometimes the diagonals too).
- **Board or puzzle:** each position of the whole board is a vertex; a legal move is an edge.
- **Lock, word ladder, number game:** each combination or word is a vertex; one allowed change is an edge.

You usually never build the adjacency list: compute the neighbours of a vertex when you need them.

**Step 2: pick the search by the question.**

- **Fewest moves with equal costs** → BFS.
- **Is there any way, or explore every cell of a region** → DFS or BFS.
- **Nearest of many targets** → multi-source BFS: put every source in the queue at distance 0.
- **Search from the outside in** → start from the border to find what can escape; the rest is enclosed.
- **Connectivity while edges arrive** → union-find.

**Step 3: decide what a state must remember.** If two arrivals at the same cell can lead to different futures (one robot has a key, the other does not; one can still break a wall), the state must include that difference: (row, column, keys) or (row, column, breaks left). The number of states multiplies, so keep the extra part small.

**Union-find in one paragraph.** Each vertex points to a parent; the root names its group. `find` walks to the root (and shortens the path for next time); `union` points one root at the other. Both run in nearly constant time, so checking and merging thousands of edges is cheap.

## When to use

Look for these signals in a problem statement:

- A grid, map, maze, board or floor plan.
- "Fewest moves", "nearest", "how far", "can it reach".
- Several starting points, exits or sources.
- Moves that change a combination, a word or a board position.
- Connections added one at a time, with questions about groups.

## Template code

**Multi-source BFS on a grid.**

```javascript
function nearestDistances(grid) {            // grid: 'S' source, '#' wall, '.' free
  const R = grid.length, C = grid[0].length;
  const dist = grid.map((row) => row.map(() => -1));
  const queue = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (grid[r][c] === "S") { dist[r][c] = 0; queue.push([r, c]); }   // every source first
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= R || nc < 0 || nc >= C) continue;
      if (grid[nr][nc] === "#" || dist[nr][nc] !== -1) continue;
      dist[nr][nc] = dist[r][c] + 1;         // first visit is the shortest
      queue.push([nr, nc]);
    }
  }
  return dist;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;

class Solution {
  public int[][] nearestDistances(char[][] grid) {   // 'S' source, '#' wall, '.' free
    int rows = grid.length, cols = grid[0].length;
    int[][] dist = new int[rows][cols];
    for (int[] row : dist) Arrays.fill(row, -1);
    ArrayDeque<int[]> queue = new ArrayDeque<>();
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        if (grid[r][c] == 'S') { dist[r][c] = 0; queue.add(new int[] {r, c}); }
      }
    }
    int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!queue.isEmpty()) {
      int[] cell = queue.poll();
      for (int[] m : moves) {
        int nr = cell[0] + m[0], nc = cell[1] + m[1];
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (grid[nr][nc] == '#' || dist[nr][nc] != -1) continue;
        dist[nr][nc] = dist[cell[0]][cell[1]] + 1;
        queue.add(new int[] {nr, nc});
      }
    }
    return dist;
  }
}
```

**Union-find.**

```javascript
class UnionFind {
  constructor(n) { this.parent = Array.from({ length: n }, (_, i) => i); this.groups = n; }
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];   // shorten the path
      x = this.parent[x];
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;                       // already connected
    this.parent[ra] = rb;
    this.groups--;
    return true;
  }
}
```

```java
class Solution {
  private int[] parent;
  private int groups;

  public Solution(int n) {
    parent = new int[n];
    for (int i = 0; i < n; i++) parent[i] = i;
    groups = n;
  }

  public int find(int x) {
    while (parent[x] != x) {
      parent[x] = parent[parent[x]];   // shorten the path
      x = parent[x];
    }
    return x;
  }

  public boolean union(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;        // already connected
    parent[ra] = rb;
    groups--;
    return true;
  }
}
```

## Complexity

| Technique | Time | Space |
| --- | --- | --- |
| BFS or DFS on a grid | O(rows · columns) | O(rows · columns) |
| Multi-source BFS | O(rows · columns), however many sources | O(rows · columns) |
| BFS over states with extra information k | O(rows · columns · k) | O(rows · columns · k) |
| Union-find with path shortening | nearly O(1) per operation | O(n) |

- An implicit graph is searched in O(states × neighbours per state), so count the states before you start.

## Common mistakes

- **Running one search per source** instead of one search from all sources.
- **Marking cells as visited when they are taken from the queue** instead of when they are added, which puts the same cell in the queue many times.
- **Leaving extra information out of the state,** so a better arrival is thrown away as "already visited".
- **Forgetting bounds checks** at the edge of the grid.
- **Using union-find without path shortening** on long chains, which makes `find` slow.

## Edge cases

- **A 1 × 1 grid,** or a start that is already the target.
- **No route at all:** return −1 or the agreed value.
- **No sources,** or every cell a source.
- **Walls around the start.**
- **Huge state spaces:** check that states × neighbours fits in time.

## Worked example

**Problem:** a map has land (1) and water (0), and the outside of the map counts as escape. A hiker walks between land cells that share a side. Return how many land cells have no route off the map.

**Explanation in words:** "Checking every land cell separately would repeat the same search many times. Instead I turn the question around: which land cells can the border reach? I start one BFS from every land cell on the border at once and mark everything it reaches. Any land cell left unmarked has no route out, so I count those. Each cell is added to the queue at most once, so the time is O(rows · columns) and the space is O(rows · columns) for the marks and the queue."

```javascript
function strandedLand(map) {
  const R = map.length, C = map[0].length;
  const reached = map.map((row) => row.map(() => false));
  const queue = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const border = r === 0 || c === 0 || r === R - 1 || c === C - 1;
      if (border && map[r][c] === 1) { reached[r][c] = true; queue.push([r, c]); }
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const [r, c] = queue[head];
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < R && nc >= 0 && nc < C && map[nr][nc] === 1 && !reached[nr][nc]) {
        reached[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  let stranded = 0;
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) if (map[r][c] === 1 && !reached[r][c]) stranded++;
  }
  return stranded;
}
```

```java
import java.util.ArrayDeque;

class Solution {
  public int strandedLand(int[][] map) {
    int rows = map.length, cols = map[0].length;
    boolean[][] reached = new boolean[rows][cols];
    ArrayDeque<int[]> queue = new ArrayDeque<>();
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        boolean border = r == 0 || c == 0 || r == rows - 1 || c == cols - 1;
        if (border && map[r][c] == 1) { reached[r][c] = true; queue.add(new int[] {r, c}); }
      }
    }
    int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
    while (!queue.isEmpty()) {
      int[] cell = queue.poll();
      for (int[] m : moves) {
        int nr = cell[0] + m[0], nc = cell[1] + m[1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && map[nr][nc] == 1 && !reached[nr][nc]) {
          reached[nr][nc] = true;
          queue.add(new int[] {nr, nc});
        }
      }
    }
    int stranded = 0;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) if (map[r][c] == 1 && !reached[r][c]) stranded++;
    }
    return stranded;
  }
}
```

**Trace:** for [[0, 0, 0, 0], [1, 0, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0]], the only border land cell is (1, 0), and it has no land neighbours. The three cells (1, 2), (2, 1) and (2, 2) are never reached, so the answer is 3.
