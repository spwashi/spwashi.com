import { deleteImage, getImageDataUrl, storeImage } from './spw-image-store.js';

export const STORAGE_KEY = 'spwashi:rpg-wednesday:v1';
export const CHARACTER_STORAGE_KEY = 'spwashi:rpg-wednesday:characters:v1';
export const RPG_ROUTE_RE = /^(?:\/rpg\/?$|\/play\/rpg-wednesday(?:\/|$))/;
export const DASH_VALUE = 'not set';
export const CLOCK_SEGMENT_OPTIONS = [2, 4, 6, 8, 10, 12];

export const DEFAULT_ASSET_NAMESPACE = 'table';
export const DEFAULT_ASSET_TIMELINE = 'current';

export const ASSET_KIND_OPTIONS = [
    { value: 'scene', label: 'Scene' },
    { value: 'image', label: 'Image' },
    { value: 'texture', label: 'Texture' },
    { value: 'item', label: 'Item' },
    { value: 'threat', label: 'Threat' }
];
export const ASSET_PRESET_OPTIONS = [
    { value: 'portrait', label: '4:5 portrait' },
    { value: 'square', label: '1:1 square' },
    { value: 'wide', label: '16:9 wide' },
    { value: 'tall', label: '9:16 tall' }
];

const ASSET_KIND_VALUES = new Set(ASSET_KIND_OPTIONS.map((option) => option.value));
const ASSET_PRESET_VALUES = new Set(ASSET_PRESET_OPTIONS.map((option) => option.value));

const DEFAULT_CHARACTER = {
    id: '',
    name: '',
    role: '',
    lineage: '',
    pronouns: '',
    hook: '',
    notes: '',
    imageUrl: '',
    imageKey: '',
    updatedAt: ''
};

export const DEFAULT_STATE = {
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

export const makeId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

export const cloneDefaultState = () => JSON.parse(JSON.stringify(DEFAULT_STATE));

export const safeJsonParse = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export const normalizeList = (value) => (
    Array.isArray(value)
        ? value.filter((item) => item && typeof item === 'object')
        : []
);

export const normalizeAssetKind = (value) => (
    ASSET_KIND_VALUES.has(value)
        ? value
        : 'scene'
);

export const normalizeAssetPreset = (value) => (
    ASSET_PRESET_VALUES.has(value)
        ? value
        : 'wide'
);

export const normalizeAsset = (asset) => ({
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

export const normalizeCharacter = (character) => ({
    ...DEFAULT_CHARACTER,
    id: typeof character.id === 'string' ? character.id : makeId(),
    name: typeof character.name === 'string' ? character.name : '',
    role: typeof character.role === 'string' ? character.role : '',
    lineage: typeof character.lineage === 'string' ? character.lineage : '',
    pronouns: typeof character.pronouns === 'string' ? character.pronouns : '',
    hook: typeof character.hook === 'string' ? character.hook : '',
    notes: typeof character.notes === 'string' ? character.notes : '',
    imageUrl: typeof character.imageUrl === 'string' ? character.imageUrl : '',
    imageKey: typeof character.imageKey === 'string' ? character.imageKey : '',
    updatedAt: typeof character.updatedAt === 'string' ? character.updatedAt : ''
});

export const normalizeCharacterDeck = (value) => (
    Array.isArray(value)
        ? value.filter((item) => item && typeof item === 'object').map(normalizeCharacter)
        : []
);

export const normalizeState = (value) => {
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

export const createStorage = () => {
    const unavailable = {
        available: false,
        read: () => cloneDefaultState(),
        write: () => false,
        clear: () => false
    };

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

export const createCharacterStorage = () => {
    const unavailable = {
        available: false,
        read: () => [],
        write: () => false,
        clear: () => false
    };

    try {
        const testKey = `${CHARACTER_STORAGE_KEY}:test`;
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
    } catch {
        return unavailable;
    }

    return {
        available: true,
        read: () => normalizeCharacterDeck(safeJsonParse(localStorage.getItem(CHARACTER_STORAGE_KEY))),
        write: (deck) => {
            localStorage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(deck));
            return true;
        },
        clear: () => {
            localStorage.removeItem(CHARACTER_STORAGE_KEY);
            return true;
        }
    };
};

export const formatStatusTime = (iso) => {
    if (!iso) return 'local state not saved yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'local state saved';

    return `local state saved ${date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    })}`;
};

export const buildClockText = (clock) => `${clock.progress}/${clock.segments}`;

export const cleanLine = (value) => value.trim().replace(/\s+/g, ' ');

export const previewText = (value, fallback = DASH_VALUE, maxLength = 64) => {
    const normalized = cleanLine(value || '');
    if (!normalized) return fallback;
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
};

export const makeTimestamp = () => new Date().toISOString();

export const buildAssetImageKey = (assetId) => `rpg-wednesday:asset:${assetId}`;
export const buildCharacterImageKey = (characterId) => `rpg-wednesday:character:${characterId}`;

export const splitTagList = (value) => (
    String(value || '')
        .split(',')
        .map((part) => cleanLine(part))
        .filter(Boolean)
);

export const dataUrlToBlob = async (dataUrl) => {
    const response = await fetch(dataUrl);
    return response.blob();
};

export const collectAssetImageData = async (asset) => {
    if (!asset.imageKey) return null;
    try {
        return await getImageDataUrl(asset.imageKey);
    } catch {
        return null;
    }
};

export const clearStateAssetImages = async (state) => {
    await Promise.all(state.assets.map(async (asset) => {
        if (!asset.imageKey) return;
        try {
            await deleteImage(asset.imageKey);
        } catch {
            // Ignore per-image cleanup failures so metadata cleanup can continue.
        }
    }));
};

export const collectExportState = async (state) => {
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

export const persistImportedAssetImages = async (parsed, nextState) => {
    const importedAssets = normalizeList(parsed.assets);

    await Promise.all(importedAssets.map(async (asset) => {
        if (typeof asset.imageDataUrl !== 'string' || !asset.imageDataUrl.startsWith('data:')) return;
        const assetId = typeof asset.id === 'string' ? asset.id : makeId();
        const imageKey = buildAssetImageKey(assetId);

        try {
            await storeImage(imageKey, await dataUrlToBlob(asset.imageDataUrl));
            const nextAsset = nextState.assets.find((item) => item.id === assetId);
            if (nextAsset) {
                nextAsset.imageKey = imageKey;
                nextAsset.imageUrl = '';
            }
        } catch {
            // Keep imported metadata even if the image blob fails to persist.
        }
    }));
};

export const getActiveActor = (state) => (
    state.initiative.find((actor) => actor.id === state.activeInitiativeId) || null
);

const getClockRatio = (clock) => (
    clock.segments > 0 ? clock.progress / clock.segments : 0
);

export const getPressureClock = (state) => state.clocks.reduce((selected, clock) => {
    if (!selected) return clock;

    const selectedScore = selected.progress > 0 ? getClockRatio(selected) : -1;
    const clockScore = clock.progress > 0 ? getClockRatio(clock) : -1;
    return clockScore > selectedScore ? clock : selected;
}, null);

export const formatClockSummary = (clock) => (
    clock
        ? `${previewText(clock.name, 'unnamed clock', 36)} ${buildClockText(clock)}`
        : DASH_VALUE
);

export const buildSessionBrief = (state) => {
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
            lines.push(`${marker} ${index + 1}. ${previewText(actor.name, 'unnamed actor')} - ${previewText(actor.detail)}`);
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
            lines.push(`${marker} ${previewText(asset.title, 'asset card')} [${asset.kind}] - ${timeline} / ${namespace}`);
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
