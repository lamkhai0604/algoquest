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
