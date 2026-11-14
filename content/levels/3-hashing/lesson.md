# Hashing: HashMap & HashSet

## Learning objectives

- Explain how a hash table finds a value without searching, and why that is O(1) on average.
- Choose between a hash set (have I seen it?) and a hash map (how many, or where?).
- Replace an inner search loop with a lookup and say what it costs in memory.

## Problem hook

A door scanner logged 100,000 badge IDs. Did anyone badge in twice?

Comparing every ID with every other ID takes about 5 billion comparisons. If instead you keep a collection of IDs you have already seen, and that collection answers "seen it?" instantly, one pass of 100,000 steps is enough. That instant lookup is what a **hash set** gives you.

## Intuition

A **hash set** stores values; a **hash map** stores keys with something attached (a count, an index, a name). Both work like a coat check: the attendant does not search every hook, the ticket number takes them straight to your coat.

### How the lookup can be instant

Under the hood is an ordinary array of **buckets**. A **hash function** turns a key into a bucket index. For whole numbers, a simple one is `key % tableLength`: in a table of 10 buckets, 24 goes to bucket 4 and 49 goes to bucket 9. To add, find, or remove a key, the table computes the index and jumps straight there, as in Level 2, where reading `a[i]` was O(1).

Two keys can land in the same bucket (11 and 21 both go to bucket 1). That is a **collision**. Tables handle it in one of two ways:

- **Chaining:** each bucket holds a small list, and colliding keys share it.
- **Open addressing:** a colliding key tries the next bucket (i + 1, i + 2, ...) until it finds a free one.

To keep the lists short, the table watches its **load factor** (items ÷ buckets). When it gets too high, the table grows, usually doubling, and puts every key into the new, larger array. Because growing is rare, adding stays O(1) on average, just like appending to a dynamic array.

So the honest summary is: **O(1) on average, O(n) in the worst case**, when many keys collide in one bucket. With a good hash function the worst case is very unlikely, and interview answers use the average.

The trade is memory for speed: the set or map can grow to hold every item, so it costs **O(n) space**.

### Three questions

Most problems in this level ask one of these:

- **Have I seen this before?** A set of seen values.
- **How many times?** A map from value to count.
- **Where was it?** A map from value to index.

## When to use

Look for these signals:

- "Is there a duplicate", "are these the same letters", "which items are shared".
- "Find two items that add up to a target" in an unsorted list.
- "Count how often" each value appears, or find the most common one.
- "Group the items that belong together": build a key that is equal for items in the same group.
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

Counting is the same loop with `count.set(x, (count.get(x) ?? 0) + 1)` in JavaScript, or `count.merge(x, 1, Integer::sum)` in Java.

## Complexity

- **Time: O(n).** Each item is visited once, and each set or map operation is O(1) on average.
- **Space: O(n).** In the worst case every item is stored.

Compare: sorting first and then scanning neighbours is O(n log n) time but can use O(1) extra space. When memory is tight, that slower option can be the right answer.

## Common mistakes

- **Recording before checking.** In "two items that add up to a target", adding the current item first can pair it with itself.
- **Saying O(1) space.** A set that can hold every item is O(n) space.
- **Saying O(1) in the worst case.** Lookups are O(1) on average; many collisions make them O(n).
- **Complex keys.** In JavaScript, arrays and objects as keys compare by reference, so two equal arrays are different keys. Turn them into strings first.
- **Custom keys in Java.** A class used as a key must override both `equals` and `hashCode`, and equal objects must return the same hash code. Otherwise equal keys land in different buckets.
- **Relying on order.** A plain `HashMap` has no useful order. Use `LinkedHashMap` (Java) or `Map` (JavaScript, which keeps insertion order) when the order matters.

## Edge cases

- An empty input: decide what to return before the loop.
- Every item the same, or every item different.
- Negative numbers and zero as keys.
- A pair made of two equal values, such as [3, 3] with target 6.
- Ties in "most common" problems: read the statement's tie rule.

## Worked example

**Problem:** given ticket prices and a budget, return the indices of the two tickets that add up to the budget. Example: prices `[12, 5, 9, 20]`, budget `14` gives `[1, 2]`.

**Spoken explanation:**

> I walk through the prices once and keep a map from each price to its index. For the price at index i, the other ticket must cost budget minus that price. I look that amount up in the map first: if it is there, I return the stored index and i. If not, I store the current price with its index and move on. Looking up before storing means a ticket is never paired with itself, and two equal prices such as [3, 3] with budget 6 still work. This is O(n) time because each price is visited once with O(1) average lookups, and O(n) space for the map.

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
