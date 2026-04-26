import {
  DAY_KEYS,
  cleanText,
  createJsonFeedLoader,
  el,
  type DayKey,
} from './spw-feed-utils.js';

type LocaleCode = string;

type MediaItem = {
  copyUnit?: string;
  cta?: string;
  href?: string;
  label?: string;
  locale?: LocaleCode;
  operator?: string;
  summary?: string;
  tag?: string;
  title?: string;
  why?: string;
};

type LocalizationMeta = {
  copyUnit?: string;
  notes?: string;
  prepared?: boolean;
};

type MediaPublishingConfig = {
  daily?: Partial<Record<DayKey, MediaItem>>;
  localization?: LocalizationMeta;
  sourceLocale?: LocaleCode;
  weekly?: MediaItem;
  [key: string]:
    | LocaleCode
    | MediaItem[]
    | MediaItem
    | Partial<Record<DayKey, MediaItem>>
    | LocalizationMeta
    | undefined;
};

type CardOptions = {
  featured?: boolean;
  showCta?: boolean;
};

type FocusOptions = {
  daily?: boolean;
};

const MEDIA_FOCUS_URL = '/public/data/media-focus.json';
const SOURCE_LOCALE = 'en';
const loadMediaConfig = createJsonFeedLoader<MediaPublishingConfig | null>(MEDIA_FOCUS_URL, null);

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
    'data-spw-copy-unit': item.copyUnit || 'website.mediaPublishing.collection',
    'data-spw-locale': item.locale || locale,
    href,
    lang: item.locale || locale,
  });

  const topline = el('span', 'media-card-topline');
  const operator = el('span', 'frame-card-sigil media-card-operator');
  operator.textContent = cleanText(item.operator || '>');
  topline.append(operator);

  if (item.tag) {
    const tag = el('span', 'media-card-tag');
    tag.textContent = cleanText(item.tag);
    topline.append(tag);
  }

  const title = el('strong', 'media-card-title');
  title.textContent = cleanText(item.title || 'Untitled feature');

  const summary = el('span', 'media-card-summary');
  summary.textContent = cleanText(item.summary || item.why || '');

  card.append(topline, title, summary);

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
    'data-spw-copy-unit': item.copyUnit || `website.mediaPublishing.${options.daily ? 'daily' : 'weekly'}`,
    'data-spw-locale': item.locale || locale,
    lang: item.locale || locale,
  });
  const label = el('p', 'spec-kicker');
  label.textContent = cleanText(item.label || (options.daily ? 'Daily focus' : 'Weekly focus'));

  const titleRow = el('div', 'media-focus-title');
  const operator = el('span', 'frame-card-sigil media-focus-operator');
  operator.textContent = cleanText(item.operator || '>');
  const heading = el('h3');
  heading.textContent = cleanText(item.title || 'Current focus');
  titleRow.append(operator, heading);

  const summary = el('p');
  summary.textContent = cleanText(item.summary || '');

  const link = el('a', 'operator-chip', { href: cleanText(item.href || '#') });
  link.textContent = cleanText(item.cta || 'Open focus');

  article.append(label, titleRow, summary);

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
