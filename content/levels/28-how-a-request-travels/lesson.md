# How a Request Travels

## Learning objectives

- Follow one web page request from your browser to a server and back, step by step.
- Name where the time goes: finding the server, opening a connection, the distance the data travels, the work on the server, and the database.
- Tell latency (how long one request takes) apart from throughput (how many requests a system can handle each second).
- Estimate load with rough numbers, and say which numbers are approximations.
- Choose the first place to look when a page is slow.

### Key terms

- **Client and server.** The client is the program that asks (your browser or phone app). The server is a computer that answers. They talk over the network.
- **IP address.** The number that identifies a computer on the internet, like a street address for a house, for example `142.250.72.14`.
- **DNS (Domain Name System).** The internet's phone book. It turns a name such as `shop.example` into the IP address of the server. A **DNS resolver** is the server that does the lookup for you, usually run by your internet provider. It is a lookup step before the request, not a stop the request passes through.
- **Round trip.** A message going to the other side and the answer coming back. Its time (round-trip time, RTT) depends mostly on distance.
- **TCP connection.** The agreement between client and server to exchange data reliably, in order and without gaps. Opening one costs one round trip.
- **TLS.** The encryption behind `https://` and the lock icon in the browser. Setting it up costs one more round trip (TLS 1.3) or two (the older TLS 1.2).
- **HTTP request.** The message the browser sends: a method (`GET` to read, `POST` to send data), a path (`/products/42`), and headers (extra lines of information, such as the language the user prefers).
- **Cookie.** A small piece of data the server asks the browser to keep and send back in the headers of later requests, for example to remember that you are logged in.
- **Database.** The program that stores data on disk and answers questions about it, such as "the product with id 42".
- **Cache.** A fast copy of data kept close to where it is needed, so it does not have to be fetched again from the slower original.
- **CDN (content delivery network).** Many servers in cities around the world that keep copies of files such as images, so a user downloads them from a nearby city. Each of those servers is called an **edge server**.
- **Bottleneck.** The slowest or busiest step, the one that limits the whole system, like the narrow neck of a bottle.
- **Index.** An extra structure a database keeps so it can find rows quickly, like the index at the back of a book. A query on a column with no index may have to read every row. SD 4 covers indexes.
- **Latency.** How long one request takes, including any time it waits in a queue.
- **Throughput.** How many requests a system finishes per second.
- **Units of time.** 1 second = 1,000 milliseconds (ms). 1 ms = 1,000 microseconds (µs). 1 µs = 1,000 nanoseconds (ns). So 1 ms is a million ns.

## Problem hook

A small online shop works well for 200 customers at lunchtime. On a sale day, 20,000 people arrive in ten minutes, and the product page takes eight seconds to load. The team's first guess is "the server is too small". Before buying a bigger server, they need to know where the eight seconds go.

Every page load is a chain of steps. Each step adds time, and each step can also fail. Designing a system starts with drawing that chain and putting numbers on it.

## Intuition

Think of ordering food at a busy restaurant. You tell a waiter (the request), the waiter walks to the kitchen (the network), a cook checks the fridge (the cache) or fetches ingredients from the storeroom (the database), and the food comes back to you. The meal can be slow for many reasons: the walk, the queue in the kitchen, or a storeroom that is far away. Adding a second waiter does not help if the storeroom is the bottleneck.

Latency is how long you wait for one meal, including the time your order waits before a cook starts on it. Throughput is how many meals the restaurant serves per hour. When the restaurant is quiet, more waiters mostly raise throughput. When it is so busy that orders queue up, more waiters (or cooks) also cut the waiting time, so latency drops too.

**A link to Level 1.** Big-O asked how the work of an algorithm grows when the input grows. System design asks the same question about a whole system: when the number of users grows, which step's time or load grows fastest? That step is where to look first.

## When to use

Use this way of thinking whenever a user says "it is slow" or "it breaks under load":

- Write down the steps of one request, from the user's device to the data and back.
- Mark every step where the request travels or waits.
- Estimate the numbers for each step before deciding on a fix.

## Template code

There is no code in this level. Use this **design template** for any request. It is a simplified picture: real systems may skip some steps, add others, or send the answer by a different route.

```text
Setup (before the request, often reused later):
  DNS lookup: name -> IP address
  Open a connection: TCP, then TLS for https

Request and response:
  Client -> (load balancer) -> server -> (cache) -> (database)
  The answer comes back to the client.
  Steps in brackets appear only when the design has them.

For each step, write:
  1. What happens here?
  2. Rough time it adds (latency).
  3. What is the limit (requests per second, connections, memory)?
  4. What fails first when load grows?
```

## Complexity

In system design, "complexity" means **cost and limits**. Write these for every building block you add:

- **Latency added**: the time one request spends in this step, including waiting.
- **Throughput limit**: the most requests per second this step can handle.
- **Storage**: what data this step must keep, and for how long.
- **First failure**: what breaks first when load doubles.

Rough numbers that help with estimates (approximate, order of magnitude only). Each row is slower than the one above it, by very different amounts:

| Operation | About |
| --- | --- |
| Read from memory | 100 ns |
| Read from an SSD | 100 µs (= 100,000 ns) |
| Round trip inside one data center | 0.5 ms (= 500 µs) |
| Round trip across an ocean | 100–150 ms |

Compare the rows: an SSD read is about 1,000 times slower than a memory read; a round trip inside a data center is about 5 times slower than an SSD read; and a round trip across an ocean is about 200 to 300 times slower than one inside a data center. From memory to an ocean round trip is about a million times. Distance and waiting usually matter more than the speed of the code.

**Estimation shortcut.** A day has 24 × 60 × 60 = 86,400 seconds. We round it to 10⁵ (100,000) to make the division easy; the answer keeps the right size.

Example: 10 million users each make 10 requests a day.

1. Write the numbers as powers of ten: 10 million = 10⁷.
2. Requests per day: 10⁷ × 10 = 10⁸.
3. Requests per second: 10⁸ ÷ 10⁵. Dividing powers of ten means subtracting the exponents: 8 − 5 = 3. So the answer is 10³, about 1,000 requests per second on average.

Peak traffic is often several times the average, so plan for the peak, not the average.

## Common mistakes

- **Guessing the bottleneck.** Measure or estimate each step first. A slow database query is a different problem from a slow network.
- **Confusing latency with throughput.** A server can answer each request quickly and still handle too few requests per second.
- **Forgetting the round trips.** A new connection needs one to three round trips before the first byte of the page moves. Reusing an open connection removes that cost.
- **Planning for the average load.** Systems break at the peak, not at the average.
- **Ignoring distance.** A server on the other side of the world adds a fixed delay that no amount of extra hardware removes.

## Edge cases

- **One slow step dominates.** If the database takes 2 seconds and every other step takes 20 ms, a faster network changes almost nothing.
- **Cached responses.** A response served from a nearby cache skips most of the steps, so the same request can take very different times.
- **Timeouts.** A request that waits too long for one step should stop and report an error, not hang until the user gives up.
- **Retries.** A retry adds load at the exact moment the system is struggling. Plan retries with a limit and a delay between tries.

## Worked example

**Problem:** For a user in Ho Chi Minh City, the HTML of a product page arrives 800 ms after they press Enter. The server is in Singapore, and this is the user's first visit. Explain the likely parts of the 800 ms, and say what to measure first. (Images and scripts load after the HTML, so they are not part of these 800 ms.)

**Estimate the parts (approximate):**

1. **DNS lookup**: often 20–100 ms the first time, then cached, so later visits skip it.
2. **Connection setup**: TCP needs one round trip, and TLS one more (TLS 1.3) or two (TLS 1.2), so two or three round trips before any page data. Singapore is close to Ho Chi Minh City, so each round trip is about 20–30 ms. Two to three trips × 20–30 ms = 40–90 ms.
3. **Sending the request**: one more round trip passes before the first byte of the answer can arrive, about 30 ms.
4. **Server work**: the application code and database queries. Work it out from the other steps: steps 1, 2, 3 and 5 add up to at most about 100 + 90 + 30 + 60 = 280 ms, so the rest of the 800 ms, about 520 ms or more, is spent here.
5. **Sending the page back**: a small page from a nearby server arrives in tens of milliseconds, say about 60 ms.

After the HTML arrives, the images and scripts are separate requests. They make the whole page slower, so count them too, but they are not part of these 800 ms.

**What to measure first:** the time spent on the server (step 4), and then the number of separate requests for images and scripts. Network time is smaller here, and it can be reduced later with a data center closer to users or a CDN.

**Answer:** Most of the 800 ms is likely server work, not distance. Measure the server part before buying hardware.
