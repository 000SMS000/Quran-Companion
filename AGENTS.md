# Agent Instructions — Quran Companion

These instructions apply to AI coding agents working in this repository.

## Start-of-task protocol

1. Read `docs/ai-context/PROJECT_CONTEXT.md`.
2. Read `docs/ai-context/CURRENT_STATUS.md`.
3. Read `docs/ai-context/DECISIONS.md`.
4. Read `docs/ai-context/NEXT_SESSION.md` when resuming prior work.
5. Inspect the actual repository, Git status, relevant source files, and current configuration before making assumptions. Context files are a handoff aid, not proof that the code still matches them.

## Safety and data preservation

- **Never destroy or reset the existing `quran_companion` database or bookmark data.**
- Do not run `migrate:fresh`, `db:wipe`, destructive SQL, table drops, truncation, or database recreation unless the user explicitly authorizes that exact destructive action after being informed of the impact.
- Do not overwrite `.env`, credentials, API keys, tokens, certificates, or other secrets.
- Never copy secrets from `.env` into documentation, chat summaries, commits, or generated context files.
- Before a migration or data-changing operation, inspect its effects and explain the risk.
- Prefer reversible, minimal changes. Preserve unrelated user modifications; inspect `git status` before editing.

## Architecture constraints

- The intended bookmark experience is guest bookmarking through cookie-based ownership, without requiring user registration.
- Do not replace cookie-based bookmark ownership with localStorage identity or a full authentication system without discussing the design and receiving user approval.
- Bookmark records identify an ayah by surah and ayah numbers; verify the live schema before changing it.
- Avoid unnecessary dependencies and unrelated refactors.
- Do not claim a feature or test is complete unless it has been verified in the current checkout.

## Implementation workflow

1. Explain the plan and reason for significant changes before implementation.
2. Inspect relevant files and follow existing project conventions.
3. Make the smallest coherent change that addresses the task.
4. Run focused tests first, then broader relevant tests where practical.
5. Report commands run, actual results, and any tests not run.
6. Clearly separate verified facts from assumptions and unresolved issues.

## Context maintenance

At the end of a meaningful work session:

- Update `docs/ai-context/CURRENT_STATUS.md` with verified completed work, current blockers, and pending tasks.
- Update `docs/ai-context/DECISIONS.md` when the user makes or approves a durable technical decision.
- Update `docs/ai-context/NEXT_SESSION.md` with the exact stopping point, relevant files, next action, and safety constraints.
- Update `docs/ai-context/PROJECT_CONTEXT.md` only when durable project facts, architecture, stack, or setup instructions change.
- Do not record secrets, private credentials, or unverified assumptions as facts.

## Communication

- Provide Arabic explanations when guiding the user through environment setup or multi-step work.
- Give copy-ready commands and exact paths when useful.
- Explain multi-step batches before asking the user to execute them.
