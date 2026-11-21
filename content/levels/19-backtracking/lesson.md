# Backtracking

## Learning objectives

- Build every candidate answer step by step with the choose, explore, undo loop.
- Generate subsets, permutations and combinations without missing or repeating one.
- Draw the decision tree of a search and count its size: 2ⁿ subsets, n! orders.
- Prune: stop exploring a branch as soon as it cannot lead to a valid answer.
- Recognize problems that ask for every way, or for one way under many constraints.

## Problem hook

A sandwich shop has 10 toppings, and a customer wants to see every possible sandwich.

Each topping is either on or off, so the shop is really making 10 yes-or-no decisions in a row. Write them as a tree: the first level decides cheese, the next decides tomato, and so on. Every path from the top to the bottom is one sandwich, and there are 2¹⁰ = 1,024 of them. Backtracking walks that tree: it makes a choice, goes deeper, and when it reaches the bottom (or a dead end) it **undoes** the last choice and tries the other option.

## Intuition

**The loop: choose, explore, undo.** Keep a partial answer (the path). At each step, for every option that is still allowed: add it to the path, recurse to make the next decision, then remove it again. Removing it restores the path exactly as it was, so the next option starts clean.

**Record at the right moment.** Subsets record the path at **every** node (each node is a different subset). Permutations and fixed-length combinations record only when the path is **complete**.

**Avoiding repeats.**

- **Subsets and combinations:** pass a `start` index and only choose items at or after it. Then {1, 2} is built once, never again as {2, 1}.
- **Permutations:** every position can take any unused item; keep a `used` array and skip used items.
- **Duplicate values:** sort first, and at the same level skip an item equal to the previous one.

**Pruning.** If the partial answer already breaks a rule (the sum is over the target, a queen is attacked, a letter does not match), return at once. A pruned branch removes its whole subtree, which is often most of the work.

**The cost.** Backtracking is exhaustive: n items give up to 2ⁿ subsets or n! orders, and copying each answer costs up to n more. That is fine for n around 10–20 and impossible for 50. Problems that ask for **every** answer cannot do better, because the output itself is that big. When only a count or a best value is needed, the dynamic programming of Level 21 is often faster.

## When to use

Look for these signals in a problem statement:

- "Return **all** subsets / permutations / combinations / arrangements / ways".
- "Find **a** valid placement" under many rules: Sudoku, N-Queens, word in a grid.
- Small limits (n ≤ 10–20) and an answer that is a list of lists.
- Every step is a choice from a small set, and choices must be undone to try others.

## Template code

**Every subset, built with choose, explore, undo.**

```javascript
function subsets(nums) {
  const result = [];
  const path = [];
  function explore(start) {
    result.push([...path]);                 // every node is a subset
    for (let i = start; i < nums.length; i++) {
      path.push(nums[i]);                   // choose
      explore(i + 1);                       // explore: only later items
      path.pop();                           // undo
    }
  }
  explore(0);
  return result;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    explore(nums, 0, new ArrayList<>(), result);
    return result;
  }

  private void explore(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {
    result.add(new ArrayList<>(path));      // every node is a subset
    for (int i = start; i < nums.length; i++) {
      path.add(nums[i]);                    // choose
      explore(nums, i + 1, path, result);   // explore: only later items
      path.remove(path.size() - 1);         // undo
    }
  }
}
```

**Every order (permutation), with a `used` array.**

```javascript
function permutations(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  function explore() {
    if (path.length === nums.length) {
      result.push([...path]);               // complete: record it
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(nums[i]);                   // choose
      explore();                            // explore
      path.pop();                           // undo
      used[i] = false;
    }
  }
  explore();
  return result;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<List<Integer>> permutations(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    explore(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
  }

  private void explore(int[] nums, boolean[] used, List<Integer> path, List<List<Integer>> result) {
    if (path.size() == nums.length) {
      result.add(new ArrayList<>(path));    // complete: record it
      return;
    }
    for (int i = 0; i < nums.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.add(nums[i]);                    // choose
      explore(nums, used, path, result);    // explore
      path.remove(path.size() - 1);         // undo
      used[i] = false;
    }
  }
}
```

## Complexity

| Search | Answers | Time |
| --- | --- | --- |
| Subsets of n items | 2ⁿ | O(n · 2ⁿ) with copying |
| Permutations of n items | n! | O(n · n!) |
| Combinations of k from n | C(n, k) | O(k · C(n, k)) |
| With pruning | fewer | depends on how early branches die |

- Extra space is O(n) for the path and the recursion, plus the output.
- n = 20 gives about a million subsets; n = 10 gives 3.6 million orders. Both are near the practical limit.

## Common mistakes

- **Storing `path` itself** instead of a copy: every stored answer then changes when the path changes.
- **Forgetting to undo,** so later branches start from a dirty path or a stale `used` flag.
- **Starting the loop at 0 for subsets,** which builds {1, 2} and {2, 1} as different answers.
- **Pruning too late,** after a long branch has already been explored.
- **Skipping duplicates incorrectly:** skip an equal value only at the same level (`i > start`), not deeper.

## Edge cases

- **Empty input:** one subset (the empty one), one permutation (the empty order).
- **Duplicate values** in the input.
- **A target that no combination reaches:** return an empty list.
- **k = 0 or k = n** for combinations.
- **Output order:** sort or generate in the order the problem asks for.

## Worked example

**Problem:** return every way to choose k numbers from 1 to n, each way in increasing order, all ways in lexicographic order. For n = 4 and k = 2: [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4].

**Explanation in words:** "I build a path of numbers in increasing order. The recursion takes a `start` number and tries every number from `start` to n: add it, recurse with the next number as the new start, then remove it. When the path has k numbers, I store a copy. Because numbers only increase along a path, no combination is repeated, and because I try smaller numbers first, the results come out in lexicographic order. I also prune: if there are not enough numbers left to reach k, I stop the loop. There are C(n, k) answers of length k, so the work is O(k · C(n, k))."

```javascript
function choose(n, k) {
  const result = [];
  const path = [];
  function explore(start) {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    for (let x = start; x <= n - (k - path.length) + 1; x++) {  // prune
      path.push(x);
      explore(x + 1);
      path.pop();
    }
  }
  explore(1);
  return result;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<List<Integer>> choose(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    explore(n, k, 1, new ArrayList<>(), result);
    return result;
  }

  private void explore(int n, int k, int start, List<Integer> path, List<List<Integer>> result) {
    if (path.size() == k) {
      result.add(new ArrayList<>(path));
      return;
    }
    for (int x = start; x <= n - (k - path.size()) + 1; x++) {  // prune
      path.add(x);
      explore(n, k, x + 1, path, result);
      path.remove(path.size() - 1);
    }
  }
}
```
