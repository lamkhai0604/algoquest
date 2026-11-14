# Two Pointers

## Problem hook

A sorted list of 100,000 numbers. Find two that add up to a target.

Checking every pair is about 5 billion sums. But the list is sorted: start with the smallest and the largest number. If their sum is too small, the smallest number cannot be part of any answer with anything smaller than the largest, so move it. Each step throws away a whole number, and one pass is enough.

## Intuition

Two pointers are two indexes that move through the data, usually one from each end toward the middle, or both forward at different speeds.

Think of two people searching a bookshelf from both ends: every step, one of them moves inward, and the search space shrinks by one book. No book is visited twice, so the work is **O(n)**, and only two indexes are kept, so the extra space is **O(1)**.

The key is a reason to move: a rule that says which pointer can safely move without missing the answer. In a sorted list, the sum tells you. In a palindrome, matching ends tell you. With a read and a write pointer, the write pointer only moves when you keep an item.

## When to use

Look for these signals:

- The input is **sorted**, or sorting it does not break the problem.
- You look for a **pair** (or a range) that meets a condition, such as a target sum.
- You compare the **two ends** of something (palindromes, reversing).
- The statement asks for **O(1) extra space** or an **in-place** change.
- Two sorted lists must be **merged** or compared.

## Template code

Opposite ends moving inward.

```javascript
function pairSum(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++; // need a bigger sum
    else right--;             // need a smaller sum
  }
  return [-1, -1];
}
```

```java
int[] pairSum(int[] nums, int target) {
  int left = 0, right = nums.length - 1;
  while (left < right) {
    int sum = nums[left] + nums[right];
    if (sum == target) return new int[] {left, right};
    if (sum < target) left++; // need a bigger sum
    else right--;             // need a smaller sum
  }
  return new int[] {-1, -1};
}
```

## Complexity

- **Time: O(n).** Every step moves one pointer inward, and they meet after at most n steps.
- **Space: O(1).** Only the two indexes are kept.

Compare: a hash map also finds a pair in O(n) time, but it ignores the sorted order and uses O(n) space.

## Common mistakes

- **Using `left <= right`** when a pair must use two different items: the pointers would meet on the same item.
- **Moving the wrong pointer.** Say *why* a pointer may move; in a sorted pair sum, a small sum moves the left pointer.
- **Forgetting to skip characters on both sides** in a cleaned palindrome check.
- **Leftover items** when merging: when one list ends, the rest of the other list still has to be added.
- **Using two pointers on unsorted data** where the moving rule depends on order.

## Worked example

**Problem:** return true if a string is a palindrome after ignoring characters that are not letters or digits, and ignoring case. Example: `"Rac e, car!"` gives `true`.

**Spoken explanation:**

> I put a left pointer at the start and a right pointer at the end. While left is before right, I move left forward past any character that is not a letter or digit, and right backward the same way. Then I compare the two characters in lowercase: if they differ, I return false. Otherwise I move both pointers inward and continue. When the pointers meet, every pair matched, so I return true. Each character is passed once, so it is O(n) time, and I only keep two indexes, so O(1) extra space. An empty string or a string of only symbols returns true.

**Code:**

```javascript
function isPalindromeName(s) {
  const ok = (c) => /[a-z0-9]/i.test(c);
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (!ok(s[left])) left++;
    else if (!ok(s[right])) right--;
    else if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    else {
      left++;
      right--;
    }
  }
  return true;
}
```
