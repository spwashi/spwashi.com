/**
 * Settings page and scope bindings (lazy-loaded on routes that need controls).
 */

import { bus } from '/public/js/kernel/bus.js';
import {
  AUTHOR_WORKFLOW_DEFINITIONS,
  normalizeAuthorMode,
  normalizeDevelopmentalClimate,
} from '/public/js/kernel/shared.js';
import { shouldDisableServiceWorkerInDevelopment } from '/public/js/kernel/runtime-environment.js';
import {
  CAULDRON_STORAGE_KEY,
  COMPONENT_COLLECTION_STORAGE_KEY,
  DEFAULT_SITE_SETTINGS,
  DISCOVERY_DISMISSALS_STORAGE_KEY,
  PRESETS,
  PRESET_LABELS,
  PRESET_DESCRIPTIONS,
  SETTINGS_QUERY_RECIPES,
  SETTING_OPTIONS,
  SITE_SETTINGS_KEY,
  UX_RECIPES,
  VISITED_IMAGE_STORAGE_KEY,
  buildSettingsQueryHref,
  buildSettingsQuerySearch,
  getSettingsQueryRecipe,
} from './site-settings-profiles.js';
import { buildSettingsShareHref } from './settings-query-parity.js';
import {
  buildPersistenceRegistries,
  describeDeviation,
  describeSettingValue,
  findActivePreset,
  formatStorageTimestamp,
  getLatestTimestamp,
  getAuthorWorkflowDefinition,
  getDevelopmentalClimateDefinition,
  getPresetSettings,
  getSiteSettingDeviations as listDeviations,
  getSiteSettings,
  getUxRecipe,
  humanizeSettingName,
  isKnownSetting,
  manager,
  normalizeSiteSettings,
  PWA_PROMPT_DISMISSAL_STORAGE_KEYS,
  presetIsSubsetOfSettings,
  presetMatchesSettings,
  describeSettingsPatch,
  resetSiteSettings,
  resetSingleSetting,
  saveSiteSettings,
  validatePartialSettings,
  validateSetting,
} from './site-settings-engine.js';
import {
  clearPins,
  getPinStorageKey,
} from '/public/js/runtime/pin-registry.js';
import {
  BEHAVIOR_SCOPE_BUNDLES,
  BEHAVIOR_SCOPE_KEYS,
} from '/public/js/runtime/behavior-scopes.js';
import { parseFeatureList } from '/public/js/runtime/runtime-helpers.js';
import {
  bindFeatureLabControls,
  syncFeatureLabControls,
} from '/public/js/runtime/feature-lab-ui.js';

/**
 * Inspect-only snapshot: body[data-spw-features] vs generated BEHAVIOR_SCOPE_KEYS.
 * No storage — presence is authored on the route, not a settings preference.
 */
const buildFeatureScopeSnapshot = (featureSource = document.body?.dataset?.spwFeatures) => {
  const activeSet = parseFeatureList(featureSource);
  const active = [...activeSet].sort();
  const knownScopes = [...BEHAVIOR_SCOPE_KEYS];
  const scopeSet = new Set(knownScopes);
  const scopedActive = active.filter((token) => scopeSet.has(token));
  const presenceOnly = active.filter((token) => !scopeSet.has(token));
  const scopesIdle = knownScopes.filter((key) => !activeSet.has(key));

  return Object.freeze({
    active: Object.freeze(active),
    knownScopes: Object.freeze(knownScopes),
    scopedActive: Object.freeze(scopedActive),
    presenceOnly: Object.freeze(presenceOnly),
    scopesIdle: Object.freeze(scopesIdle),
  });
};

const formatTokenList = (tokens, emptyLabel = 'none') => (
  tokens.length ? tokens.join(' ') : emptyLabel
);

const syncFeatureScopeReadouts = (root = document) => {
  if (!root?.querySelectorAll) return;

  const hasAny = Boolean(
    root.querySelector?.(
      '[data-site-feature-scope-panel], [data-site-feature-scope-list], [data-site-feature-scope-body]'
    )
  );
  if (!hasAny) return;

  const snapshot = buildFeatureScopeSnapshot();

  root.querySelectorAll('[data-site-feature-scope-body]').forEach((node) => {
    node.textContent = formatTokenList(snapshot.active, 'none on body');
  });
  root.querySelectorAll('[data-site-feature-scope-scoped]').forEach((node) => {
    node.textContent = formatTokenList(snapshot.scopedActive, 'none active');
  });
  root.querySelectorAll('[data-site-feature-scope-presence-only]').forEach((node) => {
    node.textContent = formatTokenList(snapshot.presenceOnly, 'none');
  });
  root.querySelectorAll('[data-site-feature-scope-idle]').forEach((node) => {
    node.textContent = formatTokenList(snapshot.scopesIdle, 'all scopes active');
  });
  root.querySelectorAll('[data-site-feature-scope-body-count]').forEach((node) => {
    node.textContent = String(snapshot.active.length);
  });
  root.querySelectorAll('[data-site-feature-scope-scoped-count]').forEach((node) => {
    node.textContent = `${snapshot.scopedActive.length} / ${snapshot.knownScopes.length}`;
  });
  root.querySelectorAll('[data-site-feature-scope-presence-count]').forEach((node) => {
    node.textContent = String(snapshot.presenceOnly.length);
  });
  root.querySelectorAll('[data-site-feature-scope-idle-count]').forEach((node) => {
    node.textContent = String(snapshot.scopesIdle.length);
  });

  root.querySelectorAll('[data-site-feature-scope-list]').forEach((host) => {
    host.innerHTML = '';
    host.setAttribute('role', 'list');

    const appendRow = ({ token, kind, detail }) => {
      const row = document.createElement('div');
      row.className = 'settings-feature-scope-row';
      row.setAttribute('role', 'listitem');
      row.dataset.siteFeatureScopeKind = kind;
      row.dataset.siteFeatureScopeToken = token;

      const name = document.createElement('code');
      name.className = 'settings-feature-scope-token';
      name.textContent = token;

      const badge = document.createElement('span');
      badge.className = 'settings-feature-scope-badge';
      badge.dataset.kind = kind;
      badge.textContent = kind === 'scoped-active'
        ? 'active scope'
        : kind === 'presence-only'
          ? 'presence only'
          : 'scope off page';

      const note = document.createElement('span');
      note.className = 'settings-feature-scope-detail';
      note.textContent = detail;

      row.append(name, badge, note);
      host.appendChild(row);
    };

    snapshot.scopedActive.forEach((token) => {
      const bundle = BEHAVIOR_SCOPE_BUNDLES[token];
      appendRow({
        token,
        kind: 'scoped-active',
        detail: bundle
          ? `CSS behavior bundle eligible · ${bundle.replace(/^\/public\/css\/bundles\//, '')}`
          : 'On body and in BEHAVIOR_SCOPE_KEYS',
      });
    });

    snapshot.presenceOnly.forEach((token) => {
      appendRow({
        token,
        kind: 'presence-only',
        detail: 'On body[data-spw-features]; no CSS behavior bundle (runtime / catalog gate only)',
      });
    });

    snapshot.scopesIdle.forEach((token) => {
      const bundle = BEHAVIOR_SCOPE_BUNDLES[token];
      appendRow({
        token,
        kind: 'scope-idle',
        detail: bundle
          ? `Known scope · not on this page · ${bundle.replace(/^\/public\/css\/bundles\//, '')}`
          : 'Known BEHAVIOR_SCOPE_KEYS entry · not on this page',
      });
    });

    if (!snapshot.active.length && !snapshot.knownScopes.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-feature-scope-empty';
      empty.textContent = 'No page features or behavior scopes available to inspect.';
      host.appendChild(empty);
    }
  });
};

const bindFeatureScopeReadouts = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) {
    return {
      cleanup() {},
      refresh() {},
    };
  }

  const hasHosts = Boolean(
    root.querySelector?.(
      '[data-site-feature-scope-panel], [data-site-feature-scope-list], [data-site-feature-scope-body]'
    )
  );
  if (!hasHosts) {
    return {
      cleanup() {},
      refresh() {},
    };
  }

  const sync = () => syncFeatureScopeReadouts(root);
  sync();

  return {
    cleanup() {},
    refresh() {
      sync();
    },
  };
};

const collectSettingsFromScope = (root) => {
  const next = {};

  Object.keys(DEFAULT_SITE_SETTINGS).forEach((key) => {
    const fields = root.querySelectorAll?.(`[name="${CSS.escape(key)}"]`);
    if (!fields?.length) return;

    const first = fields[0];

    if (first.type === 'radio') {
      const checked = [...fields].find((field) => field.checked);
      if (checked) next[key] = checked.value;
      return;
    }

    if (first.type === 'checkbox') {
      next[key] = first.checked ? 'on' : 'off';
      return;
    }

    next[key] = first.value;
  });

  return next;
};

const writeSettingsToScope = (root, settings) => {
  const normalized = normalizeSiteSettings(settings);

  Object.entries(normalized).forEach(([name, value]) => {
    const fields = root.querySelectorAll?.(`[name="${CSS.escape(name)}"]`);
    if (!fields?.length) return;

    fields.forEach((field) => {
      if (field.type === 'radio') {
        field.checked = field.value === value;
        return;
      }

      if (field.type === 'checkbox') {
        field.checked = value === 'on';
        return;
      }

      field.value = value;
    });
  });

  syncSettingsReadouts(root, normalized);
};

const setPressedState = (node, isActive) => {
  if (!(node instanceof HTMLElement)) return;
  node.dataset.siteSettingActive = isActive ? 'true' : 'false';
  if (node instanceof HTMLButtonElement || node.getAttribute('role') === 'button') {
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
};

const primeButtonLikeControl = (node) => {
  if (!(node instanceof HTMLElement)) return;
  if (!(node instanceof HTMLButtonElement)) node.setAttribute('role', 'button');
  if (!(node instanceof HTMLButtonElement) && !(node instanceof HTMLAnchorElement) && !node.hasAttribute('tabindex')) {
    node.setAttribute('tabindex', '0');
  }
};

const parseSettingTrigger = (value = '') => {
  const [name = '', option = ''] = String(value).split(':');
  const normalizedName = name.trim();
  const normalizedOption = option.trim();
  if (!normalizedName || !normalizedOption) return null;
  return {name: normalizedName, value: normalizedOption};
};

/** Supports compound "baseMetamaterial:matte;highContrast:on" (or & , separators)
 *  used by design bench global-apply buttons and future clustered controls.
 *  Returns array (possibly length 1) so callers can batch-save through kernel.
 */
const parseSettingTriggers = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return [];
  // Split on ; & or | for compound intent (human-friendly in data attrs)
  const segments = raw.split(/[;&|]+/).map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const seg of segments) {
    if (!seg) continue;
    const single = parseSettingTrigger(seg);
    if (single) {
      out.push(single);
      continue;
    }
    // fallback split inside segment
    const [n = '', o = ''] = seg.split(':');
    const nn = n.trim();
    const oo = o.trim();
    if (nn && oo) out.push({ name: nn, value: oo });
  }
  return out;
};

const STANDALONE_SETTINGS_HINT = 'Choose a mode to update this preference. The active option stays highlighted.';

const primeSettingTriggerControl = primeButtonLikeControl;

const setSettingTriggerState = (node, isActive) => {
  if (!(node instanceof HTMLElement)) return;
  node.dataset.siteSettingActive = isActive ? 'true' : 'false';
  if (node instanceof HTMLAnchorElement) node.removeAttribute('aria-current');
  if (node instanceof HTMLButtonElement || node.getAttribute('role') === 'button') {
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
};

const resolveSettingTriggerControl = (source, root = document) => {
  const origin = source instanceof Event ? source.target : source;
  if (!(origin instanceof Element)) return null;
  const control = origin.closest('[data-site-setting-set]');
  if (!(control instanceof HTMLElement)) return null;
  if (root instanceof HTMLElement && !root.contains(control)) return null;
  return control;
};

const activateSettingTriggerFromKeyboard = (event, control) => {
  if (!(control instanceof HTMLElement)) return false;
  if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return false;
  if (control instanceof HTMLButtonElement) return false;
  if (control.getAttribute('role') !== 'button') return false;
  event.preventDefault();
  control.click();
  return true;
};

const writeSettingsStatus = (statusNode, message = '', type = 'info') => {
  if (!(statusNode instanceof HTMLElement)) return;
  statusNode.textContent = message;
  statusNode.dataset.status = type;
  statusNode.dataset.updatedAt = String(Date.now());
  if (!statusNode.hasAttribute('role')) statusNode.setAttribute('role', 'status');
  if (!statusNode.hasAttribute('aria-live')) statusNode.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
};

const emitSettingsFeedbackCredit = (partial = {}, saved = getSiteSettings(), source = 'settings') => {
  if (typeof document === 'undefined' || !document.dispatchEvent) return;
  const changedKeys = Object.keys(partial).filter((key) => isKnownSetting(key));
  if (!changedKeys.length) return;

  const posture = describeSettingValue('metacognitiveStance', saved.metacognitiveStance || 'witness');
  const climate = describeSettingValue('currentDevelopmentalClimate', saved.currentDevelopmentalClimate || 'orient');
  const changed = changedKeys
    .slice(0, 4)
    .map((key) => `${humanizeSettingName(key)}: ${describeSettingValue(key, partial[key])}`)
    .join(' · ');
  const salience = saved.metacognitiveStance === 'composer'
    ? 'Cards, route edges, and artifact/action handles are more salient.'
    : saved.metacognitiveStance === 'explorer'
      ? 'Topic neighbors, prompts, and discovery surfaces are more salient.'
      : saved.metacognitiveStance === 'integrator'
        ? 'References, relation bridges, and synthesis handles are more salient.'
        : saved.metacognitiveStance === 'overflow'
          ? 'Dense semantic handles and generous traces are allowed to surface.'
          : 'Core reading anchors and local state cues stay quiet.';

  document.dispatchEvent(new CustomEvent('spw:discovery-reward', {
    detail: {
      label: 'Settings',
      title: `${posture} posture · ${climate} climate`,
      summary: `${changed}. ${salience}`,
      href: '/settings/#climate-settings',
      cta: 'Tune posture',
      why: 'Settings feedback turns a hidden state change into a short, inspectable learning cue. The selected posture changes which concepts receive visual salience.',
      presentation: 'credits',
      cadence: 'settings',
      rewardKind: 'settings-feedback-literacy',
      rewardKey: `settings:${source}:${changedKeys.sort().join('+')}:${saved.metacognitiveStance}:${saved.currentDevelopmentalClimate}`,
      maxVisible: 1,
      autoDismissMs: 5200,
    },
  }));
};

const resolveStandaloneStatusNode = (node) => {
  if (!(node instanceof HTMLElement)) return null;
  const containers = [
    node.closest('[data-site-settings-panel]'),
    node.closest('.vibe-widget'),
    node.closest('.site-frame'),
    node.closest('section, article, aside')
  ].filter(Boolean);

  for (const container of containers) {
    const statusNode = container.querySelector?.('[data-site-settings-status]');
    if (statusNode) return statusNode;
  }

  return null;
};

const applySettingTrigger = (trigger, options = {}) => {
  const {statusNode = null, onSaved = null} = options;

  // Support single trigger object, string (possibly compound), or array from parseSettingTriggers.
  let triggers = [];
  if (Array.isArray(trigger)) {
    triggers = trigger;
  } else if (trigger && typeof trigger === 'object' && trigger.name) {
    triggers = [trigger];
  } else if (typeof trigger === 'string' || trigger instanceof String) {
    triggers = parseSettingTriggers(trigger);
  }

  if (!triggers.length) {
    writeSettingsStatus(statusNode, 'Unknown setting control.', 'info');
    return null;
  }

  // Build sanitized partial from all (compound) triggers; validate each.
  const partial = {};
  for (const t of triggers) {
    if (!t || !isKnownSetting(t.name)) continue;
    const validation = validateSetting(t.name, t.value);
    if (validation.valid) partial[t.name] = t.value;
  }

  if (Object.keys(partial).length === 0) {
    writeSettingsStatus(statusNode, 'Invalid setting option(s).', 'info');
    return null;
  }

  const current = getSiteSettings();
  const allMatch = Object.entries(partial).every(([k, v]) => current[k] === v);
  if (allMatch) {
    const label = Object.keys(partial).map((k) => describeSettingValue(k, partial[k])).join(' + ');
    writeSettingsStatus(statusNode, `${label} already active.`, 'info');
    syncSettingsUx(document, current);
    return current;
  }

  const saved = saveSiteSettings(partial);
  syncSettingsUx(document, saved);
  const summary = describeSettingsPatch(partial) || Object.keys(partial).join(', ');
  writeSettingsStatus(statusNode, `${summary}.`, 'success');
  emitSettingsFeedbackCredit(partial, saved, 'setting-trigger');
  // For onSaved, pass the first trigger or the batch for legacy consumers.
  onSaved?.(saved, triggers[0] || triggers);
  return saved;
};

const applyUxRecipe = (recipeName, options = {}) => {
  const {statusNode = null, onSaved = null} = options;
  const recipe = getUxRecipe(recipeName);

  if (!recipe) {
    writeSettingsStatus(statusNode, 'Unknown settings recipe.', 'info');
    return null;
  }

  const saved = recipeName === 'default' ? resetSiteSettings() : saveSiteSettings(recipe.settings);
  syncSettingsUx(document, saved);
  writeSettingsStatus(statusNode, `${recipe.label}.`, 'success');
  emitSettingsFeedbackCredit(recipe.settings || {}, saved, `recipe-${recipeName}`);
  onSaved?.(saved, recipeName);
  return saved;
};

const syncSettingTriggers = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[data-site-setting-set]').forEach((node) => {
    const attr = node.getAttribute('data-site-setting-set') || '';
    const triggers = parseSettingTriggers(attr);
    if (!triggers.length) return;
    primeSettingTriggerControl(node);
    // For compound triggers (e.g. base+high), mark active only when every pair matches current.
    const isActive = triggers.every((t) => isKnownSetting(t.name) && normalized[t.name] === t.value);
    setSettingTriggerState(node, isActive);
  });
};

const syncPresetControls = (root = document, settings = getSiteSettings()) => {
  const activePreset = findActivePreset(settings);

  root.querySelectorAll?.('[data-preset]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const presetName = node.getAttribute('data-preset');
    const exact = presetName && presetMatchesSettings(presetName, settings);
    const subset = presetName && presetIsSubsetOfSettings(presetName, settings);
    primeButtonLikeControl(node);
    setPressedState(node, Boolean(exact || subset));
    node.dataset.presetActive = exact ? 'exact' : subset ? 'partial' : 'false';
    node.dataset.siteSettingActive = (exact || subset) ? 'true' : 'false';
    if (presetName) {
      node.setAttribute('aria-label', `${PRESET_LABELS[presetName] || presetName} preset. ${PRESET_DESCRIPTIONS[presetName] || ''}`.trim());
    }
  });

  root.querySelectorAll?.('[data-site-active-preset]').forEach((node) => {
    node.textContent = activePreset ? (PRESET_LABELS[activePreset] || activePreset) : 'Custom';
    node.dataset.presetState = activePreset || 'custom';
  });
};

const syncUxRecipeControls = (root = document) => {
  root.querySelectorAll?.('[data-site-settings-recipe]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const recipeName = node.getAttribute('data-site-settings-recipe');
    const recipe = getUxRecipe(recipeName);
    primeButtonLikeControl(node);
    if (recipe) node.setAttribute('aria-label', recipe.label);
  });
};

const syncSettingsFieldStates = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[name]').forEach((field) => {
    if (!(field instanceof HTMLElement)) return;
    const name = field.getAttribute('name');
    if (!name || !isKnownSetting(name)) return;
    field.dataset.siteSettingDefault = normalized[name] === DEFAULT_SITE_SETTINGS[name] ? 'true' : 'false';
  });

  root.querySelectorAll?.('.settings-fieldset, fieldset, .settings-category').forEach((container) => {
    if (!(container instanceof HTMLElement)) return;
    const relevantNames = new Set(
      [...container.querySelectorAll('[name]')]
        .map((field) => field.getAttribute('name'))
        .filter((name) => name && isKnownSetting(name))
    );
    if (!relevantNames.size) return;
    const deviationCount = [...relevantNames].filter((name) => normalized[name] !== DEFAULT_SITE_SETTINGS[name]).length;
    container.dataset.siteSettingDeviationCount = String(deviationCount);
    container.dataset.siteSettingDeviationState = deviationCount > 0 ? 'deviated' : 'default';
  });
};

const syncSettingsReadouts = (root = document, settings = getSiteSettings()) => {
  const normalized = normalizeSiteSettings(settings);

  root.querySelectorAll?.('[data-settings-state]').forEach((node) => {
    const key = node.getAttribute('data-settings-state');
    if (!key || !isKnownSetting(key)) return;
    node.textContent = describeSettingValue(key, normalized[key]);
  });

  root.querySelectorAll?.('[data-site-setting-value]').forEach((node) => {
    const key = node.getAttribute('data-site-setting-value');
    if (!key || !isKnownSetting(key)) return;
    node.textContent = describeSettingValue(key, normalized[key]);
  });

  syncSettingTriggers(root, normalized);
};

const syncSettingsUx = (root = document, settings = getSiteSettings()) => {
  syncSettingsReadouts(root, settings);
  syncDeviationReadouts(root, settings);
  syncPresetControls(root, settings);
  syncUxRecipeControls(root);
  syncSettingsFieldStates(root, settings);
};

const writeFieldError = (root, name, message = '') => {
  root.querySelectorAll?.(`[data-site-setting-errors="${CSS.escape(name)}"]`).forEach((node) => {
    node.textContent = message;
    node.hidden = !message;
  });
};

const clearFieldErrors = (root) => {
  root.querySelectorAll?.('[data-site-setting-errors]').forEach((node) => {
    node.textContent = '';
    node.hidden = true;
  });
};

const bindSettingsField = (field, options = {}) => {
  if (!(field instanceof HTMLElement)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const {autosave = true, root = field.closest('[data-site-settings-scope]') || document, onSaved = null} = options;
  const name = field.getAttribute('name');

  if (!name || !isKnownSetting(name)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const syncFromStore = (settings = getSiteSettings()) => {
    writeSettingsToScope(root, settings);
    syncSettingsUx(root, settings);
  };

  const saveField = () => {
    let value;
    if (field.type === 'checkbox') value = field.checked ? 'on' : 'off';
    else if (field.type === 'radio') value = root.querySelector(`[name="${CSS.escape(name)}"]:checked`)?.value;
    else value = field.value;

    const validation = validateSetting(name, value);
    if (!validation.valid) {
      writeFieldError(root, name, `Invalid value for ${name}.`);
      return null;
    }

    writeFieldError(root, name, '');

    const current = getSiteSettings();
    if (current[name] === value) {
      syncFromStore(current);
      return current;
    }

    const saved = saveSiteSettings({[name]: value});
    syncFromStore(saved);
    onSaved?.(saved, {name, value});
    return saved;
  };

  const handleChange = () => {
    if (autosave) saveField();
  };

  syncFromStore();
  field.addEventListener('change', handleChange);
  const off = bus.on?.('settings:changed', (event) => syncFromStore(event.detail));

  return {
    cleanup() {
      field.removeEventListener('change', handleChange);
      off?.();
    },
    refresh() {
      syncFromStore();
    },
    save: saveField
  };
};

const bindSettingsScope = (root, options = {}) => {
  if (!(root instanceof HTMLElement)) return {
    cleanup() {
    }, refresh() {
    }, save() {
      return null;
    }
  };

  const {
    autosave = true,
    debounceMs = 80,
    includePresets = true,
    statusNode = root.querySelector?.('[data-site-settings-status]') || null,
    onSaved = null,
    onPresetApplied = null
  } = options;

  let debounceTimer = null;
  const setStatus = (message, type = 'info') => writeSettingsStatus(statusNode, message, type);
  const syncFromStore = (settings = getSiteSettings()) => {
    writeSettingsToScope(root, settings);
    syncSettingsUx(root, settings);
  };

  const saveScope = () => {
    clearFieldErrors(root);
    const partial = collectSettingsFromScope(root);
    const validation = validatePartialSettings(partial);

    if (!validation.valid) {
      validation.errors.forEach((error) => writeFieldError(root, error.name, `Allowed: ${error.allowedValues.join(', ')}`));
      setStatus('Some settings are invalid.', 'info');
      return null;
    }

    const saved = saveSiteSettings(partial);
    syncFromStore(saved);
    const summary = describeSettingsPatch(partial);
    setStatus(summary ? `Saved locally · ${summary}.` : 'Saved locally.', 'success');
    onSaved?.(saved);
    return saved;
  };

  const handleChange = () => {
    if (!autosave) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(saveScope, debounceMs);
  };

  const handleTriggerKeydown = (event) => {
    const control = resolveSettingTriggerControl(event, root);
    activateSettingTriggerFromKeyboard(event, control);
  };

  // Note: compound triggers (data-site-setting-set="a:1;b:2") are handled inside
  // applySettingTrigger via parseSettingTriggers; no change needed at bind site.

  const handleSubmit = (event) => {
    event.preventDefault();
    saveScope();
  };

  const controls = root.querySelectorAll('input[name], select[name], textarea[name]');
  controls.forEach((field) => field.addEventListener('change', handleChange));
  root.addEventListener('keydown', handleTriggerKeydown);
  if (root.matches('form')) root.addEventListener('submit', handleSubmit);

  const presetHandlers = [];
  if (includePresets) {
    root.querySelectorAll('[data-preset]').forEach((button) => {
      const handler = () => {
        const presetName = button.dataset.preset;
        if (!PRESETS[presetName]) return;
        const saved = saveSiteSettings(getPresetSettings(presetName));
        syncFromStore(saved);
        const description = settingsManager.describePreset(presetName);
        const label = PRESET_LABELS[presetName] || presetName;
        setStatus(`Applied ${label} · ${description?.climate || 'climate'}.`, 'success');
        emitSettingsFeedbackCredit(PRESETS[presetName] || {}, saved, `preset-${presetName}`);
        button.classList.add('is-applied');
        setTimeout(() => button.classList.remove('is-applied'), 1200);
        onPresetApplied?.(saved, presetName);
      };
      button.addEventListener('click', handler);
      presetHandlers.push(() => button.removeEventListener('click', handler));
    });
  }

  const triggerHandlers = [];
  root.querySelectorAll('[data-site-setting-set]').forEach((control) => {
    const handler = (event) => {
      const triggers = parseSettingTriggers(control.getAttribute('data-site-setting-set') || '');
      if (!triggers.length) return;
      if (control instanceof HTMLAnchorElement) event.preventDefault();
      const saved = applySettingTrigger(triggers, {statusNode, onSaved});
      if (saved) syncFromStore(saved);
    };
    control.addEventListener('click', handler);
    triggerHandlers.push(() => control.removeEventListener('click', handler));
  });

  const recipeHandlers = [];
  root.querySelectorAll('[data-site-settings-recipe]').forEach((control) => {
    const handler = (event) => {
      if (control instanceof HTMLAnchorElement) event.preventDefault();
      const saved = applyUxRecipe(control.getAttribute('data-site-settings-recipe'), {statusNode, onSaved});
      if (saved) syncFromStore(saved);
    };
    control.addEventListener('click', handler);
    recipeHandlers.push(() => control.removeEventListener('click', handler));
  });

  const resetButtons = [...root.querySelectorAll('[data-site-settings-reset]')];
  const handleReset = () => {
    const settings = resetSiteSettings();
    syncFromStore(settings);
    setStatus('Reset to authored defaults.', 'success');
  };
  resetButtons.forEach((button) => button.addEventListener('click', handleReset));

  const off = bus.on?.('settings:changed', (event) => syncFromStore(event.detail));

  syncFromStore();

  if (statusNode && !statusNode.textContent) {
    const defaultMessage = root.querySelector('[data-site-setting-set], [data-site-settings-recipe]')
      ? STANDALONE_SETTINGS_HINT
      : 'Preferences are saved in this browser.';
    setStatus(defaultMessage, 'info');
  }

  return {
    cleanup() {
      clearTimeout(debounceTimer);
      controls.forEach((field) => field.removeEventListener('change', handleChange));
      root.removeEventListener('keydown', handleTriggerKeydown);
      if (root.matches('form')) root.removeEventListener('submit', handleSubmit);
      resetButtons.forEach((button) => button.removeEventListener('click', handleReset));
      presetHandlers.forEach((cleanup) => cleanup());
      triggerHandlers.forEach((cleanup) => cleanup());
      recipeHandlers.forEach((cleanup) => cleanup());
      off?.();
    },
    refresh() {
      syncFromStore();
    },
    save: saveScope
  };
};

const bindStandaloneSettingTriggers = (root = document, options = {}) => {
  const {onSaved = null} = options;

  const handleClick = (event) => {
    const control = event.target instanceof Element
      ? event.target.closest('[data-site-setting-set], [data-site-settings-recipe]')
      : null;

    if (!(control instanceof HTMLElement)) return;
    if (control.closest('[data-site-settings-form], [data-site-settings-scope]')) return;
    if (control instanceof HTMLAnchorElement) event.preventDefault();

    if (control.hasAttribute('data-site-settings-recipe')) {
      applyUxRecipe(control.getAttribute('data-site-settings-recipe'), {
        statusNode: resolveStandaloneStatusNode(control),
        onSaved
      });
      return;
    }

    const triggers = parseSettingTriggers(control.getAttribute('data-site-setting-set') || '');
    if (!triggers.length) return;

    applySettingTrigger(triggers, {
      statusNode: resolveStandaloneStatusNode(control),
      onSaved
    });
  };

  const handleKeydown = (event) => {
    const control = resolveSettingTriggerControl(event, root);
    activateSettingTriggerFromKeyboard(event, control);
  };

  root.addEventListener('click', handleClick);
  root.addEventListener('keydown', handleKeydown);
  syncSettingsUx(root);

  const off = bus.on?.('settings:changed', (event) => syncSettingsUx(root, event.detail));

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      root.removeEventListener('keydown', handleKeydown);
      off?.();
    },
    refresh() {
      syncSettingsUx(root);
    }
  };
};

const bindSettingsReadouts = (root = document) => {
  const sync = (settings = getSiteSettings()) => syncSettingsUx(root, settings);
  sync();
  const off = bus.on?.('settings:changed', (event) => sync(event.detail));
  return {
    cleanup() {
      off?.();
    },
    refresh() {
      sync();
    }
  };
};

const syncDeviationReadouts = (root = document, settings = getSiteSettings()) => {
  const deviations = listDeviations(settings);

  root.querySelectorAll?.('[data-site-deviation-count]').forEach((node) => {
    node.textContent = String(deviations.length);
  });

  root.querySelectorAll?.('[data-site-deviation-list]').forEach((host) => {
    host.innerHTML = '';

    if (!deviations.length) {
      const empty = document.createElement('p');
      empty.className = 'site-deviation-empty';
      empty.textContent = 'No deviations. This browser is using the authored default.';
      host.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'site-deviation-list';

    deviations.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'site-deviation-item';
      item.dataset.siteDeviation = entry.name;

      const label = document.createElement('span');
      label.className = 'site-deviation-label';
      label.textContent = humanizeSettingName(entry.name);

      const value = document.createElement('code');
      value.textContent = `${describeSettingValue(entry.name, entry.default)} → ${describeSettingValue(entry.name, entry.current)}`;

      item.append(label, value);

      if (host.dataset.siteDeviationList === 'resettable') {
        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'site-deviation-reset';
        reset.textContent = 'reset';
        reset.setAttribute('data-site-deviation-reset', entry.name);
        item.appendChild(reset);
      }

      list.appendChild(item);
    });

    host.appendChild(list);
  });
};

const syncPersistenceReadouts = async (root = document) => {
  const registries = await Promise.all(buildPersistenceRegistries().map(async (registry) => ({
    ...registry,
    snapshot: await registry.read(),
  })));
  const active = registries.filter((registry) => registry.snapshot.count > 0);
  const totalItems = registries.reduce((sum, registry) => sum + registry.snapshot.count, 0);
  const latest = formatStorageTimestamp(getLatestTimestamp(registries, (registry) => registry.snapshot.latest));

  root.querySelectorAll?.('[data-site-persistence-active-count]').forEach((node) => {
    node.textContent = String(active.length);
  });
  root.querySelectorAll?.('[data-site-persistence-item-count]').forEach((node) => {
    node.textContent = String(totalItems);
  });
  root.querySelectorAll?.('[data-site-persistence-latest]').forEach((node) => {
    node.textContent = latest;
  });

  root.querySelectorAll?.('[data-site-persistence-list]').forEach((host) => {
    host.innerHTML = '';

    if (!registries.length) {
      const empty = document.createElement('p');
      empty.className = 'settings-persistence-empty';
      empty.textContent = 'No browser-local registries are available here.';
      host.appendChild(empty);
      return;
    }

    registries.forEach((registry) => {
      const item = document.createElement('article');
      item.className = 'settings-persistence-item';
      item.dataset.sitePersistence = registry.id;

      const head = document.createElement('div');
      head.className = 'settings-persistence-head';

      const title = document.createElement('strong');
      title.className = 'settings-persistence-title';
      title.textContent = registry.label;

      const badge = document.createElement('span');
      badge.className = 'settings-persistence-badge';
      badge.textContent = registry.snapshot.count > 0
        ? `${registry.snapshot.count} stored`
        : 'empty';

      head.append(title, badge);

      const copy = document.createElement('p');
      copy.className = 'settings-persistence-copy';
      copy.textContent = registry.description;

      const meta = document.createElement('div');
      meta.className = 'settings-persistence-meta';
      meta.innerHTML = [
        `<p><strong>Scope</strong><br>${registry.scope}</p>`,
        `<p><strong>Writer</strong><br>${registry.source}</p>`,
        `<p><strong>Storage key</strong><br><code>${registry.storageKey}</code></p>`,
        `<p><strong>Summary</strong><br>${registry.snapshot.summary}</p>`,
        `<p><strong>Latest change</strong><br>${formatStorageTimestamp(registry.snapshot.latest)}</p>`,
      ].join('');

      const actions = document.createElement('div');
      actions.className = 'settings-persistence-actions';

      const reset = document.createElement('button');
      reset.type = 'button';
      reset.className = 'operator-chip';
      reset.textContent = `! clear ${registry.id}`;
      reset.setAttribute('data-site-persistence-reset', registry.id);
      actions.appendChild(reset);

      item.append(head, copy, meta, actions);
      host.appendChild(item);
    });
  });
};

const bindDeviationControls = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) return {
    cleanup() {
    }, refresh() {
    }
  };

  const handleClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-site-deviation-reset]') : null;
    if (!(target instanceof HTMLElement)) return;
    const name = target.getAttribute('data-site-deviation-reset');
    if (name) resetSingleSetting(name);
  };

  root.addEventListener('click', handleClick);
  syncDeviationReadouts(root);
  const off = bus.on?.('settings:changed', (event) => syncDeviationReadouts(root, event.detail));

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      off?.();
    },
    refresh() {
      syncDeviationReadouts(root);
    }
  };
};

const bindPersistenceControls = (root = document) => {
  if (!(root instanceof HTMLElement) && root !== document) return {
    cleanup() {},
    refresh() {},
  };

  const registryMap = new Map(buildPersistenceRegistries().map((registry) => [registry.id, registry]));
  const sync = () => { void syncPersistenceReadouts(root); };
  const persistenceKeys = new Set([
    SITE_SETTINGS_KEY,
    getPinStorageKey(),
    CAULDRON_STORAGE_KEY,
    DISCOVERY_DISMISSALS_STORAGE_KEY,
    VISITED_IMAGE_STORAGE_KEY,
    COMPONENT_COLLECTION_STORAGE_KEY,
    ...Object.values(PWA_PROMPT_DISMISSAL_STORAGE_KEYS),
  ]);

  const handleClick = (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-site-persistence-reset]') : null;
    if (!(target instanceof HTMLElement)) return;
    const id = target.getAttribute('data-site-persistence-reset');
    const registry = id ? registryMap.get(id) : null;
    if (!registry) return;
    void Promise.resolve(registry.clear()).then(() => sync());
  };

  const handleStorage = (event) => {
    if (event.key === null || persistenceKeys.has(event.key)) {
      sync();
    }
  };

  root.addEventListener('click', handleClick);
  window.addEventListener('storage', handleStorage);
  sync();

  const offSettings = bus.on?.('settings:changed', sync);
  const offCauldronUpdated = bus.on?.('cauldron:updated', sync);
  const offCauldronCleared = bus.on?.('cauldron:cleared', sync);
  const offImageVisited = bus.on?.('image:visited', sync);
  const offCollectionUpdated = bus.on?.('collection-updated', sync);
  const handlePin = () => sync();
  const handleDiscoveryDismissals = () => sync();
  document.addEventListener('brace:pinned', handlePin);
  document.addEventListener('spw:discovery-dismissals-changed', handleDiscoveryDismissals);

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('brace:pinned', handlePin);
      document.removeEventListener('spw:discovery-dismissals-changed', handleDiscoveryDismissals);
      offSettings?.();
      offCauldronUpdated?.();
      offCauldronCleared?.();
      offImageVisited?.();
      offCollectionUpdated?.();
    },
    refresh() {
      sync();
    },
  };
};

const initPwaStatusDisplay = (settingsManager = manager) => {
  if (settingsManager._pwaInitialized) return;

  const installEl = document.querySelector('[data-pwa-install-status]');
  const swEl = document.querySelector('[data-pwa-sw-status]');
  const cacheEl = document.querySelector('[data-pwa-cache-status]');
  const connectionEl = document.querySelector('[data-pwa-connection-status]');

  if (!installEl) return;
  settingsManager._pwaInitialized = true;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  installEl.textContent = isStandalone ? 'Installed' : 'Browser tab';
  installEl.dataset.status = isStandalone ? 'active' : 'inactive';

  if (shouldDisableServiceWorkerInDevelopment()) {
    if (swEl) {
      swEl.textContent = 'Disabled in local dev';
      swEl.dataset.status = 'inactive';
    }
    if (cacheEl) {
      cacheEl.textContent = 'Bypassed';
      cacheEl.dataset.status = 'inactive';
    }
  } else if (navigator.serviceWorker?.controller) {
    if (swEl) {
      swEl.textContent = 'Active';
      swEl.dataset.status = 'active';
    }
  } else if (navigator.serviceWorker) {
    if (swEl) {
      swEl.textContent = 'Registering…';
      swEl.dataset.status = 'inactive';
      navigator.serviceWorker.ready.then(() => {
        swEl.textContent = 'Active';
        swEl.dataset.status = 'active';
      }).catch(() => {
        swEl.textContent = 'Error';
        swEl.dataset.status = 'error';
      });
    }
  } else if (swEl) {
    swEl.textContent = 'Unsupported';
    swEl.dataset.status = 'error';
  }

  if (cacheEl && !shouldDisableServiceWorkerInDevelopment()) {
    if ('caches' in window) {
      caches.keys().then((names) => {
        const count = names.length;
        cacheEl.textContent = count > 0 ? `${count} cache${count > 1 ? 's' : ''}` : 'Empty';
        cacheEl.dataset.status = count > 0 ? 'active' : 'inactive';
      }).catch(() => {
        cacheEl.textContent = 'Error';
        cacheEl.dataset.status = 'error';
      });
    } else {
      cacheEl.textContent = 'Unsupported';
      cacheEl.dataset.status = 'error';
    }
  }

  if (connectionEl) {
    const updateConnection = () => {
      const online = navigator.onLine;
      connectionEl.textContent = online ? 'Online' : 'Offline';
      connectionEl.dataset.status = online ? 'active' : 'inactive';
    };
    updateConnection();
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
  }
};

export const initSiteSettingsBindings = (settingsManager = manager) => {
  const forms = [...document.querySelectorAll('[data-site-settings-form]')];
  const scopes = [...document.querySelectorAll('[data-site-settings-scope]')]
    .filter((scope) => !forms.some((form) => form === scope || form.contains(scope)));
  const hasStandaloneTriggers = [...document.querySelectorAll('[data-site-setting-set], [data-site-settings-recipe]')]
    .some((control) => !control.closest('[data-site-settings-form], [data-site-settings-scope]'));
  const hasReadouts = Boolean(document.querySelector(
    '[data-settings-state], [data-site-setting-value], [data-site-deviation-count], [data-site-deviation-list], [data-site-persistence-list], [data-site-feature-scope-panel], [data-site-feature-scope-list], [data-site-feature-lab-panel]'
  ));

  if ((!forms.length && !scopes.length && !hasStandaloneTriggers && !hasReadouts) || settingsManager._initialized) return null;

  settingsManager._initialized = true;

  const getStatusNode = (root) => (
    root.querySelector('[data-site-settings-status]')
    || root.closest('.site-frame, section, article, aside')?.querySelector('[data-site-settings-status]')
    || document.querySelector('[data-site-settings-status]')
    || null
  );

  const bindings = [...forms, ...scopes].map((root) => bindSettingsScope(root, {
    autosave: true,
    includePresets: true,
    statusNode: getStatusNode(root)
  }));
  const triggers = bindStandaloneSettingTriggers(document);
  const readouts = bindSettingsReadouts(document);
  const deviationControls = bindDeviationControls(document);
  const persistenceControls = bindPersistenceControls(document);
  const featureScopeReadouts = bindFeatureScopeReadouts(document);
  const featureLabControls = bindFeatureLabControls(document);

  let queryComposers = { cleanup() {}, refresh() {} };
  // Lazy: hubs may exist without the settings page shell.
  import('/public/js/runtime/query-link-composer.js')
    .then((mod) => {
      queryComposers = mod.bindQueryComposers?.(document) || queryComposers;
    })
    .catch(() => {});

  initPwaStatusDisplay(settingsManager);

  return {
    cleanup() {
      bindings.forEach((binding) => binding.cleanup());
      triggers.cleanup();
      readouts.cleanup();
      deviationControls.cleanup();
      persistenceControls.cleanup();
      featureScopeReadouts.cleanup();
      featureLabControls.cleanup();
      queryComposers.cleanup?.();
      settingsManager._initialized = false;
      settingsManager._pwaInitialized = false;
    },
    refresh() {
      bindings.forEach((binding) => binding.refresh());
      triggers.refresh();
      readouts.refresh();
      deviationControls.refresh();
      persistenceControls.refresh();
      featureScopeReadouts.refresh();
      featureLabControls.refresh();
      queryComposers.refresh?.();
      initPwaStatusDisplay(settingsManager);
    }
  };
};

const syncSettingsCategoryTarget = () => {
  const targeted = [...document.querySelectorAll('.settings-category[data-settings-targeted="true"]')];
  targeted.forEach((node) => delete node.dataset.settingsTargeted);
  if (!window.location.hash) return;

  let target = null;
  try {
    target = document.querySelector(window.location.hash);
  } catch {
    target = null;
  }

  if (!(target instanceof HTMLElement)) return;

  const category = target.matches('.settings-category') ? target : target.closest('.settings-category');
  if (!(category instanceof HTMLDetailsElement)) return;

  category.open = true;
  category.dataset.settingsTargeted = 'true';
};

const initSettingsCategoryRouting = (settingsManager = manager) => {
  if (settingsManager._settingsCategoryRouting) return settingsManager._settingsCategoryRouting;

  const handleHashChange = () => window.requestAnimationFrame(() => syncSettingsCategoryTarget());

  settingsManager._settingsCategoryRouting = {
    cleanup() {
      window.removeEventListener('hashchange', handleHashChange);
      settingsManager._settingsCategoryRouting = null;
    }
  };

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  return settingsManager._settingsCategoryRouting;
};

const bindSettingsQueryLab = (root = document) => {
  const panel = root.querySelector?.('[data-site-settings-query-lab]');
  if (!(panel instanceof HTMLElement)) return {
    cleanup() {},
    refresh() {}
  };

  const previewNode = panel.querySelector?.('[data-site-settings-query-preview]');
  const copyButtons = [...panel.querySelectorAll?.('[data-site-settings-query-copy]') || []];
  const links = [...panel.querySelectorAll?.('[data-site-settings-query-mode]') || []];

  const syncPreview = (mode = panel.dataset.siteSettingsQueryMode || 'inspect') => {
    const recipe = getSettingsQueryRecipe(mode);
    const search = buildSettingsQuerySearch(mode);
    panel.dataset.siteSettingsQueryMode = mode;
    if (previewNode) {
      previewNode.textContent = search || ' ';
      previewNode.title = recipe.description;
    }
    links.forEach((link) => {
      const linkMode = link.getAttribute('data-site-settings-query-mode');
      link.dataset.settingsQueryActive = linkMode === mode ? 'true' : 'false';
    });
  };

  const handleClick = (event) => {
    const link = event.target instanceof Element
      ? event.target.closest('[data-site-settings-query-mode]')
      : null;

    if (link instanceof HTMLAnchorElement) {
      const mode = link.getAttribute('data-site-settings-query-mode');
      if (!mode) return;
      link.href = buildSettingsQueryHref(mode, window.location);
      link.setAttribute('aria-label', `${getSettingsQueryRecipe(mode).label} query`);
    }
  };

  const handleCopy = async (event) => {
    const button = event?.currentTarget instanceof HTMLButtonElement
      ? event.currentTarget
      : copyButtons[0];
    const copyMode = button?.getAttribute('data-site-settings-query-copy') || 'inspect';
    const activeMode = panel.dataset.siteSettingsQueryMode || copyMode;
    const text = copyMode === 'share'
      ? buildSettingsShareHref(getSiteSettings(), window.location)
      : buildSettingsQueryHref(activeMode, window.location);
    const {handleCopyButton} = await import('/public/js/kernel/copy.js');
    await handleCopyButton({
      text,
      button: button || undefined,
      labelCopied: copyMode === 'share' ? '✓ copied link' : '✓ copied query',
      labelFailed: copyMode === 'share' ? '! copy link' : '! copy query',
      labelDefault: button?.textContent || 'Copy query',
    });
  };

  links.forEach((link) => {
    const mode = link.getAttribute('data-site-settings-query-mode');
    if (!mode) return;
    link.href = buildSettingsQueryHref(mode, window.location);
    link.setAttribute('aria-label', `${getSettingsQueryRecipe(mode).label} query`);
    link.addEventListener('mouseenter', () => syncPreview(mode));
    link.addEventListener('focus', () => syncPreview(mode));
  });

  copyButtons.forEach((button) => button.addEventListener('click', handleCopy));
  panel.addEventListener('click', handleClick);
  syncPreview(panel.dataset.siteSettingsQueryMode || 'inspect');

  return {
    cleanup() {
      copyButtons.forEach((button) => button.removeEventListener('click', handleCopy));
      panel.removeEventListener('click', handleClick);
    },
    refresh() {
      links.forEach((link) => {
        const mode = link.getAttribute('data-site-settings-query-mode');
        if (!mode) return;
        link.href = buildSettingsQueryHref(mode, window.location);
      });
      panel.dataset.siteSettingsShareHref = buildSettingsShareHref(getSiteSettings(), window.location);
      syncPreview(panel.dataset.siteSettingsQueryMode || 'inspect');
    }
  };
};

export const initSiteSettingsPage = () => {
  const bindings = initSiteSettingsBindings(manager);
  const routing = initSettingsCategoryRouting(manager);
  const queryLab = bindSettingsQueryLab();

  let queryComposers = { cleanup() {}, refresh() {} };
  import('/public/js/runtime/query-link-composer.js')
    .then((mod) => {
      queryComposers = mod.bindQueryComposers?.(document) || queryComposers;
    })
    .catch(() => {});

  return {
    cleanup() {
      bindings?.cleanup?.();
      routing?.cleanup?.();
      queryLab?.cleanup?.();
      queryComposers?.cleanup?.();
    },
    refresh() {
      bindings?.refresh?.();
      syncSettingsCategoryTarget();
      queryLab?.refresh?.();
      queryComposers?.refresh?.();
    }
  };
};

export {
  applyUxRecipe,
  bindDeviationControls,
  bindFeatureLabControls,
  bindFeatureScopeReadouts,
  bindSettingsField,
  bindSettingsReadouts,
  bindSettingsScope,
  bindStandaloneSettingTriggers,
  buildFeatureScopeSnapshot,
  collectSettingsFromScope,
  syncDeviationReadouts,
  syncFeatureLabControls,
  syncFeatureScopeReadouts,
  syncPresetControls,
  syncSettingsReadouts,
  syncSettingsUx,
  syncUxRecipeControls,
  writeSettingsToScope,
};
