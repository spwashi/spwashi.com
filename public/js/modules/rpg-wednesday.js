import { emitSpwAction } from '/public/js/spw-shared.js';
import { createAssetAtlasController } from '/public/js/rpg-wednesday-asset-atlas.js';
import { initRpgCharacterLab } from '/public/js/rpg-wednesday-character-lab.js';
import { createElement, createField, createShortcutToken } from '/public/js/rpg-wednesday-dom.js';
import {
    RPG_SHORTCUT_ACTIONS,
    RPG_SHORTCUT_SECTIONS,
    createShortcutManager
} from '/public/js/rpg-wednesday-shortcuts.js';
import {
    CLOCK_SEGMENT_OPTIONS,
    DASH_VALUE,
    RPG_ROUTE_RE,
    buildClockText,
    buildSessionBrief,
    clearStateAssetImages,
    cloneDefaultState,
    collectExportState,
    createStorage,
    formatClockSummary,
    formatStatusTime,
    getActiveActor,
    getPressureClock,
    makeId,
    normalizeState,
    persistImportedAssetImages,
    previewText,
    safeJsonParse
} from '/public/js/rpg-wednesday-state.js';

const debounce = (fn, ms) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
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
            note: 'Cast is the collective register. Use the separate character-development page for one-person iteration, then move stable versions here once the canon is ready to keep.'
        };
    }

    if (path === '/play/rpg-wednesday/character/') {
        return {
            pill: 'character focus',
            title: 'RPG Mode',
            note: 'Start with one person: name, art, and current pressure. Keep the character individual here before folding anything into cast memory or broader campaign lore.'
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
            href: '/play/rpg-wednesday/character/',
            text: '@ character development'
        }),
        createElement('a', {
            className: 'operator-chip',
            href: '/play/rpg-wednesday/cast/',
            text: '~ cast register'
        }),
        createElement('a', {
            className: 'operator-chip',
            href: '/tools/character-sheet/',
            text: '^ translation sheet'
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

    const controllers = [];
    const characterSection = document.querySelector('[data-rpg-character-lab]');
    if (characterSection instanceof HTMLElement && characterSection.dataset.rpgHydrated !== 'true') {
        const characterLab = initRpgCharacterLab(characterSection);
        if (characterLab) controllers.push(characterLab);
    }

    const section = document.querySelector('[data-rpg-gameplay-kit]');
    if (!section || section.dataset.rpgHydrated === 'true') {
        return controllers.length
            ? {
                destroy: () => {
                    controllers.forEach((controller) => controller.destroy?.());
                }
            }
            : null;
    }

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

    const shortcutGroups = createElement('div', {
        className: 'rpg-gameplay-shortcuts',
        'aria-label': 'Keyboard shortcuts'
    }, [
        createElement('div', { className: 'rpg-gameplay-shortcuts__group' }, [
            createElement('strong', { text: 'Jump' }),
            createElement('div', { className: 'rpg-shortcut-row' }, RPG_SHORTCUT_SECTIONS.map((shortcut) => (
                createShortcutToken(shortcut)
            )))
        ]),
        createElement('div', { className: 'rpg-gameplay-shortcuts__group' }, [
            createElement('strong', { text: 'Actions' }),
            createElement('div', { className: 'rpg-shortcut-row' }, RPG_SHORTCUT_ACTIONS.map((shortcut) => (
                createShortcutToken(shortcut)
            )))
        ])
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

    let statusTimer = 0;
    const syncSavedStatus = () => {
        status.textContent = storage.available
            ? formatStatusTime(state.updatedAt)
            : 'local storage unavailable; changes are only in memory';
    };
    const setTransientStatus = (message) => {
        clearTimeout(statusTimer);
        status.textContent = message;
        statusTimer = window.setTimeout(() => {
            syncSavedStatus();
        }, 2000);
    };

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

    const refreshDerivedSurfaces = () => {
        const activeActor = getActiveActor(state);
        const pressureClock = getPressureClock(state);

        dashboardValues.scene.textContent = previewText(state.scene);
        dashboardValues.objective.textContent = previewText(state.objective);
        dashboardValues.actors.textContent = state.initiative.length ? String(state.initiative.length) : DASH_VALUE;
        dashboardValues.clocks.textContent = state.clocks.length ? String(state.clocks.length) : DASH_VALUE;
        dashboardValues.assets.textContent = state.assets.length ? String(state.assets.length) : DASH_VALUE;
        dashboardValues.namespaces.textContent = state.assets.length
            ? String(new Set(state.assets.map((asset) => asset.namespace || 'table')).size)
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
        syncSavedStatus();
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

    const assetAtlas = createAssetAtlasController({
        getState: () => state,
        save
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
        setTransientStatus(`Turn moved to ${previewText(next.name, 'unnamed actor')}`);
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

    const addActorButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ add actor'
    });
    addActorButton.addEventListener('click', addActor);

    const nextTurnButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ next turn'
    });
    nextTurnButton.addEventListener('click', nextTurn);

    const initiativePanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--initiative',
        id: 'rpg-kit-initiative',
        'data-spw-feature': 'rpg-kit-initiative'
    }, [
        createElement('h3', { text: 'Initiative' }),
        createElement('div', { className: 'rpg-gameplay-actions' }, [
            addActorButton,
            nextTurnButton
        ]),
        initiativeList
    ]);

    const addClockButton = createElement('button', {
        className: 'operator-chip',
        type: 'button',
        text: '@ add clock'
    });
    addClockButton.addEventListener('click', addClock);

    const clocksPanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--clocks',
        id: 'rpg-kit-clocks',
        'data-spw-feature': 'rpg-kit-clocks'
    }, [
        createElement('h3', { text: 'Clocks' }),
        createElement('div', { className: 'rpg-gameplay-actions' }, [
            addClockButton
        ]),
        clocksList
    ]);

    const scenePanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--scene',
        id: 'rpg-kit-scene',
        'data-spw-feature': 'rpg-kit-scene'
    }, [
        createElement('h3', { text: 'Scene Register' }),
        createElement('div', { className: 'rpg-gameplay-stack' }, [
            sceneField,
            objectiveField,
            partyField
        ])
    ]);

    const notesPanel = createElement('div', {
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--notes',
        id: 'rpg-kit-notes',
        'data-spw-feature': 'rpg-kit-notes'
    }, [
        createElement('h3', { text: 'Notes and handoff' }),
        createElement('p', {
            className: 'frame-note',
            text: 'Scratch notes stay private. Character beats and canon candidates are the lanes most likely to move into cast, world, or session memory.'
        }),
        createElement('div', { className: 'rpg-gameplay-notes-stack' }, [
            notesField,
            characterBeatField,
            canonCandidatesField,
            seedsField
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
    const copyBrief = async () => {
        syncTextState();
        refreshDerivedSurfaces();
        try {
            await copyText(briefOutput.value);
            setTransientStatus('session brief copied');
            copyBriefButton.textContent = '~ copied';
            window.setTimeout(() => {
                copyBriefButton.textContent = '~ copy brief';
            }, 1800);
            emitSpwAction('~local_gameplay.copy_brief', 'copied generated session brief');
        } catch {
            setTransientStatus('copy failed; select the table brief manually');
        }
    };
    copyBriefButton.addEventListener('click', () => {
        void copyBrief();
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
        const exportState = await collectExportState(state);
        downloadText('rpg-wednesday-local-state.json', JSON.stringify(exportState, null, 2));
        setTransientStatus('exported local gameplay state');
    });

    importInput.addEventListener('change', async () => {
        const file = importInput.files?.[0];
        if (!file) return;
        const parsed = safeJsonParse(await file.text());
        if (!parsed || typeof parsed !== 'object') {
            setTransientStatus('import failed: expected a JSON object');
            importInput.value = '';
            return;
        }

        await clearStateAssetImages(state);
        const next = normalizeState(parsed);
        await persistImportedAssetImages(parsed, next);
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
        assetAtlas.resetComposer();
        await assetAtlas.render();
        importInput.value = '';
        setTransientStatus('imported local gameplay state');
    });

    clearButton.addEventListener('click', async () => {
        const confirmed = window.confirm('Clear RPG Wednesday local gameplay state from this browser? Export first if you want a backup.');
        if (!confirmed) return;

        await clearStateAssetImages(state);
        storage.clear();
        state = cloneDefaultState();
        sceneInput.value = '';
        objectiveInput.value = '';
        partyInput.value = '';
        notesInput.value = '';
        characterBeatInput.value = '';
        canonCandidatesInput.value = '';
        seedsInput.value = '';
        renderInitiative();
        renderClocks();
        assetAtlas.resetComposer();
        await assetAtlas.render();
        refreshDerivedSurfaces();
        setTransientStatus('local gameplay state cleared');
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
        shortcutGroups,
        dashboard,
        createElement('div', { className: 'rpg-gameplay-grid' }, [
            scenePanel,
            initiativePanel,
            clocksPanel,
            assetAtlas.panel,
            notesPanel,
            briefPanel
        ]),
        controls,
        status
    );

    const shortcutManager = createShortcutManager({
        scope: document,
        focusMap: {
            scene: () => sceneInput.focus(),
            initiative: () => {
                const actorInput = initiativeList.querySelector('[data-rpg-field="actor-name"]');
                if (actorInput instanceof HTMLElement) {
                    actorInput.focus();
                    return;
                }
                addActorButton.focus();
            },
            clocks: () => {
                const clockInput = clocksList.querySelector('[data-rpg-field="clock-name"]');
                if (clockInput instanceof HTMLElement) {
                    clockInput.focus();
                    return;
                }
                addClockButton.focus();
            },
            assets: () => assetAtlas.focusComposer(),
            notes: () => notesInput.focus(),
            brief: () => briefOutput.focus()
        },
        actions: {
            addActor,
            addClock,
            nextTurn,
            copyBrief: () => { void copyBrief(); },
            cancelAssetEdit: () => assetAtlas.cancelEdit()
        },
        onStatus: setTransientStatus
    });

    renderInitiative();
    renderClocks();
    void assetAtlas.render();
    refreshDerivedSurfaces();

    controllers.push({
        destroy: () => shortcutManager.destroy()
    });

    return {
        destroy: () => {
            controllers.forEach((controller) => controller.destroy?.());
        }
    };
};
