/**
 * theme-expression.js — Technical theming dynamics expressed as a concise,
 * syntax-highlighted, scrubbable Spw expression:
 *
 *   theme@[pack]{color}(posture)<lens>
 *
 * Inspired by lore.land's bindery controls ("She binds it in [rag], sets the
 * lamp [low], leaves shutters [open]"), projected into Spw runtime tokens and
 * synced directly through site-settings-engine.js + lens-modes.js.
 */

import { bus } from '/public/js/kernel/bus.js';
import { readSustainedLens } from '/public/js/kernel/visit-intent.js';
import { EXPRESSION_CHANGE_EVENT } from '/public/js/interface/spw-expression.js';
import { LENS_MODE_REQUEST_EVENT } from '/public/js/runtime/page/lens-modes.js';
import { readActiveProfile } from '/public/js/runtime/page/lens-reach.js';

const STYLE_ID = 'spw-theme-expression-style';
const CSS = `
[data-spw-theme-expression] {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--line, rgba(14, 18, 20, 0.14));
  border-radius: var(--shape-component, 8px);
  background: color-mix(in srgb, var(--surface-panel, var(--surface-strong, #fff)) 90%, var(--active-op-color, transparent) 10%);
}
[data-spw-theme-expression] .spw-theme-expression__label {
  font-family: var(--site-mono-font, ui-monospace, monospace);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-soft, currentColor);
}
[data-spw-theme-expression] spw-expression {
  font-size: clamp(0.92rem, 1.4vw, 1.05rem);
  line-height: 1.5;
}
[data-spw-theme-expression] .spw-theme-expression__status {
  margin: 0;
  font-size: 0.85rem;
  color: var(--ink-soft, currentColor);
}
`;

const THEME_PACK_META = Object.freeze({
  'neutral-paper': { label: 'Paper', note: 'neutral-paper — balanced paper & teal ink (OS light-dark)' },
  'oxide-ledger': { label: 'Oxide', note: 'oxide-ledger — cool ledger mint, archive records' },
  'electric-studio': { label: 'Studio', note: 'electric-studio — high-chroma studio weave & craft loom' },
  'ritual-vellum': { label: 'Vellum', note: 'ritual-vellum — warm seasonal parchment & hearth table' },
  'copper-brace': { label: 'Copper', note: 'copper-brace — warm metal ink & structural grammar' },
  'glass-console': { label: 'Glass', note: 'glass-console — crisp console glass, workbench tokens' },
  'banked-ember': { label: 'Ember', note: 'banked-ember — low-glare coal forge, high-contrast warmth' },
});

const COLOR_CHOICES = Object.freeze([
  { value: 'auto', label: 'OS polarity', note: 'colorMode = auto — follows system light-dark()' },
  { value: 'light', label: 'Daylight paper', note: 'colorMode = light — open high-key surface' },
  { value: 'dark', label: 'Night glass', note: 'colorMode = dark — shadowed ground, warm ink' },
]);

const POSTURE_CHOICES = Object.freeze([
  { value: 'reading', label: 'Quiet reader', note: 'explorePosture = reading — calm reading flow' },
  { value: 'field', label: 'Open field', note: 'explorePosture = field — structural relations lit' },
  { value: 'workshop', label: 'Live workshop', note: 'explorePosture = workshop — active handles & workbench weights' },
]);

const PRESET_CHOICES = Object.freeze([
  { value: 'theme@', label: 'Current bind', note: 'theme@ — hold persona or scrub a coordinated preset', patch: null },
  { value: 'hearth@', label: 'Hearth paper', note: 'hearth@ — neutral-paper + daylight + reading composure', patch: { themePack: 'neutral-paper', colorMode: 'auto', explorePosture: 'reading' }, lens: 'reading' },
  { value: 'workshop@', label: 'Workshop console', note: 'workshop@ — glass-console + dark + live workshop tools', patch: { themePack: 'glass-console', colorMode: 'dark', explorePosture: 'workshop' }, lens: 'systems' },
  { value: 'loom@', label: 'Electric studio', note: 'loom@ — electric-studio + open field for craft & art', patch: { themePack: 'electric-studio', colorMode: 'light', explorePosture: 'field' }, lens: 'studio' },
  { value: 'ember@', label: 'Banked ember', note: 'ember@ — banked-ember + dark + tactile focus', patch: { themePack: 'banked-ember', colorMode: 'dark', explorePosture: 'reading' }, lens: 'play' },
]);

const BASE_LENSES = Object.freeze(['reading', 'systems', 'studio', 'play', 'workbench', 'inspect', 'reuse']);

function readRootSettings(doc = globalThis.document) {
  const dataset = doc?.documentElement?.dataset || {};
  return {
    themePack: dataset.spwThemePack || 'neutral-paper',
    colorMode: dataset.spwColorMode || 'auto',
    explorePosture: dataset.spwExplorePosture || 'reading',
  };
}

function requestSettingsPatch(doc, patch = {}) {
  const dataset = doc?.documentElement?.dataset;
  if (dataset) {
    if (patch.themePack) dataset.spwThemePack = patch.themePack;
    if (patch.colorMode) dataset.spwColorMode = patch.colorMode;
    if (patch.explorePosture) dataset.spwExplorePosture = patch.explorePosture;
  }
  bus.emit('spw:settings-request', { patch, source: 'theme-expression' });
}

function ensureStyles(doc) {
  if (!doc?.head || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}

function collectLensChoices(doc) {
  const seen = new Map();
  for (const button of doc.querySelectorAll('main .mode-switch [data-set-mode]')) {
    const mode = button.getAttribute('data-set-mode');
    if (!mode || seen.has(mode)) continue;
    const label = (button.querySelector('span')?.textContent || button.textContent || mode).trim();
    seen.set(mode, {
      value: mode,
      label,
      group: button.getAttribute('data-mode-group') || 'lens',
      note: `lens <${mode}> — weights matching cards, variants & copy`,
    });
  }
  for (const fallback of BASE_LENSES) {
    if (seen.has(fallback)) continue;
    seen.set(fallback, {
      value: fallback,
      label: fallback,
      group: 'lens',
      note: `lens <${fallback}> — sustained profile bias across routes`,
    });
  }
  return [...seen.values()];
}

function inferSubjectValue(settings) {
  for (const preset of PRESET_CHOICES) {
    if (!preset.patch) continue;
    if (
      settings.themePack === preset.patch.themePack
      && settings.colorMode === preset.patch.colorMode
      && settings.explorePosture === preset.patch.explorePosture
    ) {
      return preset.value;
    }
  }
  return 'theme@';
}

export function buildThemeExpressionModel(doc = globalThis.document, settings = readRootSettings(doc)) {
  const profile = readActiveProfile(doc);
  const themeChoices = Object.keys(THEME_PACK_META).map((value) => ({
    value,
    label: THEME_PACK_META[value]?.label || value,
    note: THEME_PACK_META[value]?.note || value,
  }));
  const lensChoices = collectLensChoices(doc);
  const activeLens = doc?.documentElement?.dataset?.spwActiveLensMode
    || readSustainedLens()?.mode
    || profile.lens
    || lensChoices[0]?.value
    || 'reading';

  return {
    operator: '',
    slots: [
      { name: 'subject', value: inferSubjectValue(settings), choices: PRESET_CHOICES },
      { name: 'mode', value: settings.themePack || 'neutral-paper', choices: themeChoices },
      { name: 'body', value: settings.colorMode || 'auto', choices: COLOR_CHOICES },
      { name: 'scene', value: settings.explorePosture || 'reading', choices: POSTURE_CHOICES },
      { name: 'projection', value: activeLens, choices: lensChoices },
    ],
  };
}

function describeCurrentReceipt(doc, settings) {
  const pack = THEME_PACK_META[settings.themePack]?.label || settings.themePack || 'Paper';
  const color = settings.colorMode || 'auto';
  const posture = settings.explorePosture || 'reading';
  const lens = doc?.documentElement?.dataset?.spwActiveLensMode || readSustainedLens()?.mode || 'reading';
  const profileHits = doc?.querySelectorAll?.('main [data-spw-lens-reach~="profile"]')?.length || 0;
  const suffix = profileHits ? ` · ${profileHits} matching surfaces lit` : '';
  return `${pack} ink · ${color} light · ${posture} aperture · <${lens}> lens${suffix}`;
}

export function mountThemeExpression(host) {
  if (!host || host.dataset.spwThemeExprMounted === 'true') return () => {};
  const doc = host.ownerDocument || globalThis.document;
  ensureStyles(doc);
  host.dataset.spwThemeExprMounted = 'true';

  const kicker = doc.createElement('span');
  kicker.className = 'spw-theme-expression__label';
  kicker.textContent = 'Surface instrumentation · tap, arrows, or horizontal drag to scrub';

  const expr = doc.createElement('spw-expression');
  expr.setAttribute('aria-label', 'Scrubbable surface theming expression: preset, theme pack, light mode, aperture, and lens');
  expr.model = buildThemeExpressionModel(doc);

  const status = doc.createElement('p');
  status.className = 'spw-theme-expression__status';
  status.setAttribute('aria-live', 'polite');
  status.textContent = describeCurrentReceipt(doc, readRootSettings(doc));

  host.replaceChildren(kicker, expr, status);

  const sync = () => {
    const settings = readRootSettings(doc);
    const nextModel = buildThemeExpressionModel(doc, settings);
    for (const slot of nextModel.slots) {
      expr.setValue(slot.name, slot.value);
    }
    status.textContent = describeCurrentReceipt(doc, settings);
  };

  expr.addEventListener(EXPRESSION_CHANGE_EVENT, (event) => {
    const { slot, value, choice } = event.detail || {};
    if (!slot || !value) return;
    event.preventDefault();

    if (slot === 'subject') {
      const preset = PRESET_CHOICES.find((item) => item.value === value);
      if (preset?.patch) requestSettingsPatch(doc, preset.patch);
      if (preset?.lens) {
        const match = collectLensChoices(doc).find((item) => item.value === preset.lens);
        bus.emit(LENS_MODE_REQUEST_EVENT, {
          group: match?.group || doc.documentElement?.dataset?.spwActiveLensGroup || 'lens',
          mode: preset.lens,
          source: 'profile',
        });
      }
    } else if (slot === 'mode') {
      requestSettingsPatch(doc, { themePack: value });
    } else if (slot === 'body') {
      requestSettingsPatch(doc, { colorMode: value });
    } else if (slot === 'scene') {
      requestSettingsPatch(doc, { explorePosture: value });
    } else if (slot === 'projection') {
      bus.emit(LENS_MODE_REQUEST_EVENT, {
        group: choice?.group || doc.documentElement?.dataset?.spwActiveLensGroup || 'lens',
        mode: value,
        source: 'mode-switch',
      });
    }

    sync();
  });

  const offSettings = bus.on('settings:changed', sync);
  const offMode = bus.on('frame:mode', sync);

  return () => {
    offSettings?.();
    offMode?.();
    delete host.dataset.spwThemeExprMounted;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'theme-expression',
  mount: (_ctx, root) => mountThemeExpression(root),
});

export const spwModule = SPW_MODULE_EXPORT;
export default spwModule;
