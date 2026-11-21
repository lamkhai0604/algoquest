# Fast & Slow Pointers

## Learning objectives

- Move two pointers through a linked list at different speeds, one step and two steps at a time.
- Find the middle node of a list in one pass with O(1) extra space.
- Detect a cycle with Floyd's algorithm, and find the node where the cycle starts.
- Apply the same idea to anything that has a "next" step: a next-index array or a number sequence.
- Keep a fixed gap between two pointers to find the k-th node from the end.

## Problem hook

Two runners start together on a track that might be a straight road or might loop back on itself. One runs twice as fast as the other.

On a straight road the fast runner reaches the end and the race is over. On a loop the fast runner can never escape: sooner or later it laps the slow runner and they meet. So "do they ever meet?" answers "is there a loop?" without marking a single square of the track, which is exactly what you need when you cannot store where you have been.

## Intuition

**Two speeds on the same path.** `slow` moves one step, `fast` moves two. After k steps, `slow` has walked k nodes and `fast` 2k.

**The middle.** When `fast` reaches the end of a list, `slow` has walked half as far: it stands on the middle node. With an even number of nodes, stopping when `fast` or `fast.next` is `null` puts `slow` on the second of the two middle nodes.

**Cycle detection (Floyd).** If the list ends, `fast` reaches `null` and there is no cycle. If there is a cycle, both pointers end up inside it, and each step `fast` gains one node on `slow`, so the gap shrinks by one every step until they meet. That takes at most one trip around the cycle after `slow` enters it: **O(n) time, O(1) space**, where a visited set would cost O(n) space.

**Where the cycle starts.** After they meet, put one pointer back at the head and move both **one** step at a time. They meet again exactly at the first node of the cycle. (If the cycle starts a steps from the head and they first met b steps into it, the distances work out so that walking a more steps from the meeting point lands on the start.)

**Not only linked lists.** Anything with a "next" step works: an array where `next[i]` is the index to go to, or a number sequence such as "replace n by the sum of the squares of its digits". If the sequence must eventually repeat, fast and slow pointers find the repeat without storing what was seen.

**A fixed gap.** To find the k-th node from the end, move `fast` k steps ahead, then move both one step at a time. When `fast` reaches the end, `slow` is k nodes behind it.

## When to use

Look for these signals in a problem statement:

- A **linked list** and "middle", "k-th from the end", "is it a palindrome", or "reorder" in O(1) extra space.
- "Does it **loop**", "does it **repeat**", "is it **cyclic**", or "where does the loop **start**".
- A function that maps each value or index to the **next** one, and the sequence might cycle.
- An array of n + 1 values in 1..n where you must find the **duplicate** without changing the array and with O(1) space.

## Template code

**The middle node.**

```javascript
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;          // one step
    fast = fast.next.next;     // two steps
  }
  return slow;                 // second middle when the length is even
}
```

```java
class ListNode {
  int val;
  ListNode next;
  ListNode(int val) { this.val = val; }
}

class Solution {
  public ListNode middleNode(ListNode head) {
    ListNode slow = head;
    ListNode fast = head;
    while (fast != null && fast.next != null) {
      slow = slow.next;          // one step
      fast = fast.next.next;     // two steps
    }
    return slow;                 // second middle when the length is even
  }
}
```

**Floyd's cycle detection on a next-index array, and the start of the cycle.** `next[i]` is the index after `i`, or −1 for the end.

```javascript
function cycleStart(next, start) {
  let slow = start;
  let fast = start;
  while (fast !== -1 && next[fast] !== -1) {
    slow = next[slow];
    fast = next[next[fast]];
    if (slow === fast) {            // they met inside the cycle
      let a = start;
      while (a !== slow) {          // one step each until they meet again
        a = next[a];
        slow = next[slow];
      }
      return a;                     // the first index of the cycle
    }
  }
  return -1;                        // fast reached the end: no cycle
}
```

```java
class Solution {
  public int cycleStart(int[] next, int start) {
    int slow = start;
    int fast = start;
    while (fast != -1 && next[fast] != -1) {
      slow = next[slow];
      fast = next[next[fast]];
      if (slow == fast) {            // they met inside the cycle
        int a = start;
        while (a != slow) {          // one step each until they meet again
          a = next[a];
          slow = next[slow];
        }
        return a;                    // the first index of the cycle
      }
    }
    return -1;                       // fast reached the end: no cycle
  }
}
```

## Complexity

| Task | With a visited set | Fast & slow pointers |
| --- | --- | --- |
| Detect a cycle | O(n) time, O(n) space | O(n) time, O(1) space |
| Find where a cycle starts | O(n) time, O(n) space | O(n) time, O(1) space |
| Middle of a list | O(n) time, two passes or O(n) space | O(n) time, one pass, O(1) space |
| k-th from the end | Two passes: count, then walk | One pass with a gap of k |

## Common mistakes

- **Checking only `fast !== null`** before `fast.next.next`: also check `fast.next`, or the code crashes on lists of even length.
- **Comparing values instead of nodes or indexes.** Two different nodes can hold the same value; compare the pointers themselves.
- **Checking for a meeting before moving.** Both start at the head, so they are equal at step 0.
- **Moving both pointers two steps** in the second phase of finding the cycle start; both move one step.
- **Off by one with the gap:** for the k-th node from the end, the gap between the pointers must be exactly k.

## Edge cases

- **An empty list or a single node.**
- **A cycle that includes the head,** or a node whose `next` points to itself.
- **Lists of even and odd length** for the middle.
- **k equal to the length** for the k-th from the end.
- **A sequence that reaches a fixed point** (it repeats one value forever), which is a cycle of length 1.

## Worked example

**Problem:** a number is called *calm* if repeatedly replacing it with the sum of the squares of its digits eventually reaches 1. Return whether n is calm. For example, 19 → 82 → 68 → 100 → 1, so 19 is calm.

**Explanation in words:** "The sequence either reaches 1 and stays there, or it falls into a loop of other numbers, because the sum of digit squares of any large number is much smaller, so the values are bounded. I run a slow pointer one step at a time and a fast pointer two steps. If the fast one reaches 1, n is calm. If the two meet on a number other than 1, the sequence loops forever, so it is not. This uses O(1) extra space instead of a set of seen numbers, and the number of steps is small because the values stay bounded."

```javascript
function isCalm(n) {
  const step = (x) => {
    let sum = 0;
    for (; x > 0; x = Math.floor(x / 10)) sum += (x % 10) ** 2;
    return sum;
  };
  let slow = n;
  let fast = step(n);
  while (fast !== 1 && slow !== fast) {
    slow = step(slow);
    fast = step(step(fast));
  }
  return fast === 1;
}
```

```java
class Solution {
  private int step(int x) {
    int sum = 0;
    for (; x > 0; x /= 10) sum += (x % 10) * (x % 10);
    return sum;
  }

  public boolean isCalm(int n) {
    int slow = n;
    int fast = step(n);
    while (fast != 1 && slow != fast) {
      slow = step(slow);
      fast = step(step(fast));
    }
    return fast == 1;
  }
}
```
