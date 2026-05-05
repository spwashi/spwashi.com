# Plan: js-surface-ecology

## Goal

Make the shape of `public/js` legible before attempting deep refactors. The desired end state is a tree where a new reader can distinguish durable primitives, semantic machinery, runtime behavior, interface affordances, and feature modules at a glance.

## Public principle

```txt
Move what is obvious.
Label what is suspicious.
Merge only what is proven.
```

## Proposed topology

```txt
public/js/
  kernel/
  semantic/
  runtime/
  interface/
  modules/
  content/
  media/
  legacy/
```

## Layer model

```txt
kernel → semantic → runtime → interface → modules
```

- `kernel`: bus, core, runtime environment, shared utilities, state, DOM contracts
- `semantic`: operators, lattice, projection, semantic utilities, component semantics, pretext mechanics
- `runtime`: gates, interaction loops, visitation, navigation spells, state inspectors, update handlers
- `interface`: contextual UI, semantic chrome, guide badges, palette resonance, canvas accents, haptics, local controls
- `modules`: blog, RPG Wednesday, services, tools, profile, payment, budgeting, care intake, and page/feature bundles

## Scope

- In scope for the first pass: inspect `public/js` only, ignore generated/build-heavy directories, classify files by responsibility, move obvious files, update import paths, and stop.
- Out of scope for the first pass: deduplicating shadow twins, deleting suspicious files, collapsing typed/generated/plain variants into one module, or touching `dist`, `dist-vite`, or `node_modules`.

## Risks

- Prefixed and non-prefixed twins may look redundant but serve different roles.
- Typed variants and generated outputs can create false signals if inspected too early.
- A flat mechanical move can break imports if the obvious layer boundary is assumed instead of verified.

## Validation

- constrain inspection to `public/js`
- classify before merging
- preserve suspicious files in place or move them to `legacy/`
- verify updated import paths after each small move set

## Implementation pass: 2026-05-05

The first mechanical pass now exists.

- `public/js/site.js` remains the public runtime entrypoint.
- Root-level `public/js/*.js` compatibility wrappers preserve existing route, service-worker, and test URLs.
- Implementation files moved into `kernel/`, `semantic/`, `runtime/`, `interface/`, `modules/`, and `media/`.
- `public/js/typed/` remains generated output and was not moved.
- Internal moved-module imports now resolve through stable `/public/js/*.js` wrappers, keeping this pass mechanical rather than a dependency-graph rewrite.
- `public/css/style.css` now imports layered implementation files from folders matching the cascade layer order.
- Root-level `public/css/*.css` files remain compatibility wrappers for older direct stylesheet links.

The remaining cleanup is semantic, not mechanical: inspect root wrappers that represent real shadow twins, then merge only where call sites prove they share a contract.

## Deduplication pass: 2026-05-05

The first wrapper-chain cleanup landed after the tree move.

- `public/js/site.js` now imports mounted implementation modules from their semantic folders.
- Legacy root aliases such as `blog-interpreter.js`, `payment-card.js`, and `seed-card.js` now point directly to canonical `spw-*` module implementations.
- Redundant folder-level alias files were removed where they only re-exported another wrapper.
- Public root URLs remain available for route HTML, service-worker entries, tests, and older external links.

Next candidates should be real call graph reallocations, not alias deletion: inspect repeated imports of `/public/js/spw-bus.js`, `/public/js/spw-shared.js`, and `/public/js/site-settings.js` inside layer folders, then move those call sites inward only when the target dependency belongs to the same or lower layer.
