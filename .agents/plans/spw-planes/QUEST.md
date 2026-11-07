# spw.quest between the planes (2026-11-07)

One of four reports in the planes pass. This one is about spw.quest, the place that joins spwashi.com (pages, chips, cards, the cauldron) and factshift.center (a line as a field of nodes), and about the public copy that explains Spw. Probes were run live and read-only. Stills are in `design/components/captures/spw-planes-2026-11-07/quest/` (gitignored). Probe scripts are in the session scratchpad under `planes-quest/`.

## 1. What I tried

The round trip, live, at phone size (390×844, touch):
- R1 `https://spw.quest/build`, on open: `draft.spw` holds `!draft<chapter>(study)[second_pass]{voice, scene, turn}`. The foot shows *Link to this file* and *Open on factshift.center*. Still: `01-build-open-phone.jpg`.
- R2 Typed `garden[care]{seed; water}`, Enter, `?harvest{when}`. *What a tool reads* followed ("? harvest wonder"). *The first line, taken apart* still showed `!draft…`, and its *Open on factshift.center* (`?spw=`) still carried `!draft…`. Still: `02-build-typed-phone.jpg`.
- R3 Tapped *Open on factshift.center* (151×21.5 px). The same tab went to factshift.center, the fragment was cleared, and the address became `?spw=garden[care]{seed;+water}`. Both lines arrived in the thread ("2 from a link"), and the first one was held. But the Spw window stayed closed (0 px), so only the first line was on screen. Still: `03-factshift-arrive-phone.jpg`.
- R4 Tapped ◎, the focal square (26×26 px). The Spw window opened with "lines · 2" and both rows, each marked "a link". Still: `04-factshift-thread-phone.jpg`.
- R5 Tapped ↗ on `?harvest{when}` (20×36 px). It called `window.open(…, "_blank", "noopener")` with `spw.quest/build#spw64=P2hhcnZlc3R7d2hlbn0`: one row, in a new tab.
- R6 Opened that address. It made two loads: `/build`, then `location.replace` to `/build?script=%3Fharvest%7Bwhen%7D#reading`. The editor held `?harvest{when}` (`harvest.spw`), the page was scrolled to the reading (scrollY 584) with the editor off screen, and `garden…` did not come back. Still: `05-build-back-phone.jpg`.

Other receipts:
- `/pivot?line=garden[care]{seed; water}` at phone size. The parts are 48 px tall. One tap on `[care]` primed "the lens: turn its walls to ( ) (1 of 6). Tap it to go there. garden{seed; water}(care)", and the readout pushed the page below it down. A second tap went there, and the trail read `garden[care]{seed; water} ~> garden{seed; water}(care)`. Stills: `06-pivot-before-phone.jpg`, `07-pivot-tap-phone.jpg`.
- `https://spw.quest/` at desktop size (1366×900). The first screen holds the H1, the lede, "11 files, written in Spw: a bench, a study, and a board", `lab-notebook.spw` and *Canvas*. The console shows `ReferenceError: __name is not defined at noteKit`; after an edit nothing was in localStorage, and a reload brought back the template. Still: `08-guide-desktop.jpg`.
- On the guide at desktop size, I clicked *Canvas* (no still). factshift held `^"stream"{>>[2026-11-06 09:10] catalog — …}` as one line, with nodes labeled "in three dialects on one screen: pill", "ring", ">>", "plain" and "the".
- `/forms/` at desktop size: 31 rows and no factshift links. `garden{seed.water}` wraps at the dot, to `garden{seed.` / `water}`. Still: `09-forms-desktop.jpg`.
- On factshift (desktop), I opened each of the four joins with `?spw=`. Each drew three nodes (garden, seed, water). The dot drew a tight pair (`line-anatomy.ts:246`).
- `spwashi.com/about/domains/spw.quest/` at desktop size. The lede reads "opens with a guide … twelve sigils, and the four brace pairs." Still: `10-spwashi-domain-desktop.jpg`.

## 2. The plane's theory as it stands

- On spwashi.com, spw.quest is described as a guide: `role = guide`, "paced path into Spw … read the sigils, copy one setup, stop before a commit" (`.spw/domains.spw:144`); "Paced guide into Spw" (`index.html:1177`); "Set up the Spw workbench in your own repository" (`_partials/site-footer.html:177`); "Quest is the path; texture is the grain" (`about/domains/spw.quest/index.html:56`).
- spw.quest's own plan describes a workshop where the physics is felt: "the state of a page lives in its address" and "focus and hover charge a thing, a landing settles it, and nothing on the page jumps" (`.agents/plans/spw-quest/wip.spw:173-174`), felt but never named (`:178`). The creator's brief sets Notion's block handle beside factshift's focal square (`PLAN.md:101-105`).
- The passage is a codec that "never reaches a server" (`workers/spw-quest/src/build.js:122-127`; `spw-talk.ts:5-9`). brace-semantics §E plans a home door on the fragment, so that clipboard text stays out of worker logs (`.agents/plans/brace-semantics/PLAN.md:128-136`). §F lists what factshift taught: lifecycles, primed and actualized states, the codec, and the thread as the cauldron's shape (`:145`).
- The grammar already flows out of spw.quest. factshift's operator table copies the guide, "in spw.quest's guide order, with the guide's words" (`operators.ts:1-3`; `guide.js:7-20`). spwashi.com names three operators differently: integration, binding and normalization (`public/js/kernel/operator-detection.js:89,179,209`).
- There are three readers: spwashi.com's, the copy spw.quest carries, and factshift's own `line-anatomy.ts` on a March workbench (`.agents/plans/factshift-center/PLAN.md:180`).
- The trichotomy is already in spw.quest as the charge slot: boon, bane, bone, bonk and honk (`pivot.js:20`). bone.land is "the structural carrier … where boon and bane act" (`.spw/domains.spw:79`).

## 3. Where theory and surface disagree

1. The return leg reaches the server. The comment says it never does (`build.js:124`), but `readSpw64` reloads as `?script=` (`build.js:144`). That is a second load, it lands mid-page, and it defeats §E's reason. §E also names `#script=` (`brace-semantics/PLAN.md:135`), while the code uses `#spw64=`.
2. A file goes out and one row comes back. ↗ sends only `row.line` (`spw-talk.ts:155`), so the thread's other lines are dropped.
3. The arrival is hidden. Lines land in a closed Spw window, and the held chip gives no sign that a second line came.
4. `/build` has two links named *Open on factshift.center*. One carries the file by fragment (`build.js:463`); the other carries the first line by `?spw=` (`:473`) and goes stale while you type. The lede says "the reading follows", but the taken-apart line does not, and the hint that Read refreshes it is hidden on touch (`build.js:493`).
5. "Nothing on the page jumps" (`wip.spw:174`), yet the back leg makes two loads and lands at `#reading`, and `/pivot`'s readout pushes the content below it down (06 to 07).
6. The guide promises "keep it as your note" (`index.js:353`), but the live note does not boot. The `__name` shim comes from `workers/lib/shell.js:411`, and on the live page it sits at line 1535, after `noteBoot` at line 708 (`index.js:380` places it).
7. The guide's *Canvas* sends a whole file to a canvas made for "one concept, not a file" (`factshift root.ts:33`), so prose turns into nodes.
8. Forms says "One name. The dot keeps seed.water whole" (`forms.js:18`). The appendix wraps at that dot, and factshift draws two nodes held close.
9. `< >` reads "What this is about" (`guide.js:24`). Forms and pivot say it is where the line goes (`forms.js:31`; `pivot.js:30`), and `&` also claims "about" (`guide.js:16`).
10. spwashi.com describes the guide as it was before the cut (`about/domains/spw.quest/index.html:50`; `:65` lists five rooms and no Forms; the home card; the footer). "the prompt lives on spw.quest" (`index.html:1203`) links to spwashi.com's own page.
11. `/pivot`, the instrument closest to the canvas, has no door to it (`factshift-center/PLAN.md:211` expects one).

## 4. Proposals

**(a) Theory.** spw.quest is the bench between the planes, and its grammar is bone: the carrier both planes act on.
- On spwashi.com, a line becomes a card among pages (ecology). On factshift, it becomes a field with charge (physics). On spw.quest, it stays a line on paper, held in an address: written there, turned one slot at a time, and carried.
- The grammar counts as shared only where the readers agree. Today they part on the dot, on `< >`, and on three operator names.
- So the answer is a workshop that holds the grammar, with a door on each side: `spw_quest[bone]{write; turn; carry}(address)<page, canvas>`.
- The copy promises three different things: spwashi.com a guide (grammar lessons), spw.quest a workshop ("yours to change"), factshift an editor. Only two link labels promise the passage.

**(b) Interactivity: the passage.**
1. Boot the note: put the `__name` shim in `layout`'s head (`workers/lib/shell.js`), or ahead of `noteBoot`.
2. Read the back leg in the page. `readSpw64` fills the editor, reads it there, and uses `replaceState` to `/build`, with no `?script=`. The first screen is then the editor with the line taken apart.
3. Make ↗ carry the thread as a file, with the tapped row first so that row is the one taken apart.
4. On arrival by link, open the Spw window on factshift, or show "2 from a link" on the held chip.
5. Give each door on `/build` one name. The line link either updates as you type or folds into the file link.
6. Use the same tab in both directions, and keep browser back working. A new tab breaks the way back.
7. Point the guide's *Canvas* at the file's first line-shaped expression, or show it only on files that have one.
8. On `/pivot`, reserve the readout's space from first paint (brace-semantics §D), and add *see it drawn* to the primed line.
9. §E's home door: add a third exit beside "Have some Spw?" (`index.html:152`) that sends `#spw64=` to `/build`.

**(c) Public copy, current → proposed.**
1. `index.html:1177` "Paced guide into Spw. Public contract for agents: constructs, sensors, and what not to fork." → "A bench for Spw: write a line, turn it a slot at a time, and carry it to a page or a canvas."
2. `about/domains/spw.quest/index.html:50` "spw.quest opens with a guide to the Spw language: one page to read, the twelve sigils, and the four brace pairs." → "spw.quest opens on files written in Spw, a bench, a study and a board, each yours to change, with what a tool reads beside it."
3. `about/domains/spw.quest/index.html:65` "Beside the guide, five rooms take a line of Spw and let you turn it." → "…six rooms…", plus a Forms row in spw.quest's own words: "Lines that differ in one thing, and what that thing does." (`forms.js:109`).
4. `_partials/site-footer.html:177` "Set up the Spw workbench in your own repository." → "Write a Spw script and take it apart."
5. `index.html:1203` "the prompt lives on spw.quest" → "the prompt lives on the spw.quest page".
6. `build.js:463` "Open on factshift.center" → "Open the file on factshift.center"; `build.js:473` "Open on factshift.center" → "Draw this line on factshift.center".
7. `guide.js:24` `< >` "What this is about." → "Where it goes." The route test may hold this line.
8. `.spw/domains.spw:144` "paced path into Spw. Live at spw.quest: read the sigils, copy one setup, stop before a commit." → "bench for Spw scripts between this site and factshift.center: write, turn one slot, carry by link; install stops before a commit."

**(d) Workbench asks** (to be recorded on this repo's side, in `.spw/reviews/upstream-workbench-recommendations.spw`).
1. One operator table with names, readings, runtime, physics and brace names, read by spw.quest, factshift and spwashi.com.
2. One codec: `toSpw64`/`fromSpw64` and the `#spw64=` fragment grammar. Today it is written four times (`build.js:128,139-142,378-382`; `spw-talk.ts:39-50`).
3. One splitter, `expressions(text)`, for a file's top-level expressions. Today `spw-talk.ts:53-72` counts braces by hand.
4. One reader for body joins, with `FORMS` (`forms.js:13-64`) as its conformance set: every reader names the join it sees on each row.

## 5. Material and value

- **Made of:** plain text on the site's paper; a line held in an address; a fragment that carries a file to the other site, meant never to reach a server; a note kept in the browser.
- **Behaves:** every room reads with scripts off; one slot changes while the rest hold; a turn is shown before you take it; the trail keeps the way back.
- **Role:** bone. It holds the shape; the site gives that shape a body, and the canvas gives it force.
- **To an academic reader:**
  - Spw began in a 2017 Learning-from-Text course, built to find where two people's understandings stop sharing ground. Holding two readings side by side shows their shared ground first, then the slot where they part (`topics/software/spw/index.html:949`).
  - The forms appendix is a set of contrasting cases: lines that differ in one thing. The round trip shows one text in two representations, words and a field.
  - For notation research, three readers of one grammar disagree in measurable places, and each disagreement is a finding.
- **To a business reader:**
  - A line is a brief. `/build` opens on `!draft<chapter>(study)[second_pass]{voice, scene, turn}`, which reads as an editorial brief.
  - A product or A&R lead writes one and sends a link, and a collaborator answers by turning one slot. The trail keeps each turn as a receipt in the address.
  - No account is needed, and once the back leg is fixed, no server sees the brief. Nothing here is a financial claim.

## 6. Wonders

```spw
#>wonder_spw_planes_back_leg
?["Does a script that comes back from the canvas reach spw.quest's worker?"]{
  ~#expect: "Yes: readSpw64 reloads as ?script= and lands on the reading." ~#unblocks: "spw-quest PLAN; brace-semantics §E"
  ~#probe(run) !probe{ "rg -n 'location.replace' workers/spw-quest/src/build.js" }
  $%[in_page, query]
}
#>wonder_spw_planes_note_boot
?["Does the live guide keep a note?"]{
  ~#expect: "No: the __name shim loads after noteBoot, so an edit is gone on reload." ~#unblocks: "spw-quest PLAN, note-shell PR 2"
  ~#probe(run) !probe{ "curl -s https://spw.quest/ | grep -n 'var __name\\|function noteBoot'" }
  $%[shim_first, boot_first]
}
#>wonder_spw_planes_dot
?["Do spw.quest and factshift.center draw a dotted body as one name?"]{
  ~#expect: "Both read ident; factshift draws two nodes held close, and /forms/ wraps at the dot." ~#unblocks: "spw-quest M3; compound-expressions#wonder_compound_consistency_dot"
  ~#probe(run) !probe{ "node --input-type=module -e \"const q=await import('./public/js/semantic/expression-query.js');console.log(q.readBodyJoins('seed.water'))\"; then hold factshift.center/?spw=garden%7Bseed.water%7D and count nodes" }
  $%[one_node, bonded_pair, two_parts]
}
#>wonder_spw_planes_thread
?["Should ↗ carry the whole thread, or one row?"]{
  ~#expect: "The thread, tapped row first: a reader who sent two lines looks for two." ~#unblocks: "factshift-center PLAN slice 6; spw-quest PLAN"
  ~#probe(read) !probe{ "on a phone, send two lines from /build, take one back with ↗, and say which line you looked for first" }
  $%[row, thread, row_first]
}
#>wonder_spw_planes_bone
?["Is spw.quest bone to the two planes, the carrier where boon and bane act?"]{
  ~#expect: "spw.quest sits on bone easily; which plane is boon and which is bane is the harder call." ~#unblocks: "ecosystem-architecture PLAN; .spw/domains.spw:144"
  ~#probe(read) !probe{ "read .spw/domains.spw:77-79 beside each host's first screen, place all three, and name the placement that felt forced" }
  $%[bone, path, bench]
}
```

## 7. Questions for the creator

1. Which word should spw.quest answer to: bench, path, or guide? The register says `role = guide`.
2. Is the ecology on the boon side (arrival, growth) and the physics on the bane side (cost, boundary, decay)? Or does the trichotomy stay inside each line, as the charge slot?
3. Should the passage keep one tab or open a new one?
4. Should the canvas ever take a whole file, or only a line?
5. The dot: one node with a seam, or two nodes bonded?
6. `< >`: "what this is about", or "where it goes"?
7. Should home link to spw.quest itself, or keep the domain page as the door?
