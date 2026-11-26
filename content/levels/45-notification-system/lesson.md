# Notification System

## Learning objectives

- Apply the full design routine to a system that sends push, email and text notifications.
- Stay within each provider's quota, and keep urgent messages moving while a large campaign is sending.
- Make sure one event never notifies a user twice, even when events and sends are retried.
- Respect each user's preferences at the moment of sending, including after retries and when falling back to another channel.
- State what can still go wrong, such as a crash between sending and recording, and choose which side to err on.

### Key terms

- **Channel.** A way to reach a user: push notification to the phone, email, or text message (SMS).
- **Provider.** The outside service that delivers a channel, such as an email or SMS sending service, or the phone makers' push services. Each has a **quota**: how many messages per second, or per day, it accepts from you.
- **Transactional notification.** One a user expects because of their own action, such as "your order shipped" or a login code. **Promotional** notifications, such as a sale, are sent to many users at once in a **campaign**.
- **Deduplication.** Making sure the same notification is not delivered twice, usually with a unique **notification key** such as (event, user, channel) recorded before or with each send.
- **Preference.** A user's choice about what they receive and how: opted out of promotions, email only, no messages at night (**quiet hours**).
- **Fallback channel.** A second channel used when the first fails, such as email when a push cannot be delivered.
- **Dead-letter queue.** Where a message goes after it has failed too many times, for people to look at (SD 7).

## Problem hook

A shopping app sends a "sale starts now" email to 10 million users. For the next three hours, nobody gets their "your order shipped" message: the campaign filled the email provider's quota. During the same campaign a worker crashes and restarts, and 40,000 users get the sale email twice. A user who unsubscribed at noon still gets it at 2 p.m., because their preference was checked when the campaign was queued at 11 a.m.

Sending a message is one API call. Sending millions of them, through providers with limits, without duplicates, and only to people who still want them, is the design problem.

## Intuition

Think of a post office that sends letters for many shops. It has one van to the airport that holds a fixed number of bags an hour (the provider's quota). If a shop drops off a million advertising letters, they must not fill every van while a hospital's urgent letters wait: urgent mail goes on first. Each letter gets a stamp with a number, and the clerk checks a register before sending: if that number has been sent, the copy is thrown away (deduplication). And just before a letter leaves, the clerk checks the customer's "no advertising" sign on the mailbox, not the sign as it was when the shop dropped the letters off (preferences checked at send time).

**A link to earlier levels.** Queues, retries and at-least-once delivery come from SD 7; idempotency keys and unique constraints from SD 4 and SD 10; backoff, jitter and failing well from SD 11; pacing sends to a provider's limit from SD 17.

## When to use

- **Separate queues or priorities for transactional and promotional messages:** whenever campaigns share a provider with urgent messages; urgent ones should never wait behind a campaign.
- **A pacer per provider at the point of sending:** whenever a provider has a quota; count retries too (SD 17).
- **A notification key with a unique constraint or an atomic "set if absent":** whenever events can arrive twice or a send can be retried, which, with queues, is always.
- **A provider idempotency key:** when the provider accepts one, so a retried request with the same key is not delivered twice.
- **Checking preferences when sending:** always for promotions, which may wait hours in a queue; quiet hours delay a message instead of dropping it.
- **A fallback channel:** for important transactional messages, only if the user's preferences allow that channel and the first channel definitely failed.

## Template code

There is no code in this level. Apply the **routine** with these questions for a notification system:

```text
1. Requirements: channels, transactional and promotional, how fast each
   must arrive, preferences, quiet hours, no duplicates.
2. Estimates: messages per day and at peak per channel, campaign size,
   how long a campaign takes at the provider's quota.
3. API: notify(event, user) from other services; preferences API.
4. Data model: preferences per user; sent(notification key) with a
   unique key; templates.
5. High-level design: event queue -> notification workers -> one queue
   per channel and priority -> pacer per provider -> provider.
6. Deep dive: quotas and priorities; deduplication across retries;
   preferences checked at send time, also for fallbacks.
7. Failures: provider down or slow, worker crash between send and
   record, a bad campaign; what users see.
8. Summary: each requirement and how it is met.
```

## Complexity

**Campaign time.** 10 million emails at a provider quota of 1,000 per second take 10,000,000 ÷ 1,000 = 10,000 seconds, about 2.8 hours. If transactional email shares that quota with no priority, every "order shipped" email waits behind the campaign for up to 2.8 hours.

**Reserving room.** Give transactional email a share it can always use, such as 200 of the 1,000 per second, and let the campaign use the rest: the campaign takes 10,000,000 ÷ 800 = 12,500 seconds, about 3.5 hours, and transactional email never waits for it. When transactional traffic is lower, the campaign may use the spare room.

**Deduplication records.** At 30 million notifications a day, one record of about 100 bytes per (event, user, channel) is about 3 GB a day. Keeping 7 days, longer than any retry or redelivery, is about 21 GB; older records expire.

**Where a duplicate can still happen.** A worker sends a message, and crashes before recording "sent". On restart it cannot tell whether the provider got the request. If it sends again, the user may get it twice; if it does not, the user may get nothing. With a provider idempotency key, the second request with the same key is dropped by the provider. Without one, the team chooses: at least once (possible duplicates, good for login codes) or at most once (possible misses, good for promotions).

| Order of steps                                    | If the worker crashes between them                                                  | Good for                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Record "sending", then send, then record "sent"   | Message may be missed; a later check can resend if the provider reports no delivery | Promotions: a miss is cheaper than a duplicate             |
| Send, then record "sent"                          | Message may be sent twice                                                           | Login codes and alerts: a duplicate is cheaper than a miss |
| Send with a provider idempotency key, then record | The provider drops the repeat                                                       | Any message, when the provider supports keys               |

## Common mistakes

- **One queue for everything.** A campaign of millions blocks urgent messages for hours.
- **Checking preferences when queuing.** A promotion queued at 11 a.m. and sent at 2 p.m. ignores an unsubscribe at noon.
- **Deduplicating per channel only, then falling back.** If push fails and the system falls back to email, it must still treat the push and the email as one notification, and check that email is allowed.
- **Retrying without limits.** A provider that is down receives a flood of retries (SD 11); back off with jitter, cap the attempts, then move to the dead-letter queue.
- **Ignoring quiet hours across time zones.** "No messages after 10 p.m." means the user's 10 p.m.; a campaign sent at one moment worldwide must hold some users' messages until morning.

## Edge cases

- **Invalid device tokens.** Push providers report that a phone's token is no longer valid; remove it so future pushes are not wasted, and use a fallback channel if allowed.
- **A user changes preferences during retries.** Each retry checks preferences again; a user who opted out after the first attempt gets no further attempts.
- **Bounces and complaints.** Email providers report undeliverable addresses and spam complaints; stop sending to them, or the provider may block the whole account.
- **Many events about one thing.** "Order packed", "order shipped" and "out for delivery" within a minute can be combined into one message, if the product prefers fewer notifications.

### Extension (optional): delivery receipts

Providers can call back to say what happened to a message: delivered, opened, bounced. Storing these callbacks lets the system know whether a fallback is needed, such as sending email when a push was never delivered within 10 minutes. Callbacks are also delivered at least once and may arrive out of order, so they need the same care: a key per callback, and a status that only moves forward (sent → delivered → opened).

## Worked example

**Problem:** A shopping app has 50 million users. It sends about 20 million transactional notifications a day (order updates, login codes) and campaigns of up to 10 million promotional emails. Providers: email accepts 1,000 per second and an idempotency key; SMS accepts 100 per second and has no idempotency key; push accepts 10,000 per second. Order updates must arrive within 1 minute, login codes within 30 seconds. Users can opt out of promotions per channel and set quiet hours. Events arrive on a queue with at-least-once delivery. Design the notification system.

**Solution:**

1. **Requirements.** (F1) Send push, email and SMS for events. (F2) Campaigns of 10 million emails. (F3) Respect opt-outs and quiet hours at the moment of sending, also on retries and fallbacks. (N1) Order updates within 1 minute, login codes within 30 seconds, even during a campaign. (N2) Never exceed a provider's quota. (N3) One event notifies a user at most once per notification. Out of scope: designing the message content.
2. **Estimates.** 20 million a day is about 230 per second on average, perhaps 1,000 at peak, mostly push. A campaign at 800 emails per second takes about 3.5 hours. Deduplication records: about 30 million a day × 100 bytes = 3 GB, 21 GB for 7 days.
3. **API.** Other services call `notify(eventId, userId, type)`; users change settings through a preferences API.
4. **Data model.** `preferences(user_id, channel, category, allowed)`, quiet hours and time zone per user; `sent(notification_key primary key, status, created_at)`, where the key is (event, user); device tokens and email addresses per user.
5. **High-level design.** Event queue → notification workers → one queue per channel and priority (transactional, promotional) → one pacer per provider → providers.
6. **Deep dive.** _Quotas and priority:_ the email pacer sends at most 1,000 per second, retries included, always taking transactional messages first and reserving 200 per second for them; campaigns use the rest. _Deduplication:_ before sending, a worker inserts the notification key into `sent` with status "sending"; the unique key rejects a second worker or a redelivered event. For email, the same key is passed to the provider as its idempotency key, so if a worker crashes and the event is redelivered, finding "sending", the retry with the same key is dropped by the provider. Push has no such key, so a push found in "sending" is not retried: a rare miss rather than a duplicate. For SMS login codes, the worker sends and then records "sent", accepting a rare duplicate code over a missing one. _Preferences:_ the worker reads them just before sending, not when the event was queued; promotional messages for users in quiet hours wait in a delay queue until morning. If a push fails and the user allows email for this category, the fallback email uses the same notification key, so the user gets one or the other.
7. **Failures.** If the email provider is down, messages back off with jitter for up to an hour, then go to the dead-letter queue; transactional messages fall back to push where allowed. If a worker crashes after sending an SMS but before recording it, the code may be sent twice, by choice. A campaign sent to the wrong list is stopped by a kill switch that empties the promotional queue.
8. **Summary.** F1 and F2 by per-channel queues; F3 by checking preferences at send time, also for retries and fallbacks; N1 by priority and reserved quota; N2 by pacers that count retries; N3 by the notification key, plus provider keys for email.

**Answer:** One queue per channel and priority, with a pacer per provider that counts retries and keeps 200 email sends per second for transactional messages, so a 10-million-email campaign takes about 3.5 hours without delaying order updates. A notification key with a unique constraint, shared by fallbacks and passed to the email provider, prevents duplicates. Preferences and quiet hours are checked at the moment of sending, on every retry.
