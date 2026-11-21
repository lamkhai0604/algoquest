# Sprint 14 — Level 14 Prefix Sum & Range Queries and Level 15 Binary Search

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-20 |
| Goal | Levels 14 and 15 are playable in the five-step lesson format at the standard of Levels 4–13, with pattern challenges. Both reuse the cell view with markers and the window range |
| Duration | About 1 week from approval |
| Tasks | T-556, T-557, T-558, T-559, T-560 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-03, FR-04, FR-05; decisions D-048, D-052, D-056, D-057, D-063 |

## Increment at the end of the sprint

- **Level 14 Prefix Sum & Range Queries:** lesson (the prefix array and its off-by-one convention, range sums in O(1), prefix sums with a hash map for "subarray sums to k", 2D prefix sums, difference arrays for range updates); a walkthrough that builds the prefix array and answers a range query with the range shaded; an intuition question; a quick check; 6 practice and 3 test problems, including the parked "Exact Total Stretches" problem.
- **Level 15 Binary Search:** lesson (the sorted-half rule, the loop invariant, lower and upper bounds, searching on the answer); a walkthrough with `lo`, `mid` and `hi` and the remaining range shaded; an intuition question; a quick check; 6 practice and 3 test problems.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-556 Level 14 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 4–13; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; walkthrough replay test; screenshots |
| 2 | T-557 Level 14 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 3 | T-558 Level 15 content | As T-556 | As T-556 | As T-556 |
| 4 | T-559 Level 15 pattern challenges | Three challenges | As T-557 | As T-557 |
| 5 | T-560 Sprint 14 report | `docs/reports/sprint-14-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Levels 16–21 (later sprints), Vietnamese text (localization track), Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| Off-by-one errors are the main difficulty of both topics, in the content as much as for learners | Reference solutions compute every answer; replay tests check each walkthrough; the lessons state one convention and keep to it |
| Integer overflow in sums and in `(lo + hi) / 2` | Limits keep sums within 32 bits where Java uses `int`; the lesson shows `lo + (hi - lo) / 2` |

## Work for the PO

- Review Levels 14 and 15 with the review checklist.
