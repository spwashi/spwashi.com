# Site cluster

Source for public hosts that are not the GitHub Pages origin.

`spwashi.com`, `resume.spwashi.com`, and `lore.land` stay Pages. Do not attach a Worker to those.

## Units

Inventory is `cluster.json`. Each unit is `workers/<id>/` with `wrangler.jsonc` and `src/index.js`.

| Unit | Hosts |
|------|--------|
| `site-hub-next` | fallback script: `mutex.buzz`, `tealstripesvibes.com`, and `www` on the door hosts |
| `smut-today` | `smut.today` |
| `autonomous-feedback` | `autonomous.feedback` |
| `spw-quest` | `spw.quest` |
| `factshift-center` | `factshift.center` — snapshot of app.factshift.com `0.0.2-alpha`. Local source checkout: `workers/factshift-center/app` (gitignored) |
| `wap-mom` | `wap.mom` |

Each held name (`boon.land`, `bane.land`, `bone.land`, `rpgwednesday.shop`, `trope.wiki`, `newyear.life`, `brainstorm.monster`, `spw.rest`, `spwashi.biz`, `spwashi.click`) is its own files-only worker, `workers/<host-with-hyphens>/`, carried by `workers/site-hub-next/carry-doors.mjs`. A file does not count toward the account's daily Worker requests (error 1027). On 2026-11-24 the apex route for each of those hosts points at its file worker. `www.*` still points at `site-hub-next` and redirects to the apex, and that redirect counts.

`wap.mom` is Wondering About Pi: a periodical of record about π and pie, with
The e Supplement bound in, and the straight man of the WAP clown lore. It plays
everything earnest; only the domain winks. Issue n of a series is its constant
to n decimal places (π: 3.1, 3.14, …; e: 2.7, 2.71, …). Every word lives in
`src/room.js`, the writers' room, edited in conversation and on stream: house
style, open questions, the four Uses dimensions, series, departments,
corrections, and issues that move from `open` to `draft` (printed as a galley
proof) to `set`. An issue may carry a figure: an instrument drawn by one kit in
`src/figures.js` that the server prints with a GET form (so it works with no
script) and `/figures.js` sends to the browser under `script-src 'self'` (so it
follows the hand). Other modules: `catalog.js` (numbering), `layout.js` (type,
mastheads, the e^iπ + 1 = 0 printer's mark), `pages.js`, `feeds.js` (`/feed.xml`,
`/sitemap.xml`, `/now.json`), `cabinet.js`. Magazine surfaces: `/contents/` by
department, `/colophon/`, `/corrections/`, `/room`, and per issue an offprint
(`/{slug}/offprint/`) and a clipping (`/{slug}/clip/`). There is no membership
yet. The cabinet stays behind `CABINET_KEY` only to read and discard filings
received before the form closed.

`spw.quest` serves a pinned workbench initialization recipe at `/init`, `/init.md`,
and `/llms.txt`, with `/quest.json` and `/prompts.json` for structured consumers.
Its requests do not probe feedback origins. The homepage lets a visitor pick
Claude, Codex, Grok, another agent, or the shell, and copy that set. Git has
its own section. After the sets, "When it worked" lists doctor, the expected
files (`EXPECTED_FILES`, shared with the recipe), and no commit, and "Then"
offers the first-patch prompt. `claude -p`, `codex exec`, and `grok` each receive the same job.

`autonomous.feedback` takes notes about pages on the creator's own sites
(`OWN_SITES` in `src/model.js`). A reader writes at `/{host}/{kind}` (kinds:
`broken`, `confusing`, `missing`, `wrong`, `question`, `appreciation`; older
slugs redirect) and gets a card to save as an image, share, post, or copy.
Nothing is stored, counted, or sent: a card reaches anyone only if its writer
sends it, and it names the page it is about, not the form. `/privacy` says so
in one place. Any other host gets a page saying there is no form for it, and
its files are never fetched. Words never ride in an address. With script off
the card's text sits under "The card as text".

Each site can shape its form with
`https://{host}/.well-known/autonomous-feedback.json`
(`autonomous-feedback.client.v0`): kinds and labels, a heading and intro,
`about`, subjects with common notes and asks, named routes, message contacts
(`contact.bluesky`, `contact.x`), an optional or required name, note bounds,
and theme tokens. The file only configures the host that served it, is cached
for five minutes, and falls back to defaults field by field; colours below
WCAG contrast are replaced. On GitHub Pages built by Jekyll, a `.nojekyll`
file is needed for `.well-known`. spwashi.com's file is in this repo, linked
from the Feedback card on /contact/. The contract and its tests:
`.spw/slices/feedback-desk-flow/index.spw`. Source: `src/model.js` (kinds,
sites), `src/config.js` (client file), `src/pages.js` (rendering),
`src/client.js` (progressive enhancement), `src/index.js` (routes).

Quest and feedback deploy as separate workers, each from its own config, dry
run first; deploy is the creator's. Neither config lists domain routes. After
the first split, point the existing domains at the new script names and leave
the old combined script unused. The feedback worker has no database, no
schedule, and no secrets.

## Local secrets

Local secrets live in `.dev.vars` (gitignored). Examples may be committed as `.dev.vars.example`.

```
npm run check:workers
```

That check is part of `npm run check:local`.
