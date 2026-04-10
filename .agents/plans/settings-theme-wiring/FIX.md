# Fix: settings-theme-wiring

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/js/site-settings.js` + `public/css/*` | Many saved settings never affect rendering or runtime behavior | ui-interaction | P1 |
| 2 | `public/js/site.js` | `viewportActivation` only applies at boot; changing it in Settings is not live | ui-interaction | P1 |
| 3 | `public/css/blog-surface.css` + `public/js/blog-specimens.js` | Blog route-level theme swatches conflict with global dark mode | ui-visual | P1 |
| 4 | `settings/index.html` | Settings page exposes speculative controls with no consumers | ui-visual | P1 |
| 5 | `public/css/grain-texture.css` + `public/js/site-settings.js` | Grain controls fight each other; semantic density comments do not match runtime behavior | regression | P2 |

## Diagnosis

- The storage/apply pipeline is coherent, but many `data-spw-*` flags have no CSS or JS consumers.
- Global theme/accessibility settings are mostly wired only for the blog surface.
- Some controls should be implemented globally with lightweight selectors or runtime listeners.
- The remaining speculative controls should be removed from the user-facing settings surface until they have actual behavior.

## Planned Fixes

### Commit 1: `&[settings] — wire live runtime preferences`
- Update `public/js/site-settings.js`
- Update `public/js/site.js`
- Update `public/js/blog-specimens.js`
- Update `public/css/enhancements.css`
- Update `public/css/grain-texture.css`
- Update `public/css/spirit-phases.css`
- Ripple risk: medium

### Commit 2: `&[settings] — remove dead controls and align copy`
- Update `settings/index.html`
- Ripple risk: low

## Deferred

- Broader CSS architecture consolidation around grammar, handles, and ornaments remains in `.agents/plans/spw-css-architecture/`.
- Route-specific surfaces beyond the blog will continue to use their existing palettes; this fix only makes the global controls materially truthful.
