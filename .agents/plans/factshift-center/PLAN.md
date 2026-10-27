# factshift.center

**Status 2026-10-27.** factshift.center serves a snapshot of the factshift app. The snapshot was refreshed today to the app's latest local commit, recorded in `workers/factshift-center/version.json`. A line of Spw held in the address (`?spw=`) now lays out on the canvas as its anatomy. The app is its own repository at `workers/factshift-center/app`, gitignored here, and the ten commits from this sitting are local and unpushed. The last of them is a phone pass from the creator's live notes. It covers the focal contract, the menus, the panels, the Spw reading and most of the SVG semantics. Next: a gesture grammar, as a demo. Deploy is the creator's (Wrangler).

**Related:** [spw-quest](../spw-quest/PLAN.md) (its pivot and construct cards can open a line here) · [spw-inquiry-loop](../spw-inquiry-loop/PLAN.md) (parser releases, the capability ledger) · [brace-semantics](../brace-semantics/PLAN.md) (`[ ]` as a frame) · [spw-metaphysical-language](../spw-metaphysical-language/PLAN.md) (depth passes) · [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (peers).

operation: align (the app's canvas with the workbench's reading of a line)

## Ground and center

- factshift.com is the ground, the one readers should find familiar: oxblood and wheat, the `<concept>` title, the `[...]` shortcuts face, the square focal mark. factshift.center develops the same concepts so they are easier to work with. At the start, its proportions and layout match factshift.com. Its menus and behaviors may differ (creator, 2026-10-27).
- The live site deploys from the app repository's `main` or `netlify` branch; the creator is not sure which. The last fetch in this checkout was on 2024-10-30. The workbench research ran through the end of 2025, after that deploy, so the live app knows little of how Spw developed.
- The app is TypeScript and Vite, with a d3 v7 force simulation drawn in SVG. It compiles the workbench from source through two aliases, `spw-workbench/runtime` and `spw-workbench/parser`, both pointing into its own submodule.

```text
pins (2026-10-27)
app            main e9a390d, 77 commits past origin/main 2ba127a (fetched 2024-10-30)
app workbench  submodule fffab72, spw-workbench 0.2.0-alpha.1, 2026-03-12
site reader    public/js/semantic/spw-workbench-reader.js, v0.3.0 @ 850077a (the site's mount)
spw.quest      assets/parser/2026.10.13, v0.3.0 @ 0eb1d1c, nine commits behind the site's mount
```

## Landed 2026-10-27 (app repository, local)

- **Safety.** Tab walks nodes only from the canvas. Ctrl and Cmd never fire from text fields, so copy, paste and zoom stay the browser's. Clearing the node cache and resetting the interface now ask first. The socket opens only from its own panel, and the node save sends only on an open socket. The link tool opens http(s) addresses with noopener. htmx is removed.
- **Ground.** factshift.center now shares factshift.com's theme and layout. They measure identically at pocket width. The center's own controls sit behind the main menu. The square focal mark and `[...]` are back, and the menu's "open" subheading is gone.
- **Spw as the canvas.** `?spw=` holds a line of up to 400 characters. The line becomes the title and the heading, waits in a corner box (`#held-expressions`) where a tap reopens it in Spw mode, and runs through the workbench. Its anatomy is laid out as:
  - the word, framed by its mode as `[mode]`;
  - the body's parts on a ring inside a `{ } definition` region;
  - scene `( )` and concept `< >` in regions of their own;
  - nested bodies as regions within regions;
  - recurring words drawn in resonance.

  An anchor force keeps each part in its place.
- **Three runtime bugs** surfaced on the way:
  - Ids were rewritten from identity, so the projection's stage links failed.
  - Normalize overwrote projected fields on every reinit.
  - Regions were never drawn.

```text
24d2a48 0756029 ee0c00a   menu faces, focal mark, safety
2d0d257                   factshift.com's ground and layout
f1999d6 faf14f2 a792749   ids, ?spw=, normalize fills only what is missing
656c6e5 6b67304           regions drawn; the anatomy, title and corner box
e9a390d                   the phone pass and the interaction contract below
```

## Interaction contract

The creator set this on 2026-10-27, and the phone pass implements it. Write each new rule here as it lands.

- **The focal mark.** It lives just above the [...] box, inset 0.75rem from the canvas frame, and keeps that home as the screen changes size. A mark the reader drags or nudges is remembered. A mark never placed is not.
- **Its tap.**
  - With no menu open, a tap opens Spw (if no mode is open) and the menu.
  - With a menu open, a tap closes it and gives focus to the open mode's tool.
  - [...] also opens the menu.
- **The focal mark item** in the menu brings a moved mark home, or focuses a mark already at home.
- **Labels.** Labels are nouns or adjectives that name the thing toggled or the state left behind ("mode menu", "link force", "fixed positions"). A toggle shows its state beside its name: on or off, a count, home or moved. Hover is a hint; focus and state carry the weight.
- **Phones.** One surface at a time:
  - A mode's panel docks across the screen above the mark. It steps back while a menu is open, at every size.
  - The mode list packs three to a row.
  - Nothing widens the page.
  - Touch screens hide keyboard hints, and their buttons are 44px.
- **Tools.** Each tool keeps its own personality inside that frame, and the HTML stays simple. Margins are tight, text may be smaller to fit, and visual noise comes out (no box around each menu row).
- **The Spw panel reads its line back** as it is written: each slot by name, the bond between two expressions, the words the canvas already holds, and anything no slot read. It uses the reader the canvas lays out (`workers/factshift-center/app/src/js/modes/spw/line-reading.ts`). Its priming buttons come from a Spw without dialects or distinct representational contexts (`wonder_factshift_priming_dialects`).

Verified at 390px (scrollWidth 390 in every state) and 1440px, from the app's `dist/` in Chrome.

## Refreshing the snapshot

1. In the app, run `npx tsc --noEmit`, then `npx vite build`.
2. `rsync -a --delete --exclude='*.map' --exclude='.assetsignore' workers/factshift-center/app/dist/ workers/factshift-center/assets/`
3. In `workers/factshift-center/version.json`, update `revision` and `snapshot`, and add any new query key.
4. `npm run check:workers`, then commit in this repository when the creator asks.

Nothing scripts these steps yet. A carry script like spw.quest's is a candidate once the steps run a third time.

## Next slices

1. **SVG and UI semantics** (asked 2026-10-27). Most of it is in the phone pass:
   - The svg is a group, and its region and edge layers are hidden from assistive tech.
   - Mode buttons say aria-pressed, not aria-selected.
   - The tabpanel role and the radiogroup without radios are gone.
   - Anatomy nodes are named by word, slot and frame.
   - Enter and Space reach a node only while the node holds focus. Before, a node walked with Tab kept them, even from a focused button.

   Still open: a check in Chrome's accessibility tree, and a keyboard walk from the canvas.
2. **Canon names for the containers.** `CONTAINER_META` in `workers/factshift-center/app/src/js/modes/spw/workbench-runtime.ts` labels the eight affinities in the app's 2025 words. These are the workbench's names for them:

   | App's 2025 word | Workbench name |
   | --- | --- |
   | Void | Action |
   | Promote | Ascension |
   | Deferred | Potential |
   | Conditional | Concept |
   | Property | Definition |
   | Perspective | Scene |
   | Category | Mode |
   | Confluence | Subject |
3. **Links and forces.** The creator asked for an overhaul of the link and force physics. Each relation gets its own link distance and strength, read from the relation names the anatomy already draws, in place of one global `linkStrength`. Feel is browser-gated: this slice ends at a demo.
4. **First load.** Ends at a demo for the creator's look.
5. **Carry a dated workbench build** in place of compiling the submodule's source. `wonder_factshift_rebundle` holds the choice.
6. **From spw.quest.** Once this is deployed, cards on `/pivot` and `/constructs` can open their line here with `?spw=`.

## Open questions

`index.spw` holds them as wonders (`npm run wonder`):

- conceptual space against performative or descriptive space;
- frames and channels;
- what the canvas shows about Spw's strengths and gaps;
- what earlier parity would have grown;
- the rebundle;
- which relations pull;
- what the Spw panel's priming becomes now that Spw has dialects.
