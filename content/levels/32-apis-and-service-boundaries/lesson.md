# APIs and Service Boundaries

## Learning objectives

- Design a small REST API: name resources, choose HTTP methods, and return the right status codes.
- Tell safe and idempotent HTTP methods from the others, and say why it matters when a request is sent again.
- Page through a long list with an offset or a cursor, and explain why a cursor stays correct and fast.
- Change an API without breaking apps that still use the old version.
- Choose between polling, long polling, server-sent events and WebSocket for live updates, and estimate what polling costs.
- Decide when to split one service into several, and estimate what a chain of calls between services adds to latency and failures.

### Key terms

- **API (application programming interface).** The agreed way one program asks another for something: which requests exist, what they take, and what they return. The API is a **contract**: the caller depends on it, not on how the other side works inside.
- **Endpoint.** One address that accepts requests, such as `GET /orders/123`.
- **REST.** A common style for web APIs: data is organized as **resources** with addresses (URLs), such as `/orders/123`, and changed with standard HTTP methods.
- **HTTP method.** The verb of a request: `GET` reads, `POST` creates or starts an action, `PUT` replaces a whole resource, `PATCH` changes part of it, `DELETE` removes it.
- **Status code.** A three-digit number in every response that says how the request went: 2xx succeeded, 4xx the caller made a mistake, 5xx the server failed.
- **Safe method.** A method that only reads and does not change anything on the server: `GET`, `HEAD`, `OPTIONS`.
- **Idempotent method.** A method where sending the same request twice leaves the server in the same state as sending it once: `GET`, `PUT`, `DELETE` and the safe methods. `POST` and `PATCH` are not guaranteed to be.
- **Pagination.** Returning a long list in pages, such as 20 orders at a time. An **offset** says how many items to skip; a **cursor** says where the last page ended.
- **API version.** A label, such as `/v1/` in the path, that lets old apps keep working while a new version changes the contract. A **backward-compatible** change keeps old callers working.
- **JSON.** A text format for data, such as `{"id": 123, "status": "cooking"}`, used by most web APIs.
- **gRPC.** A way for services to call each other with typed messages in a compact binary format (Protocol Buffers) over HTTP/2.
- **Polling, long polling, server-sent events (SSE), WebSocket.** Four ways to get updates: ask again on a timer; ask and let the server hold the answer until something changes; keep one connection open on which the server sends events; keep one connection open on which both sides send messages.
- **Monolith and services.** A **monolith** is one program that does everything; **services** (often called **microservices**) are several smaller programs, each owning one part of the business and its data, that call each other over the network.
- **API gateway.** A single entry point in front of several services that routes each request to the right one and handles shared work such as checking the login.

## Problem hook

A food delivery app has one server program and one database. The phone app shows each customer their past orders and a live screen while the food is on its way. It works, but three problems keep coming up.

The order history sometimes shows the same order twice when a customer scrolls down. The live screen asks the server "any news?" every 5 seconds, and with 100,000 customers waiting for food at dinner time, most of the server's work is answering "no change". And the team wants to split the program into an Orders service, a Payments service and a Drivers service, but no one can say what that will cost.

Each of these is a question about the boundary between two programs: what one side may ask, and what the other side promises.

## Intuition

Think of a restaurant. The **menu** is the API: it lists what you can order and what you will get. You never walk into the kitchen; you do not know whether they use gas or electric stoves, and you do not care. Because customers depend only on the menu, the kitchen can change its stoves, cooks or suppliers freely, as long as the dishes on the menu stay the same. Printing a new menu that removes a dish, though, upsets every customer who came for it: that is a breaking API change.

Now think about how you learn your food is ready. You could walk to the counter every five minutes to ask (polling). You could wait at the counter until it is ready (long polling). Or the restaurant could give you a buzzer that goes off when it is ready (the server pushes the news). The buzzer is less work for everyone when many people are waiting.

**A link to SD 1.** Every API call is the request of SD 1: DNS, a connection, the server's work and the database. Splitting one service into several adds more of those trips, one for each call between services.

## When to use

- **REST with JSON:** the default for public APIs and for apps and browsers calling a backend. Easy to read, test and cache.
- **gRPC:** calls between your own services where speed, small messages and a strict typed contract matter. Browsers need an extra layer (gRPC-Web) to use it, so public APIs usually stay REST.
- **Cursor pagination:** long lists that change while users page through them, such as feeds and order histories. **Offset pagination:** small lists that rarely change, or when users must jump to page 37.
- **Polling:** updates are rare or a few seconds of delay is fine, and few clients wait at once.
- **Long polling:** near-real-time updates where only plain HTTP requests are possible.
- **Server-sent events:** the server sends updates and the client only listens, such as order status, notifications or a live score.
- **WebSocket:** both sides send often, such as chat, multiplayer games or shared editing.
- **Several services:** different teams need to change and deploy parts independently, or parts have very different load. **One service:** a small team, a young product, or parts that always change together.

## Template code

There is no code in this level. Use this **design template** for an API:

```text
1. Resources: list the nouns (orders, restaurants, drivers).
   -> /orders, /orders/{id}, /customers/{id}/orders
2. Methods: GET to read, POST to create, PUT or PATCH to change, DELETE to remove.
   Is a retry safe? GET, PUT and DELETE are idempotent; POST is not.
3. Responses: 200, 201 or 204 on success; 400, 401, 403, 404, 409 or 429
   for caller mistakes; 500 or 503 when the server fails.
4. Lists: page with a cursor -> GET /customers/7/orders?limit=20&after=<cursor>
5. Changes: add optional fields only; anything that breaks old apps -> /v2/
6. Live updates: polling, long polling, SSE or WebSocket?
   -> estimate requests per second if clients poll.
7. Service calls: draw the chain. Can calls run in parallel?
   Set a timeout on every call, and decide what to show if one fails.
```

**Status codes you will use most:**

| Code | Meaning | Example |
| --- | --- | --- |
| 200 OK | Succeeded; the body has the result | `GET /orders/123` |
| 201 Created | A new resource was created | `POST /orders` |
| 204 No Content | Succeeded; nothing to return | `DELETE /orders/123/coupon` |
| 400 Bad Request | The request is invalid | An order with no delivery address |
| 401 Unauthorized | Not logged in, or the login is invalid | A missing or expired token |
| 403 Forbidden | Logged in, but not allowed | Viewing another customer's order |
| 404 Not Found | No such resource | `GET /orders/999999` |
| 409 Conflict | Clashes with the current state | Claiming a seat that was just taken (SD 4) |
| 429 Too Many Requests | The caller sent too many requests | A client over its rate limit |
| 500 Internal Server Error | The server failed unexpectedly | A bug |
| 503 Service Unavailable | The server cannot handle it now | Overload or maintenance |

## Complexity

**What polling costs.** 100,000 customers watch the live screen, and each app asks every 5 seconds:

1. Requests per second: 100,000 ÷ 5 = 20,000.
2. A delivery takes about 30 minutes, so each app asks 30 × 60 ÷ 5 = 360 times.
3. The status changes about 6 times (accepted, cooking, ready, picked up, nearby, delivered). So 354 of 360 answers, about 98%, say "no change".

With server-sent events, the same 100,000 customers keep 100,000 connections open, and the server sends only the 6 changes: 100,000 × 6 ÷ 1,800 s ≈ 333 events per second instead of 20,000 requests. The cost moves from requests to open connections, which the servers must be able to hold.

**What pagination costs.** `OFFSET 10000 LIMIT 20` makes the database step past 10,000 rows to return 20, so later pages get slower. A cursor such as "orders older than the last one shown" becomes `WHERE customer_id = 7 AND created_at < <last> ORDER BY created_at DESC LIMIT 20`. With an index on `(customer_id, created_at)` from SD 4, every page reads a few index pages and 20 rows, however deep the user scrolls.

**What a chain of calls costs.**

- **Latency adds up when calls run one after another.** If the order page calls Restaurants (40 ms), then Drivers (30 ms), then Payments (50 ms), they take 40 + 30 + 50 = 120 ms. If the three calls do not depend on each other and run in parallel, they take as long as the slowest: 50 ms.
- **Failures multiply.** If a request needs 5 services in a chain and each is available 99.9% of the time, and they fail independently of each other, the request works about 0.999⁵ ≈ 99.5% of the time. Over 30 days, 0.1% is about 43 minutes of failures, but 0.5% is about 3.6 hours.

## Common mistakes

- **Verbs in URLs.** `POST /createOrder` and `GET /getOrder?id=123` hide the resource. Use `POST /orders` and `GET /orders/123`.
- **200 OK for every response.** A body that says `{"error": "not found"}` with status 200 confuses clients, caches and monitoring. Use the status code that matches.
- **Retrying a POST blindly.** If the response is lost, sending `POST /orders` again can create a second order. Retrying `GET`, `PUT` or `DELETE` is safe; making a `POST` safe to retry needs an idempotency key (SD 7).
- **Removing or renaming a field.** Phone apps update slowly; some users keep an old version for months. Add new fields, keep old ones, and put breaking changes in a new version.
- **Splitting into services too early.** A small team with many services spends its time on network calls, deployments and failures between services instead of on the product.
- **No timeout on a call to another service.** One slow service then holds every request that waits for it, and the slowness spreads to its callers.

## Edge cases

- **The response is lost, not the request.** The client cannot tell whether the server did the work. For idempotent methods, sending the request again is harmless; for `POST`, it may not be.
- **`DELETE` sent twice.** The second time, the order is already gone, so it may return 404 instead of 204. The method is still idempotent: the server's state after two deletes is the same as after one.
- **A list changes during paging.** With offsets, a new item at the top pushes every item down one place, so the next page repeats one; a deleted item makes it skip one. A cursor names the last item seen, so it stays correct.
- **A long-lived connection drops.** Phones change networks and lose signal. Clients of SSE and WebSocket must reconnect and catch up on the events they missed. Browsers reconnect SSE automatically.
- **One service in a chain is slow.** With a timeout and a fallback, the page can still show what it has, such as the order without the driver's location, instead of failing completely.

### Extension (optional): API gateways and backward-compatible changes

An **API gateway** is one entry point in front of all services. The phone app calls only the gateway; the gateway checks the login once, applies rate limits, and routes `/orders` to the Orders service and `/drivers` to the Drivers service. The app does not need to know how many services exist, so the team can split or merge services later without changing the app.

A change is **backward-compatible** when every old client still works: adding an optional field to a response, adding an optional parameter, or adding a new endpoint. Removing a field, renaming it, changing its type, or making an optional parameter required breaks old clients. Those go into a new version, such as `/v2/orders`, and the old version keeps running until few enough clients use it.

## Worked example

**Problem:** Design the API for the food delivery app's order screens. A customer sees their past orders (some customers have hundreds), places a new order, and watches a live status screen while the food is on its way. At dinner time, 100,000 customers watch the live screen at once. The order page shows the order, the restaurant and the driver. The team plans an Orders service, a Restaurants service and a Drivers service.

**Solution:**

1. **Resources and methods.**
   - `GET /customers/{id}/orders`: the order history.
   - `POST /orders`: place an order; returns `201 Created` with the new order's address.
   - `GET /orders/{id}`: one order.
   - `PATCH /orders/{id}`: change the delivery note while the order is still being cooked; returns `409 Conflict` if the order has already left the restaurant.
2. **Order history.** Use a cursor: `GET /customers/7/orders?limit=20&after=<cursor>`, where the cursor holds the time and id of the last order shown. New orders arriving at the top do not shift later pages, and each page reads 20 rows through the index on `(customer_id, created_at)`.
3. **Live status.** Polling every 5 seconds would cost 100,000 ÷ 5 = 20,000 requests per second, about 98% of them answering "no change". The customer only listens and never sends, so use server-sent events: about 333 events per second and 100,000 open connections. WebSocket would also work, but nothing needs to go from the phone to the server on this screen.
4. **The order page across services.** The gateway sends `GET /orders/{id}` to the Orders service, which needs the restaurant (40 ms) and the driver (30 ms). The two calls do not depend on each other, so they run in parallel: about 40 ms instead of 70 ms. Each call has a timeout. If Drivers does not answer in time, the page shows the order and the restaurant with "driver location unavailable" instead of an error.
5. **Future changes.** The app adds fields such as an estimated arrival time without a new version. Renaming `status` would break apps already installed, so it would go into `/v2/`.

**Answer:** A REST API with resources for customers' orders, cursor pagination for the history, server-sent events for the live status, and an API gateway in front of three services. The order page calls Restaurants and Drivers in parallel with a timeout each, so a slow Drivers service makes the page less complete, not broken.
