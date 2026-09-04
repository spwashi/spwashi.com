# Visual Capture Ecology

## Public Goal

Give editors a fast visual-test loop for components and region seats: QA stills at device-reason media queries, unique content-fit cards sized to copy-flow measure tokens, and optional visibility lenses that ask Spw/sizing questions. Precipitated images are named stills + hashes, not git goldens. Intermediate measures (wrap, leftover tracks, unique ratios, lens asks) double as marketing teasers a human may post.

Same still, four readings: mosey (notice the size), search (findable words), agent (recapture contract), llm (editor-side restage prompt). Visitors never wait on a model.

## Non-Goals

- No Playwright/Storybook, no new npm packages, no committed pixel baselines.
- No auto-posting. No slogan CMS. Live pretext-physics stays lab-only.
- Do not factorial every lens against every viewport.

## Seams

- Plan: `scripts/lib/visual-capture-plan.mjs` (pure; tests consume this)
- Runner: `scripts/component-snapshots.mjs`
- Fixtures: `public/ts/component-fixtures.ts`, `public/ts/region-ecology-fixtures.ts`
- Contract: `.spw/conventions/component-capture-pipeline.spw`
- Copy measure: `.spw/conventions/copy-flow.spw` (`measure-compact|card|reading`)
- Seats: `.spw/conventions/region-component-ecology.spw`

## Runtime Boundary

- The runner consumes `snapshotCompositionBox()` as the shared physical receipt instead of inventing a parallel capture-only box model.
- Pretext is invoked only when the captured element contains or belongs to a real `data-spw-flow="pretext"` host. It records wrap evidence; it does not write packing or width-class state onto ordinary cards.
- CSS/container queries remain the layout owner. Capture occupancy (`empty|light|balanced|dense|visual-led`) is a review annotation, never an automatic repair.
- `precipitate.json` keeps the still's generated capture expression separate from the component's authored `data-spw-semantic-expression`.

## Tracks

| Track | Size reason | Question |
|-------|-------------|----------|
| QA | device-reason (pocket/fold/broadsheet media) | Does this seat pack? |
| Social fit | pretext-fit (measure token) | Is the unique ratio the component physics? |
| Social crop | social-crop (1/1, 4/5, 9/16, 16/9, 1.91/1) | Is this combination postable? |
| Lens | same card, density/enhancement/tangibility/labels | Does the Spw relationship survive when presence changes? |

## Loop

`visual:plan` → `visual:capture` / `visual:ecology` / `visual:social` → gallery + `review.json` hints → smallest patch → `visual:review` (`--changed --keep`) → `precipitate.json` lock.

Default QA and ecology viewports are named device-reasons: `pocket`, `fold`, `broadsheet`. `phablet` is opt-in density. Agent briefs name the layout stack (posture → seat → pack → gravity → resonance → still).

Each precipitated still records physical composition, optional Pretext evidence, capture occupancy, an authored component expression when present, and a generated `still[mode]{flow.size-reason.occupancy}<subject>` annotation.

Region/component clips use the element's document box, not the visible viewport origin. A capture retry keeps that clip. Header-only hits are `miss--` artifacts, not specimen stills.

The dated archive is one folder of `YYYY-MM-DD_HHmmss--name.jpg` files plus `archive/index.html` as a single skim. `npm run visual:archive` rebuilds that page from whatever is already on disk.

## Commands

```bash
npm run visual:explore          # pocket iteration: chapters, not factorials
npm run visual:stabilize        # recapture latest named misses
npm run visual:plan -- --ecology --social --ids frame-card,about-years
npm run visual:ecology
npm run visual:social -- --ids frame-card --lenses density,labels
npm run visual:review
```

Explore/stabilize are the fuzz-shaped capture profiles: cheap walk, then recapture misses. Survey remains the thorough core-route stills+checks+walk. Theme checks stay on pocket unless a profile widens them. Packs write `index.json` with chapter buckets and recapture ids.

## Validation

1. `npm run component:check`
2. `node --test scripts/tests/visual-capture-plan.test.mjs`
3. `npm run check:local`
