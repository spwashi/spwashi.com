import { emitSpwAction } from './spw-shared.js';

const STORAGE_KEY = 'spwashi:rpg-wednesday:v1';

const DEFAULT_STATE = {
    scene: '',
    objective: '',
    party: '',
    initiative: [],
    activeInitiativeId: null,
    clocks: [],
    notes: '',
    seeds: '',
    updatedAt: ''
};

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

const normalizeState = (value) => {
    const input = value && typeof value === 'object' ? value : {};
    const state = {
        ...cloneDefaultState(),
        scene: typeof input.scene === 'string' ? input.scene : '',
        objective: typeof input.objective === 'string' ? input.objective : '',
        party: typeof input.party === 'string' ? input.party : '',
        notes: typeof input.notes === 'string' ? input.notes : '',
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

    if (cleanLine(state.seeds)) {
        lines.push('', 'Session seeds:', state.seeds.trim());
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
    if (!/^\/play\/rpg-wednesday(?:\/|$)/.test(window.location.pathname)) return null;
    const section = document.querySelector('[data-rpg-gameplay-kit]');
    if (!section || section.dataset.rpgHydrated === 'true') return null;

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

    const { field: seedsField, input: seedsInput } = createField({
        id: 'rpg-seeds',
        label: 'Session log seeds',
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
        turn: createDashboardStat('Turn'),
        pressure: createDashboardStat('Pressure')
    };
    let briefOutput = null;

    const refreshDerivedSurfaces = () => {
        const activeActor = getActiveActor(state);
        const pressureClock = getPressureClock(state);

        dashboardValues.scene.textContent = previewText(state.scene);
        dashboardValues.objective.textContent = previewText(state.objective);
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
        state.seeds = seedsInput.value;
    };

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
    [sceneInput, objectiveInput, partyInput, notesInput, seedsInput].forEach((input) => {
        input.addEventListener('input', () => {
            syncTextState();
            debouncedTextSave();
        });
    });

    const initiativePanel = createElement('div', { className: 'frame-panel rpg-gameplay-panel' }, [
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

    const clocksPanel = createElement('div', { className: 'frame-panel rpg-gameplay-panel' }, [
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
        className: 'frame-panel rpg-gameplay-panel rpg-gameplay-panel--brief'
    }, [
        createElement('h3', { text: 'Table Brief' }),
        createElement('p', {
            className: 'frame-note',
            text: 'A copyable play-state summary for session recaps or player handoffs. Private scratch notes stay out of this generated text.'
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

    exportButton.addEventListener('click', () => {
        syncTextState();
        save('exported local gameplay state');
        downloadText('rpg-wednesday-local-state.json', JSON.stringify(state, null, 2));
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
        const next = normalizeState(parsed);
        state = next;
        sceneInput.value = state.scene;
        objectiveInput.value = state.objective;
        partyInput.value = state.party;
        notesInput.value = state.notes;
        seedsInput.value = state.seeds;
        save('imported local gameplay state');
        renderInitiative();
        renderClocks();
        importInput.value = '';
    });

    clearButton.addEventListener('click', () => {
        const confirmed = window.confirm('Clear RPG Wednesday local gameplay state from this browser? Export first if you want a backup.');
        if (!confirmed) return;
        storage.clear();
        state = cloneDefaultState();
        sceneInput.value = '';
        objectiveInput.value = '';
        partyInput.value = '';
        notesInput.value = '';
        seedsInput.value = '';
        status.textContent = 'local gameplay state cleared';
        renderInitiative();
        renderClocks();
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
        dashboard,
        createElement('div', { className: 'rpg-gameplay-grid' }, [
            createElement('div', { className: 'frame-panel rpg-gameplay-panel' }, [
                createElement('h3', { text: 'Scene Register' }),
                sceneField,
                objectiveField,
                partyField
            ]),
            initiativePanel,
            clocksPanel,
            createElement('div', { className: 'frame-panel rpg-gameplay-panel' }, [
                createElement('h3', { text: 'Private Notes' }),
                notesField,
                seedsField
            ]),
            briefPanel
        ]),
        controls,
        status
    );

    renderInitiative();
    renderClocks();
    refreshDerivedSurfaces();

    return { storageKey: STORAGE_KEY };
};
