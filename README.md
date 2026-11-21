# AlgoQuest

**Don't let Algorithm beat you.**

A web app for learning the algorithm patterns used in coding interviews. Topics are levels ordered from easy to hard. Each level has a lesson and problems, and you **explain your approach in words**, the way you would in an interview. An AI grades the explanation against a teacher-written answer key; writing the code afterwards is optional and doubles your points.

> **Status: Sprint 10 done.** Levels 1–9 and 11 are playable; Level 10 is next. Live on Vercel and Render. Current checkpoint: [docs/STATUS.md](docs/STATUS.md).

## Features

- **Learning path** of 27 levels in three phases, from Big-O basics to interview practice ([curriculum map](docs/CURRICULUM-MAP.md)); each level unlocks after the previous level's test
- **Five-step lessons:** a hook and intuition question, a step-by-step walkthrough with predictions (array cells, linked-list nodes, and binary trees are drawn as they change), template code in JavaScript and Java, a quick check, and practice
- **Explain-in-words answers** graded by AI (Google Gemini) on pattern, steps, complexity, and edge cases against a teacher-written answer key
- **Optional code for double XP:** JavaScript runs in the browser against hidden tests, with `ListNode` and `TreeNode` support; Java runs on Judge0 when a key is configured
- **Pattern challenges:** choose an approach for a scenario and explain why; compare every approach's time, space, and trade-offs
- **Hints, practice round, and a timed level-up test;** XP, daily streak, and a profile page
- **English and Vietnamese interface**
- **Roles and an admin panel:** grading log, progress reset, game rules, users and roles, audit log

## Stack

React 19 + Vite + TypeScript frontend, Spring Boot 4.1 (Java 21) REST API, PostgreSQL with Flyway. AI grading with Google Gemini. JavaScript answers run in a Web Worker in the browser; Java answers run on Judge0 when `JUDGE0_API_KEY` is set (D-054). Hosted on Vercel (frontend), Render (backend), and Neon (database).

## Run locally

You need Git, [Docker Desktop](https://www.docker.com/products/docker-desktop/), Java 21, and Node.js 22.

1. **Settings.** Copy the example file and fill in the values you have (Google or GitHub sign-in keys are needed to sign in locally):

   ```bash
   cp .env.example .env        # Windows: copy .env.example .env
   ```

2. **Database.** Start PostgreSQL 16 in Docker:

   ```bash
   docker compose up -d
   ```

3. **Backend** (API on <http://localhost:8080>; check <http://localhost:8080/actuator/health>):

   ```bash
   cd backend
   ./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
   ```

   The first run downloads Maven and the dependencies, which takes a few minutes.

4. **Frontend** (in a second terminal; app on <http://localhost:5173>):

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

The shared components are shown at <http://localhost:5173/ui-kit>.

### Checks

| Part | Command | Notes |
| --- | --- | --- |
| Backend | `./mvnw verify` in `backend/` | Formatting, tests, build; tests start their own database, so Docker must be running |
| Frontend | `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build` in `frontend/` | Same steps as CI |
| Records | `node scripts/check-records.mjs` | Links, IDs, and record style (D-038) |
| Real grader | `./mvnw test -Dtest='RealGraderCheck,RealPatternGraderCheck' -DexcludedGroups=none` in `backend/` (Windows: `mvnw.cmd`) | Calls Gemini with `GEMINI_API_KEY` from `.env`: prints scores and latency for sample explanations and pattern answers (about 2 minutes; uses about 11 free-tier requests). In CI: run the `grader-check` workflow by hand; it reads the `GEMINI_API_KEY` repository secret |
| Smoke | `smoke` workflow on GitHub Actions | Production builds, Postgres, and Playwright end to end with a fake grader |

To stop the database: `docker compose down` (add `-v` to delete its data).

## Documentation

| Document | What it covers |
| --- | --- |
| [SRS](docs/SRS.md) | Product definition and requirements |
| [Architecture](docs/ARCHITECTURE.md) | Components, UML views, data model |
| [Decisions](docs/DECISIONS.md) | Approved and proposed decisions |
| [Backlog](docs/BACKLOG.md) | Sprint roadmap and tasks |
| [Workflow](docs/WORKFLOW.md) | Branching, reviews, engineering profile |
| [Tools](docs/TOOLS.md) | Services, free-tier limits, dev tools |
| [Content guide](docs/CONTENT-GUIDE.md) | How lessons and problems are written |
| [Curriculum map](docs/CURRICULUM-MAP.md) | How the original 17 levels map to the 27-level curriculum; fixed level numbers |
| [Multilingual content](docs/MULTILINGUAL-CONTENT.md) and [i18n foundation](docs/I18N-FOUNDATION.md) | Vietnamese lesson files and UI translation |
| [Status](docs/STATUS.md) and [sprint reports](docs/reports/) | Current checkpoint and what each sprint delivered |
| [Deployment](docs/DEPLOY.md) | Hosting setup, live smoke check, rollback |

## Grading test

[`tools/grading-test`](tools/grading-test) was used before grading was built to check that a free AI model scores sample explanations close to the expected scores (T-005). The `grader-check` workflow now does the same check against the real grader.
