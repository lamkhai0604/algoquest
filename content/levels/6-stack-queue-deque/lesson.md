# Stack, Queue & Deque

## Learning objectives

- Tell a stack (last in, first out) from a queue (first in, first out), and pick the one a problem's order calls for.
- Use a JavaScript array or a Java `ArrayDeque` as a stack with O(1) push and pop.
- Build a queue that is O(1) per operation, and say why `shift()` on a JavaScript array is O(n).
- Solve matching and undo problems with a stack, and turn-by-turn simulations with a queue.
- Use a deque when items enter or leave at both ends.

## Problem hook

```figure
{"kind": "image", "src": "/lesson-images/stack-queue-plates-line.webp", "alt": "A pile of plates beside a line at a counter"}
```

You type a message, then press **Undo** three times. The editor removes your **last** three actions, newest first: the change you made a second ago goes before the one from a minute ago.

Now picture a printer shared by an office. Ten people press Print. The printer handles the jobs in the order they **arrived**: the first job sent comes out first.

Same idea, opposite order. Undo needs the newest item; the printer needs the oldest. Two tiny data structures cover these two orders, and a third, the deque, does both.

## Intuition

**A stack is a pile of plates.** You put a plate on top (`push`) and take the top plate off (`pop`). The plate you can reach is always the most recent one: **last in, first out (LIFO)**.

- Use a stack when the newest unfinished thing must be dealt with first: closing the most recent open bracket, undoing the latest action, going back to the previous page.

```figure
{
  "kind": "stack",
  "caption": "**Last in, first out.** `pop` always takes the plate on top: the one pushed most recently.",
  "frames": [
    {"op": "push(A)", "items": ["A"]},
    {"op": "push(B)", "items": ["A", "B"]},
    {"op": "push(C)", "items": ["A", "B", "C"]},
    {"op": "pop() → C", "items": ["A", "B"], "out": "C"}
  ]
}
```

**A queue is a line at a counter.** People join at the back (`enqueue`) and are served from the front (`dequeue`): **first in, first out (FIFO)**.

- Use a queue when things must be handled in arrival order: print jobs, customers, turns in a game, and later, breadth-first search.

```figure
{
  "kind": "queue",
  "caption": "**First in, first out.** New items join at the back; `dequeue` serves the front.",
  "frames": [
    {"op": "enqueue(A)", "items": ["A"]},
    {"op": "enqueue(B)", "items": ["A", "B"]},
    {"op": "enqueue(C)", "items": ["A", "B", "C"]},
    {"op": "dequeue() → A", "items": ["B", "C"], "out": "A"}
  ]
}
```

**A deque (double-ended queue) is a line with two doors.** You can add or remove at the front and at the back, each in O(1). A stack and a queue are both special cases of a deque.

**The JavaScript trap.** A JavaScript array is a fine stack: `push` and `pop` work at the end in O(1). But `shift()` removes the first item and moves every other item down one place, which is O(n). A loop of `shift()` calls over n items is O(n²). For a queue, keep a `head` index into the array instead, or use a deque. In Java, `ArrayDeque` gives O(1) at both ends.

## When to use

Look for these signals in a problem statement:

- "Matching" or "balanced" pairs (brackets, tags), or things that open and close: a **stack** of open items.
- "Undo", "back", "cancel the last", or "the most recent": a **stack**.
- Nested structure, such as `3[ab2[c]]` or folders inside folders: a **stack** of saved state, one entry per level.
- Postfix expressions or "use the last two results": a **stack** of values.
- "In the order they arrive", "take turns", "go to the back of the line": a **queue**.
- Items that leave from both ends, or a sliding window you trim at both sides: a **deque**.

## Template code

**Stack: match brackets.** Push openers; a closer must match the top.

```javascript
function isBalanced(text) {
  const opener = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  for (const ch of text) {
    if (ch in opener) {
      if (stack.pop() !== opener[ch]) return false; // empty or wrong kind
    } else {
      stack.push(ch);
    }
  }
  return stack.length === 0;                       // nothing left open
}
```

```java
import java.util.ArrayDeque;

class Solution {
  public boolean isBalanced(String text) {
    ArrayDeque<Character> stack = new ArrayDeque<>();
    for (char ch : text.toCharArray()) {
      if (ch == '(' || ch == '[' || ch == '{') {
        stack.push(ch);
        continue;
      }
      char opener = ch == ')' ? '(' : ch == ']' ? '[' : '{';
      if (stack.isEmpty() || stack.pop() != opener) return false;
    }
    return stack.isEmpty();
  }
}
```

**Queue: serve in arrival order.** In JavaScript, a `head` index replaces the slow `shift()`.

```javascript
function serveAll(customers) {
  const queue = [...customers];
  let head = 0;                    // queue[head] is the front
  const served = [];
  while (head < queue.length) {
    const next = queue[head++];    // dequeue in O(1)
    served.push(next);             // enqueue with queue.push(x) when needed
  }
  return served;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<String> serveAll(List<String> customers) {
    ArrayDeque<String> queue = new ArrayDeque<>(customers);
    List<String> served = new ArrayList<>();
    while (!queue.isEmpty()) {
      served.add(queue.poll());    // dequeue from the front; offer(x) adds at the back
    }
    return served;
  }
}
```

**Deque: check a palindrome from both ends.**

```javascript
function isPalindrome(word) {
  const deque = [...word];
  let front = 0;
  let back = deque.length - 1;     // two indexes act as the two doors
  while (front < back) {
    if (deque[front++] !== deque[back--]) return false;
  }
  return true;
}
```

```java
import java.util.ArrayDeque;

class Solution {
  public boolean isPalindrome(String word) {
    ArrayDeque<Character> deque = new ArrayDeque<>();
    for (char ch : word.toCharArray()) deque.offerLast(ch);
    while (deque.size() > 1) {
      if (!deque.pollFirst().equals(deque.pollLast())) return false;
    }
    return true;
  }
}
```

## Complexity

| Operation | Stack (array end / `ArrayDeque`) | Queue with a head index / `ArrayDeque` | JavaScript `shift()` |
| --- | --- | --- | --- |
| Add | O(1) push | O(1) at the back | — |
| Remove | O(1) pop from the top | O(1) from the front | O(n) |
| Look at the next item | O(1) top | O(1) front | O(1) |

- **One pass with a stack is O(n):** each item is pushed once and popped at most once, so the total work is at most 2n steps even when an inner `while` pops several items.
- **Space:** the stack or queue can hold all n items in the worst case, such as a string of only opening brackets: O(n).
- **A queue built on `shift()`** turns an O(n) simulation into O(n²). With 100,000 items, that is billions of moves instead of a few hundred thousand.

## Common mistakes

- **Popping an empty stack.** In JavaScript, `[].pop()` returns `undefined`; in Java, `pop()` on an empty `ArrayDeque` throws. Check `stack.length` or `isEmpty()` first, or make sure the comparison fails safely.
- **Forgetting the final check.** A bracket text like `"(("` never fails during the loop. It is balanced only if the stack is empty at the end.
- **Mixing up the operand order.** In `a - b` or `a / b` with a stack, the first `pop()` is `b`, the second is `a`.
- **Using `shift()` in a loop.** It looks like O(1) but moves every element. Use a head index or a deque.
- **Using Java's `Stack` class.** It works, but it is an old synchronized class; `ArrayDeque` is the recommended stack and queue.
- **Reading the wrong end.** `ArrayDeque.push` and `pop` work at the front, `offer` and `poll` work front-to-back as a queue. Pick one set per structure and stay with it.

## Edge cases

- **Empty input:** an empty text is balanced; an empty queue has nothing to serve.
- **Only one kind of item:** all openers, all closers, or all undo keys.
- **The structure empties in the middle and fills again,** such as `"()()"`.
- **A single item:** one bracket is never balanced; one customer is served first and last.
- **Large input:** check that each item is pushed and popped at most once, so the run stays O(n).

## Worked example

**Problem:** a text editor keeps the history of actions in an array `actions`: `"type x"` adds the letter `x`, and `"undo"` removes the most recent letter still there. Return the final text.

**Explanation in words:** "Undo always removes the newest letter that is still on the screen, so I keep the letters on a stack. For `type x` I push `x`. For `undo` I pop, but only if the stack is not empty. At the end I join the stack from bottom to top. Each action is one push or one pop, so the time is O(n) and the stack uses O(n) space."

```javascript
function finalText(actions) {
  const stack = [];
  for (const action of actions) {
    if (action === "undo") {
      if (stack.length > 0) stack.pop();
    } else {
      stack.push(action.slice(5));   // the letter after "type "
    }
  }
  return stack.join("");
}
```

```java
import java.util.List;

class Solution {
  public String finalText(List<String> actions) {
    StringBuilder stack = new StringBuilder();
    for (String action : actions) {
      if (action.equals("undo")) {
        if (stack.length() > 0) stack.deleteCharAt(stack.length() - 1);
      } else {
        stack.append(action.substring(5)); // the letter after "type "
      }
    }
    return stack.toString();
  }
}
```
