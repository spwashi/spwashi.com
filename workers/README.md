# Site cluster

Source for public hosts that are not the GitHub Pages origin.

`spwashi.com`, `resume.spwashi.com`, and `lore.land` stay Pages. Do not attach a Worker to those.

## Units

Inventory is `cluster.json`. Each unit is `workers/<id>/` with `wrangler.jsonc` and `src/index.js`.

| Unit | Hosts |
|------|--------|
| `site-hub-next` | constellation + `texture.website` grain lab |
| `smut-today` | `smut.today` |
| `feedback-quest` | `autonomous.feedback`, `spw.quest` |
| `wap-mom` | `wap.mom` |

`wap.mom` is Wondering About Pi: public periodical, ministry as subscribed circle. Copy does not spell the domain joke.

Cluster notes: mind-culture paths on `autonomous.feedback` (`/now`, `/wonder`, `/review`, `/practice`, `/brief`, `/for/{host}`). Ingest not open yet. Bearer on the drain belongs in `Authorization`, not the query string.

## Local secrets

Wrangler secrets live in `.dev.vars` (gitignored). Examples may be committed as `.dev.vars.example`.

```
npm run check:workers
```

That check is part of `npm run check:local`.
