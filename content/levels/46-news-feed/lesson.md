# News Feed

## Learning objectives

- Apply the full design routine to a home feed: the posts of the accounts a user follows, newest first.
- Compare fan-out on write (copy each post into every follower's feed) with fan-out on read (gather posts when a feed is opened), using the numbers that make each one fail.
- Choose a numeric follower threshold for a hybrid design from a time budget for writes and a work budget for reads.
- Size the feed cache, and say what happens when an account crosses the threshold, a follower is inactive, or a cache node is lost.

### Key terms

- **Home feed (home timeline).** The list a user sees when opening the app: recent posts from the accounts they follow, newest first or ranked.
- **Fan-out.** Copying or gathering one post for many followers. **Fan-out on write (push):** when an account posts, a worker adds the post's ID to the feed of every follower. **Fan-out on read (pull):** when a user opens the feed, the system reads the recent posts of every account they follow and merges them.
- **Follow graph.** Who follows whom: for each account, its followers; for each user, the accounts they follow.
- **Feed cache.** An in-memory store that keeps, for each user, the IDs of the latest few hundred posts in their feed, not the posts themselves.
- **Large account.** An account with very many followers, such as a famous singer. Above a chosen **follower threshold**, its posts are not pushed; followers pull them when reading.
- **Hybrid fan-out.** Push for accounts below the threshold, pull for accounts above it, and merge the two when a feed is read.
- **Cursor.** A marker such as "posts older than ID 9812" that lets the app load the next page without counting from the start (SD 5).

## Problem hook

A photo app pushes every post into every follower's feed. It works well until a singer with 50 million followers posts a photo: 50 million feed writes. The fan-out workers, which handle 100,000 writes per second, need more than 8 minutes, and every other post waits behind them. The team switches to pulling instead: each feed open reads the latest posts of every followed account. Now a user who follows 500 accounts makes 500 reads per feed open, and at 50,000 feed opens per second the store receives 25 million reads per second.

Neither extreme works at this size. The design question is where to draw the line between them, and with which number.

## Intuition

Think of a newspaper delivery service. For a local club with 200 members, it is easy to put the club's newsletter into each member's mailbox as soon as it is printed: that is pushing. For a national newspaper read by 50 million people, stuffing every mailbox at once is impossible; instead, people pick up a copy at the corner kiosk when they want it: that is pulling. A reader's morning pile is their mailbox plus a stop at the kiosks of the few big papers they read. Where the service draws the line, at 10,000 copies or a million, depends on how fast it can fill mailboxes and how many kiosk stops a reader will tolerate.

**A link to earlier levels.** Caches and their size come from SD 3; partitioning a large store across nodes, and hot keys, from SD 8; queues and background workers from SD 7; cursors from SD 5.

## When to use

- **Fan-out on write:** for accounts with a modest number of followers, when reads far outnumber posts. Reading a feed becomes one cache lookup.
- **Fan-out on read:** for accounts with so many followers that pushing one post takes longer than the freshness target allows, or costs more writes than the system can absorb.
- **A numeric threshold:** whenever both kinds of account exist. Derive it from two budgets: how long one post may take to reach every follower, and how many pulled accounts a single feed read may merge.
- **Skipping inactive followers:** when many followers have not opened the app for weeks; build their feed by pulling when they come back.

## Template code

There is no code in this level. Apply the **routine** with these questions for a news feed:

```text
1. Requirements: who sees which posts, how fresh (seconds after
   posting), how fast a feed loads, paging, ranking in or out.
2. Estimates: feed reads per second, posts per second, fan-out writes
   = posts x followers, cache size = users x IDs kept x bytes.
3. API: post(content); getFeed(cursor) returning post IDs and a next
   cursor.
4. Data model: posts by ID; follow graph both ways; feed cache of post
   IDs per user; recent posts per large account.
5. High-level design: post service -> fan-out queue -> fan-out workers
   -> feed cache; feed service merges the cache with large accounts'
   posts.
6. Deep dive: push, pull or hybrid; the threshold and how it was
   chosen; merging at read time.
7. Failures: fan-out backlog, a lost cache node, an account crossing
   the threshold.
8. Summary: each requirement and how it is met.
```

## Complexity

The numbers below are a worked set of assumptions: 100 million daily users, each opening the feed 10 times a day; 10 million posts a day; 200 followers per account on average; fan-out workers that add 100,000 feed entries per second for one post.

**Feed reads.** 100,000,000 × 10 = 1 billion a day ÷ 100,000 seconds ≈ 10,000 per second on average; assume peaks of 5×, about 50,000 per second.

**Push for everyone.** 10,000,000 posts × 200 followers = 2 billion feed writes a day, about 20,000 per second on average: affordable. But one post by an account with 50 million followers needs 50,000,000 ÷ 100,000 = 500 seconds, about 8 minutes, before the last follower sees it.

**Pull for everyone.** A user who follows 500 accounts needs 500 reads per feed open. At 50,000 feed opens per second that is up to 25 million reads per second.

**Hybrid.** If a post must reach every follower's feed within 10 seconds, pushing works only for accounts with at most 10 × 100,000 = 1,000,000 followers: that is the threshold. A feed read is then one cache lookup plus one read per followed account above the threshold. If users follow at most 20 such accounts, a feed read costs at most 21 lookups, not 500.

| Approach                | Cost of one post with F followers | Cost of one feed read (user follows N accounts, L of them large) | Fails when                              |
| ----------------------- | --------------------------------- | ---------------------------------------------------------------- | --------------------------------------- |
| Push                    | F feed writes                     | 1 lookup                                                         | F is huge: slow and costly              |
| Pull                    | 1 write                           | N lookups                                                        | N is large and reads are frequent       |
| Hybrid with threshold T | F writes if F ≤ T, else 1         | 1 + L lookups                                                    | T is set without a time and read budget |

**Feed cache size.** Keeping the latest 500 post IDs of 8 bytes for each daily user: 500 × 8 = 4,000 bytes, × 100,000,000 = 400 GB, spread across several cache nodes by user ID, each with a replica.

## Common mistakes

- **Pushing for every account.** One very large account delays every other post by minutes.
- **Pulling for every account.** Each feed open fans out into hundreds of reads.
- **A threshold with no reason.** "One million followers" is only an answer if it comes from a time budget and a read budget.
- **Storing whole posts in each feed.** Feeds keep post IDs; the posts are fetched once, in a batch, from a posts cache. Edits and deletions then show everywhere at once.
- **Switching an account's mode at one exact number.** An account near the threshold that gains and loses followers would switch back and forth; switch to pull above T and back to push only below, say, 0.8 T.

## Edge cases

- **An account crosses the threshold.** Its new posts are pulled from then on; posts already pushed stay in feeds, and the merge removes duplicates by post ID.
- **Inactive followers.** Pushing to users who have not opened the app in 30 days wastes writes; skip them, and build their feed by pulling when they return, at the cost of a slower first load.
- **A new follow.** The followed account's recent posts are not yet in the feed; copy its latest few posts in at follow time, or merge them at read time until new posts arrive.
- **Unfollows and deleted posts.** Filter them when reading, so the feed never shows them even before the cache is cleaned.

### Extension (optional): ranking

Many feeds are ranked rather than newest first. A common shape: gather a few hundred candidate post IDs (by push, pull or both, as above), score each with a model using signals such as who posted it and how others reacted, and show the highest scores. Gathering candidates is the same fan-out problem; ranking adds compute per feed read, so it is often done for the first page only.

## Worked example

**Problem:** Design the home feed of a short-video app. 50 million daily users each open the feed 8 times a day; measured peak: 15,000 feed opens per second. 5 million posts a day, peak 300 per second. Accounts have 300 followers on average; 5,000 accounts have more than 100,000 followers and the largest has 40 million. Users follow at most 1,000 accounts and on average 4 accounts with more than 100,000 followers, at most 25. Fan-out workers add up to 200,000 feed entries per second in total, at most 100,000 per second for one post. A new post must appear in every follower's feed within 30 seconds. A feed page must load within 200 ms; one cache lookup takes about 2 ms, run in parallel. Design the feed.

**Solution:**

1. **Requirements.** (F1) Show posts from followed accounts, newest first, in pages. (F2) Users post. (N1) A post appears in every follower's feed within 30 seconds. (N2) A feed page loads within 200 ms. (N3) The system survives the loss of one cache node. Out of scope: ranking, comments.
2. **Estimates.** Peak 15,000 feed opens per second. Pushing every post: 5,000,000 × 300 = 1.5 billion writes a day, about 15,000 per second on average; at the peak of 300 posts per second, about 90,000 per second, under 200,000. One post by the 40-million account at 100,000 per second takes 400 seconds, far over 30. Pushing works only up to 30 × 100,000 = 3,000,000 followers. Cache: 500 IDs × 8 bytes × 50 million users = 200 GB.
3. **API.** `post(content)`; `getFeed(cursor)` returns up to 20 post IDs with their content, and the next cursor.
4. **Data model.** `posts(post_id, author_id, created_at, content)`; `follows(follower, followee)` with an index both ways; feed cache: per user, the latest 500 post IDs; large-account cache: per account above the threshold, its latest 500 post IDs.
5. **High-level design.** Post service → posts store and a fan-out queue → fan-out workers, which read the follower list and append the post ID to each follower's cached feed. Feed service → the user's cached feed plus the cached recent posts of each followed large account → merge by time → fetch post content in one batch.
6. **Deep dive.** _Threshold:_ choose T = 1,000,000 followers, below the 3,000,000 limit from N1, leaving room for several large posts at once: a post by an account at T takes at most 10 seconds. Accounts above T are pulled, so their posts are visible as soon as they are stored, which also meets N1. _Read cost:_ users follow at most 25 accounts above 100,000 followers, so at most 25 above T; a feed read is at most 26 parallel lookups, about 2 ms each, plus one batch fetch of content, well within 200 ms. _Merging:_ the service takes the newest 20 IDs across the cached feed and the large accounts' lists, drops duplicates and posts from unfollowed accounts, and returns a cursor holding the oldest ID shown. _Mode changes:_ an account switches to pull above 1,000,000 and back to push below 800,000.
7. **Failures.** If fan-out workers fall behind, posts wait in the queue and feeds are older, but reading still works; alert when the oldest queued post is 20 seconds old. If a cache node is lost, its replica takes over (N3); if both copies are lost, affected feeds are rebuilt by pulling from the posts store at the user's next open, slower but correct.
8. **Summary.** F1 and F2 by the post and feed services; N1 by pushing only below T = 1,000,000, at most 10 seconds per post; N2 by at most 26 parallel lookups and one batch fetch; N3 by cache replicas and rebuild by pulling.

**Answer:** Hybrid fan-out with a threshold of 1,000,000 followers, derived from the 30-second freshness target and 100,000 writes per second for one post, which allows at most 3,000,000. Below it, post IDs are pushed into per-user cached feeds; above it, followers pull the account's recent posts at read time. A feed read merges one cached feed with at most 25 large accounts, about 26 parallel lookups, within 200 ms.
