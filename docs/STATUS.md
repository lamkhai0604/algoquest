# Current Checkpoint

| Field | Value |
| --- | --- |
| Updated | 2026-11-09 |
| Sprint | Sprint 3 — Levels 1–3 test build: done except T-307 ([plan](sprints/sprint-3.md), [report](reports/sprint-3-report.md)) |
| Repository | `lamkhai0604/algoquest` (public, D-039); branches `main` (protected by ruleset) and `dev` |
| Active work | T-307 first deployment (approved by the PO on 2026-11-09): `render.yaml`, `frontend/vercel.json`, and the [runbook](DEPLOY.md) are ready; hosting accounts are set up by the PO |
| Source revision | `dev` (see `git log dev`) |
| Outstanding changes | None |
| Verification | GitHub Actions on 2026-11-09: backend 160 tests, 0 failed; frontend lint, format, typecheck, tests, build; smoke 5 passed; records check |
| Blockers | None for the configuration; the deployment itself needs the PO to create the Neon, Render, and Vercel projects and the production OAuth apps |
| Next action | PO: follow [DEPLOY.md](DEPLOY.md) steps 1–5 after merging the `dev → main` pull request; then the live smoke check |
