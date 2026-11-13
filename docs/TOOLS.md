# Tools and Services — AlgoQuest

Authoritative list of tools, services, and accounts for stack option B (D-030). Free-tier facts were checked on 2026-11-06 from the sources linked; they change, so re-check before relying on a limit.

## 1. Services (all $0, D-006)

| Service | Used for | Free tier (checked 2026-11-06) | Limits that matter | Account / setup (PO) |
| --- | --- | --- | --- | --- |
| **GitHub + GitHub Actions** | Public repository (D-039), CI, smoke tests, screenshots | Actions minutes are free for public repositories on standard runners | Heavy jobs (smoke test, screenshots) still run on PRs and on demand to keep feedback fast | Exists |
| **Google Gemini API** (Flash-Lite) | AI grading (D-031) | Flash and Flash-Lite models free without billing; about 500 requests/day and 10/minute for 3.5 Flash-Lite, about 20/day and 5/minute for 3.8 Flash ([limits overview](https://www.scriptbyai.com/gemini-api-free-tier-limits/)); daily quota resets at midnight Pacific time | 3.8 Flash's daily quota is too small for regular use; free-tier prompts may be used by Google | API key from Google AI Studio |
| **Judge0 CE via RapidAPI** | Running Java code (D-032) | Basic plan: 50 submissions/day ([Judge0 CE pricing](https://judge0.com/ce)) | 50 Java runs/day; JavaScript runs in the browser and does not count | RapidAPI account + key |
| **Google OAuth client** | Sign in with Google (D-036) | Free | Redirect URIs must list local and production backend URLs | Google Cloud console: OAuth client ID/secret |
| **GitHub OAuth App** | Sign in with GitHub (D-036) | Free | One callback URL per app; use separate apps for local and production | GitHub developer settings |
| **Vercel Hobby** | Frontend hosting (D-037), when deployment is approved | Free | Personal projects (D-022) | Existing account |
| **Render free web service** | Backend hosting (D-037) | Free, 512 MB, Docker | Sleeps after 15 minutes idle; about a minute to wake | Existing account |
| **Neon Free** | PostgreSQL (D-037) | Free, scales to zero | A separate project for AlgoQuest; check the project limit of the free plan when creating it | Existing account |

Not needed in this release: email sending, analytics.

## 2. Development tools

| Area | Tool | Version | Purpose |
| --- | --- | --- | --- |
| Backend | Java (Temurin) | 21 | Language and runtime |
| Backend | Spring Boot | 4.1.x | Web MVC, Security (OAuth2 client + resource server), Validation, Data JPA, Actuator |
| Backend | Flyway | managed by Boot | Database migrations |
| Backend | Maven Wrapper | 3.9.x | Build |
| Backend | Spotless (Google Java Format) | latest stable | Format check |
| Backend | JUnit 5, Mockito, Spring MockMvc | managed by Boot | Unit and API tests (every endpoint: 401/403 cases) |
| Backend | Testcontainers (PostgreSQL) | managed by Boot | Repository and transaction tests against real Postgres |
| Frontend | Node.js | 22 LTS | Tooling |
| Frontend | React + React DOM | 19.x | UI |
| Frontend | Vite | 8.x | Dev server and build |
| Frontend | TypeScript | 5.9.x (strict) | Types |
| Frontend | React Router | 8.x | Pages |
| Frontend | CodeMirror 6 | latest stable | Code editor (JavaScript, Java) |
| Frontend | react-markdown | latest stable | Render lesson Markdown (no raw HTML) |
| Frontend | ESLint, Prettier | latest stable | Lint and format |
| Frontend | Vitest + React Testing Library + jsdom | latest stable | Unit and component tests |
| End to end | Playwright | latest stable | Smoke test in CI and review screenshots |
| Local | Docker + Docker Compose | — | Postgres 16 for local development and the smoke test |

New runtime dependencies are named in the task's merge commit.

## 3. AI tools in the workflow

| Tool | Role |
| --- | --- |
| Claude (Claude Code) | Planning, implementation on task branches, content drafts, sprint reports |
| ChatGPT | Optional second opinion on lessons and problems; never the source of truth |
| `tools/grading-test/` | Proves the grader meets NFR-03 before FR-05 is built (T-005) |

## 4. Known environment gap

Claude's workspace may not reach package registries or external APIs, so installs, builds, and tests run on **GitHub Actions**. Anything that cannot run there is reported as unverified.

## 5. Secrets (never in the repository, browser, logs, or screenshots)

| Secret | Where it lives |
| --- | --- |
| `GEMINI_API_KEY` | Render env + GitHub Actions secret (for an optional real-grader check) |
| `JUDGE0_API_KEY` | Render env |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Render env; local `.env` |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Render env; local `.env` |
| `JWT_SECRET` | Render env; local `.env` |
| `DATABASE_URL` / user / password | Render env; local `.env` |
| `OWNER_EMAIL` | Render env; local `.env` (not secret, but configuration) |
| `FRONTEND_URL` | Render env; local `.env` (not secret: sign-in redirects and CORS) |
