# Design Experiment Template Migration

## Public Goal

Move the remaining standard design experiment pages onto the shared page/head template so metadata and runtime loading follow the same contract as public routes.

## Scope

- Migrate `design/experiments/kernel-audit/index.html`.
- Migrate `design/experiments/spellcraft-bench/index.html`.
- Preserve their body metadata, custom navigation, content, and route-specific head assets.
- Leave `menu-field` and `subject-balance` manual for now because their inline CSS and JavaScript are an intentional portable-demo contract.

## Semantic Rails

- Focus dimension: `slice = design-experiment-head-composition`.
- Fixity tier: stable shared head contract; fixed portable-demo boundary.
- Smallest honest surface: route head/page directives plus template regression coverage already present.

## Validation

- Render both migrated sources with zero warnings or unexpanded directives.
- Confirm asset parity and route metadata.
- Run template tests, `npm run manifest`, `npm run check:local`, and `git diff --check`.

## Status

- [x] Census remaining manual-head experiment routes.
- [x] Migrate the two standard experiment pages.
- [x] Validate rendered output and full local contracts.
