# Sprint 1 Report — Foundations

| Field | Value |
| --- | --- |
| Sprint | Sprint 1 ([plan](../sprints/sprint-1.md)) |
| Dates | 2026-11-07 (planned 2026-11-07 → 2026-11-14) |
| Goal | A signed-in Owner or Player sees an empty level map, with skeletons, CI, local database, sign-in, and permission checks in place |
| Outcome | **Goal met in CI.** All seven tasks delivered. The manual sign-in check with the real Google and GitHub apps is still open (PO) |

## Increment

- `backend/` (Spring Boot 4.1.0, Java 21), `frontend/` (React 19, Vite 8, TypeScript 5.9), `docker-compose.yml`, `e2e/`, and four CI workflows (`backend.yml`, `frontend.yml`, `docs.yml`, `smoke.yml`) on `dev`.
- Sign-in with Google or GitHub, one-time code exchange, 4-hour token, sign-out. The level map shell shows the header with zero values.
- Roles and permissions: the `OWNER_EMAIL` account is Owner and can call `GET /api/v1/admin/users`; a Player gets 403.
- Violet design tokens with a remembered dark/light toggle; shared UI components.

## Results by task

| Task | Implemented | Verified | Merged to `dev` |
| --- | --- | --- | --- |
| T-101 Backend skeleton and CI | Module packages, Flyway baseline, health, RFC 9457 errors, Spotless, Dockerfile, records check (D-038) | `backend` and `docs` workflows | Yes |
| T-102 Frontend skeleton | Router, design tokens, shared components, API client with retry and "waking the server" state | `frontend` workflow; screenshots of the UI kit in dark, light, and 390 px widths | Yes |
| T-103 Local development | `docker-compose.yml`, `.env.example`, README "Run locally" | `local-dev` CI job follows the README backend steps to a healthy `/actuator/health` | Yes |
| T-105 Access core | Permission catalogue, scoped role assignments, Owner seeding, last-Owner rule, append-only audit log, 401/403 problem details | Integration tests on PostgreSQL for every rule; MockMvc 401, 403, 200 | Yes |
| T-104 Sign-in | OAuth2 login, hashed one-time code (60 s, single use), HMAC JWT, `/api/v1/me`, CORS, sign-in and callback pages, route guard | Backend and frontend tests; smoke run. Manual check with real providers: **open (PO)** | Yes |
| T-106 Smoke workflow | PostgreSQL + backend image (smoke profile) + production frontend + Playwright; screenshots as an artifact | Run 42447092178: 4 Playwright tests passed | Yes |
| T-107 Sprint report | This document | Records check | Yes |

Review: all tasks are self-reviewed. Independent review happens when the PO reviews the `dev → main` pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, Testcontainers PostgreSQL 16) | 42 tests, 0 failed; Spotless clean; Docker image builds |
| Frontend (lint, format, typecheck, Vitest, build) | All green |
| Local development (`local-dev` job) | Backend healthy following the README steps |
| Smoke (`smoke.yml`, run 42447092178) | 4 passed: sign-in page in both themes; Owner signs in, sees the level map, gets 200 from the admin endpoint, signs out; Player gets 403; phone viewport |
| Records check and self-test | OK |

Screenshots are in the `smoke-screenshots` artifact of the smoke run: `sign-in-dark.png`, `sign-in-light.png`, `level-map.png`, `level-map-phone.png`.

## Problems and fixes

| Problem | Effect | Fix |
| --- | --- | --- |
| CI run steps piped output into `tee` without `pipefail` | A failing command (tests, lint, formatting) did not fail its step, so results from T-101 to T-103 were reported green without that guarantee | All workflows run bash with `-eo pipefail`; every check was re-run and passed. The re-run exposed the next problem |
| A new user was not flushed before the login code referenced it | Sign-in would fail when user creation and code issue share a transaction | Sign-in flushes the user; covered by the sign-in flow tests |
| The development workspace cannot reach the npm and Maven registries | No local install or build; `package-lock.json` could not be generated locally | A temporary CI workflow generated the lockfile once and was removed; builds and tests run in CI |
| Empty OAuth client IDs in `.env` stopped the backend from starting | `local-dev` job failed | `.env.example` uses the placeholder `not-configured`; sign-in fails until real values are set, but the app starts |
| Task branches could not be deleted from the workspace | Stale branches accumulated on GitHub | Task branches stay local; CI runs on the shared branch `ci/claude` (WORKFLOW.md) |
| React Hooks lint rule `set-state-in-effect` | Lint failure in the auth provider | The signed-in user loads in request callbacks instead of the effect body |

## Not done

- Manual sign-in with the real Google and GitHub OAuth apps (PO). Steps: README "Run locally" with real client IDs, `OWNER_EMAIL`, and `JWT_SECRET` in `.env`.
- Smoke screenshots are not yet produced on pull requests, because no `dev → main` pull request has been opened in this sprint.

## Decisions

No new decisions. Work followed D-030, D-034, D-036, and D-038.

## Next sprint

Sprint 2 — first playable level: content loading and validation, level map from the API, lesson page, explanation answers graded by Gemini (T-201 to T-208, [BACKLOG.md](../BACKLOG.md)). The Sprint 2 plan is proposed to the PO before work starts.
