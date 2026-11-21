# Prefix Sum & Range Queries

## Learning objectives

- Build a prefix-sum array in O(n) with the convention `prefix[0] = 0` and `prefix[i + 1] = prefix[i] + nums[i]`.
- Answer "sum of `nums[l..r]`" in O(1) as `prefix[r + 1] − prefix[l]`.
- Count subarrays with a given sum using prefix sums and a hash map, including negative numbers.
- Extend the idea to a grid (2D prefix sums) and to range updates (a difference array).
- Recognize when many range questions on the same data call for preprocessing.

## Problem hook

A game stores the coins a player earned on each of 365 days. The stats page answers questions like "coins from day 40 to day 200?", and players ask 100,000 of them a day.

Adding up each range from scratch costs up to 365 additions per question: tens of millions of additions. Instead, store one running total per day: coins earned **up to** that day. The coins from day 40 to day 200 are then "total up to day 200" minus "total up to day 39": **one subtraction**, whatever the range.

## Intuition

**A prefix sum is a running total.** For `nums = [3, 1, 4, 2]`, the prefix array is `[0, 3, 4, 8, 10]`: `prefix[i]` is the sum of the first `i` items. The extra `0` at the front means "nothing yet" and removes a special case.

**A range is a difference of two totals.** The sum of `nums[l..r]` (both ends included) is everything up to `r` minus everything before `l`:

`sum(l, r) = prefix[r + 1] − prefix[l]`

Building the array is O(n) once; then every range query is O(1).

**Prefix sums and a hash map.** A subarray `nums[j..i]` sums to `k` exactly when `prefix[i + 1] − prefix[j] = k`, that is, when an earlier total equals `current − k`. Walk the array once, keep the running total, and keep a hash map of **how many times each earlier total appeared** (start with `{0: 1}`). At each step, add `count[current − k]` to the answer. This works with negative numbers, where a sliding window (Level 13) does not.

**Two dimensions.** For a grid, `P[r + 1][c + 1]` holds the sum of the rectangle from `(0, 0)` to `(r, c)`. Any rectangle's sum is four lookups: `P[r2+1][c2+1] − P[r1][c2+1] − P[r2+1][c1] + P[r1][c1]` (the corner subtracted twice is added back).

**The reverse: a difference array.** To add `v` to every item in `l..r` many times, record `diff[l] += v` and `diff[r + 1] −= v`, then take one prefix sum at the end. Each update is O(1) instead of O(r − l + 1).

## When to use

Look for these signals in a problem statement:

- **Many** questions about the **sum of a range** on data that does not change.
- "Number of subarrays with sum **exactly** k", "sum divisible by k", "equal numbers of 0s and 1s", especially when values can be **negative**.
- A position where the left part and the right part balance: "pivot", "equilibrium".
- Sums over **rectangles** of a grid.
- Many "add v to every item from l to r" updates followed by one read: a difference array.

## Template code

**Build once, answer range sums in O(1).**

```javascript
function buildPrefix(nums) {
  const prefix = new Array(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];   // total of the first i + 1 items
  }
  return prefix;
}

function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];        // nums[l] + ... + nums[r]
}
```

```java
class Solution {
  public long[] buildPrefix(int[] nums) {
    long[] prefix = new long[nums.length + 1];
    for (int i = 0; i < nums.length; i++) {
      prefix[i + 1] = prefix[i] + nums[i];  // total of the first i + 1 items
    }
    return prefix;
  }

  public long rangeSum(long[] prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];       // nums[l] + ... + nums[r]
  }
}
```

**Count subarrays that sum to k: running total and a hash map.**

```javascript
function countSumK(nums, k) {
  const seen = new Map([[0, 1]]);   // the empty prefix
  let total = 0;
  let count = 0;
  for (const x of nums) {
    total += x;
    count += seen.get(total - k) ?? 0;          // earlier totals that leave k
    seen.set(total, (seen.get(total) ?? 0) + 1);
  }
  return count;
}
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  public int countSumK(int[] nums, int k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);                            // the empty prefix
    long total = 0;
    int count = 0;
    for (int x : nums) {
      total += x;
      count += seen.getOrDefault(total - k, 0); // earlier totals that leave k
      seen.merge(total, 1, Integer::sum);
    }
    return count;
  }
}
```

## Complexity

| Task | Without prefix sums | With prefix sums |
| --- | --- | --- |
| Build | — | O(n) time, O(n) space |
| One range sum | O(n) | O(1) |
| q range sums | O(q · n) | O(n + q) |
| Count subarrays with sum k | O(n²) | O(n) time, O(n) space for the map |
| Rectangle sum in an R × C grid | O(R · C) | O(1) after O(R · C) to build |
| m range updates, then one read | O(m · n) | O(m + n) with a difference array |

- Sums can grow large: in Java, keep totals in `long` when values times length can pass about 2 billion.

## Common mistakes

- **Mixing conventions.** With `prefix[0] = 0`, the range `l..r` is `prefix[r + 1] − prefix[l]`; using `prefix[r] − prefix[l]` drops `nums[r]`.
- **Forgetting the empty prefix** `{0: 1}` in the hash map, which misses subarrays that start at index 0.
- **Adding the current total to the map before the lookup,** which can count an empty subarray when k is 0.
- **Using a sliding window with negative numbers.** Shrinking no longer moves the sum predictably; use prefix sums and a map.
- **Rebuilding the prefix array for every query,** which loses the whole benefit.
- **Overflow** of 32-bit totals.

## Edge cases

- **Empty array:** the prefix array is `[0]`.
- **A range of one item:** `l = r`.
- **Negative numbers and zeros,** which allow several subarrays with the same sum, or a sum of 0.
- **k = 0.**
- **The whole array as the range.**

## Worked example

**Problem:** return the first index where the sum of the items to its left equals the sum of the items to its right (the item itself counts on neither side), or −1.

**Explanation in words:** "I compute the total of the whole array once. Then I walk from the left, keeping `left`, the sum of the items before the current index. The right side is `total − left − nums[i]`. If the two are equal, I return `i`; otherwise I add `nums[i]` to `left` and move on. One pass to sum and one to scan: O(n) time and O(1) extra space, because the running `left` replaces the prefix array."

```javascript
function balanceIndex(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  let left = 0;
  for (let i = 0; i < nums.length; i++) {
    if (left === total - left - nums[i]) return i;
    left += nums[i];
  }
  return -1;
}
```

```java
class Solution {
  public int balanceIndex(int[] nums) {
    long total = 0;
    for (int x : nums) total += x;
    long left = 0;
    for (int i = 0; i < nums.length; i++) {
      if (left == total - left - nums[i]) return i;
      left += nums[i];
    }
    return -1;
  }
}
```
