# Sprint 12 Report — Portfolio Preparation

| Field | Value |
| --- | --- |
| Sprint | Sprint 12 ([plan](../sprints/sprint-12.md)) |
| Dates | 2026-11-20 |
| Goal | A visitor can understand AlgoQuest from the repository page in a minute and try every level in the live app without creating an account |
| Outcome | **Goal met in code; sprint closed 2026-11-20.** Merged to `main` in pull request #35 after PO approval. The PO checks the demo button and link preview on the live app; any finding becomes a new task |

## Increment

- **Demo sign-in (D-062):** `POST /api/v1/auth/demo` creates a fresh account with the `DEMO` role (`game.play`, `game.allLevels`) and returns a one-time sign-in code; at most 40 per UTC day. `GET /api/v1/auth/options` tells the frontend whether to offer it. The header marks demo accounts.
- **Landing section:** three feature points and a "Try the demo" button on the sign-in page, in English and Vietnamese.
- **Link previews:** Open Graph and Twitter tags with a 1200 × 630 preview image.
- **Portfolio README:** live demo link, a recording of the animated BFS walkthrough, three screenshots, an architecture diagram, and engineering highlights.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-544 Demo sign-in | Endpoint, role, cap, settings, button, badge | Integration test for the account, its permissions and the daily cap; frontend tests for the flow, the cap message and the hidden button | PR #35 |
| T-545 Landing section | Feature points, demo button, translations | Frontend test; desktop and phone screenshots | PR #35 |
| T-546 Link previews | Tags and image | Production build in CI; live preview checked by the PO | PR #35 |
| T-547 Portfolio README | Live link, media, diagram, highlights | Records check; PO review | PR #35 |
| T-548 Sprint report | This document | Records check | With this report |

Review: all tasks are self-reviewed. The PO approved the pull request.

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | 206 tests, 0 failed |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright, fake grader) | Passed on `dev` |
| Records check | OK |

## Data changes

No migration. Demo accounts are ordinary `app_user` rows with provider `demo` and a `DEMO` role assignment.

## Decisions

- D-062 Demo sign-in for visitors.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Link-preview images need an absolute address, which differs per deployment | The build reads `VITE_SITE_URL`, or Vercel's production address when it is not set |

## Not done

- Deleting old demo accounts (T-549), the leaderboard (T-403).

## Next sprint

Phase 2 begins. Sprint 13: Level 12 Two Pointers (from the parked lesson, brought up to the current standard) and Level 13 Sliding Window, with a highlighted window range in the cell view.
