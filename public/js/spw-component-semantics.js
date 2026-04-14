import { bus } from './spw-bus.js';

let initialized = false;
let cleanupCurrent = null;

let hoveredComponent = null;
let resizeObserver = null;
let mutationObserver = null;
let scheduledSelectionSync = 0;
let scheduledMutationFlush = 0;

const STRUCTURAL_SELECTOR = [
  'main',
  'section',
  'article',
  'nav',
  'aside',
  'figure',
  '[data-spw-kind]',
  '[data-spw-form]',
  '[data-spw-role]',
  '[data-spw-meaning]',
  '[data-spw-liminality]',
  '[data-spw-context]',
  '[data-spw-room]',
  '[data-spw-permeability]',
  '[data-spw-succession]',
  '[data-spw-affordance]',
  '[data-spw-wonder]',
  '[data-spw-realization]',
  '[data-spw-substrate]',
  '[data-spw-phrase]',
  '[data-spw-image-key]',
  '.site-frame',
  '.mode-panel',
  '.frame-card',
  '.frame-panel',
  '.software-card',
  '.operator-card',
  '.media-card',
  '.media-focus-card',
  '.pretext-metric',
  '.pretext-surface',
  '.settings-category',
  '.settings-fieldset',
  '.domain-visual',
  '.spw-console',
  '.spw-nav-panel'
].join(', ');

const MUTATION_ATTRIBUTE_FILTER = [
  'data-spw-kind',
  'data-spw-form',
  'data-spw-role',
  'data-spw-meaning',
  'data-spw-liminality',
  'data-spw-context',
  'data-spw-room',
  'data-spw-permeability',
  'data-spw-succession',
  'data-spw-affordance',
  'data-spw-wonder',
  'data-spw-realization',
  'data-spw-substrate',
  'data-spw-phrase',
  'data-spw-visited',
  'data-spw-pinned',
  'data-spw-latched',
  'aria-labelledby',
  'role'
];

const pendingMutationNodes = new Set();

const ROLE_TO_SUBSTRATE = Object.freeze({
  orientation: 'frame',
  routing: 'ref',
  route: 'ref',
  register: 'baseline',
  reference: 'ref',
  comparison: 'merge',
  schema: 'object',
  pipeline: 'object',
  probe: 'probe',
  telemetry: 'probe',
  lens: 'probe',
  projection: 'surface',
  surface: 'surface',
  control: 'action',
  rationale: 'meta',
  scenario: 'pragma',
  status: 'baseline',
  artifact: 'surface',
  destination: 'ref',
  complementary: 'surface',
  figure: 'surface'
});

const PHRASE_BY_ROLE = Object.freeze({
  orientation: 'premise',
  status: 'premise',
  routing: 'guide',
  register: 'guide',
  reference: 'guide',
  route: 'artifact',
  destination: 'artifact',
  artifact: 'artifact',
  projection: 'artifact',
  surface: 'artifact',
  probe: 'inquiry',
  telemetry: 'inquiry',
  comparison: 'inquiry',
  lens: 'inquiry',
  schema: 'structure',
  pipeline: 'structure',
  control: 'instruction',
  rationale: 'reflection',
  scenario: 'reflection',
  complementary: 'context',
  figure: 'artifact'
});

const ROLE_TO_CONTEXT = Object.freeze({
  orientation: 'reading',
  register: 'reading',
  reference: 'reading',
  schema: 'analysis',
  probe: 'analysis',
  telemetry: 'analysis',
  comparison: 'analysis',
  routing: 'routing',
  route: 'routing',
  control: 'settings',
  scenario: 'play',
  surface: 'publishing',
  projection: 'publishing',
  artifact: 'publishing',
  destination: 'publishing',
  lens: 'analysis',
  rationale: 'analysis',
  status: 'analysis',
  complementary: 'context',
  figure: 'publishing'
});

const ROLE_TO_WONDER = Object.freeze({
  orientation: 'orientation',
  register: 'orientation',
  reference: 'memory',
  routing: 'orientation',
  route: 'projection',
  destination: 'projection',
  artifact: 'memory',
  surface: 'projection',
  projection: 'projection',
  probe: 'inquiry',
  telemetry: 'inquiry',
  comparison: 'comparison',
  schema: 'constraint',
  pipeline: 'constraint',
  control: 'constraint',
  rationale: 'comparison',
  scenario: 'resonance',
  lens: 'comparison',
  status: 'memory',
  complementary: 'comparison',
  figure: 'projection'
});

const ROLE_TO_PERMEABILITY = Object.freeze({
  orientation: 'porous',
  register: 'porous',
  reference: 'annotatable',
  routing: 'annotatable',
  route: 'sealed',
  destination: 'sealed',
  artifact: 'annotatable',
  surface: 'annotatable',
  projection: 'annotatable',
  probe: 'porous',
  telemetry: 'porous',
  comparison: 'porous',
  schema: 'annotatable',
  pipeline: 'annotatable',
  control: 'mutable',
  rationale: 'annotatable',
  scenario: 'mutable',
  lens: 'mutable',
  status: 'porous',
  complementary: 'annotatable',
  figure: 'annotatable'
});

const KIND_TO_AFFORDANCE = Object.freeze({
  main: 'route',
  section: 'hint',
  article: 'navigate',
  nav: 'navigate',
  aside: 'hint',
  figure: 'hint',
  frame: 'pin',
  panel: 'hint',
  card: 'navigate',
  lens: 'toggle',
  surface: 'hint',
  metric: 'hint',
  artifact: 'hint',
  component: 'hint'
});

const SUBSTRATE_SIGIL = Object.freeze({
  frame: '#',
  layer: ':',
  baseline: '.',
  object: '^',
  ref: '~',
  probe: '?',
  action: '@',
  stream: '*',
  merge: '&',
  binding: '=',
  meta: '$',
  normalize: '%',
  pragma: '!',
  surface: '>'
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

function getTextHaystack(element) {
  const labelledBy = element.getAttribute('aria-labelledby');
  const labelText = labelledBy
    ? labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent || '')
        .join(' ')
    : '';

  return humanize([
    element.id,
    element.getAttribute('role'),
    element.dataset.spwMeaning,
    element.dataset.modePanel,
    labelText,
    element.querySelector('h1, h2, h3, h4, strong, figcaption')?.textContent || '',
    element.textContent || ''
  ].filter(Boolean).join(' '));
}

function getHeadingElement(element) {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const firstId = labelledBy.split(/\s+/)[0];
    const target = document.getElementById(firstId);
    if (target) return target;
  }

  return element.querySelector(
    ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > header h1, :scope > header h2, :scope > header h3, :scope > .frame-topline h1, :scope > .frame-topline h2, :scope > .frame-heading h1, :scope > .frame-heading h2, strong, figcaption, .frame-card-sigil, .operator-card-token, .frame-sigil'
  );
}

function getHeadingText(element) {
  return normalizeText(getHeadingElement(element)?.textContent || '');
}

function getShortHeading(element) {
  const heading = humanize(getHeadingText(element));
  return heading && heading.length <= 56 ? heading : '';
}

function getScopedMeta(host) {
  return host.querySelector(':scope > .spw-component-meta');
}

function isInteractiveElement(element) {
  return (
    element instanceof HTMLAnchorElement ||
    element.matches?.('button, summary, input, select, textarea, [tabindex], [role="button"]') ||
    !!element.querySelector?.('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
  );
}

function isLikelyStructural(element) {
  return (
    element.matches('main, section, article, nav, aside, figure') ||
    element.classList.contains('site-frame') ||
    element.classList.contains('frame-card') ||
    element.classList.contains('frame-panel') ||
    element.classList.contains('mode-panel') ||
    element.classList.contains('software-card') ||
    element.classList.contains('media-card') ||
    element.classList.contains('media-focus-card') ||
    element.classList.contains('operator-card') ||
    element.classList.contains('settings-category') ||
    element.classList.contains('settings-fieldset') ||
    element.classList.contains('pretext-surface') ||
    element.classList.contains('spw-console') ||
    element.classList.contains('spw-nav-panel')
  );
}

function getKind(element) {
  if (element.dataset.spwKind) return humanize(element.dataset.spwKind);
  if (element.hasAttribute('data-spw-image-key') || element.classList.contains('domain-visual')) return 'artifact';
  if (element.matches('main')) return 'main';
  if (element.matches('nav')) return 'nav';
  if (element.matches('aside')) return 'aside';
  if (element.matches('article')) return 'article';
  if (element.matches('figure')) return 'figure';
  if (element.matches('section') || element.classList.contains('site-frame')) return 'frame';
  if (element.classList.contains('mode-panel')) return 'lens';
  if (element.classList.contains('software-card')) return 'surface';
  if (element.classList.contains('pretext-surface')) return 'surface';
  if (element.classList.contains('settings-category') || element.classList.contains('settings-fieldset')) return 'surface';
  if (element.classList.contains('spw-console') || element.classList.contains('spw-nav-panel')) return 'surface';
  if (element.classList.contains('operator-card')) return 'card';
  if (element.classList.contains('media-card') || element.classList.contains('media-focus-card')) return 'card';
  if (element.classList.contains('frame-card')) return 'card';
  if (element.classList.contains('frame-panel')) return 'panel';
  if (element.classList.contains('pretext-metric')) return 'metric';
  return 'component';
}

function inferRoleFromStructure(element, kind) {
  const roleAttr = normalizeToken(element.getAttribute('role') || '');
  if (roleAttr === 'navigation') return 'routing';
  if (roleAttr === 'complementary') return 'complementary';
  if (kind === 'main') return 'orientation';
  if (kind === 'nav') return 'routing';
  if (kind === 'aside') return 'complementary';
  if (kind === 'figure') return 'figure';
  if (kind === 'article') {
    if (element instanceof HTMLAnchorElement || isInteractiveElement(element)) return 'artifact';
    return 'artifact';
  }

  const haystack = getTextHaystack(element);

  if (element.classList.contains('site-hero')) return 'orientation';
  if (/related surfaces|routes|surface register|index|atlas/.test(haystack)) return 'routing';
  if (/register/.test(haystack)) return 'register';
  if (/status|current/.test(haystack)) return 'status';
  if (/comparison/.test(haystack)) return 'comparison';
  if (/observatory|probe|lab/.test(haystack)) return 'probe';
  if (/grammar|syntax|forms|format|structure/.test(haystack)) return 'schema';
  if (/pipeline|transform/.test(haystack)) return 'pipeline';
  if (/scenario|what if|homage|session|arc|cast|world/.test(haystack)) return 'scenario';
  if (/reference|signal studies|recipes|direction|sources/.test(haystack)) return 'reference';
  if (/settings|controls|preferences/.test(haystack)) return 'control';

  if (kind === 'frame') return 'context';
  if (kind === 'panel') return 'facet';
  if (kind === 'surface') return 'surface';
  if (kind === 'lens') return 'lens';
  if (kind === 'metric') return 'telemetry';
  if (kind === 'artifact') return 'artifact';

  return 'context';
}

function getRole(element, kind) {
  return normalizeToken(element.dataset.spwRole || '') || inferRoleFromStructure(element, kind);
}

function getMeaning(element, kind) {
  if (element.dataset.spwMeaning) return humanize(element.dataset.spwMeaning);

  const shortHeading = getShortHeading(element);
  const haystack = getTextHaystack(element);

  if (kind === 'main') return shortHeading || 'primary surface';
  if (kind === 'nav') return shortHeading || 'navigation';
  if (kind === 'aside') return shortHeading || 'complementary context';
  if (kind === 'figure') return shortHeading || 'figure';

  if (element.classList.contains('site-hero')) return 'orientation';
  if (/related surfaces|routes|surface register/.test(haystack)) return 'routing';
  if (/register/.test(haystack)) return 'register';
  if (/status|current/.test(haystack)) return 'status';
  if (/comparison/.test(haystack)) return 'comparison';
  if (/observatory|probe|lab/.test(haystack)) return 'probe';
  if (/grammar|syntax|forms|format|structure|pipeline/.test(haystack)) return 'schema';
  if (/scenario|what if|homage/.test(haystack)) return 'scenario';
  if (/reference|signal studies|recipes|direction|sources/.test(haystack)) return 'reference';

  return shortHeading || kind;
}

function getForm(element, kind) {
  return normalizeToken(element.dataset.spwForm || '') ||
    (kind === 'nav' ? 'route-list'
      : kind === 'figure' ? 'figure'
      : ['frame', 'panel', 'lens'].includes(kind) ? 'brace'
      : 'block');
}

function getLiminality(element, kind, role) {
  if (element.dataset.spwLiminality) return normalizeToken(element.dataset.spwLiminality);

  if (element.classList.contains('site-hero') || role === 'orientation') return 'entry';

  switch (kind) {
    case 'main':
      return 'entry';
    case 'nav':
      return 'threshold';
    case 'aside':
      return 'nested';
    case 'frame':
      return 'settled';
    case 'panel':
    case 'lens':
      return 'threshold';
    case 'article':
      return 'nested';
    case 'figure':
    case 'artifact':
    case 'metric':
      return 'deep';
    case 'surface':
      return 'projected';
    default:
      return 'ambient';
  }
}

function getSelectionBase(element, kind) {
  const explicit = normalizeToken(element.dataset.spwSelection || '');
  if (explicit) return explicit;

  if (kind === 'main') return 'selected';
  if (isInteractiveElement(element) || ['frame', 'panel', 'lens', 'article', 'card', 'artifact', 'nav'].includes(kind)) {
    return 'addressable';
  }

  return 'ambient';
}

function getSubstrate(element, kind, role) {
  const explicit = normalizeToken(element.dataset.spwSubstrate || '');
  if (explicit) return explicit;

  const directOperator = normalizeToken(element.dataset.spwOperator || '');
  if (directOperator) return directOperator;

  const inheritedOperator = normalizeToken(element.closest('[data-spw-operator]')?.dataset.spwOperator || '');
  if (inheritedOperator) return inheritedOperator;

  if (ROLE_TO_SUBSTRATE[role]) return ROLE_TO_SUBSTRATE[role];

  switch (kind) {
    case 'main':
    case 'frame':
      return 'frame';
    case 'nav':
      return 'ref';
    case 'aside':
      return 'surface';
    case 'panel':
    case 'lens':
      return 'probe';
    case 'figure':
    case 'artifact':
    case 'surface':
      return 'surface';
    case 'metric':
      return 'probe';
    case 'article':
      return isInteractiveElement(element) ? 'ref' : 'object';
    default:
      return 'frame';
  }
}

function getRealization(element, kind, role) {
  const explicit = normalizeToken(element.dataset.spwRealization || '');
  if (explicit) return explicit;

  if (role === 'artifact' || role === 'route' || role === 'projection' || role === 'surface' || role === 'destination' || role === 'figure') {
    return 'realized';
  }

  switch (kind) {
    case 'main':
    case 'nav':
      return 'hybrid';
    case 'surface':
    case 'artifact':
    case 'figure':
      return 'realized';
    case 'metric':
    case 'lens':
      return 'conceptual';
    case 'panel':
      return 'conceptual';
    case 'article':
      return isInteractiveElement(element) ? 'realized' : 'conceptual';
    case 'frame':
      return 'conceptual';
    default:
      return 'hybrid';
  }
}

function getPhrase(element, kind, role, realization) {
  return normalizeToken(element.dataset.spwPhrase || '') ||
    PHRASE_BY_ROLE[role] ||
    (realization === 'realized'
      ? 'artifact'
      : kind === 'frame' || kind === 'main'
        ? 'premise'
        : 'context');
}

function getContext(element, kind, role) {
  return normalizeToken(element.dataset.spwContext || '') ||
    normalizeToken(element.closest('[data-spw-context]')?.dataset.spwContext || '') ||
    normalizeToken(document.body?.dataset.spwSurface || '') ||
    ROLE_TO_CONTEXT[role] ||
    (kind === 'frame' || kind === 'main' ? 'reading' : 'analysis');
}

function getAffordance(element, kind) {
  const explicit = normalizeToken(element.dataset.spwAffordance || '');
  if (explicit) return explicit;

  if (element.hasAttribute('data-spw-swappable')) return 'swap';
  if (element.dataset.spwReturnable === 'true') return 'return';
  if (element.dataset.spwPinned === 'true') return 'pin';
  if (isInteractiveElement(element)) return kind === 'lens' ? 'toggle' : 'navigate';

  return KIND_TO_AFFORDANCE[kind] || 'hint';
}

function getWonder(element, kind, role) {
  return normalizeToken(element.dataset.spwWonder || '') ||
    ROLE_TO_WONDER[role] ||
    (getAffordance(element, kind) === 'pin'
      ? 'memory'
      : getAffordance(element, kind) === 'swap'
        ? 'comparison'
        : kind === 'article'
          ? 'projection'
          : 'orientation');
}

function getPermeability(element, kind, role) {
  return normalizeToken(element.dataset.spwPermeability || '') ||
    ROLE_TO_PERMEABILITY[role] ||
    (kind === 'lens'
      ? 'mutable'
      : kind === 'figure' || kind === 'artifact'
        ? 'annotatable'
        : 'porous');
}

function getSuccession(element) {
  const explicit = normalizeToken(element.dataset.spwSuccession || '');
  if (explicit) return explicit;

  if (element.dataset.spwPinned === 'true' || element.dataset.spwLatched === 'true') return 'latched';
  if (element.dataset.spwVisited === 'true') return 'visited';
  if (element.dataset.spwSelection === 'selected') return 'resolved';
  if (element.dataset.spwSelection === 'active') return 'measured';

  return 'raw';
}

function getRoom(element) {
  const explicit = normalizeToken(element.dataset.spwRoom || '');
  if (explicit) return explicit;

  const width = element.clientWidth || element.getBoundingClientRect().width || 0;
  if (width >= 704) return 'roomy';
  if (width >= 360) return 'standard';
  return 'compact';
}

function getGuideDensity(room) {
  if (room === 'compact') return 'minimal';
  if (room === 'roomy') return 'rich';
  return 'standard';
}

function createGuideChip({ label, kind, operator = '', value = '' }) {
  const chip = document.createElement('span');
  chip.className = 'spw-guide-chip';
  chip.dataset.spwGuideKind = kind;
  if (value) chip.dataset.spwGuideValue = value;
  if (operator) chip.dataset.spwOperator = operator;
  chip.textContent = label;
  chip.setAttribute('aria-hidden', 'true');
  return chip;
}

function makeCaption(kind, meaning) {
  return `${kind} · ${meaning}`;
}

function getTagHost(element, kind) {
  if (kind === 'frame' || kind === 'main') {
    return element.querySelector(':scope > .frame-topline, :scope > .frame-heading, :scope > header, :scope > h1, :scope > h2')?.parentElement || element;
  }

  if (kind === 'figure') {
    return element.querySelector('figcaption') || element;
  }

  return element;
}

function setDataIfChanged(element, key, value) {
  const next = String(value);
  if (element.dataset[key] !== next) {
    element.dataset[key] = next;
  }
}

function updateSelectionStateIfNeeded(element, nextSelection) {
  if (element.dataset.spwSelection !== nextSelection) {
    element.dataset.spwSelection = nextSelection;
  }

  const nextSuccession = getSuccession(element);
  if (element.dataset.spwSuccession !== nextSuccession) {
    element.dataset.spwSuccession = nextSuccession;
  }

  const nextRoom = getRoom(element);
  if (element.dataset.spwRoom !== nextRoom) {
    element.dataset.spwRoom = nextRoom;
  }

  const nextDensity = getGuideDensity(nextRoom);
  if (element.dataset.spwGuideDensity !== nextDensity) {
    element.dataset.spwGuideDensity = nextDensity;
  }

  const kind = element.dataset.spwComponentKind || getKind(element);
  const meta = getScopedMeta(getTagHost(element, kind));
  if (meta && meta.dataset.spwGuideDensity !== nextDensity) {
    meta.dataset.spwGuideDensity = nextDensity;
  }
}

function attachTag(element) {
  if (!(element instanceof Element) || !element.isConnected) return;
  if (!isLikelyStructural(element) && !element.matches(STRUCTURAL_SELECTOR)) return;

  const kind = getKind(element);
  const meaning = getMeaning(element, kind);
  const role = getRole(element, kind);
  const form = getForm(element, kind);
  const liminality = getLiminality(element, kind, role);
  const selectionBase = getSelectionBase(element, kind);
  const substrate = getSubstrate(element, kind, role);
  const realization = getRealization(element, kind, role);
  const phrase = getPhrase(element, kind, role, realization);
  const context = getContext(element, kind, role);
  const affordance = getAffordance(element, kind);
  const wonder = getWonder(element, kind, role);
  const permeability = getPermeability(element, kind, role);
  const succession = getSuccession(element);
  const room = getRoom(element);
  const guideDensity = getGuideDensity(room);
  const caption = makeCaption(kind, meaning);
  const host = getTagHost(element, kind);

  let meta = getScopedMeta(host);
  let tag = meta?.querySelector(':scope > .spw-component-tag') || null;
  let guides = meta?.querySelector(':scope > .spw-component-guides') || null;

  setDataIfChanged(element, 'spwComponentKind', kind);
  setDataIfChanged(element, 'spwSurfaceKind', kind);
  setDataIfChanged(element, 'spwComponentMeaning', meaning);
  setDataIfChanged(element, 'spwRole', role);
  setDataIfChanged(element, 'spwForm', form);
  setDataIfChanged(element, 'spwLiminality', liminality);
  setDataIfChanged(element, 'spwSelectionBase', selectionBase);
  if (!element.dataset.spwSelection) {
    element.dataset.spwSelection = selectionBase;
  }
  setDataIfChanged(element, 'spwSubstrate', substrate);
  setDataIfChanged(element, 'spwRealization', realization);
  setDataIfChanged(element, 'spwPhrase', phrase);
  setDataIfChanged(element, 'spwContext', context);
  setDataIfChanged(element, 'spwAffordance', affordance);
  setDataIfChanged(element, 'spwWonder', wonder);
  setDataIfChanged(element, 'spwPermeability', permeability);
  setDataIfChanged(element, 'spwSuccession', succession);
  setDataIfChanged(element, 'spwRoom', room);
  setDataIfChanged(element, 'spwGuideDensity', guideDensity);
  setDataIfChanged(element, 'spwSemanticTagged', 'true');
  element.setAttribute('data-spw-field-root', '');

  if (!meta) {
    meta = document.createElement('span');
    meta.className = 'spw-component-meta';

    tag = document.createElement('span');
    tag.className = 'spw-component-tag';
    tag.setAttribute('aria-hidden', 'true');

    guides = document.createElement('span');
    guides.className = 'spw-component-guides';
    guides.setAttribute('aria-hidden', 'true');

    meta.append(tag, guides);

    if (host === element) {
      host.prepend(meta);
    } else {
      host.appendChild(meta);
    }
  }

  setDataIfChanged(meta, 'spwSubstrate', substrate);
  setDataIfChanged(meta, 'spwRealization', realization);
  setDataIfChanged(meta, 'spwPhrase', phrase);
  setDataIfChanged(meta, 'spwContext', context);
  setDataIfChanged(meta, 'spwWonder', wonder);
  setDataIfChanged(meta, 'spwGuideDensity', guideDensity);

  if (tag.textContent !== caption) {
    tag.textContent = caption;
  }

  setDataIfChanged(tag, 'spwSubstrate', substrate);
  setDataIfChanged(tag, 'spwRealization', realization);
  setDataIfChanged(tag, 'spwPhrase', phrase);

  const desiredGuideSpec = [
    { kind: 'realization', value: realization, label: realization, operator: '' },
    { kind: 'phrase', value: phrase, label: phrase, operator: '' },
    {
      kind: 'substrate',
      value: substrate,
      operator: substrate,
      label: `${SUBSTRATE_SIGIL[substrate] || ''} ${substrate}`.trim()
    }
  ];

  if (guideDensity !== 'minimal') {
    desiredGuideSpec.push(
      { kind: 'context', value: context, label: context, operator: '' },
      { kind: 'wonder', value: wonder, label: wonder, operator: '' }
    );
  }

  if (guideDensity === 'rich') {
    desiredGuideSpec.push(
      { kind: 'permeability', value: permeability, label: permeability, operator: '' },
      { kind: 'affordance', value: affordance, label: affordance, operator: '' }
    );
  }

  const existingGuides = Array.from(guides.children);
  const needsReplace =
    existingGuides.length !== desiredGuideSpec.length ||
    existingGuides.some((node, index) => {
      const spec = desiredGuideSpec[index];
      return (
        node.textContent !== spec.label ||
        node.dataset.spwGuideKind !== spec.kind ||
        (node.dataset.spwGuideValue || '') !== spec.value ||
        (node.dataset.spwOperator || '') !== spec.operator
      );
    });

  if (needsReplace) {
    guides.replaceChildren(...desiredGuideSpec.map((spec) => createGuideChip(spec)));
  }
}

function annotateTree(root = document) {
  const nodes = new Set();

  if (root instanceof Element && root.matches(STRUCTURAL_SELECTOR)) {
    nodes.add(root);
  }

  root.querySelectorAll?.(STRUCTURAL_SELECTOR).forEach((node) => nodes.add(node));
  nodes.forEach((node) => attachTag(node));
}

const getComponentSelectionRank = (value) => ({
  ambient: 0,
  addressable: 1,
  focused: 2,
  active: 3,
  selected: 4
}[value] ?? 0);

function getTaggedComponent(target) {
  return target instanceof Element
    ? target.closest('[data-spw-semantic-tagged="true"]')
    : null;
}

function syncSelectionState() {
  scheduledSelectionSync = 0;

  const focused = getTaggedComponent(document.activeElement);
  let target = null;

  if (window.location.hash) {
    try {
      target = getTaggedComponent(document.querySelector(window.location.hash));
    } catch {
      target = null;
    }
  }

  document.querySelectorAll('[data-spw-semantic-tagged="true"]').forEach((element) => {
    let selection = element.dataset.spwSelectionBase || 'ambient';

    if (hoveredComponent && (element === hoveredComponent || element.contains(hoveredComponent))) {
      selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('focused')
        ? selection
        : 'focused';
    }

    if (focused && (element === focused || element.contains(focused))) {
      selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('focused')
        ? selection
        : 'focused';
    }

    if (element.classList.contains('is-active-frame') || element.classList.contains('is-active-panel')) {
      selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('active')
        ? selection
        : 'active';
    }

    if (target && (element === target || element.contains(target))) {
      selection = 'selected';
    }

    if (element.matches('[aria-current="page"], [aria-current="location"]')) {
      selection = 'selected';
    }

    updateSelectionStateIfNeeded(element, selection);
  });
}

function scheduleSelectionSync() {
  if (scheduledSelectionSync) return;
  scheduledSelectionSync = requestAnimationFrame(syncSelectionState);
}

function observeTaggedNode(node) {
  if (!(node instanceof Element)) return;
  if (node.dataset.spwSemanticTagged !== 'true') return;
  resizeObserver?.observe(node);
}

function processPendingMutationNodes() {
  scheduledMutationFlush = 0;

  const nodes = Array.from(pendingMutationNodes);
  pendingMutationNodes.clear();

  nodes.forEach((node) => {
    if (!(node instanceof Element) || !node.isConnected) return;
    annotateTree(node);

    if (node.dataset.spwSemanticTagged === 'true') {
      observeTaggedNode(node);
    }

    node.querySelectorAll?.('[data-spw-semantic-tagged="true"]').forEach(observeTaggedNode);
  });

  scheduleSelectionSync();
}

function scheduleMutationNode(node) {
  if (!(node instanceof Element)) return;
  pendingMutationNodes.add(node);

  if (!scheduledMutationFlush) {
    scheduledMutationFlush = requestAnimationFrame(processPendingMutationNodes);
  }
}

export function initSpwComponentSemantics() {
  if (initialized) {
    return cleanupCurrent || (() => {});
  }

  initialized = true;

  const abortController = new AbortController();
  const offs = [];

  annotateTree(document);
  scheduleSelectionSync();

  resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => {
      if (!(target instanceof Element)) return;
      if (target.dataset.spwSemanticTagged !== 'true') return;

      const nextRoom = getRoom(target);
      const nextSuccession = getSuccession(target);
      const nextDensity = getGuideDensity(nextRoom);

      if (
        target.dataset.spwRoom === nextRoom &&
        target.dataset.spwSuccession === nextSuccession &&
        target.dataset.spwGuideDensity === nextDensity
      ) {
        return;
      }

      attachTag(target);
    });
  });

  document.querySelectorAll('[data-spw-semantic-tagged="true"]').forEach(observeTaggedNode);

  mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            scheduleMutationNode(node);
          }
        });
        return;
      }

      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        scheduleMutationNode(mutation.target);
      }
    });
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: MUTATION_ATTRIBUTE_FILTER
  });

  document.addEventListener('pointerover', (event) => {
    hoveredComponent = getTaggedComponent(event.target);
    scheduleSelectionSync();
  }, { signal: abortController.signal });

  document.addEventListener('pointerout', (event) => {
    hoveredComponent = getTaggedComponent(event.relatedTarget);
    scheduleSelectionSync();
  }, { signal: abortController.signal });

  document.addEventListener('focusin', scheduleSelectionSync, { signal: abortController.signal });
  document.addEventListener('focusout', scheduleSelectionSync, { signal: abortController.signal });
  document.addEventListener('click', scheduleSelectionSync, { signal: abortController.signal });
  window.addEventListener('hashchange', scheduleSelectionSync, { signal: abortController.signal });

  offs.push(
    bus.on('frame:activated', scheduleSelectionSync),
    bus.on('frame:mode', scheduleSelectionSync),
    bus.on('brace:pinned', scheduleSelectionSync),
    bus.on('brace:committed', scheduleSelectionSync),
    bus.on('brace:swapped', scheduleSelectionSync)
  );

  document.addEventListener('spw:frame-change', scheduleSelectionSync, { signal: abortController.signal });
  document.addEventListener('spw:mode-change', scheduleSelectionSync, { signal: abortController.signal });

  document.dispatchEvent(new CustomEvent('spw:component-semantics-ready'));

  cleanupCurrent = () => {
    abortController.abort();

    offs.forEach((off) => {
      try {
        off?.();
      } catch (error) {
        console.warn('[ComponentSemantics] Failed to unsubscribe.', error);
      }
    });

    if (scheduledSelectionSync) {
      cancelAnimationFrame(scheduledSelectionSync);
      scheduledSelectionSync = 0;
    }

    if (scheduledMutationFlush) {
      cancelAnimationFrame(scheduledMutationFlush);
      scheduledMutationFlush = 0;
    }

    pendingMutationNodes.clear();
    hoveredComponent = null;

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }

    initialized = false;
    cleanupCurrent = null;
  };

  return cleanupCurrent;
}