import {
  annotateFloatingChromeElement,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';

/**
 * Page state models the visible lifecycle of a page shell: booting,
 * interaction, arrival, and whether the browser is foregrounded or returned.
 */
export const PAGE_STATES = Object.freeze({
  BOOTING: 'booting',
  INTERACTIVE: 'interactive',
  HYDRATED: 'hydrated',
  REGION_ENHANCED: 'region-enhanced',
  ENHANCED: 'enhanced',
});

export const PAGE_PRESENCE = Object.freeze({
  FOREGROUND: 'foreground',
  BACKGROUND: 'background',
});

export const PAGE_ARRIVAL = Object.freeze({
  ENTERING: 'entering',
  RETURNING: 'returning',
  RESTORED: 'restored',
  SETTLED: 'settled',
});

export const PAGE_ATTENTION_EVENT = 'spw:page-attention-state';
export const PAGE_TRANSITION_EVENT = 'spw:page-transition-state';

/**
 * Compact contract for page-state consumers and console readers.
 */
export const SPW_PAGE_STATE_CONTRACT = Object.freeze({
  states: PAGE_STATES,
  presence: PAGE_PRESENCE,
  arrival: PAGE_ARRIVAL,
  events: Object.freeze({
    attention: PAGE_ATTENTION_EVENT,
    transition: PAGE_TRANSITION_EVENT,
  }),
  portableUse:
    'Use this module when page attention, arrival, visibility, or transition state needs to be tracked and narrated consistently.',
});

const PAGE_ARRIVAL_STEP_SEQUENCE = Object.freeze([
  { step: '1', token: '--spw-page-arrival-step-1-delay', fallback: 0 },
  { step: '2', token: '--spw-page-arrival-step-2-delay', fallback: 64 },
  { step: '3', token: '--spw-page-arrival-step-3-delay', fallback: 148 },
]);

const FLOATING_CHROME_SELECTOR = '.skip-link, .spw-section-handle, .spw-section-handle-shell';

const parseCssTimeMs = (value, fallback = 0) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;
  const numeric = Number.parseFloat(raw);
  if (!Number.isFinite(numeric)) return fallback;
  return raw.endsWith('s') && !raw.endsWith('ms') ? numeric * 1000 : numeric;
};

const readRootTimeToken = (name, fallback = 0) => {
  if (!name || typeof getComputedStyle !== 'function') return fallback;
  return parseCssTimeMs(getComputedStyle(document.documentElement).getPropertyValue(name), fallback);
};

const prefersReducedMotion = () => (
  document.documentElement.dataset.spwReduceMotion === 'on'
  || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
);

export function annotateFloatingChrome(root = document) {
  if (!root?.querySelectorAll) return;
  root.querySelectorAll(FLOATING_CHROME_SELECTOR).forEach((element) => {
    annotateFloatingChromeElement(element, {
      role: element.classList?.contains('skip-link')
        ? 'skip-link'
        : element.classList?.contains('spw-section-handle-shell')
          ? 'section-handle-shell'
          : 'section-handle',
      tier: element.classList?.contains('skip-link') ? 'priority' : 'floating',
      mutator: 'page-state',
      reason: 'floating-chrome-annotation',
      stylingAxis: 'page-chrome',
    });
  });
}

export function setPageState(state, root = document.documentElement) {
  writeDatasetValue(root, 'spwPageState', state);
}

const derivePageTransitionState = (detail = {}) => {
  const html = document.documentElement;
  const presence = detail.presence || html.dataset.spwPagePresence || PAGE_PRESENCE.FOREGROUND;
  const arrival = detail.arrival || html.dataset.spwPageArrival || PAGE_ARRIVAL.SETTLED;
  const step = String(detail.step ?? html.dataset.spwPageArrivalStep ?? '0');
  const phase = presence === PAGE_PRESENCE.BACKGROUND
    ? PAGE_PRESENCE.BACKGROUND
    : arrival === PAGE_ARRIVAL.SETTLED
      ? PAGE_ARRIVAL.SETTLED
      : arrival;
  const transition = presence === PAGE_PRESENCE.BACKGROUND
    ? PAGE_PRESENCE.BACKGROUND
    : `${phase}${step !== '0' && phase !== PAGE_ARRIVAL.SETTLED ? `-${step}` : ''}`;
  return {
    presence,
    arrival,
    step,
    phase,
    transition,
  };
};

export const setPageAttentionState = (ctx, detail = {}) => {
  const html = document.documentElement;
  const transition = derivePageTransitionState(detail);

  writeDatasetValue(html, 'spwPagePresence', transition.presence);
  writeDatasetValue(html, 'spwPageArrival', transition.arrival);
  writeDatasetValue(html, 'spwPageArrivalStep', transition.step);
  writeDatasetValue(html, 'spwPageTransition', transition.transition);
  writeDatasetValue(html, 'spwPageTransitionPhase', transition.phase);
  writeDatasetValue(html, 'spwPageSettling',
    transition.presence === PAGE_PRESENCE.FOREGROUND
      && transition.arrival !== PAGE_ARRIVAL.SETTLED
      ? 'true'
      : null
  );
  writeDatasetValue(html, 'spwLayoutSettlePhase',
    transition.presence === PAGE_PRESENCE.FOREGROUND
      && transition.arrival !== PAGE_ARRIVAL.SETTLED
      ? (transition.step !== '0' ? transition.step : transition.arrival)
      : null
  );
  writeDatasetValue(html, 'spwAttentionContext',
    transition.presence === PAGE_PRESENCE.BACKGROUND
      ? 'background'
      : transition.phase === PAGE_ARRIVAL.SETTLED
        ? 'settled'
        : transition.phase
  );

  const payload = {
    ...transition,
    reason: detail.reason || 'runtime',
    route: ctx?.route || document.body?.dataset?.spwSurface || 'default',
  };

  if (ctx?.bus?.emit) {
    ctx.bus.emit(PAGE_ATTENTION_EVENT, payload);
    ctx.bus.emit(PAGE_TRANSITION_EVENT, payload);
  } else {
    document.dispatchEvent(new CustomEvent(PAGE_ATTENTION_EVENT, { detail: payload }));
    document.dispatchEvent(new CustomEvent(PAGE_TRANSITION_EVENT, { detail: payload }));
  }
};

export const clearPageAttentionSequence = (ctx) => {
  if (!ctx?.pageAttentionTimers?.size) return;
  ctx.pageAttentionTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
    ctx.timers.delete(timerId);
  });
  ctx.pageAttentionTimers.clear();
};

const addManagedTimeout = (ctx, callback, delay) => {
  const timerId = window.setTimeout(() => {
    ctx?.pageAttentionTimers?.delete(timerId);
    ctx?.timers?.delete(timerId);
    callback();
  }, delay);

  ctx?.pageAttentionTimers?.add(timerId);
  ctx?.addTimer?.(timerId);
  return timerId;
};

export const schedulePageArrival = (ctx, arrival = PAGE_ARRIVAL.ENTERING, reason = 'page-enter') => {
  if (!ctx) return;

  clearPageAttentionSequence(ctx);

  if (prefersReducedMotion()) {
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason,
    });
    return;
  }

  PAGE_ARRIVAL_STEP_SEQUENCE.forEach(({ step, token, fallback }) => {
    addManagedTimeout(ctx, () => {
      setPageAttentionState(ctx, {
        presence: PAGE_PRESENCE.FOREGROUND,
        arrival,
        step,
        reason,
      });
    }, readRootTimeToken(token, fallback));
  });

  const settleDelayToken = arrival === PAGE_ARRIVAL.RETURNING
    ? '--spw-page-return-duration'
    : '--spw-page-arrival-duration';
  const settleDelayFallback = arrival === PAGE_ARRIVAL.RETURNING ? 180 : 280;

  addManagedTimeout(ctx, () => {
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: `${reason}-settled`,
    });
  }, readRootTimeToken(settleDelayToken, settleDelayFallback));
};

export function initPageAttentionLifecycle(ctx) {
  if (!ctx) return () => {};

  const handleVisibilityChange = () => {
    if (document.hidden) {
      clearPageAttentionSequence(ctx);
      setPageAttentionState(ctx, {
        presence: PAGE_PRESENCE.BACKGROUND,
        arrival: PAGE_ARRIVAL.SETTLED,
        step: '0',
        reason: 'visibility-hidden',
      });
      return;
    }

    schedulePageArrival(ctx, PAGE_ARRIVAL.RETURNING, 'visibility-visible');
  };

  const handlePageShow = (event) => {
    if (!event.persisted) return;
    schedulePageArrival(ctx, PAGE_ARRIVAL.RESTORED, 'pageshow-restored');
  };

  const handlePageHide = () => {
    clearPageAttentionSequence(ctx);
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.BACKGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: 'pagehide',
    });
  };

  annotateFloatingChrome(document);

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('pagehide', handlePageHide);

  setPageAttentionState(ctx, {
    presence: document.hidden ? PAGE_PRESENCE.BACKGROUND : PAGE_PRESENCE.FOREGROUND,
    arrival: PAGE_ARRIVAL.SETTLED,
    step: '0',
    reason: 'page-init',
  });

  return () => {
    clearPageAttentionSequence(ctx);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('pagehide', handlePageHide);
  };
}

export function snapshotPageState(root = document.documentElement, body = document.body) {
  const htmlDataset = root?.dataset || {};
  const bodyDataset = body?.dataset || {};
  const state = htmlDataset.spwPageState || '';
  if (!state) return null;

  return {
    state,
    presence: htmlDataset.spwPagePresence || PAGE_PRESENCE.FOREGROUND,
    arrival: htmlDataset.spwPageArrival || PAGE_ARRIVAL.SETTLED,
    step: htmlDataset.spwPageArrivalStep || '0',
    transition: htmlDataset.spwPageTransition || '',
    phase: htmlDataset.spwPageTransitionPhase || '',
    attentionContext: htmlDataset.spwAttentionContext || '',
    harmonyField: htmlDataset.spwHarmonyField || '',
    tempoField: htmlDataset.spwTempoField || '',
    bodyState: bodyDataset.spwPageState || '',
  };
}

/**
 * Convert a page-state snapshot into a human-readable sentence.
 */
export function describePageStateSnapshot(snapshot) {
  if (!snapshot) return 'page state unavailable';

  const parts = [
    `state:${snapshot.state}`,
    `presence:${snapshot.presence}`,
    `arrival:${snapshot.arrival}`,
  ];

  if (snapshot.transition) parts.push(`transition:${snapshot.transition}`);
  if (snapshot.attentionContext) parts.push(`attention:${snapshot.attentionContext}`);

  return parts.join(' · ');
}

export function clearPageState(root = document.documentElement, body = document.body) {
  if (root?.dataset) {
    delete root.dataset.spwPageState;
    delete root.dataset.spwPagePresence;
    delete root.dataset.spwPageArrival;
    delete root.dataset.spwPageArrivalStep;
    delete root.dataset.spwPageTransition;
    delete root.dataset.spwPageTransitionPhase;
    delete root.dataset.spwPageSettling;
    delete root.dataset.spwLayoutSettlePhase;
    delete root.dataset.spwAttentionContext;
    delete root.dataset.spwHarmonyField;
    delete root.dataset.spwTempoField;
  }

  if (body?.dataset) {
    delete body.dataset.spwPageState;
    delete body.dataset.spwPagePresence;
    delete body.dataset.spwPageArrival;
    delete body.dataset.spwPageArrivalStep;
    delete body.dataset.spwPageTransition;
    delete body.dataset.spwPageTransitionPhase;
    delete body.dataset.spwAttentionContext;
    delete body.dataset.spwHarmonyField;
    delete body.dataset.spwTempoField;
  }
}
