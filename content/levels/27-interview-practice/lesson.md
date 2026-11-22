# Interview Practice

## Learning objectives

- Follow a repeatable routine in a coding interview: clarify, examples, brute force, improve, code, test, explain.
- Turn the limits in a question into a target running time before choosing an approach.
- Talk through trade-offs between approaches in time, space and simplicity.
- Find edge cases on purpose and test code by hand before saying it is done.
- Manage a 45-minute interview and recover when stuck.

## Problem hook

Two candidates get the same question. The first starts typing after ten seconds, solves a slightly different problem, and finds out at minute 35. The second spends two minutes asking what happens with duplicates, works one example by hand, says the slow idea, improves it, and codes the faster version with time to test it.

Both know the same algorithms. The difference is a routine. Interviewers grade how you get to the answer as much as the answer itself: whether you clarify, whether you explain your thinking, whether you test. This level puts all the patterns from earlier levels into that routine.

## Intuition

**The routine (about 45 minutes).**

1. **Listen and restate (1–2 min).** Repeat the task in your own words.
2. **Clarify (2–3 min).** Input size, value range, duplicates, empty input, what to return, whether the input may be changed.
3. **Examples (2–3 min).** Work one normal example by hand, then one edge case.
4. **Brute force (2 min).** Say the simplest correct idea and its cost. It proves you understand the problem.
5. **Improve (5–10 min).** Use the limits: n = 10⁵ means O(n log n) or better. Look for the signal (sorted, contiguous, fewest steps, count the ways…) and name the pattern.
6. **Code (15 min).** Clear names, small helper functions, talk while you write.
7. **Test (5 min).** Trace a small example line by line; then edge cases.
8. **Explain (2 min).** Time and space, and one alternative with its trade-off.

**Trade-offs worth saying.** A hash map buys time with memory. Sorting first costs O(n log n) but can remove the need for extra space. A simple O(n log n) solution is often better in an interview than a fragile O(n) one.

**When stuck.** Say what you know and what blocks you. Try a smaller example, solve a simpler version (sorted input, no duplicates), or go through the pattern list. Interviewers often give a hint when they hear your reasoning.

## When to use

Use the routine in every practice problem from now on:

- Before coding: restate, clarify, one example, brute force with its cost.
- While choosing: limits → target time → pattern.
- After coding: trace, edge cases, complexity, one alternative.
- In this level the statements do not name a pattern, as in a real interview.

## Template code

**An interview skeleton: a clear main function, small helpers, and quick checks.**

```javascript
// Problem: positions of two numbers that add up to target (exactly one answer).
// Clarified: n up to 10^5, values may repeat, return [i, j] with i < j.
// Brute force: all pairs, O(n^2). Better: one pass with a hash map, O(n).

function twoSum(nums, target) {
  const seen = new Map();                 // value -> position
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);                 // store after checking: no self-pairing
  }
  return [];                              // not reached when an answer exists
}

// Quick checks, said out loud in the interview:
console.assert(JSON.stringify(twoSum([7, 2, 11, 15, 4], 6)) === "[1,4]");
console.assert(JSON.stringify(twoSum([3, 3], 6)) === "[0,1]");      // duplicates
console.assert(JSON.stringify(twoSum([1, -4, 9], 5)) === "[1,2]");  // negatives
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  // Clarified: n up to 10^5, values may repeat, exactly one answer, return {i, j} with i < j.
  // Brute force: all pairs, O(n^2). Better: one pass with a hash map, O(n).
  public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();   // value -> position
    for (int i = 0; i < nums.length; i++) {
      Integer partner = seen.get(target - nums[i]);
      if (partner != null) return new int[] {partner, i};
      seen.put(nums[i], i);                         // store after checking
    }
    return new int[0];                              // not reached when an answer exists
  }
}
```

## Complexity

| Routine step | What to state |
| --- | --- |
| Brute force | Its time, to show why it is not enough for the limits |
| Improved idea | Time and space, and the pattern it uses |
| Alternative | One other approach and what it trades |
| Limits check | n × (work per item) against about 10⁸ simple steps per second |

| Input size n | Usually acceptable |
| --- | --- |
| ≤ 20 | O(2ⁿ), O(n!) |
| ≤ 10³ | O(n²) |
| ≤ 10⁵–10⁶ | O(n log n), O(n) |
| larger or a value | O(log n), O(1) |

## Common mistakes

- **Coding before clarifying,** then solving a different problem.
- **Silence:** the interviewer cannot help or give credit for thinking they cannot hear.
- **Skipping the brute force,** so the improvement has no baseline.
- **Not testing,** or testing only the example from the statement.
- **Forgetting to state complexity** and one trade-off at the end.
- **Over-engineering:** a clever but fragile solution that does not finish in time.

## Edge cases

Ask about or test these in almost every problem:

- **Empty input, one element, two elements.**
- **All values equal; duplicates.**
- **Negative numbers and zero.**
- **Very large values** that overflow 32-bit integers.
- **Already sorted, reverse sorted.**
- **No valid answer:** what should be returned?

## Worked example

**Problem:** a server keeps an LRU cache of at most `capacity` entries. Operations are "put key value" and "get key". A get returns the value or −1 and counts as a use; a put stores or updates a key and counts as a use; when the cache is over capacity, the least recently used key is removed. Return the results of the gets.

**Explanation in words:** "First I clarify: does updating a key count as a use? Yes. Then the brute force: keep a list of keys in order of use and search it each time, O(capacity) per operation. To make each operation O(1), I need two things at once: find a key quickly, and find the least recently used key quickly. A hash map does the first; keeping keys in order of use does the second. JavaScript's Map and Java's LinkedHashMap keep an order, so a use is: remove the key and put it back at the newest end, and eviction removes the oldest key. Each operation is O(1) on average and the space is O(capacity). Then I test capacity 1, updating an existing key, and a get of a missing key."

```javascript
function recentCache(capacity, ops) {
  const cache = new Map();                    // keeps keys in order of last use
  const out = [];
  for (const line of ops) {
    const [op, keyText, valueText] = line.split(" ");
    const key = Number(keyText);
    if (op === "get") {
      if (!cache.has(key)) { out.push(-1); continue; }
      const value = cache.get(key);
      cache.delete(key);                      // move to the newest end
      cache.set(key, value);
      out.push(value);
    } else {
      cache.delete(key);
      cache.set(key, Number(valueText));
      if (cache.size > capacity) {
        cache.delete(cache.keys().next().value);   // the oldest key
      }
    }
  }
  return out;
}
```

```java
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;

class Solution {
  public int[] recentCache(int capacity, String[] ops) {
    // accessOrder = true: every get or put moves the key to the newest end
    LinkedHashMap<Integer, Integer> cache = new LinkedHashMap<>(16, 0.75f, true);
    List<Integer> out = new ArrayList<>();
    for (String line : ops) {
      String[] parts = line.split(" ");
      int key = Integer.parseInt(parts[1]);
      if (parts[0].equals("get")) {
        Integer value = cache.get(key);
        out.add(value == null ? -1 : value);
      } else {
        cache.put(key, Integer.parseInt(parts[2]));
        if (cache.size() > capacity) {
          cache.remove(cache.keySet().iterator().next());   // the oldest key
        }
      }
    }
    return out.stream().mapToInt(Integer::intValue).toArray();
  }
}
```

**Trace:** capacity 2: put 1, put 2, get 1 → 1 (now 2 is the oldest), put 3 evicts 2, get 2 → −1, get 3 → 3. The answer is [1, −1, 3].
