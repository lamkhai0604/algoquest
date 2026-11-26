# Storage, Search and IDs

## Learning objectives

This level has three short parts. Each part has its own walkthrough steps, one quick-check question and one challenge.

- **A. Object storage:** explain why large files go to object storage, with only their details in the database, and design an upload that goes straight from the user to storage.
- **B. Full-text search:** explain why `LIKE '%word%'` does not scale, and how an inverted index finds the documents that contain some words.
- **C. Unique IDs:** compare auto-increment numbers, random UUIDs and time-ordered IDs, and choose one for a system with many servers.

### Key terms

- **Object storage.** A service that keeps files, called **objects**, by key in **buckets**, such as `photos/9f3c.jpg`. It is cheap per gigabyte, keeps several copies, and is read and written whole, not edited in place.
- **Metadata.** The details about a file, such as owner, size, caption and storage key. It lives in the database; the bytes live in object storage.
- **Signed upload URL.** A link made by the app that lets one user upload one object to one key until it expires. The storage service checks the signature.
- **Multipart upload.** Sending a large file in parts that can be sent in parallel and retried one at a time, then joined into one object.
- **Inverted index.** For every word, the list of documents that contain it, such as `red → [3, 8, 15, 21]`. It is the index of a search engine.
- **Tokenizing.** Turning text into the words the index stores: splitting it, lowercasing it, and often reducing words to a common form.
- **Auto-increment ID.** A number the database counts up for each new row: 1, 2, 3.
- **UUID.** A 128-bit ID, usually written as 36 characters. A random UUID (version 4) can be made anywhere without asking anyone, with a tiny chance of a repeat.
- **Time-ordered ID.** An ID that starts with the time it was made, so IDs sort by creation time, such as a 64-bit ID made of time, machine number and a counter, or a UUID version 7, which follows the time with random bits instead of a machine number.

## Problem hook

A photo-sharing app is growing. Its servers pass every uploaded photo into the database, and the database is now mostly pictures: backups take all night. Searching captions with `LIKE '%sunset%'` takes ten seconds. And since the photos table was split into shards (SD 8), two shards have handed out the same photo number twice.

Three different problems, three standard tools: object storage for the bytes, an inverted index for search, and IDs that many servers can make without clashing.

## Intuition

**A.** A library keeps its books on shelves in a warehouse and a card for each book in the catalog. The catalog card says where the book is; nobody glues the books into the catalog. Object storage is the warehouse, and the database is the catalog.

**B.** The index at the back of a textbook lists each word with the pages it appears on. To find pages about "red shoes", you look up both words and take the pages that appear in both lists, instead of reading every page. That is an inverted index.

**C.** A deli gives out numbered tickets from one machine: simple, in order, but everyone must queue at that one machine. If each counter had its own machine, two people could get number 57. Writing the time, the counter number and a count on each ticket solves it: tickets never clash, and they still sort by time.

**Links.** Part A uses the database and the API from SD 4 and SD 5 and signed links from SD 13. Part B builds on the hash maps of Level 3 and database indexes from SD 4. Part C builds on SD 4 and the shards of SD 8.

## When to use

- **A. Object storage:** for photos, videos, documents, backups and logs, anything large and written whole. Keep the metadata in the database with the object's key.
- **A. Direct upload with a signed URL:** when files are large or many, so the app servers do not carry the bytes. Use multipart upload for files of more than about 100 MB.
- **B. An inverted index:** when users search by words inside text, such as product descriptions or messages, across more than a few thousand documents.
- **B. A plain database index:** when users look up exact values or prefixes, such as an email address or a name starting with "Ali" (SD 4); a search index is not needed for that.
- **C. Auto-increment:** one database, and nothing depends on hiding how many rows exist.
- **C. Random UUIDs:** IDs must be made in many places, such as on phones while offline, and sorting by creation time is not needed.
- **C. Time-ordered IDs:** IDs are made on many servers, and new rows should sort by time and land at the end of the index.

## Template code

There is no code in this level. Use this **design template** for each part:

```text
A. Files: bytes in object storage under a key; metadata in the database.
   Upload: app checks rights -> signed upload URL -> client sends bytes
   to storage -> app saves the metadata. Large files: multipart.
B. Search: tokenize text into words; inverted index word -> sorted list
   of document IDs; a query looks up each word and intersects the lists.
   Keep the index updated from the database within seconds.
C. IDs: who makes them (one database or many servers)? Must they sort by
   time? Must they hide counts? Then: auto-increment, random UUID, or
   time-ordered ID (time + machine + counter, or UUID version 7).
```

## Complexity

**A. Bytes through the app servers.** At 400 uploads per second of 3 MB, 400 × 3 MB = 1.2 GB per second would pass through the app servers if they relayed the photos; with signed upload URLs, they handle only a small request per upload. At 1 million photos a day, storage grows by 1,000,000 × 3 MB = 3 TB a day, while the metadata, about 500 bytes a photo, grows by only 500 MB a day.

**A. Retrying a large file.** A 2 GB video sent in one piece must start again from zero if the connection breaks near the end. Sent as 20 parts of 100 MB, a failure costs at most one 100 MB part.

**B. Scanning versus an index.** `LIKE '%red%'` cannot use a normal index, because the word can be anywhere in the text, so the database reads every description: with 10 million products of about 1 KB each, that is 10 GB per search. With an inverted index, "red shoes" reads two lists, say 200,000 and 50,000 product IDs. Both lists are sorted, so one pass walks them together in about 250,000 steps, a few milliseconds.

**C. How many IDs.** A 64-bit time-ordered ID with 41 bits of milliseconds lasts about 69 years from its start date; 10 bits number up to 1,024 machines; and 12 bits of counter allow 4,096 IDs per millisecond per machine, about 4.1 million per second. A random UUID has 122 random bits: even after a billion IDs, the chance that any two are equal is about 1 in 10¹⁹.

| ID kind | Made by | Sorts by time | Size | Watch out for |
| --- | --- | --- | --- | --- |
| Auto-increment | One database | Yes | 4 or 8 bytes | One counter for all writes; shows how many rows exist |
| Random UUID (v4) | Anyone, anywhere | No | 16 bytes | New rows land all over the index |
| Time-ordered ID | Each server | Yes | 8 or 16 bytes | Machine numbers must be unique; clocks must not jump back |

## Common mistakes

- **A. Storing files in the database.** It makes the database huge, slows backups and copies, and wastes its memory on bytes it never queries.
- **A. Saving metadata before the upload finishes.** The app then lists photos that do not exist. Save it after storage confirms the upload, or mark it "pending" until then.
- **B. Treating the search index as the source of truth.** It is a copy built from the database and may be a few seconds behind; rebuild it from the database if it is lost.
- **B. Indexing without tokenizing.** "Shoes", "shoes," and "SHOES" must become the same word, or searches miss most matches.
- **C. Auto-increment across shards.** Each shard counts on its own, so two shards make the same ID unless they are given separate ranges.
- **C. Public auto-increment IDs.** A competitor who sees order 1,000 today and 1,500 tomorrow knows your daily orders, and users can guess other IDs (SD 13 still checks rights).

## Edge cases

- **A. Abandoned uploads.** A user who gets an upload URL and never finishes leaves pending metadata or unfinished parts. Clean them up after a deadline, such as a day.
- **B. Very common words.** "The" appears in nearly every document; its list is as long as the collection. Search engines skip such words or treat them specially.
- **B. Typos and word forms.** "Shoe" and "shoes" should match; reducing words to a common form, or allowing small spelling differences, handles this at some cost.
- **C. Clock going backwards.** A time-ordered ID generator whose clock is set back could repeat IDs; it must wait until its clock passes the last time it used.

### Extension (optional): search ranking

Finding the matching documents is only half of search: the best ones must come first. A common idea scores each document by how often the query words appear in it, giving more weight to rare words: "suede" says more about a product than "shoes". Words in the title can count more than words in the description, and teams often add signals such as popularity or recency. Well-known scoring formulas that follow this idea are TF-IDF and BM25.

## Worked example

**Problem:** A photo app receives 1 million photos a day, up to 400 a second at peak, about 3 MB each. Its app servers can carry about 1 GB per second in total for everything. Users search 50 million captions by words. Photos are stored in 8 database shards, and each photo needs an ID that is unique across shards and lets the newest photos be listed first. Design the upload, the search and the IDs.

**Solution:**

1. **A. Where the bytes go.** Photos go to object storage under a key such as `photos/<photo id>.jpg`; the database keeps owner, caption, size and key, about 500 bytes. Storage grows 3 TB a day, the database only 500 MB.
2. **A. Upload.** Relaying 400 × 3 MB = 1.2 GB per second would exceed the servers' 1 GB per second. Instead the app checks the user's rights, saves the photo as "pending", and returns a signed upload URL valid for 10 minutes. The phone sends the bytes straight to storage. When storage confirms the upload, the app marks the photo "ready". Pending photos older than a day are cleaned up.
3. **B. Search.** Each caption is tokenized and added to an inverted index: word → sorted list of photo IDs. A search for "sunset beach" reads two lists and walks them together. When a caption changes, the database sends an event and the index is updated within seconds.
4. **C. IDs.** Auto-increment on 8 shards would repeat numbers. Random UUIDs would be unique but would not list the newest first. A time-ordered 64-bit ID (time in milliseconds, machine number, counter) is unique across servers, sorts by time and allows about 4.1 million IDs per second per machine, far above 400.

**Answer:** Bytes in object storage, uploaded directly with a signed URL (the app servers would otherwise carry 1.2 GB per second); metadata in the shards. Captions in an inverted index updated within seconds from the database. Time-ordered 64-bit IDs, made on each server, unique and sorted by time.
