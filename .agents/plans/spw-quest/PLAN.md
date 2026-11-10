# Plan: spw-quest

**Status 2026-11-10.** Live from the creator's deploy of 2026-11-07 (the Wrangler version is in wip.spw): the guide, `/learn`, `/build`, `/specimens`, `/constructs`, `/pivot` and Forms. Nothing on main after that deploy is deployed; since 2026-11-10 that includes the line in hand (`cd0c0012`, below) and the genre rules the site's parser tool now shares with this worker's reading (`3dc3dd24`). M2, the walk trail, landed in `584ac7eb` on 2026-11-06. Deploying is the creator's call. Next: the creator's look at the hand at 390 px, then N2 and O1, each cut to one session below. P and Q wait on a question in brace-semantics.

**Related:** [workers-wonder-kit](../workers-wonder-kit/PLAN.md) (shared worker shell) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) (the parser's arrival in the site) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (S3 put the worker on the site's reader bundle; S4 is the query instrument travelling) · [upstream workbench asks](../../../.spw/reviews/upstream-workbench-recommendations.spw) (`week_2026_10_11`).

## Contour, not next (2026-11-10)

M2 landed in `584ac7eb`, so the specimen below is no longer waiting on it. A feedback line is not a room in the guide. `/.well-known/autonomous-feedback.json` is the seat this worker already has. After M2, one specimen on the shelf may hold a genre and a line, so a visitor can form a taste without the form moving here. Elaboration of a sent note is `/pivot` for one change, and factshift.center for the layout. The record is [feedback-contour-2026-11](../../../.spw/caches/feedback-contour-2026-11.spw). The file this worker already serves keeps `schema` `autonomous-feedback.client.v0`. An optional edition, `2026-11.A` for the first change of a month, is held in [feedback-well-known-2026-11](../../../.spw/caches/feedback-well-known-2026-11.spw) and is not read yet.

## The line in hand (2026-11-10, `cd0c0012`, not deployed)

The creator, through one sitting: improve Spw navigation and mutation ease across spw.quest; the build tooling "feels inauthentic with respect to the actual usage or mental model of editing Spw", so consider "a more inline or live mutation concept"; activate a feature and scroll between lines, across modes, or through nested trees; frame navigation of lines between loaded documents; joins that clarify the featured scripts; more expressions linking to factshift.center; memory across page components on Learn.

operation: align (the editor with how a line is actually changed: in place, one slot, seen before it is written)

- **The hand** (`fileKit` in `src/file-reader.js`: `partsIn`, `lent`, `means`, `hand`; `handBar` draws it under the editor on the guide and `/build`). The caret's line is the line in hand. Its parts are handles: a mark by its workbench name, a word, each brace by the slot it names. A tap holds a part without focusing the field; a second tap gives it to the field to type over. A held slot at the line's own level offers the values the same slot holds on the file's other lines; a tap primes one (the line it would make, and what that changes: a check, a field, the theme, a marked word, which lines it now joins and which it leaves), a second tap or *Write it* writes it, and *Put it back* undoes it. ↑ ↓ step lines and keep hold of the same kind of part, so a column of modes is walked down. *Open it* enters a part that holds parts; ← leaves. Read on `/build` takes the line in hand apart (`at`, read by `handleTool`). Selecting words and typing a brace wraps them. The grammar is the control prime's: tap primes, a second tap acts ([concept-route-physics](../../../.spw/caches/concept-route-physics-2026-11.spw), `hands`).
- **Scripts off:** on `/build` the bar's parts are links to the slot rows below; on the guide the bar is hidden. The slot rows stay, as the scripts-off form.
- **Files that join.** Nine paths between the guide's fourteen files (`src/examples.js`), some naming a line (`./themes.spw#matte`). A reading's *Points to* opens that file in place and lands the hand on the line; *Pointed to by* is the edge back. `/?example=…&at=…` is the address. Each mark's card on the guide says how often the open file uses it.
- **Elsewhere.** `/pivot`'s own box keeps the walk when a line is changed in it. `/learn?word=` carries one word through the panels where the quest says `door` (N1's first half; `steps.js` stays verbatim), offered from the line last held (`spw.quest.hand/1`, this browser only). A panel's line goes on to `/pivot` and the canvas; the pivot's line and the constructs' pressed lines open on the canvas too.
- **Genre rules, said once.** The three questions this reading asks a file of a known kind (a log's entries, a question's probe, a change record's check) are also `public/js/semantic/spw-genre-checks.js`, which `/tools/spw-parser/` shows with the reason for each rule (`3dc3dd24`). `fileKit` keeps its own copy because it travels into the page by `toString`; `test/genre.test.mjs` holds the sentences equal over the fourteen files. When `fileKit` takes readers as arguments (the plugin seam, below), the module can be the one copy.
- **Tests:** `test/hand.test.mjs` (7) and `test/genre.test.mjs` (2); 128 in seventeen files on 2026-11-10. Not seen in a browser: headless is blocked in the agent's sandbox, so the page script was parsed and its kit run from its own text, and the feel is unreviewed.

Calls that are the creator's:
- whether the slot rows on `/build` fold away or retire once the hand has been felt at 390 px;
- the hand on the guide's first screen at all (it adds two rows under the file);
- the wording of each consequence sentence (`means`), and of the nine joins.

Held, not built: physics and node patterns that make comparison easier, and physics as a convenience or a premium (the app repository, and a pricing call); the factshift.center address as a surface for a script's geometry; a cached local document tree with a denser tour; a redesign of `/learn`'s layout; the shelf's cards opening on the canvas (the page is at its 275 KB budget).

## Landed

- 2026-10-12 `e6b4b937`: seven panels from the workbench's `docs/learn/quest.spw`, walked as a path; *Put one together*; the site's paper material on every page, and the spiral gone.
- 2026-10-12 `55fb8f75`, `051a5a7d`: dated parser releases under `/parser/`, named by day; `?parser=next` for a prerelease.
- 2026-10-13 `32016dea`, `b4651803`: the script leads the tool; the guide opens on five files people keep; the peer kit carries the site's tokens and faces (`npm run build:peer-kit`).
- 2026-10-14 `7391e276`, `ca401c44`: PR 1 of the [note and shell design](./note-shell-design.md), one note on the device (`?note`); a Display menu and pinch to resize.
- 2026-10-25 `4c454b32`, `17f6a77e`: readings move onto the site's reader bundle; G, `/specimens`, merged to test live: herbarium forms, gallery samples and every route line, searched by slot with `?q=` (the creator's 2026-10-12 direction: Spw as a query language) and held two at a time with `?a=&b=`.
- 2026-10-27 `15ceca9e`: J, `/constructs` and `/pivot`.
- 2026-11-05 `1f399471`, `a43df6d1`: the November book's line on the shelf; K, the five rooms on `about/domains/spw.quest/` (`#ways-in`) and a pivot link on each join specimen in `#direction`. Deployed the same night with G, J and the note.
- 2026-11-05 `9f2e3af4`, `d3dcda9f`, not deployed: L, every room reads a line in either slot order and writes it back in its author's order (`readSlotOrder` and `readContainers` in `public/js/semantic/expression-query.js`; `assemble` in `src/build.js`; `lineFrom` in `src/pivot.js`); M's body turns (`BODY_TURNS` in `src/pivot.js`); *Pivot this line* and *Find it on the shelf* on `/build`; Shelf in the masthead.
- 2026-11-08 `cd280779`: S0 of [expression-first.md](./expression-first.md): installable from a phone's menu (manifest, icons, `manifest-src 'self'`); `/install` leads with the phone. The commit after it is W, the guide opening on the visitor's walk written in Spw. Neither is deployed.
- 2026-11-10: PWA design elevation: standalone display mode styling (`@media (display-mode: standalone)`), sticky glassmorphic masthead with `#>` brand badge, safe-area insets (`env(safe-area-inset-*)`), responsive install cards on `/install` with elevated checkmark badge for installed state, offline saved surfaces card and reconnect action on `/offline`, and real-time connectivity event handling in shell runtime.

## What it is now (measured 2026-11-06)

- **Routes** (`handleQuest` in `workers/spw-quest/src/index.js`): `/` guide, `/learn`, `/build`, `/read`, `/script.spw`, `/specimens`, `/constructs`, `/pivot`, `/parser.js`, `/parser/` (`src/parser-releases.js`), `/fonts/` and `/peer/` (`workers/lib/peer-assets.js`), `/install`, `/init` (also `/init.md`, `/llms.txt`, and `/` asked for text), `/git.txt`, `/git.md`, `/quest.json`, `/prompts.json`, `/.well-known/autonomous-feedback.json`, `/robots.txt`, `/health`. No client framework; every page reads with scripts off.
- **Pin:** the site's mount is workbench `27fa1e3d` (2026-11-06), and the carried `src/parser-text.js` behind `/parser.js` follows it; the deployed worker serves `850077ab` (`b956329b`, 2026-10-27) until its next deploy. One parser release is tracked, 2026.10.13; `2026.10.13-pre.1` is on disk and ignored by git.
- **Packages:** `spw-cli`, `spw-lsp`, `spw-runtime` and `spw-seed` are all private at 0.3.0, so the only way to run Spw is the submodule plus `npm ci` inside it.
- **Inbound links:** Home, About, Now, `/topics/software/spw/`, `/about/domains/spw.quest/`, `/projects/spw-workbench/`, `/design/composition/`, `/design/catalog/systems/`, and the footer on every page (`_partials/site-footer.html`).
- **Tests:** 65 in six files under `workers/spw-quest/test/` (routes 19, note 9, releases 12, prereleases 13, constructs 8, specimens 4), plus `carry-specimens.mjs --check`; `npm run check:workers` runs them all.
- **Phone:** every room was read at 390 px, light and dark, with no overflow (wip, 2026-10-12 to 2026-11-05).

## Why it may not have been used

Hypotheses from 2026-10-12, not findings. Two of the four no longer hold: a reader can now write a line and see it read, and there is a first act smaller than installing, since `/read`, `/build` and `/pivot` answer a line in seconds with scripts off. Two still do:

1. The first reward from the language itself needs a repository, a submodule, Node 20.19+ and `npm ci`.
2. Nobody has been told to send an agent there, so the agent-facing routes go unread (O2 would give them something to read).

## Expert rooms (2026-11-08)

The visitor is treated as already onboarded, from spwashi.com or from an LLM summary. [expert-rooms.spw](./expert-rooms.spw) is the reading. Each installed page keeps one default action. The guide's stage row is the showcase: syntax joins, three headings kept in company as `{student, classmate, later}@indexing`, and a pivot whose performance sets the field to glass, matte, or paper. "I wondered about indexing" opens that headings file, where the speaker is already a line. Install steps still return to the line the visitor was holding. The improvements that row suggests are cached in [stage-fractal-differentials-2026-11.spw](../../../.spw/caches/stage-fractal-differentials-2026-11.spw). S1, E1, and M2 stay the next slices. This section opens no route.

## Next slices

**A library router (2026-11-09, proposed).** [quest-library-router](../../../.spw/caches/quest-library-router-2026-11.spw): routes as verbs over a library of lines, with two new ones, `/cluster` (lines sharing a shape at depth 1, or resonating) and `/document` (a cluster written out as one .spw file, titled by its summary, each line keeping where it came from); one selection grammar shared with factshift.center as `?q=`; a cluster acted on as a whole with lore.land's middleware verbs; a diff shown at the highest stratum it reaches (structure before source); and a taste ledger in this browser that records what a reader kept over what, at which stratum, never scored. Four wonders there hold the calls.

**Examples that use more of Spw, and fields read one body deep (2026-11-09).** The creator: update the examples "to make more use of Spw constructs and advance the runtime based on proposed features, intermediate forms, representational capacity, navigational density, opportunity for plugins, creative nuance". Measured first: half of the examples' whole statements had no body, the reading showed a field's first word only (`reach` showed `home`), and `x = word[mode]` listed a stray `=[mode]` frame. Built in `file-reader.js`: each field's `shape` runs to the end of its statement with every body inside a body folded to `{…}`, the token form of the factshift canvas's fractal summary (`line-summary.ts` there; the two can drift until the pinned reader exports `readLine`), shown in the outline; frames inside a field's span are dropped. Five examples gain a construct they lacked: syntax a nest two bodies deep (`nest = shelf{chip{ring, pill}, card{lifted}}`), loops a relay by `~>`, calibration the first `%` in front of a word, perspectives the first `&`, question a `#>wonder_ring_on_glass` address. revision (the commit form) and perform (queued for "a pattern suggests its theme") are unchanged. `check:workers` passes, 105 of 105 quest tests, with new pins on the shapes, the absence of `=` frames, and the pinned reader giving the same shapes. Taste calls: headings now reads `{student, classmate, later}@indexing` where it read `student, classmate, later @ indexing`; gradient's shape cuts mid-phrase at 96 characters; the new says sentences; blank lines. Next, the plugin seam: `fileKit(data, readers)`, each reader `(reading, source) => {term, html} | null`, serialized like `noteKit`, first a depth reader and a measure reader that makes calibration's try literal. The theory: [factshift-theory-of-mind](../../../.spw/caches/factshift-theory-of-mind-2026-11.spw).


Each is one session and one commit. None deploys; deploy is the creator's Wrangler step.

**M2. A walk trail on `/pivot`.** *Landed 2026-11-06, `584ac7eb`: `?t=` keeps five steps, drawn as `origin ~> step ~> now`. Since `cd0c0012` the page's own box keeps the trail too. The lines below are the slice as it was cut.*
- Touches `workers/spw-quest/src/pivot.js` (`pivotState`, `pivotHref`, `pivotBody`) and `workers/spw-quest/test/constructs.test.mjs`.
- `?trail=` keeps the last three to five lines walked, each cut to `PIVOT_LIMIT`, drawn at the top of the page as steps to return to. Under them is the ground-then-edge between where the walk began and where it is. `compareSpecimens` in `src/specimens.js` reads two shelf specimens that way; a typed line gets its reading from `readSpecimen` in `src/specimen-reading.js`, as `pivotsOf` already does. `&from=` stays the one step back. *Open this walk in Build* sends it to `/build?script=`, which works with scripts off.
- A proposal to make it teach: write the trail as the relay it is, `origin ~> step ~> now`. That is the same `~>` the body turn calls "make the parts a path", so a kept walk is a line the shelf can read.
- Gate: `npm run check:workers`; the look rides with the rest at the creator's phone review.
- Verify: four pivots in a row keep four steps, a sixth drops the oldest, and `&from=` still lands.

**M3. The crawl turn, or its retirement.** M named five turns and four landed. `{a}.{b}.{c}` turns one body into three closed ones, which `/constructs` files under *How lines join*, not under a body's separators. Add it as a join turn on lines whose body has parts, or retire it with that reason. Why the turns matter at all: 625 of the site's 986 route bodies use tight dots, which the parser keeps as one name (`.spw/caches/expression-projection-precipitation-2026-11.spw`, measured 2026-11-05). Gate: the dot's question, `#>wonder_compound_consistency_dot` in `.spw/conventions/compound-expressions.spw`.

**N1. Carry your own word through `/learn`.**
- Touches `stepSurface` in `workers/spw-quest/src/panel.js`, the `/learn` branch of `src/index.js`, and `test/routes.test.mjs`. `src/steps.js` stays verbatim, because the route test compares it with the workbench's `docs/learn/quest.spw`.
- The word that threads the canonical try lines is `door` (write, act, hold, ask); name, point and grow do not carry it. Panel 1 gains a plain GET field, `?word=`. With a word, the worker writes it in place of `door` in the act, hold and ask fields, and each panel's existing check reads the learner's line.
- Gate: `npm run check:workers`; with no `?word=`, every try line is byte-identical to `steps.js`.
- Verify: `/learn?word=garden` shows `~garden` and `garden[closed]{hinge, frame, key}`, and their checks pass.

**N2. Keep the finished quest.** Panel 7 gathers the learner's lines into one file. *Download as my-quest.spw* uses the POST that `scriptFile` in `src/index.js` already answers with scripts off, and *Open it in Build* uses `/build?script=`. Touches `src/panel.js` and the route test. Gate: `check:workers`. Verify: the downloaded file parses with the site's reader.

**O1. Pivot and kin from the note.** Beside each expression and each `#>wonder_*` that *What a tool reads* lists, add `pivot →` (`/pivot?line=`) and `kin →` (`/specimens?q=` on its word). A line over 200 characters gets no pivot link. Touches `workers/spw-quest/src/file-reader.js` (the kit travels to the page by `toString`), `test/routes.test.mjs` and `test/note.test.mjs`. Gate: the guide hosts the note, so the creator's look on a phone; the guard in `test/specimens.test.mjs` that keeps the guide's only shelf link in the masthead will need a deliberate change.

**O2 (was I). Spw for agents.** With `Accept: text/plain` or a `.spw` path, `/read`, `/specimens` and `/pivot` answer in Spw, and `/specimens.json` gives the shelf. An agent sent to spw.quest can then read a line and compare two beside `/init` and `/llms.txt`. Touches the routing in `src/index.js` and a serializer in `src/specimens.js` and `src/pivot.js`. Gate: worker usage is the creator's call. Verify: each answer parses with `parse` from `public/js/semantic/spw-workbench-reader.js`, and the HTML answers are unchanged.

**O3. Seed a repository with the note.** `/install` (`INSTRUCTION_SETS` in `src/quest.js`) would write the guide's note into the reader's own repository, under `.spw/quest/` there (proposed). The note lives in the browser, so this is a copy-out with scripts on; with scripts off the page points to the note's Download. Gate: what the install writes into someone's repository is the creator's call, and the drift rule below applies.

**R. Sigil physics.** Proposed on 2026-10-12, and displaced by G to M, not dropped. A fourth column in the guide's sigil table carries each mark's physical model from the `physics` field of `OPERATOR_DEFINITIONS` in `public/js/kernel/operator-detection.js`. It is carried at build time, like the peer kit, so spw.quest loads nothing from spwashi.com. Touches `OPERATORS` in `src/guide.js` and the route test. Gate: the creator reads the twelve phrases before they go public.

**S. Agent swarm coordination & rule-breaking script frontier (2026-11, proposed).**
The theory is in [swarm-distributed-memory-manifold-2026-11](../../../.spw/caches/swarm-distributed-memory-manifold-2026-11.spw). Investigates how Spw's defensive human rules (the 80-column phone monospace limit, the single-patch gate, nominal hermeticism against compound operators) become bottlenecks for autonomous agent swarms and distributed memory. Proposes six intentional rule-breaking specimens for experimental sandboxes:
- **Compound operators:** `?!hypothetical(staging)[shadow]{dry_run}` executes an active mutation in an isolated shadow frame, rolling back on failure; `~*latent_salience` marks prioritized deferred values.
- **Causal vector clocks:** `node_a.probe ~>>[agent_1:4, agent_2:2] node_b.consensus` establishes strict Lamport causal dependency across distributed swarms.
- **Ephemeral leased mutexes:** `#>cluster[lease=30s, holder=agent_beta]@node_7{exclusive.claim}` provides non-blocking swarm coordination without manual commit deadlocks.
- **Continuous Bayesian distributions:** `%belief{h1: 0.72, h2: 0.18, null: 0.10}` replaces scalar confidence with probability distributions over wonder hypotheses.
- **CRDT join lattices:** `&[crdt=semilattice_union]{replica_west.state, replica_east.state}` specifies formal conflict-free merge semantics.
- **Continuous manifold parameterization:** `field[alpha=0.87, decay=0.05]{(boon: 0.40, bane: 0.10, bone: 0.20, bonk: 0.15, honk: 0.15)}` passes 5-simplex coordinates directly to factshift.center.

**Shell: PRs 2 to 4 of the [note and shell design](./note-shell-design.md#pr-plan).** *All three landed 2026-11-08; see [expression-first.md](./expression-first.md) S0 and S1 for the departures.* PR 2 pins the reader the guide imports (`/parser/2026.10.13/reader.min.js`, tracked). PR 3 serves the service worker, and PR 4 the manifest and icons. Each PR is specified there file by file, in order. **2026-11-08:** PR 4 went first, with an install section on `/install` (menu installs need no service worker), as S0 of [expression-first.md](./expression-first.md). That file also holds the creator's asks of that day: one expression first, a gesture hand at page edges, a local registry, operators as components, and the language relay.

## Shelf, library and architecture (proposed 2026-11-06)

The creator, through the evening:
- mind readability, wrapping and cognitive overload;
- balance search and discovery as Suno and Spotify do;
- mind familiarity and customization;
- improve compact discovery, with landing pages and indexes as site design components;
- consider chopping down lines, nesting and indents;
- register custom scripts and use Spw indexing to select or sort them;
- the creator is open to a different architecture for this worker if one is now more appropriate.

**What is heavy today.** Every page renders per request from one worker that bundles the shelf data (`src/specimens-data.js`, about 600 KB). The shelf is one scrolling page of nearly a thousand lines, which is why it carries a weight test (now 275 KB).

**Proposal: static first, live where it must be.**
- **Static.** At carry time, `carry-specimens.mjs` writes the landing and index pages into `assets/`. Each page is small, cacheable and readable with scripts off.
- **Live.** The worker keeps only what changes per request: search (`?q=`), compare, pivot, build, canvas and the note.

**The shelf's landing, after Spotify and Suno.**
- **One place to start:** the search box, which already reads slot queries.
- **Two or three short rows,** each a handful of lines: pressed forms that depart from another, plans by operation, and recent page lines.
- **A grid of browse tiles,** each opening its own index page: pressed forms, the pages' lines by kind, gallery files, plans, plans by operation, and lines with a mark.
- **Grouped results:** a search answers by source, with a top result first. Depth is one tap away, never on the first screen.
- **Storefront filters, novice and expert,** read from each line's shape rather than tagged by hand. A newcomer sees lines with a word, a lens and a body first. An expert asks for compounds, marks and nested frames. The shelf's kinds (`ROUTE_KINDS` in `src/specimens.js`) already sort lines this way.
- **Tunable axes,** each a plain-word control, composable: *source* (where a line lives), *level* (novice to expert, read from shape), *noise* (common lines folded away, duplicates merged into one card with its places), and *expansion* (a line's neighbors one change away, shown on demand from the pivot). The current tuning is itself a Spw line in the address, such as `shelf[novice]{plans}<quiet>`, so a filtered shelf can be shared and read back. The creator is open to sliders and progressive disclosure. Each axis can be a slider whose stops are named in plain words (level: novice, learning, fluent, expert; noise: everything, quieter, quiet). The axes wait behind a Tune disclosure, so the first screen holds only the search, the rows and the tiles.

**Familiar and customizable.** Search sits on top; rows and tiles behave the way they do elsewhere; and the reader gets a library of their own:
- scripts registered on the device beside the one note, sorted or picked by slot query;
- recently opened lines;
- pinned rows.

The display menu (`src/display.js`) gains row and tile choices beside size, wrap, marks and spacing.

**Lines that read.** Plan lines already hang from their frame with slots indented (`cc047be5`). The editor gains a format action, **chop down**: one slot per line, nested braces indented, and **join up** to put it back. This is an action, not a display mode, because the paint must stay under the field's characters.

**Decided 2026-11-06: static first.** First slice: `carry-shelf.mjs` writes `/shelf/` (search first, the twelve operators as handles to their cards in the guide, plans by operation, browse tiles with counts) and `/shelf/plans/` (plans grouped by operation, each line hanging from its frame) into `assets/shelf/`. The worker serves them, and `check-workers` fails if they drift from a fresh render. `/specimens` stays as it is until the creator has looked.

**The design brief (the creator, 2026-11-06).**
- Precise monospace with visual hierarchy and clear alignment.
- Containers and delimiters used as structure.
- Each operator an interactive handle.
- Notion for embedded navigation and interaction: a handle on every block, pages embedded in pages, toggles, a path back. Notion's block handle and embedded page overlap with factshift.center's focal square and handle (`factshift-center/TOOLS.md`, The focal point): one handle per part that grips, opens or carries it.

The landing's handles are the first step. Next: each painted line's operator characters as handles of their own, and a line's braces drawn as the container they are. factshift.center now goes the other way, a body folded back to its braces as written ([brace-literal-local-law](../../../.spw/caches/brace-literal-local-law-2026-11.spw)), so the two can meet at one line read as text, as shape and as motion.

## Waiting on the creator

- **C. A shorter install.** The real fix is a published CLI (`npx @spwashi/spw-cli init`), a workbench decision held as `#>wonder_spw_quest_published_cli`. Until then `/install` can lead with the agent sets, one command each. A piped install script is a security call and is not proposed.
- **D. Look.** The material is settled: the site's paper (`#>wonder_spw_quest_look`). Still open, each for the creator's phone review: long install commands wrap instead of scrolling; the heading type is tight at phone width; capture legibility for screenshots and recordings.
- **E. A plan surface** at `/plan` and `/plan.json`, drawn from the workbench review. Public or not is `#>wonder_spw_quest_public_plan`.
- **H. Motion.** The same specimen read by the previous parser release and the current one, ground then edge, so a change in the language is something a reader can open. Built from public sources only: `/parser/index.json`, the workbench log between pins, and the site's `^[workbench]` commit subjects. A strip on the guide, a page for the rest, and a count of open questions in place of the plan. It needs two releases (`#>wonder_spw_quest_motion`), and the creator confirms that motion is public and the wording of every subject that goes out.
- **P. Performances: a reading kept as a line, searched by its topography.** *Idea (the creator, 2026-11-05):* highlight a passage word by word into containers, as `{chronicles} <of> (narnia)` reads a title; how subjective that is becomes the point, since two readers' highlightings are two performances of the same words. Keep each reading as a line with who and when, and search the shelf by the topography a performance implies (`(narnia)`, `<of>`), whatever words or order it used. `?a=&b=` already shows where two readings part. Depends on `brace-semantics/index.spw#wonder_brace_semantics_highlighter_then_now`: the creator is not sure the early highlighter reading was better than what replaced it.
- **Q. Typed placeholders in search.** *Idea (the creator, 2026-11-05):* `<&>` as a placeholder for a concept with a subject, so a handle is a typed hole: `*` asks only that a slot be there, `<&>` asks for a slot of a kind. What each operator means inside a hole is a language question first; the same then-and-now question holds it.

## Retired

- **A. Try before installing:** superseded by `/read`, `/build` and the editor that reads as you type.
- **B. Pin what spwashi.com runs:** done 2026-10-13; the rule from `d4e42c5b` keeps `/init` and the mount on one revision.
- **F. Show motion:** became H.
- **L's order toggle on `/build`:** not built. The answer keeps the author's order, so a toggle has no state to hold.
- **D's spiral notes** (a faint path, sigils without names): the spiral left in `e6b4b937`.

## Review prompts

Copy one into an agent. Each prompt is read-only unless it says otherwise, and none of them commits.

- *Install review*: "Read `workers/spw-quest/src/quest.js` and run the Shell set on a fresh scratch repository outside this one. Time each step to a passing `spw:doctor`, note where you stopped to think, and say whether slice C's reordering would help. Do not commit."
- *First-reward review*: "Render `/`, `/build` and `/pivot` through `workers/spw-quest/src/index.js` in node. Say what a reader can do in the first minute on each. Read `.agents/plans/spw-quest/PLAN.md` first."
- *Look review*: "Capture the guide and the install page at a phone width with the harness's phone viewport (`scripts/lib/chrome-headless-harness.mjs`, `VIEWPORTS.phone`), not a narrow desktop window. Name three changes from slice D that would most improve how it reads, with before-and-after stills."
- *Voice review*: "Read the guide's copy in `src/guide.js` and `src/index.js` against the guards below. Flag anything that sells, flatters, or names an audience. The origin paragraphs are the creator's words; leave them."
- *Plan review*: "Read this plan. Say which slice you would cut, which you would add, and what evidence would change the ranking."

## Guards

- The origin paragraphs (*The shape it came from*, 2017, the adult learning lab) are the creator's words. They speak about shape, cognition, learning and geometry: no God, no diagnostic labels.
- Operator names follow the workbench's reader vocabulary; the route test holds them to it. The creator's direction of 2026-10-11 moves the operator table into the workbench, and spw.quest reads from it once it exists.
- Drift rule: the Start strip on `about/domains/spw.quest/index.html` restates each instruction set's *does* and *keeps* (comment above `INSTRUCTION_SETS`).
- Agents do not commit, push or deploy. Deploy is the creator's Wrangler step.
- Measure phones with emulation, not a narrow window.

## Validation

- `npm run check:workers`, which runs the six quest test files and `carry-specimens.mjs --check`.
- `node --check` on touched files.
- Phone stills through the harness for any change a reader sees.
- For C, a real install on a scratch repository through `spw:doctor`.
