/**
 * Utility row controls (font scale, color mode, base material, theme packs, and tuning discovery).
 */

import { PALETTE_RESONANCE_OPTIONS } from '/public/js/interface/palette-resonance.js';
import {
  TUNING_LEXICON,
  describeSettingValue,
  getSiteSettings,
} from '/public/js/kernel/site-settings.js';
import {
  revealTuningSurfaces,
  TUNING_SURFACES_EVENT,
} from '/public/js/runtime/tuning-discovery.js';
import { syncHeaderActions } from './attention-posture-panel.js';

const FONT_SCALE_STEPS = Object.freeze(['70', '80', '90', '100', '110', '120']);
const COLOR_MODE_STEPS = Object.freeze(['auto', 'dark', 'light']);

const UTILITY_LABELS = Object.freeze({
  compact: Object.freeze({
    'color-light': 'Light',
    'color-dark': 'Dark',
    'font-down': 'Smaller',
    'path-toggle': 'Trail',
    'font-up': 'Larger',
    'clear-matte': 'Clear',
    'toggle-cauldron-visibility': 'State',
    'open-satchel': 'Satchel',
    settings: 'Atlas',
    'reveal-tuners': 'Extend',
    'cycle-explore-posture': 'Explore',
    'cycle-resonance': 'Bias',
    'cycle-color-tuner': 'Guard',
    'cycle-theme-pack': 'Pack',
  }),
  regular: Object.freeze({
    'color-light': 'Light mode',
    'color-dark': 'Dark mode',
    'font-down': 'Smaller text',
    'path-toggle': 'Link trail',
    'font-up': 'Larger text',
    'clear-matte': 'Clear contrast',
    'toggle-cauldron-visibility': 'State visibility',
    'open-satchel': 'State satchel',
    settings: 'Settings atlas',
    'reveal-tuners': 'Reveal extensions',
    'cycle-explore-posture': 'Cycle explore posture',
    'cycle-resonance': 'Cycle resonance',
    'cycle-color-tuner': 'Cycle color guard',
    'cycle-theme-pack': 'Cycle theme pack',
  }),
});

const EXPLORE_POSTURE_CYCLE = Object.freeze(['reading', 'field', 'workshop']);

const THEME_PACK_CYCLE = Object.freeze([
  'neutral-paper',
  'oxide-ledger',
  'electric-studio',
  'ritual-vellum',
  'copper-brace',
  'glass-console',
]);

const COLOR_TUNER_CYCLE = Object.freeze(['soft', 'balanced', 'guarded']);

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

export function getCurrentBaseMaterial() {
  const root = document.documentElement;
  return root.dataset.spwBaseMaterial || 'glass';
}

export function getCurrentHighContrast() {
  const root = document.documentElement;
  return (
    root.dataset.spwHighContrast
    || (window.matchMedia?.('(prefers-contrast: more)').matches ? 'on' : 'off')
  );
}

export function getNextFontScale(direction = 1) {
  const current = getCurrentFontScale();
  const index = Math.max(0, FONT_SCALE_STEPS.indexOf(current));
  const nextIndex = Math.min(FONT_SCALE_STEPS.length - 1, Math.max(0, index + direction));
  return FONT_SCALE_STEPS[nextIndex];
}

export function upgradeUtilityRow(row) {
  if (!(row instanceof HTMLElement)) return;

  if (!row.querySelector('[data-spw-shell-action="reveal-tuners"]')) {
    const cluster = document.createElement('div');
    cluster.className = 'spw-utility-cluster';
    cluster.dataset.spwUtilityCluster = 'tuning-discovery';
    cluster.dataset.spwUtilitySize = 'pair';
    cluster.setAttribute('role', 'group');
    cluster.setAttribute('aria-label', 'Reveal embedded hypermedia extensions on this page');
    cluster.dataset.spwLocality = 'high';
    cluster.dataset.spwComponentLocality = 'tuning-surfaces';
    cluster.dataset.spwPhysicsReason = 'memory-gamified';
    cluster.dataset.spwModuleEvaluates = 'explore-posture tuning-surfaces';
    cluster.innerHTML = `
      <button type="button" class="spw-shell-utility-button" data-spw-shell-action="reveal-tuners" data-spw-utility-size="text" aria-label="Reveal embedded hypermedia extensions on this page" title="Reveal layout, material, and gesture extensions embedded in this page">
        <span class="spw-utility-sigil" aria-hidden="true">◇</span>
        <span class="spw-utility-argument"></span>
      </button>
      <button type="button" class="spw-shell-utility-button" data-spw-shell-action="cycle-explore-posture" data-spw-utility-size="text" aria-label="Cycle explore posture" title="Cycle explore posture (reading, field, workshop)">
        <span class="spw-utility-sigil" aria-hidden="true">⌁</span>
        <span class="spw-utility-argument"></span>
      </button>
    `;
    row.append(cluster);
  } else if (!row.querySelector('[data-spw-shell-action="cycle-explore-posture"]')) {
    const cluster = row.querySelector('[data-spw-utility-cluster="tuning-discovery"]');
    if (cluster instanceof HTMLElement) {
      cluster.dataset.spwUtilitySize = 'pair';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spw-shell-utility-button';
      button.dataset.spwShellAction = 'cycle-explore-posture';
      button.dataset.spwUtilitySize = 'text';
      button.setAttribute('aria-label', 'Cycle explore posture');
      button.title = 'Cycle explore posture (reading, field, workshop)';
      button.innerHTML = `
        <span class="spw-utility-sigil" aria-hidden="true">⌁</span>
        <span class="spw-utility-argument"></span>
      `;
      cluster.append(button);
    }
  }

  if (!row.querySelector('[data-spw-shell-theme-utility]')) {
    const themeCluster = document.createElement('div');
    themeCluster.className = 'spw-utility-cluster';
    themeCluster.dataset.spwUtilityCluster = 'theme-packs';
    themeCluster.dataset.spwUtilitySize = 'pair';
    themeCluster.setAttribute('role', 'group');
    themeCluster.setAttribute('aria-label', 'Theme pack quick picks');
    themeCluster.innerHTML = `
      <div class="spw-shell-theme-utility" data-spw-shell-theme-utility role="group" aria-label="Theme pack swatches"></div>
      <button type="button" class="spw-shell-utility-button" data-spw-shell-action="cycle-theme-pack" data-spw-utility-size="icon" aria-label="Cycle theme pack" title="Cycle theme pack">
        <span class="spw-utility-sigil" aria-hidden="true">☼</span>
        <span class="spw-utility-argument"></span>
      </button>
    `;
    const colorCluster = row.querySelector('[data-spw-utility-cluster="color-mode"]');
    if (colorCluster) colorCluster.insertAdjacentElement('afterend', themeCluster);
    else row.prepend(themeCluster);
  }

  if (!row.querySelector('[data-spw-shell-action="cycle-resonance"]')) {
    const resonanceCluster = document.createElement('div');
    resonanceCluster.className = 'spw-utility-cluster';
    resonanceCluster.dataset.spwUtilityCluster = 'palette-resonance';
    resonanceCluster.dataset.spwUtilitySize = 'pair';
    resonanceCluster.setAttribute('role', 'group');
    resonanceCluster.setAttribute('aria-label', 'Palette resonance bias');
    resonanceCluster.innerHTML = `
      <div class="spw-shell-resonance-utility" data-spw-shell-resonance-utility aria-hidden="true">
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
      </div>
      <button type="button" class="spw-shell-utility-button" data-spw-shell-action="cycle-resonance" data-spw-utility-size="text" aria-label="Cycle palette resonance bias" title="Cycle palette resonance bias">
        <span class="spw-utility-sigil" aria-hidden="true">◎</span>
        <span class="spw-utility-argument"></span>
      </button>
    `;
    row.querySelector('[data-spw-utility-cluster="theme-packs"]')?.insertAdjacentElement('afterend', resonanceCluster)
      || row.append(resonanceCluster);
  } else if (!row.querySelector('[data-spw-shell-resonance-utility]')) {
    const resonanceCluster = row.querySelector('[data-spw-utility-cluster="palette-resonance"]');
    const cycleButton = row.querySelector('[data-spw-shell-action="cycle-resonance"]');
    if (resonanceCluster instanceof HTMLElement && cycleButton instanceof HTMLElement) {
      resonanceCluster.dataset.spwUtilitySize = 'pair';
      const utility = document.createElement('div');
      utility.className = 'spw-shell-resonance-utility';
      utility.dataset.spwShellResonanceUtility = '';
      utility.setAttribute('aria-hidden', 'true');
      utility.innerHTML = `
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
        <span class="palette-probe-chip palette-probe-chip--shell"></span>
      `;
      cycleButton.insertAdjacentElement('beforebegin', utility);
    }
  }

  if (!row.querySelector('[data-spw-shell-action="cycle-color-tuner"]')) {
    const tunerCluster = document.createElement('div');
    tunerCluster.className = 'spw-utility-cluster';
    tunerCluster.dataset.spwUtilityCluster = 'color-tuner';
    tunerCluster.dataset.spwUtilitySize = 'single';
    tunerCluster.setAttribute('role', 'group');
    tunerCluster.setAttribute('aria-label', 'Color depth guard');
    tunerCluster.innerHTML = `
      <button type="button" class="spw-shell-utility-button" data-spw-shell-action="cycle-color-tuner" data-spw-utility-size="text" aria-label="Cycle color depth guard" title="Cycle color depth guard (soft, balanced, guarded)">
        <span class="spw-utility-sigil" aria-hidden="true">◐</span>
        <span class="spw-utility-argument"></span>
      </button>
    `;
    row.querySelector('[data-spw-utility-cluster="palette-resonance"]')?.insertAdjacentElement('afterend', tunerCluster)
      || row.append(tunerCluster);
  }

  if (!row.querySelector('[data-spw-tuning-lexicon]')) {
    const strip = document.createElement('div');
    strip.className = 'spw-tuning-lexicon-strip';
    strip.dataset.spwTuningLexicon = '';
    strip.innerHTML = `
      <p class="spw-tuning-lexicon-strip__kicker">Hypermedia extensions</p>
      <div class="spw-tuning-lexicon-strip__chips" data-spw-tuning-lexicon-chips></div>
      <p class="spw-tuning-lexicon-strip__meta" data-spw-tuning-lexicon-meta></p>
      <div class="spw-tuning-lexicon-strip__actions">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="reveal-tuners" data-spw-utility-size="text">Reveal extensions</button>
        <a class="spw-shell-utility-button" data-spw-shell-action="settings" data-spw-utility-size="text" href="/settings/#runtime-preferences">Full observatory</a>
      </div>
    `;
    row.append(strip);
  }
}

export function ensureUtilityRow(header) {
  if (!(header instanceof HTMLElement)) return null;

  let row = header.querySelector('.spw-shell-utility-row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'spw-shell-utility-row';
    row.setAttribute('role', 'toolbar');
    row.setAttribute('aria-label', 'Site preferences and tuning shortcuts');
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
      <div class="spw-utility-cluster" data-spw-utility-cluster="trail-nav" data-spw-utility-size="pair" role="group" aria-label="Navigation and contrast shortcuts">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="path-toggle" data-spw-utility-size="icon" aria-label="Link trail" title="Expand the link trail">
          <span class="spw-utility-sigil" aria-hidden="true">✦</span>
          <span class="spw-utility-argument">Trail</span>
        </button>
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="clear-matte" data-spw-utility-size="icon" aria-label="Clear contrast" title="Switch to matte surfaces for clear high-contrast reading">
          <span class="spw-utility-sigil" aria-hidden="true">◫</span>
          <span class="spw-utility-argument">Clear</span>
        </button>
      </div>
      <div class="spw-utility-cluster" data-spw-utility-cluster="satchel-atlas" data-spw-utility-size="pair" role="group" aria-label="State satchel and settings atlas shortcuts">
        <button type="button" class="spw-shell-utility-button" data-spw-shell-action="open-satchel" data-spw-utility-size="icon" aria-label="State satchel" title="Open state satchel">
          <span class="spw-utility-sigil" aria-hidden="true">🎒</span>
          <span class="spw-utility-argument">Satchel</span>
        </button>
        <a class="spw-shell-utility-button" data-spw-shell-action="settings" data-spw-utility-size="icon" aria-label="Settings atlas" title="Open appearance and typography settings" href="/settings/#runtime-preferences">
          <span class="spw-utility-sigil" aria-hidden="true">⚙</span>
          <span class="spw-utility-argument">Atlas</span>
        </a>
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

  upgradeUtilityRow(row);

  let disclosure = header.querySelector('details.spw-shell-utility-disclosure');
  if (!disclosure) {
    disclosure = document.createElement('details');
    disclosure.className = 'spw-shell-utility-disclosure';
    disclosure.innerHTML = `
      <summary class="spw-shell-utility-disclosure__summary" aria-label="Preferences and tuning shortcuts">
        <span class="spw-shell-utility-disclosure__label">Preferences &amp; Tuning</span>
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
  const currentBase = getCurrentBaseMaterial();
  const currentHigh = getCurrentHighContrast();
  const min = FONT_SCALE_STEPS[0];
  const max = FONT_SCALE_STEPS[FONT_SCALE_STEPS.length - 1];
  const pathToggle = document.querySelector('.spw-spell-path-toggle');
  const compact = document.documentElement.dataset.spwViewportTier === 'compact'
    || document.documentElement.dataset.spwPointerMode === 'coarse';
  const labels = compact ? UTILITY_LABELS.compact : UTILITY_LABELS.regular;

  row.dataset.spwFontScale = current;
  row.dataset.spwColorMode = currentColorMode;
  row.dataset.spwBaseMaterial = currentBase;
  row.dataset.spwHighContrast = currentHigh;
  row.dataset.spwPathAvailable = pathToggle ? 'true' : 'false';
  row.dataset.spwUtilityMode = compact ? 'compact' : 'regular';
  row.dataset.spwSatchelAvailable = document.querySelector('.spw-state-inspector__launch') ? 'true' : 'false';

  const root = document.documentElement;
  row.dataset.spwAttention = root.dataset.spwAttention || '';
  row.dataset.spwWonderState = root.dataset.spwWonderState || root.dataset.spwWonderMemory || '';
  row.dataset.spwFieldResonance = root.dataset.spwFieldResonance || '';
  row.dataset.spwPhysicsReason = root.dataset.spwPhysicsReason || '';
  row.dataset.spwSemanticDensity = root.dataset.spwSemanticDensity || '';
  row.dataset.spwMetamaterial = currentBase;
  row.dataset.spwModuleEvaluates = Array.from(new Set([
    ...(row.dataset.spwModuleEvaluates || '').split(/\s+/).filter(Boolean),
    'cognitive',
    'attentional',
    'material',
  ])).join(' ');
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

  row.querySelectorAll('[data-spw-shell-action="settings"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels.settings;
    button.title = compact ? 'Open appearance settings' : 'Open appearance and typography settings';
  });

  const isClearMatte = currentBase === 'matte' || currentHigh === 'on';
  row.querySelectorAll('[data-spw-shell-action="clear-matte"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['clear-matte'];
    button.setAttribute('aria-pressed', isClearMatte ? 'true' : 'false');
    button.title = isClearMatte
      ? 'Matte clear contrast active (dense text, forms, inspection)'
      : compact ? 'Switch to matte clear contrast' : 'Switch to matte surfaces for clear high-contrast reading';
  });

  const vis = (window.spwSettings?.get?.()?.cauldronCandidateVisibility) || 'balanced';
  row.dataset.spwCauldronVisibility = vis;
  row.querySelectorAll('[data-spw-shell-action="toggle-cauldron-visibility"]').forEach((button) => {
    const arg = button.querySelector('.spw-utility-argument');
    if (arg) arg.textContent = labels['toggle-cauldron-visibility'] || (compact ? vis : `vis:${vis}`);
  });
}
