# Movement Map Proposal - Topics Pilot - 2026-07-03

First deliverable of the Implementation Prime's safe first patch. This is a **proposal + demo**; per the Human Review Gates, nothing here is promoted until the grouping is approved by watching a throttled load. Production links are untouched.

## Pilot Route

`/topics/` - chosen for representative structure (split-figure hero, lane board with mode switches, card grids, photo studies) and meaningful ornament participation, without homepage idiosyncrasy.

## The Map (measured 2026-07-03)

| Movement | Layers | Files | Weight |
|---|---|---|---|
| I-II Reading | reset, tokens, shell, typography, grammar, components, systems | 64 | 1042K |
| II-route Place | routes (topics surface only) | 1 | 42K |
| III Instruments | handles | 6 | 184K |
| IV Atmosphere | effects, ornament | 17 | 298K |

Notes on judgment calls embedded in this map:

- `systems` rides in Reading, not Atmosphere: systems files own layout postures and surface grids; deferring them would shift layout (violates the CLS-0 principle).
- The route surface rides blocking with Reading. The plan sketched route+handles as Movement III, but topics route CSS owns hero/lane layout; async arrival would reflow reading. This is the kind of correction the map stage exists to surface.
- Google Fonts move out of the CSS chain into head links with preconnect in both candidates (this also previews the audit P1 font fix).

## The Two Candidates

**Candidate A - conservative.** Blocking: Reading + Place + Instruments (1268K). Deferred: Atmosphere only (298K, ~19% of payload). Controls are fully dressed at first paint; only texture/ornament settles in afterward. Least surprise, least symphonic.

**Candidate B - bolder.** Blocking: Reading + Place (1084K). Deferred: Instruments (184K) then Atmosphere (298K), ~31% deferred. Text and layout arrive complete; controls visibly come online (handles restyle from plain readable elements to dressed instruments), then atmosphere settles. More movement, more felt sequence - and the restyle moment is the taste question.

Both candidates: identical DOM (copy of `/topics/`), `noindex`, deferred CSS via `preload -> stylesheet` swap with `<noscript>` fallback links, `site.js` untouched so hydration passes still run.

## How To Review (the gate)

1. `node scripts/dev-server.mjs` (or `npm run dev`) - then open:
   - `http://127.0.0.1:4173/design/experiments/load-symphony/a/`
   - `http://127.0.0.1:4173/design/experiments/load-symphony/b/`
2. DevTools -> Network -> throttle to "Fast 4G" and "3G"; disable cache; hard reload each candidate several times. Watch, don't read: does B's instruments-arrival feel like players seating, or like a glitch?
3. Compare against production `/topics/` (the 119-request waterfall) for the baseline feel.
4. Check reduced-motion (OS setting) and JS-off (content must read completely; deferred sheets load via noscript fallback).
5. Record the felt verdict in a dated review note in this folder: which candidate (or neither), what the restyle moment felt like, and any timing instincts for the future `--spw-movement-*` tokens.

## What This Does Not Decide

Timing tokens, easing of arrivals, edition variance, SW pinning, and production wiring all wait behind this gate and the later gates. The demo bundles are throwaway artifacts (`demo/build-demo-bundles.mjs` regenerates them); the production delivery mechanism remains `scripts/css-bundle.mjs` under `runtime-bootstrap-performance/` ownership.
