# Project Contributor Entry Point

Project: AlgoQuest — gamified algorithm-learning web app
Standard: internal engineering guidelines the private repository the internal guidelines repository (D-009, D-003). Contributors need access to that repository; a local copy may be placed in `docs/standard/`, which is git-ignored.
Adoption: Approved — Product Owner, 2026-11-06 (D-009). The remaining planning baseline is under review (T-002).

## Read before work

1. This file
2. `docs/STATUS.md`: current checkpoint and next action
3. `docs/SRS.md`: product definition and requirements
4. `docs/ARCHITECTURE.md`: components, boundaries, UML views
5. `docs/DECISIONS.md`: approved and proposed decisions
6. `docs/BACKLOG.md`: sprint roadmap, assigned task, acceptance criteria
7. `docs/WORKFLOW.md`: branching, review, engineering profile, commands
8. `docs/TOOLS.md`: tools, services, free-tier limits, required accounts
9. `docs/CONTENT-GUIDE.md`: how lessons and problems are written

Then verify the actual repository state (branch, latest commit, uncommitted changes, open PRs) before making changes. Never invent repository state, test results, or approvals.

## Permissions (D-004, proposed)

Implementation: tasks marked Ready in BACKLOG.md, within their acceptance criteria. No application code until the planning baseline is approved (D-008).
Branch / commit / merge: one task branch per task, cut from `dev` and named per WORKFLOW.md; merged into `dev` when its checks pass
`main`: protected; changed only through a `dev → main` pull request merged by the Product Owner
Deployment / release: Product Owner approval required
Paid services / destructive actions: not permitted without explicit Product Owner approval (D-006)
Delegation / external communication: through the Product Owner

## Project-specific rules

Engineering profile: `docs/WORKFLOW.md`
Record style: professional and neutral (WORKFLOW.md, Records)
Approved exceptions: none
