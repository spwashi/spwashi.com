# Plan: workers-wonder-kit

**Status 2026-11-06.** Unchanged since 2026-10-10 in what it owns. The shared kit is `workers/lib/shell.js` (74503ca7; b4651803 gave `layout` a `head` slot). spw-quest, site-hub-next, autonomous-feedback and `workers/lib/peer-kit.js` import it; smut-today and wap-mom still carry their own `escapeHtml`, `BASE_SECURITY` and `FAVICON`, and both are clean in this tree. smut.today's direction now belongs to [smut-today-crew](../smut-today-crew/PLAN.md), which has built nothing yet. Next slice: S1, both workers take `escapeHtml` from the shell. Gate: neither worker is dirty in another session's tree.

**Related:** [ecosystem-architecture](../ecosystem-architecture/PLAN.md) (S4: this plan carries the Spw instrument to the workers) · [smut-today-crew](../smut-today-crew/PLAN.md) · [quest-workbench-feedback](../archive/quest-workbench-feedback/PLAN.md) (archived).

Operation: prime. Fixity: experimental.

## Public goal

Two small Cloudflare workers (`workers/wap-mom`, `workers/smut-today`) each carry a whole
site: data, layout, security headers, favicon, JSON endpoint, router. They share their
skeleton by copy. Make the shared part one thing, and keep each worker's voice its own.

wap.mom aims at mothers who hold master's degrees and professionals who own verticals and
brands. Not on the nose: the domain does the wink, the copy earns the reader with depth.
smut.today is a daily erotic zine for adults; its wonder is pacing and variety, not volume.

## Sense — re-read 2026-11-06

- `workers/lib/shell.js` exports `BASE_SECURITY` (:4), `escapeHtml` (:28), `jsonResponse(body, cache, status)` (:35), `htmlResponse` (:49) and `layout` (:387).
- `workers/smut-today/src/index.js` (874 lines) defines its own `escapeHtml` (:149), `BASE_SECURITY` (:156), `FAVICON` (:166) and `layout` (:358).
- `workers/wap-mom/src/layout.js` defines its own `escapeHtml` (:13), `BASE_SECURITY` (:20), `FAVICON` (:30) and `jsonResponse(body, extra)` (:303).
- The three `escapeHtml` bodies are identical. The three CSPs are not: shell allows `script-src 'unsafe-inline'`, wap.mom `script-src 'self'` for `/figures.js`, and smut.today names no `script-src`, so its `default-src 'none'` forbids every script.

## S1. One escapeHtml

- Touches: `workers/smut-today/src/index.js`, `workers/wap-mom/src/layout.js`, `workers/README.md`.
- Import `escapeHtml` from `../../lib/shell.js` in both workers and delete the local copies. wap.mom re-exports its own today (`export const escapeHtml`), so its other modules keep importing from `layout.js` and `layout.js` re-exports the shell's.
- Keep each worker's header object and CSP. Do not widen shell's policy to fit one worker or narrow it for the other three.
- Keep each worker's `layout`/`page`, mastheads, favicon and copy local. Voice stays with the worker.
- The `jsonResponse` signatures differ. Keep wap.mom's local wrapper; do not change shell's signature.
- Add one line to `workers/README.md` naming `workers/lib/shell.js` as the shared kit (it names it nowhere today).
- Verify: `node --check` on both files; `npm run check:workers`; import each worker in Node and fetch its routes before and after, with the same status codes and the same security header set. Gate: neither worker dirty elsewhere. Ungated otherwise.

## S2 (proposed). A kinship line in check:workers

`check:workers` ends on one count: units, hosts, routing verified. Proposed: one line per unit saying what it takes from `shell.js` and what it keeps as its own, for example `wap-mom  takes escapeHtml · keeps BASE_SECURITY (script-src 'self'), FAVICON, layout, jsonResponse(body, extra)`. A local definition byte-identical to the shell's export would fail, so a copy cannot creep back after S1. The line teaches where a worker's voice lives without opening its source. Touches `scripts/check-workers.mjs` only; verify by running it before and after S1 and reading the two lines change.

## Boundaries

- No new packages, no framework, no build step beyond wrangler.
- Do not change routes that are already linked from outside (`/`, `/<slug>/`, `/cabinet*`, `/today.json`). smut-today-crew may move smut.today's routes on its own terms; this plan does not.
- Do not touch either worker while it is dirty in another session's tree.

## Held

- **wap.mom:** the offices, filing and `/moms/*` ideas were superseded 2026-09-24 by the straight-man periodical in `workers/README.md` (2b3b7c55, ce4ed4b7, ad4773ad); its issues carry their own instruments and uses.
- **smut.today:** consent and adulthood as frame, not banner, landed: one plain sentence for adults with a Leave link (`index.js:549`), a `noindex` meta (:368), `X-Robots-Tag` headers (:816, :827) and its own `robots.txt` (:800). Pacing over count landed as the two registers (94a0dc27). Craft notes at `/notes/` stay an idea in the author's voice.
- **autonomous.feedback:** `/for/{host}` retired 2026-09-22; the desk model lives in `.spw/caches/feedback-product-2026-09.spw`.
