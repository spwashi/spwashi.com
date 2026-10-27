# Plan: spw-quest

**Status 2026-10-25.** G is merged to main (17f6a77e) at the creator's word, to test live: `/specimens`, read with scripts off. The next Wrangler deploy carries it with the note. H (how Spw is developing, as one specimen read by two releases) and I (the same for agents) are proposed, sequenced with [ecosystem-architecture](../ecosystem-architecture/PLAN.md). Nothing below has changed since 2026-10-14. Committed, not yet deployed: the guide opens with five files from reading, writing and study (a reading log, a seminar question with its probe, a narrator's persona held in regard, reading notes, a revision note) in an editor painted in the site's operator colors, and beside it what a tool reads from the file, with checks that change as the file does. The seven panels moved to /learn, /build takes a writing line apart, and every page wears the site's tokens and faces through the peer kit (`npm run build:peer-kit`, checked by `check:workers`). The guide now keeps one note on the device (localStorage, `?note`), PR 1 of the [note and shell design](./note-shell-design.md); PRs 2 to 4 (pin the reader, the service worker, the manifest) follow it in order, and the shell must not ship before the note is deployed. It waits on the creator's look at a phone before the Wrangler deploy.

**Related:** [workers-wonder-kit](../workers-wonder-kit/PLAN.md) (shared worker shell) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) (the parser's arrival in the site) · [upstream workbench asks](../../../.spw/reviews/upstream-workbench-recommendations.spw) (`week_2026_10_11`).

## What it is now (measured 2026-10-25)

- **Routes** (`workers/spw-quest/src/index.js`): `/` guide, `/learn` the seven panels, `/build` one line taken apart, `/read` one line read on the worker with scripts off, `/script.spw` the same script as a file, `/parser.js` the parser as a script, `/parser/` the dated releases (`src/parser-releases.js`), `/fonts/` and `/peer/` the site's faces and modules (`workers/lib/peer-assets.js`), `/install`, `/init` (also `/init.md`, `/llms.txt`, and `/` with a text Accept header), `/git.txt`, `/git.md`, `/quest.json`, `/prompts.json`, `/.well-known/autonomous-feedback.json`, `/robots.txt`, `/health`. Pages are rendered by the worker with no client framework.
- **Guide**: *A small language for the shape of a thought.* Five files written in Spw, in an editor beside *What a tool reads*; then *Twelve marks, four braces*, *Ways in*, and *The shape it came from*. The note keeps one file on the device (`?note`).
- **Install** (`src/quest.js`): five instruction sets (Shell, Claude, Codex, Grok, Another agent), one block each, then *When it worked* and *Then, if you want*.
- **Phone** (2026-10-12): emulated at 390 px with the harness, the guide and the install page are 390 px wide. Long install commands scroll inside their block.
- **Pin**: `/init` and the mount both run workbench `0eb1d1c0` (f51b316c, 2026-10-13). One release, 2026.10.13, is tracked; `2026.10.13-pre.1` is gitignored.
- **Packages**: `spw-cli`, `spw-lsp`, `spw-runtime` and `spw-seed` are all private at 0.3.0. The only way to run Spw is a git submodule plus `npm ci` inside it.
- **Inbound links**: spwashi.com links spw.quest from Home, About, Now, `/topics/software/spw/`, `/about/domains/spw.quest/`, `/projects/spw-workbench/`, `/design/composition/` and `/design/catalog/systems/`.
- **Tests**: 52 in `check:workers` (routes 18, note 9, releases 12, prereleases 13).

## Why it may not have been used

These are hypotheses for a reviewer to test, not findings.

1. The first reward needs a repository, a submodule, Node 20.19+ and `npm ci`: minutes of setup before Spw says anything back.
2. Nothing on spw.quest lets a reader write a line and see it read. The parser lives on spwashi.com.
3. The guide explains well and asks for nothing. There is no first act smaller than installing.
4. Nobody has been told to send an agent there, so the agent-facing routes go unread.

## Slices, ranked

**A. Try before installing.** Superseded: `/read` and `/build` read a line on the worker with scripts off, and the file editor reads as you type. Kept for its history. *Read one page* gets an *Open in the parser* link to `https://spwashi.com/tools/spw-parser/?spw_source=…`, with the example preloaded; the parser reads `spw_source` (`public/js/kernel/parser-link.js:10`). Then a one-line *write your own* box as a plain GET form to the same parser, so it works with scripts off. Value: high, the first reward in seconds. Cost: small; the worker test pins the link.

**B. Pin what spwashi.com runs.** Done: since 2026-10-13 the install and the mount both pin `0eb1d1c0`, and the rule from d4e42c5b keeps them together. Kept for its history. Read the seven commits from `3eaab637` to `229aedcf`, bump `WORKBENCH.revision`, and rerun the install on a scratch repository to `spw:doctor`. Value: an installer that matches the reference consumer. Cost: one constant, plus a real run.

**C. A shorter install.** The real fix is a published CLI (`npx @spwashi/spw-cli init`), which is a workbench decision. Until then, `/install` can lead with the agent sets, which are one command each. The shell set stays as the version with nothing hidden. A piped install script is a security call for the creator, and is not proposed here.

**D. Aesthetics.** Browser-gated: the creator approves the look before it ships.
- The spiral's path is faint on the dark ground.
- The nodes show sigils without names until you follow one. A name on focus and hover, or a quiet label ring, would teach without a tap.
- Long install commands could wrap instead of scrolling on a phone.
- The heading type is tight at phone width.
- Capture legibility for screenshots and recordings.
- Whether spw.quest keeps its own dark identity or borrows the site's paper material is the creator's call.

**E. A plan surface on spw.quest.** `/plan`, and `/plan.json`, say what is next for Spw and its tools in plain words, drawn from the workbench review (`week_2026_10_11`). An agent can then be pointed at `spw.quest/plan`, the same way `/init` already works. Public or private is the creator's call; see the open questions.

**F. Show motion.** After each close, a short *what changed* strip, so a returning reader sees the language moving. H below is this slice made concrete.

### Playground and motion (2026-10-25)

Proposed with [ecosystem-architecture](../ecosystem-architecture/PLAN.md), which ranks the site-side work these lean on. G, H and I are new routes: they leave the note shell alone and ship after the note is deployed. The wip's next commit, each sigil's physical model beside its reading, stays first.

**G. Specimens.** `/specimens` is a shelf of constructs, each read on the worker with scripts off.
- **Sources,** carried at build time by a carry script the way `carry-parser.mjs` carries the parser:
  - the parser tool's v0.4 gallery (claims and probes, profiles, dot-crawl joins, stem projections, combinatoric genre, path count, gradient slices);
  - the herbarium's pressed forms (`.spw/language/expressions/`);
  - a sample of the 974 expressions on spwashi.com's routes.
- **Each specimen** shows its line, its reading, and where it lives (the route and section on spwashi.com, as a link). It opens in the file editor when scripts run.
- **Compare:** any two specimens read as ground, then the edge by slot, the reading `npm run spw:routes -- --diff` gives two routes. That puts the moment two forms stop sharing ground in a reader's hands.
- **Query box:** `?q=` filters by partial slot (`show[*]`, `[pi]`, `{seed}`) on the worker, and `expression-query.js` does the same live once the instrument travels (ecosystem-architecture S4). This is the creator's 2026-10-12 direction: Spw as a query language.
- **Value:** a corpus to play with instead of one example, and links that send readers back into spwashi.com.
- **Gate:** the creator's look at a phone.
- **Built 2026-10-25**, merged 2026-10-26 to test live. `carry-specimens.mjs` carries 27 pressed forms, the 18 gallery samples and all 974 route expressions, each with the section that holds it, and reads each once (`src/specimen-reading.js`: the file reader's paint, `expression-query.js` slots), so a request assembles strings in 1–2 ms. The shelf shows the herbarium by block, the pages' rarer lines by kind (a charge in front 17, joined 20, a mark in front 7, a scene 64) and the gallery as files; `?q=` searches all of it with every named slot required, `*` asking only that a slot be there. `?a=&b=` reads two lines as ground, then the slot where they part; a herbarium form links to the form it departs from. Nine herbarium forms are read only in part by the slot reader (nested bodies, three-way joins, `;` lists, chained capsules), and say so; every route line reads whole. The guide is untouched: `/learn` and `/build` link the page, and a masthead link or a guide door is the creator's call, since both change the note shell. Phone at 390 px, light and dark: no overflow; the shelf is about 21 screens. Tests: `test/specimens.test.mjs`, and `carry-specimens.mjs --check` in `check:workers`.

**H. Motion.** Shows how Spw is developing: the same specimen read by the previous parser release and the current one, ground then edge, so a change in the language is something a reader can open.
- **Built from public sources only:**
  - the release index (`/parser/index.json`, already public);
  - the workbench log between pins;
  - the site's `^[workbench]` commit subjects.
- **The guide carries a strip,** and a page holds the rest.
- **A count of open questions** says the language is alive without publishing the plan. The `/plan` wonder stays the creator's.
- **Needs two releases.** Today there is 2026.10.13 and a gitignored `-pre.1`; `?parser=next` already switches between them.
- **Gate:** the creator confirms that motion is public, and the wording of every subject that goes out.

**I. Agents.** `/specimens.json`, and a `/read` that answers in Spw when asked (`Accept: text/plain`, or a `.spw` path).
- An agent sent to spw.quest can then read a line and compare two, beside `/init` and `/llms.txt`.
- The output parses as Spw, so it can be piped.
- **Gate:** worker usage is the creator's call.

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
