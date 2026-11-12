# Current Checkpoint

| Field | Value |
| --- | --- |
| Updated | 2026-11-09 |
| Sprint | Sprint 3 — Levels 1–3 test build: done except T-307 ([plan](sprints/sprint-3.md), [report](reports/sprint-3-report.md)) |
| Repository | `lamkhai0604/algoquest` (public, D-039); branches `main` (protected by ruleset) and `dev` |
| Active work | T-309 trial feedback round done on `dev` (D-040 to D-044); T-307 first deployment live (Vercel, Render, Neon) |
| Source revision | `dev` (see `git log dev`) |
| Outstanding changes | None |
| Verification | GitHub Actions on 2026-11-12: backend 162 tests, 0 failed; frontend lint, format, typecheck, tests, build; smoke 5 passed; records check |
| Blockers | None for the configuration; the deployment itself needs the PO to create the Neon, Render, and Vercel projects and the production OAuth apps |
| Next action | PO: review the `dev → main` pull request; after the merge, Render and Vercel deploy it; play Level 1 again on the live site |
