# Mixed Pattern Problems

## Learning objectives

- Read a problem statement for signals that point to a pattern: input shape, what is asked, and the limits.
- Turn the input size into a target running time before choosing an approach.
- Choose between patterns from Levels 1–21 when the statement does not name one.
- Check an idea by hand on a small example, including a case that might break it, before writing code.
- Explain the choice out loud: signal, pattern, time and space.

## Problem hook

So far every level told you the pattern in its title. Interviews do not. You hear "a list of prices", "the fewest moves", "every way to choose", and the first minutes go to figuring out what kind of problem it is.

Experienced solvers are not faster because they know more tricks. They notice a few signals in the wording and the limits, and each signal narrows the choice: "sorted" and "pair" suggest two pointers, "fewest steps" suggests BFS, "count the ways" suggests dynamic programming. This level practises that first step on problems that do not say which pattern to use.

## Intuition

**Step 1: the limits give the target time.**

| n up to | Aim for |
| --- | --- |
| 10–20 | O(2ⁿ) or O(n!) is fine: backtracking |
| 100–500 | O(n³) or O(n²) |
| 10³–10⁴ | O(n²) at most, better O(n log n) |
| 10⁵–10⁶ | O(n log n) or O(n) |
| 10⁹ or more (a value, not a length) | O(log n): binary search or math |

**Step 2: what is asked, and the shape of the input.**

- **A pair or triple in sorted data** → two pointers. Unsorted with a target → hash map.
- **A contiguous stretch with a condition** (longest, shortest, at most k) → sliding window. Sums of ranges, many times → prefix sums.
- **The smallest or largest value that still works,** where "works" stays true past a point → binary search on the answer.
- **Next greater or smaller element** → monotonic stack.
- **Fewest steps with equal costs** → BFS. **With different costs** → Dijkstra. **Order with prerequisites** → topological sort.
- **Every option** (all subsets, arrangements, ways to fill a board) → backtracking.
- **Count the ways, or the best value, where choices repeat** → dynamic programming.
- **Intervals, deadlines, a choice that is clearly safe** → greedy after sorting, but look for a counterexample first.
- **Top k, the k-th, a running minimum** → heap.
- **Seen before, count of each, group by key** → hash map.

**Step 3: test the idea on a tiny case.** Write three to five values by hand and run the idea. Try a case that might break it: all equal values, one element, negative numbers, a tie.

**Step 4: say it.** "The signal is …, so I'll use …; it runs in … time and … space, because …". The grader for this app checks the same things.

## When to use

Use this checklist at the start of every problem in this level and in interviews:

- Read the limits first and write down the target time.
- Underline the words that describe the input (sorted, grid, graph, string, intervals).
- Underline the words that describe the output (fewest, longest, all, count, any, k-th).
- Name two candidate patterns and rule one out with a small example.
- Only then start writing code.

## Template code

**A small helper that checks an idea against brute force on random inputs.** It is how the reference answers in this app are checked, and it is worth doing whenever a fast idea is not obviously correct.

```javascript
function crossCheck(fast, slow, makeInput, rounds = 500) {
  for (let r = 0; r < rounds; r++) {
    const input = makeInput();                    // a small random case
    const a = JSON.stringify(fast(...input));
    const b = JSON.stringify(slow(...input));
    if (a !== b) return { input, fast: a, slow: b };   // a counterexample
  }
  return null;                                    // no difference found
}

// Example: check a one-pass hash-map count against a slow, obvious count.
const randomList = () => [Array.from({ length: 5 }, () => Math.floor(Math.random() * 10))];
const mostCommon = (a) => {
  const count = new Map();
  for (const x of a) count.set(x, (count.get(x) ?? 0) + 1);
  return Math.max(...count.values());
};
const mostCommonSlow = (a) => Math.max(...a.map((x) => a.filter((y) => y === x).length));
crossCheck(mostCommon, mostCommonSlow, randomList);  // null: they agree
```

```java
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

class Solution {
  // Fast: one pass with a hash map.
  static int mostCommon(int[] a) {
    Map<Integer, Integer> count = new HashMap<>();
    int best = 0;
    for (int x : a) best = Math.max(best, count.merge(x, 1, Integer::sum));
    return best;
  }

  // Slow but obviously correct: count every value again.
  static int mostCommonSlow(int[] a) {
    int best = 0;
    for (int x : a) {
      int c = 0;
      for (int y : a) if (x == y) c++;
      best = Math.max(best, c);
    }
    return best;
  }

  public static void main(String[] args) {
    Random random = new Random(1);
    for (int r = 0; r < 500; r++) {
      int[] a = random.ints(5, 0, 10).toArray();   // a small random case
      if (mostCommon(a) != mostCommonSlow(a)) {
        System.out.println("Counterexample: " + java.util.Arrays.toString(a));
        return;
      }
    }
    System.out.println("No difference found");
  }
}
```

## Complexity

| Pattern | Typical time | Typical space |
| --- | --- | --- |
| Hash map, prefix sums, two pointers, sliding window, monotonic stack | O(n) | O(1) to O(n) |
| Sorting, heap of k, binary search on the answer | O(n log n), O(n log k), O(n log max) | O(1) to O(n) |
| BFS, DFS, topological sort | O(V + E) | O(V) |
| Dynamic programming | states × work per state | the table, often reducible |
| Backtracking | number of options × work per option | O(depth) |

- The limits tell you which rows are allowed; the signals tell you which row fits.

## Common mistakes

- **Jumping to code** before naming the pattern and the target time.
- **Matching on one word only:** "sorted" also appears in binary search and merge problems; check what is asked as well.
- **Trusting a greedy idea** without trying to break it on a small case.
- **Ignoring the limits:** an O(n²) idea for n = 10⁵ will time out.
- **Forgetting simpler tools:** a hash map often beats a clever pattern.

## Edge cases

- **The smallest input** (one element, empty string).
- **All values equal** or all distinct.
- **Negative numbers,** which break many sliding-window and greedy ideas.
- **Ties** in "the best" or "the k-th".
- **The largest input,** to check the time and that values fit in the integer type.

## Worked example

**Problem:** given an array of up to 100,000 integers (positive and negative) and a target k, return how many contiguous stretches add up to exactly k. For [1, 2, 3] and k = 3 the answer is 2 ([1, 2] and [3]).

**Explanation in words:** "Contiguous stretches suggest a sliding window, but the numbers can be negative, so the sum does not grow as the window widens and a window cannot decide when to shrink. With n = 100,000 I need O(n) or O(n log n). A stretch from i + 1 to j adds up to prefix[j] − prefix[i], so I need pairs of prefix sums that differ by k. I walk once, keep a hash map from each prefix sum to how many times it has appeared, and at each position add the count of prefix − k. The map starts with prefix 0 seen once, for stretches that start at the beginning. That is O(n) time and O(n) space."

```javascript
function countStretches(nums, k) {
  const seen = new Map([[0, 1]]);   // the empty prefix
  let prefix = 0;
  let count = 0;
  for (const x of nums) {
    prefix += x;
    count += seen.get(prefix - k) ?? 0;          // stretches ending here
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  public int countStretches(int[] nums, int k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);                // the empty prefix
    long prefix = 0;
    int count = 0;
    for (int x : nums) {
      prefix += x;
      count += seen.getOrDefault(prefix - k, 0);   // stretches ending here
      seen.merge(prefix, 1, Integer::sum);
    }
    return count;
  }
}
```

**Trace:** for [1, 2, 3] and k = 3 the prefix sums are 1, 3, 6. At 3, prefix − k = 0 was seen once ([1, 2]). At 6, prefix − k = 3 was seen once ([3]). The answer is 2.
