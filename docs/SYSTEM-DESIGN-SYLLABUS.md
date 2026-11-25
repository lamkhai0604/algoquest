# Phase 4 Syllabus — System Design (version 3)

| Field | Value |
| --- | --- |
| Status | Draft version 3 for PO review |
| Updated | 2026-11-25 |
| Levels | 28 to 53, appended after Level 27 (level numbers are fixed, D-056). Levels 28 and 29 are built |
| Owner | PO |
| Authoring | Claude drafts; ChatGPT reviews and translates; Gemini checks facts; the PO approves |
| Scoring | No XP and no level gate in Phase 4 until the PO decides (PO, 2026-11-24) |

Version 3 applies the review of version 2: prerequisites are complete, local concurrency, service boundaries, recovery, autoscaling and tail latency have a home, heavy levels separate core from extension material, each case study has an assessed deep dive, and interview readiness has a pass standard for a junior and a mid-level track.

## 1. Purpose

Phase 4 takes a learner who knows algorithms but has never studied networks or servers, and prepares them to practice and pass system design interviews for junior and mid-level software engineering roles. Interview formats differ between companies (for example 45 to 60 minutes per round); the phase trains the reasoning those rounds assess, not one company's format.

Learning outcomes. After Phase 4, the learner can:

1. Explain what happens between a click and a response, and where time and load go.
2. Turn a vague product request into functional and non-functional requirements, and estimate load, storage, bandwidth, latency and cost with round numbers.
3. Draw a high-level design with clients, load balancers, services, caches, databases, queues and storage, and trace a request through it.
4. Choose between options (SQL or NoSQL, cache-aside or write-through, push or pull, strong or eventual consistency) and state the trade-off in one sentence.
5. Find the bottleneck and the single points of failure, and say, with its conditions, how the design behaves when a part fails.
6. Run a timed design interview: clarify, estimate, design, deep-dive, and summarize trade-offs.

## 2. How the path is built (zero to hero)

1. **Prerequisites are complete.** Each level lists every level it builds on. An idea used before its main lesson is explained briefly where it is used, and the lesson says where it is taught in full.
2. **Core and extension.** Each level has a core lesson that every learner completes. Advanced subtopics are marked **extension**: optional readings and challenges, not needed for later core lessons.
3. **From a problem to a fix.** Every level starts with a system that breaks under load, with numbers, and ends with the building block that fixes it and the price of that fix.
4. **See it, then predict it.** Walkthroughs use the 3D architecture diagram (D-079), with at least two prediction steps.
5. **Practice the decision.** Trade-off challenges ask which option fits stated requirements (D-057); design prompts ask for a short design.
6. **The interview routine grows step by step.** Early design prompts use a four-step scaffold; Level 42 teaches the full routine; case studies apply it; Level 53 tests it.
7. **Beginner rules for every level** (from Levels 28 and 29): a Key terms list, glossary explanations in Vietnamese (D-080), every calculation step shown, failure behavior stated with its conditions, and plausible wrong options.

## 3. Sources

Lessons are written from general knowledge of the field and checked against public and official references. References verify facts, numbers and terms; no text, diagrams or problem statements are copied from any book, course or article (AI content and IP policy, engineering standard). Unlicensed copies of books are not used.

### General references

| Reference | Access | Used for |
| --- | --- | --- |
| Google, *Site Reliability Engineering* and *The Site Reliability Workbook* | Free online | SLIs and SLOs, overload, cascading failures, tail latency, load balancing, monitoring |
| Amazon, *The Amazon Builders' Library* | Free online | Timeouts, retries and backoff, idempotent APIs, caching, avoiding overload |
| AWS Well-Architected Framework | Free online | Reliability, performance, backup and recovery, autoscaling |
| Google Cloud Architecture Center; Microsoft Azure Architecture Center (cloud design patterns) | Free online | Reference architectures; named patterns such as cache-aside, circuit breaker, queue-based load leveling, saga |
| Cloudflare Learning Center | Free online | DNS, CDNs, TLS, rate limiting, DDoS |
| MDN Web Docs (HTTP); IETF RFC 9110 (HTTP semantics), RFC 8446 (TLS 1.3) | Free online | HTTP methods and their idempotency, status codes, caching headers, WebSocket, TLS |
| PostgreSQL documentation, Concurrency Control | Free online | Isolation levels, locking, conflicting concurrent writes |
| Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly) | Paid | Replication, partitioning, consistency, transactions, streams |
| *The System Design Primer* (donnemartin, GitHub, CC BY 4.0) | Free online | Topic coverage check |

### Case study references (checked by Gemini, 2026-11-25)

| Level | Reference |
| --- | --- |
| 43 | AWS Compute Blog, *Build a Serverless, Private URL Shortener* |
| 44 | Stripe, *Scaling your API with rate limiters* |
| 45 | Airbnb Tech Blog, *Airbnb's Promotions and Communications Platform* |
| 46 | Engineering at Meta, *Serving Facebook Multifeed* |
| 47 | Discord, *How Discord Stores Trillions of Messages* |
| 48 | Engineering at Meta, *The Life of a Typeahead Query* |
| 49 | Netflix Technology Blog, *Per-Title Encode Optimization* |
| 50 | Uber Engineering, *H3: Uber's Hexagonal Hierarchical Spatial Index* |
| 51 | Airbnb Tech Blog, *Avoiding Double Payments in a Distributed Payments System* (no official ticketing source found) |
| 52 | Amazon DynamoDB documentation, partitions and data distribution |

Links are kept in the review notes of each level. Rules: a number or product claim needs a reference in the review notes; estimation numbers are marked as approximations; product limits change, so Gemini checks them at review time.

## 4. Level plan

Case studies (43 to 51) and Levels 52 and 53 all build on Level 42; this is not repeated in each row.

### Stage 1 — Foundations (Levels 28 to 32)

| Level | Title | Core | Extension | Builds on |
| --- | --- | --- | --- | --- |
| 28 | How a Request Travels (built) | Client and server, DNS, TCP and TLS, HTTP, latency vs throughput, latency numbers, estimation with powers of ten | — | 1 |
| 29 | Scaling Out and Load Balancing (built) | Vertical vs horizontal scaling, stateless services, sessions, L4 vs L7, round robin and least connections, health checks, capacity planning | — | 28 |
| 30 | Caching and CDNs | A minimal database model (a store that reads and writes rows, slower than memory; taught in full in 31), where to cache, cache-aside, TTL, hit and miss, stale data, one invalidation example, CDN basics | Write-through and write-back, LRU eviction, hot keys, thundering herd | 3, 28, 29 |
| 31 | Databases, Indexes and Concurrent Writes | Tables and documents, SQL vs NoSQL by access pattern, data modeling, primary keys, indexes (B-tree intuition), query cost, transactions and ACID at an intuitive level, two clients claiming the last seat at the same time, fixed with a conditional update or a unique constraint | Isolation levels, optimistic vs pessimistic locking in detail | 8, 28, 30 |
| 32 | APIs and Service Boundaries | REST resources, methods and status codes, pagination, versioning, which HTTP methods are idempotent (method meaning only; idempotency keys for application operations are Level 34), gRPC, polling, long polling, WebSocket and server-sent events, one service vs several services, a call chain between services | API gateways, backward-compatible changes | 28, 31 |

### Stage 2 — Data at scale (Levels 33 to 37)

| Level | Title | Core | Extension | Builds on |
| --- | --- | --- | --- | --- |
| 33 | Replication, Backup and Recovery | Leader-follower replication, read replicas, synchronous vs asynchronous, replication lag, read-your-writes, failover, backups, RPO and RTO, one restore scenario (replication is not a backup) | Split brain and fencing | 31 |
| 34 | Queues and Asynchronous Work | New material: what a message broker stores, acknowledgments, consumer progress. Queues vs pub/sub, event logs, at-least-once delivery, idempotency keys, retries with backoff, dead-letter queues, back-pressure | Ordering per key, batch vs stream processing | 6, 32 |
| 35 | Partitioning and Consistent Hashing | Range vs hash partitioning, shard keys, hot partitions, resharding, consistent hashing with virtual nodes | Secondary indexes on shards | 3, 31, 33 |
| 36 | Consistency and Availability | What a network partition is, strong vs eventual consistency with concrete examples, the availability trade-off during a partition (CAP), choosing per feature | PACELC, quorum arithmetic, conflict resolution | 33, 35 |
| 37 | Transactions Across Services | Isolation and optimistic vs pessimistic concurrency (recap of 31), why one database transaction is easier, a workflow that fails halfway, sagas with compensating steps, the outbox pattern | Two-phase commit and its costs, exactly-once as an effect | 31, 32, 34, 36 |

### Stage 3 — Production concerns (Levels 38 to 41)

| Level | Title | Core | Extension | Builds on |
| --- | --- | --- | --- | --- |
| 38 | Reliability, Overload and Autoscaling | Availability and nines, redundancy, timeouts, bounded retries with jitter, overload and load shedding, graceful degradation, autoscaling triggers, scale-out delay and a maximum capacity or cost (using the Level 29 example), rate limiting as an idea (algorithms are Level 44) | Circuit breaker states | 13, 29, 32, 34 |
| 39 | Observability and SLOs | Logs, metrics and traces, following a call chain, p50 vs p95 and p99 latency, why an average hides slow requests, SLI, SLO and error budgets, alerting on symptoms | Dashboard design | 32, 38 |
| 40 | Security for System Design | Authentication vs authorization, sessions vs tokens, OAuth at an intuitive level, HTTPS everywhere, secrets, least privilege, abuse and rate limits | Signed URLs, multi-tenant isolation | 29, 32, 38 |
| 41 | Storage, Search and IDs | Three separate readings, each with its own quick check: **A** object storage and one upload flow; **B** full-text search with an inverted index (supports 48); **C** unique ID generation: auto-increment, UUID, time-ordered IDs (supports 43) | Search ranking | A: 31, 32, 40; B: 3, 31; C: 31, 35 |

### Stage 4 — The interview method (Level 42)

| Level | Title | Core | Builds on |
| --- | --- | --- | --- |
| 42 | The Design Interview Method | The full routine: clarify requirements, estimate (requests, storage, bandwidth, latency budget, rough cost), API, data model, high-level design, one or two deep dives, failures with conditions, summary. Thinking aloud and managing time | Junior track core levels (section 5); 35 to 41 recommended |

### Stage 5 — Case studies (Levels 43 to 51)

Each case study applies the Level 42 routine and ends with one full design prompt. The **assessed deep dive** is what the design prompt grades beyond the routine.

| Level | Title | Assessed deep dive | Builds on |
| --- | --- | --- | --- |
| 43 | URL Shortener | Short-code collisions and how to detect them; redirect status codes and what they mean for caching | 30, 31, 41C |
| 44 | Rate Limiter Service | Atomic counters in a shared store; per-node vs global limits; fail-open or fail-closed when the store is down, with the reason | 13, 31, 36, 38 |
| 45 | Notification System | Provider quotas, deduplication, and user preferences enforced across channel retries | 34, 38 |
| 46 | News Feed | Hybrid fan-out with a numeric follower threshold for large accounts | 30, 34, 35 |
| 47 | Chat Service | Ordering within one conversation, reconnect and catch-up, delivery and read receipts | 32, 33, 34 |
| 48 | Search Autocomplete | Refreshing top-k per prefix in batches or incrementally; freshness vs query latency | 9, 26, 30, 34, 41B |
| 49 | Video Streaming | Segments and manifests, adaptive bitrate, distinct from storing one file | 30, 34, 40, 41A |
| 50 | Ride Sharing and Nearby Search | Selecting nearby candidates with a geospatial index vs choosing the match; how fresh a location must be | 34, 35, 41 |
| 51 | Ticket Booking | Atomic seat claim, the race between hold expiry and payment, compensation when payment fails | 31, 34, 36, 37, 38 |

### Stage 6 — Advanced and mock interviews (Levels 52 and 53)

| Level | Title | Core | Extension | Builds on |
| --- | --- | --- | --- | --- |
| 52 | Design a Distributed Key-Value Store (advanced branch) | A bounded partitioned and replicated store with stated guarantees | Repair protocols, failure detection in depth | 33, 35, 36, 38 |
| 53 | Mock System Design Interviews | Timed unseen prompts for the junior track and the mid-level track (section 5) | Advanced prompts after 52 | Track levels; 52 is not required |

## 5. Interview readiness

### Tracks

| Track | Core levels | Case studies | Mock prompts |
| --- | --- | --- | --- |
| Junior | 28–34, 38, 42 | 43–47 | Scoped to one service with a cache, a database and a queue |
| Mid-level | All of 28–42 | 43–51 | Several services, consistency, failure and cost trade-offs |
| Advanced (optional) | Mid-level track and 52 | — | Distributed storage deep dives |

### Observable expectations

| A junior candidate can | A mid-level candidate also can |
| --- | --- |
| State requirements and one load estimate with assumptions | Estimate storage, bandwidth, latency budget and rough cost |
| Draw clients, load balancer, service, cache, database and queue, and trace the main request | Split work into services and trace calls between them |
| Name one bottleneck and one failure, with what happens | Analyze replication lag, partitions, retries and overload, with conditions |
| Give one trade-off for a choice | Compare consistency models and justify a choice per feature |

### Pass standard for Level 53

- A mock is graded with the design rubric (section 6). It passes with at least 70 of 100 points and at least half of the points in every category.
- A design that breaks a stated hard requirement scores at most 60 and does not pass, whatever the other scores.
- After a mock that does not pass, the learner reads the feedback and the reference design, then tries a **different unseen prompt** of the same track.
- A learner is **ready** for a track after passing three unseen mocks of that track.

### Readiness map

| Interview area | Levels |
| --- | --- |
| Requirements and estimation | 28, 29, 42, all case studies |
| Networking, APIs and service boundaries | 28, 32 |
| Scaling, load balancing and autoscaling | 29, 38 |
| Caching and CDNs | 30 |
| Databases, indexes, data modeling | 31, 41 |
| Concurrency control | 31, 37, 44, 51 |
| Replication, backup and recovery | 33 |
| Partitioning and consistency | 35, 36 |
| Asynchronous processing | 34, 37 |
| Reliability, rate limiting, observability, tail latency | 38, 39, 44 |
| Security | 40 |
| Case studies | 43–51 |
| Deep distributed design | 52 |
| Timed practice | 53 |

## 6. Practice

1. **Trade-off challenges** (D-057): three per level. Every `valid` option meets all fixed requirements; the `why` names the condition that makes an option better.
2. **Design prompts (new problem kind):** two per level in Stages 1 to 3, one per case study, and the mock prompts of Level 53. Levels 28 and 29 receive their two prompts when the problem kind ships.
3. **Scaffold for early prompts.** Stages 1 to 3 prompts give four headings: requirements, one estimate, components, one failure or trade-off. Case studies give the Level 42 headings; Level 53 gives none.
4. **Rubric (100 points):** requirements and scope 20, estimation 15, high-level design 25, data and scaling 20, trade-offs and failures 20.
   - Each prompt states its scope. A design that meets the scope with fewer components earns full marks; extra components (shards, queues, more services) earn nothing by themselves.
   - Each prompt lists task-specific criteria under the five categories, and its review notes include at least two different designs that would earn full marks.
   - Failure analysis earns points for reasons and conditions, not for the number of failures listed.
5. **After grading:** rubric feedback first; then the learner may open a **reference design** that states its assumptions and the alternatives. It is never called the correct answer.

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
| 1 | Levels 30, 31 and 32 (Stage 1 complete) |
| 2 | Design prompt kind: format, scaffold, rubric with task criteria, grading prompt, answer box, reference design; prompts for Levels 28 to 32 |
| 3 | Stage 2 (33–37), Stage 3 (38–41), Level 42 |
| 4 | Case studies 43–51 |
| 5 | Level 52, then Level 53 with the pass standard |

Estimate, with its assumptions: 24 levels remain (30 to 53). At about two levels per sprint, content alone takes about 12 sprints; the design prompt kind adds about one sprint. Stages 1 to 4 (13 remaining levels) take about 7 sprints of content plus the prompt kind. Review, translation and PO checks run alongside authoring and are included in the two-levels-per-sprint pace; the pace is reviewed after each stage.

## 9. Decisions to confirm

| Question | Recommendation |
| --- | --- |
| Level list: 26 levels (28 to 53) | Approve |
| Core and extension material in one level | Approve |
| Junior and mid-level tracks with the Level 53 pass standard | Approve |
| After grading a design prompt | Rubric feedback, then an optional reference design |
| Design Patterns elective | Stays a separate elective with no gate (D-070) |
| XP and gates | Deferred by the PO |
