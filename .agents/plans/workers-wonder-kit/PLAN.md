# Plan: workers-wonder-kit

**Status 2026-10-10.** The shared kit is `workers/lib/shell.js` (74503ca7). spw-quest, site-hub-next and autonomous-feedback import it; smut-today and wap-mom still carry their own copies. smut.today's two registers landed (94a0dc27). Next slice: move smut-today and wap-mom onto `shell.js` and check with `npm run check:workers`. Gate: neither worker is dirty in another session's tree.

**Related:** [quest-workbench-feedback](../archive/quest-workbench-feedback/PLAN.md) (archived) · [ecosystem-offer-2026-10](../ecosystem-offer-2026-10/PLAN.md).

Operation: prime. Fixity: experimental. Named slice: wap.mom and smut.today onto the shared shell.

## Public goal

Two small Cloudflare workers (`workers/wap-mom`, `workers/smut-today`) each carry a whole
site: data, layout, security headers, favicon, JSON endpoint, router. They share their
skeleton by copy. Make the shared part one thing, and keep each worker's voice its own.

wap.mom aims at mothers who hold master's degrees and professionals who own verticals and
brands. Not on the nose: the domain does the wink, the copy earns the reader with depth.
smut.today is a daily erotic zine for adults; its wonder is pacing and variety, not volume.

## Sense — 2026-10-10

- `workers/lib/shell.js` exports `BASE_SECURITY` (:4), `escapeHtml` (:28), `jsonResponse(body, cache, status)` (:35), `htmlResponse` (:49) and `layout` (:387).
- `workers/smut-today/src/index.js` (874 lines) defines its own `escapeHtml` (:149), `BASE_SECURITY` (:156), `FAVICON` (:166) and `layout` (:358).
- `workers/wap-mom/src/layout.js` defines its own `escapeHtml` (:13), `BASE_SECURITY` (:20), `FAVICON` (:30) and `jsonResponse(body, extra)` (:303).
- The three `escapeHtml` bodies are identical. The CSPs are not: wap.mom allows `script-src 'self'` for `/figures.js`, and shell allows `'unsafe-inline'`.

## The slice

- Import `escapeHtml` and any other byte-identical helper from `../../lib/shell.js` in both workers; delete the local copies.
- Keep each worker's header object and CSP. Do not widen shell's policy to fit one worker or narrow it for the other three.
- Keep each worker's `layout`/`page`, mastheads, favicon and copy local. Voice stays with the worker.
- The `jsonResponse` signatures differ. Adapt the call sites or keep a local wrapper; do not change shell's signature.
- Add one line to `workers/README.md` naming `workers/lib/shell.js` as the shared kit.
- If a page script is serialized with `fn.toString()`, it needs the `__name`/`__defProp` shim that `shell.js` already carries.

## Boundaries

- No new packages, no framework, no build step beyond wrangler.
- Do not change routes that are already linked from outside (`/`, `/<slug>/`, `/cabinet*`, `/today.json`).
- Do not touch either worker while it is dirty in another session's tree.

## Validation

- `node --check` on every touched worker file.
- `npm run check:workers` (part of `npm run check:local`).
- Import each worker in Node and fetch its routes before and after. Status codes and the security header set must not change.

## Wonder — wap.mom (superseded)

Superseded 2026-09-24 by the straight-man periodical described in `workers/README.md` (ad4773ad, ce4ed4b7). `/moms/*`, `/file` and `/ministry` were removed, and the issues now carry their own instruments and uses.

## Wonder — smut.today

- Consent and adulthood as frame, not banner: landed. There is one plain sentence for adults with a Leave link (`index.js:549`), a `noindex` meta and `X-Robots-Tag` headers (:368, :816, :827), and its own `robots.txt` (:800).
- Pacing over count: partly landed as the two registers (94a0dc27) and the reader's settle preferences.
- Craft notes at `/notes/` remain an idea in the author's voice, not part of this slice.

## Landed and held — 2026-09-19

- **smut.today, landed (94a0dc27):** two pieces, one register each. "Before the meeting" is
  slow and written to be read; "The last car" is dirty and four paragraphs. Each piece names
  the phrases it keeps, dated to the day it ran, shown at its foot and exposed in
  `today.json` as `language`; each links the other register.
- **wap.mom UX edits (superseded):** the uncommitted pass recorded here was overtaken when the worker was committed and rebuilt as the periodical.
- **autonomous.feedback proposal (superseded):** `/for/{host}` was retired on 2026-09-22 (`workers/README.md`), and the desk model now lives in `.spw/caches/feedback-product-2026-09.spw` and `.spw/slices/feedback-desk-flow/index.spw`.
