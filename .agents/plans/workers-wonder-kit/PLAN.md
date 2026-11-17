# Plan: workers-wonder-kit

**Status 2026-11-16.** The plan now owns the set as well as the shell: the seven hosts the ring draws, and what their pages share from `workers/lib` (`set-ring.js`, `pinch.js`, `text-scale.js`, `png.js`, `shell.js`, `carry.js`). attention.productions, mutex.buzz and tealstripesvibes.com became file units on 2026-11-16 and carry the ring and both pinches; wap.mom installs as an app. Landed lines are below. S1 landed by another road on 2026-11-11 (`2d6c543a`): both workers take `escapeHtml` and `securityHeaders` from `workers/lib/http.js`. S3, the hold's one writer, lands in this patch (`workers/lib/hold.js`): mutex and tealstripes call it, and factshift's `liveLines` keeps its own copy. Next slice: S4, the rest of the ring, which waits on the creator for which doors have a sentence. Deploy stays the creator's.

**Related:** [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (what may travel, and the stays-home table; cites S3 and S5 here) · [factshift-center](../factshift-center/PLAN.md) and its [hub.spw](../factshift-center/hub.spw) (the canvas's side of the set; HUB.md is its door) · [spw-quest](../spw-quest/PLAN.md) · [texture-website](../texture-website/PLAN.md) · [smut-today-crew](../smut-today-crew/PLAN.md).

Operation: prime. Fixity: experimental.

## Public goal

The workers each carry a whole site. Make the part they share one kit, and keep each site's voice its own. Since 2026-11-16 that shared part includes moving between them: an expression travels from site to site, and each site changes one thing about it and shows it in its own medium.

wap.mom aims at mothers who hold master's degrees and professionals who own verticals and brands; the domain does the wink, the copy earns the reader. smut.today is a daily zine for adults; its wonder is pacing and variety. attention.productions is about the pictures and the shot, never about who makes them. mutex.buzz is the lock: one concept in the frame, a bee, three holds in ordinary words. tealstripesvibes.com is a proof card of stripes.

## Landed 2026-11-16

- File units, so a day's request limit (error 1027) stops nothing static: attention.productions `96d65b76`, mutex.buzz `856d93ab`, tealstripesvibes.com `3e565a20`. Each answers by a Worker Route now (the apex is a CNAME, so a custom domain was refused).
- Installable, readable offline: mutex.buzz `8abc691d`, wap.mom `2435e684`, tealstripesvibes.com in `3e565a20`.
- The ring `27c7a03e`: a dot for each host, the one you are on lit; opened, each says in a line what it would carry, and its link carries it.
- The picture's pinch `864bc8bc`: factshift.center's thresholds and cue words on the viewfinder, the dial and the stripes.
- The words' pinch `6f001c50`: spwashi.com's `pinch-text-scale` through the peer kit, its ladder 70% to 120%, kept on the device and applied before paint.
- tealstripesvibes.com: `/@lock` fills the lock's seed in from the ground an hour at a time `e9b36d7d`; the mask as six named chips `145546e3`; an escaped `/@` read as written `4febe319`.
- factshift.center: the title attention.productions rolls in a viewfinder `6f0e2648`, entering it comes through the lens `73c808a0`, a sent shot plays as its dailies `f4e9ea9d`; the title mutex.buzz reads the lock `02fb6d21`.

## Design considerations

Read off what shipped on 2026-11-16 and off Grok's note the same day, first HUB.md and now [hub.spw](../factshift-center/hub.spw). This repo's live plans had no such section; the form is the workbench's (cognitive, ergonomic, aesthetic). Where the two readings disagree, the question is a wonder in `index.spw`, not a rule here.

### Cognitive

- **One expression travels; the medium stays home.** A site changes one thing about the line and shows it its own way: the lock spends the hour, the shot spends the viewpoint, the stripes spend which facets show, the canvas spends a joint, the quest spends a slot.
- **What each site spends, changes and shows** (from Grok's `hub.spw` marks and flow, set against what shipped):

  | site | the mark it spends | what the line gains | what the page shows | the ring's carry from the hold, as built |
  | --- | --- | --- | --- | --- |
  | mutex.buzz | `.` the folio, `%` the hour, `!` the hold | the two live lines | one concept, at rest | the ground itself |
  | attention.productions | `@` a viewpoint | the title, regarded as a shot | the viewfinder | `/{title}?shot=close-up&light=lamplight&focus=center` |
  | tealstripesvibes.com | the mask `* # @ ~ . $` | which facets show, one more each hour | the stripes | `/@lock` |
  | factshift.center | a joint; `#>` to enter, `^` to leave | the expression, edited | the canvas | `?spw=mutex.buzz` (the pair, then the rule) |
  | spw.quest | one slot | that slot, turned | the build | `#spw64=` of the whole rule (hub.spw proposes the pair) |
  | texture.website | `$`, later | a material on the line | a grain | a plain door |
  | wap.mom | none yet | none until a mark is honest | a page | a plain door |

- **Say it before it goes.** The ring's `says` line names what will arrive before the page leaves ("this vibe as a shot of 'a lamp through teal glass', lit by golden hour"). A link with no sentence is a plain door, and texture.website and wap.mom are plain doors until they have one.
- **One name, three arrivals.** On the canvas, attention.productions typed as the title rolls in the viewfinder, entered comes through the lens, and sent by a link plays as its dailies. A typed Midjourney prompt stays a line. The arrival says how the reader came.
- **Letters are an address, not a label.** `pramgs` read as noise; the card now says "from lantern" and names six facets, lit from the seed or dim on the teal ground. The address keeps the letters.
- **Time is a measure on the line.** `/@lock` lets one more facet through each hour of a hold (`%turn[74/312]{hour}`), so the hold's progress is something the stripes show.

### Ergonomic

- **Pinch the words to size them; pinch the picture to step it.** The words take spwashi.com's own kernel, never started on a link or a button. The picture takes factshift.center's steps: ×1.16 says what is in, ×1.35 goes; ×0.82 says what is out, ×0.65 goes; it settles back when let go. Out past a page's widest step opens the ring. A trackpad's pinch and the + and − keys do the same.
- **Every affordance is markup first.** A chip and a ring entry are links; the script switches in place. Pages read with scripts off.
- **The card gets out of the way.** tealstripes' card and ring fade for a screenshot and wake on a touch.
- **Chrome never jumps.** The kept text size is set in the head before paint; the ring is fixed in a corner a page leaves free.
- **Targets.** The ring and the chips are 44px on a coarse pointer.

### Aesthetic

- **Each site keeps its own voice.** The bee and the hive, the lime viewfinder, the teal stripes. The ring is the one shared object, small and dark, its dots in each host's colour.
- **The cue reads as Spw.** `@shot · ×1.22 → #>keep · medium`, then `#>enter · medium`; the same grammar the canvas prints.
- **A held card is paper on a dark field, and it settles before it replays** (Grok's survey of design posts, 2026-11-16, kept as asks without the attributions, which no one here can open).
- **Motion tells the step and then rests.** The clapper claps once and becomes a slate; the iris closes on the node and opens from the same spot; reduced motion goes straight to the end.

### Operational

- **Files first.** A file unit cannot see the host and must not fetch another origin at request time; it reads one in the page (mutex's `now.json`) or not at all.
- **Cloudflare joins every `_headers` rule a path matches,** so a header is set once per path: a CSP for `/` and another for `/now/`, and no second `Cache-Control` for `/peer/*`.
- **A service worker answers to its own script's CSP,** so it needs `connect-src`; a manifest needs `manifest-src` under `default-src 'none'`.
- **Cloudflare's assets send `/@x` on to `/%40x`.** An address is decoded before it is read.
- **One stale load after a deploy.** Both service workers fetch a page from the network but answer its scripts stale-while-revalidate, and `/*.js` carries a five-minute `Cache-Control`; the first visit after a deploy can run the old script. S6 below.
- **One copy, byte for byte.** Each carry copies `workers/lib` files into its assets; a test fails when a copy drifts; `build:peer-kit -- --check` holds the carried kernel.

## Sense (re-read 2026-11-16)

- `workers/lib/http.js` exports `escapeHtml` (:9) and `securityHeaders`; `workers/lib/shell.js` re-exports `escapeHtml` (:25) and exports `BASE_SECURITY` (:6), `jsonResponse(body, cache, status)` (:27) and `layout`.
- wap.mom and smut.today import `escapeHtml` from `http.js` (`workers/wap-mom/src/layout.js:7`, re-exported at :14 for `feeds.js`, `cabinet.js` and `pages.js`; `workers/smut-today/src/index.js:149`). Each keeps its own `BASE_SECURITY` (wap.mom :16, smut.today :151) and `FAVICON` (:21, :156); wap.mom keeps `jsonResponse(body, extra)` (:299). `workers/README.md` names neither shared file.
- The hold as two lines has one writer, `workers/lib/hold.js`. mutex's `nowLine` and `turnLine` and tealstripes' `lockVibe` call it; a test still holds the stripes' lines to the lock's. factshift's `liveLines` (`workers/factshift-center/app/src/js/ui/mutex-lines.ts`) keeps its own copy.
- `workers/lib/set-ring.js` holds the seven hosts, their colours, attention's lights and the stripes' seeds (held to their sources by `workers/attention-productions/test/set-ring.test.mjs`).
- The ring mounts on three pages. spw.quest, wap.mom, texture.website and factshift.center do not mount it.

## S1. One escapeHtml (landed 2026-11-11, `2d6c543a`)

Both workers import it from `workers/lib/http.js`; each kept its headers, CSP, `layout`, masthead, favicon and copy. The one line for `workers/README.md` naming the shared files moves to S2.

## S2 (proposed). A kinship line in check:workers

One line per unit: what it takes from `workers/lib` and what it keeps (`wap-mom  takes escapeHtml · keeps BASE_SECURITY (script-src 'self'), FAVICON, layout`; `mutex-buzz  copies set-ring, pinch, text-scale, png`). A local copy byte-identical to a shared export fails. Touches `scripts/check-workers.mjs` and one line in `workers/README.md`; verify by reading the lines before and after.

## S3. The hold's one writer (this patch)

- `workers/lib/hold.js`. `holdLines({ cycle, title, since, releasesAt }, moment)` returns the two lines and nothing else. It formats a record and does not parse.
- mutex's `nowLine` and `turnLine`, and tealstripes' `lockVibe` lines, call it. Each carry copies the file to `assets/lib/hold.js`. The source import `../../lib/hold.js` is `/lib/hold.js` in the browser, and the shell keeps it.
- factshift's `liveLines` keeps its copy. The app is its own repository, and `test/mutex-lines.test.mjs` there already holds the strings to mutex's.
- Verify: the unit tests, `carry --check`, `npm run check:workers`. Gate: none.

## S4. The rest of the ring

- spw.quest, wap.mom and texture.website mount the ring with a `says` line each, or stay plain doors on purpose; factshift.center mounts it in the app (hub.spw, slice 3).
- Gate: the creator says which doors have a sentence. Verify per unit as for `27c7a03e`, and in a browser at phone width.

## S5 (proposed). A theme record beside the ring

Each host's mark and the kind of expression it starts from (`hold`, `shot`, `mask`, `line`, `slot`), carried with `set-ring.js`, so factshift.center can show a typed domain's theme from a record that exists (hub.spw `field` and `path`). Gate: `#>wonder_set_cue_planes`, since the marks are the question.

## S6. One stale load after a deploy

tealstripes' and mutex's service workers fetch navigations from the network and answer every other file from the cache while fetching a fresh copy for next time (stale-while-revalidate, `SW_JS` in each carry); `/*.js` also carries `Cache-Control: max-age=300`. So the first visit after a deploy can run the old script with the new page (seen on `/@lock`, 2026-11-16: "not a vibe" once, then the lock). Options: name the shell's scripts by content, as the peer kit names its own; answer scripts network-first, as wap.mom answers everything; or reload once when a new worker takes control. Touches the two carries' `SW_JS`, their shell lists and perhaps their `_headers`. Verify without a deploy: serve a changed script locally, load once, and see the new one run.

## Boundaries

- No new packages, no framework, no build step beyond wrangler and the carries.
- Routes already linked from outside keep their addresses.
- Do not touch a worker while it is dirty in another session's tree.
- Deploy is the creator's.

## Held

- **wap.mom:** the offices, filing and `/moms/*` ideas were superseded 2026-09-24 by the straight-man periodical in `workers/README.md` (2b3b7c55, ce4ed4b7, ad4773ad).
- **smut.today:** consent and adulthood as frame, not banner; pacing over count (94a0dc27). Its direction belongs to smut-today-crew.
- **autonomous.feedback:** `/for/{host}` retired 2026-09-22; the desk model lives in `.spw/caches/feedback-product-2026-09.spw`.
- **The canvas's forces and brace matrix** stay inside factshift.center (hub.spw `field`).
