# spwashi.com Site Workflow

Notes for working on this site. Written when the stack was still forming and it
was unclear which rails would matter. Some of them do. Some of them grew weight.

## What this repo is

Hand-authored static site. The parts that usually get edited:

- route HTML (`…/index.html`)
- shared CSS under `public/css/`
- shared JS under `public/js/`
- optional editor notes under `.spw/` and `.agents/plans/`

There is also an agent/editor layer (skills, plans, checks, `/about/plans/`).
It helps when concepts must last. It does not need to grow on every patch.

## Creator identity

Spwashi is a person first: software and art. The site is a surface for the work.
When unsure, lead with the person, not the system.

## What I thought I needed vs what I actually need

Early on it felt necessary that every idea be inspectable: body metadata,
`data-spw-*`, a plan, a `.spw` convention, a catalog module, a serialize hook.
That made the site agent-friendly. It also produced attribute sprawl, boot-time
width, and a large plan ecology.

**Usually enough:**

1. A clear public goal (copy, flow, one interaction, or one layout fix).
2. The smallest honest surface (HTML → shared CSS → progressive JS).
3. A local check that matches the change (`check:local`, `check:runtime`, or just `node --check`).

**Sometimes needed:**

- A plan when the work truly spans routes or shared layers.
- A `.spw` note when a concept will be reused or argued about later.
- Catalog registration when there is real progressive behavior.

**Rarely needed on day one:**

- A new metaphor family or dimension axis.
- A new `IMMEDIATE` enhancement module “for completeness.”
- Wiring every dispatch in `site.spw` for a one-off experiment.

## Default edit order

1. Name the public outcome in plain language.
2. Prefer HTML/CSS over JS; prefer shared CSS over route-only hacks.
3. Keep root-relative assets (`/public/css/…`, `/public/js/site.js`).
4. Stay framework-free unless explicitly asked.
5. Leave `.spw/_workbench` alone unless the work is genuinely workbench canon.

## Semantic rails (use when stuck, not by default)

These exist because cross-discipline and multi-route work kept getting messy.
They are optional for a single-route copy pass.

| Rail | When it actually helps |
|------|-------------------------|
| model-guided-refinement | Ambiguous creative/engineering tradeoffs |
| daily-kernel | One short session with a named discipline pair |
| experience slices | Durable ownership across HTML/CSS/JS/.spw |
| semantic-capacity | Deciding cache vs audit vs prime vs archive |
| dimension-vocabulary | Packing / density / medium aliases drifting |
| interaction-microstates | Gesture and settle phase confusion |

Audits that record hard lessons (read when changing agent rails or boot cost):

- `.spw/audits/commit-skill-induction-2026-07/`
- `.spw/audits/agentic-development-2026-07/`
- `.spw/audits/build-runtime-performance-2026-07/`

## Runtime (short)

- Catalog: `public/js/runtime/module-catalog.js` (`CORE` → `FEATURE` → `ENHANCEMENT`)
- Settings only through `site-settings` (not ad-hoc localStorage)
- Prefer `visible` / `idle` / `interaction` over `immediate` for new modules
- Device context: shell-disclosure → interactive-medium (do not re-detect viewports)

## CSS layers (low → high)

`reset → tokens → shell → typography → grammar → components → systems → routes → handles → effects → ornament`

Review **source** files under those folders. Generated `public/css/bundles/*` is
build output; do not treat it as the place to invent design.

Portable composition: `compose.css` / `compose.js`. Full site shell: `style.css` / `site.js`.

## Validation (match the change)

- Ordinary HTML/CSS/JS: `npm run check:local` (or lighter: `git diff --check`, `node --check`)
- Catalog / export contracts: `npm run check:runtime` (now also nags IMMEDIATE hygiene)
- After route or catalog changes agents care about: `npm run manifest`
  (writes `.agents/state/runtime/route-runtime-manifest.json` — do not trust months-old copies)
- Dependency work: `npm run check` (includes network audit)

## Network

Prefer local evidence first (`rg`, plans, `.spw`, nearby source). Reach for the
web or `npm audit` only when the task needs current external facts or deps changed.

## Feature partials (JS load vs theatrics)

Optional modules and CSS “partials” already split into three knobs—keep them separate:

1. **Presence** — `body[data-spw-features]` + catalog `features:` + `BEHAVIOR_SCOPES` (is it allowed on this route?)
2. **Schedule** — catalog `MOUNT_WHEN` (when does JS run?)
3. **Theatrics / relevance** — settings `enhancementLevel`, runtime posture, expressive registers, perspective/referentiality, feature-discovery levels (how loud / how much it matters?)

Code-savvy editors tune (1) in route HTML, (2) in `module-catalog.js`, (3) on `/settings/` and design specimens. Do not invent a parallel theater flag. See `.spw/conventions/feature-partial-theatrics.spw`.

## Restraint (learned the hard way)

When two skills disagree, prefer **reading calm** over **more inspectability**:

- No new `data-spw-*` family without reusing an existing one or marking volatile/local.
- No new catalog `immediate` enhancement without a cost note (`timingArc` or reclassify).
- No `PLAN.md` for a single-file fix — use `FIX.md` or just fix it.
- No empty plan `index.spw` without an owner plan.
- Prefer one coordinate (cost_class, guild, pack axis) over a new metaphor taxonomy.
- Do not run full `build:site` for `.spw`-only or single-module work.

Editor wiring (`.spw/conventions/index.spw`, `site.spw`) is for **durable**
concepts—not every intermediate thought.
