# texture.website — realm packs, dimensions, and a tour of the web's tropes

**Asked (2026-11-11).** The creator: make texture.website useful for lore.land's assets; clonable realm packs per account, spwashi first, the folios as textures; textures updated and edited algorithmically; shaders and frames as a product surface with unlockables, collectibles and drops; a more extensible URL; a set of creative textures and a set of broad, simple ones; intricate neogenres; Spw expressions as navigation across the ecosystem. Not a fan of the first seven textures or of /tomorrow as a route: the page should feel like an academic graphic-design slide whose dimensions are tuned in a minimal, geometric interface, days ahead or behind among them. Discovery partly by guessing, later read through autonomous.feedback. Packs that theme other sites, carried on a Spw card. A test bench for components, designs and shaders. A tour of HTML features and tropes, documented on trope.wiki. An architecture other domains can repeat.

**Where it stands.** `workers/texture-website` is files only (`cluster.json` tier files), live at texture.website since 2026-11-11. `src/materials.js` is the material list; `carry.mjs` writes the readings; `assets/texture.js` reads the address in the browser. Direction caches: `.spw/caches/texture-website-redesign-2026-11.spw`, `.spw/caches/ecosystem-direction-2026-11.spw`.

## The page: a slide with dimensions

- One frame, 16:9, like a figure in a design lecture: a figure number, a title, a caption, the composition, and rulers that name each dimension's value.
- Dimensions, each a query key and a control in a geometric panel: `d` days from today (signed), `s` scale, `a` angle, `g` grain, `w` warp, and per layer its law. The address is always the current state, so any slide can be shared or guessed.
- No route names a day. `?d=+3` or `?day=2026-12-01` does.

## Textures, in sets

- **Broad and simple** (procedural, no image, every dimension tunable): grid, dot screen, hatch, stripes, checker, ramp. Built first, as the neutral ground every pack can use.
- **Creative** (images, chosen by the creator): the folios as spwashi's pack. Candidates are the weeks opened in `public/data/folio-highres.json`, for example "magenta wash pencil eye", "late night scene workshop", "dang literal boon land". Scene use leads: each texture says which scene it furnishes (a wall, a floor, a sky, a costume, a page).
- **Neogenres**: a pack can be a genre in the making, named by its materials and laws, so a pack is a proposal for a look.

## Realm packs and accounts

- A realm is an account's library, at `/@spwashi/`; a pack is a named subset, `/@spwashi/folios/`. Packs are files: a pack's `.json` lists its materials, laws and frames.
- Cloning is copying a pack's file into another realm under a new name, with its lineage kept in the file. No server accounts at first: a realm is a folder carried at build time, and spwashi is the only one until others are invited.

## Shaders, frames, drops

- A shader is a named algorithmic edit (an SVG filter or a fragment program) with its dimensions; a frame is a border and its typography. Both are files and both are collectible.
- Drops: a pack, a shader or a frame released on a close, at a dated address; unlockables are revealed by a Spw line carried in (a static map from line to item, as in `.spw/caches/pie-loop-memory-2026-11.spw`); nothing is gated that must stay private.

## Across the ecosystem

- **Spw as navigation**: a pack's line (`~folios[spwashi]{magenta-wash, ...}`) on a card; carried to another site, that site's pages read it and theme themselves for the day, or keep what the reader pinned.
- **Discovery by guess**: any word in a path is tried as a material, a pack or a realm; a near miss answers with what is close. Guesses that miss are worth reading: later, the cluster's inbox (autonomous.feedback) can count them, with the reader's consent, never their identity.
- **A test bench**: each pack and shader renders a fixed set of components (a card, a button, a quote, a table) so a design is tried on real parts.
- **A tour of HTML**: each slide can be one HTML feature or web trope (details and summary, the dialog, popover, the marquee's memory, the guestbook, the hit counter) drawn in the pack's material; each links to its trope.wiki entry, so trope.wiki documents what texture.website shows.

## factshift.center as the design table (planned 2026-11-11)

texture.website says what a surface is made of; factshift.center arranges things in space. Together they are a design tool:
- **One line, two readings.** A composition's Spw line (`sea-glass{~frost-ferns}[lamplight, worn, as-found]`) opens on the canvas by `?spw=`, as every texture card already writes it; a canvas body led by a material word takes that material's sketch as its fill, read from `/vocabulary.json`.
- **One table of marks.** The canvas's laws and texture's relations are the same nine marks; publish one `laws.json` both read, so `~` drifts on the canvas and drifts through in a prompt.
- **Arrange, then prompt.** Bodies placed on the stage become a scene prompt (what is beside, above, inside what), and a canvas still becomes a square style card marked with its day.
- **Steps:** a "canvas" action on the card; the canvas reading `vocabulary.json` for fills; the shared mark table; a scene prompt from a canvas line. Each lands in its own repository (the canvas app is its own); feel stays the creator's to judge.

## brainstorm.monster as a character workshop for lore.land (planned 2026-11-11)

- **What it is.** brainstorm.monster, a held name today, becomes a workshop where a character is drafted as materials and traits: a costume from texture's textile and metal classes, a palette from a style card, a scene from StoryDesigner@, a sheet in the RPG character-sheet form the site already uses as a profile.
- **What it is not.** It drafts tools and prompts, not lore.land's characters: lore.land's cast and its character designs are the creator's and its agent's (Lndr's design is the creator's to redo). Characters drafted here are composites, never identifiable people.
- **The handoff.** A character leaves as a Spw card (a line and its square card) carried to lore.land by `#spw64`; lore.land decides what to accept. Asks for lore.land go to its agent, never as edits from here.
- **Steps:** brainstorm.monster as a file-only unit (the runbook's held-name step, carried with `workers/lib/carry.js`); a costume ladder set in texture's vocabulary; a character card; the handoff format agreed with lore.land's agent.

## A pattern other domains repeat

A domain in focus gets: a files-only unit (`cluster.json` tier files), a material or content list in `src/`, a carry that writes every reading by extension, a page that reads its address in the browser, a fingerprint before and after (`npm run workers:fingerprint`), and a plan here. texture.website is the first; attention.productions and the held names follow it in `.agents/plans/ecosystem-architecture/PLAN.md`.

## Slices

1. **The slide and its dimensions** (landed 2026-11-11, 28daa252). **Then a prompt studio** (2026-11-11): the seven image textures retired; `src/vocabulary.js` holds 65 material words in ten classes with qualities and science notes; any path word is a material; marks are relations in the sentence; plain sliders gave way to word ladders (scale, light, wear, process, scene, format), each word written into the prompt, with rolls and class neighbours to swap; the sketch is a class's drawn base in the word's hue, lit, worn and printed by an SVG filter built from the ladders; the page writes a Midjourney prompt, a plain prompt, a Spw line and the address. Basic tuning sliders wait for spwashi.com's profile framing and card pipeline.
1b. **Pivots, views, techniques** (2026-11-11): the card with readings by extension and ladders in bands with locks; 91 materials in eleven classes (phenomena added: frost ferns, salt bloom, oil sheen); a lens ladder of genres in the making; ten pivots (invert, permute, weigh, chaos, weird, stylize, raw, sref random, seed, lens), each teaching a technique tied to Midjourney's docs, with a record of techniques tried kept in the browser and forgettable; three views as a first path word, `minimalist@`, `prompt-engineer@` (the prompt's anatomy) and `story-designer@` (a setting, a moment and a trace); no model version written, so the account's default (V8.2 by third-party guides) applies.
1a. **Formerly**: `?d=` replaces /tomorrow; the slide frame; the geometric panel; grain and warp as an SVG filter; the broad and simple procedural set.
2. **The spwashi realm**: `/@spwashi/` and the folios pack, once the creator chooses the folios and their scene uses.
3. **Shaders and frames as files**, with one drop.
4. **The component bench and the first HTML tour slides**, each linked to trope.wiki.
5. **Packs carried on a Spw card** to one other site that themes itself by it.
6. **Guesses and near misses**, then their count through the inbox.

Validation: `node --test workers/texture-website/test`, `npm run check:workers`, `npm run check:local`; a local preview of each slice before deploy, which is the creator's call.
