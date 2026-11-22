# Trees & Binary Search Trees

## Learning objectives

- Describe a binary tree with its root, children, leaves, height, and subtrees.
- Visit every node depth-first (pre-, in-, and post-order) with recursion, and level by level with a queue.
- State the binary search tree rule and use it to search and insert in O(height).
- Explain why a balanced tree gives O(log n) and a chain gives O(n).
- Read and write trees in level-order form, such as `[3, 9, 20, null, null, 15, 7]`.

## Problem hook

A phone's contact list has 1,000,000 names. You type "Mai". Checking every name would take a million steps.

Now imagine the names arranged like a guessing game. The first name you check is in the middle of the alphabet. If "Mai" comes before it, you never look at the second half again; if it comes after, you never look at the first half. Each check throws away half of what is left, so about 20 checks find any name.

A **binary search tree** stores data in exactly this shape, and, unlike a sorted array, it can also take new names without shifting a million others.

## Intuition

**A binary tree is a family of nodes.** Each node holds a value and points to at most two **children**, `left` and `right`. The top node is the **root**; nodes with no children are **leaves**. Every node is the root of its own **subtree**. The **height** is the number of nodes on the longest path from the root down to a leaf.

**Most tree code is recursion.** A tree is a node plus two smaller trees, so a function on a tree usually handles `null` (the empty tree, the base case) and then calls itself on `node.left` and `node.right`. The height, for example, is `1 + max(height(left), height(right))`.

**Three depth-first orders** differ only in when the node itself is handled:

- **Pre-order:** node, left, right. Good for copying a tree.
- **In-order:** left, node, right. In a binary search tree this gives the values **in increasing order**.
- **Post-order:** left, right, node. Good when the children must be finished first, such as deleting a tree or computing heights.

**Level order** visits the tree row by row, using a **queue** from Level 6: take a node from the front, add its children to the back.

**The binary search tree (BST) rule:** for every node, all values in its left subtree are smaller, and all values in its right subtree are larger. To search, compare with the node and go left or right; each step skips a whole subtree. Insert the same way: walk down until you reach an empty spot, and put the new node there.

```figure
{
  "kind": "visual",
  "caption": "Searching for **6** compares once per level and follows one path: O(h).",
  "frames": [
    {"op": "search(6): start at 8", "visual": {"cells": ["8", "3", "10", "1", "6", "", "14"], "tree": true, "markers": [{"index": 0, "label": "6 < 8"}]}},
    {"op": "go left to 3", "visual": {"cells": ["8", "3", "10", "1", "6", "", "14"], "tree": true, "markers": [{"index": 1, "label": "6 > 3"}]}},
    {"op": "go right to 6", "visual": {"cells": ["8", "3", "10", "1", "6", "", "14"], "tree": true, "markers": [{"index": 4, "label": "found"}]}}
  ]
}
```

**Height decides the speed.** A search walks one path, so it costs O(h). A **balanced** tree has height about log2(n). If values arrive in sorted order, every new node goes to the same side and the tree becomes a **chain** with height n. Self-balancing trees (AVL, red-black) fix this automatically; language libraries such as Java's `TreeMap` use them.

**How trees are written in tests.** A tree is listed level by level, left to right, with `null` for a missing child: `[3, 9, 20, null, null, 15, 7]` is 3 with children 9 and 20, and 20 with children 15 and 7. The code editor provides `TreeNode` with `val`, `left`, and `right`.

## When to use

Look for these signals in a problem statement:

- The input is a `root` or a `TreeNode`: think recursion on `left` and `right`, with `null` as the base case.
- "Depth", "height", "same tree", "mirror", "path from root": depth-first recursion.
- "Level by level", "row", "closest to the root", "minimum depth": level order with a queue.
- "Binary search tree", "sorted", "k-th smallest", "in a range": use the BST rule to skip subtrees, or in-order for sorted output.
- Many lookups **and** inserts on ordered data: a balanced BST (a `TreeMap` or `TreeSet` in Java).

## Template code

**Depth-first recursion.** Height of a tree.

```javascript
function height(node) {
  if (node === null) return 0;                         // empty tree
  return 1 + Math.max(height(node.left), height(node.right));
}
```

```java
class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

class Solution {
  public int height(TreeNode node) {
    if (node == null) return 0;                        // empty tree
    return 1 + Math.max(height(node.left), height(node.right));
  }
}
```

**Level order with a queue.** One round per level.

```javascript
function levels(root) {
  const result = [];
  const queue = root ? [root] : [];
  let head = 0;
  while (head < queue.length) {
    const size = queue.length - head;   // nodes on this level
    const level = [];
    for (let k = 0; k < size; k++) {
      const node = queue[head++];
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

class Solution {
  public List<List<Integer>> levels(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    ArrayDeque<TreeNode> queue = new ArrayDeque<>();
    if (root != null) queue.offer(root);
    while (!queue.isEmpty()) {
      int size = queue.size();          // nodes on this level
      List<Integer> level = new ArrayList<>();
      for (int k = 0; k < size; k++) {
        TreeNode node = queue.poll();
        level.add(node.val);
        if (node.left != null) queue.offer(node.left);
        if (node.right != null) queue.offer(node.right);
      }
      result.add(level);
    }
    return result;
  }
}
```

**Search and insert in a BST.** Go left for smaller, right for larger.

```javascript
function search(root, target) {
  let node = root;
  while (node !== null && node.val !== target) {
    node = target < node.val ? node.left : node.right;
  }
  return node;                                    // null if not found
}

function insert(root, value) {
  if (root === null) return new TreeNode(value);  // the empty spot
  if (value < root.val) root.left = insert(root.left, value);
  else root.right = insert(root.right, value);
  return root;
}
```

```java
class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

class Solution {
  public TreeNode search(TreeNode root, int target) {
    TreeNode node = root;
    while (node != null && node.val != target) {
      node = target < node.val ? node.left : node.right;
    }
    return node;                                  // null if not found
  }

  public TreeNode insert(TreeNode root, int value) {
    if (root == null) return new TreeNode(value); // the empty spot
    if (value < root.val) root.left = insert(root.left, value);
    else root.right = insert(root.right, value);
    return root;
  }
}
```

## Complexity

| Operation | Balanced BST | Chain-shaped BST | Any binary tree |
| --- | --- | --- | --- |
| Search, insert | O(log n) | O(n) | O(n): no order to use |
| Visit every node (any traversal) | O(n) | O(n) | O(n) |
| Smallest or largest value | O(log n): go far left or right | O(n) | O(n) |
| Extra space for recursion | O(log n) | O(n) | O(h) |

- **h is the height.** Every "walk one path" operation is O(h); every "visit all nodes" operation is O(n).
- **Level order** keeps up to one full level in the queue: up to about n/2 nodes for a full tree.
- **Deep chains** can overflow the call stack in recursion (Level 7); a loop or an explicit stack avoids it.

## Common mistakes

- **Forgetting the empty tree.** `node.left.val` fails when `node.left` is `null`. Handle `null` first.
- **Checking a BST only against the children.** In `[5, 3, 8, 1, 6]`, every parent is in order with its children, but 6 sits in the left subtree of 5. Pass the allowed range down.
- **Treating a one-child node as a leaf.** For the minimum depth, a node with one child is not an exit.
- **Losing the result of an insert.** `insert(root.left, value)` must be stored back: `root.left = insert(...)`.
- **Assuming log n without balance.** Sorted input makes a chain; the worst case is O(n).
- **Using a stack for level order.** A stack visits deep nodes first; level order needs a queue.

## Edge cases

- **Empty tree:** most answers are 0, `null`, an empty list, or `true` (a valid BST).
- **A single node:** it is both the root and a leaf.
- **Only left or only right children:** a chain; check the recursion depth and the minimum depth.
- **Values at the limits** of 32-bit integers when checking a BST range.
- **Repeated values:** decide which side they go to, or check whether the problem forbids them.

## Worked example

**Problem:** return the sum of all leaf values in a binary tree.

**Explanation in words:** "An empty tree has no leaves, so it gives 0. A node with no children is a leaf, so it gives its own value. Any other node gives the sum from its left subtree plus the sum from its right subtree. Each node is visited once: O(n) time, and the recursion is as deep as the tree: O(h) space."

```javascript
function leafSum(node) {
  if (node === null) return 0;                              // empty tree
  if (node.left === null && node.right === null) return node.val; // leaf
  return leafSum(node.left) + leafSum(node.right);
}
```

```java
class TreeNode {
  int val;
  TreeNode left, right;
  TreeNode(int val) { this.val = val; }
}

class Solution {
  public int leafSum(TreeNode node) {
    if (node == null) return 0;                             // empty tree
    if (node.left == null && node.right == null) return node.val; // leaf
    return leafSum(node.left) + leafSum(node.right);
  }
}
```
