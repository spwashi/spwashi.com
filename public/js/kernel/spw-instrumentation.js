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
    logNamespaces: 'spw-log=<on|*|namespace[,namespace]>',
    logLevel: 'spw-log-level=<debug|info|warn|error>',
    paletteResonance: 'spw-palette=<route|craft|software|math>',
    tuningAttribute: 'spw-tune-<name>=<value>',
    reflowReason: 'spw-reflow=<reason>',
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

export function parseSpwQueryDisposition(search = globalThis.location?.search || '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const disposition = {
    cssVars: {},
    data: {},
    reflowReason: '',
    tuning: {},
  };

  for (const [key, value] of params.entries()) {
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

    if (key === 'spw-reflow') {
      disposition.reflowReason = normalizeReflowReason(value);
      continue;
    }

    if (key === 'spw-palette') {
      disposition.data.spwPaletteResonance = normalizeToken(value);
      disposition.tuning.palette = normalizeToken(value);
      continue;
    }

    if (key === 'spw-log') {
      disposition.data.spwLog = value;
      disposition.tuning.log = value;
      continue;
    }

    if (key === 'spw-log-level') {
      disposition.data.spwLogLevel = normalizeToken(value);
      disposition.tuning.logLevel = normalizeToken(value);
    }
  }

  return disposition;
}

export function applySpwQueryDisposition(target = globalThis.document?.documentElement, options = {}) {
  const element = resolveTarget(target, options.root);
  if (!element) return null;

  const disposition = parseSpwQueryDisposition(options.search);

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

  const api = Object.freeze({
    ...existing,
    contract: options.contract || null,
    inspect: (target, inspectOptions = {}) => snapshotInstrumentationTarget(target, inspectOptions),
    log: logger,
    logger: (namespace, loggerOptions = {}) => createSpwLogger(namespace, loggerOptions),
    mark: (target, details = {}) => markInstrumented(target, options.namespace || 'spw-compose', details),
    query: (target = globalObject.document?.documentElement, queryOptions = {}) => applySpwQueryDisposition(target, { ...queryOptions, source: options.namespace || 'spw-compose' }),
    reflow: (target, reason, details = {}) => markReflowReason(target, reason, { ...details, source: options.namespace || 'spw-compose' }),
    tune: (target, entries = {}) => writeTuningAttributes(target, entries, { source: options.namespace || 'spw-compose' }),
  });

  globalObject[apiName] = api;
  return api;
}
