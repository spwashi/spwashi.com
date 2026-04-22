/**
 * spw-component-semantics.js
 * ---------------------------------------------------------------------------
 * Purpose
 * - Normalize semantic metadata on reusable page components.
 * - Derive lightweight semantic profiles that CSS and JS can use for:
 *   - higher-value interactions
 *   - intuitive configurability
 *   - enhancement routing
 *   - surface inspection
 *
 * Design stance
 * - No decorative DOM injection in production.
 * - No global mutation/resize observers here.
 * - Root-scoped operation only.
 * - Metadata should help other systems decide what to do, not force visible UI.
 *
 * Public API
 * - initSpwComponentSemantics(options)
 * - snapshotComponentSemantics(el, options)
 * - collectSemanticTargets(root)
 * - applySemanticSnapshot(el, snapshot, options)
 *
 * Typical use
 * - normalize route structure after HTML is present
 * - emit semantic snapshot event for other modules
 * - write data-spw-* hints that CSS and JS can read
 */

import { bus } from './spw-bus.js';
import { detectOperator } from './spw-shared.js';

const DEFAULT_SELECTOR = [
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.media-card',
  '.media-focus-card',
  '.software-card',
  '.operator-card',
  '.plan-card',
  '.compare-card',
  '.spec-column',
  '.mode-panel',
  '[data-spw-kind]',
  '[data-spw-role]',
  '[data-spw-slot]',
  '[data-spw-features]',
  '[data-spw-meaning]',
  '[data-spw-inspect]'
].join(', ');

const ROLE_DEFAULTS = Object.freeze({
  orientation: { substrate: 'frame', phrase: 'premise', context: 'reading' },
  routing: { substrate: 'ref', phrase: 'guide', context: 'routing' },
  reference: { substrate: 'ref', phrase: 'guide', context: 'analysis' },
  schema: { substrate: 'object', phrase: 'structure', context: 'analysis' },
  control: { substrate: 'action', phrase: 'instruction', context: 'settings' },
  surface: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  artifact: { substrate: 'surface', phrase: 'artifact', context: 'publishing' },
  probe: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  telemetry: { substrate: 'probe', phrase: 'inquiry', context: 'analysis' },
  status: { substrate: 'baseline', phrase: 'premise', context: 'analysis' },
  registry: { substrate: 'ref', phrase: 'register', context: 'analysis' }
});

const INTERACTION_DEFAULTS = Object.freeze({
  orientation: { emphasis: 'anchored', interactivity: 'ambient', inspectability: 'summary' },
  routing: { emphasis: 'indexed', interactivity: 'navigable', inspectability: 'summary' },
  reference: { emphasis: 'measured', interactivity: 'ambient', inspectability: 'detailed' },
  schema: { emphasis: 'structured', interactivity: 'inspectable', inspectability: 'deep' },
  control: { emphasis: 'responsive', interactivity: 'controllable', inspectability: 'detailed' },
  surface: { emphasis: 'artifact', interactivity: 'viewable', inspectability: 'summary' },
  artifact: { emphasis: 'artifact', interactivity: 'viewable', inspectability: 'summary' },
  probe: { emphasis: 'charged', interactivity: 'reactive', inspectability: 'deep' },
  telemetry: { emphasis: 'measured', interactivity: 'inspectable', inspectability: 'deep' },
  status: { emphasis: 'stable', interactivity: 'ambient', inspectability: 'summary' },
  registry: { emphasis: 'indexed', interactivity: 'inspectable', inspectability: 'detailed' }
});

const STANCE_BY_LIMINALITY = Object.freeze({
  entry: 'entry',
  threshold: 'entry',
  projected: 'entry',
  approach: 'entry',
  ground: 'ground',
  anchored: 'ground',
  settled: 'ground',
  stable: 'ground',
  realized: 'ground',
  interactive: 'ground',
  exit: 'exit',
  archived: 'exit',
  departed: 'exit'
});

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function humanize(value = '') {
  return normalizeText(value).replace(/[_-]+/g, ' ').toLowerCase();
}

function normalizeToken(value = '') {
  return humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tokenizeFeatureList(value = '') {
  return normalizeText(value)
    .split(/[\s,]+/)
    .map(normalizeToken)
    .filter(Boolean);
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSlug(value = '') {
  return humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toLocalUrl(href = '') {
  if (!href) return null;

  try {
    const url = new URL(href, document.baseURI);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

function collectRelationshipLinks(el) {
  const relations = [];
  const seen = new Set();
  const selectors = [
    ':scope > .frame-heading a[href]',
    ':scope > .frame-topline a[href]',
    ':scope > h1 a[href]',
    ':scope > h2 a[href]',
    ':scope > h3 a[href]',
    ':scope > strong a[href]',
    ':scope > [data-spw-slot="actions"] a[href]',
    ':scope > .frame-operators a[href]',
    ':scope > .card-sub-links a[href]',
    ':scope > a[href]'
  ];

  const pushLink = (link) => {
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.closest('[hidden], [aria-hidden="true"]')) return;

    const url = toLocalUrl(link.getAttribute('href') || '');
    if (!url) return;

    const key = `${url.pathname}${url.hash}`;
    if (seen.has(key)) return;
    seen.add(key);
    relations.push({ link, url, key });
  };

  if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
    pushLink(el);
  }

  selectors.forEach((selector) => {
    el.querySelectorAll?.(selector).forEach(pushLink);
  });

  return relations;
}

function resolvePrimaryRelationship(el, relations) {
  if (!relations.length) return null;

  const preferredSelectors = [
    ':scope > .frame-heading a[href]',
    ':scope > .frame-topline a[href]',
    ':scope > h1 a[href]',
    ':scope > h2 a[href]',
    ':scope > h3 a[href]',
    ':scope > [data-spw-slot="actions"] a[href]',
    ':scope > .frame-operators a[href]',
    ':scope > .card-sub-links a[href]',
    ':scope > a[href]'
  ];

  if (el instanceof HTMLAnchorElement && el.hasAttribute('href')) {
    return relations[0];
  }

  for (const selector of preferredSelectors) {
    const match = el.querySelector?.(selector);
    if (!(match instanceof HTMLAnchorElement)) continue;
    const url = toLocalUrl(match.getAttribute('href') || '');
    if (!url) continue;
    const key = `${url.pathname}${url.hash}`;
    const relation = relations.find((entry) => entry.key === key);
    if (relation) return relation;
  }

  return relations[0];
}

function describeRelationship(el) {
  const relations = collectRelationshipLinks(el);
  const branchCount = relations.length;
  const routeState = branchCount > 1 ? 'branching' : branchCount === 1 ? 'single' : 'none';
  const primary = resolvePrimaryRelationship(el, relations);

  if (!primary) {
    return {
      routeState,
      branchCount: '0',
      primaryOperator: '',
      primaryPrefix: '',
      primaryExpression: '',
      primaryLabel: '',
      routeMarker: ''
    };
  }

  const label = normalizeText(
    primary.link.dataset.spwNavLabel
    || primary.link.getAttribute('aria-label')
    || primary.link.textContent
    || ''
  );
  const explicitExpression = normalizeText(
    primary.link.dataset.spwNavExpression
    || primary.link.dataset.spwToken
    || primary.link.textContent
    || ''
  );
  const detected = detectOperator(explicitExpression) || detectOperator(label);
  const hashSlug = normalizeSlug(primary.url.hash.replace(/^#/, ''));
  const pathSlug = normalizeSlug(primary.url.pathname.split('/').filter(Boolean).pop() || 'home');
  const fallbackToken = primary.link.closest('.frame-operators')
    ? `?${hashSlug || pathSlug || 'branch'}`
    : `~${hashSlug || pathSlug || 'route'}`;
  const expression = explicitExpression && detectOperator(explicitExpression)
    ? explicitExpression
    : fallbackToken;
  const operator = detected?.type || detectOperator(expression)?.type || 'ref';
  const prefix = detected?.prefix || detectOperator(expression)?.prefix || '~';
  const routeMarker = branchCount > 1 ? `${prefix} {${branchCount}}` : prefix;

  return {
    routeState,
    branchCount: String(branchCount),
    primaryOperator: operator,
    primaryPrefix: prefix,
    primaryExpression: expression,
    primaryLabel: label,
    routeMarker
  };
}

function getHeading(el) {
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const target = document.getElementById(labelledBy.split(/\s+/)[0]);
    if (target) return normalizeText(target.textContent || '');
  }

  return normalizeText(
    el.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > .frame-heading h1, :scope > .frame-heading h2, :scope > .frame-heading h3, :scope > .frame-topline h1, :scope > .frame-topline h2, :scope > strong, :scope > figcaption'
    )?.textContent || ''
  );
}

function getKind(el) {
  if (el.dataset.spwKind) return normalizeToken(el.dataset.spwKind);
  if (el.matches('main')) return 'main';
  if (el.matches('nav')) return 'nav';
  if (el.matches('aside')) return 'aside';
  if (el.matches('article')) return 'article';
  if (el.matches('section')) return 'section';
  if (el.matches('figure')) return 'figure';
  if (el.classList.contains('site-frame')) return 'frame';
  if (el.classList.contains('frame-panel')) return 'panel';
  if (
    el.classList.contains('frame-card')
    || el.classList.contains('media-card')
    || el.classList.contains('media-focus-card')
    || el.classList.contains('software-card')
    || el.classList.contains('operator-card')
    || el.classList.contains('plan-card')
    || el.classList.contains('compare-card')
    || el.classList.contains('spec-column')
  ) return 'card';
  if (el.classList.contains('mode-panel')) return 'lens';
  return 'component';
}

function inferRole(el, kind) {
  if (el.dataset.spwRole) return normalizeToken(el.dataset.spwRole);

  const haystack = humanize([
    el.id,
    el.getAttribute('role'),
    el.dataset.spwMeaning,
    el.dataset.spwInspect,
    getHeading(el),
    el.textContent?.slice(0, 220) || ''
  ].filter(Boolean).join(' '));

  if (kind === 'main') return 'orientation';
  if (kind === 'nav') return 'routing';
  if (kind === 'aside') return 'reference';
  if (kind === 'figure') return 'artifact';
  if (el.classList.contains('site-hero')) return 'orientation';

  if (/register|registry|bookmarks/.test(haystack)) return 'registry';
  if (/index|routes|surfaces|navigation|nav/.test(haystack)) return 'routing';
  if (/settings|controls|preferences|runtime preferences/.test(haystack)) return 'control';
  if (/syntax|grammar|structure|schema|map|data structures/.test(haystack)) return 'schema';
  if (/status|current|applied state/.test(haystack)) return 'status';
  if (/probe|lab|observatory|question/.test(haystack)) return 'probe';

  if (kind === 'frame') return 'orientation';
  if (kind === 'panel') return 'reference';
  if (kind === 'card') return 'artifact';
  if (kind === 'lens') return 'control';

  return 'reference';
}

function inferMeaning(el, kind) {
  if (el.dataset.spwMeaning) return humanize(el.dataset.spwMeaning);
  const heading = humanize(getHeading(el));
  if (heading) return heading;
  return kind;
}

function inferForm(el, kind) {
  if (el.dataset.spwForm) return normalizeToken(el.dataset.spwForm);
  if (kind === 'nav') return 'route-list';
  if (kind === 'frame') return 'brace';
  if (kind === 'card') return 'tile';
  return 'block';
}

function inferContext(el, role) {
  if (el.dataset.spwContext) return normalizeToken(el.dataset.spwContext);
  if (role === 'control') return 'settings';
  if (role === 'routing') return 'routing';
  if (role === 'surface' || role === 'artifact') return 'publishing';
  return 'analysis';
}

function inferSubstrate(el, role) {
  if (el.dataset.spwSubstrate) return normalizeToken(el.dataset.spwSubstrate);
  return (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reference).substrate;
}

function inferPhrase(el, role) {
  if (el.dataset.spwPhrase) return normalizeToken(el.dataset.spwPhrase);
  return (ROLE_DEFAULTS[role] || ROLE_DEFAULTS.reference).phrase;
}

function inferFeatures(el, kind, role, context) {
  const raw = tokenizeFeatureList(el.dataset.spwFeatures || '');
  const implied = [];

  if (kind === 'frame') implied.push('framed');
  if (kind === 'card') implied.push('modular');
  if (role === 'routing') implied.push('navigable');
  if (role === 'control') implied.push('configurable');
  if (role === 'schema') implied.push('inspectable');
  if (role === 'registry') implied.push('collectible');
  if (context === 'settings') implied.push('local-state');

  return uniqueList([...raw, ...implied]);
}

function inferImportance(el, kind, role) {
  if (el.dataset.spwImportance) return normalizeToken(el.dataset.spwImportance);

  if (el.classList.contains('site-hero')) return 'primary';
  if (kind === 'main') return 'primary';
  if (role === 'control' || role === 'routing') return 'high';
  if (role === 'schema' || role === 'registry') return 'high';
  if (kind === 'card' || kind === 'panel') return 'medium';
  return 'low';
}

function inferDensity(el, kind, role, features) {
  if (el.dataset.spwDensity) return normalizeToken(el.dataset.spwDensity);

  const featureSet = new Set(features);

  if (featureSet.has('configurable') || role === 'control') return 'dense';
  if (featureSet.has('inspectable') || role === 'schema') return 'dense';
  if (kind === 'card') return 'compact';
  return 'reading';
}

function inferInteractivity(el, role, features) {
  if (el.dataset.spwInteractivity) return normalizeToken(el.dataset.spwInteractivity);

  const featureSet = new Set(features);
  if (featureSet.has('configurable')) return 'controllable';
  if (featureSet.has('navigable')) return 'navigable';
  if (featureSet.has('inspectable')) return 'inspectable';

  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).interactivity;
}

function inferInspectability(el, role) {
  if (el.dataset.spwInspectability) return normalizeToken(el.dataset.spwInspectability);
  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).inspectability;
}

function inferEmphasis(el, role) {
  if (el.dataset.spwEmphasis) return normalizeToken(el.dataset.spwEmphasis);
  return (INTERACTION_DEFAULTS[role] || INTERACTION_DEFAULTS.reference).emphasis;
}

function inferConfigDomain(el, context, features) {
  if (el.dataset.spwConfigDomain) return normalizeToken(el.dataset.spwConfigDomain);

  const featureSet = new Set(features);
  if (context === 'settings' || featureSet.has('local-state')) return 'site-settings';
  if (featureSet.has('collectible')) return 'registry';
  if (featureSet.has('inspectable')) return 'semantic-inspection';
  return 'none';
}

function inferConfigKeys(el) {
  if (el.dataset.spwConfigKeys) {
    return uniqueList(tokenizeFeatureList(el.dataset.spwConfigKeys));
  }

  const inspectFields = tokenizeFeatureList(el.dataset.spwInspectFields || '');
  const formOptions = tokenizeFeatureList(el.dataset.spwFormOptions || '');
  const keys = uniqueList([...inspectFields, ...formOptions]);

  return keys;
}

function inferInspectTarget(el) {
  return normalizeToken(el.dataset.spwInspect || el.id || '');
}

function inferSlots(el) {
  const slots = [];
  if (el.dataset.spwSlot) slots.push(normalizeToken(el.dataset.spwSlot));
  el.querySelectorAll?.(':scope > [data-spw-slot]').forEach((child) => {
    slots.push(normalizeToken(child.dataset.spwSlot));
  });
  return uniqueList(slots);
}

function inferAffordances(el, role, features) {
  const affordances = [];
  const featureSet = new Set(features);

  if (role === 'routing') affordances.push('anchor-jump');
  if (role === 'control') affordances.push('state-toggle');
  if (role === 'schema') affordances.push('inspect-reveal');
  if (role === 'registry') affordances.push('collect-recall');
  if (featureSet.has('configurable')) affordances.push('configure');
  if (featureSet.has('inspectable')) affordances.push('inspect');
  if (el.querySelector('[data-preset]')) affordances.push('preset-apply');
  if (el.querySelector('[data-site-settings-form], [data-site-settings-scope]')) affordances.push('settings-bind');
  if (el.querySelector('.operator-chip, a[href^="#"]')) affordances.push('navigate');

  return uniqueList(affordances);
}

function inferValueLayer(role, context) {
  if (context === 'settings') return 'state';
  if (role === 'schema') return 'structure';
  if (role === 'routing') return 'path';
  if (role === 'registry') return 'memory';
  return 'surface';
}

function inferStance(el, importance, interactivity) {
  if (el.dataset.spwStance) return normalizeToken(el.dataset.spwStance);

  const liminality = normalizeToken(el.dataset.spwLiminality || '');
  if (liminality && STANCE_BY_LIMINALITY[liminality]) {
    return STANCE_BY_LIMINALITY[liminality];
  }

  if (importance === 'primary' || interactivity === 'controllable') return 'entry';
  return 'ground';
}

function setIfMissing(el, key, value) {
  if (value == null || value === '') return;
  if (!el.dataset[key]) el.dataset[key] = value;
}

function setOrReplace(el, key, value) {
  if (value == null || value === '') return;
  el.dataset[key] = value;
}

function snapshotComponentSemantics(el, options = {}) {
  const kind = getKind(el);
  const role = inferRole(el, kind);
  const meaning = inferMeaning(el, kind);
  const form = inferForm(el, kind);
  const context = inferContext(el, role);
  const substrate = inferSubstrate(el, role);
  const phrase = inferPhrase(el, role);
  const features = inferFeatures(el, kind, role, context);
  const importance = inferImportance(el, kind, role);
  const density = inferDensity(el, kind, role, features);
  const interactivity = inferInteractivity(el, role, features);
  const inspectability = inferInspectability(el, role);
  const emphasis = inferEmphasis(el, role);
  const configDomain = inferConfigDomain(el, context, features);
  const configKeys = inferConfigKeys(el);
  const inspectTarget = inferInspectTarget(el);
  const slots = inferSlots(el);
  const affordances = inferAffordances(el, role, features);
  const valueLayer = inferValueLayer(role, context);
  const stance = inferStance(el, importance, interactivity);
  const relationship = describeRelationship(el);

  return {
    kind,
    role,
    meaning,
    form,
    substrate,
    phrase,
    context,
    importance,
    density,
    emphasis,
    interactivity,
    inspectability,
    configDomain,
    configKeys,
    inspectTarget,
    slots,
    affordances,
    features,
    valueLayer,
    stance,
    routeState: relationship.routeState,
    branchCount: relationship.branchCount,
    primaryOperator: relationship.primaryOperator,
    primaryPrefix: relationship.primaryPrefix,
    primaryExpression: relationship.primaryExpression,
    primaryLabel: relationship.primaryLabel,
    routeMarker: relationship.routeMarker,
    semanticTagged: 'true',
    semanticVersion: options.semanticVersion || '0.2'
  };
}

function applySemanticSnapshot(el, snapshot, options = {}) {
  const { overwrite = true } = options;
  const writer = overwrite ? setOrReplace : setIfMissing;

  writer(el, 'spwKind', snapshot.kind);
  writer(el, 'spwRole', snapshot.role);
  writer(el, 'spwMeaning', snapshot.meaning);
  writer(el, 'spwForm', snapshot.form);
  writer(el, 'spwSubstrate', snapshot.substrate);
  writer(el, 'spwPhrase', snapshot.phrase);
  writer(el, 'spwContext', snapshot.context);

  writer(el, 'spwImportance', snapshot.importance);
  writer(el, 'spwDensity', snapshot.density);
  writer(el, 'spwEmphasis', snapshot.emphasis);
  writer(el, 'spwInteractivity', snapshot.interactivity);
  writer(el, 'spwInspectability', snapshot.inspectability);
  writer(el, 'spwConfigDomain', snapshot.configDomain);
  writer(el, 'spwValueLayer', snapshot.valueLayer);
  writer(el, 'spwStance', snapshot.stance);
  writer(el, 'spwSemanticTagged', snapshot.semanticTagged);
  writer(el, 'spwSemanticVersion', snapshot.semanticVersion);
  writer(el, 'spwComponentKind', snapshot.kind);
  writer(el, 'spwRouteState', snapshot.routeState);
  writer(el, 'spwBranchCount', snapshot.branchCount);
  if (snapshot.primaryOperator) writer(el, 'spwPrimaryOperator', snapshot.primaryOperator);
  if (snapshot.primaryPrefix) writer(el, 'spwPrimaryPrefix', snapshot.primaryPrefix);
  if (snapshot.primaryExpression) writer(el, 'spwPrimaryExpression', snapshot.primaryExpression);
  if (snapshot.primaryLabel) writer(el, 'spwPrimaryLabel', snapshot.primaryLabel);
  if (snapshot.routeMarker) writer(el, 'spwRouteMarker', snapshot.routeMarker);

  if (snapshot.configKeys.length) writer(el, 'spwConfigKeys', snapshot.configKeys.join(' '));
  if (snapshot.inspectTarget) writer(el, 'spwInspect', snapshot.inspectTarget);
  if (snapshot.slots.length) writer(el, 'spwSemanticSlots', snapshot.slots.join(' '));
  if (snapshot.affordances.length) writer(el, 'spwAffordances', snapshot.affordances.join(' '));
  if (snapshot.features.length) writer(el, 'spwFeatures', snapshot.features.join(' '));
}

function collectSemanticTargets(root, selector = DEFAULT_SELECTOR) {
  const targets = new Set();

  if (root instanceof Element && root.matches(selector)) {
    targets.add(root);
  }

  root.querySelectorAll?.(selector).forEach((el) => {
    targets.add(el);
  });

  return [...targets];
}

function summarizeSemanticField(snapshots) {
  const summary = {
    roles: new Set(),
    contexts: new Set(),
    configDomains: new Set(),
    affordances: new Set(),
    interactivity: new Set()
  };

  snapshots.forEach(({ snapshot }) => {
    summary.roles.add(snapshot.role);
    summary.contexts.add(snapshot.context);
    summary.configDomains.add(snapshot.configDomain);
    summary.interactivity.add(snapshot.interactivity);
    snapshot.affordances.forEach((value) => summary.affordances.add(value));
  });

  return {
    roles: [...summary.roles],
    contexts: [...summary.contexts],
    configDomains: [...summary.configDomains],
    affordances: [...summary.affordances],
    interactivity: [...summary.interactivity]
  };
}

export function initSpwComponentSemantics(options = {}) {
  const {
    root = document,
    selector = DEFAULT_SELECTOR,
    emit = true,
    overwrite = true,
    semanticVersion = '0.2'
  } = options;

  const targets = collectSemanticTargets(root, selector);
  const snapshots = [];

  for (const el of targets) {
    const snapshot = snapshotComponentSemantics(el, { semanticVersion });
    applySemanticSnapshot(el, snapshot, { overwrite });
    snapshots.push({ element: el, snapshot });
  }

  if (emit) {
    const detail = {
      root,
      count: snapshots.length,
      field: summarizeSemanticField(snapshots),
      snapshots: snapshots.map(({ element, snapshot }) => ({
        id: element.id || null,
        kind: snapshot.kind,
        role: snapshot.role,
        meaning: snapshot.meaning,
        form: snapshot.form,
        substrate: snapshot.substrate,
        phrase: snapshot.phrase,
        context: snapshot.context,
        importance: snapshot.importance,
        density: snapshot.density,
        emphasis: snapshot.emphasis,
        interactivity: snapshot.interactivity,
        inspectability: snapshot.inspectability,
        configDomain: snapshot.configDomain,
        configKeys: snapshot.configKeys,
        inspectTarget: snapshot.inspectTarget,
        slots: snapshot.slots,
        affordances: snapshot.affordances,
        features: snapshot.features,
        valueLayer: snapshot.valueLayer,
        stance: snapshot.stance,
        routeState: snapshot.routeState,
        branchCount: snapshot.branchCount,
        primaryOperator: snapshot.primaryOperator,
        primaryExpression: snapshot.primaryExpression,
        primaryLabel: snapshot.primaryLabel,
        routeMarker: snapshot.routeMarker
      }))
    };

    bus.emit?.('semantic-snapshot', detail);
    document.dispatchEvent(new CustomEvent('spw:component-semantics-ready', { detail }));
  }

  return {
    cleanup() {},
    refresh(nextOptions = {}) {
      return initSpwComponentSemantics({
        root: nextOptions.root || root,
        selector: nextOptions.selector || selector,
        emit,
        overwrite,
        semanticVersion
      });
    },
    getSnapshots() {
      return snapshots.slice();
    }
  };
}

export {
  applySemanticSnapshot,
  collectSemanticTargets,
  snapshotComponentSemantics
};
