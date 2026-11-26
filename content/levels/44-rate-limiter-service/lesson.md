# Rate Limiter Service

## Learning objectives

- Explain the token bucket and the sliding window, and choose one for a stated burst or window requirement.
- Keep a limit exact when many servers count at once, with atomic updates in a shared store.
- Compare limits kept on each server with one global limit, and say when each is good enough.
- Decide whether a limiter fails open or fails closed when its store is down, with the reason.
- Apply the full design routine to a rate limiter service, with estimates for the store's load and memory.

### Key terms

- **Rate limiter.** A check in front of an API that counts each client's requests and refuses the extra, usually with **429 Too Many Requests** and a **Retry-After** header saying when to try again (SD 11).
- **Fixed window.** One counter per client per minute (or second). Simple, but a client can send a full minute's limit at 0:59 and again at 1:00.
- **Sliding window.** A limit over the last 60 seconds counted from now, not from the top of the minute. A **sliding log** keeps the time of every request; a **sliding counter** estimates from the current and previous minutes' counts.
- **Token bucket.** Each client has a bucket of up to *B* tokens that refills at *r* tokens per second. Each request takes one token; with no token, the request is refused. It allows a burst of up to *B* after a quiet time and *r* per second in the long run.
- **Atomic update.** A read, a decision and a write done as one step that no other request can split, such as an increment in the store or a small script that runs in the store.
- **Per-node limit.** Each server enforces its own share of the limit, with no shared store.
- **Global limit.** All servers check one shared count, so the limit holds however requests are spread.
- **Fail-open / fail-closed.** When the limiter cannot check, it either lets requests through (open) or refuses them (closed).

## Problem hook

A payments company opens its API to developers. One customer's script has a bug and sends 5,000 requests per second; the database slows for everyone. The team adds a limit of 100 requests per minute per API key, and counts in each server's memory. The next week a large customer complains that it is refused at 25 requests per minute, and an attacker gets 400 per minute through. Then the shared store holding the counts restarts, and for two minutes the team must decide: let every request through, or refuse everyone?

A rate limiter looks like a counter. Its real questions are which counting rule matches the promise, where the count lives, how many servers can update it safely, and what happens when it cannot count.

## Intuition

Think of a ticket machine at a busy museum. A **fixed window** gives out 100 tickets per hour, starting fresh on the hour: 100 people can enter at 10:59 and another 100 at 11:00. A **token bucket** is a jar of up to 20 tickets that a guard refills with one ticket every 36 seconds: a group of 20 can enter together after a quiet spell, but over a day no more than 100 an hour get in.

If the museum has four doors, each with its own jar of 5 (**per-node**), a group that comes to one door finds only 5 tickets, even though the other doors have plenty. One shared jar (**global**) is fair, but every door must walk to it, and two guards who look into the jar at the same moment may both take its last ticket, unless taking a ticket is one quick action (**atomic**). And if the shared jar is locked away, the guards must decide: let everyone in (**open**) or nobody (**closed**).

**A link to earlier levels.** The sliding window is the technique of Level 13; the shared in-memory store and its replica come from SD 3 and SD 6; atomic conditional updates come from SD 4 and SD 9; 429 and Retry-After come from SD 11.

## When to use

- **Token bucket:** when clients may burst after a quiet time but must keep a long-run rate; it needs only two numbers per client: tokens left and the last refill time.
- **Sliding log:** when the promise is exact, such as "never more than 1,000 in any 60 minutes", and clients are few enough to keep one timestamp per request.
- **Sliding counter or fixed window:** when an estimate is enough and memory must be tiny; a fixed window allows up to twice the limit across a window edge.
- **Atomic updates in a shared store:** whenever more than one server counts for the same client and the limit must hold.
- **Per-node limits:** when an approximate limit is fine and requests are spread evenly, or as a fallback when the shared store is down.
- **Fail-open:** for limits that protect fairness on cheap, important requests, such as reading a product page, where refusing everyone is worse than a few extra requests.
- **Fail-closed:** for actions where each extra request costs real money or harm, such as sending paid text messages, or where a provider would block the whole service.

## Template code

There is no code in this level. Apply the **routine** with these questions for a rate limiter:

```text
1. Requirements: who is limited (key, user, address), the limit and
   window, bursts allowed or not, what a refused client is told.
2. Estimates: checks per second = requests per second; store memory =
   clients x bytes per client; extra time per request.
3. API: the limiter answers allow or refuse; refused requests get 429
   with Retry-After.
4. Data model: per client, a counter with an expiry, or tokens and the
   last refill time, or a list of timestamps.
5. High-level design: limiter in the servers or a gateway, shared store
   with a replica.
6. Deep dive: the counting rule; one atomic step in the store;
   per-node or global.
7. Failures: store down or slow: fail open or closed, and why; a local
   fallback limit.
8. Summary: each requirement and how it is met.
```

## Complexity

**Fixed window at the edge.** With 100 per minute, a client can send 100 at 0:59.9 and 100 more at 1:00.0: 200 requests within about a second, twice the limit.

**Token bucket.** With room for 20 tokens and a refill of 100 per minute (about 1.67 per second), a client that has been quiet sends 20 at once, then about 1.67 per second. Over any minute it gets at most 20 + 100 = 120.

**Store load.** Every request needs one check: at 50,000 requests per second, 50,000 store operations per second. A store node that handles about 100,000 simple operations per second takes that with room, plus a replica for failover.

**Memory.** A token bucket needs about 100 bytes per client with its key: 1 million API keys take about 100 MB. A sliding log with up to 100 timestamps of 16 bytes per client takes about 1.6 KB per client, 1.6 GB for a million.

**A race without atomic updates.** Two servers read a client's count of 99 at the same moment, both see room for one more, and both write 100: 101 requests got through. Thousands of servers make larger overshoots. An increment or a script that runs in the store does the read, the check and the write in one step.

| Choice | Holds the limit when requests spread | Extra cost per request | When the store is down |
| --- | --- | --- | --- |
| Per-node limit (limit ÷ servers each) | Only if spread evenly; a client stuck to one server gets a fraction | None | Unaffected |
| Global limit in a shared store | Yes | One store call, about 1 ms | Must fail open or closed, or fall back to per-node |

## Common mistakes

- **Read, then write.** Two servers read the same count and both allow a request; the limit is crossed with no error anywhere.
- **Per-node limits with sticky clients.** A client whose connections all land on one server gets only that server's share of the limit.
- **A fixed window for a strict promise.** "At most 100 per minute" can mean 200 within two seconds at the window edge.
- **No decision on failure.** If the store times out and the code throws an error, the limiter has failed closed by accident, possibly taking the API down.
- **Counts that never expire.** Every key ever seen stays in memory; give each counter an expiry a little longer than its window.

## Edge cases

- **Very large customers.** One key sending 20,000 requests per second makes one store key hot (SD 8); give such a key a per-node share, or split its count over several keys.
- **Clocks.** Servers with different clocks disagree on window edges; let the store's clock, or the time inside its script, decide.
- **Several limits at once.** A request may pass a per-key limit and a global limit for the whole service; check both in the same atomic step, or the cheaper one first.
- **Retries.** Clients that retry at once after a 429 waste capacity; Retry-After tells them when to come back, and backoff with jitter spreads them out (SD 11).

### Extension (optional): the sliding window counter

The sliding counter keeps only two numbers per client: this minute's count and last minute's count. At 40% of the way through the current minute, it estimates the last 60 seconds as current + 60% × previous. With 30 so far this minute and 90 last minute, the estimate is 30 + 0.6 × 90 = 84, under a limit of 100. It assumes last minute's requests were spread evenly, so it is close but not exact, and it uses as little memory as a fixed window.

## Worked example

**Problem:** A public API has 1 million API keys and 20 servers behind a load balancer, and handles up to 50,000 requests per second at peak. Each key may make 100 requests per minute, and may send up to 20 at once after a quiet time. Refused requests get 429 with Retry-After. The limiter may add at most 2 ms to a request. Measured: a shared in-memory store node answers a small script within 1 ms and runs about 100,000 per second; it can run with a replica that takes over within 2 seconds. Design the limiter, including what happens if the store is down.

**Solution:**

1. **Requirements.** (F1) 100 per minute per key, bursts of 20. (F2) 429 with Retry-After. (N1) 50,000 checks per second. (N2) At most 2 ms added. (N3) The limit holds however the load balancer spreads requests. Out of scope: limits per user inside a key.
2. **Estimates.** 50,000 store calls per second, half of one node's 100,000. Memory: 1 million keys × about 100 bytes = 100 MB.
3. **API.** Each server asks the limiter `allow(key)` before handling a request; refused requests get 429 and `Retry-After` with the seconds until the next token.
4. **Data model.** Per key in the store: tokens left and the last refill time, with an expiry of a few minutes after the last request.
5. **High-level design.** Clients → load balancer → API servers, each calling the shared store with a replica.
6. **Deep dive.** A token bucket with room for 20 and a refill of 100 per minute matches "bursts of 20, 100 per minute in the long run". One script in the store refills by the time passed, takes a token if there is one, and saves the result, as one atomic step: no two servers can both take the last token. Because the count is global, a client whose requests all reach one server still gets its full 100. One call takes about 1 ms, within 2 ms.
7. **Failures.** If the store's main copy fails, the replica takes over within 2 seconds; tokens taken in the last moment may be lost, letting a few extra requests through. If the store is unreachable, the API fails open with a per-node fallback: each server allows 100 ÷ 20 = 5 per minute per key, plus a small burst, because refusing every request would take the whole API down for a short store outage, while a few extra requests per key are cheap.
8. **Summary.** F1 by the token bucket; F2 by 429 with Retry-After; N1 at half a node's capacity; N2 by one 1 ms call; N3 by the global, atomic count; store outages handled by failing open to per-node limits.

**Answer:** A token bucket per key (room for 20, 100 per minute) kept in a shared in-memory store, updated by one atomic script per request: 50,000 calls per second, about 100 MB, 1 ms each. The global count holds however requests are spread. If the store is down, the API fails open to per-node limits of 5 per minute per key, because a short outage should not refuse every client.
