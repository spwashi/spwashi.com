# Route audit — routes, query keys, components and forms, against common protocols

**Asked (2026-11-11).** The creator: audit routes, compare query parameters, reflect on components and forms, and compare with popular protocols and services.

**Why now.** Six workers and spwashi.com answer about 230 routes between them, and each host grew its own address grammar. Some keys already mean two things: `r` is a radius on factshift.center and a roll on texture.website; a day is `day=` and `d=` on texture and absent elsewhere; a line travels as `?spw=` and as `#spw64=`. Cloudflare rewrites `@` in a path to `%40` with a 307. A reader who learns one site's addresses should be able to guess another's.

## Inventory (read only)

- **Routes per host:** `workers/cluster.json` units, `scripts/worker-fingerprint.mjs` ROUTES, each worker's router (`site-hub-next/src/index.js` and `src/hosts/`, `spw-quest/src/index.js`, `wap-mom/src/index.js`, `smut-today/src/index.js`, `autonomous-feedback/src/index.js`), texture's path grammar (`workers/texture-website/assets/texture.js`), and spwashi.com's 209 routes by kind (`scripts/generate-site-search-index.mjs`).
- **Query keys per host:** factshift.center's `version.json` query list, spw.quest's (`build`, `pivot`, `specimens`, `card`, `parser`, `example`, `at`, `word`), texture's ladders and pivots, wap.mom's `/draw` figure keys, tealstripesvibes.com's seed and mask, autonomous.feedback's `host` and kinds.
- **Readings by extension:** `.txt`, `.md`, `.json`, `.spw`, `.svg`, `.xml` per host, and which are files and which are scripted.
- **Components and forms:** cards (texture's action and style cards, spw.quest's `/card`, autonomous.feedback's cards, `/cards/` on spwashi.com), ladders and rungs, share actions, and every form with its no-script path (wap.mom `/draw`, spw.quest POST `/build`, autonomous.feedback's form).

- **Inbound to factshift.center** (from `.spw/caches/factshift-paste-grounding-2026-11.spw`): `?spw=`, `#spw64=`, a paste, the manifest's share target and, in another session's uncommitted edit, file handlers for `.spw` and `.txt` and a `?mode=spw` shortcut; spw.quest's `/canvas` redirect; texture's slot-order line.

## Compare

| Pattern | Where it is common | What it suggests here |
|---|---|---|
| Path segments as dimensions, extension as format | IIIF Image API (`/{region}/{size}/{rotation}/{quality}.{format}`) | texture's words as layers and readings by extension already follow it; name the segments as IIIF does |
| Transformation keys in the query | imgix, Cloudinary (`w`, `h`, `blur`, `sat`) | short, documented keys with ranges; one table per host |
| `@` in a path | Google Maps (`/@lat,lng,zoom`), Mastodon (`/@user`) | precedent for `minimalist@/`; decide whether to write it `%40` directly to skip Cloudflare's redirect |
| Templates for addresses | URI Templates (RFC 6570), the URLPattern API | publish each host's grammar as a template a tool can expand |
| Share and preview | Open Graph, oEmbed, Web Share Target | every card a large-image preview; factshift's manifest already declares a share target |
| Feeds and identity | Atom, JSON Feed, WebFinger | wap.mom has Atom; one feed per host that has a cadence |
| Line anchors and permalinks | GitHub `#L10-L20`, Figma `?node-id=` | `#>anchor` in a line is the same move; keep one fragment form |

## Steps

1. Write the inventory as a cache: one table per host (route, file or script, query keys, readings).
2. Mark collisions and near-misses (same key, two meanings; same meaning, two keys).
3. Propose one shared parameter vocabulary (one meaning per key across hosts) and per-host templates; the creator chooses before anything is renamed.
4. Reflect on components and forms: what a card is on every host, what each form does without a script.
5. Renames land host by host with redirects as files or rules, each refactor fingerprinted (`npm run workers:fingerprint`).

Validation: the cache's tables are read from code with file and line; no route or key changes in this plan's first commit.
