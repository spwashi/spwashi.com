/**
 * spw-developmental-climate.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Manage the current developmental climate for the site.
 * - Persist and restore the user's preferred developmental disposition.
 * - Emit canonical climate events for CSS, guidance, scaffolding, authoring,
 *   recipe, spell, and future editor systems.
 * - Optionally render explicit climate menus only on authored surfaces that
 *   opt in with `data-spw-developmental-menu="true"`.
 *
 * Why "developmental climate"?
 * - This is not an ornamental palette cycle.
 * - It is an editorial / learning-oriented weather layer in the broader Spw
 *   stack:
 *
 *     substrate -> form -> role -> context -> field -> recipe
 *
 * - Author workflow answers: what is the writer doing?
 * - Developmental climate answers: what kind of attention is the surface
 *   inviting?
 *
 * Climate cycle
 * - orient    -> kindle    -> find the page
 * - anchor    -> anchor    -> hold the structure
 * - weave     -> weave     -> connect the material
 * - rehearse  -> rehearse  -> test the voice
 * - offer     -> offer     -> prepare the gift
 *
 * Compatibility
 * - Writes modern and legacy data attrs:
 *   data-spw-developmental-climate
 *   data-spw-developmental-label
 *   data-spw-developmental-author-label
 *   data-spw-learning-mode
 *   data-spw-spirit-phase
 *
 * - Emits:
 *   development:shifted   canonical climate event
 *   spirit:shifted        backward-compatible semantic bridge
 *
 * HTML opt-ins
 * - data-spw-developmental-menu="true"
 *   Adds a local climate menu to the nearest heading/topline region.
 *
 * - data-spw-learning-surface="overview|practice|archive|comparison|publication"
 *   Optional authored hint for scaffolding and recipe systems.
 */

import {
  getSiteSettings,
  saveSiteSettings
} from '/public/js/site-settings.js';

import { bus } from '/public/js/spw-bus.js';

const DEVELOPMENTAL_CLIMATES = Object.freeze([
  {
    id: 'orient',
    label: 'kindle',
    authorLabel: 'find the page',
    learningMode: 'entry',
    description: 'Open the frame, notice cues, and sense the terrain before forcing conclusions.',
    authorDescription: 'Find the page. Open the frame, notice cues, and sense the terrain.',
    recipeBias: Object.freeze(['survey', 'naming', 'entry']),
    wonderBias: Object.freeze(['orientation', 'inquiry']),
    climateRole: 'threshold',
    menuHint: 'Find the page'
  },
  {
    id: 'anchor',
    label: 'anchor',
    authorLabel: 'hold the structure',
    learningMode: 'stabilize',
    description: 'Name distinctions, stabilize references, and give the surface something firm to stand on.',
    authorDescription: 'Hold the structure. Name distinctions and stabilize references.',
    recipeBias: Object.freeze(['contrast', 'grounding', 'naming']),
    wonderBias: Object.freeze(['memory', 'constraint']),
    climateRole: 'structure',
    menuHint: 'Hold the structure'
  },
  {
    id: 'weave',
    label: 'weave',
    authorLabel: 'connect the material',
    learningMode: 'connect',
    description: 'Relate examples, build parallels, and connect local structure to neighboring concepts.',
    authorDescription: 'Connect the material. Build parallels, relationships, and useful mappings.',
    recipeBias: Object.freeze(['comparison', 'mapping', 'analogy']),
    wonderBias: Object.freeze(['comparison', 'resonance']),
    climateRole: 'relation',
    menuHint: 'Connect the material'
  },
  {
    id: 'rehearse',
    label: 'rehearse',
    authorLabel: 'test the voice',
    learningMode: 'practice',
    description: 'Retrieve, vary, test, and practice until the pattern can be used rather than merely recognized.',
    authorDescription: 'Test the voice. Retrieve, vary, revise, and practice the pattern.',
    recipeBias: Object.freeze(['retrieval', 'variation', 'practice']),
    wonderBias: Object.freeze(['memory', 'constraint']),
    climateRole: 'practice',
    menuHint: 'Test the voice'
  },
  {
    id: 'offer',
    label: 'offer',
    authorLabel: 'prepare the gift',
    learningMode: 'publish',
    description: 'Externalize the work through explanation, publication, teaching, or a usable contribution.',
    authorDescription: 'Prepare the gift. Externalize the work for readers, teaching, or publication.',
    recipeBias: Object.freeze(['publication', 'teaching', 'projection']),
    wonderBias: Object.freeze(['projection', 'resonance']),
    climateRole: 'publication',
    menuHint: 'Prepare the gift'
  }
]);

const DEFAULT_CLIMATE_ID = 'orient';
const DEFAULT_AUTO_CYCLE_MS = 24000;

const LEGACY_PHASE_MAP = Object.freeze({
  initiation: 'orient',
  orient: 'orient',
  kindle: 'orient',
  entry: 'orient',
  notice: 'orient',

  resistance: 'anchor',
  attune: 'anchor',
  settle: 'anchor',
  anchor: 'anchor',
  stabilize: 'anchor',
  structure: 'anchor',

  transformation: 'weave',
  compose: 'weave',
  weave: 'weave',
  connect: 'weave',
  relation: 'weave',

  return: 'rehearse',
  rehearse: 'rehearse',
  practice: 'rehearse',
  retrieve: 'rehearse',
  revise: 'rehearse',

  expression: 'offer',
  project: 'offer',
  offer: 'offer',
  publish: 'offer',
  publication: 'offer'
});

let climateAutoCycleTimer = null;
let initialized = false;
let menuUnsubscribe = [];

/* ==========================================================================
   1. Lookup helpers
   ========================================================================== */

const normalizeToken = (value = '') => (
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
);

const normalizeDevelopmentalClimate = (value = '') => {
  const token = normalizeToken(value);
  if (!token) return DEFAULT_CLIMATE_ID;

  return (
    LEGACY_PHASE_MAP[token]
    || (DEVELOPMENTAL_CLIMATES.some((entry) => entry.id === token) ? token : DEFAULT_CLIMATE_ID)
  );
};

const getClimateDefinition = (phase = DEFAULT_CLIMATE_ID) => {
  const normalized = normalizeDevelopmentalClimate(phase);

  return (
    DEVELOPMENTAL_CLIMATES.find((entry) => entry.id === normalized)
    || DEVELOPMENTAL_CLIMATES[0]
  );
};

const getClimateIndex = (phase = DEFAULT_CLIMATE_ID) => {
  const normalized = normalizeDevelopmentalClimate(phase);
  const index = DEVELOPMENTAL_CLIMATES.findIndex((entry) => entry.id === normalized);

  return index === -1 ? 0 : index;
};

const phaseLabel = (phase) => getClimateDefinition(phase).label;
const phaseDescription = (phase) => getClimateDefinition(phase).description;
const phaseAuthorLabel = (phase) => getClimateDefinition(phase).authorLabel;

const getNextDevelopmentalClimate = (currentPhase) => {
  const index = getClimateIndex(currentPhase);

  return DEVELOPMENTAL_CLIMATES[(index + 1) % DEVELOPMENTAL_CLIMATES.length].id;
};

const getPreviousDevelopmentalClimate = (currentPhase) => {
  const index = getClimateIndex(currentPhase);

  return DEVELOPMENTAL_CLIMATES[
  (index - 1 + DEVELOPMENTAL_CLIMATES.length) % DEVELOPMENTAL_CLIMATES.length
    ].id;
};

const getDevelopmentalRecipeBias = (phase) => [...getClimateDefinition(phase).recipeBias];
const getDevelopmentalWonderBias = (phase) => [...getClimateDefinition(phase).wonderBias];

const getClimateDetail = (phase, source = 'runtime') => {
  const definition = getClimateDefinition(phase);

  return Object.freeze({
    phase: definition.id,
    climate: definition.id,
    label: definition.label,
    authorLabel: definition.authorLabel,
    learningMode: definition.learningMode,
    description: definition.description,
    authorDescription: definition.authorDescription,
    recipeBias: [...definition.recipeBias],
    wonderBias: [...definition.wonderBias],
    climateRole: definition.climateRole,
    index: getClimateIndex(definition.id),
    source
  });
};

/* ==========================================================================
   2. Settings resolution
   ========================================================================== */

const resolveCurrentClimateFromSettings = (settings = getSiteSettings()) => (
  normalizeDevelopmentalClimate(settings.currentDevelopmentalClimate || DEFAULT_CLIMATE_ID)
);

const resolveAutoCycleSetting = (settings = getSiteSettings()) => (
  settings.developmentalClimateAutoCycle || 'off'
);

const persistClimate = (phase, extra = {}) => {
  const normalized = normalizeDevelopmentalClimate(phase);

  saveSiteSettings({
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

  const dataset = {
    spwDevelopmentalClimate: definition.id,
    spwDevelopmentalLabel: definition.label,
    spwDevelopmentalAuthorLabel: definition.authorLabel,
    spwLearningMode: definition.learningMode,

    /* Backward-compatible hook for older CSS/runtime listeners. */
    spwSpiritPhase: definition.id
  };

  Object.entries(dataset).forEach(([key, value]) => {
    root.dataset[key] = value;
    if (body) body.dataset[key] = value;
  });

  root.style.setProperty('--spw-developmental-index', String(getClimateIndex(definition.id)));
};

const emitClimateShift = (phase, source = 'runtime') => {
  const detail = getClimateDetail(phase, source);

  bus.emit('development:shifted', detail, { target: document });
  bus.emit('spirit:shifted', detail, { target: document });

  return detail;
};

const applyDevelopmentalClimate = (phase, options = {}) => {
  const normalized = normalizeDevelopmentalClimate(phase);

  writeClimateDatasets(normalized);

  if (options.emit !== false) {
    emitClimateShift(normalized, options.source || 'runtime');
  }

  return normalized;
};

const jumpToDevelopmentalClimate = (phase, options = {}) => {
  const normalized = persistClimate(phase, options.settings || {});

  applyDevelopmentalClimate(normalized, {
    source: options.source || 'menu',
    emit: options.emit
  });

  return normalized;
};

const cycleToNextDevelopmentalClimate = (options = {}) => {
  const current = resolveCurrentClimateFromSettings();
  const next = getNextDevelopmentalClimate(current);

  return jumpToDevelopmentalClimate(next, {
    source: options.source || 'cycle-next'
  });
};

const cycleToPreviousDevelopmentalClimate = (options = {}) => {
  const current = resolveCurrentClimateFromSettings();
  const previous = getPreviousDevelopmentalClimate(current);

  return jumpToDevelopmentalClimate(previous, {
    source: options.source || 'cycle-previous'
  });
};

/* ==========================================================================
   4. Auto-cycle
   ========================================================================== */

const startDevelopmentalCycle = (duration = DEFAULT_AUTO_CYCLE_MS) => {
  if (climateAutoCycleTimer) return climateAutoCycleTimer;

  climateAutoCycleTimer = window.setInterval(() => {
    cycleToNextDevelopmentalClimate({ source: 'auto' });
  }, duration);

  return climateAutoCycleTimer;
};

const stopDevelopmentalCycle = () => {
  if (!climateAutoCycleTimer) return;

  clearInterval(climateAutoCycleTimer);
  climateAutoCycleTimer = null;
};

const syncDevelopmentalCycle = (settings = getSiteSettings()) => {
  if (resolveAutoCycleSetting(settings) === 'on') {
    startDevelopmentalCycle();
    return;
  }

  stopDevelopmentalCycle();
};

/* ==========================================================================
   5. Opt-in menu enhancement
   ========================================================================== */

const getMenuHosts = () => (
  Array.from(document.querySelectorAll('[data-spw-developmental-menu="true"]'))
    .map((element) => {
      if (element.matches('.frame-heading, .frame-topline')) return element;

      return (
        element.querySelector('.frame-heading, .frame-topline')
        || element.closest('.site-frame')?.querySelector('.frame-heading, .frame-topline')
        || element
      );
    })
);

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

  const currentLabel = document.createElement('span');
  currentLabel.className = 'climate-menu-trigger__label';

  const currentHint = document.createElement('span');
  currentHint.className = 'climate-menu-trigger__hint';
  currentHint.setAttribute('aria-hidden', 'true');

  trigger.append(currentLabel, currentHint);

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
    choice.dataset.climateRole = phase.climateRole;
    choice.title = phase.authorDescription || phase.description;
    choice.setAttribute('aria-label', `Set developmental climate to ${phase.label}: ${phase.menuHint}`);

    const choiceLabel = document.createElement('span');
    choiceLabel.className = 'climate-menu-choice__label';
    choiceLabel.textContent = phase.label;

    const choiceHint = document.createElement('span');
    choiceHint.className = 'climate-menu-choice__hint';
    choiceHint.textContent = phase.menuHint;

    choice.append(choiceLabel, choiceHint);

    choice.addEventListener('click', () => {
      jumpToDevelopmentalClimate(phase.id, { source: 'menu' });
      phaseControls.removeAttribute('open');
    });

    menu.appendChild(choice);
  });

  const updateMenu = (phase) => {
    const definition = getClimateDefinition(phase);

    currentLabel.textContent = definition.label;
    currentHint.textContent = definition.authorLabel;
    trigger.title = definition.authorDescription || definition.description;
    phaseControls.dataset.currentDevelopmentalClimate = definition.id;

    menu.querySelectorAll('[data-developmental-choice]').forEach((choice) => {
      const active = choice.dataset.developmentalChoice === definition.id;
      choice.setAttribute('aria-pressed', String(active));
      choice.dataset.siteSettingActive = active ? 'true' : 'false';
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

const teardownDevelopmentalMenus = () => {
  menuUnsubscribe.forEach((unsubscribe) => unsubscribe?.());
  menuUnsubscribe = [];
};

const initDevelopmentalMenus = () => {
  const menuUpdaters = getMenuHosts()
    .map((host) => ensureMenuOnHost(host))
    .filter(Boolean);

  if (!menuUpdaters.length) return;

  menuUnsubscribe.push(
    bus.on('development:shifted', (event) => {
      const phase = event.detail?.phase || event.detail?.climate;
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

      if (detail.currentDevelopmentalClimate) {
        applyDevelopmentalClimate(detail.currentDevelopmentalClimate, {
          source: 'settings'
        });
      }

      syncDevelopmentalCycle(detail);
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
  syncDevelopmentalCycle(settings);
  setupSettingsListener();
  initDevelopmentalMenus();
};

const destroyDevelopmentalClimate = () => {
  stopDevelopmentalCycle();
  teardownDevelopmentalMenus();
  initialized = false;
};

/* ==========================================================================
   8. Auto-init
   ========================================================================== */

const init = () => {
  initDevelopmentalClimate();
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}

/* ==========================================================================
   9. Exports
   ========================================================================== */

export {
  DEVELOPMENTAL_CLIMATES,
  DEFAULT_AUTO_CYCLE_MS,
  DEFAULT_CLIMATE_ID,
  applyDevelopmentalClimate,
  cycleToNextDevelopmentalClimate,
  cycleToPreviousDevelopmentalClimate,
  destroyDevelopmentalClimate,
  getClimateDefinition,
  getClimateDetail,
  getClimateIndex,
  getDevelopmentalRecipeBias,
  getDevelopmentalWonderBias,
  getNextDevelopmentalClimate,
  getPreviousDevelopmentalClimate,
  initDevelopmentalClimate,
  jumpToDevelopmentalClimate,
  normalizeDevelopmentalClimate,
  phaseAuthorLabel,
  phaseDescription,
  phaseLabel,
  startDevelopmentalCycle,
  stopDevelopmentalCycle,
  syncDevelopmentalCycle
};