/**
 * Progressive operator learning for discoverability and learning science.
 */

import { applyFieldAttrs, resolveSemanticMeta } from './semantic-meta.js';
import { createMemoPresenter } from './memo-surface.js';

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

export function initOperatorLearning(options = {}) {
  const presentMemo = createMemoPresenter(options);

  const onOperatorLearn = (event) => {
    const target = event.target instanceof Element
      ? event.target.closest('.frame-sigil, .operator-chip, [data-spw-operator], .spw-delimiter')
      : null;

    if (!target) return;

    const meta = resolveSemanticMeta(target);
    if (!meta.operator) return;

    applyFieldAttrs(meta);
    presentMemo(meta, learningMemo(meta));
  };

  document.addEventListener('mouseenter', onOperatorLearn, true);
  document.addEventListener('focusin', onOperatorLearn, true);
}
