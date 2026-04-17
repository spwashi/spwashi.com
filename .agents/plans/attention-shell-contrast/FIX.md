# Fix: attention-shell-contrast

## Failures

| # | File | Test/Error | Class | Priority |
|---|---|---|---|---|
| 1 | `public/css/spw-handles.css` | Shared mode-switch buttons keep inactive chips too faint and the selected state too close to surrounding surface tones on mobile. | ui-visual | P1 |
| 2 | `public/css/spw-chrome.css` | The mobile `menu` toggle inherits similarly weak contrast, so the control reads more like ambient chrome than a primary interaction target. | ui-visual | P1 |
| 3 | `public/css/spw-shell.css` | `main[data-spw-layout="reading"]` is wired through a selector that cannot match, so the documented `<main>` opt-in path is broken. | regression | P1 |
| 4 | `public/css/spw-shell.css` | `main[data-spw-layout="split"]` does not receive the same child-placement rules as the body-level split layout, leaving the contract incomplete. | regression | P2 |
| 5 | `public/css/spw-chrome.css` | The sticky header always reserves a seam row and row-gap even when no semantic seam is present, creating dead space above the sigil/menu row on narrow screens. | ui-visual | P1 |

## Diagnosis

- The recent attention/handle pass improved button styling, but it still relies on low-opacity inactive states and low-separation fills. On compact screens that makes the mode strip and the mobile menu button look washed into the surrounding paper.
- The shell layout utilities were added with mixed body-level and main-level opt-in selectors, but only the body selectors were fully wired. That leaves the new API asymmetric even before more routes adopt it.
- The header grid models a semantic seam row unconditionally. Because most headers do not render seam content, the row-gap becomes visible as empty space before the actual header controls.

## Planned Fixes

### Commit 1: `#[shell] — restore control contrast and complete layout selectors`
- Increase inactive button legibility in `public/css/spw-handles.css` without making the strip noisy.
- Strengthen the mobile menu toggle treatment in `public/css/spw-chrome.css` so it reads as an actionable control at screenshot distance.
- Collapse the empty header seam row in `public/css/spw-chrome.css` and trim narrow-screen top padding so the header sits against the top edge unless a seam is actually present.
- Repair the `reading` and `split` layout selectors in `public/css/spw-shell.css` so body and main opt-ins behave consistently.
- Ripple risk: low

## Deferred

- Wider desktop measure/composition tuning remains separate from this fix; the immediate patch focuses on control contrast and selector correctness.
- Route-by-route adoption of `data-spw-layout="reading|split|atlas"` remains future work once the shared contract is stable.
