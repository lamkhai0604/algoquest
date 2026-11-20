# Bit Manipulation & Basic Math

## Learning objectives

- Read and write small numbers in binary, and explain what AND, OR, XOR, NOT, and the shift operators do to each bit.
- Test, set, clear, and flip a single bit with a mask.
- Use `n & (n - 1)` to drop the lowest 1 bit, and XOR to cancel pairs.
- Enumerate all subsets of a small set with bitmasks.
- Use the greatest common divisor, the sieve of Eratosthenes, and remainders to keep math fast and exact.

## Problem hook

A hotel has 30 rooms, and the front desk wants to know which rooms are cleaned. One option is a list of 30 true/false values. Another is a **single number**: room i is clean when bit i of the number is 1.

With one number, "is room 7 clean?" is one operation, "mark room 7 clean" is one operation, and "are all rooms clean?" is a single comparison. The computer already stores every number as bits; bit manipulation just uses them directly.

## Intuition

**Binary.** A number is a sum of powers of two. 13 = 8 + 4 + 1, written **1101**. Bit 0 is the rightmost (worth 1), bit 1 is worth 2, bit 2 is worth 4, and so on.

**The operators work bit by bit:**

| Operator | Rule for each bit | Example (bits) |
| --- | --- | --- |
| `a & b` (AND) | 1 only if both are 1 | 1100 & 1010 = 1000 |
| `a \| b` (OR) | 1 if either is 1 | 1100 \| 1010 = 1110 |
| `a ^ b` (XOR) | 1 if they differ | 1100 ^ 1010 = 0110 |
| `~a` (NOT) | flips every bit | ~0000…0101 = 1111…1010 |
| `a << k` | shifts left: multiplies by 2^k | 0011 << 2 = 1100 |
| `a >> k` | shifts right: divides by 2^k, rounding down | 1100 >> 2 = 0011 |

**Masks.** `1 << i` is a number with only bit i set. With it:

- **test** bit i: `(n >> i) & 1`, or `(n & (1 << i)) !== 0`
- **set** bit i: `n | (1 << i)`
- **clear** bit i: `n & ~(1 << i)`
- **flip** bit i: `n ^ (1 << i)`

**Two tricks worth knowing by heart.**

- `n & (n - 1)` **removes the lowest 1 bit.** Subtracting 1 turns the lowest 1 into 0 and the 0s below it into 1s; AND with n clears them all. A power of two has one 1 bit, so `n > 0 && (n & (n - 1)) === 0` tests for powers of two.
- **XOR cancels pairs:** `x ^ x = 0`, `x ^ 0 = x`, and the order does not matter. XOR a list where every value appears twice except one, and only that one is left.

**Subsets as numbers.** A set of n items has 2^n subsets. Each n-bit number from 0 to 2^n − 1 picks one: bit i says whether item i is in.

**Basic math that keeps code exact and fast.**

- **Greatest common divisor:** `gcd(a, b) = gcd(b, a % b)`, with `gcd(a, 0) = a`. O(log min(a, b)) steps (Euclid).
- **Sieve of Eratosthenes:** to find all primes below n, cross out the multiples of each prime p starting at p · p. O(n log log n).
- **Remainders:** when results get huge, problems ask for the answer mod 1,000,000,007. Take the remainder after every addition and multiplication; `(a · b) mod m = ((a mod m) · (b mod m)) mod m`.

**JavaScript note.** Bit operators in JavaScript work on **32-bit signed integers**: `1 << 31` is negative, and `>>` keeps the sign. Use `>>>` for an unsigned right shift, and keep values below 2^31 or use `BigInt`. Java's `int` behaves the same way; use `long` for 64 bits.

## When to use

Look for these signals in a problem statement:

- "Every element appears twice (or three times) except one": XOR, or counting bits.
- "Power of two", "number of 1 bits", "how many bits differ": `n & (n - 1)` and XOR.
- A small set (up to about 20 items) where you need every subset or a compact "visited" set: a bitmask.
- Yes/no flags packed into one number: masks.
- "Count primes", "divisible by", "common divisor", "answer modulo 10^9 + 7": the sieve, gcd, and remainders.
- "Without using + or *": bit operations by design.

## Template code

**Count 1 bits, and test a power of two.**

```javascript
function countOnes(n) {
  let count = 0;
  while (n !== 0) {
    n &= n - 1;         // drop the lowest 1 bit
    count++;
  }
  return count;
}

function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}
```

```java
class Solution {
  public int countOnes(int n) {
    int count = 0;
    while (n != 0) {
      n &= n - 1;       // drop the lowest 1 bit
      count++;
    }
    return count;       // Integer.bitCount(n) does the same
  }

  public boolean isPowerOfTwo(int n) {
    return n > 0 && (n & (n - 1)) == 0;
  }
}
```

**Every subset with a bitmask.**

```javascript
function subsets(items) {
  const result = [];
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const subset = [];
    for (let i = 0; i < items.length; i++) {
      if ((mask >> i) & 1) subset.push(items[i]);   // bit i chosen?
    }
    result.push(subset);
  }
  return result;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public List<List<Integer>> subsets(int[] items) {
    List<List<Integer>> result = new ArrayList<>();
    for (int mask = 0; mask < 1 << items.length; mask++) {
      List<Integer> subset = new ArrayList<>();
      for (int i = 0; i < items.length; i++) {
        if (((mask >> i) & 1) == 1) subset.add(items[i]); // bit i chosen?
      }
      result.add(subset);
    }
    return result;
  }
}
```

**Greatest common divisor and the sieve.**

```javascript
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function primesBelow(n) {
  const composite = new Uint8Array(Math.max(n, 0));
  const primes = [];
  for (let p = 2; p < n; p++) {
    if (composite[p]) continue;
    primes.push(p);
    for (let m = p * p; m < n; m += p) composite[m] = 1;   // cross out multiples
  }
  return primes;
}
```

```java
import java.util.ArrayList;
import java.util.List;

class Solution {
  public int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
  }

  public List<Integer> primesBelow(int n) {
    boolean[] composite = new boolean[Math.max(n, 0)];
    List<Integer> primes = new ArrayList<>();
    for (int p = 2; p < n; p++) {
      if (composite[p]) continue;
      primes.add(p);
      for (long m = (long) p * p; m < n; m += p) composite[(int) m] = true; // cross out multiples
    }
    return primes;
  }
}
```

## Complexity

| Task | Method | Time | Space |
| --- | --- | --- | --- |
| Test, set, clear, flip one bit | Mask | O(1) | O(1) |
| Count 1 bits | `n & (n - 1)` loop | O(number of 1 bits) ≤ 31 | O(1) |
| Find the value that appears once | XOR all | O(n) | O(1) |
| All subsets of n items | Masks 0 … 2^n − 1 | O(n · 2^n) | O(n · 2^n) output |
| Greatest common divisor | Euclid | O(log min(a, b)) | O(1) |
| All primes below n | Sieve | O(n log log n) | O(n) |
| One number prime or not | Trial division to √n | O(√n) | O(1) |

- Bit tricks often turn O(n) memory (a hash set) into O(1) memory.
- 2^n grows fast: masks are practical for up to about 20 items.

## Common mistakes

- **Operator precedence.** In JavaScript and Java, `==` binds tighter than `&`, so `n & 1 == 0` means `n & (1 == 0)`. Write `(n & 1) === 0`.
- **The sign bit.** `1 << 31` is negative in 32-bit arithmetic, and `>>` copies the sign. Use `>>>` for unsigned shifts, or `long` in Java.
- **Shifting by 32 or more.** Shift counts are taken mod 32 in JavaScript and Java for `int`: `1 << 32` is 1, not 0.
- **Overflow in math.** `a * b` can pass 2^31 − 1 (Java `int`) or 2^53 (exact JavaScript numbers). Take remainders after each step and use `long` or `BigInt`.
- **Forgetting 0 and 1.** 0 is not a power of two, and 0 and 1 are not prime.
- **Starting the sieve's inner loop at 2p.** It still works, but starting at p · p avoids repeating work.

## Edge cases

- **n = 0:** no 1 bits, not a power of two, the empty set's only subset.
- **The largest values:** 2^31 − 1 has 31 one bits; 2^30 is the largest power of two in a 32-bit signed integer.
- **Negative numbers:** check whether the problem allows them before using shifts.
- **Empty lists** for XOR problems (the XOR of nothing is 0).
- **n ≤ 2** for prime counting.

## Worked example

**Problem:** return the number of positions where the binary forms of `a` and `b` differ.

**Explanation in words:** "XOR puts a 1 exactly where two bits differ, so a ^ b marks every differing position. Then I count the 1 bits of that number by repeatedly removing the lowest one with x & (x − 1). There are at most 31 bits, so this is O(1) time and space."

```javascript
function bitsDiffer(a, b) {
  let x = a ^ b;        // 1 wherever a and b differ
  let count = 0;
  while (x !== 0) {
    x &= x - 1;
    count++;
  }
  return count;
}
```

```java
class Solution {
  public int bitsDiffer(int a, int b) {
    int x = a ^ b;      // 1 wherever a and b differ
    int count = 0;
    while (x != 0) {
      x &= x - 1;
      count++;
    }
    return count;
  }
}
```
