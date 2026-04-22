# Care Stats, Notes, and RPG Atlas

## Goal

Add a practical page about low-cost supports when therapy is inaccessible, then connect that public guidance to two browser-local systems:

1. a reusable local note register that can be captured quickly and revisited later
2. a lower-noise RPG Wednesday asset composer that treats title-first scene cards as a valid starting point

## Surfaces

- `services/care/index.html`
- `services/index.html`
- `services/care/without-insurance/index.html`
- `settings/index.html`
- `_partials/site-footer.html`
- `public/js/site.js`
- `public/js/spw-local-notes.js`
- `public/css/spw-chrome.css`
- `public/css/settings-surface.css`
- `public/js/rpg-wednesday-asset-atlas.js`
- `public/css/spw-surfaces.css`
- `play/rpg-wednesday/index.html`

## Patch shape

### 1. Care route extension
- Add a new child route under `services/care/` for uninsured / low-cost supports.
- Keep the page grounded in sourced public statistics, not anti-therapy rhetoric.
- Connect the statistics to math intuition: prevalence, compounding, repeatability, and visible streak state.
- Tie group streaks and TikTok-style daily return loops to social rhythm as an inference, not a clinical claim.

### 2. Copy correction
- Update existing care copy so it does not imply that dancing is a current lived practice when the intended point is that its therapeutic value became clearer through comparison of interventions.

### 3. Local notes
- Add a small browser-local note register separate from canonical site settings.
- Allow quick capture from the shared footer.
- Show the saved register on `/settings/`, with revisit and clear controls.

### 4. RPG Wednesday atlas
- Reduce composer noise for asset drafting.
- Make it explicit that a scene card can begin with only a title.
- Add a simple verbosity / prompt-rich toggle rather than forcing every card into a heavy handoff shape immediately.

## Validation

- `git diff --check`
- `node --check public/js/spw-local-notes.js`
- `node --check public/js/rpg-wednesday-asset-atlas.js`
- `node --check public/js/site.js`
- `npm run check`
