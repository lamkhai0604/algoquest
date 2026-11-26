# Consistency and Availability

## Learning objectives

- Explain what a network partition is, and why it is different from a server failing.
- Tell strong consistency from eventual consistency, with an example of each from everyday apps.
- Explain the choice a replicated system must make during a partition: answer with possibly stale or conflicting data, or refuse to answer (CAP).
- Estimate what strong consistency costs in time across regions and in refused requests during a partition.
- Choose consistency or availability separately for each feature, from what a wrong answer would cost.

### Key terms

- **Region.** A group of data centers in one part of the world, such as the United States or Europe. Copies of data in different regions are far apart: a round trip between them takes tens to hundreds of milliseconds.
- **Network partition.** A break in the network that splits servers into groups that cannot reach each other, while each group keeps running and serving its own users. It is not a crash: both sides are alive and receive requests.
- **Strong consistency.** Every read returns the result of the latest completed write, as if there were one copy of the data. Also called linearizability.
- **Eventual consistency.** Copies may disagree for a while, but if writes stop, all copies become the same. A read may return an older value.
- **Availability (in this sense).** Every request that reaches a working server gets an answer, not an error, even during a partition.
- **CAP.** During a network partition, a replicated system must choose between consistency (refuse some requests to avoid stale or conflicting answers) and availability (answer every request, accepting stale or conflicting data). Without a partition, it can have both.
- **Conflict.** Two copies accepted different writes to the same data while they could not talk, such as two buyers for the last seat, one on each side.
- **Home region.** The one region that accepts writes for a given piece of data, so all writes to it go through one place.

## Problem hook

A ticket app runs in two regions, the United States and Europe, so each user talks to a nearby data center. Each region has a full copy of the data, and changes are sent to the other region within a fraction of a second.

One afternoon the undersea link between the regions fails for 20 minutes. Both regions are fine and full of users; they just cannot talk to each other. A concert has one seat left. A buyer in New York and a buyer in Berlin both press "Buy" during the break. Should both regions sell it? Should one, or neither? And what about the "1,203 people are interested" counter on the same page, which also cannot be updated across the break?

## Intuition

Think of a shop with two branches that share one stock list by phone. Normally, whenever one branch sells something, it phones the other, and both lists match.

Then the phone line goes dead. A customer in branch A asks for the last jacket. Branch A can sell it now and hope branch B does not sell it too: it stays available, but both may sell the same jacket. Or branch A can say "sorry, we cannot confirm it until the line is back": nothing is sold twice, but the customer leaves without a jacket. There is no third option while the line is dead.

For the poster in the window that says "1,200 happy customers", it does not matter if the two branches show slightly different numbers for a while. Each branch keeps counting and they add up their counts when the line is back. Different things in the same shop deserve different choices.

**A link to SD 6.** Replication lag already showed a replica answering with an older value. Eventual consistency is that same behavior, accepted on purpose; strong consistency is the promise that it never happens.

## When to use

- **Strong consistency:** a wrong or stale answer causes real harm or cannot be undone: payments and balances, the last seat or the last item in stock, unique usernames, permissions after they are removed.
- **Eventual consistency:** a briefly old value is harmless and staying up matters more: like and view counts, feeds, product reviews, "people interested" counters, recommendations.
- **Read-your-writes (SD 6):** each user must see their own changes, while other users may see them a moment later, such as a profile edit.
- **A home region per item:** strong consistency for many items without every write crossing an ocean, when most users of an item are in one region, such as an event's tickets sold where the event takes place.

## Template code

There is no code in this level. Use this **design template** per feature:

```text
For each feature:
  1. What does a stale read cost? What does a conflicting write cost?
     (two sales of one seat vs a like count off by a few)
  2. During a partition: refuse (consistency) or answer (availability)?
  3. If consistency: where is the single place that decides?
     (one leader, or a home region per item) Who is refused during a partition?
     Cost without a partition: + one cross-region round trip per write,
     unless the deciding place is near the user.
  4. If availability: how do copies agree afterwards?
     (counts add up; last write wins only where losing a write is acceptable)
  5. Estimate: extra time per write, requests refused during a partition.
```

## Complexity

**The time cost of strong consistency.** A write that must be confirmed by the other region waits at least one round trip. With a 90 ms round trip between the United States and Europe and 5 ms of local work, a strongly consistent write takes about 5 + 90 = 95 ms; an eventually consistent write confirmed by the local region alone takes about 5 ms, and the other region gets it a moment later.

**The availability cost during a partition.** Suppose all tickets have their home in the United States, and 40% of the 200 purchase attempts per second come from Europe. During a 20-minute partition, Europe cannot reach the home region, so its attempts are refused: 0.4 × 200 = 80 per second × 1,200 seconds = **96,000** refused attempts. With a home region per event instead, only buyers of an event whose home is on the other side are refused.

**Choosing availability has a cost too.** If both regions keep selling during the partition, every seat that both sides sell becomes a conflict to fix afterwards, such as a refund and an apology.

| Feature | Stale or conflicting data costs | Choose during a partition | Typical design |
| --- | --- | --- | --- |
| Last seat, payment, balance | Selling twice, money lost | Consistency | One home region or leader decides |
| Username sign-up | Two users with one name | Consistency | One place checks uniqueness |
| Like and view counts | A slightly wrong number | Availability | Count in each region, add later |
| Feed, reviews | An older version for a while | Availability | Replicate asynchronously |

## Common mistakes

- **Thinking CAP means "pick two of three" all the time.** Without a partition a system can be both consistent and available; the choice is forced only while the network is split.
- **One choice for the whole app.** Making likes strongly consistent slows every like by a round trip for no benefit; making payments eventually consistent can lose money.
- **Treating a partition like a crash.** A crashed server stops answering; in a partition both sides keep answering their own users, which is exactly how conflicts are created.
- **Last write wins for everything.** When two regions change the same data, keeping only the latest write silently throws the other away. Fine for a profile picture, not for a cart or a balance.
- **Forgetting the user's own changes.** Eventual consistency is acceptable for others' likes, but a user who edits their own post and sees the old text thinks the edit failed (read-your-writes, SD 6).

## Edge cases

- **A partition inside one region.** Partitions also happen between data centers or racks in the same region; the same choice applies, only with shorter round trips.
- **A slow link that looks like a partition.** If messages take 30 seconds, a system waiting for the other side is effectively unavailable; timeouts decide when to treat slowness as a partition.
- **Healing after a partition.** When the link returns, the copies exchange what they missed. Counters add up; conflicting writes to the same item need a rule or a person.
- **Clocks disagree.** "Latest write" by timestamp depends on clocks in different regions, which can differ by milliseconds or more, so the "latest" write may not be the last one that really happened.

### Extension (optional): PACELC, quorums and conflict resolution

**PACELC** extends CAP: if there is a **P**artition, choose **A**vailability or **C**onsistency; **E**lse (normal operation), choose lower **L**atency or **C**onsistency. It names the everyday cost of strong consistency, the extra round trip, not only the rare partition.

**Quorums.** With N copies, a write waits for W copies and a read asks R copies. If W + R > N, every read overlaps at least one copy that has the latest write. With N = 3, W = 2 and R = 2 give 2 + 2 = 4 > 3; W = 1 and R = 1 are faster, but 1 + 1 = 2 is not more than 3, so a read can miss the latest write.

**Conflict resolution.** Besides last write wins, some data can merge without losing anything: a set of items in a cart can take the union of both sides, and counters can add each side's increments. Data types designed to merge this way are called CRDTs.

## Worked example

**Problem:** The ticket app sells tickets for events in the United States and Europe and shows a "people interested" counter on every event page. 200 purchase attempts arrive per second, 40% from Europe; about 90% of buyers buy tickets for events in their own region. A purchase must be confirmed within 500 ms and a seat must never be sold twice. The counter may be up to a minute old. The round trip between the regions is about 90 ms; local work takes about 5 ms. Partitions between the regions happen a few times a year and last up to 20 minutes. Design how each feature behaves, normally and during a partition.

**Solution:**

1. **Tickets need consistency.** Selling a seat twice is the harm to avoid, so during a partition some purchases must be refused rather than risk a double sale.
2. **A home region per event.** Each event's seats are decided in the region where the event takes place. A local buyer's purchase takes about 5 ms; a buyer across the ocean waits about 5 + 90 = 95 ms. Both are within 500 ms.
3. **During a partition.** Only buyers whose event's home is across the break are refused: about 10% of 200 = 20 attempts per second, 20 × 1,200 = 24,000 over 20 minutes, instead of 96,000 if every event's home were in the United States. They see "we cannot confirm this purchase right now, please try again shortly".
4. **The counter needs availability.** Each region counts "interested" clicks for every event and sends its count to the other region every few seconds; the page shows the sum. During a partition each region keeps counting, and the sums catch up when the link returns. The counter is at most a minute old normally; during a partition it may lag further, which is harmless.
5. **Each buyer's own tickets.** "My tickets" is read from the event's home region, so a buyer always sees the purchase they just made.

**Answer:** Tickets are strongly consistent through a home region per event, which costs at most one 90 ms round trip and refuses about 24,000 attempts in a 20-minute partition; the interested counter is eventually consistent, counted in both regions and summed. The same page uses two different choices, one per feature.
