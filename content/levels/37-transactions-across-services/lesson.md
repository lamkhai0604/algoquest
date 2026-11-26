# Transactions Across Services

## Learning objectives

- Explain why one database transaction is easy and a change across several services is not.
- Describe what goes wrong when a workflow across services fails halfway.
- Design a saga: a sequence of local transactions with compensating steps, run by an orchestrator or by events.
- Order the steps of a saga so that failures need few compensations and nothing that cannot be undone happens too early.
- Save data and publish a message reliably with the transactional outbox, and make consumers safe for duplicates.
- Explain what two-phase commit does and why it is rarely used between services.

### Key terms

- **Local transaction.** A transaction inside one service's own database: all or nothing, as in SD 4.
- **Distributed transaction.** One business action that changes data in several databases owned by different services.
- **Partial failure.** Some steps of a workflow succeeded and others failed, leaving the services out of step, such as a card charged for an order that cannot be filled.
- **Saga.** A workflow split into a sequence of local transactions, one per service. If a step fails, the saga runs **compensating transactions** for the steps that already succeeded, in reverse order.
- **Compensating transaction.** A new action that undoes the business effect of an earlier step, such as a refund for a charge or releasing reserved stock. It is not a rollback: the earlier step was already saved and seen.
- **Orchestration and choreography.** Two ways to run a saga. An **orchestrator** is one service that tells each participant what to do next and starts compensations; in **choreography**, each service reacts to events from the others, with no central controller.
- **Transactional outbox.** A table in a service's own database. The service saves its business change and the message it must send in the same local transaction, and a **relay** later reads the table and publishes the message.
- **Two-phase commit (2PC).** A protocol in which a **coordinator** asks every participant to prepare (and lock what it will change), then tells all of them to commit, or all to abort.

## Problem hook

A shop's checkout used to be one program with one database. Placing an order saved the order, took the stock and recorded the payment in one transaction: if anything failed, nothing was saved.

The shop has now split into an Order service, a Payment service and an Inventory service, each with its own database. One evening the Order service saves an order, the Payment service charges the customer's card, and then the Inventory service reports that the last item was sold a second earlier. The customer has paid for something they will not get, and no single "rollback" can fix it, because three databases each saved their own part.

## Intuition

Think of booking a trip yourself: a flight, a hotel and a rental car, each from a different company. There is no single "book all three or none" button. You book the flight, then the hotel, and then find that no car is available. To get back to where you started, you cancel the hotel and then the flight. Those cancellations are new actions: they may take a day, and the airline may keep a fee. That is a saga with compensations.

A smart traveler books in a better order: first the thing most likely to be unavailable, or the one that is free to cancel. And they do not send the "we're going on holiday!" message to friends until everything is booked, because that message cannot be taken back.

**A link to SD 4 and SD 7.** Each step of a saga is a normal local transaction from SD 4, and the steps talk through the queues of SD 7, with the same at-least-once delivery and idempotency keys.

## When to use

- **One local transaction:** whenever the data that must change together can live in one service's database. It is always simpler; consider whether the services were split too finely.
- **A saga:** a business action must change data owned by several services, and a short period in which the services disagree is acceptable, such as an order shown as "pending" for a few seconds.
- **Orchestration:** the workflow has several steps or branches, and the team wants one place to see and change it, such as checkout or trip booking.
- **Choreography:** two or three services, each reacting to one event, where adding a central coordinator would be overkill.
- **The transactional outbox:** whenever a service must both save data and publish a message about it; without it, a crash between the two loses the message or sends one about data that was never saved.
- **Two-phase commit:** rarely between services; sometimes inside one system whose databases all support it and whose round trips are short.

## Template code

There is no code in this level. Use this **design template** for a workflow across services:

```text
1. Can the data that must change together live in one database? Then use
   one local transaction and stop here.
2. List the steps, one local transaction per service, and for each step
   its compensation (cancel, release, refund). Mark steps that cannot be
   compensated (an email sent, goods shipped).
3. Order the steps: likely failures and cheap-to-undo steps first;
   steps that cannot be compensated last, after the last risky step.
4. Run it: an orchestrator (one place, easier to follow) or choreography
   (events, fewer moving parts for small flows).
5. Every message: save it with the data in an outbox, publish it with a
   relay, and make every step and compensation idempotent (one key per action).
6. While the saga runs, what does the user see? ("pending", then
   "confirmed" or "cancelled and refunded")
```

## Complexity

**What a failure costs.** If a saga has k steps and step j fails, the j − 1 steps before it need compensations, run in reverse. With the order "save order, charge card, reserve stock", a stock failure needs 2 compensations: refund, then cancel the order. With "save order, reserve stock, charge card", the same failure needs only 1: cancel the order, and the customer is never charged.

**How often it happens.** If 1% of 100 orders per second fail at the stock step, that is 1 failed saga per second. With the charge before the stock step, that is a refund per second, each with fees and an unhappy customer; with the stock step first, it is only a cancelled pending order.

**How long a saga takes.** Steps are local transactions linked by messages. Reserving stock takes about 20 ms, authorizing a card 200 ms to 2 seconds in normal operation (approximate) and confirming the order about 10 ms, plus a few milliseconds per message. The customer sees "order received" right after the order is saved (about 30 ms) and "confirmed" a second or two later.

**Outbox delay and duplicates.** A relay that checks the outbox every 100 ms picks up each new row within about 100 ms; publishing and delivery add the broker's own delay, and if the relay is down, messages wait in the outbox until it restarts. If the relay crashes after publishing but before marking a row as sent, it publishes that message again: consumers must be idempotent, as in SD 7.

| Approach | All or nothing? | Locks held | Works with outside providers | Typical use |
| --- | --- | --- | --- | --- |
| One local transaction | Yes | Milliseconds, one database | Not needed | Data in one service |
| Saga with compensations | Eventually, through compensations | Only inside each local step | Yes (refund, cancel) | Workflows across services |
| Two-phase commit | Yes | Across all round trips, until the coordinator decides | Only if they support it | Rare, inside one system |

## Common mistakes

- **Calling every service in a row and hoping.** If the third call fails or times out, the first two have already changed their data, and nothing undoes them.
- **Compensations that are not idempotent.** A refund message delivered twice must not refund twice; give every action its own key built from the order id, such as `order123-authorize` for the authorization and `order123-void` for cancelling it. A retry of the same action reuses its key; a compensation is a different action with a different key.
- **Sending what cannot be undone too early.** An email that says "your order is confirmed" before the stock step can turn into "sorry, it was not". Put such steps last.
- **Saving data and then publishing in two separate steps.** A crash between them leaves an order that nobody hears about. Use the outbox.
- **Assuming a timeout means failure.** A payment call that times out may have charged the card. Ask the provider again with the same idempotency key, or check its status, before compensating.

## Edge cases

- **A compensation fails.** The refund call itself can fail. Compensations are retried with backoff (SD 7) until they succeed; a compensation that keeps failing goes to a dead-letter queue for a person.
- **The user acts during the saga.** A customer cancels while their order is still being confirmed. The orchestrator must handle the cancel as another step, not as a separate change that races with the saga.
- **Other users see the middle state.** Reserved stock is unavailable to others while the saga runs, even if the order is later cancelled; reservations should expire if a saga stalls. Expiring and using a reservation must be competing local transactions on the reservation row in the Inventory service: using it succeeds only while it is still active, and expiring it succeeds only while it is not yet used, so exactly one wins.
- **Steps that cannot be compensated.** Shipped goods cannot be "unshipped"; the saga must finish all risky steps before any such step, and after that point it can only move forward.

### Extension (optional): two-phase commit, and exactly-once as an effect

In **two-phase commit**, the coordinator first sends "prepare": each participant does the work, locks the rows it will change, writes enough to its log to finish later, and votes yes or no. If all vote yes, the coordinator logs "commit" and tells everyone to commit; otherwise it tells everyone to abort. The problem is the wait: participants hold their locks until they hear the decision, and if the coordinator crashes after "prepare", they stay blocked until it comes back. Databases such as PostgreSQL support it (`PREPARE TRANSACTION`), but outside providers such as card networks do not take part, so it rarely fits between services.

**Exactly-once** delivery is not possible over a network that can lose an answer: the sender cannot tell a lost reply from a slow one, so it must either risk sending twice or risk never delivering. Systems instead get an **exactly-once effect**: at-least-once delivery plus idempotent processing, so a repeated message changes nothing the second time.

## Worked example

**Problem:** The shop places 100 orders per second at peak. Placing an order must reserve stock (Inventory service, about 20 ms), authorize the card (Payment service, through a card provider that answers within 2 s in normal operation; if a call times out, a status lookup with the same key answers within 500 ms), mark the stock reservation as used (Inventory, about 20 ms), mark the order confirmed (Order service, about 10 ms) and send a confirmation email. About 1% of orders fail at the stock step and 2% at the card step. Messages between services take up to 10 ms. The customer must see a first answer within 300 ms and, while the services and the card provider are working normally, know the final result within 5 seconds. The card provider accepts an idempotency key and offers "void authorization" to cancel an authorization. Design the workflow.

**Solution:**

1. **Order of steps.** Save the order as "pending" → reserve stock → authorize the card → mark the reservation as used and confirm the order → send the email. Stock goes before payment because a stock failure then needs no refund; the email goes last because it cannot be taken back.
2. **First answer.** The Order service saves the pending order and an outbox row in one local transaction (about 30 ms) and answers "order received", well within 300 ms.
3. **Orchestration.** The Order service runs the saga: its relay publishes "reserve stock for order 123"; on success it asks the Payment service to authorize; on success it confirms the order and only then queues the email. Every action carries its own idempotency key built from the order id, such as `order123-reserve`, `order123-authorize` and, if needed, `order123-void`.
4. **Failures.** Stock fails (1 per second at peak): cancel the order; nothing else to undo. The card fails (2 per second): release the stock, then cancel the order, in reverse order. A card call that times out is asked again with the same key before anything is compensated.
5. **Timing.** On the slowest normal path: 30 (save) + 20 (stock) + 2,000 (card) + 500 (one status lookup after a timeout) + 20 (use the reservation) + 10 (confirm) + 4 messages × 10 = 2,620 ms, about 2.6 seconds, within 5. The page shows "pending" until then. Compensations after a failure may finish later; the customer is told "order failed" as soon as the failure is known.
6. **Stuck sagas.** A reservation that is not used within 10 minutes expires and returns the stock, so a stalled saga cannot hide items forever. Using and expiring are competing local transactions on the reservation row: exactly one wins. If a stalled saga resumes and Inventory answers that its reservation expired, it voids the authorization (`order123-void`) and cancels the order. A late or repeated message for that reservation finds it expired and changes nothing.

**Answer:** An orchestrated saga run by the Order service: pending order with an outbox, stock reservation, card authorization, confirmation, then the email. Each step is a local transaction with an idempotency key; failures are undone in reverse (release stock, void the authorization, cancel the order), and the only step that cannot be undone comes last.
