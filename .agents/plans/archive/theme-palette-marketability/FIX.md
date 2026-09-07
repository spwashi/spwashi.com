# Fix: theme-palette-marketability

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/css/topics-surface.css` | Topic routes define light-paper panels and highlights directly, so dark/auto theme changes leave major sections visibly light-biased. | ui-visual | P1 |
| 2 | `public/css/website-surface.css` | The website field-guide surface uses permanent white paper/panel mixes and has no dark/auto override block. | ui-visual | P1 |
| 3 | `public/css/spw-surfaces.css` + `public/css/spw-metaphysical-paper.css` | Shared cards, wonder-memory strips, and image helper chrome still mix against literal white, so palette/theming changes do not propagate cleanly across reusable surfaces. | ui-visual | P1 |
| 4 | `topics/site-design/index.html` + `about/website/index.html` | Design-facing pages explain palette, theme, and interaction philosophy but provide sparse visible controls and weak market-facing framing for services/contact. | ui-interaction / missing-impl | P2 |

## Diagnosis

The theme issue is not one stray token. The route-level topic and website surfaces were authored as stable light papers and never finished with matching dark/auto variable sets. Shared surface chrome also hardcodes white highlights, so even correctly themed routes still leak light-mode treatment through cards and image controls.

The design-page problem is parallel: the copy claims palette logic, thresholds, and meaningful interaction, but the pages do not yet expose a small visible palette probe or a clear “who this is for / what you get next” frame. That makes the interaction feel underpowered and the market story abstract.

## Landed Fixes

### `![theme] — restore theme-responsive route papers`
- Add dark/auto theme variables for `topics` and `website` route surfaces.
- Replace the most visible literal light-paper/background mixes with page-local variables.
- File changes:
  - `public/css/topics-surface.css`
  - `public/css/website-surface.css`
  - `public/css/spw-surfaces.css`
  - `public/css/spw-metaphysical-paper.css`
- Ripple risk: medium
- Confidence: high

### `&[palette] — add visible palette probes for design pages`
- Promote palette resonance into the central site settings model instead of a page-local probe.
- Expose explicit palette/theme/wonder controls and visible swatches on design-facing pages.
- Bias resonance accents from the same setting so figures, cards, and structural ornaments echo the choice.
- File changes:
  - `public/js/site-settings.js`
  - `public/js/spw-palette-resonance.js`
  - `public/js/spw-accent-palette.js`
  - `public/js/spw-canvas-accents.js`
  - `public/css/spw-surfaces.css`
  - `topics/site-design/index.html`
  - `about/website/index.html`
  - `settings/index.html`
- Ripple risk: medium
- Confidence: medium

### `.[market] — sharpen design-page offer and conversion paths`
- Rework hero/supporting copy so the design pages name audience, value, and next actions more directly.
- Add route-local CTAs to `services` and `contact` without flattening the site’s editorial voice.
- File changes:
  - `topics/site-design/index.html`
  - `about/website/index.html`
- Ripple risk: low
- Confidence: high

## Verification

- Pending static checks:
  - `git diff --check`
  - `node --check` for the touched JS modules
- Pending visual checks:
  - confirm dark/auto surfaces now fully flip on `topics` and `website`
  - confirm palette resonance visibly changes the new design-page controls and resonance figures

## Deferred

- A broader sitewide replacement of literal light-mode color mixes outside the affected high-traffic surfaces is deferred to a later token cleanup pass.
