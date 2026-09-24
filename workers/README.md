# Site cluster

Source for public hosts that are not the GitHub Pages origin.

`spwashi.com`, `resume.spwashi.com`, and `lore.land` stay Pages. Do not attach a Worker to those.

## Units

Inventory is `cluster.json`. Each unit is `workers/<id>/` with `wrangler.jsonc` and `src/index.js`.

| Unit | Hosts |
|------|--------|
| `site-hub-next` | constellation + `texture.website` grain lab |
| `smut-today` | `smut.today` |
| `autonomous-feedback` | `autonomous.feedback` |
| `spw-quest` | `spw.quest` |
| `wap-mom` | `wap.mom` |

`wap.mom` is Wondering About Pi: a periodical of record about π and pie, and the
straight man of the WAP clown lore. It plays everything earnest; only the domain
winks. Issue n is numbered by π to n decimal places (3.1, 3.14, 3.141…). Every
word lives in `src/room.js`, the writers' room, edited in conversation and on
stream: house style, open questions, and issues that move from `open` to
`draft` (printed as a galley proof) to `set`. Each printed issue has an
offprint (`/{slug}/offprint/`) and, when it names a `clip`, a clipping card
(`/{slug}/clip/`) sized for a screenshot. `/room` shows the room's state. There
is no membership yet. The old ministry, kinds of mom, and wish form are gone;
the cabinet stays behind `CABINET_KEY` only to read and discard filings
received before the form closed.

`spw.quest` serves a pinned workbench initialization recipe at `/init`, `/init.md`,
and `/llms.txt`, with `/quest.json` and `/prompts.json` for structured consumers.
Its requests do not probe feedback origins. The homepage lets a visitor pick
Claude, Codex, Grok, another agent, or the shell, and copy that set. Git has
its own section. After the sets, "When it worked" lists doctor, the expected
files (`EXPECTED_FILES`, shared with the recipe), and no commit, and "Then"
offers the first-patch prompt. `claude -p`, `codex exec`, and `grok` each receive the same job.

`autonomous.feedback` is a feedback form for any website. A reader writes a
note at `/{host}/{kind}` (kinds: `broken`, `confusing`, `missing`, `wrong`,
`question`, `appreciation`; the URL matches the label, and older slugs such as
`problem`, `suggestion`, `review`, `brief`, `wonder` redirect) and gets a card to save as an image,
share, post, or copy. Nothing is stored unless the site has an open inbox (below). `/start?host=&how=&kind=` is setup: it
fills the link, frame, HTML form, `fetch`, and `curl` codeblocks with the
domain and previews the result. `/meter?host=` checks whether a site responds. `/privacy` is the one page
that says how notes are kept; the forms link to it instead of explaining.
Pasted links are normalized to a domain everywhere (`https://www.Example.com/x`
→ `example.com`), and `/WWW.Example.com/...` redirects to one address per site.
A rejected note comes back in the form with its errors, not as JSON, unless the
request asks for JSON.

A site configures its own form and theme by publishing
`https://{host}/.well-known/autonomous-feedback.json`
(`autonomous-feedback.client.v0`): kinds and their order, per-kind labels, a
display name, a form heading (`title`), an intro, `about` (`site` asks about
using the site and leads with the kinds; `subject` asks about the work and
leads with the common notes), the button text, DM contacts
(`contact.bluesky`, `contact.x`: Message buttons on the card page and a mention
in the Post links), an optional or required name field,
note length bounds, extra frame ancestors, and theme tokens (mode, background,
text, accent, corners, font). The file only configures the host that served it,
is cached for five minutes, and falls back to defaults field by field; colours
below WCAG contrast are replaced. No stylesheet URLs or HTML are accepted.
`/{host}/config.json` shows what was applied and why anything was not. On
GitHub Pages built by Jekyll, a `.nojekyll` file is needed for `.well-known`.
spwashi.com is the first client: `.well-known/autonomous-feedback.json` in this
repo (light theme from the site's paper, ink, and teal; serif; optional name),
linked from the Feedback card on /contact/.

An inbox (the desk) keeps cards for a site in D1 only when the client file
sets `queue.want: true`, the host is listed in the `DESK_HOSTS` var, and
someone can read it: the operator's `INBOX_READ_TOKEN`, or the owner's key,
published in the file only as `inbox.key: "sha256:…"`. Otherwise nothing is
kept, and every page says so. New cards wait three days; the owner saves up
to `SAVE_LIMIT` (default 10) at `/{host}/inbox`, and the cron compacts the
rest into weekly tallies (subject or page, common note, kind, cards, and how
many were in the writer's own words) with no words. The inbox opens with a
digest of the week built from those counts and the live cards. `/desk` is the
operator's view of every open desk, with Compact now. The whole flow, its
invariants, and audit queries: `.spw/slices/feedback-desk-flow/index.spw`.
The write page names the page a reader came from (`?at=`, else a same-site
Referer); the link and frame snippets send the full Referer. `/for/{host}` was
retired on 2026-09-22; no site used it. `/climate.json` remains the machine
reading of the existing cluster. A request hostname can mark an account on the
filing; the public page does not describe that routing. Source:
`src/model.js` (kinds, validation), `src/config.js` (client file),
`src/pages.js` (rendering), `src/client.js` (progressive enhancement),
`src/index.js` (routes).

Quest and feedback deploy as separate Workers. From an authenticated Wrangler
installation, dry-run then deploy each config:

`wrangler deploy --config workers/spw-quest/wrangler.jsonc`

`wrangler deploy --config workers/autonomous-feedback/wrangler.jsonc`

Neither config lists domain routes. After the first split, point the existing
zone routes at the new script names and leave the old combined script unused.
The feedback Worker binds D1 as `DB` (apply `migrations/` with
`wrangler d1 migrations apply autonomous-feedback`), reads `DESK_HOSTS` from
its vars, and needs `wrangler secret put INBOX_READ_TOKEN` before any inbox
can be read. The five-minute cron stays on `autonomous-feedback`.

## Local secrets

Wrangler secrets live in `.dev.vars` (gitignored). Examples may be committed as `.dev.vars.example`.

```
npm run check:workers
```

That check is part of `npm run check:local`.
