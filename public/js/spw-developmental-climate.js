/**
 * spw-developmental-climate.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Manage the current developmental climate for the site.
 * - Persist and restore the user's preferred developmental disposition.
 * - Emit canonical climate events for CSS, guidance, scaffolding, and future
 *   recipe/spell systems.
 * - Optionally render explicit climate menus only on authored surfaces that
 *   opt in with `data-spw-developmental-menu="true"`.
 *
 * Why "developmental climate"?
 * - This is not meant to be an ornamental palette cycle.
 * - It is a lightweight learning-oriented layer in the broader Spw stack:
 *   substrate -> form -> role -> context -> field -> recipe.
 * - The climate should help frame how a surface is being approached:
 *   opening, stabilizing, connecting, practicing, or offering.
 *
 * Climate cycle
 * - orient    -> kindle    -> entry / attention / noticing
 * - anchor    -> anchor    -> naming / stabilization / distinction
 * - weave     -> weave     -> linking / comparison / relation-building
 * - rehearse  -> rehearse  -> retrieval / variation / practice
 * - offer     -> offer     -> publication / teaching / contribution
 *
 * Compatibility
 * - Writes both modern and legacy data attrs:
 *   data-spw-developmental-climate
 *   data-spw-developmental-label
 *   data-spw-learning-mode
 *   data-spw-spirit-phase
 *
 * - Emits:
 *   development:shifted   (new canonical event)
 *   spirit:shifted        (backward-compatible semantic bridge)
 *
 * HTML opt-ins
 * - data-spw-developmental-menu="true"
 *   Adds a local climate menu to the nearest heading/topline region.
 *
 * - data-spw-learning-surface="overview|practice|archive|comparison|publication"
 *   Optional authored hint for future scaffolding and recipe systems.
 */

import { getSiteSettings, saveSiteSettings } from './site-settings.js';
import { bus } from './spw-bus.js';

const DEVELOPMENTAL_CLIMATES = Object.freeze([
  {
    id: 'orient',
    label: 'kindle',
    learningMode: 'entry',
    description: 'Open the frame, notice cues, and sense the terrain before forcing conclusions.',
    recipeBias: ['survey', 'naming', 'entry'],
    wonderBias: ['orientation', 'inquiry']
  },
  {
    id: 'anchor',
    label: 'anchor',
    learningMode: 'stabilize',
    description: 'Name distinctions, stabilize references, and give the surface something firm to stand on.',
    recipeBias: ['contrast', 'grounding', 'naming'],
    wonderBias: ['memory', 'constraint']
  },
  {
    id: 'weave',
    label: 'weave',
    learningMode: 'connect',
    description: 'Relate examples, build parallels, and connect local structure to neighboring concepts.',
    recipeBias: ['comparison', 'mapping', 'analogy'],
    wonderBias: ['comparison', 'resonance']
  },
  {
    id: 'rehearse',
    label: 'rehearse',
    learningMode: 'practice',
    description: 'Retrieve, vary, test, and practice until the pattern can be used rather than merely recognized.',
    recipeBias: ['retrieval', 'variation', 'practice'],
    wonderBias: ['memory', 'constraint']
  },
  {
    id: 'offer',
    label: 'offer',
    learningMode: 'publish',
    description: 'Externalize the work through explanation, publication, teaching, or a usable contribution.',
    recipeBias: ['publication', 'teaching', 'projection'],
    wonderBias: ['projection', 'resonance']
  }
]);

const DEFAULT_CLIMATE_ID = 'orient';
const DEFAULT_AUTO_CYCLE_MS = 24000;

const LEGACY_PHASE_MAP = Object.freeze({
  initiation: 'orient',
  orient: 'orient',
  kindle: 'orient',

  resistance: 'anchor',
  attune: 'anchor',
  settle: 'anchor',
  anchor: 'anchor',

  transformation: 'weave',
  compose: 'weave',
  weave: 'weave',

  return: 'rehearse',
  rehearse: 'rehearse',
  practice: 'rehearse',

  expression: 'offer',
  project: 'offer',
  offer: 'offer'
});

let climateAutoCycleTimer = null;
let initialized = false;
let menuUnsubscribe = [];

/* ==========================================================================
   1. Lookup helpers
   ========================================================================== */

const normalizeToken = (value = '') => String(value).trim().toLowerCase();

const getClimateDefinition = (phase) => {
  const normalized = normalizeDevelopmentalClimate(phase);
  return DEVELOPMENTAL_CLIMATES.find((entry) => entry.id === normalized) || DEVELOPMENTAL_CLIMATES[0];
};

const normalizeDevelopmentalClimate = (value) => {
  const token = normalizeToken(value);
  if (!token) return DEFAULT_CLIMATE_ID;
  return LEGACY_PHASE_MAP[token] || (DEVELOPMENTAL_CLIMATES.some((entry) => entry.id === token) ? token : DEFAULT_CLIMATE_ID);
};

const getClimateIndex = (phase) => {
  const normalized = normalizeDevelopmentalClimate(phase);
  const index = DEVELOPMENTAL_CLIMATES.findIndex((entry) => entry.id === normalized);
  return index === -1 ? 0 : index;
};

const phaseLabel = (phase) => getClimateDefinition(phase).label;
const phaseDescription = (phase) => getClimateDefinition(phase).description;

const getNextDevelopmentalClimate = (currentPhase) => {
  const index = getClimateIndex(currentPhase);
  return DEVELOPMENTAL_CLIMATES[(index + 1) % DEVELOPMENTAL_CLIMATES.length].id;
};

const getPreviousDevelopmentalClimate = (currentPhase) => {
  const index = getClimateIndex(currentPhase);
  return DEVELOPMENTAL_CLIMATES[(index - 1 + DEVELOPMENTAL_CLIMATES.length) % DEVELOPMENTAL_CLIMATES.length].id;
};

const getDevelopmentalRecipeBias = (phase) => [...getClimateDefinition(phase).recipeBias];
const getDevelopmentalWonderBias = (phase) => [...getClimateDefinition(phase).wonderBias];

/* ==========================================================================
   2. Settings resolution
   ========================================================================== */

const resolveCurrentClimateFromSettings = (settings = getSiteSettings()) => {
  return normalizeDevelopmentalClimate(
    settings.currentDevelopmentalClimate
    || settings.currentDevelopmentalClimate
    || DEFAULT_CLIMATE_ID
  );
};

const resolveAutoCycleSetting = (settings = getSiteSettings()) => {
  return (
    settings.developmentalClimateAutoCycle
    || settings.developmentalClimateAutoCycle
    || 'off'
  );
};

const persistClimate = (phase, extra = {}) => {
  const normalized = normalizeDevelopmentalClimate(phase);

  saveSiteSettings({
    currentDevelopmentalClimate: normalized,
    currentDevelopmentalClimate: normalized,
    ...extra
  });

  return normalized;
};

/* ==========================================================================
   3. Application
   ========================================================================== */

const writeClimateDatasets = (phase) => {
  const definition = getClimateDefinition(phase);
  const root = document.documentElement;
  const body = document.body;

  root.dataset.spwDevelopmentalClimate = definition.id;
  root.dataset.spwDevelopmentalLabel = definition.label;
  root.dataset.spwLearningMode = definition.learningMode;

  // Backward-compat hook for older CSS/runtime listeners
  root.dataset.spwSpiritPhase = definition.id;

  if (body) {
    body.dataset.spwDevelopmentalClimate = definition.id;
    body.dataset.spwDevelopmentalLabel = definition.label;
    body.dataset.spwLearningMode = definition.learningMode;
  }

  root.style.setProperty('--spw-developmental-index', `${getClimateIndex(definition.id)}`);
};

const emitClimateShift = (phase, source = 'runtime') => {
  const definition = getClimateDefinition(phase);
  const detail = {
    phase: definition.id,
    label: definition.label,
    learningMode: definition.learningMode,
    description: definition.description,
    recipeBias: [...definition.recipeBias],
    wonderBias: [...definition.wonderBias],
    index: getClimateIndex(definition.id),
    source
  };

  bus.emit('development:shifted', detail, { target: document });
  bus.emit('spirit:shifted', detail, { target: document });
};

const applyDevelopmentalClimate = (phase, options = {}) => {
  const normalized = normalizeDevelopmentalClimate(phase);
  writeClimateDatasets(normalized);
  emitClimateShift(normalized, options.source || 'runtime');
  return normalized;
};

const jumpToDevelopmentalClimate = (phase, options = {}) => {
  const normalized = persistClimate(phase);
  applyDevelopmentalClimate(normalized, { source: options.source || 'menu' });
  return normalized;
};

const cycleToNextDevelopmentalClimate = (options = {}) => {
  const current = resolveCurrentClimateFromSettings();
  const next = getNextDevelopmentalClimate(current);
  return jumpToDevelopmentalClimate(next, { source: options.source || 'cycle-next' });
};

const cycleToPreviousDevelopmentalClimate = (options = {}) => {
  const current = resolveCurrentClimateFromSettings();
  const previous = getPreviousDevelopmentalClimate(current);
  return jumpToDevelopmentalClimate(previous, { source: options.source || 'cycle-previous' });
};

/* ==========================================================================
   4. Auto-cycle
   ========================================================================== */

const startDevelopmentalCycle = (duration = DEFAULT_AUTO_CYCLE_MS) => {
  if (climateAutoCycleTimer) return;

  climateAutoCycleTimer = window.setInterval(() => {
    cycleToNextDevelopmentalClimate({ source: 'auto' });
  }, duration);
};

const stopDevelopmentalCycle = () => {
  if (!climateAutoCycleTimer) return;
  clearInterval(climateAutoCycleTimer);
  climateAutoCycleTimer = null;
};

/* ==========================================================================
   5. Opt-in menu enhancement
   ========================================================================== */

const getMenuHosts = () => {
  return Array.from(document.querySelectorAll('[data-spw-developmental-menu="true"]'))
    .map((element) => {
      if (element.matches('.frame-heading, .frame-topline')) return element;

      return (
        element.querySelector('.frame-heading, .frame-topline')
        || element.closest('.site-frame')?.querySelector('.frame-heading, .frame-topline')
        || element
      );
    });
};

const ensureMenuOnHost = (host) => {
  if (!(host instanceof Element)) return null;
  if (host.querySelector('[data-developmental-cycle="true"]')) return null;

  const phaseControls = document.createElement('details');
  phaseControls.className = 'developmental-climate-controls climate-menu';
  phaseControls.setAttribute('data-developmental-cycle', 'true');
  phaseControls.dataset.climateMenuState = 'closed';
  phaseControls.setAttribute('aria-label', 'Developmental climate menu');

  const trigger = document.createElement('summary');
  trigger.className = 'climate-menu-trigger';
  trigger.setAttribute('data-op', 'ref');
  trigger.setAttribute('aria-label', 'Open developmental climate menu');
  trigger.setAttribute('aria-expanded', 'false');

  const menu = document.createElement('div');
  menu.className = 'climate-menu-options';
  menu.setAttribute('role', 'group');
  menu.setAttribute('aria-label', 'Choose a developmental climate');

  DEVELOPMENTAL_CLIMATES.forEach((phase) => {
    const choice = document.createElement('button');
    choice.className = 'climate-menu-choice';
    choice.type = 'button';
    choice.dataset.developmentalChoice = phase.id;
    choice.dataset.op = 'probe';
    choice.textContent = phase.label;
    choice.title = phase.description;
    choice.setAttribute('aria-label', `Set developmental climate to ${phase.label}`);

    choice.addEventListener('click', () => {
      jumpToDevelopmentalClimate(phase.id, { source: 'menu' });
      phaseControls.removeAttribute('open');
    });

    menu.appendChild(choice);
  });

  const updateMenu = (phase) => {
    const definition = getClimateDefinition(phase);
    trigger.textContent = definition.label;
    trigger.title = definition.description;
    menu.querySelectorAll('[data-developmental-choice]').forEach((choice) => {
      choice.setAttribute('aria-pressed', String(choice.dataset.developmentalChoice === definition.id));
    });
  };

  phaseControls.addEventListener('toggle', () => {
    const open = phaseControls.open;
    phaseControls.dataset.climateMenuState = open ? 'open' : 'closed';
    trigger.setAttribute('aria-expanded', String(open));
  });

  updateMenu(resolveCurrentClimateFromSettings());
  phaseControls.append(trigger, menu);
  host.appendChild(phaseControls);

  return updateMenu;
};

const initDevelopmentalMenus = () => {
  const menuUpdaters = getMenuHosts()
    .map((host) => ensureMenuOnHost(host))
    .filter(Boolean);

  if (!menuUpdaters.length) return;

  menuUnsubscribe.push(
    bus.on('development:shifted', (event) => {
      const phase = event.detail?.phase;
      menuUpdaters.forEach((update) => update(phase));
    })
  );
};

/* ==========================================================================
   6. Settings listener
   ========================================================================== */

const setupSettingsListener = () => {
  menuUnsubscribe.push(
    bus.on('settings:changed', (event) => {
      const detail = event.detail || {};

      if (
        detail.currentDevelopmentalClimate
        || detail.currentDevelopmentalClimate
      ) {
        applyDevelopmentalClimate(
          detail.currentDevelopmentalClimate || detail.currentDevelopmentalClimate,
          { source: 'settings' }
        );
      }

      if (
        detail.developmentalClimateAutoCycle === 'on'
        || detail.developmentalClimateAutoCycle === 'on'
      ) {
        startDevelopmentalCycle();
      } else if (
        detail.developmentalClimateAutoCycle === 'off'
        || detail.developmentalClimateAutoCycle === 'off'
      ) {
        stopDevelopmentalCycle();
      }
    })
  );
};

/* ==========================================================================
   7. Init
   ========================================================================== */

const initDevelopmentalClimate = () => {
  if (initialized) return;
  initialized = true;

  const settings = getSiteSettings();
  const current = resolveCurrentClimateFromSettings(settings);

  applyDevelopmentalClimate(current, { source: 'init' });

  if (resolveAutoCycleSetting(settings) === 'on') {
    startDevelopmentalCycle();
  }

  setupSettingsListener();
  initDevelopmentalMenus();
};

/* ==========================================================================
   8. Auto-init
   ========================================================================== */

const init = () => {
  initDevelopmentalClimate();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}

/* ==========================================================================
   9. Exports
   ========================================================================== */

export {
  DEVELOPMENTAL_CLIMATES,
  DEFAULT_CLIMATE_ID,
  applyDevelopmentalClimate,
  cycleToNextDevelopmentalClimate,
  cycleToPreviousDevelopmentalClimate,
  getClimateDefinition,
  getClimateIndex,
  getDevelopmentalRecipeBias,
  getDevelopmentalWonderBias,
  getNextDevelopmentalClimate,
  getPreviousDevelopmentalClimate,
  initDevelopmentalClimate,
  jumpToDevelopmentalClimate,
  normalizeDevelopmentalClimate,
  phaseDescription,
  phaseLabel,
  startDevelopmentalCycle,
  stopDevelopmentalCycle
};