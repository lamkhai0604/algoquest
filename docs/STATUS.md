# Current Checkpoint

| Field | Value |
| --- | --- |
| Updated | 2026-11-07 |
| Sprint | Sprint 1 — Foundations ([plan](sprints/sprint-1.md)), approved 2026-11-07. Sprint 0 complete ([report](reports/sprint-0-report.md)) |
| Repository | `lamkhai0604/algoquest` (public, D-039); branches `main` (protected by ruleset) and `dev` |
| Active work | T-101, T-102, T-103, T-105 done. Next: T-104 sign-in with Google and GitHub |
| Source revision | `dev` (see `git log dev`) |
| Outstanding changes | None |
| Verification | GitHub Actions on 2026-11-07: `backend` (./mvnw verify with Testcontainers, Docker image build), `frontend` (lint, format, typecheck, tests, build), and `docs` (records check and self-test) green. Sprint 0 grading test: NFR-03 met. |
| Blockers | None |
| Next action | T-104 sign-in (OAuth2, one-time code, JWT, /api/v1/me, sign-in pages) |
