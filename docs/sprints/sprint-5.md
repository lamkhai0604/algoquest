# Sprint 5 — Level 4 and the profile page

| Field | Value |
| --- | --- |
| Status | **Approved — PO, 2026-11-14** (scope: Level 4 and the profile page; Level 5 deferred) |
| Goal | Level 4 (Sorting Fundamentals) is playable in the five-step lesson format and becomes the reference for later levels; the profile page is redesigned; Levels 1–3 content is reviewed by the PO; Java code runs on the live site |
| Duration | About 1 week from approval |
| Tasks | T-402 (live check), T-415, T-508 to T-510, T-512, T-513, T-414 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-02, FR-03, FR-04, FR-07, NFR-04, NFR-05; decisions D-032, D-040, D-048 to D-052 |

## Increment at the end of the sprint

- Level 4 opens after Level 3's test, as Levels 2 and 3 do today, with a five-step lesson, a step visualizer with predictions, an intuition question, a quick check, 6 practice problems (3 Easy, 3 Medium), and 3 test problems. Hard problems stay "Coming soon" (T-501).
- The visualizer can show a swap of two cells.
- The profile page follows the design the PO selects.
- Levels 1–3 text corrected after the PO review.
- Java code runs through Judge0 on the live site, or the gap is recorded with the cause.
- The grading latency target (NFR-04) has a measured value.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-402 Live Java check (paused, D-054) | After the PO adds `JUDGE0_API_KEY` on Render: run a passing and a failing Java solution on the live site; check the daily quota counter | Passing code doubles XP once; a failing run shows the first failing input; the quota message appears when the limit is reached (forced in a test, not live) | Live check with the PO; result recorded in the backlog |
| 2 | T-415 + T-508 Levels 1–3 review and fixes | The PO reads the lessons, intuition questions, quick checks, and problems; Claude applies the corrections | Every comment answered or applied; hidden test answers recomputed by the reference solutions after any problem change | Content check in CI; JavaScript and Java reference runs |
| 3 | T-509 Visualizer: swaps | `Visual` gains an optional swap highlight (two cell indices) drawn as a short move between the cells; the content check validates the indices | Existing walkthroughs render unchanged; a bad index fails the content check; keyboard behaviour unchanged; no motion when the browser asks for reduced motion | Backend and frontend tests; screenshots on desktop and phone |
| 4 | T-510 Level 4 Sorting Fundamentals | Lesson: why sorting helps, insertion sort step by step (O(n²)), merge sort (O(n log n)), built-in sort with a comparator, stability. Walkthrough of insertion sort with swaps. 6 practice and 3 test problems with original stories | Same content shape as Levels 1–3 (level target 150, D-040); every hidden test answer computed by JavaScript and Java reference solutions; Java samples are complete classes (D-052) | Content check; reference runs; frontend walkthrough check; screenshots |
| 5 | T-414 Profile page design pass | Mockups of the profile page first (stats, level progress, streak, recent activity); the PO selects one; then apply on desktop and phone | PO selection recorded; existing profile data unchanged; no new API unless the design needs one | Frontend tests; screenshots on desktop and phone |
| 6 | T-512 Grading latency (NFR-04) | Run `RealGraderCheck` against Gemini with the live model and prompt | 95th percentile recorded; NFR-04 marked met or a follow-up proposed | Run log summarised in the report |
| 7 | T-513 Sprint 5 report | `docs/reports/sprint-5-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: Level 5 Linked Lists and the linked-node visualizer (T-511, deferred until Level 4 sets the standard), Hard problems and hard test mode (T-501), Levels 6 and later (T-502), the leaderboard (T-403), organizations (T-503).

## Risks

| Risk | Handling |
| --- | --- |
| New content is written by AI and may contain mistakes | Reference solutions compute every hidden answer; the PO reviews the text before the `dev → main` merge |
| The Judge0 free plan quota is small | The daily guard stays on; the live check uses a few runs only |

## Work for the PO

- Add `JUDGE0_API_KEY` (RapidAPI) to Render before the live Java check (T-402).
- Review the Levels 1–3 content (T-415) with the review checklist, and later the Level 4 content in the pull request.
- Select a profile page design from the T-414 mockups.
