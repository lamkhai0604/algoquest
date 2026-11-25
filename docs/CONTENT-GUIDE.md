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

Files: `content/levels/<n>-<slug>/lesson.md` (parts 1–3, 5–8 as Markdown) plus `walkthrough.json` (part 4 steps), `quick-check.json` (part 9), and `intuition.json` (one ungraded question shown after the Intuition section: `question`, `options`, `answer` index, `explanation`). Lesson Markdown may use pipe tables with a header row. A walkthrough step that exchanges two items sets `visual.swap` to their two indices. A linked-list walkthrough sets `visual.next`: one entry per cell, the index of the node that cell points to, or -1 for `null`; a prediction may hide the pointers with `"hides": ["next"]`. A binary-tree walkthrough sets `visual.tree: true`: cells are tree positions, the children of cell i are cells 2i + 1 and 2i + 2, `""` is no node, at most 31 cells (D-059). A system design walkthrough sets `visual.cells: []` and `visual.arch`: `nodes` (each with `kind` client, dns, cdn, lb, server, cache, db or queue, a `label` of at most 16 characters, a floor place `x` 0–10 and `y` 0–8, and an optional `state` hot or down), `links` as pairs of node indexes, a `path` of node indexes along links, and `drop: true` when the request is lost at the end of the path (D-079). System Design levels are named `SD n` in learner-facing text (Level 28 is `SD 1`, D-081); algorithm levels are named `Level n`. In a step with a prediction, the step title, the visible variables and the drawing must not give the answer away: give the step a neutral title and list in `hides` every variable that names the answer; the architecture diagram hides its path until the learner answers. The frontend renders them; no MDX build step (D-033).

## 3. Problem file (JSON, `content/levels/<n>-<slug>/problems/<id>.json`)

```json
{
  "id": "L2-duplicate-badge",
  "level": 2,
  "difficulty": "Easy",
  "use": "practice",
  "status": "ready",
  "order": 1,
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
- `order` (practice problems): position within the difficulty, starting at 1. Problems open in this order, one after another (D-042), so the first problem of each difficulty should be the gentlest.
- `answerKey`, `tests`, and solutions stay on the server (NFR-02).
- At least 8 hidden tests per problem, including every listed edge case.
- The backend validates every file at startup and in CI; invalid content fails the build (D-033).
- Test `expected` values are never sent to the browser; for JavaScript the browser only receives `input` (D-035).

**Linked-list problems (D-058).** Declare list parameters and results as `ListNode` in the Java starter code; the JavaScript starter takes and returns nodes `{ val, next }`. Tests write each list as an array of values (`[1, 2, 3]`, `[]` for an empty list). Binary trees (D-059) use `TreeNode` in the Java starter and `{ val, left, right }` in JavaScript; tests write a tree in level order with `null` for a missing child and no trailing `null`s (`[3, 9, 20, null, null, 15, 7]`).

## 4. Pattern challenges (optional, `content/levels/<n>-<slug>/patterns.json`, D-057)

A JSON array of challenges. The learner picks an approach and explains why; the label below decides whether the choice is correct, and the AI grades only the written reason.

| Field | Rule |
| --- | --- |
| `id` | `P<level>-<name>`, lowercase words joined by hyphens, unique across the content |
| `level` | The level of the folder |
| `title`, `statement` | Plain text; an everyday scenario, not a copy of a known problem (D-052) |
| `examples`, `constraints` | At least one string each |
| `approaches` | 3–4 items, exactly one `best` |
| `approaches[].id`, `name`, `hint` | Short; the hint is shown before answering and must not give the label away |
| `approaches[].label` | `best`, `valid` (works but slower or uses more memory), or `unsuitable` (wrong or does not fit) |
| `approaches[].time`, `space`, `why` | Shown in the comparison after answering |

Write 2–3 challenges per level. The backend validates the file with the rest of the content.

## 5. Grading rubric (FR-05)

| Criterion | Values | Meaning |
| --- | --- | --- |
| Pattern | 0 / 20 / 40 | 40 optimal approach shown; 20 slower working approach or pattern only named; 0 wrong or missing |
| Steps | 0 / 15 / 30 | 30 complete and correct; 15 a key step missing or a bug; 0 missing or wrong |
| Complexity | 0 / 10 / 20 | 10 for correct time, 10 for correct space, for the approach chosen |
| Edge cases | 0 / 5 / 10 | 10 named and handled; 5 named vaguely; 0 none |

The grading prompt lives in `tools/grading-test/prompt.mjs` until it moves into the app.

## 6. Amount of content per level

About 3 Easy, 3 Medium, 2 Hard practice problems (levels 1–2 may skip Hard), 3 `test` problems, and 5 `hardTest` problems.

**This release (D-024):** only Easy and Medium practice problems and the 3 `test` problems per level are written. Hard and `hardTest` problems are listed as placeholders (`"status": "comingSoon"`, title only). The levels 1–3 test build therefore needs 3 lessons and about 27 problems (6 practice + 3 test per level).
