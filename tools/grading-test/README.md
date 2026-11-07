# AlgoQuest — AI Grading Accuracy Test (levels 1–3)

Checks whether a Gemini model (free tier) grades learners' explanations close to the expected scores before the grading feature is built (T-005, NFR-03).

## Contents

| File | Purpose |
| --- | --- |
| `problems.json` | 6 original problems (2 per level: Big-O & Basics, Arrays & Hashing, Two Pointers), each with an answer key |
| `samples.json` | 20 sample explanations with expected rubric scores |
| `prompt.mjs` | Grading prompt and rubric (to be reused by the backend grader) |
| `grade-test.mjs` | Sends each sample to Gemini and compares the result with the expected scores |

Rubric (total 100): pattern 0/20/40 · steps 0/15/30 · complexity 0/10/20 · edge cases 0/5/10.

The samples deliberately mix perfect answers, slower but valid approaches, subtle bugs, wrong complexity, pattern-only answers, an answer written in Vietnamese, and a prompt-injection attempt that must score 0.

## Running

Requires Node.js 18 or later; no dependencies to install.

1. Dry run without an API key:
   ```
   MOCK=1 node grade-test.mjs
   ```
2. Create a free Gemini API key in Google AI Studio (https://aistudio.google.com/apikey).
3. Real run:
   - macOS / Linux: `GEMINI_API_KEY=<key> node grade-test.mjs`
   - Windows PowerShell: `$env:GEMINI_API_KEY="<key>"; node grade-test.mjs`

The script waits 13 seconds between requests to stay within free-tier limits; a full run takes about 5 minutes.

### Options

| Variable | Default | Meaning |
| --- | --- | --- |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Model to use. Free tier (checked 2026-11-06): Flash-Lite about 500 requests/day and 10/minute; `gemini-3.8-flash` about 20 requests/day and 5/minute, so one full run uses its whole day. If a model is not found, pick a current free model listed in AI Studio |
| `DELAY_MS` | `13000` | Delay between requests (ms), below every free Flash model's per-minute limit |
| `ONLY` | all | Grade only some samples, e.g. `ONLY=S05,S12` |
| `RESUME` | off | `RESUME=1` keeps answers already graded in the last CSV for the same model and grades only the missing ones |
| `MAX_ATTEMPTS` | `6` | Attempts per answer when the model is busy (HTTP 429/503) or the network fails; waits grow from 20 s to 90 s |

## Reading the result

| Summary line | Target (NFR-03) |
| --- | --- |
| Average difference per answer | ≤ 8 points |
| Off by more than 10 points | at most 3 answers |
| Pass/fail (≥ 70) agrees with expected | at least 19/20 |

`Verdict: GOOD ENOUGH` means all three targets are met. Per-answer details (criterion scores and model feedback) are written to `results-<model>.csv` (git-ignored).

## If the model is busy

Free-tier models sometimes answer HTTP 503 ("high demand") or 429 (rate limit). The script retries with growing waits; answers that still fail are marked as errors. When the **daily** quota is used up it stops at once (the quota resets at midnight Pacific time). Run again later with `RESUME=1` to grade only the missing answers, or try another free model with `GEMINI_MODEL`.

## If the result is not good enough

1. Inspect the `OFF` answers in the CSV and identify the criterion that differs.
2. If an expected score is itself questionable, correct it in `samples.json`.
3. If the model misreads the rubric, adjust `prompt.mjs` or add detail to the answer key in `problems.json`.
4. Try another Flash model with `GEMINI_MODEL`. Paid models require approval (D-006).

## Notes

- Free-tier prompts may be used by Google to improve its products. Samples contain no personal data.
- Never commit API keys.
