# Reliability, Overload and Autoscaling

## Learning objectives

- Turn an availability target into allowed downtime, and work out the availability of parts that are all needed and of parts that back each other up.
- Protect a server from a slow dependency with timeouts, and retry without making a failure worse: few attempts, backoff with jitter, and a retry budget.
- Explain what happens when more requests arrive than servers can finish, and choose between load shedding and graceful degradation.
- Plan autoscaling: what triggers it, the delay before new servers help, and the maximum that cost allows.
- Describe rate limiting as a way to stop one client from using up shared capacity.

### Key terms

- **Availability.** The share of time a service answers correctly. It is often written as a number of **nines**: 99.9% ("three nines") allows about 43 minutes of downtime in a 30-day month.
- **Redundancy.** Running two or more copies of a part so that one can fail while another keeps serving, such as several servers behind a load balancer (SD 2).
- **Timeout.** The longest a caller waits for an answer before it gives up (SD 5).
- **Backoff and jitter.** Waiting longer before each new retry (backoff), and adding a random amount to each wait (jitter) so that many clients do not retry at the same moment.
- **Retry storm.** Retries from many callers, or from several layers at once, that pile extra load on a service that is already failing.
- **Retry budget.** A limit on retries as a share of normal requests, such as at most 10%, so retries cannot multiply the load on a struggling service.
- **Overload.** More requests arrive than the servers can finish, so waiting requests pile up.
- **Load shedding.** Refusing some requests quickly, with "try again shortly", so the servers can finish the rest on time.
- **Graceful degradation.** Turning off optional work, such as recommendations, so that each request costs less and the important features keep working.
- **Autoscaling.** Adding or removing servers automatically when a measure such as average CPU crosses a target.
- **Scale-out delay.** The time between deciding to add a server and that server taking requests: noticing the rise, starting the server, and passing its health checks.
- **Rate limiting.** Capping how many requests one client may send in a period, and refusing the extra with "too many requests".

## Problem hook

The shop from SD 2 runs six servers behind a load balancer. Each server can finish about 300 requests per second, and the team keeps them near 65% of that.

On the evening of a sale, the card provider slows down, then traffic jumps to 2,400 requests per second. Within a minute every server is busy, pages take ten seconds, and phones retry each failed tap three times, which makes it worse. The autoscaler starts new servers, but they need four minutes to arrive. Nothing was broken, yet the shop was down: it had no plan for a slow dependency or for more load than it could carry.

## Intuition

Think of a busy restaurant. The kitchen can cook a fixed number of meals an hour. When more guests arrive than it can feed, seating everyone only makes every table wait longer, until guests leave before their food comes. A good host does three things. They offer a shorter menu that cooks faster (graceful degradation). They tell late arrivals the honest wait, or to come back later, instead of seating them (load shedding). And they call in an extra cook, knowing the cook needs 45 minutes to arrive (scale-out delay).

Guests who ask the waiter "is it ready yet?" every minute do not make the kitchen faster; they slow it down. Retries are the same: one retry can save a request, but many retries from many callers at once are more load on a system that is already struggling.

**A link to SD 2, SD 5 and SD 7.** The servers, load balancer and health checks are from SD 2, the timeouts from SD 5, and retries with backoff from SD 7. This level is about what happens when those parts are under stress.

## When to use

- **Redundancy:** for every part whose failure would stop the service, such as the servers and the load balancer, as long as the copies fail independently.
- **A timeout on every call to another service:** always. Set it a little above the slowest normal answer, and below what the caller can afford to wait.
- **Retries:** only for errors that may succeed a moment later, only for requests that are safe to repeat (SD 7), at one layer, a few times, with backoff and jitter.
- **Graceful degradation:** when part of each request is optional and costs a real share of the work, such as recommendations or a live counter.
- **Load shedding:** when the servers still cannot keep up after degrading; refuse the extra early and cheaply, starting with the least important requests.
- **Autoscaling:** when load changes over minutes or hours; for a sudden jump, also keep spare capacity or scale before a known event, because new servers arrive late.
- **Rate limiting:** when one client, or a bug in one client, could take capacity that others need.

## Template code

There is no code in this level. Use this **design template** for reliability under stress:

```text
1. Availability: which parts must all work? Multiply their availability.
   Which have a copy? 1 - (chance one copy is down) x (chance the other is).
   Add copies where one part limits the whole.
2. Every call to another service: a timeout a little above the slowest
   normal answer. Busy workers = requests per second x seconds each waits.
3. Retries: one layer only, a few attempts, backoff with jitter, a retry
   budget (such as 10% of requests), and only for safe requests.
4. Capacity: servers x limit per server. If more arrives, decide what to
   turn off first (degrade), then what to refuse quickly (shed).
5. Autoscaling: the trigger, the delay until new servers help, the
   maximum number of servers that cost allows, and what covers the gap.
6. Rate limits: per client, so one client cannot use up shared capacity.
```

## Complexity

**Nines as downtime.** A 30-day month has 30 × 24 × 60 = 43,200 minutes. At 99% the service may be down 1% of that, 432 minutes (about 7 hours); at 99.9%, 43.2 minutes; at 99.99%, about 4.3 minutes. Each extra nine allows ten times less downtime.

**Parts that are all needed (in series).** If a request needs the server tier and the database, both must be up: multiply. With one server at 99.9% and a database at 99.9%, the whole is 0.999 × 0.999 ≈ 0.998, or 99.8%: about 86 minutes of downtime a month, twice as much as either part alone.

**Parts that back each other up (in parallel).** With two servers at 99.9% each, the tier is down only if both are down: 0.001 × 0.001 = 0.000001, so the tier is up 99.9999% of the time. This holds only if the copies fail independently and the load balancer moves traffic within seconds; two copies on the same machine, or the same bad release on both, fail together.

**How long requests hold a worker.** The number of busy workers is about requests per second × seconds each request takes. At 50 payment requests per second, a call that hangs for 30 seconds needs 50 × 30 = 1,500 workers; with a 300 ms timeout it needs at most 50 × 0.3 = 15.

**How retries multiply.** If three layers each try up to 3 times, one user action can reach the bottom layer 3 × 3 × 3 = 27 times while it is failing. A retry budget of 10% keeps the extra load at about 1.1 times normal instead.

**How a queue grows under overload.** If 2,400 requests per second arrive and the servers finish 1,800, the waiting line grows by 600 every second. After 10 seconds 6,000 are waiting, and a new request waits about 6,000 ÷ 1,800 ≈ 3.3 seconds before it even starts.

| Response to too much load | Who is affected | Cost | Limit |
| --- | --- | --- | --- |
| Graceful degradation | Everyone, mildly (no recommendations) | A weaker page for a while | Only as much as the optional work saves |
| Load shedding | The refused share, sharply | Those users must try again | Must refuse early and cheaply |
| Autoscaling | Nobody, once the servers arrive | Money for each extra server | Scale-out delay and the maximum number of servers |
| Queuing everything | Everyone, more and more | Waits grow until requests time out | Only for short bursts |

## Common mistakes

- **No timeout, or a very long one.** A slow dependency then holds every worker, and pages that never call it stop working too.
- **Retrying at every layer.** Three layers with three attempts each turn one failing request into 27. Retry at one layer and let the others fail fast.
- **Retrying at fixed times.** If a thousand clients fail at the same moment and all retry after exactly 100 ms, they arrive together again. Add jitter.
- **Letting the queue absorb overload.** A line that grows without end makes every request late; by the time a request starts, its user has given up.
- **Expecting autoscaling to catch a sudden spike.** New servers arrive minutes later. Keep spare capacity, scale before known events, and degrade or shed until they arrive.
- **Autoscaling without a maximum.** A bug or an attack can then add servers until the bill, not the users, is the problem.

## Edge cases

- **The dependency is fine, but slow.** A slow answer is worse than an error: errors return at once, while slow calls hold workers. Treat a timeout as a failure for the caller, but remember that the work may have happened (SD 7).
- **Health checks that lie.** A server whose health check only asks "is the process running?" stays in rotation while its database calls all time out. A health check should test what the server needs to do real work, without itself depending on every other service.
- **Scaling the wrong part.** If the database is the limit, adding servers sends more queries to it and makes things worse. Find the part that is full before adding copies.
- **Refusing is not free.** A refused request still costs a little work; refusing at the load balancer or at the very start of a request keeps that cost small.

### Extension (optional): circuit breakers

A **circuit breaker** sits in front of calls to one dependency and has three states. **Closed:** calls pass through, and the breaker counts failures. When failures pass a threshold, such as half of the last 20 calls, it trips to **open:** for a set time, such as 30 seconds, it fails every call at once without calling the dependency, so callers do not wait and the dependency gets a rest. Then it moves to **half-open:** it lets a few trial calls through. If they succeed, the breaker closes again; if they fail, it opens for another period. A breaker is a timeout and retry budget that has memory: after many failures, it stops trying for a while.

## Worked example

**Problem:** The shop from SD 2: one server's limit is about 300 requests per second, the target is 65% of that (195), and 6 servers carry the normal peak of 900. For a sale, traffic is expected to jump to 2,400 requests per second within a minute and stay there for 30 minutes. The autoscaler adds servers when average CPU stays above 65% for 1 minute; a new server takes 4 minutes to start and pass its health checks. The budget allows at most 10 servers. Showing recommendations is a third of each request's work: with them turned off, a server's limit rises to about 450 requests per second. While users are kept waiting, phones give up after 2 seconds. Plan the sale.

**Solution:**

1. **Capacity today.** 6 servers × 300 = 1,800 requests per second at the limit, short of 2,400 by 600 per second.
2. **If nothing is done.** The line grows by 600 a second; after about 6 seconds a new request already waits 3,600 ÷ 1,800 = 2 seconds, so most users give up while the servers still work through their requests. Phones then retry, adding load.
3. **The gap.** Autoscaling starts after 1 minute above target, and the new servers arrive 4 minutes later: about 5 minutes with only 6 servers.
4. **Degrade during the gap.** Turning off recommendations raises the limit to 6 × 450 = 2,700 per second, above 2,400: each server runs at 2,400 ÷ 6 = 400, or 89% of 450. Nobody needs to be refused.
5. **After scaling.** At the 65% target, 2,400 ÷ 195 ≈ 12.3, so 13 servers would be needed, but the budget allows 10. With 10 servers each takes 240 requests per second, 80% of 300: above the target but below the limit, so recommendations can come back on.
6. **Above the plan.** If traffic rises past what 10 servers can carry, refuse the extra at the load balancer with "try again in a minute", keeping checkout requests before browsing ones. Phones retry with backoff and jitter, at most twice.
7. **Better still.** The sale time is known, so the team can scale to 10 servers 10 minutes before it starts and avoid the gap entirely.

**Answer:** Scale to the budget of 10 servers before the sale; if the jump comes unannounced, turn off recommendations for the 5 minutes until new servers arrive (6 × 450 = 2,700 ≥ 2,400). After scaling, 10 servers run at 80% of their limit. Anything beyond that is refused early, and clients retry a few times with jitter.
