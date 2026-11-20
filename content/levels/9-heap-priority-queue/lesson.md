# Heap & Priority Queue

## Learning objectives

- Describe a binary heap: a complete binary tree where every parent is no larger (min-heap) or no smaller (max-heap) than its children.
- Store a heap in an array and find a node's parent and children by index.
- Push with sift-up and pop with sift-down, each in O(log n), and peek in O(1).
- Use a priority queue: a short heap class in JavaScript, `PriorityQueue` in Java.
- Recognize top-k, k-way merge, and "always take the smallest next" problems, and count their cost.

## Problem hook

An airport has one runway. Planes ask to land all the time, and the controller must always pick the plane with the **least fuel** first.

Sorting the waiting planes after every new request costs O(n log n) each time. Scanning them all for the lowest fuel costs O(n). With hundreds of requests a minute, both get slow.

A **priority queue** gives the plane with the least fuel in one step and takes a new plane in a few steps, however long the line is. Inside, it is a **heap**.

## Intuition

**A heap only promises one thing:** every parent is in the right order with its children. In a **min-heap**, a parent is never larger than its children, so the **smallest value is at the root**. Nothing is promised between left and right, or between cousins. That weaker promise is what makes it cheap to keep.

**The shape is always a complete tree:** every level is full except the last, which fills from left to right. That shape fits an array with no gaps:

- the root is at index 0,
- the children of index i are at **2i + 1** and **2i + 2**,
- the parent of index i is at **floor((i − 1) / 2)**.

**Push (sift-up).** Put the new value in the next free spot at the end of the array. While it is smaller than its parent, swap them. It climbs at most the height of the tree: **O(log n)**.

**Pop (sift-down).** Remove the root (the smallest). Move the last value to the root, then, while it is larger than its smaller child, swap with that child. Again one path: **O(log n)**.

**Peek** reads index 0: **O(1)**.

**A max-heap** is the same with the comparison reversed. In code, a min-heap of negated numbers, or a heap with a reversed comparison, works as a max-heap.

**Top-k with a heap of size k.** To keep the k **largest** values from a long list, use a **min-heap of size k**: its root is the weakest of the current top k. Push each value and pop when the size passes k. Each value costs O(log k), so the whole list costs O(n log k), and memory stays O(k).

**Languages.** Java has `PriorityQueue` (a min-heap; pass `Collections.reverseOrder()` or a comparator for other orders). JavaScript has no built-in heap, so solutions include the short class below; copying it into your answer is fine.

## When to use

Look for these signals in a problem statement:

- "The k largest", "the k smallest", "the k-th largest", "top k": a heap of size k.
- "Always take the smallest (or largest) next", while items keep arriving: a priority queue.
- Merging k sorted lists: a heap that holds the front of each list.
- Scheduling: rooms, machines, or tasks that free up at different times: a min-heap of end times.
- Repeatedly combining the two smallest (or largest) items: a heap, not repeated sorting.

## Template code

**A min-heap class for JavaScript.** Pass a comparison to change the order.

```javascript
class MinHeap {
  constructor(less = (a, b) => a < b) {
    this.items = [];
    this.less = less;             // less(a, b): should a be above b?
  }
  get size() { return this.items.length; }
  peek() { return this.items[0]; }
  push(value) {
    const a = this.items;
    a.push(value);
    let i = a.length - 1;
    while (i > 0) {                               // sift up
      const parent = (i - 1) >> 1;
      if (!this.less(a[i], a[parent])) break;
      [a[i], a[parent]] = [a[parent], a[i]];
      i = parent;
    }
  }
  pop() {
    const a = this.items;
    const top = a[0];
    const last = a.pop();
    if (a.length > 0) {
      a[0] = last;
      let i = 0;
      while (true) {                              // sift down
        const left = 2 * i + 1, right = left + 1;
        let best = i;
        if (left < a.length && this.less(a[left], a[best])) best = left;
        if (right < a.length && this.less(a[right], a[best])) best = right;
        if (best === i) break;
        [a[i], a[best]] = [a[best], a[i]];
        i = best;
      }
    }
    return top;
  }
}
```

```java
import java.util.Collections;
import java.util.PriorityQueue;

class Solution {
  public void demo() {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
    minHeap.offer(5);              // push: O(log n)
    int smallest = minHeap.peek(); // peek: O(1)
    minHeap.poll();                // pop: O(log n)
    maxHeap.offer(smallest);
  }
}
```

**Top-k: the k largest values.** A min-heap of size k.

```javascript
function kLargest(values, k) {
  const heap = new MinHeap();
  for (const v of values) {
    heap.push(v);
    if (heap.size > k) heap.pop();   // drop the weakest of the top k
  }
  return heap.items;                  // the k largest, in heap order
}
```

```java
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

class Solution {
  public List<Integer> kLargest(int[] values, int k) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int v : values) {
      heap.offer(v);
      if (heap.size() > k) heap.poll(); // drop the weakest of the top k
    }
    return new ArrayList<>(heap);       // the k largest, in heap order
  }
}
```

## Complexity

| Operation | Heap | Sorted array | Unsorted array |
| --- | --- | --- | --- |
| Peek at the smallest | O(1) | O(1) | O(n) |
| Push | O(log n) | O(n): shift to keep order | O(1) |
| Pop the smallest | O(log n) | O(1): keep it in descending order and pop the end | O(n) |
| Build from n values | O(n) with heapify, O(n log n) by pushing | O(n log n) | — |
| Search for any value | O(n) | O(log n) | O(n) |

- **Top-k over n values:** O(n log k) time and O(k) space, better than sorting everything when k is small.
- **K-way merge of N values in k lists:** O(N log k).
- **Sorting with a heap** (push all, pop all) is O(n log n): heapsort.

## Common mistakes

- **Using the wrong kind of heap for top-k.** The k **largest** values need a **min**-heap of size k, so the weakest of them sits at the root to be dropped.
- **Sorting again after every change.** That is O(n log n) per operation; a heap does it in O(log n).
- **Expecting the heap array to be sorted.** Only the root is guaranteed. Sort the final k items if the order matters.
- **Forgetting ties.** When the output order is defined for equal priorities, put the tie rule into the comparison.
- **Java's comparator overflow.** `(a, b) -> a - b` can overflow for large values; use `Integer.compare(a, b)`.
- **Popping an empty heap.** Check the size first.

## Edge cases

- **k equal to n:** the heap keeps everything.
- **k = 1:** a heap still works; a single pass for the maximum is simpler.
- **Equal values and equal priorities:** decide and test the tie rule.
- **Empty input or empty lists** in a k-way merge.
- **Negative numbers,** especially when negating values to turn a min-heap into a max-heap.

## Worked example

**Problem:** given a list of tasks' durations, a worker always does the **shortest** remaining task next. Return the order of durations in which the tasks are done.

**Explanation in words:** "The worker always needs the smallest remaining duration, so I keep the durations in a min-heap. I push every duration, then pop until the heap is empty, writing each popped value to the answer. Each push and pop is O(log n), so the total is O(n log n), and the heap uses O(n) space."

```javascript
function shortestFirst(durations) {
  const heap = new MinHeap();
  for (const d of durations) heap.push(d);
  const order = [];
  while (heap.size > 0) order.push(heap.pop());
  return order;
}
```

```java
import java.util.PriorityQueue;

class Solution {
  public int[] shortestFirst(int[] durations) {
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    for (int d : durations) heap.offer(d);
    int[] order = new int[durations.length];
    for (int i = 0; i < order.length; i++) order[i] = heap.poll();
    return order;
  }
}
```
