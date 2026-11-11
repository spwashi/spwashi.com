# spw.quest — initialize a mounted Spw workbench

Agent entrypoint: https://spw.quest/init

## Models

Each command asks the model to fetch this page and run the setup in the current repository.
Claude Code: claude -p 'Read https://spw.quest/init and initialize .spw/_workbench in this repository. Verify with doctor. Stop before any commit.'
Codex: codex exec 'Read https://spw.quest/init and initialize .spw/_workbench in this repository. Verify with doctor. Stop before any commit.'
Grok: grok 'Read https://spw.quest/init and initialize .spw/_workbench in this repository. Verify with doctor. Stop before any commit.'
Cursor, Gemini, or another agent: paste the job below into the agent chat.

Read https://spw.quest/init and initialize .spw/_workbench in this repository. Verify with doctor. Stop before any commit.

## Shell

test -d .git || git init
git submodule add https://github.com/spwashi/spw-workbench .spw/_workbench
git -C .spw/_workbench checkout 850077ab48e02c58c2b55787075a7b97c9e4bf4f
npm --prefix .spw/_workbench ci --ignore-scripts
npm --prefix .spw/_workbench run spw:init -- ../.. --preset quest
npm --prefix .spw/_workbench run spw:doctor -- ../..
git diff --check

## Git, in this order

Run only the command that matches the folder you have. The last command only looks.
https://spw.quest/git.txt
https://spw.quest/git.md

test -d .git || git init
git submodule add https://github.com/spwashi/spw-workbench .spw/_workbench
git -C .spw/_workbench checkout 850077ab48e02c58c2b55787075a7b97c9e4bf4f
git submodule update --init -- .spw/_workbench
git diff --check

Initialize the current repository with Spw Workbench at .spw/_workbench.
Read this entire recipe before editing. Follow the target repository's existing instructions.
The section "Git, in this order" is the only git procedure. Use the one command that matches the folder you have.

Spw supplies language, parser, CLI, and editor tooling. The consumer owns .spw/;
the mounted workbench owns .spw/_workbench. Keep this repository's own instructions,
framework, and identity.

Expected core files: .spw/README.md, .spw/index.spw, .spw/mount.spw,
.spw/workspace.spw, .spw/quest/index.spw, plus .agents/workflows/commit-review.md. The pinned initializer
may seed additional authored surfaces; inspect its output and report those names.

1. Inspect the working directory, git status, existing instructions, .gitmodules,
   .spw/, and git config core.hooksPath. Preserve unrelated changes and existing files.
   Require Git and Node ^20.19.0 || >=22.12.0. Confirm this directory is the intended
   consumer root.
2. Follow "Git, in this order" for the repository, the submodule link, the reviewed
   revision, and the download. Verify the workbench origin and read its own quick start.
3. Review the mounted package.json and lockfile, then install its locked tooling
   dependencies when the consumer's dependency policy allows:
   npm --prefix .spw/_workbench ci --ignore-scripts
   Leave the consumer's own dependency graph alone.
4. From the consumer root, run:
   npm --prefix .spw/_workbench run spw:init -- ../.. --preset quest
   The ../.. target is relative to npm's mounted package working directory.
   --preset quest adds .spw/quest/: forks, experiments, shelves, wonders and asks.
   Init seeds consumer files and leaves existing scaffold files in place. It may
   install a commit-review workflow and .git/hooks/pre-commit. Read the existing
   hook first. Report when core.hooksPath means that hook will not run.
5. Read .spw/README.md, .spw/index.spw, .spw/workspace.spw, and .spw/mount.spw.
   Run:
   npm --prefix .spw/_workbench run spw:doctor -- ../..
   npm --prefix .spw/_workbench run spw -- roots
   npm --prefix .spw/_workbench run spw -- tree @spw --depth 3
   git diff --check
   Default consumer scans exclude _workbench. Leave the workbench grammar in place.
6. Report the mount revision, created and skipped files, hook changes, doctor result,
   and any blocked step. Run the checks before you call the setup done.
7. Play once. Read .spw/quest/index.spw and make one of its moves inside .spw/ only:
   fork a form, run a probe, move a claim along the shelves, or write an ask for the
   workbench in .spw/quest/asks.spw. If that folder is missing, take one move from the
   Grow section of .spw/README.md instead. Then verify from the consumer root:
   npm --prefix .spw/_workbench run spw -- lint .spw
   npm --prefix .spw/_workbench run spw -- resolve --from .spw
   git diff --check
   Report the file you added or changed and what both commands said.
   Stop before any commit, push, or deploy.

Source: https://github.com/spwashi/spw-workbench/blob/850077ab48e02c58c2b55787075a7b97c9e4bf4f/docs/runtime/md/quick-start.md
Ownership: https://github.com/spwashi/spw-workbench/blob/850077ab48e02c58c2b55787075a7b97c9e4bf4f/docs/runtime/md/mounted-workbench.md
