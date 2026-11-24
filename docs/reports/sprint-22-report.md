# Sprint 22 Report — Notes

| Field | Value |
| --- | --- |
| Sprint | Sprint 22 ([plan](../sprints/sprint-22.md)) |
| Dates | 2026-11-22 to 2026-11-23 |
| Goal | The PO keeps private notes in AlgoQuest: writes them in a simple rich-text editor, finds them again, links them to levels, and can download them all |
| Outcome | **Goal met; sprint closed 2026-11-23.** Notes merged to `main` in pull request #52; owner-only sign-in in #51 and #53; lesson images in #54 |

## Increment

- **Notes in the navigation:** Map · Knowledge · Notes, for accounts with `notes.manage`.
- **Note list:** search in titles and text, tag filter, "New note", and "Download all (.zip)" as Markdown files.
- **Editor (TipTap):** bold, italic, underline, three text sizes, lists, code blocks and links; saves about a second after typing stops.
- **Level page:** the notes linked to the level and a button that starts one.
- **Owner-only sign-in (D-073):** email and a password set on Render; Google, GitHub and demo sign-in off by default.
- **Lesson images:** seven decorative images at the top of the Problem hook of Levels 2, 3, 5, 6, 8, 9 and 10.

## Results by task

| Task | Implemented | Verified | Merged to `main` |
| --- | --- | --- | --- |
| T-605 Owner sign-in | Password sign-in, lock after 5 wrong attempts, OAuth and demo off by default | Backend and frontend tests; PO review | PRs #51, #53 |
| T-606 Notes backend | `note` table, owner-scoped API, Markdown zip export | Backend tests; PO review | PR #52 |
| T-607 Notes frontend | List, search, tag filter, editor with autosave, delete | Frontend tests; PO review | PR #52 |
| T-608 Level notes | Notes section on the level page | Frontend test; PO review | PR #52 |
| T-603 Lesson images | Seven WebP images, 1600 px wide, with alt text | Content test checks each file; PO review | PR #54 |
| T-609 Report | This document | Records check | With this report |

## Verification evidence

| Check | Result |
| --- | --- |
| Backend (`./mvnw verify`, PostgreSQL 16) | Green, including notes and password sign-in tests |
| Frontend (lint, format, typecheck, tests, build) | Green |
| Records check | OK |

## Data changes

Migration V15 adds the `note` table.

## Decisions

- D-073 Owner-only sign-in with email and password.
- D-074 Personal notes.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| The sign-in page showed no method on the live site | The page now says when no method is turned on and names the settings to set; the PO set `OWNER_PASSWORD` on the right service |
| Lesson images had a heavy frame | Image figures have no frame |

## Next

Sprint 23: a shared guest account and quick notes on the lesson page.
