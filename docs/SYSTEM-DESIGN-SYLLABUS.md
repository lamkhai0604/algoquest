# Phase 4 Syllabus — System Design

| Field | Value |
| --- | --- |
| Status | Draft for PO review |
| Updated | 2026-11-24 |
| Levels | 28 to 41, appended after Level 27 (level numbers are fixed, D-056) |
| Owner | PO |
| Authoring | Claude drafts; ChatGPT reviews accuracy and translates; Gemini checks volatile facts and makes images; the PO approves |

## 1. Purpose

Phase 4 teaches how to design a system that serves many users: how a request travels, where it slows down, and which building block removes each bottleneck, with the trade-off each one brings. It ends with full case studies and a repeatable interview routine, in the same way Phase 3 ends with Interview Practice.

Learning outcomes. After Phase 4, the learner can:

1. Turn a vague product request into functional and non-functional requirements, and estimate load and storage with round numbers.
2. Draw a high-level design with clients, load balancers, services, caches, databases, queues and storage, and trace one request through it.
3. Choose between options (SQL or NoSQL, cache-aside or write-through, push or pull) and state the trade-off in one sentence.
4. Find the bottleneck and the single points of failure in a design, and say how the design behaves when a part fails.
5. Run a 45-minute design interview: clarify, estimate, design, deep-dive, and summarise trade-offs.

## 2. Sources for checking facts

There is no single standard text, so every lesson is checked against public references. They are used to verify facts and terms, never copied (AI content and IP policy, engineering standard).

| Reference | Used for |
| --- | --- |
| Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly) | Replication, partitioning, consistency, transactions, stream processing |
| *System Design Primer* (donnemartin, GitHub) | Topic coverage and common interview case studies |
| Google, *Site Reliability Engineering* (free online edition) | SLIs and SLOs, monitoring, overload, cascading failures |
| AWS Well-Architected Framework; Google Cloud Architecture Center | Reliability and scaling practices; managed service behaviour |
| Official documentation of each named product (Redis, PostgreSQL, Kafka, nginx, and so on) | Any product-specific claim, limit or default |

Rules:

- A number or a product claim in a lesson needs a reference in the review notes. Round numbers for estimation (for example "a day is about 10^5 seconds") are marked as approximations in the lesson.
- Product limits and defaults change; Gemini checks them against current documentation at review time.
- Names stay in English in both languages (load balancer, cache, shard, replica), with a short Vietnamese gloss the first time.

## 3. Level plan

### Part A — Building blocks (Levels 28 to 35)

| Level | Title | Main ideas | Builds on |
| --- | --- | --- | --- |
| 28 | How a Request Travels | Client and server, DNS, HTTP, latency vs throughput, rough latency numbers, back-of-the-envelope estimation | 1 (Big-O as cost thinking) |
| 29 | Scaling Out and Load Balancing | Vertical vs horizontal scaling, stateless services, session storage, L4 vs L7 load balancers, round robin and least connections, health checks | 28 |
| 30 | Caching | Where to cache (browser, CDN, server, database), cache-aside, write-through, write-back, TTL, LRU eviction, invalidation, hot keys, thundering herd | 3 (hash maps), 29 |
| 31 | Databases and Replication | SQL vs NoSQL by access pattern, indexes, leader-follower replication, read replicas, replication lag, failover | 8 (trees, for indexes) |
| 32 | Partitioning and Consistent Hashing | Range vs hash partitioning, shard keys, hot partitions, resharding, consistent hashing with virtual nodes | 3, 31 |
| 33 | Consistency and Availability | CAP and PACELC, strong vs eventual consistency, read-your-writes, quorums, idempotent writes | 31, 32 |
| 34 | Queues and Asynchronous Work | Message queues vs pub/sub, at-least-once delivery, idempotency keys, retries with backoff, dead-letter queues, back-pressure | 6 (queues), 9 (priority queues) |
| 35 | Reliability and Observability | Timeouts, rate limiting, circuit breakers, redundancy, SLI and SLO, logs, metrics, traces | 13 (sliding window, for rate limits) |

### Part B — Case studies (Levels 36 to 40)

Each case study follows the same routine: requirements, estimation, API, data model, high-level design, one or two deep dives, trade-offs and failures.

| Level | Title | Deep dives | Uses |
| --- | --- | --- | --- |
| 36 | URL Shortener | ID generation (counter vs hash vs random), read-heavy caching, redirects | 28–32 |
| 37 | Rate Limiter Service | Token bucket vs sliding window, a shared counter store, limits per user and per IP | 13, 30, 35 |
| 38 | Autocomplete | Trie of top queries, precomputed top-k per prefix, updating counts offline | 26 (tries), 9 (heaps), 30 |
| 39 | News Feed | Fan-out on write vs on read, celebrity accounts, ranking, feed cache | 30, 32, 34 |
| 40 | Chat Service | Persistent connections (WebSocket), message ordering and delivery receipts, presence, storage of history | 31–34 |

### Part C — Interview (Level 41)

| Level | Title | Main ideas |
| --- | --- | --- |
| 41 | System Design Interview Practice | A 45-minute routine with time boxes, how to clarify, what to estimate, how to choose deep dives, how to summarise trade-offs; mixed prompts without the topic given |

## 4. Lesson format

The lesson template (CONTENT-GUIDE §2) stays, with these system-design readings:

| Part | In Phase 4 |
| --- | --- |
| Problem hook | A product that breaks under load, with the numbers that show why |
| Intuition | An everyday comparison (a restaurant with more waiters for scaling, a coat check for caching) |
| When to use | The requirement or symptom that calls for this building block |
| How it works | Walkthrough of one request or one failure through the architecture |
| Template code | Replaced by a **design template**: a short checklist or a small piece of code where it helps (a token bucket, a consistent-hash ring) |
| Complexity | Replaced by **cost and limits**: latency added, throughput, storage, and what fails first |
| Common mistakes | Typical design mistakes (caching without invalidation, a shard key that makes hot spots) |
| Worked example | One design prompt answered in full |
| Quick check | 2–3 questions, including at least one estimate |

Walkthrough drawing. The first sprint uses the existing graph drawing: services are vertices, connections are edges, and the travelled edges animate a request. A dedicated architecture drawing (component icons, labelled arrows, a request token moving along) is a later option if the graph drawing is not clear enough.

## 5. Practice: two kinds of exercises

Coding problems need hidden tests, which most design questions cannot have. Phase 4 therefore uses:

1. **Trade-off challenges** (existing pattern challenges, D-057): the learner picks an option ("cache-aside or write-through for a profile page?") and explains why. The label decides whether the choice is right; the AI grades the reason. No new code.
2. **Design prompts (new):** the learner writes a short design answer to a prompt ("Design the storage for a URL shortener that serves 10,000 redirects a second"). The AI grades it with a design rubric. This needs a new problem kind, a rubric and grading prompt, and an answer box with sections; it is the first build task of Phase 4.

Proposed design rubric (100 points):

| Criterion | Points | Meaning |
| --- | --- | --- |
| Requirements and scope | 20 | Functional and non-functional requirements; what is out of scope |
| Estimation | 15 | Load and storage with stated assumptions; order of magnitude is enough |
| High-level design | 25 | The components and the path of the main request |
| Data and scaling | 20 | Data model, access pattern, how it scales (cache, replicas, shards, queues) |
| Trade-offs and failures | 20 | At least two trade-offs named; what happens when a component fails |

Each Part A level has about 3 trade-off challenges and 2 design prompts; each case study has 1 full design prompt plus 3 trade-off challenges; Level 41 has 5 design prompts.

## 6. Authoring workflow per level

| Step | Who | Output |
| --- | --- | --- |
| 1 | Claude | Lesson, walkthrough, quick check, challenges and prompts, with review notes listing the reference for each fact |
| 2 | ChatGPT | Review against the checklist below; list of errors and gaps |
| 3 | Claude | Fixes, or a reason when a suggestion is not taken |
| 4 | Gemini | Check of product facts and numbers against current documentation; decorative image from a prompt |
| 5 | ChatGPT | Vietnamese translation |
| 6 | PO | Review in the app; merge |

Review checklist:

- Every claim is correct and has a reference in the review notes.
- Every trade-off names both sides; no option is presented as always right.
- Estimates state their assumptions and use round numbers consistently.
- Terms match the glossary of earlier Phase 4 levels.
- Quick check answers are unambiguous; each wrong option is a realistic mistake.
- Design prompts can be answered in about 300 words; the rubric can grade them.

## 7. Delivery plan

| Sprint | Scope |
| --- | --- |
| 25 | Design prompt kind (problem format, rubric, grading prompt, answer box); Phase 4 on the Learning Path; Level 28 complete as the standard for the phase |
| 26 | Levels 29 and 30 |
| 27 | Levels 31 and 32 |
| 28 | Levels 33 and 34 |
| 29 | Level 35; Part A review |
| 30 and later | Case studies (36 to 40), then Level 41 |

The pace follows Level 4 in Phase 1: one level done well sets the standard before later levels speed up.

## 8. Open questions for the PO

1. Is the level list right, and is 14 levels the right size? Candidates to add or swap: object storage and CDNs as a level of their own; a "Design a ride-sharing service" or "Design a video service" case study.
2. Should design prompts show a model answer after grading, or only the rubric feedback?
3. Should the Design Patterns elective follow Phase 4, or come between Phases 3 and 4?
