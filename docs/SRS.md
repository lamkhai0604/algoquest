# Software Requirements Specification — AlgoQuest

| Field | Value |
| --- | --- |
| Version | 1.0 |
| Status | **Approved baseline** — PO, 2026-11-06 (T-002). Changes go through DECISIONS.md. |
| Product Owner | Repository owner (lamkhai0604) |
| Standard | internal engineering guidelines (D-009) |
| Last updated | 2026-11-06 |

## 1. Product Definition

**AlgoQuest — Don't let Algorithm beat you.** A web app for learning the algorithm patterns used in coding interviews. Topics are levels ordered from easy to hard. Each level has a lesson and problems. The learner **explains the approach in words**, the way candidates talk through a solution in an interview, and an AI grades the explanation against a teacher-written answer key. Writing code afterwards is optional and doubles the points.

**Goals**
1. Help learners master the core algorithm patterns used in coding interviews.
2. Demonstrate a complete, well-documented full-stack AI application.
3. Keep the design open to more users and organizations later (not in this release).

**What makes it different:** most learning sites show videos and ask for code. AlgoQuest asks for the reasoning first and grades it.

## 2. Users and System Boundary

| Actor | Description |
| --- | --- |
| Learner (Player) | Signed-in user. This release has a single real learner for acceptance testing (D-011). |
| Owner | Full control of the system: roles, config, data (FR-17). |
| Organization Admin (future) | Manages the members of their own organization (FR-19, not this release). |
| Dummy players | Fictional players shown on the leaderboard; not real accounts. |
| AI grader | External LLM (Gemini free tier, D-031) that scores explanations. |
| Code runner | Browser Web Worker for JavaScript; external Judge0 service for Java (D-032). |

**Inside the system:** React frontend, Spring Boot API, database, content files, grader and code-runner adapters.
**Outside:** LLM provider, Judge0, auth identity providers (Google/GitHub), hosting.

### Exclusions (this release)

Voice answers, battle mode (dummy placeholder at most), real friends or social features, payments and a working VIP plan (placeholder only), organizations and seat plans (FR-19; only the groundwork in FR-17 is built), content authoring UI, other languages besides JavaScript and Java for code, mobile apps, opening the app to the public.

## 3. Functional Requirements

Priority uses MoSCoW: **Must**, **Should**, **Could**, **Won't (this release)**. Status of every requirement: **Approved** (baseline v1.0), with the priority shown.

### FR-01 — Sign in (Must)
1. The learner signs in with Google or GitHub; there is no password form.
2. Every page except the landing page requires a session; the server enforces it on every data and grading route.
3. Sign-out ends the session.
4. A new account gets the **Player** role (FR-17). Nobody can make themselves an Owner or Admin by signing up.

### FR-02 — Level map (Must)
1. Shows all levels in order with name, XP bar (current / target XP), and lock state: **Locked**, **Easy only**, or **Open** (FR-10).
2. Level 1 starts Open; every other level starts Locked.
3. Header shows the slogan, total XP, and the current streak.

### FR-03 — Lessons (Must)
1. Each level has one lesson following the 9-part template in [CONTENT-GUIDE.md](CONTENT-GUIDE.md).
2. "How it works" is a step-by-step walkthrough with Next/Back controls.
3. The quick check (2–3 multiple-choice questions) gives immediate feedback and awards no XP.
4. Lessons of Open and Easy-only levels can always be re-read.

### FR-04 — Problems and typed explanations (Must)
1. The problem list shows each problem's title, difficulty (Easy/Medium/Hard), and status (not tried / solved / Done in practice). In an Easy-only level, Medium and Hard problems are visible but locked.
2. The solve page shows the statement, examples, and constraints, a text box for the explanation (up to 2,000 characters), Submit, Hint, and a timer used for the time bonus.
3. An empty submission or one over the limit is rejected before grading.
4. **This release (D-024):** Hard problems are listed with the label "Coming in a later version" and cannot be opened; Easy and Medium problems are playable.

### FR-05 — AI grading (Must)
1. The server sends the problem, its answer key, and the explanation to the grader; the answer key is never sent to the browser.
2. The result has four criteria with fixed allowed values — pattern 0/20/40, steps 0/15/30, complexity 0/10/20, edge cases 0/5/10 — plus 1–3 sentences of feedback that do not reveal the full solution.
3. A total of **70 or more** solves the problem.
4. Instructions inside the learner's text are ignored (prompt-injection test case S10 scores 0).
5. If the grader fails, times out (20 s), or the free quota is used up, the learner sees "Grading is unavailable, try again later", the text stays in the box, and no attempt or XP is recorded.
6. Every graded attempt is stored with its scores, feedback, hints used, and time taken.

### FR-06 — Hints (Must)
1. Each problem has 3 hints of increasing detail, shown in order.
2. At most **3 hints per 5-hour window** across the app (D-018); the UI shows remaining hints and when they refill.
3. Each hint viewed reduces that problem's XP by 20% (D-015).
4. A "Get more hints with VIP" link opens the VIP placeholder (FR-15).

### FR-07 — Optional code for double XP (Should)
1. After a passing explanation, the learner may write code in **JavaScript or Java**.
2. Code runs against the problem's hidden tests. JavaScript: the browser receives only the test inputs, runs the code in a Web Worker (stopped after 5 s), and sends the outputs to the backend, which compares them with the expected outputs (D-035). Java: the backend runs it on Judge0 (D-032).
3. All tests passing doubles the problem's XP (once per problem). The result shows passed/total tests and, for failures, the first failing input.
4. If Judge0 is unavailable or its daily quota is used up, the learner sees a clear message and can still use JavaScript.

### FR-08 — XP and scoring (Must)
1. Problem XP = (20 base + difficulty bonus [Medium +10, Hard +25] + time bonus [+5 within Easy 15 / Medium 25 / Hard 40 min]) × (1 − 0.2 × hints used, minimum 0) × (2 if code passed).
2. XP is awarded the first time a problem is solved; later attempts can only add the code bonus.
3. Level XP target = 100 + 25 × (level − 1). XP counts toward the level of the problem.
4. Total XP is the sum over all levels.

### FR-09 — Practice round (Must)
1. Opens when the level's XP reaches 70% of its target.
2. Lists the level's solved problems. Solving one again **without hints** enables Done; each Done adds +10 XP, until the bar is full.
3. Each problem can be marked Done once per level.

### FR-10 — Level-up test (Must)
1. Opens when the level's bar is full. Contains 3 problems not used in the lesson or practice, with a countdown of about 2 hours (exact time in content config).
2. Test score = average of the three explanation totals (0–100), rounded down.
3. Score < 70: retake later. 70–99: next level becomes **Easy only**. 100: next level becomes **Open**. Once a level is Open it never goes back.
4. Retakes are unlimited; the best score is kept on the profile.
5. When time runs out, unanswered problems score 0 and the test is graded.

### FR-11 — Hard test mode (Could; placeholder in this release)
**This release (D-024):** the test page shows a disabled "Hard mode — coming in a later version" option; the rules below apply when it is built.

1. Optional variant: 5 problems, 1 h 45 min. Unlock results follow FR-10.
2. Each problem scoring 70+ adds +30 XP to the **next** level's bar.

### FR-12 — Profile (Should)
Shows total XP, current and best streak, per-level progress, and the best test score per level.

### FR-13 — Streak (Should)
+1 for each calendar day (learner's local time zone) with at least one solved problem; a missed day resets it to 0.

### FR-14 — Leaderboard with dummy players (Could)
Weekly and all-time XP ranking of the learner among about 10 fictional players labelled as demo players.

### FR-15 — VIP placeholder (Could)
A page describing a future monthly VIP plan (more hints) with dummy content and no payment or sign-up.

### FR-16 — Battle mode (Won't, this release)
Not built (D-019).

### FR-17 — Roles and permissions (Must)
1. Roles in this release: **Owner** (full control) and **Player** (default). An **Admin** role exists in the permission catalogue with no permissions assigned until the PO defines it (OQ-05).
2. Access is checked by **named permissions**, not by role names in code (catalogue in ARCHITECTURE.md §9.1). Roles are only bundles of permissions.
3. The first Owner is set by server configuration (`OWNER_EMAIL`), never through the UI. The Owner role cannot be removed or demoted by anyone except another Owner action recorded in the audit log, and the last Owner can never be removed.
4. Every role assignment has an optional **scope** (for example an organization). In this release every assignment is global (scope empty); the field exists for FR-19.
5. Every API endpoint that reads or changes data checks the needed permission in the backend, and every query is filtered by the signed-in user (or, later, an authorized scope).
6. Every admin action (role change, progress reset, config change) writes an **audit log** entry: who, what, target, before/after, when. The audit log cannot be edited from the app.

### FR-18 — Admin panel (Should)
Visible only to users with at least one admin permission. In this release:
1. **Grading log**: list of graded attempts with the learner's text, the four scores, and feedback, filterable by problem; used to tune the grading prompt.
2. **Reset progress** for a chosen user and level (confirmation required; audit-logged).
3. **Game config**: edit the XP numbers of D-015 (base, bonuses, level target formula values, hint quota) without a deployment; values are validated and audit-logged; defaults come from a file.
4. **Users and roles**: list users; Owner can grant or remove roles.

### FR-19 — Organizations and seat plans (Won't, this release; groundwork in FR-17)
Future model (D-022): an organization, for example a teacher's class, subscribes to a plan and its administrator becomes **Admin of that organization**. Depending on the plan they invite up to **5 or 10 members** (number to be discussed). Each organization sees only its own members and their progress; the platform Owner sees everything. Needs payments, invitations, seat limits, and an organization dashboard. Planned after the game is complete and has been trialled.

## 4. Nonfunctional Requirements

| ID | Requirement | Target |
| --- | --- | --- |
| NFR-01 | Cost | $0: free tiers only (D-006) |
| NFR-02 | Security | API keys only on the server, never in the browser or the repository; every data route checks the session; every query filtered by the signed-in user; answer keys and hidden tests never sent to the browser |
| NFR-03 | Grading accuracy | On the grading test set (T-005, 20 answers): average difference ≤ 8 points, at most 3 answers off by more than 10, pass/fail agreement ≥ 19/20 |
| NFR-04 | Grading latency | Unresolved: measure in T-005; proposed target 95% of gradings within 10 s |
| NFR-05 | Responsive UI | Usable from 360 px width; solving works on a phone |
| NFR-06 | Accessibility | Text contrast meets WCAG AA; all controls reachable by keyboard |
| NFR-07 | Privacy | Only problem text, answer key, and the learner's explanation go to the grader; no name or email |
| NFR-08 | Quality gates | CI runs lint, type check, tests, content-schema validation, and build on every push and PR |
| NFR-09 | Resilience | Grader and Judge0 calls have timeouts and clear error states; no XP is lost or double-counted on retry |
| NFR-10 | Extensibility | Adding organizations and seat plans (FR-19) must not change the game domain (scoring, unlocking, grading); the parts it may touch are listed in ARCHITECTURE.md §9.3 |

## 5. Data and External Interfaces

- **Content files** (D-033): levels, lessons (Markdown + JSON), problems (JSON: statement, examples, constraints, answer key, 3 hints, hidden tests, similar-LeetCode reference). Schema in CONTENT-GUIDE.md.
- **Database**: users, attempts, problem progress, level progress, practice Done marks, test attempts, hint usage, streak, dummy players, role assignments (with optional scope), audit log, game config. ER view in ARCHITECTURE.md §8.
- **Gemini API**: one structured-JSON request per grading.
- **Judge0 CE (RapidAPI)**: submit Java source + test input, read output.

## 6. Level List (D-012, content order)

1 Big-O & Basics · 2 Arrays & Hashing · 3 Two Pointers · 4 Sliding Window · 5 Stack · 6 Binary Search · 7 Linked List · 8 Trees · 9 Tries · 10 Heap / Priority Queue · 11 Backtracking · 12 Graphs · 13 Advanced Graphs · 14 Greedy & Intervals · 15 1D Dynamic Programming · 16 2D Dynamic Programming · 17 Bit Manipulation & Math (extra).

Each level: about 3 Easy, 3 Medium, 2 Hard practice problems (levels 1–2 may skip Hard) plus 3 test problems (5 more for hard mode).

## 7. Constraints, Assumptions, Dependencies

- **Assumption:** one real user, so free-tier limits (Gemini, Judge0 50/day, Neon, Render) are enough.
- **Decision:** test score = average of the three problem totals (FR-10.2), approved in T-002.
- **Constraint:** the free Render backend sleeps after 15 minutes idle and takes about a minute to wake; the frontend shows a "waking the server" state (D-037).
- **Dependency:** a Gemini Flash model passes the grading test (T-005) before FR-05 is built.

## 8. Open Questions

| ID | Question | Needed by |
| --- | --- | --- |
| OQ-01 | ~~Stack option A or B?~~ Resolved: option B (D-030), 2026-11-06 | — |
| OQ-02 | Exact level-up test time per level (about 2 h proposed for all)? | Sprint 2 |
| OQ-03 | Are the XP numbers right? Revisit after the levels 1–3 trial. | Sprint 3 review |
| OQ-04 | Should the time bonus timer pause when the learner leaves the page? Proposed: no, it measures wall time from opening the problem. | Sprint 1 |
| OQ-05 | Which permissions should the Admin role get in this release, if any (FR-17.1)? | Sprint 2 |
| OQ-06 | Seat numbers and prices of future plans (5 or 10 members?) | Before FR-19 |
| OQ-07 | ~~Are Medium problems built in this release?~~ Resolved: yes (D-024), 2026-11-06 | — |
