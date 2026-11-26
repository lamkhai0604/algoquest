# Security for System Design

## Learning objectives

- Tell authentication from authorization, and check both on every request.
- Choose between server-side sessions and signed tokens, including how fast each can be withdrawn.
- Explain "sign in with another site" (OAuth) at the level of who sees what.
- Apply HTTPS everywhere, careful storage of passwords and secrets, and least privilege.
- Limit abuse such as password guessing with rate limits per account and per client.

### Key terms

- **Authentication.** Checking who someone is, such as by password, and giving them proof of it for later requests.
- **Authorization.** Checking what an authenticated user may do, such as "may Alice read order 124?". It must be checked on the server for every request.
- **Session.** A record on the server that says "this session ID belongs to Alice, until this time". The browser or app sends only the random session ID, usually in a cookie.
- **Token.** A small piece of data, such as "user Alice, valid until 10:15", **signed** by the server so that any server can check it without a lookup. An **access token** is short-lived; a **refresh token** lives longer and is used only to get a new access token.
- **OAuth.** A standard way to let one site act for a user at another, such as "sign in with Google", without the first site ever seeing the user's password. What it may do is limited by **scopes**, such as "read your email address".
- **HTTPS (TLS).** Encrypting traffic and proving the server's identity, so nobody on the network can read or change requests. "Everywhere" means between internal services too, not only from the user to the load balancer.
- **Password hash.** A one-way, deliberately slow function, run with a random **salt** per user, so that a stolen password table is slow to guess from.
- **Secret.** A password, key or token that a service uses, such as the database password. Secrets live in a secret store, not in code.
- **Least privilege.** Giving every user, service and key only the access it needs, so that a stolen key can do little harm.
- **Rate limit.** A cap on how often one account or client may do something, such as failed logins (SD 11).

## Problem hook

The shop's mobile app has a million users. One morning a customer posts a screenshot: by changing a number in the app's request, they saw another customer's order with name and address. The same week, the team finds the database password in an old commit on a public code site, and login logs show thousands of password guesses per minute against a few accounts.

None of these needed a clever attack. Each was a missing check or a missing limit in the design. Security for system design is mostly about putting those checks and limits in the right place.

## Intuition

Think of an office building. At the front desk, a guard checks your ID and gives you a visitor badge: that is **authentication**. Each door then decides whether your badge opens it: that is **authorization**. A building that checks badges only at the front desk lets any visitor into the server room.

The badge can be a number the guard looks up in a book each time (a **session**), or a card signed by the guard that any door can check by itself (a **token**). The signed card is faster, but if you are banned at noon, a card valid until 17:00 still opens doors until 17:00. A cleaner gets a key to the corridors, not to the safe (**least privilege**). And the door that lets anyone try a code locks for a while after five wrong tries (**rate limit**).

**A link to SD 2, SD 5 and SD 11.** The load balancer and servers are from SD 2, the API and its 401 and 403 answers from SD 5, and rate limits from SD 11.

## When to use

- **Authentication and authorization on every request:** always. A hidden button in the app is not a permission; the server must check that the user may do this, to this object.
- **Sessions:** when a user must lose access at once, such as on logout or when blocked, and a fast shared store is available for the lookup.
- **Short-lived access tokens with refresh tokens:** when many servers or services must check a user without a lookup each time, and a delay of a few minutes before a block takes effect is acceptable.
- **OAuth:** for "sign in with another site", or when one app must use another service for a user without holding the user's password.
- **HTTPS:** on every connection, including between internal services and to the database.
- **A secret store:** for every password, key and token a service uses, with each service able to read only its own.
- **Rate limits:** on logins, password resets, sign-ups and any expensive or abusable action, per account and per client.

## Template code

There is no code in this level. Use this **design template** for securing a feature:

```text
1. Who may call it? Authentication: how the caller proves who they are.
2. What may they do? Authorization on the server, for this action on this
   object, on every request: "does order 124 belong to Alice?"
3. Sessions or tokens? How fast must a block or logout take effect?
   Sessions: at once, one lookup per request. Tokens: after their lifetime.
4. Transport: HTTPS everywhere, inside the system too.
5. Stored secrets: passwords as slow salted hashes; service secrets in a
   secret store; least privilege for every service and key.
6. Abuse: rate limits per account and per client on logins and costly actions.
```

## Complexity

**A session costs one lookup per request.** At 5,000 requests per second, a session store that answers in about 1 ms and handles 100,000 lookups per second is 5% busy. Logout or a block takes effect at once, because the next lookup finds no session.

**A token costs no lookup, but cannot be called back.** A server checks the signature and the expiry time in microseconds. If Alice is blocked at 10:00 and her access token is valid until 10:15, she can keep using it until 10:15. A shorter lifetime means more refreshes: with 100,000 users active at once and 1-minute access tokens, that is about 100,000 ÷ 60 ≈ 1,700 refreshes per second, each checked against the server's record of refresh tokens.

**Slow password hashes.** A password hash tuned to about 100 ms of CPU costs a real login almost nothing that the user notices. At 50 logins per second it keeps 50 × 0.1 = 5 CPU cores busy. Someone who steals the table, though, can try only about 10 guesses per second per core, instead of millions with a fast hash, and the per-user salt means each account must be guessed separately.

**Rate limits on logins.** With 5 failed attempts allowed per account every 15 minutes, a guesser gets 5 × 96 = 480 tries a day against one account. A list of a million common passwords then takes over 2,000 days. A limit per network address alone does not do this: a guesser with 1,000 addresses gets 1,000 times as many tries.

| Choice | Check per request | Block takes effect | Cost |
| --- | --- | --- | --- |
| Session in a shared store | One lookup, about 1 ms | At once | The store must be fast and always up |
| Access token, 15 minutes | Signature only | Up to 15 minutes later | None per request |
| Access token, 1 minute, with refresh | Signature only; a refresh lookup each minute | Within 1 minute | Many refreshes |

## Common mistakes

- **Checking only that someone is logged in.** Any logged-in user can then read any order by changing its number. Check that this user may access this object.
- **Trusting the app.** Hiding a button does not stop a request; users can send any request they like. Every check that matters runs on the server.
- **Long-lived tokens with no way to withdraw them.** A stolen 30-day access token works for 30 days. Keep access tokens short and refresh tokens checkable on the server.
- **Secrets in code or config files.** Code is copied, shared and sometimes published. Keep secrets in a secret store and change any secret that has leaked.
- **One all-powerful database user.** If every service connects as an administrator, a flaw in a small reporting service can delete all orders.
- **Fast hashes for passwords.** A general-purpose hash is built to be fast, which helps a guesser. Use a slow password hash with a salt.

## Edge cases

- **A user's rights change.** If a user loses access to a project, a token that lists their projects stays wrong until it expires. Keep rights on the server and check them there, or keep tokens short.
- **Internal calls.** A request from inside the network is not automatically trusted. Services authenticate each other too, over HTTPS.
- **Error messages.** "No account with this email" tells a guesser which emails exist. Answer the same way for a wrong email and a wrong password.
- **Rate limits that lock real users out.** Locking an account for good after five failures lets anyone lock out anyone. Use a short wait that ends by itself and is not extended by refused attempts, and give real users another way in, such as a one-time link by email, while guessing continues.

### Extension (optional): signed URLs and multi-tenant isolation

A **signed URL** lets a user download a file straight from storage: the app checks the user's rights, then gives them a link that includes an expiry time and a signature, valid for, say, 10 minutes. The storage checks the signature, so the app servers do not carry the file, and an old link stops working on its own.

**Multi-tenant isolation** keeps customers of a business product, the **tenants**, apart when they share one system. One way is a `tenant_id` on every row and a filter on every query, enforced in one shared place so no query can forget it. A stronger way is a separate database per tenant, which costs more but makes mixing data much harder.

## Worked example

**Problem:** The shop's mobile app has about 1 million users, up to 100,000 active at once, and up to 5,000 API requests per second across 12 servers. A blocked user must lose access within 1 minute; users stay logged in for 30 days unless they log out. Logins peak at 50 per second. A shared in-memory store answers in about 1 ms and handles 100,000 lookups per second. Last week a customer saw another customer's order by changing its number. Design authentication, authorization and protection against password guessing.

**Solution:**

1. **Authorization first.** Every order request checks on the server that the order's `customer_id` is the logged-in user's. This one check fixes last week's problem; no choice of sessions or tokens would have.
2. **Sessions or tokens.** Sessions: 5,000 lookups per second is 5% of the store, and a block takes effect at once. Tokens valid for 15 minutes would let a blocked user continue for up to 15 minutes, too long. Tokens valid for 1 minute meet the rule but need about 100,000 ÷ 60 ≈ 1,700 refreshes per second. The team chooses sessions: simpler, and well within the store's capacity.
3. **30-day login.** The session lives 30 days, renewed while the user is active; logout deletes that phone's session, and blocking deletes all of the user's sessions.
4. **Passwords.** A slow salted hash tuned to about 100 ms: 50 logins per second × 0.1 s = 5 CPU cores at peak. A total cap on password checks, applied before hashing, stops guessing across many accounts from taking more cores.
5. **Guessing.** At most 5 failed logins per account every 15 minutes (480 a day), plus a limit per network address. Each wait ends by itself after 15 minutes, and refused attempts do not extend it, so nobody can lock a real user out for good.
6. **Transport and secrets.** HTTPS from the app to the load balancer and between all services; the database password is in the secret store, readable only by the services that need it, and each service's database user has only the rights it needs.

**Answer:** Fix authorization with an ownership check on every request. Use sessions in the shared store (5% of its capacity), deleted on logout or block, so blocks take effect at once. Hash passwords slowly (about 5 cores at peak), limit failed logins to 5 per account per 15 minutes, use HTTPS everywhere, and keep secrets in a secret store with least privilege.
