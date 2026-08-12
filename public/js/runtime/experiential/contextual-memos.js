/**
 * Contextual memo rendering and semantic gesture event handling.
 */

import { OPERATOR_INFO } from './operator-info.js';

const MEMO_TIMEOUT_MS = 2600;
const ROOMY_WIDTH_PX = 704;

function extractSigil(target) {
  const text =
    target.dataset.spwSigil
    || target.textContent
    || '';

  const match = text.trim().match(/^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>)/);
  return match?.[0] || '';
}

function inferOperatorInfoFromText(target) {
  const explicit = target.dataset.spwOperator || target.closest('[data-spw-operator]')?.dataset.spwOperator || '';
  if (explicit && OPERATOR_INFO[explicit]) {
    return OPERATOR_INFO[explicit];
  }

  const sigil = extractSigil(target);
  return OPERATOR_INFO[sigil] || null;
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
  const opInfo = inferOperatorInfoFromText(target);
  if (opInfo?.wonder) return opInfo.wonder;
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

function normalizeAffordances(detailAffordances, target) {
  if (Array.isArray(detailAffordances) && detailAffordances.length) {
    return detailAffordances;
  }

  const attrs = target.dataset.spwResolvedAffordance || target.dataset.spwAffordance || '';
  if (attrs) return attrs.split(/\s+/).filter(Boolean);

  const out = [];
  const opInfo = inferOperatorInfoFromText(target);
  if (target.matches('a[href], .operator-chip[href], .frame-sigil[href]')) out.push('navigate');
  if (opInfo?.type === 'probe') out.push('explore');
  if (opInfo?.type === 'pragma' || opInfo?.type === 'action') out.push('commit');
  if (target.closest('[data-spw-swappable]') || target.hasAttribute('data-spw-swappable')) out.push('swap');
  if (target.matches('.site-frame, .frame-card, .frame-panel, .frame-sigil, .frame-card-sigil')) out.push('pin');
  if (!out.length) out.push('hint');
  return [...new Set(out)];
}

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

function applyFieldAttrs(meta) {
  const root =
    meta.target.closest('.site-frame')
    || meta.target.closest('main')
    || document.body;

  if (!(root instanceof HTMLElement)) return;

  root.dataset.spwInspectFieldWonder = meta.wonder;
  root.dataset.spwInspectFieldOperator = meta.operator || '';
  root.dataset.spwInspectFieldContext = meta.context || '';
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

function memoForCharge(meta) {
  if (meta.affordances.includes('swap')) return `${meta.label}: hold to arm swap`;
  if (meta.affordances.includes('pin')) return `${meta.label}: hold to arm pin`;
  if (meta.affordances.includes('navigate')) return `${meta.label}: orient and follow`;
  return `${meta.label}: ${meta.intent}`;
}

function memoForActivate(meta) {
  if (meta.affordances.includes('swap')) return `${meta.label}: press engages, hold prepares change`;
  if (meta.affordances.includes('pin')) return `${meta.label}: press engages, hold prepares memory`;
  return `${meta.label}: ${meta.intent}`;
}

function memoForArmed(meta) {
  if (meta.affordances.includes('swap')) return `${meta.label}: release to cycle operator`;
  if (meta.affordances.includes('pin')) return `${meta.label}: release to latch into bookmarks`;
  if (meta.affordances.includes('toggle')) return `${meta.label}: release to commit toggle`;
  return `${meta.label}: armed`;
}

function memoForCommitted(meta, detail) {
  if (detail.affordance === 'swap') return `${meta.label}: operator cycled`;
  if (detail.affordance === 'pin') return `${meta.label}: stored for return`;
  if (detail.affordance === 'toggle') return `${meta.label}: local state committed`;
  return `${meta.label}: committed`;
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

export function initContextualMemos(options = {}) {
  let lastMemoTimeout = null;

  const presentContextMemo = (meta, eventType, detail) => {
    const roomTarget = findRoomyMemoTarget(meta.target);
    const text = memoTextForEvent(meta, eventType, detail);
    if (!text) return;

    if (roomTarget) {
      const memo = ensureLocalMemo(roomTarget);
      memo.textContent = text;
      memo.hidden = false;
      roomTarget.dataset.spwMemoWonder = meta.wonder;
      clearTimeout(lastMemoTimeout);
      lastMemoTimeout = window.setTimeout(() => {
        memo.hidden = true;
        delete roomTarget.dataset.spwMemoWonder;
      }, MEMO_TIMEOUT_MS);
      return;
    }

    const headerMemo = options.getHeaderMemo?.() || null;
    if (!headerMemo) return;

    headerMemo.textContent = text;
    headerMemo.hidden = false;
    clearTimeout(lastMemoTimeout);
    lastMemoTimeout = window.setTimeout(() => {
      headerMemo.hidden = true;
    }, MEMO_TIMEOUT_MS);
  };

  const onSemanticGestureEvent = (event) => {
    const detail = event.detail || {};
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const meta = resolveSemanticMeta(target, detail);
    applyFieldAttrs(meta);
    presentContextMemo(meta, event.type, detail);
  };

  document.addEventListener('brace:charge-start', onSemanticGestureEvent);
  document.addEventListener('brace:activate', onSemanticGestureEvent);
  document.addEventListener('brace:armed', onSemanticGestureEvent);
  document.addEventListener('brace:committed', onSemanticGestureEvent);
  document.addEventListener('brace:swapped', onSemanticGestureEvent);
  document.addEventListener('brace:pinned', onSemanticGestureEvent);
}
