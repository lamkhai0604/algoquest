# Sprint 0 Report — Preparation

| Field | Value |
| --- | --- |
| Sprint | Sprint 0 ([plan](../sprints/sprint-0.md)) |
| Dates | 2026-11-06 → 2026-11-07 (planned to 2026-11-13) |
| Goal | An approved plan, accounts and keys ready, and proof that a free AI model can grade explanations |
| Outcome | **Goal met.** All nine tasks done; no application code written (D-008) |

## Results by task

| Task | Result | Evidence |
| --- | --- | --- |
| T-001 Baseline planning docs and grading test kit | Done | SRS, ARCHITECTURE, BACKLOG, DECISIONS, TOOLS, WORKFLOW, CONTENT-GUIDE on `dev`; `tools/grading-test/` |
| T-002 Review and approve the planning baseline | Done | All decisions approved 2026-11-06; SRS and ARCHITECTURE at v1.0 |
| T-003 Accounts and keys | Done | Gemini, Google OAuth client, GitHub OAuth App (local), Neon project, RapidAPI; keys held outside the repository |
| T-004 Repository settings | Done | Verified through the GitHub API: public (D-039); ruleset on `main` active |
| T-005 Grading test | Done | NFR-03 met (see below) |
| T-006 Roles, admin panel, organization groundwork | Done | FR-17 to FR-19; ARCHITECTURE §9; D-034 |
| T-007 Redesign for option B | Done | D-030; architecture, tools, engineering profile, sprint plans |
| T-008 Professional record style | Done | Records follow internal guidelines §3; records check planned in CI (D-038, T-101) |
| T-009 internal guidelines pin | Done | D-009, |

## Grading test (NFR-03)

Model `gemini-3.5-flash-lite`, 20 sample explanations across 6 problems from levels 1 to 3, run against the real API on 2026-11-07.

| Criterion | Target | Run 1 (prompt v1) | Run 2 (prompt v2) |
| --- | --- | --- | --- |
| Average absolute difference from expected score | ≤ 8 | 4.8 | **3.8** |
| Answers off by more than 10 | ≤ 3 | 4 | **2** |
| Pass/fail agreement | ≥ 19/20 | 16/20 | **19/20** |

Prompt v2 makes the model trace the learner's steps on an example before scoring. This fixed a missed logic error (S20) and two disagreements on step quality (S16, S19). D-031 is confirmed.

Follow-ups for T-206 (grading feature):

- S09: a wrong stated complexity also lowered the steps score (−30 instead of −10).
- S12: scored 20 above the expected value; both results were still a fail.
- NFR-04 (latency) was not measured; it is measured in T-206.

## Decisions made in this sprint

D-002 to D-024 and D-030 to D-038 approved on 2026-11-06. D-009 superseded D-001 (internal guidelines). D-039 superseded D-023 (public repository) on 2026-11-07.

## Problems and fixes

| Problem | Fix |
| --- | --- |
| Free-tier quota of `gemini-3.8-flash` (about 20 requests/day) ran out during the grading test | Switched to `gemini-3.5-flash-lite` (about 500 requests/day); the script paces requests and stops on a daily-quota error |
| Temporary API errors (HTTP 503 and 429) interrupted runs | Retries with backoff, request timeout, and `RESUME=1` to continue from the previous results file |
| Branch protection is not available for private repositories on the GitHub Free plan | Repository made public (D-039) |

## Carried into Sprint 1

- Production OAuth apps are created when deployment is approved (D-037).
- Violet light/dark theme tokens from the design canvas are applied in T-102.

## Next sprint

Sprint 1 ([plan](../sprints/sprint-1.md)) is Proposed and starts when the PO approves it.
