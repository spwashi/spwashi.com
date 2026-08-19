import { normalizeQuerySearch } from './query-composer.js';

const DEFAULT_NAMESPACE = 'spw';
const DEFAULT_TARGET_SELECTOR = '[data-spw-kind], [data-spw-role], [data-spw-feature], [data-spw-module], .spw-frame, .frame-panel, .frame-card';
const SPW_DATASET_PREFIX = 'spw';
const TUNING_PREFIX = 'spwTune';
const QUERY_PREFIXES = Object.freeze({
  cssVar: 'spw-var-',
  color: 'spw-color-',
  data: 'spw-data-',
  tune: 'spw-tune-',
});
export const SPW_QUERY_ALIASES = Object.freeze({
  debug: Object.freeze(['spw-debug', 'debug']),
  diagnostics: Object.freeze(['spw-diagnostics', 'diagnostics']),
  interaction: Object.freeze(['spw-interaction', 'interaction']),
  log: Object.freeze(['spw-log', 'log']),
  logLevel: Object.freeze(['spw-log-level', 'log-level']),
  meaning: Object.freeze(['spw-meaning', 'meaning']),
  moduleAudit: Object.freeze(['spw-module-audit', 'module-audit']),
  moduleDelay: Object.freeze(['spw-module-delay', 'module-delay']),
  moduleOnly: Object.freeze(['spw-module-only', 'module-only']),
  moduleSkip: Object.freeze(['spw-module-skip', 'module-skip']),
  moduleTiming: Object.freeze(['spw-module-timing', 'module-timing']),
  moduleVisuals: Object.freeze(['spw-module-visuals', 'module-visuals']),
  palette: Object.freeze(['spw-palette', 'palette']),
  physics: Object.freeze(['spw-physics', 'physics']),
  reflow: Object.freeze(['spw-reflow', 'reflow']),
  runtimeTiming: Object.freeze(['spw-runtime-timing', 'runtime-timing']),
  view: Object.freeze(['spw-view', 'view']),
  condense: Object.freeze(['spw-condense', 'condense', 'c']),
  precipitate: Object.freeze(['spw-precipitate', 'precipitate', 'p']),
  pack: Object.freeze(['spw-pack', 'pack']),
  lens: Object.freeze(['spw-lens', 'lens', 'l']),
  screenshot: Object.freeze(['spw-screenshot', 'screenshot', 'shot']),
});

export const SPW_PHYSICS_PRESETS = Object.freeze({
  calm: Object.freeze({
    data: Object.freeze({ spwPhysics: 'calm' }),
    cssVars: Object.freeze({
      '--cinematic-intensity': '0.82',
      '--cinematic-depth-scale': '0.78',
      '--cinematic-outline-scale': '0.84',
      '--cinematic-wash-scale': '0.72',
      '--cinematic-glow-scale': '0.7',
      '--spw-motion-puppet-response': '0.24',
    }),
  }),
  tactile: Object.freeze({
    data: Object.freeze({ spwPhysics: 'tactile' }),
    cssVars: Object.freeze({
      '--cinematic-intensity': '1',
      '--cinematic-depth-scale': '1.08',
      '--cinematic-outline-scale': '1',
      '--cinematic-wash-scale': '0.9',
      '--cinematic-glow-scale': '0.88',
      '--spw-motion-puppet-response': '0.46',
    }),
  }),
  puppet: Object.freeze({
    data: Object.freeze({ spwPhysics: 'puppet' }),
    cssVars: Object.freeze({
      '--cinematic-intensity': '1.12',
      '--cinematic-depth-scale': '1.18',
      '--cinematic-outline-scale': '1.14',
      '--cinematic-wash-scale': '1.04',
      '--cinematic-glow-scale': '1.12',
      '--spw-motion-puppet-response': '0.72',
    }),
  }),
  screenshot: Object.freeze({
    data: Object.freeze({ spwPhysics: 'screenshot' }),
    cssVars: Object.freeze({
      '--cinematic-intensity': '0.92',
      '--cinematic-depth-scale': '1',
      '--cinematic-outline-scale': '1.24',
      '--cinematic-wash-scale': '0.7',
      '--cinematic-glow-scale': '0.58',
      '--spw-motion-puppet-response': '0.18',
    }),
  }),
});

export const SPW_MEANING_PRESETS = Object.freeze({
  quiet: Object.freeze({
    data: Object.freeze({
      spwMeaningMode: 'quiet',
      spwSemanticDensity: 'minimal',
      spwShowSemanticMetadata: 'off',
    }),
    cssVars: Object.freeze({ '--spw-semantic-density-factor': '0' }),
  }),
  readable: Object.freeze({
    data: Object.freeze({
      spwMeaningMode: 'readable',
      spwSemanticDensity: 'normal',
      spwShowSemanticMetadata: 'off',
    }),
    cssVars: Object.freeze({ '--spw-semantic-density-factor': '0.42' }),
  }),
  inspect: Object.freeze({
    data: Object.freeze({
      spwMeaningMode: 'inspect',
      spwSemanticDensity: 'rich',
      spwShowSemanticMetadata: 'on',
    }),
    cssVars: Object.freeze({ '--spw-semantic-density-factor': '1' }),
  }),
  screenshot: Object.freeze({
    data: Object.freeze({
      spwMeaningMode: 'screenshot',
      spwSemanticDensity: 'rich',
      spwShowSemanticMetadata: 'on',
      spwSpecPills: 'on',
    }),
    cssVars: Object.freeze({
      '--spw-semantic-density-factor': '1',
      '--spw-screenshot-meaning-contrast': '1',
    }),
  }),
});

export const SPW_QUERY_PRESETS = Object.freeze({
  quiet: Object.freeze({
    label: 'Quiet view',
    href: '?view=quiet&meaning=quiet',
    description: 'Lower semantic density and quieter ornament.',
  }),
  readable: Object.freeze({
    label: 'Readable view',
    href: '?view=readable&meaning=readable',
    description: 'Balanced reading mode with stable meaning and low motion.',
  }),
  reader: Object.freeze({
    label: 'Reader view',
    href: '?view=readable&meaning=readable&interaction=calm',
    description: 'A calm, prose-forward surface for readers who want less chrome.',
  }),
  inspect: Object.freeze({
    label: 'Inspect view',
    href: '?view=inspect&meaning=inspect&debug=css,layout&diagnostics=basic&log=site-settings,layout-shift&log-level=debug',
    description: 'Show CSS and layout ownership with richer metadata and stability summaries.',
  }),
  builder: Object.freeze({
    label: 'Builder view',
    href: '?view=inspect&meaning=inspect&debug=css,layout&diagnostics=basic&log=layout-shift&log-level=debug&physics=puppet',
    description: 'Expose structural chrome and repeatable layout-stability logs for visitors who want the mechanics visible.',
  }),
  screenshot: Object.freeze({
    label: 'Screenshot view',
    href: '?view=screenshot&interaction=screenshot&palette=software',
    description: 'Stabilize the surface for capture and comparison.',
  }),
  print: Object.freeze({
    label: 'Print precipitation',
    href: '?condense=print&precipitate=print&view=readable',
    description: 'Condense chrome and prepare a print-friendly page projection.',
  }),
  condensed: Object.freeze({
    label: 'Condensed card',
    href: '?condense=card&precipitate=condensed&view=readable',
    description: 'Brief copy tier with screenshot-ready figure framing.',
  }),
  calm: Object.freeze({
    label: 'Calm interaction',
    href: '?view=readable&interaction=calm',
    description: 'Reduce motion and make the surface gentler to browse.',
  }),
  tactile: Object.freeze({
    label: 'Tactile interaction',
    href: '?view=readable&interaction=tactile',
    description: 'Use a responsive but still readable interaction posture.',
  }),
  puppet: Object.freeze({
    label: 'Puppet interaction',
    href: '?view=inspect&interaction=puppet&debug=layout',
    description: 'Emphasize performative, inspectable motion.',
  }),
  css: Object.freeze({
    label: 'CSS debug',
    href: '?view=inspect&debug=css',
    description: 'Show semantic structure and CSS ownership tags.',
  }),
  layout: Object.freeze({
    label: 'Layout debug',
    href: '?view=inspect&debug=layout&diagnostics=basic&log=layout-shift&log-level=debug',
    description: 'Show layout ownership, floating chrome boundaries, and native defaults.',
  }),
});

export const SPW_LOG_LEVELS = Object.freeze({
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
});

export const SPW_LOG_RELATIONSHIPS = Object.freeze({
  CONTRACT: 'contract',
  GESTURE: 'gesture',
  LIFECYCLE: 'lifecycle',
  MEASURE: 'measure',
  QUERY: 'query',
  REFLOW: 'reflow',
  THEME: 'theme',
});

const LOG_LEVEL_ORDER = Object.freeze({
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
});

export const SPW_REFLOW_REASONS = Object.freeze({
  CONTENT: 'content',
  DENSITY: 'density',
  FONT: 'font',
  HYDRATION: 'hydration',
  IMAGE: 'image',
  INTERACTION: 'interaction',
  LAYOUT: 'layout',
  MEASURE: 'measure',
  THEME: 'theme',
  VIEWPORT: 'viewport',
});

/* Deliberate, expressive layout shifts treated as first-class design "tropes".
   These are not failures of stability but intentional phase transitions or
   gestalt rebalancings that communicate state, ruleset application, or
   manuscript response. They are instrumented so game developers can study
   the mechanics as fodder for 1000 future fidget/office toys, and authors
   can treat them as legible layers of semantic intent in a magic manuscript.

   Use via markLayoutTrope (or markReflowReason with LAYOUT + trope details).
   The layout-shift-audit already has an "intentional" path; these feed it richly. */
export const SPW_LAYOUT_TROPES = Object.freeze({
  'phase-transition': 'A ruleset or stance change causes a described spatial or emphasis rebalancing (e.g. authorMode + climate application).',
  'ruleset-settle': 'Applying density, motif, physics, or meaning preset produces a pleasing, observable settling animation or gap/measure shift.',
  'gestalt-rebalance': 'Operator/measure clusters or frame contents regroup for stronger proximity/similarity/common-fate after a semantic change.',
  'manuscript-reveal': 'A layer of intent (audience, developmental climate, brace form, subjective/objective measure) becomes visually or spatially more prominent.',
  'fidget-parameter': 'A tuning widget or lab control adjusts a physical-seeming parameter whose effect includes a small, reversible, instrumented layout or ornament response.',
  /* New richer tropes for current enhancements */
  'theme-shift': 'Theme pack, palette resonance, or color mode change produces a deliberate, describable visual and spatial re-composition (palette refinement + tuning).',
  'spacing-tune': 'Density, gap, or content-based spacing adjustment (responsive to images, measures, SVG density) creates tunable alignment and flow.',
  'typography-flow': 'Content-aware or climate-driven typographical aerodynamics change (variable rhythm, breath, pausing encouragement) for cathartic reading and active wonder.',
  'image-memory': 'Local association of image surfaces with prompts or resonance states, creating persistent, queryable creative memory for prompts and engagement.',
  'svg-integration': 'SVG host attribute or interaction change (tunability, tropes, memory, alignment) participates in the broader expressive system.',
  /* Page-specific / content-led tropes for vocabulary resonance + attentional rhythm */
  'fermentation-rhythm': 'Content about living processes (time, substrate, inoculation) triggers slow, patient typographic and spatial rhythm that rewards attention and develops long-horizon taste.',
  'math-visual-aerodynamics': 'Pure structure visualization content drives variable flow, emphasis shifts, and pausing that make mathematical imagination feel like collaborative art or science.',
  'recipe-composition-flow': 'Recipe or culinary grammar content creates compositional breathing room and operator-driven resonance that models taste development through play.',
  'vocabulary-resonance': 'Spw/operator/brace/measure terms become live, primable, wonder-charged vocabulary objects that develop imaginative language skill and poetic/game-like discoverability.',
  /* Higher-order dimension & resource modeling scalability (budgeting macros, character resources, configurator combinatorics) */
  'higher-order-dimension': 'A surface introduces or activates multiple named, composable resource dimensions (personality, attention, creative capital, prompt budgets, etc.) as a single coherent, higher-order model.',
  'resource-composition': 'Multiple resource dimensions or capacity statements are combined (via cauldron priming, macro, or explicit expression) into a traceable, primable, higher-order artifact.',
  'budgeting-macro': 'A query-string or named macro seeds a complex, higher-order set of resource dimensions into a working surface (shareable, reproducible modeling state).',
});

export const normalizeLayoutTrope = (trope = '') => {
  const normalized = normalizeToken(trope);
  return Object.prototype.hasOwnProperty.call(SPW_LAYOUT_TROPES, normalized) ? normalized : '';
};

const normalizeToken = (value = '') => String(value)
  .trim()
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
  .replace(/[^a-zA-Z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

const toDatasetKey = (value = '') => String(value)
  .trim()
  .replace(/-+([a-z])/g, (_match, char) => char.toUpperCase());

const toCssCustomProperty = (value = '') => {
  const normalized = normalizeToken(value);
  return normalized ? `--${normalized}` : '';
};

const isElement = (value) => (
  Boolean(value)
  && typeof value === 'object'
  && value.nodeType === 1
);

const readLogTokens = () => {
  const root = globalThis.document?.documentElement;
  return String(root?.dataset?.spwLog || '')
    .split(/[,\s]+/)
    .map(normalizeToken)
    .filter(Boolean);
};

const shouldLogByDefault = (namespace = DEFAULT_NAMESPACE, level = SPW_LOG_LEVELS.INFO) => {
  const root = globalThis.document?.documentElement;
  const tokens = readLogTokens();
  const normalizedNamespace = normalizeToken(namespace) || DEFAULT_NAMESPACE;
  const configuredLevel = normalizeToken(root?.dataset?.spwLogLevel || SPW_LOG_LEVELS.DEBUG);
  const minimum = LOG_LEVEL_ORDER[configuredLevel] || LOG_LEVEL_ORDER.debug;
  const current = LOG_LEVEL_ORDER[level] || LOG_LEVEL_ORDER.info;

  if (current < minimum) return false;
  if (root?.dataset?.spwDebugMode === 'on') return true;
  return tokens.includes('on') || tokens.includes('*') || tokens.includes(normalizedNamespace);
};

const formatNumber = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  const digits = Math.abs(numeric) < 0.01 ? 4 : 3;
  return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

const describeLogDetail = (detail = {}) => {
  if (!detail || typeof detail !== 'object') return '';

  const bits = [];
  if (detail.route) bits.push(`route=${detail.route}`);
  if (detail.state) bits.push(`state=${detail.state}`);
  if (detail.outcome) bits.push(`outcome=${detail.outcome}`);
  if (detail.metric) {
    const total = formatNumber(detail.totalValue ?? detail.total);
    const batch = formatNumber(detail.batchValue ?? detail.value);
    bits.push(`${detail.metric}${total ? ` total=${total}` : ''}${batch ? ` batch=${batch}` : ''}`);
  }
  if (detail.count != null) bits.push(`count=${detail.count}`);
  if (detail.recentInputCount) bits.push(`recent-input=${detail.recentInputCount}`);
  if (detail.sourceCount) bits.push(`sources=${detail.sourceCount}`);
  if (detail.primarySource?.selector) bits.push(`primary=${detail.primarySource.selector}`);
  if (detail.id || detail.baseId) bits.push(`module=${detail.baseId || detail.id}`);
  if (detail.layer) bits.push(`layer=${detail.layer}`);
  if (detail.status) bits.push(`status=${detail.status}`);
  if (detail.effectiveWhen) bits.push(`when=${detail.effectiveWhen}`);
  if (detail.durationMs != null) bits.push(`duration=${formatNumber(detail.durationMs)}ms`);

  return bits.join(' ');
};

const rememberBrowserConsoleRecord = (record) => {
  try {
    const buffer = globalThis.__spwLogs ||= [];
    buffer.push(record);
    if (buffer.length > 80) buffer.splice(0, buffer.length - 80);
    globalThis.__spwLastLog = record;
  } catch {
    // Console logging should never affect runtime behavior.
  }
};

const resolveTarget = (target, root = globalThis.document) => {
  if (isElement(target)) return target;
  if (typeof target === 'string') return root?.querySelector?.(target) || null;
  return root?.querySelector?.(DEFAULT_TARGET_SELECTOR) || null;
};

const readSpwDataset = (target) => Object.fromEntries(
  Object.entries(target?.dataset || {})
    .filter(([key]) => key.startsWith(SPW_DATASET_PREFIX))
    .sort(([left], [right]) => left.localeCompare(right))
);

const mergeTokenList = (current = '', additions = []) => {
  const tokens = new Set(
    String(current)
      .split(/\s+/)
      .map(normalizeToken)
      .filter(Boolean)
  );

  additions.map(normalizeToken).filter(Boolean).forEach((token) => tokens.add(token));
  return [...tokens].join(' ');
};

export const SPW_INSTRUMENTATION_CONTRACT = Object.freeze({
  selectors: Object.freeze({
    defaultTarget: DEFAULT_TARGET_SELECTOR,
  }),
  attributes: Object.freeze({
    instrumentation: 'data-spw-instrumentation',
    debugSource: 'data-spw-debug-source',
    consoleState: 'data-spw-console-state',
    reflowReason: 'data-spw-reflow-reason',
    reflowScope: 'data-spw-reflow-scope',
    reflowCost: 'data-spw-reflow-cost',
    tuningPrefix: 'data-spw-tune-*',
    /* New cognitive/meaning attributes for containers — enable interpretable
       design depth and meaning for screenshots, catalog, AI agents, and
       active wonder participants. */
    meaningDepth: 'data-spw-meaning-depth',
    designInterpretation: 'data-spw-design-interpretation',
    memoryManaged: 'data-spw-memory-managed',
    annotationScope: 'data-spw-annotation-scope',
  }),
  queryParameters: Object.freeze({
    cssVariable: 'spw-var-<token>=<value>',
    colorVariable: 'spw-color-<token>=<color>',
    dataAttribute: 'spw-data-<name>=<value>',
    debugView: 'spw-debug|debug=<on|off|css|layout|css,layout>',
    diagnosticsMode: 'spw-diagnostics|diagnostics=<off|basic|verbose>',
    interactionPreset: 'spw-interaction|interaction=<calm|tactile|puppet|screenshot>',
    logNamespaces: 'spw-log|log=<on|*|namespace[,namespace]>',
    logLevel: 'spw-log-level|log-level=<debug|info|warn|error>',
    moduleAudit: 'spw-module-audit|module-audit=<on|off>',
    moduleDelay: 'spw-module-delay|module-delay=<milliseconds>',
    moduleOnly: 'spw-module-only|module-only=<module[,module]>',
    moduleSkip: 'spw-module-skip|module-skip=<module[,module]>',
    moduleTiming: 'spw-module-timing|module-timing=<module:timing[,module:timing]>',
    moduleVisuals: 'spw-module-visuals|module-visuals=<on|off>',
    paletteResonance: 'spw-palette|palette=<route|craft|software|math>',
    physicsPreset: 'spw-physics|physics=<calm|tactile|puppet|screenshot>',
    runtimeTiming: 'spw-runtime-timing|runtime-timing=<normal|eager|defer|quiet|manual>',
    meaningPreset: 'spw-meaning|meaning=<quiet|readable|inspect|screenshot>',
    viewingPreset: 'spw-view|view=<quiet|readable|inspect|screenshot>',
    tuningAttribute: 'spw-tune-<name>=<value>',
    reflowReason: 'spw-reflow|reflow=<reason>',
    meaningDepth: 'spw-meaning-depth|meaning-depth=<light|rich>',
    designInterpretation: 'spw-design-interpretation|design-interpretation=<value>',
  }),
  queryPresets: Object.freeze({
    quiet: SPW_QUERY_PRESETS.quiet.href,
    readable: SPW_QUERY_PRESETS.readable.href,
    reader: SPW_QUERY_PRESETS.reader.href,
    inspect: SPW_QUERY_PRESETS.inspect.href,
    builder: SPW_QUERY_PRESETS.builder.href,
    screenshot: SPW_QUERY_PRESETS.screenshot.href,
    calm: SPW_QUERY_PRESETS.calm.href,
    tactile: SPW_QUERY_PRESETS.tactile.href,
    puppet: SPW_QUERY_PRESETS.puppet.href,
    css: SPW_QUERY_PRESETS.css.href,
    layout: SPW_QUERY_PRESETS.layout.href,
  }),
  queryAliases: SPW_QUERY_ALIASES,
  queryExtension: Object.freeze({
    aliases: 'parse/apply option: { aliases: { family: ["name", "other-name"] } }',
    presets: 'parse/apply option: { physicsPresets, meaningPresets }',
    handlers: 'parse/apply option: { handlers: [(entry) => boolean] }',
  }),
  presets: Object.freeze({
    physics: SPW_PHYSICS_PRESETS,
    meaning: SPW_MEANING_PRESETS,
  }),
  reflowReasons: SPW_REFLOW_REASONS,
  layoutTropes: SPW_LAYOUT_TROPES,
  relationships: SPW_LOG_RELATIONSHIPS,
  consoleApi: 'window.spwCompose',
});

const normalizeReflowReason = (reason = SPW_REFLOW_REASONS.INTERACTION) => {
  const normalized = normalizeToken(reason);
  return Object.values(SPW_REFLOW_REASONS).includes(normalized)
    ? normalized
    : SPW_REFLOW_REASONS.INTERACTION;
};

const applyPresetBundle = (disposition, preset, bundleMap, familyKey, tuningKey) => {
  const bundle = bundleMap[preset];
  if (!bundle) return false;

  Object.assign(disposition.cssVars, bundle.cssVars);
  Object.assign(disposition.data, bundle.data);
  disposition.presets[familyKey] = preset;
  disposition.tuning[tuningKey] = preset;
  return true;
};

const readDebugTokens = (value = '') => (
  String(value)
    .split(/[,\s]+/)
    .map(normalizeToken)
    .filter(Boolean)
);

const normalizeBooleanSwitch = (value = '') => {
  const normalized = normalizeToken(value);
  if (['1', 'true', 'on', 'yes', '*'].includes(normalized)) return 'on';
  if (['0', 'false', 'off', 'no', 'none'].includes(normalized)) return 'off';
  return '';
};

const normalizeRuntimeTiming = (value = '') => {
  const normalized = normalizeToken(value);
  return ['normal', 'eager', 'defer', 'quiet', 'manual'].includes(normalized) ? normalized : '';
};

const normalizeModuleTimingList = (value = '') => (
  String(value || '')
    .split(/[\s,]+/)
    .map((item) => {
      const [rawModule, rawTiming] = item.split(':');
      const moduleId = normalizeToken(rawModule);
      const timing = normalizeToken(rawTiming);
      if (!moduleId || !['immediate', 'visible', 'idle', 'interaction', 'region'].includes(timing)) return '';
      return `${moduleId}:${timing}`;
    })
    .filter(Boolean)
    .join(' ')
);

const normalizeModuleTokenList = (value = '') => (
  String(value || '')
    .split(/[\s,]+/)
    .map(normalizeToken)
    .filter(Boolean)
    .join(' ')
);

const freezeAliasSets = (aliases = {}) => Object.fromEntries(
  Object.entries(aliases).map(([family, names]) => [
    family,
    new Set(Array.isArray(names) || names instanceof Set ? [...names].map(String) : []),
  ])
);

const mergeAliasFamily = (defaults = [], additions = []) => [
  ...new Set([
    ...(Array.isArray(defaults) ? defaults : [...defaults || []]),
    ...(Array.isArray(additions) || additions instanceof Set ? [...additions] : []),
  ].map(String).filter(Boolean)),
];

export function createSpwQueryContract(options = {}) {
  const aliasEntries = Object.fromEntries(
    Object.entries(SPW_QUERY_ALIASES).map(([family, names]) => [
      family,
      mergeAliasFamily(names, options.aliases?.[family]),
    ])
  );

  Object.entries(options.aliases || {}).forEach(([family, names]) => {
    if (!aliasEntries[family]) aliasEntries[family] = mergeAliasFamily([], names);
  });

  return Object.freeze({
    aliases: freezeAliasSets(aliasEntries),
    physicsPresets: options.physicsPresets || SPW_PHYSICS_PRESETS,
    meaningPresets: options.meaningPresets || SPW_MEANING_PRESETS,
    handlers: Object.freeze([...(options.handlers || [])].filter((handler) => typeof handler === 'function')),
  });
}

export const SPW_QUERY_CONTRACT = createSpwQueryContract();

const writeTuningDatasetValue = (element, key, value) => {
  const normalizedKey = toDatasetKey(`${TUNING_PREFIX}-${normalizeToken(key)}`);
  if (!normalizedKey || value === undefined || value === null || value === '') {
    delete element.dataset[normalizedKey];
    return;
  }
  element.dataset[normalizedKey] = String(value);
};

export function markInstrumented(target, source = DEFAULT_NAMESPACE, details = {}) {
  const element = resolveTarget(target, details.root);
  if (!element) return null;

  const sourceToken = normalizeToken(source) || DEFAULT_NAMESPACE;
  const additions = [sourceToken, ...(details.tags || [])];
  element.dataset.spwInstrumentation = mergeTokenList(element.dataset.spwInstrumentation, additions);
  element.dataset.spwDebugSource ||= sourceToken;

  if (details.state) {
    element.dataset.spwConsoleState = normalizeToken(details.state);
  }

  return element;
}

export function writeTuningAttributes(target, entries = {}, options = {}) {
  const element = resolveTarget(target, options.root);
  if (!element) return null;

  Object.entries(entries).forEach(([key, value]) => {
    writeTuningDatasetValue(element, key, value);
  });

  if (options.source) {
    markInstrumented(element, options.source, { tags: ['tuning'] });
  }

  return element;
}

export function markReflowReason(target, reason = SPW_REFLOW_REASONS.INTERACTION, details = {}) {
  const element = resolveTarget(target, details.root);
  if (!element) return null;

  element.dataset.spwReflowReason = normalizeReflowReason(reason);

  if (details.scope) {
    element.dataset.spwReflowScope = normalizeToken(details.scope);
  }

  if (details.cost) {
    element.dataset.spwReflowCost = normalizeToken(details.cost);
  }

  if (details.tuning) {
    writeTuningAttributes(element, details.tuning, { source: details.source });
  }

  markInstrumented(element, details.source || 'reflow', { tags: ['reflow', reason] });
  return element;
}

/* Mark a deliberate, expressive layout shift or re-gestalting as a named "trope".
   This is the key primitive for treating certain layout changes as design language
   rather than instability — directly supporting the "fidget toys for game devs"
   and "magic manuscript layering for authors" vision. The resulting data attrs
   + logger + bus events make the effect fully inspectable and tunable. */
export function markLayoutTrope(target, trope, details = {}) {
  const element = resolveTarget(target, details.root);
  if (!element) return null;

  const normalizedTrope = normalizeLayoutTrope(trope);
  if (normalizedTrope) {
    element.dataset.spwLayoutTrope = normalizedTrope;
  }

  // Also surface through the existing reflow system for unified observation
  const reason = details.reason || SPW_REFLOW_REASONS.LAYOUT;
  markReflowReason(element, reason, {
    ...details,
    scope: details.scope || 'trope',
    tuning: {
      ...(details.tuning || {}),
      layoutTrope: normalizedTrope || trope,
    },
  });

  // Rich instrumentation tag
  markInstrumented(element, details.source || 'layout-trope', {
    tags: ['layout-trope', normalizedTrope || trope],
    state: normalizedTrope || trope,
  });

  return element;
}

export function parseSpwQueryDisposition(search = globalThis.location?.search || '', options = {}) {
  const normalizedSearch = normalizeQuerySearch(search);
  const params = new URLSearchParams(String(normalizedSearch || '').replace(/^\?/, ''));
  const queryContract = options.queryContract || createSpwQueryContract(options);
  const disposition = {
    cssVars: {},
    data: {},
    query: {
      active: false,
      keys: [],
      presets: {},
    },
    presets: {},
    reflowReason: '',
    tuning: {},
  };

  for (const [key, value] of params.entries()) {
    disposition.query.active = true;
    disposition.query.keys.push(normalizeToken(key) || key);
    const entry = {
      key,
      value,
      disposition,
      contract: queryContract,
      helpers: {
        normalizeToken,
        toCssCustomProperty,
        toDatasetKey,
        normalizeReflowReason,
      },
    };
    if (queryContract.handlers.some((handler) => handler(entry))) continue;

    if (key.startsWith(QUERY_PREFIXES.cssVar)) {
      const property = toCssCustomProperty(key.slice(QUERY_PREFIXES.cssVar.length));
      if (property) disposition.cssVars[property] = value;
      continue;
    }

    if (key.startsWith(QUERY_PREFIXES.color)) {
      const token = normalizeToken(key.slice(QUERY_PREFIXES.color.length));
      if (token) disposition.cssVars[`--${token}-color`] = value;
      continue;
    }

    if (key.startsWith(QUERY_PREFIXES.data)) {
      const dataKey = toDatasetKey(`spw-${normalizeToken(key.slice(QUERY_PREFIXES.data.length))}`);
      if (dataKey) disposition.data[dataKey] = value;
      continue;
    }

    if (key.startsWith(QUERY_PREFIXES.tune)) {
      const tuneKey = normalizeToken(key.slice(QUERY_PREFIXES.tune.length));
      if (tuneKey) disposition.tuning[tuneKey] = value;
      continue;
    }

    if (queryContract.aliases.reflow?.has(key)) {
      disposition.reflowReason = normalizeReflowReason(value);
      continue;
    }

    if (queryContract.aliases.runtimeTiming?.has(key)) {
      const timing = normalizeRuntimeTiming(value);
      if (timing) {
        disposition.data.spwRuntimeTiming = timing;
        disposition.tuning.runtimeTiming = timing;
      }
      continue;
    }

    if (queryContract.aliases.moduleDelay?.has(key)) {
      const delay = Number.parseInt(value, 10);
      if (Number.isFinite(delay) && delay > 0) {
        disposition.data.spwModuleDelay = String(Math.min(delay, 5000));
        disposition.tuning.moduleDelay = disposition.data.spwModuleDelay;
      }
      continue;
    }

    if (queryContract.aliases.moduleAudit?.has(key)) {
      const enabled = normalizeBooleanSwitch(value);
      if (enabled) {
        disposition.data.spwModuleAudit = enabled === 'on' ? 'on' : '';
        disposition.tuning.moduleAudit = enabled;
      }
      continue;
    }

    if (queryContract.aliases.moduleVisuals?.has(key)) {
      const enabled = normalizeBooleanSwitch(value);
      if (enabled) {
        disposition.data.spwModuleVisuals = enabled === 'on' ? 'on' : '';
        disposition.tuning.moduleVisuals = enabled;
      }
      continue;
    }

    if (queryContract.aliases.moduleOnly?.has(key)) {
      const modules = normalizeModuleTokenList(value);
      if (modules) {
        disposition.data.spwModuleOnly = modules;
        disposition.tuning.moduleOnly = modules.replace(/\s+/g, ',');
      }
      continue;
    }

    if (queryContract.aliases.moduleSkip?.has(key)) {
      const modules = normalizeModuleTokenList(value);
      if (modules) {
        disposition.data.spwModuleSkip = modules;
        disposition.tuning.moduleSkip = modules.replace(/\s+/g, ',');
      }
      continue;
    }

    if (queryContract.aliases.moduleTiming?.has(key)) {
      const timingList = normalizeModuleTimingList(value);
      if (timingList) {
        disposition.data.spwModuleTiming = timingList;
        disposition.tuning.moduleTiming = timingList.replace(/\s+/g, ',');
      }
      continue;
    }

    if (key === 'meaning-depth' || key === 'spw-meaning-depth') {
      const depth = normalizeToken(value);
      if (['light', 'rich'].includes(depth)) {
        disposition.data.spwMeaningDepth = depth;
      }
      continue;
    }

    if (key === 'design-interpretation' || key === 'spw-design-interpretation') {
      disposition.data.spwDesignInterpretation = normalizeToken(value) || value;
      continue;
    }

    if (queryContract.aliases.debug?.has(key)) {
      const debugTokens = readDebugTokens(value);
      const enabledTokens = debugTokens.filter((token) => token !== 'on' && token !== 'off');
      if (!debugTokens.includes('off')) {
        disposition.data.spwDebugMode = 'on';
      }
      if (enabledTokens.length) {
        disposition.data.spwDebug = enabledTokens.join(' ');
        disposition.tuning.debug = enabledTokens.join(',');
      } else if (debugTokens.includes('on')) {
        disposition.data.spwDebug = 'css';
        disposition.tuning.debug = 'css';
      }
      continue;
    }

    if (queryContract.aliases.diagnostics?.has(key)) {
      const diagnostics = normalizeToken(value);
      if (['off', 'basic', 'verbose'].includes(diagnostics)) {
        disposition.data.spwBusDiagnostics = diagnostics;
        disposition.tuning.diagnostics = diagnostics;
      }
      continue;
    }

    if (queryContract.aliases.palette?.has(key)) {
      disposition.data.spwPaletteResonance = normalizeToken(value);
      disposition.tuning.palette = normalizeToken(value);
      continue;
    }

    if (queryContract.aliases.physics?.has(key)) {
      const preset = normalizeToken(value);
      if (applyPresetBundle(disposition, preset, queryContract.physicsPresets, 'physics', 'physics')) {
        disposition.query.presets.physics = preset;
      }
      continue;
    }

    if (queryContract.aliases.meaning?.has(key)) {
      const preset = normalizeToken(value);
      if (applyPresetBundle(disposition, preset, queryContract.meaningPresets, 'meaning', 'meaning')) {
        disposition.query.presets.meaning = preset;
      }
      continue;
    }

    if (queryContract.aliases.view?.has(key)) {
      const preset = normalizeToken(value);
      if (applyPresetBundle(disposition, preset, queryContract.meaningPresets, 'meaning', 'view')) {
        disposition.query.presets.view = preset;
      }
      continue;
    }

    if (queryContract.aliases.interaction?.has(key)) {
      const preset = normalizeToken(value);
      if (applyPresetBundle(disposition, preset, queryContract.physicsPresets, 'physics', 'interaction')) {
        disposition.query.presets.interaction = preset;
      }
      continue;
    }

    if (queryContract.aliases.condense?.has(key)) {
      const tier = normalizeToken(value);
      if (['brief', 'card', 'print', 'full'].includes(tier)) {
        disposition.data.spwCondenseTier = tier;
        disposition.tuning.condense = tier;
      }
      continue;
    }

    if (queryContract.aliases.precipitate?.has(key)) {
      const mode = normalizeToken(value);
      if (['screenshot', 'card', 'condensed', 'print'].includes(mode)) {
        disposition.data.spwPrecipitationMode = mode;
        disposition.tuning.precipitate = mode;
      }
      continue;
    }

    if (queryContract.aliases.pack?.has(key)) {
      const pack = normalizeToken(value);
      if (['compact', 'balanced', 'roomy'].includes(pack)) {
        disposition.data.spwPackingState = pack;
        disposition.tuning.pack = pack;
      }
      continue;
    }

    if (queryContract.aliases.screenshot?.has(key)) {
      const enabled = normalizeBooleanSwitch(value) || value === '1';
      if (enabled) {
        disposition.data.spwPrintReady = 'true';
        disposition.data.spwPrecipitationMode = 'screenshot';
        disposition.tuning.screenshot = 'on';
      }
      continue;
    }

    if (queryContract.aliases.log?.has(key)) {
      disposition.data.spwLog = value;
      disposition.tuning.log = value;
      continue;
    }

    if (queryContract.aliases.logLevel?.has(key)) {
      disposition.data.spwLogLevel = normalizeToken(value);
      disposition.tuning.logLevel = normalizeToken(value);
    }
  }

  disposition.query.keys = [...new Set(disposition.query.keys)].sort();
  return disposition;
}

export function applySpwQueryDisposition(target = globalThis.document?.documentElement, options = {}) {
  const element = resolveTarget(target, options.root);
  if (!element) return null;

  const disposition = parseSpwQueryDisposition(options.search, options);

  Object.entries(disposition.cssVars).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });

  Object.entries(disposition.data).forEach(([key, value]) => {
    if (value === '') delete element.dataset[key];
    else element.dataset[key] = value;
  });

  if (disposition.query.active) {
    element.dataset.spwQueryActive = 'true';
    element.dataset.spwQueryKeys = disposition.query.keys.join(' ');
    const presetTokens = Object.entries(disposition.query.presets)
      .map(([family, preset]) => `${family}:${preset}`)
      .join(' ');
    if (presetTokens) element.dataset.spwQueryPresets = presetTokens;
    else delete element.dataset.spwQueryPresets;
  } else {
    delete element.dataset.spwQueryActive;
    delete element.dataset.spwQueryKeys;
    delete element.dataset.spwQueryPresets;
  }

  if (Object.keys(disposition.tuning).length) {
    writeTuningAttributes(element, disposition.tuning, { source: options.source || 'query' });
  }

  if (disposition.reflowReason) {
    markReflowReason(element, disposition.reflowReason, {
      source: options.source || 'query',
      scope: options.scope || 'document',
      tuning: disposition.tuning,
    });
  } else if (Object.keys(disposition.cssVars).length || Object.keys(disposition.data).length) {
    markInstrumented(element, options.source || 'query', { tags: ['query-disposition'] });
  }

  return disposition;
}

export function snapshotSpwQueryState(target = globalThis.document?.documentElement) {
  const element = resolveTarget(target);
  const dataset = element?.dataset || {};
  return {
    active: dataset.spwQueryActive === 'true',
    keys: String(dataset.spwQueryKeys || '').split(/\s+/).filter(Boolean),
    presets: String(dataset.spwQueryPresets || '').split(/\s+/).filter(Boolean),
    runtimeTiming: dataset.spwRuntimeTiming || null,
    moduleAudit: dataset.spwModuleAudit || null,
    moduleVisuals: dataset.spwModuleVisuals || null,
    moduleDelay: dataset.spwModuleDelay || null,
    moduleOnly: dataset.spwModuleOnly || null,
    moduleSkip: dataset.spwModuleSkip || null,
    moduleTiming: dataset.spwModuleTiming || null,
    tuning: Object.fromEntries(
      Object.entries(dataset)
        .filter(([key]) => key.startsWith(TUNING_PREFIX))
        .sort(([left], [right]) => left.localeCompare(right))
    ),
  };
}

export function snapshotInstrumentationTarget(target, options = {}) {
  const element = resolveTarget(target, options.root);
  if (!element) return null;
  const dataset = element.dataset || {};

  const selector = element.id
    ? `#${element.id}`
    : dataset.spwInspect
      ? `[data-spw-inspect="${dataset.spwInspect}"]`
      : element.matches?.(DEFAULT_TARGET_SELECTOR)
        ? DEFAULT_TARGET_SELECTOR
        : element.tagName.toLowerCase();

  const cssTokens = Object.fromEntries(
    (options.tokens || [])
      .map((token) => [token, globalThis.getComputedStyle?.(element).getPropertyValue(token).trim()])
      .filter(([, value]) => value)
  );

  return {
    selector,
    tag: element.tagName.toLowerCase(),
    id: element.id || '',
    classes: [...element.classList],
    dataset: readSpwDataset(element),
    cssTokens,
    tuning: Object.fromEntries(
      Object.entries(dataset)
        .filter(([key]) => key.startsWith(TUNING_PREFIX))
        .sort(([left], [right]) => left.localeCompare(right))
    ),
    text: options.includeText ? element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 180) || '' : '',
  };
}

export function createSpwLogger(namespace = DEFAULT_NAMESPACE, options = {}) {
  const normalizedNamespace = normalizeToken(namespace) || DEFAULT_NAMESPACE;
  const label = `[${normalizedNamespace}]`;
  const enabled = (level) => options.enabled ?? shouldLogByDefault(normalizedNamespace, level);
  const writer = options.console || globalThis.window?.console || globalThis.console;
  const profile = Object.freeze({
    namespace: normalizedNamespace,
    role: normalizeToken(options.role || 'script'),
    metaphor: normalizeToken(options.metaphor || 'spell'),
    owns: options.owns || '',
    listensFor: options.listensFor || '',
    writes: options.writes || '',
  });

  const write = (level, message, detail, relation = SPW_LOG_RELATIONSHIPS.GESTURE) => {
    if (!enabled(level)) return null;
    const method = typeof writer?.[level] === 'function' ? level : 'log';
    const summary = describeLogDetail(detail);
    const record = {
      at: Math.round(globalThis.performance?.now?.() || Date.now()),
      namespace: normalizedNamespace,
      relation: normalizeToken(relation),
      role: profile.role,
      metaphor: profile.metaphor,
      message,
      summary,
      detail,
    };
    rememberBrowserConsoleRecord({ level, ...record });
    writer?.[method]?.(summary ? `${label} ${message} | ${summary}` : `${label} ${message}`, record);
    return { level, ...record };
  };

  return Object.freeze({
    namespace: normalizedNamespace,
    profile,
    child: (childNamespace, childOptions = {}) => createSpwLogger(`${normalizedNamespace}:${normalizeToken(childNamespace)}`, {
      ...options,
      ...childOptions,
    }),
    debug: (message, detail, relation) => write('debug', message, detail, relation),
    describe: () => write('info', 'logger relationship', profile, SPW_LOG_RELATIONSHIPS.CONTRACT),
    error: (message, detail, relation) => write('error', message, detail, relation),
    info: (message, detail, relation) => write('info', message, detail, relation),
    mark: (target, details = {}) => markInstrumented(target, namespace, details),
    reflow: (target, reason, details = {}) => markReflowReason(target, reason, { ...details, source: namespace }),
    snapshot: (target, snapshotOptions = {}) => snapshotInstrumentationTarget(target, snapshotOptions),
    trace: (message, target, snapshotOptions = {}) => write(
      'debug',
      message,
      snapshotInstrumentationTarget(target, snapshotOptions),
      SPW_LOG_RELATIONSHIPS.GESTURE
    ),
    tune: (target, entries = {}) => writeTuningAttributes(target, entries, { source: namespace }),
    warn: (message, detail, relation) => write('warn', message, detail, relation),
    query: (target, options = {}) => applySpwQueryDisposition(target, { ...options, source: namespace }),
  });
}

const CONSOLE_HELP_TOPICS = Object.freeze({
  modules: Object.freeze({
    title: 'Runtime modules',
    lines: Object.freeze([
      '__SPW_SITE__.listModules()',
      '__SPW_SITE__.snapshotModules()',
      '__SPW_SITE__.auditModules()',
      'spwCompose.controls.modules.mount("topic-discovery")',
      'spwCompose.controls.modules.discovery()',
      '?spw-module-audit=on',
      '?spw-module-only=topic-discovery',
    ]),
  }),
  logs: Object.freeze({
    title: 'Log tuning',
    lines: Object.freeze([
      '?log=layout-shift,site-runtime&log-level=debug',
      '?log=*&log-level=info',
      'spwCompose.logs()',
      'spwCompose.logs("layout-shift")',
      'document.documentElement.dataset.spwLog = "on"',
      'document.documentElement.dataset.spwLogLevel = "debug"',
    ]),
  }),
  layout: Object.freeze({
    title: 'Layout / packing / reflow QA',
    lines: Object.freeze([
      '?debug=layout&log=layout-shift&log-level=debug',
      '?qa=screenshot-qa&debug=qa,layout,agent',
      '__SPW_SITE__.layoutQa.snapshot()',
      '__SPW_SITE__.layoutQa.summary()',
      '__SPW_SITE__.layoutQa.page()',
      '__SPW_SITE__.layoutQa.packing()',
      'spwCompose.qa.layout()',
      'spwCompose.qa.layoutSummary()',
      'spwCompose.logs("layout-shift")',
    ]),
  }),
  inspect: Object.freeze({
    title: 'Inspection',
    lines: Object.freeze([
      'spwCompose.snapshot()',
      'spwCompose.inspect("[data-spw-feature]")',
      'spwCompose.controls.composition.snapshot()',
      'spwCompose.controls.pageState.snapshot()',
      'spwCompose.controls.pageHooks.list()',
      'spwCompose.mark(document.querySelector("main"))',
    ]),
  }),
});

export function readConsoleLogBuffer(limit) {
  try {
    const buffer = globalThis.__spwLogs || [];
    const size = Number.isFinite(limit) ? Math.max(1, limit) : buffer.length;
    return buffer.slice(-size).map((record) => ({ ...record }));
  } catch {
    return [];
  }
}

function filterConsoleLogs(records, filter) {
  if (!filter) return records;
  const token = normalizeToken(String(filter));
  return records.filter((record) => (
    record.namespace?.includes(token)
    || record.message?.includes(token)
    || record.relation?.includes(token)
    || record.level === token
  ));
}

function shouldAnnounceConsoleSurface(globalObject = globalThis) {
  const root = globalObject.document?.documentElement;
  const hostname = String(globalObject.location?.hostname || '').toLowerCase();
  const isLocal = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'].includes(hostname)
    || hostname.endsWith('.localhost');
  const debugOn = root?.dataset?.spwDebugMode === 'on';
  const logTokens = readLogTokens();
  const params = new URLSearchParams(String(globalObject.location?.search || '').replace(/^\?/, ''));
  const hasDebugQuery = [
    'debug',
    'spw-debug',
    'log',
    'spw-log',
    'diagnostics',
    'spw-diagnostics',
    'qa',
    'spw-qa',
    'runtime-timing',
    'spw-runtime-timing',
    'module-audit',
    'spw-module-audit',
    'module-only',
    'spw-module-only',
    'module-skip',
    'spw-module-skip',
    'module-timing',
    'spw-module-timing',
  ]
    .some((key) => params.get(key));

  return isLocal || debugOn || logTokens.length > 0 || hasDebugQuery;
}

function buildConsoleHelp(globalObject, { controls = {}, debugPresets = {} } = {}) {
  const siteApi = globalObject.__SPW_SITE__ || {};
  const overview = Object.freeze({
    title: 'Spw browser console',
    entrypoints: Object.freeze({
      spwCompose: 'window.spwCompose',
      site: 'window.__SPW_SITE__',
      textualConsole: 'window.spwConsole',
      logBuffer: 'window.spwCompose.logs()',
    }),
    quickStart: Object.freeze([
      'spwCompose.help()',
      'spwCompose.snapshot()',
      '__SPW_SITE__.listModules()',
      'spwCompose.controls.pageState.snapshot()',
    ]),
    topics: Object.freeze(['modules', 'logs', 'inspect', 'query']),
    site: Object.freeze({
      listModules: typeof siteApi.listModules === 'function',
      snapshotModules: typeof siteApi.snapshotModules === 'function',
      discoverRuntimeLoad: typeof siteApi.discoverRuntimeLoad === 'function',
    }),
    controls: Object.freeze(Object.keys(controls).sort()),
    debugPresets,
    contract: SPW_INSTRUMENTATION_CONTRACT,
  });

  const topics = {
    ...CONSOLE_HELP_TOPICS,
    query: Object.freeze({
      title: 'Query presets',
      lines: Object.freeze(
        Object.entries(debugPresets).map(([name, href]) => `${name}: ${href}`),
      ),
    }),
  };

  return Object.freeze({ overview, topics });
}

function printConsoleHelp(writer, help, topic) {
  if (!writer || typeof writer.groupCollapsed !== 'function') return help;

  const normalizedTopic = normalizeToken(topic || '');
  const printLines = (title, lines = []) => {
    if (!lines.length) return;
    writer.groupCollapsed(title);
    lines.forEach((line) => writer.log(line));
    writer.groupEnd();
  };

  if (!normalizedTopic || normalizedTopic === 'overview') {
    writer.groupCollapsed('%cSpw console help', 'font-weight:700;color:#0f766e');
    writer.log('Entrypoints:', help.overview.entrypoints);
    printLines('Quick start', help.overview.quickStart);
    printLines('Topics', help.overview.topics.map((name) => `spwCompose.help("${name}")`));
    if (help.overview.controls.length) {
      printLines('Controls namespaces', help.overview.controls.map((name) => `spwCompose.controls.${name}`));
    }
    writer.groupEnd();
    return help;
  }

  const section = help.topics[normalizedTopic];
  if (!section) {
    writer.warn(`[spw-compose] unknown help topic "${topic}". Try spwCompose.help() for topics.`);
    return help;
  }

  printLines(section.title, section.lines);
  return help;
}

function buildConsoleSnapshot(globalObject, controls = {}) {
  const html = globalObject.document?.documentElement;
  const body = globalObject.document?.body;
  const siteApi = globalObject.__SPW_SITE__ || {};

  return Object.freeze({
    route: globalObject.location?.pathname || '/',
    surface: body?.dataset?.spwSurface || null,
    pageState: controls.pageState?.snapshot?.() || null,
    modules: controls.modules?.records?.() || siteApi.snapshotModules?.() || null,
    modulePolicy: controls.modules?.policy?.() || null,
    query: snapshotSpwQueryState(html),
    bus: siteApi.bus?.getDiagnostics?.() || siteApi.bus?.recent?.(4) || null,
    runtimePosture: html?.dataset?.spwRuntimePosture || null,
    debugMode: html?.dataset?.spwDebugMode || null,
    logNamespaces: html?.dataset?.spwLog || null,
    logLevel: html?.dataset?.spwLogLevel || null,
    textualConsole: globalObject.spwConsole?.getDiagnostics?.() || null,
    recentLogs: readConsoleLogBuffer(8),
  });
}

export function announceSpwConsoleSurface(globalObject = globalThis, api, options = {}) {
  if (!shouldAnnounceConsoleSurface(globalObject)) return false;

  const writer = globalObject.console;
  const route = globalObject.location?.pathname || '/';
  if (!writer?.groupCollapsed) return false;

  writer.groupCollapsed(
    `%cSpw%c console ready on ${route}`,
    'font-weight:700;color:#0f766e',
    'font-weight:400;color:inherit',
  );
  writer.log('Type %cspwCompose.help()%c for commands.', 'font-family:monospace', '');
  writer.log('Quick: %cspwCompose.snapshot()%c · %c__SPW_SITE__.listModules()%c · %c__SPW_SITE__.layoutQa.summary()%c',
    'font-family:monospace', '',
    'font-family:monospace', '',
    'font-family:monospace', '');
  if (options.timings) writer.log('Boot timing:', options.timings);
  if (typeof api?.help === 'function') writer.log('Topics: spwCompose.help("modules" | "logs" | "layout" | "inspect" | "query")');
  writer.groupEnd();
  return true;
}

export function installSpwCompositionConsole(globalObject = globalThis, options = {}) {
  const logger = createSpwLogger(options.namespace || 'spw-compose', options);
  const apiName = options.name || 'spwCompose';
  const existing = globalObject[apiName] || {};
  const controls = Object.freeze({ ...(options.controls || {}) });
  const queryPresets = Object.freeze({
    ...SPW_QUERY_PRESETS,
  });
  const debugPresets = Object.freeze({
    layout: queryPresets.layout?.href || '?debug=layout&log=layout-shift&log-level=debug',
    layoutInspect: '?view=inspect&debug=layout&diagnostics=basic&log=layout-shift&log-level=debug&meaning=inspect',
    css: queryPresets.css?.href || '?debug=css&log-level=debug',
    inspect: queryPresets.inspect?.href,
    screenshot: queryPresets.screenshot?.href,
    agentQa: '?debug=qa,agent,layout&qa=agent&log=layout-shift,observation-beats&log-level=debug',
    beats: '?debug=beat,qa&log=observation-beats&log-level=debug',
    // Screenshot QA Mode — rich semantic visibility + beat-based observation + artifact export
    'screenshot-qa': '?qa=screenshot-qa&debug=qa,layout,agent&log=layout-shift,observation-beats,cauldron&log-level=debug&meaning=inspect&physics=screenshot',
    readable: queryPresets.readable?.href,
    calm: queryPresets.calm?.href,
    puppet: queryPresets.puppet?.href,
  });
  const helpContext = { controls, debugPresets };

  const api = Object.freeze({
    ...existing,
    contract: options.contract || null,
    controls,
    inspect: (target, inspectOptions = {}) => snapshotInstrumentationTarget(target, inspectOptions),
    queryPresets,
    debugPresets,
    log: logger,
    logger: (namespace, loggerOptions = {}) => createSpwLogger(namespace, loggerOptions),
    mark: (target, details = {}) => markInstrumented(target, options.namespace || 'spw-compose', details),
    query: (target = globalObject.document?.documentElement, queryOptions = {}) => applySpwQueryDisposition(target, { ...queryOptions, source: options.namespace || 'spw-compose' }),
    queryState: (target = globalObject.document?.documentElement) => snapshotSpwQueryState(target),
    reflow: (target, reason, details = {}) => markReflowReason(target, reason, { ...details, source: options.namespace || 'spw-compose' }),
    layoutTrope: (target, trope, details = {}) => markLayoutTrope(target, trope, { ...details, source: options.namespace || 'spw-compose' }),
    tune: (target, entries = {}) => writeTuningAttributes(target, entries, { source: options.namespace || 'spw-compose' }),
    help: (topic, helpOptions = {}) => {
      const help = buildConsoleHelp(globalObject, helpContext);
      if (helpOptions.silent) return help;
      return printConsoleHelp(globalObject.console, help, topic);
    },
    logs: (filter, limit) => filterConsoleLogs(readConsoleLogBuffer(limit), filter),
    snapshot: () => buildConsoleSnapshot(globalObject, controls),

    // Phase 3 agent/QA surface (gated behind ?debug=qa|agent or ?qa=screenshot-qa)
    beats: {
      create: (duration, opts) => {
        // Lazy import to keep surface small when not in QA mode
        return import('/public/js/runtime/observation-beats.js').then(m => m.createBeatWindow(duration, opts));
      },
      startQA: (opts) => import('/public/js/runtime/observation-beats.js').then(m => m.startQABeat(opts)),
      captureArtifact: (extra) => import('/public/js/runtime/observation-beats.js').then(m => m.captureCurrentBeatArtifact(extra)),
      getActive: () => import('/public/js/runtime/observation-beats.js').then(m => m.getActiveBeats()),
    },
    qa: {
      enterScreenshotMode: () => applySpwQueryDisposition(globalObject.document?.documentElement, { search: '?qa=screenshot-qa' }),
      enterLayoutMode: () => applySpwQueryDisposition(globalObject.document?.documentElement, {
        search: debugPresets.layout,
      }),
      enterAgentMode: () => applySpwQueryDisposition(globalObject.document?.documentElement, {
        search: debugPresets.agentQa,
      }),
      capture: (extra) => import('/public/js/runtime/observation-beats.js').then(m => m.captureCurrentBeatArtifact(extra)),
      /** Packing + reflow + page sizing + look-feel checklist (lazy). */
      layout: (options = {}) => import('/public/js/runtime/layout-qa.js').then((m) => m.snapshotLayoutQa(options)),
      layoutSummary: (options = {}) => import('/public/js/runtime/layout-qa.js').then(async (m) => {
        const report = await m.snapshotLayoutQa(options);
        return m.summarizeLayoutQa(report);
      }),
      layoutRecipes: () => import('/public/js/runtime/layout-qa.js').then((m) => m.layoutQaRecipes()),
      posture: () => import('/public/js/runtime/debug-qa-posture.js').then((m) => m.describeDebugQaPosture()),
      applyPosture: () => import('/public/js/runtime/debug-qa-posture.js').then((m) => {
        const posture = m.applyDebugQaPostureToRoot();
        return m.describeDebugQaPosture(posture);
      }),
    },
  });

  globalObject[apiName] = api;
  globalObject.spwDebugPresets = debugPresets;
  return api;
}
