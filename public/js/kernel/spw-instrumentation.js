const DEFAULT_NAMESPACE = 'spw';
const DEFAULT_TARGET_SELECTOR = '[data-spw-kind], [data-spw-role], [data-spw-feature], [data-spw-module], .site-frame, .frame-panel, .frame-card';
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
  palette: Object.freeze(['spw-palette', 'palette']),
  physics: Object.freeze(['spw-physics', 'physics']),
  reflow: Object.freeze(['spw-reflow', 'reflow']),
  view: Object.freeze(['spw-view', 'view']),
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
    paletteResonance: 'spw-palette|palette=<route|craft|software|math>',
    physicsPreset: 'spw-physics|physics=<calm|tactile|puppet|screenshot>',
    meaningPreset: 'spw-meaning|meaning=<quiet|readable|inspect|screenshot>',
    viewingPreset: 'spw-view|view=<quiet|readable|inspect|screenshot>',
    tuningAttribute: 'spw-tune-<name>=<value>',
    reflowReason: 'spw-reflow|reflow=<reason>',
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
  relationships: SPW_LOG_RELATIONSHIPS,
  consoleApi: 'window.spwCompose',
});

const normalizeReflowReason = (reason = SPW_REFLOW_REASONS.INTERACTION) => {
  const normalized = normalizeToken(reason);
  return Object.values(SPW_REFLOW_REASONS).includes(normalized)
    ? normalized
    : SPW_REFLOW_REASONS.INTERACTION;
};

const readDebugTokens = (value = '') => (
  String(value)
    .split(/[,\s]+/)
    .map(normalizeToken)
    .filter(Boolean)
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

export function parseSpwQueryDisposition(search = globalThis.location?.search || '', options = {}) {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const queryContract = options.queryContract || createSpwQueryContract(options);
  const disposition = {
    cssVars: {},
    data: {},
    presets: {},
    reflowReason: '',
    tuning: {},
  };

  for (const [key, value] of params.entries()) {
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
      if (queryContract.physicsPresets[preset]) {
        Object.assign(disposition.cssVars, queryContract.physicsPresets[preset].cssVars);
        Object.assign(disposition.data, queryContract.physicsPresets[preset].data);
        disposition.presets.physics = preset;
        disposition.tuning.physics = preset;
      }
      continue;
    }

    if (queryContract.aliases.meaning?.has(key)) {
      const preset = normalizeToken(value);
      if (queryContract.meaningPresets[preset]) {
        Object.assign(disposition.cssVars, queryContract.meaningPresets[preset].cssVars);
        Object.assign(disposition.data, queryContract.meaningPresets[preset].data);
        disposition.presets.meaning = preset;
        disposition.tuning.meaning = preset;
      }
      continue;
    }

    if (queryContract.aliases.view?.has(key)) {
      const preset = normalizeToken(value);
      if (queryContract.meaningPresets[preset]) {
        Object.assign(disposition.cssVars, queryContract.meaningPresets[preset].cssVars);
        Object.assign(disposition.data, queryContract.meaningPresets[preset].data);
        disposition.presets.meaning = preset;
        disposition.tuning.view = preset;
      }
      continue;
    }

    if (queryContract.aliases.interaction?.has(key)) {
      const preset = normalizeToken(value);
      if (queryContract.physicsPresets[preset]) {
        Object.assign(disposition.cssVars, queryContract.physicsPresets[preset].cssVars);
        Object.assign(disposition.data, queryContract.physicsPresets[preset].data);
        disposition.presets.physics = preset;
        disposition.tuning.interaction = preset;
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

export function snapshotInstrumentationTarget(target, options = {}) {
  const element = resolveTarget(target, options.root);
  if (!element) return null;

  const selector = element.id
    ? `#${element.id}`
    : element.dataset.spwInspect
      ? `[data-spw-inspect="${element.dataset.spwInspect}"]`
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
      Object.entries(element.dataset)
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
  const writer = options.console || globalThis.console;
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
    const record = {
      namespace: normalizedNamespace,
      relation: normalizeToken(relation),
      role: profile.role,
      metaphor: profile.metaphor,
      message,
      detail,
    };
    const payload = detail === undefined ? [label, message, record] : [label, message, record];
    writer?.[method]?.(...payload);
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

export function installSpwCompositionConsole(globalObject = globalThis, options = {}) {
  const logger = createSpwLogger(options.namespace || 'spw-compose', options);
  const apiName = options.name || 'spwCompose';
  const existing = globalObject[apiName] || {};
  const queryPresets = Object.freeze({
    ...SPW_QUERY_PRESETS,
  });
  const debugPresets = Object.freeze({
    layout: queryPresets.layout.href,
    css: queryPresets.css.href,
    inspect: queryPresets.inspect.href,
    screenshot: queryPresets.screenshot.href,
    readable: queryPresets.readable.href,
    calm: queryPresets.calm.href,
    puppet: queryPresets.puppet.href,
  });

  const api = Object.freeze({
    ...existing,
    contract: options.contract || null,
    inspect: (target, inspectOptions = {}) => snapshotInstrumentationTarget(target, inspectOptions),
    queryPresets,
    debugPresets,
    log: logger,
    logger: (namespace, loggerOptions = {}) => createSpwLogger(namespace, loggerOptions),
    mark: (target, details = {}) => markInstrumented(target, options.namespace || 'spw-compose', details),
    query: (target = globalObject.document?.documentElement, queryOptions = {}) => applySpwQueryDisposition(target, { ...queryOptions, source: options.namespace || 'spw-compose' }),
    reflow: (target, reason, details = {}) => markReflowReason(target, reason, { ...details, source: options.namespace || 'spw-compose' }),
    tune: (target, entries = {}) => writeTuningAttributes(target, entries, { source: options.namespace || 'spw-compose' }),
  });

  globalObject[apiName] = api;
  globalObject.spwDebugPresets = debugPresets;
  return api;
}
