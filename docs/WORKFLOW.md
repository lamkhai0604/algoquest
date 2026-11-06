# Workflow and Engineering Profile — AlgoQuest

Status: **Proposed** (D-004, D-005, D-007); stack approved (D-030).

## Branching and merges

- **`main`** is protected and always demo-ready. It changes only through a `dev → main` pull request reviewed and merged by the Product Owner (PO).
- **`dev`** is the integration branch.
- Every task gets its own branch cut from the latest `dev`: `feat/T-206-grading`, `fix/T-xxx-...`, `docs/T-xxx-...`, `chore/T-xxx-...`, `test/T-xxx-...`, `content/T-xxx-...`.
- When the task's checks pass (lint, format, type check, tests, build, content validation; for documentation, link and ID consistency), the contributor merges the branch into `dev` with `--no-ff` and pushes `dev`.
- Commits follow Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`, `content:`) and reference the task ID.
- The merge commit states the task ID, the problem, the resulting behavior, how it was verified, security or data implications, and whether review was self-review.
- The PO reviews accumulated work in the `dev → main` pull request (independent review). Findings are classified Blocker / Major / Minor / Nit; unresolved Blocker or Major findings prevent merge.

## Task flow

Proposed → Ready → In Progress → In Review → Done in [BACKLOG.md](BACKLOG.md). Done requires met acceptance criteria and recorded evidence (command, environment, commit, result). Merge and release are tracked separately.

## Records

- Repository records follow internal guidelines §3 (Record Style and Audience): English, written as professional engineering documents: facts, decisions, rationale, and evidence, without conversation transcripts, quotes, personal details, or links to private workspaces.
- Approvals are recorded as "Approved — PO, date".
- Significant changes to design, rules, or workflow are proposed to the PO before they are applied.
- Frontend tasks include CI-generated screenshots as review evidence.

## Sprint reports (D-007)

Each sprint ends with `docs/reports/sprint-N-report.md`: goal and outcome, delivered work with evidence, implemented vs. verified vs. reviewed vs. merged, decisions, problems, what is not done, next sprint.

## Engineering profile — option B (D-030), finalised in Sprint 1

```text
Languages, versions, platforms:
  Backend: Java 21, Spring Boot 4.1.x, Maven Wrapper, PostgreSQL 16 (local) / Neon (hosted).
  Frontend: TypeScript 5.9 strict, React 19, Vite 8, Node 22 LTS. Evergreen browsers, 360 px minimum width.
Style, formatter, linter, commands:
  Backend: Spotless (Google Java Format) -> ./mvnw spotless:check
  Frontend: ESLint + Prettier -> npm run lint / npm run format:check / npm run typecheck
Architecture, boundaries, dependency direction:
  ARCHITECTURE.md §3–4: modular monolith; controllers -> services -> repositories;
  modules talk only through public services; game.domain has no Spring or I/O;
  authorization only through the access module (never in game.domain).
Error handling, logging, state, concurrency:
  RFC 9457 problem details; no stack traces, tokens, or keys in responses or logs;
  one transaction per graded attempt, idempotent by attemptId; Flyway for every schema change.
Dependency management:
  Maven versions managed by the Spring Boot parent; package-lock.json committed, npm ci in CI;
  new runtime dependencies named in the merge commit.
Tests and commands:
  Backend: ./mvnw verify (JUnit 5, MockMvc with 401/403 cases per endpoint, Testcontainers, content validation)
  Frontend: npm test (Vitest + React Testing Library), npm run build
  Smoke: docker compose Postgres + backend image with FakeGrader + Vite + Playwright headless + screenshots
  Grading accuracy: tools/grading-test (manual, needs a Gemini key)
Required CI checks and branch protection:
  backend.yml and frontend.yml on every push and PR into dev/main (path-filtered);
  smoke.yml on PRs and on demand (private repo minutes, D-023). Branch protection on main is configured by the PO (T-004).
Review, merge, release, communication:
  The PO reviews and merges dev -> main; every deployment needs PO approval.
Authorized delegation and permissions:
  D-004.
Quality thresholds:
  No numeric coverage threshold. Every Must requirement has tests for its acceptance criteria;
  every endpoint has an unauthorized (401) and a forbidden (403) test.
Approved exceptions and tracked debt:
  None yet.
```
