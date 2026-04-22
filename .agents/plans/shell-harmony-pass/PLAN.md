## Shell Harmony Pass

### Public goal
- Improve space efficiency, visual hierarchy, and control reach on mobile and narrow layouts.
- Make the bottom section-navigation rail calmer and more predictable.
- Tighten shared chip, badge, and frame-label geometry so Spw expressions feel more intentional.

### Shared surfaces
- `public/js/spw-attention-architecture.js`
- `public/js/spw-shell-disclosure.js`
- `public/css/spw-chrome.css`
- `public/css/spw-handles.css`
- `public/css/spw-surfaces.css`
- `public/css/home-surface.css`

### Primary fixes
1. Flatten the section-handle shell into a single-line rail with an explicit expand/collapse seam for top/bottom jumps.
2. Move quick typography and color-mode controls out from behind the mobile menu so dark mode and font size are closer to thumb reach.
3. Reduce palette-probe reflow noise on narrow widths by switching grouped actions into tighter, more predictable grids.
4. Make frame sigils and metadata seams read more like intentional anchors than faint leftovers.
5. Bring the most noticeable shell controls onto a tighter radius family.

### Validation
- `node --check public/js/spw-attention-architecture.js`
- `node --check public/js/spw-shell-disclosure.js`
- `git diff --check`
- `npm run check`
