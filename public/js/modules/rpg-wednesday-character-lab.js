import { deleteImage, getImageDataUrl, storeImage } from '/public/js/spw-image-store.js';
import {
    buildCharacterImageKey,
    createCharacterStorage,
    makeId,
    makeTimestamp,
    normalizeCharacter,
    previewText
} from '/public/js/rpg-wednesday-state.js';
import {
    createElement,
    createField,
    createLineField,
    createShortcutToken
} from '/public/js/rpg-wednesday-dom.js';

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
    document.execCommand('copy');
    fallback.remove();
};

const buildCharacterSeed = (character) => {
    const parts = [
        previewText(character.name, 'Unnamed character'),
        character.role ? `role ${character.role}` : '',
        character.vocation ? `development ${character.vocation}` : '',
        character.literacies ? `literacies ${character.literacies}` : '',
        character.lineage ? `lineage ${character.lineage}` : '',
        character.pronouns ? `pronouns ${character.pronouns}` : '',
        character.hook ? `hook ${character.hook}` : '',
        character.notes ? `notes ${character.notes}` : ''
    ].filter(Boolean);

    return parts.join(' · ');
};

export const initRpgCharacterLab = (section) => {
    if (!(section instanceof HTMLElement) || section.dataset.rpgHydrated === 'true') return null;

    const storage = createCharacterStorage();
    let deck = storage.read();
    let editingId = null;
    let draftUpload = null;
    let density = 'lean';
    let statusTimer = 0;
    let renderToken = 0;

    const { field: nameField, input: nameInput } = createLineField({
        id: 'rpg-character-name',
        label: 'Character name',
        value: '',
        placeholder: 'Aetheris Solune'
    });
    const { field: roleField, input: roleInput } = createLineField({
        id: 'rpg-character-role',
        label: 'Role / calling',
        value: '',
        placeholder: 'Signal cartographer, woodfrog paladin, coral witch'
    });
    const { field: vocationField, input: vocationInput } = createLineField({
        id: 'rpg-character-vocation',
        label: 'Development vector / wonder lane',
        value: '',
        placeholder: 'software, teaching, painting, care work, research, spiritual witness'
    });
    const { field: literaciesField, input: literaciesInput } = createLineField({
        id: 'rpg-character-literacies',
        label: 'Literacies / thinking tools',
        value: '',
        placeholder: 'code, visual, narrative, statistical, social, ritual, nutritional'
    });
    const { field: hookField, input: hookInput } = createField({
        id: 'rpg-character-hook',
        label: 'Current hook',
        value: '',
        rows: 3,
        placeholder: 'What is changing, unresolved, or newly visible about this person?'
    });
    const { field: lineageField, input: lineageInput } = createLineField({
        id: 'rpg-character-lineage',
        label: 'Lineage / tradition',
        value: '',
        placeholder: 'clay golem, river-bred, late quinary witness'
    });
    const { field: pronounsField, input: pronounsInput } = createLineField({
        id: 'rpg-character-pronouns',
        label: 'Pronouns / address',
        value: '',
        placeholder: 'they/them, he/they, use title only'
    });
    const { field: imageUrlField, input: imageUrlInput } = createLineField({
        id: 'rpg-character-image-url',
        label: 'Art URL',
        value: '',
        placeholder: 'https://...'
    });
    const uploadInput = createElement('input', {
        id: 'rpg-character-image-upload',
        className: 'rpg-character-upload__input',
        type: 'file',
        accept: 'image/*'
    });
    const uploadLabel = createElement('span', { className: 'rpg-character-upload__label', text: 'Portrait / character art' });
    const uploadHint = createElement('span', {
        className: 'rpg-character-upload__hint',
        text: 'Choose a portrait, sketch, screenshot, or study'
    });
    const uploadState = createElement('span', {
        className: 'rpg-character-upload__state',
        text: 'No portrait held yet'
    });
    const uploadPrompt = createElement('div', { className: 'rpg-character-upload__prompt' }, [
        createElement('strong', { text: 'Drop in a face, sketch, or study' }),
        createElement('span', { text: 'What if we start with the face and let the rest catch up? 4:5 portraits and square studies work well here.' })
    ]);
    const uploadField = createElement('label', { className: 'rpg-gameplay-field rpg-character-upload' }, [
        uploadLabel,
        createElement('span', { className: 'rpg-character-upload__shell' }, [
            createElement('span', { className: 'rpg-character-upload__glyph', text: '+ art' }),
            uploadPrompt,
            uploadState,
            uploadInput
        ]),
        uploadHint
    ]);
    const { field: notesField, input: notesInput } = createField({
        id: 'rpg-character-notes',
        label: 'Development notes',
        value: '',
        rows: 4,
        placeholder: 'Voice, bonds, ritual habits, prompt utility, week-to-week changes'
    });

    [vocationField, literaciesField, lineageField, pronounsField, imageUrlField, notesField].forEach((field) => {
        field.classList.add('rpg-character-lab__advanced');
    });

    const board = createElement('div', {
        className: 'rpg-character-lab__cards',
        role: 'list',
        'aria-label': 'Local character cards'
    });
    const status = createElement('p', {
        className: 'frame-note rpg-character-lab__status',
        role: 'status',
        'aria-live': 'polite',
        text: storage.available
            ? 'Character notes, art, and seeds stay in this browser unless you copy or export them elsewhere.'
            : 'Local storage is unavailable in this browser context. Character drafts will not persist after this page closes.'
    });
    const emptyState = createElement('div', {
        className: 'rpg-character-lab__empty'
    }, [
        createElement('p', {
            text: 'Start with one person. A name and one image are enough to give the campaign someone specific to return to. What if that is already enough to make the week feel more real?'
        }),
        createElement('div', {
            className: 'rpg-shortcut-row',
            'aria-label': 'Character entry heuristics'
        }, [
            createShortcutToken({ key: 'name', label: 'identity first' }),
            createShortcutToken({ key: 'art', label: 'face first' }),
            createShortcutToken({ key: 'hook', label: 'current pressure' }),
            createShortcutToken({ key: 'literacies', label: 'thinking lanes' })
        ])
    ]);

    const summaryCharacters = createElement('strong', { text: '0' });
    const summaryPortraits = createElement('strong', { text: '0' });
    const summaryHooks = createElement('strong', { text: '0' });

    const summary = createElement('div', { className: 'rpg-character-lab__summary' }, [
        createElement('div', { className: 'rpg-character-lab__summary-item' }, [
            createElement('span', { text: 'characters' }),
            summaryCharacters
        ]),
        createElement('div', { className: 'rpg-character-lab__summary-item' }, [
            createElement('span', { text: 'faces' }),
            summaryPortraits
        ]),
        createElement('div', { className: 'rpg-character-lab__summary-item' }, [
            createElement('span', { text: 'hooks' }),
            summaryHooks
        ])
    ]);

    const saveButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ save character'
    });
    const resetButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '! clear draft'
    });
    const densityButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ full fields'
    });
    const starter = createElement('p', {
        className: 'frame-note rpg-character-lab__starter',
        text: 'Table narrator: what if the first pass stays narrow? Who is this person, what do they look like, and which kinds of development are they actually carrying right now?'
    });
    const composer = createElement('div', {
        className: 'rpg-character-lab__composer'
    }, [
        createElement('div', {
            className: 'rpg-character-lab__section-heading'
        }, [
            createElement('h3', { text: 'Draft Character' }),
            createElement('div', {
                className: 'rpg-character-lab__heading-tools'
            }, [densityButton])
        ]),
        starter,
        summary,
        createElement('div', { className: 'rpg-character-lab__field-grid' }, [
            nameField,
            roleField,
            vocationField,
            uploadField,
            hookField,
            literaciesField,
            lineageField,
            pronounsField,
            imageUrlField,
            notesField
        ]),
        createElement('div', { className: 'rpg-gameplay-actions' }, [
            saveButton,
            resetButton
        ])
    ]);

    const boardPanel = createElement('div', {
        className: 'rpg-character-lab__board-panel'
    }, [
        createElement('div', { className: 'rpg-character-lab__section-heading' }, [
            createElement('h3', { text: 'Character Deck' }),
            createElement('p', {
                    className: 'frame-note',
                    text: 'Each card should stand alone well enough to screenshot, read aloud, or hand off to another model, while still pointing toward a broader life, craft, calling, or spiritual question.'
                })
            ]),
        board
    ]);

    const syncDensity = () => {
        composer.dataset.rpgCharacterDensity = density;
        densityButton.textContent = density === 'lean' ? '~ full fields' : '~ lean fields';
    };

    const syncStatus = (message) => {
        clearTimeout(statusTimer);
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            status.textContent = storage.available
                ? 'Character notes, art, and seeds stay in this browser unless you copy or export them elsewhere.'
                : 'Local storage is unavailable in this browser context. Character drafts will not persist after this page closes.';
        }, 2200);
    };

    const resetDraft = () => {
        editingId = null;
        draftUpload = null;
        nameInput.value = '';
        roleInput.value = '';
        vocationInput.value = '';
        literaciesInput.value = '';
        lineageInput.value = '';
        pronounsInput.value = '';
        hookInput.value = '';
        imageUrlInput.value = '';
        notesInput.value = '';
        uploadInput.value = '';
        uploadState.textContent = 'No portrait held yet';
        saveButton.textContent = '@ save character';
        resetButton.textContent = '! clear draft';
    };

    const populateDraft = (character) => {
        editingId = character.id;
        draftUpload = null;
        nameInput.value = character.name || '';
        roleInput.value = character.role || '';
        vocationInput.value = character.vocation || '';
        literaciesInput.value = character.literacies || '';
        lineageInput.value = character.lineage || '';
        pronounsInput.value = character.pronouns || '';
        hookInput.value = character.hook || '';
        imageUrlInput.value = character.imageUrl || '';
        notesInput.value = character.notes || '';
        uploadInput.value = '';
        uploadState.textContent = character.imageKey || character.imageUrl
            ? 'Portrait already attached'
            : 'No portrait held yet';
        saveButton.textContent = '~ update character';
        resetButton.textContent = '! cancel edit';
    };

    const persistDeck = () => {
        if (storage.available) {
            storage.write(deck);
        }
        summaryCharacters.textContent = String(deck.length);
        summaryPortraits.textContent = String(deck.filter((item) => item.imageKey || item.imageUrl).length);
        summaryHooks.textContent = String(deck.filter((item) => item.hook && item.hook.trim()).length);
    };

    const render = async () => {
        const currentToken = ++renderToken;
        board.replaceChildren();

        if (!deck.length) {
            board.appendChild(emptyState);
            persistDeck();
            return;
        }

        const cards = await Promise.all(deck.map(async (character) => {
            const imageDataUrl = character.imageKey ? await getImageDataUrl(character.imageKey).catch(() => null) : null;
            const previewUrl = imageDataUrl || character.imageUrl || '';

            const topMeta = [character.role, character.vocation, character.lineage, character.pronouns]
                .filter(Boolean)
                .join(' · ');

            const card = createElement('article', {
                className: 'rpg-character-card',
                role: 'listitem',
                tabindex: '0'
            }, [
                previewUrl
                    ? createElement('div', { className: 'rpg-character-card__art' }, [
                        createElement('img', {
                            src: previewUrl,
                            alt: `${character.name || 'Character'} portrait`
                        })
                    ])
                    : createElement('div', { className: 'rpg-character-card__placeholder' }, [
                        createElement('strong', { text: previewText(character.name, 'Unnamed') }),
                        createElement('span', { text: 'Add art later or keep this as a text-first individual card.' })
                    ]),
                createElement('div', { className: 'rpg-character-card__body' }, [
                    createElement('div', { className: 'rpg-character-card__heading' }, [
                        createElement('strong', { text: previewText(character.name, 'Unnamed character', 48) }),
                        topMeta ? createElement('span', { text: topMeta }) : ''
                    ]),
                    createElement('p', {
                        className: 'rpg-character-card__hook',
                        text: previewText(character.hook, 'No hook yet. Add one line of pressure, desire, or contradiction.', 160)
                    }),
                    character.literacies
                        ? createElement('p', {
                            className: 'rpg-character-card__literacies',
                            text: previewText(character.literacies, '', 180)
                        })
                        : '',
                    character.notes
                        ? createElement('p', {
                            className: 'rpg-character-card__notes',
                            text: previewText(character.notes, '', 180)
                        })
                        : ''
                ]),
                createElement('div', { className: 'rpg-character-card__controls' }, [
                    createElement('button', { className: 'operator-chip', type: 'button', text: '~ edit' }),
                    createElement('button', { className: 'operator-chip', type: 'button', text: '@ copy seed' }),
                    createElement('button', { className: 'operator-chip', type: 'button', text: '! remove' })
                ])
            ]);

            const [editButton, copyButton, removeButton] = card.querySelectorAll('button');
            editButton?.addEventListener('click', () => {
                populateDraft(character);
                nameInput.focus();
                syncStatus(`Editing ${previewText(character.name, 'character')}`);
            });
            copyButton?.addEventListener('click', async () => {
                await copyText(buildCharacterSeed(character));
                syncStatus(`Copied seed for ${previewText(character.name, 'character')}`);
            });
            removeButton?.addEventListener('click', async () => {
                if (!window.confirm(`Remove ${previewText(character.name, 'this character')} from this browser?`)) return;
                deck = deck.filter((item) => item.id !== character.id);
                if (character.imageKey) {
                    await deleteImage(character.imageKey).catch(() => {});
                }
                if (editingId === character.id) resetDraft();
                persistDeck();
                void render();
                syncStatus('Character removed');
            });

            return card;
        }));

        if (currentToken !== renderToken) return;
        board.replaceChildren(...cards);
        persistDeck();
    };

    saveButton.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        if (!name) {
            syncStatus('Name the character first');
            nameInput.focus();
            return;
        }

        const existing = editingId
            ? deck.find((item) => item.id === editingId)
            : null;
        const id = editingId || makeId();
        let imageKey = existing?.imageKey || '';
        let imageUrl = imageUrlInput.value.trim();

        if (draftUpload) {
            const nextKey = buildCharacterImageKey(id);
            await storeImage(nextKey, draftUpload);
            imageKey = nextKey;
            imageUrl = '';
            if (existing?.imageKey && existing.imageKey !== nextKey) {
                await deleteImage(existing.imageKey).catch(() => {});
            }
        }

        const nextCharacter = normalizeCharacter({
            ...existing,
            id,
            name,
            role: roleInput.value.trim(),
            vocation: vocationInput.value.trim(),
            literacies: literaciesInput.value.trim(),
            lineage: lineageInput.value.trim(),
            pronouns: pronounsInput.value.trim(),
            hook: hookInput.value.trim(),
            notes: notesInput.value.trim(),
            imageUrl,
            imageKey,
            updatedAt: makeTimestamp()
        });

        if (existing) {
            deck = deck.map((item) => (item.id === existing.id ? nextCharacter : item));
        } else {
            deck = [nextCharacter, ...deck];
        }

        persistDeck();
        resetDraft();
        void render();
        syncStatus(existing ? 'Character updated' : 'Character saved');
    });

    resetButton.addEventListener('click', () => {
        resetDraft();
        syncStatus('Draft cleared');
    });

    densityButton.addEventListener('click', () => {
        density = density === 'lean' ? 'full' : 'lean';
        syncDensity();
    });

    uploadInput.addEventListener('change', () => {
        draftUpload = uploadInput.files?.[0] || null;
        if (draftUpload) {
            uploadState.textContent = draftUpload.name;
            syncStatus(`Loaded portrait: ${draftUpload.name}`);
        }
    });

    section.dataset.rpgHydrated = 'true';
    section.className = 'site-frame rpg-character-lab';
    section.replaceChildren(
        createElement('div', { className: 'frame-heading' }, [
            createElement('a', {
                className: 'frame-sigil',
                href: '#character-development',
                text: '@character_development'
            }),
            createElement('h2', { text: 'Character Development' })
        ]),
        createElement('p', {
            className: 'inline-note',
            text: 'Build one person at a time. Start with a name and portrait, then add the development vectors and literacies that help the player recognize themselves as a specific individual. Topic links elsewhere on the page are there to name the kind of thinking the character wants next.'
        }),
        createElement('div', { className: 'rpg-character-lab__layout' }, [
            composer,
            boardPanel
        ]),
        status
    );

    syncDensity();
    persistDeck();
    void render();

    return {
        focusComposer: () => nameInput.focus()
    };
};
