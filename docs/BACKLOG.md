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
| T-202 | Level 1 content: lesson, walkthrough, quick check, Easy + Medium problems, test problems, Hard placeholders (PO reviews) | FR-03, D-024 | P1 | Content ready; waiting for PO review |
| T-203 | Level map and problem list (lock states, XP bars, "Coming in a later version" for Hard) | FR-02, FR-04.4 | P1 | Done 2026-11-09 (CI green; reaches `dev` with T-202) |
| T-204 | Lesson page: Markdown, step walkthrough, quick check | FR-03 | P1 | Done 2026-11-09 (CI green; reaches `dev` with T-202) |
| T-205 | `game.domain`: problem XP, level target, totals, lock states (pure Java, unit tests) | FR-08, FR-10 | P1 | Done 2026-11-08 (CI: 105 tests, 0 failed) |
| T-206 | Grading module (Gemini + Fake) and attempts endpoint with failure paths and idempotency | FR-05, NFR-09 | P1 | Done 2026-11-09 (126 backend tests; real-grader check pending, PO) |
| T-207 | Solve page and feedback page | FR-04, FR-05 | P1 | Done 2026-11-09 (frontend tests; smoke 5 passed) |
| T-208 | Sprint 2 report | D-007 | P2 | Done 2026-11-09: [sprint-2-report.md](reports/sprint-2-report.md) |

## Sprint 3 — Levels 1–3 test build

| ID | Title | Req | Priority |
| --- | --- | --- | --- |
| T-301 | Hints with the 3-per-5-hours quota and XP reduction | FR-06 | P1 |
| T-302 | Practice round (70% gate, Done +10 XP) | FR-09 | P1 |
| T-303 | Level-up test: timer, scoring, Easy-only / Open unlocking, retakes | FR-10 | P1 |
| T-304 | Levels 2 and 3 content (PO reviews) | FR-03, FR-04 | P1 |
| T-305 | Profile and streak | FR-12, FR-13 | P2 |
| T-306 | Admin panel part 1: grading log and progress reset (audit-logged) | FR-18.1–2 | P2 |
| T-307 | First deployment (Vercel, Render, Neon) + live smoke check — **needs PO approval** | D-037 | P1 |
| T-308 | Sprint 3 report | D-007 | P2 |

## Sprint 4 — Code and polish

| ID | Title | Req | Priority |
| --- | --- | --- | --- |
| T-401 | Code editor + JavaScript runner (inputs only to the browser, backend compares) | FR-07, D-035 | P1 |
| T-402 | Java runner through Judge0 with daily quota guard | FR-07, D-032 | P2 |
| T-403 | Leaderboard with labelled dummy players | FR-14 | P3 |
| T-404 | Placeholders: VIP page, hard test mode option, battle mode (dummy) | FR-11, FR-15, FR-16 | P3 |
| T-405 | Admin panel part 2: game config editor, users and roles, audit log view | FR-18.3–4, FR-17.6 | P2 |
| T-406 | Design pass: mockups first, PO selects, then apply | NFR-05, NFR-06 | P2 |
| T-407 | Tune XP numbers from the trial results | OQ-03, D-015 | P2 |
| T-408 | Sprint 4 report | D-007 | P2 |

## Later (unscheduled)

| ID | Title | Req |
| --- | --- | --- |
| T-501 | Hard problems and hard test mode for real | FR-11, D-024 |
| T-502 | Levels 4–17 content, about 2 levels per sprint | SRS §6 |
| T-503 | Organizations (admin invites 5 or 10 members) | FR-19, OQ-06 |
| T-504 | Withdrawn | — |
| T-505 | Move JavaScript checking to Judge0 or a server sandbox before graded organization use | D-035 |
| T-506 | Voice answers | Excluded this release |
| T-507 | Battle mode | FR-16 |
