# Product Backlog — AlgoQuest

Authoritative backlog (D-005). States: Proposed → Ready → In Progress → In Review → Done; also Blocked, Awaiting Approval, Cancelled.
Priorities: P1 = blocks the current milestone, P2 = planned, P3 = deferrable.
Acceptance criteria for feature tasks are the referenced SRS criteria plus any listed here. Evidence is added when a task moves to Done. Task IDs are fixed (backlog approved in T-002, 2026-11-06).

## Sprint roadmap (approved, option B)

Each sprint is about one week, sized for a few hours of PO review time. Dates are set when a sprint is planned. Every sprint ends with a report (D-007) and screenshots of any UI work.

| Sprint | Goal | Main requirements | Reviewable result |
| --- | --- | --- | --- |
| 0 — Preparation | Approved plan, accounts ready, AI grader proven. **No app code** (D-008) | NFR-03 | Approved docs; grading test results |
| 1 — Foundations | Backend and frontend skeletons, CI, local database, sign in with Google/GitHub, Owner/Player roles and permission checks | FR-01, FR-17, NFR-02, NFR-08 | Sign-in and an empty level map (screenshots) |
| 2 — First playable level | Content format and Level 1 content, level map, lesson page, game rules, AI grading, solve and feedback pages, XP | FR-02–FR-05, FR-08 | Level 1 problems explained and graded |
| 3 — Levels 1–3 test build | Hints, practice round, level-up test with unlocking, Levels 2–3 content, profile and streak, admin grading log and reset, first deployment | FR-06, FR-09, FR-10, FR-12, FR-13, FR-18.1–2 | Levels 1–3 playable on the live site |
| 4 — Code and polish | Code in JavaScript and Java for 2× XP, dummy leaderboard, VIP and "coming later" placeholders, admin config and roles pages, design pass, XP tuning | FR-07, FR-11 (placeholder), FR-14, FR-15, FR-18.3–4 | Complete first release |
| Later | Hard problems and hard test mode, levels 4–17, organizations, voice answers, battle mode | FR-11, FR-16, FR-19 | — |

## Sprint 0 — Preparation ([plan](sprints/sprint-0.md))

| ID | Title | Req | Owner | Priority | Status | Depends on | Acceptance criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | Baseline planning docs + grading test kit | all | Claude | P1 | Done — accepted with T-002 | — | Docs on `dev`; proposals labelled; links work |
| T-002 | Review and approve the planning baseline | all | PO | P1 | Done — all decisions approved 2026-11-06; SRS and ARCHITECTURE v1.0 | T-001, T-006, T-007 | Every Proposed decision Approved, changed, or rejected; backlog IDs frozen |
| T-003 | Accounts and keys: Gemini (AI Studio), RapidAPI (Judge0 CE Basic), Google OAuth client, GitHub OAuth App (local + production), Neon project for AlgoQuest | — | PO | P1 | Done — 2026-11-07 (local OAuth apps; production OAuth apps are created at deployment) | T-002 | Keys stored only in Render/GitHub secrets or a local `.env` (names in TOOLS.md §5); never shared in messages or committed |
| T-004 | Repository settings: visibility (D-039), branch protection on `main`, Actions enabled | NFR-08 | PO | P2 | Done — verified through the GitHub API on 2026-11-07: public; ruleset `main` active (pull request required, 0 approvals; deletions and force pushes blocked); only `main` and `dev` remain | — | Verified by Claude through the GitHub API, or recorded as a gap |
| T-005 | Run the grading test and tune the prompt until NFR-03 passes | NFR-03, D-031 | PO (runs), Claude (analysis) | P1 | Done — 2026-11-07: `gemini-3.5-flash-lite`, prompt v2 (`ab616a4`): average difference 3.8, 2 answers off by more than 10 (S09, S12), pass/fail agreement 19/20 | T-003 (Gemini key) | NFR-03 met. Run 1 (prompt v1): 4.8 / 4 / 16 of 20. Latency not measured: moved to T-206 (NFR-04). Watch in T-206: wrong stated complexity also lowers steps (S09) |
| T-006 | Roles, admin panel, and organization groundwork in the plan | FR-17–FR-19 | Claude | P1 | Done — accepted with T-002 | T-001 | Docs updated |
| T-007 | Redesign for option B: architecture v0.2, tools, engineering profile, sprint plan | D-030 | Claude | P1 | Done — accepted with T-002 | T-006 | Docs updated; no references to option A left except as rejected alternative |
| T-008 | Apply the professional record style to all project records (neutral wording, no conversation traces or personal details) | D-005 | Claude | P2 | Done — accepted with T-002 | T-007 | No conversational wording, personal details, or private links in committed records |
| T-009 | Move the project to the current internal engineering guidelines | D-009 | Claude | P2 | Done | T-008 | D-009 records the change |

## Sprint 1 — Foundations ([plan](sprints/sprint-1.md), approved 2026-11-07)

| ID | Title | Req | Priority | Acceptance criteria (in addition to the requirement's) |
| --- | --- | --- | --- | --- |
| T-101 | Backend skeleton: Spring Boot 4.1 / Java 21, modules from ARCHITECTURE §3 as empty packages, Flyway baseline, health endpoint, RFC 9457 errors, Spotless, Dockerfile; `backend.yml` CI; **records check** (`docs.yml`, D-038) | NFR-08, D-038 | P1 | `./mvnw verify` green in CI; Docker image builds; records check runs on every push and PR that changes Markdown and fails on a seeded violation. **Done 2026-11-07** (CI green on `09b85df`) |
| T-102 | Frontend skeleton: React 19 + Vite + TS, router, design tokens, shared components (button, card, XP bar, loading, error, "waking the server"), API client; `frontend.yml` CI | NFR-05, NFR-08 | P1 | Lint, format, typecheck, test, build green in CI. **Done 2026-11-07** (CI green on `140221e`) |
| T-103 | Local development: `docker-compose.yml` (Postgres 16), `.env.example`, README setup steps | — | P1 | A fresh clone runs both apps by following the README. **Done 2026-11-07**: the `local-dev` CI job follows the README backend steps (green on `5e74be1`); the frontend steps match `frontend.yml` |
| T-104 | Sign in with Google and GitHub: OAuth2 login, one-time code exchange, JWT, `/api/v1/me`, sign-out, route guards | FR-01, D-036 | P1 | Unauthenticated calls get 401; code is single-use and expires after 60 s (tests). **Implemented and verified in CI 2026-11-07** (41 backend tests, frontend tests green); manual sign-in with real Google and GitHub apps pending (PO) |
| T-105 | Access core: permission catalogue, role assignments with scope, Owner seeded from `OWNER_EMAIL`, `PermissionEvaluator`, audit log, last-Owner rule | FR-17, D-034 | P1 | Tests for every permission rule; 403 for a Player on admin endpoints. **Done 2026-11-07** (CI green) |
| T-106 | Smoke workflow: compose Postgres + backend image + Vite + Playwright, fake OAuth login for CI, screenshots as artifacts | NFR-08 | P2 | Runs on PRs and on demand; screenshots attached as review evidence. **Done 2026-11-07**: 4 Playwright tests passed; screenshots in the `smoke-screenshots` artifact of run 42447092178 |
| T-107 | Sprint 1 report | D-007 | P2 | Report on `dev`. **Done 2026-11-07**: [sprint-1-report.md](reports/sprint-1-report.md) |

## Sprint 2 — First playable level ([plan](sprints/sprint-2.md), approved 2026-11-07)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-201 | Content format, loader, and validation (startup + CI); public DTOs without answer keys | D-033, NFR-02 | P1 | Done 2026-11-08 (CI: 53 backend tests, smoke green) |
| T-202 | Level 1 content: lesson, walkthrough, quick check, Easy + Medium problems, test problems, Hard placeholders (PO reviews) | FR-03, D-024 | P1 | Done 2026-11-09: content approved — PO, 2026-11-09 |
| T-203 | Level map and problem list (lock states, XP bars, "Coming in a later version" for Hard) | FR-02, FR-04.4 | P1 | Done 2026-11-09 (CI green) |
| T-204 | Lesson page: Markdown, step walkthrough, quick check | FR-03 | P1 | Done 2026-11-09 (CI green) |
| T-205 | `game.domain`: problem XP, level target, totals, lock states (pure Java, unit tests) | FR-08, FR-10 | P1 | Done 2026-11-08 (CI: 105 tests, 0 failed) |
| T-206 | Grading module (Gemini + Fake) and attempts endpoint with failure paths and idempotency | FR-05, NFR-09 | P1 | Done 2026-11-09 (126 backend tests; real-grader check pending, PO) |
| T-207 | Solve page and feedback page | FR-04, FR-05 | P1 | Done 2026-11-09 (frontend tests; smoke 5 passed) |
| T-208 | Sprint 2 report | D-007 | P2 | Done 2026-11-09: [sprint-2-report.md](reports/sprint-2-report.md) |

## Sprint 3 — Levels 1–3 test build ([plan](sprints/sprint-3.md), approved 2026-11-09)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-301 | Hints with the 3-per-5-hours quota and XP reduction | FR-06 | P1 | Done 2026-11-09 (backend 134 tests; smoke uses a hint) |
| T-302 | Practice round (70% gate, Done +10 XP) | FR-09 | P1 | Done 2026-11-09 (backend 139 tests; frontend tests) |
| T-303 | Level-up test: timer, scoring, Easy-only / Open unlocking, retakes | FR-10 | P1 | Done 2026-11-09 (backend 147 tests; server-side timer; time bonus from the server's start time) |
| T-304 | Levels 2 and 3 content (PO reviews) | FR-03, FR-04 | P1 | Content done 2026-11-09 (validated in CI); PO reviews it in the `dev → main` pull request |
| T-305 | Profile and streak | FR-12, FR-13 | P2 | Done 2026-11-09 (backend 156 tests; streak days in the player's time zone) |
| T-306 | Admin panel part 1: grading log and progress reset (audit-logged) | FR-18.1–2 | P2 | Done 2026-11-09 (backend 160 tests; reset audited with before and after values) |
| T-307 | First deployment (Vercel, Render, Neon) + live smoke check | D-037 | P1 | Done 2026-11-11: frontend on Vercel, backend on Render, database on Neon; production OAuth apps; live sign-in and grading checked by the PO ([runbook](DEPLOY.md)) |
| T-311 | Sign-in page background: live breadth-first search on a graph | FR-01; D-045 | P2 | Done 2026-11-12 |
| T-310 | Solve page layout: problem and hints on top, full-width answer, answer beside the result after grading, collapsible scoring guide; problems with progress never re-lock after an order change | FR-04, FR-05; D-042, D-044 | P1 | Done 2026-11-12 (backend and frontend tests, smoke) |
| T-309 | Trial feedback round: XP rebalance and quick check XP, ordered problems, result page with Retry and Next, active-time timer with pause, scoring guide, back button, profile and wording fixes | FR-03, FR-04, FR-08, FR-12; D-040–D-044 | P1 | Done 2026-11-12 (backend 162 tests; frontend tests; smoke 5 passed, including the result page, Retry dialog, and Next) |
| T-308 | Sprint 3 report | D-007 | P2 | Done 2026-11-09: [sprint-3-report.md](reports/sprint-3-report.md) |

## Sprint 4 — Code and rules ([plan](sprints/sprint-4.md), approved 2026-11-12, closed 2026-11-14; [report](reports/sprint-4-report.md))

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-401 | Code editor + JavaScript runner (inputs only to the browser, backend compares) | FR-07, D-035, D-046 | P1 | Done 2026-11-12 (backend and frontend tests; smoke runs real JavaScript for the code bonus) |
| T-402 | Java runner through Judge0 with daily quota guard | FR-07, D-032, D-054 | P2 | Implemented and verified with a fake runner 2026-11-12. Live check paused (D-054): no free Judge0 plan; Java runs off until a key is set |
| T-404 | Placeholders: hard test mode option, battle mode (VIP page done in T-301) | FR-11, FR-16 | P3 | Done 2026-11-12 |
| T-405 | Admin panel part 2: game config editor, users and roles, audit log view | FR-18.3–4, FR-17.6, D-047 | P2 | Done 2026-11-12 (audit entries with before and after values; 403 for players) |
| T-406 | Design pass: mockups first, PO selects, then apply | NFR-05, NFR-06 | P2 | Done 2026-11-14 for the level map (layout B, D-049), lesson, and phone layouts. Profile mockups moved to T-414 |
| T-407 | Tune XP numbers from the trial results | OQ-03, D-015 | P2 | Done 2026-11-12: values stay at D-040; the PO tunes them on the game rules page, which rejects values that break the rules |
| T-408 | Sprint 4 report | D-007 | P2 | Done 2026-11-14: [sprint-4-report.md](reports/sprint-4-report.md) |

## Side Sprint S-1 — Beginner-friendly Levels 1–3 (run inside Sprint 4, 2026-11-13 to 2026-11-14)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-409 | Curriculum of 27 levels in three phases; Levels 2 and 3 reordered; migration V13 | FR-02, D-048 | P1 | Done 2026-11-13 (content check for phases; backend tests) |
| T-410 | Learning Path page and five-step lessons with the step visualizer | FR-02, FR-03, D-049 | P1 | Done 2026-11-13 (frontend tests check each walkthrough against a reference run; smoke covers the five steps) |
| T-411 | Levels 1–3 content: Level 1 extended, Level 2 Arrays & Strings (new), Level 3 Hashing | FR-03, FR-04, D-048 | P1 | Done 2026-11-13: hidden test answers computed by JavaScript and Java reference solutions. PO content review done 2026-11-19 (T-415) |
| T-412 | Review fixes: locked phases and upcoming tiles, Back button, button spacing, code Copy button, site footer | FR-02, D-050 | P2 | Done 2026-11-14 |
| T-413 | Intuition question, collapsible Learn sections, JavaScript/Java switch, complete Java samples | FR-03, D-051, D-052 | P2 | Done 2026-11-14 (every Java block compiles and matches the JavaScript results on the lesson examples) |

## Sprint 5 — Level 4 and the profile page ([plan](sprints/sprint-5.md), approved 2026-11-14)

T-402's live Java check is paused (D-054): Judge0 CE has no free plan any more, so Java runs stay off until a key is set. JavaScript-only editor done 2026-11-14.

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-415 | PO content review of Levels 1–3 (moved from Later) | FR-03, FR-04 | P1 | Done 2026-11-19: Levels 1–4 and the pattern challenges reviewed, all items OK |
| T-508 | Apply the Levels 1–3 review corrections | FR-03, FR-04 | P1 | Done 2026-11-19: no corrections needed |
| T-509 | Visualizer: swap highlight | FR-03, D-049 | P1 | Done 2026-11-14 (content check for indices; frontend test replays the Level 4 swaps) |
| T-510 | Level 4 Sorting Fundamentals content | FR-03, FR-04, D-048 | P1 | Done 2026-11-14: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles. PO content review in the pull request |
| T-512 | Measure grading latency with `RealGraderCheck` | NFR-04 | P2 | Done 2026-11-16: median 885 ms, slowest 1,458 ms; all five sample scores in range, including the prompt-injection sample (0) |
| T-414 | Profile page design pass (moved from Later) | NFR-05, D-053 | P2 | Done 2026-11-14 (design chosen by Claude as delegated by the PO; frontend tests; screenshots) |
| T-514 | Owner test access to every level (`game.allLevels`) | FR-17, D-055 | P1 | Done 2026-11-16 (API tests for the Owner and a player; frontend test for the note) |
| T-515 | Curriculum map (17 to 27 levels) and fixed level numbers | D-048, D-056 | P2 | Done 2026-11-17: [CURRICULUM-MAP.md](CURRICULUM-MAP.md) |
| T-516 | Pattern Recognition demo for the PO to try (no backend) | D-057 | P1 | Done 2026-11-17 |
| T-517 | Pattern Recognition pilot: content schema and validator, six Level 3–4 challenges, API with label-decided correctness and AI-graded reasoning, `pattern_attempt` table, level page section | FR-03, FR-05, D-057 | P1 | Done 2026-11-17: live Gemini check 6 of 6 as expected |
| T-513 | Sprint 5 report | D-007 | P2 | Done 2026-11-19: [report](reports/sprint-5-report.md) |

## Sprint 6 — Level 5 Linked Lists ([plan](sprints/sprint-6.md), closed 2026-11-19)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-518 | Visualizer: linked nodes (`next` pointers) | FR-03, D-049 | P1 | Done 2026-11-19 (content check for pointers; frontend test replays the Level 5 reversal; screenshots on desktop and phone) |
| T-519 | List arguments in code runs (`ListNode`) | FR-07, D-058 | P1 | Done 2026-11-19 (worker helper tests; harness test compiles and runs list code and stops at a cycle) |
| T-511 | Level 5 Linked Lists content (deferred from Sprint 5) | FR-03, FR-04, D-048 | P1 | Done 2026-11-19: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles; PO review OK |
| T-520 | Level 5 pattern challenges | D-057 | P2 | Done 2026-11-19 (content check; PO review OK) |
| T-521 | Sprint 6 report | D-007 | P2 | Done 2026-11-19: [report](reports/sprint-6-report.md) |

## Sprint 7 — Level 6 Stack, Queue & Deque ([plan](sprints/sprint-7.md), closed 2026-11-19)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-522 | Level 6 Stack, Queue & Deque content | FR-03, FR-04, D-048 | P1 | Done 2026-11-19: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-523 | Level 6 pattern challenges | D-057 | P2 | Done 2026-11-19 (content check; PO review OK) |
| T-524 | Sprint 7 report | D-007 | P2 | Done 2026-11-19: [report](reports/sprint-7-report.md) |

## Sprint 8 — Level 7 Recursion & Divide and Conquer ([plan](sprints/sprint-8.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-525 | Level 7 Recursion & Divide and Conquer content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-526 | Level 7 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check; PO review OK) |
| T-527 | Sprint 8 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-8-report.md) |

## Sprint 9 — Level 8 Trees & Binary Search Trees ([plan](sprints/sprint-9.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-528 | Visualizer: binary tree | FR-03, D-049 | P1 | Done 2026-11-20 (content check; tree view test; Level 8 replay test; screenshots on desktop and phone) |
| T-529 | Tree arguments in code runs (`TreeNode`) | FR-07, D-059 | P1 | Done 2026-11-20 (worker helper tests; harness test compiles and runs tree code) |
| T-530 | Level 8 Trees & BST content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-531 | Level 8 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check; PO review OK) |
| T-532 | Sprint 9 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-9-report.md) |

## Sprint 10 — Levels 9 and 11 ([plan](sprints/sprint-10.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-533 | Level 9 Heap & Priority Queue content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-534 | Level 9 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check; PO review OK) |
| T-535 | Level 11 Bit Manipulation & Basic Math content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-536 | Level 11 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check; PO review OK) |
| T-537 | Sprint 10 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-10-report.md) |

## Sprint 11 — Level 10 ([plan](sprints/sprint-11.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-538 | Graph view in the walkthrough | FR-03, D-060 | P1 | Done 2026-11-20: content check rules, rendering and replay tests; PO review OK |
| T-539 | Level 10 Graph Fundamentals content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-540 | Level 10 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check; PO review OK) |
| T-542 | Animated walkthroughs: playback for every level; travelled edges, queue strip and rings for graphs | FR-03, D-061 | P1 | Done 2026-11-20: rendering and playback tests; PO review OK |
| T-541 | Sprint 11 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-11-report.md) |

## Sprint 12 — Portfolio preparation ([plan](sprints/sprint-12.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-544 | Demo sign-in for visitors | FR-01, FR-17, D-062 | P1 | Done 2026-11-20: API and frontend tests; PO approval |
| T-545 | Landing section on the sign-in page | FR-01 | P2 | Done 2026-11-20: frontend tests and screenshots; PO approval |
| T-546 | Link previews (Open Graph) | — | P2 | Done 2026-11-20: tags and preview image; live check by the PO |
| T-547 | Portfolio README | D-007 | P1 | Done 2026-11-20: PO approval |
| T-548 | Sprint 12 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-12-report.md) |

## Phase 2 roadmap — Problem-Solving Patterns (Levels 12–21)

About two levels per sprint, each at the standard of Levels 4–11 with pattern challenges. Planned order: Sprint 13 Levels 12–13, Sprint 14 Levels 14–15, Sprint 15 Levels 16–17, Sprint 16 Levels 18–19 (with the graph explorer, T-543), Sprint 17 Levels 20–21 (with the interval timeline view, T-572).

## Sprint 13 — Levels 12 and 13 ([plan](sprints/sprint-13.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-550 | Window range in the cell view | FR-03, D-063 | P1 | Done 2026-11-20: content check rules, rendering test; PO review OK |
| T-551 | Level 12 Two Pointers content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers recomputed by JavaScript and Java reference solutions (all earlier answers confirmed); lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-552 | Level 12 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-553 | Level 13 Sliding Window content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-554 | Level 13 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-555 | Sprint 13 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-13-report.md) |

## Sprint 14 — Levels 14 and 15 ([plan](sprints/sprint-14.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-556 | Level 14 Prefix Sum & Range Queries content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-557 | Level 14 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-558 | Level 15 Binary Search content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-559 | Level 15 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-560 | Sprint 14 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-14-report.md) |

## Sprint 15 — Levels 16 and 17 ([plan](sprints/sprint-15.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-561 | Level 16 Fast & Slow Pointers content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-562 | Level 16 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-563 | Level 17 Monotonic Stack content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-564 | Level 17 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-565 | Sprint 15 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-15-report.md) |

## Sprint 16 — Levels 18 and 19 ([plan](sprints/sprint-16.md), closed 2026-11-20)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-543 | Interactive graph explorer: pick the start vertex, compare BFS and DFS on the same graph | FR-03, D-064 | P1 | Done 2026-11-20: trace unit tests, rendering test; PO review OK |
| T-566 | Level 18 DFS & BFS Patterns content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-567 | Level 18 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-568 | Level 19 Backtracking content | FR-03, FR-04, D-048 | P1 | Done 2026-11-20: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-569 | Level 19 pattern challenges | D-057 | P2 | Done 2026-11-20 (content check); PO review OK |
| T-571 | Motion in every walkthrough view: sliding markers, swaps, growing tree nodes, path highlight, pointer flips, stack strip | FR-03, D-065 | P1 | Done 2026-11-20: frontend tests; motion checked in a recording; PO review OK |
| T-570 | Sprint 16 report | D-007 | P2 | Done 2026-11-20: [report](reports/sprint-16-report.md) |

## Sprint 17 — Levels 20 and 21 ([plan](sprints/sprint-17.md), closed 2026-11-21)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-572 | Interval timeline view: intervals as bars on a time axis, kept intervals, a sweep line | FR-03, D-066 | P1 | Done 2026-11-21: content check rules, rendering and loader tests; PO review OK |
| T-573 | Level 20 Greedy & Intervals content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; greedy rules checked against brute force on small random inputs; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-574 | Level 20 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-575 | Level 21 Dynamic Programming Fundamentals content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-576 | Level 21 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-577 | Sprint 17 report and Phase 2 summary | D-007 | P2 | Done 2026-11-21: [report](reports/sprint-17-report.md) |

## Phase 3 roadmap — Interview Mastery (Levels 22–27)

About two levels per sprint at the standard of Levels 12–21. Planned order: Sprint 18 Levels 22–23 (with the table view for 2-D DP, T-579, and the System Design placeholder, T-578), Sprint 19 Levels 24–25 (with edge weights, T-586), Sprint 20 Levels 26–27.

## Sprint 18 — Levels 22 and 23 ([plan](sprints/sprint-18.md), closed 2026-11-21)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-578 | System Design tab marked "Coming soon": last item of the main navigation and a page listing the planned topics | D-067 | P2 | Done 2026-11-21: frontend test; screenshots on desktop and phone (header wraps below 480 px); PO review OK |
| T-579 | Table view for 2-D walkthroughs: rows and columns of cells, the cell being filled, the cells it reads | FR-03, D-068 | P1 | Done 2026-11-21: content check rules, loader and rendering tests; a prediction can also hide the marked cell; PO review OK |
| T-580 | Level 22 Mixed Pattern Problems content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-581 | Level 22 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-582 | Level 23 1D & 2D Dynamic Programming content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test against the LCS recurrence; PO review OK |
| T-583 | Level 23 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-584 | Sprint 18 report | D-007 | P2 | Done 2026-11-21: [report](reports/sprint-18-report.md) |

## Sprint 19 — Levels 24 and 25 ([plan](sprints/sprint-19.md), closed 2026-11-21)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-586 | Edge weights on the graph view: a label on each edge, and the explorer ignores weights | FR-03, D-069 | P1 | Done 2026-11-21: content check rule, loader and rendering tests; PO review OK |
| T-587 | Level 24 Graph & Grid Problem Solving content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test against multi-source BFS; PO review OK |
| T-588 | Level 24 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-589 | Level 25 Shortest Path & Topological Sort content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test against Dijkstra; PO review OK |
| T-590 | Level 25 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-591 | Sprint 19 report | D-007 | P2 | Done 2026-11-21: [report](reports/sprint-19-report.md) |

## Sprint 20 — Levels 26 and 27 ([plan](sprints/sprint-20.md), closed 2026-11-21)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-592 | Learning Path: Phase 4 System Design and an elective on design patterns, both marked "Coming soon" | D-070 | P2 | Done 2026-11-21: frontend test; screenshots; PO review OK |
| T-593 | Level 26 Tries content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test against trie insertion; PO review OK |
| T-594 | Level 26 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-595 | Level 27 Interview Practice content | FR-03, FR-04, D-048 | P1 | Done 2026-11-21: hidden test answers computed by JavaScript and Java reference solutions; lesson Java compiles and JavaScript runs; walkthrough replay test; PO review OK |
| T-596 | Level 27 pattern challenges | D-057 | P2 | Done 2026-11-21 (content check); PO review OK |
| T-599 | Tidy the header: remove the System Design item (Phase 4 is on the Learning Path), keep Map and Knowledge in the main navigation, put streak, XP and hints in a progress menu, and name, Profile, Admin, language, theme and sign-out in an account menu | FR-02, D-071 | P1 | Done 2026-11-21: frontend tests; screenshots on desktop and phone; PO review OK |
| T-597 | Sprint 20 report and Phase 3 summary | D-007 | P2 | Done 2026-11-21: [report](reports/sprint-20-report.md) |

## Sprint 21 — Lesson figures and layout fixes ([plan](sprints/sprint-21.md), closed 2026-11-21)

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-600 | Walkthrough controls above the drawing so they stay in place between steps; 16px of space above a button that follows other content in a card | D-072 | P1 | Done 2026-11-21: frontend tests; before and after screenshots on desktop and phone; PO review OK |
| T-601 | Lesson figures: the `figure` block (stack, queue, visual, image), Play and Stop, English and Vietnamese labels, backend and frontend content checks | FR-03, D-072 | P1 | Done 2026-11-21: backend and frontend tests; screenshots; PO review OK |
| T-602 | Figures in the core lessons: arrays (insert, grid), hashing (buckets and a collision), linked lists (insert, reverse), stack and queue, BST search, heap push, BFS rings | FR-03, D-072 | P1 | Done 2026-11-21: content checks, including frame-by-frame replay of stack and queue figures; screenshots; PO review OK |
| T-604 | Sprint 21 report | D-007 | P2 | Done 2026-11-21: [report](reports/sprint-21-report.md) |

## Sprint 22 — Notes ([plan](sprints/sprint-22.md))

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-606 | Notes backend: `note` table, owner-scoped API (list, search, create, read, update, delete), `notes.manage` permission, Markdown zip export | D-074 | P1 | Done 2026-11-23: backend tests; PO review OK |
| T-607 | Notes frontend: Notes in the navigation, note list with search and tag filter, TipTap editor with toolbar and autosave, delete with confirmation, English and Vietnamese | D-074 | P1 | Done 2026-11-23: frontend tests; PO review OK |
| T-608 | Notes on the level page: the notes linked to the level, and a button that starts a note for it | D-074 | P2 | Done 2026-11-23: frontend test; PO review OK |
| T-609 | Sprint 22 report | D-007 | P2 | Done 2026-11-23: [report](reports/sprint-22-report.md) |
| T-603 | Decorative images for the seven core lessons, made by the PO with Gemini from the prompts in [lesson-images.md](lesson-images.md); WebP, 1600 px wide, with alt text (moved from Later) | D-072 | P3 | Done 2026-11-23: content test checks every image file exists; PO review OK; merged in PR #54 |

## Sprint 23 — Guest account and quick notes ([plan](sprints/sprint-23.md))

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-610 | Guest account: `GUEST_ACCOUNT` and `GUEST_PASSWORD` settings, password sign-in for the guest, `GUEST` role with `game.play` and `notes.manage` | FR-01, FR-17, D-075 | P1 | Done 2026-11-23: backend tests; PO set the guest settings on Render and checked the guest sign-in |
| T-611 | Quick notes on the lesson page: Note button by the title (floating when scrolled), side panel or bottom sheet with this level's notes and the compact editor, N and Escape | FR-03, D-076 | P1 | Done 2026-11-23: frontend tests; PO review OK |
| T-612 | Sprint 23 report | D-007 | P2 | Done 2026-11-23: [report](reports/sprint-23-report.md) |

## Sprint 24 — Code lines and the recursion staircase ([plan](sprints/sprint-24.md))

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-613 | Code panel in walkthroughs: a step's `lines` lights the lines it runs in the code in view (its own code or the latest earlier code); Levels 7 and 15 show one whole function | FR-03, D-077 | P1 | Done 2026-11-24: backend and frontend tests; content test for Level 7; PO review OK; merged in PR #62 |
| T-614 | Recursion staircase: `visual.calls` draws each call as a box indented by depth (running, waiting, done with its result); Level 7 walkthrough uses it | FR-03, D-078 | P1 | Done 2026-11-24: backend and frontend tests; content test against a reference sum; PO review OK; merged in PR #62 |
| T-615 | Small fixes: the sign-in page names 27 levels instead of 11 topics; loading notices show placeholder bars | FR-01, NFR-05 | P3 | Done 2026-11-24: frontend tests; PO review OK; merged in PR #62 |
| T-617 | Code lines in the remaining walkthroughs: each level shows one whole function in its first step and lights the lines of every step (24 of 27 levels; Level 22 is pattern recognition and Level 27 keeps its own snippets outside the trace) | FR-03, D-077 | P2 | Done 2026-11-24: content check of every line range in CI; merged to `dev` |
| T-616 | Sprint 24 report | D-007 | P2 | Done 2026-11-24: [report](reports/sprint-24-report.md) |

## Phase 4 planning — System Design ([syllabus](SYSTEM-DESIGN-SYLLABUS.md))

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-618 | Phase 4 syllabus: levels 28 to 41, references for checking facts, lesson format, design prompts and rubric, authoring workflow, delivery plan | D-007, D-056 | P1 | Superseded by T-633, T-636 and T-638; syllabus version 3.1 approved — PO, 2026-11-25 |
| T-620 | Phase 4 content, levels 28 and 29: lessons, walkthroughs, quick checks, intuition questions and trade-off challenges (no XP, no design-prompt kind yet); listed in the existing Phase 4 section of the Learning Path | D-056, D-070 | P1 | Done 2026-11-24: content check in CI; merged to `dev`; PO review pending |
| T-622 | 3D architecture diagram for walkthroughs (`visual.arch`): content check, drawing with moving requests, Levels 28 and 29 walkthroughs use it | FR-03, D-079 | P1 | Done 2026-11-24: backend and frontend tests; preview screenshots on desktop and phone widths; PO review pending |
| T-623 | Clearer estimates in Levels 28 and 29: every step of each calculation written out (powers of ten, rounding of a day to 10⁵ seconds, rounding up server counts); the Level 29 worked example states 300 requests per second as the server's limit, which the calculation assumes | FR-03 | P2 | Done 2026-11-24: content check in CI |
| T-624 | Beginner pass, key terms: a Key terms list in the Learning objectives of Levels 28 and 29 (network, time units, scaling and balancing terms), plain wording for terms taught later, and review fixes: the request path template separates setup from the request, latency includes waiting, failure behavior is stated with its conditions, American spelling | FR-03, D-079 | P1 | Done 2026-11-24: content check in CI; PO review pending |
| T-625 | Beginner pass, prediction steps: two prediction questions in each of the Level 28 and 29 walkthroughs; the architecture diagram hides the request path while a prediction is open | FR-03, D-079 | P1 | Done 2026-11-24: frontend test; content check in CI; PO review pending |
| T-626 | Beginner pass, answer options: wrong options in the quick checks and intuition questions of Levels 28 and 29 are common misunderstandings; correct answers are in varied positions; Level 28 links system design to Big-O (Level 1) | FR-03 | P2 | Done 2026-11-24: content check in CI; PO review pending |
| T-627 | Two more trade-off challenges per level for Levels 28 and 29; every `valid` approach meets all fixed requirements of its challenge, and the session challenge on Level 29 is relabelled accordingly | FR-03, D-057 | P2 | Done 2026-11-24: content check in CI; PO review pending |
| T-629 | Review round 2 fixes for Levels 28 and 29: prediction steps no longer give the answer away through titles or visible variables; the latency table states the real gaps between rows; the worked example and the step 6 prediction give every number the answer depends on; launch capacity states its assumptions; the session and small-tool challenges state their requirements exactly; claims about scaling and least connections carry their conditions | FR-03, D-057, D-079 | P1 | Done 2026-11-25: content check in CI; PO review pending |
| T-630 | Review round 3 fixes for Levels 28 and 29: the launch-capacity challenge states its planning rule (twice the first hour's average), the small-tool challenge states how long a restore takes, and the step 6 prediction explains the response time | FR-03, D-057 | P2 | Done 2026-11-25: content check in CI; PO review pending |
| T-631 | Glossary of English terms with fixed Vietnamese explanations (`content/glossary/vi.json`), and translated walkthrough variable values (names and order unchanged) | FR-03, D-080 | P1 | Done 2026-11-25: backend test; content check in CI |
| T-632 | Translations for trade-off challenges (`patterns.json`): model, content check, and API language selection, as for lessons and problems | FR-03, D-057, D-080 | P3 | Proposed; after more Phase 4 levels |
| T-633 | Phase 4 syllabus version 2: zero-to-interview path of 26 levels (28 to 53) in six stages, official and public references, beginner rules for every level, interview readiness map, reference designs after grading | D-056, D-057, D-070, D-079, D-080 | P1 | Done 2026-11-25: approved as part of syllabus version 3.1 (Approved — PO, 2026-11-25) |
| T-636 | Phase 4 syllabus version 3: complete prerequisites, core and extension material per level, homes for concurrency control, service boundaries, recovery, autoscaling and tail latency, an assessed deep dive per case study, junior and mid-level tracks with a pass standard, rubric guidance and an early-prompt scaffold, case study references | D-056, D-057, D-070, D-079, D-080 | P1 | Done 2026-11-25: approved as part of syllabus version 3.1 (Approved — PO, 2026-11-25) |
| T-637 | Show System Design levels as SD 1 to SD 26 on the Learning Path, level, lesson, solve, pattern, profile and notes pages; internal numbers unchanged; cross-references in Levels 28 and 29 use SD numbers | FR-03, D-081 | P1 | Done 2026-11-25: frontend unit test; CI |
| T-638 | Phase 4 syllabus version 3.1: the junior track includes 35, 36 and 41C so it is closed under its prerequisites; Level 42 lists its prerequisites directly; Level 31 core introduces pessimistic and optimistic concurrency at an intuitive level; Level 44 teaches token bucket and sliding window first; four new references | D-081 | P1 | Done 2026-11-25: approved as part of syllabus version 3.1 (Approved — PO, 2026-11-25) |
| T-640 | SD 3 (Level 30) Caching and CDNs in English: lesson with key terms and an optional extension, 7-step walkthrough with two predictions, quick check, intuition, three trade-off challenges; 15 glossary terms | FR-03, D-057, D-079, D-080, D-081 | P1 | Built 2026-11-25; review by ChatGPT, fact check by Gemini, translation, PO check pending |
| T-641 | SD 3 review fixes: freshness promise accounts for slow reads (TTL counts from insertion), measured hit rate stated, empty-cache plan limits database reads, CDN challenge states measured latency and a delivery requirement, versioned file names and CDN revalidation taught, where to cache, better distractors, write-through and LRU wording | FR-03, D-057 | P1 | Done 2026-11-25: content check in CI; focused re-review pending |
| T-642 | SD 3 review round 2 fixes: the 200 ms photo requirement applies to photos cached at the edge, first and expired requests may take longer, and both CDN options explain those requests; demand-driven revalidation wording | FR-03, D-057 | P2 | Done 2026-11-25: content check in CI; final check pending |
| T-645 | Architecture diagrams: several requests at once (`flows`) and component notes (`note`), with content checks and translation rules | FR-03, D-082 | P1 | Done 2026-11-25: backend and frontend tests; preview screenshot |
| T-646 | SD 3 review round 3 fix: the CDN challenge's latency rule applies to later requests in a region, so origin-only options break a stated requirement | FR-03, D-057 | P2 | Done 2026-11-25: content check in CI |
| T-647 | Open SD 1 (Level 28) to every account, as Level 1 is | FR-09, D-083 | P1 | Done 2026-11-25: backend unit test; CI |
| T-648 | SD 4 (Level 31) Databases, Indexes and Concurrent Writes in English: lesson, 7-step walkthrough with two predictions and a race between two buyers, intuition; 23 glossary terms | FR-03, D-079, D-082 | P1 | Done 2026-11-25: content check in CI; facts F24–F31 confirmed (G-06); Vietnamese translation pending |
| T-649 | SD 4 quick check (3 questions) and trade-off challenges (3), drafted by ChatGPT from Claude's outline | FR-03, D-057 | P1 | Done 2026-11-25: reviewed by Claude (one distractor reworded); content check in CI |
| T-650 | Open every System Design level (Level 28 onward) to every account | FR-09, D-084 | P1 | Done 2026-11-25: backend unit test; CI |
| T-651 | Show quick-check, prediction, intuition and pattern-challenge options in a random order; answers keep their content indices | FR-03, D-084 | P1 | Done 2026-11-25: frontend unit test; CI |
| T-652 | SD 4 content review round 1 and Vietnamese translation, by ChatGPT | FR-03, D-057 | P1 | In progress 2026-11-25: round 1 found 2 Major and 2 Minor issues, fixed in T-653; translation pending |
| T-653 | SD 4 review round 1 fixes: full lock and version protocols in the walkthrough, load test instead of an unsupported capacity claim, scoped index-cost rule and isolation default, stronger distractors | FR-03, D-057 | P1 | Done 2026-11-25: content check in CI |

## Maintenance

| ID | Title | Req | Priority | Status |
| --- | --- | --- | --- | --- |
| T-605 | Owner-only sign-in with email and password; Google, GitHub and demo sign-in off by default | FR-01, FR-17, D-073 | P1 | Done 2026-11-23: backend and frontend tests; PO review OK. The PO set `OWNER_PASSWORD` on Render |

## Later (unscheduled)

| ID | Title | Req |
| --- | --- | --- |
| T-403 | Leaderboard with labelled dummy players (moved from Sprint 4) | FR-14 |
| T-501 | Hard problems and hard test mode for real | FR-11, D-024 |
| T-502 | Levels 4–27 content, about 2 levels per sprint | SRS §6, D-048 |
| T-503 | Organizations (admin invites 5 or 10 members) | FR-19, OQ-06 |
| T-504 | Withdrawn | — |
| T-505 | Move JavaScript checking to Judge0 or a server sandbox before graded organization use | D-035 |
| T-506 | Voice answers | Excluded this release |
| T-507 | Battle mode | FR-16 |
| T-549 | Admin action to delete old demo accounts | FR-17, D-062 |
| T-585 | System Design track: lessons, animated architecture diagrams, design questions graded by AI | D-067 |
| T-598 | Design patterns elective: lessons and practice on common object-oriented design patterns | D-070 |
