// The browser and agent surfaces share one source-backed initialization recipe.
export const WORKBENCH = Object.freeze({
  repository: "https://github.com/spwashi/spw-workbench",
  revision: "3eaab637767222ffe248449da7262a251c4c608b",
  mount: ".spw/_workbench",
  node: "^20.19.0 || >=22.12.0",
});

export const JOB = `Read https://spw.quest/init and initialize .spw/_workbench in this repository. Verify with doctor. Stop before any commit.`;

export const GIT_GUIDE = `test -d .git || git init
git submodule add ${WORKBENCH.repository} .spw/_workbench
git -C .spw/_workbench checkout ${WORKBENCH.revision}
git submodule update --init -- .spw/_workbench
git diff --check
`;

export const GIT_MARKDOWN = `# Git, in this order

- no \`.git\` → \`git init\`
- no \`.spw/_workbench\` in \`.gitmodules\` → \`git submodule add\`
- link just added → \`checkout\` the reviewed revision
- link recorded, folder empty → \`git submodule update --init\`
- \`git diff --check\` looks only

\`\`\`bash
${GIT_GUIDE.trim()}
\`\`\`
`;

export const SHELL_STEPS = `test -d .git || git init
git submodule add ${WORKBENCH.repository} .spw/_workbench
git -C .spw/_workbench checkout ${WORKBENCH.revision}
npm --prefix .spw/_workbench ci --ignore-scripts
npm --prefix .spw/_workbench run spw:init -- ../..
npm --prefix .spw/_workbench run spw:doctor -- ../..
git diff --check
`;

/**
 * Who runs the setup. Shell is first and the default: it is the whole setup
 * with nothing hidden, git included. The agent sets hand the same recipe to a
 * model and can carry the git guide along; the shell set already runs it.
 */
export const INSTRUCTION_SETS = Object.freeze([
  { id: "shell", label: "Shell", note: "Every step, git included, run by you. No model.", text: SHELL_STEPS, includesGit: true },
  { id: "claude", label: "Claude", note: "Claude Code reads the recipe and runs it in this repository. It stops before any commit.", text: `claude -p '${JOB}'`, includesGit: false },
  { id: "codex", label: "Codex", note: "Codex runs the same recipe without prompting. It stops before any commit.", text: `codex exec '${JOB}'`, includesGit: false },
  { id: "grok", label: "Grok", note: "Grok runs the same recipe. It stops before any commit.", text: `grok '${JOB}'`, includesGit: false },
  { id: "paste", label: "Another agent", note: "Paste this into Cursor, Gemini, or any agent chat.", text: JOB, includesGit: false },
]);

export const INIT_PROMPT = `Initialize the current repository with Spw Workbench at .spw/_workbench.
Read this entire recipe before editing. Follow the target repository's existing instructions.
The section "Git, in this order" is the only git procedure. Use the one command that matches the folder you have.

Spw supplies language, parser, CLI, and editor tooling. The consumer owns .spw/;
the mounted workbench owns .spw/_workbench. Keep this repository's own instructions,
framework, and identity.

1. Inspect the working directory, git status, existing instructions, .gitmodules,
   .spw/, and git config core.hooksPath. Preserve unrelated changes and existing files.
   Require Git and Node ${WORKBENCH.node}. Confirm this directory is the intended
   consumer root.
2. Follow "Git, in this order" for the repository, the submodule link, the reviewed
   revision, and the download. Verify the workbench origin and read its own quick start.
3. Review the mounted package.json and lockfile, then install its locked tooling
   dependencies when the consumer's dependency policy allows:
   npm --prefix .spw/_workbench ci --ignore-scripts
   Leave the consumer's own dependency graph alone.
4. From the consumer root, run:
   npm --prefix .spw/_workbench run spw:init -- ../..
   The ../.. target is relative to npm's mounted package working directory.
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
   Stop before any commit, push, or deploy.

Expected core files: .spw/README.md, .spw/index.spw, .spw/mount.spw,
.spw/workspace.spw, plus .agents/workflows/commit-review.md. The pinned initializer
may seed additional authored surfaces; inspect its output and report those names.
`;

export const QUEST_PROMPTS = Object.freeze([
  { id: "init-repo", title: "Initialize the workbench", hint: "The shared job, for any model.", body: INIT_PROMPT },
  { id: "shell", title: "Shell", hint: "The same setup without a model.", body: SHELL_STEPS },
  { id: "git", title: "Git, in this order", hint: "What each git command is for.", body: GIT_GUIDE },
  { id: "first-patch", title: "Use the mounted workbench", hint: "After doctor verifies the mount.", body: `Read .spw/README.md, .spw/index.spw, .spw/workspace.spw, and .spw/mount.spw.
Treat .spw/_workbench as mounted infrastructure. The consumer owns the surrounding .spw tree.
Choose one bounded question about this repository. Navigate before reviewing:
npm --prefix .spw/_workbench run spw -- roots
npm --prefix .spw/_workbench run spw -- tree @spw --depth 3
Use the mounted-consumer review skill only as an instrument, following this repo's rules.
Record evidence under consumer-owned .spw/audits/ with consumer and workbench revisions.
Keep this repository's own CSS nouns, copy, and framework.` },
]);

export const QUEST_TEXT = `# spw.quest — initialize a mounted Spw workbench

Agent entrypoint: https://spw.quest/init

## Models

Each command asks the model to fetch this page and run the setup in the current repository.
Claude Code: claude -p '${JOB}'
Codex: codex exec '${JOB}'
Grok: grok '${JOB}'
Cursor, Gemini, or another agent: paste the job below into the agent chat.

${JOB}

## Shell

${SHELL_STEPS}
## Git, in this order

https://spw.quest/git.txt
https://spw.quest/git.md

${GIT_GUIDE}
${INIT_PROMPT}
Source: ${WORKBENCH.repository}/blob/${WORKBENCH.revision}/docs/runtime/md/quick-start.md
Ownership: ${WORKBENCH.repository}/blob/${WORKBENCH.revision}/docs/runtime/md/mounted-workbench.md
`;
