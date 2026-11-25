# Scaling Out and Load Balancing

## Learning objectives

- Compare vertical scaling (a bigger machine) with horizontal scaling (more machines).
- Explain why a stateless service is easier to scale than one that keeps data in its own memory.
- Describe what a load balancer does and where it sits in the request path.
- Compare Layer 4 and Layer 7 load balancers, and round robin with least connections.
- Explain how health checks remove a broken server from rotation.

## Problem hook

A ticket-booking site runs on one server. At 9 a.m. on the first day of sales, the server runs out of CPU, and every user waits. The team buys a server with twice the CPU. Two hours later it is slow again. The fix that worked yesterday stops working today, because the traffic grew faster than the machine.

Scaling is the plan for that growth. The question is not only "how big a machine?" but "how do we add capacity without the users noticing?"

## Intuition

Think of a supermarket on a busy Saturday. One cashier can serve only so many customers an hour. You can train that cashier to be faster (vertical scaling), but there is a limit to how fast one person can move. Or you can open more checkouts (horizontal scaling). A greeter at the door sends each customer to a checkout that is free, which is the job of a load balancer.

Opening more checkouts works only if any cashier can serve any customer. If each cashier must remember the customer's basket from the last visit, a new customer sent to a different cashier starts from nothing. That is the difference between stateless and stateful services.

## When to use

Use horizontal scaling and a load balancer when:

- One machine's CPU, memory, or connections are near their limit at peak time.
- You need to survive one machine failing without downtime.
- The service can run the same way on any of several identical copies.

Scale up first when the machine is small and the change is quick, but plan to scale out before the limit of one large machine is reached.

## Template code

There is no code in this level. Use this **design template** for a scaled service:

```text
Users -> Load balancer -> Server 1
                       -> Server 2
                       -> Server 3
Servers -> shared database (and shared cache or session store, if needed)

Checklist:
  1. Is each server stateless? (no user data kept only in its memory)
  2. Which algorithm picks a server? (round robin, least connections)
  3. What does a health check test? (a page that returns OK only when the server can serve)
  4. What happens to requests in flight when a server is removed?
```

## Complexity

**Cost and limits** for this level:

- **Vertical scaling**: simple to set up, but a single machine has a hard ceiling and one failure takes the whole service down.
- **Horizontal scaling**: more capacity and fault tolerance, but the load balancer and the shared data store can become the new limit.
- **Load balancer**: adds one hop of latency (usually small) and must itself be redundant, or it becomes the single point of failure.
- **Health checks**: the check interval is a trade-off. Short intervals detect failures sooner but add load; long intervals send more requests to a dead server before it is removed.

Layer 4 and Layer 7 load balancers differ in what they read:

| Type | Reads | Typical use | Cost |
| --- | --- | --- | --- |
| Layer 4 | IP address and port | Fast distribution of TCP connections | Low work per request |
| Layer 7 | HTTP path, headers, cookies | Route `/api` and `/images` to different servers | More work per request |

## Common mistakes

- **Scaling out a stateful service without a plan for its data.** Two servers that each hold a different user session will log users out at random.
- **Forgetting the shared database.** Adding servers in front of one database only moves the bottleneck.
- **Trusting round robin with uneven work.** If some requests take ten times longer, one server gets stuck while others sit idle. Least connections often works better.
- **A health check that always says OK.** A check that only confirms the process exists does not catch a server that cannot reach its database.
- **One load balancer and no backup.** The part that spreads the load must not be the one part that fails.

## Edge cases

- **A server dies in the middle of a request.** The request fails. Retries must be safe to repeat, so the operation should be idempotent.
- **All servers are unhealthy.** The load balancer should return a clear error, not send traffic to servers it knows are down.
- **A sudden spike.** New servers take time to start. Scaling rules should add capacity before the spike arrives, or the first users pay the cost.
- **Uneven user groups.** A few very busy users can overload one server if the balancer chooses by user ID.

## Worked example

**Problem:** A load test shows that one server reaches its limit (CPU close to 100%) at about 300 requests per second. Peak traffic is 900 requests per second. How many servers do you need, and how do you choose the count?

**Solution:**

1. A server running at its limit has no room for a sudden spike and becomes slow, so plan to use only about 60–70% of the limit at peak (an approximate rule of thumb). Here we pick 65%.
2. At 65% of the limit, one server should take about 300 × 0.65 = 195 requests per second. This is the target load per server.
3. Peak needs 900 requests per second, so 900 ÷ 195 ≈ 4.6 servers. You cannot run part of a server, so round up to 5 (rounding down to 4 would put each server at 225, above the target).
4. Add one spare server in case one fails, so 6 in total. Check the failure case: if one fails, the other 5 each take 900 ÷ 5 = 180 requests per second. That is below the 195 target (180 ÷ 195 ≈ 92%) and 60% of the 300 limit (180 ÷ 300), so the service still has headroom.

**Answer:** Run 5 servers for the peak and 6 to survive one failure. Confirm with a load test, because these numbers are estimates.
