# Queues and Asynchronous Work

## Learning objectives

- Explain what a message broker stores, and how a producer, a queue and consumers work together.
- Move slow work out of a request, and estimate how many workers keep up with the incoming messages.
- Estimate how fast a backlog grows when work arrives faster than workers finish it, and how long it takes to drain.
- Explain acknowledgments and at-least-once delivery, and make the work safe to repeat with an idempotency key.
- Retry failed work with exponential backoff and jitter, and park messages that keep failing in a dead-letter queue.
- Tell a queue from publish-subscribe and from an event log, and apply back-pressure when the backlog grows too large.

### Key terms

- **Asynchronous work.** Work done after the request has been answered, instead of while the user waits.
- **Message broker.** A server that stores messages until they are processed. RabbitMQ, Amazon SQS and Apache Kafka are examples.
- **Producer and consumer.** A **producer** sends a message to the broker; a **consumer** (often called a **worker**) takes messages from it and does the work.
- **Queue.** A broker list of messages where each message is handled by one consumer. Several workers share the work, first in, first out as in Level 6, roughly.
- **Acknowledgment (ack).** The consumer's message to the broker that a message is done, so the broker can delete it. A message that is taken but never acknowledged is given to a consumer again after a time limit, often called a **visibility timeout**.
- **At-least-once delivery.** Every message is processed at least once, and sometimes twice, for example when a worker finishes the work but crashes before it acknowledges.
- **Idempotency key.** A unique key sent with a piece of work, such as the order id, so that doing the work a second time with the same key changes nothing (SD 5 explained idempotent methods; this makes any operation safe to repeat).
- **Backlog.** The messages waiting in a queue. It grows when messages arrive faster than workers finish them.
- **Retry with exponential backoff.** Trying failed work again after waiting longer each time, such as 1, 2, 4, 8 and 16 seconds. **Jitter** adds a small random amount to each wait so that many retries do not arrive at the same moment.
- **Dead-letter queue.** A separate queue for messages that failed too many times, kept for a person to look at instead of being retried forever.
- **Publish-subscribe (pub/sub).** A producer publishes a message once, and every subscriber gets its own copy, such as the email service and the warehouse service each getting "order placed".
- **Event log.** A broker that keeps every message in order for a set time, such as 7 days, even after it is read. Each consumer keeps its own position (its **offset**) and can read again from an earlier point.
- **Back-pressure.** Slowing down or refusing new work when the backlog is too large, so that the system does not fall further behind.

## Problem hook

An online shop does everything while the customer waits after pressing "Place order": it saves the order, sends a confirmation email, builds an invoice PDF and tells the warehouse. The customer waits about 1.4 seconds, and when the email provider is slow, the page times out and some customers press the button again, creating a second order.

During a sale, 50 orders arrive per second. The invoice builder cannot keep up, and the slowness spreads to the order page itself. Yet none of this extra work needs to finish before the customer sees "Thank you for your order".

## Intuition

Think of a busy restaurant. The waiter does not stand in the kitchen while the food is cooked. They write the order on a ticket, pin it on the rail, and go back to the tables. Cooks take tickets from the rail one by one; with more cooks, more tickets are cooked at once. The rail is the queue, the waiter is the producer, and the cooks are the workers.

If tickets arrive faster than the cooks can cook, the rail gets longer: that is the backlog. A cook marks a ticket done only after the plate leaves the kitchen; if the cook is called away halfway, another cook picks up the same ticket. Now and then a dish is cooked twice, so the kitchen checks the table number before sending a second plate out: that check is an idempotency key.

**A link to Level 6.** A queue is the first-in, first-out structure of Level 6, kept on a separate server so that many producers and many workers can share it, and so that it survives a restart.

## When to use

- **A queue with workers:** work that does not need to finish before the user gets an answer, such as emails, invoices, resizing images or calling a slow partner.
- **Publish-subscribe:** several independent parts react to the same event, and each needs its own copy, such as email, warehouse and analytics after "order placed".
- **An event log:** consumers need to read history again, start later and catch up, or process events in order, such as rebuilding a report or feeding several systems from one stream.
- **Retries with backoff:** the failure is likely temporary, such as a timeout or a 503 from a partner.
- **A dead-letter queue:** a message may be broken or need a person, so it must stop being retried without being lost.
- **Not a queue:** the user needs the result right away, such as the price shown on the page or "is this seat still free?" (SD 4).

## Template code

There is no code in this level. Use this **design template** for asynchronous work:

```text
1. What must finish before the user gets an answer? Keep only that in the request.
   Everything else becomes a message.
2. Workers: arrival rate x time per job = workers busy at once.
   Add room (for example, run at most 70% busy).
3. Backlog: if arrival > capacity, backlog grows by (arrival - capacity) per second.
   It drains at (capacity - arrival) once the peak ends.
4. Delivery is at least once: give each job an idempotency key and make
   repeats harmless (a unique constraint, or a key the other side checks).
5. Acknowledge only after the work is done. Visibility timeout > the longest job.
6. Failures: retry with exponential backoff and jitter, at most N times,
   then send to a dead-letter queue and alert a person.
7. One consumer per message (queue) or a copy for each subscriber (pub/sub)?
   Must consumers read history again (event log)?
8. Back-pressure: what happens when the backlog passes its limit?
```

## Complexity

**Answer time.** Saving the order takes 30 ms and putting one message on the queue about 5 ms, so the customer waits about 35 ms instead of 30 + 400 + 800 + 200 = 1,430 ms for saving, the email, the invoice and the warehouse call.

**Workers needed.** A worker handles one job at a time. If an invoice takes 0.8 seconds, one worker finishes 1 ÷ 0.8 = 1.25 invoices per second. For 50 orders per second, 50 ÷ 1.25 = 40 workers are busy all the time; to keep them at most 70% busy, run 40 ÷ 0.7 ≈ 57.

**Backlog growth.** With only 30 workers, capacity is 30 × 1.25 = 37.5 invoices per second. At 50 per second the backlog grows by 50 − 37.5 = 12.5 per second: 7,500 waiting invoices after a 10-minute sale. When orders fall to 10 per second, it drains at 37.5 − 10 = 27.5 per second: 7,500 ÷ 27.5 ≈ 273 seconds, about 4.5 minutes.

**Retry timing.** Waiting 1, 2, 4, 8 and 16 seconds between five retries adds up to 1 + 2 + 4 + 8 + 16 = 31 seconds before a message goes to the dead-letter queue. Doubling once more each time would wait 63 seconds over six retries; many systems also cap a single wait, such as at 60 seconds.

| Broker style | Who gets a message | After it is processed | Typical use |
| --- | --- | --- | --- |
| Queue | One consumer among the workers | Deleted after the ack | Jobs: emails, invoices, image resizing |
| Publish-subscribe | Every subscriber gets a copy | Deleted from each subscriber's queue after its ack | Several services react to one event |
| Event log | Every consumer reads it, at its own offset | Kept until the retention time ends | Replaying history, ordered streams |

## Common mistakes

- **Acknowledging before the work is done.** If the worker crashes after the ack, the message is gone and the email is never sent.
- **Assuming each message arrives exactly once.** With at-least-once delivery, a crash between the work and the ack repeats the work. Without an idempotency key, the customer gets two emails or the warehouse ships twice.
- **Retrying at once, forever.** When a partner is down, thousands of instant retries add load exactly when it can least take it. Back off, add jitter, and stop after a limit.
- **A visibility timeout shorter than the job.** If a job takes 2 minutes and the timeout is 30 seconds, a second worker starts the same job while the first is still working.
- **Ignoring the backlog.** A queue hides an overload for a while; if work keeps arriving faster than it is done, the wait grows without end.

## Edge cases

- **A poison message.** A message that crashes every worker, such as one with a broken field, would be retried forever. After a few failures it goes to the dead-letter queue.
- **The queue itself fails.** A message that was never stored is lost. The producer saves the order first and sends the message only after the save succeeds; a broker with replicas (SD 6) keeps stored messages through a failed server.
- **Order matters.** With many workers, messages finish in a different order from the one they arrived in. If order matters for one customer or one order, see the extension.
- **A long backlog makes old work useless.** A "your food is ready" message delivered an hour late is worse than none. Some messages carry an expiry time and are dropped after it.
- **Back-pressure reaches the user.** When the backlog passes its limit, the producer may refuse new work (for example, 503 or 429) or skip optional work, such as analytics, to protect what matters.

### Extension (optional): ordering per key, and batch vs stream processing

Most brokers keep order only within one queue or one part of a log. To keep the events of one order in order, route all messages with the same key (the order id) to the same part, where one consumer reads them in order. Messages for different orders may still finish in any order, which is usually fine.

**Batch processing** collects data and processes it all at once on a schedule, such as a nightly sales report. **Stream processing** handles each event as it arrives, such as updating a live dashboard every second. Batch is simpler and cheaper; streaming gives fresher results.

## Worked example

**Problem:** After "Place order", the shop must send a confirmation email (about 400 ms through an email provider), build an invoice PDF (about 0.8 s) and tell the warehouse (about 200 ms through the warehouse's API). At a sale, 50 orders arrive per second for 10 minutes. The order page should answer within 200 ms. No email may be sent twice and the warehouse must not ship twice, but either may be a few minutes late. The warehouse API is sometimes down for up to 10 minutes. Both the email provider and the warehouse API accept an idempotency key and ignore a second request with the same key. Design the asynchronous work.

**Solution:**

1. **Keep the request short.** The order page saves the order (30 ms), then publishes one "order placed" message with the order id and answers: about 35 ms, within 200 ms. If the publish fails, the page reports an error and the customer can try again, because the save and the message are separate steps (SD 10 covers doing both reliably).
2. **One event, three consumers.** "Order placed" goes to a publish-subscribe topic with three subscriber queues: email, invoice and warehouse. Each has its own workers, so a slow warehouse does not delay emails.
3. **Workers.** Invoices: 50 × 0.8 = 40 busy workers, about 57 at 70%. Emails: 50 × 0.4 = 20 busy, about 29. Warehouse calls: 50 × 0.2 = 10 busy, about 15.
4. **At least once, made safe.** The email worker passes the order id as an idempotency key to the email provider, which ignores a second request with the same key, and the warehouse worker does the same with the warehouse API. The invoice worker writes the PDF under the order id, so a repeat overwrites the same file. Each worker acknowledges only after its call succeeds.
5. **Retries.** Warehouse calls that fail are retried with exponential backoff and jitter, starting at 1 second and capped at 60 seconds per wait, for up to 30 minutes, longer than the 10-minute outages. During an outage, 50 × 600 = 30,000 warehouse messages wait in their queue, which the broker stores easily. After 30 minutes a message goes to the dead-letter queue and a person is alerted.
6. **Back-pressure.** If the email backlog passes 100,000 messages, the shop stops sending marketing emails, which share those workers, so confirmations still go out.

**Answer:** The order page saves the order and publishes one event, answering in about 35 ms. Three subscriber queues with about 57, 29 and 15 workers handle invoices, emails and warehouse calls; idempotency keys make repeated messages harmless; backoff retries outlast a 10-minute outage, and messages that still fail land in a dead-letter queue.
