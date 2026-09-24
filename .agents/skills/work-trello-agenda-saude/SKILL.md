---
name: work-trello-agenda-saude
description: Use when reading, selecting, implementing, or updating development tasks from the Agenda Saúde Trello board, especially Sprint 0 cards, their workflow status, and the branch, commits and merge into master that version each card.
---

# Work Agenda Saúde Trello Tasks

Coordinate Trello cards with implementation work in this repository. Each card ends as one
branch merged into `master` with a merge commit and pushed to `origin`, so every card is
versioned and traceable. This repository does not use pull requests.

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
- Move the card to `Revisão e QA` once its commits are on the branch and validation evidence exists, before merging. Every card's "Conclusão" section requires this.
- Move the card to `Concluído` only after the merge is pushed to `origin/master`, its acceptance criteria are satisfied, and no human approval is still pending.
- If the card or the roadmap (`docs/roadmap-lancamento-clinica.md`) requires approval from someone else, such as the DPO, legal, or product, leave the card in `Revisão e QA` after the merge and say who must approve. Never claim an approval that did not happen.
- If the task becomes blocked or validation fails, leave it in `Em desenvolvimento` and report the blocker and evidence. Never mark partial work as complete.
- The connected Trello tools cannot comment on a card. Put the merge commit in the handoff instead of editing the card description.

## Implement and Validate

- Treat the card as the product requirement, then inspect existing code and documentation for the implementation contract.
- Keep changes limited to the selected card and necessary generated artifacts or tests.
- Run the narrowest relevant checks first, followed by broader typecheck, lint, build, or end-to-end checks when the change risk warrants them.
- For documentation cards, check every path, symbol and environment variable the document cites against the code.
- For API contract changes, follow the repository's OpenAPI and generated-client workflow.
- Before completing the card, review the diff for scope, accidental edits, secrets, debug code, and unresolved acceptance criteria.

## Branch, Commit, Merge and Push

Do this for every card. Do not open a pull request. Merge into `master` and push only when the current request asks for it (for example "faça o merge e o push"); otherwise stop with the card committed on its branch, in `Revisão e QA`, and ask before merging. Pushing `master` publishes the work, so the request must say so.

### Branch

- Create the branch from an up-to-date `master` right after moving the card to `Em desenvolvimento`.
- Name it `<type>/<card-id>-<slug>` in lowercase, for example `docs/l3-01-inventario-dados-lgpd` or `feat/l0-03-permissoes-efetivas`. Types follow conventional commits.

### Commit

- Stage explicit paths (`git add <file>...`). Never use `git add -A` or `git add .`: the working tree often holds the user's unrelated, uncommitted work, and it must not enter the card's commits.
- Check `git diff --staged --stat` before committing.
- Follow the `commit-message` skill: `<type>(<scope>): <imperative subject>`, a body that explains why, and a `Card: <id> (Sprint 0)` line.
- End the message with the attribution line from the session's system reminder.
- Keep one logical change per commit. A change to this skill or other tooling goes in its own commit.

### Merge and push

The branch itself is not published: it stays local and is deleted after the merge. There is no pull request, no `gh`, and no browser step. SSH access to `origin` works, so `git push` is plain.

1. **Check the branch.** `git status` is clean and the card's validation has passed on the branch. Move the card to `Revisão e QA` (see the state contract).
2. **Bring in what landed on `master`.** Run `git fetch origin master`. If `origin/master` has commits the branch lacks, run `git merge origin/master` on the branch and resolve conflicts keeping the intent of both sides. Never resolve by discarding the incoming side. Then re-run the checks the incoming changes could affect, because other cards keep merging into `master` while yours is in progress.
3. **Merge into `master` with a merge commit.** Do not squash or rebase. The history uses `Merge branch '<branch>'` commits, and the message ends with the attribution line from the session's system reminder.

   If `master` is free to check out in this worktree:

   ```bash
   git switch master
   git merge --ff-only origin/master
   git merge --no-ff <branch> -m "Merge branch '<branch>'"
   ```

   If git refuses because `master` is checked out in another worktree (the main checkout, or a worktree the app created), do not touch that worktree. Merge on a detached HEAD instead:

   ```bash
   git switch --detach origin/master
   git merge --no-ff <branch> -m "Merge branch '<branch>'"
   ```

4. **Push**, alone in its own command: `git push origin master`, or `git push origin HEAD:master` from the detached HEAD.
   - If the push is denied, do not retry it or route around it (another tool, another remote, the browser). Stop, say that the merge exists only locally and nothing was published, and ask the user to run the push or to allow it. Leave the card in `Revisão e QA`.
   - If it is rejected because `origin/master` moved, fetch and redo steps 2 and 3. Never force-push `master`.
5. **Bring the local checkouts up to date** without touching the user's uncommitted files. Where `master` is checked out, run `git pull --ff-only`. A checkout that has an old `master` (the detached case) is not updated for you: name it in the handoff so the user can pull there. If `git pull` refuses because uncommitted files overlap the merged changes, stop and tell the user. Do not stash, reset, or discard anything.
6. **Clean up.** Delete the local branch with `git branch -d <branch>`. Git refuses while the branch is checked out, which is why the detached merge above also frees it. Then apply the `Concluído` rule from the state contract.

## Handoff

Report the card, the behavior delivered, the validation performed, and any noteworthy limitations. Include the merge commit, the push result, and the card's final list with the reason. If more Sprint 0 cards remain, identify the next unblocked card without starting it unless the user's request includes continued execution.
