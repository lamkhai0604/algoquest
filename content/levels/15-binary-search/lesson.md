# Binary Search

## Learning objectives

- Find a value in a sorted array in O(log n) by halving the search range at every step.
- Keep a loop invariant (what is true about `lo` and `hi` at every step) and use it to avoid off-by-one errors.
- Find the first position where a condition becomes true: lower bound, upper bound, insert position.
- Search on the answer: binary search over a range of possible answers with a "can it be done?" check.
- Recognize when sorted data or a yes/no condition that flips once calls for binary search.

## Problem hook

A phone book lists 1,000,000 names in alphabetical order. You want "Nguyen".

Reading from the top could take a million looks. Instead, open the middle: the name there is "Lopez". "Nguyen" comes after it, so the whole first half is gone. Open the middle of what is left, and repeat. Each look throws away half of the remaining names, so after about **20 looks** only one name is left: 2²⁰ is just over a million.

## Intuition

**Binary search keeps a range that must contain the answer, and halves it.** Look at the middle item. Because the data is sorted, the middle tells you which half cannot hold the answer, and you discard it. n items take about log₂ n steps: **O(log n)**.

**The invariant.** Decide what `lo` and `hi` mean and keep it true:

- **Exact search** with `lo = 0`, `hi = n − 1`: "if the target is anywhere, it is in `lo..hi`". Loop while `lo <= hi`. If `nums[mid] < target`, the target is to the right: `lo = mid + 1`; if bigger, `hi = mid − 1`. When `lo > hi`, the range is empty and the target is absent.
- **First position where a condition is true** with `lo = 0`, `hi = n`: "the answer is in `lo..hi`, and `hi` may be one past the end". Loop while `lo < hi`. If the condition holds at `mid`, the answer is `mid` or earlier: `hi = mid`; otherwise `lo = mid + 1`. When `lo == hi`, that is the answer.

**Lower bound and upper bound.** The lower bound of `target` is the first index with `nums[i] >= target`; the upper bound is the first index with `nums[i] > target`. Their difference is how many times `target` appears, and the lower bound is where `target` would be inserted.

**Searching on the answer.** Some problems are not about an array index but about a number: "the smallest speed that finishes in time", "the largest load per truck". If a check `canDo(x)` is false for small x and true for all larger x (it flips **once**), binary search over x finds the smallest x where it is true. Each check may cost O(n), so the total is O(n log range).

**Middle without overflow.** `mid = lo + (hi − lo) / 2` (rounded down) stays inside the range and never overflows, where `(lo + hi) / 2` can overflow in Java for large numbers.

## When to use

Look for these signals in a problem statement:

- The data is **sorted**, or **rotated** but sorted in pieces, and you need a position or a value.
- "First" or "last" position, "insert position", "how many are smaller than x".
- "Minimum value such that…" or "maximum value such that…" with a condition that is false, then true (or true, then false).
- A **large answer range** (up to 10⁹) where checking one candidate is cheap.
- O(log n) is required, or n is huge and the data is read many times.

## Template code

**Exact search: the index of target, or −1.**

```javascript
function search(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;            // target, if present, is in lo..hi
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) lo = mid + 1;  // left half is too small
    else hi = mid - 1;                     // right half is too big
  }
  return -1;
}
```

```java
class Solution {
  public int search(int[] nums, int target) {
    int lo = 0;
    int hi = nums.length - 1;            // target, if present, is in lo..hi
    while (lo <= hi) {
      int mid = lo + (hi - lo) / 2;
      if (nums[mid] == target) return mid;
      if (nums[mid] < target) lo = mid + 1;  // left half is too small
      else hi = mid - 1;                     // right half is too big
    }
    return -1;
  }
}
```

**First position where a condition holds: the lower bound.**

```javascript
function lowerBound(nums, target) {
  let lo = 0;
  let hi = nums.length;                // the answer is in lo..hi (hi = "none")
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (nums[mid] >= target) hi = mid; // mid works: the answer is mid or earlier
    else lo = mid + 1;                 // mid fails: the answer is later
  }
  return lo;                           // first index with nums[i] >= target
}
```

```java
class Solution {
  public int lowerBound(int[] nums, int target) {
    int lo = 0;
    int hi = nums.length;                // the answer is in lo..hi (hi = "none")
    while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      if (nums[mid] >= target) hi = mid; // mid works: the answer is mid or earlier
      else lo = mid + 1;                 // mid fails: the answer is later
    }
    return lo;                           // first index with nums[i] >= target
  }
}
```

## Complexity

| Task | Linear scan | Binary search |
| --- | --- | --- |
| Find a value in a sorted array | O(n) | O(log n) |
| First and last position of a value | O(n) | O(log n): two bounds |
| Smallest answer x in 1..M with an O(n) check | O(n · M) | O(n log M) |
| Many lookups in data sorted once | O(q · n) | O(n log n + q log n) |

- Space is O(1) for the loop; a recursive version uses O(log n) stack.
- 1,000,000 items need at most 20 steps; 1,000,000,000 need 30.

## Common mistakes

- **Mixing invariants:** `while (lo < hi)` with `hi = mid − 1`, or `while (lo <= hi)` with `hi = mid`, which skips the answer or loops forever.
- **An infinite loop** when the range does not shrink: with `lo = mid` the middle must round up.
- **Overflow** in `(lo + hi) / 2` with large values in Java.
- **Searching unsorted data,** or a condition that flips more than once.
- **Returning the wrong value at the end:** after a lower-bound loop, `lo` may be `n`, meaning "not found".
- **Checking `nums[lo]` without checking `lo < n`.**

## Edge cases

- **Empty array:** the exact search returns −1; the lower bound returns 0.
- **Target smaller than every item, or larger than every item.**
- **Duplicates:** an exact search returns any matching index; use bounds for the first or last.
- **One item.**
- **The answer at the edge of the search range** when searching on the answer.

## Worked example

**Problem:** a sorted list of exam scores, and a passing mark. Return how many students passed (score at least the mark).

**Explanation in words:** "The scores are sorted, so everyone from the first passing score to the end passed. I find that position with a lower bound: `lo = 0`, `hi = n`, and while `lo < hi` I look at `mid`. If `scores[mid] >= mark`, the first passing score is at `mid` or earlier, so `hi = mid`; otherwise it is later, so `lo = mid + 1`. When they meet, `lo` is the first passing index and the answer is `n − lo`. That is O(log n) time and O(1) space."

```javascript
function countPassed(scores, mark) {
  let lo = 0;
  let hi = scores.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (scores[mid] >= mark) hi = mid;
    else lo = mid + 1;
  }
  return scores.length - lo;
}
```

```java
class Solution {
  public int countPassed(int[] scores, int mark) {
    int lo = 0;
    int hi = scores.length;
    while (lo < hi) {
      int mid = lo + (hi - lo) / 2;
      if (scores[mid] >= mark) hi = mid;
      else lo = mid + 1;
    }
    return scores.length - lo;
  }
}
```
