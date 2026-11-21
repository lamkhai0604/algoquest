# Monotonic Stack

## Learning objectives

- Keep a stack whose items stay in increasing or decreasing order from bottom to top.
- Find, for every item, the next greater (or smaller) item to its right in O(n) total.
- Store indexes on the stack to measure distances: "how many days until…", "how far can it see".
- Explain why each item is pushed once and popped at most once, so the whole pass is O(n).
- Recognize "next greater", "previous smaller", span and "remove to make it smallest" problems.

## Problem hook

A weather app shows, for each of the next 100,000 days, how many days you must wait for a warmer one.

For each day, scanning forward until a warmer day appears can take 100,000 steps: 10 billion in total. But think about the days still waiting for an answer. If they are kept on a stack, they are always in **falling** temperature order: a warmer day would already have answered every cooler day below it. When a new day arrives, it answers every waiting day that is cooler, popping them off, and then waits itself. Each day is pushed once and popped once, so the whole forecast takes about 200,000 steps.

## Intuition

**A stack of unanswered items.** Walk the array from left to right. The stack holds the items whose answer ("the next greater item") has not been found yet.

**The order rule.** When the current item is greater than the item on top of the stack, it **is** the next greater item for that top: record the answer and pop. Keep popping while the rule holds, then push the current item. Because every popped item was smaller than the current one, the stack always stays in decreasing order from bottom to top. That is why it is called a **monotonic** stack.

**Which order for which question:**

| Question | Stack order (bottom → top) | Pop while |
| --- | --- | --- |
| Next greater to the right | decreasing | current > top |
| Next smaller to the right | increasing | current < top |
| Previous greater to the left | decreasing | current >= top, then the top (if any) is the answer |
| Previous smaller to the left | increasing | current <= top, then the top (if any) is the answer |

**Store indexes, not values.** With the index on the stack you can read the value (`nums[i]`) and also measure distances: `current − popped` is "days to wait", and "how many consecutive days were not higher" is a span.

**Why it is O(n).** The inner `while` loop looks like it could make the pass O(n²), but each index enters the stack once and leaves at most once. Over the whole pass there are at most n pushes and n pops: **O(n)** time and **O(n)** space for the stack.

**Greedy removal.** The same stack builds the smallest number after removing k digits: while the new digit is smaller than the top and removals are left, pop the top. A bigger digit in front of a smaller one is never worth keeping.

## When to use

Look for these signals in a problem statement:

- "**Next greater**", "next warmer", "next taller", "next smaller" for **every** item.
- "How many days until…", "how far to the right/left until…", "how many in a row before a bigger one" (spans).
- "Can see over", "is blocked by": each item looks for the first item that is higher.
- "Remove k items to make the result smallest or largest" while keeping the order.
- A brute force that, for each item, scans forward or backward: O(n²).

## Template code

**Next greater element to the right, by index. −1 means none.**

```javascript
function nextGreater(nums) {
  const answer = new Array(nums.length).fill(-1);
  const stack = [];                       // indexes; values decrease bottom to top
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[i] > nums[stack[stack.length - 1]]) {
      answer[stack.pop()] = nums[i];      // nums[i] answers the smaller top
    }
    stack.push(i);                        // i waits for its own answer
  }
  return answer;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;

class Solution {
  public int[] nextGreater(int[] nums) {
    int[] answer = new int[nums.length];
    Arrays.fill(answer, -1);
    ArrayDeque<Integer> stack = new ArrayDeque<>(); // indexes; values decrease
    for (int i = 0; i < nums.length; i++) {
      while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
        answer[stack.pop()] = nums[i];             // nums[i] answers the smaller top
      }
      stack.push(i);                               // i waits for its own answer
    }
    return answer;
  }
}
```

**Previous smaller element to the left. −1 means none.**

```javascript
function previousSmaller(nums) {
  const answer = [];
  const stack = [];                        // values increase bottom to top
  for (const x of nums) {
    while (stack.length > 0 && stack[stack.length - 1] >= x) stack.pop();
    answer.push(stack.length > 0 ? stack[stack.length - 1] : -1);
    stack.push(x);
  }
  return answer;
}
```

```java
import java.util.ArrayDeque;

class Solution {
  public int[] previousSmaller(int[] nums) {
    int[] answer = new int[nums.length];
    ArrayDeque<Integer> stack = new ArrayDeque<>(); // values increase bottom to top
    for (int i = 0; i < nums.length; i++) {
      while (!stack.isEmpty() && stack.peek() >= nums[i]) stack.pop();
      answer[i] = stack.isEmpty() ? -1 : stack.peek();
      stack.push(nums[i]);
    }
    return answer;
  }
}
```

## Complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| For each item, scan until the answer | O(n²) | O(1) |
| Monotonic stack | O(n): n pushes and at most n pops | O(n) for the stack |
| Circular array (wrap around once) | O(n): walk the array twice | O(n) |

## Common mistakes

- **The wrong order.** Next greater needs a decreasing stack; next smaller needs an increasing one. Check with a two-item example.
- **`>` versus `>=`.** With equal values, decide whether an equal item counts as "greater" and use the matching comparison.
- **Storing values when you need distances.** Store indexes, and read values through them.
- **Forgetting the items left on the stack** at the end: they have no answer (−1, 0 or the array length, as the problem says).
- **Reading the top of an empty stack.** Check the size first.
- **Calling it O(n²)** because of the nested loop; count pushes and pops instead.

## Edge cases

- **Strictly increasing input:** every item is answered by the next one; the stack never holds more than one.
- **Strictly decreasing input:** nothing is answered; every item stays on the stack.
- **Equal neighbours.**
- **One item.**
- **Circular versions,** where the answer can wrap around to the start.

## Worked example

**Problem:** a row of buildings faces the sea on the right. A building has a sea view when every building to its right is strictly shorter. Return the indexes of the buildings with a sea view, from left to right.

**Explanation in words:** "I walk from left to right and keep a stack of indexes that still have a sea view as far as I know. When a new building is at least as tall as the building on top of the stack, that building loses its view, so I pop it, and I keep popping while that holds. Then I push the new building. The stack stays strictly decreasing in height, and at the end it holds exactly the buildings with a view, already in left-to-right order. Each index is pushed and popped at most once: O(n) time and O(n) space."

```javascript
function seaView(heights) {
  const stack = [];
  for (let i = 0; i < heights.length; i++) {
    while (stack.length > 0 && heights[stack[stack.length - 1]] <= heights[i]) {
      stack.pop();                        // it is blocked by building i
    }
    stack.push(i);
  }
  return stack;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int[] seaView(int[] heights) {
    List<Integer> stack = new ArrayList<>();
    for (int i = 0; i < heights.length; i++) {
      while (!stack.isEmpty() && heights[stack.get(stack.size() - 1)] <= heights[i]) {
        stack.remove(stack.size() - 1);  // it is blocked by building i
      }
      stack.add(i);
    }
    return stack.stream().mapToInt(Integer::intValue).toArray();
  }
}
```
