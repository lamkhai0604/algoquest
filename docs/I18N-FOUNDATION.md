# AlgoQuest i18n Foundation (EN/VI)

Status: implementation PR for review; do not merge or deploy without PO approval.

## Scope

This branch is rebased onto main including Pattern Recognition pilot PR #22. It introduces a lightweight, dependency-free locale store with `useSyncExternalStore`, persisted EN/VI selection, and English fallback. A language selector is available in the app header.

Translated UI includes header/footer, Pattern Recognition pilot controls and verdict labels, Learning Path headings and coming-soon/battle/test-access notices, profile navigation, and lesson Back/Next navigation.

The original lesson and challenge content returned by the backend stays in English in this phase. In particular, **do not change** `content/levels/`, `patterns.json`, problem statements, answer keys, code samples, hidden tests, XP or grading rules. Server-supplied AI feedback remains in its original language.

## Files

- `frontend/src/i18n/locales/en.json`: English source strings.
- `frontend/src/i18n/locales/vi.json`: Vietnamese translations with matching keys.
- `frontend/src/i18n/index.ts`: locale state, persistence, typed key lookup, hooks and fallback.
- `frontend/src/i18n/i18n.test.ts`: dictionary parity and locale tests.

## Usage

```tsx
import { useTranslation } from "../i18n";
const { t } = useTranslation();
return <h1>{t("home.title")}</h1>;
```

## Review checklist

- Verify EN remains the default and existing tests are unchanged in English.
- Toggle EN/VI and reload: choice should persist.
- Verify the document `lang` attribute updates.
- Verify UI controls are translated but API-provided lesson and pattern content remains English.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` in `frontend/`.
- Review the main/dev branch divergence before merging into dev.
- Later: translate Level 1 after backend content loader and schema audit.

## Coordination

Claude owns curriculum/lesson structure; i18n owns localization. Any overlap requires PO review. This PR must target `dev`, not `main`.
