# Sprint 2 — First Playable Level

| Field | Value |
| --- | --- |
| Status | **Approved — PO, 2026-11-07** |
| Goal | A signed-in player opens Level 1, reads the lesson, solves an Easy or Medium problem by explaining it in words, and receives AI feedback and XP. |
| Duration | About 1 week from approval |
| Tasks | T-201 to T-208 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-02, FR-03, FR-04, FR-05, FR-08 (problem XP only), NFR-02, NFR-03, NFR-04, NFR-09; decisions D-015, D-024, D-031, D-033 |

## Increment at the end of the sprint

- The level map lists Level 1 as Open and later levels as Locked, each with an XP bar (current / target).
- Level 1 has a full lesson (9-part template), a step-by-step walkthrough, and a quick check.
- Level 1 has 3 Easy and 3 Medium practice problems and 3 test problems on file; Hard problems show "Coming in a later version".
- A player submits an explanation, sees the four criterion scores and feedback, and earns XP the first time a problem is solved (score 70 or more).
- If the grader fails or its quota is used up, the player sees "Grading is unavailable, try again later", the text stays, and nothing is recorded.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-201 Content format and loader | `content/` folder (levels, lessons as Markdown + JSON, problems as JSON per CONTENT-GUIDE.md); loader in `content`; validation at startup and in CI; public DTOs without answer keys or hidden tests; `GET /api/v1/levels`, `GET /api/v1/levels/{id}/lesson`, `GET /api/v1/problems/{id}` | Invalid content stops startup with a clear message naming the file; no API response contains an answer key (test) | CI (unit + MockMvc) |
| 2 | T-205 Game rules | `game.domain` in pure Java: problem XP (D-015), level target, totals, lock states | Unit tests for every scoring and lock rule, including edge values | CI |
| 3 | T-202 Level 1 content | Lesson "Big-O & Basics", walkthrough, quick check; 3 Easy + 3 Medium practice problems with 3 hints each; 3 test problems; Hard placeholders. The grading-test problems for level 1 are reused | Passes validation; the PO reviews the lesson and problem wording | CI; PO review |
| 4 | T-203 Level map and problem list | Level map from the API with lock states and XP bars; problem list with difficulty and status; Hard marked "Coming in a later version" and not openable | Matches the design draft; Locked levels cannot be opened | Frontend tests; smoke screenshots |
| 5 | T-204 Lesson page | Markdown rendering, walkthrough with Next/Back, quick check with immediate feedback and no XP | Keyboard accessible; re-readable for Open levels | Frontend tests; smoke screenshots |
| 6 | T-206 Grading and attempts | `Grader` interface; `GeminiGrader` (prompt v2 from T-005, JSON schema, 20 s timeout, score snapping); `FakeGrader` for tests and smoke; `attempt` and `problem_progress` tables; `POST /api/v1/problems/{id}/attempts` idempotent by `attemptId`; XP on first solve | Failure, timeout, and quota paths record nothing (tests); a repeated `attemptId` returns the stored result; prompt-injection sample scores 0 with the real model | CI with FakeGrader; latency script run by the PO with the real key (NFR-04) |
| 7 | T-207 Solve and feedback pages | Statement, examples, constraints; explanation box (2,000 characters); timer; submit; feedback page with four criteria, total, and XP gained | Empty or too-long text is rejected before grading; the text stays when grading fails | Frontend tests; smoke run with FakeGrader; screenshots |
| 8 | T-208 Sprint 2 report | `docs/reports/sprint-2-report.md` | Implemented, verified, reviewed, merged listed separately | — |

Hints, the practice round, the level-up test, and code answers follow in Sprint 3.

## Work for the PO

- Review the Level 1 lesson and problems (T-202) for clarity.
- Run the real-grader check after T-206: one command with `GEMINI_API_KEY` in `.env`, reporting latency (NFR-04) and the prompt-injection result.

## Risks

| Risk | Mitigation |
| --- | --- |
| Gemini free quota or outages during development | `FakeGrader` in CI and smoke; real calls only in the PO's check |
| Answer keys leaking to the browser | Separate public DTOs; a test scans every content API response for answer fields |
| Content mistakes found late | Validation in CI; PO review before merge of T-202 |
| Lesson content takes longer than code | Lesson text is drafted first and reviewed in parallel with T-203 and T-204 |

## Sprint review

Written at the end of the sprint in `docs/reports/sprint-2-report.md` (D-007).
