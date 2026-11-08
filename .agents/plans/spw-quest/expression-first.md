# spw.quest: one expression first, a hand to edit it, a registry to keep it

**Opened 2026-11-08** from the creator's run of asks that afternoon. Parent: [PLAN.md](./PLAN.md). Shell spec: [note-shell-design.md](./note-shell-design.md). Each slice is one session and one commit; none deploys (deploy is the creator's Wrangler step). Gestures are sensation: each gesture slice ends at a demo the creator approves on a phone before it replaces anything on the guide.

## The asks (2026-11-08, in order)

1. spw.quest installable on mobile; `/install` makes that easy. **Landed as S0.**
2. Begin with an editable expression; page edges and tap / swipe / drag make editing it easy.
3. Easy to load a set of expressions, or register data, into a local Spw registry.
4. Language syntax and tooling improve as pragmatic interaction realities become meaningful.
5. Read `~/Development/active/lore.land` and factshift.center for trajectory and imaginative capacity.
6. Each domain a valuable product surface: audience synergies, and the wow of finding another layer's breadth and depth.
7. Spw as a quantum query language, braces as cognitive particles.
8. Every operator and delimiter as a component.
9. Pinch and swipe as fractal or modal navigation.
10. Collectible expressions, in line-oriented or file-oriented views.
11. Underused semantic and semiotic affordances on factshift.center, with d3 or gsap.
12. Image processing and clipboard: animation, screenshots, annotation, nuance, nonverbal communication, and learning how hardware changes a page.
13. Spw expressions or spells as a surface for sponsored physics, seasonal or by chance, on factshift.center.
14. The home page's default action should not assume someone has Spw. It should make Spw available, especially as a flushable precipitation of how their navigation through the site can be summarized with Spw. **Landed as W.**
15. Integrations between spw.quest and factshift.center.
16. A URL scheme that feels more readable. Propose options after considering links to spells or booklets from spwashi.com or lore.land (**U**).
17. spwashi.com grown toward a prompt aesthetic chamber, with reflections from the creator's own career to ground its stylistic capacitance (**X**).
18. Spell names should be part of the payload (**U**).
19. spw.quest would ideally be useful as an abstract language tool (**E3**, **L**).

## What already exists (sensed 2026-11-08)

- **One editor, two slot models.** `editorField` / `liveFile` in `workers/spw-quest/src/file-reader.js` (textarea over a painted `pre`, reparsed per frame). `SLOTS` / `assemble` / `segments` in `src/build.js` (mark, word, concept, scene, mode, definition). `lineFrom` / `pivotsOf` in `src/pivot.js` (charge, subject, mode, body, scope, projection, join). Both read through `public/js/semantic/expression-query.js`.
- **A gesture instrument already ships on `/pivot`.** `instrument()` in `src/pivot.js`: tap primes a slot's next value, a second tap goes there, a horizontal swipe past 36 px steps values, a two-finger pinch drops the slot, keys do the same. Pinch-to-resize text comes from `public/js/kernel/pinch-text-scale.js` through the peer kit.
- **The site's gesture vocabulary.** `public/js/kernel/gesture-measure.js` (hold 420 ms, swipe 48 px, dominance 1.45), `runtime/interaction/gesture-contract.js`, `.spw/audits/touch-gesture-contracts-2026-09.spw` (five verbs), `.spw/conventions/interaction-microstates.spw`. No page-edge gesture exists anywhere on the site.
- **One note, by design.** `spw.quest.note/1` in `localStorage` (`src/note.js`). The shell design ruled out a list and IndexedDB *for that slice*; a registry is a new decision, which the 2026-11-06 list already opened ("register custom scripts and use Spw indexing to select or sort them").
- **Nearest registries.** The site's cauldron (`spw-cauldron`, deduped by expression, 6–12 items, BroadcastChannel). factshift.center's thread `factshift.talk` = `[{line, from}]`, last 40. lore.land's `lore.almanac.v1` = `{id: {first, places}}`. The workbench keeps registries as authored `.spw` files (`.spw/registries/`) and an in-memory `RegisterBank`; there is no registry file format yet.
- **Hand-off formats.** `?spw=` (one line, 400 characters or fewer) and `#spw64=` (base64url, never sent to a server) already go both ways between spw.quest `/build` and factshift.center.
- **Borrowable feel.** factshift.center: one gesture table per target, a hold ring that adds a brace slot (`[ ]` ↑, `{ }` ↘, `< >` ↓, `( )` ↙), direction lock at 36 px, corners with one job each, a lit edge in the swipe's direction, "nothing teaches itself uninvited", found gestures counted. lore.land: an edge cue names the neighbouring section, and at a chapter's edge a second swipe within 1.8 s is required ("never one accidental flick away"); braces as in-world craft (`[]` a window, `{}` a room, `()` a gathering, `<>` a passage); "Nothing is scored"; a kept thing changes how the book looks.

## Slices

**S0. Installable, and `/install` says how. Landed 2026-11-08, `cd280779`.** PR 4 of the shell design plus the creator's change to it: `src/quest-manifest.js` (manifest, icons, head lines, the `/install` section and its script), `manifest-src 'self'` on `PAGE_CSP`, icons under `assets/icons/` (`#>` in paper on the quest teal, drawn in `quest.svg`), the phone section first on `/install` with a step per device and a link to send to a phone, a door on the guide, `test/app.test.mjs`. Install from the browser menu works without a service worker (Chrome 108+ on Android; Safari's Add to Home Screen). The **Add** button waits for `beforeinstallprompt`, which Chrome still ties to a fetch handler, so it appears once S1 lands. The page says the app needs a connection for now, and that on iPhone a note kept in Safari does not follow it into the home-screen app. Per ask 14, `start_url` and `id` are `/` (the shell design had `/?note`); nothing had been installed yet, so no app identity moved. Open: `img-src` stays absent until a phone shows an icon refused (the spec's rule).

**S1. The shell. Landed 2026-11-08, uncommitted: PRs 2 and 3 of the shell design.** PR 2: the guide imports the pinned `reader.min.js` of 2026.10.13 (`src/shell-pin.js`). On that day it gave the same token streams as `/parser.js` for all fourteen guide files and the walk. `LIVE_CSP` gains `connect-src 'self'`, and a hidden release line opens only when a newer published release exists. PR 3: `assets/sw.js`, served at `/sw.js` with no CSP, and `/offline`. Four departures from the spec, each forced by a check:
- `PAGE_CSP` gains `worker-src 'self'`, so `/install`, where the phone link lands, registers the shell too.
- `PAGE_CSP` gains `img-src 'self'`. Chrome fetches manifest icons under the page's policy, and a headless installability check reported `no-acceptable-icon` without it.
- The guide branch fetches by address with `cache: "no-cache"`. A navigate-mode request cannot take options.
- `/offline` links to the guide, not `/?note` (ask 14).

The precache also holds the manifest and icons (PR 4's list), and pages link the 192 icon as their tab icon. Tests: `test/shell-pin.test.mjs` and `test/shell.test.mjs`, the latter a fake Cache Storage in a vm. Headless, with the origin shut down after install, Chrome reported no installability errors. The guide reopened from the shell with its editor and walk. `/learn` and an unvisited example got `/offline`. Gate still open: a real install on Android and iPhone.

**W. Your walk, in Spw. Landed 2026-11-08, the commit after S0.** `src/walk.js`, `test/walk.test.mjs`. A recorder in every quest page's `<head>` adds the address to `spw.quest.walk/1`, but only in this browser. It keeps at most 40 steps, each with a day stamp and no time, and skips a reload. A step is a room plus a word when the address names one. The guide opens on the walk, precipitated into the marks it teaches:
- `#>walk` names it.
- `you@guide` says where the visitor is looking from.
- `^[walked]{… ~> …}` is the path, with the word in the brace for its slot: `<file>`, `(panel)`, `[question]`, `<line>`.
- `*room` is the room they came back to most.
- `?word(shelf)` is what they asked the shelf.
- `!word(build)` is a line they made.
- `~room` lists rooms not opened yet. These are only rooms the guide already links, so the guards on `/pivot`, `/constructs`, and the one shelf link hold.

A first visit gets `#>walk / you@guide / ~learn ~build ~forms`: Spw handed over, none assumed. Flushing works three ways. Clear empties the walk. Open in Build and Canvas carry it out by `#spw64=`, which no server reads. Copy takes the text. With scripts off, the worker paints where a walk begins, and Build opens it by `?script=`. Headless at 390 px: a seven-room walk reads whole, Open in Build fills the editor, Clear resets and keeps focus on the card, and no exceptions were thrown. Gate still open: the creator's look on a phone, and these questions:
- Is `walked` the right lens word?
- Should a step carry its day into the file (`$` substrate: time)?
- Should Clear also pause recording?

**E1. One expression first: now the walk's line.** The single editable line becomes the precipitate's own lines: each painted line a handle, edited in place, and E2's gestures act on it. With scripts off, a plain GET field and Read (as `/read` does). Gate: route test; the creator's phone look.

**E2. A hand for the line: demo at `/hand`.** A lab route, not the guide. One gesture table, keyboard parity for every row, reusing `instrument()` from `/pivot`:

| Gesture | On a slot | On the page edge |
|---|---|---|
| Tap | select; a second tap steps to the primed value | left / right edge: step back / forward through the walk (the `/pivot` trail, M2) |
| Swipe ← → | step the slot's values | edge cue names where the step lands; a second swipe within 1.8 s takes it |
| Swipe ↑ / hold | open the brace ring (factshift's directions) | bottom edge: the twelve marks as a tray; top edge: the four braces |
| Drag | carry a slot to another position (slot order, L) | drag to an edge: keep it (registry) or send it (clipboard, factshift) |
| Pinch out / in | zoom out a level / in a level (ask 9) | — |

Pinch as fractal navigation: character → slot → expression → file → registry, each level the same grammar (the line's own braces are the frames). Swipe as modal navigation: at a level, ← → move between siblings, ↑ ↓ change the lens (`[mode]`). Guided, not random: every edge shows where a step lands before it is taken, and keeps a way back. Gate: the creator approves the feel on a phone; nothing reaches the guide before that.

**E3. Every mark and brace a component (ask 8).** Each of the twelve sigils and four braces becomes one component with a single schema: glyph, reader's name, what it reads as, what the runtime does, which gestures it accepts, what it does to a slot, and its physics (slice R's `physics` field). The paint's characters become those components' handles (the 2026-11-06 design brief: "each operator an interactive handle"). Language-side, this is where the operator table moves into the workbench (Guards, PLAN.md). It also pulls spw.quest toward an **abstract language tool** (ask 19): marks, braces and the slot model as instruments that work on any text a person brings, without being tied to the site's lines. Gate: route test on the twelve and four; the creator reads the phrases.

**R1. A local registry of lines.** `spw.quest.registry/1`, one entry per line, shaped to meet factshift and lore.land halfway: `{line, from, first, places, kind}` (`kind`: `expression` or `data`). Ways in, each with scripts on: paste many lines, pick or drop a `.spw` / `.txt` file, open a `#spw64=` link, *Keep* on a shelf specimen or the E1 line. **Register data**: a JSON object or CSV row comes in as configuration lines (`=key{value}`, the `=` mark's "keep this here, under this name"), shown before they are kept. Two views (ask 10): **lines**, each a collectible card that can be searched with the shelf's slot queries (`?q=` over local entries), and **file**, the whole registry as one `.spw` file in the editor. Out: Download, copy, and `#spw64=` to factshift.center. Storage starts in `localStorage` with a count and a size cap. IndexedDB only if the cap binds. Gate: the creator chooses the entry shape and whether data import ships with lines or after.

**L. The language relay (asks 4 and 7).** Interaction findings go to `.spw/reviews/upstream-workbench-recommendations` as asks, never into `.spw/_workbench`. First candidates:
- **Quantum query.** A query line holds its readings open until a brace measures it: `~` already defers (potential), `?` opens a question that can close, `%` measures, `*` collapses. Braces as cognitive particles: each brace is the particle a reading collapses onto. P (performances) and Q (typed holes, `<&>`) are this question already. Prime only; no grammar change from a page.
- **Gesture-born forms.** If E2 shows that people reach for a form the grammar lacks (a slot move, a nesting step), that becomes a numbered ask with the gesture that found it.

**U. Readable addresses (asks 15, 16).** Today a line travels in five forms:
- `/build?script=`, `/pivot?line=` and `/read?line=` on spw.quest;
- `#spw64=` both ways between spw.quest and factshift.center;
- `/canvas?s=` for a shelf specimen;
- `?spw=` on factshift.center;
- `?spell=` on lore.land.

The options the creator was offered on 2026-11-08 cover named spells (`/spell/frost-hearth`), perspective paths (`/@lore.land/night-school`), a plain-text fragment (`#spw=garden[care]{seed}`, with `#spw64=` kept for files), and booklets as ordered spells (`/booklet/boon-2/3`). Choosing one is the creator's call. **Names ride in the payload** (ask 18): a spell's name is its own `#>name` line, as the walk's is `#>walk`. Any address that carries the text therefore carries its name. A readable path such as `/spell/frost_hearth` is derived from that line and never looked up in a registry, so a link works on any site that reads Spw. Each choice keeps the old forms answering. Integration rides on the choice: a walk, a registry entry, or a booklet page opens on factshift.center by the same readable address.

**X. Domains as product surfaces (asks 5, 6, 13, 17).** spwashi.com as a prompt aesthetic chamber: pages that hand a reader a prompt in Spw, with the creator's own career reflections as the ground that gives a style its charge. That is the person behind the three surfaces, so the chamber is where the wow of depth is anchored. It needs its own plan on spwashi.com's side, opened with the creator's words, never ghost-written reflections.  spw.quest teaches the notation; factshift.center makes a line physical; lore.land makes the notation a craft inside a world; spwashi.com is the person behind all three. The wow is the same line turning out to be deeper on the next domain: a line learned here opens as a canvas there (that hand-off exists), and could turn up as a brace-box in lore.land's night school. Shared ground: `?spw=`, `#spw64=`, and R1's entry shape. Every cross-domain link is opt-in and goes through the address, with no server between them. **Sponsored physics** (ask 13): a season's, or a chance-drawn, physics preset written as a spell line on factshift.center, with credit carried in its `@` perspective. Anything financial or sponsored goes to the creator for wording before it is public.

**F. factshift.center affordances (ask 11).** Under its own plan (`.agents/plans/factshift-center/`). Candidates: sigil as force (R's physics: `~` a soft deferred spring, `!` an impulse, `#` an oscillation, `%` damping, `=` a pin, `.` gravity to a baseline), brace regions as hulls that carry a consequence (its own rule), and transitions that show a collapse (`*`). d3 is already there. gsap would be a new package, which needs a plan note and the creator's review.

**I. Image and clipboard (ask 12).** Copy a line as text, as a link, or as a PNG of its paint (capture-legible, for the creator's Grok and Midjourney workflow). Paste an image to annotate it with lines. Keep a small receipt of what the device offers (pointer, hover, pinch, clipboard image write), so differences between hardware become something the site can learn from instead of something it guesses. Gate: no image leaves the device without an action.

## Order

W landed first. S1 and E1 are independent and can go next. E2 needs E1. E3 and R1 each need E1 and can run side by side. L, X, F and I are primes that slices feed. The creator's questions: W's three, E2's feel, R1's entry shape (a walk step `{room, detail, kind, day}` already meets it halfway), and X's sponsored wording.
