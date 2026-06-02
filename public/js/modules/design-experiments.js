import { bus } from '/public/js/kernel/bus.js';
import {
  createSpwLogger,
  markInstrumented,
  snapshotInstrumentationTarget,
} from '/public/js/kernel/instrumentation.js';
import {
  getSiteSettings,
  saveSiteSettings,
  setBaseMetamaterial,
  setClearContrastMatte,
  setHighContrast,
  validatePartialSettings
} from '/public/js/kernel/site-settings.js';

const ROOT_SELECTOR = '[data-design-experiments-root]';
const BUNDLE_SELECTOR = '[data-design-setting-bundle]';
const TOKEN_VALUE_SELECTOR = '[data-design-token-value]';
const TOKEN_METER_SELECTOR = '[data-design-token-meter]';
const VARIABLE_LAB_SELECTOR = '[data-design-css-variable-lab]';
const VARIABLE_CONTROL_SELECTOR = '[data-design-css-var-control]';
const VARIABLE_VALUE_SELECTOR = '[data-design-css-var-value]';
const VARIABLE_RESET_SELECTOR = '[data-design-css-var-reset]';
const VARIABLE_STATUS_SELECTOR = '[data-design-css-var-status]';
const VARIABLE_STORAGE_KEY = 'spw-design-css-variable-lab';
const RULE_BENCH_SELECTOR = '[data-design-css-rule-bench]';
const RULE_CONTROL_SELECTOR = '[data-design-rule-axis][data-design-rule-value]';
const RULE_READOUT_SELECTOR = '[data-design-rule-readout]';
const RULE_CODE_SELECTOR = '[data-design-rule-code]';
const RULE_STATUS_SELECTOR = '[data-design-rule-status]';
const RULE_MAP_SELECTOR = '[data-design-rule-map]';
const MATERIAL_BENCH_SELECTOR = '[data-design-material-bench]';
const MATERIAL_CONTROL_SELECTOR = '[data-design-material-set]';
const MATERIAL_SPECIMEN_SELECTOR = '[data-design-material-specimen]';
const MATERIAL_READOUT_SELECTOR = '[data-design-material-readout]';
const PROMO_SPECIMEN_SELECTOR = '[data-design-promo-specimen]';
const MATERIAL_MODES = Object.freeze(['glass', 'matte', 'contrast']);

const RULE_DATASET_KEYS = Object.freeze({
  boxModel: 'designBoxModel',
  cascadeLayer: 'designCascadeLayer',
  selectorScope: 'designSelectorScope',
});

const RULE_LABELS = Object.freeze({
  boxModel: Object.freeze({
    'border-box': 'border-box',
    'content-box': 'content-box',
    contained: 'contained border-box',
  }),
  cascadeLayer: Object.freeze({
    tokens: 'tokens',
    components: 'components',
    ornament: 'ornament',
  }),
  selectorScope: Object.freeze({
    region: 'region',
    component: 'component',
    slot: 'slot',
  }),
});

const logger = createSpwLogger('design-experiments', {
  role: 'design-lab-controller',
  metaphor: 'lab-instrument',
  owns: `${ROOT_SELECTOR}, ${RULE_BENCH_SELECTOR}, ${VARIABLE_LAB_SELECTOR}`,
  writes: 'design-rule datasets, CSS variable style overrides, token readouts',
});

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseBundle(bundle = '') {
  const entries = String(bundle)
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(':').map((part) => part.trim()))
    .filter(([name, value]) => name && value);

  if (!entries.length) return null;

  return Object.fromEntries(entries);
}

function parseNumericToken(value = '') {
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readVariableStore() {
  try {
    return safeParseJson(window.localStorage.getItem(VARIABLE_STORAGE_KEY), {});
  } catch {
    return {};
  }
}

function writeVariableStore(next) {
  try {
    if (!next || !Object.keys(next).length) {
      window.localStorage.removeItem(VARIABLE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(VARIABLE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage is optional here.
  }
}

function findVariableStatusNode(root) {
  if (!(root instanceof HTMLElement)) return null;
  return root.querySelector(VARIABLE_STATUS_SELECTOR);
}

function getVariableLabs(root) {
  if (!(root instanceof HTMLElement)) return [];
  if (root.matches(VARIABLE_LAB_SELECTOR)) return [root];
  return Array.from(root.querySelectorAll(VARIABLE_LAB_SELECTOR));
}

function getRuleBenches(root) {
  if (!(root instanceof HTMLElement)) return [];
  if (root.matches(RULE_BENCH_SELECTOR)) return [root];
  return Array.from(root.querySelectorAll(RULE_BENCH_SELECTOR));
}

function getMaterialBenches(root) {
  if (!(root instanceof HTMLElement)) return [];
  if (root.matches(MATERIAL_BENCH_SELECTOR)) return [root];
  return Array.from(root.querySelectorAll(MATERIAL_BENCH_SELECTOR));
}

function getControlValue(control) {
  const unit = control.getAttribute('data-design-css-var-unit') || '';
  return unit ? `${control.value}${unit}` : control.value;
}

function getControlDefaultValue(control) {
  return control.defaultValue || control.getAttribute('data-design-css-var-default') || control.value || '';
}

function syncVariableValueNodes(root) {
  if (!(root instanceof HTMLElement)) return;

  const styles = getComputedStyle(document.documentElement);
  root.querySelectorAll(VARIABLE_VALUE_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const token = node.getAttribute('data-design-css-var-value');
    if (!token) return;
    node.textContent = styles.getPropertyValue(token).trim() || node.getAttribute('data-design-css-var-default') || 'unset';
  });
}

function applyVariableControl(control) {
  if (!(control instanceof HTMLInputElement)) return null;
  const token = control.getAttribute('data-design-css-var-control');
  if (!token) return null;

  const value = getControlValue(control);
  document.documentElement.style.setProperty(token, value);
  return { token, value };
}

function syncVariableControls(root) {
  if (!(root instanceof HTMLElement)) return;

  const store = readVariableStore();
  root.querySelectorAll(VARIABLE_CONTROL_SELECTOR).forEach((control) => {
    if (!(control instanceof HTMLInputElement)) return;
    const token = control.getAttribute('data-design-css-var-control');
    if (!token) return;

    const saved = store[token];
    if (saved !== undefined && saved !== null && saved !== '') {
      control.value = String(saved);
      document.documentElement.style.setProperty(token, getControlValue(control));
    }
  });

  syncVariableValueNodes(root);
}

function updateVariableStatus(root, message, type = 'info') {
  writeStatus(findVariableStatusNode(root), message, type);
}

function bindVariableControl(control, lab, scope) {
  if (!(control instanceof HTMLInputElement) || !(lab instanceof HTMLElement) || !(scope instanceof HTMLElement)) return () => {};

  const handleInput = () => {
    const token = control.getAttribute('data-design-css-var-control');
    if (!token) return;

    const defaultValue = getControlDefaultValue(control);
    const next = readVariableStore();
    if (String(control.value) === String(control.defaultValue || defaultValue)) {
      delete next[token];
    } else {
      next[token] = control.value;
    }

    const applied = applyVariableControl(control);
    writeVariableStore(next);
    syncVariableValueNodes(lab);
    syncTokenValues(scope);
    if (applied) {
      updateVariableStatus(lab, `Updated ${applied.token} to ${applied.value}.`, 'success');
    }
  };

  control.addEventListener('input', handleInput);
  control.addEventListener('change', handleInput);

  return () => {
    control.removeEventListener('input', handleInput);
    control.removeEventListener('change', handleInput);
  };
}

function bindVariableLab(lab, scope) {
  if (!(lab instanceof HTMLElement) || !(scope instanceof HTMLElement)) return () => {};

  const controls = Array.from(lab.querySelectorAll(VARIABLE_CONTROL_SELECTOR));
  if (!controls.length) return () => {};

  syncVariableControls(lab);
  syncTokenValues(scope);

  const cleanups = controls.map((control) => bindVariableControl(control, lab, scope));
  const resetButtons = Array.from(lab.querySelectorAll(VARIABLE_RESET_SELECTOR));

  const handleReset = () => {
    controls.forEach((control) => {
      if (!(control instanceof HTMLInputElement)) return;
      const token = control.getAttribute('data-design-css-var-control');
      if (!token) return;

      control.value = control.defaultValue;
      document.documentElement.style.removeProperty(token);
    });

    writeVariableStore({});
    syncVariableValueNodes(lab);
    syncTokenValues(scope);
    updateVariableStatus(lab, 'Reset CSS variables to authored defaults.', 'success');
  };

  resetButtons.forEach((button) => button.addEventListener('click', handleReset));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    resetButtons.forEach((button) => button.removeEventListener('click', handleReset));
  };
}

function getRuleState(bench) {
  return {
    boxModel: bench.dataset.designBoxModel || 'border-box',
    cascadeLayer: bench.dataset.designCascadeLayer || 'components',
    selectorScope: bench.dataset.designSelectorScope || 'component',
  };
}

function renderRuleCode(state) {
  const selector = state.selectorScope === 'region'
    ? '[data-design-css-rule-bench] *'
    : state.selectorScope === 'slot'
      ? '.design-rule-specimen [data-design-rule-slot]'
      : '.design-rule-specimen';
  const layer = state.cascadeLayer === 'tokens'
    ? '--active-op-color: var(--op-ref-color);'
    : state.cascadeLayer === 'ornament'
      ? 'box-shadow: 0 0 0 3px var(--active-op-color);'
      : 'border-color: var(--active-op-color);';
  const box = state.boxModel === 'content-box'
    ? 'box-sizing: content-box;'
    : 'box-sizing: border-box;';

  return `${selector} {\n  ${box}\n  ${layer}\n}`;
}

function syncRuleBench(bench) {
  if (!(bench instanceof HTMLElement)) return;
  const state = getRuleState(bench);
  markInstrumented(bench, 'design-experiments', {
    tags: ['css-rule-bench', state.selectorScope, state.cascadeLayer, state.boxModel],
    state: 'synced',
  });

  bench.querySelectorAll(RULE_READOUT_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const key = node.getAttribute('data-design-rule-readout');
    node.textContent = RULE_LABELS[key]?.[state[key]] || state[key] || 'unset';
  });

  bench.querySelectorAll(RULE_CODE_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) node.textContent = renderRuleCode(state);
  });

  bench.querySelectorAll(RULE_CONTROL_SELECTOR).forEach((control) => {
    if (!(control instanceof HTMLElement)) return;
    const axis = control.getAttribute('data-design-rule-axis');
    const value = control.getAttribute('data-design-rule-value');
    const active = axis && value && state[axis] === value;
    control.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  bench.querySelectorAll(RULE_MAP_SELECTOR).forEach((map) => {
    if (!(map instanceof SVGElement)) return;
    map.dataset.designSelectorScope = state.selectorScope;
    map.dataset.designCascadeLayer = state.cascadeLayer;
    map.dataset.designBoxModel = state.boxModel;
  });
}

function bindRuleBench(bench) {
  if (!(bench instanceof HTMLElement)) return () => {};

  syncRuleBench(bench);

  const controls = Array.from(bench.querySelectorAll(RULE_CONTROL_SELECTOR));
  const handleClick = (event) => {
    const control = event.currentTarget;
    if (!(control instanceof HTMLElement)) return;

    const axis = control.getAttribute('data-design-rule-axis');
    const value = control.getAttribute('data-design-rule-value');
    const datasetKey = RULE_DATASET_KEYS[axis];
    if (!datasetKey || !value) return;

    bench.dataset[datasetKey] = value;
    syncRuleBench(bench);
    logger.debug('rule bench updated', getRuleState(bench), 'gesture');
    writeStatus(
      bench.querySelector(RULE_STATUS_SELECTOR),
      `Rule bench set ${axis} to ${value}.`,
      'success'
    );
  };

  controls.forEach((control) => {
    control.addEventListener('click', handleClick);
  });

  return () => {
    controls.forEach((control) => control.removeEventListener('click', handleClick));
  };
}

function normalizeMaterialMode(value = 'matte') {
  return MATERIAL_MODES.includes(value) ? value : 'matte';
}

function getMaterialMode(bench) {
  return normalizeMaterialMode(bench?.dataset?.designMaterialMode);
}

function syncMaterialBench(bench) {
  if (!(bench instanceof HTMLElement)) return;
  const mode = getMaterialMode(bench);
  bench.dataset.designMaterialMode = mode;
  markInstrumented(bench, 'design-experiments', {
    tags: ['material-bench', mode],
    state: 'synced',
  });

  bench.querySelectorAll(MATERIAL_CONTROL_SELECTOR).forEach((control) => {
    if (!(control instanceof HTMLElement)) return;
    const controlMode = normalizeMaterialMode(control.getAttribute('data-design-material-set'));
    const active = controlMode === mode;
    control.setAttribute('aria-pressed', active ? 'true' : 'false');
  });

  bench.querySelectorAll(MATERIAL_SPECIMEN_SELECTOR).forEach((specimen) => {
    if (!(specimen instanceof HTMLElement)) return;
    const material = normalizeMaterialMode(specimen.getAttribute('data-spw-metamaterial'));
    specimen.dataset.designMaterialActive = material === mode ? 'true' : 'false';
  });

  // Live update promo/demo notice specimens so style experimentation on the hub
  // shows how floating chrome (daily promos, discovery notices) render under the
  // chosen material. Ties the material bench directly to feature surfaces for
  // better discoverability and page surface area.
  bench.querySelectorAll(PROMO_SPECIMEN_SELECTOR).forEach((specimen) => {
    if (!(specimen instanceof HTMLElement)) return;
    specimen.setAttribute('data-spw-metamaterial', mode);
    // Also reflect on any inner notice-like elements if present
    specimen.querySelectorAll('.spw-discovery-notice, [data-spw-promo-theme]').forEach((inner) => {
      if (inner instanceof HTMLElement) inner.setAttribute('data-spw-metamaterial', mode);
    });
  });

  bench.querySelectorAll(MATERIAL_READOUT_SELECTOR).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const key = node.getAttribute('data-design-material-readout');
    if (key === 'mode') node.textContent = mode;
  });
}

function bindMaterialBench(bench) {
  if (!(bench instanceof HTMLElement)) return () => {};

  syncMaterialBench(bench);

  const controls = Array.from(bench.querySelectorAll(MATERIAL_CONTROL_SELECTOR));
  const handleClick = (event) => {
    const control = event.currentTarget;
    if (!control || typeof control.getAttribute !== 'function') return;
    const mode = normalizeMaterialMode(control.getAttribute('data-design-material-set'));
    bench.dataset.designMaterialMode = mode;
    syncMaterialBench(bench);
    syncTokenValues(bench);
    logger.debug('material bench updated', { mode }, 'gesture');
  };

  controls.forEach((control) => control.addEventListener('click', handleClick));

  return () => {
    controls.forEach((control) => control.removeEventListener('click', handleClick));
  };
}

function bindMaterialDelegation(scope) {
  if (!(scope instanceof HTMLElement)) return () => {};

  const handleClick = (event) => {
    const control = event.target?.closest?.(MATERIAL_CONTROL_SELECTOR);
    if (!control || !scope.contains(control)) return;
    const bench = control.closest(MATERIAL_BENCH_SELECTOR);
    if (!(bench instanceof HTMLElement)) return;
    const mode = normalizeMaterialMode(control.getAttribute('data-design-material-set'));
    bench.dataset.designMaterialMode = mode;
    syncMaterialBench(bench);
    syncTokenValues(scope);
    logger.debug('material bench updated', { mode }, 'gesture');
  };

  scope.addEventListener('click', handleClick);
  return () => scope.removeEventListener('click', handleClick);
}

function bindDesignConsoleFallback(scope) {
  if (!(scope instanceof HTMLElement)) return () => {};

  const install = () => {
    if (window.spwDesignExperiments) return;
    const fallbackConsole = Object.freeze(createDesignExperimentsConsole([scope]));
    window.spwDesignExperiments = fallbackConsole;
    globalThis.spwDesignExperiments = fallbackConsole;
  };

  install();
  window.setTimeout(install, 0);
  window.setTimeout(install, 250);
  return () => {};
}

function createDesignExperimentsConsole(roots) {
  const getBenches = () => roots.flatMap((scope) => getRuleBenches(scope));
  const getMaterialBenchList = () => roots.flatMap((scope) => getMaterialBenches(scope));
  return Object.freeze({
    inspectMaterialBench(index = 0) {
      return snapshotInstrumentationTarget(getMaterialBenchList()[index], {
        includeText: true,
        tokens: ['--surface-matte', '--surface-matte-strong', '--surface-contrast', '--ink-on-matte', '--ink-on-matte-strong', '--text-on-matte'],
      });
    },
    inspectRuleBench(index = 0) {
      return snapshotInstrumentationTarget(getBenches()[index], {
        includeText: true,
        tokens: ['--active-op-color', '--shape-surface', '--line-mid'],
      });
    },
    inspectTokens(tokens = ['--shape-component', '--shape-surface', '--line-mid', '--attention-field-radius']) {
      const styles = getComputedStyle(document.documentElement);
      return Object.fromEntries(tokens.map((token) => [token, styles.getPropertyValue(token).trim() || 'unset']));
    },
    setRuleBench(next = {}, index = 0) {
      const bench = getBenches()[index];
      if (!(bench instanceof HTMLElement)) return null;
      Object.entries(RULE_DATASET_KEYS).forEach(([axis, datasetKey]) => {
        if (next[axis]) bench.dataset[datasetKey] = String(next[axis]);
      });
      syncRuleBench(bench);
      return getRuleState(bench);
    },
    setMaterialBench(mode = 'matte', index = 0) {
      const bench = getMaterialBenchList()[index];
      if (!(bench instanceof HTMLElement)) return null;
      bench.dataset.designMaterialMode = normalizeMaterialMode(mode);
      syncMaterialBench(bench);
      return getMaterialMode(bench);
    },
    /* New for style experimentation architecture: drive global matte clear contrast
       (uses canonical site-settings so it persists + emits + affects page treatment).
       Now delegates to explicit setter (single save + full kernel contract). */
    applyClearMatteContrast() {
      const root = document.documentElement;
      // Immediate local dataset for bench specimens + live promo preview (before/parallel to apply).
      // The setter will re-apply the authoritative datasets via applySiteSettings.
      root.dataset.spwBaseMetamaterial = 'matte';
      if (root.dataset.spwHighContrast !== 'on') root.dataset.spwHighContrast = 'on';
      try {
        if (typeof setClearContrastMatte === 'function') {
          setClearContrastMatte(true);
        } else if (typeof setBaseMetamaterial === 'function' && typeof setHighContrast === 'function') {
          setBaseMetamaterial('matte');
          setHighContrast('on');
        } else if (typeof saveSiteSettings === 'function') {
          saveSiteSettings({ baseMetamaterial: 'matte', highContrast: 'on' });
        }
      } catch {}
      // Refresh local benches to match
      getMaterialBenchList().forEach((b) => { b.dataset.designMaterialMode = 'matte'; syncMaterialBench(b); });
      return { baseMetamaterial: 'matte', highContrast: 'on' };
    },
    inspectSemanticTokens(focus = ['--surface-matte', '--ink-on-matte', '--ink-on-matte-strong', '--text-on-matte', '--material-ink-matte-strong']) {
      const styles = getComputedStyle(document.documentElement);
      return Object.fromEntries(focus.map((t) => [t, styles.getPropertyValue(t).trim() || 'unset']));
    },
    getCurrentContrastState() {
      const s = document.documentElement.dataset;
      return {
        baseMetamaterial: s.spwBaseMetamaterial || s.baseMetamaterial,
        highContrast: s.spwHighContrast,
        colorMode: s.spwColorMode,
        themePack: s.spwThemePack,
      };
    },
    /* Immediate appearance tuning abstractions for design page (live, non-persisted preview for playful exp).
       Sets data attrs + CSS vars directly on root for instant feedback on color, contrast, motif (incl. new minimal),
       font scale (normalization preview), layout. Useful for testing material properties, contrast audit, minimalist motifs
       without full settings roundtrip. Composes with existing material bench, bundles, query. */
    setImmediateAppearance({ accent, contrastBoost, motif, fontScale, layout } = {}) {
      const root = document.documentElement;
      if (accent) root.style.setProperty('--active-op-color', accent); // dynamic JS style ok for preview
      if (contrastBoost != null) root.style.setProperty('--pigment-context-boost', String(contrastBoost));
      if (motif) root.dataset.spwComponentMotif = motif; // e.g. 'minimal' for playful material exp
      if (fontScale) root.dataset.spwFontSizeScale = String(fontScale);
      if (layout) root.dataset.spwLayout = layout;
      // Re-sync any benches
      try { window.spwDesignExperiments?.refresh?.(); } catch {}
      return { accent, contrastBoost, motif, fontScale, layout };
    },
    resetImmediateAppearance() {
      const root = document.documentElement;
      root.style.removeProperty('--active-op-color');
      root.style.removeProperty('--pigment-context-boost');
      // keep data from settings, but clear preview overrides if set
      delete root.dataset.spwComponentMotif; // will fall to flavor
      // font/layout leave to settings or explicit
      try { window.spwDesignExperiments?.refresh?.(); } catch {}
    },
  });
}

function writeStatus(node, message, type = 'info') {
  if (!(node instanceof HTMLElement)) return;
  node.textContent = message;
  node.dataset.status = type;
}

function findStatusNode(root) {
  if (!(root instanceof HTMLElement)) return null;
  return root.querySelector('[data-site-settings-status]');
}

function syncTokenValues(root) {
  if (!(root instanceof HTMLElement)) return;

  const styles = getComputedStyle(document.documentElement);

  root.querySelectorAll(TOKEN_VALUE_SELECTOR).forEach((node) => {
    const token = node.getAttribute('data-design-token-value');
    if (!token) return;
    const value = styles.getPropertyValue(token).trim() || node.getAttribute('data-design-token-fallback') || 'unset';
    node.textContent = value;
  });

  root.querySelectorAll(TOKEN_METER_SELECTOR).forEach((node) => {
    const token = node.getAttribute('data-design-token-meter');
    if (!token) return;

    const rawValue = styles.getPropertyValue(token).trim();
    const numericValue = parseNumericToken(rawValue);
    const max = Number.parseFloat(node.getAttribute('data-design-token-max') || '1');
    const fallback = node.getAttribute('data-design-token-fallback') || '0';

    if (numericValue === null || !Number.isFinite(max) || max <= 0) {
      node.style.setProperty('--design-meter-fill', '0');
      node.dataset.designMeterValue = fallback;
      return;
    }

    node.style.setProperty('--design-meter-fill', String(clampNumber(numericValue / max, 0, 1)));
    node.dataset.designMeterValue = rawValue;
  });
}

function syncBundleButtons(root, settings = getSiteSettings()) {
  if (!(root instanceof HTMLElement)) return;

  root.querySelectorAll(BUNDLE_SELECTOR).forEach((button) => {
    if (!(button instanceof HTMLElement)) return;

    const bundle = parseBundle(button.getAttribute('data-design-setting-bundle'));
    if (!bundle) return;

    const isActive = Object.entries(bundle).every(([name, value]) => settings[name] === value);
    button.dataset.designBundleActive = isActive ? 'true' : 'false';

    if (button instanceof HTMLButtonElement || button.getAttribute('role') === 'button') {
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  });
}

function syncRoot(root, settings = getSiteSettings()) {
  syncTokenValues(root);
  syncBundleButtons(root, settings);
  getVariableLabs(root).forEach((lab) => {
    syncVariableControls(lab);
  });
  getRuleBenches(root).forEach(syncRuleBench);
  getMaterialBenches(root).forEach(syncMaterialBench);
}

function applyBundle(button, root) {
  if (!(button instanceof HTMLElement) || !(root instanceof HTMLElement)) return null;

  const bundle = parseBundle(button.getAttribute('data-design-setting-bundle'));
  if (!bundle) return null;

  const validation = validatePartialSettings(bundle);
  if (!validation.valid) {
    writeStatus(findStatusNode(root), 'Bundle contains an invalid setting.', 'info');
    return null;
  }

  // Bundle paths already go through canonical saveSiteSettings (validate + normalize + apply + bus).
  const saved = saveSiteSettings(bundle);
  const label = button.getAttribute('data-design-bundle-label') || button.textContent?.trim() || 'bundle';

  syncRoot(root, saved);
  writeStatus(findStatusNode(root), `Applied ${label.toLowerCase()} locally.`, 'success');

  return saved;
}

function bindBundleButton(button, root) {
  if (!(button instanceof HTMLElement)) {
    return () => {};
  }

  if (!(button instanceof HTMLButtonElement) && !button.hasAttribute('role')) {
    button.setAttribute('role', 'button');
  }

  const handleClick = (event) => {
    if (button instanceof HTMLAnchorElement) event.preventDefault();
    applyBundle(button, root);
  };

  const handleKeydown = (event) => {
    if (event.defaultPrevented) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (button instanceof HTMLButtonElement) return;
    event.preventDefault();
    applyBundle(button, root);
  };

  button.addEventListener('click', handleClick);
  button.addEventListener('keydown', handleKeydown);

  return () => {
    button.removeEventListener('click', handleClick);
    button.removeEventListener('keydown', handleKeydown);
  };
}

function resolveRoots(root = document) {
  if (root === document) {
    return Array.from(document.querySelectorAll(ROOT_SELECTOR));
  }

  if (!(root instanceof HTMLElement)) {
    return [];
  }

  if (root.matches(ROOT_SELECTOR)) {
    return [root];
  }

  return Array.from(root.querySelectorAll(ROOT_SELECTOR));
}

export function initDesignExperiments(root = document) {
  const roots = resolveRoots(root);
  if (!roots.length) return undefined;

  const cleanups = roots.flatMap((scope) => (
    Array.from(scope.querySelectorAll(BUNDLE_SELECTOR)).map((button) => bindBundleButton(button, scope))
  ));
  const variableCleanups = roots.flatMap((scope) => getVariableLabs(scope).map((lab) => bindVariableLab(lab, scope)));
  const ruleCleanups = roots.flatMap((scope) => getRuleBenches(scope).map(bindRuleBench));
  const materialCleanups = roots.flatMap((scope) => getMaterialBenches(scope).map(bindMaterialBench));
  const materialDelegationCleanups = roots.map(bindMaterialDelegation);
  const consoleFallbackCleanups = roots.map(bindDesignConsoleFallback);
  const existingConsole = window.spwDesignExperiments || {};
  const designConsole = Object.freeze({
    ...existingConsole,
    ...createDesignExperimentsConsole(roots),
  });
  window.spwDesignExperiments = designConsole;
  globalThis.spwDesignExperiments = designConsole;

  // Bind immediate appearance tuners (data-design-immediate on chips in design hub for live color/contrast/motif/font/layout preview).
  // Parses ; separated like bundles, calls setImmediate or reset. Enables playful exp w/ material, font norm, layout UX, contrast test.
  roots.forEach((scope) => {
    scope.querySelectorAll?.('[data-design-immediate]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      btn.addEventListener('click', (e) => {
        if (btn instanceof HTMLAnchorElement) e.preventDefault();
        const val = btn.getAttribute('data-design-immediate') || '';
        if (val === 'reset' || val === '') {
          designConsole.resetImmediateAppearance?.();
        } else {
          const params = {};
          val.split(';').forEach(pair => {
            const [k,v] = pair.split(':').map(s=>s.trim());
            if (k && v) params[k] = isNaN(v) ? v : Number(v);
            else if (k) params[k] = true;
          });
          designConsole.setImmediateAppearance?.(params);
        }
      });
    });
  });

  // Bind RPG Wednesday demo actions in the component ecology nook (design hub only).
  // Surgical: cycles spacing/charge on specimens to demonstrate explicit states, charge steps, traversability.
  // Ties to l'n'd'r speech-bubble / materials-as-paint / physics driver without new runtime surface.
  roots.forEach((scope) => {
    scope.querySelectorAll?.('[data-rpg-demo-action]').forEach((btn) => {
      if (!(btn instanceof HTMLElement)) return;
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-rpg-demo-action');
        if (action === 'cycle-spacing') {
          const specs = scope.querySelectorAll('.design-material-specimen, [data-design-material-specimen]');
          specs.forEach((s, i) => {
            const v = i % 3 === 0 ? 'interactive' : (i % 3 === 1 ? 'descriptively-absent' : 'null');
            s.setAttribute('data-spw-spacing', v);
          });
        } else if (action === 'step-charge') {
          const specs = scope.querySelectorAll('.design-material-specimen, [data-design-material-specimen], .frame-card');
          specs.forEach((s, i) => {
            const v = String((i % 4) + 1);
            s.setAttribute('data-spw-charge', v);
            if (v === '3') s.setAttribute('data-spw-card-state', 'activate');
          });
        } else if (action === 'toast-ping') {
          const chip = document.createElement('span');
          chip.className = 'spw-disappear-chip operator-chip';
          chip.textContent = 'speech bubble noted';
          chip.dataset.spwToast = 'transient';
          Object.assign(chip.style, { position: 'fixed', left: '40%', top: '28%', zIndex: '2200' });
          document.body.appendChild(chip);
          setTimeout(() => { if (chip && chip.parentNode) chip.parentNode.removeChild(chip); }, 2400);
        }
      });
    });
  });

  const syncAll = (settings = getSiteSettings()) => {
    roots.forEach((scope) => syncRoot(scope, settings));
  };

  syncAll();

  const off = bus.on('settings:changed', (event) => {
    syncAll(event.detail || getSiteSettings());
  });

  return {
    refresh() {
      syncAll();
    }
  };
}
