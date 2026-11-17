# AlgoQuest i18n Foundation (EN/VI)

Status: foundation only; integration requires PO approval.

## Scope and ownership

Branch: `feat/i18n-foundation`. This work adds isolated translation dictionaries and a pure TypeScript lookup helper. It intentionally does **not** edit shared pages, lesson components, backend, existing curriculum, XP rules, or deployment configuration. Claude's v0.3 Hybrid work should avoid modifying `frontend/src/i18n/` until coordinated integration.

## Structure

- `frontend/src/i18n/locales/en.json` — canonical English UI strings.
- `frontend/src/i18n/locales/vi.json` — reviewed Vietnamese UI strings.
- `frontend/src/i18n/index.ts` — locale types, supported locales, fallback lookup.

## Example (future integration)

```tsx
import { translate } from "../i18n";
const locale = "vi"; // eventually sourced from language preference state
const label = translate(locale, "nav.profile");
```

## Content localization (future phase)

Keep English Markdown/JSON as canonical. Consider sibling `lesson.vi.md` and localized question/walkthrough files, but first audit backend content loader, schemas and validation. Keep IDs, correct answer indices, grading rubrics, code, hidden tests and XP rules unchanged. Do not ship Vietnamese content until verified for correctness and complete fallback.

## Integration acceptance criteria

1. User can switch EN/VI, selection persists, HTML language matches.
2. Missing translations fall back to English; no missing-key strings shown.
3. Existing game and grading behavior unchanged.
4. English and Vietnamese content use stable identifiers, never display text as IDs.
5. Translation parity and locale switching have automated tests.
6. English/Vietnamese reasoning receive equivalent rubric evaluation (requires separate AI grading tests).

## Next steps

Review dictionary terminology; after Claude's v0.3 lesson structure stabilizes, integrate language state and selector, then translate Level 1 as a pilot. No main merge or deploy without PO approval.
