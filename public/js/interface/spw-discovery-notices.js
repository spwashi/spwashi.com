import {
  DAY_KEYS,
  clampIndex,
  cleanText,
  createJsonFeedLoader,
  getWeekIndex,
} from '/public/js/typed/spw-feed-utils.js';

const FEED_URL = '/public/data/promo-wonder-cycle.json';
const STORAGE_KEY = 'spw-discovery-notice-dismissals';
const STACK_ATTR = 'data-spw-discovery-notice-stack';
const NOTICE_ATTR = 'data-spw-discovery-notice';
const MODULE_ATTR = 'data-spw-discovery-notice-module';
const NOTICE_HIDE_DELAY_MS = 180;

const loadFeed = createJsonFeedLoader(FEED_URL, null);
let removeEscapeListener = () => {};

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

export function buildDismissKey(scope, notice, scheduleKey, index) {
  const noticeId = slugify(notice.id || notice.title || notice.cta || notice.href || String(index));
  return `${scope}:${noticeId}:${scheduleKey}`;
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

function createNoticeElement(notice) {
  const article = document.createElement('aside');
  article.className = 'spw-discovery-notice';
  article.setAttribute(NOTICE_ATTR, notice.dismissKey);
  article.setAttribute('data-spw-cadence', notice.cadence);
  article.setAttribute('data-spw-copy-unit', notice.copyUnit);
  article.setAttribute('data-spw-locale', notice.locale);
  article.setAttribute('lang', notice.locale);
  article.setAttribute('aria-label', `${notice.label} notice`);

  const label = document.createElement('p');
  label.className = 'spw-discovery-notice__label';
  label.textContent = notice.label;

  const title = document.createElement('p');
  title.className = 'spw-discovery-notice__title';
  title.textContent = notice.title;

  const summary = document.createElement('p');
  summary.className = 'spw-discovery-notice__summary';
  summary.textContent = notice.summary;

  const whyText = cleanText(notice.why || '');
  const why = whyText ? document.createElement('p') : null;
  if (why) {
    why.className = 'spw-discovery-notice__why';
    why.textContent = whyText;
  }

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

  if (why) {
    article.append(label, title, summary, why, actions);
  } else {
    article.append(label, title, summary, actions);
  }

  return { article, dismiss };
}

function ensureStackRoot() {
  let stack = document.querySelector(`[${STACK_ATTR}]`);
  if (stack) return stack;

  stack = document.createElement('section');
  stack.className = 'spw-discovery-notice-stack';
  stack.setAttribute(STACK_ATTR, '');
  stack.setAttribute('aria-live', 'polite');
  stack.setAttribute('aria-label', 'Discoverability notices');
  stack.setAttribute(MODULE_ATTR, 'ready');
  document.body.append(stack);
  return stack;
}

function dismissNotice(notice, stack, dismissals) {
  dismissals[notice.dismissKey] = notice.scheduleKey;
  writeDismissals(dismissals);

  notice.article.classList.add('is-dismissing');
  window.setTimeout(() => {
    notice.article.remove();
    if (!stack.childElementCount) {
      removeEscapeListener();
      removeEscapeListener = () => {};
      stack.remove();
    }
  }, NOTICE_HIDE_DELAY_MS);
}

export function normalizeNotice(raw, cadence, scheduleKey, index, locale) {
  const source = raw?.source || raw || {};
  const href = cleanText(source.href || '');
  const title = cleanText(source.title || source.summary || 'Featured route');
  const summary = cleanText(source.summary || '');

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
    why: cleanText(source.why || ''),
    copyUnit: cleanText(source.copyUnit || `home.discoveryNotice.${cadence}`),
    dismissKey: buildDismissKey(cadence, { ...source, href, title, summary }, scheduleKey, index),
  };
}

export function buildVisibleNotices(feed, date = new Date(), dismissals = readDismissals(), currentPath = window.location.pathname) {
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

  visible.forEach((notice) => {
    const { article, dismiss } = createNoticeElement(notice);
    stack.append(article);

    dismiss.addEventListener('click', () => dismissNotice({ ...notice, article }, stack, dismissals));
    article.querySelector('.spw-discovery-notice__cta')?.addEventListener('click', () => {
      dismissNotice({ ...notice, article }, stack, dismissals);
    });

    cleanup.push(() => article.remove());
  });

  const handleEscape = (event) => {
    if (event.key !== 'Escape') return;
    const noticeEl = stack.lastElementChild;
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

export async function initSpwDiscoveryNotices(ctx = {}) {
  if (document.body?.dataset?.spwDiscoveryNotices === 'off') return () => {};
  if (document.querySelector('[data-promo-wonder-cycle]')) return () => {};

  const feed = await loadFeed();
  const { dismissals, visible } = buildVisibleNotices(feed);
  if (!visible.length) return () => {};

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
    stack.remove();
  };

  ctx.addCleanup?.(cleanup);
  return cleanup;
}
