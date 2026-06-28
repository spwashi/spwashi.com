import {
  DAY_KEYS,
  clampIndex,
  cleanText,
  createJsonFeedLoader,
  getWeekIndex,
} from '/public/js/kernel/feed-utils.js';
import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { isInspectLabSurface, isReadingQuietChrome } from '/public/js/runtime/runtime-helpers.js';

const FEED_URL = '/public/data/promo-wonder-cycle.json';
const STORAGE_KEY = 'spw-discovery-notice-dismissals';
const STACK_ATTR = 'data-spw-discovery-notice-stack';
const MODAL_ATTR = 'data-spw-discovery-notice-modal';
const NOTICE_ATTR = 'data-spw-discovery-notice';
const MODULE_ATTR = 'data-spw-discovery-notice-module';
const NOTICE_HIDE_DELAY_MS = 180;
const DISMISSALS_CHANGED_EVENT = 'spw:discovery-dismissals-changed';
const DISCOVERY_REWARD_EVENT = 'spw:discovery-reward';
const PRESENTATIONS = new Set(['toast', 'popup', 'modal', 'credits']);
const FEATURE_LEARNING_STORAGE_KEY = 'spw-feature-learning-toasts';
const FEATURE_LEARNING_LIMIT = 3;
const RUNTIME_REWARD_LINGER_MS = 4600;
const CREDITS_REWARD_LINGER_MS = 5600;
const MAX_RUNTIME_REWARD_NOTICES = 2;

const loadFeed = createJsonFeedLoader(FEED_URL, null);
let removeEscapeListener = () => {};
const runtimeRewardNotices = new Map();

async function getSharedBus() {
  try {
    const mod = await import('/public/js/kernel/bus.js');
    return mod?.bus || mod?.default || null;
  } catch {
    return null;
  }
}

export function slugify(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'notice';
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readDismissals() {
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY), {});
  } catch {
    return {};
  }
}

function writeDismissals(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Local storage is optional here.
  }
}

export function getDateKeys(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const isoDay = `${year}-${month}-${day}`;
  const weekIndex = String(getWeekIndex(date)).padStart(2, '0');
  const isoWeek = `${year}-w${weekIndex}`;
  const dayName = DAY_KEYS[date.getDay()] || 'day';

  return { isoDay, isoWeek, dayName };
}

export function normalizeHref(href = '') {
  const value = cleanText(href);
  if (!value) return '';

  try {
    return new URL(value, window.location.href).pathname.replace(/\/+$/, '/') || '/';
  } catch {
    return value.split(/[?#]/)[0].replace(/\/+$/, '/') || '/';
  }
}

export function getRuntimeRewardPolicy(raw = {}, options = {}) {
  const source = raw?.detail || raw || {};
  const presentation = normalizePresentation(source.presentation || options.presentation || 'toast');
  const cadence = cleanText(options.cadence || source.cadence || 'reward') || 'reward';
  const lingerValue = Number(options.autoDismissMs ?? source.autoDismissMs ?? source.linger);
  const autoDismissMs = Number.isFinite(lingerValue)
    ? Math.max(800, lingerValue)
    : (presentation === 'credits' ? CREDITS_REWARD_LINGER_MS : RUNTIME_REWARD_LINGER_MS);
  const maxVisibleValue = Number(options.maxVisible ?? source.maxVisible);
  const maxVisible = Number.isFinite(maxVisibleValue)
    ? Math.max(1, maxVisibleValue)
    : MAX_RUNTIME_REWARD_NOTICES;
  const rewardKey = cleanText(
    source.rewardKey
    || [
      cadence,
      source.rewardKind || source.source || presentation,
      source.title || '',
      source.href || '',
    ].join(':')
  );

  return {
    presentation,
    cadence,
    autoDismissMs,
    maxVisible,
    rewardKey,
  };
}

export function buildDismissKey(scope, notice, scheduleKey, index) {
  const noticeId = slugify(notice.id || notice.title || notice.cta || notice.href || String(index));
  return `${scope}:${noticeId}:${scheduleKey}`;
}

function getPromotionDetails(source = {}) {
  const promotion = source.promotion || {};
  const handles = Array.isArray(promotion.handles)
    ? promotion.handles.map((handle) => cleanText(handle)).filter(Boolean)
    : [];

  return {
    presentation: normalizePresentation(source.presentation || promotion.presentation || 'toast'),
    kind: cleanText(promotion.kind || ''),
    audience: cleanText(promotion.audience || ''),
    offer: cleanText(promotion.offer || ''),
    proof: cleanText(promotion.proof || ''),
    objection: cleanText(promotion.objection || ''),
    urgency: cleanText(promotion.urgency || ''),
    tone: cleanText(promotion.tone || ''),
    theme: cleanText(promotion.theme || ''),
    handles,
    ctaStyle: cleanText(promotion.ctaStyle || ''),
    cadenceDay: cleanText(promotion.cadenceDay || source.cadenceDay || ''),
    cadenceMotion: cleanText(promotion.cadenceMotion || source.cadenceMotion || ''),
    rewardKind: cleanText(promotion.rewardKind || source.rewardKind || ''),
    productionSeed: cleanText(promotion.productionSeed || source.productionSeed || ''),
  };
}

function normalizePresentation(value = 'toast') {
  const presentation = cleanText(value || 'toast').toLowerCase();
  return PRESENTATIONS.has(presentation) ? presentation : 'toast';
}

function readReadingQuietChrome() {
  try {
    if (typeof document === 'undefined') return false;
    return isReadingQuietChrome();
  } catch {
    return false;
  }
}

function readInspectLabSurface() {
  try {
    if (typeof document === 'undefined') return false;
    return isInspectLabSurface();
  } catch {
    return false;
  }
}

function readCompactViewport() {
  try {
    return typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(max-width: 720px)').matches;
  } catch {
    return false;
  }
}

export function shouldSuppressScheduledNotices() {
  return readInspectLabSurface();
}

export function resolveNoticePresentation(presentation, options = {}) {
  const normalized = normalizePresentation(presentation);
  if (normalized !== 'modal') return normalized;
  if (options.forceModal === true) return normalized;
  const compactViewport = options.compactViewport ?? readCompactViewport();
  if (compactViewport) return 'toast';
  const readingQuiet = options.readingQuiet ?? readReadingQuietChrome();
  const inspectLab = options.inspectLab ?? readInspectLabSurface();
  if (readingQuiet || inspectLab) return 'toast';
  return normalized;
}

export function selectScheduleItems(feed, date = new Date()) {
  const daily = Array.isArray(feed?.daily) ? feed.daily : [];
  const weekly = Array.isArray(feed?.weekly) ? feed.weekly : [];
  const { isoDay, isoWeek, dayName } = getDateKeys(date);

  const selected = [];
  if (daily.length) {
    const dailyIndex = clampIndex(date.getDay(), daily.length);
    const dailyRow = daily[dailyIndex];
    if (dailyRow?.promo) {
      selected.push({
        cadence: 'daily',
        scheduleKey: isoDay,
        label: `${cleanText(dayName)} promo`,
        source: dailyRow.promo,
        index: dailyIndex,
        presentation: getPromotionDetails(dailyRow.promo).presentation,
      });
    }
  }

  if (weekly.length) {
    const weeklyIndex = clampIndex(getWeekIndex(date), weekly.length);
    const weeklyRow = weekly[weeklyIndex];
    if (weeklyRow?.promo) {
      selected.push({
        cadence: 'weekly',
        scheduleKey: isoWeek,
        label: 'Weekly promo',
        source: weeklyRow.promo,
        index: weeklyIndex,
        presentation: getPromotionDetails(weeklyRow.promo).presentation,
      });
    }
  }

  return selected;
}

export function isCurrentRoute(href, currentPath = window.location.pathname) {
  const normalized = normalizeHref(href);
  if (!normalized) return false;

  const current = cleanText(currentPath || window.location.pathname).replace(/\/+$/, '/') || '/';
  return normalized === current;
}

export function shouldSuppressNotice(notice, scheduleKey, dismissals, currentPath = window.location.pathname) {
  if (!notice) return true;
  if (isCurrentRoute(notice.href, currentPath)) return true;

  const storedKey = dismissals[notice.dismissKey];
  return storedKey === scheduleKey;
}

function createHandleStrip(handles) {
  const strip = document.createElement('div');
  strip.className = 'spw-discovery-notice__handles';

  handles.forEach((handle) => {
    const pill = document.createElement('span');
    pill.className = 'spec-pill spw-discovery-notice__handle';
    pill.textContent = handle;
    strip.append(pill);
  });

  return strip;
}

function createMetaList(notice) {
  const list = document.createElement('dl');
  list.className = 'spw-discovery-notice__meta';

  const entries = [
    ['Audience', notice.audience],
    ['Offer', notice.offer],
    ['Proof', notice.proof],
    ['Objection', notice.objection],
    ['Urgency', notice.urgency],
    ['Day', notice.cadenceDay],
    ['Motion', notice.cadenceMotion],
    ['Reward', notice.rewardKind],
    ['Production', notice.productionSeed],
  ].filter(([, value]) => Boolean(value));

  entries.forEach(([labelText, value]) => {
    const term = document.createElement('dt');
    term.className = 'spw-discovery-notice__meta-label';
    term.textContent = labelText;

    const desc = document.createElement('dd');
    desc.className = 'spw-discovery-notice__meta-value';
    desc.textContent = value;

    list.append(term, desc);
  });

  return list;
}

function createNoticeElement(notice) {
  const isModal = notice.presentation === 'modal';
  const isCredits = notice.presentation === 'credits';
  const article = document.createElement(isModal || isCredits ? 'article' : 'aside');
  article.className = `spw-discovery-notice spw-discovery-notice--${notice.presentation}`;
  article.setAttribute(NOTICE_ATTR, notice.dismissKey);
  article.setAttribute('data-spw-cadence', notice.cadence);
  article.setAttribute('data-spw-presentation', notice.presentation);
  article.setAttribute('data-spw-copy-unit', notice.copyUnit);
  article.setAttribute('data-spw-locale', notice.locale);
  article.setAttribute('lang', notice.locale);
  if (notice.theme) article.setAttribute('data-spw-promo-theme', notice.theme);
  if (notice.kind) article.setAttribute('data-spw-promo-kind', notice.kind);
  if (notice.ctaStyle) article.setAttribute('data-spw-promo-cta-style', notice.ctaStyle);
  if (notice.handles.length) article.setAttribute('data-spw-promo-handles', notice.handles.join(' '));
  if (notice.cadenceDay) article.setAttribute('data-spw-cadence-day', notice.cadenceDay);
  if (notice.cadenceMotion) article.setAttribute('data-spw-cadence-motion', notice.cadenceMotion);
  if (notice.rewardKind) article.setAttribute('data-spw-reward-kind', notice.rewardKind);
  if (notice.productionSeed) article.setAttribute('data-spw-production-seed', notice.productionSeed);

  // Propagate global material / clear-contrast choice to the notice so it can
  // use matte surfaces + strong ink when the user has selected the "clear
  // contrast" posture (or high-contrast + matte). This makes the daily promo /
  // discovery notices respect the theming contract and the matte option for
  // legible floating chrome.
  const baseMat = document.documentElement.dataset.spwBaseMetamaterial;
  if (baseMat && ['glass', 'matte', 'contrast', 'paper'].includes(baseMat)) {
    article.setAttribute('data-spw-metamaterial', baseMat);
  } else if (document.documentElement.dataset.spwHighContrast === 'on') {
    // High contrast implies clear reading surfaces; prefer matte for notices.
    article.setAttribute('data-spw-metamaterial', 'matte');
  }

  const label = document.createElement('p');
  label.className = 'spw-discovery-notice__label';
  label.textContent = notice.label;

  const title = document.createElement('p');
  title.className = 'spw-discovery-notice__title';
  title.textContent = notice.title;

  const summary = document.createElement('p');
  summary.className = 'spw-discovery-notice__summary';
  summary.textContent = notice.summary;
  const token = notice.dismissKey.replace(/[^a-z0-9_-]+/gi, '-');
  title.id = `spw-discovery-notice-title-${token}`;
  summary.id = `spw-discovery-notice-summary-${token}`;

  const offer = cleanText(notice.offer || '');
  const offerEl = offer ? document.createElement('p') : null;
  if (offerEl) {
    offerEl.className = 'spw-discovery-notice__offer';
    offerEl.textContent = offer;
  }

  const whyText = cleanText(notice.why || '');
  const why = whyText ? document.createElement('p') : null;
  if (why) {
    why.className = 'spw-discovery-notice__why';
    why.textContent = whyText;
  }

  const meta = isModal ? createMetaList(notice) : null;

  const actions = document.createElement('div');
  actions.className = 'spw-discovery-notice__actions';

  if (notice.href) {
    const link = document.createElement('a');
    link.className = 'spw-discovery-notice__cta';
    link.href = notice.href;
    link.textContent = notice.cta || 'Open';
    actions.append(link);
  }

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'spw-discovery-notice__dismiss';
  dismiss.setAttribute('aria-label', `Dismiss ${notice.label.toLowerCase()}`);
  dismiss.textContent = 'Dismiss';
  actions.append(dismiss);

  if (isModal) {
    article.setAttribute('role', 'dialog');
    article.setAttribute('aria-modal', 'true');
    article.setAttribute('tabindex', '-1');
    article.setAttribute('aria-labelledby', title.id);
    article.setAttribute('aria-describedby', summary.id);
  } else {
    article.setAttribute('aria-label', `${notice.label} notice`);
  }

  if (isCredits && notice.href) {
    article.setAttribute('tabindex', '0');
    article.setAttribute('data-spw-notice-click-target', 'href');
    article.setAttribute('aria-label', `${notice.label} notice. ${notice.cta || 'Open related documentation'}`);
  }

  const body = [label, title, summary];
  if (offerEl) body.push(offerEl);
  if (notice.handles.length) body.push(createHandleStrip(notice.handles));
  if (why) body.push(why);
  if (meta) body.push(meta);
  body.push(actions);

  article.append(...body);

  return { article, dismiss };
}

function ensureStackRoot() {
  let stack = document.querySelector(`[${STACK_ATTR}]`);
  if (stack) return stack;

  stack = document.createElement('section');
  stack.className = 'spw-discovery-notice-stack';
  stack.setAttribute(STACK_ATTR, '');
  annotateFloatingChromeElement(stack, {
    role: 'discovery-toast-stack',
    tier: 'toast',
    mutator: 'discovery-notices',
    reason: 'discoverability-toast',
    stylingAxis: 'notice-chrome',
  });
  stack.setAttribute('aria-live', 'polite');
  stack.setAttribute('aria-label', 'Discoverability notices');
  stack.setAttribute(MODULE_ATTR, 'ready');
  const host = document.body || document.documentElement;
  host.append(stack);
  return stack;
}

function ensureModalRoot() {
  let root = document.querySelector(`[${MODAL_ATTR}]`);
  if (root) return root;

  root = document.createElement('section');
  root.className = 'spw-discovery-notice-modal';
  root.setAttribute(MODAL_ATTR, '');
  root.setAttribute('aria-label', 'Promotional brief');
  annotateFloatingChromeElement(root, {
    role: 'discovery-modal',
    tier: 'modal',
    mutator: 'discovery-notices',
    reason: 'discoverability-modal',
    stylingAxis: 'notice-chrome',
    overlay: 'scrim-dark',
  });
  root.setAttribute(MODULE_ATTR, 'ready');
  const host = document.body || document.documentElement;
  host.append(root);
  return root;
}

function ensureCreditsRoot() {
  let root = document.querySelector('[data-spw-discovery-credits]');
  if (root) return root;
  root = document.createElement('section');
  root.className = 'spw-discovery-credits-layer';
  root.setAttribute('data-spw-discovery-credits', '');
  root.setAttribute('aria-label', 'Applied modules and settings (ephemeral credits)');
  annotateFloatingChromeElement(root, {
    role: 'application-credits',
    tier: 'toast',
    mutator: 'discovery-notices',
    reason: 'module-settings-credits',
    stylingAxis: 'notice-chrome',
  });
  root.setAttribute(MODULE_ATTR, 'ready');
  const host = document.body || document.documentElement;
  host.append(root);
  return root;
}

/** Show a configurable ephemeral "film credits" style floating chrome for module or settings application.
 *  Like end credits after an opening sequence: appears after "preloading" (scan + measure), lists what was applied,
 *  impacts perception of the change (communicates benefit), auto or gesture dismisses. Uses the shared annotate
 *  and floating chrome contract. Can be triggered from settings:changed or page preload phases that queue after
 *  identifying [data-spw-*] hooks and measuring layout rects.
 */
export function showApplicationCredit(summary = 'Module applied', options = {}) {
  const linger = Number.isFinite(options.linger) ? options.linger : 3800;
  const root = ensureCreditsRoot();
  const el = document.createElement('div');
  el.className = 'spw-discovery-notice spw-discovery-notice--credits';
  if (options.theme) el.setAttribute('data-spw-metamaterial', options.theme);
  const label = document.createElement('span');
  label.className = 'spw-discovery-notice__label';
  label.setAttribute('aria-hidden', 'true');
  label.textContent = 'APPLIED';
  const title = document.createElement('span');
  title.className = 'spw-discovery-notice__title';
  title.textContent = cleanText(summary);
  el.append(label, title);
  annotateFloatingChromeElement(el, {
    role: 'application-credit',
    tier: 'toast',
    mutator: 'discovery-notices',
    reason: options.reason || 'module-settings-credits',
    stylingAxis: 'notice-chrome',
  });
  root.append(el);
  const remove = () => {
    el.classList.add('is-dismissing');
    setTimeout(() => el.remove(), 420);
  };
  el.addEventListener('click', remove, { once: true });
  const t = setTimeout(remove, linger);
  // Allow external cancel
  el._spwCreditTimer = t;
  return el;
}

function clearRemoveEscapeListenerIfIdle() {
  if (document.querySelector(`[${STACK_ATTR}]`) || document.querySelector(`[${MODAL_ATTR}]`)) return;
  removeEscapeListener();
  removeEscapeListener = () => {};
}

function dismissNotice(notice, root, dismissals) {
  dismissals[notice.dismissKey] = notice.scheduleKey;
  writeDismissals(dismissals);
  document.dispatchEvent(new CustomEvent(DISMISSALS_CHANGED_EVENT, {
    detail: {
      storageKey: STORAGE_KEY,
      dismissKey: notice.dismissKey,
      scheduleKey: notice.scheduleKey,
    },
  }));

  notice.article.classList.add('is-dismissing');
  window.setTimeout(() => {
    notice.article.remove();
    if (!root.childElementCount) root.remove();
    clearRemoveEscapeListenerIfIdle();
  }, NOTICE_HIDE_DELAY_MS);
}

export function normalizeNotice(raw, cadence, scheduleKey, index, locale) {
  const source = raw?.source || raw || {};
  const promotion = getPromotionDetails(source);
  const href = cleanText(source.href || '');
  const title = cleanText(source.title || promotion.offer || source.summary || 'Featured route');
  const summary = cleanText(source.summary || promotion.offer || source.why || '');

  if (!href || !title || !summary) return null;

  return {
    cadence,
    scheduleKey,
    locale,
    label: cleanText(source.label || `${cadence === 'daily' ? 'Today' : 'This week'} promo`),
    title,
    summary,
    href,
    cta: cleanText(source.cta || 'Open'),
    why: cleanText(source.why || promotion.proof || ''),
    presentation: resolveNoticePresentation(promotion.presentation),
    kind: promotion.kind,
    audience: promotion.audience,
    offer: promotion.offer,
    proof: promotion.proof,
    objection: promotion.objection,
    urgency: promotion.urgency,
    tone: promotion.tone,
    theme: promotion.theme,
    handles: promotion.handles,
    ctaStyle: promotion.ctaStyle,
    cadenceDay: promotion.cadenceDay,
    cadenceMotion: promotion.cadenceMotion,
    rewardKind: promotion.rewardKind,
    productionSeed: promotion.productionSeed,
    copyUnit: cleanText(source.copyUnit || `home.discoveryNotice.${cadence}`),
    dismissKey: buildDismissKey(cadence, { ...source, href, title, summary }, scheduleKey, index),
  };
}

export function buildVisibleNotices(feed, date = new Date(), dismissals = readDismissals(), currentPath = window.location.pathname) {
  if (shouldSuppressScheduledNotices()) {
    return { dismissals, visible: [] };
  }

  const locale = cleanText(feed?.sourceLocale || 'en') || 'en';
  const selected = selectScheduleItems(feed, date);
  const visible = [];

  for (const item of selected) {
    const notice = normalizeNotice(item, item.cadence, item.scheduleKey, item.index, locale);
    if (!notice || shouldSuppressNotice(notice, item.scheduleKey, dismissals, currentPath)) continue;
    if (visible.some((entry) => normalizeHref(entry.href) === normalizeHref(notice.href))) continue;
    visible.push(notice);
  }

  return { dismissals, visible };
}

function mountNotices(visible, stack, dismissals) {
  const cleanup = [];
  const modalRoot = ensureModalRoot();
  const creditsRoot = ensureCreditsRoot();

  visible.forEach((notice) => {
    const { article, dismiss } = createNoticeElement(notice);
    let root;
    if (notice.presentation === 'modal') root = modalRoot;
    else if (notice.presentation === 'credits') root = creditsRoot;
    else root = stack;
    root.append(article);

    dismiss.addEventListener('click', () => dismissNotice({ ...notice, article }, root, dismissals));
    article.querySelector('.spw-discovery-notice__cta')?.addEventListener('click', () => {
      dismissNotice({ ...notice, article }, root, dismissals);
    });

    cleanup.push(() => article.remove());
  });

  const handleEscape = (event) => {
    if (event.key !== 'Escape') return;
    const modalEl = modalRoot.lastElementChild;
    const noticeEl = modalEl instanceof HTMLElement ? modalEl : stack.lastElementChild;
    if (!(noticeEl instanceof HTMLElement)) return;
    const dismissButton = noticeEl.querySelector('.spw-discovery-notice__dismiss');
    if (dismissButton instanceof HTMLButtonElement) {
      dismissButton.click();
    }
  };

  window.addEventListener('keydown', handleEscape);
  removeEscapeListener = () => window.removeEventListener('keydown', handleEscape);

  cleanup.push(() => {
    removeEscapeListener();
    removeEscapeListener = () => {};
  });
  return cleanup;
}

function removeNotice(article, root) {
  article.classList.add('is-dismissing');
  window.setTimeout(() => {
    article.remove();
    if (!root.childElementCount) root.remove();
    clearRemoveEscapeListenerIfIdle();
  }, NOTICE_HIDE_DELAY_MS);
}

function enforceRuntimeRewardLimit(root, maxVisible) {
  if (!root || !Number.isFinite(maxVisible)) return;
  const rewardNotices = [...root.querySelectorAll(`[${NOTICE_ATTR}][data-spw-runtime-reward="true"]`)];
  const overflow = rewardNotices.length - maxVisible;
  if (overflow <= 0) return;

  rewardNotices.slice(0, overflow).forEach((article) => {
    if (article instanceof HTMLElement) {
      const key = article.dataset.spwRewardKey;
      if (key) runtimeRewardNotices.delete(key);
      removeNotice(article, root);
    }
  });
}

export function showSpwDiscoveryNotice(raw = {}, options = {}) {
  if (!document.body || document.body.dataset.spwDiscoveryNotices === 'off') return null;

  const source = raw?.detail || raw || {};
  const rewardPolicy = getRuntimeRewardPolicy(source, options);
  const now = Date.now();
  const notice = normalizeNotice(
    {
      ...source,
      presentation: rewardPolicy.presentation,
    },
    rewardPolicy.cadence,
    cleanText(options.scheduleKey || source.scheduleKey || `runtime-${now}`) || `runtime-${now}`,
    Number.isFinite(options.index) ? options.index : 0,
    cleanText(options.locale || source.locale || document.documentElement.lang || 'en') || 'en',
  );

  if (!notice) return null;

  if (rewardPolicy.rewardKey && runtimeRewardNotices.has(rewardPolicy.rewardKey)) {
    runtimeRewardNotices.get(rewardPolicy.rewardKey)?.cleanup?.();
    runtimeRewardNotices.delete(rewardPolicy.rewardKey);
  }

  const stack = (notice.presentation === 'modal' || notice.presentation === 'credits') ? null : ensureStackRoot();
  const modalRoot = notice.presentation === 'modal' ? ensureModalRoot() : null;
  const creditsRoot = notice.presentation === 'credits' ? ensureCreditsRoot() : null;
  const root = modalRoot || creditsRoot || stack;
  const { article, dismiss } = createNoticeElement(notice);
  article.dataset.spwRuntimeReward = 'true';
  if (rewardPolicy.rewardKey) article.dataset.spwRewardKey = rewardPolicy.rewardKey;

  root.append(article);

  let cleanupTimer = null;
  let cleaned = false;
  const clearAutoDismiss = () => {
    if (cleanupTimer) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
  };
  const scheduleAutoDismiss = () => {
    if (notice.presentation === 'modal' || rewardPolicy.autoDismissMs <= 0 || cleaned) return;
    clearAutoDismiss();
    cleanupTimer = window.setTimeout(cleanup, rewardPolicy.autoDismissMs);
  };
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearAutoDismiss();
    if (rewardPolicy.rewardKey) runtimeRewardNotices.delete(rewardPolicy.rewardKey);
    removeNotice(article, root);
  };
  dismiss.addEventListener('click', cleanup, { once: true });
  article.querySelector('.spw-discovery-notice__cta')?.addEventListener('click', cleanup, { once: true });

  if (notice.presentation === 'credits' && notice.href) {
    const openNoticeHref = () => {
      window.location.href = notice.href;
      cleanup();
    };
    article.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a, button')) return;
      openNoticeHref();
    });
    article.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target !== article) return;
      event.preventDefault();
      openNoticeHref();
    });
  }

  article.addEventListener('pointerenter', clearAutoDismiss, { passive: true });
  article.addEventListener('pointerleave', scheduleAutoDismiss, { passive: true });
  article.addEventListener('focusin', clearAutoDismiss);
  article.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (!article.matches(':focus-within')) scheduleAutoDismiss();
    });
  });

  if (notice.presentation === 'modal') {
    article.focus({ preventScroll: true });
  } else {
    scheduleAutoDismiss();
  }

  enforceRuntimeRewardLimit(root, rewardPolicy.maxVisible);
  if (rewardPolicy.rewardKey) runtimeRewardNotices.set(rewardPolicy.rewardKey, { article, cleanup });

  document.dispatchEvent(new CustomEvent('spw:discovery-notice-shown', {
    detail: {
      dismissKey: notice.dismissKey,
      presentation: notice.presentation,
      title: notice.title,
      href: notice.href,
      source: source.source || 'runtime',
      cadence: notice.cadence,
      cadenceDay: notice.cadenceDay,
      cadenceMotion: notice.cadenceMotion,
      rewardKind: notice.rewardKind,
      productionSeed: notice.productionSeed,
    },
  }));

  return { article, dismiss, notice, cleanup };
}

function handleDiscoveryReward(event) {
  const policy = getRuntimeRewardPolicy(event.detail || {});
  showSpwDiscoveryNotice(event.detail || {}, policy);
}

function readFeatureLearningState() {
  try {
    return safeParse(sessionStorage.getItem(FEATURE_LEARNING_STORAGE_KEY), { shown: [], count: 0 });
  } catch {
    return { shown: [], count: 0 };
  }
}

function writeFeatureLearningState(next) {
  try {
    sessionStorage.setItem(FEATURE_LEARNING_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Learning toasts are optional.
  }
}

function buildFeatureLearningHref(detail = {}) {
  const root = detail.root instanceof HTMLElement ? detail.root : null;
  if (root?.id) return `#${root.id}`;
  const target = root?.closest?.('[id]') || document.querySelector('main [id]');
  return target?.id ? `#${target.id}` : window.location.pathname || '/';
}

function handleFeatureLearningToast(event) {
  const detail = event.detail || {};
  const id = cleanText(detail.baseId || detail.id || '');
  if (!id || id === 'discovery-notices') return;
  if (document.documentElement.dataset.spwFeatureLearning === 'off') return;
  if (document.body?.dataset?.spwDiscoveryNotices === 'off') return;

  const state = readFeatureLearningState();
  const shown = Array.isArray(state.shown) ? state.shown : [];
  if (shown.includes(id) || Number(state.count || 0) >= FEATURE_LEARNING_LIMIT) return;

  const layer = cleanText(detail.layer || 'feature');
  const when = cleanText(detail.effectiveWhen || detail.requestedWhen || 'runtime');
  const evaluates = cleanText(detail.evaluates || 'semantics');
  const root = detail.root instanceof HTMLElement ? detail.root : null;
  const title = `${id.replace(/-/g, ' ')} mounted`;
  const summary = `This ${layer} feature mounted because the page matched its ${when} trigger. It evaluates ${evaluates}.`;

  showSpwDiscoveryNotice({
    label: 'Feature learned',
    title,
    summary,
    href: buildFeatureLearningHref(detail),
    cta: root?.id ? 'Jump to feature' : 'Inspect route',
    why: cleanText(detail.reason || 'Feature triggers are now visible in markup and console discovery.'),
    presentation: 'toast',
    source: 'feature-learning',
    promotion: {
      kind: 'learning',
      theme: 'signal',
      handles: [layer, when, 'mount-trigger'].filter(Boolean),
      rewardKind: 'runtime-literacy',
      productionSeed: id,
    },
  }, {
    cadence: 'learning',
    scheduleKey: `feature-${id}`,
  });

  writeFeatureLearningState({
    shown: [...shown, id].slice(-12),
    count: Number(state.count || 0) + 1,
  });
}

export async function initSpwDiscoveryNotices(ctx = {}) {
  if (document.body?.dataset?.spwDiscoveryNotices === 'off') return () => {};
  document.addEventListener(DISCOVERY_REWARD_EVENT, handleDiscoveryReward);
  document.addEventListener('spw:module-mounted', handleFeatureLearningToast);
  let cleanupBus = () => {};

  const cleanupEventApi = () => {
    document.removeEventListener(DISCOVERY_REWARD_EVENT, handleDiscoveryReward);
    document.removeEventListener('spw:module-mounted', handleFeatureLearningToast);
    cleanupBus();
  };

  if (document.querySelector('[data-promo-wonder-cycle]')) {
    ctx.addCleanup?.(cleanupEventApi);
    return cleanupEventApi;
  }

  const feed = await loadFeed();
  const { dismissals, visible } = buildVisibleNotices(feed);
  if (!visible.length) {
    ctx.addCleanup?.(cleanupEventApi);
    return cleanupEventApi;
  }

  const stack = ensureStackRoot();
  const cleanupItems = mountNotices(visible, stack, dismissals);

  const schedule = window.setTimeout(() => {
    if (!stack.childElementCount) stack.remove();
  }, 1200);

  const cleanup = () => {
    window.clearTimeout(schedule);
    for (const fn of cleanupItems) {
      try {
        fn();
      } catch {
        // Ignore cleanup failures.
      }
    }
    removeEscapeListener();
    removeEscapeListener = () => {};
    cleanupEventApi();
    stack.remove();
    document.querySelector(`[${MODAL_ATTR}]`)?.remove();
  };

  ctx.addCleanup?.(cleanup);

  // Reactive adoption of global material / matte-clear-contrast choice.
  // When the design hub bench "apply matte clear globally" (or settings) updates
  // the root dataset, open discovery notices / promos (like the collab modal in
  // the reference screenshot) immediately switch to the clear matte surface + strong
  // ink for legible text. Complements creation-time propagation.
  const adoptGlobalMaterial = () => {
    const base = document.documentElement.dataset.spwBaseMetamaterial;
    const notices = document.querySelectorAll(`[${NOTICE_ATTR}]`);
    notices.forEach((n) => {
      if (base && ['glass', 'matte', 'contrast', 'paper'].includes(base)) {
        n.setAttribute('data-spw-metamaterial', base);
      } else if (document.documentElement.dataset.spwHighContrast === 'on') {
        n.setAttribute('data-spw-metamaterial', 'matte');
      }
    });
  };
  const sharedBus = await getSharedBus();
  cleanupBus = sharedBus?.on?.('settings:changed', adoptGlobalMaterial) || (() => {});
  document.addEventListener('spw:settings-change', adoptGlobalMaterial, { passive: true });

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'attributes' && (m.attributeName === 'data-spw-base-metamaterial' || m.attributeName === 'data-spw-high-contrast')) {
        adoptGlobalMaterial();
        break;
      }
    }
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-spw-base-metamaterial', 'data-spw-high-contrast'] });

  ctx.addCleanup?.(() => {
    mo.disconnect();
  });

  // Expose for pages / other modules to surface learnability/reward or module credits using the same ephemeral architecture.
  if (typeof window !== 'undefined') {
    window.spwShowApplicationCredit = showApplicationCredit;
  }

  return cleanup;
}
