# Recursion & Divide and Conquer

## Learning objectives

- Write a recursive function with a base case that stops it and a recursive case that moves toward the base case.
- Trace the call stack: which calls are waiting, and in what order they return.
- Spot repeated work in a recursion and remove it by remembering results (memoization).
- Solve a problem by divide and conquer: split it, solve the parts recursively, and combine the answers.
- Count the time and the stack space of a recursive solution, and know when the recursion is too deep.

## Problem hook

You stand in a long line at a concert and want to know your position. You cannot see the front. So you ask the person in front of you: "What is your position?" They do not know either, so they ask the person in front of them, and so on.

Finally the question reaches the first person, who answers "1" without asking anyone. Then the answers travel back: "2", "3", ... until someone tells you "41", and you know you are 42nd.

That is recursion: a question answered by asking the **same question about a smaller line**, plus a person at the front who knows the answer **without asking**.

## Intuition

**Every recursive function has two parts.**

- The **base case** is the small problem you can answer directly: the person at the front, an empty array, the number 0.
- The **recursive case** answers a bigger problem using the answer to a **smaller copy** of it: "my position is the position in front of me, plus one".

If each call moves closer to the base case, the recursion ends. If not, it never stops.

**The call stack keeps the waiting calls.** When a function calls itself, the first call pauses and waits. The paused calls pile up on the **call stack**, like the stack from Level 6. When the base case returns, the calls finish one by one, **newest first**. The depth of that pile is the extra space a recursion uses.

**Repeated work is the trap.** A recursion such as `ways(n) = ways(n - 1) + ways(n - 2)` asks for `ways(n - 2)` twice, `ways(n - 3)` three times, and so on: about 2^n calls. **Remember each answer the first time** (in a map or an array), and each value is computed once: O(n). This is called memoization, and it is the first step toward dynamic programming in a later level.

**Divide and conquer** is recursion that splits a problem into parts of about **half** the size:

1. **Divide:** split the input, for example into a left half and a right half.
2. **Conquer:** solve each part recursively.
3. **Combine:** build the answer from the parts' answers.

Merge sort from Level 4 is the classic example. Halving is what makes it fast: an input of n items can be halved only about log2(n) times.

```figure
{
  "kind": "visual",
  "caption": "Merge sort halves the array, sorts each half, then merges two sorted halves. The shaded cells are the range being worked on.",
  "frames": [
    {"op": "start: split into halves of 4", "visual": {"cells": ["7", "4", "2", "1", "8", "3", "6", "5"]}},
    {"op": "left half: sort each pair, then merge", "visual": {"cells": ["4", "7", "1", "2", "8", "3", "6", "5"], "window": [0, 3]}},
    {"op": "left half merged: 1 2 4 7", "visual": {"cells": ["1", "2", "4", "7", "8", "3", "6", "5"], "window": [0, 3]}},
    {"op": "right half: sort pairs 8 3 and 6 5", "visual": {"cells": ["1", "2", "4", "7", "3", "8", "5", "6"], "window": [4, 7]}},
    {"op": "right half merged: 3 5 6 8", "visual": {"cells": ["1", "2", "4", "7", "3", "5", "6", "8"], "window": [4, 7]}},
    {"op": "merge 1 2 4 7 with 3 5 6 8", "visual": {"cells": ["1", "2", "3", "4", "5", "6", "7", "8"]}}
  ]
}
```

## When to use

Look for these signals in a problem statement:

- The problem contains **smaller copies of itself**: a number and its digits, a word and the word without its ends, a row built from the row above.
- A **choice at the last step** splits the count into smaller counts: "the last hop is 1 or 2 steps".
- The input can be **cut in half** and the halves' answers combined: sorting, counting pairs across halves, fast power.
- Nested structure: brackets inside brackets, folders inside folders, expressions inside expressions.
- If the same smaller question is asked many times, add **memoization**.

## Template code

**Base case and recursive case.** Sum an array from index `i` to the end.

```javascript
function sum(a, i = 0) {
  if (i === a.length) return 0;      // base case: nothing left
  return a[i] + sum(a, i + 1);       // recursive case: one element + the rest
}
```

```java
class Solution {
  public int sum(int[] a, int i) {
    if (i == a.length) return 0;     // base case: nothing left
    return a[i] + sum(a, i + 1);     // recursive case: one element + the rest
  }
}
```

**Memoization.** Remember every answer the first time it is computed.

```javascript
function ways(n, memo = new Map()) {
  if (n <= 2) return n;                         // base cases
  if (memo.has(n)) return memo.get(n);          // already known
  const result = ways(n - 1, memo) + ways(n - 2, memo);
  memo.set(n, result);                          // remember it
  return result;
}
```

```java
import java.util.HashMap;

class Solution {
  private final HashMap<Integer, Long> memo = new HashMap<>();

  public long ways(int n) {
    if (n <= 2) return n;                       // base cases
    if (memo.containsKey(n)) return memo.get(n); // already known
    long result = ways(n - 1) + ways(n - 2);
    memo.put(n, result);                        // remember it
    return result;
  }
}
```

**Divide and conquer.** Fast power: x^n from x^(n/2).

```javascript
function power(x, n) {
  if (n === 0) return 1;                  // base case
  const half = power(x, Math.floor(n / 2)); // divide: solve half the problem once
  return n % 2 === 0 ? half * half : half * half * x; // combine
}
```

```java
class Solution {
  public long power(long x, int n) {
    if (n == 0) return 1;                 // base case
    long half = power(x, n / 2);          // divide: solve half the problem once
    return n % 2 == 0 ? half * half : half * half * x; // combine
  }
}
```

## Complexity

Count two things: **how many calls** happen, and **how much work** each call does outside its recursive calls.

| Recursion | Calls | Time | Stack depth |
| --- | --- | --- | --- |
| One smaller call, n − 1 (sum of an array) | n | O(n) | O(n) |
| Two smaller calls, n − 1 and n − 2, no memo | about 2^n | O(2^n) | O(n) |
| Same, with memoization | n distinct values | O(n) | O(n) |
| One call on n / 2 (fast power) | log2(n) | O(log n) | O(log n) |
| Two calls on n / 2 plus O(n) combine (merge sort) | about 2n | O(n log n) | O(log n) |

- **Stack space is real space.** A recursion that goes n calls deep uses O(n) memory, even if it creates no arrays.
- **Depth limits:** a JavaScript engine allows roughly 10,000 nested calls, and Java's default stack is similar. A recursion 100,000 levels deep overflows; a loop does not.
- **Slicing costs too.** `a.slice(1)` or `s.substring(1)` in each call copies the rest, which turns O(n) into O(n²). Pass indices instead.

## Common mistakes

- **No base case, or one that is never reached.** `f(n) = f(n - 2)` called with an odd n skips a base case of `n === 0` and runs until the stack overflows.
- **Calling the same subproblem twice.** `power(x, n / 2) * power(x, n / 2)` does twice the work at every level, which makes fast power O(n). Compute the half once.
- **Forgetting to return the recursive result.** Calling `sum(a, i + 1)` without `return` throws the answer away.
- **Copying the input on every call.** Slices and substrings add O(n) per call. Pass start and end indices.
- **Recursion that is too deep.** A straight chain of 100,000 calls overflows. Use a loop or a shallower split.
- **Sharing a memo between different inputs.** A memo belongs to one problem; reset it for a new input.

## Edge cases

- **The smallest input:** 0, an empty array, an empty string, or a single item. It must hit a base case.
- **Odd and even sizes** when halving: n / 2 rounds down, so check that both halves are handled.
- **Large values:** results may need a 64-bit number or a remainder after each step.
- **Deep inputs:** the largest allowed size must not exceed the stack depth.

## Worked example

**Problem:** count the digits of a whole number `n` (0 has one digit), recursively.

**Explanation in words:** "A number below 10 has one digit: that is my base case. Any larger number has one more digit than the number without its last digit, which is n divided by 10 rounded down. So digits(n) = 1 + digits(floor(n / 10)). Each call removes one digit, so there are d calls for a d-digit number: O(d) time and O(d) stack space."

```javascript
function countDigits(n) {
  if (n < 10) return 1;                       // base case: one digit
  return 1 + countDigits(Math.floor(n / 10)); // drop the last digit
}
```

```java
class Solution {
  public int countDigits(int n) {
    if (n < 10) return 1;                     // base case: one digit
    return 1 + countDigits(n / 10);           // drop the last digit
  }
}
```
