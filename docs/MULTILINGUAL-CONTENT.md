# Multilingual Learning Content v1.0

## Goal

Provide localized learning content separately from translated application UI. English is the canonical source for correctness, grading, XP, and hidden tests. The first pilot covers Level 1 (Big-O & Algorithm Basics) in Vietnamese.

## File ownership and structure

The original English content files remain in `content/levels/<number>-<slug>/`. A localized lesson lives in:

```text
content/levels/1-big-o-and-basics/
  lesson.md
  walkthrough.json
  intuition.json
  quick-check.json
  problems/
  locales/
    vi/
      lesson.md
      walkthrough.json
      intuition.json
      quick-check.json
```

Do **not** duplicate the canonical problem JSON, answer keys, tests, hints, XP, or user progress in a translation folder. Problem statements and Pattern Recognition content will be localized in a later independent phase after an explicit review of their data model.

## Terminology (D-080)

Technical terms stay in English in every language, because learners meet them in documentation, logs and interviews. `content/glossary/vi.json` fixes one Vietnamese explanation per term. In a Vietnamese lesson, the first use of a term is followed by its explanation from the glossary in brackets; later uses keep only the English term. A translator who needs a new term, or a different explanation, adds or edits its entry in the same pull request, and the reviewer checks it.

## Translated walkthrough values (D-080)

A translated walkthrough keeps every visual variable with its English name, in the same order, because predictions hide variables by name. The variable values may be translated. Architecture component labels may also be translated (D-079). All other visual data, code, highlighted lines, answer indices and option order stay identical to English.

## Stable section IDs

Localized Markdown uses fixed section markers, independent of displayed text. Every translated lesson must include these level-two sections in order:

```text
## [objectives] ...
## [problem-hook] ...
## [intuition] ...
## [when-to-use] ...
## [template-code] ...
## [complexity] ...
## [common-mistakes] ...
## [edge-cases] ...
## [worked-example] ...
```

The UI removes markers when displaying headings, but uses their IDs to divide Understand and Learn and to locate the intuition question. Legacy untagged English headings remain supported without migrating existing content.

## API and fallback

`GET /api/v1/levels/{number}/lesson?lang=vi` serves localized lesson text if a valid translation is available. Omitted, unsupported, or untranslated locales use canonical English. The UI reloads the lesson when the header language selector changes.

Backend loads and validates translations at startup. Invalid or incomplete translation bundles prevent startup rather than silently returning mismatched answer indices. Quick-check scoring remains based on English canonical questions, not translated user-facing prose.

## Required translation guarantees

- Keep the same question and option order, correct-answer indices, and walkthrough step order.
- Keep code snippets, variable names, visual values, indices, marker positions and hidden variable IDs unchanged.
- Preserve Big-O notation and programming language identifiers.
- Translate instructions, explanations and learner-facing prose naturally.
- Never translate hidden test cases, grading key data, user progress or XP policy.
- Preserve the whole lesson structure; no omitting sections in localized content.

## QA checklist

- `cd frontend && npm ci && npm run lint && npm run format:check && npm run typecheck && npm test && npm run build`
- `cd backend && ./mvnw verify` with the configured PostgreSQL test environment
- Confirm `?lang=en`, `?lang=vi` and unknown locales return appropriate content.
- Confirm quick-check answers generate identical scores and XP in both languages.
- Verify all five lesson steps, navigation, intuition, walkthrough, quick check, and code tabs in EN/VI.
- Confirm the translation folder does not change any original content or grading logic.

This pilot is proposed for `dev` review; no automatic merge to `main`.

## Level 1 exercise translation pilot

- Nine ready Level 1 problems have optional learner-facing translations under `content/levels/1-big-o-and-basics/locales/vi/problems/<id>.json`: six practice problems and three level-up test problems. Coming-soon entries are intentionally unchanged.
- Allowed translation fields are strictly `id`, `title`, `statement`, `exampleExplanations`, `constraints`, and `hints`. The translation schema never contains the answer key, tests, code, status, difficulty, ID changes or XP.
- On startup, the loader checks translation IDs, example counts, hint counts, constraint counts, and protected numeric/comparison/quoted tokens. Each example input and output is always sourced from the canonical English problem.
- `GET /api/v1/levels/{number}/problems?lang=vi` returns localized titles, `GET /api/v1/problems/{id}?lang=vi` returns the exercise text, and hints only return opened localized strings through GET/POST with the same `lang` query. `GET /api/v1/tests/{id}?lang=vi` and related test endpoints localize the public problem fields without changing saved answers, scoring or test time.
- Missing/unsupported translations always use English. Backend scoring continues to use canonical English problem data. AI grading feedback is not localized in this phase.
- Check language switching during an active unsent explanation and active test. Ensure no extra hints are revealed, no saved progress is reset, and practice/test logic is unchanged.
