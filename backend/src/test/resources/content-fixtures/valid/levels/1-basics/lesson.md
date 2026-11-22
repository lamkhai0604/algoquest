# Basics

## Learning objectives

- Find the largest value in one pass.

## Problem hook

Find the largest number.

## Intuition

Keep the best so far.

## When to use

```figure
{"kind": "stack", "caption": "Last in, first out.", "frames": [{"op": "push(A)", "items": ["A"]}, {"op": "pop() -> A", "items": [], "out": "A"}]}
```

```figure
{"kind": "queue", "frames": [{"op": "enqueue(A)", "items": ["A"]}, {"op": "enqueue(B)", "items": ["A", "B"]}]}
```

```figure
{"kind": "visual", "frames": [{"op": "before", "visual": {"cells": ["A", "B"], "next": [1, -1]}}, {"op": "after", "visual": {"cells": ["A", "B"], "next": [-1, 0]}}]}
```

```figure
{"kind": "image", "src": "/lesson-images/plates.webp", "alt": "A pile of plates"}
```

You need one answer from every item.

## Template code

```js
let best = -Infinity;
```

## Complexity

O(n) time, O(1) space.

## Common mistakes

Forgetting the empty array.

## Edge cases

An empty array has no largest value.

## Worked example

Max of [3, 9, 4] is 9.
