# Sliding Window

## Learning objectives

- Describe a window: a contiguous range of an array or string, from `left` to `right`.
- Slide a fixed-size window in O(n) by adding the item that enters and removing the item that leaves.
- Grow and shrink a variable-size window to find the longest or shortest range that meets a condition.
- Keep the window's state (a sum, a count, a hash map of counts) up to date in O(1) per move.
- Recognize sliding-window problems and count their cost: O(n) time, and the space of the window's state.

## Problem hook

A fitness app stores the step counts of the last 1,000,000 minutes. It wants the best 60-minute stretch.

Adding up every 60-minute stretch from scratch costs 60 additions per stretch: about 60 million. But two neighbouring stretches share 59 minutes. Moving one minute later only **adds** the new minute and **removes** the oldest one. With that, each stretch costs two operations, and the whole day is about 2 million operations, however long the stretch is.

## Intuition

**A window is a contiguous range `[left, right]`.** Instead of recomputing each range, the window keeps a running summary and updates it as the edges move. Each index enters the window once and leaves at most once, so the total work is **O(n)**.

**Fixed size k.** Build the first window of k items. Then, for each step, add `nums[right]` (entering) and subtract `nums[right − k]` (leaving), and check the answer.

**Variable size: grow, then shrink.** Move `right` forward one item at a time and add it to the window. While the window breaks the rule (too large a sum, a repeated letter, too many distinct values), remove `nums[left]` and move `left` forward. When the window is valid again, record the answer:

- **Longest valid window:** shrink only until the window is valid, then record `right − left + 1`.
- **Shortest window that reaches a goal:** while the window reaches the goal, record its length and shrink to try a shorter one.

**The window's state.** Keep only what the rule needs: a sum for sums, a hash map of counts for "no repeats" or "at most k distinct", a counter of zeros for "at most k zeros". Updating it when one item enters or leaves must take O(1).

**When it does not work.** Shrinking assumes that removing an item moves the window toward valid. With negative numbers in a "sum at least" problem that is false, and prefix sums (Level 14) are the tool instead.

## When to use

Look for these signals in a problem statement:

- **Contiguous** subarray or substring: "consecutive days", "a stretch", "a run", "a block".
- **Longest** or **shortest** range with a condition, or the best range of a **fixed length k**.
- Conditions you can update as items enter and leave: a sum of **non-negative** numbers, counts of letters, the number of distinct values, at most k of something.
- A brute force that tries every start and every end: O(n²) ranges.

## Template code

**Fixed size: the largest sum of k consecutive items.**

```javascript
function bestOfK(nums, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];   // first window
  let best = sum;
  for (let right = k; right < nums.length; right++) {
    sum += nums[right] - nums[right - k];        // one enters, one leaves
    best = Math.max(best, sum);
  }
  return best;
}
```

```java
class Solution {
  public int bestOfK(int[] nums, int k) {
    int sum = 0;
    for (int i = 0; i < k; i++) sum += nums[i];  // first window
    int best = sum;
    for (int right = k; right < nums.length; right++) {
      sum += nums[right] - nums[right - k];      // one enters, one leaves
      best = Math.max(best, sum);
    }
    return best;
  }
}
```

**Variable size: the longest substring without a repeated character.**

```javascript
function longestUnique(s) {
  const count = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    count.set(c, (count.get(c) ?? 0) + 1);            // grow
    while (count.get(c) > 1) {                         // invalid: shrink
      count.set(s[left], count.get(s[left]) - 1);
      left++;
    }
    best = Math.max(best, right - left + 1);           // valid: record
  }
  return best;
}
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  public int longestUnique(String s) {
    Map<Character, Integer> count = new HashMap<>();
    int left = 0;
    int best = 0;
    for (int right = 0; right < s.length(); right++) {
      char c = s.charAt(right);
      count.merge(c, 1, Integer::sum);                 // grow
      while (count.get(c) > 1) {                       // invalid: shrink
        count.merge(s.charAt(left), -1, Integer::sum);
        left++;
      }
      best = Math.max(best, right - left + 1);         // valid: record
    }
    return best;
  }
}
```

## Complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Every range from scratch | O(n²) to O(n³) | O(1) |
| Fixed-size window | O(n) | O(1) |
| Variable-size window with a sum or a counter | O(n) | O(1) |
| Variable-size window with a hash map of counts | O(n) | O(k): the distinct items in the window |

- In a variable window, `left` and `right` each move at most n times in total, even with a `while` loop inside the `for` loop: the work is O(n), not O(n²).

## Common mistakes

- **Recomputing the window** from scratch at every step, which brings back O(n · k).
- **Recording the answer while the window is invalid,** before the shrinking loop has finished.
- **Off-by-one lengths:** the window `[left, right]` has `right − left + 1` items.
- **Forgetting to undo state** when `left` moves: the leaving item must be subtracted or its count lowered.
- **Using `if` instead of `while`** to shrink, when several items may have to leave.
- **Using a shrinking window with negative numbers** for a sum target; shrinking no longer moves toward the goal.

## Edge cases

- **k larger than the array,** or an empty array or string.
- **No window meets the condition:** return the stated value, such as 0.
- **The whole input is one valid window.**
- **All items equal,** or every item different.
- **A window of size 1.**

## Worked example

**Problem:** given a list of daily step counts and a number k, return how many runs of k consecutive days have an average of at least 8,000 steps.

**Explanation in words:** "An average of at least 8,000 over k days means a sum of at least 8,000 · k, so I compare sums and avoid division. I build the sum of the first k days, then slide the window one day at a time: add the day that enters and subtract the day that leaves. Each time the sum reaches the goal I count the window. Every day enters and leaves once: O(n) time and O(1) extra space."

```javascript
function goodRuns(steps, k) {
  if (k > steps.length) return 0;
  const goal = 8000 * k;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += steps[i];
  let count = sum >= goal ? 1 : 0;
  for (let right = k; right < steps.length; right++) {
    sum += steps[right] - steps[right - k];
    if (sum >= goal) count++;
  }
  return count;
}
```

```java
class Solution {
  public int goodRuns(int[] steps, int k) {
    if (k > steps.length) return 0;
    long goal = 8000L * k;
    long sum = 0;
    for (int i = 0; i < k; i++) sum += steps[i];
    int count = sum >= goal ? 1 : 0;
    for (int right = k; right < steps.length; right++) {
      sum += steps[right] - steps[right - k];
      if (sum >= goal) count++;
    }
    return count;
  }
}
```
