import { deleteImage, getImageDataUrl, storeImage } from './spw-image-store.js';
import { emitSpwAction } from './spw-shared.js';

const STORAGE_KEY = 'spwashi:rpg-wednesday:v1';
const RPG_ROUTE_RE = /^(?:\/rpg\/?$|\/play\/rpg-wednesday(?:\/|$))/;

const DEFAULT_STATE = {
    scene: '',
    objective: '',
    party: '',
    initiative: [],
    activeInitiativeId: null,
    clocks: [],
    assets: [],
    notes: '',
    characterBeat: '',
    canonCandidates: '',
    seeds: '',
    updatedAt: ''
};

const ASSET_KIND_OPTIONS = [
    { value: 'scene', label: 'Scene' },
    { value: 'image', label: 'Image' },
    { value: 'texture', label: 'Texture' },
    { value: 'item', label: 'Item' },
    { value: 'threat', label: 'Threat' }
];
const ASSET_PRESET_OPTIONS = [
    { value: 'portrait', label: '4:5 portrait' },
    { value: 'square', label: '1:1 square' },
    { value: 'wide', label: '16:9 wide' },
    { value: 'tall', label: '9:16 tall' }
];
const ASSET_KIND_VALUES = new Set(ASSET_KIND_OPTIONS.map((option) => option.value));
const ASSET_PRESET_VALUES = new Set(ASSET_PRESET_OPTIONS.map((option) => option.value));
const DEFAULT_ASSET_NAMESPACE = 'table';
const DEFAULT_ASSET_TIMELINE = 'current';

const makeId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
const cloneDefaultState = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

const safeJsonParse = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const normalizeList = (value) => (
    Array.isArray(value)
        ? value.filter((item) => item && typeof item === 'object')
        : []
);

const normalizeAssetKind = (value) => (
    ASSET_KIND_VALUES.has(value)
        ? value
        : 'scene'
);

const normalizeAssetPreset = (value) => (
    ASSET_PRESET_VALUES.has(value)
        ? value
        : 'wide'
);

const normalizeAsset = (asset) => ({
    id: typeof asset.id === 'string' ? asset.id : makeId(),
    title: typeof asset.title === 'string' ? asset.title : '',
    kind: normalizeAssetKind(asset.kind),
    namespace: typeof asset.namespace === 'string' ? asset.namespace : DEFAULT_ASSET_NAMESPACE,
    timeline: typeof asset.timeline === 'string' ? asset.timeline : DEFAULT_ASSET_TIMELINE,
    context: typeof asset.context === 'string' ? asset.context : '',
    tags: typeof asset.tags === 'string' ? asset.tags : '',
    prompt: typeof asset.prompt === 'string' ? asset.prompt : '',
    notes: typeof asset.notes === 'string' ? asset.notes : '',
    imageUrl: typeof asset.imageUrl === 'string' ? asset.imageUrl : '',
    imageKey: typeof asset.imageKey === 'string' ? asset.imageKey : '',
    preset: normalizeAssetPreset(asset.preset),
    collected: Boolean(asset.collected),
    collapsed: Boolean(asset.collapsed),
    createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : '',
    updatedAt: typeof asset.updatedAt === 'string' ? asset.updatedAt : ''
});

const normalizeState = (value) => {
    const input = value && typeof value === 'object' ? value : {};
    const state = {
        ...cloneDefaultState(),
        scene: typeof input.scene === 'string' ? input.scene : '',
        objective: typeof input.objective === 'string' ? input.objective : '',
        party: typeof input.party === 'string' ? input.party : '',
        notes: typeof input.notes === 'string' ? input.notes : '',
        characterBeat: typeof input.characterBeat === 'string' ? input.characterBeat : '',
        canonCandidates: typeof input.canonCandidates === 'string' ? input.canonCandidates : '',
        seeds: typeof input.seeds === 'string' ? input.seeds : '',
        updatedAt: typeof input.updatedAt === 'string' ? input.updatedAt : ''
    };

    state.initiative = normalizeList(input.initiative).map((actor) => ({
        id: typeof actor.id === 'string' ? actor.id : makeId(),
        name: typeof actor.name === 'string' ? actor.name : '',
        detail: typeof actor.detail === 'string' ? actor.detail : ''
    }));

    state.activeInitiativeId = state.initiative.some((actor) => actor.id === input.activeInitiativeId)
        ? input.activeInitiativeId
        : state.initiative[0]?.id || null;

    state.clocks = normalizeList(input.clocks).map((clock) => {
        const segments = Number.isFinite(clock.segments) ? Number(clock.segments) : 4;
        const progress = Number.isFinite(clock.progress) ? Number(clock.progress) : 0;

        return {
            id: typeof clock.id === 'string' ? clock.id : makeId(),
            name: typeof clock.name === 'string' ? clock.name : '',
            segments: Math.min(12, Math.max(2, Math.round(segments))),
            progress: Math.min(12, Math.max(0, Math.round(progress)))
        };
    }).map((clock) => ({
        ...clock,
        progress: Math.min(clock.progress, clock.segments)
    }));

    state.assets = normalizeList(input.assets).map(normalizeAsset);

    return state;
};

const createStorage = () => {
    const unavailable = { available: false, read: () => cloneDefaultState(), write: () => false, clear: () => false };

    try {
        const testKey = `${STORAGE_KEY}:test`;
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
    } catch {
        return unavailable;
    }

    return {
        available: true,
        read: () => normalizeState(safeJsonParse(localStorage.getItem(STORAGE_KEY))),
        write: (state) => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            return true;
        },
        clear: () => {
            localStorage.removeItem(STORAGE_KEY);
            return true;
        }
    };
};

const createElement = (tag, props = {}, children = []) => {
    const element = document.createElement(tag);

    Object.entries(props).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (key === 'className') {
            element.className = value;
            return;
        }
        if (key === 'text') {
            element.textContent = value;
            return;
        }
        if (key === 'html') {
            element.innerHTML = value;
            return;
        }
        if (key in element) {
            element[key] = value;
            return;
        }
        element.setAttribute(key, value);
    });

    children.forEach((child) => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
            return;
        }
        if (child) element.appendChild(child);
    });

    return element;
};

const createField = ({ id, label, value, rows = 2, placeholder }) => {
    const input = createElement('textarea', {
        id,
        className: 'rpg-gameplay-input',
        rows,
        placeholder,
        value
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

const createLineField = ({ id, label, value, placeholder, type = 'text' }) => {
    const input = createElement('input', {
        id,
        type,
        className: 'rpg-gameplay-line-input',
        value,
        placeholder
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

const createSelectField = ({ id, label, value, options }) => {
    const input = createElement('select', {
        id,
        className: 'rpg-gameplay-line-input'
    });
    options.forEach((option) => {
        input.appendChild(createElement('option', {
            value: option.value,
            text: option.label,
            selected: option.value === value
        }));
    });

    const field = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: label }),
        input
    ]);

    return { field, input };
};

const formatStatusTime = (iso) => {
    if (!iso) return 'local state not saved yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'local state saved';

    return `local state saved ${date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    })}`;
};

const buildClockText = (clock) => `${clock.progress}/${clock.segments}`;
const DASH_VALUE = 'not set';

const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
};
const CLOCK_SEGMENT_OPTIONS = [2, 4, 6, 8, 10, 12];

const cleanLine = (value) => value.trim().replace(/\s+/g, ' ');

const previewText = (value, fallback = DASH_VALUE, maxLength = 64) => {
    const normalized = cleanLine(value || '');
    if (!normalized) return fallback;
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
};

const makeTimestamp = () => new Date().toISOString();

const buildAssetImageKey = (assetId) => `rpg-wednesday:asset:${assetId}`;

const splitTagList = (value) => (
    String(value || '')
        .split(',')
        .map((part) => cleanLine(part))
        .filter(Boolean)
);

const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
};

const collectAssetImageData = async (asset) => {
    if (!asset.imageKey) return null;
    try {
        return await getImageDataUrl(asset.imageKey);
    } catch {
        return null;
    }
};

const buildRpgModeDescriptor = () => {
    const path = window.location.pathname.replace(/\/+$/, '/') || '/';

    if (path === '/play/rpg-wednesday/sessions/') {
        return {
            pill: 'session memory',
            title: 'RPG Mode',
            note: 'Write dated events first, then revise cast and world entries only after details recur enough to hold weight.'
        };
    }

    if (path === '/play/rpg-wednesday/cast/') {
        return {
            pill: 'cast memory',
            title: 'RPG Mode',
            note: 'Update the character card when the sheet changes, then move stable versions into cast memory once the canon is ready to keep.'
        };
    }

    if (path === '/play/rpg-wednesday/world/') {
        return {
            pill: 'world register',
            title: 'RPG Mode',
            note: 'Keep setting notes downstream of play. Log the event, update the character card if it changed, then let lore settle into the world register.'
        };
    }

    if (path === '/play/rpg-wednesday/arcs/') {
        return {
            pill: 'arc pressure',
            title: 'RPG Mode',
            note: 'Arcs should emerge from repeated session pressure. Update the dated record first, then let character and cast changes follow the pattern.'
        };
    }

    if (path === '/rpg/') {
        return {
            pill: 'quick portal',
            title: 'RPG Mode',
            note: 'This short route is the fast way back into RPG Wednesday when you want to update a character card, log a session, or re-enter the topic cluster.'
        };
    }

    return {
        pill: 'campaign surface',
        title: 'RPG Mode',
        note: 'Character sheets are the best first artifact. Update the card when canon changes, then move stable versions into cast memory or session recap surfaces.'
    };
};

const ensureRpgModeWidget = () => {
    if (document.querySelector('[data-rpg-mode-widget]')) return;

    const article = document.querySelector('main article');
    if (!article) return;

    const hero = article.querySelector('.site-hero');
    const descriptor = buildRpgModeDescriptor();
    const hasLocalKit = Boolean(document.querySelector('[data-rpg-gameplay-kit], #local-gameplay-kit'));
    const actions = createElement('div', {
        className: 'frame-operators',
        'data-spw-slot': 'actions',
        'aria-label': 'RPG mode actions'
    }, [
        createElement('a', {
            className: 'operator-chip',
            href: '/tools/character-sheet/',
            text: '@ update character card'
        }),
        createElement('a', {
            className: 'operator-chip',
            href: '/play/rpg-wednesday/cast/',
            text: '~ cast register'
        }),
        createElement('a', {
            className: 'operator-chip',
            href: hasLocalKit ? '#local-gameplay-kit' : '/play/rpg-wednesday/sessions/',
            text: hasLocalKit ? '@ local kit' : '@ session log'
        }),
        createElement('a', {
            className: 'operator-chip',
            href: '/topics/',
            text: '? topics atlas'
        })
    ]);

    const widget = createElement('aside', {
        className: 'site-frame rpg-mode-widget',
        'data-rpg-mode-widget': 'true',
        'data-spw-kind': 'frame',
        'data-spw-role': 'guidance',
        'data-spw-context': 'play',
        'data-spw-category-family': 'portal',
        'data-spw-affordance': 'navigate',
        'data-spw-seed': 'page_play_play_rpg_wednesday__rpg_mode_widget'
    }, [
        createElement('div', { className: 'frame-heading' }, [
            createElement('a', {
                className: 'frame-sigil',
                href: '/rpg/',
                text: '#"rpg_mode"'
            }),
            createElement('h2', { text: descriptor.title })
        ]),
        createElement('div', { className: 'spec-strip' }, [
            createElement('span', { className: 'spec-pill', text: descriptor.pill }),
            createElement('span', { className: 'spec-pill', text: 'character updates' }),
            createElement('span', { className: 'spec-pill', text: 'fast entry' })
        ]),
        createElement('div', { className: 'rpg-mode-widget__body' }, [
            createElement('div', { className: 'rpg-mode-widget__copy' }, [
                createElement('p', { text: descriptor.note }),
                createElement('p', {
                    className: 'frame-note',
                    text: 'Use the builder when a sheet changes. Use sessions for dated truth. Use cast once a character has enough recurrence to deserve memory.'
                })
            ]),
            actions
        ])
    ]);

    if (hero && hero.parentElement === article) {
        hero.insertAdjacentElement('afterend', widget);
        return;
    }

    article.prepend(widget);
};

const getActiveActor = (state) => (
    state.initiative.find((actor) => actor.id === state.activeInitiativeId) || null
);

const getClockRatio = (clock) => (
    clock.segments > 0 ? clock.progress / clock.segments : 0
);

const getPressureClock = (state) => state.clocks.reduce((selected, clock) => {
    if (!selected) return clock;

    const selectedScore = selected.progress > 0 ? getClockRatio(selected) : -1;
    const clockScore = clock.progress > 0 ? getClockRatio(clock) : -1;
    return clockScore > selectedScore ? clock : selected;
}, null);

const formatClockSummary = (clock) => (
    clock
        ? `${previewText(clock.name, 'unnamed clock', 36)} ${buildClockText(clock)}`
        : DASH_VALUE
);

const buildSessionBrief = (state) => {
    const activeActor = getActiveActor(state);
    const pressureClock = getPressureClock(state);
    const lines = [
        '# RPG Wednesday table brief',
        `Updated: ${state.updatedAt || 'not saved yet'}`,
        `Scene: ${previewText(state.scene)}`,
        `Objective: ${previewText(state.objective)}`,
        `Party: ${previewText(state.party)}`,
        `Active turn: ${activeActor ? previewText(activeActor.name, 'unnamed actor') : DASH_VALUE}`,
        `Pressure: ${formatClockSummary(pressureClock)}`
    ];

    if (state.initiative.length) {
        lines.push('', 'Initiative:');
        state.initiative.forEach((actor, index) => {
            const marker = actor.id === state.activeInitiativeId ? '@' : '-';
            lines.push(`${marker} ${index + 1}. ${previewText(actor.name, 'unnamed actor')} — ${previewText(actor.detail)}`);
        });
    }

    if (state.clocks.length) {
        lines.push('', 'Clocks:');
        state.clocks.forEach((clock) => {
            lines.push(`- ${formatClockSummary(clock)}`);
        });
    }

    if (state.assets.length) {
        lines.push('', 'Asset cards:');
        state.assets.forEach((asset) => {
            const timeline = cleanLine(asset.timeline || '') || DEFAULT_ASSET_TIMELINE;
            const namespace = cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE;
            const marker = asset.collected ? '*' : '-';
            lines.push(`${marker} ${previewText(asset.title, 'asset card')} [${asset.kind}] — ${timeline} / ${namespace}`);
        });
    }

    if (cleanLine(state.characterBeat)) {
        lines.push('', 'Character beat:', state.characterBeat.trim());
    }

    if (cleanLine(state.canonCandidates)) {
        lines.push('', 'Canon candidates:', state.canonCandidates.trim());
    }

    if (cleanLine(state.seeds)) {
        lines.push('', 'Session recap seeds:', state.seeds.trim());
    }

    lines.push('', 'Private scratch notes are not included in this brief.');
    return lines.join('\n');
};

const downloadText = (filename, text) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = createElement('a', {
        href: url,
        download: filename
    });
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const fallback = createElement('textarea', {
        value: text,
        readOnly: true,
        'aria-hidden': 'true'
    });
    fallback.style.position = 'fixed';
    fallback.style.left = '-9999px';
    document.body.appendChild(fallback);
    fallback.select();
    const copied = document.execCommand('copy');
    fallback.remove();

    if (!copied) {
        throw new Error('copy failed');
    }
};

export const initRpgWednesday = () => {
    if (!RPG_ROUTE_RE.test(window.location.pathname)) return null;
    ensureRpgModeWidget();

    const section = document.querySelector('[data-rpg-gameplay-kit]');
    if (!section || section.dataset.rpgHydrated === 'true') return { storageKey: STORAGE_KEY };

    const storage = createStorage();
    let state = storage.read();

    section.className = 'site-frame rpg-gameplay-kit';
    section.id = 'local-gameplay-kit';
    section.dataset.rpgGameplayKit = 'true';
    section.dataset.rpgHydrated = 'true';
    section.dataset.spwRole = 'local-register';
    section.dataset.spwMeaning = 'private gameplay state';
    section.replaceChildren();

    const heading = createElement('div', { className: 'frame-heading' }, [
        createElement('a', {
            className: 'frame-sigil',
            href: '#local-gameplay-kit',
            text: '@local_gameplay_kit'
        }),
        createElement('h2', { text: 'Local Gameplay Kit' })
    ]);

    const privacy = createElement('p', {
        className: 'inline-note',
        text: storage.available
            ? 'Private table state for this browser. It persists with localStorage, is not published, and never syncs unless you export it.'
            : 'Local storage is unavailable in this browser context. You can still type here, but state will not persist after the page closes.'
    });

    const jumpbar = createElement('nav', {
        className: 'rpg-gameplay-jumpbar',
        'aria-label': 'Local gameplay kit sections'
    }, [
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-scene', text: '@ scene' }),
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-initiative', text: '@ initiative' }),
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-clocks', text: '@ clocks' }),
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-assets', text: '@ assets' }),
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-notes', text: '~ notes' }),
        createElement('a', { className: 'operator-chip', href: '#rpg-kit-brief', text: '~ brief' })
    ]);

    const { field: sceneField, input: sceneInput } = createField({
        id: 'rpg-scene',
        label: 'Current scene',
        value: state.scene,
        rows: 2,
        placeholder: 'Where are we right now?'
    });

    const { field: objectiveField, input: objectiveInput } = createField({
        id: 'rpg-objective',
        label: 'Immediate objective',
        value: state.objective,
        rows: 2,
        placeholder: 'What is the table trying to resolve next?'
    });

    const { field: partyField, input: partyInput } = createField({
        id: 'rpg-party',
        label: 'Active party',
        value: state.party,
        rows: 3,
        placeholder: 'PCs, companions, or players present tonight'
    });

    const { field: notesField, input: notesInput } = createField({
        id: 'rpg-notes',
        label: 'Scratch notes',
        value: state.notes,
        rows: 5,
        placeholder: 'Private notes, rulings, loose details, reminders'
    });

    const { field: characterBeatField, input: characterBeatInput } = createField({
        id: 'rpg-character-beat',
        label: 'Character beat / fallout',
        value: state.characterBeat,
        rows: 4,
        placeholder: 'What changed in a person? What now feels heavier, stranger, or newly possible?'
    });

    const { field: canonCandidatesField, input: canonCandidatesInput } = createField({
        id: 'rpg-canon-candidates',
        label: 'Canon candidates',
        value: state.canonCandidates,
        rows: 4,
        placeholder: 'Names, places, items, rules, or promises worth promoting into cast or world memory'
    });

    const { field: seedsField, input: seedsInput } = createField({
        id: 'rpg-seeds',
        label: 'Session recap seeds',
        value: state.seeds,
        rows: 5,
        placeholder: 'Moments worth turning into a public recap later'
    });

    const { field: assetTitleField, input: assetTitleInput } = createLineField({
        id: 'rpg-asset-title',
        label: 'Asset title',
        value: '',
        placeholder: 'Sunken observatory, storm coin, velvet moss texture'
    });
    const { field: assetKindField, input: assetKindInput } = createSelectField({
        id: 'rpg-asset-kind',
        label: 'Card kind',
        value: 'scene',
        options: ASSET_KIND_OPTIONS
    });
    const { field: assetNamespaceField, input: assetNamespaceInput } = createLineField({
        id: 'rpg-asset-namespace',
        label: 'Namespace',
        value: DEFAULT_ASSET_NAMESPACE,
        placeholder: 'table, omen, faction, texture-pack'
    });
    const { field: assetTimelineField, input: assetTimelineInput } = createLineField({
        id: 'rpg-asset-timeline',
        label: 'Timeline',
        value: DEFAULT_ASSET_TIMELINE,
        placeholder: 'current, next-session, cold-open, act-two'
    });
    const { field: assetContextField, input: assetContextInput } = createLineField({
        id: 'rpg-asset-context',
        label: 'Context',
        value: '',
        placeholder: 'Discord riff, live prompt, NPC reveal, texture pull'
    });
    const { field: assetTagsField, input: assetTagsInput } = createLineField({
        id: 'rpg-asset-tags',
        label: 'Tags',
        value: '',
        placeholder: 'glow, moss, brass, flooded, relic'
    });
    const { field: assetPresetField, input: assetPresetInput } = createSelectField({
        id: 'rpg-asset-preset',
        label: 'Frame preset',
        value: 'wide',
        options: ASSET_PRESET_OPTIONS
    });
    const { field: assetImageUrlField, input: assetImageUrlInput } = createLineField({
        id: 'rpg-asset-image-url',
        label: 'Image URL',
        value: '',
        placeholder: 'https://...'
    });
    const assetImageUpload = createElement('input', {
        id: 'rpg-asset-image-upload',
        className: 'rpg-gameplay-line-input',
        type: 'file',
        accept: 'image/*'
    });
    const assetImageUploadField = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: 'Local image' }),
        assetImageUpload
    ]);
    const { field: assetPromptField, input: assetPromptInput } = createField({
        id: 'rpg-asset-prompt',
        label: 'Prompt / interpretation note',
        value: '',
        rows: 4,
        placeholder: 'What should the image or card preserve when it becomes art later?'
    });
    const { field: assetNotesField, input: assetNotesInput } = createField({
        id: 'rpg-asset-notes',
        label: 'Card notes',
        value: '',
        rows: 4,
        placeholder: 'Table note, provenance, why this belongs in the timeline'
    });

    const initiativeList = createElement('div', {
        className: 'rpg-gameplay-list',
        role: 'list',
        'aria-label': 'Initiative actors'
    });
    const clocksList = createElement('div', {
        className: 'rpg-gameplay-list',
        role: 'list',
        'aria-label': 'Gameplay clocks'
    });
    const assetList = createElement('div', {
        className: 'rpg-asset-board',
        role: 'list',
        'aria-label': 'RPG asset timeline cards'
    });
    const status = createElement('p', {
        className: 'rpg-gameplay-status',
        role: 'status',
        'aria-live': 'polite',
        text: formatStatusTime(state.updatedAt)
    });
    const dashboard = createElement('div', {
        className: 'rpg-gameplay-dashboard',
        role: 'list',
        'aria-label': 'Current table summary'
    });
    const createDashboardStat = (label) => {
        const value = createElement('strong', {
            className: 'rpg-gameplay-stat-value',
            text: DASH_VALUE
        });
        dashboard.appendChild(createElement('div', {
            className: 'rpg-gameplay-stat',
            role: 'listitem'
        }, [
            createElement('span', { className: 'rpg-gameplay-stat-label', text: label }),
            value
        ]));
        return value;
    };
    const dashboardValues = {
        scene: createDashboardStat('Scene'),
        objective: createDashboardStat('Objective'),
        actors: createDashboardStat('Actors'),
        clocks: createDashboardStat('Clocks'),
        assets: createDashboardStat('Assets'),
        namespaces: createDashboardStat('Namespaces'),
        turn: createDashboardStat('Turn'),
        pressure: createDashboardStat('Pressure')
    };
    let briefOutput = null;
    let assetNamespaceFilter = 'all';
    let assetCollectedOnly = false;
    let editingAssetId = null;
    let assetRenderToken = 0;
    const assetComposerStatus = createElement('p', {
        className: 'frame-note rpg-asset-composer-status',
        text: 'Add a scene, image, texture, item, or threat card. Namespace and timeline let you keep live session riffs stable while the context moves.'
    });
    const assetNamespaceFilterInput = createElement('select', {
        id: 'rpg-asset-namespace-filter',
        className: 'rpg-gameplay-line-input'
    });
    const assetNamespaceFilterField = createElement('label', { className: 'rpg-gameplay-field' }, [
        createElement('span', { text: 'Focus namespace' }),
        assetNamespaceFilterInput
    ]);
    const assetCollectedToggle = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ collected only'
    });
    const assetBoardStatus = createElement('p', {
        className: 'frame-note rpg-asset-board-status',
        text: 'No asset cards yet. Start with one scene or one image so the live board has something stable to return to.'
    });
    const assetSaveButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ add card'
    });
    const assetResetButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '! clear draft'
    });

    const syncNamespaceFilterOptions = () => {
        const previous = assetNamespaceFilter;
        const namespaces = Array.from(new Set(
            state.assets
                .map((asset) => cleanLine(asset.namespace || ''))
                .filter(Boolean)
        )).sort((left, right) => left.localeCompare(right));

        assetNamespaceFilterInput.replaceChildren(
            createElement('option', { value: 'all', text: 'all namespaces', selected: previous === 'all' }),
            ...namespaces.map((namespace) => createElement('option', {
                value: namespace,
                text: namespace,
                selected: previous === namespace
            }))
        );

        if (previous !== 'all' && !namespaces.includes(previous)) {
            assetNamespaceFilter = 'all';
            assetNamespaceFilterInput.value = 'all';
        }
    };

    const updateAssetComposerButtons = () => {
        assetSaveButton.textContent = editingAssetId ? '~ update card' : '@ add card';
        assetResetButton.textContent = editingAssetId ? '! cancel edit' : '! clear draft';
        assetCollectedToggle.textContent = assetCollectedOnly ? '~ showing collected' : '~ collected only';
    };

    const resetAssetComposer = ({ preserveFlow = false } = {}) => {
        editingAssetId = null;
        assetTitleInput.value = '';
        assetTagsInput.value = '';
        assetImageUrlInput.value = '';
        assetPromptInput.value = '';
        assetNotesInput.value = '';
        assetImageUpload.value = '';

        if (!preserveFlow) {
            assetKindInput.value = 'scene';
            assetNamespaceInput.value = DEFAULT_ASSET_NAMESPACE;
            assetTimelineInput.value = DEFAULT_ASSET_TIMELINE;
            assetContextInput.value = '';
            assetPresetInput.value = 'wide';
        }

        assetComposerStatus.textContent = preserveFlow
            ? 'Card saved. Namespace, timeline, and preset stayed in place so you can keep adding during the session.'
            : 'Add a scene, image, texture, item, or threat card. Namespace and timeline let you keep live session riffs stable while the context moves.';
        updateAssetComposerButtons();
    };

    const loadAssetIntoComposer = (asset) => {
        editingAssetId = asset.id;
        assetTitleInput.value = asset.title;
        assetKindInput.value = asset.kind;
        assetNamespaceInput.value = asset.namespace;
        assetTimelineInput.value = asset.timeline;
        assetContextInput.value = asset.context;
        assetTagsInput.value = asset.tags;
        assetPresetInput.value = asset.preset;
        assetImageUrlInput.value = asset.imageUrl;
        assetPromptInput.value = asset.prompt;
        assetNotesInput.value = asset.notes;
        assetImageUpload.value = '';
        assetComposerStatus.textContent = `Editing ${previewText(asset.title, 'asset card', 48)}. Leave the image fields alone if the current image should stay attached.`;
        updateAssetComposerButtons();
        assetTitleInput.focus();
    };

    const moveAsset = (assetId, delta) => {
        const index = state.assets.findIndex((asset) => asset.id === assetId);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= state.assets.length) return;
        const next = [...state.assets];
        const [asset] = next.splice(index, 1);
        next.splice(target, 0, asset);
        state.assets = next;
        save(delta < 0 ? 'moved asset card earlier' : 'moved asset card later');
        renderAssets();
    };

    const removeAsset = async (assetId) => {
        const asset = state.assets.find((item) => item.id === assetId);
        if (!asset) return;
        if (asset.imageKey) {
            try {
                await deleteImage(asset.imageKey);
            } catch {
                // Ignore image-store cleanup failures; metadata removal still matters.
            }
        }
        state.assets = state.assets.filter((item) => item.id !== assetId);
        if (editingAssetId === assetId) resetAssetComposer();
        save('removed asset atlas card');
        renderAssets();
    };

    const buildAssetCard = async (asset, index) => {
        const imageSrc = asset.imageKey
            ? await collectAssetImageData(asset)
            : cleanLine(asset.imageUrl || '');
        const card = createElement('article', {
            className: `rpg-asset-card${asset.collected ? ' is-collected' : ''}${asset.collapsed ? ' is-collapsed' : ''}`,
            role: 'listitem',
            'data-rpg-asset-kind': asset.kind,
            'data-rpg-asset-preset': asset.preset,
            'data-rpg-asset-image-state': imageSrc ? 'present' : 'empty'
        });
        const meta = createElement('div', { className: 'rpg-asset-card__meta' }, [
            createElement('span', { className: 'frame-card-sigil', text: asset.kind }),
            createElement('span', { className: 'spec-pill', text: cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE }),
            createElement('span', { className: 'spec-pill', text: cleanLine(asset.timeline || '') || DEFAULT_ASSET_TIMELINE })
        ]);
        const controls = createElement('div', { className: 'rpg-asset-card__controls' }, [
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: asset.collapsed ? '@ expand' : '@ collapse'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: asset.collected ? '* collected' : '* collect'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '~ edit'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: 'up'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: 'down'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: 'remove'
            })
        ]);
        const [collapseButton, collectButton, editButton, upButton, downButton, removeButton] = Array.from(controls.children);
        const heading = createElement('div', { className: 'rpg-asset-card__heading' }, [
            createElement('strong', { text: asset.title }),
            createElement('span', {
                className: 'rpg-asset-card__context',
                text: previewText(asset.context, 'no context set', 72)
            })
        ]);
        const media = createElement('div', { className: 'rpg-asset-card__media' }, [
            imageSrc
                ? createElement('img', {
                    src: imageSrc,
                    alt: `${asset.title} reference card`,
                    loading: 'lazy',
                    decoding: 'async'
                })
                : createElement('div', { className: 'rpg-asset-card__placeholder' }, [
                    createElement('span', { className: 'frame-card-sigil', text: asset.kind }),
                    createElement('strong', { text: previewText(asset.title, 'asset card', 48) }),
                    createElement('span', { text: previewText(asset.context, 'attach an image or keep this as a text-only card', 80) })
                ])
        ]);
        const body = createElement('div', { className: 'rpg-asset-card__body' }, []);
        body.hidden = asset.collapsed;
        const tagList = splitTagList(asset.tags);
        if (tagList.length) {
            body.appendChild(createElement('div', { className: 'spec-strip rpg-asset-card__tags' }, tagList.map((tag) => (
                createElement('span', { className: 'spec-pill', text: tag })
            ))));
        }
        if (cleanLine(asset.prompt)) {
            body.appendChild(createElement('p', {
                className: 'rpg-asset-card__prompt',
                text: asset.prompt.trim()
            }));
        }
        if (cleanLine(asset.notes)) {
            body.appendChild(createElement('p', {
                className: 'frame-note rpg-asset-card__notes',
                text: asset.notes.trim()
            }));
        }
        if (!tagList.length && !cleanLine(asset.prompt) && !cleanLine(asset.notes)) {
            body.appendChild(createElement('p', {
                className: 'frame-note',
                text: 'No tags or notes yet. Keep the card light now, then expand it when the riff becomes durable.'
            }));
        }

        collapseButton.addEventListener('click', () => {
            asset.collapsed = !asset.collapsed;
            save(asset.collapsed ? 'collapsed asset card' : 'expanded asset card');
            renderAssets();
        });
        collectButton.addEventListener('click', () => {
            asset.collected = !asset.collected;
            save(asset.collected ? 'collected asset card' : 'uncollected asset card');
            renderAssets();
        });
        editButton.addEventListener('click', () => loadAssetIntoComposer(asset));
        upButton.addEventListener('click', () => moveAsset(asset.id, -1));
        downButton.addEventListener('click', () => moveAsset(asset.id, 1));
        removeButton.addEventListener('click', () => {
            removeAsset(asset.id);
        });

        upButton.disabled = index === 0;
        downButton.disabled = index === state.assets.length - 1;

        card.append(
            createElement('div', { className: 'rpg-asset-card__topline' }, [meta, controls]),
            heading,
            media,
            body
        );

        return card;
    };

    const renderAssets = async () => {
        const renderToken = ++assetRenderToken;
        syncNamespaceFilterOptions();
        assetList.replaceChildren();

        const filteredAssets = state.assets.filter((asset) => {
            const namespace = cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE;
            const namespaceMatch = assetNamespaceFilter === 'all' || namespace === assetNamespaceFilter;
            const collectedMatch = !assetCollectedOnly || asset.collected;
            return namespaceMatch && collectedMatch;
        });

        if (!filteredAssets.length) {
            assetList.appendChild(assetBoardStatus);
            return;
        }

        const grouped = new Map();
        filteredAssets.forEach((asset) => {
            const timeline = cleanLine(asset.timeline || '') || DEFAULT_ASSET_TIMELINE;
            if (!grouped.has(timeline)) grouped.set(timeline, []);
            grouped.get(timeline).push({ asset });
        });

        const timelineSections = await Promise.all(Array.from(grouped.entries()).map(async ([timeline, assets]) => {
            const cards = await Promise.all(assets.map(async ({ asset }) => (
                buildAssetCard(asset, state.assets.findIndex((item) => item.id === asset.id))
            )));
            return createElement('section', {
                className: 'rpg-asset-timeline',
                'data-rpg-asset-timeline': timeline
            }, [
                createElement('div', { className: 'rpg-asset-timeline__heading' }, [
                    createElement('h4', { text: timeline }),
                    createElement('span', { className: 'frame-card-sigil', text: `${assets.length} card${assets.length === 1 ? '' : 's'}` })
                ]),
                createElement('div', { className: 'rpg-asset-timeline__cards' }, cards)
            ]);
        }));

        if (renderToken !== assetRenderToken) return;
        assetList.replaceChildren(...timelineSections);
    };

    const refreshDerivedSurfaces = () => {
        const activeActor = getActiveActor(state);
        const pressureClock = getPressureClock(state);

        dashboardValues.scene.textContent = previewText(state.scene);
        dashboardValues.objective.textContent = previewText(state.objective);
        dashboardValues.actors.textContent = state.initiative.length ? String(state.initiative.length) : DASH_VALUE;
        dashboardValues.clocks.textContent = state.clocks.length ? String(state.clocks.length) : DASH_VALUE;
        dashboardValues.assets.textContent = state.assets.length ? String(state.assets.length) : DASH_VALUE;
        dashboardValues.namespaces.textContent = state.assets.length
            ? String(new Set(state.assets.map((asset) => cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE)).size)
            : DASH_VALUE;
        dashboardValues.turn.textContent = activeActor
            ? previewText(activeActor.name, 'unnamed actor')
            : DASH_VALUE;
        dashboardValues.pressure.textContent = formatClockSummary(pressureClock);

        if (briefOutput) {
            briefOutput.value = buildSessionBrief(state);
        }
    };

    const save = (description = 'saved local gameplay state') => {
        state.updatedAt = new Date().toISOString();
        if (storage.available) storage.write(state);
        status.textContent = storage.available
            ? formatStatusTime(state.updatedAt)
            : 'local storage unavailable; changes are only in memory';
        refreshDerivedSurfaces();
        emitSpwAction('@local_gameplay.save', description);
    };

    const syncTextState = () => {
        state.scene = sceneInput.value;
        state.objective = objectiveInput.value;
        state.party = partyInput.value;
        state.notes = notesInput.value;
        state.characterBeat = characterBeatInput.value;
        state.canonCandidates = canonCandidatesInput.value;
        state.seeds = seedsInput.value;
    };

    const collectExportState = async () => {
        const assets = await Promise.all(state.assets.map(async (asset) => {
            const exported = { ...asset };
            const imageDataUrl = await collectAssetImageData(asset);
            if (imageDataUrl) exported.imageDataUrl = imageDataUrl;
            return exported;
        }));

        return {
            ...state,
            assets
        };
    };

    const saveAssetComposerState = async () => {
        const title = cleanLine(assetTitleInput.value || '');
        if (!title) {
            assetComposerStatus.textContent = 'Asset cards need a title so the live board stays scannable.';
            assetTitleInput.focus();
            return;
        }

        const existing = editingAssetId
            ? state.assets.find((asset) => asset.id === editingAssetId) || null
            : null;
        const asset = existing ? { ...existing } : normalizeAsset({ id: makeId() });
        const hasNewFile = Boolean(assetImageUpload.files?.[0]);
        const nextImageUrl = cleanLine(assetImageUrlInput.value || '');

        asset.title = title;
        asset.kind = normalizeAssetKind(assetKindInput.value);
        asset.namespace = cleanLine(assetNamespaceInput.value || '') || DEFAULT_ASSET_NAMESPACE;
        asset.timeline = cleanLine(assetTimelineInput.value || '') || DEFAULT_ASSET_TIMELINE;
        asset.context = cleanLine(assetContextInput.value || '');
        asset.tags = assetTagsInput.value;
        asset.prompt = assetPromptInput.value;
        asset.notes = assetNotesInput.value;
        asset.preset = normalizeAssetPreset(assetPresetInput.value);
        asset.createdAt ||= makeTimestamp();
        asset.updatedAt = makeTimestamp();

        if (hasNewFile) {
            const imageKey = buildAssetImageKey(asset.id);
            await storeImage(imageKey, assetImageUpload.files[0]);
            asset.imageKey = imageKey;
            asset.imageUrl = '';
        } else if (nextImageUrl) {
            if (asset.imageKey) {
                try {
                    await deleteImage(asset.imageKey);
                } catch {
                    // Prefer new metadata over stale local image state.
                }
            }
            asset.imageKey = '';
            asset.imageUrl = nextImageUrl;
        }

        if (existing) {
            state.assets = state.assets.map((item) => (
                item.id === asset.id ? asset : item
            ));
            save('updated asset atlas card');
        } else {
            state.assets.push(asset);
            save('added asset atlas card');
        }

        await renderAssets();
        resetAssetComposer({ preserveFlow: true });
    };

    assetNamespaceFilterInput.addEventListener('change', () => {
        assetNamespaceFilter = assetNamespaceFilterInput.value || 'all';
        renderAssets();
    });

    assetCollectedToggle.addEventListener('click', () => {
        assetCollectedOnly = !assetCollectedOnly;
        updateAssetComposerButtons();
        renderAssets();
    });

    assetSaveButton.addEventListener('click', () => {
        saveAssetComposerState();
    });

    assetResetButton.addEventListener('click', () => {
        resetAssetComposer();
    });

    const renderInitiative = () => {
        initiativeList.replaceChildren();

        if (!state.initiative.length) {
            initiativeList.appendChild(createElement('p', {
                className: 'frame-note',
                text: 'No actors yet. Add PCs, NPCs, hazards, or factions as they enter play.'
            }));
            return;
        }

        state.initiative.forEach((actor, index) => {
            const active = actor.id === state.activeInitiativeId;
            const row = createElement('div', {
                className: `rpg-gameplay-row${active ? ' is-active' : ''}`,
                role: 'listitem'
            });
            const position = createElement('button', {
                className: 'syntax-token rpg-gameplay-turn',
                type: 'button',
                text: active ? `@${index + 1}` : `${index + 1}`,
                'aria-label': `Set ${actor.name || 'actor'} active`
            });
            const name = createElement('input', {
                className: 'rpg-gameplay-line-input',
                value: actor.name,
                placeholder: 'Actor',
                'data-rpg-actor-id': actor.id,
                'data-rpg-field': 'actor-name'
            });
            const detail = createElement('input', {
                className: 'rpg-gameplay-line-input',
                value: actor.detail,
                placeholder: 'HP, condition, intent'
            });
            const remove = createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: 'remove'
            });

            position.addEventListener('click', () => {
                state.activeInitiativeId = actor.id;
                save('set active initiative actor');
                renderInitiative();
            });
            name.addEventListener('input', () => {
                actor.name = name.value;
                save('updated initiative actor');
            });
            detail.addEventListener('input', () => {
                actor.detail = detail.value;
                save('updated initiative detail');
            });
            remove.addEventListener('click', () => {
                state.initiative = state.initiative.filter((item) => item.id !== actor.id);
                if (state.activeInitiativeId === actor.id) {
                    state.activeInitiativeId = state.initiative[0]?.id || null;
                }
                save('removed initiative actor');
                renderInitiative();
            });

            row.append(position, name, detail, remove);
            initiativeList.appendChild(row);
        });
    };

    const renderClocks = () => {
        clocksList.replaceChildren();

        if (!state.clocks.length) {
            clocksList.appendChild(createElement('p', {
                className: 'frame-note',
                text: 'No clocks yet. Use clocks for danger, projects, countdowns, or recurring pressure.'
            }));
            return;
        }

        state.clocks.forEach((clock) => {
            const row = createElement('div', {
                className: 'rpg-gameplay-row rpg-gameplay-clock',
                role: 'listitem'
            });
            const name = createElement('input', {
                className: 'rpg-gameplay-line-input',
                value: clock.name,
                placeholder: 'Clock',
                'data-rpg-clock-id': clock.id,
                'data-rpg-field': 'clock-name'
            });
            const segments = createElement('select', {
                className: 'rpg-gameplay-line-input rpg-gameplay-segments',
                title: 'Segments',
                'aria-label': `Segment count for ${clock.name || 'clock'}`
            });
            CLOCK_SEGMENT_OPTIONS.forEach((option) => {
                segments.appendChild(createElement('option', {
                    value: String(option),
                    text: String(option),
                    selected: clock.segments === option
                }));
            });
            if (!CLOCK_SEGMENT_OPTIONS.includes(clock.segments)) {
                segments.appendChild(createElement('option', {
                    value: String(clock.segments),
                    text: String(clock.segments),
                    selected: true
                }));
            }
            const meter = createElement('progress', {
                max: clock.segments,
                value: clock.progress,
                text: buildClockText(clock)
            });
            const text = createElement('span', {
                className: 'rpg-gameplay-clock-text',
                text: buildClockText(clock)
            });
            const decrement = createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '-'
            });
            const increment = createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '+'
            });
            const remove = createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: 'remove'
            });

            const syncClockDisplay = () => {
                meter.max = clock.segments;
                meter.value = clock.progress;
                text.textContent = buildClockText(clock);
            };

            name.addEventListener('input', () => {
                clock.name = name.value;
                save('updated gameplay clock');
            });
            segments.addEventListener('change', () => {
                clock.segments = Number(segments.value);
                clock.progress = Math.min(clock.progress, clock.segments);
                syncClockDisplay();
                save('updated gameplay clock segments');
            });
            decrement.addEventListener('click', () => {
                clock.progress = Math.max(0, clock.progress - 1);
                syncClockDisplay();
                save('decremented gameplay clock');
            });
            increment.addEventListener('click', () => {
                clock.progress = Math.min(clock.segments, clock.progress + 1);
                syncClockDisplay();
                save('incremented gameplay clock');
            });
            remove.addEventListener('click', () => {
                state.clocks = state.clocks.filter((item) => item.id !== clock.id);
                save('removed gameplay clock');
                renderClocks();
            });

            row.append(name, segments, meter, text, decrement, increment, remove);
            clocksList.appendChild(row);
        });
    };

    const addActor = () => {
        const actor = { id: makeId(), name: '', detail: '' };
        state.initiative.push(actor);
        state.activeInitiativeId ||= actor.id;
        save('added initiative actor');
        renderInitiative();
        initiativeList.querySelector(`[data-rpg-actor-id="${actor.id}"][data-rpg-field="actor-name"]`)?.focus();
    };

    const nextTurn = () => {
        if (!state.initiative.length) return;
        const index = Math.max(
            0,
            state.initiative.findIndex((actor) => actor.id === state.activeInitiativeId)
        );
        const next = state.initiative[(index + 1) % state.initiative.length];
        state.activeInitiativeId = next.id;
        save('advanced initiative');
        renderInitiative();
    };

    const addClock = () => {
        const clock = {
            id: makeId(),
            name: '',
            segments: 4,
            progress: 0
        };
        state.clocks.push(clock);
        save('added gameplay clock');
        renderClocks();
        clocksList.querySelector(`[data-rpg-clock-id="${clock.id}"][data-rpg-field="clock-name"]`)?.focus();
    };

    const debouncedTextSave = debounce(() => save('updated local gameplay text'), 400);
    [sceneInput, objectiveInput, partyInput, notesInput, characterBeatInput, canonCandidatesInput, seedsInput].forEach((input) => {
        input.addEventListener('input', () => {
            syncTextState();
            debouncedTextSave();
        });
    });

    const initiativePanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel',
        id: 'rpg-kit-initiative',
        'data-spw-feature': 'rpg-kit-initiative'
    }, [
        createElement('h3', { text: 'Initiative' }),
        createElement('div', { className: 'rpg-gameplay-actions' }, [
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '@ add actor',
                onclick: addActor
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '@ next turn',
                onclick: nextTurn
            })
        ]),
        initiativeList
    ]);

    const clocksPanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel',
        id: 'rpg-kit-clocks',
        'data-spw-feature': 'rpg-kit-clocks'
    }, [
        createElement('h3', { text: 'Clocks' }),
        createElement('div', { className: 'rpg-gameplay-actions' }, [
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                text: '@ add clock',
                onclick: addClock
            })
        ]),
        clocksList
    ]);

    const assetPanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--assets',
        id: 'rpg-kit-assets',
        'data-spw-feature': 'rpg-kit-assets'
    }, [
        createElement('h3', { text: 'Asset Atlas' }),
        createElement('p', {
            className: 'frame-note',
            text: 'Use this during the session to stage scenes, textures, items, threats, and Midjourney riffs in a timeline. Cards stay local, can collapse or collect, and are arranged to be easy to screenshot later.'
        }),
        createElement('div', { className: 'rpg-asset-atlas' }, [
            createElement('section', { className: 'rpg-asset-atlas__composer' }, [
                createElement('div', { className: 'rpg-asset-atlas__field-grid' }, [
                    assetTitleField,
                    assetKindField,
                    assetNamespaceField,
                    assetTimelineField,
                    assetContextField,
                    assetTagsField,
                    assetPresetField,
                    assetImageUrlField,
                    assetImageUploadField
                ]),
                assetPromptField,
                assetNotesField,
                createElement('div', { className: 'rpg-gameplay-actions' }, [
                    assetSaveButton,
                    assetResetButton
                ]),
                assetComposerStatus
            ]),
            createElement('section', { className: 'rpg-asset-atlas__board-panel' }, [
                createElement('div', { className: 'rpg-asset-atlas__toolbar' }, [
                    assetNamespaceFilterField,
                    createElement('div', { className: 'rpg-gameplay-actions' }, [
                        assetCollectedToggle
                    ])
                ]),
                assetList
            ])
        ])
    ]);

    briefOutput = createElement('textarea', {
        className: 'rpg-gameplay-input rpg-gameplay-brief',
        rows: 9,
        readOnly: true,
        'aria-label': 'Generated RPG Wednesday table brief'
    });
    const copyBriefButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ copy brief'
    });
    copyBriefButton.addEventListener('click', async () => {
        syncTextState();
        refreshDerivedSurfaces();
        try {
            await copyText(briefOutput.value);
            status.textContent = 'session brief copied';
            copyBriefButton.textContent = '~ copied ✓';
            setTimeout(() => { copyBriefButton.textContent = '~ copy brief'; }, 1800);
            emitSpwAction('~local_gameplay.copy_brief', 'copied generated session brief');
        } catch {
            status.textContent = 'copy failed; select the table brief manually';
        }
    });

    const briefPanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--brief',
        id: 'rpg-kit-brief',
        'data-spw-feature': 'rpg-kit-brief'
    }, [
        createElement('h3', { text: 'Table Brief' }),
        createElement('p', {
            className: 'frame-note',
            text: 'A copyable play-state summary for session recaps or player handoffs. Character beats and canon candidates are included; private scratch notes stay out.'
        }),
        briefOutput,
        createElement('div', { className: 'rpg-gameplay-actions' }, [copyBriefButton])
    ]);

    const exportButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ export'
    });
    const importInput = createElement('input', {
        type: 'file',
        accept: 'application/json',
        className: 'rpg-gameplay-file',
        id: 'rpg-gameplay-import'
    });
    const importLabel = createElement('label', {
        className: 'operator-chip rpg-gameplay-import-label',
        html: '~ import'
    }, [importInput]);
    const clearButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '! clear local'
    });

    exportButton.addEventListener('click', async () => {
        syncTextState();
        save('exported local gameplay state');
        const exportState = await collectExportState();
        downloadText('rpg-wednesday-local-state.json', JSON.stringify(exportState, null, 2));
    });

    importInput.addEventListener('change', async () => {
        const file = importInput.files?.[0];
        if (!file) return;
        const parsed = safeJsonParse(await file.text());
        if (!parsed || typeof parsed !== 'object') {
            status.textContent = 'import failed: expected a JSON object';
            importInput.value = '';
            return;
        }
        await Promise.all(state.assets.map(async (asset) => {
            if (!asset.imageKey) return;
            try {
                await deleteImage(asset.imageKey);
            } catch {
                // Ignore cleanup failure before import; new state still loads.
            }
        }));
        const next = normalizeState(parsed);
        const importedAssets = normalizeList(parsed.assets);
        await Promise.all(importedAssets.map(async (asset) => {
            if (typeof asset.imageDataUrl !== 'string' || !asset.imageDataUrl.startsWith('data:')) return;
            const assetId = typeof asset.id === 'string' ? asset.id : makeId();
            const imageKey = buildAssetImageKey(assetId);
            try {
                await storeImage(imageKey, await dataUrlToBlob(asset.imageDataUrl));
                const nextAsset = next.assets.find((item) => item.id === assetId);
                if (nextAsset) {
                    nextAsset.imageKey = imageKey;
                    nextAsset.imageUrl = '';
                }
            } catch {
                // Keep imported metadata even if the image blob fails to persist.
            }
        }));
        state = next;
        sceneInput.value = state.scene;
        objectiveInput.value = state.objective;
        partyInput.value = state.party;
        notesInput.value = state.notes;
        characterBeatInput.value = state.characterBeat;
        canonCandidatesInput.value = state.canonCandidates;
        seedsInput.value = state.seeds;
        save('imported local gameplay state');
        renderInitiative();
        renderClocks();
        resetAssetComposer();
        await renderAssets();
        importInput.value = '';
    });

    clearButton.addEventListener('click', async () => {
        const confirmed = window.confirm('Clear RPG Wednesday local gameplay state from this browser? Export first if you want a backup.');
        if (!confirmed) return;
        await Promise.all(state.assets.map(async (asset) => {
            if (!asset.imageKey) return;
            try {
                await deleteImage(asset.imageKey);
            } catch {
                // Ignore per-image cleanup failure during a full reset.
            }
        }));
        storage.clear();
        state = cloneDefaultState();
        sceneInput.value = '';
        objectiveInput.value = '';
        partyInput.value = '';
        notesInput.value = '';
        characterBeatInput.value = '';
        canonCandidatesInput.value = '';
        seedsInput.value = '';
        status.textContent = 'local gameplay state cleared';
        renderInitiative();
        renderClocks();
        resetAssetComposer();
        await renderAssets();
        refreshDerivedSurfaces();
        emitSpwAction('!local_gameplay.clear', 'cleared local gameplay state');
    });

    const controls = createElement('div', { className: 'rpg-gameplay-actions rpg-gameplay-actions--footer' }, [
        exportButton,
        importLabel,
        clearButton
    ]);

    section.append(
        heading,
        privacy,
        jumpbar,
        dashboard,
        createElement('div', { className: 'rpg-gameplay-grid' }, [
            createElement('div', {
                className: 'frame-panel rpg-gameplay-panel',
                id: 'rpg-kit-scene',
                'data-spw-feature': 'rpg-kit-scene'
            }, [
                createElement('h3', { text: 'Scene Register' }),
                sceneField,
                objectiveField,
                partyField
            ]),
            initiativePanel,
            clocksPanel,
            assetPanel,
            createElement('div', {
                className: 'frame-panel rpg-gameplay-panel',
                id: 'rpg-kit-notes',
                'data-spw-feature': 'rpg-kit-notes'
            }, [
                createElement('h3', { text: 'Notes and handoff' }),
                createElement('p', {
                    className: 'frame-note',
                    text: 'Scratch notes stay private. Character beats and canon candidates are the lanes most likely to move into cast, world, or session memory.'
                }),
                notesField,
                characterBeatField,
                canonCandidatesField,
                seedsField
            ]),
            briefPanel
        ]),
        controls,
        status
    );

    renderInitiative();
    renderClocks();
    renderAssets();
    updateAssetComposerButtons();
    refreshDerivedSurfaces();

    return { storageKey: STORAGE_KEY };
};
