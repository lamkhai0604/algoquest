# Arrays & Strings

## Learning objectives

- Say what each basic array operation costs: reading by index, appending, inserting, and deleting.
- Change an array in place with a write index instead of deleting items one by one.
- Build strings with an array or a string builder instead of repeated `+`.
- Move between positions with index arithmetic, including wrap-around with `%` and rows and columns in a grid.

## Problem hook

A music app keeps a playlist of 100,000 songs in an array. A user adds a new song at the **front**.

The array stores songs in a row of numbered slots, so every one of the 100,000 songs has to move one slot to the right to make room. Adding a song at the **end** moves nothing. Same playlist, same song: one operation takes 100,000 steps and the other takes one. Knowing which array operations are cheap is the first step to writing fast code.

## Intuition

Think of an array as a row of numbered lockers that sit side by side in memory.

- **Reading or writing `a[i]` is O(1).** The computer computes where locker i is and goes straight there, however long the row is.
- **Appending at the end is O(1) on average.** A dynamic array (JavaScript arrays, Java's `ArrayList`) keeps some empty lockers at the end. When they run out, it moves everything into a row about twice as long. That copy is expensive, but it happens so rarely that the average cost per append stays O(1).
- **Inserting or deleting in the middle is O(n).** Every item after the gap has to shift by one.
- **Searching an unsorted array is O(n).** Without an index, you look at items one by one.

A **string** is an array of characters with one extra rule: in Java and JavaScript it cannot be changed. `s + "x"` makes a brand-new string and copies every character. Doing that inside a loop copies more and more each time, which adds up to O(n²). The fix is to collect pieces in an array (JavaScript) or a `StringBuilder` (Java) and join them once at the end.

Characters are also numbers: `'a'` is 97 and `'z'` is 122. Subtracting 97 turns a letter into a position from 0 to 25, which is handy for shifting letters or counting them.

A **grid** (2D array) is an array of rows: `grid[row][col]`. Moving right means `col + 1`; moving down means `row + 1`.

## When to use

Look for these signals in a problem statement:

- "In place" or "without using extra space": overwrite the array with a write index.
- "Rotate", "wrap around", or "circular": index arithmetic with `% n`.
- "Build", "compress", "reverse", or "format" a string: collect pieces and join once.
- A grid, board, image, or matrix: loop over rows and columns and work out where each cell moves.
- Many deletions or insertions in the middle: avoid shifting the array again and again.

## Template code

**Write index (in place).** Keep the items you want at the front of the array in one pass.

```javascript
function keepInPlace(items, keep) {
  let w = 0;                          // where the next kept item goes
  for (let i = 0; i < items.length; i++) {
    if (keep(items[i])) items[w++] = items[i];
  }
  return w;                           // items[0..w-1] are the kept items
}
```

```java
int keepInPlace(int[] items, int removeValue) {
  int w = 0;                          // where the next kept item goes
  for (int i = 0; i < items.length; i++) {
    if (items[i] != removeValue) items[w++] = items[i];
  }
  return w;                           // items[0..w-1] are the kept items
}
```

**Building a string.** Collect pieces, then join once.

```javascript
function buildString(chars) {
  const parts = [];
  for (const ch of chars) parts.push(ch); // add pieces in O(1) each
  return parts.join("");                    // one copy at the end
}
```

```java
String buildString(char[] chars) {
  StringBuilder out = new StringBuilder();
  for (char ch : chars) out.append(ch);     // add pieces in O(1) each
  return out.toString();                    // one copy at the end
}
```

**Wrap-around.** In an array of length n, the position k steps after i is `(i + k) % n`.

## Complexity

- **Read or write by index:** O(1).
- **Append at the end:** O(1) on average.
- **Insert or delete at index i:** O(n), because the items after i shift.
- **Search an unsorted array:** O(n).
- **Building a string with `+` in a loop:** O(n²) in total. **With an array join or `StringBuilder`:** O(n).
- **Visiting every cell of an r × c grid:** O(r × c).

The in-place write index uses O(1) extra space. Building a new array or string of the answer uses O(n) space for the result.

## Common mistakes

- **Off-by-one indexes.** The last index is `length - 1`. Loops that compare `a[i]` with `a[i + 1]` must stop one item early.
- **Deleting while looping forward.** Removing an item shifts the rest left, so the loop skips the next item. Use a write index or build a new array.
- **`+` on strings in a loop.** It looks like O(n) but can be O(n²).
- **Forgetting `% n`.** When k can be larger than the length, reduce it first. And check for an empty array before computing `% n`.
- **Mixing up rows and columns.** `grid[row][col]`: the first index picks the row.

## Edge cases

- An empty array or an empty string.
- A single item or a single character.
- A rotation or shift amount of 0, exactly n, or much larger than n.
- All items equal, or none equal to the value you remove.
- A 1 × 1 grid, a single row, or a single column.

## Worked example

**Problem:** compress a message by writing each run of the same character as the character and the run length. Example: `"aaabcc"` gives `"a3b1c2"`.

**Spoken explanation:**

> I walk through the message once. I start a run at index i and move a second index j forward while the character stays the same. When j reaches a different character or the end, the run has length j - i, so I add the character and that number to a list of pieces. Then the next run starts at j. At the end I join the pieces once, instead of adding to a string with +, which could copy the string again and again. Every character is visited once, so this is O(n) time, and the result takes O(n) space. Edge cases: an empty message gives an empty string, runs of 10 or more need every digit, and the last run must be written too.

**Code:**

```javascript
function compress(message) {
  const out = [];
  let i = 0;
  while (i < message.length) {
    let j = i;
    while (j < message.length && message[j] === message[i]) j++;
    out.push(message[i], String(j - i));
    i = j;
  }
  return out.join("");
}
```
