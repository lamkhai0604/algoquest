# Greedy & Intervals

## Learning objectives

- Recognize problems where one safe local choice at each step leads to the best overall answer.
- Argue that a greedy choice is safe with an exchange argument, and break an unsafe one with a counterexample.
- Keep the most non-overlapping intervals by sorting on the end time.
- Merge overlapping intervals and count how many overlap at once with a sweep.
- Use greedy reach for jump problems and running totals for circular routes.

## Problem hook

A cinema has one screen and a list of films, each with a fixed start and end time. The manager wants to show as many films as possible.

Picking the shortest film first sounds sensible, but a short film that sits across the boundary of two long films blocks both of them. Picking the earliest start fails too: a three-hour epic that starts at 9:00 blocks everything else. The rule that works is to always lock in the film that **ends earliest** among those that still fit. It leaves the most time for everything after it, so no other first choice can do better.

## Intuition

**A greedy algorithm** builds the answer one decision at a time and never takes a decision back. That is only correct when each local choice is **safe**: some best answer contains it.

**The exchange argument.** Take any best plan. If it does not contain the greedy choice, swap its first item for the greedy one and show that the plan is still valid and no worse. For films: the film that ends earliest ends no later than the plan's first film, so swapping it in cannot cause an overlap. Repeat for every later step.

**Counterexamples kill wrong rules fast.** Before coding a greedy rule, try to break it with two or three intervals. "Shortest first" fails on [1, 5], [4, 7], [6, 10]: the shortest, [4, 7], blocks both others.

**Interval patterns.**

- **Most non-overlapping intervals:** sort by **end**; keep an interval when its start is at or after the last kept end.
- **Merge overlapping intervals:** sort by **start**; an interval either extends the last merged block or starts a new one.
- **How many overlap at once** (rooms, platforms): sort the starts and the ends separately and sweep through time, +1 at a start and −1 at an end.
- **Fewest points that hit every interval:** sort by end; put a point at the end of the first interval not yet hit.

**Other greedy shapes.** Jump games keep the farthest reachable index. Circular routes restart after any point where the running total goes negative. Change-making with coins 5, 10, 20 always pays with the largest bill that fits. With other coin systems (1, 3, 4 for 6) greedy fails, and Level 21's dynamic programming is needed.

## When to use

Look for these signals in a problem statement:

- Intervals, bookings, meetings, events with a start and an end.
- "Maximum number of …", "minimum number of rooms / arrows / jumps".
- A choice that can be ordered by one key (end time, deadline, size) where taking the extreme is clearly never worse.
- Large input (10⁵ or more) where sorting plus one pass is the only fast option.
- If you can find a small counterexample to every simple rule, the problem probably needs dynamic programming instead.

## Template code

**Most non-overlapping intervals (activity selection).**

```javascript
function mostIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[1] - b[1]);  // by end
  let count = 0;
  let lastEnd = -Infinity;
  for (const [start, end] of sorted) {
    if (start >= lastEnd) {     // fits after the last kept interval
      count++;
      lastEnd = end;            // keep it: the earliest end so far
    }
  }
  return count;
}
```

```java
import java.util.Arrays;

class Solution {
  public int mostIntervals(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, (a, b) -> Integer.compare(a[1], b[1]));  // by end
    int count = 0;
    long lastEnd = Long.MIN_VALUE;
    for (int[] interval : sorted) {
      if (interval[0] >= lastEnd) {   // fits after the last kept interval
        count++;
        lastEnd = interval[1];
      }
    }
    return count;
  }
}
```

**Merge overlapping intervals.**

```javascript
function merge(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);  // by start
  const blocks = [];
  for (const [start, end] of sorted) {
    const last = blocks[blocks.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);   // overlaps: extend the block
    } else {
      blocks.push([start, end]);          // a gap: start a new block
    }
  }
  return blocks;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

class Solution {
  public int[][] merge(int[][] intervals) {
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));  // by start
    List<int[]> blocks = new ArrayList<>();
    for (int[] interval : sorted) {
      if (!blocks.isEmpty() && interval[0] <= blocks.get(blocks.size() - 1)[1]) {
        int[] last = blocks.get(blocks.size() - 1);
        last[1] = Math.max(last[1], interval[1]);   // overlaps: extend
      } else {
        blocks.add(new int[] {interval[0], interval[1]});
      }
    }
    return blocks.toArray(new int[0][]);
  }
}
```

## Complexity

| Problem | Time | Extra space |
| --- | --- | --- |
| Most non-overlapping intervals | O(n log n) | O(1) besides sorting |
| Merge intervals | O(n log n) | O(n) for the output |
| Rooms needed (sweep) | O(n log n) | O(n) |
| Fewest points hitting every interval | O(n log n) | O(1) besides sorting |
| Jump reach, circular route | O(n) | O(1) |

- Sorting dominates; the greedy pass after it is linear.
- Brute force over subsets would be O(2ⁿ), which is why the safe choice matters.

## Common mistakes

- **Sorting by the wrong key:** start time for activity selection, or end time for merging.
- **Getting touching intervals wrong:** decide whether [1, 3] and [3, 5] overlap and use `<` or `<=` to match.
- **Trusting a greedy rule without a proof or a counterexample search.** Try two or three small cases first.
- **Mutating the input** while sorting or merging when the caller still needs it.
- **Forgetting that only the last merged block can overlap the next interval** and scanning all blocks instead.

## Edge cases

- **One interval,** or an empty list.
- **Intervals that touch** at one point.
- **One interval containing all others.**
- **Identical intervals.**
- **Negative times or very large values:** compare with `Integer.compare`, not by subtracting.

## Worked example

**Problem:** meetings are given as [start, end]; a room is free again at the moment its meeting ends. Return the fewest rooms that can host every meeting. For [[0, 30], [5, 10], [15, 20]] the answer is 2.

**Explanation in words:** "The number of rooms I need is the largest number of meetings running at the same moment. I sort the start times and the end times as two separate lists and sweep through the starts in order. Before each start, every meeting whose end is at or before that start has finished, so I free its room by moving a pointer through the sorted ends. Then the new meeting takes a room, and I record the most rooms in use so far. Each list is walked once after sorting, so the time is O(n log n) and the extra space is O(n) for the two lists."

```javascript
function roomsNeeded(meetings) {
  const starts = meetings.map((m) => m[0]).sort((a, b) => a - b);
  const ends = meetings.map((m) => m[1]).sort((a, b) => a - b);
  let inUse = 0;
  let most = 0;
  let j = 0;
  for (const start of starts) {
    while (ends[j] <= start) {   // meetings that are over free a room
      inUse--;
      j++;
    }
    inUse++;                     // this meeting takes a room
    most = Math.max(most, inUse);
  }
  return most;
}
```

```java
import java.util.Arrays;

class Solution {
  public int roomsNeeded(int[][] meetings) {
    int n = meetings.length;
    int[] starts = new int[n];
    int[] ends = new int[n];
    for (int i = 0; i < n; i++) {
      starts[i] = meetings[i][0];
      ends[i] = meetings[i][1];
    }
    Arrays.sort(starts);
    Arrays.sort(ends);
    int inUse = 0;
    int most = 0;
    int j = 0;
    for (int start : starts) {
      while (ends[j] <= start) {   // meetings that are over free a room
        inUse--;
        j++;
      }
      inUse++;
      most = Math.max(most, inUse);
    }
    return most;
  }
}
```

**Trace:** starts [0, 5, 15], ends [10, 20, 30]. Start 0: no end ≤ 0, one room in use. Start 5: no end ≤ 5, two rooms. Start 15: end 10 ≤ 15 frees a room, then the meeting takes it; still two. The answer is 2.
