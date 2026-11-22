# Tries

## Learning objectives

- Describe a trie as a tree in which each edge adds one letter and each node stands for a prefix.
- Insert words, search for whole words and prefixes, and count the words that start with a prefix.
- Mark the end of a word separately from the nodes it passes through.
- Combine a trie with DFS to search many words at once, for example on a letter board or with wildcards.
- Decide when a hash set or a sorted list is enough instead of a trie.

## Problem hook

A phone keyboard suggests words while you type. After "pre" it shows "prefix", "present", "pretty". With 200,000 stored words, checking each one with `startsWith` after every key press would be slow, and a hash set cannot help at all: it only answers "is this exact word stored?".

Words with the same beginning share their first letters. If the words are stored as a tree of letters, with "pre" as one path that every such word follows, then finding all words that start with "pre" takes three steps down the tree, however many words there are. That tree is a **trie** (from re*trie*val).

## Intuition

**Shape.** The root is the empty prefix. Each node has up to one child per letter. Following the edges from the root spells a prefix. A word is stored by walking (and creating) the path for its letters and marking the last node as an **end of word**.

**Why the end mark matters.** After inserting "car" and "cart", the r node is both a complete word and the middle of another. Without a flag, "car" could not be told apart from a mere prefix.

**Extra data on nodes.** Keep whatever the questions need:

- a **count** of the words passing through the node answers "how many words start with this prefix?";
- the **word** itself at its end node makes it easy to report results from a search;
- the **top k** words below a node gives instant autocomplete.

**Tries with search.** When the input has many words to look for, put them all in one trie and walk the input once, following trie children. A DFS on a letter board only continues while the next letter is a child, so dead ends are cut early. A dot wildcard means "try every child".

**Binary tries.** Numbers can be stored bit by bit, from the highest bit. To make XOR as large as possible, prefer the opposite bit at every level.

**When not to use a trie.** For exact lookups only, a hash set is simpler and as fast. For prefix ranges on static data, a sorted array with binary search is often enough and uses less memory.

## When to use

Look for these signals in a problem statement:

- "Starts with", "prefix", "autocomplete", "suggestions as you type".
- Many words to find at once in a text or on a board.
- Wildcards such as "." that match any letter.
- Longest common prefix, or words built one letter at a time.
- Maximum XOR of pairs, or longest matching bit prefix.

## Template code

**A trie with insert, search, prefix count.**

```javascript
class Trie {
  constructor() { this.root = { children: {}, count: 0, end: false }; }

  insert(word) {
    let node = this.root;
    node.count++;
    for (const ch of word) {
      node.children[ch] ??= { children: {}, count: 0, end: false };
      node = node.children[ch];
      node.count++;                 // one more word passes through
    }
    node.end = true;                // the word ends here
  }

  walk(prefix) {
    let node = this.root;
    for (const ch of prefix) {
      node = node.children[ch];
      if (!node) return null;       // the path breaks
    }
    return node;
  }

  search(word) { const node = this.walk(word); return node !== null && node.end; }
  countPrefix(prefix) { const node = this.walk(prefix); return node ? node.count : 0; }
}
```

```java
class Solution {
  private static class Node {
    Node[] children = new Node[26];
    int count;
    boolean end;
  }

  private final Node root = new Node();

  public void insert(String word) {
    Node node = root;
    node.count++;
    for (char ch : word.toCharArray()) {
      int c = ch - 'a';
      if (node.children[c] == null) node.children[c] = new Node();
      node = node.children[c];
      node.count++;                 // one more word passes through
    }
    node.end = true;                // the word ends here
  }

  private Node walk(String prefix) {
    Node node = root;
    for (char ch : prefix.toCharArray()) {
      node = node.children[ch - 'a'];
      if (node == null) return null;   // the path breaks
    }
    return node;
  }

  public boolean search(String word) { Node node = walk(word); return node != null && node.end; }

  public int countPrefix(String prefix) { Node node = walk(prefix); return node == null ? 0 : node.count; }
}
```

## Complexity

| Operation | Time | Space |
| --- | --- | --- |
| Insert a word of length L | O(L) | up to O(L) new nodes |
| Search a word or a prefix | O(L) | O(1) |
| Count words with a prefix (stored counts) | O(L) | O(1) |
| Build from n words | O(total letters) | O(total letters × alphabet) for arrays, less with maps |
| Wildcard search with d dots | O(alphabet^d · L) | O(L) recursion |

- Time does not depend on how many words are stored, only on the length of the word asked about.
- Memory is the main cost: an array of 26 children per node is fast but large; a map per node is smaller.

## Common mistakes

- **Forgetting the end-of-word mark,** so prefixes are reported as words.
- **Counting at the wrong time:** add to a node's count when a word passes through it, not only at the end.
- **Creating nodes during a search,** which changes the trie and its counts.
- **Reporting the same word twice** in a board search; clear the word from its node once found.
- **Using a trie when a hash set would do,** paying memory for nothing.

## Edge cases

- **The empty prefix:** every word matches.
- **A word that is a prefix of another** (car, cart).
- **Repeated words:** counts go up twice; decide if that is wanted.
- **Letters outside a–z:** use a map instead of a fixed array.
- **Very long words:** recursion depth for DFS; consider an explicit stack.

## Worked example

**Problem:** given saved searches (repeats allowed) and a list of prefixes, return how many saved searches start with each prefix. For ["apple", "app", "apply", "bat"] and prefixes ["app", "ba", "c"] the answer is [3, 1, 0].

**Explanation in words:** "Comparing every prefix with every saved search would be O(n · q · L). Instead I build a trie of the saved searches where each node counts how many searches pass through it. Inserting costs the length of each search. For a prefix I walk down its letters; if a letter is missing the answer is 0, otherwise the count stored at the last node is the answer, because exactly those searches passed through it. The total time is the number of letters in the searches plus the number of letters in the prefixes, and the space is the size of the trie."

```javascript
function prefixCount(searches, prefixes) {
  const root = { next: {}, count: 0 };
  for (const s of searches) {
    let node = root;
    for (const ch of s) {
      node = node.next[ch] ??= { next: {}, count: 0 };
      node.count++;                      // this search passes through
    }
  }
  return prefixes.map((p) => {
    let node = root;
    for (const ch of p) {
      node = node.next[ch];
      if (!node) return 0;               // no search has this prefix
    }
    return node.count;
  });
}
```

```java
import java.util.HashMap;
import java.util.Map;

class Solution {
  private static class Node {
    Map<Character, Node> next = new HashMap<>();
    int count;
  }

  public int[] prefixCount(String[] searches, String[] prefixes) {
    Node root = new Node();
    for (String s : searches) {
      Node node = root;
      for (char ch : s.toCharArray()) {
        node = node.next.computeIfAbsent(ch, k -> new Node());
        node.count++;                    // this search passes through
      }
    }
    int[] out = new int[prefixes.length];
    for (int i = 0; i < prefixes.length; i++) {
      Node node = root;
      for (char ch : prefixes[i].toCharArray()) {
        node = node.next.get(ch);
        if (node == null) break;         // no search has this prefix
      }
      out[i] = node == null ? 0 : node.count;
    }
    return out;
  }
}
```

**Trace:** inserting the four searches makes the a, ap and app nodes count 3, and the b and ba nodes count 1. "app" ends at a node with count 3, "ba" at a node with count 1, and "c" has no child at the root, so the answer is [3, 1, 0].
