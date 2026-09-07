import { createCardSigil, } from './kernel-dom-contracts.js';
import { cleanText, clampIndex, createJsonFeedLoader, el, getWeekIndex, } from './feed-utils.js';
import { validatePromoWonderFeed } from './json-feeds.js';
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
                presentation: 'modal',
                ctaPattern: 'Join / RSVP / Save the date',
                proof: 'speaker, venue, time, and who else it is for',
                riskReversal: 'clear cancellation or reminder path',
            },
            deal: {
                goal: 'Make the offer legible and time-bound',
                psychology: 'clarity plus urgency',
                structure: 'state the deal, the savings, and the deadline in the first pass',
                presentation: 'toast',
                ctaPattern: 'Claim / View deal / Start',
                proof: 'before/after price, scope, and conditions',
                riskReversal: 'simple exit or low-friction next step',
            },
            discount: {
                goal: 'Reduce hesitation with a concrete savings frame',
                psychology: 'loss aversion and specificity',
                structure: 'show the original price, the discount, and the net result',
                presentation: 'toast',
                ctaPattern: 'Use discount / Get code / Apply',
                proof: 'exact amount saved and eligible audience',
                riskReversal: 'clear terms and a no-surprise promise',
            },
            service: {
                goal: 'Turn a service into an understandable next step',
                psychology: 'risk reversal and outcome clarity',
                structure: 'state the outcome, the method, and the first conversation',
                presentation: 'modal',
                ctaPattern: 'Book / Start / Review service',
                proof: 'examples, scope, and a concise proof point',
                riskReversal: 'what happens if the fit is not right',
            },
        },
    },
    daily: [
        {
            promo: {
                label: 'Daily promo',
                operator: '@',
                title: 'Keep a configuration that fits how you read',
                summary: 'Presets, workflow, and climate stay in this browser. One change is enough to feel the page answer.',
                href: '/settings/#presets',
                cta: 'Open presets',
                why: 'Quick Start is the fastest useful control surface on the site.',
                presentation: 'inline',
                promotion: {
                    kind: 'service',
                    audience: 'people who want the site to match how they actually read',
                    offer: 'A browser-local preset, workflow, and climate you can keep',
                    proof: 'Settings saves in this browser and the rest of the site already listens.',
                    objection: 'It should change the page, not just document the knobs.',
                    urgency: 'The first useful change is a preset.',
                    tone: 'clear',
                    theme: 'signal',
                    handles: ['settings', 'presets', 'climate', 'workflow'],
                    ctaStyle: 'primary',
                    presentation: 'inline',
                },
            },
            wonder: {
                label: 'Daily wonder',
                operator: '?',
                title: 'What if this page had a different climate?',
                summary: 'Climate is the attention posture. Try one, then leave — the site keeps it.',
                href: '/settings/#climate-settings',
                cta: 'Try climate',
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
                presentation: 'inline',
                promotion: {
                    kind: 'service',
                    audience: 'people deciding whether the site is theirs to tune',
                    offer: 'A browser-local configuration that the rest of the site already honors',
                    proof: 'Presets, workflow, climate, and attention posture are named surfaces, not hidden flags.',
                    objection: 'It should be obvious that a setting changes the page under you.',
                    urgency: 'The first pass is a preset; deeper registers wait until something still feels off.',
                    tone: 'direct',
                    theme: 'signal',
                    handles: ['settings', 'configuration', 'layers', 'presets'],
                    ctaStyle: 'primary',
                    presentation: 'inline',
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
});
const loadFeed = createJsonFeedLoader(FEED_URL, DEFAULT_FEED, {
    label: 'promo-wonder-cycle',
    validate: (value) => validatePromoWonderFeed(value).ok,
});
export function feedLocale(feed) {
    return cleanText(feed.sourceLocale || SOURCE_LOCALE) || SOURCE_LOCALE;
}
export function pickDaily(feed, date = new Date()) {
    const daily = Array.isArray(feed.daily) && feed.daily.length ? feed.daily : DEFAULT_FEED.daily;
    return daily[clampIndex(date.getDay(), daily.length)] ?? DEFAULT_FEED.daily[0];
}
export function pickWeekly(feed, date = new Date()) {
    const weekly = Array.isArray(feed.weekly) && feed.weekly.length ? feed.weekly : DEFAULT_FEED.weekly;
    return weekly[clampIndex(getWeekIndex(date), weekly.length)] ?? DEFAULT_FEED.weekly[0];
}
function fallbackLabel(kind) {
    return kind === 'promo' ? 'Promo' : 'Wonder';
}
function fallbackTitle(kind) {
    return kind === 'promo' ? 'Current opportunity' : 'Current wonder';
}
function fallbackOperator(kind) {
    return kind === 'promo' ? '@' : '?';
}
function cardOperatorType(kind) {
    return kind === 'promo' ? 'perspective' : 'probe';
}
function getInlinePresentation() {
    return 'inline';
}
function getPromotionHandles(item) {
    return Array.isArray(item.promotion?.handles)
        ? item.promotion.handles.map((handle) => cleanText(handle)).filter(Boolean)
        : [];
}
function getPromotionTheme(item) {
    return cleanText(item.promotion?.theme || '');
}
function getPromotionKind(item) {
    return cleanText(item.promotion?.kind || '');
}
function renderCard(item = {}, kind = 'promo', cadence = 'daily', locale = SOURCE_LOCALE, compact = false) {
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
    if (promotionKind)
        article.dataset.spwPromotionKind = promotionKind;
    if (promotionTheme)
        article.dataset.spwPromotionTheme = promotionTheme;
    if (item.promotion?.ctaStyle)
        article.dataset.spwPromotionCtaStyle = cleanText(item.promotion.ctaStyle);
    if (promotionHandles.length)
        article.dataset.spwPromotionHandles = promotionHandles.join(' ');
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
    const heading = el('h3');
    heading.textContent = headingText;
    heading.title = headingText;
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
            'data-spw-operator': cardOperatorType(kind),
        });
        link.textContent = cleanText(item.cta || 'Open');
        article.append(link);
    }
    return article;
}
function resolveMount(host) {
    return host.querySelector('[data-spw-static-for="promo-wonder-cycle"], .promo-wonder-cycle__static-fallback')
        || host;
}
export function renderFeed(host, feed, date = new Date()) {
    const daily = pickDaily(feed, date);
    const weekly = pickWeekly(feed, date);
    const locale = feedLocale(feed);
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
    const grid = el('div', 'promo-wonder-cycle__grid');
    grid.dataset.spwRegionFlow = 'overlay';
    grid.append(renderCard(daily.promo, 'promo', 'daily', locale), renderCard(daily.wonder, 'wonder', 'daily', locale));
    const weeklyGrid = el('div', 'promo-wonder-cycle__weekly');
    weeklyGrid.dataset.spwRegionFlow = 'overlay';
    weeklyGrid.setAttribute('aria-label', 'This week');
    const weeklyKicker = el('p', 'spec-kicker promo-wonder-cycle__weekly-kicker');
    weeklyKicker.textContent = 'This week';
    weeklyGrid.append(weeklyKicker, renderCard(weekly.promo, 'promo', 'weekly', locale, true), renderCard(weekly.wonder, 'wonder', 'weekly', locale, true));
    const mount = resolveMount(host);
    mount.classList.add('promo-wonder-cycle__live');
    mount.replaceChildren(meta, grid, weeklyGrid);
}
export async function initPromoWonderCycle() {
    const hosts = Array.from(document.querySelectorAll('[data-promo-wonder-cycle]'));
    if (!hosts.length)
        return;
    const feed = await loadFeed();
    hosts.forEach((host) => {
        renderFeed(host, feed, new Date());
    });
}
