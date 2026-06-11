import { emitSpwAction } from '/public/js/kernel/shared.js';
import {
    RPG_CURATOR_ROUTES,
    RPG_WORKBENCH_COPY,
    notifyRpgStateChange,
    workbenchLegendHtml
} from '/public/js/modules/rpg-wednesday-contract.js';
import { createElement, createField, createFrameHeading, createLineField } from '/public/js/modules/rpg-wednesday-dom.js';
import {
    appendGameplayLane,
    buildLanguagePromotionPacket,
    createLanguageEvolutionStorage,
    createWorldSlotStorage,
    flashLanguageHook,
    makeId,
    makeTimestamp,
    normalizeWorldSlot,
    promoteLanguageBriefToLane
} from '/public/js/modules/rpg-wednesday-state.js';

const POSTURES = [
    {
        id: 'linguistics',
        label: 'linguistics',
        title: 'Linguistic posture',
        note: 'Name the raw signal before it becomes speech: phonation, prosody, deixis, paradigm, syntagm, grain.'
    },
    {
        id: 'storytelling',
        label: 'storytelling',
        title: 'Storytelling posture',
        note: 'Treat the cluster as scene pressure: who wants what, what changes, what repeats, what can be read aloud.'
    },
    {
        id: 'communication',
        label: 'communication',
        title: 'Communication posture',
        note: 'Ask who receives the signal, what channel carries it, what repair path exists, and what publication test it must pass.'
    }
];

const STAGES = [
    { id: 'scratch', label: 'scratch', sigil: '~', meaning: 'private residue, unjudged' },
    { id: 'resonance', label: 'resonance', sigil: '?', meaning: 'felt relation, not yet grammar' },
    { id: 'grammar', label: 'grammar', sigil: '#>', meaning: 'repeatable handle or operator' },
    { id: 'canon', label: 'canon', sigil: '^', meaning: 'stable world or cast memory' },
    { id: 'publication', label: 'publication', sigil: '@', meaning: 'shareable artifact with proof' }
];

const preview = (value, fallback = 'not set') => {
    const trimmed = String(value || '').trim();
    return trimmed || fallback;
};

const buildLanguageEvolutionBrief = (state) => {
    const posture = POSTURES.find((item) => item.id === state.posture) || POSTURES[1];
    const stage = STAGES.find((item) => item.id === state.stage) || STAGES[1];
    const lines = [
        '# RPG Wednesday language evolution brief',
        `Posture: ${posture.title}`,
        `Stage: ${stage.sigil}${stage.label} — ${stage.meaning}`,
        `Seed: ${preview(state.seed)}`,
        `Gloss: ${preview(state.gloss)}`,
        `Table move: ${preview(state.tableMove)}`,
        `Audience: ${preview(state.audience)}`,
        '',
        'Promotion test: repeat · consequence · evidence · route fit',
        'Publication rule: move to canon only after the table repeats it or a collaborator can cite it.',
        '',
        `Updated: ${state.updatedAt || 'not saved yet'}`
    ];

    return lines.join('\n');
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
    document.execCommand('copy');
    fallback.remove();
};

export const initRpgLanguageEvolution = (section) => {
    if (!(section instanceof HTMLElement) || section.dataset.rpgHydrated === 'true') return null;

    const storage = createLanguageEvolutionStorage();
    let state = storage.read();
    let statusTimer = 0;

    section.dataset.rpgHydrated = 'true';
    section.dataset.spwFeature = 'language-evolution';
    section.classList.add('rpg-workbench', 'rpg-workbench--language');
    section.replaceChildren();

    const syncWorkbenchAttributes = () => {
        section.dataset.spwLanguageEvolutionPosture = state.posture;
        section.dataset.spwLanguageEvolutionStage = state.stage;
        document.documentElement.dataset.spwLanguageEvolutionPosture = state.posture;
        document.documentElement.dataset.spwLanguageEvolutionStage = state.stage;
    };

    const status = createElement('p', {
        className: 'rpg-language-evolution__status',
        role: 'status',
        'aria-live': 'polite',
        text: storage.available ? 'language evolution state ready in this browser' : RPG_WORKBENCH_COPY.storageUnavailable
    });

    const setTransientStatus = (message) => {
        clearTimeout(statusTimer);
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            status.textContent = storage.available
                ? `saved ${new Date(state.updatedAt).toLocaleString()}`
                : RPG_WORKBENCH_COPY.storageUnavailable;
        }, 2200);
    };

    const postureSwitch = createElement('div', {
        className: 'rpg-language-evolution__posture-switch mode-switch',
        role: 'group',
        'aria-label': 'Language evolution posture'
    });

    const stageRail = createElement('div', {
        className: 'rpg-language-evolution__stage-rail',
        role: 'group',
        'aria-label': 'Language evolution stage'
    });
    const stageReadout = createElement('p', {
        className: 'rpg-language-evolution__stage-readout',
        'aria-live': 'polite',
        text: ''
    });

    const postureNote = createElement('p', {
        className: 'frame-note rpg-language-evolution__posture-note',
        text: POSTURES.find((item) => item.id === state.posture)?.note || ''
    });

    const { field: seedField, input: seedInput } = createField({
        id: 'rpg-language-seed',
        label: 'Seed phrase / cluster handle',
        value: state.seed,
        rows: 2,
        placeholder: 'Boonhonk, library tea, WAP spill, clay bubble physics'
    });
    const { field: glossField, input: glossInput } = createField({
        id: 'rpg-language-gloss',
        label: 'Plain-language gloss',
        value: state.gloss,
        rows: 2,
        placeholder: 'What should a reader understand before the joke or jargon lands?'
    });
    const { field: moveField, input: moveInput } = createField({
        id: 'rpg-language-move',
        label: 'Table move / consequence',
        value: state.tableMove,
        rows: 3,
        placeholder: 'warn, invite, repair, bind, reveal, refuse, broadcast, return'
    });
    const { field: audienceField, input: audienceInput } = createLineField({
        id: 'rpg-language-audience',
        label: 'Audience / channel',
        value: state.audience,
        placeholder: 'table, TikTok read-aloud, investor deck, library card, model prompt'
    });

    const briefOutput = createElement('textarea', {
        className: 'rpg-gameplay-input rpg-language-evolution__brief',
        rows: 10,
        readOnly: true,
        'aria-label': 'Generated language evolution brief'
    });

    const refreshStageReadout = () => {
        const stage = STAGES.find((item) => item.id === state.stage) || STAGES[1];
        stageReadout.textContent = `${stage.sigil}${stage.label} — ${stage.meaning}`;
    };

    const refreshBrief = () => {
        briefOutput.value = buildLanguageEvolutionBrief(state);
        syncWorkbenchAttributes();
        refreshStageReadout();
    };

    const save = (description = 'updated language evolution workbench') => {
        state.updatedAt = new Date().toISOString();
        if (storage.available) storage.write(state);
        refreshBrief();
        setTransientStatus(description);
        emitSpwAction('@language_evolution.save', description);
        notifyRpgStateChange('language-evolution');
    };

    const syncInputs = () => {
        state.seed = seedInput.value;
        state.gloss = glossInput.value;
        state.tableMove = moveInput.value;
        state.audience = audienceInput.value;
    };

    const renderPostureSwitch = () => {
        postureSwitch.replaceChildren();
        POSTURES.forEach((posture) => {
            const button = createElement('button', {
                className: 'frame-sigil',
                type: 'button',
                text: `.${posture.label}`,
                'aria-pressed': String(state.posture === posture.id),
                'data-language-posture': posture.id,
                'data-spw-language-posture': posture.id
            });
            button.addEventListener('click', () => {
                state.posture = posture.id;
                postureNote.textContent = posture.note;
                renderPostureSwitch();
                save(`set language posture to ${posture.label}`);
            });
            postureSwitch.appendChild(button);
        });
    };

    const renderStageRail = () => {
        stageRail.replaceChildren();
        STAGES.forEach((stage) => {
            const button = createElement('button', {
                className: `rpg-language-evolution__stage${state.stage === stage.id ? ' is-active' : ''}`,
                type: 'button',
                'aria-pressed': String(state.stage === stage.id),
                'aria-label': `${stage.label}: ${stage.meaning}`,
                'data-language-stage': stage.id,
                'data-spw-language-stage': stage.id,
                title: stage.meaning
            }, [
                createElement('span', { className: 'rpg-language-evolution__stage-sigil', text: stage.sigil }),
                createElement('span', { className: 'rpg-language-evolution__stage-label', text: stage.label })
            ]);
            button.addEventListener('click', () => {
                state.stage = stage.id;
                renderStageRail();
                save(`set language stage to ${stage.label}`);
            });
            stageRail.appendChild(button);
        });
    };

    const debounce = (fn, ms) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = window.setTimeout(() => fn(...args), ms);
        };
    };
    const debouncedSave = debounce(() => save('updated language evolution fields'), 400);

    [seedInput, glossInput, moveInput, audienceInput].forEach((input) => {
        input.addEventListener('input', () => {
            syncInputs();
            debouncedSave();
        });
    });

    const copyBriefButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ copy brief'
    });
    copyBriefButton.addEventListener('click', async () => {
        syncInputs();
        refreshBrief();
        try {
            await copyText(briefOutput.value);
            copyBriefButton.textContent = '~ copied';
            emitSpwAction('~language_evolution.copy_brief', 'copied language evolution brief');
            window.setTimeout(() => {
                copyBriefButton.textContent = '~ copy brief';
            }, 1600);
        } catch {
            setTransientStatus('copy failed; select the brief manually');
        }
    });

    const LANE_INPUT_IDS = {
        nameFabric: 'rpg-name-fabric',
        characterBeat: 'rpg-character-beat',
        canonCandidates: 'rpg-canon-candidates',
        seeds: 'rpg-seeds'
    };

    const promoteToLane = (field, label) => {
        syncInputs();
        const target = document.querySelector(`#${LANE_INPUT_IDS[field] || ''}`);
        if (target instanceof HTMLTextAreaElement) {
            const packet = buildLanguagePromotionPacket(state);
            target.value = [target.value.trim(), packet].filter(Boolean).join('\n\n');
            target.dispatchEvent(new Event('input', { bubbles: true }));
            setTransientStatus(`promoted brief into ${label}`);
            emitSpwAction('^language_evolution.promote', `promoted language evolution brief to ${label}`);
            target.focus();
            notifyRpgStateChange('language-evolution-promote');
            return;
        }

        const result = promoteLanguageBriefToLane(field, state);
        if (result.ok) {
            setTransientStatus(`promoted brief into ${label}`);
            emitSpwAction('^language_evolution.promote', `promoted language evolution brief to ${label}`);
            notifyRpgStateChange('language-evolution-promote');
            return;
        }

        setTransientStatus(`open ${label} on ${RPG_CURATOR_ROUTES.kit}`);
    };

    const promoteFabricButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '~ to fabric'
    });
    promoteFabricButton.addEventListener('click', () => promoteToLane('nameFabric', 'name fabric'));

    const promoteHookButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ to hook'
    });
    promoteHookButton.addEventListener('click', () => {
        syncInputs();
        const packet = buildLanguagePromotionPacket(state);
        if (!packet) {
            setTransientStatus('add a seed, gloss, or table move first');
            return;
        }

        const hookTarget = document.querySelector('#rpg-character-hook');
        if (hookTarget instanceof HTMLTextAreaElement) {
            hookTarget.value = [hookTarget.value.trim(), packet].filter(Boolean).join('\n\n');
            setTransientStatus('promoted brief into character hook');
            emitSpwAction('@language_evolution.hook', 'promoted language evolution brief to character hook');
            hookTarget.focus();
            notifyRpgStateChange('language-evolution-hook');
            return;
        }

        if (flashLanguageHook(packet)) {
            setTransientStatus('hook queued — open character lab to receive it');
            emitSpwAction('@language_evolution.hook', 'queued language evolution brief for character hook');
            notifyRpgStateChange('language-evolution-hook-flash');
            return;
        }

        setTransientStatus(`open character lab at ${RPG_CURATOR_ROUTES.character}`);
    });

    const promoteBeatButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ to beat'
    });
    promoteBeatButton.addEventListener('click', () => promoteToLane('characterBeat', 'character beat'));

    const promoteCanonButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '^ to canon'
    });
    promoteCanonButton.addEventListener('click', () => promoteToLane('canonCandidates', 'canon candidates'));

    const promoteWorldButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '#> world slot'
    });
    promoteWorldButton.addEventListener('click', () => {
        syncInputs();
        const worldStorage = createWorldSlotStorage();
        if (!worldStorage.available) {
            setTransientStatus('local storage unavailable for world slots');
            return;
        }

        const slot = normalizeWorldSlot({
            id: makeId(),
            title: preview(state.seed, 'Language seed'),
            kind: 'rule',
            mechanism: state.tableMove,
            scale: state.audience,
            notes: [state.gloss, `posture: ${state.posture}`, `stage: ${state.stage}`].filter(Boolean).join(' · '),
            updatedAt: makeTimestamp()
        });

        worldStorage.write([slot, ...worldStorage.read()]);
        appendGameplayLane('canonCandidates', `${slot.title} · ${slot.mechanism || slot.notes}`);
        setTransientStatus('created world slot and mirrored into canon lane');
        emitSpwAction('#>language_evolution.world_slot', 'promoted language evolution brief to world slot');
        notifyRpgStateChange('language-evolution-world-slot');
    });

    renderPostureSwitch();
    renderStageRail();
    refreshBrief();

    section.append(
        createFrameHeading({
            href: '#language-evolution',
            sigilText: '~language_evolution',
            title: 'Language Evolution Workbench',
            operator: 'ref'
        }),
        createElement('p', {
            className: 'inline-note',
            text: RPG_WORKBENCH_COPY.languageIntro
        }),
        createElement('p', {
            className: 'rpg-workbench__legend',
            html: workbenchLegendHtml('Posture', RPG_WORKBENCH_COPY.languageBenchRule),
            trusted: true
        }),
        createElement('div', { className: 'rpg-workbench__control-deck' }, [
            postureSwitch,
            postureNote,
            stageRail,
            stageReadout
        ]),
        createElement('div', { className: 'rpg-language-evolution__grid' }, [
            createElement('div', { className: 'rpg-language-evolution__inputs' }, [
                seedField,
                glossField,
                moveField,
                audienceField
            ]),
            createElement('div', { className: 'rpg-language-evolution__output' }, [
                createElement('h3', { text: 'Evolution brief' }),
                createElement('p', {
                    className: 'frame-note',
                    text: RPG_WORKBENCH_COPY.languageBriefNote
                }),
                briefOutput,
                createElement('div', {
                    className: 'rpg-workbench__promote-manifold',
                    'data-spw-slot': 'actions'
                }, [
                    createElement('p', {
                        className: 'frame-note',
                        text: RPG_WORKBENCH_COPY.promotionManifold
                    }),
                    createElement('div', {
                        className: 'rpg-gameplay-actions rpg-gameplay-actions--promote',
                        'aria-label': 'Promote language evolution brief'
                    }, [
                        copyBriefButton,
                        promoteFabricButton,
                        promoteHookButton,
                        promoteBeatButton,
                        promoteCanonButton,
                        promoteWorldButton
                    ])
                ]),
                createElement('nav', {
                    className: 'frame-operators rpg-language-evolution__routes',
                    'aria-label': 'Language evolution routes'
                }, [
                    createElement('a', {
                        className: 'operator-chip',
                        href: RPG_CURATOR_ROUTES.kit,
                        text: '@ local kit'
                    }),
                    createElement('a', {
                        className: 'operator-chip',
                        href: RPG_CURATOR_ROUTES.curator,
                        text: '~ state curator'
                    }),
                    createElement('a', {
                        className: 'operator-chip',
                        href: RPG_CURATOR_ROUTES.character,
                        text: '@ character lab'
                    }),
                    createElement('a', {
                        className: 'operator-chip',
                        href: RPG_CURATOR_ROUTES.world,
                        text: '^ world slots'
                    }),
                    createElement('a', {
                        className: 'operator-chip',
                        href: RPG_CURATOR_ROUTES.fiber,
                        text: '~ fiber × language'
                    })
                ])
            ])
        ]),
        status
    );

    return {
        destroy: () => {
            delete section.dataset.rpgHydrated;
            delete section.dataset.spwLanguageEvolutionPosture;
            delete section.dataset.spwLanguageEvolutionStage;
            delete document.documentElement.dataset.spwLanguageEvolutionPosture;
            delete document.documentElement.dataset.spwLanguageEvolutionStage;
        }
    };
};