import {
    DAY_KEYS,
    cleanText,
    createJsonFeedLoader,
    el,
} from './spw-feed-utils.js';

const MEDIA_FOCUS_URL = '/public/data/media-focus.json';
const loadMediaConfig = createJsonFeedLoader(MEDIA_FOCUS_URL, null);

const getDailyFocus = (config) => {
    const dayKey = DAY_KEYS[new Date().getDay()];
    return config.daily?.[dayKey] || config.daily?.friday || config.weekly;
};

const renderItemCard = (item = {}, options = {}) => {
    const href = cleanText(item.href) || '#';
    const card = el('a', options.featured ? 'media-card media-card--featured' : 'media-card', {
        href
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
};

const renderFocus = (host, item, options = {}) => {
    if (!item) return;

    const article = el('article', options.daily ? 'media-focus-card media-focus-card--daily' : 'media-focus-card');
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
};

const renderCollection = (host, items = []) => {
    if (!items.length) return;

    const grid = el('div', 'media-card-grid');
    items.forEach((item, index) => {
        grid.appendChild(renderItemCard(item, { featured: index === 0 }));
    });

    host.replaceChildren(grid);
};

const initMediaPublishing = async () => {
    const focusHosts = Array.from(document.querySelectorAll('[data-media-focus]'));
    const collectionHosts = Array.from(document.querySelectorAll('[data-media-collection]'));
    if (!focusHosts.length && !collectionHosts.length) return;

    const config = await loadMediaConfig();
    if (!config) return;

    focusHosts.forEach((host) => {
        const mode = host.dataset.mediaFocus;
        renderFocus(host, mode === 'daily' ? getDailyFocus(config) : config.weekly, {
            daily: mode === 'daily'
        });
    });

    collectionHosts.forEach((host) => {
        const key = host.dataset.mediaCollection;
        renderCollection(host, Array.isArray(config[key]) ? config[key] : []);
    });
};

export { initMediaPublishing };
