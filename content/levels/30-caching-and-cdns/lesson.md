# Caching and CDNs

## Learning objectives

- Explain why a cache makes reads faster and takes load off the database.
- Follow cache-aside step by step: what happens on a hit and on a miss.
- Work out the average read time and the database load from a hit rate.
- Choose a TTL, and explain stale data and how deleting a cache entry on a write fixes it.
- Explain what a CDN does and when it helps.

### Key terms

- **Database (a first look).** The program that stores data on disk and answers questions about it, such as "the product with id 42". It keeps data safe, but each read takes milliseconds. SD 4 teaches databases in full.
- **Cache.** A fast copy of data kept close to where it is needed, usually in memory, so the slower original does not have to be read again.
- **In-memory store.** A program that keeps data in RAM and answers reads in well under a millisecond on the same machine, plus a network round trip when it runs on another server. Shared caches are usually in-memory stores.
- **Cache key.** The name a value is stored under, such as `product:42`. A cache works like the hash maps of Level 3: look up a key, get a value.
- **Cache hit and cache miss.** A hit means the key is in the cache. A miss means it is not, so the data must be read from the database.
- **Hit rate.** The share of reads that are hits. A 90% hit rate means 9 of every 10 reads are served by the cache.
- **Cache-aside.** The most common way to use a cache: the server checks the cache first; on a miss it reads the database and puts the result in the cache for next time.
- **TTL (time to live).** How long an entry may stay in the cache before it is removed, counted from when the entry was stored. After the TTL, the next read is a miss and fetches fresh data.
- **Stale data.** A cached value that is older than the value in the database.
- **Invalidation.** Removing or replacing a cache entry because the original changed.
- **CDN (content delivery network).** Servers in many cities that keep copies of files such as images, so users download them from a nearby city. Each of those servers is an **edge server**. When an edge's copy expires, the edge asks the origin on the next request for that file; if the file has not changed, the origin can simply confirm it, and the edge keeps its copy.
- **Origin server.** The server that holds the original files; a CDN asks it when an edge server does not have a copy.

## Problem hook

An online shop's product page is read 5,000 times per second at peak. Every read asks the database for the product's name, price and stock. The database can answer about 1,000 reads per second before it slows down, so at peak, requests queue and the page takes seconds to load.

Most of these 5,000 reads ask for the same few hundred popular products, and a product's details change only a few times a day. Reading the same unchanged data from the database again and again is the waste a cache removes.

## Intuition

Go back to the restaurant of SD 1. The storeroom (the database) holds everything, but it is at the back, and the cooks queue at its door. Most orders use the same few ingredients, so the kitchen keeps those on a counter next to the stove (the cache). A cook first looks at the counter. If the ingredient is there, it is a hit: fast. If not, it is a miss: the cook walks to the storeroom, and puts some on the counter for the next order.

The counter is small, and food on it can go stale. So the kitchen labels each item with how long it may stay (the TTL), and when the storeroom gets a new delivery of something, the old portion on the counter is thrown away (invalidation).

**A link to Level 3.** A cache is a very large hash map shared by many servers: a key goes in, a value comes out, in roughly constant time.

## When to use

A cache helps when:

- The same data is read much more often than it changes (many reads per write).
- A small set of items gets most of the reads, so a small cache holds most of what is asked for.
- Slightly old data for a short, known time is acceptable, or every change can delete the cached copy.

A CDN helps when the same files (images, videos, scripts) are downloaded by many users who are far from the origin server.

### Where to cache

| Place | What it keeps | Shared by |
| --- | --- | --- |
| Browser | Files and responses the user already downloaded, for repeat visits | One user |
| CDN edge server | Files that are the same for everyone, close to users | Everyone near that edge |
| Application cache | Data the servers read or compute, such as product details; either in each server's own memory or in a shared in-memory store | One server, or all servers |
| Database's own cache | Recently read data pages, inside the database (SD 4) | All queries |

The calculations in this level are about a shared application cache.

### Changing a file behind a CDN: versioned file names

A CDN stores files by their URL. If a photo changes but keeps its URL, edge servers keep the old copy until it expires. A common fix is a **versioned file name**: the new photo gets a new name, for example `photo-42-v1.jpg` becomes `photo-42-v2.jpg`. To the CDN this is a new key, so no edge has an old copy of it. The page must then link to the new name: a user sees the new photo as soon as the page or product data they load contains the new link, so the freshness of that page decides how fast the change reaches users.

Be careful when a value must always be exact the moment it changes, such as an account balance right after a transfer; such reads usually go to the database.

## Template code

There is no code in this level. Use this **design template** for cache-aside:

```text
Read a value with key K:
  1. Look up K in the cache.
  2. Hit: return the cached value.
  3. Miss: read the value from the database,
           store it in the cache under K with a TTL,
           return it.

Change a value with key K:
  1. Write the new value to the database.
  2. Delete K from the cache, so the next read loads the new value.

For each cached item, write down:
  - Its key, and its TTL.
  - How stale it may be, and what deletes it when it changes.
  - What happens to the database if the cache is empty.
```

## Complexity

**Cost and limits** of a cache:

- **Latency.** A hit takes about as long as one round trip to the cache server (about 1 ms in the same data center, approximate). A miss takes the cache lookup plus the database read.
- **Database load.** Only misses reach the database. With R reads per second and hit rate h, the database receives R × (1 − h) reads per second.
- **Memory.** The cache must hold the hot items. Memory costs more than disk, so a cache holds a part of the data, not all of it.
- **Freshness.** A longer TTL gives more hits but older data; a shorter TTL gives fresher data but more misses.

**Average read time.** If a hit takes c ms, a miss takes c + d ms (the cache lookup plus the database read), and the hit rate is h:

average = h × c + (1 − h) × (c + d)

Example with c = 1 ms, d = 20 ms and h = 90% (0.9):

1. Hits: 0.9 × 1 = 0.9 ms.
2. Misses: 0.1 × (1 + 20) = 0.1 × 21 = 2.1 ms.
3. Average: 0.9 + 2.1 = 3.0 ms, compared with 20 ms when every read goes to the database.

## Common mistakes

- **Caching without a plan for changes.** With no TTL and no invalidation, a changed price can stay wrong in the cache forever.
- **Caching data that must be exact.** An account balance or the last seat of a concert should not be read from a cache that may be stale.
- **Updating the cache before the database.** If the database write then fails, the cache shows a value that was never saved. Write the database first, then delete the cache entry.
- **Forgetting the empty cache.** After a restart, the cache is empty and every read is a miss. Either the database can take the full read load, or the service must limit how many reads reach the database while the cache fills up again.
- **Putting a CDN in front of personal pages.** A page that is different for every user (such as "my orders") must not be cached and shown to someone else.

## Edge cases

- **A delete is lost.** If the server crashes between writing the database and deleting the cache entry, the old value stays until its TTL ends. This is why a TTL is useful even when every write deletes the entry.
- **A read and a write at the same moment.** A read can miss and load the old value from the database just before a write changes it. The write then deletes the cache entry, and only after that does the slow read store its old value, with a fresh TTL. A TTL counts from when the entry is stored, not from when its value was read, so this old value can live for the TTL plus the time the read took. To keep a freshness promise, choose TTL + longest read time ≤ the allowed age.
- **A key that does not exist.** Requests for a product id that does not exist always miss. Caching "not found" for a short TTL protects the database.
- **The cache server is down.** Reads fall back to the database. If the database cannot take the full load, the service must shed load or serve fewer features until the cache is back.

### Extension (optional): other strategies

- **Write-through.** Every write updates the cache and the database, so the cache stays current as long as both updates succeed; the design must say what happens when one of them fails. Writes become slower.
- **Write-back.** Writes go to the cache first and reach the database later. Writes are fast, but data can be lost if the cache fails before saving.
- **Eviction and LRU.** When the cache is full it removes entries; LRU (least recently used) removes the entry that was used (read or written) longest ago.
- **Hot keys and the thundering herd.** One very popular key can overload one cache server. When such a key expires, thousands of requests may miss at once and hit the database together; letting only one request reload the key prevents this.

## Worked example

**Problem:** The product page gets 5,000 reads per second at peak. The database can serve about 1,000 reads per second, and the team wants it to run at no more than about two thirds of that at peak (the headroom idea from SD 2). Prices change a few times a day, and the business accepts a price that is up to 60 seconds old. Measurements show that a database read, including storing the result in the cache, always finishes within 2 seconds. Design the read path and say what hit rate is needed.

**Solution:**

1. **Database budget.** Two thirds of 1,000 is 1,000 × 2 ÷ 3 ≈ 667 reads per second; round down to 650 to keep a little extra room.
2. **Allowed misses.** Only misses reach the database, so misses must be at most 650 of the 5,000 reads per second: 650 ÷ 5,000 = 0.13, or 13%.
3. **Needed hit rate.** 100% − 13% = 87%. A product page with a few hundred popular products usually gets a higher hit rate than that, but this must be measured.
4. **Choose the TTL.** The TTL counts from when an entry is stored, and a slow read can store a value that was read up to 2 seconds earlier (see Edge cases). So the oldest price a user can see is TTL + 2 seconds. TTL + 2 ≤ 60 gives TTL ≤ 58; choose 55 seconds.
5. **Handle changes.** When a price changes, write the database, then delete the product's cache key. Users then usually see the new price at once; in the rare race with a slow read, they see the old price for at most 55 + 2 = 57 seconds.
6. **Check the empty cache.** After a cache restart, all 5,000 reads per second would miss, five times the database limit. Plan for it: keep a second cache server that holds a copy of the same data and switch to it, and if both are empty, let only about 650 reads per second through to the database (the rest get a short "try again" page) until the popular products are cached again.

**Answer:** Cache-aside with key `product:<id>`, a TTL of 55 seconds, and a delete on every price change. The database stays within its budget if the hit rate is at least 87%, and an empty cache is handled by a copy on a second cache server and by limiting database reads while it refills.
