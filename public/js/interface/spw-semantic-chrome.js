import { SEMANTIC_CHROME_SELECTOR } from '/public/js/kernel/spw-dom-contracts.js';
import { snapshotComponentSemantics } from '/public/js/semantic/spw-component-semantics.js';
import {
  humanizeToken,
  normalizeText,
  unique,
  uniqueByKey,
} from '/public/js/semantic/spw-semantic-utils.js';

const TARGET_SELECTOR = SEMANTIC_CHROME_SELECTOR;

const SEMANTIC_TOKEN_SELECTOR = [
  '.spw-component-tag[data-spw-generated="semantic-chrome"]',
  '.spw-guide-chip[data-spw-generated="semantic-chrome"]'
].join(', ');

const SEMANTIC_POPOVER_CLASS = 'spw-semantic-popover';
const SEMANTIC_HOLD_MS = 420;
const SEMANTIC_MOVE_CANCEL_PX = 10;

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

const GENERIC_KIND_TEXTS = new Set(['component', 'frame', 'surface', 'panel', 'card']);
const GENERIC_CONTEXT_TEXTS = new Set(['analysis', 'reading', 'routing', 'settings', 'play', 'publishing', 'orientation']);
const GENERIC_ROLE_TEXTS = new Set(['reference', 'orientation', 'routing', 'context', 'vessel']);

function uniqueByText(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeText(item.text).toLowerCase();
    if (!key || seen.has(key)) return false;
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

  return [...targets].filter((node) => !shouldSkipTarget(node));
}

function shouldSkipTarget(host) {
  if (!(host instanceof HTMLElement)) return true;
  if (host.matches('main[data-spw-kind="surface"], article[data-spw-kind="surface"]')) return true;
  if (host.matches('.site-header, body > header, nav[data-spw-kind="shell"]')) return true;
  return false;
}

function findStructuralMount(host) {
  return host.querySelector?.(':scope > .frame-topline, :scope > .frame-heading, :scope > figcaption') || null;
}

function findHeaderSlot(host) {
  return host.querySelector?.(':scope > [data-spw-slot="header"]') || null;
}

function ensureSemanticSeam(host) {
  const existing = host.querySelector?.(':scope > .spw-semantic-seam[data-spw-generated="semantic-chrome"]');
  if (existing) return existing;

  const seam = document.createElement('div');
  seam.className = 'spw-semantic-seam';
  seam.dataset.spwGenerated = 'semantic-chrome';
  seam.dataset.spwSlot = 'header';
  seam.dataset.spwEmpty = 'true';
  seam.hidden = true;

  const structuralMount = findStructuralMount(host);
  const headerSlot = findHeaderSlot(host);

  if (structuralMount?.parentElement === host) {
    structuralMount.insertAdjacentElement('afterend', seam);
  } else if (headerSlot?.parentElement === host) {
    headerSlot.insertAdjacentElement('afterend', seam);
  } else if (host.firstElementChild) {
    host.insertBefore(seam, host.firstElementChild);
  } else {
    host.append(seam);
  }

  return seam;
}

function updateSemanticSeamState(seam) {
  if (!(seam instanceof HTMLElement)) return;

  const hasVisibleChildren = [...seam.children].some((child) => {
    if (!(child instanceof HTMLElement) || child.hidden) return false;
    if (child.childElementCount > 0) return true;
    return Boolean(normalizeText(child.textContent || ''));
  });

  seam.dataset.spwEmpty = hasVisibleChildren ? 'false' : 'true';
  seam.hidden = !hasVisibleChildren;
}

function findExistingMeta(host) {
  return host.querySelector?.(':scope > .spw-semantic-seam > .spw-component-meta, :scope > .spw-component-meta, :scope > [data-spw-slot="header"] > .spw-component-meta, :scope > .frame-topline > .spw-component-meta, :scope > .frame-heading > .spw-component-meta, :scope > figcaption > .spw-component-meta') || null;
}

function findExistingGuides(host) {
  return host.querySelector?.(':scope > .spw-semantic-seam > .spw-component-guides, :scope > .spw-component-guides, :scope > [data-spw-slot="header"] > .spw-component-guides') || null;
}

function createGeneratedContainer(className) {
  const node = document.createElement('div');
  node.className = className;
  node.dataset.spwGenerated = 'semantic-chrome';
  node.hidden = true;
  return node;
}

function ensureMetaContainer(host) {
  const existing = findExistingMeta(host);
  if (existing && existing.dataset.spwGenerated !== 'semantic-chrome') return existing;
  if (existing) return existing;

  const mount = ensureSemanticSeam(host);
  const meta = createGeneratedContainer('spw-component-meta');

  mount.append(meta);

  return meta;
}

function ensureGuideContainer(host) {
  const existing = findExistingGuides(host);
  if (existing && existing.dataset.spwGenerated !== 'semantic-chrome') return existing;
  if (existing) return existing;

  const guides = createGeneratedContainer('spw-component-guides');
  const mount = ensureSemanticSeam(host);
  const meta = findExistingMeta(host);

  if (meta?.parentElement === mount && meta.nextSibling) {
    mount.insertBefore(guides, meta.nextSibling);
  } else {
    mount.append(guides);
  }

  return guides;
}

function createMetaTag({ text, role = '', substrate = '', stance = '', title = '' }) {
  const tag = document.createElement('button');
  tag.className = 'spw-component-tag';
  tag.type = 'button';
  tag.dataset.spwGenerated = 'semantic-chrome';
  tag.textContent = text;
  tag.setAttribute('aria-haspopup', 'dialog');
  tag.setAttribute('aria-expanded', 'false');
  if (role) tag.dataset.spwRole = role;
  if (substrate) tag.dataset.spwSubstrate = substrate;
  if (stance) tag.dataset.spwStance = stance;
  tag.title = [title, 'Click for semantic note. Hold to latch.'].filter(Boolean).join(' ');
  return tag;
}

function createGuideChip({ kind, text, substrate = '', stance = '' }) {
  const chip = document.createElement('button');
  chip.className = 'spw-guide-chip';
  chip.type = 'button';
  chip.dataset.spwGenerated = 'semantic-chrome';
  chip.textContent = text;
  chip.dataset.spwGuideKind = kind;
  chip.dataset.spwGuideValue = text;
  chip.setAttribute('aria-haspopup', 'dialog');
  chip.setAttribute('aria-expanded', 'false');
  chip.title = 'Click for semantic note. Hold to latch.';
  if (substrate) chip.dataset.spwSubstrate = substrate;
  if (stance) chip.dataset.spwStance = stance;
  return chip;
}

function syncChildren(container, children) {
  container.replaceChildren(...children);
  container.hidden = children.length === 0;
  updateSemanticSeamState(container.closest('.spw-semantic-seam'));
}

function buildMetaTags(host, snapshot, stance) {
  const tags = [];
  const kindText = humanizeToken(snapshot.kind);
  const roleText = humanizeToken(snapshot.role);
  const contextText = humanizeToken(snapshot.context);
  const configText = humanizeToken(snapshot.configDomain);
  const valueLayerText = humanizeToken(snapshot.valueLayer);

  if (kindText && !GENERIC_KIND_TEXTS.has(kindText)) {
    tags.push({
      kind: 'kind',
      text: kindText,
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.meaning || snapshot.kind),
    });
  }

  if (roleText && !GENERIC_ROLE_TEXTS.has(roleText)) {
    tags.push({
      kind: 'role',
      text: roleText,
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.role),
    });
  }

  if (contextText && !GENERIC_CONTEXT_TEXTS.has(contextText)) {
    tags.push({
      kind: 'context',
      text: contextText,
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.context),
    });
  }

  if (configText && configText !== 'none' && configText !== 'semantic inspection') {
    tags.push({
      kind: 'config',
      text: configText,
      role: snapshot.role,
      substrate: 'surface',
      stance,
      title: normalizeText(snapshot.configKeys.join(', ') || snapshot.configDomain),
    });
  } else if (
    valueLayerText &&
    valueLayerText !== contextText &&
    valueLayerText !== 'surface'
  ) {
    tags.push({
      kind: 'value-layer',
      text: valueLayerText,
      role: snapshot.role,
      substrate: snapshot.substrate,
      stance,
      title: normalizeText(snapshot.valueLayer),
    });
  }

  return uniqueByText(uniqueByKey(tags, (item) => `${item.kind}:${item.text}`)).slice(0, 2);
}

function buildGuideChips(host, snapshot, stance, occupiedTexts = new Set()) {
  const chips = [];

  if (host.dataset.spwRealization) {
    chips.push({
      kind: 'realization',
      text: humanizeToken(host.dataset.spwRealization),
    });
  }

  return uniqueByText(chips)
    .filter((chip) => !occupiedTexts.has(normalizeText(chip.text).toLowerCase()))
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
  const instrumentation = new Set(
    (host.dataset.spwInstrumentation || '')
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
  );

  host.dataset.spwComponentKind = host.dataset.spwComponentKind || snapshot.kind;
  host.dataset.spwStance = host.dataset.spwStance || stance;
  instrumentation.add('semantic-chrome');
  host.dataset.spwInstrumentation = [...instrumentation].join(' ');
  host.dataset.spwDebugSource ||= 'spw-semantic-chrome';

  const meta = ensureMetaContainer(host);
  const guides = ensureGuideContainer(host);
  const metaItems = buildMetaTags(host, snapshot, stance);
  const occupiedTexts = new Set(
    metaItems.map((item) => normalizeText(item.text).toLowerCase()).filter(Boolean)
  );
  const guideItems = buildGuideChips(host, snapshot, stance, occupiedTexts);

  if (meta.dataset.spwGenerated === 'semantic-chrome') {
    syncChildren(
      meta,
      metaItems.map(createMetaTag)
    );
  }

  if (guides.dataset.spwGenerated === 'semantic-chrome') {
    syncChildren(
      guides,
      guideItems.map(createGuideChip)
    );
  }
}

function renderAll(root = document) {
  collectTargets(root).forEach(renderSemanticChrome);
}

function semanticTokenTarget(node) {
  return node?.closest?.(SEMANTIC_TOKEN_SELECTOR) || null;
}

function semanticHostFor(token) {
  return token?.closest?.(TARGET_SELECTOR) || null;
}

function getSemanticHostLabel(host, snapshot) {
  return normalizeText(
    host.querySelector?.(':scope > .frame-topline .frame-sigil, :scope > .frame-heading .frame-sigil, :scope > .frame-sigil, :scope > .header-sigil')?.textContent
    || host.getAttribute('aria-label')
    || host.id
    || humanizeToken(snapshot.kind)
  );
}

function getAuthoredControlCount(host) {
  return host.querySelectorAll(
    'a[href], button:not(.spw-component-tag):not(.spw-guide-chip), input, select, textarea, summary'
  ).length;
}

function buildSemanticRows(snapshot, host) {
  const rows = [
    ['role', humanizeToken(snapshot.role)],
    ['context', humanizeToken(snapshot.context)],
  ];

  if (snapshot.substrate && snapshot.substrate !== snapshot.kind) {
    rows.push(['substrate', humanizeToken(snapshot.substrate)]);
  }

  if (snapshot.affordances?.length) {
    rows.push(['affords', snapshot.affordances.map(humanizeToken).join(' · ')]);
  }

  const authoredControls = getAuthoredControlCount(host);
  if (authoredControls) {
    rows.push(['controls', `${authoredControls} authored`]);
  }

  if (snapshot.configDomain && snapshot.configDomain !== 'none' && snapshot.configDomain !== 'semantic-inspection') {
    rows.push(['config', humanizeToken(snapshot.configDomain)]);
  }

  if (snapshot.instrumentation?.length) {
    rows.push(['instrumented', snapshot.instrumentation.map(humanizeToken).join(' · ')]);
  }

  if (snapshot.debugSource) {
    rows.push(['source', humanizeToken(snapshot.debugSource)]);
  }

  return rows.filter(([, value]) => Boolean(normalizeText(value))).slice(0, 7);
}

function buildSemanticSummary(snapshot, tokenText) {
  const meaning = normalizeText(snapshot.meaning || '');
  if (meaning && meaning.toLowerCase() !== normalizeText(snapshot.kind).toLowerCase()) {
    return meaning;
  }

  const parts = [
    tokenText && `${tokenText} is a local semantic handle.`,
    humanizeToken(snapshot.kind) && `It marks a ${humanizeToken(snapshot.kind)} acting as ${humanizeToken(snapshot.role)}.`,
    humanizeToken(snapshot.context) && `The current reading climate is ${humanizeToken(snapshot.context)}.`,
  ].filter(Boolean);

  return parts.join(' ');
}

function createSemanticPopover(token, host) {
  const snapshot = snapshotComponentSemantics(host);
  const popover = document.createElement('div');
  const heading = document.createElement('div');
  const tokenLabel = document.createElement('span');
  const hostLabel = document.createElement('span');
  const summary = document.createElement('p');
  const grid = document.createElement('div');
  const tokenText = normalizeText(token.textContent || '').toLowerCase();

  popover.className = SEMANTIC_POPOVER_CLASS;
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-modal', 'false');
  popover.setAttribute('aria-label', `${tokenText || humanizeToken(snapshot.kind)} semantic note`);
  popover.tabIndex = -1;
  popover.id = `spw-semantic-popover-${Math.random().toString(36).slice(2, 10)}`;

  heading.className = 'spw-semantic-popover-header';
  tokenLabel.className = 'spw-semantic-popover-token';
  tokenLabel.textContent = tokenText || humanizeToken(snapshot.kind);
  hostLabel.className = 'spw-semantic-popover-host';
  hostLabel.textContent = getSemanticHostLabel(host, snapshot);

  summary.className = 'spw-semantic-popover-summary';
  summary.textContent = buildSemanticSummary(snapshot, tokenText);

  grid.className = 'spw-semantic-popover-grid';
  buildSemanticRows(snapshot, host).forEach(([label, value]) => {
    const row = document.createElement('div');
    const key = document.createElement('span');
    const val = document.createElement('span');

    row.className = 'spw-semantic-popover-row';
    key.className = 'spw-semantic-popover-label';
    val.className = 'spw-semantic-popover-value';

    key.textContent = label;
    val.textContent = value;
    row.append(key, val);
    grid.append(row);
  });

  heading.append(tokenLabel, hostLabel);
  popover.append(heading, summary, grid);
  return popover;
}

function positionSemanticPopover(popover, token) {
  const rect = token.getBoundingClientRect();
  const popRect = popover.getBoundingClientRect();
  let top = rect.bottom + 10;
  let left = rect.left + rect.width / 2 - popRect.width / 2;

  left = Math.max(8, Math.min(left, window.innerWidth - popRect.width - 8));
  if (top + popRect.height > window.innerHeight - 8) {
    top = rect.top - popRect.height - 10;
  }

  popover.style.top = `${top + window.scrollY}px`;
  popover.style.left = `${left}px`;
}

function setSemanticTokenState(token, { charge = '', gesture = '', holdState = '', expanded = false } = {}) {
  if (!(token instanceof HTMLElement)) return;

  if (charge) token.dataset.spwCharge = charge;
  else delete token.dataset.spwCharge;

  if (gesture) token.dataset.spwGesture = gesture;
  else delete token.dataset.spwGesture;

  if (holdState) token.dataset.spwHoldState = holdState;
  else delete token.dataset.spwHoldState;

  token.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function initSemanticTokenInteractions() {
  let popover = null;
  let activeToken = null;
  let pressToken = null;
  let holdTimer = 0;
  let startX = 0;
  let startY = 0;
  let consumeClickFor = null;

  const dismissPopover = () => {
    if (activeToken) {
      setSemanticTokenState(activeToken);
      activeToken.removeAttribute('aria-describedby');
      activeToken = null;
    }

    if (!popover) return;

    const current = popover;
    popover = null;
    current.classList.remove('is-visible');
    current.addEventListener('transitionend', () => current.remove(), { once: true });
    window.setTimeout(() => current.remove(), 240);
  };

  const showPopover = (token, { latched = false } = {}) => {
    const host = semanticHostFor(token);
    if (!(host instanceof HTMLElement)) return;

    if (activeToken === token && popover && !latched) {
      dismissPopover();
      return;
    }

    dismissPopover();

    popover = createSemanticPopover(token, host);
    document.body.append(popover);
    positionSemanticPopover(popover, token);

    activeToken = token;
    setSemanticTokenState(token, {
      charge: latched ? 'sustained' : 'settled',
      gesture: latched ? 'armed' : 'active',
      holdState: latched ? 'latched' : 'open',
      expanded: true,
    });
    token.setAttribute('aria-describedby', popover.id);
    window.spwInterface?.activateFrame?.(host, { source: 'semantic-chrome', force: true });

    requestAnimationFrame(() => {
      popover?.classList.add('is-visible');
    });
  };

  const clearHoldTimer = () => {
    if (!holdTimer) return;
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  };

  const cancelPress = () => {
    clearHoldTimer();

    if (pressToken && pressToken !== activeToken) {
      setSemanticTokenState(pressToken);
    }

    pressToken = null;
  };

  const startPress = (token, event) => {
    cancelPress();
    pressToken = token;
    startX = event.clientX ?? 0;
    startY = event.clientY ?? 0;

    setSemanticTokenState(token, {
      charge: 'arming',
      gesture: 'charging',
      holdState: 'arming',
    });

    holdTimer = window.setTimeout(() => {
      consumeClickFor = token;
      showPopover(token, { latched: true });
      pressToken = null;
      holdTimer = 0;
    }, SEMANTIC_HOLD_MS);
  };

  const handlePointerDown = (event) => {
    const token = semanticTokenTarget(event.target);

    if (!token) {
      if (!event.target.closest?.(`.${SEMANTIC_POPOVER_CLASS}`)) {
        dismissPopover();
      }
      return;
    }

    if (event.button !== undefined && event.button !== 0) return;
    startPress(token, event);
  };

  const handlePointerMove = (event) => {
    if (!pressToken) return;

    const dx = (event.clientX ?? 0) - startX;
    const dy = (event.clientY ?? 0) - startY;
    if ((dx * dx) + (dy * dy) > (SEMANTIC_MOVE_CANCEL_PX ** 2)) {
      cancelPress();
    }
  };

  const handlePointerUp = () => {
    cancelPress();
  };

  const handleClick = (event) => {
    const token = semanticTokenTarget(event.target);

    if (!token) {
      if (!event.target.closest?.(`.${SEMANTIC_POPOVER_CLASS}`)) {
        dismissPopover();
      }
      consumeClickFor = null;
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (consumeClickFor === token) {
      consumeClickFor = null;
      return;
    }

    showPopover(token);
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      dismissPopover();
      return;
    }

    const token = semanticTokenTarget(event.target);
    if (!token) return;

    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
      event.preventDefault();
      showPopover(token);
    }
  };

  const handleFocusOut = (event) => {
    if (!activeToken) return;
    const next = event.relatedTarget;
    if (activeToken.contains(next) || popover?.contains(next)) return;
    dismissPopover();
  };

  const handleViewportChange = () => {
    dismissPopover();
  };

  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);
  document.addEventListener('pointercancel', handlePointerUp);
  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('focusout', handleFocusOut);
  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);

  return () => {
    dismissPopover();
    clearHoldTimer();
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerUp);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('focusout', handleFocusOut);
    window.removeEventListener('scroll', handleViewportChange, true);
    window.removeEventListener('resize', handleViewportChange);
  };
}

export function initSpwSemanticChrome(options = {}) {
  const root = options.root || document;
  const cleanupInteractions = initSemanticTokenInteractions();

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
      cleanupInteractions();
      document.removeEventListener('spw:component-semantics-ready', handleReady);
    },
    refresh,
  };
}
