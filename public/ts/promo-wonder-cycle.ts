import {
  cleanText,
  clampIndex,
  createJsonFeedLoader,
  el,
  getWeekIndex,
} from './spw-feed-utils.js';

type PromoWonderKind = 'promo' | 'wonder';
type TemporalCadence = 'daily' | 'weekly';
type LocaleCode = string;

type PromoWonderCard = {
  copyUnit?: string;
  label?: string;
  locale?: LocaleCode;
  operator?: string;
  title?: string;
  summary?: string;
  href?: string;
  cta?: string;
  why?: string;
};

type PromoWonderPair = {
  promo: PromoWonderCard;
  wonder: PromoWonderCard;
};

type PromoWonderFeed = {
  sourceLocale?: LocaleCode;
  localization?: {
    copyUnit?: string;
    notes?: string;
    prepared?: boolean;
  };
  daily?: PromoWonderPair[];
  weekly?: PromoWonderPair[];
};

const FEED_URL = '/public/data/promo-wonder-cycle.json';
const SOURCE_LOCALE = 'en';

const DEFAULT_FEED = Object.freeze({
  sourceLocale: SOURCE_LOCALE,
  localization: {
    copyUnit: 'home.promoWonderCycle',
    notes: 'Embedded fallback copy for the daily and weekly promo/wonder cycle.',
    prepared: true,
  },
  daily: [
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Help the next release land',
        summary: 'Releases are scheduled for the 13th and 26th of each month. Small support keeps the work moving and makes the next page easier to ship.',
        href: '/services/#support',
        cta: 'Open support',
        why: 'A direct contribution keeps the monthly cadence steady.',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'What changes if the page has a reason to return tomorrow?',
        summary: 'A site can feel alive when one small surface changes on a schedule. This slot is here to make that return legible.',
        href: '/about/website/',
        cta: 'See the system',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Make collaboration easy to imagine',
        summary: 'Keep the call to action low friction: a card, a button, a short route, or a clear email path to follow.',
        href: '/contact/',
        cta: 'Send a note',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'Who would be surprised by the breadth of this site?',
        summary: 'Developers, illustrators, authors, and executives all need different cues. A rotating surface can bridge those expectations.',
        href: '/about/',
        cta: 'Read about',
      },
    },
  ],
  weekly: [
    {
      promo: {
        label: 'Weekly promo',
        operator: '@',
        title: 'Keep the release rhythm steady',
        summary: 'Development costs are around $250 per month. If the work is useful, direct support keeps the public cadence open.',
        href: '/now/',
        cta: 'Review funding',
        why: 'One steady contribution helps keep releases on the 13th and 26th.',
      },
      wonder: {
        label: 'Weekly wonder',
        operator: '?',
        title: 'What structure would make this week feel worth revisiting?',
        summary: 'Weekly wonder should feel like a theme, not a slogan.',
        href: '/about/website/',
        cta: 'Read the site map',
      },
    },
    {
      promo: {
        label: 'Weekly promo',
        operator: '@',
        title: 'Show the starter kit for the decentralized team',
        summary: 'Offer routes and tools that help someone imagine joining the work without a heavy ceremony.',
        href: '/tools/',
        cta: 'Open tools',
      },
      wonder: {
        label: 'Weekly wonder',
        operator: '?',
        title: 'What would a calm, premium, living homepage look like by Friday?',
        summary: 'The answer can change with the week while the shell stays stable.',
        href: '/design/',
        cta: 'Review design',
      },
    },
  ],
}) satisfies Required<PromoWonderFeed>;

const loadFeed = createJsonFeedLoader<PromoWonderFeed>(FEED_URL, DEFAULT_FEED);

function feedLocale(feed: PromoWonderFeed): LocaleCode {
  return cleanText(feed.sourceLocale || SOURCE_LOCALE) || SOURCE_LOCALE;
}

function pickDaily(feed: PromoWonderFeed, date = new Date()): PromoWonderPair {
  const daily = Array.isArray(feed.daily) && feed.daily.length ? feed.daily : DEFAULT_FEED.daily;
  return daily[clampIndex(date.getDay(), daily.length)] ?? DEFAULT_FEED.daily[0];
}

function pickWeekly(feed: PromoWonderFeed, date = new Date()): PromoWonderPair {
  const weekly = Array.isArray(feed.weekly) && feed.weekly.length ? feed.weekly : DEFAULT_FEED.weekly;
  return weekly[clampIndex(getWeekIndex(date), weekly.length)] ?? DEFAULT_FEED.weekly[0];
}

function fallbackLabel(kind: PromoWonderKind): string {
  return kind === 'promo' ? 'Promo' : 'Wonder';
}

function fallbackTitle(kind: PromoWonderKind): string {
  return kind === 'promo' ? 'Current opportunity' : 'Current wonder';
}

function fallbackOperator(kind: PromoWonderKind): string {
  return kind === 'promo' ? '@' : '?';
}

function renderCard(
  item: PromoWonderCard = {},
  kind: PromoWonderKind = 'promo',
  cadence: TemporalCadence = 'daily',
  locale: LocaleCode = SOURCE_LOCALE,
): HTMLElement {
  const article = el('article', `promo-wonder-cycle__card promo-wonder-cycle__card--${kind}`, {
    'data-spw-cadence': cadence,
    'data-spw-copy-unit': item.copyUnit || `home.promoWonderCycle.${cadence}.${kind}`,
    'data-spw-locale': item.locale || locale,
    lang: item.locale || locale,
  });
  const label = el('p', 'spec-kicker promo-wonder-cycle__label');
  label.textContent = cleanText(item.label || fallbackLabel(kind));

  const titleRow = el('div', 'promo-wonder-cycle__title-row');
  const operator = el('span', 'frame-card-sigil promo-wonder-cycle__operator', { 'aria-hidden': 'true' });
  operator.textContent = cleanText(item.operator || fallbackOperator(kind));
  const heading = el('h3');
  heading.textContent = cleanText(item.title || fallbackTitle(kind));
  titleRow.append(operator, heading);

  const summary = el('p', 'promo-wonder-cycle__summary');
  summary.textContent = cleanText(item.summary || '');

  article.append(label, titleRow, summary);

  const why = cleanText(item.why || '');
  if (why) {
    const note = el('p', 'promo-wonder-cycle__why');
    note.textContent = why;
    article.append(note);
  }

  if (item.href) {
    const link = el('a', 'operator-chip promo-wonder-cycle__cta', {
      href: cleanText(item.href),
    });
    link.textContent = cleanText(item.cta || 'Open');
    article.append(link);
  }

  return article;
}

function renderFeed(host: Element, feed: PromoWonderFeed, date = new Date()): void {
  const daily = pickDaily(feed, date);
  const weekly = pickWeekly(feed, date);
  const locale = feedLocale(feed);
  const dayLabel = cleanText(date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
  const weekLabel = `Week ${String(getWeekIndex(date) + 1)}`;

  const section = el('section', 'site-frame promo-wonder-cycle', {
    'data-spw-feature': 'promo-wonder-cycle',
    'data-spw-locale': locale,
    'data-spw-timing-model': 'daily weekly',
    'aria-labelledby': 'promo-wonder-cycle-title',
  });

  const top = el('div', 'frame-heading');
  const sigil = el('a', 'frame-sigil', { href: '#promo-wonder-cycle' });
  sigil.textContent = '#>promo_wonder_cycle';
  const heading = el('h2', '', { id: 'promo-wonder-cycle-title' });
  heading.textContent = 'A reason to wonder today';
  top.append(sigil, heading);

  const intro = el('p', 'inline-note promo-wonder-cycle__intro');
  intro.textContent = 'One card stays promotional and one stays curious. Both can change by day or week, and both have accessible links if JavaScript is unavailable.';

  const meta = el('p', 'promo-wonder-cycle__meta');
  const dayTime = el('time');
  dayTime.dateTime = date.toISOString();
  dayTime.textContent = dayLabel;
  const weekSpan = el('span');
  weekSpan.textContent = weekLabel;
  meta.append('Updated for ', dayTime, ' · ', weekSpan);

  const grid = el('div', 'promo-wonder-cycle__grid');
  grid.append(renderCard(daily.promo, 'promo', 'daily', locale), renderCard(daily.wonder, 'wonder', 'daily', locale));

  const weeklyGrid = el('div', 'promo-wonder-cycle__weekly');
  weeklyGrid.append(renderCard(weekly.promo, 'promo', 'weekly', locale), renderCard(weekly.wonder, 'wonder', 'weekly', locale));

  const fallback = el('p', 'frame-note promo-wonder-cycle__fallback');
  fallback.textContent = 'If the feed is unavailable, the site falls back to the embedded daily and weekly structures in code.';

  section.append(top, intro, meta, grid, weeklyGrid, fallback);
  host.replaceChildren(section);
}

export async function initPromoWonderCycle(): Promise<void> {
  const hosts = Array.from(document.querySelectorAll('[data-promo-wonder-cycle]'));
  if (!hosts.length) return;

  const feed = await loadFeed();
  hosts.forEach((host) => {
    renderFeed(host, feed, new Date());
  });
}
