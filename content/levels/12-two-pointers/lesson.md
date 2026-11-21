# Two Pointers

## Learning objectives

- Use two indexes that move toward each other from both ends of a sorted array or a string.
- Use a read pointer and a write pointer to change an array in place with O(1) extra space.
- Walk two sorted lists side by side to merge or compare them in one pass.
- State the rule that says which pointer may move, and why it never skips the answer.
- Recognize two-pointer problems and count their cost: O(n) time, O(1) extra space.

## Problem hook

A sorted list holds 100,000 prices, and you need two that add up to exactly 500.

Checking every pair is about 5 billion sums. But the list is sorted. Put one finger on the cheapest price and one on the most expensive. If their sum is too small, the cheapest price cannot be part of any answer: even the most expensive partner is not enough. Move that finger right. If the sum is too big, move the other finger left. Every step rules out one price for good, so at most 100,000 steps find the pair.

## Intuition

**Two pointers are two indexes that move through the data under a rule.** Each move rules something out, so nothing is looked at twice: **O(n) time**. Only the indexes are stored: **O(1) extra space**.

**Opposite ends, moving inward.** Start `left = 0` and `right = n − 1`. Compare what they point at and move one of them inward. The rule must say why the item you leave behind can never be in the answer:

- **Pair with a target sum in a sorted array.** Sum too small → `left++` (only a bigger left value can raise it). Sum too big → `right--`.
- **Palindromes and reversing.** The two ends must match; check or swap them, then move both inward.
- **Container-style problems.** Move the pointer at the shorter side: keeping it can only make the result worse.

**Read and write pointers, same direction.** `read` visits every item; `write` marks where the next kept item goes. When the item at `read` should stay, copy it to `write` and move `write`. The kept items end up packed at the front, in order, without a second array. Removing values, moving zeros to the end, and removing duplicates from a sorted array all work this way.

**Two lists side by side.** One pointer per sorted list. Take the smaller front item and move only that pointer. Merging two sorted lists, or checking whether one word's letters appear in order inside another, takes one pass over both.

**Two pointers or a hash map?** Both find a pair in O(n) time. A hash map works on unsorted data but uses O(n) space. Two pointers need sorted data (or a reason to move), and use O(1) space. If the data is unsorted, sorting first costs O(n log n).

## When to use

Look for these signals in a problem statement:

- The input is **sorted**, and you look for a **pair** with a sum, difference or closest value.
- You compare or swap the **two ends** of an array or string: palindromes, reversing.
- The statement asks for an **in-place** change or **O(1) extra space**: remove, compact, move to the end.
- **Two sorted lists** must be merged, intersected or compared.
- One sequence must appear **in order** inside another (a subsequence).

## Template code

**Opposite ends: a pair with a target sum in a sorted array.**

```javascript
function pairWithSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;   // need a bigger sum
    else right--;               // need a smaller sum
  }
  return [-1, -1];
}
```

```java
class Solution {
  public int[] pairWithSum(int[] nums, int target) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
      int sum = nums[left] + nums[right];
      if (sum == target) return new int[] {left, right};
      if (sum < target) left++;   // need a bigger sum
      else right--;               // need a smaller sum
    }
    return new int[] {-1, -1};
  }
}
```

**Read and write: remove every copy of a value in place.** Returns how many items are kept.

```javascript
function removeValue(nums, value) {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== value) {
      nums[write] = nums[read];   // keep it: pack it at the front
      write++;
    }
  }
  return write;                   // nums[0 .. write-1] are the kept items
}
```

```java
class Solution {
  public int removeValue(int[] nums, int value) {
    int write = 0;
    for (int read = 0; read < nums.length; read++) {
      if (nums[read] != value) {
        nums[write] = nums[read]; // keep it: pack it at the front
        write++;
      }
    }
    return write;                 // nums[0 .. write-1] are the kept items
  }
}
```

**Two sorted lists side by side: merge.**

```javascript
function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length) out.push(a[i++]);   // leftovers
  while (j < b.length) out.push(b[j++]);
  return out;
}
```

```java
class Solution {
  public int[] merge(int[] a, int[] b) {
    int[] out = new int[a.length + b.length];
    int i = 0, j = 0, k = 0;
    while (i < a.length && j < b.length) {
      out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    }
    while (i < a.length) out[k++] = a[i++];  // leftovers
    while (j < b.length) out[k++] = b[j++];
    return out;
  }
}
```

## Complexity

| Pattern | Time | Extra space |
| --- | --- | --- |
| Opposite ends (pair sum, palindrome, reverse) | O(n) | O(1) |
| Read and write in place | O(n) | O(1) |
| Merge two sorted lists of sizes n and m | O(n + m) | O(n + m) for the output |
| Pair sum on unsorted data: sort, then two pointers | O(n log n) | O(1) to O(n), depending on the sort |
| Pair sum with a hash map instead | O(n) | O(n) |
| Checking every pair | O(n²) | O(1) |

- Each step moves at least one pointer and never moves it back, which is why the total is linear.

## Common mistakes

- **`left <= right` when a pair needs two different items.** When the pointers meet, both point at the same item.
- **Moving the wrong pointer.** Say why the item you leave behind can never be in the answer; if you cannot, the rule is wrong.
- **Using opposite ends on unsorted data.** The "sum too small, move left" rule only holds when the array is sorted.
- **Forgetting the leftovers** when merging: when one list runs out, the rest of the other list still belongs in the output.
- **Skipping only one side** when cleaning a string: symbols must be skipped at both ends.
- **Making a copy** when the problem asks for an in-place change with O(1) extra space.

## Edge cases

- **Empty input, or a single item:** the loop never runs; return the "not found" value or the input unchanged.
- **No pair exists:** return the stated value, such as `[-1, -1]`.
- **Duplicates and negative numbers** in a sorted array.
- **All items removed, or none removed,** with read and write pointers.
- **One list empty** when merging.

## Worked example

**Problem:** given a sorted array and a limit, count the pairs i < j whose sum is at most the limit.

**Explanation in words:** "The array is sorted, so I start with `left` at the first item and `right` at the last. If `nums[left] + nums[right]` is at most the limit, then `nums[left]` also fits with every item between `left + 1` and `right`, because those are no bigger than `nums[right]`. That is `right − left` pairs at once, and then I move `left` forward. If the sum is too big, `nums[right]` is too big for every remaining left partner, so I move `right` back. Each step moves one pointer, so it is O(n) time and O(1) extra space."

```javascript
function pairsAtMost(nums, limit) {
  let left = 0;
  let right = nums.length - 1;
  let count = 0;
  while (left < right) {
    if (nums[left] + nums[right] <= limit) {
      count += right - left;   // nums[left] fits with every item up to right
      left++;
    } else {
      right--;
    }
  }
  return count;
}
```

```java
class Solution {
  public long pairsAtMost(int[] nums, int limit) {
    int left = 0;
    int right = nums.length - 1;
    long count = 0;
    while (left < right) {
      if (nums[left] + nums[right] <= limit) {
        count += right - left;     // nums[left] fits with every item up to right
        left++;
      } else {
        right--;
      }
    }
    return count;
  }
}
```
