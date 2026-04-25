const FEED_URL = '/public/data/promo-wonder-cycle.json';
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DEFAULT_FEED = Object.freeze({
  daily: [
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Start with the smallest useful next step',
        summary: 'Open the route that best matches the work you need today, then move from curiosity to a concrete conversation.',
        href: '/contact/',
        cta: 'Open contact',
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
        title: 'Package the work as a readable offer',
        summary: 'If you are hiring, commissioning, or comparing, the page should say what happens next without making people decode it.',
        href: '/services/',
        cta: 'Review services',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'Which route feels like a doorway instead of a destination?',
        summary: 'Some pages are anchors, some are invitations, and some are thresholds. This slot gives the threshold a name.',
        href: '/topics/software/',
        cta: 'Enter topics',
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
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Point to the tool that reduces effort',
        summary: 'The right entry point is often a small utility, a clear route, or a sample that lowers the cost of starting.',
        href: '/tools/',
        cta: 'Browse tools',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'What if the site behaved like a well-run studio?',
        summary: 'The interface can express rhythm, attention, and stewardship without pretending everything is static.',
        href: '/design/',
        cta: 'See design',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Offer an entry path for a serious first conversation',
        summary: 'The first answer should help someone decide whether they are in the right place before they spend more time.',
        href: '/contact/',
        cta: 'Start contact',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'Which part of the site is a living specimen today?',
        summary: 'A daily change makes the surface feel maintained, not merely published.',
        href: '/blog/',
        cta: 'Inspect blog',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Keep the work visible enough to trust',
        summary: 'People tend to trust a site more when the structure says what it is doing and what it is for.',
        href: '/about/website/',
        cta: 'Inspect the site',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'What does this week want to teach?',
        summary: 'A weekly frame can carry a larger theme, while daily details keep the site fresh and human.',
        href: '/topics/craft/',
        cta: 'Study craft',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'Give people a place to begin and a reason to stay',
        summary: 'A homepage can do both: point to useful work and create enough atmosphere to invite a second look.',
        href: '/topics/software/spw/',
        cta: 'Learn Spw',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'What kind of collaborator would this site attract?',
        summary: 'The answer should be broader than one discipline. The structure can help people imagine themselves inside it.',
        href: '/play/rpg-wednesday/',
        cta: 'Visit play',
      },
    },
  ],
  weekly: [
    {
      promo: {
        label: 'Weekly promo',
        operator: '@',
        title: 'Hire for readable systems and strong creative coordination',
        summary: 'The weekly offer can frame deeper collaboration, not just a one-off task.',
        href: '/contact/',
        cta: 'Discuss a project',
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
        title: 'Make the work legible to a new teammate quickly',
        summary: 'Good surfaces reduce onboarding time for developers, illustrators, and authors alike.',
        href: '/topics/software/',
        cta: 'Browse software',
      },
      wonder: {
        label: 'Weekly wonder',
        operator: '?',
        title: 'Which gap in career breadth is the site ready to bridge?',
        summary: 'The site can welcome a person with senior relationships and missing context without shaming the gap.',
        href: '/about/',
        cta: 'See about',
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
    {
      promo: {
        label: 'Weekly promo',
        operator: '@',
        title: 'Turn curiosity into a clear conversation',
        summary: 'A good weekly card can invite work, not merely attention.',
        href: '/services/',
        cta: 'See services',
      },
      wonder: {
        label: 'Weekly wonder',
        operator: '?',
        title: 'What part of the site should feel newly alive this week?',
        summary: 'This is the place for a slightly stranger question than the daily slot.',
        href: '/blog/',
        cta: 'Read blog',
      },
    },
  ],
});

let cachedFeed = null;

const el = (tag, className, attrs = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) node.setAttribute(key, value);
  });
  return node;
};

const cleanText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const clampIndex = (index, length) => {
  if (!length) return 0;
  return ((index % length) + length) % length;
};

const getWeekIndex = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getFullYear(), 0, 1));
  const diff = date - start;
  return Math.floor(diff / 604800000);
};

const loadFeed = async () => {
  if (cachedFeed) return cachedFeed;

  try {
    const response = await fetch(FEED_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Unable to load promo/wonder feed: ${response.status}`);
    cachedFeed = await response.json();
  } catch {
    cachedFeed = DEFAULT_FEED;
  }

  return cachedFeed;
};

const pickDaily = (feed, date = new Date()) => {
  const daily = Array.isArray(feed.daily) && feed.daily.length ? feed.daily : DEFAULT_FEED.daily;
  const item = daily[clampIndex(date.getDay(), daily.length)];
  return item || DEFAULT_FEED.daily[clampIndex(date.getDay(), DEFAULT_FEED.daily.length)];
};

const pickWeekly = (feed, date = new Date()) => {
  const weekly = Array.isArray(feed.weekly) && feed.weekly.length ? feed.weekly : DEFAULT_FEED.weekly;
  const item = weekly[clampIndex(getWeekIndex(date), weekly.length)];
  return item || DEFAULT_FEED.weekly[clampIndex(getWeekIndex(date), DEFAULT_FEED.weekly.length)];
};

const renderCard = (item = {}, kind = 'promo') => {
  const article = el('article', `promo-wonder-cycle__card promo-wonder-cycle__card--${kind}`);
  const label = el('p', 'spec-kicker promo-wonder-cycle__label');
  label.textContent = cleanText(item.label || (kind === 'promo' ? 'Promo' : 'Wonder'));

  const titleRow = el('div', 'promo-wonder-cycle__title-row');
  const operator = el('span', 'frame-card-sigil promo-wonder-cycle__operator', { 'aria-hidden': 'true' });
  operator.textContent = cleanText(item.operator || (kind === 'promo' ? '@' : '?'));
  const heading = el('h3');
  heading.textContent = cleanText(item.title || (kind === 'promo' ? 'Current opportunity' : 'Current wonder'));
  titleRow.append(operator, heading);

  const summary = el('p', 'promo-wonder-cycle__summary');
  summary.textContent = cleanText(item.summary || '');

  article.append(label, titleRow, summary);

  if (item.href) {
    const link = el('a', 'operator-chip promo-wonder-cycle__cta', {
      href: cleanText(item.href),
    });
    link.textContent = cleanText(item.cta || 'Open');
    article.append(link);
  }

  return article;
};

const renderFeed = (host, feed, date = new Date()) => {
  const daily = pickDaily(feed, date);
  const weekly = pickWeekly(feed, date);
  const dayLabel = cleanText(date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
  const weekLabel = `Week ${String(getWeekIndex(date) + 1)}`;

  const section = el('section', 'site-frame promo-wonder-cycle', {
    'data-spw-feature': 'promo-wonder-cycle',
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
  meta.innerHTML = '';
  const dayTime = el('time');
  dayTime.dateTime = date.toISOString();
  dayTime.textContent = dayLabel;
  const weekSpan = el('span');
  weekSpan.textContent = weekLabel;
  meta.append('Updated for ', dayTime, ' · ', weekSpan);

  const grid = el('div', 'promo-wonder-cycle__grid');
  grid.append(renderCard(daily.promo, 'promo'), renderCard(daily.wonder, 'wonder'));

  const weeklyGrid = el('div', 'promo-wonder-cycle__weekly');
  weeklyGrid.append(renderCard(weekly.promo, 'promo'), renderCard(weekly.wonder, 'wonder'));

  const fallback = el('p', 'frame-note promo-wonder-cycle__fallback');
  fallback.textContent = 'If the feed is unavailable, the site falls back to the embedded daily and weekly structures in code.';

  section.append(top, intro, meta, grid, weeklyGrid, fallback);
  host.replaceChildren(section);
};

export const initPromoWonderCycle = async () => {
  const hosts = Array.from(document.querySelectorAll('[data-promo-wonder-cycle]'));
  if (!hosts.length) return;

  const feed = await loadFeed();
  hosts.forEach((host) => {
    renderFeed(host, feed, new Date());
  });
};
