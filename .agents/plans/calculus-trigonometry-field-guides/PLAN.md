## Goal

Build a broader calculus literacy cluster: deepen the calculus route through Calc I, II, and III, add a differential-equations route, and keep the explanations grounded in portable SVG visualizations and intuition-first copy.

## Public outcome

- `/topics/math/trigonometry/` explains identities and angle relationships through the unit circle, projection, and reusable formulas.
- `/topics/math/calculus/` now acts as a broader field guide through Calc I, Calc II, and Calc III:
  - derivative and accumulation basics
  - integration by parts as reverse product-rule accounting
  - partial derivatives, gradients, and multivariable slices
- `/topics/math/differential-equations/` introduces slope fields, initial conditions, and solution families.
- `/topics/math/` and `/topics/` expose the expanded calculus cluster as first-class math routes.

## Likely files

- `public/js/spw-math-diagrams.js`
- `topics/math/index.html`
- `topics/index.html`
- `topics/math/trigonometry/index.html`
- `topics/math/calculus/index.html`
- `topics/math/differential-equations/index.html`
- possibly small copy bridges in `topics/math/statistical-analysis/index.html` and `topics/software/algorithms/index.html`

## Constraints

- Keep the visuals lightweight and page-scoped.
- Prefer portable SVG figures over canvases or third-party libraries.
- Keep the explanations intuition-first and relationship-focused.
- Demo equations should be real but chosen for readability.
- Avoid introducing extra dependencies or route-specific CSS unless shared classes are insufficient.

## New visual contracts

- `data-math-visual="integration-by-parts"`
- `data-math-visual="partial-derivatives"`
- `data-math-visual="diff-eq-slope-field"`

## Validation

- `git diff --check`
- `node --check public/js/spw-math-diagrams.js`
- `npm run check`

## Out of scope

- symbolic algebra tooling
- exhaustive proof catalogs
- animation-heavy canvases or third-party graph libraries
- formal PDE coverage beyond literacy-oriented stubs and handoffs
