import { createCardSigil } from './kernel-dom-contracts.js';
import {
  DAY_KEYS,
  cleanText,
  createJsonFeedLoader,
  el,
  type DayKey,
} from './feed-utils.js';
import type {
  LocaleCode,
  MediaItem,
  MediaPublishingConfig,
} from './json-feeds.js';
import { validateMediaPublishingConfig } from './json-feeds.js';

type CardOptions = {
  featured?: boolean;
  showCta?: boolean;
};

type FocusOptions = {
  daily?: boolean;
};

const MEDIA_FOCUS_URL = '/public/data/media-focus.json';
const SOURCE_LOCALE = 'en';
const loadMediaConfig = createJsonFeedLoader<MediaPublishingConfig | null>(MEDIA_FOCUS_URL, null, {
  label: 'media-focus',
  validate: (value): value is MediaPublishingConfig => validateMediaPublishingConfig(value).ok,
});

function feedLocale(config: MediaPublishingConfig): LocaleCode {
  return cleanText(config.sourceLocale || SOURCE_LOCALE) || SOURCE_LOCALE;
}

function getDailyFocus(config: MediaPublishingConfig): MediaItem | undefined {
  const dayKey = DAY_KEYS[new Date().getDay()] as DayKey;
  return config.daily?.[dayKey] || config.daily?.friday || config.weekly;
}

function renderItemCard(item: MediaItem = {}, options: CardOptions = {}, locale: LocaleCode = SOURCE_LOCALE): HTMLElement {
  const href = cleanText(item.href) || '#';
  const card = el('a', options.featured ? 'media-card media-card--featured' : 'media-card', {
    'data-spw-component-kind': 'card',
    'data-spw-copy-unit': item.copyUnit || 'website.mediaPublishing.collection',
    'data-spw-locale': item.locale || locale,
    'data-spw-metamaterial': options.featured ? 'shell' : 'matte',
    href,
    lang: item.locale || locale,
  });

  const topline = el('span', 'media-card-topline');
  const operator = createCardSigil(cleanText(item.operator || '>'), {
    className: 'frame-card-sigil media-card-operator',
    operator: 'stream',
  });
  topline.append(operator);

  const tagText = cleanText(item.tag);
  if (tagText) {
    const tag = el('span', 'media-card-tag');
    tag.textContent = tagText;
    tag.title = tagText;
    topline.append(tag);
  }

  // Titles and prose can be clamped/truncated by the surface CSS — keep the full
  // string reachable on hover so nothing reads as silently cut off.
  const titleText = cleanText(item.title || 'Untitled feature');
  const title = el('strong', 'media-card-title');
  title.textContent = titleText;
  title.title = titleText;

  card.append(topline, title);

  const summaryText = cleanText(item.summary || item.why || '');
  if (summaryText) {
    const summary = el('span', 'media-card-summary');
    summary.textContent = summaryText;
    summary.title = summaryText;
    card.append(summary);
  }

  if (item.cta || options.showCta) {
    const cta = el('span', 'media-card-cta');
    cta.textContent = cleanText(item.cta || 'Open surface');
    card.append(cta);
  }

  return card;
}

function renderFocus(
  host: Element,
  item: MediaItem | undefined,
  options: FocusOptions = {},
  locale: LocaleCode = SOURCE_LOCALE,
): void {
  if (!item) return;

  const article = el('article', options.daily ? 'media-focus-card media-focus-card--daily' : 'media-focus-card', {
    'data-spw-cadence': options.daily ? 'daily' : 'weekly',
    'data-spw-component-kind': 'card',
    'data-spw-copy-unit': item.copyUnit || `website.mediaPublishing.${options.daily ? 'daily' : 'weekly'}`,
    'data-spw-locale': item.locale || locale,
    'data-spw-metamaterial': options.daily ? 'shell' : 'matte',
    lang: item.locale || locale,
  });
  const label = el('p', 'spec-kicker');
  label.textContent = cleanText(item.label || (options.daily ? 'Daily focus' : 'Weekly focus'));

  const titleRow = el('div', 'media-focus-title');
  const operator = createCardSigil(cleanText(item.operator || '>'), {
    className: 'frame-card-sigil media-focus-operator',
    operator: 'stream',
  });
  const headingText = cleanText(item.title || 'Current focus');
  const heading = el('h3');
  heading.textContent = headingText;
  heading.title = headingText;
  titleRow.append(operator, heading);

  const link = el('a', 'operator-chip', { href: cleanText(item.href || '#') });
  link.textContent = cleanText(item.cta || 'Open focus');

  article.append(label, titleRow);

  const summaryText = cleanText(item.summary || '');
  if (summaryText) {
    const summary = el('p');
    summary.textContent = summaryText;
    article.append(summary);
  }

  if (item.why) {
    const why = el('p', 'frame-note');
    why.textContent = cleanText(item.why);
    article.append(why);
  }

  article.append(link);
  host.replaceChildren(article);
}

function renderCollection(host: Element, items: MediaItem[] = [], locale: LocaleCode = SOURCE_LOCALE): void {
  if (!items.length) return;

  const grid = el('div', 'media-card-grid');
  items.forEach((item, index) => {
    grid.appendChild(renderItemCard(item, { featured: index === 0 }, locale));
  });

  host.replaceChildren(grid);
}

export async function initMediaPublishing(): Promise<void> {
  const focusHosts = Array.from(document.querySelectorAll<HTMLElement>('[data-media-focus]'));
  const collectionHosts = Array.from(document.querySelectorAll<HTMLElement>('[data-media-collection]'));
  if (!focusHosts.length && !collectionHosts.length) return;

  const config = await loadMediaConfig();
  if (!config) return;
  const locale = feedLocale(config);

  focusHosts.forEach((host) => {
    const mode = host.dataset.mediaFocus;
    renderFocus(host, mode === 'daily' ? getDailyFocus(config) : config.weekly, {
      daily: mode === 'daily',
    }, locale);
  });

  collectionHosts.forEach((host) => {
    const key = host.dataset.mediaCollection;
    const collection = key ? config[key] : undefined;
    renderCollection(host, Array.isArray(collection) ? collection : [], locale);
  });
}

export { feedLocale };
