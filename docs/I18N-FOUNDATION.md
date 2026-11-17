# AlgoQuest EN/VI Localization

This branch is based on current main and includes the Pattern Recognition pilot. It is reviewed through PR #23 into dev.

## Scope

- Locale selection EN/VI in the header, persisted in localStorage and reflected in document.lang.
- Typed dictionary keys, English default, Vietnamese UI strings, English fallback.
- Localized UI across navigation, authentication, Learning Path, profiles, levels, lessons, walkthroughs, quick checks, pattern challenges, problem solving, code challenges, level-up tests and admin screens.
- User data, problem statements, lesson markdown, server-provided explanations, grading feedback and source code remain in the original language.
- No modifications to content/levels, grading rules, XP calculations or protected branches.

## Validation

Run in frontend:

```sh
npm ci
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Also review GitHub's Playwright smoke workflow and preview deployment. The PR into dev must have all checks green. After merge into dev, create a separate PR dev -> main for product-owner review; never auto-merge to main.

## Manual bilingual QA

- Select VI; verify menus, header/footer, patterns, lessons, solving and test flows, code editor, admin and error states.
- Reload: language preference persists; switch back to EN and verify existing English terminology.
- Check that lesson markdown, problem content, patterns.json and AI-generated feedback remain English.
- Verify keyboard navigation, button labels and screen reader semantics.
