# Sprint 10 — Level 9 Heap & Priority Queue and Level 11 Bit Manipulation & Basic Math

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-10-report.md)). Approved by the PO on 2026-11-20 |
| Goal | Levels 9 and 11 are playable in the five-step lesson format at the standard of Levels 4–8, with pattern challenges. Both reuse existing visualizers |
| Duration | About 1 week from approval |
| Tasks | T-533, T-534, T-535, T-536, T-537 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-049, D-052, D-056, D-057 |

## Increment at the end of the sprint

- **Level 9 Heap & Priority Queue:** lesson (the heap shape and order rule, the array layout, push with sift-up and pop with sift-down in O(log n), a heap in JavaScript and `PriorityQueue` in Java, top-k and k-way merge), a walkthrough of a push on the tree view (D-059), an intuition question, a quick check, 6 practice problems, and 3 test problems.
- **Level 11 Bit Manipulation & Basic Math:** lesson (binary, AND, OR, XOR, shifts, masks, `n & (n - 1)`, greatest common divisor, the sieve of Eratosthenes, remainders), a walkthrough of counting set bits on the cell view, an intuition question, a quick check, 6 practice problems, and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

Level 10 Graph Fundamentals follows in Sprint 11 with a graph visualizer. Players reach Level 11 after passing Level 10's test, so Level 11 is open to players once Level 10 ships; the Owner can review it now (D-055).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-533 Level 9 content | Lesson, walkthrough, intuition question, quick check, 9 problems with original stories, Hard placeholders | Same content shape as Levels 4–8; every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes | Content check; reference runs; walkthrough replay test; screenshots |
| 2 | T-534 Level 9 pattern challenges | Three challenges | Content check; one best approach each | Content check; PO review |
| 3 | T-535 Level 11 content | As T-533 | As T-533 | As T-533 |
| 4 | T-536 Level 11 pattern challenges | Three challenges | As T-534 | As T-534 |
| 5 | T-537 Sprint 10 report | `docs/reports/sprint-10-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Level 10 (Sprint 11), Vietnamese text (localization track), Hard problems (T-501), the live Java check (D-054).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews with the checklist |
| JavaScript has no built-in heap | The lesson gives a short, tested heap class to copy; each heap problem accepts any correct approach |
| Bit operations in JavaScript work on 32-bit signed integers | Problem limits stay within 0 to 2^31 − 1; the lesson explains `>>>` |

## Work for the PO

- Review Levels 9 and 11 with the review checklist.
