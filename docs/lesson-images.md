# Lesson images

Decorative images for the core lessons (D-072, T-603). All seven are in place since 2026-11-22. Each image sits at the top of a lesson's Problem hook section as an `image` figure. The drawings that explain the algorithm are `stack`, `queue` and `visual` figures; the images only set the scene.

## Format

| Rule | Value |
| --- | --- |
| Size | 1600 px wide, landscape; the first set is about 4:1 (1600 × 397) |
| File | `.webp`, at most 150 KB, saved as `frontend/public/lesson-images/<file>` |
| Style | Flat vector illustration, soft shading, deep purple background (#1b1424) with lilac (#e7a6f0), mint (#7fe0c2) and warm yellow (#f5c451) accents; friendly and simple |
| Content | No text, letters, numbers, logos or real brands in the picture; no real people's faces |
| Review | The PO checks each image before it is added; the alt text below is used as written |

Every prompt below starts with this style line: *Flat vector illustration, wide landscape banner, deep purple background (#1b1424), lilac, mint and warm yellow accents, soft shading, simple friendly shapes, no text, no letters, no numbers, no logos.*

## Images

| File | Lesson | Prompt (after the style line) | Alt text |
| --- | --- | --- | --- |
| `arrays-lockers.webp` | Level 2 Arrays & Strings | A long row of identical school lockers side by side, one locker door open with a small glowing item inside, a hand reaching straight to it | A row of lockers with one open door |
| `hashing-coat-check.webp` | Level 3 Hashing | A coat check counter with a wall of hooks, each hook marked by a plain coloured tag, an attendant handing back one coat instantly from its hook | A coat check counter with coats on hooks |
| `linked-list-treasure-hunt.webp` | Level 5 Linked Lists | A treasure hunt path across a park: paper clues pinned to trees, dotted arrows leading from one clue to the next, ending at a small chest | Clues on trees joined by dotted arrows to a chest |
| `stack-queue-plates-line.webp` | Level 6 Stack, Queue & Deque | On the left a tall pile of plates with a hand taking the top plate; on the right a short line of people waiting at a counter, the first person being served | A pile of plates beside a line at a counter |
| `trees-family.webp` | Level 8 Trees & BST | A stylised tree whose branches split into two at every fork, round fruit at each fork, a small signpost at the trunk pointing left and right | A tree that splits into two branches at each fork |
| `heap-hospital.webp` | Level 9 Heap / Priority Queue | An emergency waiting room where the most urgent patient, marked by a bright badge, is called in first while others wait | A waiting room where the most urgent person is called first |
| `graph-metro.webp` | Level 10 Graph Fundamentals | A simple metro map: coloured lines connecting round stations, ripples spreading outward from one station | A metro map with ripples spreading from one station |

## Adding an image

1. Save the file under `frontend/public/lesson-images/` with the name above.
2. Add an `image` figure at the top of the lesson's Problem hook section:

   ````text
   ```figure
   {"kind": "image", "src": "/lesson-images/stack-queue-plates-line.webp", "alt": "A pile of plates beside a line at a counter"}
   ```
   ````

3. Run the content checks; the frontend test fails if the file is missing.
