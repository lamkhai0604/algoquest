# Sprint 12 — Portfolio Preparation

| Field | Value |
| --- | --- |
| Status | **Closed 2026-11-20** ([report](../reports/sprint-12-report.md)). Approved by the PO on 2026-11-20 |
| Goal | A visitor, such as a recruiter, can understand AlgoQuest from the repository page in a minute and try every level in the live app without creating an account |
| Duration | About 1 week from approval |
| Tasks | T-544, T-545, T-546, T-547, T-548 ([BACKLOG.md](../BACKLOG.md)) |
| Requirements | FR-01, FR-17; decision D-062 |

## Increment at the end of the sprint

- **Demo sign-in (D-062):** a "Try the demo" button on the sign-in page creates a temporary demo account with every level open, without Google or GitHub. The number of new demo accounts per day is capped.
- **Landing section:** the sign-in page says in three short points what the app does, so a first-time visitor knows what they are signing in to.
- **Link previews:** a shared link to the app shows a title, a description and a preview image.
- **Portfolio README:** a live demo link, an animated walkthrough recording, screenshots of the main screens, an architecture diagram, and engineering highlights with test numbers.

## Task plan

| Order | Task | Scope | Acceptance criteria | Verification |
| --- | --- | --- | --- | --- |
| 1 | T-544 Demo sign-in | `POST /api/v1/auth/demo`, the `DEMO` role, a daily cap and an on/off setting; the button and a "Demo" badge in the header | A demo account opens every available level; the cap returns HTTP 429 with a clear message; turning the setting off removes the button | Backend API tests; frontend tests; smoke |
| 2 | T-545 Landing section | Three feature points and the demo button on the sign-in page, in English and Vietnamese | Fits a 375 px phone; sign-in buttons stay first-class | Frontend tests; screenshots |
| 3 | T-546 Link previews | Open Graph and Twitter tags, a 1200 × 630 preview image | Tags carry the site name from `VITE_APP_NAME` | Build output check |
| 4 | T-547 Portfolio README | Live link, recording, screenshots, architecture diagram, highlights | Images are stored in the repository; the diagram renders on GitHub | Records check; PO review |
| 5 | T-548 Sprint 12 report | `docs/reports/sprint-12-report.md` | Implemented, verified, reviewed, merged listed separately | Records check |

Out of scope: deleting old demo accounts (later, with an admin action), the leaderboard (T-403), Phase 2 levels.

## Risks

| Risk | Handling |
| --- | --- |
| Demo accounts could use up the AI grading quota | A daily cap on new demo accounts; grading already fails gracefully when the quota is used up |
| Demo accounts pile up in the database | Each is one row plus its progress; the admin user list marks them, and a cleanup action is planned |
| Screenshots go stale as the UI changes | Images are regenerated from the app with one script and dated in the README |

## Work for the PO

- Try the demo button on the live app after the merge, and review the README on GitHub.
