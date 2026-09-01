import {
  READING_BEAT_CURRENT_ATTR,
  READING_BEAT_FOCUS_ATTR,
  READING_BEAT_INDEX_ATTR,
  READING_BEAT_ROLE_ATTR,
  READING_BEAT_STATE_ATTR,
  READING_GROOVE_ATTR,
  READING_GROOVE_COUNT_ATTR,
  READING_GROOVE_MIN_BEATS,
  READING_GROOVE_MODE_ATTR,
  READING_GROOVE_SCOPED_SELECTOR,
  READING_GROOVE_SELECTOR,
  clearAttributes,
  getRootPreference,
  resolveAttentionMain,
  writeAttributes,
} from './shared.js';

function resolveReadingScope(root) {
  if (root?.matches?.('main')) return root;
  if (root?.nodeType === 9) return root.querySelector('main') || root;
  return root?.closest?.('main') || root?.querySelector?.('main') || root;
}

function collectReadingBeats(root) {
  if (!root?.querySelectorAll) return [];
  const selector = root.matches?.('main') ? READING_GROOVE_SCOPED_SELECTOR : READING_GROOVE_SELECTOR;
  return Array.from(root.querySelectorAll(selector)).filter((node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (!node.closest('main')) return false;
    if (node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
    const text = node.textContent?.trim() || '';
    if (text.length < 24) return false;
    return true;
  });
}

function describeReadingBeatRole(node) {
  if (!(node instanceof HTMLElement)) return 'body';
  if (node.matches('h2, h3')) return 'heading';
  if (node.matches('blockquote, figcaption')) return 'aside';
  if (node.matches('.inline-note, .frame-note')) return 'note';
  if (node.matches('li')) return 'list';
  return 'body';
}

function writeReadingGrooveState(beats, leadIndex) {
  beats.forEach((beat, index) => {
    const distance = Math.abs(index - leadIndex);
    let state = 'rest';
    if (index === leadIndex) state = 'lead';
    else if (distance <= 2) state = 'near';

    writeAttributes(beat, {
      [READING_BEAT_STATE_ATTR]: state,
      [READING_BEAT_CURRENT_ATTR]: index === leadIndex ? 'true' : 'false',
      [READING_BEAT_FOCUS_ATTR]: distance <= 1 ? 'tight' : distance === 2 ? 'wide' : 'ambient',
    });
  });
}

function isReadingGrooveEnabled(doc = document) {
  return getRootPreference('spwReadingGrooveMode', 'on', doc) !== 'off';
}

export function initReadingGroove(root) {
  const scope = resolveReadingScope(root);
  const beats = collectReadingBeats(scope);
  if (beats.length < READING_GROOVE_MIN_BEATS) return () => {};
  if (typeof IntersectionObserver !== 'function' || typeof MutationObserver !== 'function') {
    return () => {};
  }

  const doc = scope?.nodeType === 9 ? scope : scope?.ownerDocument || document;
  const abort = new AbortController();
  const { signal } = abort;

  const syncReadingGroovePreference = () => {
    [doc.documentElement, doc.body].forEach((node) => {
      writeAttributes(node, {
        [READING_GROOVE_ATTR]: isReadingGrooveEnabled(doc) ? 'on' : 'off',
        [READING_GROOVE_COUNT_ATTR]: beats.length,
      });
    });
  };

  syncReadingGroovePreference();

  beats.forEach((beat, index) => {
    writeAttributes(beat, {
      [READING_BEAT_INDEX_ATTR]: index + 1,
      [READING_BEAT_ROLE_ATTR]: describeReadingBeatRole(beat),
    });
  });

  const state = {
    leadIndex: 0,
    raf: 0,
    visible: new Set(),
  };

  // getBoundingClientRect on every beat forces layout against the full
  // stylesheet; only measure the visible set the observer maintains, and
  // resolve indexes through a map instead of O(n) indexOf per candidate.
  const beatIndexes = new Map(beats.map((beat, index) => [beat, index]));

  const resolveLeadIndex = () => {
    const anchorY = Math.min(Math.max(window.innerHeight * 0.38, 120), 320);
    if (!state.visible.size) return Math.max(0, state.leadIndex);
    let bestIndex = state.leadIndex;
    let bestDistance = Number.POSITIVE_INFINITY;

    state.visible.forEach((beat) => {
      const rect = beat.getBoundingClientRect();
      const center = rect.top + (rect.height * 0.45);
      const distance = Math.abs(center - anchorY);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = beatIndexes.get(beat) ?? state.leadIndex;
      }
    });

    return Math.max(0, bestIndex);
  };

  const update = () => {
    state.raf = 0;
    const nextLeadIndex = resolveLeadIndex();
    if (nextLeadIndex === state.leadIndex && beats[state.leadIndex]?.hasAttribute(READING_BEAT_STATE_ATTR)) return;
    state.leadIndex = nextLeadIndex;
    writeReadingGrooveState(beats, state.leadIndex);
  };

  const scheduleUpdate = () => {
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const target = entry.target;
      if (!(target instanceof HTMLElement)) return;
      if (entry.isIntersecting && entry.intersectionRatio > 0.08) {
        state.visible.add(target);
      } else {
        state.visible.delete(target);
      }
    });
    scheduleUpdate();
  }, {
    root: null,
    rootMargin: '-12% 0px -42% 0px',
    threshold: [0, 0.08, 0.2, 0.4, 0.66, 1],
  });

  beats.forEach((beat) => observer.observe(beat));
  // Let the IntersectionObserver populate the visible set before the first
  // resolve; a synchronous full-beats pass at mount stalls the main thread.
  scheduleUpdate();

  const onResize = () => scheduleUpdate();
  const preferenceObserver = new MutationObserver(() => {
    syncReadingGroovePreference();
  });

  const view = doc.defaultView || window;
  view.addEventListener('resize', onResize, { passive: true, signal });
  view.addEventListener('orientationchange', onResize, { signal });
  preferenceObserver.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [READING_GROOVE_MODE_ATTR],
  });

  return () => {
    abort.abort();
    observer.disconnect();
    preferenceObserver.disconnect();
    if (state.raf) {
      view.cancelAnimationFrame(state.raf);
      state.raf = 0;
    }
    beats.forEach((beat) => {
      clearAttributes(beat, [
        READING_BEAT_STATE_ATTR,
        READING_BEAT_INDEX_ATTR,
        READING_BEAT_ROLE_ATTR,
        READING_BEAT_CURRENT_ATTR,
        READING_BEAT_FOCUS_ATTR,
      ]);
    });
    [doc.documentElement, doc.body].forEach((node) => {
      clearAttributes(node, [
        READING_GROOVE_ATTR,
        READING_GROOVE_COUNT_ATTR,
      ]);
    });
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'attention-reading-groove',
  mount: (ctx, root) => initReadingGroove(
    resolveAttentionMain(ctx, root) || resolveReadingScope(root),
  ),
  describes: 'attention[reading-groove|beat-state] optional long-form reading locus',
  timingArc: 'idle-attention',
  effectScope: 'root-state element-state intersection-observer preference-observer',
});

export const spwModule = SPW_MODULE_EXPORT;
