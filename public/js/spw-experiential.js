/**
 * Spw Experiential Cohesion
 * ---------------------------------------------------------------------------
 * Purpose
 * - Add semantic depth to the static site through adaptive breadcrumbs,
 *   contextual memos, progressive operator learning, and literate bookmarks.
 * - Respond to gesture/runtime events without overwhelming the interface.
 *
 * Design rules
 * - Prefer local memos over console spam.
 * - Use roomy surfaces when available; stay compact otherwise.
 * - Let route, active frame, mode, operator, and wonder category shape output.
 * - Keep everything optional and progressive.
 */

const ROOMY_WIDTH_PX = 704;
const MEMO_TIMEOUT_MS = 2600;
const BOOKMARKS_KEY = 'spw-pins';

const OPERATOR_INFO = Object.freeze({
  '#>': { type: 'frame', label: 'frame', intent: 'orient a stable unit', wonder: 'orientation' },
  '#:': { type: 'layer', label: 'layer', intent: 'qualify interpretation', wonder: 'constraint' },
  '.':  { type: 'baseline', label: 'baseline', intent: 'settle to local default', wonder: 'memory' },
  '^':  { type: 'object', label: 'object', intent: 'hold inspectable structure', wonder: 'memory' },
  '~':  { type: 'ref', label: 'ref', intent: 'point without forcing change', wonder: 'resonance' },
  '?':  { type: 'probe', label: 'probe', intent: 'open inquiry', wonder: 'inquiry' },
  '@':  { type: 'action', label: 'action', intent: 'commit a local change', wonder: 'projection' },
  '*':  { type: 'stream', label: 'stream', intent: 'connect to event-like flow', wonder: 'resonance' },
  '&':  { type: 'merge', label: 'merge', intent: 'overlay fields visibly', wonder: 'comparison' },
  '=':  { type: 'binding', label: 'binding', intent: 'name or pin a local value', wonder: 'constraint' },
  '$':  { type: 'meta', label: 'meta', intent: 'reflect on medium or trace', wonder: 'comparison' },
  '%':  { type: 'normalize', label: 'normalize', intent: 'scale into comparability', wonder: 'constraint' },
  '!':  { type: 'pragma', label: 'pragma', intent: 'apply a runtime hint or force', wonder: 'constraint' },
  '>':  { type: 'surface', label: 'surface', intent: 'project a rendered encounter', wonder: 'projection' },

  frame: { type: 'frame', label: 'frame', intent: 'orient a stable unit', wonder: 'orientation' },
  layer: { type: 'layer', label: 'layer', intent: 'qualify interpretation', wonder: 'constraint' },
  baseline: { type: 'baseline', label: 'baseline', intent: 'settle to local default', wonder: 'memory' },
  object: { type: 'object', label: 'object', intent: 'hold inspectable structure', wonder: 'memory' },
  ref: { type: 'ref', label: 'ref', intent: 'point without forcing change', wonder: 'resonance' },
  probe: { type: 'probe', label: 'probe', intent: 'open inquiry', wonder: 'inquiry' },
  action: { type: 'action', label: 'action', intent: 'commit a local change', wonder: 'projection' },
  stream: { type: 'stream', label: 'stream', intent: 'connect to event-like flow', wonder: 'resonance' },
  merge: { type: 'merge', label: 'merge', intent: 'overlay fields visibly', wonder: 'comparison' },
  binding: { type: 'binding', label: 'binding', intent: 'name or pin a local value', wonder: 'constraint' },
  meta: { type: 'meta', label: 'meta', intent: 'reflect on medium or trace', wonder: 'comparison' },
  normalize: { type: 'normalize', label: 'normalize', intent: 'scale into comparability', wonder: 'constraint' },
  pragma: { type: 'pragma', label: 'pragma', intent: 'apply a runtime hint or force', wonder: 'constraint' },
  surface: { type: 'surface', label: 'surface', intent: 'project a rendered encounter', wonder: 'projection' },
});

const runtime = {
  pathBar: null,
  headerMemo: null,
  lastMemoTimeout: null,
};

export function initSpwExperiential() {
  initSpellBreadcrumbs();
  initContextualMemos();
  initOperatorLearning();
  initBookmarkRegistry();
  syncExperientialSurface();
}

/* ==========================================================================
   Breadcrumb spell
   ========================================================================== */

function initSpellBreadcrumbs() {
  const header = document.querySelector('header');
  if (!header) return;
  const traceHost = ensureHeaderTraceHost(header);

  let pathBar = traceHost.querySelector('.spw-spell-path');
  if (!pathBar) {
    pathBar = document.createElement('div');
    pathBar.className = 'spw-spell-path';
    pathBar.setAttribute('aria-label', 'Spw Location Spell');
    traceHost.appendChild(pathBar);
  }

  runtime.pathBar = pathBar;

  let headerMemo = traceHost.querySelector('.spw-experience-memo');
  if (!headerMemo) {
    headerMemo = document.createElement('div');
    headerMemo.className = 'spw-experience-memo';
    headerMemo.setAttribute('aria-live', 'polite');
    headerMemo.hidden = true;
    traceHost.appendChild(headerMemo);
  }

  runtime.headerMemo = headerMemo;

  const update = () => renderBreadcrumbSpell();

  window.addEventListener('popstate', update);
  window.addEventListener('hashchange', update);
  document.addEventListener('spw:frame-change', update);
  document.addEventListener('spw:mode-change', update);
  document.addEventListener('brace:committed', update);
  document.addEventListener('brace:swapped', update);

  renderBreadcrumbSpell();
}

function ensureHeaderTraceHost(header) {
  let host = header.querySelector('.spw-header-trace');
  if (host) return host;

  host = document.createElement('div');
  host.className = 'spw-header-trace';

  const nav = header.querySelector('nav');
  if (nav?.after) {
    nav.after(host);
  } else {
    header.appendChild(host);
  }

  return host;
}

function renderBreadcrumbSpell() {
  const pathBar = runtime.pathBar;
  if (!pathBar) return;

  const url = new URL(window.location.href);
  const surface = document.body?.dataset.spwSurface || 'root';
  const routeParts = url.pathname.split('/').filter(Boolean);

  const activeFrame =
    document.querySelector('.site-frame.is-active-frame')
    || (url.hash ? document.querySelector(url.hash) : null);

  const activeFrameSigil =
    activeFrame?.querySelector('.frame-sigil')?.textContent?.trim()
    || activeFrame?.id
    || null;

  const activeModeButton = document.querySelector('[data-mode-group][data-set-mode][aria-pressed="true"]');
  const activeMode = activeModeButton?.dataset.setMode || null;

  const tokens = [];
  tokens.push(nodeToken('spell-op', '#>'));
  tokens.push(nodeToken('spell-node', 'spwashi'));
  tokens.push(nodeToken('spell-op', '#:surface'));
  tokens.push(nodeToken('spell-node', `!${surface}`));

  routeParts.forEach((part, index) => {
    const isLast = index === routeParts.length - 1 && !activeFrameSigil && !activeMode;
    tokens.push(nodeToken('spell-op', '~'));
    tokens.push(nodeToken(isLast ? 'spell-node spell-current' : 'spell-node', `"${part}"`));
  });

  if (activeFrameSigil) {
    tokens.push(nodeToken('spell-sep', '→'));
    tokens.push(nodeToken('spell-node spell-current', activeFrameSigil));
  }

  if (activeMode) {
    tokens.push(nodeToken('spell-sep', '·'));
    tokens.push(nodeToken('spell-node', `[${activeMode}]`));
  }

  pathBar.innerHTML = tokens.join(' ');
}

function nodeToken(className, text) {
  return `<span class="${className}">${escapeHtml(text)}</span>`;
}

/* ==========================================================================
   Contextual memos
   ========================================================================== */

function initContextualMemos() {
  document.addEventListener('brace:charge-start', onSemanticGestureEvent);
  document.addEventListener('brace:activate', onSemanticGestureEvent);
  document.addEventListener('brace:armed', onSemanticGestureEvent);
  document.addEventListener('brace:committed', onSemanticGestureEvent);
  document.addEventListener('brace:swapped', onSemanticGestureEvent);
  document.addEventListener('brace:pinned', onSemanticGestureEvent);
}

function onSemanticGestureEvent(event) {
  const detail = event.detail || {};
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  const meta = resolveSemanticMeta(target, detail);
  applyFieldAttrs(meta);
  presentContextMemo(meta, event.type, detail);
}

function presentContextMemo(meta, eventType, detail) {
  const roomTarget = findRoomyMemoTarget(meta.target);
  const text = memoTextForEvent(meta, eventType, detail);
  if (!text) return;

  if (roomTarget) {
    const memo = ensureLocalMemo(roomTarget);
    memo.textContent = text;
    memo.hidden = false;
    roomTarget.dataset.spwMemoWonder = meta.wonder;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      memo.hidden = true;
      delete roomTarget.dataset.spwMemoWonder;
    }, MEMO_TIMEOUT_MS);
    return;
  }

  const headerMemo = runtime.headerMemo;
  if (!headerMemo) return;

  headerMemo.textContent = text;
  headerMemo.hidden = false;
  clearTimeout(runtime.lastMemoTimeout);
  runtime.lastMemoTimeout = window.setTimeout(() => {
    headerMemo.hidden = true;
  }, MEMO_TIMEOUT_MS);
}

function findRoomyMemoTarget(target) {
  const frame =
    target.closest('.site-frame')
    || target.closest('.frame-card, .frame-panel, .mode-panel');

  if (!frame) return null;
  if (frame.clientWidth < ROOMY_WIDTH_PX) return null;

  return frame.querySelector('.frame-topline, .frame-heading') || frame;
}

function ensureLocalMemo(root) {
  let memo = root.querySelector(':scope > .spw-context-memo');
  if (!memo) {
    memo = document.createElement('div');
    memo.className = 'spw-context-memo';
    memo.setAttribute('aria-live', 'polite');
    memo.hidden = true;
    root.appendChild(memo);
  }
  return memo;
}

function memoTextForEvent(meta, eventType, detail) {
  switch (eventType) {
    case 'brace:charge-start':
      return memoForCharge(meta);
    case 'brace:activate':
      return memoForActivate(meta);
    case 'brace:armed':
      return memoForArmed(meta);
    case 'brace:committed':
      return memoForCommitted(meta, detail);
    case 'brace:swapped':
      return `swap: ${detail.from || meta.operator} → ${detail.to || meta.operator}`;
    case 'brace:pinned':
      return detail.pinned ? `pinned as ${meta.wonder}` : `unpinned ${meta.label}`;
    default:
      return null;
  }
}

function memoForCharge(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: hold to arm swap`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: hold to arm pin`;
  }
  if (meta.affordances.includes('navigate')) {
    return `${meta.label}: orient and follow`;
  }
  return `${meta.label}: ${meta.intent}`;
}

function memoForActivate(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: press engages, hold prepares change`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: press engages, hold prepares memory`;
  }
  return `${meta.label}: ${meta.intent}`;
}

function memoForArmed(meta) {
  if (meta.affordances.includes('swap')) {
    return `${meta.label}: release to cycle operator`;
  }
  if (meta.affordances.includes('pin')) {
    return `${meta.label}: release to latch into bookmarks`;
  }
  if (meta.affordances.includes('toggle')) {
    return `${meta.label}: release to commit toggle`;
  }
  return `${meta.label}: armed`;
}

function memoForCommitted(meta, detail) {
  if (detail.affordance === 'swap') {
    return `${meta.label}: operator cycled`;
  }
  if (detail.affordance === 'pin') {
    return `${meta.label}: stored for return`;
  }
  if (detail.affordance === 'toggle') {
    return `${meta.label}: local state committed`;
  }
  return `${meta.label}: committed`;
}

/* ==========================================================================
   Operator learning
   ========================================================================== */

function initOperatorLearning() {
  document.addEventListener('mouseenter', onOperatorLearn, true);
  document.addEventListener('focusin', onOperatorLearn, true);
}

function onOperatorLearn(event) {
  const target = event.target instanceof Element
    ? event.target.closest('.frame-sigil, .operator-chip, [data-spw-operator], .spw-delimiter')
    : null;

  if (!target) return;

  const meta = resolveSemanticMeta(target);
  if (!meta.operator) return;

  applyFieldAttrs(meta);

  const roomTarget = findRoomyMemoTarget(target);
  const text = learningMemo(meta);

  if (roomTarget) {
    const memo = ensureLocalMemo(roomTarget);
    memo.textContent = text;
    memo.hidden = false;
    roomTarget.dataset.spwMemoWonder = meta.wonder;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      memo.hidden = true;
      delete roomTarget.dataset.spwMemoWonder;
    }, MEMO_TIMEOUT_MS);
  } else if (runtime.headerMemo) {
    runtime.headerMemo.textContent = text;
    runtime.headerMemo.hidden = false;
    clearTimeout(runtime.lastMemoTimeout);
    runtime.lastMemoTimeout = window.setTimeout(() => {
      runtime.headerMemo.hidden = true;
    }, MEMO_TIMEOUT_MS);
  }
}

function learningMemo(meta) {
  const base = `${meta.operatorLabel}: ${meta.intent}`;
  if (meta.targetKind === 'delimiter') {
    return `${base} · delimiter grammar for ${meta.context}`;
  }
  if (meta.affordances.includes('swap')) {
    return `${base} · this handle can cycle instantiation`;
  }
  if (meta.affordances.includes('pin')) {
    return `${base} · this handle can be remembered`;
  }
  return base;
}

/* ==========================================================================
   Bookmark registry
   ========================================================================== */

function initBookmarkRegistry() {
  const root = document.querySelector('[data-spw-bookmarks-root]');
  if (!root) return;

  const render = () => {
    const pins = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '{}');
    const values = Object.values(pins);

    if (!values.length) {
      root.innerHTML = '<p class="inline-note">No pinned frames yet. Hold a roomy frame or sigil long enough to arm a pin, then release.</p>';
      return;
    }

    const grouped = groupPins(values);
    const parts = [
      '<pre><code>',
      '<span class="spell-op">^[</span><span class="spell-node">pinned_frames</span><span class="spell-op">]</span><span class="spell-sep">{</span>\n',
    ];

    Object.entries(grouped).forEach(([group, pinsInGroup]) => {
      parts.push(`  <span class="spell-op">${escapeHtml(group)}</span><span class="spell-sep">:</span>\n`);
      pinsInGroup.forEach((pin) => {
        const date = safeDate(pin.timestamp);
        parts.push(
          `    <span class="spell-node">${escapeHtml(pin.id)}</span> `,
          `<span class="spell-op">~</span>`,
          `<a href="${escapeAttribute(pin.page)}#${escapeAttribute(pin.id)}" class="spell-node">"${escapeHtml(pin.page)}"</a> `,
          `<span class="spell-meta">(${escapeHtml(date)} · ${escapeHtml(pin.operator || 'frame')} · ${escapeHtml(pin.wonder || 'memory')})</span>\n`
        );
      });
    });

    parts.push('<span class="spell-sep">}</span></code></pre>');
    root.innerHTML = parts.join('');

    const clearBtn = document.createElement('button');
    clearBtn.className = 'operator-chip';
    clearBtn.style.marginTop = '1rem';
    clearBtn.innerHTML = '<span class="spell-op">!</span> reset_pins';
    clearBtn.addEventListener('click', () => {
      localStorage.removeItem(BOOKMARKS_KEY);
      document.querySelectorAll('[data-spw-pinned]').forEach((el) => {
        delete el.dataset.spwPinned;
        delete el.dataset.spwLatched;
      });
      render();
    });

    root.appendChild(clearBtn);
  };

  render();

  window.addEventListener('storage', (e) => {
    if (e.key === BOOKMARKS_KEY) render();
  });

  document.addEventListener('brace:pinned', render);
}

function groupPins(pins) {
  return pins.reduce((acc, pin) => {
    const key = pin.wonder || 'memory';
    if (!acc[key]) acc[key] = [];
    acc[key].push(pin);
    return acc;
  }, {});
}

/* ==========================================================================
   Surface sync
   ========================================================================== */

function syncExperientialSurface() {
  const surface = document.body?.dataset.spwSurface || 'root';
  document.documentElement.dataset.spwExperientialSurface = surface;
}

function applyFieldAttrs(meta) {
  const root =
    meta.target.closest('.site-frame')
    || meta.target.closest('main')
    || document.body;

  if (!(root instanceof HTMLElement)) return;

  root.dataset.spwFieldWonder = meta.wonder;
  root.dataset.spwFieldOperator = meta.operator || '';
  root.dataset.spwFieldContext = meta.context || '';
}

/* ==========================================================================
   Semantic resolution helpers
   ========================================================================== */

function resolveSemanticMeta(target, detail = {}) {
  const sigil = extractSigil(target);
  const opInfo =
    OPERATOR_INFO[detail.operator]
    || OPERATOR_INFO[sigil]
    || OPERATOR_INFO[target.dataset.spwOperator]
    || inferOperatorInfoFromText(target);

  const affordances = normalizeAffordances(detail.affordances, target);
  const label =
    target.querySelector?.('.frame-sigil, .frame-card-sigil')?.textContent?.trim()
    || target.textContent?.trim()
    || opInfo?.label
    || 'handle';

  return {
    target,
    targetKind: detail.targetKind || inferTargetKind(target),
    operator: opInfo?.type || detail.operator || target.dataset.spwOperator || '',
    operatorLabel: opInfo?.label || detail.operator || target.dataset.spwOperator || 'operator',
    intent: opInfo?.intent || 'make structure inspectable',
    wonder: detail.wonder || opInfo?.wonder || inferWonder(target),
    affordances,
    context: detail.context || inferContext(target),
    label,
  };
}

function extractSigil(target) {
  const text =
    target.dataset.spwSigil
    || target.textContent
    || '';

  const match = text.trim().match(/^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>)/);
  return match?.[0] || '';
}

function inferOperatorInfoFromText(target) {
  const sigil = extractSigil(target);
  return OPERATOR_INFO[sigil] || null;
}

function normalizeAffordances(detailAffordances, target) {
  if (Array.isArray(detailAffordances) && detailAffordances.length) {
    return detailAffordances;
  }

  const attrs = target.dataset.spwResolvedAffordance || target.dataset.spwAffordance || '';
  if (attrs) return attrs.split(/\s+/).filter(Boolean);

  const out = [];
  if (target.matches('a[href], .operator-chip[href], .frame-sigil[href]')) out.push('navigate');
  if (target.closest('[data-spw-swappable]') || target.hasAttribute('data-spw-swappable')) out.push('swap');
  if (target.matches('.site-frame, .frame-card, .frame-panel, .frame-sigil, .frame-card-sigil')) out.push('pin');
  if (!out.length) out.push('hint');
  return out;
}

function inferTargetKind(target) {
  if (target.matches('.frame-sigil')) return 'frame-sigil';
  if (target.matches('.frame-card-sigil')) return 'frame-card-sigil';
  if (target.matches('.operator-chip')) return 'operator-chip';
  if (target.matches('.spw-delimiter')) return 'delimiter';
  if (target.matches('.site-frame')) return 'frame';
  if (target.matches('.frame-card')) return 'card';
  return 'handle';
}

function inferWonder(target) {
  if (target.matches('.spw-delimiter')) return 'orientation';
  if (target.matches('.operator-chip')) return 'inquiry';
  if (target.matches('.frame-sigil, .frame-card-sigil')) return 'memory';
  return 'orientation';
}

function inferContext(target) {
  return (
    target.dataset.spwContext
    || target.closest('[data-spw-context]')?.dataset.spwContext
    || target.closest('.site-frame')?.dataset.spwRole
    || document.body?.dataset.spwSurface
    || 'surface'
  );
}

/* ==========================================================================
   Utilities
   ========================================================================== */

function safeDate(timestamp) {
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return 'unknown-date';
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
