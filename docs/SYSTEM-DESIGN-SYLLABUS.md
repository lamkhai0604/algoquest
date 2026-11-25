# Phase 4 Syllabus — System Design (version 2)

| Field | Value |
| --- | --- |
| Status | Draft version 2 for PO review |
| Updated | 2026-11-25 |
| Levels | 28 to 53, appended after Level 27 (level numbers are fixed, D-056). Levels 28 and 29 are built |
| Owner | PO |
| Authoring | Claude drafts; ChatGPT reviews and translates; Gemini checks facts; the PO approves |
| Scoring | No XP and no level gate in Phase 4 until the PO decides (PO, 2026-11-24) |

## 1. Purpose

Phase 4 takes a learner who knows algorithms but has never studied networks or servers, and brings them to the level expected in a system design interview for a junior to mid-level software engineer.

Version 1 started with building blocks and reached the interview after 14 levels. Version 2 keeps that order but adds what a beginner was missing (APIs, data modeling, security, unique IDs, search and storage), teaches the interview method before the case studies so every case study practices it, and covers the case studies interviewers ask most.

Learning outcomes. After Phase 4, the learner can:

1. Explain what happens between a click and a response, and where time and load go.
2. Turn a vague product request into functional and non-functional requirements, and estimate load, storage and bandwidth with round numbers.
3. Draw a high-level design with clients, load balancers, services, caches, databases, queues and storage, and trace a request through it.
4. Choose between options (SQL or NoSQL, cache-aside or write-through, push or pull, strong or eventual consistency) and state the trade-off in one sentence.
5. Find the bottleneck and the single points of failure in a design, and say how it behaves when a part fails.
6. Run a 45-minute design interview: clarify, estimate, design, deep-dive, and summarize trade-offs.

## 2. How the path is built (zero to hero)

1. **One new idea at a time.** Each level adds one building block and reuses the ones before it. A level lists the levels it builds on, and uses no term it has not explained.
2. **From a problem to a fix.** Every level starts with a system that breaks under load, with numbers, and ends with the building block that fixes it and the price of that fix.
3. **See it, then predict it.** Walkthroughs use the 3D architecture diagram (D-079); each has at least two prediction steps.
4. **Practice the decision, not the definition.** Trade-off challenges ask which option fits stated requirements (D-057); design prompts ask for a short design.
5. **Interview method early.** Level 42 teaches the routine; Levels 43 to 51 apply it to one case each; Levels 52 and 53 are interview level.
6. **Beginner pass rules for every level** (from Levels 28 and 29): a Key terms list, glossary explanations in Vietnamese (D-080), every calculation step shown, failure behavior stated with its conditions, and plausible wrong options.

## 3. Sources

Lessons are written from general knowledge of the field and checked against public and official references. References are used to verify facts, numbers and terms, never copied: no text, diagrams or problem statements are taken from any book, course or article (AI content and IP policy, engineering standard). Unlicensed copies of books are not used.

| Reference | Used for |
| --- | --- |
| Google, *Site Reliability Engineering* and *The Site Reliability Workbook* (free online) | SLIs and SLOs, overload, cascading failures, load balancing, monitoring |
| Amazon, *The Amazon Builders' Library* (free articles) | Timeouts, retries and backoff, idempotent APIs, caching, avoiding overload |
| AWS Well-Architected Framework; Google Cloud Architecture Center; Microsoft Azure Architecture Center (cloud design patterns) | Reliability and scaling practices; named patterns such as cache-aside, circuit breaker, queue-based load leveling |
| Cloudflare Learning Center | DNS, CDNs, TLS, rate limiting, DDoS |
| MDN Web Docs; IETF RFCs (HTTP, TLS) | HTTP methods and status codes, caching headers, WebSocket, TLS |
| Official engineering blogs (for example Netflix, Meta, Uber, Discord, Stripe) | Real examples for case studies, cited by link in the review notes |
| Official product documentation (PostgreSQL, Redis, Kafka, nginx, and so on) | Any product-specific behavior, limit or default |
| Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly) | Replication, partitioning, consistency, transactions, streams |
| *The System Design Primer* (donnemartin, GitHub, CC BY 4.0) | Topic coverage check |

Rules: a number or product claim needs a reference in the review notes; estimation numbers are marked as approximations; product limits change, so Gemini checks them at review time.

## 4. Level plan

### Stage 1 — Foundations: one request, one server, many users (Levels 28 to 32)

| Level | Title | Main ideas | Builds on |
| --- | --- | --- | --- |
| 28 | How a Request Travels (built) | Client and server, DNS, TCP and TLS, HTTP, latency vs throughput, latency numbers, estimation with powers of ten | 1 |
| 29 | Scaling Out and Load Balancing (built) | Vertical vs horizontal scaling, stateless services, sessions, L4 vs L7, round robin and least connections, health checks, capacity planning | 28 |
| 30 | Caching and CDNs | Where to cache (browser, CDN, server, database), cache-aside, write-through, write-back, TTL, LRU, invalidation, hit rate, hot keys, thundering herd | 3, 29 |
| 31 | Databases and Indexes | Tables and documents, SQL vs NoSQL by access pattern, data modeling, primary keys, indexes (B-tree intuition), query cost, transactions and ACID at an intuitive level | 8, 28 |
| 32 | APIs and Communication | REST resources, HTTP methods and status codes, pagination, versioning, idempotent methods, gRPC, polling vs long polling vs WebSocket vs server-sent events | 28, 31 |

### Stage 2 — Data at scale (Levels 33 to 37)

| Level | Title | Main ideas | Builds on |
| --- | --- | --- | --- |
| 33 | Replication and Failover | Leader-follower replication, read replicas, synchronous vs asynchronous, replication lag, read-your-writes, failover and split brain | 31 |
| 34 | Queues and Asynchronous Work | Message queues vs pub/sub, event logs (Kafka-style), at-least-once delivery, idempotency keys, retries with backoff, dead-letter queues, back-pressure | 6, 9, 32 |
| 35 | Partitioning and Consistent Hashing | Range vs hash partitioning, shard keys, hot partitions, resharding, consistent hashing with virtual nodes, secondary indexes on shards | 3, 31, 33 |
| 36 | Consistency and Availability | CAP during a network partition, PACELC, strong vs eventual consistency, quorum reads and writes (intuition), conflict resolution, choosing per feature | 33, 35 |
| 37 | Transactions Across Services | Why one database transaction is easier, two-phase commit (idea and costs), sagas with compensating steps, outbox pattern, exactly-once as an effect | 31, 34, 36 |

### Stage 3 — Production concerns (Levels 38 to 41)

| Level | Title | Main ideas | Builds on |
| --- | --- | --- | --- |
| 38 | Reliability and Overload | Availability and nines, redundancy, timeouts, retries with jitter, circuit breakers, rate limiting algorithms (token bucket, sliding window), load shedding, graceful degradation | 13, 29, 34 |
| 39 | Observability and SLOs | Logs, metrics and traces, SLI, SLO and error budgets, alerting on symptoms, dashboards, finding a slow dependency | 38 |
| 40 | Security for System Design | Authentication vs authorization, sessions vs tokens, OAuth at an intuitive level, HTTPS everywhere, secrets, least privilege, abuse and rate limits | 29, 32 |
| 41 | Storage, Search and IDs | Object storage and blobs, file upload flow, full-text search with an inverted index, unique ID generation (auto-increment, UUID, time-ordered IDs) | 3, 31, 35 |

### Stage 4 — The interview method (Level 42)

| Level | Title | Main ideas |
| --- | --- | --- |
| 42 | The Design Interview Method | A 45-minute routine: clarify requirements, estimate, define the API, sketch the data model, high-level design, one or two deep dives, trade-offs and failures, summary. How to think aloud and manage time |

### Stage 5 — Case studies (Levels 43 to 51)

Each case study uses the Level 42 routine end to end and ends with one full design prompt.

| Level | Title | Deep dives | Uses |
| --- | --- | --- | --- |
| 43 | URL Shortener | ID generation, read-heavy caching, redirects, analytics | 30, 31, 41 |
| 44 | Rate Limiter Service | Algorithms, a shared counter store, limits per user and per IP, behavior when the store fails | 13, 30, 38 |
| 45 | Notification System | Fan-out to email, SMS and push, queues per channel, retries, user preferences, deduplication | 34, 38 |
| 46 | News Feed | Fan-out on write vs on read, celebrity accounts, ranking, feed cache | 30, 34, 35 |
| 47 | Chat Service | WebSocket connections, message ordering, delivery receipts, presence, history storage, group chat | 32, 33, 34 |
| 48 | Search Autocomplete | Trie of top queries, precomputed top-k per prefix, offline count updates | 9, 26, 30 |
| 49 | Video Streaming | Upload pipeline, transcoding jobs, object storage, CDN delivery, adaptive bitrate | 30, 34, 41 |
| 50 | Ride Sharing and Nearby Search | Location updates at scale, geospatial indexes (geohash, quadtree), matching, hot areas | 35, 41 |
| 51 | Ticket Booking | Preventing double booking, holds with expiry, contention on popular events, payment with sagas | 31, 36, 37 |

### Stage 6 — Hero (Levels 52 and 53)

| Level | Title | Main ideas |
| --- | --- | --- |
| 52 | Design a Distributed Key-Value Store | Combines partitioning, replication, quorums, failure detection and repair; the classic deep interview question |
| 53 | Mock System Design Interviews | Timed prompts with no topic given, graded with the design rubric; a review checklist after each |

### Interview readiness map

| Interview area | Levels |
| --- | --- |
| Requirements and estimation | 28, 29, 42, all case studies |
| Networking and APIs | 28, 32 |
| Scaling and load balancing | 29 |
| Caching and CDNs | 30 |
| Databases, indexes, data modeling | 31, 41 |
| Replication, partitioning, consistency | 33, 35, 36 |
| Asynchronous processing | 34, 37 |
| Reliability, rate limiting, observability | 38, 39 |
| Security | 40 |
| Common case studies | 43 to 51 |
| Deep distributed design | 52 |
| Timed practice | 53 |

## 5. Lesson format

The lesson template (CONTENT-GUIDE §2) stays, with these system design readings:

| Part | In Phase 4 |
| --- | --- |
| Learning objectives | Ends with a **Key terms** list; every term is explained before or where it is first used |
| Problem hook | A product that breaks under load, with the numbers that show why |
| Intuition | An everyday comparison, and a link to an earlier level |
| When to use | The requirement or symptom that calls for this building block |
| Template code | A **design template**: a checklist, or a small piece of code where it helps (a token bucket, a hash ring) |
| Complexity | **Cost and limits**: latency added, throughput, storage, and what fails first |
| Common mistakes, edge cases | Typical design mistakes and failure cases, each with its conditions |
| Worked example | One design question answered in full, with every calculation step |
| Walkthrough | 3D architecture diagram (D-079), at least two prediction steps |
| Quick check | 2–3 questions, at least one estimate; wrong options are real misunderstandings |

## 6. Practice

1. **Trade-off challenges** (D-057): three per level. Every `valid` option meets all fixed requirements; the `why` names the condition that makes an option better.
2. **Design prompts (new problem kind):** a short written design graded with a 100-point rubric: requirements and scope 20, estimation 15, high-level design 25, data and scaling 20, trade-offs and failures 20. Two per Stage 1–3 level, one per case study, five in Level 53.
3. **After grading:** rubric feedback first; then the learner may open a **reference design** that states its assumptions and the alternatives. It is never called the correct answer, because several designs can be right.

## 7. Authoring workflow per level

| Step | Who | Output |
| --- | --- | --- |
| 1 | Claude | Lesson, walkthrough, quick check, challenges, review notes with a reference per fact |
| 2 | ChatGPT | Review against the checklist; findings with severity |
| 3 | Claude | Fixes, or the reason a finding is not taken |
| 4 | Gemini | Fact check of numbers and product claims with sources |
| 5 | ChatGPT | Vietnamese translation using the glossary (D-080) |
| 6 | PO | Review in the app; merge to `main` |

## 8. Delivery plan

| Order | Scope |
| --- | --- |
| Next | Level 30 (Caching and CDNs), then 31 and 32, so Stage 1 is complete |
| Then | Design prompt kind (format, rubric, grading prompt, answer box, reference design) |
| Then | Stage 2 (33–37), Stage 3 (38–41), Level 42 |
| Then | Case studies 43–51, then 52 and 53 |

At about two levels per sprint, Stages 1 to 4 take about eight sprints and the whole phase about thirteen. The pace may change after each stage.

## 9. Decisions to confirm

| Question | Recommendation |
| --- | --- |
| Level list: 26 levels (28 to 53) instead of 14 | Approve; it covers the topics interviewers ask most |
| After grading a design prompt | Rubric feedback, then an optional reference design |
| Design Patterns elective | Stays a separate elective with no gate (D-070), available after Phase 3 or alongside Phase 4 |
| XP and gates | Deferred by the PO |
