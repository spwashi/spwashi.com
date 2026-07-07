import {
  annotateFloatingChromeElement,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';

/**
 * Page state models the visible lifecycle of a page shell: booting,
 * interaction, arrival, and whether the browser is foregrounded or returned.
 *
 * Arrival doctrine: the page is born `entering` (init writes it before any
 * module mounts) and reaches `settled` exactly once per arc. Settled is
 * declared by evidence — quiescence across mount/measure/enrichment events —
 * bounded by CSS-token timers, never by a blind timeout alone. Routes may opt
 * into the declaration with body[data-spw-settle-confirm="route"] (hold settle
 * for `spw:page-settle-confirm`) and name their arrival character with
 * body[data-spw-settle-contour]; both ride the settled payload so navigation
 * chrome hears a familiar declaration while pages keep a unique contour.
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
export const PAGE_SETTLE_CONFIRM_EVENT = 'spw:page-settle-confirm';

/** How the settled end state was declared, projected as data-spw-page-settle-confirmation. */
export const PAGE_SETTLE_CONFIRMATIONS = Object.freeze({
  PENDING: 'pending',
  AUTO: 'auto',
  ROUTE: 'route',
  GUARD: 'guard',
});

/** Settle-worthy evidence: any of these arriving keeps the page in its arc. */
export const PAGE_SETTLE_EVIDENCE_EVENTS = Object.freeze([
  'spw:module-mounted',
  'spw:regions-profiled',
  'spw:pretext-measurement',
  'spw:page-hydrated',
  'spw:page-region-enhanced',
]);

/**
 * Compact contract for page-state consumers and console readers.
 */
export const SPW_PAGE_STATE_CONTRACT = Object.freeze({
  states: PAGE_STATES,
  presence: PAGE_PRESENCE,
  arrival: PAGE_ARRIVAL,
  settleConfirmations: PAGE_SETTLE_CONFIRMATIONS,
  settleEvidence: PAGE_SETTLE_EVIDENCE_EVENTS,
  events: Object.freeze({
    attention: PAGE_ATTENTION_EVENT,
    transition: PAGE_TRANSITION_EVENT,
    settleConfirm: PAGE_SETTLE_CONFIRM_EVENT,
  }),
  attributes: Object.freeze({
    /* html, runtime-written: how the last settle was declared */
    settleConfirmation: 'data-spw-page-settle-confirmation',
    /* body, route-authored: "route" holds settle for the confirm event */
    routeConfirm: 'data-spw-settle-confirm',
    /* body, route-authored: named arrival character carried on the settled payload */
    routeContour: 'data-spw-settle-contour',
  }),
  portableUse:
    'Use this module when page attention, arrival, visibility, or transition state needs to be tracked and narrated consistently. '
    + 'Settled is evidence-declared (quiescence within token bounds); routes opt in via data-spw-settle-confirm and data-spw-settle-contour on body.',
});

const PAGE_ARRIVAL_STEP_SEQUENCE = Object.freeze([
  { step: '1', token: '--spw-page-arrival-step-1-delay', fallback: 0 },
  { step: '2', token: '--spw-page-arrival-step-2-delay', fallback: 64 },
  { step: '3', token: '--spw-page-arrival-step-3-delay', fallback: 148 },
]);

const FLOATING_CHROME_SELECTOR = '.skip-link, .spw-section-handle, .spw-section-handle-shell';
const BOTTOM_FLOATING_CHROME_SELECTOR = [
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="console"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="parallel-navigator"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="section-handle"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="section-handle-shell"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="state-inspector"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="surface-map"]',
  '[data-spw-floating-chrome="true"][data-spw-chrome-role="discovery-toast-stack"]',
].join(',');

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

const computeArrivalSettleDelay = (arrival = PAGE_ARRIVAL.ENTERING) => {
  const step3 = readRootTimeToken('--spw-page-arrival-step-3-delay', 148);
  const arrivalDuration = readRootTimeToken(
    arrival === PAGE_ARRIVAL.RETURNING || arrival === PAGE_ARRIVAL.RESTORED
      ? '--spw-page-return-duration'
      : '--spw-page-arrival-duration',
    arrival === PAGE_ARRIVAL.RETURNING || arrival === PAGE_ARRIVAL.RESTORED ? 180 : 280,
  );
  const regionRefresh = readRootTimeToken('--spw-region-profile-refresh-duration', 220);
  const staggerStep = readRootTimeToken('--spw-settle-stagger-step', 18);
  const cascadeTail = step3 + regionRefresh + (staggerStep * 2);
  return Math.max(arrivalDuration, cascadeTail);
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

function isVisibleBottomFloatingChrome(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
  if (element.dataset.spwHandleState === 'hidden' || element.dataset.spwHandleShellState === 'hidden') return false;
  const style = getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  if (Number.parseFloat(style.opacity) <= 0.01) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function measureFixedViewportCorrection(root = document) {
  const html = document.documentElement;
  const viewportHeight = window.visualViewport?.height || window.innerHeight || 0;
  if (!viewportHeight) return 0;
  const activeCorrectionY = Number.parseFloat(
    getComputedStyle(html).getPropertyValue('--spw-fixed-viewport-correction-y')
  ) || 0;
  return Array.from(root.querySelectorAll?.(BOTTOM_FLOATING_CHROME_SELECTOR) || [])
    .reduce((correction, element) => {
      if (!isVisibleBottomFloatingChrome(element)) return correction;
      const style = getComputedStyle(element);
      if (style.position !== 'fixed') return correction;
      const rect = element.getBoundingClientRect();
      const bottomInset = Math.max(
        0,
        Number.parseFloat(style.bottom) || Number.parseFloat(style.insetBlockEnd) || 0,
      );
      const uncorrectedTop = rect.top - activeCorrectionY;
      const uncorrectedBottom = rect.bottom - activeCorrectionY;
      if (uncorrectedTop > viewportHeight + 24) {
        return Math.min(correction, viewportHeight - bottomInset - uncorrectedBottom);
      }
      if (uncorrectedBottom < -24) {
        return Math.max(correction, -uncorrectedTop);
      }
      return correction;
    }, 0);
}

function updateFixedViewportCorrection() {
  const html = document.documentElement;
  if (!html) return;

  const correctionY = measureFixedViewportCorrection(document);
  if (correctionY === 0) {
    html.style.removeProperty('--spw-fixed-viewport-correction-y');
    delete html.dataset.spwFixedViewportCorrection;
    return;
  }

  html.style.setProperty('--spw-fixed-viewport-correction-y', `${Math.round(correctionY)}px`);
  html.dataset.spwFixedViewportCorrection = 'on';
}

function initFixedViewportCorrection() {
  let frame = 0;
  let pollTimer = 0;
  let pollCount = 0;
  let observer = null;
  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      updateFixedViewportCorrection();
    });
  };
  const pollMountedChrome = () => {
    schedule();
    pollCount += 1;
    if (pollCount < 10) {
      pollTimer = window.setTimeout(pollMountedChrome, 180);
    }
  };

  schedule();
  pollMountedChrome();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener?.('resize', schedule, { passive: true });
  window.visualViewport?.addEventListener?.('scroll', schedule, { passive: true });
  if (typeof MutationObserver === 'function') {
    observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'class',
        'data-spw-floating-chrome',
        'data-spw-chrome-role',
        'data-spw-handle-state',
        'data-spw-state-inspector',
      ],
    });
  }

  return () => {
    if (frame) window.cancelAnimationFrame(frame);
    if (pollTimer) window.clearTimeout(pollTimer);
    observer?.disconnect();
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    window.visualViewport?.removeEventListener?.('resize', schedule);
    window.visualViewport?.removeEventListener?.('scroll', schedule);
    document.documentElement?.style?.removeProperty('--spw-fixed-viewport-correction-y');
    if (document.documentElement?.dataset) {
      delete document.documentElement.dataset.spwFixedViewportCorrection;
    }
  };
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
  if (detail.settleConfirmation) payload.settleConfirmation = detail.settleConfirmation;
  if (detail.contour) payload.contour = detail.contour;

  if (ctx?.bus?.emit) {
    ctx.bus.emit(PAGE_ATTENTION_EVENT, payload);
    ctx.bus.emit(PAGE_TRANSITION_EVENT, payload);
  } else {
    document.dispatchEvent(new CustomEvent(PAGE_ATTENTION_EVENT, { detail: payload }));
    document.dispatchEvent(new CustomEvent(PAGE_TRANSITION_EVENT, { detail: payload }));
  }
};

const teardownSettleWatch = (ctx) => {
  const watch = ctx?.pageSettleWatch;
  if (!watch) return;
  ctx.pageSettleWatch = null;
  watch.teardown();
};

export const clearPageAttentionSequence = (ctx) => {
  teardownSettleWatch(ctx);
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

const PAGE_HANDOFF_KEY = 'spw-page-handoff';
const PAGE_HANDOFF_FRESH_MS = 30000;

/**
 * Copy-editor guidance rails: forgiving query params (?contour=hearth) that a
 * link author can append to tune arrival character without touching settings.
 * Rails identify themselves (data-spw-contour-rail) and never overwrite
 * authored base attributes, per data-spw-attribute-governance.
 */
const readQueryRail = (name) => {
  try {
    const value = new URLSearchParams(window.location.search).get(name) || '';
    return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  } catch {
    return '';
  }
};

const writePageHandoff = () => {
  try {
    sessionStorage.setItem(PAGE_HANDOFF_KEY, JSON.stringify({
      path: window.location.pathname,
      at: Date.now(),
    }));
  } catch {
    /* handoff is residue, never load-bearing */
  }
};

const consumePageHandoff = () => {
  try {
    const raw = sessionStorage.getItem(PAGE_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PAGE_HANDOFF_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - (parsed.at || 0) > PAGE_HANDOFF_FRESH_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

/**
 * Intra-site navigation arrives as returning (restored when reloading the same
 * path); cold arrivals enter. The handoff is consumed once so the resolved
 * kind holds for the whole arc.
 */
export const resolveArrivalKind = () => {
  const handoff = consumePageHandoff();
  if (!handoff) return PAGE_ARRIVAL.ENTERING;
  return handoff.path === window.location.pathname ? PAGE_ARRIVAL.RESTORED : PAGE_ARRIVAL.RETURNING;
};

const readRouteSettleContract = () => {
  const body = document.body;
  return {
    confirmMode: body?.dataset?.spwSettleConfirm === 'route'
      ? PAGE_SETTLE_CONFIRMATIONS.ROUTE
      : PAGE_SETTLE_CONFIRMATIONS.AUTO,
    contour: document.documentElement.dataset.spwContourRail || body?.dataset?.spwSettleContour || '',
  };
};

/**
 * Watch for settle evidence and declare the settled end state exactly once.
 * Settled means: the arrival choreography's minimum delay has elapsed AND no
 * settle-worthy evidence arrived within the quiet window AND (for routes that
 * opted in) the route confirmed — all bounded by the max-delay token so an
 * arc can never hang.
 */
const beginSettleWatch = (ctx, arrival, reason) => {
  const html = document.documentElement;
  const { confirmMode, contour } = readRouteSettleContract();
  const minDelay = computeArrivalSettleDelay(arrival);
  const quietWindow = readRootTimeToken('--spw-page-settle-quiet-window', 160);
  const maxDelay = Math.max(minDelay, readRootTimeToken('--spw-page-settle-max-delay', minDelay + 1400));
  const startedAt = performance.now();
  let lastEvidenceAt = startedAt;
  let quietTimer = 0;
  let maxTimer = 0;

  writeDatasetValue(html, 'spwPageSettleConfirmation', PAGE_SETTLE_CONFIRMATIONS.PENDING);

  const onEvidence = () => {
    lastEvidenceAt = performance.now();
    scheduleQuietCheck();
  };

  const teardown = () => {
    if (quietTimer) window.clearTimeout(quietTimer);
    if (maxTimer) window.clearTimeout(maxTimer);
    quietTimer = 0;
    maxTimer = 0;
    PAGE_SETTLE_EVIDENCE_EVENTS.forEach((name) => document.removeEventListener(name, onEvidence));
    if (html.dataset.spwPageSettleConfirmation === PAGE_SETTLE_CONFIRMATIONS.PENDING) {
      delete html.dataset.spwPageSettleConfirmation;
    }
  };

  const settle = (confirmation) => {
    teardownSettleWatch(ctx);
    writeDatasetValue(html, 'spwPageSettleConfirmation', confirmation);
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: `${reason}-settled`,
      settleConfirmation: confirmation,
      contour,
    });
  };

  const scheduleQuietCheck = () => {
    if (quietTimer) window.clearTimeout(quietTimer);
    const now = performance.now();
    const wait = Math.max(
      minDelay - (now - startedAt),
      quietWindow - (now - lastEvidenceAt),
      0,
    );
    quietTimer = window.setTimeout(() => {
      quietTimer = 0;
      const at = performance.now();
      if (at - startedAt < minDelay || at - lastEvidenceAt < quietWindow) {
        scheduleQuietCheck();
        return;
      }
      if (confirmMode === PAGE_SETTLE_CONFIRMATIONS.ROUTE && !ctx.pageSettleRouteConfirmed) {
        /* hold at the confirming edge; route confirm or the max bound resolves it */
        return;
      }
      settle(confirmMode);
    }, wait);
  };

  maxTimer = window.setTimeout(() => {
    maxTimer = 0;
    settle(PAGE_SETTLE_CONFIRMATIONS.GUARD);
  }, maxDelay);

  PAGE_SETTLE_EVIDENCE_EVENTS.forEach((name) => document.addEventListener(name, onEvidence, { passive: true }));
  ctx.pageSettleWatch = { teardown, onRouteConfirm: scheduleQuietCheck };
  scheduleQuietCheck();
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

  beginSettleWatch(ctx, arrival, reason);
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
    writePageHandoff();
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.BACKGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: 'pagehide',
    });
  };

  const handleRouteSettleConfirm = () => {
    /* Route confirmation persists across arcs: a page confirms once, and later
       returning/restored arcs settle on evidence without demanding re-confirmation. */
    ctx.pageSettleRouteConfirmed = true;
    ctx.pageSettleWatch?.onRouteConfirm?.();
  };

  annotateFloatingChrome(document);
  const cleanupFixedViewportCorrection = initFixedViewportCorrection();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('pagehide', handlePageHide);
  document.addEventListener(PAGE_SETTLE_CONFIRM_EVENT, handleRouteSettleConfirm, { passive: true });

  const contourRail = readQueryRail('contour');
  if (contourRail) {
    writeDatasetValue(document.documentElement, 'spwContourRail', contourRail);
  }
  ctx.pageArrivalKind = resolveArrivalKind();

  if (document.hidden || prefersReducedMotion()) {
    setPageAttentionState(ctx, {
      presence: document.hidden ? PAGE_PRESENCE.BACKGROUND : PAGE_PRESENCE.FOREGROUND,
      arrival: PAGE_ARRIVAL.SETTLED,
      step: '0',
      reason: 'page-init',
    });
  } else {
    /* Born in its arrival state (entering cold, returning/restored when a
       fresh intra-site handoff exists): the boot/mounting window runs under
       arrival rules, and settled is declared once by the arrival arc. The
       guard settles anyway if boot never conducts the arc (it is a managed
       timer, so the real schedulePageArrival call replaces it). */
    setPageAttentionState(ctx, {
      presence: PAGE_PRESENCE.FOREGROUND,
      arrival: ctx.pageArrivalKind,
      step: '0',
      reason: 'page-init',
    });
    addManagedTimeout(ctx, () => {
      writeDatasetValue(document.documentElement, 'spwPageSettleConfirmation', PAGE_SETTLE_CONFIRMATIONS.GUARD);
      setPageAttentionState(ctx, {
        presence: PAGE_PRESENCE.FOREGROUND,
        arrival: PAGE_ARRIVAL.SETTLED,
        step: '0',
        reason: 'page-init-guard-settled',
        settleConfirmation: PAGE_SETTLE_CONFIRMATIONS.GUARD,
      });
    }, readRootTimeToken('--spw-page-arrival-guard-delay', 1600));
  }

  return () => {
    clearPageAttentionSequence(ctx);
    cleanupFixedViewportCorrection();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('pagehide', handlePageHide);
    document.removeEventListener(PAGE_SETTLE_CONFIRM_EVENT, handleRouteSettleConfirm);
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
    settleConfirmation: htmlDataset.spwPageSettleConfirmation || '',
    settleContour: bodyDataset.spwSettleContour || '',
    attentionContext: htmlDataset.spwAttentionContext || '',
    harmonyField: htmlDataset.spwHarmonyField || '',
    tempoField: htmlDataset.spwTempoField || '',
    pageTempo: htmlDataset.spwPageTempo || '',
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
    delete root.dataset.spwPageSettleConfirmation;
    delete root.dataset.spwAttentionContext;
    delete root.dataset.spwHarmonyField;
    delete root.dataset.spwTempoField;
    delete root.dataset.spwPageTempo;
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
