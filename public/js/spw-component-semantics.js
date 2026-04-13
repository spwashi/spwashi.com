import { bus } from './spw-bus.js';

let initialized = false;
let hoveredComponent = null;
let resizeObserver = null;
let mutationObserver = null;

const COMPONENT_SELECTOR = [
    '[data-spw-kind]',
    '[data-spw-form]',
    '[data-spw-role]',
    '[data-spw-meaning]',
    '[data-spw-liminality]',
    '[data-spw-context]',
    '[data-spw-room]',
    '[data-spw-permeability]',
    '[data-spw-succession]',
    '[data-spw-affordance]',
    '[data-spw-wonder]',
    '[data-spw-realization]',
    '[data-spw-substrate]',
    '[data-spw-phrase]',
    '[data-spw-image-key]',
    '.site-frame',
    '.mode-panel',
    '.frame-card',
    '.frame-panel',
    '.software-card',
    '.operator-card',
    '.media-card',
    '.media-focus-card',
    '.pretext-metric',
    '.pretext-surface',
    '.settings-category',
    '.settings-fieldset',
    '.domain-visual',
    '.spw-console',
    '.spw-nav-panel'
].join(', ');

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const humanize = (value = '') => normalizeText(value)
    .replace(/[_-]+/g, ' ')
    .toLowerCase();

const normalizeToken = (value = '') => humanize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getTextHaystack = (element) => humanize([
    element.id,
    element.dataset.spwMeaning,
    element.dataset.modePanel,
    element.querySelector('h1, h2, h3, h4, strong, figcaption')?.textContent || '',
    element.textContent || ''
].filter(Boolean).join(' '));

const getHeadingText = (element) => normalizeText(
    element.querySelector(
        'h1, h2, h3, h4, strong, figcaption, .frame-card-sigil, .operator-card-token, .frame-sigil, .frame-card-sigil'
    )?.textContent || ''
);

const getShortHeading = (element) => {
    const heading = humanize(getHeadingText(element));
    return heading && heading.length <= 42 ? heading : '';
};

const ROLE_TO_SUBSTRATE = Object.freeze({
    orientation: 'frame',
    routing: 'ref',
    route: 'ref',
    register: 'baseline',
    reference: 'ref',
    comparison: 'merge',
    schema: 'object',
    pipeline: 'object',
    probe: 'probe',
    telemetry: 'probe',
    lens: 'probe',
    projection: 'surface',
    surface: 'surface',
    control: 'action',
    rationale: 'meta',
    scenario: 'pragma',
    status: 'baseline',
    artifact: 'surface',
    destination: 'ref'
});

const CONCEPTUAL_ROLES = new Set([
    'orientation',
    'register',
    'reference',
    'routing',
    'comparison',
    'schema',
    'pipeline',
    'probe',
    'telemetry',
    'lens',
    'rationale',
    'scenario',
    'status',
    'control'
]);

const REALIZED_ROLES = new Set([
    'artifact',
    'route',
    'projection',
    'surface',
    'destination'
]);

const PHRASE_BY_ROLE = Object.freeze({
    orientation: 'premise',
    status: 'premise',
    routing: 'guide',
    register: 'guide',
    reference: 'guide',
    route: 'artifact',
    destination: 'artifact',
    artifact: 'artifact',
    projection: 'artifact',
    surface: 'artifact',
    probe: 'inquiry',
    telemetry: 'inquiry',
    comparison: 'inquiry',
    lens: 'inquiry',
    schema: 'structure',
    pipeline: 'structure',
    control: 'instruction',
    rationale: 'reflection',
    scenario: 'reflection'
});

const ROLE_TO_CONTEXT = Object.freeze({
    orientation: 'reading',
    register: 'reading',
    reference: 'reading',
    schema: 'analysis',
    probe: 'analysis',
    telemetry: 'analysis',
    comparison: 'analysis',
    routing: 'routing',
    route: 'routing',
    control: 'settings',
    scenario: 'play',
    surface: 'publishing',
    projection: 'publishing',
    artifact: 'publishing',
    destination: 'publishing',
    lens: 'analysis',
    rationale: 'analysis',
    status: 'analysis'
});

const ROLE_TO_WONDER = Object.freeze({
    orientation: 'orientation',
    register: 'orientation',
    reference: 'memory',
    routing: 'orientation',
    route: 'projection',
    destination: 'projection',
    artifact: 'memory',
    surface: 'projection',
    projection: 'projection',
    probe: 'inquiry',
    telemetry: 'inquiry',
    comparison: 'comparison',
    schema: 'constraint',
    pipeline: 'constraint',
    control: 'constraint',
    rationale: 'comparison',
    scenario: 'resonance',
    lens: 'comparison',
    status: 'memory'
});

const ROLE_TO_PERMEABILITY = Object.freeze({
    orientation: 'porous',
    register: 'porous',
    reference: 'annotatable',
    routing: 'annotatable',
    route: 'sealed',
    destination: 'sealed',
    artifact: 'annotatable',
    surface: 'annotatable',
    projection: 'annotatable',
    probe: 'porous',
    telemetry: 'porous',
    comparison: 'porous',
    schema: 'annotatable',
    pipeline: 'annotatable',
    control: 'mutable',
    rationale: 'annotatable',
    scenario: 'mutable',
    lens: 'mutable',
    status: 'porous'
});

const KIND_TO_AFFORDANCE = Object.freeze({
    frame: 'pin',
    panel: 'hint',
    card: 'navigate',
    lens: 'toggle',
    surface: 'hint',
    metric: 'hint',
    artifact: 'hint',
    component: 'hint'
});

const SUBSTRATE_SIGIL = Object.freeze({
    frame: '#',
    layer: ':',
    baseline: '.',
    object: '^',
    ref: '~',
    probe: '?',
    action: '@',
    stream: '*',
    merge: '&',
    binding: '=',
    meta: '$',
    normalize: '%',
    pragma: '!',
    surface: '>'
});

const getFrameMeaning = (element) => {
    if (element.dataset.spwMeaning) return humanize(element.dataset.spwMeaning);

    const haystack = getTextHaystack(element);

    if (element.classList.contains('site-hero')) return 'orientation';
    if (/related surfaces|routes|surface register/.test(haystack)) return 'routing';
    if (/register/.test(haystack)) return 'register';
    if (/status|current/.test(haystack)) return 'status';
    if (/comparison/.test(haystack)) return 'comparison';
    if (/observatory|probe|lab/.test(haystack)) return 'probe';
    if (/grammar|syntax|forms|format|structure|pipeline/.test(haystack)) return 'schema';
    if (/example/.test(haystack)) return 'example';
    if (/scenario|what if|homage/.test(haystack)) return 'scenario';
    if (/reference|signal studies|recipes|direction|sources/.test(haystack)) return 'reference';

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

const getArtifactMeaning = (element) => (
    humanize(element.dataset.spwMeaning || '')
    || humanize(element.querySelector('figcaption')?.textContent || '')
    || getShortHeading(element)
    || 'artifact'
);

const getFrameRole = (element) => {
    if (element.dataset.spwRole) return normalizeToken(element.dataset.spwRole);

    const haystack = getTextHaystack(element);

    if (element.classList.contains('site-hero')) return 'orientation';
    if (/related surfaces|routes|surface register/.test(haystack)) return 'routing';
    if (/register/.test(haystack)) return 'register';
    if (/status|current/.test(haystack)) return 'status';
    if (/comparison/.test(haystack)) return 'comparison';
    if (/observatory|probe|lab/.test(haystack)) return 'probe';
    if (/grammar|syntax|forms|format|structure/.test(haystack)) return 'schema';
    if (/pipeline|transform/.test(haystack)) return 'pipeline';
    if (/example/.test(haystack)) return 'example';
    if (/scenario|what if|homage/.test(haystack)) return 'scenario';
    if (/influences|recipes|direction|sources|signal studies/.test(haystack)) return 'reference';
    if (/thesis|orientation/.test(haystack)) return 'orientation';

    return 'context';
};

const getPanelRole = (element) => {
    if (element.dataset.spwRole) return normalizeToken(element.dataset.spwRole);

    const heading = humanize(getHeadingText(element));
    if (/control/.test(heading)) return 'control';
    if (/telemetry|summary|metric/.test(heading)) return 'telemetry';
    if (/fit rationale|why|palette/.test(heading)) return 'rationale';

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
    || (/projection|surface/.test(getTextHaystack(element)) ? 'projection' : 'surface')
);

const getMetricRole = (element) => (
    normalizeToken(element.dataset.spwRole || '')
    || 'telemetry'
);

const getArtifactRole = (element) => (
    normalizeToken(element.dataset.spwRole || '')
    || (element.dataset.spwReturnable === 'true' ? 'artifact' : 'surface')
);

const getKind = (element) => {
    if (element.dataset.spwKind) return humanize(element.dataset.spwKind);
    if (element.hasAttribute('data-spw-image-key')) return 'artifact';
    if (element.classList.contains('domain-visual')) return 'artifact';
    if (element.classList.contains('mode-panel')) return 'lens';
    if (element.classList.contains('software-card')) return 'surface';
    if (element.classList.contains('pretext-surface')) return 'surface';
    if (element.classList.contains('settings-category') || element.classList.contains('settings-fieldset')) return 'surface';
    if (element.classList.contains('spw-console') || element.classList.contains('spw-nav-panel')) return 'surface';
    if (element.classList.contains('operator-card')) return 'card';
    if (element.classList.contains('media-card') || element.classList.contains('media-focus-card')) return 'card';
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
    case 'artifact':
        return getArtifactMeaning(element);
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
    case 'artifact':
        return getArtifactRole(element);
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
    case 'artifact':
        return 'deep';
    case 'metric':
        return 'deep';
    default:
        return 'ambient';
    }
};

const isAddressable = (element) => (
    element instanceof HTMLAnchorElement
    || element.matches?.('button, [tabindex], [role="button"], [data-spw-returnable="true"]')
    || !!element.querySelector('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled])')
);

const getSelectionBase = (element, kind) => {
    const explicit = normalizeToken(element.dataset.spwSelection || '');
    if (explicit) return explicit;

    if (isAddressable(element) || ['frame', 'panel', 'lens', 'card', 'artifact'].includes(kind)) {
        return 'addressable';
    }

    return 'ambient';
};

const getSubstrate = (element, kind, role) => {
    const explicit = normalizeToken(element.dataset.spwSubstrate || '');
    if (explicit) return explicit;

    const directOperator = normalizeToken(element.dataset.spwOperator || '');
    if (directOperator) return directOperator;

    const inheritedOperator = normalizeToken(
        element.closest('[data-spw-operator]')?.dataset.spwOperator || ''
    );
    if (inheritedOperator) return inheritedOperator;

    if (ROLE_TO_SUBSTRATE[role]) return ROLE_TO_SUBSTRATE[role];

    switch (kind) {
    case 'frame':
        return 'frame';
    case 'panel':
    case 'lens':
        return 'probe';
    case 'surface':
        return 'surface';
    case 'artifact':
        return 'surface';
    case 'metric':
        return 'probe';
    case 'card':
        return isAddressable(element) ? 'ref' : 'object';
    default:
        return 'frame';
    }
};

const getRealization = (element, kind, role) => {
    const explicit = normalizeToken(element.dataset.spwRealization || '');
    if (explicit) return explicit;

    if (REALIZED_ROLES.has(role)) return 'realized';
    if (CONCEPTUAL_ROLES.has(role)) return 'conceptual';

    switch (kind) {
    case 'surface':
    case 'artifact':
        return 'realized';
    case 'metric':
    case 'lens':
        return 'conceptual';
    case 'panel':
        return role === 'facet' ? 'hybrid' : 'conceptual';
    case 'card':
        return isAddressable(element) ? 'realized' : 'conceptual';
    case 'frame':
        return role === 'context' ? 'hybrid' : 'conceptual';
    default:
        return 'hybrid';
    }
};

const getPhrase = (element, kind, role, realization) => (
    normalizeToken(element.dataset.spwPhrase || '')
    || PHRASE_BY_ROLE[role]
    || (realization === 'realized'
        ? 'artifact'
        : kind === 'frame'
            ? 'premise'
            : 'context')
);

const getContext = (element, kind, role) => (
    normalizeToken(element.dataset.spwContext || '')
    || normalizeToken(element.closest('[data-spw-context]')?.dataset.spwContext || '')
    || normalizeToken(document.body?.dataset.spwSurface || '')
    || ROLE_TO_CONTEXT[role]
    || (kind === 'frame' ? 'reading' : 'analysis')
);

const getAffordance = (element, kind) => {
    const explicit = normalizeToken(element.dataset.spwAffordance || '');
    if (explicit) return explicit;

    if (element.hasAttribute('data-spw-swappable')) return 'swap';
    if (element.dataset.spwReturnable === 'true') return 'return';
    if (element.dataset.spwPinned === 'true') return 'pin';
    if (isAddressable(element)) return kind === 'lens' ? 'toggle' : 'navigate';

    return KIND_TO_AFFORDANCE[kind] || 'hint';
};

const getWonder = (element, kind, role) => (
    normalizeToken(element.dataset.spwWonder || '')
    || ROLE_TO_WONDER[role]
    || (getAffordance(element, kind) === 'pin'
        ? 'memory'
        : getAffordance(element, kind) === 'swap'
            ? 'comparison'
            : kind === 'card'
                ? 'projection'
                : 'orientation')
);

const getPermeability = (element, kind, role) => (
    normalizeToken(element.dataset.spwPermeability || '')
    || ROLE_TO_PERMEABILITY[role]
    || (kind === 'lens'
        ? 'mutable'
        : kind === 'artifact'
            ? 'annotatable'
            : 'porous')
);

const getSuccession = (element) => {
    const explicit = normalizeToken(element.dataset.spwSuccession || '');
    if (explicit) return explicit;

    if (element.dataset.spwPinned === 'true' || element.dataset.spwLatched === 'true') return 'latched';
    if (element.dataset.spwVisited === 'true') return 'visited';
    if (element.dataset.spwSelection === 'selected') return 'resolved';
    if (element.dataset.spwSelection === 'active') return 'measured';

    return 'raw';
};

const getRoom = (element) => {
    const explicit = normalizeToken(element.dataset.spwRoom || '');
    if (explicit) return explicit;

    const width = element.clientWidth || element.getBoundingClientRect().width || 0;
    if (width >= 704) return 'roomy';
    if (width >= 360) return 'standard';
    return 'compact';
};

const createGuideChip = ({ label, kind, operator = '', value = '' }) => {
    const chip = document.createElement('span');
    chip.className = 'spw-guide-chip';
    chip.dataset.spwGuideKind = kind;
    if (value) chip.dataset.spwGuideValue = value;
    if (operator) chip.dataset.spwOperator = operator;
    chip.textContent = label;
    chip.setAttribute('aria-hidden', 'true');
    return chip;
};

const makeCaption = (kind, meaning) => `${kind} · ${meaning}`;

const getTagHost = (element, kind) => {
    if (kind === 'frame') {
        return element.querySelector('.frame-topline, .frame-heading') || element;
    }

    if (kind === 'artifact') {
        return element.querySelector('figcaption') || element;
    }

    return element;
};

const getGuideDensity = (room) => {
    switch (room) {
    case 'compact':
        return 'minimal';
    case 'roomy':
        return 'rich';
    default:
        return 'standard';
    }
};

const getScopedMeta = (host) => host.querySelector(':scope > .spw-component-meta');

const attachTag = (element) => {
    const kind = getKind(element);
    const meaning = getMeaning(element, kind);
    const role = getRole(element, kind);
    const form = getForm(element, kind);
    const liminality = getLiminality(element, kind, role);
    const selectionBase = getSelectionBase(element, kind);
    const substrate = getSubstrate(element, kind, role);
    const realization = getRealization(element, kind, role);
    const phrase = getPhrase(element, kind, role, realization);
    const context = getContext(element, kind, role);
    const affordance = getAffordance(element, kind);
    const wonder = getWonder(element, kind, role);
    const permeability = getPermeability(element, kind, role);
    const succession = getSuccession(element);
    const room = getRoom(element);
    const caption = makeCaption(kind, meaning);
    const host = getTagHost(element, kind);
    const guideDensity = getGuideDensity(room);

    let meta = getScopedMeta(host);
    let tag = meta?.querySelector(':scope > .spw-component-tag') || null;
    let guides = meta?.querySelector(':scope > .spw-component-guides') || null;

    element.dataset.spwComponentKind = kind;
    element.dataset.spwSurfaceKind = kind;
    element.dataset.spwComponentMeaning = meaning;
    element.dataset.spwRole = role;
    element.dataset.spwForm = form;
    element.dataset.spwLiminality = liminality;
    element.dataset.spwSelectionBase = selectionBase;
    if (!element.dataset.spwSelection) {
        element.dataset.spwSelection = selectionBase;
    }
    element.dataset.spwSubstrate = substrate;
    element.dataset.spwRealization = realization;
    element.dataset.spwPhrase = phrase;
    element.dataset.spwContext = context;
    element.dataset.spwAffordance = affordance;
    element.dataset.spwWonder = wonder;
    element.dataset.spwPermeability = permeability;
    element.dataset.spwSuccession = succession;
    element.dataset.spwRoom = room;
    element.dataset.spwGuideDensity = guideDensity;
    element.dataset.spwSemanticTagged = 'true';
    element.setAttribute('data-spw-field-root', '');

    if (!meta) {
        meta = document.createElement('span');
        meta.className = 'spw-component-meta';

        tag = document.createElement('span');
        tag.className = 'spw-component-tag';
        tag.setAttribute('aria-hidden', 'true');

        guides = document.createElement('span');
        guides.className = 'spw-component-guides';
        guides.setAttribute('aria-hidden', 'true');

        meta.append(tag, guides);

        if (host.classList.contains('frame-topline') || host.classList.contains('frame-heading')) {
            host.appendChild(meta);
        } else {
            host.prepend(meta);
        }
    }

    meta.dataset.spwSubstrate = substrate;
    meta.dataset.spwRealization = realization;
    meta.dataset.spwPhrase = phrase;
    meta.dataset.spwContext = context;
    meta.dataset.spwWonder = wonder;
    meta.dataset.spwGuideDensity = guideDensity;

    tag.textContent = caption;
    tag.dataset.spwSubstrate = substrate;
    tag.dataset.spwRealization = realization;
    tag.dataset.spwPhrase = phrase;

    const guideItems = [
        createGuideChip({
            kind: 'realization',
            value: realization,
            label: realization
        }),
        createGuideChip({
            kind: 'phrase',
            value: phrase,
            label: phrase
        }),
        createGuideChip({
            kind: 'substrate',
            value: substrate,
            operator: substrate,
            label: `${SUBSTRATE_SIGIL[substrate] || ''} ${substrate}`.trim()
        })
    ];

    if (guideDensity !== 'minimal') {
        guideItems.push(
            createGuideChip({
                kind: 'context',
                value: context,
                label: context
            }),
            createGuideChip({
                kind: 'wonder',
                value: wonder,
                label: wonder
            })
        );
    }

    if (guideDensity === 'rich') {
        guideItems.push(
            createGuideChip({
                kind: 'permeability',
                value: permeability,
                label: permeability
            }),
            createGuideChip({
                kind: 'affordance',
                value: affordance,
                label: affordance
            })
        );
    }

    guides.replaceChildren(...guideItems);
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

        if (target && (element === target || element.contains(target))) {
            selection = 'selected';
        }

        if (element.matches('[aria-current="page"]')) {
            selection = 'selected';
        }

        element.dataset.spwSelection = selection;
        element.dataset.spwSuccession = getSuccession(element);
        element.dataset.spwRoom = getRoom(element);
        element.dataset.spwGuideDensity = getGuideDensity(element.dataset.spwRoom || 'standard');

        const meta = getScopedMeta(getTagHost(element, element.dataset.spwComponentKind || getKind(element)));
        if (meta) {
            meta.dataset.spwGuideDensity = element.dataset.spwGuideDensity;
        }
    });
};

const observeTaggedNode = (node) => {
    if (!(node instanceof Element)) return;
    if (node.dataset.spwSemanticTagged !== 'true') return;
    resizeObserver?.observe(node);
};

const initSpwComponentSemantics = () => {
    if (initialized) return;
    initialized = true;

    annotateTree(document);
    syncSelectionState();

    resizeObserver = new ResizeObserver((entries) => {
        entries.forEach(({ target }) => {
            if (!(target instanceof Element)) return;
            if (target.dataset.spwSemanticTagged !== 'true') return;

            target.dataset.spwRoom = getRoom(target);
            target.dataset.spwSuccession = getSuccession(target);
            target.dataset.spwGuideDensity = getGuideDensity(target.dataset.spwRoom || 'standard');
            attachTag(target);
        });
    });

    document.querySelectorAll('[data-spw-semantic-tagged="true"]').forEach(observeTaggedNode);

    mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (!(node instanceof Element)) return;
                    annotateTree(node);
                    if (node.dataset.spwSemanticTagged === 'true') {
                        observeTaggedNode(node);
                    }
                    node.querySelectorAll?.('[data-spw-semantic-tagged="true"]').forEach(observeTaggedNode);
                });
                return;
            }

            if (mutation.type === 'attributes' && mutation.target instanceof Element) {
                attachTag(mutation.target);
            }
        });

        syncSelectionState();
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [
            'data-spw-kind',
            'data-spw-form',
            'data-spw-role',
            'data-spw-meaning',
            'data-spw-liminality',
            'data-spw-context',
            'data-spw-room',
            'data-spw-permeability',
            'data-spw-succession',
            'data-spw-affordance',
            'data-spw-wonder',
            'data-spw-realization',
            'data-spw-substrate',
            'data-spw-phrase',
            'data-spw-visited',
            'data-spw-pinned',
            'data-spw-latched',
            'class',
            'href',
            'id',
            'aria-current'
        ]
    });

    document.addEventListener('pointerover', (event) => {
        hoveredComponent = getTaggedComponent(event.target);
        syncSelectionState();
    });

    document.addEventListener('pointerout', (event) => {
        hoveredComponent = getTaggedComponent(event.relatedTarget);
        syncSelectionState();
    });

    document.addEventListener('focusin', syncSelectionState);
    document.addEventListener('focusout', () => requestAnimationFrame(syncSelectionState));
    document.addEventListener('click', () => requestAnimationFrame(syncSelectionState));

    bus.on('frame:activated', syncSelectionState);
    bus.on('frame:mode', syncSelectionState);
    bus.on('brace:pinned', syncSelectionState);
    bus.on('brace:committed', syncSelectionState);
    bus.on('brace:swapped', syncSelectionState);

    document.addEventListener('spw:frame-change', syncSelectionState);
    document.addEventListener('spw:mode-change', syncSelectionState);
    window.addEventListener('hashchange', syncSelectionState);

    document.dispatchEvent(new CustomEvent('spw:component-semantics-ready'));
};

export { initSpwComponentSemantics };