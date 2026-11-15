# Sorting Fundamentals

## Learning objectives

- Explain why sorted data makes many problems easier: equal items sit together, and the closest values become neighbors.
- Trace insertion sort by hand and say why it costs O(n²), and why it is fast on almost-sorted data.
- Describe how merge sort splits and merges, and why that costs O(n log n).
- Sort numbers and records correctly with the built-in sort and a comparator, including tie-breaks.
- Say what a stable sort keeps, and count the cost of sorting in your own solution's Big-O.

## Problem hook

A teacher has 10,000 test scores and wants the two scores that are **closest** to each other.

The direct way compares every score with every other score: about 10,000 × 10,000 / 2 = 50 million pairs. Now sort the scores first. In sorted order, the closest pair must be **next to each other**, so one pass over 9,999 neighbors finds it. Sorting costs about n log n ≈ 130,000 steps, and the scan 10,000 more. One extra step at the start turns a slow problem into a fast one.

## Intuition

**Insertion sort is how you sort a hand of cards.** You pick up cards one at a time. Each new card slides left past the cards that are bigger, and stops when the card on its left is smaller or equal. The cards to the left are always sorted.

- A card may slide past every card before it, so n cards can take about n²/2 moves: **O(n²)**.
- If the hand is already nearly sorted, each card moves little or not at all: close to **O(n)**.

**Merge sort is how two people sort a big pile together.** Split the pile in half, sort each half (by splitting again), then **merge**: look at the top card of each sorted half and take the smaller one, again and again.

- Halving n items reaches piles of one after about log₂ n levels (1,000,000 items: about 20 levels).
- Each level merges all n items once, so the total is **O(n log n)**.

**A comparator is the rule for "who goes first".** It gets two items, `a` and `b`, and returns a negative number if `a` goes first, a positive number if `b` goes first, and 0 if they tie. Sorting by pages, then by title, is one comparator that checks pages and only looks at titles when the pages are equal.

A sort is **stable** if items that tie keep their original order. JavaScript's `sort`, Java's `List.sort`, and Java's `Arrays.sort` on objects are stable.

## When to use

Look for these signals in a problem statement:

- "Closest", "smallest difference", or "largest gap": after sorting, only neighbors matter.
- "Duplicates", "pairs of equal", or "group the same": after sorting, equal items sit together.
- "Median", "middle", or "k-th smallest": the answer is at a known index of the sorted list.
- The output must be "in order", "ranked", or "from nearest to farthest": a sort with a comparator.
- Two lists that are already sorted: merge them in one pass instead of sorting again.

## Template code

**Insertion sort.** Slide each new item left while its left neighbor is bigger.

```javascript
function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {   // left neighbor is bigger
      [a[j - 1], a[j]] = [a[j], a[j - 1]]; // swap them
      j--;
    }
  }
  return a;
}
```

```java
class Solution {
  public int[] insertionSort(int[] a) {
    for (int i = 1; i < a.length; i++) {
      int j = i;
      while (j > 0 && a[j - 1] > a[j]) {   // left neighbor is bigger
        int t = a[j - 1]; a[j - 1] = a[j]; a[j] = t; // swap them
        j--;
      }
    }
    return a;
  }
}
```

**Sort with a comparator, then scan neighbors.** The pattern behind most problems in this level.

```javascript
function sortThenScan(items) {
  const s = [...items].sort((a, b) => a - b); // numeric order; copy first
  for (let i = 1; i < s.length; i++) {
    // compare s[i - 1] and s[i]: neighbors in sorted order
  }
  return s;
}
```

```java
import java.util.Arrays;

class Solution {
  public int[] sortThenScan(int[] items) {
    int[] s = items.clone();             // keep the caller's array
    Arrays.sort(s);                      // numeric order
    for (int i = 1; i < s.length; i++) {
      // compare s[i - 1] and s[i]: neighbors in sorted order
    }
    return s;
  }
}
```

**Merge two sorted lists.** The step that makes merge sort work.

```javascript
function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) out.push(a[i] <= b[j] ? a[i++] : b[j++]);
  while (i < a.length) out.push(a[i++]);   // copy what is left
  while (j < b.length) out.push(b[j++]);
  return out;
}
```

```java
class Solution {
  public int[] merge(int[] a, int[] b) {
    int[] out = new int[a.length + b.length];
    int i = 0, j = 0, k = 0;
    while (i < a.length && j < b.length) out[k++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < a.length) out[k++] = a[i++]; // copy what is left
    while (j < b.length) out[k++] = b[j++];
    return out;
  }
}
```

## Complexity

| Sort | Time | Extra space | Stable |
| --- | --- | --- | --- |
| Insertion sort | O(n²) worst and average, O(n) when already sorted | O(1) | Yes |
| Merge sort | O(n log n) always | O(n) for merging | Yes |
| Built-in sort | O(n log n) | Up to O(n) | JavaScript: yes. Java: yes for objects and lists |

- **Why O(n²) for insertion sort:** in reverse order, item i swaps past all i items before it, and 1 + 2 + … + (n − 1) = n(n − 1)/2.
- **Why O(n log n) for merge sort:** there are about log₂ n levels of halving, and each level merges n items in total.
- **Count the sort in your answer.** Sort-then-scan is O(n log n) + O(n) = **O(n log n)**: the bigger term wins.
- **What n log n means in practice:** for n = 1,000,000, n² is 10¹² steps but n log n is about 2 × 10⁷.

## Common mistakes

- **Sorting numbers as text in JavaScript.** `[10, 9, 1].sort()` gives `[1, 10, 9]`. Always pass `(a, b) => a - b` for numbers.
- **Returning a boolean from a comparator.** `(a, b) => a > b` returns true or false, not a negative or positive number, and does not sort reliably.
- **Overflow in Java comparators.** `a - b` can overflow for large or very negative ints. Use `Integer.compare(a, b)`.
- **Changing the caller's array.** `sort` works in place. Sort a copy (`[...items]`, `items.clone()`) unless changing the input is allowed.
- **Losing which value belongs to which item.** Sorting one of two matching arrays breaks the link. Sort indices or pairs instead.
- **Forgetting the sort's cost.** A "one pass" solution that sorts first is O(n log n), not O(n).

## Edge cases

- **Empty list or one item:** already sorted; the scan loop does not run.
- **All items equal:** comparators return 0; a stable sort keeps the original order.
- **Already sorted or reverse order:** best and worst cases for insertion sort.
- **Negative numbers and duplicates:** numeric comparators handle both; text comparison does not.
- **Ties in a comparator:** decide the tie-break (a second key) or the order may differ between languages.

## Worked example

**Problem:** return the smallest difference between any two scores (at least two scores are given).

**Explanation in words:** "I sort a copy of the scores in numeric order. In sorted order, the two closest scores must be next to each other, because any score between them would be closer to one of them. So I scan the neighbors once and keep the smallest difference. Sorting is O(n log n) and the scan is O(n), so the total is O(n log n) time and O(n) space for the copy."

```javascript
function closestScores(scores) {
  const s = [...scores].sort((a, b) => a - b);
  let best = Infinity;
  for (let i = 1; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);
  return best;
}
```

```java
import java.util.Arrays;

class Solution {
  public int closestScores(int[] scores) {
    int[] s = scores.clone();
    Arrays.sort(s);
    int best = Integer.MAX_VALUE;
    for (int i = 1; i < s.length; i++) best = Math.min(best, s[i] - s[i - 1]);
    return best;
  }
}
```
