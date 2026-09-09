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

## Keep the tree followable

This tree is becoming the upstream for site copy and component architecture, so
a citation that no longer resolves is a broken copy source rather than untidiness.

```bash
npm run spw:integrity                                       # every ~"…" citation, path + #anchor
npm run spw:census                                          # population: lines, refs, frames, roles
npm run spw:graph                                           # hubs, cycles, familiarity strands
npm run spw:lattice                                         # ~#name(reading) apposition cells
npm run wonder                                              # open questions + their probes
npm run wonder:measures                                     # $%[…] substrates ↔ producers
```

`spw:integrity` enforces `caches/index.spw#cache_rules` r4, which named the
rename fragility but had no automation behind it. It delegates *extraction* to
`spw query --selector pathRefs` — the parser decides what a citation is — and
only adds *resolution*: does the path exist, and does the `#fragment` name
anything in the target. All 2480 citations currently resolve.

**Known workbench gaps** (this consumer is a use case the workbench predates).
Pin `14b4b47763aa`. Details: `.spw/workbench-report.spw`.

Landed on this pin: `spw resolve`, `spw lint`, `spw fingerprint`, default
walk isolation (`_workbench` skipped; `--include-infrastructure` opts in),
`spw query --stats`, lattice `~#name:` as a colon species, `~>` as one
project-join token.

Still open:

- **No `spw wonder`.** Harvest remains `scripts/wonder.mjs`. Answers authored
  as `grok =` inside `?[]{}` are invisible to harvest, to LSP
  `parseWonderBlock` (12-line cap), and to `probe-measure`. Do not add a
  seventh wonder type; land as `~#grok:` or a neighboring `!land{}`.
  `.spw/workbench-report.spw#wonder_harvest_absent`.
- Nested agent worktrees (`.claude/worktrees/` and similar) are process
  artifacts, not consumer canon. A leftover checkout under the repo can
  pollute a filesystem census. Ignore the directory; prune with
  `git worktree remove` when the branch has no unique commits.
- **`parseExpression()` and `parse()` disagree** — RESOLVED at workbench
  `75d8f9d26253` (2026-09-03 rebuild, `npm run build:spw-parser`; was pinned
  to `993c0994d016`, 135 commits behind). The noun form `subject[mode]{parts}
  <projection>` used to truncate under `parseExpression()` at its leading
  identifier (`surfaces[route]{path.role.archetype}<publish>` consumed 8 of
  45 characters and reported success); verified it now consumes the full 45
  and returns one `Expression` node with `frame`/`body` as its own fields
  (commit `f3061c5`, "bind same-line postfix containers onto one noun" — the
  same fix unifies `parse()`'s output too: a bare noun form used to become
  three sibling `Sequence` items, Identifier/Frame/Body juxtaposed with
  nothing connecting them; it is now one `Expression` carrying `frame` and
  `body` as named fields, plus a structured `identifier: {segments,
  qualified}` on dotted tokens that `readBodyJoins`'s regex used to have to
  re-derive). `npm run spw:integrity` still checks with `parse()` on
  principle — the two entry points converging on real content is not a
  reason to stop naming which one is canonical.
- **`~>` (project-join) used to degrade to prose when nothing followed it
  with a matching `<capsule>`.** Open at `f2e5b61b9e3d`. **Resolved at
  workbench `f681d04` / pin `14b4b47763aa`:** `spw fingerprint --expr
  'cauldron[garden]{sow ~> tend ~> harvest}'` reports complete, not prose.
  Site authorings that meant ordered steps already use `;`; `~>` stays
  reserved for movement between distinct places. Details:
  `.spw/workbench-report.spw#project_join_degrades_to_prose`.
- **`;` and `||` promoted to real sequence separators — RESOLVED same day,
  workbench `f2e5b61b9e3d` (a different commit than the rebuild above, from
  a different session).** `;` used to lex as a plain CONNECTOR that chained
  into one term rather than separating siblings, exactly matching this
  site's own `readBodyJoins`/`kernelJoinFromTokens`, which had treated `;`
  as "ordinal" since before the grammar recognized it — the site's tooling
  was built ahead of the language on purpose, and the language caught up.
  Verified: `cauldron[garden]{sow;tend;harvest}` now parses as `Sequence`
  with `success: true`, zero errors, *zero warnings*. Converted the 11 site
  expressions that used `~>` for a plain sequence to `;`; no fix needed in
  `readShape` for the ordinal case, since its existing fallback to the
  regex-captured body content was already correctly scoped. `~>` itself
  later landed as one token — see the project-join bullet above.
- **`spw graph`/`spw census`'s `brokenTargets` over-reports — `spw:integrity`
  is the authoritative resolver, not this list.** `npm run spw:graph`
  (workbench `f2e5b61b9e3d`) named 43 "broken" targets against this corpus;
  spot-checked a representative sample against source and every one is a
  live reference, not a rename this consumer's tooling failed to follow.
  Three distinct causes, none of them a site content problem: (1) absolute
  `~"https://..."` citations (`sidecar-references.spw`, `dregg-lineage.spw`)
  get prefixed with their containing directory as if they were relative
  paths, producing nonsense like `.spw/conventions/https:/github.com/…`; (2)
  `^"quoted_name"{…}` frame anchors (the majority of the list —
  `site-semantics.spw#metaphysics_model`, `operator-semantics.spw#positional_grammar`,
  `semantic-hierarchy.spw#composition_ladder`, and similar) resolve fine
  under `parse()` but this detector's anchor extractor does not recognize
  the quoted form, only bare `#>identifier` anchors; (3) CSS/HTML fragments
  (`gesture-anatomy.css#gesture-state-anatomy`, `about/index.html#about-production-note-title`)
  name a real `id="…"` attribute or `/* Section comment */` rather than a
  `.spw` anchor token, which this detector does not check but
  `spw:integrity`'s resolver does (or intentionally skips for non-`.spw`
  targets — either way, correctly). Use `npm run spw:integrity` to decide
  whether a citation is actually broken; treat `spw graph`'s `brokenTargets`
  as a hub/degree signal only until its anchor extractor learns quoted
  frames and absolute URLs.

This site is the use case meant to discover gaps like these; each is recorded
here with the measurement that found it rather than worked around in silence.

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
