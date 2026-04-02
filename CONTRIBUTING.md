# Contributing Guide

This project follows a verification-first workflow aligned with the execution-playbook skill.

## Workflow

1. Create a feature branch from your integration branch (do not work directly on main).
2. Define a short plan before implementation for non-trivial changes.
3. Implement in small, reviewable commits.
4. Verify behavior before opening a pull request.
5. Open a PR with a clear summary, validation evidence, and risk notes.

## Branch and Commit Guidelines

- Branch naming examples:
  - `feature/farmer-profile-screen`
  - `fix/inventory-status-bug`
  - `chore/eslint-cleanup`
- Keep commits focused on one logical change.
- Prefer clear, imperative commit messages.

## Coding Standards

- Follow existing project style and ESLint rules.
- Keep components small and composable.
- Avoid quick fixes when a root-cause fix is feasible.
- Add concise comments only where logic is not self-evident.

## Verification Checklist

Run these before requesting review:

```bash
npm run lint
npm run build
```

If your change affects runtime behavior, also run:

```bash
npm run dev
```

Then validate relevant user flows manually.

## Testing Protocol

When applicable, cover these levels:

- Smoke Testing
- Functional Testing
- Integration Testing
- UI Testing
- Security Testing
- Stress Testing
- Load Testing

For frontend-only changes, at minimum provide smoke + functional checks and note why deeper levels are or are not applicable.

## Pull Request Template Expectations

Include these sections in your PR description:

- Summary: what changed and why
- Scope: affected modules or pages
- Validation: commands run and manual scenarios tested
- Risk: regressions to watch
- Follow-ups: deferred tasks or known limitations

## Reporting Issues

When filing a bug, include:

- Expected behavior
- Actual behavior
- Reproduction steps
- Environment details (OS, browser, Node version)
- Screenshots or logs when possible
