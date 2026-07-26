# spwashi.com `.spw`

This tree is the **site's** semantic layer: conventions, language surfaces, philosophy, audits, caches, and reviews for *this website*. It is consumer-owned.

`_workbench/` is **mounted infrastructure** (the spw-workbench submodule): use its parser, CLI, and review machinery, but exclude it from the consumer corpus unless the workbench itself is the explicit subject. See `../.agents/skills/_shared/site-vs-workbench.md`.

## Orient (mounted CLI)

The `^"roots"` frame in `workspace.spw` makes every cluster addressable by sigil.
Repo-root npm scripts keep the consumer path correct (doctor without `../..`
mistakes the workbench checkout for the consumer):

```bash
npm run spw:doctor                                          # mounted-consumer readiness
npm run spw:roots                                           # @spw @conventions @language @surfaces …
npm run spw:tree                                            # bounded consumer tree
npm run spw -- skim .spw/language/feature-utilization.spw
npm run spw -- analyze .spw/conventions                     # ref/probe densities, hubs
npm run spw:plan:check                                      # plan cache drift (feature branches)
```

Equivalent long form (same paths):

```bash
npm --prefix .spw/_workbench run spw -- doctor ../..
npm --prefix .spw/_workbench run spw -- roots ../..
npm --prefix .spw/_workbench run spw -- tree @conventions --depth 1
```

## Roots

| Sigil | Holds |
|-------|-------|
| `@index` `@mount` `@site` `@domains` | Top-level routing, mount bridge, site + domain registries |
| `@conventions` | Durable site contracts (the largest cluster; start at `@conventions/index.spw`) |
| `@language` | Spw *language* surfaces — operators, braces, claims, v04 pillars (distinct from runtime feature packs) |
| `@surfaces` | Publishable surface registries (menu-field, page-model, product-lines …) |
| `@philosophy` | Cognitive-surface, spatial-grammar, wonder doctrine |
| `@reviews` `@audits` `@caches` `@slices` | Handoffs, recorded audits, insight caches, experience slices |
| `@workbench` | Mounted infrastructure (`.spw/_workbench`) — excluded from consumer scans |

## Model prompt

Read this file, `index.spw`, `workspace.spw`, and `mount.spw`. Treat `_workbench` as mounted infrastructure. Prefer the mounted `spw` CLI over ad-hoc `rg` for `.spw` navigation. When a concept is durable, name its **operation** (cache / audit / align / prime / contract / archive) and **fixity** (fixed / stable / tending / experimental / volatile), and give durable architectural claims a runnable `probe_ref` or a `validation:` block. Keep public route copy and inspector vocabulary aligned — do not invent a new `data-spw-*` stem when a current family fits.

Working references:

- `_workbench/docs/runtime/md/mounted-workbench.md`
- `_workbench/.spw/conventions/submodule.spw`
- `conventions/codebase-perusal.spw` — human-facing trails for forming opinions before editing
