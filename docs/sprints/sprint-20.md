# Sprint 20 — Level 26 Tries and Level 27 Interview Practice

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-21 |
| Goal | Phase 3 is complete: Levels 26 and 27 are playable in the five-step lesson format at the standard of Levels 12–25, with pattern challenges; the Learning Path shows Phase 4 System Design and a design patterns elective as "Coming soon" |
| Duration | About 1 week from approval |
| Tasks | T-592, T-593, T-594, T-595, T-596, T-597 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-02, FR-03, FR-04, FR-05; decisions D-048, D-057, D-060, D-067, D-069, D-070 |

## Increment at the end of the sprint

- **Learning Path (D-070):** below Phase 3, a "Phase 4 · System Design" section and an "Elective · Design Patterns" section, each with its goal and a "Coming soon" badge.
- **Level 26 Tries:** lesson (a tree of letters, insert and search, prefix counts, an end-of-word mark, a trie with DFS for word search, when a hash set is enough); a walkthrough that inserts words into a trie drawn on the graph view, with letters on the edges; an intuition question; a quick check; 6 practice and 3 test problems.
- **Level 27 Interview Practice:** lesson (a repeatable interview routine: clarify, examples, brute force, improve, code, test, explain; time management; talking through trade-offs); a walkthrough that runs the routine on one problem; an intuition question; a quick check; 6 practice and 3 test problems drawn from all earlier patterns.
- Three pattern challenges for each level. Hard problems stay "Coming soon" (T-501).

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-592 Learning Path sections | Two sections, English and Vietnamese text | Shown after Phase 3 with a "Coming soon" badge; no levels; no XP | Frontend test; screenshots |
| 2 | T-593 Level 26 content | Lesson, walkthrough, intuition, quick check, 9 problems, Hard placeholders | Same content shape as Levels 12–25; every hidden test answer computed by JavaScript and Java reference solutions | Content check; reference runs; replay test; screenshots |
| 3 | T-594 Level 26 pattern challenges | Three challenges | One best approach each | Content check; PO review |
| 4 | T-595 Level 27 content | As T-593 | As T-593 | As T-593 |
| 5 | T-596 Level 27 pattern challenges | Three challenges | As T-594 | As T-594 |
| 6 | T-597 Sprint 20 report and Phase 3 summary | `docs/reports/sprint-20-report.md` | Implemented, verified, reviewed, merged listed separately; Phase 3 outcome summarized | Records check |

Out of scope: System Design content (T-585), design patterns content (T-598), Vietnamese text for levels, Hard problems (T-501).

## Risks

| Risk | Handling |
| --- | --- |
| A trie with many children is hard to draw | The walkthrough uses a handful of short words so the trie stays under 12 nodes |
| Interview problems repeat earlier levels | Problems are new and mix patterns; statements do not name the pattern |

## Work for the PO

- Review Levels 26 and 27 and the new Learning Path sections with the review checklist.
