import { deleteImage, storeImage } from './spw-image-store.js';
import {
    ASSET_KIND_OPTIONS,
    ASSET_PRESET_OPTIONS,
    DEFAULT_ASSET_NAMESPACE,
    DEFAULT_ASSET_TIMELINE,
    buildAssetImageKey,
    cleanLine,
    collectAssetImageData,
    makeId,
    makeTimestamp,
    normalizeAsset,
    normalizeAssetKind,
    normalizeAssetPreset,
    previewText,
    splitTagList
} from './rpg-wednesday-state.js';
import {
    createElement,
    createField,
    createLineField,
    createSelectField,
    createShortcutToken
} from './rpg-wednesday-dom.js';

const summarizeVisibleAssets = (assets) => ({
    cards: assets.length,
    namespaces: new Set(assets.map((asset) => cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE)).size,
    timelines: new Set(assets.map((asset) => cleanLine(asset.timeline || '') || DEFAULT_ASSET_TIMELINE)).size
});

export const createAssetAtlasController = ({ getState, save }) => {
    const { field: assetTitleField, input: assetTitleInput } = createLineField({
        id: 'rpg-asset-title',
        label: 'Card title / seed',
        value: '',
        placeholder: 'Sunken observatory, witness ribbon, brass rain roll, library swag'
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
        placeholder: 'Discord riff, dice turn, swag prop, NPC reveal, texture pull'
    });
    const { field: assetTagsField, input: assetTagsInput } = createLineField({
        id: 'rpg-asset-tags',
        label: 'Tags',
        value: '',
        placeholder: 'glow, moss, brass, relic, souvenir, roll-result'
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
        createElement('span', { text: 'Local image / art drop' }),
        assetImageUpload
    ]);
    const { field: assetPromptField, input: assetPromptInput } = createField({
        id: 'rpg-asset-prompt',
        label: 'Prompt / spoken seed',
        value: '',
        rows: 4,
        placeholder: 'What should this preserve when it becomes art, narration, or a demo later?'
    });
    const { field: assetNotesField, input: assetNotesInput } = createField({
        id: 'rpg-asset-notes',
        label: 'Card notes / table proof',
        value: '',
        rows: 4,
        placeholder: 'Table note, provenance, die result, why this belongs in the timeline'
    });

    const assetList = createElement('div', {
        className: 'rpg-asset-board',
        role: 'list',
        'aria-label': 'RPG asset timeline cards'
    });
    const assetComposerStatus = createElement('p', {
        className: 'frame-note rpg-asset-composer-status',
        text: 'Start lean. A scene, dice read, or swag prop can live here with only a title, then gain prompt, image, or texture detail if the table keeps returning to it.'
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
        text: '~ collected only',
        title: 'Show only collected cards'
    });
    const assetBoardStatus = createElement('p', {
        className: 'frame-note rpg-asset-board-status',
        text: 'No asset cards yet. Start with one title-only scene, dice read, swag prop, or image so the live board has something stable to return to.'
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
    const summaryCardsValue = createElement('strong', { text: '0' });
    const summaryNamespacesValue = createElement('strong', { text: '0' });
    const summaryTimelinesValue = createElement('strong', { text: '0' });

    const createSummaryItem = (label, value) => createElement('div', {
        className: 'rpg-asset-atlas__summary-item'
    }, [
        createElement('span', { text: label }),
        value
    ]);

    const assetShortcuts = createElement('div', {
        className: 'rpg-shortcut-row',
        'aria-label': 'Asset atlas keyboard shortcuts'
    }, [
        createShortcutToken({ key: 'g then a', label: 'draft' }),
        createShortcutToken({ key: 'k', label: 'focus draft' }),
        createShortcutToken({ key: 'b', label: 'copy brief' }),
        createShortcutToken({ key: 'Esc', label: 'cancel edit' })
    ]);

    const assetBoardEmpty = createElement('div', {
        className: 'rpg-asset-board-empty'
    }, [
        createElement('p', {
            text: 'Start with one durable card. A title-only scene, swag prop, dice read, object, or threat gives the live board something stable to return to.'
        }),
        createElement('div', {
            className: 'rpg-shortcut-row',
            'aria-label': 'RPG keyboard actions'
        }, [
            createShortcutToken({ key: 'a', label: 'add actor' }),
            createShortcutToken({ key: 'c', label: 'add clock' }),
            createShortcutToken({ key: 't', label: 'next turn' }),
            createShortcutToken({ key: 'g then n', label: 'notes' })
        ])
    ]);

    let assetNamespaceFilter = 'all';
    let assetCollectedOnly = false;
    let editingAssetId = null;
    let assetRenderToken = 0;
    let requestedAssetFocusId = '';
    let composerDensity = 'lean';
    const composerHeadingTitle = createElement('h4', { text: 'Draft seed card' });
    const assetDensityToggle = createElement('button', {
        className: 'operator-chip',
        type: 'button'
    });
    const assetStarter = createElement('p', {
        className: 'frame-note rpg-asset-atlas__starter',
        text: 'Title first. Keep namespace and timeline stable. A scene, die result, or swag prop can begin as one spoken hook, then open the larger prompt, image, and notes fields when the riff earns more weight.'
    });

    [
        assetContextField,
        assetTagsField,
        assetPresetField,
        assetImageUrlField,
        assetImageUploadField,
        assetPromptField,
        assetNotesField
    ].forEach((field) => {
        field.classList.add('rpg-asset-atlas__advanced');
    });

    const requestAssetFocus = (assetId) => {
        requestedAssetFocusId = assetId;
    };

    const syncNamespaceFilterOptions = () => {
        const state = getState();
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

    const updateBoardSummary = (visibleAssets) => {
        const summary = summarizeVisibleAssets(visibleAssets);
        summaryCardsValue.textContent = String(summary.cards);
        summaryNamespacesValue.textContent = String(summary.namespaces);
        summaryTimelinesValue.textContent = String(summary.timelines);
    };

    const updateAssetComposerButtons = () => {
        composerHeadingTitle.textContent = editingAssetId ? 'Edit seed card' : 'Draft seed card';
        assetSaveButton.textContent = editingAssetId ? '~ update card' : '@ add card';
        assetResetButton.textContent = editingAssetId ? '! cancel edit' : '! clear draft';
        assetCollectedToggle.textContent = assetCollectedOnly ? '~ showing collected' : '~ collected only';
        assetDensityToggle.textContent = composerDensity === 'lean' ? '~ full fields' : '~ lean fields';
        assetDensityToggle.setAttribute('aria-pressed', composerDensity === 'full' ? 'true' : 'false');
    };

    const syncComposerDensity = () => {
        assetComposerSection.dataset.rpgComposerDensity = composerDensity;
        updateAssetComposerButtons();
    };

    const setComposerDensity = (nextDensity) => {
        composerDensity = nextDensity === 'full' ? 'full' : 'lean';
        syncComposerDensity();
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
            setComposerDensity('lean');
        }

        assetComposerStatus.textContent = preserveFlow
            ? 'Card saved. Namespace and timeline stayed in place so you can keep adding scene, dice, or swag cards without rebuilding the draft rhythm.'
            : 'Start lean. A scene, dice read, or swag prop can live here with only a title, then gain prompt, image, or texture detail if the table keeps returning to it.';
        updateAssetComposerButtons();
    };

    const focusComposer = () => {
        assetTitleInput.focus();
    };

    const focusBoard = () => {
        const firstCard = assetList.querySelector('[data-rpg-asset-card-id]');
        if (firstCard instanceof HTMLElement) {
            firstCard.focus();
            return;
        }
        assetNamespaceFilterInput.focus();
    };

    const cancelEdit = () => {
        if (!editingAssetId) return false;
        resetAssetComposer();
        focusComposer();
        return true;
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
        setComposerDensity(
            cleanLine(asset.context)
            || cleanLine(asset.tags)
            || cleanLine(asset.imageUrl)
            || cleanLine(asset.prompt)
            || cleanLine(asset.notes)
            || cleanLine(asset.imageKey)
                ? 'full'
                : 'lean'
        );
        assetComposerStatus.textContent = `Editing ${previewText(asset.title, 'asset card', 48)}. Leave the image fields alone if the current art or text-first card should stay attached.`;
        updateAssetComposerButtons();
        assetTitleInput.focus();
    };

    const moveAsset = (assetId, delta) => {
        const state = getState();
        const index = state.assets.findIndex((asset) => asset.id === assetId);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= state.assets.length) return;

        const next = [...state.assets];
        const [asset] = next.splice(index, 1);
        next.splice(target, 0, asset);
        state.assets = next;
        requestAssetFocus(assetId);
        save(delta < 0 ? 'moved asset card earlier' : 'moved asset card later');
        render();
    };

    const removeAsset = async (assetId) => {
        const state = getState();
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
        await render();
    };

    const toggleCollected = (asset) => {
        asset.collected = !asset.collected;
        requestAssetFocus(asset.id);
        save(asset.collected ? 'collected asset card' : 'uncollected asset card');
        render();
    };

    const toggleCollapsed = (asset) => {
        asset.collapsed = !asset.collapsed;
        requestAssetFocus(asset.id);
        save(asset.collapsed ? 'collapsed asset card' : 'expanded asset card');
        render();
    };

    const buildAssetCard = async (asset, index) => {
        const state = getState();
        const imageSrc = asset.imageKey
            ? await collectAssetImageData(asset)
            : cleanLine(asset.imageUrl || '');
        const card = createElement('article', {
            className: `rpg-asset-card${asset.collected ? ' is-collected' : ''}${asset.collapsed ? ' is-collapsed' : ''}`,
            role: 'listitem',
            tabIndex: 0,
            title: 'Enter edits, Space collects, [ and ] move',
            'data-rpg-asset-card-id': asset.id,
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
                title: 'Collapse or expand card',
                text: asset.collapsed ? '@ expand' : '@ collapse'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                title: 'Collect or uncollect card',
                text: asset.collected ? '* collected' : '* collect'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                title: 'Edit card',
                text: '~ edit'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                title: 'Move card earlier',
                text: '['
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                title: 'Move card later',
                text: ']'
            }),
            createElement('button', {
                className: 'operator-chip',
                type: 'button',
                title: 'Remove card',
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
                    createElement('span', { text: previewText(asset.context, 'attach art later or keep this as a text-first demo seed', 80) })
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
                text: 'No tags or notes yet. Keep the card light now, then expand it when the riff, roll, or prop becomes durable.'
            }));
        }

        collapseButton.addEventListener('click', () => toggleCollapsed(asset));
        collectButton.addEventListener('click', () => toggleCollected(asset));
        editButton.addEventListener('click', () => loadAssetIntoComposer(asset));
        upButton.addEventListener('click', () => moveAsset(asset.id, -1));
        downButton.addEventListener('click', () => moveAsset(asset.id, 1));
        removeButton.addEventListener('click', () => {
            void removeAsset(asset.id);
        });

        card.addEventListener('keydown', (event) => {
            if (event.target !== card) return;

            if (event.key === 'Enter') {
                event.preventDefault();
                loadAssetIntoComposer(asset);
                return;
            }

            if (event.key === ' ') {
                event.preventDefault();
                toggleCollected(asset);
                return;
            }

            if (event.key === '[') {
                event.preventDefault();
                moveAsset(asset.id, -1);
                return;
            }

            if (event.key === ']') {
                event.preventDefault();
                moveAsset(asset.id, 1);
                return;
            }

            if (event.key === 'e' || event.key === 'E') {
                event.preventDefault();
                loadAssetIntoComposer(asset);
            }
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

    const render = async () => {
        const state = getState();
        const renderToken = ++assetRenderToken;
        syncNamespaceFilterOptions();

        const filteredAssets = state.assets.filter((asset) => {
            const namespace = cleanLine(asset.namespace || '') || DEFAULT_ASSET_NAMESPACE;
            const namespaceMatch = assetNamespaceFilter === 'all' || namespace === assetNamespaceFilter;
            const collectedMatch = !assetCollectedOnly || asset.collected;
            return namespaceMatch && collectedMatch;
        });

        updateBoardSummary(filteredAssets);
        assetList.replaceChildren();

        if (!filteredAssets.length) {
            assetBoardStatus.textContent = state.assets.length
                ? 'No cards match this filter. Change namespace or turn off collected-only to bring them back.'
                : 'No asset cards yet. Start with one title-only scene, dice read, swag prop, or image so the live board has something stable to return to.';
            assetList.appendChild(assetBoardEmpty);
            return;
        }

        assetBoardStatus.textContent = `${filteredAssets.length} visible card${filteredAssets.length === 1 ? '' : 's'} grouped by timeline.`;

        const grouped = new Map();
        filteredAssets.forEach((asset) => {
            const timeline = cleanLine(asset.timeline || '') || DEFAULT_ASSET_TIMELINE;
            if (!grouped.has(timeline)) grouped.set(timeline, []);
            grouped.get(timeline).push(asset);
        });

        const timelineSections = await Promise.all(Array.from(grouped.entries()).map(async ([timeline, assets]) => {
            const cards = await Promise.all(assets.map(async (asset) => (
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
        if (requestedAssetFocusId) {
            assetList.querySelector(`[data-rpg-asset-card-id="${requestedAssetFocusId}"]`)?.focus();
            requestedAssetFocusId = '';
        }
    };

    const saveComposer = async () => {
        const state = getState();
        const title = cleanLine(assetTitleInput.value || '');
        if (!title) {
            assetComposerStatus.textContent = 'Asset cards need a title so the live board stays scannable and speakable.';
            assetTitleInput.focus();
            return false;
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

        await render();
        resetAssetComposer({ preserveFlow: true });
        focusComposer();
        return true;
    };

    assetNamespaceFilterInput.addEventListener('change', () => {
        assetNamespaceFilter = assetNamespaceFilterInput.value || 'all';
        void render();
    });

    assetCollectedToggle.addEventListener('click', () => {
        assetCollectedOnly = !assetCollectedOnly;
        updateAssetComposerButtons();
        void render();
    });

    assetDensityToggle.addEventListener('click', () => {
        setComposerDensity(composerDensity === 'lean' ? 'full' : 'lean');
    });

    assetSaveButton.addEventListener('click', () => {
        void saveComposer();
    });

    assetResetButton.addEventListener('click', () => {
        resetAssetComposer();
        focusComposer();
    });

    const assetComposerSection = createElement('section', { className: 'rpg-asset-atlas__composer' }, [
        createElement('div', { className: 'rpg-asset-atlas__section-heading' }, [
            composerHeadingTitle,
            createElement('div', { className: 'rpg-asset-atlas__heading-tools' }, [
                assetDensityToggle,
                assetShortcuts
            ])
        ]),
        assetStarter,
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
    ]);

    const panel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--assets',
        id: 'rpg-kit-assets',
        'data-spw-feature': 'rpg-kit-assets'
    }, [
        createElement('h3', { text: 'Asset Atlas' }),
        createElement('p', {
            className: 'frame-note',
            text: 'Use this during the session to stage scenes, dice reads, swag props, textures, threats, and generator riffs in a timeline. Cards stay local, can collapse or collect, and are arranged to be easy to screenshot later. Start with a title when that is all you know.'
        }),
        createElement('div', { className: 'rpg-asset-atlas' }, [
            assetComposerSection,
            createElement('section', { className: 'rpg-asset-atlas__board-panel' }, [
                createElement('div', { className: 'rpg-asset-atlas__section-heading' }, [
                    createElement('h4', { text: 'Live board' }),
                    createElement('div', { className: 'rpg-asset-atlas__summary' }, [
                        createSummaryItem('cards', summaryCardsValue),
                        createSummaryItem('namespaces', summaryNamespacesValue),
                        createSummaryItem('timelines', summaryTimelinesValue)
                    ])
                ]),
                createElement('div', { className: 'rpg-asset-atlas__toolbar' }, [
                    assetNamespaceFilterField,
                    createElement('div', { className: 'rpg-gameplay-actions' }, [
                        assetCollectedToggle
                    ])
                ]),
                assetBoardStatus,
                assetList
            ])
        ])
    ]);

    syncComposerDensity();

    return {
        panel,
        render,
        saveComposer,
        resetComposer: resetAssetComposer,
        focusComposer,
        focusBoard,
        cancelEdit
    };
};
