# Plan: spw-quest

**Status 2026-10-14.** Committed, not yet deployed: the guide opens with five files from reading, writing and study (a reading log, a seminar question with its probe, a narrator's persona held in regard, reading notes, a revision note) in an editor painted in the site's operator colors, and beside it what a tool reads from the file, with checks that change as the file does. The seven panels moved to /learn, /build takes a writing line apart, and every page wears the site's tokens and faces through the peer kit (`npm run build:peer-kit`, checked by `check:workers`). It waits on the creator's look at a phone before the Wrangler deploy.

**Related:** [workers-wonder-kit](../workers-wonder-kit/PLAN.md) (shared worker shell) · [spw-language-v04](../spw-language-v04/PLAN.md) (the parser's arrival in the site) · [upstream workbench asks](../../../.spw/reviews/upstream-workbench-recommendations.spw) (`week_2026_10_11`).

## What it is now (measured 2026-10-12)

- **Routes** (`workers/spw-quest/src/index.js`): `/` guide, `/learn` the seven panels, `/build` one line taken apart, `/fonts/` the site's faces, `/install`, `/init` (also `/init.md`, `/llms.txt`, and `/` with a text Accept header), `/git.txt`, `/git.md`, `/quest.json`, `/prompts.json`, `/.well-known/autonomous-feedback.json`, `/robots.txt`, `/health`. Pages are rendered by the worker with no client framework, and agents can already read `/init`, `/llms.txt` and `/prompts.json`.
- **Guide** (`src/guide.js`): a headline, then thirteen sigils on an Archimedean spiral. Each sigil links to its own section: *The shape it came from*, *Read one page* (a journal entry with line notes), *Twelve sigils and a couple*, *Four ways to hold things*, *You might find it interesting if…*, *Keep going*.
- **Install** (`src/quest.js`): five instruction sets (Shell, Claude, Codex, Grok, Another agent), one block each, then *When it worked* and *Then, if you want*.
- **Phone**: emulated at 390 px with the harness, both pages are exactly 390 px wide. Long install commands scroll inside their block. A narrow desktop window crops the page; that is Chrome's minimum window width, not overflow.
- **Pin**: the worker installs workbench `3eaab637` (2026-09-22). spwashi.com runs `229aedcf` (2026-09-30), seven commits newer.
- **Packages**: `spw-cli`, `spw-lsp`, `spw-runtime` and `spw-seed` are all private at 0.3.0. The only way to run Spw is a git submodule plus `npm ci` inside it.
- **Inbound links**: spwashi.com links spw.quest from Home, About, Now, `/topics/software/spw/` and `/about/domains/spw.quest/`.

## Why it may not have been used

These are hypotheses for a reviewer to test, not findings.

1. The first reward needs a repository, a submodule, Node 20.19+ and `npm ci`: minutes of setup before Spw says anything back.
2. Nothing on spw.quest lets a reader write a line and see it read. The parser lives on spwashi.com.
3. The guide explains well and asks for nothing. There is no first act smaller than installing.
4. Nobody has been told to send an agent there, so the agent-facing routes go unread.

## Slices, ranked

**A. Try before installing.** *Read one page* gets an *Open in the parser* link to `https://spwashi.com/tools/spw-parser/?spw_source=…`, with the example preloaded; the parser reads `spw_source` (`public/js/kernel/parser-link.js:10`). Then a one-line *write your own* box as a plain GET form to the same parser, so it works with scripts off. Value: high, the first reward in seconds. Cost: small; the worker test pins the link.

**B. Pin what spwashi.com runs.** Read the seven commits from `3eaab637` to `229aedcf`, bump `WORKBENCH.revision`, and rerun the install on a scratch repository to `spw:doctor`. Value: an installer that matches the reference consumer. Cost: one constant, plus a real run.

**C. A shorter install.** The real fix is a published CLI (`npx @spwashi/spw-cli init`), which is a workbench decision. Until then, `/install` can lead with the agent sets, which are one command each. The shell set stays as the version with nothing hidden. A piped install script is a security call for the creator, and is not proposed here.

**D. Aesthetics.** Browser-gated: the creator approves the look before it ships.
- The spiral's path is faint on the dark ground.
- The nodes show sigils without names until you follow one. A name on focus and hover, or a quiet label ring, would teach without a tap.
- Long install commands could wrap instead of scrolling on a phone.
- The heading type is tight at phone width.
- Capture legibility for screenshots and recordings.
- Whether spw.quest keeps its own dark identity or borrows the site's paper material is the creator's call.

**E. A plan surface on spw.quest.** `/plan`, and `/plan.json`, say what is next for Spw and its tools in plain words, drawn from the workbench review (`week_2026_10_11`). An agent can then be pointed at `spw.quest/plan`, the same way `/init` already works. Public or private is the creator's call; see the open questions.

**F. Show motion.** After each close, a short *what changed* strip, so a returning reader sees the language moving.

## Review prompts

Copy one into an agent. Each prompt is read-only unless it says otherwise, and none of them commits.

- *Install review*: "Read `workers/spw-quest/src/quest.js` and run the Shell set on a fresh scratch repository outside this one. Time each step to a passing `spw:doctor`, note where you stopped to think, and say which of slices B and C you would do first. Do not commit."
- *First-reward review*: "Open spw.quest's guide (render it through `workers/spw-quest/src/index.js` in node). Say what a reader can do in the first minute, and how slice A would change that. Read `.agents/plans/spw-quest/PLAN.md` first."
- *Look review*: "Capture the guide and the install page at a phone width with the harness's phone viewport (`scripts/lib/chrome-headless-harness.mjs`, `VIEWPORTS.phone`), not a narrow desktop window. Name three changes from slice D that would most improve how it reads, with before-and-after stills."
- *Voice review*: "Read the guide's copy in `src/guide.js` and `src/index.js` against the guards below. Flag anything that sells, flatters, or names an audience. The origin paragraphs are the creator's words; leave them."
- *Plan review*: "Read this plan. Say which slice you would cut, which you would add, and what evidence would change the ranking."

## Guards

- The origin paragraphs (*My thoughts were already spirals*, 2017, the adult learning lab) are the creator's words. They speak about shape, cognition, learning and geometry: no God, no diagnostic labels.
- Operator names follow the workbench's reader vocabulary; the route test holds them to it. The creator's direction of 2026-10-11 moves the operator table into the workbench, and spw.quest reads from it once it exists.
- Drift rule: the Start strip on `about/domains/spw.quest/index.html` restates each instruction set's *does* and *keeps* (comment above `INSTRUCTION_SETS`).
- Agents do not commit, push or deploy. Deploy is the creator's Wrangler step.
- Measure phones with emulation, not a narrow window.

## Validation

- `npm run check:workers`, which runs `workers/spw-quest/test/routes.test.mjs`.
- `node --check` on touched files.
- Phone stills through the harness for any slice D change.
- For slice B, a real install on a scratch repository through `spw:doctor`.
