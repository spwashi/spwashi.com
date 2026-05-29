# Fix: Gesture & Navigation Interactive Semantics (ARIA Hygiene)

**Origin**: Proposed by another agent session. Captured here for tracking and execution.
**Relationship to other work**: Directly strengthens the gesture, attention, and navigation surfaces that the `hook-region-anatomy` plan (and future hook implementations) will rely on. No conflicts — this is foundational hygiene that makes semantic resonance navigation and hook gestures more robust for assistive technology.

---

The site already has a sophisticated gesture model (brace-gestures, attention-architecture, region-menu, navigation-spells) but several semantic gaps remain: ARIA attributes aren't consistently applied during gesture lifecycle transitions, keyboard affordances for gestures lack clear semantic announcements, the section-handle shell missing `aria-current`/`aria-describedby` hygiene, and the frame-navigator panel has minor ARIA shortfalls. The navigation-spells tokenizer does not write `aria-label` or `aria-describedby` to links it enriches. These are correctness and inspectability gaps — not full rearchitecting.

## Proposed Changes

### 1. `public/js/runtime/brace-gestures.js` — Gesture ARIA lifecycle

#### [MODIFY] [brace-gestures.js](public/js/runtime/brace-gestures.js)

- When `setGesture()` writes `data-spw-gesture`, also write `aria-description` (or `aria-roledescription` as appropriate) on interactive non-link non-button elements to communicate current gesture state to screen readers. Use a lookup table: `{ charging: 'hover active', active: 'pressing', armed: 'hold ready', committed: 'activated' }`.
- When `armed` state fires: if the element has affordance `swap`, write `aria-description="Hold: will swap operator. Release now to confirm."`. For `pin`: `aria-description="Hold: will pin this frame."`.
- Clear `aria-description` on `neutral` / `discharge`.
- Keep existing ARIA attributes (`aria-expanded`, `aria-pressed`) unchanged; this only adds `aria-description` on non-form-control elements.

**Why not aria-live for gestures?** The brace-gesture system already drives CSS. Adding `aria-description` on the target itself is lower-noise than a live region for transient gesture phases — the description only matters if a keyboard or assistive-tech user is focused on the element.

### 2. `public/js/runtime/navigation-spells.js` — Enrich link semantics

#### [MODIFY] [navigation-spells.js](public/js/runtime/navigation-spells.js)

`applyNavigationSpellRecord()` currently writes only `data-spw-*` attributes. It does not apply any ARIA enrichment. Gaps:

- **`aria-current`**: Links whose `data-spw-nav-destination` is `settle` (same-page return) should receive `aria-current="page"` only when the pathname matches. Currently this is left to page-level HTML authoring — but since navigation-spells enriches links dynamically, it can also guard `aria-current` consistently.
- **`aria-label` description**: When a link's visible text is a Spw operator prefix like `#>home`, it is opaque to AT. Write `aria-label` only when the computed label doesn't already match a descriptive phrase. Use `record.label` as the accessible text and ensure the operator prefix is stripped or wrapped in `aria-hidden`.
- **Reversibility hint**: When `data-spw-operator-reversibility` is already set on a link by the author, don't overwrite. Otherwise, set it based on destination: `projection` → `reversible`, `scope` → `inspectable`, `settle` → `replayable`.

> [!NOTE]
> Navigation-spells runs on DOMContentLoaded and via MutationObserver. These additions must be idempotent (guard with `data-spw-nav-tokenized` which is already set).

### 3. `public/js/runtime/attention-architecture.js` — Section handle ARIA hygiene

#### [MODIFY] [attention-architecture.js](public/js/runtime/attention-architecture.js)

The handle shell (`nav.spw-section-handle-shell`) already has `aria-label="Page locomotion"`. Gaps:

- **Prev/Next button `aria-label` dynamism**: When the section name updates (`syncHandleContent`), the prev/next buttons keep static labels `"Jump to previous section"`. Enrich them at `syncHandleContent` time to say `"Jump to previous: [section-name]"` / `"Jump to next: [section-name]"` using the adjacent sections.
- **`aria-current` on progress counter**: The progress node (`spw-section-handle-progress`) has no semantics. Add `aria-label` to it: `aria-label="Section {n} of {total}"` via `writeAttributes`.
- **Scroll cadence live region**: When a section changes via `dispatchEvent(PAGE_SECTION_EVENT)`, there's no AT announcement. Add a visually-hidden `[aria-live="polite"][aria-atomic="true"]` element inside the shell that briefly announces the current section name during programmatic travel (not scroll-driven updates, only handle button clicks).

### 4. `public/js/runtime/frame-navigator.js` — Navigator ARIA completeness

#### [MODIFY] [frame-navigator.js](public/js/runtime/frame-navigator.js)

Current gaps:

- The panel uses `role="dialog"` with `aria-modal="false"` — correct but the trigger button sets `aria-controls="spw-nav-panel"` and `aria-expanded`. This is fine, but the panel is not labeled by its visible title element. **Fix**: add `aria-labelledby` pointing to the `spw-nav-title` span (set an `id` on it: `spw-nav-panel-title`).
- Section label items use `<li class="spw-nav-section-label">` with text content — these are role `listitem`. Add `role="separator"` to mark them as group separators, matching the `role="list"` parent.
- The search `<input type="search">` already has `aria-label`. When filtered results update, the counter updates (good), but there is no explicit `aria-describedby` linking the input to the counter. **Fix**: add `aria-describedby` on the input pointing to the `counter` element so AT announces result counts.
- Frame items: `aria-current="true"` is set correctly. Route items set `aria-current="false"` — per spec this should be omitted entirely (not `"false"`). **Fix**: use `removeAttribute('aria-current')` for non-active items.

### 5. `public/css/handles/operators.css` — Gesture state CSS ARIA bridging

#### [MODIFY] [operators.css](public/css/handles/operators.css)

Add CSS visual affordances for the new `aria-description`-populated gesture states, and plug two existing semantic gaps:

- **`[data-spw-gesture="armed"]` on focusable elements**: Currently only `.spw-living-term` and `[data-spw-form]` have gesture CSS. Add a shared rule for `[data-spw-gesture="armed"]:focus-visible` that renders a dashed focus ring (indicating "hold active, release to commit") distinct from normal `:focus-visible`.
- **`[data-spw-nav-destination]` semantic underline**: Links with `data-spw-nav-destination="projection"` should have a directional underline decoration different from `scope` or `settle`. Add small CSS rules in this layer (scope: operator-chip, header-sigil, frame-operators links).
- **`aria-current="page"` already styled**: Confirm the existing `.operator-chip[aria-current="page"]` rule covers the case where `navigation-spells` now writes it. No new CSS needed — just ensure the selectors are consistent with the JS change.

## Open Questions

> [!NOTE]
> **On `aria-description` vs `aria-roledescription`**: `aria-description` (ARIA 1.3) is widely supported in current AT but `aria-roledescription` is more established in ARIA 1.2. Since this is a gesture hint on a transient basis, `aria-description` is preferred — but if you want ARIA 1.2 purity, the alternative is a `title` attribute update (which has worse AT support). I'll use `aria-description` but can switch to `title` if preferred.

> [!IMPORTANT]
> **Scope for navigation-spells `aria-current`**: The spells module runs dynamically and can write `aria-current="page"` to links that match the current pathname. If the author has already authored `aria-current` on shell nav links, this could produce conflicts. The change will guard with: only write `aria-current` when the link does **not** already have the attribute set, and only when `scope === 'shell'`.

> [!NOTE]
> **Live region for section travel**: The new live-region element inside `.spw-section-handle-shell` will only fire announcements during button-click-initiated travel, not passive scroll-triggered updates, to avoid noisy AT chatter.

## Verification Plan

### Automated Checks
```bash
node --check public/js/runtime/brace-gestures.js
node --check public/js/runtime/navigation-spells.js
node --check public/js/runtime/attention-architecture.js
node --check public/js/runtime/frame-navigator.js
git diff --check
npm run check
```

### Manual Verification
- Focus a `.frame-sigil` with keyboard and hold Space — verify `aria-description` is written and cleared.
- Tab through frame-navigator panel, confirm section separators are announced as separators and active frame is `aria-current`.
- On a page with ≥4 sections, activate the next section button — verify live region announces the new section name.
- Run the dev server (`npm run dev`) and verify no layout regressions in the section handle, navigator panel, or operator chips.

---

## Integration Notes (for hook-region-anatomy)

- The hook region will make heavy use of `data-spw-gesture-contract`, living terms, and navigation tokens.
- Performing this ARIA pass first ensures that any interactive hook (with armed/committed states, operator-prefixed links, and section-aware progression) will announce correctly to AT out of the box.
- After this fix lands, the hook implementation can safely add hook-specific gesture descriptions without fighting baseline gaps.
- Consider adding a short note in the hook plan's "Semantic seams" section referencing this hygiene work as a prerequisite.

## Status
- Gaps verified against current source (as of this capture).
- No prior implementation of the specific ARIA writes described here exists in the public runtime.
- Ready for surgical execution once reviewed.