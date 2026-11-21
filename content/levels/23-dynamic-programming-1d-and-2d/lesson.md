# 1D & 2D Dynamic Programming

## Learning objectives

- Choose a 2-D state when a subproblem depends on two positions, such as prefixes of two strings or a cell in a grid.
- Fill a table in an order where every cell's inputs are ready, and read the answer from the right cell.
- Solve longest common subsequence, edit distance, grid paths and 0/1 knapsack.
- Cut a 2-D table down to one or two rows when each row reads only the row before it.
- Recognize interval DP, where the state is a range [i, j] of one string.

## Problem hook

A spell checker sees "helo" and must decide whether the user meant "hello", "help" or "halo". It needs the fewest single-letter edits between the typed word and each candidate.

Level 21's DP used one index: the answer for the first i items. Here one index is not enough. An edit can move through the typed word, through the candidate, or through both at once, so a subproblem is "the cost of turning the first i letters of one word into the first j letters of the other". That is a table with a cell for every pair (i, j). Each cell is computed once from its neighbours above, to the left and on the diagonal, and the bottom-right cell is the answer.

## Intuition

**When one index is not enough.** Use two indexes when the question involves:

- **two sequences:** prefixes i of the first and j of the second (common subsequence, edit distance);
- **a grid:** row r and column c (paths, squares);
- **items and a budget:** the first i items and a capacity c (knapsack);
- **a range of one sequence:** start i and end j (palindromes, splitting a string).

**Read the transition from the last step.** For two strings, look at their last letters:

- **Longest common subsequence:** if they match, take the diagonal cell + 1; otherwise take the better of dropping one letter (up or left).
- **Edit distance:** if they match, take the diagonal cell; otherwise 1 + the smallest of replace (diagonal), delete (up) and insert (left).

**Base cases are a row and a column.** Comparing with an empty prefix is trivial: LCS is 0, edit distance is the other length.

**Fill order.** Row by row, left to right, works whenever a cell reads only cells above and to the left. Interval DP fills short ranges before long ones.

**Saving memory.** If row i reads only row i − 1, keep two rows (or one row updated carefully). For 0/1 knapsack the one-row version loops capacity from high to low, so each item is used once.

## When to use

Look for these signals in a problem statement:

- Two strings or two arrays compared position by position.
- Moving through a grid only right and down (or a similar one-way rule).
- Take-or-leave choices with a limit on total weight, size or cost.
- A question about a substring or subsequence of one string where both ends matter.
- Input sizes up to about 10³ per dimension, so n · m cells fit in time.

## Template code

**Longest common subsequence (two strings).**

```javascript
function lcs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1                    // match: extend the diagonal
        : Math.max(dp[i - 1][j], dp[i][j - 1]);   // drop a letter
    }
  }
  return dp[n][m];
}
```

```java
class Solution {
  public int lcs(String a, String b) {
    int n = a.length(), m = b.length();
    int[][] dp = new int[n + 1][m + 1];   // row 0 and column 0 stay 0
    for (int i = 1; i <= n; i++) {
      for (int j = 1; j <= m; j++) {
        dp[i][j] = a.charAt(i - 1) == b.charAt(j - 1)
            ? dp[i - 1][j - 1] + 1                    // match
            : Math.max(dp[i - 1][j], dp[i][j - 1]);   // drop a letter
      }
    }
    return dp[n][m];
  }
}
```

**0/1 knapsack with one row.**

```javascript
function knapsack(weight, value, capacity) {
  const best = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weight.length; i++) {
    for (let c = capacity; c >= weight[i]; c--) {   // high to low: item used once
      best[c] = Math.max(best[c], best[c - weight[i]] + value[i]);
    }
  }
  return best[capacity];
}
```

```java
class Solution {
  public int knapsack(int[] weight, int[] value, int capacity) {
    int[] best = new int[capacity + 1];
    for (int i = 0; i < weight.length; i++) {
      for (int c = capacity; c >= weight[i]; c--) {   // high to low: item used once
        best[c] = Math.max(best[c], best[c - weight[i]] + value[i]);
      }
    }
    return best[capacity];
  }
}
```

## Complexity

| DP | Cells | Time | Space |
| --- | --- | --- | --- |
| Longest common subsequence, edit distance | (n + 1) × (m + 1) | O(n · m) | O(n · m), or O(m) with rows |
| Grid paths, largest square | rows × columns | O(rows · columns) | O(columns) |
| 0/1 knapsack | items × capacity | O(n · capacity) | O(capacity) |
| Longest palindromic subsequence (interval DP) | n × n | O(n²) | O(n²), or O(n) with rows |

- Time is the number of cells times the work per cell, which is O(1) for all of these.
- Knapsack is called pseudo-polynomial: it grows with the capacity's value, not just the number of items.

## Common mistakes

- **Off-by-one between table indexes and string indexes:** cell (i, j) talks about letters a[i − 1] and b[j − 1].
- **Forgetting the base row and column,** or filling them with the wrong values (edit distance needs 0, 1, 2, …).
- **Going low to high in one-row knapsack,** which lets an item be used many times.
- **Reading a cell that is not filled yet** because the loops run in the wrong order.
- **Confusing subsequence (gaps allowed) with substring (contiguous).**

## Edge cases

- **Empty strings** or a 1 × 1 grid.
- **Identical inputs:** LCS is the full length, edit distance is 0.
- **No match at all.**
- **Capacity 0,** or items heavier than the capacity.
- **Large tables:** check that n · m cells fit in memory, or use rows.

## Worked example

**Problem:** return the fewest insertions, deletions and replacements that turn word a into word b. For "horse" and "ros" the answer is 3 (horse → rorse → rose → ros).

**Explanation in words:** "My state is edit[i][j], the fewest edits that turn the first i letters of a into the first j letters of b. Turning a prefix into an empty word takes i deletions, and an empty word into a prefix takes j insertions, so row 0 and column 0 are 0, 1, 2 and so on. For a cell, I look at the last letters. If they are equal, they need no edit and the answer is the diagonal cell. If not, I pay one edit and take the cheapest of three smaller cells: the diagonal for a replacement, the cell above for deleting a's letter, the cell to the left for inserting b's letter. I fill row by row, so those cells are ready. The table has (n + 1)(m + 1) cells, so the time is O(n · m); keeping one previous row makes the space O(m)."

```javascript
function editDistance(a, b) {
  const m = b.length;
  let prev = Array.from({ length: m + 1 }, (_, j) => j);   // empty a → b's prefix
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];                                        // a's prefix → empty b
    for (let j = 1; j <= m; j++) {
      cur[j] = a[i - 1] === b[j - 1]
        ? prev[j - 1]                                       // no edit needed
        : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);  // replace, delete, insert
    }
    prev = cur;
  }
  return prev[m];
}
```

```java
class Solution {
  public int editDistance(String a, String b) {
    int m = b.length();
    int[] prev = new int[m + 1];
    for (int j = 0; j <= m; j++) prev[j] = j;     // empty a → b's prefix
    for (int i = 1; i <= a.length(); i++) {
      int[] cur = new int[m + 1];
      cur[0] = i;                                  // a's prefix → empty b
      for (int j = 1; j <= m; j++) {
        cur[j] = a.charAt(i - 1) == b.charAt(j - 1)
            ? prev[j - 1]
            : 1 + Math.min(prev[j - 1], Math.min(prev[j], cur[j - 1]));
      }
      prev = cur;
    }
    return prev[m];
  }
}
```

**Trace:** for "horse" and "ros", the last row of the table is [5, 4, 4, 3]. The bottom-right cell, 3, is the answer.
