# AlgoQuest

**Don't let Algorithm beat you.**

A web app for learning the algorithm patterns used in coding interviews. Topics are levels ordered from easy to hard. Each level has a lesson and problems, and you **explain your approach in words**, the way you would in an interview. An AI grades the explanation against a teacher-written answer key; writing the code afterwards is optional and doubles your points.

> **Status: planning (Sprint 0).** No application code yet. Current checkpoint: [docs/STATUS.md](docs/STATUS.md).

## Planned features (first release)

- Level map from Big-O basics to dynamic programming, with an XP bar per level
- Lessons: intuition, when to use the pattern, step-by-step walkthrough, template code, common mistakes
- Explain-in-words answers graded by AI on pattern, steps, complexity, and edge cases
- Hints (limited), practice round, and a timed level-up test that unlocks the next level
- Optional code in JavaScript or Java for double XP
- Profile, daily streak, and a leaderboard (demo players for now)
- Sign-in with roles and a small admin panel (grading log, progress reset, game settings)

## Stack

React 19 + Vite + TypeScript frontend, Spring Boot 4.1 (Java 21) REST API, PostgreSQL. AI grading with Google Gemini; Java code runs on Judge0.

## Run locally

You need Git, [Docker Desktop](https://www.docker.com/products/docker-desktop/), Java 21, and Node.js 22.

1. **Settings.** Copy the example file and fill in the values you have (sign-in keys are needed from Sprint 1 task T-104 on):

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

## Grading test

[`tools/grading-test`](tools/grading-test) checks that a free AI model grades sample explanations close to the expected scores before the feature is built.
