# Dynamic Programming Fundamentals

## Learning objectives

- Recognize overlapping subproblems and optimal substructure in a problem statement.
- Define a DP state in words, write its transition, and choose the base cases.
- Turn a slow recursion into memoization (top-down) or a table filled in order (bottom-up).
- Reduce memory when each cell only reads a few earlier cells.
- Know when greedy fails and DP is needed, as with coin change.

## Problem hook

A staircase has 40 steps, and you climb 1 or 2 steps at a time. How many ways are there to reach the top?

A natural recursive answer says: the last move came from step 39 or step 38, so ways(40) = ways(39) + ways(38). Written as plain recursion, that function makes about 330 million calls, because ways(38) is computed again inside ways(39), and so on all the way down. But there are only 40 different questions. If each answer is written down the first time it is computed, the whole problem takes 40 steps. **Dynamic programming** is exactly that: solve each subproblem once, store it, and build bigger answers from smaller ones.

## Intuition

**Two signals.** A problem suits DP when

- **subproblems overlap:** the same smaller question is asked many times, and
- **optimal substructure holds:** the best answer for the whole is built from best answers for parts.

**Four steps to any DP.**

1. **State:** say in words what one cell means. "dp[i] = the best total using houses 0 to i." Most mistakes come from a vague state.
2. **Transition:** how a cell is computed from smaller cells. Look at the **last decision**: was house i taken or skipped? Was the last coin a 1, a 3 or a 4?
3. **Base cases:** the smallest cells that need no transition, such as dp[0].
4. **Order:** fill cells so that every cell's inputs are ready. Usually left to right, or row by row.

**Top-down or bottom-up.** Memoization keeps the recursive code and adds a cache; it only computes the states it needs. A bottom-up table avoids recursion depth limits and makes the order explicit. Both have the same time bound: number of states × work per state.

**Saving memory.** If each cell reads only the previous one or two cells, keep just those values in variables. A grid DP that reads the row above can keep one row.

**DP versus greedy.** Greedy takes one choice and never looks back; DP considers every choice for the last step and keeps the best. For coins [1, 3, 4] and amount 6, greedy pays 4 + 1 + 1, while DP finds 3 + 3.

## When to use

Look for these signals in a problem statement:

- "Count the number of ways", "minimum / maximum cost", "longest / shortest" with choices at each step.
- A brute-force recursion that would revisit the same arguments.
- Input sizes around 10³–10⁴ (one dimension) or 10²–10³ per side (two dimensions).
- A greedy rule that you can break with a small counterexample.
- Prefixes of a list or string, positions in a grid, or remaining amounts as natural states.

## Template code

**Bottom-up 1-D DP (house gifts: never two neighbours).**

```javascript
function bestTotal(gifts) {
  const n = gifts.length;
  if (n === 1) return gifts[0];
  const dp = new Array(n);
  dp[0] = gifts[0];                         // base cases
  dp[1] = Math.max(gifts[0], gifts[1]);
  for (let i = 2; i < n; i++) {
    dp[i] = Math.max(dp[i - 1],             // skip house i
                     dp[i - 2] + gifts[i]); // take house i
  }
  return dp[n - 1];
}
```

```java
class Solution {
  public int bestTotal(int[] gifts) {
    int n = gifts.length;
    if (n == 1) return gifts[0];
    int[] dp = new int[n];
    dp[0] = gifts[0];                                  // base cases
    dp[1] = Math.max(gifts[0], gifts[1]);
    for (int i = 2; i < n; i++) {
      dp[i] = Math.max(dp[i - 1], dp[i - 2] + gifts[i]);  // skip or take
    }
    return dp[n - 1];
  }
}
```

**Top-down memoization (ways to climb stairs).**

```javascript
function ways(n, memo = new Map()) {
  if (n <= 1) return 1;                     // base cases
  if (memo.has(n)) return memo.get(n);      // already solved
  const result = ways(n - 1, memo) + ways(n - 2, memo);
  memo.set(n, result);                      // store before returning
  return result;
}
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  private final Map<Integer, Integer> memo = new HashMap<>();

  public int ways(int n) {
    if (n <= 1) return 1;                   // base cases
    Integer known = memo.get(n);
    if (known != null) return known;        // already solved
    int result = ways(n - 1) + ways(n - 2);
    memo.put(n, result);
    return result;
  }
}
```

## Complexity

| DP | States | Work per state | Time | Space |
| --- | --- | --- | --- | --- |
| Stairs, house gifts | n | O(1) | O(n) | O(1) with rolling values |
| Coin change | amount | O(coins) | O(amount · coins) | O(amount) |
| Grid routes | rows × columns | O(1) | O(rows · columns) | O(columns) with one row |
| Longest rising run | n | O(n) | O(n²) | O(n) |

- Time is always the number of states times the work to fill one state.
- Plain recursion without storing results is usually exponential.

## Common mistakes

- **A vague state.** Write the meaning of dp[i] in one sentence before coding.
- **Wrong or missing base cases,** such as dp[0] for an empty prefix or amount 0.
- **Filling in the wrong order,** so a cell reads a value that is not computed yet.
- **Using greedy where it is not safe,** for example largest coin first.
- **Overflow:** counts grow fast; use `long` or the modulo the problem asks for.
- **Forgetting "impossible" states,** such as an amount no coins can make; keep them as infinity or −1.

## Edge cases

- **Smallest inputs:** n = 0 or 1, amount 0, a 1 × 1 grid.
- **Impossible answers:** no coin combination, a blocked start cell.
- **All equal or all negative values.**
- **Large counts** that need `long` or a modulo.
- **Leading zeros** in digit strings.

## Worked example

**Problem:** coins of given values can each be used any number of times. Return the fewest coins that make exactly `amount`, or −1 if impossible. For coins [1, 3, 4] and amount 6 the answer is 2 (3 + 3).

**Explanation in words:** "Taking the largest coin first is not safe: for 6 it gives 4 + 1 + 1. So I use DP over amounts. My state is best[a], the fewest coins that make amount a. For the transition I look at the last coin: if it is c, the rest is best[a − c], so best[a] = 1 + the smallest best[a − c] over coins c ≤ a. The base case is best[0] = 0, and amounts that cannot be made stay infinite. I fill a from 1 to amount, so every smaller amount is ready. There are amount states and each tries every coin, so the time is O(amount · coins) and the space is O(amount)."

```javascript
function fewestCoins(coins, amount) {
  const best = new Array(amount + 1).fill(Infinity);
  best[0] = 0;                                  // base case
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && best[a - c] + 1 < best[a]) {
        best[a] = best[a - c] + 1;              // c is the last coin
      }
    }
  }
  return best[amount] === Infinity ? -1 : best[amount];
}
```

```java
import java.util.Arrays;

class Solution {
  public int fewestCoins(int[] coins, int amount) {
    int impossible = Integer.MAX_VALUE / 2;
    int[] best = new int[amount + 1];
    Arrays.fill(best, impossible);
    best[0] = 0;                                    // base case
    for (int a = 1; a <= amount; a++) {
      for (int c : coins) {
        if (c <= a && best[a - c] + 1 < best[a]) {
          best[a] = best[a - c] + 1;                // c is the last coin
        }
      }
    }
    return best[amount] >= impossible ? -1 : best[amount];
  }
}
```

**Trace:** best[0..6] = [0, 1, 2, 1, 1, 2, 2]. For a = 6: last coin 1 gives best[5] + 1 = 3, last coin 3 gives best[3] + 1 = 2, last coin 4 gives best[2] + 1 = 3. The smallest is 2.
