# Architecture — AlgoQuest

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | **Approved baseline** — PO, 2026-11-06 (T-002) |
| Requirements baseline | [SRS.md](SRS.md) v1.0 |

Diagrams are Mermaid source in this file; GitHub renders them and this file is their single editable source.

## 1. Overview and Deployment

```mermaid
flowchart LR
    subgraph Browser
      FE[React SPA<br/>Vite + TypeScript]
      W[Web Worker<br/>runs learner JavaScript]
    end
    subgraph Vercel
      ST[Static frontend files]
    end
    subgraph Render
      BE[Spring Boot API<br/>Docker, Java 21]
    end
    DB[(Neon Postgres)]
    OA[Google / GitHub OAuth]
    G[Gemini API]
    J[Judge0 CE<br/>RapidAPI]
    ST -->|serves| FE
    FE -->|HTTPS JSON + Bearer JWT<br/>CORS: frontend origin only| BE
    FE -.-> W
    BE -->|Flyway, JPA| DB
    BE -->|OAuth2 login| OA
    BE -->|Grader adapter| G
    BE -->|CodeRunner adapter, Java| J
```

**Selected style: API-first modular monolith** (ARCH-02, D-030). One Spring Boot application split into feature modules with strict boundaries, and a separate React single-page app that only talks to the versioned REST API (`/api/v1`). A future mobile app or organization dashboard uses the same API. A module can be extracted into its own service later because modules only talk through their public service interfaces.

Hosting (D-037): Vercel Hobby, Render free web service (sleeps after 15 minutes idle, about a minute to wake), Neon Free. The frontend shows a "waking the server" screen while the first request is slow.

Rejected: Next.js + Supabase (option A) — faster to start but harder to extend for organizations and other clients; microservices — no benefit at this size.

## 2. Repository Layout

```text
algoquest/
  frontend/            React 19 + Vite + TypeScript SPA
  backend/             Spring Boot 4.1 (Java 21, Maven)
  content/             levels, lessons (Markdown + JSON), problems (JSON with answer keys and tests)
  tools/grading-test/  grading accuracy test (T-005)
  docs/                project records
  docker-compose.yml   local Postgres
  .github/workflows/   backend, frontend, smoke
```

`content/` is packaged into the backend image at build time (D-033). Answer keys and hidden tests are only ever read by the backend.

## 3. Backend Modules (package `com.algoquest`)

```mermaid
flowchart TB
    web[Controllers<br/>one per module]
    A[access<br/>login, JWT, roles, permissions, audit log]
    C[content<br/>load + validate content, catalog]
    GM[game<br/>services + persistence]
    D[game.domain<br/>pure rules: XP, unlock, practice, hints, streak, test score]
    GR[grading<br/>Grader: Gemini, Fake]
    R[runner<br/>CodeRunner: Judge0 Java; JS output check]
    AD[admin<br/>grading log, reset, config, users/roles]
    CF[config<br/>game config: defaults + overrides]
    web --> A
    web --> GM
    web --> AD
    GM --> D
    GM --> C
    GM --> GR
    GM --> R
    GM --> CF
    AD --> GM
    AD --> A
    AD --> CF
```

| Module | Responsibility | Owns (tables / data) |
| --- | --- | --- |
| `access` | OAuth2 login (Google, GitHub), one-time login codes, JWT issuing and validation, users, role assignments with scope, permission catalogue, `PermissionEvaluator`, audit log | `app_user`, `login_code`, `role_assignment`, `audit_log` |
| `content` | Load `content/` at startup, validate against the schema (startup fails on invalid content), expose a read-only catalog; public DTOs never include answer keys or test expectations | In-memory catalog |
| `game.domain` | Pure Java rules with no Spring or I/O: problem XP (FR-08), level target, lock states (FR-10), practice gate (FR-09), hint quota (FR-06), streak (FR-13), test score | Nothing |
| `game` | Use cases: attempts, hints, practice, tests, profile, leaderboard (dummy players from content) | `attempt`, `problem_progress`, `level_progress`, `test_attempt`, `hint_use`, `streak` |
| `grading` | `Grader` interface; `GeminiGrader` (prompt, JSON schema, 20 s timeout, score snapping); `FakeGrader` for tests and smoke runs | Grading prompt |
| `runner` | `CodeRunner` interface; `Judge0Runner` for Java (daily quota guard); JavaScript output checking (D-035) | Test harnesses |
| `admin` | Admin endpoints; every one guarded by a permission and audit-logged | Nothing |
| `config` | Game config with file defaults and validated database overrides | `game_config` |

**Rules:** controllers are thin (validate, authorize, call one service). Modules call each other only through public service classes, never another module's repositories. `game.domain` depends on nothing. **Authorization happens in controllers/services through `access`; the domain never checks permissions** (NFR-10). Errors use RFC 9457 problem details; no stack traces or keys in responses.

**State ownership (ARCH-03):** the database owns progress. Each graded attempt is one transaction (attempt + XP + progress + streak), idempotent by a client-generated `attemptId`, so a retry never awards XP twice (NFR-09, CODE-11).

## 4. Frontend Structure

| Folder | Content |
| --- | --- |
| `src/api` | Typed API client, JWT handling (memory + `sessionStorage`, D-036), retry and "waking the server" state |
| `src/auth` | Sign-in page, OAuth callback (exchanges the one-time code), route guards |
| `src/components` | Shared UI: buttons, cards, XP bar, timer, modal, toast, loading and error states |
| `src/features/levels` | Level map, lesson page (Markdown + step walkthrough + quick check) |
| `src/features/solve` | Problem list, solve page, feedback, hints, code editor (CodeMirror 6), JS Web Worker |
| `src/features/practice`, `src/features/test` | Practice round, level-up test |
| `src/features/profile` | Profile, streak, leaderboard |
| `src/features/admin` | Admin panel (rendered only with admin permissions; the backend still enforces) |
| `src/styles` | Design tokens (colors, type, spacing) in one place |

React Router for pages; plain `fetch` wrapper plus small hooks for data (no state library until needed). Reusable components for anything used in more than one place.

## 5. Design Patterns (ARCH-06)

| Pattern | Problem it solves | Simpler alternative | Tradeoff |
| --- | --- | --- | --- |
| Adapter (`Grader`, `CodeRunner`) | Providers may change; tests and smoke runs need fakes | Call Gemini/Judge0 directly in services | One interface each; failure paths become testable |
| Strategy (runner per language) | JavaScript is checked from browser outputs, Java runs on Judge0 | `if (language)` inside one method | Two small classes instead of one branching method |
| Permission evaluator (Spring `@PreAuthorize("hasPermission(...)")`) | Same check style for global permissions now and organization scopes later | `if (user.isAdmin())` checks | Slight indirection; organizations add scopes without rewriting checks |

## 6. UML Views and Why They Were Selected

| View | Why |
| --- | --- |
| Deployment / overview (§1) | Five external systems and a cold-starting backend |
| Module dependencies (§3) | Boundaries that keep organizations from touching the game |
| Use case (§6.1) | System boundary and actors |
| State diagram (§6.2) | Level progression is the core lifecycle |
| Sequence: sign-in (§6.3) | OAuth plus our own JWT is security-critical |
| Sequence: grading (§6.4) | The critical interaction, with several failure paths |
| ER diagram (§8) | Uniqueness rules prevent double XP |
| Authorization flow (§9.2) | Every endpoint must follow the same path |

### 6.1 Use cases

```mermaid
flowchart LR
    L((Player))
    O((Owner))
    subgraph AlgoQuest
      U1[Sign in with Google / GitHub]
      U2[Read lesson]
      U3[Explain a solution]
      U4[Use a hint]
      U5[Write code for 2x XP]
      U6[Practice round]
      U7[Level-up test]
      U8[Profile and leaderboard]
      U9[Admin panel]
    end
    L --- U1 & U2 & U3 & U4 & U5 & U6 & U7 & U8
    O --- U1 & U9
    U3 --> G[(Gemini)]
    U7 --> G
    U5 --> J[(Judge0, Java)]
```

### 6.2 Level lifecycle (FR-02, FR-09, FR-10)

```mermaid
stateDiagram-v2
    [*] --> Locked
    Locked --> EasyOnly: previous level test 70-99
    Locked --> Open: previous level test 100
    EasyOnly --> Open: previous level retake 100
    state Open {
        [*] --> Learning
        Learning --> Practice: level XP >= 70% of target
        Practice --> TestReady: level XP = target
        TestReady --> TestReady: test < 70 (retake)
        TestReady --> Passed: test >= 70
        Passed --> Passed: retake for 100
    }
```

Level 1 starts Open. An Easy-only level can also reach its practice round and test from its Easy problems (approved in T-002).

### 6.3 Sign-in (FR-01)

```mermaid
sequenceDiagram
    participant B as Browser (SPA)
    participant API as Backend
    participant P as Google / GitHub
    B->>API: GET /oauth2/authorization/google
    API->>P: redirect (state, PKCE)
    P-->>API: callback with authorization code
    API->>P: exchange code, read verified email
    alt provider error / email not verified
        API-->>B: redirect /signin?error
    else ok
        API->>API: find or create user (Player, or Owner if OWNER_EMAIL)
        API-->>B: redirect /auth/callback with a one-time code (60 s, single use)
        B->>API: POST /api/v1/auth/exchange {code}
        API-->>B: JWT (4 h) — kept in memory + sessionStorage
    end
    B->>API: later calls with Authorization: Bearer
```

Only the short one-time code appears in a URL, never the JWT. The JWT holds the user ID only; permissions are looked up per request, so a role change takes effect immediately.

### 6.4 Grading an explanation (FR-05, FR-08)

```mermaid
sequenceDiagram
    participant B as Browser
    participant C as GameController
    participant S as AttemptService
    participant D as game.domain
    participant G as Grader (Gemini)
    participant DB as Postgres
    B->>C: POST /api/v1/problems/{id}/attempts {attemptId, text, mode}
    C->>C: JWT valid, permission game.play, 1-2000 chars
    C->>S: submit
    S->>DB: problem unlocked for user? attemptId seen?
    alt attemptId already graded
        S-->>B: stored result, no new XP
    else new
        S->>G: problem + answer key + text (20 s timeout)
        alt timeout / quota / invalid JSON
            G-->>S: error
            S-->>B: 503 problem detail "grading unavailable" (nothing stored)
        else scores
            G-->>S: {pattern, steps, complexity, edgeCases, feedback}
            S->>D: snap, total, XP, lock and streak changes
            S->>DB: one transaction
            S-->>B: scores, feedback, XP gained
        end
    end
```

## 7. API (v1)

| Method | Path | Permission | Requirement |
| --- | --- | --- | --- |
| GET | `/oauth2/authorization/{google\|github}` | — | FR-01 |
| POST | `/api/v1/auth/exchange` | — (one-time code) | FR-01 |
| GET | `/api/v1/me` | signed in | FR-01, FR-17 |
| GET | `/api/v1/levels` | `game.play` | FR-02 |
| GET | `/api/v1/levels/{n}/lesson` | `game.play` | FR-03 |
| GET | `/api/v1/levels/{n}/problems` | `game.play` | FR-04 |
| GET | `/api/v1/problems/{id}` | `game.play` | FR-04 |
| POST | `/api/v1/problems/{id}/attempts` | `game.play` | FR-05, FR-08, FR-09 |
| POST | `/api/v1/problems/{id}/hints` | `game.play` | FR-06 |
| GET | `/api/v1/hints/quota` | `game.play` | FR-06 |
| GET | `/api/v1/problems/{id}/js-inputs` | `game.play` | FR-07 (D-035) |
| POST | `/api/v1/problems/{id}/code-runs` | `game.play` | FR-07 |
| POST | `/api/v1/levels/{n}/tests` | `game.play` | FR-10 |
| POST | `/api/v1/tests/{id}/answers` | `game.play` | FR-10 |
| POST | `/api/v1/tests/{id}/submit` | `game.play` | FR-10 |
| GET | `/api/v1/profile` | `game.play` | FR-12, FR-13 |
| GET | `/api/v1/leaderboard` | `game.play` | FR-14 |
| GET | `/api/v1/admin/attempts` | `admin.gradingLog.view` | FR-18.1 |
| POST | `/api/v1/admin/users/{id}/progress-reset` | `admin.progress.reset` | FR-18.2 |
| GET, PUT | `/api/v1/admin/config` | `admin.config.edit` | FR-18.3 |
| GET | `/api/v1/admin/users` | `admin.users.view` | FR-18.4 |
| PUT | `/api/v1/admin/users/{id}/roles` | `admin.roles.grant` | FR-17, FR-18.4 |
| GET | `/api/v1/admin/audit-log` | `admin.auditLog.view` | FR-17.6 |
| GET | `/actuator/health` | — | Hosting |

## 8. Data Model (ER)

```mermaid
erDiagram
    APP_USER ||--o{ ATTEMPT : makes
    APP_USER ||--o{ PROBLEM_PROGRESS : has
    APP_USER ||--o{ LEVEL_PROGRESS : has
    APP_USER ||--o{ TEST_ATTEMPT : takes
    APP_USER ||--o{ HINT_USE : uses
    APP_USER ||--|| STREAK : keeps
    APP_USER ||--o{ ROLE_ASSIGNMENT : holds
    APP_USER ||--o{ AUDIT_LOG : performs
    APP_USER {
      uuid id PK
      text email UK
      text display_name
      text provider
      text provider_subject
      timestamptz created_at
    }
    ROLE_ASSIGNMENT {
      uuid id PK
      uuid user_id FK
      text role
      text scope_type
      uuid scope_id
      uuid granted_by FK
      timestamptz granted_at
    }
    AUDIT_LOG {
      uuid id PK
      uuid actor_id FK
      text action
      text target
      jsonb before_value
      jsonb after_value
      timestamptz at
    }
    ATTEMPT {
      uuid id PK
      uuid user_id FK
      text problem_id
      text mode
      text explanation
      int pattern
      int steps
      int complexity
      int edge_cases
      int total
      int hints_used
      int seconds_taken
      timestamptz created_at
    }
    PROBLEM_PROGRESS {
      uuid user_id PK
      text problem_id PK
      int xp_awarded
      bool code_bonus
      bool practice_done
    }
    LEVEL_PROGRESS {
      uuid user_id PK
      int level PK
      text lock_state
      int xp
      int best_test_score
    }
    TEST_ATTEMPT {
      uuid id PK
      uuid user_id FK
      int level
      text mode
      int score
      timestamptz started_at
      timestamptz submitted_at
    }
    HINT_USE {
      uuid id PK
      uuid user_id FK
      text problem_id
      int hint_number
      timestamptz used_at
    }
    STREAK {
      uuid user_id PK
      int current
      int best
      date last_active_day
    }
    GAME_CONFIG {
      text key PK
      jsonb value
      uuid updated_by FK
      timestamptz updated_at
    }
    LOGIN_CODE {
      text code_hash PK
      uuid user_id FK
      timestamptz expires_at
      bool used
    }
```

Schema changes only through Flyway migrations. `PROBLEM_PROGRESS (user_id, problem_id)` being unique stops double XP. `ROLE_ASSIGNMENT.scope_type`/`scope_id` are empty in this release (§9.3). The app has no update or delete path for `AUDIT_LOG`. Problems, lessons, and levels live in `content/`, so tables store their text IDs; dummy players are a content file.

## 9. Security and Access Control

### 9.1 Permission catalogue (this release)

| Permission | Owner | Player | Admin (defined, empty until OQ-05) |
| --- | --- | --- | --- |
| `game.play` | ✓ | ✓ | — |
| `admin.gradingLog.view` | ✓ | | |
| `admin.progress.reset` | ✓ | | |
| `admin.config.edit` | ✓ | | |
| `admin.users.view` | ✓ | | |
| `admin.roles.grant` | ✓ | | |
| `admin.auditLog.view` | ✓ | | |

A user's permissions are the union of their role assignments. `admin.roles.grant` can only grant roles whose permissions the granter also holds. The first Owner comes from `OWNER_EMAIL`; the last Owner cannot be removed.

### 9.2 How a request is authorized

```mermaid
flowchart LR
    Req[Request] --> T{Valid JWT?}
    T -- no --> E401[401]
    T -- yes --> P{"hasPermission(scope, p)"}
    P -- denied --> E403[403, no data]
    P -- allowed --> S[Service: queries filtered by user or scope]
    S --> A{Admin action?}
    A -- yes --> L[Audit log in the same transaction]
    A -- no --> OK[200]
    L --> OK
```

Other measures: CORS allows only the frontend origin; secrets only in Render/GitHub environment variables; repository queries always filter by the authenticated user (or, later, by an authorized scope); the database user has no superuser rights; the learner's text goes to Gemini inside a delimited block with an instruction to treat it as data; Java runs only in Judge0's sandbox; JavaScript runs only in the learner's own browser.

### 9.3 Adding organizations later (FR-19)

| Change | Where | Touches existing code? |
| --- | --- | --- |
| Tables `organization` (member limit), `membership` | New Flyway migration | No |
| Roles `orgAdmin`, `orgMember`; permissions such as `org.members.invite`, `org.progress.view` | `access` catalogue | Adds entries only |
| Organization-scoped role assignments | Existing `role_assignment` columns | No schema change |
| Scoped checks `hasPermission(org, 'org.progress.view')` | `access` `PermissionEvaluator` | Extends one class; existing annotations unchanged |
| Invitations, member-limit check, organization dashboard | New `org` module + new frontend feature folder | No |
| Organization admin reads members' progress | New read methods exposed by `game` services | Adds methods; existing ones unchanged |
| Game rules (`game.domain`, grading) | — | **Not touched** (NFR-10) |
