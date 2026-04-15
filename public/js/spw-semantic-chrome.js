import { snapshotComponentSemantics } from './spw-component-semantics.js';

const TARGET_SELECTOR = [
  '.site-frame',
  '.frame-panel',
  '.frame-card',
  '.mode-panel',
  '[data-spw-kind]',
  '[data-spw-role]',
  '[data-spw-slot]'
].join(', ');

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
  departed: 'exit',
});

const GUIDE_OPERATOR_BY_KIND = Object.freeze({
  affordance: 'action',
  config: 'surface',
  inspect: 'probe',
  interaction: 'action',
  realization: 'frame',
});

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function humanizeToken(value = '') {
  return normalizeText(String(value).replace(/[_-]+/g, ' ')).toLowerCase();
}

function uniqueByKey(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.kind}:${item.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveStance(host, snapshot) {
  if (host.dataset.spwStance) return host.dataset.spwStance;

  const liminality = humanizeToken(host.dataset.spwLiminality || '').replace(/\s+/g, '-');
  if (STANCE_BY_LIMINALITY[liminality]) return STANCE_BY_LIMINALITY[liminality];

  if (snapshot.role === 'control' || snapshot.interactivity === 'controllable') return 'entry';
  if (snapshot.importance === 'primary') return 'entry';
  return 'ground';
}

function collectTargets(root = document) {
  const targets = new Set();

  if (root instanceof Element && root.matches(TARGET_SELECTOR)) {
    targets.add(root);
  }

  root.querySelectorAll?.(TARGET_SELECTOR).forEach((node) => {
    if (node instanceof HTMLElement) targets.add(node);
  });

  return [...targets];
}

function getMetaMount(host) {
  return host.querySelector?.(':scope > .frame-topline, :scope > .frame-heading, :scope > figcaption') || host;
}

function findExistingMeta(host) {
  return host.querySelector?.(':scope > .spw-component-meta, :scope > .frame-topline > .spw-component-meta, :scope > .frame-heading > .spw-component-meta, :scope > figcaption > .spw-component-meta') || null;
}

function findExistingGuides(host) {
  return host.querySelector?.(':scope > .spw-component-guides') || null;
}

function createGeneratedContainer(className) {
  const node = document.createElement('div');
  node.className = className;
  node.dataset.spwGenerated = 'semantic-chrome';
  node.setAttribute('aria-hidden', 'true');
  return node;
}

function ensureMetaContainer(host) {
  const existing = findExistingMeta(host);
  if (existing && existing.dataset.spwGenerated !== 'semantic-chrome') return existing;
  if (existing) return existing;

  const mount = getMetaMount(host);
  const meta = createGeneratedContainer('spw-component-meta');

  if (mount === host && host.firstElementChild) {
    host.insertBefore(meta, host.firstElementChild);
  } else {
    mount.append(meta);
  }

  return meta;
}

function ensureGuideContainer(host) {
  const existing = findExistingGuides(host);
  if (existing && existing.dataset.spwGenerated !== 'semantic-chrome') return existing;
  if (existing) return existing;

  const guides = createGeneratedContainer('spw-component-guides');
  const mount = getMetaMount(host);

  if (mount !== host) {
    mount.insertAdjacentElement('afterend', guides);
  } else {
    const meta = findExistingMeta(host);
    if (meta?.nextSibling) {
      host.insertBefore(guides, meta.nextSibling);
    } else if (meta) {
      host.append(guides);
    } else if (host.firstElementChild) {
      host.insertBefore(guides, host.firstElementChild.nextSibling);
    } else {
      host.append(guides);
    }
  }

  return guides;
}

function createMetaTag({ text, role = '', substrate = '', stance = '', title = '' }) {
  const tag = document.createElement('span');
  tag.className = 'spw-component-tag';
  tag.textContent = text;
  if (role) tag.dataset.spwRole = role;
  if (substrate) tag.dataset.spwSubstrate = substrate;
  if (stance) tag.dataset.spwStance = stance;
  if (title) tag.title = title;
  return tag;
}

function createGuideChip({ kind, text, operator = '', substrate = '', stance = '' }) {
  const chip = document.createElement('span');
  chip.className = 'spw-guide-chip';
  chip.textContent = text;
  chip.dataset.spwGuideKind = kind;
  chip.dataset.spwGuideValue = text;
  if (operator) chip.dataset.spwOperator = operator;
  if (substrate) chip.dataset.spwSubstrate = substrate;
  if (stance) chip.dataset.spwStance = stance;
  return chip;
}

function syncChildren(container, children) {
  container.replaceChildren(...children);
  container.hidden = children.length === 0;
}

function buildMetaTags(host, snapshot, stance) {
  const tags = [
    {
      kind: 'kind',
      text: humanizeToken(snapshot.kind),
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.meaning || snapshot.kind),
    },
    {
      kind: 'context',
      text: humanizeToken(snapshot.context),
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.valueLayer || snapshot.context),
    },
  ];

  if (snapshot.configDomain && snapshot.configDomain !== 'none') {
    tags.push({
      kind: 'config',
      text: humanizeToken(snapshot.configDomain),
      role: snapshot.role,
      substrate: 'surface',
      stance,
      title: normalizeText(snapshot.configKeys.join(', ') || snapshot.configDomain),
    });
  } else if (snapshot.valueLayer && snapshot.valueLayer !== snapshot.context) {
    tags.push({
      kind: 'value-layer',
      text: humanizeToken(snapshot.valueLayer),
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.valueLayer),
    });
  }

  return uniqueByKey(tags).slice(0, 3);
}

function buildGuideChips(host, snapshot, stance) {
  const chips = [];

  if (host.dataset.spwRealization) {
    chips.push({
      kind: 'realization',
      text: humanizeToken(host.dataset.spwRealization),
      operator: GUIDE_OPERATOR_BY_KIND.realization,
    });
  }

  if (snapshot.interactivity && snapshot.interactivity !== 'ambient') {
    chips.push({
      kind: 'interaction',
      text: humanizeToken(snapshot.interactivity),
      operator: GUIDE_OPERATOR_BY_KIND.interaction,
    });
  }

  if (snapshot.inspectability && snapshot.inspectability !== 'summary') {
    chips.push({
      kind: 'inspect',
      text: humanizeToken(snapshot.inspectability),
      operator: GUIDE_OPERATOR_BY_KIND.inspect,
    });
  }

  if (snapshot.configDomain && snapshot.configDomain !== 'none') {
    chips.push({
      kind: 'config',
      text: humanizeToken(snapshot.configDomain),
      operator: GUIDE_OPERATOR_BY_KIND.config,
    });
  } else if (snapshot.affordances?.length) {
    chips.push({
      kind: 'affordance',
      text: humanizeToken(snapshot.affordances[0]),
      operator: GUIDE_OPERATOR_BY_KIND.affordance,
    });
  }

  return uniqueByKey(chips)
    .slice(0, 3)
    .map((chip) => ({
      ...chip,
      substrate: snapshot.substrate,
      stance,
    }));
}

function renderSemanticChrome(host) {
  if (!(host instanceof HTMLElement)) return;

  const snapshot = snapshotComponentSemantics(host);
  const stance = resolveStance(host, snapshot);

  host.dataset.spwComponentKind = host.dataset.spwComponentKind || snapshot.kind;
  host.dataset.spwStance = host.dataset.spwStance || stance;

  const meta = ensureMetaContainer(host);
  const guides = ensureGuideContainer(host);

  if (meta.dataset.spwGenerated === 'semantic-chrome') {
    syncChildren(
      meta,
      buildMetaTags(host, snapshot, stance).map(createMetaTag)
    );
  }

  if (guides.dataset.spwGenerated === 'semantic-chrome') {
    syncChildren(
      guides,
      buildGuideChips(host, snapshot, stance).map(createGuideChip)
    );
  }
}

function renderAll(root = document) {
  collectTargets(root).forEach(renderSemanticChrome);
}

export function initSpwSemanticChrome(options = {}) {
  const root = options.root || document;

  const refresh = (nextOptions = {}) => {
    renderAll(nextOptions.root || root);
  };

  const handleReady = (event) => {
    const nextRoot = event.detail?.root;
    refresh({
      root: nextRoot instanceof Element || nextRoot === document ? nextRoot : root,
    });
  };

  refresh();
  document.addEventListener('spw:component-semantics-ready', handleReady);

  return {
    cleanup() {
      document.removeEventListener('spw:component-semantics-ready', handleReady);
    },
    refresh,
  };
}
