# Shortest Path & Topological Sort

## Learning objectives

- Find shortest paths on weighted graphs with Dijkstra's algorithm and a priority queue.
- Explain why Dijkstra needs non-negative weights, and use Bellman–Ford when weights can be negative or the number of edges is limited.
- Use 0-1 BFS when every weight is 0 or 1.
- Order tasks that depend on each other with Kahn's algorithm, detect cycles, and group tasks into levels.
- Compute longest or shortest paths in a DAG by processing vertices in topological order.

## Problem hook

A map app knows the travel time of every road. BFS would pick the route with the fewest roads, but one slow 60-minute road loses to three quick 5-minute roads. The app needs the route with the smallest **total** time.

Dijkstra's idea is simple: the closest place you have not finished yet cannot be reached any faster, because every other route to it would first pass through somewhere farther away. So you settle that place, try the roads leaving it, and repeat. A priority queue hands you the closest place each time.

The same graphs also answer a different kind of question. When edges mean "must happen before", the question is not how far but in which **order**: a build system, a course plan, a recipe. That is topological sort.

## Intuition

**Dijkstra's algorithm.**

1. Set every distance to ∞, except the start at 0. Put the start in a min-heap.
2. Pop the closest vertex. If its popped distance is larger than the best known, it is a stale entry: skip it.
3. For each edge u → v with weight w, if dist[u] + w < dist[v], improve dist[v] and push it.
4. Stop when the heap is empty (or when the target is popped).

It works because weights are never negative: extending a route never makes it shorter, so the closest unsettled vertex is final.

**When weights can be negative, or edges are limited.** Bellman–Ford relaxes every edge, again and again. After round i, every shortest route that uses at most i edges is known. V − 1 rounds give all shortest paths; a change in round V means a negative cycle. To allow at most k edges, run exactly k rounds, each from a copy of the previous round.

**Weights 0 and 1.** Use a deque: a 0-edge puts the vertex at the front, a 1-edge at the back. This is 0-1 BFS, linear time.

**Topological sort (Kahn).** Count the incoming edges (in-degree) of each vertex. Put every vertex with in-degree 0 in a queue. Take one, append it to the order, and lower the in-degree of its neighbours; any that reach 0 join the queue. If the order ends with fewer than V vertices, there is a cycle. Taking the queue a whole level at a time gives the minimum number of rounds (terms, build stages).

**Paths in a DAG.** In topological order, every vertex's predecessors are done before it, so finish[v] = max(finish[u]) + time[v] (critical path) or shortest paths in O(V + E) even with negative weights.

## When to use

Look for these signals in a problem statement:

- Weighted edges with "cheapest", "fastest", "minimum total" → Dijkstra.
- Negative weights, or "at most k stops / edges" → Bellman–Ford.
- Weights that are only 0 or 1 → 0-1 BFS.
- "Before", "after", "depends on", "prerequisite", "order" → topological sort.
- "Can everything be finished?" → cycle detection with Kahn.
- "Earliest finish with parallel work" → longest path in a DAG.

## Template code

**Dijkstra with a priority queue.**

```javascript
function dijkstra(n, edges, start) {           // edges: [from, to, weight]
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b, w] of edges) adj[a].push([b, w]);
  const dist = new Array(n).fill(Infinity);
  dist[start] = 0;
  const heap = new MinHeap((x, y) => x[0] - y[0]);   // any binary heap
  heap.push([0, start]);
  while (heap.size > 0) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;                 // stale entry
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) {
        dist[v] = d + w;
        heap.push([dist[v], v]);
      }
    }
  }
  return dist;
}

class MinHeap {
  constructor(less) { this.items = []; this.less = less; }
  get size() { return this.items.length; }
  push(x) {
    const a = this.items; a.push(x);
    for (let i = a.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (this.less(a[p], a[i]) <= 0) break;
      [a[p], a[i]] = [a[i], a[p]]; i = p;
    }
  }
  pop() {
    const a = this.items, top = a[0], last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && this.less(a[l], a[m]) < 0) m = l;
        if (r < a.length && this.less(a[r], a[m]) < 0) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.PriorityQueue;

class Solution {
  public long[] dijkstra(int n, int[][] edges, int start) {   // edges: {from, to, weight}
    List<int[]>[] adj = new List[n];
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    for (int[] e : edges) adj[e[0]].add(new int[] {e[1], e[2]});
    long[] dist = new long[n];
    Arrays.fill(dist, Long.MAX_VALUE);
    dist[start] = 0;
    PriorityQueue<long[]> heap = new PriorityQueue<>((x, y) -> Long.compare(x[0], y[0]));
    heap.add(new long[] {0, start});
    while (!heap.isEmpty()) {
      long[] top = heap.poll();
      int u = (int) top[1];
      if (top[0] > dist[u]) continue;            // stale entry
      for (int[] e : adj[u]) {
        if (top[0] + e[1] < dist[e[0]]) {
          dist[e[0]] = top[0] + e[1];
          heap.add(new long[] {dist[e[0]], e[0]});
        }
      }
    }
    return dist;
  }
}
```

**Topological sort with Kahn's algorithm.**

```javascript
function topoOrder(n, rules) {                 // rules: [before, after]
  const out = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [a, b] of rules) { out[a].push(b); indegree[b]++; }
  const queue = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  for (let head = 0; head < queue.length; head++) {
    for (const v of out[queue[head]]) {
      if (--indegree[v] === 0) queue.push(v);  // all its requirements are done
    }
  }
  return queue.length === n ? queue : null;    // null: there is a cycle
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int[] topoOrder(int n, int[][] rules) {   // rules: {before, after}
    List<Integer>[] out = new List[n];
    for (int i = 0; i < n; i++) out[i] = new ArrayList<>();
    int[] indegree = new int[n];
    for (int[] r : rules) { out[r[0]].add(r[1]); indegree[r[1]]++; }
    int[] queue = new int[n];
    int head = 0, tail = 0;
    for (int v = 0; v < n; v++) if (indegree[v] == 0) queue[tail++] = v;
    while (head < tail) {
      for (int v : out[queue[head++]]) {
        if (--indegree[v] == 0) queue[tail++] = v;
      }
    }
    return tail == n ? queue : null;               // null: there is a cycle
  }
}
```

## Complexity

| Algorithm | Time | Space | Use when |
| --- | --- | --- | --- |
| Dijkstra (binary heap) | O((V + E) log V) | O(V + E) | weights ≥ 0 |
| Bellman–Ford | O(V · E), or O(k · E) for k edges | O(V) | negative weights, edge limit |
| 0-1 BFS | O(V + E) | O(V + E) | weights 0 or 1 |
| Kahn's topological sort | O(V + E) | O(V + E) | "before / after" rules |
| Paths in a DAG | O(V + E) | O(V + E) | after a topological order |

- Plain BFS is the special case of Dijkstra where every weight is 1.

## Common mistakes

- **Using BFS on a weighted graph.** It counts edges, not total weight.
- **Forgetting the stale-entry check,** which does extra work, or settling a vertex when it is pushed instead of when it is popped.
- **Running Dijkstra with negative weights.**
- **Overflowing 32-bit integers** when weights are large; use 64-bit distances.
- **In Bellman–Ford with an edge limit, relaxing in place,** which lets one round use several new edges.
- **Forgetting to check that the topological order contains every vertex,** which hides a cycle.

## Edge cases

- **Start equals target:** distance 0.
- **Unreachable vertices:** keep ∞ and report −1 or the agreed value.
- **Several edges between the same pair;** keep all, the algorithm picks the best.
- **A DAG with no rules:** every vertex is in the first level.
- **A cycle in the rules:** no order exists.

## Worked example

**Problem:** a renovation has n jobs; job i takes days[i] days; rules [a, b] say job b can start only after job a finishes. Jobs can run in parallel and the rules never loop. Return the fewest days to finish every job. For days [3, 2, 5] and rules [[0, 2], [1, 2]] the answer is 8.

**Explanation in words:** "A job can start as soon as the last of its required jobs is done, so its finish time is its own length plus the latest finish among its requirements. That only works if I handle the requirements first, so I go through the jobs in topological order with Kahn's algorithm. When I take a job I know its start, compute its finish, and push that start time forward to the jobs that depend on it. The answer is the largest finish time. Every job and every rule is handled once, so the time is O(n + m) and the space is O(n + m)."

```javascript
function earliestFinish(days, rules) {
  const n = days.length;
  const out = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  const start = new Array(n).fill(0);
  for (const [a, b] of rules) { out[a].push(b); indegree[b]++; }
  const queue = [];
  for (let v = 0; v < n; v++) if (indegree[v] === 0) queue.push(v);
  let latest = 0;
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const finish = start[u] + days[u];
    latest = Math.max(latest, finish);
    for (const v of out[u]) {
      start[v] = Math.max(start[v], finish);   // wait for the slowest requirement
      if (--indegree[v] === 0) queue.push(v);
    }
  }
  return latest;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int earliestFinish(int[] days, int[][] rules) {
    int n = days.length;
    List<Integer>[] out = new List[n];
    for (int i = 0; i < n; i++) out[i] = new ArrayList<>();
    int[] indegree = new int[n];
    int[] start = new int[n];
    for (int[] r : rules) { out[r[0]].add(r[1]); indegree[r[1]]++; }
    int[] queue = new int[n];
    int head = 0, tail = 0;
    for (int v = 0; v < n; v++) if (indegree[v] == 0) queue[tail++] = v;
    int latest = 0;
    while (head < tail) {
      int u = queue[head++];
      int finish = start[u] + days[u];
      latest = Math.max(latest, finish);
      for (int v : out[u]) {
        start[v] = Math.max(start[v], finish);   // wait for the slowest requirement
        if (--indegree[v] == 0) queue[tail++] = v;
      }
    }
    return latest;
  }
}
```

**Trace:** jobs 0 and 1 have no requirements and finish on days 3 and 2. Job 2 starts at max(3, 2) = 3 and finishes on day 8. The answer is 8.
