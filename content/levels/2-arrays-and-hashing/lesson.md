# Arrays & Hashing

## Problem hook

A door scanner logged 100,000 badge IDs. Did anyone badge in twice?

Comparing every ID with every other ID takes about 5 billion comparisons. If instead you keep a list of IDs you have already seen, and that list answers "seen it?" instantly, one pass of 100,000 steps is enough. That instant lookup is what a **hash set** gives you.

## Intuition

A **hash set** stores values; a **hash map** stores values with something attached (a count, an index, a name). Both work like a coat check: the attendant does not search every hook, the ticket number takes them straight to your coat. Adding, finding, and removing take **O(1) time on average**.

The trade is memory for speed: the set or map can grow to hold every item, so it costs **O(n) space**.

Three questions cover most problems in this level:

- **Have I seen this before?** A set of seen values.
- **How many times?** A map from value to count.
- **Where was it?** A map from value to index.

## When to use

Look for these signals:

- "Is there a duplicate", "are these the same letters", "which items are shared".
- "Find two items that add up to a target" in an unsorted list.
- "Count how often" each value appears, or find the most common one.
- A nested loop whose inner loop only *searches* for something: replace the search with a lookup.

## Template code

A single pass with a map, asking about the past before recording the present.

```javascript
function onePassWithMap(items) {
  const seen = new Map(); // value -> what we remember (index, count, ...)
  for (let i = 0; i < items.length; i++) {
    const x = items[i];
    if (seen.has(x)) {
      // use what we remember about x
    }
    seen.set(x, i); // record the current item after the check
  }
}
```

```java
void onePassWithMap(int[] items) {
  Map<Integer, Integer> seen = new HashMap<>(); // value -> what we remember
  for (int i = 0; i < items.length; i++) {
    int x = items[i];
    if (seen.containsKey(x)) {
      // use what we remember about x
    }
    seen.put(x, i); // record the current item after the check
  }
}
```

## Complexity

- **Time: O(n).** Each item is visited once, and each map operation is O(1) on average.
- **Space: O(n).** In the worst case every item is stored.

Compare: sorting first and then scanning neighbours is O(n log n) time but can use O(1) extra space. When memory is tight, that slower option can be the right answer.

## Common mistakes

- **Recording before checking.** In "two items that add up to a target", adding the current item first can pair it with itself.
- **Forgetting the start value.** Counting stretches with running sums needs the map to start with `{0: 1}`.
- **Saying O(1) space.** A set that can hold every item is O(n) space.
- **Mutable or complex keys.** In JavaScript, arrays as keys compare by reference; turn them into strings first.
- **Ties.** "Most common" problems often need a tie rule; read the statement.

## Worked example

**Problem:** given ticket prices and a budget, return the indices of the two tickets that add up to the budget. Example: prices `[12, 5, 9, 20]`, budget `14` gives `[1, 2]`.

**Spoken explanation:**

> I walk through the prices once and keep a map from each price to its index. For the price at index i, the other ticket must cost budget minus that price. I look that amount up in the map first: if it is there, I return the stored index and i. If not, I store the current price with its index and move on. Looking up before storing means a ticket is never paired with itself, and two equal prices such as [3, 3] with budget 6 still work. This is O(n) time because each price is visited once with O(1) lookups, and O(n) space for the map.

**Code:**

```javascript
function twoTickets(prices, budget) {
  const indexOf = new Map();
  for (let i = 0; i < prices.length; i++) {
    const need = budget - prices[i];
    if (indexOf.has(need)) return [indexOf.get(need), i];
    indexOf.set(prices[i], i);
  }
  return [-1, -1];
}
```
