# Content Guide — AlgoQuest

How lessons and problems are written (D-020). Status: **Approved** — PO, 2026-11-06.

## 1. Rules for all content

- Written in plain English for a beginner; short sentences; one idea per paragraph.
- **Self-written.** Never copy LeetCode or any other site's problem text. Each problem may name a "similar LeetCode problem" for extra practice.
- Every problem is reviewed by the Product Owner before it is used in a test build.

## 2. Lesson template (one per level, Markdown + JSON)

| # | Part | What it contains |
| --- | --- | --- |
| 1 | Problem hook | A starter problem and why the naive (brute-force) way is slow |
| 2 | Intuition | An everyday comparison (e.g. a sliding window as a frame sliding along a row of numbers) |
| 3 | When to use | Signals in a problem statement that point to this pattern |
| 4 | How it works | Step-by-step walkthrough with Next/Back controls |
| 5 | Template code | Skeleton in JavaScript and Java |
| 6 | Complexity | Time and space, with the reason |
| 7 | Common mistakes | Off-by-one, empty input, forgetting duplicates, ... |
| 8 | Worked example | One problem solved: the spoken explanation, then the code |
| 9 | Quick check | 2–3 multiple-choice questions with explanations |

Files: `content/levels/<n>-<slug>/lesson.md` (parts 1–3, 5–8 as Markdown) plus `walkthrough.json` (part 4 steps) and `quick-check.json` (part 9). The frontend renders them; no MDX build step (D-033).

## 3. Problem file (JSON, `content/levels/<n>-<slug>/problems/<id>.json`)

```json
{
  "id": "L2-duplicate-badge",
  "level": 2,
  "difficulty": "Easy",
  "use": "practice",
  "status": "ready",
  "title": "Duplicate Badge",
  "statement": "A door scanner logs badge IDs ...",
  "examples": [{ "input": "[4, 7, 1, 7]", "output": "true" }],
  "constraints": ["0 <= length <= 10^5"],
  "answerKey": {
    "pattern": "Hash set to remember IDs already seen",
    "keyPoints": ["...", "..."],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(n)",
    "edgeCases": ["Empty array returns false"],
    "acceptableSlowerApproaches": ["Nested loops: O(n^2)"]
  },
  "hints": ["What does comparing every pair cost?", "Which structure answers 'seen before?' in O(1)?", "Create an empty set before the loop."],
  "tests": [{ "input": [[4, 7, 1, 7]], "expected": true }],
  "starterCode": { "javascript": "function hasDuplicate(ids) {\n}", "java": "class Solution {\n  boolean hasDuplicate(int[] ids) {\n  }\n}" },
  "similarLeetCode": "Contains Duplicate"
}
```

- `use`: `practice`, `test`, or `hardTest`. Test problems never appear in lessons or practice.
- `status`: `ready` or `comingSoon` (placeholder: only `id`, `level`, `difficulty`, `use`, `title`).
- `answerKey`, `tests`, and solutions stay on the server (NFR-02).
- At least 8 hidden tests per problem, including every listed edge case.
- The backend validates every file at startup and in CI; invalid content fails the build (D-033).
- Test `expected` values are never sent to the browser; for JavaScript the browser only receives `input` (D-035).

## 4. Grading rubric (FR-05)

| Criterion | Values | Meaning |
| --- | --- | --- |
| Pattern | 0 / 20 / 40 | 40 optimal approach shown; 20 slower working approach or pattern only named; 0 wrong or missing |
| Steps | 0 / 15 / 30 | 30 complete and correct; 15 a key step missing or a bug; 0 missing or wrong |
| Complexity | 0 / 10 / 20 | 10 for correct time, 10 for correct space, for the approach chosen |
| Edge cases | 0 / 5 / 10 | 10 named and handled; 5 named vaguely; 0 none |

The grading prompt lives in `tools/grading-test/prompt.mjs` until it moves into the app.

## 5. Amount of content per level

About 3 Easy, 3 Medium, 2 Hard practice problems (levels 1–2 may skip Hard), 3 `test` problems, and 5 `hardTest` problems.

**This release (D-024):** only Easy and Medium practice problems and the 3 `test` problems per level are written. Hard and `hardTest` problems are listed as placeholders (`"status": "comingSoon"`, title only). The levels 1–3 test build therefore needs 3 lessons and about 27 problems (6 practice + 3 test per level).
