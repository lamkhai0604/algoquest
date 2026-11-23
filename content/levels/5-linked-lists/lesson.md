# Linked Lists

## Learning objectives

- Describe a linked list as nodes that each hold a value and a pointer to the next node, ending in `null`.
- Walk a list from `head` to `null`, and say why reaching the k-th node costs O(k) while an array costs O(1).
- Insert and delete nodes by changing pointers, using a dummy node so the head needs no special case.
- Reverse a list in place with `prev`, `curr`, and a saved next pointer, and explain each step.
- Merge two sorted lists by relinking their nodes, and count the time and extra space of pointer code.

## Problem hook

```figure
{"kind": "image", "src": "/lesson-images/linked-list-treasure-hunt.webp", "alt": "Clues on trees joined by dotted arrows to a chest"}
```

A music app keeps a playlist of 50,000 songs and lets you drop a new song **right after the one playing now**.

In an array, every song after that point has to shift one place to the right: up to 50,000 moves for one tap. In a linked list, each song only knows which song comes **next**. Adding a song means changing two pointers: the new song points at the old next song, and the current song points at the new one. Two steps, whatever the size of the playlist.

The price: there is no "jump to song 30,000". To get there you follow 30,000 pointers.

## Intuition

**A linked list is a treasure hunt.** Each clue (a node) has a value and tells you where the next clue is. You only hold the first clue, `head`. The last clue says "no more clues": its next pointer is `null`.

- To read the list, start at `head` and follow `next` until you reach `null`.
- To insert or delete, you do not move any values. You **change where one or two pointers point**.
- Losing the only pointer to a node means losing that node and everything after it. So before you change `node.next`, keep a pointer to whatever you still need.

```figure
{
  "kind": "visual",
  "caption": "Inserting **X** after **B** changes two pointers and moves no values: O(1) once you hold B.",
  "frames": [
    {"op": "A → B → C", "visual": {"cells": ["A", "B", "C"], "next": [1, 2, -1], "markers": [{"index": 0, "label": "head"}, {"index": 1, "label": "B"}]}},
    {"op": "X.next = B.next; B.next = X", "visual": {"cells": ["A", "B", "X", "C"], "next": [1, 2, 3, -1], "markers": [{"index": 0, "label": "head"}, {"index": 2, "label": "new"}]}}
  ]
}
```

**A dummy node removes the special case for the head.** Deleting a node means changing the pointer of the node **before** it, and the head has no node before it. Put a dummy node in front (`dummy.next = head`), work as if every real node has a predecessor, and return `dummy.next` at the end.

**Reversing turns every arrow around.** Walk with `prev` (starts at `null`) and `curr` (starts at `head`). At each node: save `curr.next`, point `curr.next` back at `prev`, then move `prev` and `curr` one step forward. When `curr` is `null`, `prev` is the new head.

```figure
{
  "kind": "visual",
  "caption": "Each step turns one arrow around. When `curr` reaches `null`, `prev` is the new head.",
  "frames": [
    {"op": "prev = null, curr = 1", "visual": {"cells": ["1", "2", "3"], "next": [1, 2, -1], "markers": [{"index": 0, "label": "curr"}]}},
    {"op": "1.next = null", "visual": {"cells": ["1", "2", "3"], "next": [-1, 2, -1], "markers": [{"index": 0, "label": "prev"}, {"index": 1, "label": "curr"}]}},
    {"op": "2.next = 1", "visual": {"cells": ["1", "2", "3"], "next": [-1, 0, -1], "markers": [{"index": 1, "label": "prev"}, {"index": 2, "label": "curr"}]}},
    {"op": "3.next = 2", "visual": {"cells": ["1", "2", "3"], "next": [-1, 0, 1], "markers": [{"index": 2, "label": "new head"}]}}
  ]
}
```

Each node in these lessons is `{ val, next }` in JavaScript and `class ListNode { int val; ListNode next; }` in Java. The code editor provides `ListNode`; tests write a list as an array, so `[1, 2, 3]` means 1 → 2 → 3.

## When to use

Look for these signals in a problem statement:

- The input is a chain of nodes (`head`, `next`, `ListNode`): you must work with pointers, not indexes.
- "Insert", "remove", or "skip" items in the middle of a sequence many times: changing pointers is O(1) once you are at the spot.
- "Reverse", "swap pairs", or "reorder" the nodes themselves: keep the nodes and rewire their pointers.
- Two sorted chains to combine: merge by relinking, with a dummy head and a tail pointer.
- The head itself might change (removed, replaced, or reversed): reach for a dummy node.

## Template code

**Walk the list.** Visit every node from `head` to `null`.

```javascript
function walk(head) {
  let count = 0;
  for (let node = head; node !== null; node = node.next) {
    count++;                 // do something with node.val
  }
  return count;
}
```

```java
class Solution {
  public int walk(ListNode head) {
    int count = 0;
    for (ListNode node = head; node != null; node = node.next) {
      count++;               // do something with node.val
    }
    return count;
  }
}
```

**Delete with a dummy node.** Every real node has a node before it, the head too.

```javascript
function removeValue(head, target) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next !== null) {
    if (prev.next.val === target) prev.next = prev.next.next; // unlink it
    else prev = prev.next;                                     // keep it, move on
  }
  return dummy.next;
}
```

```java
class Solution {
  public ListNode removeValue(ListNode head, int target) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    while (prev.next != null) {
      if (prev.next.val == target) prev.next = prev.next.next; // unlink it
      else prev = prev.next;                                   // keep it, move on
    }
    return dummy.next;
  }
}
```

**Reverse in place.** Save the next node before you turn the arrow around.

```javascript
function reverse(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    const nextNode = curr.next; // 1. save the rest of the list
    curr.next = prev;           // 2. turn the arrow around
    prev = curr;                // 3. move both pointers forward
    curr = nextNode;
  }
  return prev;                  // the old tail is the new head
}
```

```java
class Solution {
  public ListNode reverse(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
      ListNode nextNode = curr.next; // 1. save the rest of the list
      curr.next = prev;              // 2. turn the arrow around
      prev = curr;                   // 3. move both pointers forward
      curr = nextNode;
    }
    return prev;                     // the old tail is the new head
  }
}
```

## Complexity

| Operation | Linked list | Array |
| --- | --- | --- |
| Read the k-th item | O(k): follow k pointers | O(1) |
| Insert or delete at the front | O(1) | O(n): shift everything |
| Insert or delete after a node you hold | O(1) | O(n) |
| Find a value | O(n) | O(n) |
| Reverse in place | O(n) time, O(1) extra space | O(n) time, O(1) extra space |

- **Why reading is O(k):** a node only knows its next node, so the only way to the k-th node is through the k − 1 nodes before it.
- **Why changing is O(1):** once you hold the node before the spot, inserting or deleting changes one or two pointers, however long the list is.
- **Extra space:** walking, deleting, reversing, and merging need only a few pointer variables, O(1). Building a new list or copying values to an array costs O(n).
- **Recursion is not free:** a recursive reversal is O(n) time but also O(n) space for the call stack.

## Common mistakes

- **Losing the rest of the list.** Setting `curr.next = prev` before saving `curr.next` cuts the list, and the nodes after `curr` are gone. Save first, then change.
- **Reading `.next` of `null`.** `node.next.val` fails when `node.next` is `null`. Check `node.next !== null` (or `node != null` in Java) before using it.
- **Moving forward after a delete.** After `prev.next = prev.next.next`, the new `prev.next` has not been checked yet. Only move `prev` when you keep a node.
- **Forgetting the head can change.** Removing the first node or reversing gives a new head. Return `dummy.next` or `prev`, not the old `head`.
- **Changing values instead of nodes.** Some problems ask to swap or reverse the nodes; copying values around gives the right numbers but not what was asked.
- **Returning the dummy itself.** The answer starts at `dummy.next`.

## Edge cases

- **Empty list (`head` is `null`):** the loops do not run; return `null` (an empty list).
- **One node:** reversing or swapping pairs leaves it unchanged.
- **The node to change is the head:** a dummy node handles it like any other node.
- **Every node removed:** `dummy.next` ends up `null`.
- **Two nodes:** check that both pointers are turned around and that the old head now points to `null`.

## Worked example

**Problem:** remove the **first** node whose value is `target`, if there is one, and return the head.

**Explanation in words:** "I put a dummy node in front of the head so that removing the first node is the same as removing any other. I move a pointer `prev` from the dummy until `prev.next` is the node with the target value, or until there is no next node. If I found it, I skip it by setting `prev.next = prev.next.next`. I return `dummy.next`, because the head may have been removed. This is one walk, so O(n) time, and O(1) extra space for the dummy and one pointer."

```javascript
function removeFirst(head, target) {
  const dummy = new ListNode(0, head);
  let prev = dummy;
  while (prev.next !== null && prev.next.val !== target) prev = prev.next;
  if (prev.next !== null) prev.next = prev.next.next;
  return dummy.next;
}
```

```java
class Solution {
  public ListNode removeFirst(ListNode head, int target) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    while (prev.next != null && prev.next.val != target) prev = prev.next;
    if (prev.next != null) prev.next = prev.next.next;
    return dummy.next;
  }
}
```
