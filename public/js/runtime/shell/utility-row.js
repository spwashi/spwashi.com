/**
 * Utility row controls (font scale, color mode, link trail).
 *
 * 2026-08-12: pared back to the original 5 controls (color-light/dark,
 * font-down/up, path-toggle — from ae7f9365, 2026-05-05). clear-matte,
 * toggle-cauldron-visibility, open-satchel, settings-atlas, reveal-tuners,
 * and the four cycle-* tuning knobs all arrived in one 446,130-insertion
 * bulk-merge commit (1b00528f, 2026-07-23) with no descriptive message.
 * Cauldron already has its own header action; the state-inspector launch
 * button is already directly reachable in floating chrome; deeper tuning
 * (theme pack, resonance, color guard, explore posture) belongs on the
 * full /settings/ page, not a quick-access header row. See the cascade
 * audit artifact, Part Five, for the full trace.
 */

import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { syncHeaderActions } from './attention-posture-panel.js';

const FONT_SCALE_STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);

const UTILITY_LABELS = Object.freeze({
  compact: Object.freeze({
    'color-light': 'Light',
    'color-dark': 'Dark',
    'font-down': 'Smaller',
    'path-toggle': 'Trail',
    'font-up': 'Larger',
  }),
  regular: Object.freeze({
    'color-light': 'Light mode',
    'color-dark': 'Dark mode',
    'font-down': 'Smaller text',
    'path-toggle': 'Link trail',
    'font-up': 'Larger text',
  }),
});

export function cycleSettingValue(key, options, settings = getSiteSettings()) {
  if (!Array.isArray(options) || !options.length) return '';

  const currentRaw = settings[key] || options[0];
  const normalizedCurrent = String(currentRaw).trim().toLowerCase();

  let index = options.findIndex(
    (opt) => String(opt).trim().toLowerCase() === normalizedCurrent
  );

  if (index === -1) index = 0;

  const nextIndex = (index + 1) % options.length;
  const nextValue = options[nextIndex];

  settings.set({ [key]: nextValue });
  return nextValue;
}

export function getCurrentFontScale() {
  const root = document.documentElement;
  return root.dataset.spwFontScale || '100';
}

export function getCurrentColorMode() {
  const root = document.documentElement;
  return root.dataset.spwColorMode || 'auto';
}

export function getNextFontScale(direction = 1) {
  const current = getCurrentFontScale();
  const index = Math.max(0, FONT_SCALE_STEPS.indexOf(current));
  const nextIndex = Math.min(FONT_SCALE_STEPS.length - 1, Math.max(0, index + direction));
  return FONT_SCALE_STEPS[nextIndex];
}

export function ensureUtilityRow(header) {
  if (!(header instanceof HTMLElement)) return null;

  let row = header.querySelector('.spw-shell-utility-row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'spw-shell-utility-row';
    row.setAttribute('role', 'toolbar');
    row.setAttribute('aria-label', 'Site preferences');
    row.innerHTML = `
      <div class="spw-utility-cluster" data-spw-utility-cluster="color-mode" data-spw-utility-size="pair" role="group" aria-label="Color mode shortcuts">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-light" data-spw-utility-size="icon" aria-label="Light mode" title="Switch to light mode">
          <span class="spw-utility-sigil" aria-hidden="true">☼</span>
          <span class="spw-utility-argument">Light</span>
        </button>
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="color-dark" data-spw-utility-size="icon" aria-label="Dark mode" title="Switch to dark mode">
          <span class="spw-utility-sigil" aria-hidden="true">☾</span>
          <span class="spw-utility-argument">Dark</span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="font-scale" data-spw-utility-size="pair" role="group" aria-label="Text scale shortcuts">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-down" data-spw-utility-size="icon" aria-label="Smaller text" title="Make text smaller">
          <span class="spw-utility-sigil" aria-hidden="true">A-</span>
          <span class="spw-utility-argument">Smaller</span>
        </button>
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="font-up" data-spw-utility-size="icon" aria-label="Larger text" title="Make text larger">
          <span class="spw-utility-sigil" aria-hidden="true">A+</span>
          <span class="spw-utility-argument">Larger</span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="trail-nav" data-spw-utility-size="single" role="group" aria-label="Navigation shortcut">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="path-toggle" data-spw-utility-size="icon" aria-label="Link trail" title="Expand the link trail">
          <span class="spw-utility-sigil" aria-hidden="true">✦</span>
          <span class="spw-utility-argument">Trail</span>
        </button>
      </div>
    `;

    const indicator = header.querySelector('.spw-shell-indicator');
    const actions = header.querySelector('.spw-header-actions');
    const trace = header.querySelector('.spw-header-trace');
    const nav = header.querySelector('nav');
    if (indicator) {
      indicator.insertAdjacentElement('afterend', row);
    } else if (actions) {
      actions.insertAdjacentElement('afterend', row);
    } else if (trace) {
      trace.insertAdjacentElement('afterend', row);
    } else if (nav) {
      nav.insertAdjacentElement('beforebegin', row);
    } else {
      header.append(row);
    }
  }

  let disclosure = header.querySelector('details.spw-shell-utility-disclosure');
  if (!disclosure) {
    disclosure = document.createElement('details');
    disclosure.className = 'spw-shell-utility-disclosure';
    disclosure.innerHTML = `
      <summary class="spw-shell-utility-disclosure__summary" aria-label="Preferences">
        <span class="spw-shell-utility-disclosure__label">Preferences</span>
      </summary>
    `;
    row.insertAdjacentElement('beforebegin', disclosure);
    disclosure.append(row);

    const indicator = header.querySelector('.spw-shell-indicator');
    const actions = header.querySelector('.spw-header-actions');
    const trace = header.querySelector('.spw-header-trace');
    if (indicator) {
      indicator.insertAdjacentElement('afterend', disclosure);
    } else if (actions) {
      actions.insertAdjacentElement('afterend', disclosure);
    } else {
      header.insertBefore(disclosure, indicator || trace || header.querySelector('nav') || null);
    }
  }
  return row;
}

export function syncUtilityRow(row) {
  if (!(row instanceof HTMLElement)) return;

  const current = getCurrentFontScale();
  const currentColorMode = getCurrentColorMode();
  const min = FONT_SCALE_STEPS[0];
  const max = FONT_SCALE_STEPS[FONT_SCALE_STEPS.length - 1];
  const pathToggle = document.querySelector('.spw-spell-path-toggle');
  const compact = document.documentElement.dataset.spwViewportTier === 'compact'
    || document.documentElement.dataset.spwPointerMode === 'coarse';
  const labels = compact ? UTILITY_LABELS.compact : UTILITY_LABELS.regular;

  row.dataset.spwFontScale = current;
  row.dataset.spwColorMode = currentColorMode;
  row.dataset.spwPathAvailable = pathToggle ? 'true' : 'false';
  row.dataset.spwUtilityMode = compact ? 'compact' : 'regular';

  syncHeaderActions(row.closest('.site-header, body > header'));

  row.querySelectorAll('[data-spw-shell-action="color-light"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['color-light'];
    button.setAttribute('aria-pressed', currentColorMode === 'light' ? 'true' : 'false');
    button.title = currentColorMode === 'light' ? 'Light mode active' : 'Switch to light mode';
  });

  row.querySelectorAll('[data-spw-shell-action="color-dark"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['color-dark'];
    button.setAttribute('aria-pressed', currentColorMode === 'dark' ? 'true' : 'false');
    button.title = currentColorMode === 'dark' ? 'Dark mode active' : 'Switch to dark mode';
  });

  row.querySelectorAll('[data-spw-shell-action="font-down"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['font-down'];
    button.toggleAttribute('disabled', current === min);
    button.setAttribute('aria-disabled', current === min ? 'true' : 'false');
    button.title = current === min ? 'Already at the smallest readable size' : 'Make text smaller';
  });

  row.querySelectorAll('[data-spw-shell-action="font-up"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['font-up'];
    button.toggleAttribute('disabled', current === max);
    button.setAttribute('aria-disabled', current === max ? 'true' : 'false');
    button.title = current === max ? 'Already at the largest readable size' : 'Make text larger';
  });

  row.querySelectorAll('[data-spw-shell-action="path-toggle"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['path-toggle'];
    const pathExpanded = pathToggle?.getAttribute('aria-expanded') === 'true';
    button.toggleAttribute('disabled', !pathToggle);
    button.setAttribute('aria-disabled', pathToggle ? 'false' : 'true');
    button.setAttribute('aria-pressed', pathExpanded ? 'true' : 'false');
    button.title = pathToggle
      ? (pathExpanded ? 'Collapse the link trail' : 'Expand the link trail')
      : 'Open the link trail when the header trace finishes mounting';
  });
}
