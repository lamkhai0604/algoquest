# Sprint 23 — Guest account and quick notes

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-23 |
| Goal | One or two testers sign in with a shared guest account and learn without seeing the Owner's notes; any learner with notes writes an idea down without leaving the lesson |
| Duration | About 1 day from approval |
| Tasks | T-610, T-611, T-612 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-01, FR-03, FR-17; decisions D-075, D-076 |

## Increment at the end of the sprint

- **Guest sign-in:** the sign-in form accepts the guest email and password set on Render. The guest learns, earns XP and keeps notes; the Notes page and the admin pages never show the Owner's data.
- **Quick notes:** a Note button beside the lesson title opens a panel at the side (bottom sheet on a phone) with this level's notes and the editor. The lesson stays in view; notes save on their own.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-610 Guest account | Settings, role, sign-in, deploy notes | The guest signs in; has `game.play` and `notes.manage` only; gets 403 on admin endpoints; cannot list or open the Owner's notes; the guest password does not open the Owner account; a guest email equal to the Owner's is refused | Backend tests |
| 2 | T-611 Quick notes | Button, panel, compact editor, i18n, styles | Hidden without `notes.manage`; opens beside the lesson; lists the level's notes; a new note is saved with the level; N and Escape work; works on a phone | Frontend tests; review on the live site |
| 3 | T-612 Report | Sprint report | — | Records check |

Out of scope: one account per tester; a separate grading limit for the guest; tags and delete in the quick panel.

## Risks

| Risk | Handling |
| --- | --- |
| Testers share the guest account and see each other's notes | Accepted by the PO for one or two testers; per-tester accounts can come later |
| The guest password leaks | Change `GUEST_PASSWORD` on Render, or clear both settings to turn the guest off |
| The panel covers part of the lesson on small screens | On a phone it is a sheet over the lower 60% of the screen and closes with one tap |

## Work for the PO

- On Render (`algoquest-api`), add `GUEST_ACCOUNT` = `guest@algoquest.app` and `GUEST_PASSWORD` (at least 12 characters), then save.
- Review the guest sign-in and quick notes with the checklist; merge the pull request.
