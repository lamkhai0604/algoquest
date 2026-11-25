# How a Request Travels

## Learning objectives

- Trace one web request from the browser to the server and back, step by step.
- Name where time goes: DNS, connection setup, network distance, server work, and the database.
- Tell latency (how long one request takes) apart from throughput (how many requests the system handles per second).
- Estimate load with rough numbers and say which estimate is an approximation.
- Choose the first place to look when a page is slow.

## Problem hook

A small online shop works well for 200 customers at lunchtime. On a sale day, 20,000 people arrive in ten minutes, and the product page takes eight seconds to load. The team's first guess is "the server is too small". Before buying a bigger server, they need to know where the eight seconds go.

Every page load is a chain of steps. Each step adds time, and each step can also fail. Designing a system starts with drawing that chain and putting numbers on it.

## Intuition

Think of ordering food at a busy restaurant. You tell a waiter (the request), the waiter walks to the kitchen (the network), a cook checks the fridge (the cache) or fetches ingredients from the storeroom (the database), and the food comes back the same way. The meal can be slow for many reasons: the walk, the queue in the kitchen, or a storeroom that is far away. Adding a second waiter does not help if the storeroom is the bottleneck.

Latency is how long you wait for one meal. Throughput is how many meals the restaurant serves per hour. A faster kitchen improves both, but more waiters improve only throughput.

## When to use

Use this way of thinking whenever a user says "it is slow" or "it breaks under load":

- Write the path of one request, from the user's device to the data and back.
- Mark every hop and every wait on the path.
- Estimate the numbers for each hop before deciding on a fix.

## Template code

There is no code in this level. Use this **design template** for any request path:

```text
Client -> DNS -> (connection setup) -> network -> load balancer -> server -> cache -> database
Response travels back along the same path.

For each hop, write:
  1. What happens here?
  2. Rough time it adds (latency).
  3. What is the limit (requests per second, connections, memory)?
  4. What fails first when load grows?
```

## Complexity

In system design, "complexity" means **cost and limits**. Write these for every building block you add:

- **Latency added**: the time one request spends in this step.
- **Throughput limit**: the most requests per second this step can handle.
- **Storage**: what data this step must keep, and for how long.
- **First failure**: what breaks first when load doubles.

Rough numbers that help with estimates (approximate, order of magnitude only):

| Operation | About |
| --- | --- |
| Read from memory | 100 ns |
| Read from an SSD | 100 µs |
| Round trip inside one data centre | 0.5 ms |
| Round trip across an ocean | 100–150 ms |

Estimation shortcut: a day has about 10⁵ seconds (86,400). If 10 million users each make 10 requests a day, that is 10⁸ requests a day, which is about 1,000 requests per second on average. Peak traffic is often several times the average, so plan for the peak, not the average.

## Common mistakes

- **Guessing the bottleneck.** Measure or estimate each hop first. A slow database query is a different problem from a slow network.
- **Confusing latency with throughput.** A server can answer each request quickly and still handle too few requests per second.
- **Forgetting the round trips.** A new connection needs several trips before the first byte of the page moves. Reusing connections removes that cost.
- **Planning for the average load.** Systems break at the peak, not at the average.
- **Ignoring distance.** A server on the other side of the world adds a fixed delay that no amount of extra hardware removes.

## Edge cases

- **One slow hop dominates.** If the database takes 2 seconds and every other hop takes 20 ms, a faster network changes almost nothing.
- **Cached responses.** A response served from a nearby cache skips most of the path, so the same request can take very different times.
- **Timeouts.** A request that waits too long for one step should stop and report an error, not hang until the user gives up.
- **Retries.** A retry adds load at the exact moment the system is struggling. Plan retries with a limit and a delay.

## Worked example

**Problem:** A product page takes 800 ms for a user in Ho Chi Minh City. The server is in Singapore. Explain the likely parts of the 800 ms, and say what to measure first.

**Estimate the parts (approximate):**

1. **DNS lookup**: often 20–100 ms the first time, then cached.
2. **Connection setup**: TCP and TLS need about two to three round trips before the first byte. Singapore is a short distance from Ho Chi Minh City, so each round trip is maybe 20–30 ms, which adds 60–90 ms.
3. **The request and response**: one more round trip, about 30 ms.
4. **Server work**: the application code and database queries, which could be several hundred milliseconds.
5. **Images and scripts**: separate requests, which can add up when they load one after another.

**What to measure first:** the time spent on the server (step 4) and the number of separate requests (step 5). Network time is usually smaller, and it can be reduced later with a nearby data centre or a CDN.

**Answer:** Most of the 800 ms is likely server work and extra requests, not distance. Measure the server part before buying hardware.
