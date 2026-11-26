# Partitioning and Consistent Hashing

## Learning objectives

- Explain why a database is split into partitions when one server cannot hold the data or take the writes.
- Estimate how many partitions a load needs from both storage and writes.
- Tell range partitioning from hash partitioning, and choose a partition key from how the data is read and written.
- Recognize a hot partition and a hot key, and spread their load.
- Explain why adding a server with "hash mod N" moves most keys, and how consistent hashing with virtual nodes moves only a small share.

### Key terms

- **Partitioning (sharding).** Splitting one large dataset into parts, each stored on a different server. Each part is a **partition** or **shard**. Unlike replication (SD 6), where every server holds all the data, each shard holds only its part.
- **Partition key (shard key).** The field that decides which shard a row belongs to, such as `customer_id`.
- **Range partitioning.** Each shard holds a range of key values, such as orders from January on one shard and February on the next, or customers A–F and G–M.
- **Hash partitioning.** The key is passed through a hash function (Level 3), and the hash decides the shard, so neighboring keys land on different shards and load spreads evenly.
- **Hot partition and hot key.** A shard that gets far more traffic than the others is **hot**; often one key, such as a very busy account, causes it.
- **Scatter-gather.** A query that does not include the partition key must ask every shard and combine the answers.
- **Resharding.** Moving data between shards when shards are added or removed.
- **Consistent hashing.** Placing servers and keys on a ring of hash values; each key belongs to the next server clockwise. Adding or removing a server moves only the keys next to it.
- **Virtual node.** One of many points on the ring that belong to the same server. With many points per server, each server's share of keys, and of the keys that move, comes out close to even.

## Problem hook

An online marketplace keeps every order in one database. It now holds 5 TB and takes 30,000 new orders and order updates per second at peak. The team added read replicas (SD 6), but they did not help: every replica applies every write, and the leader alone cannot keep up with 30,000 writes per second. Its disk is filling up too.

The data has to be split across several servers, each holding part of it. But how do you decide which order goes where, so that each server gets a fair share, a customer's orders can still be found quickly, and adding a server next year does not mean moving everything?

## Intuition

Think of a library that has outgrown its building. It opens five branches. One way to split the books is by title: A–E in the first branch, F–J in the second, and so on. That is range partitioning. It makes "all books from A to C" easy, but if a new popular series starting with "H" arrives, one branch gets all the visitors.

Another way is to give every book a number from a fixed formula based on its title and send it to branch "number mod 5". That is hash partitioning: books spread evenly, but "all books from A to C" now means visiting every branch.

Now a sixth branch opens. With "mod 5" changed to "mod 6", most books would get a new branch and have to be moved. Consistent hashing is a smarter rule: the new branch takes over only a slice of books from its neighbors, and every other book stays where it is.

**A link to Level 3.** A hash function turns a key into a number that looks random but is always the same for the same key. Hash maps use it to pick a bucket; partitioning uses it to pick a server.

## When to use

- **Partitioning:** the data does not fit on one server, or writes exceed what one leader can take. If only reads are the problem, replicas or a cache (SD 3, SD 6) are simpler.
- **Hash partitioning:** most queries look up one key, such as "orders of customer 42", and load must spread evenly.
- **Range partitioning:** queries read ranges, such as "readings from 9:00 to 10:00", and the key does not make all new writes land in one range.
- **A partition key:** the field that almost every query includes, and that has many different values with similar traffic.
- **Consistent hashing:** servers are added or removed often, and moving data is costly, such as in caches and large key-value stores.

## Template code

There is no code in this level. Use this **design template** for partitioning:

```text
1. Do you need it? Storage per server and writes per leader are the limits.
   Shards = max(total data / data per shard, total writes / writes per shard),
   rounded up, plus room to grow.
2. Partition key: which field do almost all queries include?
   Does it have many values with similar traffic?
3. Range or hash? Range keeps ranges together but can make one shard hot;
   hash spreads load but scatters range queries.
4. Hot keys: can one key exceed a shard's limit? Split it (for example,
   key#0..key#3). Its own shard helps only if one server can take its
   whole load.
5. Queries without the key: scatter-gather to every shard, or keep a
   separate index (see the extension).
6. Growth: consistent hashing with virtual nodes, so adding a server moves
   about 1/(N+1) of the keys.
7. Each shard still needs replicas and backups (SD 6).
```

## Complexity

**How many shards.** Each shard's server holds about 1 TB comfortably and takes about 5,000 writes per second safely. For 5 TB and 30,000 writes per second:

1. Storage: 5 TB ÷ 1 TB = 5 shards.
2. Writes: 30,000 ÷ 5,000 = 6 shards.
3. The larger answer wins: 6 shards, plus room for growth.

**Moving keys when a shard is added.** With "hash mod N", a key stays put only if its hash gives the same remainder for N and for N + 1. Going from 6 to 7 shards, that is true for about 1 key in 7, so about **6 in 7, 86%**, of all keys move. With consistent hashing, the new server takes over about 1 ÷ 7 ≈ **14%** of the keys, and every other key stays where it is.

**A hot key.** If one large seller makes 20% of all orders, that is 0.2 × 30,000 = 6,000 writes per second on one key, more than the 5,000 one shard can take, however many shards there are. Splitting the key into 4 sub-keys (`seller42#0` to `seller42#3`) gives about 1,500 writes per second each, spread over several shards; reading that seller's orders then means reading 4 sub-keys.

| Partitioning | Lookup by key | Range query | Load spread | Adding a shard |
| --- | --- | --- | --- | --- |
| Range | One shard | Few shards | Uneven if new keys cluster | Split one range |
| Hash mod N | One shard | Every shard | Even | Most keys move |
| Consistent hashing with virtual nodes | One shard | Every shard | Even | About 1/(N+1) of keys move |

## Common mistakes

- **Partitioning by a key that all new writes share.** Range partitioning by date puts every new order on the newest shard: one hot shard, the others idle.
- **Choosing a key that queries do not use.** If the shard key is `order_id` but the page lists "my orders", every page load becomes a scatter-gather over all shards.
- **Using hash mod N and then adding a server.** Most of the data moves at once, often while the system is busy.
- **Forgetting the hot key.** Spreading keys evenly does not help when one key alone carries more load than a shard can take.
- **Partitioning too early.** Shards make transactions across keys, joins and backups harder. If one server with replicas and a cache is enough, wait.

## Edge cases

- **A transaction across two shards.** Moving money between two customers on different shards is no longer one database transaction. Keep data that changes together on the same shard, or see SD 10.
- **Uneven key values.** If a few customers own most of the orders, even hash partitioning by customer leaves some shards hotter; measure, and split the heaviest keys.
- **A shard fails.** Only that shard's data is unavailable, not everything, which is why each shard keeps its own replicas (SD 6).
- **Moving data while serving it.** During resharding a key's data is copied to its new shard while the old one still serves it; reads and writes must go to the right copy until the move finishes.

### Extension (optional): secondary indexes on shards

A query by a field other than the partition key, such as "orders by status", has two options. A **local index** on each shard indexes only that shard's rows: writes stay on one shard, but the query asks every shard. A **global index** is itself partitioned by the indexed field, so the query asks one index shard, but each write may also have to update an index entry on another shard, which is slower and harder to keep in step.

## Worked example

**Problem:** A chat app stores every message. It holds 20 TB today and grows by about 1 TB a month. At peak, 60,000 messages are written per second. Almost every read asks for the latest messages of one conversation; a few large group chats get up to 2,000 messages per second. One shard server holds about 2 TB comfortably and takes about 10,000 writes per second safely. The team adds servers a few times a year. Design the partitioning for the next year.

**Solution:**

1. **Shard count.** In a year the data reaches 20 + 12 = 32 TB: 32 ÷ 2 = 16 shards for storage. Writes: 60,000 ÷ 10,000 = 6 shards. Storage wins: plan for 16 shards by the end of the year, starting with 10 today (20 ÷ 2) and adding servers as data grows.
2. **Partition key.** Reads ask for one conversation's latest messages, so use `conversation_id`. Within a shard, messages are stored by conversation and time, so "latest 50 messages of conversation 7" reads one shard and one part of an index.
3. **Hash, not range.** Hashing `conversation_id` spreads conversations evenly. Range partitioning by time would put all 60,000 new messages per second on the newest shard.
4. **Hot keys.** The busiest group chat writes 2,000 messages per second, a fifth of one shard's 10,000, so no split is needed; the team watches for any conversation above about 5,000.
5. **Growth.** Consistent hashing with about 100 virtual nodes per server: adding the 11th server moves about 1 ÷ 11 ≈ 9% of conversations, taken evenly from all ten, instead of the 10 in 11 (about 91%) that "hash mod N" would move.
6. **Each shard** has a synchronous follower and backups (SD 6). Searching all messages of one user would ask all shards; the app does not need it yet.

**Answer:** Hash-partition messages by `conversation_id` with consistent hashing and virtual nodes, starting at 10 shards and growing to about 16 within a year as storage, not writes, sets the count. A conversation's messages stay on one shard, no single conversation exceeds a shard's limit, and adding a server moves only about one key in N + 1.
