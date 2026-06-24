import {
    createCardSigil,
    createElement,
    createField,
    createFrameHeading,
    createLineField
} from '/public/js/modules/rpg-wednesday/dom.js';
import {
    WORLD_SLOT_KIND_OPTIONS,
    appendGameplayLane,
    createStorage,
    createWorldSlotStorage,
    makeId,
    makeTimestamp,
    previewText
} from '/public/js/modules/rpg-wednesday/state.js';
import { RPG_WORKBENCH_COPY, notifyRpgStateChange, workbenchLegendHtml } from '/public/js/modules/rpg-wednesday/contract.js';

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

const buildWorldSlotSeed = (slot) => {
    const parts = [
        previewText(slot.title, 'Untitled slot'),
        slot.kind ? `kind ${slot.kind}` : '',
        slot.mechanism ? `mechanism ${slot.mechanism}` : '',
        slot.scale ? `scale ${slot.scale}` : '',
        slot.notes ? `notes ${slot.notes}` : ''
    ].filter(Boolean);

    return parts.join(' · ');
};

export const initRpgWorldLab = (section) => {
    if (!(section instanceof HTMLElement) || section.dataset.rpgHydrated === 'true') return null;

    const storage = createWorldSlotStorage();
    let deck = storage.read();
    let editingId = null;
    let statusTimer = 0;

    section.dataset.rpgHydrated = 'true';
    section.dataset.spwFeature = 'world-slots';
    section.classList.add('rpg-workbench', 'rpg-workbench--world');
    section.replaceChildren();

    const syncWorkbenchAttributes = () => {
        section.dataset.spwWorldSlotKind = kindSelect.value;
        section.dataset.spwWorldSlotCount = String(deck.length);
        document.documentElement.dataset.spwWorldSlotKind = kindSelect.value;
    };

    const { field: titleField, input: titleInput } = createLineField({
        id: 'rpg-world-title',
        label: 'Slot title',
        value: '',
        placeholder: 'Town library circulation desk, Mimes Against WAP, clay bubble policy'
    });
    const kindSelect = createElement('select', {
        id: 'rpg-world-kind',
        className: 'rpg-gameplay-line-input',
        'aria-label': 'World slot kind'
    });
    WORLD_SLOT_KIND_OPTIONS.forEach((option) => {
        kindSelect.appendChild(createElement('option', {
            value: option.value,
            text: option.label
        }));
    });
    const kindField = createElement('label', {
        className: 'rpg-gameplay-field',
        htmlFor: 'rpg-world-kind'
    }, [
        createElement('span', { text: 'Slot kind' }),
        kindSelect
    ]);
    const { field: mechanismField, input: mechanismInput } = createField({
        id: 'rpg-world-mechanism',
        label: 'Playable mechanism',
        value: '',
        rows: 3,
        placeholder: 'What can a player attempt because this place, faction, or rule exists?'
    });
    const { field: scaleField, input: scaleInput } = createLineField({
        id: 'rpg-world-scale',
        label: 'Scale / scope',
        value: '',
        placeholder: 'room, district, institution, region'
    });
    const { field: notesField, input: notesInput } = createField({
        id: 'rpg-world-notes',
        label: 'Notes / evidence',
        value: '',
        rows: 3,
        placeholder: 'Session proof, analog source, or why this may deserve public world memory'
    });

    const board = createElement('div', {
        className: 'rpg-world-lab__cards',
        role: 'list',
        'aria-label': 'World slot deck'
    });
    const status = createElement('p', {
        className: 'frame-note rpg-world-lab__status',
        text: 'World slots stay local until promoted into sessions, canon candidates, or public world copy.'
    });
    const summarySlots = createElement('strong', { text: '0' });
    const summaryMechanisms = createElement('strong', { text: '0' });

    const saveButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '^ save slot'
    });
    const resetButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '! clear draft'
    });
    const importCanonButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ from canon lane'
    });
    const promoteCanonButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '^ to canon lane'
    });

    const syncStatus = (message) => {
        clearTimeout(statusTimer);
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            status.textContent = storage.available
                ? 'Incremental world slots stay in this browser until they earn session or public memory.'
                : 'Local storage unavailable; world slots will not persist after this page closes.';
        }, 2200);
    };

    const resetDraft = () => {
        editingId = null;
        titleInput.value = '';
        kindSelect.value = 'place';
        mechanismInput.value = '';
        scaleInput.value = '';
        notesInput.value = '';
        saveButton.textContent = '^ save slot';
        resetButton.textContent = '! clear draft';
    };

    const populateDraft = (slot) => {
        editingId = slot.id;
        titleInput.value = slot.title || '';
        kindSelect.value = slot.kind || 'place';
        mechanismInput.value = slot.mechanism || '';
        scaleInput.value = slot.scale || '';
        notesInput.value = slot.notes || '';
        saveButton.textContent = '~ update slot';
        resetButton.textContent = '! cancel edit';
    };

    const persistDeck = () => {
        if (storage.available) storage.write(deck);
        summarySlots.textContent = String(deck.length);
        summaryMechanisms.textContent = String(deck.filter((item) => item.mechanism?.trim()).length);
        syncWorkbenchAttributes();
        notifyRpgStateChange('world-lab');
    };

    const render = () => {
        board.replaceChildren();

        if (!deck.length) {
            board.appendChild(createElement('p', {
                className: 'frame-note rpg-world-lab__empty',
                text: 'No world slots yet. Start with one place, faction, rule, or analog mechanism that changed what the table could do.'
            }));
            persistDeck();
            return;
        }

        deck.forEach((slot) => {
            const card = createElement('article', {
                className: 'rpg-world-slot-card',
                role: 'listitem',
                tabindex: '0',
                'data-spw-world-slot-kind': slot.kind,
                'data-spw-kind': 'card',
                'data-spw-role': 'world-slot'
            }, [
                createElement('div', { className: 'rpg-world-slot-card__heading' }, [
                    createCardSigil(slot.kind),
                    createElement('strong', { text: previewText(slot.title, 'Untitled slot', 56) })
                ]),
                createElement('p', {
                    className: 'rpg-world-slot-card__mechanism',
                    text: previewText(slot.mechanism, 'Add a playable mechanism before promoting this slot.', 180)
                }),
                slot.scale
                    ? createElement('p', { className: 'rpg-world-slot-card__scale', text: `scale · ${slot.scale}` })
                    : '',
                slot.notes
                    ? createElement('p', { className: 'rpg-world-slot-card__notes', text: previewText(slot.notes, '', 160) })
                    : '',
                createElement('div', { className: 'rpg-world-slot-card__controls' }, [
                    createElement('button', { className: 'operator-chip', type: 'button', text: '~ edit' }),
                    createElement('button', { className: 'operator-chip', type: 'button', text: '@ copy seed' }),
                    createElement('button', { className: 'operator-chip', type: 'button', text: '! remove' })
                ])
            ]);

            const [editButton, copyButton, removeButton] = card.querySelectorAll('button');
            editButton?.addEventListener('click', () => {
                populateDraft(slot);
                titleInput.focus();
                syncStatus(`Editing ${previewText(slot.title, 'world slot')}`);
            });
            copyButton?.addEventListener('click', async () => {
                await copyText(buildWorldSlotSeed(slot));
                syncStatus(`Copied seed for ${previewText(slot.title, 'world slot')}`);
            });
            removeButton?.addEventListener('click', () => {
                deck = deck.filter((item) => item.id !== slot.id);
                if (editingId === slot.id) resetDraft();
                persistDeck();
                render();
                syncStatus('Removed world slot');
            });

            board.appendChild(card);
        });

        persistDeck();
    };

    saveButton.addEventListener('click', () => {
        const payload = {
            id: editingId || makeId(),
            title: titleInput.value.trim(),
            kind: kindSelect.value,
            mechanism: mechanismInput.value.trim(),
            scale: scaleInput.value.trim(),
            notes: notesInput.value.trim(),
            updatedAt: makeTimestamp()
        };

        if (!payload.title && !payload.mechanism) {
            syncStatus('Add a title or mechanism before saving');
            titleInput.focus();
            return;
        }

        if (editingId) {
            deck = deck.map((item) => (item.id === editingId ? payload : item));
        } else {
            deck = [payload, ...deck];
        }

        persistDeck();
        render();
        resetDraft();
        syncStatus('Saved world slot');
    });

    resetButton.addEventListener('click', () => {
        resetDraft();
        syncStatus('Cleared world slot draft');
    });

    importCanonButton.addEventListener('click', () => {
        const gameplay = createStorage().read();
        const canon = gameplay.canonCandidates?.trim();
        if (!canon) {
            syncStatus('canon candidates lane is empty — add material in the local kit first');
            return;
        }

        const firstLine = canon.split('\n').map((line) => line.trim()).find(Boolean) || canon;
        titleInput.value = firstLine.slice(0, 96);
        notesInput.value = [notesInput.value.trim(), `from canon: ${firstLine}`].filter(Boolean).join('\n\n');
        syncStatus('Imported first canon candidate into draft');
        titleInput.focus();
    });

    promoteCanonButton.addEventListener('click', () => {
        const seed = buildWorldSlotSeed({
            title: titleInput.value,
            kind: kindSelect.value,
            mechanism: mechanismInput.value,
            scale: scaleInput.value,
            notes: notesInput.value
        });

        if (!seed || seed === 'Untitled slot') {
            syncStatus('Save or draft a slot before promoting to canon');
            return;
        }

        const result = appendGameplayLane('canonCandidates', seed);
        if (!result.ok) {
            syncStatus('could not write canon lane — open the local kit on the hub route');
            return;
        }

        syncStatus('Promoted slot draft into canon candidates');
        notifyRpgStateChange('world-lab-promote');
    });

    section.append(
        createFrameHeading({
            href: '#world-slots',
            sigilText: '^world_slots',
            title: 'Incremental World Slots',
            operator: 'object'
        }),
        createElement('p', {
            className: 'inline-note',
            text: RPG_WORKBENCH_COPY.worldIntro
        }),
        createElement('p', {
            className: 'rpg-workbench__legend',
            html: workbenchLegendHtml('Slot kind', RPG_WORKBENCH_COPY.worldBenchRule),
            trusted: true
        }),
        createElement('div', { className: 'rpg-world-lab__layout' }, [
            createElement('div', { className: 'rpg-world-lab__composer' }, [
                createElement('div', { className: 'rpg-world-lab__section-heading' }, [
                    createElement('h3', { text: 'Draft Slot' }),
                    createElement('div', { className: 'rpg-world-lab__summary' }, [
                        createElement('div', { className: 'rpg-world-lab__summary-item' }, [
                            createElement('span', { text: 'slots' }),
                            summarySlots
                        ]),
                        createElement('div', { className: 'rpg-world-lab__summary-item' }, [
                            createElement('span', { text: 'mechanisms' }),
                            summaryMechanisms
                        ])
                    ])
                ]),
                createElement('p', {
                    className: 'frame-note rpg-world-lab__starter',
                    text: 'A world slot is not lore yet. It is a candidate rule with a mechanism the table can feel.'
                }),
                createElement('div', { className: 'rpg-world-lab__field-grid' }, [
                    titleField,
                    kindField,
                    mechanismField,
                    scaleField,
                    notesField
                ]),
                createElement('div', { className: 'rpg-gameplay-actions' }, [
                    saveButton,
                    resetButton,
                    importCanonButton,
                    promoteCanonButton,
                    createElement('a', {
                        className: 'operator-chip',
                        href: '/play/rpg-wednesday/#local-gameplay-kit',
                        text: '@ local kit'
                    }),
                    createElement('a', {
                        className: 'operator-chip',
                        href: '/play/rpg-wednesday/#language-evolution',
                        text: '~ language evolution'
                    })
                ])
            ]),
            createElement('div', { className: 'rpg-world-lab__board-panel' }, [
                createElement('div', { className: 'rpg-world-lab__section-heading' }, [
                    createElement('h3', { text: 'Slot Deck' }),
                    createElement('p', {
                        className: 'frame-note',
                        text: 'Keep slots local until sessions prove repetition. Then move stable versions into the world register or session log.'
                    })
                ]),
                board
            ])
        ]),
        status
    );

    kindSelect.addEventListener('change', syncWorkbenchAttributes);
    syncWorkbenchAttributes();
    render();

    return {
        destroy: () => {
            delete section.dataset.rpgHydrated;
            delete section.dataset.spwWorldSlotKind;
            delete section.dataset.spwWorldSlotCount;
            delete document.documentElement.dataset.spwWorldSlotKind;
        }
    };
};
