let initialized = false;

const COMPONENT_SELECTOR = [
    '[data-spw-meaning]',
    '.site-frame',
    '.mode-panel',
    '.frame-card',
    '.frame-panel',
    '.software-card',
    '.pretext-metric'
].join(', ');

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const humanize = (value = '') => normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

const getHeadingText = (element) => normalizeText(
    element.querySelector('h1, h2, h3, h4, strong, .frame-card-sigil')?.textContent || ''
);

const getShortHeading = (element) => {
    const heading = humanize(getHeadingText(element));
    return heading && heading.length <= 30 ? heading : '';
};

const getFrameMeaning = (element) => {
    if (element.dataset.spwMeaning) return humanize(element.dataset.spwMeaning);

    const haystack = humanize(`${element.id} ${element.querySelector('h1, h2')?.textContent || ''}`);

    if (element.classList.contains('site-hero')) return 'orientation';
    if (/related surfaces|routes|surface register/.test(haystack)) return 'routing';
    if (/register/.test(haystack)) return 'register';
    if (/status|current/.test(haystack)) return 'status';
    if (/comparison/.test(haystack)) return 'comparison';
    if (/observatory|probe|lab/.test(haystack)) return 'probe';
    if (/grammar|syntax|forms|format|structure|pipeline/.test(haystack)) return 'schema';
    if (/example/.test(haystack)) return 'example';
    if (/obsidian|homage|what if/.test(haystack)) return 'scenario';
    if (/influences|recipes|direction/.test(haystack)) return 'reference';

    return getShortHeading(element) || 'context';
};

const getPanelMeaning = (element) => {
    if (element.dataset.spwMeaning) return humanize(element.dataset.spwMeaning);

    const heading = getShortHeading(element);
    if (heading) return heading;

    const parentMeaning = element.closest('.site-frame')?.dataset.spwComponentMeaning;
    if (parentMeaning === 'routing') return 'destination';

    return 'facet';
};

const getCardMeaning = (element) => {
    if (element.dataset.spwMeaning) return humanize(element.dataset.spwMeaning);

    if (!(element instanceof HTMLAnchorElement)) {
        return getShortHeading(element) || 'destination';
    }

    try {
        const url = new URL(element.href, window.location.href);
        return url.origin === window.location.origin ? 'internal route' : 'external artifact';
    } catch {
        return 'destination';
    }
};

const getLensMeaning = (element) => (
    humanize(element.dataset.spwMeaning || element.dataset.modePanel || '')
    || getShortHeading(element)
    || 'lens'
);

const getSurfaceMeaning = (element) => (
    humanize(element.dataset.spwMeaning || '')
    || getShortHeading(element)
    || 'surface example'
);

const getMetricMeaning = (element) => (
    humanize(element.dataset.spwMeaning || '')
    || humanize(element.querySelector('.frame-card-sigil')?.textContent || '')
    || 'metric'
);

const getKind = (element) => {
    if (element.dataset.spwKind) return humanize(element.dataset.spwKind);
    if (element.classList.contains('mode-panel')) return 'lens';
    if (element.classList.contains('software-card')) return 'surface';
    if (element.classList.contains('frame-card')) return 'card';
    if (element.classList.contains('frame-panel')) return 'panel';
    if (element.classList.contains('site-frame')) return 'frame';
    if (element.classList.contains('pretext-metric')) return 'metric';
    return 'component';
};

const getMeaning = (element, kind) => {
    switch (kind) {
    case 'frame':
        return getFrameMeaning(element);
    case 'panel':
        return getPanelMeaning(element);
    case 'card':
        return getCardMeaning(element);
    case 'lens':
        return getLensMeaning(element);
    case 'surface':
        return getSurfaceMeaning(element);
    case 'metric':
        return getMetricMeaning(element);
    default:
        return humanize(element.dataset.spwMeaning || '') || getShortHeading(element) || 'component';
    }
};

const getForm = (kind) => (
    ['frame', 'panel', 'lens'].includes(kind) ? 'brace' : 'block'
);

const makeCaption = (kind, meaning) => `${kind} · ${meaning}`;

const getTagHost = (element, kind) => {
    if (kind === 'frame') {
        return element.querySelector('.frame-topline, .frame-heading') || element;
    }

    return element;
};

const attachTag = (element) => {
    if (element.dataset.spwSemanticTagged === 'true') return;

    const kind = getKind(element);
    const meaning = getMeaning(element, kind);
    const form = getForm(kind);
    const caption = makeCaption(kind, meaning);
    const host = getTagHost(element, kind);
    const tag = document.createElement('span');

    element.dataset.spwComponentKind = kind;
    element.dataset.spwComponentMeaning = meaning;
    element.dataset.spwForm = form;
    element.dataset.spwSemanticTagged = 'true';

    tag.className = 'spw-component-tag';
    tag.textContent = caption;
    tag.setAttribute('aria-hidden', 'true');

    if (host.classList.contains('frame-topline') || host.classList.contains('frame-heading')) {
        host.appendChild(tag);
        return;
    }

    host.prepend(tag);
};

const annotateTree = (root = document) => {
    const nodes = new Set();

    if (root instanceof Element && root.matches(COMPONENT_SELECTOR)) {
        nodes.add(root);
    }

    root.querySelectorAll?.(COMPONENT_SELECTOR).forEach((node) => nodes.add(node));
    nodes.forEach((node) => attachTag(node));
};

const initSpwComponentSemantics = () => {
    if (initialized) return;
    initialized = true;

    annotateTree(document);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                annotateTree(node);
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
};

export { initSpwComponentSemantics };
