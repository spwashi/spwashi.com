# JS Runtime Composability

## Public Goal
Reduce the size and cognitive load of `public/js/site.js` by extracting the page-state / attention lifecycle contract into a dedicated runtime module, while keeping the runtime behavior and datasets stable.

## Scope
- Extract page lifecycle helpers from `public/js/site.js` into a focused runtime module.
- Keep the shared page-state vocabulary, timing behavior, and dataset writes centralized.
- Update documentation that currently says the page-state contract lives only in `site.js`.
- Add runtime architecture checks that make module definitions, generated typed outputs, and root-level entrypoint boundaries fail visibly when they drift.

## Likely File Set
- `public/js/runtime/page-state.js`
- `public/js/site.js`
- `public/js/README.md`
- `scripts/ts/runtime-contracts.mts`
- `scripts/ts/check-site.mts`
- `.spw/reviews/runtime-audit/lifecycles.spw`

## Constraints
- Do not add alias wrappers.
- Do not change the public page-state tokens or timing semantics.
- Keep page attention and visibility handling reversible and readable.

## Validation
- `node --check public/js/site.js`
- `node --check public/js/runtime/page-state.js`
- `npm run check:runtime`
- `git diff --check`
- `npm run check`

## 2026-06 Contract Check Pass
- Added `scripts/ts/runtime-contracts.mts` as a hard guard for runtime module shape and folder boundaries.
- Wired the checker into `scripts/ts/check-site.mts` and exposed it through `npm run check:runtime`.
- Kept semantic metadata gaps as warnings so current modules remain inspectable without forcing a broad rewrite.

## 2026-06 Learnability/Typed Runtime Architecture Fix
- Split learnability ledger root state from writable footer text targets: `data-spw-learnability-cue` remains root/runtime state, while footer copy uses `data-spw-learnability-cue-target`.
- Scoped learnability text writes under `document.body` so document-level state attributes cannot be selected as content targets.
- Added a small typed runtime bridge for DOM contract helpers so generated TypeScript modules can import a stable local file instead of depending on watch-mode post-emit import rewrites.
- Follow-up guard worth adding: runtime contracts should fail when a module writes `textContent` to a selector that can match `html`, `head`, or `body`.

## Out of Scope
- Renaming unrelated runtime modules.
- Changing route-specific behavior beyond the page-state contract.
