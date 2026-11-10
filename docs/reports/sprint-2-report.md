# Sprint 2 Report — First Playable Level

| Field | Value |
| --- | --- |
| Sprint | Sprint 2 ([plan](../sprints/sprint-2.md)) |
| Dates | 2026-11-08 → 2026-11-09 |
| Goal | A signed-in player opens Level 1, reads the lesson, solves an Easy or Medium problem by explaining it in words, and receives AI feedback and XP |
| Outcome | **Goal met in CI with the fake grader.** All eight tasks are implemented and verified. Open: PO review of the Level 1 content, and the real-grader check (latency, prompt injection) |

## Increment

- Level map with the current level, XP bars, and the 17-level path; level page with the problem list; Hard problems shown as "Coming in a later version".
- Lesson page: lesson text, a step-by-step walkthrough with Back and Next, and a quick check with immediate feedback.
- Solve page: statement, examples, constraints, timer, explanation box (2,000 characters); feedback with four criterion scores, total, feedback text, and XP.
- Grading with Gemini (prompt v2) behind a `Grader` interface; a fake grader for tests and the smoke run.
- Level 1 content: lesson, 6 practice problems, 3 test problems, placeholders.

## Results by task

| Task | Implemented | Verified | Merged to `dev` |
| --- | --- | --- | --- |
| T-201 Content format and loader | Loader and validation at startup; content packaged into the jar | Loader rule tests; the real content folder is loaded in CI | Yes |
| T-205 Game rules | XP, level target, lock states, practice and test rules in pure Java | Parameterized unit tests; isolation test (NFR-10) | Yes |
| T-202 Level 1 content | Lesson, walkthrough, quick check, 3 Easy + 3 Medium, 3 test problems, placeholders | Content validation in CI; hidden test answers computed by reference solutions | **Waiting for PO review** |
| T-203 Level map and problem list | `GET /levels` and `/levels/{n}/problems` with state, XP, and solved counts; map and level pages | API tests (progress is per player; bar stops at the target); frontend tests; smoke | With the PO review |
| T-204 Lesson page | Markdown reader (data, not HTML), walkthrough, quick check | Reader and page tests; smoke | With the PO review |
| T-206 Grading and attempts | `Grader`, `GeminiGrader` (20 s limit, schema-bound JSON, score snapping), `FakeGrader`; `POST /problems/{id}/attempts`, idempotent by `attemptId`; XP on first solve | Tests for failure, quota, timeout, unusable answers, idempotency, validation, and ownership; the system prompt is compared with the one proven in T-005 | With the PO review |
| T-207 Solve and feedback pages | Explanation form with counter and timer; feedback panel; text kept on failure | Frontend tests; smoke | With the PO review |
| T-208 Sprint report | This document | Records check | With the PO review |

T-203 to T-208 are built on the Level 1 content, so they reach `dev` together with it once the PO approves the content.

Review: all tasks are self-reviewed. The PO reviews the content and the sprint pull request.

## Verification evidence

All workflows ran on commit `1727989`.

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 126 tests, 0 failed; formatting clean; Docker image builds |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (PostgreSQL, backend image, production frontend, Playwright) | 5 passed: sign-in themes; Owner and admin; Player 403; phone; a player reads the lesson, hits a grader failure (text kept), solves Max Temperature, and sees +25 XP on the map |
| Local development job | Backend healthy following the README steps |
| Records check | OK |

Requirements covered by tests: answer keys, hints, and hidden tests never appear in API responses (NFR-02); a grader failure records nothing, and a repeated attempt ID is neither graded nor rewarded twice (FR-05.5, NFR-09); empty and over-long explanations are rejected before grading (FR-04.3).

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The backend did not start when no level folder existed | An absent folder now means "no level content yet" |
| Two files differed only by letter case (`markdown.ts`, `Markdown.tsx`), which breaks on Windows | The reader is now `parseMarkdown.ts`; found while building the screenshot preview |
| The development workspace cannot download CI artifacts | Screenshots for review are produced from a local build of the same pages with the real Level 1 content |

## Not done

- **PO review of the Level 1 content** (T-202).
- **Real-grader check** (NFR-04 latency, FR-05.4 prompt injection): `RealGraderCheck`, run by the PO with a Gemini key (README, "Checks"). Until then NFR-04 stays unresolved.
- Manual sign-in with the real Google and GitHub apps, open since Sprint 1.

## Known limits

- The time bonus uses the time reported by the page timer. A server-side timer is considered with the level-up test in Sprint 3.
- Only Level 1 can be opened: later levels unlock through the level-up test (Sprint 3).
- Header streak and hints show 0 until those features are built.

## Next sprint

Sprint 3 — levels 1 to 3 test build: hints, practice round, level-up test, content for levels 2 and 3. The plan is proposed to the PO before work starts.
