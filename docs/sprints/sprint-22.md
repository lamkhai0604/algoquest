# Sprint 22 — Notes

| Field | Value |
| --- | --- |
| Status | Approved by the PO on 2026-11-22, after a review of mockups |
| Goal | The PO keeps private notes in AlgoQuest: writes them in a simple rich-text editor, finds them again, links them to levels, and can download them all |
| Duration | About 2 days from approval |
| Tasks | T-606, T-607, T-608, T-609 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-17; decisions D-073, D-074 |

## Increment at the end of the sprint

- **Notes in the navigation:** Map · Knowledge · Notes.
- **Note list:** cards with title, preview, tags, linked level and last change; search in titles and text; filter by tag; "New note"; "Download all (.zip)".
- **Editor:** title, linked level, tags; toolbar with bold, italic, underline, large heading, small heading, normal text, bullet list, numbered list, code block and link; saves on its own; delete asks first.
- **Level page:** the notes linked to the level, and a button that starts a note for it.
- **Privacy:** only the Owner reaches notes, and only their own.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-606 Backend | Migration, store, service, controller, export | Players get 403; another account's note is never shown; bad titles, tags, levels, documents and links are refused; the export is a zip of Markdown files | Backend tests |
| 2 | T-607 Frontend | Navigation, list, editor, i18n | Search and tag filter work; the toolbar formats text; changes save on their own; delete asks first; works on a phone | Frontend tests; screenshots |
| 3 | T-608 Level page | Notes section | The level's notes are listed; "New note" opens the editor with the level set | Frontend tests; screenshots |
| 4 | T-609 Report | Sprint report | — | Records check |

Out of scope: images in notes; sharing notes; notes for other accounts.

## Risks

| Risk | Handling |
| --- | --- |
| Lost work if a save fails | The editor shows "Not saved" and retries on the next change; the note stays on screen |
| Unsafe links in stored documents | The server accepts only http, https and mailto links |
| Notes kept in one place only | Download all as Markdown files at any time |

## Work for the PO

- Review the Notes screens with the checklist; merge the pull request.
