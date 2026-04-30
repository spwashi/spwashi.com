import { DAY_KEYS, cleanText, createJsonFeedLoader, el, } from './spw-feed-utils.js';
const MEDIA_FOCUS_URL = '/public/data/media-focus.json';
const SOURCE_LOCALE = 'en';
const loadMediaConfig = createJsonFeedLoader(MEDIA_FOCUS_URL, null);
function feedLocale(config) {
    return cleanText(config.sourceLocale || SOURCE_LOCALE) || SOURCE_LOCALE;
}
function getDailyFocus(config) {
    const dayKey = DAY_KEYS[new Date().getDay()];
    return config.daily?.[dayKey] || config.daily?.friday || config.weekly;
}
function renderItemCard(item = {}, options = {}, locale = SOURCE_LOCALE) {
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
function renderFocus(host, item, options = {}, locale = SOURCE_LOCALE) {
    if (!item)
        return;
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
function renderCollection(host, items = [], locale = SOURCE_LOCALE) {
    if (!items.length)
        return;
    const grid = el('div', 'media-card-grid');
    items.forEach((item, index) => {
        grid.appendChild(renderItemCard(item, { featured: index === 0 }, locale));
    });
    host.replaceChildren(grid);
}
export async function initMediaPublishing() {
    const focusHosts = Array.from(document.querySelectorAll('[data-media-focus]'));
    const collectionHosts = Array.from(document.querySelectorAll('[data-media-collection]'));
    if (!focusHosts.length && !collectionHosts.length)
        return;
    const config = await loadMediaConfig();
    if (!config)
        return;
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
