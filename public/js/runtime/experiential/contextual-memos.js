/**
 * Contextual memo rendering and semantic gesture event handling.
 */

import { applyFieldAttrs, resolveSemanticMeta } from './semantic-meta.js';
import { createMemoPresenter } from './memo-surface.js';

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
  const presentMemo = createMemoPresenter(options);

  const onSemanticGestureEvent = (event) => {
    const detail = event.detail || {};
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const meta = resolveSemanticMeta(target, detail);
    applyFieldAttrs(meta);
    presentMemo(meta, memoTextForEvent(meta, event.type, detail));
  };

  document.addEventListener('brace:charge-start', onSemanticGestureEvent);
  document.addEventListener('brace:activate', onSemanticGestureEvent);
  document.addEventListener('brace:armed', onSemanticGestureEvent);
  document.addEventListener('brace:committed', onSemanticGestureEvent);
  document.addEventListener('brace:swapped', onSemanticGestureEvent);
  document.addEventListener('brace:pinned', onSemanticGestureEvent);
}
