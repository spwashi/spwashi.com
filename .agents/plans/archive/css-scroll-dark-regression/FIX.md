# Fix: CSS dark-mode and scroll-passage regressions

## 1. Symptoms and reproduction

- Routes: `/about/` and `/topics/`
- Trigger: choose explicit dark mode, or use automatic mode with an OS dark preference.
- Failure: the route palette stays light because a selector list was joined to an `@media` rule.
- Shared surface: frames, cards, and braces on browsers with scroll-driven animation support.
- Failure: the proposed passage animations reused pseudo-elements already owned by frame seams, card specular, brace boundaries, and section-state cadence. Moving animation off the host avoided one collision while creating another.

## 2. Root cause analysis

- CSS conditional rules cannot be comma-joined to selectors; the tolerant build parser preserved an invalid qualified rule.
- View timelines treated viewport intersection as a second attention authority and flattened unlike regions into the same polished reveal.
- Existing section-state cadence already owns the top-level viewport cue and can read the electrostatic channel derived from each authored region seat.
- Home places its authored frames under `main > [data-spw-cluster]`, while both the section collector and its visible-module mount selector only recognized direct `main` and `main > article` sections. At `#entry-loops`, the runtime still reported the nested `#home-hook` as the page's sole active section; a fresh deep-link load mounted no section runtime at all because that fallback hook was off-screen.
- The visible-stage module also selected the dormant `.spw-section-handle` chrome before page content. Because the handle stays hidden until the same module enhances it, the module waited forever on its own hidden trigger.
- At `390×844`, the entry spine occupied about eight viewports and `#choose-your-entrance` about eleven while horizontal overflow remained zero. Immediate and encyclopedic layers were packed into the same vertical register, so every card was technically available but no viewport had a decisive subject.

## 3. Minimal patch plan

- Keep explicit-dark and automatic-dark route projections as separate valid blocks.
- Remove the parallel view-timeline cues instead of competing for component pseudo-elements.
- Modulate the existing section-state cadence through `--spw-e-channel` and material tangibility.
- Keep explicit address, focus, selection, and deliberate region marking above automatic viewport rank.
- Resolve focused, selected, or locally targeted sections before the passive scroll anchor, while letting ordinary viewport locomotion resume after a fragment target leaves the local field.
- Include direct children of the established page cluster in the section-locomotion selector, and suppress a nested hook when an authored section candidate already contains it.
- Wake the section model at idle after first paint rather than making deep-link correctness depend on a pre-settle visibility sample.
- Keep identity, reasons, and role choices immediate; place the long editorial model and the secondary component/image atlas behind native reversible disclosures.
- Give the three home-page reasons distinct semantic charges and top-pack frame content by default instead of inheriting grid stretch accidentally.
- Cache the material/electrostatic/progressive-disclosure distinction before proposing a public cache-state family.
- Add a CSS contract guard for a selector line ending in a comma immediately before a conditional at-rule.
- Regenerate only the affected CSS bundles through the existing build.

## 4. Verification

- `npm run build:tools`
- `node scripts/css-contracts.mjs`
- `node --check public/js/runtime/attention/shared.js public/js/runtime/attention/section-handle.js public/js/runtime/module-catalog-enhancement.js`
- `npm run build:css`
- `npm run check:local`
- `git diff --check`

## Out of scope

- Broader palette redesign.
- New motion tokens or JavaScript animation; the JS change repairs section addressing only.
- A public progressive-cache runtime or new `data-spw-*` family.
- Paying down the pre-existing core bundle soft-budget excess.
