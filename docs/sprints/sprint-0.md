# Sprint 0 — Preparation

| Field | Value |
| --- | --- |
| Goal | An approved plan, accounts and keys ready, and proof that a free AI model can grade explanations — so Sprint 1 can start building. **No application code in this sprint** (D-008). |
| Dates | 2026-11-06 → 2026-11-13 (1 week, proposed) |
| Tasks | T-001 to T-009 (see [BACKLOG.md](../BACKLOG.md)) |
| Requirements touched | All (baseline review); NFR-03 (grading accuracy) |

## Capacity assumptions

- Claude: drafts documents and analyses the grading test results.
- PO: about 2–3 hours to review documents, decide open items, create accounts, and run the grading test.

## Dependencies and decisions needed

- T-002: D-009 (standard v1.5) and D-030 (option B) are approved; the remaining proposals (D-002–D-005, D-007, D-031–D-037) → unblock Sprint 1.
- T-003 Gemini key → unblocks T-005. Google and GitHub OAuth apps → needed by T-104 in Sprint 1.
- T-005 must pass NFR-03 before T-206 (grading) starts in Sprint 2.

## Verification approach

- Documents: PO review on `dev`; outcomes recorded in DECISIONS.md.
- Grading: `tools/grading-test` run by the PO with a real key; summary and CSV findings recorded in T-005.

## Design updates in this sprint

SRS v0.2 and ARCHITECTURE v0.2 for option B (deployment, modules, use case, level state, sign-in and grading sequences, API, ER, authorization flow).

## Sprint review

To be written at the end of the sprint in `docs/reports/sprint-0-report.md` (D-007).
