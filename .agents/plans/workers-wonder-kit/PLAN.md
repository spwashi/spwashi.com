# Plan: workers-wonder-kit

Operation: prime. Fixity: experimental. Named slice: wap.mom and smut.today, maintainability and wonder.

## Public goal

Two small Cloudflare workers (`workers/wap-mom`, `workers/smut-today`) each carry a whole
site in one file: data, layout, security headers, favicon, JSON endpoint, router. They were
written a day apart and share about a third of their lines by copy. Make the shared third
one thing, keep each worker's voice its own, and give both a reason to be returned to.

wap.mom aims at mothers who hold master's degrees and professionals who own verticals and
brands. Not on the nose: the domain does the wink, the copy earns the reader with depth.
smut.today is a daily erotic zine for adults; its wonder is pacing and variety, not volume.

## Sense — 2026-09-19

- `wap-mom/src/index.js` (581 lines, untracked, in another session's working tree) —
  ISSUES ×3, MOMS ×8, a filing cabinet on KV (`FILINGS`), cabinet login by shared key.
- `smut-today/src/index.js` (364 lines at HEAD, modified in another session's tree) —
  STORIES, a day index that picks today's story, `/today.json`.
- `site-hub-next`, `feedback-quest` — same skeleton again (escapeHtml, BASE_SECURITY,
  jsonResponse, favicon SVG, `layout()`), four copies in all.
- Both workers are being edited by the sibling session right now. Nothing here lands until
  their tree is clean; this plan is the proposal they can pick up or hand back.

## Maintainability

- `workers/_kit/` (plain ESM, no build): `html.js` (escapeHtml, `layout({title, description,
  canonical, body, robots})` with the security headers and favicon as parameters, not
  constants), `respond.js` (html, htmlPrivate, jsonResponse, notFound), `router.js` (a
  `routes` table of `[method, pattern, handler]` instead of the if-ladder), `time.js`
  (dayIndex, date keys). Each worker imports what it uses; wrangler bundles it.
- Content out of code: `ISSUES`, `MOMS`, `STORIES` become `content/*.json` (or `.spw` when
  the folio pipeline can read it) beside `src/`, so an issue can be added without touching
  the router. The site's `.spw` tree already holds WAP lineage
  (`.spw/caches/folio-soil-ecosystem-2026-09.spw`, WAP = Wonder About Pi(e)); the worker
  content should cite it, not restate it.
- One `workers/README.md` naming the kit, the per-worker voice rule, and the deploy step.
- Tests: `node --test workers/_kit/*.test.mjs` for escapeHtml, router matching, dayIndex.

## Wonder — wap.mom

- **Issues that hold.** Each issue keeps its three-paragraph shape but gains one real
  mathematical object the reader can take away (a construction, an inequality, a recipe
  ratio that is a proof). The reader who owns a vertical wants something to be right, not
  just charming.
- **Offices, not personas.** "Kinds of mom" reads as characters; recast each as an office
  of the ministry with a brief and a standing question, so the register is institutional
  wonder rather than mommy-blog. Same slugs, same eight.
- **Filing as the reward.** The cabinet is the best idea in the worker: a wonder you file is
  a wonder the ministry answers. Show the count of filed wonders on the home page and
  answer one per issue, credited by office. That is the return-visit loop.
- **Pass-along.** A `/pass/<slug>/` view with no chrome, sized for a screenshot, so an issue
  can be sent without a synopsis — the site's seed-card discipline applied to a periodical.

## Wonder — smut.today

- **Pacing over count.** Keep one story a day, but let the day index rotate through a small
  set of *forms* (setup-only, two-voice, a single sustained paragraph) so return visits feel
  like a zine, not a queue.
- **Consent and adulthood as frame, not banner.** An age gate that is one honest sentence
  and a cookie, a content note per story, and a `robots` posture that does not leak to the
  main site. It is attached only to its own domain today; keep it that way.
- **Craft notes.** A `/notes/` page in the author's voice about how a story was built,
  which is the same reflection register as the site's `what-im-learning` convention and
  gives the zine a second reason to exist.

## Boundaries

- No new packages, no framework, no build step beyond wrangler.
- Do not change routes that are already linked from outside (`/`, `/<slug>/`, `/moms/*`,
  `/file`, `/cabinet*`, `/today.json`).
- Do not touch either worker while it is dirty in another session's tree.

## Validation

- `node --check` on every worker entry and kit module; `node --test workers/_kit`.
- `wrangler dev` for each worker: the eight wap.mom routes and the four smut.today routes
  answer as before; new routes answer; the security header set is unchanged.
- Read both home pages aloud once for the audience rule.
