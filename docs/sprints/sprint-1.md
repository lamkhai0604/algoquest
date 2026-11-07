# Sprint 1 — Foundations

| Field | Value |
| --- | --- |
| Status | **Proposed** — starts when the PO approves this plan (T-003 done 2026-11-07) |
| Goal | A signed-in Owner or Player sees an empty level map. Backend and frontend skeletons, CI, local database, sign-in with Google and GitHub, and permission checks are in place. |
| Duration | About 1 week; dates set on approval |
| Tasks | T-101 to T-107 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-01, FR-17, NFR-02, NFR-05, NFR-08; decisions D-030, D-034, D-036, D-038 |

## Increment at the end of the sprint

- `backend/`, `frontend/`, `docker-compose.yml`, and four CI workflows (`backend.yml`, `frontend.yml`, `docs.yml`, `smoke.yml`) on `dev`.
- Locally: sign in with Google or GitHub, land on a level map shell with the header (streak, XP, hints show zero values), sign out.
- The Owner account (from `OWNER_EMAIL`) can call an admin test endpoint; a Player gets 403.
- Screenshots of the sign-in page and the empty level map from the smoke run.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-101 Backend skeleton + records check | Maven project (Spring Boot 4.1, Java 21); packages `access`, `content`, `game`, `game.domain`, `grading`, `runner`, `admin`, `config`; Flyway V1 (empty baseline); `/actuator/health`; RFC 9457 error handler; Spotless; Dockerfile; `backend.yml`; `docs.yml` with `scripts/check-records` | `./mvnw verify` green; image builds; records check fails on a seeded violation and passes on the clean tree | CI runs |
| 2 | T-102 Frontend skeleton | Vite + React 19 + TS strict; React Router; design tokens from the UI draft (colors, type, spacing, radii); shared components (Button, Card, XpBar, Badge, Chip, LoadingState, ErrorState, WakingServer); API client with retry; `frontend.yml` | lint, format, typecheck, tests, build green; components have unit tests | CI runs |
| 3 | T-103 Local development | `docker-compose.yml` (Postgres 16), `.env.example` (every variable from TOOLS.md §5, no values), README "Run locally" | A fresh clone starts both apps by following the README | Smoke workflow (T-106) follows the same steps |
| 4 | T-105 Access core | `app_user`, `role_assignment` (with scope), `audit_log` tables (Flyway V2); permission catalogue; `PermissionEvaluator`; Owner seeding from `OWNER_EMAIL`; last-Owner rule; audit writer | Unit tests for every permission rule; MockMvc: 401 without token, 403 for Player on an admin endpoint, 200 for Owner; last Owner cannot be removed | CI (Testcontainers) |
| 5 | T-104 Sign-in | OAuth2 login (Google, GitHub); `login_code` table (V3); one-time code exchange; HMAC JWT (4 h); `/api/v1/me`; sign-out; frontend sign-in page, callback page, route guards | Code is single-use and expires after 60 s; JWT never in a URL; new user gets Player; `OWNER_EMAIL` user gets Owner | CI tests; manual check by the PO with real OAuth apps |
| 6 | T-106 Smoke workflow | Compose Postgres + backend image + Vite + Playwright; a test-only login profile replaces OAuth in CI (disabled outside the `smoke` profile); screenshots uploaded as artifacts | Runs on PRs and on demand; fails if the level map does not load after sign-in | CI run with screenshots |
| 7 | T-107 Sprint 1 report | `docs/reports/sprint-1-report.md` | Implemented, verified, reviewed, merged listed separately | — |

T-105 comes before T-104 so that sign-in creates users through the access module from the start.

## Capacity and dependencies

- Claude: implementation and tests on task branches; everything is verified in GitHub Actions because the workspace cannot run Docker or reach package registries reliably.
- PO: review of the `dev → main` pull request; one manual sign-in check with real Google and GitHub apps (about 15 minutes).
- Depends on T-003 (OAuth client IDs and secrets in a local `.env` for the manual check). CI does not need them.
- Not needed yet: Gemini, Judge0, Neon, Render, Vercel.

## Risks

| Risk | Mitigation |
| --- | --- |
| Spring Boot 4.1 OAuth2 configuration differs from older examples | Follow current Spring Security reference; integration tests for the login success handler |
| Slow CI feedback | Path filters; smoke only on PRs and on demand |
| Test-only login leaking into production | Bean active only under the `smoke` profile; a test asserts it is absent in the default profile |

## Design updates in this sprint

ARCHITECTURE §3 package list confirmed in code; engineering profile tool versions confirmed (WORKFLOW.md).

## Sprint review

Written at the end of the sprint in `docs/reports/sprint-1-report.md` (D-007).
