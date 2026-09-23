---
name: work-trello-agenda-saude
description: Use when reading, selecting, implementing, or updating development tasks from the Agenda Saúde Trello board, especially Sprint 0 cards, their workflow status, and the branch, pull request and merge that version each card.
---

# Work Agenda Saúde Trello Tasks

Coordinate Trello cards with implementation work in this repository. Each card ends as one
branch, one pull request and one merge, so every card is versioned and traceable.

## Access

- Prefer a connected Trello integration when one is available; otherwise use the user's authenticated browser session and the board link provided in the conversation.
- Board: "Agenda Saúde — Roadmap de Lançamento", https://trello.com/b/TPs4oClx/agenda-sa%C3%BAde-roadmap-de-lan%C3%A7amento
- Never store invitation tokens, credentials, cookies, or private attachment URLs in repository files.
- If authentication or board membership blocks access, stop before changing repository code and ask the user to complete that access step.

## Board Lists

`Ideias e futuro` → `Backlog priorizado` → `Sprint 0 — Bloqueadores` → `Em desenvolvimento` → `Revisão e QA` → `Concluído`, plus `Bloqueado`.

The list that earlier versions of this skill called `Desenvolvimento` is `Em desenvolvimento`.

## Select Work

1. Open the Agenda Saúde roadmap board and inspect the complete Sprint 0 scope before choosing a card.
2. Read the selected card's description, checklist, labels, attachments, comments, dependencies, and acceptance criteria.
3. Work one card at a time, normally in the board's priority order. Prefer an unblocked card whose dependencies are already complete.
4. A dependency is complete only when its code is merged, not just when its card is in `Concluído`. If the working tree holds that dependency's uncommitted work, treat the card as blocked and tell the user, or pick another card.
5. Check the working tree (`git status`) before editing. Preserve unrelated and pre-existing user changes.
6. Load the project skill(s) that match the card, such as the backend, React, generated-client, financial, Jest, Cucumber, or Playwright workflow.

## Trello State Contract

- Immediately before implementation begins, move the selected card to `Em desenvolvimento`.
- Do not move unrelated cards or change their title, description, labels, members, dates, or priority unless the user or card explicitly requires it.
- Move the card to `Revisão e QA` when its pull request is open and validation evidence exists. Every card's "Conclusão" section requires this.
- Move the card to `Concluído` only after the pull request is merged, its acceptance criteria are satisfied, and no human approval is still pending.
- If the card or the roadmap (`docs/roadmap-lancamento-clinica.md`) requires approval from someone else, such as the DPO, legal, or product, leave the card in `Revisão e QA` after the merge and say who must approve. Never claim an approval that did not happen.
- If the task becomes blocked or validation fails, leave it in `Em desenvolvimento` and report the blocker and evidence. Never mark partial work as complete.
- The connected Trello tools cannot comment on a card. Put the pull request link in the handoff instead of editing the card description.

## Implement and Validate

- Treat the card as the product requirement, then inspect existing code and documentation for the implementation contract.
- Keep changes limited to the selected card and necessary generated artifacts or tests.
- Run the narrowest relevant checks first, followed by broader typecheck, lint, build, or end-to-end checks when the change risk warrants them.
- For documentation cards, check every path, symbol and environment variable the document cites against the code.
- For API contract changes, follow the repository's OpenAPI and generated-client workflow.
- Before completing the card, review the diff for scope, accidental edits, secrets, debug code, and unresolved acceptance criteria.

## Branch, Commit, Pull Request and Merge

Do this for every card. Always open the pull request. Merge only when the current request asks for it (for example "faça o PR e em seguida o merge"); otherwise stop with the card in `Revisão e QA` and ask before merging.

### Branch

- Create the branch from an up-to-date `master` right after moving the card to `Em desenvolvimento`.
- Name it `<type>/<card-id>-<slug>` in lowercase, for example `docs/l3-01-inventario-dados-lgpd` or `feat/l0-03-permissoes-efetivas`. Types follow conventional commits.

### Commit

- Stage explicit paths (`git add <file>...`). Never use `git add -A` or `git add .`: the working tree often holds the user's unrelated, uncommitted work, and it must not enter the card's pull request.
- Check `git diff --staged --stat` before committing.
- Follow the `commit-message` skill: `<type>(<scope>): <imperative subject>`, a body that explains why, and a `Card: <id> (Sprint 0)` line.
- End the message with the attribution line from the session's system reminder.
- Keep one logical change per commit. A change to this skill or other tooling goes in its own commit.

### Pull request

- `gh` is not installed on this machine (checked 2026-09-23) and there is no API token. SSH access to `origin` works, so push the branch with a plain `git push`, alone in its own command:

```bash
git push -u origin <branch>
```

- If the push is denied, do not retry it or route around it (another tool, another remote, the browser). Stop and ask the user. The options are: the user pushes it, or the user chooses a local merge without a pull request. Use the local merge only when the user chooses it, and then apply the merge steps below with `git merge --no-ff` and no remote step. Leave the card in `Revisão e QA`, say that nothing was published, and skip the pull request body.

- Open the pull request in the browser with the user's signed-in GitHub session: `https://github.com/Andre-Eduardo/agenda/compare/master...<branch>?expand=1`. Prefer the built-in browser; if GitHub is not signed in there, stop and ask the user to sign in. Never type credentials.
- Base branch is `master`. Title is the commit subject. Body sections:
  1. **Summary**: what changed and why, in a few lines.
  2. **Card**: the Trello card URL and id.
  3. **Validation**: the commands or checks that ran and their results, including any that did not run.
  4. **Scope**: pre-existing uncommitted changes deliberately left out, and any open item for a reviewer.
  5. The line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Move the card to `Revisão e QA` once the pull request exists.

### Merge

- Use **Create a merge commit**. The history of this repository has `Merge pull request #N from Andre-Eduardo/...` commits, so keep that style. Do not squash or rebase.
- Delete the remote branch after the merge.
- Bring the local checkout up to date without touching the user's uncommitted files:

```bash
git switch master
git pull --ff-only
```

- If `git pull` refuses because uncommitted files overlap the merged changes, stop and tell the user. Do not stash, reset, or discard anything.
- Apply the `Concluído` rule from the state contract, then delete the local branch with `git branch -d <branch>`.

## Handoff

Report the card, the behavior delivered, the validation performed, and any noteworthy limitations. Include the pull request URL, the merge commit, and the card's final list with the reason. If more Sprint 0 cards remain, identify the next unblocked card without starting it unless the user's request includes continued execution.
