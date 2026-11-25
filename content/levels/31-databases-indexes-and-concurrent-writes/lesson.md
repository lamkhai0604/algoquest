# Databases, Indexes and Concurrent Writes

## Learning objectives

- Explain how a relational database and a document store keep data, and choose one from how the data is read.
- Explain why a lookup by primary key or by an indexed column is fast, and why a query on an unindexed column reads every row.
- Estimate the cost of an index on writes and storage.
- Explain a transaction and the four ACID properties in plain words.
- Show how two users can both buy the last seat, and fix it with a conditional update or a unique constraint.
- Tell locking first (pessimistic) from checking a version when writing (optimistic), and say when each fits.

### Key terms

- **Table, row and column.** A relational database keeps data in tables. Each row is one record, such as one user; each column is one field, such as `email`. The **schema** lists the columns and their types.
- **Relational database (SQL database).** A database of tables that can be joined by matching values, queried with the language SQL. PostgreSQL and MySQL are examples.
- **Document store.** A database that keeps each record as one document, usually JSON, with nested fields kept together. MongoDB is an example. It is one kind of **NoSQL** database, a name for databases that are not relational.
- **Primary key.** A column (or a few columns) whose value is unique and never empty for every row, such as `id`. The database builds an index on it automatically.
- **Index.** An extra structure that maps a column's values to the rows that hold them, so the database can find rows without reading the whole table, like the index at the back of a book.
- **B-tree.** The usual shape of an index: a balanced, sorted tree whose nodes each hold hundreds of keys. It is a wide version of the binary search trees of Level 8.
- **Full table scan.** Reading every row of a table to answer a query, because no index helps.
- **Transaction.** A group of reads and writes that the database treats as one unit: either all of its changes are saved, or none are.
- **ACID.** Four promises a transaction makes: **atomicity** (all or nothing), **consistency** (the database's rules, such as unique keys, still hold afterwards), **isolation** (transactions running at the same time do not see each other's unfinished changes), **durability** (once saved, the change survives a crash).
- **Race condition.** A bug where the result depends on which of two things running at the same time happens first.
- **Conditional update.** An update that changes a row only if a condition still holds at the moment of writing, such as `WHERE seats_left > 0`.
- **Unique constraint.** A rule that rejects a second row with the same value in a column, such as the same seat number for the same flight.
- **Lock.** A mark that stops other transactions from changing a row until the holder finishes.
- **Pessimistic and optimistic concurrency.** Pessimistic: lock the row first, inside a transaction, so others wait until it commits. Optimistic: do not lock; when writing, check that the row has not changed since it was read (for example by a **version** number) and change the version in the same write, then read again and retry if 0 rows changed.

## Problem hook

An events website keeps 10 million users. When someone logs in, the server looks up the user by email. With no help, the database reads all 10 million rows to find one email, and a login takes about a second. On a busy evening, a few hundred logins per second keep the database fully busy.

On the same evening, a concert has one seat left, and two people press Buy at the same moment. Both see "1 seat left", both pay, and the venue now has two tickets for one seat. A database can fix both problems, but only if the design asks it to.

## Intuition

Think of a library with a million books. To find the book with a given title, you could walk every shelf: that is a full table scan. Or you could use the catalog: drawers sorted by title, where each label narrows the search until you reach the right card, which says which shelf to go to. That catalog is an index. It saves a huge amount of walking, but every new book now means a new card too.

Now imagine two librarians who each see one copy of a book on the shelf and each promise it to a different reader. Each did the right thing alone; together they broke a rule. A transaction with a condition is like the librarian taking the book off the shelf while checking it out: if it is already gone, the second checkout fails.

**A link to Level 8.** An index is a search tree like those of Level 8, but each node is so wide that a lookup needs only a few steps.

## When to use

- **Relational database:** data with clear relationships and rules that must always hold, such as orders, payments, seats and inventory, and queries that combine tables.
- **Document store:** each record is read and written as one whole, fields vary between records, and data is rarely combined across records, such as product catalogs or user profiles.
- **An index:** a query filters or sorts by a column often, and the table is large. Not every column: each index slows writes.
- **A transaction:** several changes must happen together or not at all, such as moving money between two accounts.
- **A conditional update or a unique constraint:** several users can change the same thing at once, such as the last seat or a username.

## Template code

There is no code in this level. Use this **design template** when you add a table:

```text
For each table:
  1. What is one row? What is the primary key?
  2. Which queries read it most? Which columns do they filter or sort by?
     -> add an index for each frequent filter on a large table.
  3. How often is it written? Each index adds work to every write.
  4. Which rules must always hold (unique email, seats_left >= 0)?
     -> put them in the database: unique constraints, conditional updates.
  5. Can two users change the same row at the same time?
     -> conditional update, lock first (pessimistic), or version check (optimistic).

Claim the last seat safely:
  UPDATE concerts SET seats_left = seats_left - 1
  WHERE id = 42 AND seats_left > 0;
  -> 1 row updated: the seat is yours.
  -> 0 rows updated: someone else got it first.
```

## Complexity

**Cost and limits** of the building blocks in this level (approximate, for one table of about 10 million rows on a single PostgreSQL or MySQL server):

| Operation | About | Why |
| --- | --- | --- |
| Lookup by primary key or indexed column, data in memory | 0.1–1 ms | A few steps down the B-tree |
| Same lookup, data read from an SSD | 1–5 ms | Each step may wait for the disk |
| Full table scan, data in memory | 100–500 ms | Every row is checked |
| Full table scan, data read from an SSD | 1–5 s | Gigabytes are read from disk |

**Why only a few steps.** A binary search tree with 10 million keys needs about log₂(10,000,000) ≈ 23 steps. A B-tree node holds hundreds of keys, so each step chooses among hundreds of branches instead of two. With about 300 keys per node:

1. One level reaches 300 entries.
2. Two levels reach 300 × 300 = 90,000.
3. Three levels reach 300 × 300 × 300 = 27,000,000, more than 10 million.

So a lookup reads about 3 or 4 pages, which is why it is fast even on disk.

**The cost of an index.** Indexes are not free on writes. In this lesson's simplified model, inserting a row writes the row plus one entry in each index, so a table with five indexes does about six pieces of logical work for each new row. Deletes and updates of indexed columns also change the indexes; the exact work depends on the database. An index also takes storage, often a sizable part of the table's own size.

## Common mistakes

- **No index on a column used to look things up.** A login by email without an index is a full table scan on every login.
- **An index on every column.** Writes slow down and storage grows, for queries that may never run.
- **Checking, then writing, in two separate steps.** "Read seats_left, see 1, then write 0" lets a second buyer read 1 in between. Put the condition in the write itself.
- **Choosing NoSQL because it sounds faster.** The right choice depends on how the data is read and which rules must hold, not on the name.
- **Rules kept only in application code.** If two servers check "is this username free?" at the same time, both can say yes. A unique constraint in the database cannot be bypassed this way.

## Edge cases

- **The conditional update changes 0 rows.** That is not an error in the database: it means the condition no longer held. The application must tell the user the seat is gone.
- **A unique constraint rejects a write.** The database returns an error for the second insert; the application should turn it into a clear message, such as "this username is taken".
- **A locked row.** With pessimistic locking, the second transaction waits. If the first one is slow or never finishes, the second can time out; locks must be held for a short time.
- **An optimistic version check fails often.** When many users change the same row, many retries waste work; locking first may then be better.
- **A query that cannot use the index.** An index on `email` does not help a search for emails that end with `@gmail.com`, because the index is sorted from the first letter.

### Extension (optional): isolation levels

Databases offer several **isolation levels**, which say how much transactions running at the same time can see of each other. Weaker levels are faster but allow anomalies, such as a **lost update** (two transactions read the same value and the second write silently replaces the first). Stronger levels, up to **serializable**, make transactions behave as if they ran one after another, at the cost of more waiting or more retries. PostgreSQL's default level, read committed, already makes the conditional update above safe, because the second update re-checks its condition on the latest committed row.

## Worked example

**Problem:** A concert ticket site sells numbered seats. A table `seats(concert_id, seat_number, buyer_id)` has one row per sold seat. At ticket release, about 2,000 purchase attempts per second arrive, many of them for the same popular seats, and the page also shows "seats left" for each concert. Design the tables and indexes so that no seat is ever sold twice, and checking a concert's sold seats is fast.

**Solution:**

1. **The rule to protect.** One seat of one concert can have at most one buyer. Put it in the database: a unique constraint on `(concert_id, seat_number)`.
2. **Buying a seat.** Insert the row. If another buyer inserted the same seat first, the constraint rejects this insert, and the application answers "seat taken". No check-then-write gap exists, because the check and the write are one step inside the database.
3. **Reading the sold seats.** The page asks for all rows with one `concert_id`. The unique constraint creates an index on `(concert_id, seat_number)`, which also serves this query, because the index is sorted by `concert_id` first. No extra index is needed.
4. **Cost of that index on writes.** Each purchase adds one table row and one index entry: two pieces of work instead of one. Whether one server keeps up with 2,000 attempts per second is not settled by the rough figure that a server handles thousands of simple writes per second, because that figure is too close to 2,000. A load test must confirm it with the real pattern: many buyers for the same concert, rejected duplicate inserts, and the chosen durability settings.
5. **Counting seats left.** Seats left = seats in the hall − sold rows for the concert. For a hall of 1,500 seats this counts at most 1,500 rows through the index, fast enough for one request, and the result can be cached for a few seconds (SD 3) because the page only shows an estimate. The purchase itself never relies on the cached count.

**Answer:** A unique constraint on `(concert_id, seat_number)` makes double booking impossible and gives the index the page needs. Purchases are plain inserts that either succeed or are rejected; the displayed count may be a few seconds old, but the database decides every sale.
