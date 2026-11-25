# Scaling Out and Load Balancing

## Learning objectives

- Compare vertical scaling (a bigger machine) with horizontal scaling (more machines).
- Explain why a stateless service is easier to scale than one that keeps data in its own memory.
- Describe what a load balancer does and where it sits in the request path.
- Compare Layer 4 and Layer 7 load balancers, and round robin with least connections.
- Explain how health checks remove a broken server from rotation.

### Key terms

- **CPU.** The part of a computer that runs code. When it is busy 100% of the time, new requests have to wait their turn.
- **Requests per second.** How many requests a server finishes each second. A server's **limit** is the rate at which it is fully busy.
- **Vertical scaling (scaling up).** Replacing a machine with a bigger one: more CPU, more memory.
- **Horizontal scaling (scaling out).** Adding more machines that run the same program and share the work.
- **Session.** What a server remembers about a logged-in user between requests, such as who they are and what is in their cart. The browser usually carries a cookie with a session id.
- **Stateful and stateless.** A stateful server keeps a user's session in its own memory, so only that server can answer the user correctly. A stateless server keeps nothing about a user between requests; it reads what it needs from a shared store, so any server can answer.
- **Load balancer.** A program or machine with one address that users connect to. It passes each request on to one of several servers.
- **Layer 4 and Layer 7.** Network messages are built in layers, like an envelope inside an envelope. A Layer 4 balancer reads only the outer envelope: the IP address and the port (a number that says which program on the computer the message is for, such as 443 for `https`). A Layer 7 balancer opens it and reads the HTTP request: the path, headers and cookies.
- **Health check.** A small request the load balancer sends to each server every few seconds to ask "can you serve?"
- **In rotation.** The set of servers the load balancer currently sends requests to.
- **Single point of failure.** One part whose failure stops the whole service. Having a spare copy of it (making it **redundant**) removes that risk.
- **Bottleneck.** The busiest part, the one that limits the whole system.

## Problem hook

A ticket-booking site runs on one server. At 9 a.m. on the first day of sales, the server runs out of CPU, and every user waits. The team buys a server with twice the CPU. Two hours later it is slow again. The fix that worked yesterday stops working today, because the traffic grew faster than the machine.

Scaling is the plan for that growth. The question is not only "how big a machine?" but "how do we add capacity without the users noticing?"

## Intuition

Think of a supermarket on a busy Saturday. One cashier can serve only so many customers an hour. You can train that cashier to be faster (vertical scaling), but there is a limit to how fast one person can move. Or you can open more checkouts (horizontal scaling). A greeter at the door sends each customer to a checkout that is free, which is the job of a load balancer.

Opening more checkouts works best when any cashier can serve any customer. Imagine a shop where you leave your basket at one cashier's desk and come back for it later. If the greeter sends you to a different cashier on your second visit, your basket is not there. That shop is stateful. If baskets are kept at one shared counter that every cashier can reach, any cashier can serve you. That shop is stateless.

## When to use

Use horizontal scaling and a load balancer when:

- One machine's CPU, memory, or connections are near their limit at peak time.
- You need to survive one machine failing without downtime.
- The service can run the same way on any of several identical copies.

For a small service, scaling up can be a practical first step because nothing else changes. Plan to scale out before you reach the limit of the largest machine you can buy, or when one machine failing would take the service down.

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
  4. What happens to requests still in progress when a server is removed?
```

## Complexity

**Cost and limits** for this level:

- **Vertical scaling**: simple to set up, but a single machine has a hard ceiling and one failure takes the whole service down.
- **Horizontal scaling**: more capacity and fault tolerance, but the load balancer and the shared data store can become the new limit. Being able to keep working when one machine fails is called **fault tolerance**.
- **Load balancer**: adds one extra step to each request (usually a small delay) and must itself be redundant, or it becomes the single point of failure.
- **Health checks**: the check interval is a trade-off. Short intervals detect failures sooner but add load; long intervals send more requests to a dead server before it is removed.

Layer 4 and Layer 7 load balancers differ in what they read:

| Type | Reads | Typical use | Cost |
| --- | --- | --- | --- |
| Layer 4 | IP address and port | Fast distribution of TCP connections | Low work per request |
| Layer 7 | HTTP path, headers, cookies | Route `/api` and `/images` to different servers | More work per request |

## Common mistakes

- **Scaling out a stateful service without a plan for its data.** Two servers that each hold a different user session will log users out at random.
- **Forgetting the shared database.** Adding servers in front of one database only moves the bottleneck.
- **Trusting round robin with uneven work.** If some requests take ten times longer, one server can pile up slow requests while others sit idle. Least connections often spreads such work better, as long as an open connection means work in progress; when all requests take about the same time, round robin is just as good and simpler.
- **A health check that always says OK.** A check that only confirms the process exists does not catch a server that cannot reach its database.
- **One load balancer and no backup.** The part that spreads the load must not be the one part that fails.

## Edge cases

- **A server dies in the middle of a request.** The request may fail or time out. A retry, by the client or the load balancer, can send it to another server, but only if repeating it is safe: doing it twice must have the same effect as doing it once. Setting a profile name twice is safe; charging a card twice is not. SD 7 covers this in depth.
- **All servers are unhealthy.** The load balancer should return a clear error, not send traffic to servers it knows are down.
- **A sudden spike.** New servers take time to start. Scaling rules should add capacity before the spike arrives, or the first users pay the cost.
- **Uneven user groups.** A few very busy users can overload one server if the balancer chooses by user ID.

## Worked example

**Problem:** A load test shows that one server reaches its limit (CPU close to 100%) at about 300 requests per second. Peak traffic is 900 requests per second. How many servers do you need, and how do you choose the count?

**Solution:**

1. A server running at its limit has no room for a sudden spike and becomes slow, so plan to use only about 60–70% of the limit at peak. This is an approximate rule of thumb for traffic that grows steadily; for very spiky traffic, or servers that take minutes to start, teams leave more room (often 40–50%). Here we pick 65%.
2. At 65% of the limit, one server should take about 300 × 0.65 = 195 requests per second. This is the target load per server.
3. Peak needs 900 requests per second, so 900 ÷ 195 ≈ 4.6 servers. You cannot run part of a server, so round up to 5 (rounding down to 4 would put each server at 225, above the target).
4. Add one spare server in case one fails, so 6 in total. With all 6 running, each takes 900 ÷ 6 = 150 requests per second.
5. Check the failure case. If one server fails, the other 5 each take 900 ÷ 5 = 180 requests per second. That is below the **target** of 195 (180 ÷ 195 ≈ 92% of the target), so the plan still holds.
6. Read the same number against the **limit** of 300. Each server is busy 180 ÷ 300 = 60% of the time: that is its **utilization**. The **headroom**, what is left before the limit, is 300 − 180 = 120 requests per second, or 40% of the limit.

**Answer:** Run 5 servers for the peak and 6 to survive one failure. Confirm with a load test, because these numbers are estimates.
