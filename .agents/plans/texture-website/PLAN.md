# texture.website — realm packs, dimensions, and a tour of the web's tropes

**Asked (2026-11-12).** The creator: make texture.website useful for lore.land's assets; clonable realm packs per account, spwashi first, the folios as textures; textures updated and edited algorithmically; shaders and frames as a product surface with unlockables, collectibles and drops; a more extensible URL; a set of creative textures and a set of broad, simple ones; intricate neogenres; Spw expressions as navigation across the ecosystem. Not a fan of the first seven textures or of /tomorrow as a route: the page should feel like an academic graphic-design slide whose dimensions are tuned in a minimal, geometric interface, days ahead or behind among them. Discovery partly by guessing, later read through autonomous.feedback. Packs that theme other sites, carried on a Spw card. A test bench for components, designs and shaders. A tour of HTML features and tropes, documented on trope.wiki. An architecture other domains can repeat.

**Where it stands.** `workers/texture-website` is files only (`cluster.json` tier files), live at texture.website since 2026-11-12. `src/materials.js` is the material list; `carry.mjs` writes the readings; `assets/texture.js` reads the address in the browser. Direction caches: `.spw/caches/texture-website-redesign-2026-11.spw`, `.spw/caches/ecosystem-direction-2026-11.spw`.

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

## A pattern other domains repeat

A domain in focus gets: a files-only unit (`cluster.json` tier files), a material or content list in `src/`, a carry that writes every reading by extension, a page that reads its address in the browser, a fingerprint before and after (`npm run workers:fingerprint`), and a plan here. texture.website is the first; attention.productions and the held names follow it in `.agents/plans/ecosystem-architecture/PLAN.md`.

## Slices

1. **The slide and its dimensions** (landed 2026-11-12, 28daa252). **Then a prompt studio** (2026-11-12): the seven image textures retired; `src/vocabulary.js` holds 65 material words in ten classes with qualities and science notes; any path word is a material; marks are relations in the sentence; plain sliders gave way to word ladders (scale, light, wear, process, scene, format), each word written into the prompt, with rolls and class neighbours to swap; the sketch is a class's drawn base in the word's hue, lit, worn and printed by an SVG filter built from the ladders; the page writes a Midjourney prompt, a plain prompt, a Spw line and the address. Basic tuning sliders wait for spwashi.com's profile framing and card pipeline.
1a. **Formerly**: `?d=` replaces /tomorrow; the slide frame; the geometric panel; grain and warp as an SVG filter; the broad and simple procedural set.
2. **The spwashi realm**: `/@spwashi/` and the folios pack, once the creator chooses the folios and their scene uses.
3. **Shaders and frames as files**, with one drop.
4. **The component bench and the first HTML tour slides**, each linked to trope.wiki.
5. **Packs carried on a Spw card** to one other site that themes itself by it.
6. **Guesses and near misses**, then their count through the inbox.

Validation: `node --test workers/texture-website/test`, `npm run check:workers`, `npm run check:local`; a local preview of each slice before deploy, which is the creator's call.
