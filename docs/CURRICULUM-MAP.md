# Curriculum Map: 17 Levels to 27

How the original 17-level list (D-012, SRS §6 before 2026-11-13) maps to the 27-level curriculum in three phases (D-048). The point is that no old topic is lost, each concept has one primary level, and learner progress stays attached to the right content.

| Field | Value |
| --- | --- |
| Source of truth | `content/levels.json` (titles, order, phase) |
| Decisions | D-012, D-048, D-056 |
| Updated | 2026-11-17 |

## Old to new

| Old level | New level(s) | Progress and content |
| --- | --- | --- |
| 1 Big-O & Basics | 1 Big-O & Algorithm Basics | Progress kept; lesson extended |
| 2 Arrays & Hashing | 2 Arrays & Strings (new content), 3 Hashing: HashMap & HashSet | Hashing problems moved to Level 3 and renamed `L2-*` → `L3-*`; V13 cleared level 2–3 progress (only the PO had any) |
| 3 Two Pointers | 12 Two Pointers | Content moved from `content/parked/` into Level 12 in Sprint 13 |
| 4 Sliding Window | 13 Sliding Window | No content yet |
| 5 Stack | 6 Stack, Queue & Deque; 17 Monotonic Stack | Split: the data structure first, the pattern in Phase 2 |
| 6 Binary Search | 15 Binary Search | No content yet |
| 7 Linked List | 5 Linked Lists; 16 Fast & Slow Pointers | Split as above |
| 8 Trees | 8 Trees & Binary Search Trees | No content yet |
| 9 Tries | 26 Tries | Moved later as an advanced structure |
| 10 Heap / Priority Queue | 9 Heap & Priority Queue | No content yet |
| 11 Backtracking | 19 Backtracking | Needs Level 7 Recursion first |
| 12 Graphs | 10 Graph Fundamentals; 18 DFS & BFS Patterns | Split as above |
| 13 Advanced Graphs | 24 Graph & Grid Problem Solving; 25 Shortest Path & Topological Sort | |
| 14 Greedy & Intervals | 20 Greedy & Intervals | |
| 15 1D Dynamic Programming, 16 2D Dynamic Programming | 21 Dynamic Programming Fundamentals; 23 1D & 2D Dynamic Programming | Fundamentals in Phase 2, harder problems in Phase 3 |
| 17 Bit Manipulation & Math | 11 Bit Manipulation & Basic Math | |

New levels with no old counterpart: 4 Sorting Fundamentals, 7 Recursion & Divide and Conquer, 14 Prefix Sum & Range Queries, 22 Mixed Pattern Problems, 27 Interview Practice. They fill gaps in prior knowledge (sorting and recursion before the patterns that use them) and add practice where the learner is not told the pattern.

## One primary home per concept

| Concept | Primary level | Reused (not re-taught) in |
| --- | --- | --- |
| Big-O, single pass | 1 | Every level |
| Array and string operations | 2 | 12, 13, 14 |
| Hash map and hash set | 3 | 4 (counting before sorting), 22 |
| Sorting, comparators, merging | 4 | 12, 20 |
| Stack as a data structure | 6 | 17 teaches only the monotonic pattern |
| Linked list pointers | 5 | 16 teaches only fast and slow pointers |
| Recursion | 7 | 8, 18, 19, 21 |

## Rules from here on

- **Level numbers are fixed (D-056).** Progress, attempts, quick checks, and tests are stored by level number, and problem IDs start with `L<number>-`. A level keeps its number for good. New topics fill a level that has no content yet, or are appended after 27; they never shift other levels.
- A move of content between levels needs a migration with a written mapping like the one above, approved by the PO before it runs.
