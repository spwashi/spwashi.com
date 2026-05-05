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
