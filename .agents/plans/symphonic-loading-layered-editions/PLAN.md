# Plan: symphonic-loading-layered-editions

Make page load feel like listening to a symphony - staged, eased, additive arrival instead of accidental waterfall noise - and give the layer architecture an explicit impact gradient so regional caches and deploy versions can vary the outermost layers, offering a governed sense of surprise about style.

## Public Goal

A visitor's first seconds should read as movements: structure seats itself silently, reading arrives complete, instruments come online with eased acknowledgment, and atmosphere settles last. A returning visitor should feel remembered; a visitor on a different device, cache generation, or deploy edition should feel a small, safe stylistic surprise - different ornament weather over an identical city. The taste note is **conducted arrival + governed variance**: sequencing is intentional (never FOUC), and surprise is confined to layers that cannot move structure or break interaction contracts.

## The Movement Model

Map arrival to the existing cascade layer order and hydration passes:

- **Movement I - Tuning (blocking, silent):** `reset`, `tokens`, `shell`. No transitions; containment guards from `modes/hydration.css` hold layout. The stage is set before anything is visible.
- **Movement II - Reading (blocking, complete):** `typography`, `grammar`, `components`. The page must be fully readable at the end of this movement. Reading is the melody; it is never delayed by decoration.
- **Movement III - Instruments online (async, eased):** route surface + `handles`, aligned with the `lex` hydration pass. Controls arrive through the existing `--spw-component-arrival-transition` / readiness-variable vocabulary ("local systems coming online", per the 2026-06-20 timing contracts).
- **Movement IV - Atmosphere (async, deferred, variance-eligible):** `effects`, `ornament`, palette accents, aligned with `semantic`/`pragmatic` passes. Loaded non-blocking (preload-swap or media-swap link pattern); eased in; `prefers-reduced-motion` collapses the easing to instant-complete.

Principles:

- Movements are additive - later arrivals never restyle earlier ones destructively and never shift layout (CLS budget: 0 from movements III/IV).
- No JS means the symphony degrades to a chamber piece: movements I-II only, which is already a complete reading experience (the PE spine from the 2026-07-02 composability audit).
- Timing lives in tokens (extend the `--spw-interaction-*` family with `--spw-movement-*` durations) so the rhythm is tunable and inspectable, not scattered in transition literals.

Dependency: this plan is the second motivation for wiring the scoped bundle system (P1 in `archive/2026-07-02-css-html-audit-alignment-responsive-performance.md`). The current 119-request import waterfall cannot be conducted; discrete bundles per movement group are the score. Delivery mechanics stay owned by `runtime-bootstrap-performance/`; this plan owns the perceptual contract.

## Implementation Prime

Operation: `prime`. Fixity tier: `experimental` until one pilot route proves no FOUC, no movement-owned CLS, and no no-JS reading regression; `tending` only after that route is reviewed in a browser.

Model-guided handoff:

- Focus dimension: `css_behavior` / rhythm.
- Primary element: water, for sequencing and cadence.
- Secondary element: metal, for the impact-gradient rules and variant allowlists.
- Owner surface: this plan for perceptual pacing, `runtime-bootstrap-performance/` for delivery mechanics, `agentic-dev-contracts/` for generated manifests or invalidatable reports, and `.spw/conventions/site-semantics.spw` only when `data-spw-edition` or an edition manifest becomes real runtime state.
- Do not touch: CSS layer order, route copy, body metadata families, or service-worker freshness doctrine.

Safe first patch:

1. Choose one pilot route with representative structure and ornament, then map its current CSS imports into the four movement groups without changing production links yet.
2. Wire that route to the existing scoped-bundle machinery only after the map shows which files belong to movements I-II versus III-IV; no edition variance in this first patch.
3. Add measurement hooks or a generated report only if they are invalidatable from source files and owned by `agentic-dev-contracts/`.
4. Validate the pilot with JS enabled, JS disabled, `prefers-reduced-motion`, cold load, and warm service-worker return before any rollout or variance work.

Negative controls:

- The first patch must not add `data-spw-edition`, variant CSS, or SW edition pinning; those belong after the movement grouping and bundle pilot feel correct.
- Later movement CSS may set timing, opacity, color, texture, and ornament custom properties, but must not set layout, spacing, focus, interaction state, or semantic variables unless the impact-gradient contract is promoted into `.spw`.
- If a nonblocking CSS strategy requires JS to reveal atmosphere layers, the no-JS fallback must still render a complete readable page from movements I-II.

## The Impact Gradient And Edition Variance

Rule: **the earlier the layer, the higher the impact and the lower the allowed variance.**

- `reset` through `handles`: deterministic, versioned, identical for every visitor. Interaction contracts (state variables, `-intent` hooks, gesture grammar) live here and never vary.
- `effects`, `ornament`, and designated palette-accent tokens: variance-eligible. Variants are same-selector, different-value files that may only set variance-eligible custom properties (accent hues, grain intensity, ornament choreography timing, texture choice) - never layout, spacing, or state semantics.

Edition mechanisms (static hosting; no edge logic available on GitHub Pages):

- **Version randomness (deploy-time):** the build emits N ornament/accent variant files plus a manifest; each deploy rotates or reshuffles a default edition seed. Different versions of the site perform the piece differently.
- **Regional/cache randomness (visitor-time):** `sw.js` picks a variant at install (entropy + `CACHE_SCHEMA_VERSION`), caches only that variant in the assets bucket, and serves it on return visits. The visitor's cache *is* their regional edition: surprise on first arrival, remembered on return, re-rolled when the cache schema advances. This is the "surprise and local nuance" clause of the cognitive cache stratum in `runtime-bootstrap-performance/PLAN.md` made concrete.
- **Inspectability:** the active edition is projected as `data-spw-edition` on `<html>`, readable in the state inspector and legible under `data-spw-capture-mode` so screenshots carry their edition identity. Variant manifest is a generated artifact under `agentic-dev-contracts/` ownership.

## Likely Files

- `public/css/style-core.css`, `scripts/css-bundle.mjs` - movement grouping of bundles
- `public/css/modes/hydration.css`, `public/js/kernel/dom-render.js` - movement/pass alignment
- `public/css/tokens/core.css` - `--spw-movement-*` timing tokens, variance-eligible token designation
- `public/css/ornament/`, `public/css/effects/` - variant extraction (ornament ~72K, effects ~280K today)
- `sw.js` - edition selection and pinning in the assets cache
- `.spw/conventions/site-semantics.spw` - impact-gradient and edition contract entry

## Human Review Gates

Bundling decisions and codebase feeling are taste surfaces here, not derivable facts. Static analysis can propose, but pacing-concept sensation must be reviewed by a human in a browser before promotion. Explicit gates:

- **Movement grouping:** which files/layers ride in which movement is a felt-pacing decision. Agents propose a grouping with rationale; a human approves it by watching a throttled load, not by reading the diff.
- **Timing tokens:** `--spw-movement-*` durations and easings ship as a reviewable proposal (ideally a touchable specimen per `designer-conversation-canvas/` conventions) with at least two candidate rhythms to compare, never a single computed default.
- **Variance surface:** which tokens are variance-eligible, and how far editions may stray, is a brand-feel decision reviewed against real renders of at least two editions side by side.
- **Edition rotation cadence:** how often surprise re-rolls (schema bumps, deploy seeds) is an editorial call.

Working shape: agent sessions on this plan end at "proposal + demo," and a dated review note records what the human felt and chose before implementation continues. Fast follow-through is fine after a gate clears; skipping a gate is not.

## Risks

- Variance drift: a variant file that touches layout or state tokens breaks the impact gradient silently. Mitigation: variant files are lint-checked (extend `scripts/css-contracts.mjs`) against an allowlist of variance-eligible properties.
- Atmosphere pop-in reads as jank rather than a movement if easing is skipped or CLS is nonzero; movements III/IV must be transition-eased and layout-inert.
- SW-pinned editions must not hide deploy freshness (existing sw.js doctrine); edition rotation rides the existing schema-version mechanism, never fights it.
- Debuggability: a visitor bug report must include the edition; `data-spw-edition` plus console surfacing covers this.

## Validation

- Lighthouse/DevTools: CLS 0 attributable to movements III/IV; reading complete before atmosphere requests start on a throttled profile.
- `prefers-reduced-motion`: all movement easing collapses; content identical.
- No-JS: movements I-II render a complete readable page; no edition attribute appears.
- Two clean profiles with different SW installs receive different editions; the same profile receives its edition again on return.
- `npm run check:css` extended with the variance-eligible property lint for variant files.

## Out Of Scope

- Any variance in layers `reset` through `handles`.
- Server/edge-dependent delivery (host remains static).
- Audio or literal sound design; "symphony" is a perceptual-timing metaphor.
- Replacing the existing hydration pass machinery; this plan choreographs it.
