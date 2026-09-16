import {
  createCardSigil,
} from './kernel-dom-contracts.js';
import {
  cleanText,
  clampIndex,
  createJsonFeedLoader,
  el,
  getWeekIndex,
} from './feed-utils.js';
import type {
  LocaleCode,
  PromoPresentation,
  PromoWonderCard,
  PromoWonderFeed,
  PromoWonderPair,
  PromotionKind,
} from './json-feeds.js';
import { validatePromoWonderFeed } from './json-feeds.js';

type PromoWonderKind = 'promo' | 'wonder';
type TemporalCadence = 'daily' | 'weekly' | 'cycle';
type ReleaseCycle = 'A-cycle' | 'B-cycle' | '';
type ReleaseForecast = Readonly<{
  date: Date;
  cycle: Exclude<ReleaseCycle, ''>;
  daysAway: number;
}>;

const FEED_URL = '/public/data/promo-wonder-cycle.json';
const SOURCE_LOCALE = 'en';

const DEFAULT_FEED = Object.freeze({
  sourceLocale: SOURCE_LOCALE,
  localization: {
    copyUnit: 'home.promoWonderCycle',
    notes: 'Embedded fallback copy for the daily and weekly promo/wonder cycle.',
    prepared: true,
  },
  promotionPlaybook: {
    purpose: 'Give teammates a copy-and-paste brief for event, deal, discount, or service promotion.',
    note: 'Use the playbook when a promotion needs to be explained to someone who does not know the site well enough to improvise the structure.',
    kinds: {
      event: {
        goal: 'Drive attendance',
        psychology: 'anticipation and social proof',
        structure: 'lead with what it is, when it happens, and why the room matters',
        presentation: 'modal' as PromoPresentation,
        ctaPattern: 'Join / RSVP / Save the date',
        proof: 'speaker, venue, time, and who else it is for',
        riskReversal: 'clear cancellation or reminder path',
      },
      deal: {
        goal: 'Make the offer legible and time-bound',
        psychology: 'clarity plus urgency',
        structure: 'state the deal, the savings, and the deadline in the first pass',
        presentation: 'toast' as PromoPresentation,
        ctaPattern: 'Claim / View deal / Start',
        proof: 'before/after price, scope, and conditions',
        riskReversal: 'simple exit or low-friction next step',
      },
      discount: {
        goal: 'Reduce hesitation with a concrete savings frame',
        psychology: 'loss aversion and specificity',
        structure: 'show the original price, the discount, and the net result',
        presentation: 'toast' as PromoPresentation,
        ctaPattern: 'Use discount / Get code / Apply',
        proof: 'exact amount saved and eligible audience',
        riskReversal: 'clear terms and a no-surprise promise',
      },
      service: {
        goal: 'Turn a service into an understandable next step',
        psychology: 'risk reversal and outcome clarity',
        structure: 'state the outcome, the method, and the first conversation',
        presentation: 'modal' as PromoPresentation,
        ctaPattern: 'Book / Start / Review service',
        proof: 'examples, scope, and a concise proof point',
        riskReversal: 'what happens if the fit is not right',
      },
    },
  },
  /* The cycle pair leads the section and matches the static HTML, so the first
     thing a reader sees does not change when the feed hydrates. Attention runs
     from what changed (try it), to a question worth carrying, to the close. */
  cycle: {
    promo: {
      label: 'What changed',
      operator: '@',
      title: 'The runtime now has named owners',
      summary: 'Catalog, loading, and teardown keep their own rooms. A remount waits; a missing mount fails in the open.',
      href: '/now/#since-the-close',
      cta: 'Open the B-cycle receipt',
      why: 'The receipts are on Now. Home, Settings, and Software already boot on the new owners.',
      copyUnit: 'home.promoWonderCycle.cycle.promo',
      presentation: 'modal' as PromoPresentation,
      promotion: {
        kind: 'release' as PromotionKind,
        audience: 'returning readers and software-adjacent supporters checking whether this cycle left a concrete receipt',
        offer: 'Named runtime ownership: remounts wait, missing mounts fail in the open',
        proof: 'Now lists the September 15 ownership and lifecycle receipts; 375 local tests; Chrome ready on Home, Settings, and Software.',
        objection: 'An architecture claim should name a public surface, not only a folder tree.',
        urgency: 'Live now; the B-cycle closes September 26.',
        tone: 'clear',
        theme: 'glass',
        handles: ['runtime', 'ownership', 'cycle', 'receipts'],
        ctaStyle: 'primary',
        presentation: 'modal' as PromoPresentation,
      },
    },
    wonder: {
      label: 'Cycle question',
      operator: '?',
      title: "Who should set the site's tempo: you, the page, or the stylesheet?",
      summary: 'Rhythm authority is new this cycle. Choose an author, and the rail beside it plays the tempo that wins.',
      href: '/settings/#rhythm-authority-settings',
      cta: 'Choose a rhythm author',
      why: 'Practice: pick one author, read a few pages, and notice whether the rhythm helps or distracts.',
      copyUnit: 'home.promoWonderCycle.cycle.wonder',
    },
  },
  daily: [
    {
      promo: {
        label: 'Release record',
        operator: '@',
        title: 'Revisit the September 13 record',
        summary: 'The three-surface close and its receipts stay on Now while this cycle builds on them.',
        href: '/now/#release-receipts',
        cta: 'Open the receipts',
        why: 'A completed close is the ground this cycle stands on.',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'Which receipt still matters a cycle later?',
        summary: 'Pick one line from the close and follow it into its route. If it still helps there, it belongs in this cycle.',
        href: '/now/#release-receipts',
        cta: 'Pick one receipt',
      },
    },
    {
      promo: {
        label: 'Daily promo',
        operator: '@',
        title: 'See the layers the pages are built from',
        summary: 'Design is the public map of the same surfaces Settings tunes: slots, palettes, and reading weather.',
        href: '/design/',
        cta: 'Open design',
      },
      wonder: {
        label: 'Daily wonder',
        operator: '?',
        title: 'Which layer would you keep if you had to choose one?',
        summary: 'Workflow, climate, and attention posture are separate levers. The point is to pick one and feel it.',
        href: '/settings/#author-workflow-settings',
        cta: 'Open workflow',
      },
    },
  ],
  weekly: [
    {
      promo: {
        label: 'Weekly promo',
        operator: '@',
        title: 'Configure the site you are already on',
        summary: 'Appearance, density, and chrome are the same layers the pages use. Settings is where you keep a configuration.',
        href: '/settings/',
        cta: 'Open settings',
        why: 'A kept configuration is more useful than a tour.',
        presentation: 'inline' as PromoPresentation,
        promotion: {
          kind: 'service' as PromotionKind,
          audience: 'people deciding whether the site is theirs to tune',
          offer: 'A browser-local configuration that the rest of the site already honors',
          proof: 'Presets, workflow, climate, and attention posture are named surfaces, not hidden flags.',
          objection: 'It should be obvious that a setting changes the page under you.',
          urgency: 'The first pass is a preset; deeper registers wait until something still feels off.',
          tone: 'direct',
          theme: 'signal',
          handles: ['settings', 'configuration', 'layers', 'presets'],
          ctaStyle: 'primary',
          presentation: 'inline' as PromoPresentation,
        },
      },
      wonder: {
        label: 'Weekly wonder',
        operator: '?',
        title: 'What would you turn down first?',
        summary: 'Attention posture is the quiet lever: how much the page asks of you at once.',
        href: '/settings/#attention-posture-settings',
        cta: 'Tune attention',
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

const loadFeed = createJsonFeedLoader<PromoWonderFeed>(FEED_URL, DEFAULT_FEED, {
  label: 'promo-wonder-cycle',
  validate: (value): value is PromoWonderFeed => validatePromoWonderFeed(value).ok,
});

export function feedLocale(feed: PromoWonderFeed): LocaleCode {
  return cleanText(feed.sourceLocale || SOURCE_LOCALE) || SOURCE_LOCALE;
}

export function pickDaily(feed: PromoWonderFeed, date = new Date()): PromoWonderPair {
  const daily = Array.isArray(feed.daily) && feed.daily.length ? feed.daily : DEFAULT_FEED.daily;
  return daily[clampIndex(date.getDay(), daily.length)] ?? DEFAULT_FEED.daily[0];
}

export function pickWeekly(feed: PromoWonderFeed, date = new Date()): PromoWonderPair {
  const weekly = Array.isArray(feed.weekly) && feed.weekly.length ? feed.weekly : DEFAULT_FEED.weekly;
  return weekly[clampIndex(getWeekIndex(date), weekly.length)] ?? DEFAULT_FEED.weekly[0];
}

export function releaseCycleForDate(date = new Date()): ReleaseCycle {
  if (date.getDate() === 13) return 'A-cycle';
  if (date.getDate() === 26) return 'B-cycle';
  return '';
}

export function dailyCadenceForDate(date = new Date()): TemporalCadence {
  return releaseCycleForDate(date) ? 'cycle' : 'daily';
}

export function upcomingReleaseForecasts(date = new Date(), count = 2): ReleaseForecast[] {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const candidates: Date[] = [];

  for (let monthOffset = 0; candidates.length < count + 2; monthOffset += 1) {
    const month = date.getMonth() + monthOffset;
    for (const day of [13, 26]) {
      const candidate = new Date(date.getFullYear(), month, day);
      if (candidate >= today) candidates.push(candidate);
    }
  }

  return candidates
    .sort((left, right) => left.getTime() - right.getTime())
    .slice(0, count)
    .map((candidate) => ({
      date: candidate,
      cycle: releaseCycleForDate(candidate) as Exclude<ReleaseCycle, ''>,
      daysAway: Math.round((candidate.getTime() - today.getTime()) / 86_400_000),
    }));
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

function cardOperatorType(kind: PromoWonderKind): string {
  return kind === 'promo' ? 'perspective' : 'probe';
}

function ctaOperatorType(kind: PromoWonderKind): string {
  return kind === 'promo' ? 'action' : 'probe';
}

function getInlinePresentation(): PromoPresentation {
  return 'inline';
}

function getPromotionHandles(item: PromoWonderCard): string[] {
  return Array.isArray(item.promotion?.handles)
    ? item.promotion.handles.map((handle) => cleanText(handle)).filter(Boolean)
    : [];
}

function getPromotionTheme(item: PromoWonderCard): string {
  return cleanText(item.promotion?.theme || '');
}

function getPromotionKind(item: PromoWonderCard): PromotionKind | '' {
  return cleanText(item.promotion?.kind || '') as PromotionKind | '';
}

function renderCard(
  item: PromoWonderCard = {},
  kind: PromoWonderKind = 'promo',
  cadence: TemporalCadence = 'daily',
  locale: LocaleCode = SOURCE_LOCALE,
  compact = false,
): HTMLElement {
  const article = el('article', `promo-wonder-cycle__card promo-wonder-cycle__card--${kind}${compact ? ' promo-wonder-cycle__card--compact' : ''}`, {
    'data-spw-cadence': cadence,
    'data-spw-copy-unit': item.copyUnit || `home.promoWonderCycle.${cadence}.${kind}`,
    'data-spw-presentation': getInlinePresentation(),
    'data-spw-locale': item.locale || locale,
    lang: item.locale || locale,
  });
  const promotionKind = getPromotionKind(item);
  const promotionTheme = getPromotionTheme(item);
  const promotionHandles = getPromotionHandles(item);
  if (promotionKind) article.dataset.spwPromotionKind = promotionKind;
  if (promotionTheme) article.dataset.spwPromotionTheme = promotionTheme;
  if (item.promotion?.ctaStyle) article.dataset.spwPromotionCtaStyle = cleanText(item.promotion.ctaStyle);
  if (promotionHandles.length) article.dataset.spwPromotionHandles = promotionHandles.join(' ');

  const label = el('p', 'spec-kicker promo-wonder-cycle__label');
  label.textContent = compact
    ? fallbackLabel(kind)
    : cleanText(item.label || fallbackLabel(kind));

  const titleRow = el('div', 'promo-wonder-cycle__title-row');
  const operator = createCardSigil(cleanText(item.operator || fallbackOperator(kind)), {
    className: 'frame-card-sigil promo-wonder-cycle__operator',
    operator: cardOperatorType(kind),
    ariaHidden: true,
  });
  const headingText = cleanText(item.title || fallbackTitle(kind));
  /* No title tooltip: it repeated the visible heading on hover and gave screen
     readers the same words twice. */
  const heading = el('h3');
  heading.textContent = headingText;
  titleRow.append(operator, heading);

  article.append(label, titleRow);

  const summaryText = cleanText(item.summary || '');
  if (summaryText) {
    const summary = el('p', 'promo-wonder-cycle__summary');
    summary.textContent = summaryText;
    article.append(summary);
  }

  const why = cleanText(item.why || '');
  if (why && !compact) {
    const note = el('p', 'promo-wonder-cycle__why');
    note.textContent = why;
    article.append(note);
  }

  if (item.href) {
    const link = el('a', 'spw-chip promo-wonder-cycle__cta', {
      href: cleanText(item.href),
      'data-spw-handle': 'true',
      'data-spw-operator': ctaOperatorType(kind),
    });
    link.textContent = cleanText(item.cta || 'Open');
    const cue = el('span', 'promo-wonder-cycle__cta-cue', {
      'aria-hidden': 'true',
    });
    cue.textContent = kind === 'promo' ? '! \u2192' : '? \u219D';
    link.append(cue);
    article.append(link);
  }

  return article;
}

function resolveMount(host: Element): Element {
  return host.querySelector('[data-spw-static-for="promo-wonder-cycle"], .promo-wonder-cycle__static-fallback')
    || host;
}

function forecastDateLabel(date: Date, locale: LocaleCode, compact = false): string {
  return date.toLocaleDateString(locale, compact
    ? { month: 'short', day: 'numeric' }
    : { weekday: 'long', month: 'long', day: 'numeric' });
}

function forecastTiming(forecast: ReleaseForecast): string {
  if (forecast.daysAway === 0) return `${forecast.cycle} closes today.`;
  const days = forecast.daysAway === 1 ? '1 day' : `${forecast.daysAway} days`;
  return `${days} until the ${forecast.cycle} close.`;
}

function forecastStepCopy(forecast: ReleaseForecast, index: number): string {
  const order = index === 0 ? 'Next' : 'Then';
  if (forecast.daysAway === 0) return `${order} \u00b7 ${forecast.cycle} closes today`;
  const days = forecast.daysAway === 1 ? 'in 1 day' : `in ${forecast.daysAway} days`;
  return `${order} \u00b7 ${forecast.cycle} \u00b7 ${days}`;
}

/* One timeline, not a button row above a list that repeats it. Each step is
   the control: pressing it moves the heading and the days-left line to that
   close, so the count of days appears once and the choice is the reward. */
function renderForecast(date: Date, locale: LocaleCode): HTMLElement {
  const forecasts = upcomingReleaseForecasts(date);
  const forecast = el('section', 'promo-wonder-cycle__forecast', {
    'aria-labelledby': 'promo-wonder-cycle-forecast-title',
  });
  const kicker = el('p', 'spec-kicker promo-wonder-cycle__forecast-kicker');
  kicker.textContent = 'Schedule forecast';
  const title = el('h3', 'promo-wonder-cycle__forecast-title', {
    id: 'promo-wonder-cycle-forecast-title',
  });
  const description = el('p', 'promo-wonder-cycle__forecast-description', {
    'aria-live': 'polite',
  });
  const timeline = el('ol', 'promo-wonder-cycle__forecast-timeline', {
    'aria-label': 'Release forecast horizon',
  });
  const buttons: HTMLButtonElement[] = [];
  const steps: HTMLLIElement[] = [];

  const selectForecast = (selectedIndex: number): void => {
    const selected = forecasts[selectedIndex];
    if (!selected) return;
    title.textContent = `Next close: ${selected.cycle} \u00b7 ${forecastDateLabel(selected.date, locale)}`;
    description.textContent = `${forecastTiming(selected)} Carry what you try here toward it.`;
    buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selectedIndex)));
    steps.forEach((step, index) => step.classList.toggle('is-selected', index === selectedIndex));
  };

  forecasts.forEach((item, index) => {
    const step = el('li', 'promo-wonder-cycle__forecast-step');
    const button = el('button', 'promo-wonder-cycle__forecast-button', {
      type: 'button',
      'aria-pressed': 'false',
    });
    const stepDate = el('time');
    stepDate.dateTime = [
      item.date.getFullYear(),
      String(item.date.getMonth() + 1).padStart(2, '0'),
      String(item.date.getDate()).padStart(2, '0'),
    ].join('-');
    stepDate.textContent = forecastDateLabel(item.date, locale, true);
    const stepCopy = el('span');
    stepCopy.textContent = forecastStepCopy(item, index);
    button.append(stepDate, stepCopy);
    button.addEventListener('click', () => selectForecast(index));
    buttons.push(button as HTMLButtonElement);
    step.append(button);
    steps.push(step as HTMLLIElement);
    timeline.append(step);
  });

  forecast.append(kicker, title, description, timeline);
  selectForecast(0);
  return forecast;
}

/* Reading order is the attention order: what changed this cycle and a question
   to carry (the pinned cycle pair, identical to the static HTML so hydration
   does not swap the cards under the reader), then the days left to carry it,
   then the week's quieter pair. The weekday pair stays in the feed for
   discovery notices rather than competing here. */
export function renderFeed(host: Element, feed: PromoWonderFeed, date = new Date()): void {
  const cycle = feed.cycle?.promo || feed.cycle?.wonder ? feed.cycle : DEFAULT_FEED.cycle;
  const weekly = pickWeekly(feed, date);
  const locale = feedLocale(feed);
  const releaseCycle = releaseCycleForDate(date);
  const nextClose = upcomingReleaseForecasts(date, 1)[0];
  const dayLabel = cleanText(date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }));
  const dayStamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  if (host instanceof HTMLElement) {
    host.dataset.spwLocale = locale;
    host.lang = locale;
  }

  const meta = el('p', 'promo-wonder-cycle__meta');
  const dayTime = el('time');
  dayTime.dateTime = dayStamp;
  dayTime.textContent = dayLabel;
  meta.append(dayTime);
  const releaseMarker = el('strong', 'promo-wonder-cycle__release');
  releaseMarker.textContent = releaseCycle
    ? `${releaseCycle} release day`
    : `${nextClose?.cycle || 'Next cycle'} in progress`;
  meta.append(' · ', releaseMarker);

  /* No region-flow overlay: the pair sits side by side, like the static fallback. */
  const grid = el('div', 'promo-wonder-cycle__grid');
  grid.append(
    renderCard(cycle?.promo, 'promo', 'cycle', locale),
    renderCard(cycle?.wonder, 'wonder', 'cycle', locale),
  );

  /* The kicker sits above its own pair grid rather than spanning the pair's
     tracks, so the two compact cards share the row the way the cycle pair does. */
  const weeklyGroup = el('div', 'promo-wonder-cycle__weekly');
  weeklyGroup.setAttribute('aria-label', 'This week');
  const weeklyKicker = el('p', 'spec-kicker promo-wonder-cycle__weekly-kicker');
  weeklyKicker.textContent = 'This week';
  const weeklyGrid = el('div', 'promo-wonder-cycle__grid');
  weeklyGrid.append(
    renderCard(weekly.promo, 'promo', 'weekly', locale, true),
    renderCard(weekly.wonder, 'wonder', 'weekly', locale, true),
  );
  weeklyGroup.append(weeklyKicker, weeklyGrid);

  const mount = resolveMount(host);
  mount.classList.add('promo-wonder-cycle__live');
  mount.replaceChildren(meta, grid, renderForecast(date, locale), weeklyGroup);
}

export async function initPromoWonderCycle(): Promise<void> {
  const hosts = Array.from(document.querySelectorAll('[data-promo-wonder-cycle]'));
  if (!hosts.length) return;

  const feed = await loadFeed();
  hosts.forEach((host) => {
    renderFeed(host, feed, new Date());
  });
}
