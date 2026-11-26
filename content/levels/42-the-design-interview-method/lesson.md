# The Design Interview Method

## Learning objectives

- Run the full routine for a design question: clarify, estimate, API, data model, high-level design, one or two deep dives, failures, summary.
- Turn a vague question into numbered requirements, with what is in and out of scope.
- Estimate requests, storage, bandwidth, a latency budget and a rough cost, and let the numbers drive choices.
- Choose a deep dive where the hardest requirement is, and state each failure with its condition.
- Think aloud and keep to a time plan, so a 45-minute interview ends with a complete design.

### Key terms

- **Functional requirement.** What the system must do, such as "a player can see the top 100 scores".
- **Non-functional requirement.** How well it must do it, with a number: load, latency, availability, freshness, such as "a new score shows in the ranking within 5 seconds".
- **Scope.** What this design covers and what it leaves out, said out loud so the time goes to the right parts.
- **Back-of-the-envelope estimate.** A quick calculation with round numbers, such as "10 million players × 20 games ÷ 100,000 seconds a day ≈ 2,000 writes per second", good to within a factor of a few.
- **Latency budget.** A target time for one request, split across the steps it passes through, so each part gets a limit.
- **Data model.** The main records, their keys and the queries that read them.
- **High-level design.** The boxes and arrows: clients, load balancer, servers, stores, queues, and how a request flows through them.
- **Deep dive.** A closer look at one part, usually where the hardest requirement or the biggest number is.
- **Thinking aloud.** Saying your reasons and assumptions as you go, so the interviewer can follow, correct and help.

## Problem hook

An interviewer says: "Design a leaderboard for a mobile game." Many candidates start drawing servers at once. Twenty minutes later they have six boxes, no numbers, a database that cannot answer "what is my rank?" in time, and no time left to talk about failures.

The question is the same in every system design interview: vague on purpose, with too much to cover in 45 minutes. A fixed routine turns it into a series of small decisions, each backed by a number from the step before.

## Intuition

Think of a builder asked to "build a house". A good builder does not start with bricks. First they ask: how many people, how many floors, what budget, which climate (requirements). Then they measure the land and price the materials (estimate). Then they draw the doors and rooms people use (API and data model), the plan of the whole house (high-level design), and the hard parts in detail, such as the roof in a snowy town (deep dive). Finally, they say what happens if a pipe bursts (failures), and walk the owner through the plan (summary).

The owner is in the room the whole time, so the builder talks while drawing: "I'm assuming two floors; tell me if that's wrong." That is what an interviewer wants to hear.

**A link to SD 1 to SD 14.** Every step reuses earlier levels: estimates from SD 1, servers and load balancers from SD 2, caching from SD 3, databases from SD 4, APIs from SD 5, queues from SD 7, reliability from SD 11, and the rest as needed.

## When to use

- **The whole routine:** in every system design interview and in every design document, even when the system is small; a short step is fine, a skipped step is not.
- **Clarifying first:** always, for the first few minutes. Ask about users, scale, the most important features and the most important quality, such as latency or consistency.
- **Estimates:** before choosing components, so the choices follow from the numbers: one database or several, a cache or not, a queue or not.
- **A deep dive:** where the hardest requirement is, or where the interviewer points; one done well beats three done briefly.
- **Failures with conditions:** for each important part, say what fails, when, and what users see.
- **In AlgoQuest's design prompts:** the answer form has four boxes. Put clarified requirements and scope in the first, all estimates in the second, the API, data model, high-level design and deep dive in the third, and failures and a one-line summary in the fourth.

## Template code

There is no code in this level. Use this **routine** for any design question, with a time plan for 45 minutes:

```text
1. Clarify (5 min): functional and non-functional requirements, with
   numbers; what is out of scope.
2. Estimate (5 min): requests per second (average and peak), storage,
   bandwidth, a latency budget per step, a rough cost.
3. API (3 min): the main calls, their inputs and outputs.
4. Data model (4 min): the main records, keys, and the queries.
5. High-level design (8 min): boxes and arrows; walk one request through.
6. Deep dive (10 min): one or two parts with the hardest requirement.
7. Failures (5 min): what fails, under which condition, what users see.
8. Summary (3 min): how the design meets each requirement; what you
   would do next. Leave a few minutes for questions.
```

## Complexity

**Requests per second from users.** A day has 86,400 seconds; round it to 100,000 for quick sums. If 10 million players play 20 games a day, that is 200 million scores a day, about 2,000 per second on average. Peaks are often a few times the average; assume 5×, about 10,000 per second.

**Storage.** 50 million players × about 100 bytes per score record = 5 GB: small enough to keep in the memory of one in-memory store, with a copy.

**Bandwidth.** A top-100 list of about 100 bytes per row is 10 KB. At 5,000 reads per second, that is 50 MB per second, which a cache or CDN in front of the servers can carry.

**Latency budget.** For a 200 ms target on "my rank": up to 100 ms of network to and from the phone, 10 ms at the load balancer and server, 5 ms in the in-memory store, leaving about 85 ms to spare.

**Rough cost.** Ten servers at an assumed $200 a month each is $2,000 a month; the in-memory store with a copy adds a few hundred. Numbers like these show whether a design is reasonable, not exact prices.

| Step | Output | Typical mistake |
| --- | --- | --- |
| Clarify | Numbered requirements with numbers; scope | Designing before knowing the scale |
| Estimate | Requests per second, storage, bandwidth, latency budget, cost | Numbers that no later choice uses |
| API and data model | Calls and records that serve every requirement | A data model that cannot answer the main query fast |
| High-level design | One request walked through the boxes | Boxes with no reason to exist |
| Deep dive | The hardest part, in detail | Spreading thin over everything |
| Failures and summary | Conditions and what users see; requirements checked | "It's highly available" with no condition |

## Common mistakes

- **Starting with the boxes.** Without requirements and numbers, every component is a guess, and the interviewer cannot tell why it is there.
- **Estimating and then ignoring the estimate.** If 5 GB fits in memory, say so and use it; if 10,000 writes per second is too much for one database, say what you do about it.
- **Going silent.** Long silences hide good reasoning. Say what you are deciding and why, and ask when an assumption matters.
- **Running out of time.** Spending 25 minutes on the API leaves no deep dive and no failures. Glance at the clock after each step.
- **Vague failures.** "We add redundancy" says nothing. "If the in-memory store's main copy fails, its replica takes over within seconds; scores written in that gap are replayed from the database" does.

## Edge cases

- **The interviewer changes a requirement halfway.** Say which earlier choices it affects, update the estimate, and change only those parts.
- **The interviewer asks for a deep dive you did not plan.** Follow them; their question shows what they want to assess.
- **You do not know a technology they name.** Say so, describe what you would need from it, and design with a component you understand.
- **Numbers that seem unreasonable.** Say the result out loud and sanity-check it: 2 million writes per second for a small game probably means a slipped zero.

### Extension (optional): reading the interviewer

Interviewers usually give hints: a follow-up question about one part ("what happens when two scores arrive at once?") means they want to go deeper there; "let's not worry about that" means move on. Check in briefly after the requirements and after the high-level design: "Does this match what you had in mind before I go deeper?" It costs ten seconds and can save ten minutes.

## Worked example

**Problem:** Design a leaderboard for a mobile game. Use the routine and the time plan.

**Solution:**

1. **Clarify.** Functional: (F1) a player submits a score after each game; (F2) anyone can see the global top 100; (F3) a player can see their own rank. Non-functional: (N1) 10 million daily players, about 20 games each, 50 million players in total; (N2) a new best score shows in the rankings within 5 seconds; (N3) "my rank" answers within 200 ms; (N4) only each player's best score counts. Out of scope: friends' leaderboards, cheating detection.
2. **Estimate.** 10 million × 20 = 200 million scores a day ÷ 100,000 ≈ 2,000 writes per second, about 10,000 at peak. 50 million players × 100 bytes = 5 GB. Top-100 reads: 10 KB each. Latency budget for N3: 100 ms network, 10 ms server, 5 ms store, spare 85 ms. Cost: about 10 servers and one in-memory store with a copy, a few thousand dollars a month.
3. **API.** `POST /scores {score}` → 202 Accepted; `GET /leaderboard/top?n=100`; `GET /leaderboard/me` → rank and score. The player comes from the login (SD 13), never from the request body.
4. **Data model.** In the database: `best_scores(player_id PK, score, updated_at)`. In an in-memory store: a sorted set of (score, player_id), which keeps players ordered by score and answers "rank of player" and "top 100" in about log₂(50 million) ≈ 26 steps.
5. **High-level design.** Phone → load balancer → app servers. A score write updates `best_scores` only if higher, then updates the sorted set. "Top 100" is cached for 1 second in front of the servers; "my rank" reads the sorted set.
6. **Deep dive: the sorted set.** 10,000 writes per second at peak and 5 GB fit one in-memory store, with a replica for failover. Only higher scores update it, so most writes do nothing after the first games of the day. N2 holds because the update happens in the same request, well within 5 seconds.
7. **Failures.** If the store's main copy fails, the replica takes over within seconds; scores written in the gap are still in `best_scores` and are written again to the set. If both are lost, the set is rebuilt from `best_scores` (50 million rows, minutes), while the cached top 100 stays visible and "my rank" shows "updating". If the database is slow, writes queue briefly and N2 may be missed for that time.
8. **Summary.** F1 to F3 by the API; N1 by 10,000 writes per second on one sorted set; N2 by updating in the same request; N3 by a 5 ms rank lookup in a 200 ms budget; N4 by "update only if higher".

**Answer:** Requirements with numbers, then about 2,000 writes per second (10,000 peak) and 5 GB, so one in-memory sorted set with a replica answers ranks in about 26 steps, with best scores kept in the database for rebuilds. A 1-second cache serves the top 100. Failures are stated with conditions, and the summary checks each requirement.
