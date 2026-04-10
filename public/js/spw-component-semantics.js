let initialized = false;
let hoveredComponent = null;

const COMPONENT_SELECTOR = [
    '[data-spw-kind]',
    '[data-spw-form]',
    '[data-spw-role]',
    '[data-spw-meaning]',
    '[data-spw-liminality]',
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

const normalizeToken = (value = '') => humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

const getFrameRole = (element) => {
    if (element.dataset.spwRole) return normalizeToken(element.dataset.spwRole);

    const haystack = humanize(`${element.id} ${element.querySelector('h1, h2')?.textContent || ''}`);

    if (element.classList.contains('site-hero')) return 'orientation';
    if (/related surfaces|routes|surface register/.test(haystack)) return 'routing';
    if (/register/.test(haystack)) return 'register';
    if (/status|current/.test(haystack)) return 'status';
    if (/comparison/.test(haystack)) return 'comparison';
    if (/observatory|probe|lab/.test(haystack)) return 'probe';
    if (/grammar|syntax|forms|format|structure/.test(haystack)) return 'schema';
    if (/pipeline|transform/.test(haystack)) return 'pipeline';
    if (/example/.test(haystack)) return 'example';
    if (/obsidian|homage|what if/.test(haystack)) return 'scenario';
    if (/influences|recipes|direction|sources/.test(haystack)) return 'reference';
    if (/thesis|orientation/.test(haystack)) return 'orientation';

    return 'context';
};

const getPanelRole = (element) => {
    if (element.dataset.spwRole) return normalizeToken(element.dataset.spwRole);

    const heading = humanize(getHeadingText(element));
    if (/control/.test(heading)) return 'control';
    if (/telemetry|summary/.test(heading)) return 'telemetry';
    if (/fit rationale|why/.test(heading)) return 'rationale';

    const parentRole = element.closest('.site-frame')?.dataset.spwRole;
    if (parentRole === 'routing') return 'destination';

    return 'facet';
};

const getCardRole = (element) => {
    if (element.dataset.spwRole) return normalizeToken(element.dataset.spwRole);

    if (!(element instanceof HTMLAnchorElement)) {
        return 'destination';
    }

    try {
        const url = new URL(element.href, window.location.href);
        return url.origin === window.location.origin ? 'route' : 'artifact';
    } catch {
        return 'destination';
    }
};

const getLensRole = (element) => (
    normalizeToken(element.dataset.spwRole || element.dataset.modePanel || '')
    || 'lens'
);

const getSurfaceRole = (element) => (
    normalizeToken(element.dataset.spwRole || '')
    || (/projection|surface/.test(humanize(element.dataset.spwMeaning || getHeadingText(element))) ? 'projection' : 'surface')
);

const getMetricRole = (element) => (
    normalizeToken(element.dataset.spwRole || '')
    || 'telemetry'
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

const getRole = (element, kind) => {
    switch (kind) {
    case 'frame':
        return getFrameRole(element);
    case 'panel':
        return getPanelRole(element);
    case 'card':
        return getCardRole(element);
    case 'lens':
        return getLensRole(element);
    case 'surface':
        return getSurfaceRole(element);
    case 'metric':
        return getMetricRole(element);
    default:
        return normalizeToken(element.dataset.spwRole || '') || 'context';
    }
};

const getForm = (element, kind) => (
    normalizeToken(element.dataset.spwForm || '')
    || (['frame', 'panel', 'lens'].includes(kind) ? 'brace' : 'block')
);

const getLiminality = (element, kind, role) => {
    if (element.dataset.spwLiminality) return normalizeToken(element.dataset.spwLiminality);

    if (element.classList.contains('site-hero') || role === 'orientation') return 'entry';

    switch (kind) {
    case 'frame':
        return 'settled';
    case 'panel':
    case 'lens':
        return 'threshold';
    case 'card':
        return role === 'route' ? 'threshold' : 'nested';
    case 'surface':
        return 'projected';
    case 'metric':
        return 'deep';
    default:
        return 'ambient';
    }
};

const isAddressable = (element) => (
    element instanceof HTMLAnchorElement
    || !!element.querySelector('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')
);

const getSelectionBase = (element, kind) => {
    const explicit = normalizeToken(element.dataset.spwSelection || '');
    if (explicit) return explicit;

    if (isAddressable(element) || ['frame', 'panel', 'lens', 'card'].includes(kind)) {
        return 'addressable';
    }

    return 'ambient';
};

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
    const role = getRole(element, kind);
    const form = getForm(element, kind);
    const liminality = getLiminality(element, kind, role);
    const selectionBase = getSelectionBase(element, kind);
    const caption = makeCaption(kind, meaning);
    const host = getTagHost(element, kind);
    const tag = document.createElement('span');

    element.dataset.spwComponentKind = kind;
    element.dataset.spwComponentMeaning = meaning;
    element.dataset.spwRole = role;
    element.dataset.spwForm = form;
    element.dataset.spwLiminality = liminality;
    element.dataset.spwSelectionBase = selectionBase;
    element.dataset.spwSelection = selectionBase;
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

const getComponentSelectionRank = (value) => ({
    ambient: 0,
    addressable: 1,
    focused: 2,
    active: 3,
    selected: 4
}[value] ?? 0);

const getTaggedComponent = (target) => (
    target instanceof Element ? target.closest('[data-spw-semantic-tagged="true"]') : null
);

const syncSelectionState = () => {
    const focused = getTaggedComponent(document.activeElement);
    let target = null;

    if (window.location.hash) {
        try {
            target = getTaggedComponent(document.querySelector(window.location.hash));
        } catch {
            target = null;
        }
    }

    document.querySelectorAll('[data-spw-semantic-tagged="true"]').forEach((element) => {
        let selection = element.dataset.spwSelectionBase || 'ambient';

        if (hoveredComponent && (element === hoveredComponent || element.contains(hoveredComponent))) {
            selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('focused')
                ? selection
                : 'focused';
        }

        if (focused && (element === focused || element.contains(focused))) {
            selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('focused')
                ? selection
                : 'focused';
        }

        if (element.classList.contains('is-active-frame') || element.classList.contains('is-active-panel')) {
            selection = getComponentSelectionRank(selection) >= getComponentSelectionRank('active')
                ? selection
                : 'active';
        }

        if (
            target
            && (element === target || element.contains(target))
        ) {
            selection = 'selected';
        }

        if (element.matches('[aria-current="page"]')) {
            selection = 'selected';
        }

        element.dataset.spwSelection = selection;
    });
};

const initSpwComponentSemantics = () => {
    if (initialized) return;
    initialized = true;

    annotateTree(document);
    syncSelectionState();

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (!(node instanceof Element)) return;
                annotateTree(node);
            });
        });
        syncSelectionState();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('pointerover', (event) => {
        hoveredComponent = getTaggedComponent(event.target);
        syncSelectionState();
    });

    document.addEventListener('pointerout', (event) => {
        if (event.relatedTarget instanceof Node && event.currentTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
            hoveredComponent = getTaggedComponent(event.relatedTarget);
            syncSelectionState();
            return;
        }

        hoveredComponent = null;
        syncSelectionState();
    });

    document.addEventListener('focusin', syncSelectionState);
    document.addEventListener('focusout', () => requestAnimationFrame(syncSelectionState));
    document.addEventListener('click', () => requestAnimationFrame(syncSelectionState));
    document.addEventListener('spw:frame-change', syncSelectionState);
    document.addEventListener('spw:mode-change', syncSelectionState);
    window.addEventListener('hashchange', syncSelectionState);
};

export { initSpwComponentSemantics };
