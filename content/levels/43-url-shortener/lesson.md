# URL Shortener

## Learning objectives

- Apply the full design routine from Level 42 to a URL shortener, from requirements to a summary.
- Estimate link creations, redirects, storage and the length of a short code from the requirements.
- Choose how short codes are made, and detect collisions so two links never share a code.
- Choose a redirect status code, and explain what 301 and 302 mean for browser and CDN caching, analytics and changing a link.
- Keep redirects fast with a cache for popular links, and state what fails and when.

### Key terms

- **Short code.** The part of a short link that identifies it, such as `aZ3kQ9x` in `sho.rt/aZ3kQ9x`.
- **Base62.** Writing a number with 62 symbols: `0`–`9`, `a`–`z` and `A`–`Z`. Seven base62 characters give 62⁷ ≈ 3.5 trillion codes.
- **Collision.** Two different long links getting the same short code. It must never reach users: one of them would open the other's page.
- **Redirect.** An HTTP answer that sends the browser to another address. The **Location** header holds the long link.
- **301 Moved Permanently.** A redirect that browsers and shared caches may keep and reuse without asking the server again, unless told otherwise.
- **302 Found.** A temporary redirect: browsers ask the server again next time unless the response says how long to keep it. **307** and **308** are the versions that also keep the request method.
- **Cache-Control.** The response header that says who may keep a response and for how long: `max-age=3600` lets any cache keep it for one hour, and `s-maxage` sets the time for shared caches such as a CDN only.
- **Hot link.** A short link that gets a large share of all clicks, such as one in a viral post.

## Problem hook

A marketing team shares links in posts, emails and printed flyers. Long addresses with tracking parameters break in messages and look bad on paper, so they want short links that never change, open instantly anywhere in the world, and show how many people clicked.

The design looks small: store a code and a long link, then redirect. The hard parts are in the details. A code that is too short runs out; two links that get the same code send people to the wrong page; and the wrong redirect code makes clicks invisible to the team, or makes a link impossible to fix after it is printed.

## Intuition

Think of a coat check. You hand over a long coat and get a small numbered ticket. The number must be unique: two guests with ticket 57 would fight over one coat. The cloakroom can hand out tickets from one roll in order, or pick random numbers and check the board before giving one out.

A redirect code is like telling a friend where the coat is. "It has moved for good to room 4" (301) means they will go straight to room 4 next time without asking you, even if you move it again. "It is in room 4 for now" (302) means they ask you each time, so you can move it, and you know how often they come.

**A link to earlier levels.** This case study uses caching and CDNs from SD 3, databases and unique constraints from SD 4, and IDs from SD 14, part C, all inside the routine of SD 15.

## When to use

- **Random codes with a collision check:** when codes should not be guessable or reveal how many links exist; the database's unique constraint catches a repeat, and the server tries another code.
- **Codes from a counter or an ID generator (SD 14):** when no collision checks are wanted and guessable, growing codes are acceptable, or when the number is shuffled before it is written in base62.
- **A hash of the long link:** when the same long link should always get the same code; a shortened hash can still collide, so the check is still needed.
- **302 (or 307) with a short Cache-Control time:** when the team wants click counts or may change a link's destination later.
- **301 with a long cache time:** when a link will never change and the fewest requests matter more than counting clicks.
- **A cache for popular links:** almost always: a small share of links gets most of the clicks.

## Template code

There is no code in this level. Apply the **routine** with these questions for a shortener:

```text
1. Requirements: create, redirect, custom names, expiry, click counts?
   Links per month, clicks per link, how long links are kept.
2. Estimates: creations and redirects per second, storage over the
   retention time, code length so codes never run out.
3. API: POST /links {longUrl} -> {code}; GET /{code} -> redirect.
4. Data model: links(code primary key, long_url, owner, created_at,
   expires_at); the primary key rejects a repeated code.
5. High-level design: CDN and cache in front of the redirect path.
6. Deep dive: how codes are made and collisions caught; which redirect
   code, with which Cache-Control.
7. Failures: database down, cache lost, a hot link.
8. Summary: each requirement and how it is met.
```

## Complexity

**Traffic.** 100 million new links a month is about 100,000,000 ÷ 2,600,000 seconds ≈ 40 creations per second. If each link is opened 100 times on average, that is 10 billion redirects a month, about 3,900 per second, and perhaps 20,000 per second at peak.

**Storage.** Keeping links for 5 years: 100 million × 12 × 5 = 6 billion links. At about 500 bytes each, that is 3 TB, which fits a sharded database (SD 8).

**Code length.** Six base62 characters give 62⁶ ≈ 57 billion codes, seven give 62⁷ ≈ 3.5 trillion. With 6 billion links, seven characters use under 0.2% of the space.

**Collisions with random codes.** When 6 billion of 3.5 trillion codes are taken, a new random code repeats an old one with chance 6 ÷ 3,500 ≈ 0.17%, about 1 in 580. Over all 6 billion creations, that adds up to millions of repeats, so they cannot be ignored: inserting the new code under a unique primary key fails on a repeat, and the server tries a new code. Almost every creation succeeds on the first try.

**Redirect cost.** A redirect is a lookup by primary key. With a cache in front of the database holding the most-clicked links, most of the 20,000 redirects per second never reach the database.

| Code choice | Collisions | Guessable | Same long link, same code |
| --- | --- | --- | --- |
| Random 7 characters | Rare; caught by the unique key and retried | No | No |
| Counter or ID in base62 | None | Yes, unless the number is shuffled | No |
| Hash of the long link, first 7 characters | Rare; caught and resolved, such as by adding a salt and hashing again | No | Yes |

| Redirect | Browser keeps it | Clicks seen by the server | Destination can change |
| --- | --- | --- | --- |
| 301 with a long max-age | Yes, for the max-age | Only the first one per browser | Not for browsers that kept it |
| 302 with `max-age=0` or `no-store` | No | Every click | Yes, at once |
| 302 with `max-age=0, s-maxage=60` | No; the CDN keeps it 60 s | Server clicks plus the CDN's logs | Yes, within 60 s at the CDN |

## Common mistakes

- **Skipping the collision check.** At millions of links, a "very unlikely" repeat happens many times; without a unique key, one link silently replaces another.
- **Checking first, inserting later.** "Is this code free?" followed by a separate insert lets two servers take the same code between the steps. Let the unique key reject the second insert.
- **Using 301 when the team needs click counts.** Browsers keep a 301, so returning visitors never reach the server again.
- **Too short a code.** Six characters may look enough today but run out, or collide often, as links pile up over years.
- **A counter that leaks.** Codes 1, 2, 3 let anyone list every link, including private ones.

## Edge cases

- **Custom names.** "sho.rt/summer-sale" must not clash with generated codes; keep them in the same table, so the unique key covers both, or use a different shape for generated codes.
- **Expired or deleted links.** The redirect path must not keep serving them from a cache; give cached entries a time limit no longer than what the requirement allows, and answer 404 or 410 when a link is gone.
- **Harmful destinations.** A shortener can hide where a link goes; check long links against a list of known harmful sites when they are created.
- **The same long link many times.** Random codes give each request a new code, which is fine for separate campaigns; if one code per long link is required, look up the long link first, with an index on it.

### Extension (optional): counting clicks without slowing redirects

Writing to the database on every redirect would add work to the fastest path. Instead, the server sends a small "clicked" event to a queue (SD 7) and answers the redirect at once; a consumer adds counts per link in batches. If the CDN answers some redirects itself, its logs are read in batches too. Counts are then a few seconds or minutes behind, which is usually fine for a marketing dashboard.

## Worked example

**Problem:** Design a URL shortener for a marketing team. They create about 100 million links a month, each opened about 100 times on average, with peaks of 20,000 redirects per second. Links are kept for 5 years. The team wants click counts within a few minutes and the ability to change a link's destination within 5 minutes. A redirect should take under 50 ms inside the system.

**Solution:**

1. **Requirements.** (F1) Create a short link for a long link. (F2) Redirect. (F3) Change a destination, taking effect within 5 minutes. (F4) Count clicks, within a few minutes. (N1) 40 creations and up to 20,000 redirects per second. (N2) Redirect within 50 ms inside the system. (N3) No two links ever share a code. Out of scope: custom names, harmful-link checks.
2. **Estimates.** 6 billion links over 5 years × 500 bytes = 3 TB. Seven base62 characters give 3.5 trillion codes, so they will not run out. Redirect lookups are by key.
3. **API.** `POST /links {longUrl}` → `{code}`; `PATCH /links/{code} {longUrl}`; `GET /{code}` → 302 with `Location`.
4. **Data model.** `links(code primary key, long_url, owner, created_at)`; a separate click count per link and day.
5. **High-level design.** Users → CDN → load balancer → app servers → link cache → sharded database. Creations go to the database; redirects read the cache first.
6. **Deep dive: codes and redirects.** The server picks 7 random base62 characters and inserts the row; the unique primary key rejects a repeat (about 1 in 580 near the end), and the server tries a new code. Redirects answer 302, because the team needs click counts and changes: a 301 would be kept by browsers, hiding clicks and old destinations. The response says `Cache-Control: max-age=0, s-maxage=60`: browsers ask again every time, while the CDN may keep the redirect for 60 seconds. The app's link cache entries expire within 4 minutes, so a change takes effect within 5 minutes. Each redirect that reaches the servers sends a click event to a queue, and redirects the CDN answers are counted from its logs, both in batches.
7. **Failures.** If the database's main copy fails, redirects continue from the cache and from a read replica (SD 6), while creations wait until failover. If the cache is lost, the database's replicas take the redirect load until the cache refills. A hot link is served mostly by the CDN.
8. **Summary.** F1 by random codes; N3 by the unique key; F2 and N2 by cached key lookups; F3 by 302 with short cache times; F4 by click events counted in batches.

**Answer:** Seven-character random base62 codes, inserted under a unique primary key that rejects the rare repeat, with a retry. Redirects use 302 with short shared-cache times, so clicks are counted and destinations can change within 5 minutes. A CDN and a link cache keep redirects fast, and the database is sharded for 3 TB over 5 years.
