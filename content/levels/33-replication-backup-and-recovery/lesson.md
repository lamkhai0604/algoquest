# Replication, Backup and Recovery

## Learning objectives

- Explain leader-follower replication, and use read replicas to serve more reads.
- Estimate how many replicas a read load needs, remembering that every replica also applies every write.
- Tell synchronous from asynchronous replication, and say what each costs in speed and in lost data.
- Explain replication lag and keep a user from seeing their own change disappear (read-your-writes).
- Describe a failover, and estimate how many writes an asynchronous failover can lose.
- Plan backups from two targets, RPO and RTO, and explain why replication is not a backup.

### Key terms

- **Replication.** Keeping copies of the same database on several servers, updated as the data changes.
- **Leader and follower.** The **leader** (also called the primary) accepts every write and sends each change to the **followers** (also called replicas or secondaries), which apply the same changes in the same order.
- **Read replica.** A follower that also answers read queries, so reads are spread over several servers.
- **Synchronous replication.** The leader confirms a write to the application only after at least one chosen follower has saved it durably (on disk, so it survives a crash). If the leader alone fails and that follower is promoted, no confirmed write is lost; every write waits longer.
- **Asynchronous replication.** The leader confirms a write as soon as it has saved it, and sends it to the followers afterwards. Writes are faster, but the newest writes can be lost if the leader fails.
- **Replication lag.** How far a follower is behind the leader, usually measured in time. Often under a second, but it can grow to minutes when the leader is busy or the network is slow.
- **Read-your-writes.** The promise that after you change something, you see your change, even if other users see it a moment later.
- **Failover.** Making a follower the new leader when the leader fails. Promoting the follower is called **promotion**.
- **Backup.** A copy of the data kept separately from the live database, often in another place, so it can be restored after data is lost or damaged.
- **Point-in-time recovery.** Restoring a full backup and then replaying the database's log of changes up to a chosen moment, such as one minute before a mistake.
- **RPO (recovery point objective).** The most data, measured in time, the business accepts losing. An RPO of 5 minutes means losing at most the last 5 minutes of changes.
- **RTO (recovery time objective).** The longest time the business accepts until the service works again.

## Problem hook

An online shop runs on one database server. At sale time it serves 8,000 reads and 800 writes per second, and the database is at its limit: pages slow down, and adding a faster server would only buy a few months.

Two weeks later, an engineer runs a delete command on the wrong table and removes every order from the last day. The team had just added copies of the database on two more servers, but the delete reached those copies within a second. The copies made the shop faster, but they did not save the orders.

This level covers both sides of keeping copies: copies that serve more traffic and survive a failed server, and backups that survive mistakes.

## Intuition

Think of a teacher writing on the main board, with assistants copying every word onto three other boards around a large hall. Students read whichever board is nearest, so many more students can read at once. That is replication with read replicas.

The copies are a moment behind: a student who just asked the teacher to fix a typo may look at a side board and still see the typo. That is replication lag. If the teacher falls ill, one assistant can take over the main board; anything the teacher wrote in the last moment that no assistant had copied yet is lost. That is an asynchronous failover.

Now the teacher erases half the board by mistake. The assistants copy that too, faithfully. The only way back is a photo of the board taken earlier, kept somewhere else. That photo is a backup.

**A link to SD 4.** A database keeps a log of every change it makes. Followers replay that log to stay in step with the leader, and point-in-time recovery replays the same log on top of a backup.

## When to use

- **Read replicas:** reads are much more frequent than writes, and some reads can be a moment old, such as product pages, feeds and search results.
- **Reading from the leader:** the read must show the latest data, such as a user's own change just after saving it, or a check before a payment.
- **Synchronous replication:** a confirmed write must never be lost, such as payments, and the follower is close enough that the extra wait is small.
- **Asynchronous replication:** speed matters more than the last second of writes, or the follower is far away, such as in another region.
- **Failover:** the service must keep working when the leader's server fails.
- **Backups with point-in-time recovery:** always. Every database that holds data you cannot rebuild needs backups kept separately from it, whatever replication it uses.

## Template code

There is no code in this level. Use this **design template** for copies of your data:

```text
1. Load: reads per second and writes per second at peak.
   Replica read budget = safe limit per server - writes per second
   (every replica applies every write).
   Replicas = reads from replicas / replica read budget, rounded up.
2. Which reads must be fresh? Send those to the leader
   (for example, a user's own data for a short time after they change it).
3. Sync or async? What may be lost if the leader fails now?
4. Failover: who detects the failure, who is promoted, how long it takes.
5. Targets: RPO (data you may lose) and RTO (time until working again).
6. Backups: full backup how often, log archived how often, kept where.
   Restore time = data size / restore speed + log replay time.
   Test a restore regularly; an untested backup may not work.
```

## Complexity

**Read capacity.** Replicas multiply reads, not writes. In a simplified model where applying a replicated write costs about as much as answering a query:

1. A server's safe limit is 2,100 queries per second (70% of 3,000).
2. The leader sends 800 writes per second to every replica, so each replica has 2,100 − 800 = 1,300 queries per second left for reads.
3. If writes grew to 2,100 per second, replicas would have no room for reads at all: more replicas cannot fix a write limit.

**Synchronous replication costs a round trip.** Each confirmed write waits for a follower's answer: about 0.5 ms in the same data center (SD 1), but 100 ms or more across an ocean. If the only synchronous follower stops answering, writes wait too, unless the database is set up to use another follower.

**Lost writes in an asynchronous failover.** Writes that reached the leader but not yet the follower are lost when the follower is promoted. With a lag of 3 seconds at 200 writes per second, that is up to 3 × 200 = 600 confirmed writes.

**Restore time.** Restoring a 400 GB backup at about 200 MB per second takes 400,000 ÷ 200 = 2,000 seconds, about 33 minutes, before replaying the log. Bigger databases take longer, so the RTO must be checked against a real restore, not guessed.

| Protection | Survives a failed server | Survives a mistaken delete | Typical data loss | Typical time to recover |
| --- | --- | --- | --- | --- |
| Asynchronous replica | Yes, by failover | No, the delete is copied | Writes within the lag | Seconds to minutes |
| Synchronous replica | Yes, by failover to that replica | No, the delete is copied | None for confirmed writes, if the synchronous replica is the one promoted | Seconds to minutes |
| Backup with log archiving | Yes, by restoring | Yes, by restoring to before it | After losing the server: up to the log archive interval. After a mistake: every change made after the chosen point, valid ones included | Minutes to hours |

## Common mistakes

- **Treating replicas as backups.** A delete, a bad migration or a bug that corrupts data is copied to every replica within seconds.
- **Sending every read to a replica.** A user saves their new address, reloads the page, and the replica still shows the old one. Reads that must be fresh go to the leader.
- **Adding replicas to fix a write problem.** Every replica applies every write; replicas only add read capacity.
- **Backups that were never restored.** A backup can be incomplete, unreadable, or slower to restore than the RTO allows. Restore it on a schedule to find out.
- **Backups in the same place as the database.** A fire, a region outage, or an attacker who deletes the database can delete those backups too. Keep a copy in another place, with separate access.

## Edge cases

- **Lag grows under load.** During a sale the leader is busy and lag can reach seconds or minutes. Monitor lag, and stop sending reads to a replica that falls too far behind.
- **The leader comes back after a failover.** If the old leader still accepts writes after a follower was promoted, two servers accept writes and the data splits (see the extension).
- **A failover loses writes the user was told succeeded.** With asynchronous replication, a confirmed order can disappear. For data that must never be lost, use synchronous replication to at least one follower, and promote that follower: only it is sure to hold every confirmed write. If it stops answering, the leader should stop confirming writes rather than quietly switch to asynchronous.
- **Restoring to before a mistake also undoes later valid changes.** If a delete is found three hours later, restoring to just before it also removes the three hours of good orders that came after. The team must copy those back from the damaged database or re-enter them; point-in-time recovery alone does not merge the two.
- **A mistake is noticed late.** If a bad change is found after three days but backups are kept for only two, there is no clean copy left. Keep backups for longer than mistakes usually take to notice.

### Extension (optional): split brain and fencing

**Split brain** is when two servers both believe they are the leader and both accept writes, for example after a network problem cut the old leader off from the others for a while. The two copies then disagree, and merging them later is hard or impossible.

**Fencing** prevents it: before or when a follower is promoted, the old leader is stopped from accepting writes, for example by cutting it off from the storage or the network, or by giving every leader a number (an epoch or term) and rejecting writes that carry an older number. Failover tools also wait for a majority of servers to agree that the leader is gone before promoting a new one.

## Worked example

**Problem:** The online shop's database serves 8,000 reads and 800 writes per second at peak. One database server handles about 3,000 queries per second, and the team keeps each server at no more than 70% of that. About 5% of reads must show the latest data: a customer's own cart and orders just after they change them. The business accepts losing at most 1 minute of orders after a disaster that destroys the database, and wants the shop working again within 1 hour. The database holds 400 GB, and a restore runs at about 200 MB per second. Design the replication and backups.

**Solution:**

1. **Fresh reads go to the leader.** 5% of 8,000 is 400 reads per second. The leader handles 800 writes + 400 reads = 1,200 queries per second, under its safe limit of 2,100.
2. **Other reads go to replicas.** 8,000 − 400 = 7,600 reads per second. Each replica applies all 800 writes, leaving 2,100 − 800 = 1,300 queries per second for reads (simplified model). 7,600 ÷ 1,300 ≈ 5.8, so 6 replicas; a 7th keeps the limit when one replica fails.
3. **Read-your-writes.** The team takes any replica more than 10 seconds behind out of service, so replicas are never more than 10 seconds old. After a customer changes their cart or places an order, their own cart and order reads go to the leader for the next 30 seconds, longer than that limit.
4. **Failover.** One replica in the same data center is synchronous, so a confirmed order is never lost when the leader fails; it costs about 0.5 ms per write. If the leader fails, that replica is promoted within a minute and the old leader is fenced off.
5. **Backups.** A full backup every night and the database log archived every 30 seconds, both kept in another region with separate access. RPO after losing the database or the data center: at most about 30 seconds of orders, within 1 minute. After a mistaken delete, the shop restores to just before it and copies later valid orders back from the damaged database.
6. **Restore time.** 400,000 MB ÷ 200 MB/s = 2,000 s ≈ 33 minutes, plus replaying up to a day of log, measured at about 15 minutes: about 48 minutes. That leaves about 12 minutes of the 1-hour RTO for starting the server, checks and reopening, which is tight. A restore test each month measures the whole recovery, and if it passes 1 hour the team takes full backups more often to shorten the replay.

**Answer:** One leader for writes and fresh reads, 6 read replicas (7 with a spare), one of them synchronous for failover, and nightly backups with log archiving every 30 seconds in another region. The replicas handle load and server failures; only the backups could have brought back the deleted orders.
