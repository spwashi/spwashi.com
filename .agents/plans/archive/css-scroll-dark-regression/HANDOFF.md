# Handoff: region voice, vertical packing, working view, and navbar

## Public goal

Continue refining the working tree toward authored, screenshot-worthy viewports without adding another universal effect. The active priorities are:

1. Each scroll position should have a decisive subject and a recognizable regional voice.
2. Authored address, focus, and selection should outrank passive viewport guesses.
3. Vertical packing and progressive disclosure should distinguish the public spine from encyclopedic depth.
4. The home "lens" should read as a local working view connected to real routes, not abstract global chrome.
5. The mobile navbar should be flush to the top, with the Routes hamburger aligned to the right shell gutter.

Do not discard or reset the tree. It was already a large mixed working tree before this pass, and many modified source/generated files are user-owned.

## What landed in this pass

- Fixed invalid explicit/automatic dark-mode selector joins in the About and Topics route CSS.
- Added a CSS-contract check for a selector comma immediately before a conditional at-rule.
- Removed the attempted generic scroll/view-timeline reveal; existing section cadence remains the single viewport cue.
- Added an electrostatic/material authority scalar to section-state styling.
- Changed section resolution order to focus -> selection/mark -> local fragment target -> viewport anchor.
- Added clustered home sections to the attention collector and suppressed redundant nested hook candidates.
- Moved section locomotion to the first idle residue tranche so fragment ownership settles before collectibles/labs.
- Wrapped the long home narration and secondary entrance atlas in native, reversible `<details>` disclosures.
- Reduced measured mobile vertical spend from 8.1 to 3.63 viewports for `#home-frame`, and from 11.2 to 0.27 for the closed `#choose-your-entrance` surface; horizontal overflow stayed zero.
- Moved the home mode switch out of the frame header and beside the panels it reweights.
- Renamed the public instrument "Choose a working view," with route-facing Study / Build / Play / Studio labels and secondary Spw tokens.
- Added `data-spw-lens-chrome="quiet"` as a handle-layer flat-tab treatment, plus the required home route-bundle projection.
- Removed the duplicate "change view" action from the action rail and simplified the remaining action copy.
- Removed the home header metadata chip that clipped on narrow screens.
- Top-packed shared frame content with `align-content: start`.
- Made the mobile shell a true `sigil | toggle` grid, removed the redundant safe-area top strip, and removed the reserved brace margin from the hamburger.

## Latest browser evidence (390x844)

- Page: `383px clientWidth / 383px scrollWidth` (no horizontal overflow).
- `#home-frame`: `3068px`, or `3.63` viewports.
- `#choose-your-entrance`: `229px`, or `0.27` viewports, with deeper atlas closed.
- Total home page: `8703px` tall.
- Navbar: `top: 0`, `padding-top: 0`.
- Hamburger: `11.4px` from the header right edge, matching the shell gutter.
- Selected working-view tab: `border: 0`, `border-radius: 0`, subtle fill, `2.56px` inset underline.
- Fresh `#entry-loops` load eventually reported current=`entry-loops`, count=`15`, target state=`active`; after moving the module to the first idle tranche it settles as soon as the heavy route reaches ready/idle.

## Validation already passed

- `npm run build:css`
- `node scripts/css-contracts.mjs`
- `npm run check:runtime`
- `node scripts/check-site.mjs`
- `node --import ./scripts/tests/setup-dom-globals.mjs --import ./scripts/tests/register-public-imports.mjs --test scripts/tests/module-timing-contract.test.mjs` (8/8)
- Same loader invocation for `scripts/tests/physical-model.test.mjs` (12/12)
- `npm run spw:integrity` (301 surfaces, 3954 references, all resolve)
- Edited JavaScript `node --check` passes
- `git diff --check`

Known warning: the generated core bundle is `1673.8 KiB` against a `1638 KiB` soft budget. This predates the immediate request and is explicitly out of scope here. `npm run test:timing` now uses the same public-import loaders as `test:modules`; `scripts/tests/infrastructure-contracts.test.mjs` keeps those loaders from drifting. `npm run check:local` still fails `check-generated` while generated bundles remain dirty vs `HEAD` — that is mixed-tree bookkeeping, not a source-contract failure.

## Resume sequence for Grok

1. Read `AGENTS.md`, this handoff, `FIX.md`, `.spw/caches/region-ecology-materials.spw`, and `.spw/skills/ui-containment.spw` before editing.
2. Inspect `git status --short` and preserve the mixed tree. Do not reset generated or source changes.
3. Start `npm run dev:legacy` if needed. Test `/` at 390x844, 768x900, and a desktop width.
4. Visually verify the final quiet-tab patch at full runtime, not only `?module-only=shell-disclosure`:
   - the navbar is flush and hamburger right-aligned;
   - Study / Build / Play / Studio are flat tabs, not pills;
   - clicking Build changes `aria-pressed`, reveals the systems panel, and reweights related cards without making other routes look disabled;
   - field notes and deeper atlas remain usable with keyboard and without JS;
   - deep links such as `#entry-loops` select the authored section rather than `#home-hook`.
5. Capture viewport stills with `npm run visual:stills -- --base http://127.0.0.1:4173` (recipes in `scripts/lib/viewport-still-recipes.mjs`). Do not judge “one subject” from a tall region clip. Opening, reasons, closed entrance, and open atlas are the home pocket subjects. Remove nested borders/labels if a still remains mechanically uniform; do not add a universal animation or new arbitrary material values.
6. Run `npm run component:check`, then `npm run check:local`, and report exact failures rather than broad cleanup.
7. If the slice is accepted, use `patch-consolidator` to separate authored source/semantic changes from generated bundle churn. Do not commit unless asked.

## Copy-ready prompt

> Resume the spwashi.com working-tree refinement from `.agents/plans/css-scroll-dark-regression/HANDOFF.md`. Preserve the mixed dirty tree. Prioritize the final visual/device QA for the flush right-aligned navbar, local quiet working-view tabs, native progressive disclosures, and authored section priority. Use the containment measurements and semantic cache as constraints. Avoid universal scroll reveals or arbitrary material effects. Finish targeted validation, report remaining visual uncertainty, and only then suggest a reviewable patch split.
