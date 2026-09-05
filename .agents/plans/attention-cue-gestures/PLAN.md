# Attention Cue Gestures

## Goal
- Extend the reading-groove behavior to more editorial and hybrid pages.
- Keep the effect browser-local and reversible through canonical settings.
- Add a touch gesture for text scaling that writes through the existing `fontSizeScale` setting.

## Shared surfaces
- `public/js/kernel/site-settings.js` (+ `site-settings-engine.js`, `site-settings-profiles.js`)
- `public/js/runtime/attention-architecture.js` (orchestrator; behavior lives under `public/js/runtime/attention/`: `reading-groove.js`, `pinch-scale.js`, `shared.js`)
- `public/js/runtime/shell-disclosure.js`
- `public/js/site.js`
- `public/css/typography/typesetting.css`
- `public/css/components/spw-components.css`
- `settings/index.html`

## Route surfaces
- `now/index.html`
- `care/index.html`
- `play/index.html`
- (reading groove is selector-driven, not route-gated — `main article p/li` etc. in `ATTENTION_READING_SELECTOR` — so it already reaches every route with an authored `<article>`/`<section>` in `main`, these three included)

## Inspectability
- `.spw/conventions/attention-field.spw`

## Status — landed, both goals shipped

- **Touch gesture for text scaling**: `public/js/runtime/attention/pinch-scale.js` (landed 2026-08-31, commit `a290ed71`). Two-finger pinch over `main` steps `fontSizeScale` via `spwSettings.setFontSizeScale`. Gated on `supportsPinchTextScaleInput()` (`any-pointer: coarse` or `maxTouchPoints >= 2`) and on the `spwPinchTextScale` preference (defaults on, reversible off in settings). `touchmove` is the only non-passive listener (needs `preventDefault` to block native pinch-zoom while previewing); `touchstart/end/cancel` are passive; all four are bound through one `AbortController` and torn down on cleanup.
- **Extend reading-groove to more editorial/hybrid pages**: not done route-by-route — `attention-reading-groove`'s catalog selector (`main article p`, `main article li`, `main > section p`, `main > section li`) is global, so it already mounts on every route whose `main` has an authored `<article>`/`<section>`, `now/`, `care/`, and `play/` included. Confirmed via `npm run audit:module-selectors` (2026-09-05 rerun): 124/124 route hosts.
- **Reversible through canonical settings**: both features round-trip through `settings/index.html` — `name="readingGrooveMode"` and `name="pinchTextScale"` radio groups, normalized in `site-settings-profiles.js`/`site-settings-engine.js` to `data-spw-reading-groove-mode` / `data-spw-pinch-text-scale`. Live status labels at `[data-settings-state="readingGrooveMode"]` / `[data-settings-state="pinchTextScale"]`.

No open thread against this plan's stated goal — both requirements this plan was told to retain are shipped in code.

## Relationship

- This folder was already reviewed on 2026-07-12 (`index.spw` `^"review_disposition"`, and `.agents/plans/archive/2026-07-12-review-execution.md`): **merge into `typography-reading-groove`, retain only the canonical-settings and touch-safety requirements**, status `superseded`. That disposition was recorded structurally in `index.spw` but the retained requirements were never actually written into `typography-reading-groove/PLAN.md` — this session does that (see its `## Status — landed` section), so the 2026-07-12 review is now executed, not just recorded. Per that review's own rule ("no folder moves; superseded owners keep their folder for citation safety"), this file stays in place rather than being deleted.
- One thing the July review couldn't have known: `pinch-scale.js` (the touch-safety requirement) didn't land until 2026-08-31, six weeks after the merge call. The requirement is fulfilled now; it was still open when the disposition was written.
- `.spw/audits/pointer-device-detection-2026-09.spw` — separate audit of coarse/fine-pointer detection duplication across 13+ runtime files. `pinch-scale.js`'s `any-pointer: coarse` check is the one deliberate outlier named there; nothing in this plan needs to change because of it.
