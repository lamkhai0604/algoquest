# Sprint 23 Report — Guest Account and Quick Notes

| Field | Value |
| --- | --- |
| Sprint | Sprint 23 ([plan](../sprints/sprint-23.md)) |
| Dates | 2026-11-23 |
| Goal | One or two testers sign in with a shared guest account and learn without seeing the Owner's notes; any learner with notes writes an idea down without leaving the lesson |
| Outcome | **Goal met; sprint closed 2026-11-23.** Merged to `dev` in pull request #60 and to `main` in #59, together with the merge sort figure (#57), the truth tables lesson (#55, #56) and the smoke test fix (#58) |

## Increment

- **Guest account (D-075):** `GUEST_ACCOUNT` and `GUEST_PASSWORD` on Render; the `GUEST` role learns and keeps its own notes only.
- **Quick notes (D-076):** a Note button beside the lesson title opens a side panel (a bottom sheet on a phone) with the level's notes and a compact editor; N toggles it and Escape closes it.
- **Merge sort figure:** six frames in the Level 7 lesson.
- **Smoke test:** opens the account menu before looking for the user name and the language select.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-610 Guest account | Settings, role, sign-in, deploy notes | Backend tests: permissions, 403 on admin, Owner notes hidden, guest password cannot open the Owner account; PO checked on the live site | PRs #60, #59 |
| T-611 Quick notes | Button, floating copy, panel, compact editor, keys | Frontend tests; PO review | PRs #60, #59 |
| T-612 Report | This document | Records check | With this report |

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | Green |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Smoke (Playwright) | Green again after the account-menu fix |
| Records check | OK |

## Data changes

None. The guest account is created on its first sign-in.

## Decisions

- D-075 A shared guest account.
- D-076 Quick notes on the lesson page.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Smoke had failed on `dev` since the header moved the name and language into the account menu | The smoke run opens the account menu first |
| A merge used an older head of the branch and left the smoke fix out | The fix went to `dev` in its own pull request (#58) |
| Java formatting failed the first backend run | Formatting applied; tests had passed |

## Next

Sprint 24: running code lines and the recursion staircase in walkthroughs.
