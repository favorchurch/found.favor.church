---
name: publish
description: Standard versioning and deployment pipeline for Git projects. Use when implementation is complete, tests pass, and you need to stage changes, bump version (SemVer), commit, push, and optionally deploy.
---

# Publish to Git

Standard workflow for versioning and publishing updates to Git repositories.

## Workflow Sequence

Follow these steps in order:

1.  **Stage Changes**: `git add .`
2.  **Bump Version**: `pnpm version [patch|minor|major]`
    *   `patch`: Bugfixes or small optimizations (1.0.4 → 1.0.5)
    *   `minor`: New features or non-breaking API changes (1.0.5 → 1.1.0)
    *   `major`: Major API-breaking structural changes (1.1.0 → 2.0.0)
3.  **Commit**: `git commit -m "[type]: description"`
    *   Use conventional commit types: `feat`, `fix`, `docs`, `chore`, etc.
4.  **Push**: `git push`
5.  **Deploy** (if applicable)
    *   **Deno**: `deno task deploy-prod --no-wait`

## NodeJS Specifics

- **MANDATORY**: Always use `pnpm` instead of `npm` or `yarn`.

## Before Starting

- Ensure local branch is up to date: `git pull`.
- Ensure all tests pass.
- Verify you are on the correct branch (usually `main` or a feature branch).
- Avoid merge conflicts by resolving them locally before pushing.
