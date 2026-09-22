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

`autonomous.feedback` is a meter and a form for one site. The homepage asks for
a hostname, checks whether that site answers, and offers an iframe or a plain
form the site can paste (`/?host=` prefills both). `POST /{host}/{kind}` returns
a card and stores nothing: the writer screenshots it and sends it to whoever
keeps the site, by DM or by a post that names it, and the card carries
`autonomous.feedback/{host}` so the next reader knows where to leave one.
`/{host}/inbox` stays locked until a queue is attached. `/for/{host}` was
retired on 2026-09-22; no site used it. `/climate.json` remains the machine
reading of the existing cluster. A request hostname can mark an account on the
filing; the public page does not describe that routing.

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
