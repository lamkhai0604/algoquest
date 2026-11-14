# Big-O & Algorithm Basics

## Learning objectives

- Describe how the work of an algorithm grows with the input size, using O(1), O(log n), O(n), and O(n²).
- Find the Big-O of simple code by counting loops.
- Solve "largest, smallest, count, or total" problems with a single pass and a little state.
- Say the time and the extra space of your solution, and why.

## Problem hook

A weather station gives you a list of 100,000 daily temperatures and asks for the hottest day.

One way: for every day, compare it with every other day and keep it if nothing is hotter. That is about 100,000 × 100,000 = 10 billion comparisons, which can take many seconds.

A better way reads the list **once** and remembers the hottest value so far: 100,000 steps. Big-O is how we describe that difference before running any code.

## Intuition

Big-O describes how the work grows when the input grows. Think of reading a book:

- **O(1), constant:** opening the book to page one. A bigger book takes the same time.
- **O(n), linear:** reading every page once. Twice the pages, twice the time.
- **O(n²), quadratic:** for every page, re-reading the whole book. Twice the pages, four times the time.
- **O(log n), logarithmic:** finding a page number by opening near the middle and halving the search each time.

Big-O ignores constant factors and small terms: 3n + 5 steps is still O(n). It also has a space side: how much **extra memory** grows with the input. Keeping one "best so far" variable is O(1) space; copying the whole list is O(n) space.

The most common tool in this level is the **single pass**: visit each element once and carry a small amount of state, such as a running maximum, a counter, or the best answer so far.

## When to use

Look for these signals in a problem statement:

- "Find the largest, smallest, first, or total" of something in a list.
- "Count how many" items match a rule.
- The answer only depends on what you have already seen plus the current item.
- The input can be large (10^5 items or more), so O(n²) is too slow.

If you catch yourself writing a loop inside a loop over the same list, stop and ask: *what could I remember from earlier so that one loop is enough?*

## Template code

A single pass that keeps a running answer.

```javascript
function singlePass(items) {
  if (items.length === 0) return null; // handle the empty input first
  let best = items[0];                 // state carried across the loop
  for (let i = 1; i < items.length; i++) {
    if (items[i] > best) best = items[i]; // update the state with one item
  }
  return best;
}
```

```java
Integer singlePass(int[] items) {
  if (items.length == 0) return null; // handle the empty input first
  int best = items[0];                // state carried across the loop
  for (int i = 1; i < items.length; i++) {
    if (items[i] > best) best = items[i]; // update the state with one item
  }
  return best;
}
```

## Complexity

- **Time: O(n).** The loop body runs once per element and does a constant amount of work.
- **Space: O(1).** Only a few variables are kept, no matter how long the input is.

Compare: sorting first and taking the last element is O(n log n) time. It works, but it does more than the question asks.

### Finding the Big-O of code

Count how many times the innermost line runs, as a function of n, then keep only the biggest term:

- **Steps one after another add up.** A loop of n steps followed by a loop of 1,000 steps is n + 1,000, which is O(n).
- **Loops inside loops multiply.** An outer loop of n steps with an inner loop of n / 2 steps runs n × n / 2 times. Dropping the constant ½ leaves O(n²).
- **A loop that doubles or halves its counter is O(log n).** `for (i = 1; i <= n; i *= 2)` runs about log₂ n times: 1, 2, 4, 8, ... reaches n after log₂ n doublings.

The usual growth rates, from slowest-growing to fastest: O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ).

### What Big-O predicts

Big-O tells you how the running time scales. If an O(n²) program takes 1 minute for 5,000 items, then 25,000 items (5 times as many) take about 5² = 25 minutes. An O(n) program would take about 5 minutes.

It does not give exact times. Two O(n) programs can differ in speed because of the machine, the language, or how data is stored in memory, which is why real programs are also measured. Big-O is for comparing approaches before you write them.

## Common mistakes

- **Empty input.** Reading `items[0]` on an empty list fails. Decide what to return (often null or 0) before the loop.
- **Bad starting value.** Starting a running maximum at 0 breaks when every value is negative. Start from the first element, or from negative infinity.
- **Off-by-one loops.** If the state starts from `items[0]`, the loop can start at index 1. If you compare neighbours, stop one element early.
- **Duplicates.** "Second largest" usually means second largest *distinct* value. Equal values need a strict comparison.
- **Saying O(n) for nested loops.** Two loops over the same list, one inside the other, are O(n²) even if the inner loop looks short.

## Edge cases

- An empty list: there is no first element to start from.
- A single element: the loop body may never run.
- All values negative, or all values equal.
- Very large inputs, where an O(n²) idea becomes too slow.

## Worked example

**Problem:** return the second largest distinct score, or null if there is none. Example: `[5, 5, 3]` gives `3`.

**Spoken explanation:**

> I walk through the scores once and keep two values: the largest and the second largest so far, both starting empty. For each score: if it is bigger than the largest, the old largest moves down to second and the score becomes the largest. Otherwise, if it is strictly smaller than the largest and bigger than the second, it becomes the new second. Scores equal to the largest are skipped, so duplicates do not count twice. At the end I return the second value, or null if it was never set. This is O(n) time because each score is visited once, and O(1) space because I only keep two variables. Edge cases: an empty list, all scores equal, and duplicates of the maximum such as `[5, 5, 3]`.

**Code:**

```javascript
function secondLargest(scores) {
  let first = null;
  let second = null;
  for (const s of scores) {
    if (first === null || s > first) {
      second = first;
      first = s;
    } else if (s < first && (second === null || s > second)) {
      second = s;
    }
  }
  return second;
}
```
