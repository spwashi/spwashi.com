# Plan - Design Hub Utility Expansion

## Objective
Extend the detail and utility of `/design/components/` and `/design/palettes/` to provide more interactive, documented, and testable surfaces for the Spw design system.

## Proposed Changes

### 1. `/design/components/` Expansion
- **Slot Anatomy Section**: Document the structural contract (`header` -> `meta` -> `body` -> `figure` -> `actions` -> `footer`).
- **Interactive Physics Lab**: Add a section where users can toggle `data-spw-metamaterial` and `data-spw-affordance` on live specimen cards.
- **Operator Intent Registry**: A comprehensive table mapping operator sigils to their type, label, intent, and wonder category.
- **Brace Grammar Specimen**: Visual comparison of `objective` vs `subjective` brace forms.

### 2. `/design/palettes/` Expansion
- **Spectral Resonance Mapping**: Detailed breakdown of resonance modes (`route`, `craft`, `software`, `math`).
- **Interactive Theme Pivot**: Live toggles for `colorMode` and `paletteResonance` that affect the whole page, with a dedicated "resonance probe" area.
- **Image Palette Extraction**: A section demonstrating how `data-spw-accent-colors` and `data-spw-accent-palette` project image colors onto the UI.

### 3. Shared Utilities
- **Code Reference Layer**: Add "Copy HTML" snippets or clearly labeled inspectable code blocks for all specimens.
- **CSS Variable Readout**: (Optional/Phase 2) A tool that shows active CSS tokens for a selected specimen.

## Implementation Steps

1.  **Refactor `/design/components/index.html`**:
    - Add Slot Anatomy section.
    - Add Operator Intent Registry.
    - Add Physics Lab with interaction handles.
2.  **Refactor `/design/palettes/index.html`**:
    - Add Resonance Mapping section.
    - Add Theme Pivot grid.
    - Improve Image Study section with clearer attribute mapping.
3.  **Validation**:
    - Ensure all interactive handles correctly trigger the `SiteSettingsManager`.
    - Audit accessibility and responsive layout.
