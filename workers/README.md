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

`wap.mom` is Wondering About Pi: public periodical, ministry as subscribed circle. Copy does not spell the domain joke.

`spw.quest` serves a pinned workbench initialization recipe at `/init`, `/init.md`,
and `/llms.txt`, with `/quest.json` and `/prompts.json` for structured consumers.
Its requests do not probe feedback origins. The homepage lets a visitor pick
Claude, Codex, Grok, another agent, or the shell, and copy that set. Git has
its own section. `claude -p`, `codex exec`, and `grok` each receive the same job.

`autonomous.feedback` is a feedback form for any website. A reader writes a
note at `/{host}/{kind}` (kinds: `problem`, `suggestion`, `question`,
`appreciation`; the URL matches the label, and the pre-2026-09-22 slugs
`review`, `practice`, `brief`, `wonder` redirect) and gets a card to save as an image,
share, post, or copy; nothing is stored. `/start?host=&how=&kind=` is setup: it
fills the link, frame, HTML form, `fetch`, and `curl` codeblocks with the
domain and previews the result. `/meter?host=` checks whether a site responds.
Pasted links are normalized to a domain everywhere (`https://www.Example.com/x`
→ `example.com`), and `/WWW.Example.com/...` redirects to one address per site.
A rejected note comes back in the form with its errors, not as JSON, unless the
request asks for JSON.

A site configures its own form and theme by publishing
`https://{host}/.well-known/autonomous-feedback.json`
(`autonomous-feedback.client.v0`): kinds and their order, per-kind labels, a
display name, a form heading (`title`), an intro, the button text, DM contacts
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

`/{host}/inbox` stays locked until a queue is attached. `/for/{host}` was
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
No new bindings are required. The five-minute cron stays on `autonomous-feedback`.

## Local secrets

Wrangler secrets live in `.dev.vars` (gitignored). Examples may be committed as `.dev.vars.example`.

```
npm run check:workers
```

That check is part of `npm run check:local`.
