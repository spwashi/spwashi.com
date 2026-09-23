const LOCAL_NOTE_KEY = 'spwashi:local-notes:v1';
const LOCAL_NOTE_LIMIT = 32;

const safeParse = (value) => {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const makeId = () => {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const cleanLine = (value = '') => String(value).trim().replace(/\s+/g, ' ');

const previewText = (value = '', maxLength = 96) => {
    const normalized = cleanLine(value);
    if (!normalized) return 'No local note yet.';
    return normalized.length > maxLength
        ? `${normalized.slice(0, maxLength - 1)}...`
        : normalized;
};

const normalizeNote = (value = {}) => {
    const createdAt = typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString();

    return {
        id: typeof value.id === 'string' ? value.id : makeId(),
        text: typeof value.text === 'string' ? value.text : '',
        context: typeof value.context === 'string' ? value.context : '',
        origin: typeof value.origin === 'string' ? value.origin : '',
        route: typeof value.route === 'string' ? value.route : '',
        // A note can reference a region: the section it was written in and
        // that section's Spw expression, so a note is also a citation.
        anchor: typeof value.anchor === 'string' ? value.anchor : '',
        expression: typeof value.expression === 'string' ? value.expression : '',
        createdAt
    };
};

/* The region a note refers to. The section handle already tracks the
   current section as it scrolls; a note written from the footer takes that
   section, its Spw expression, and the dimensions authored on it, so a
   later reader can revisit the exact frame rather than the page. */
const readRegionReference = () => {
    const handleLink = [...document.querySelectorAll('.spw-section-handle-shell a[href^="#"], .spw-section-handle[href^="#"]')]
        .map((link) => link.getAttribute('href') || '')
        .find((href) => href && href !== '#main-content' && document.getElementById(href.slice(1)));
    let section = handleLink ? document.getElementById(handleLink.slice(1)) : null;
    if (!(section instanceof HTMLElement)) {
        const midpoint = window.innerHeight / 2;
        section = [...document.querySelectorAll('main section[id]')].find((candidate) => {
            const rect = candidate.getBoundingClientRect();
            return rect.top <= midpoint && rect.bottom >= midpoint;
        }) || null;
    }
    if (!(section instanceof HTMLElement) || !section.id) return { anchor: '', expression: '' };
    const dims = ['spwRegion', 'spwForm', 'spwPhase', 'spwLiminality', 'spwFixity']
        .map((key) => section.dataset[key] ? `${key.replace(/^spw/, '').toLowerCase()}:${section.dataset[key]}` : '')
        .filter(Boolean)
        .join(' ');
    return {
        anchor: `#${section.id}`,
        expression: cleanLine(section.dataset.spwSemanticExpression || section.dataset.spwDefinition || dims)
    };
};

const readNotes = () => {
    try {
        const raw = localStorage.getItem(LOCAL_NOTE_KEY);
        const parsed = safeParse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(normalizeNote)
            .filter((note) => cleanLine(note.text))
            .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    } catch {
        return [];
    }
};

const writeNotes = (notes) => {
    try {
        localStorage.setItem(LOCAL_NOTE_KEY, JSON.stringify(notes.slice(0, LOCAL_NOTE_LIMIT)));
    } catch {
        /* non-fatal */
    }
};

const formatTimestamp = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'saved locally';

    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

const createElement = (tagName, options = {}, children = []) => {
    const node = document.createElement(tagName);
    const {
        className,
        text,
        html,
        attrs = {}
    } = options;

    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    if (html !== undefined) node.innerHTML = html;

    Object.entries(attrs).forEach(([name, value]) => {
        if (value === undefined || value === null || value === false) return;
        if (value === true) {
            node.setAttribute(name, '');
            return;
        }
        node.setAttribute(name, String(value));
    });

    children.forEach((child) => {
        if (!child) return;
        node.appendChild(child);
    });

    return node;
};

const renderPreview = (notes) => {
    const latest = notes[0] || null;

    document.querySelectorAll('[data-local-note-count]').forEach((node) => {
        node.textContent = String(notes.length);
    });

    document.querySelectorAll('[data-local-note-preview]').forEach((node) => {
        node.textContent = latest ? previewText(latest.text, 72) : 'No local note yet.';
    });

    document.querySelectorAll('[data-local-note-latest-time]').forEach((node) => {
        node.textContent = latest ? formatTimestamp(latest.createdAt) : '';
    });

    document.querySelectorAll('.site-footer__note-preview').forEach((node) => {
        node.hidden = !latest;
    });
};

const renderNoteRegister = (root, notes) => {
    if (!(root instanceof HTMLElement)) return;

    const list = root.querySelector('[data-local-notes-list]');
    const empty = root.querySelector('[data-local-notes-empty]');

    if (!(list instanceof HTMLElement)) return;

    if (!notes.length) {
        list.replaceChildren();
        if (empty instanceof HTMLElement) empty.hidden = false;
        return;
    }

    if (empty instanceof HTMLElement) empty.hidden = true;

    list.replaceChildren(...notes.map((note) => createElement('article', {
        className: 'local-note-card'
    }, [
        createElement('div', { className: 'local-note-card__meta' }, [
            createElement('span', {
                className: 'local-note-card__context',
                text: cleanLine(note.anchor ? `${note.route || ''}${note.anchor}` : (note.context || note.origin || note.route || 'local note'))
            }),
            ...(note.expression ? [createElement('code', {
                className: 'local-note-card__expression',
                text: note.expression,
                attrs: { 'data-spw-semantic-expression': note.expression }
            })] : []),
            createElement('time', {
                className: 'local-note-card__time',
                text: formatTimestamp(note.createdAt),
                attrs: { datetime: note.createdAt }
            })
        ]),
        createElement('p', {
            className: 'local-note-card__text',
            text: note.text.trim()
        }),
        createElement('div', { className: 'local-note-card__actions' }, [
            createElement('button', {
                className: 'spw-chip',
                text: '~ revisit',
                attrs: {
                    type: 'button',
                    'data-local-note-revisit': note.id
                }
            }),
            createElement('button', {
                className: 'spw-chip',
                text: '! clear',
                attrs: {
                    type: 'button',
                    'data-local-note-delete': note.id
                }
            })
        ])
    ])));
};

const syncAllLocalNotes = (notes) => {
    renderPreview(notes);
    document.querySelectorAll('[data-spw-local-notes-root]').forEach((root) => {
        renderNoteRegister(root, notes);
    });
};

const saveLocalNote = (payload, notes) => {
    const text = String(payload.text || '').trim();
    if (!text) return notes;

    const next = [
        normalizeNote({
            id: makeId(),
            text,
            context: cleanLine(payload.context || ''),
            origin: cleanLine(payload.origin || ''),
            route: cleanLine(payload.route || window.location.pathname || ''),
            anchor: cleanLine(payload.anchor || ''),
            expression: cleanLine(payload.expression || '')
        }),
        ...notes
    ].slice(0, LOCAL_NOTE_LIMIT);

    writeNotes(next);
    return next;
};

const deleteLocalNote = (id, notes) => {
    const next = notes.filter((note) => note.id !== id);
    writeNotes(next);
    return next;
};

const clearAllLocalNotes = () => {
    try {
        localStorage.removeItem(LOCAL_NOTE_KEY);
    } catch {
        /* non-fatal */
    }
    return [];
};

export const initSpwLocalNotes = () => {
    let notes = readNotes();
    const cleanups = [];

    const bindEntry = (form) => {
        if (!(form instanceof HTMLElement)) return;

        const input = form.querySelector('[data-local-note-input]');
        const clearDraftButton = form.querySelector('[data-local-note-draft-clear]');
        const status = form.querySelector('[data-local-note-status]');

        if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) return;

        const setStatus = (message = '', type = 'info') => {
            if (!(status instanceof HTMLElement)) return;
            status.textContent = message;
            status.dataset.status = type;
        };

        const submit = (event) => {
            event.preventDefault();
            const text = input.value.trim();
            if (!text) {
                setStatus('Write a note first.', 'info');
                input.focus();
                return;
            }

            const region = readRegionReference();
            notes = saveLocalNote({
                text,
                context: form.querySelector('[data-local-note-context]')?.value || '',
                origin: form.dataset.localNoteOrigin || '',
                route: window.location.pathname,
                anchor: region.anchor,
                expression: region.expression
            }, notes);

            input.value = '';
            syncAllLocalNotes(notes);
            setStatus(region.anchor ? `Saved locally, on ${region.anchor}.` : 'Saved locally.', 'success');
        };

        const clearDraft = () => {
            input.value = '';
            setStatus('', 'info');
            input.focus();
        };

        const handleKeydown = (event) => {
            if (!(input instanceof HTMLTextAreaElement)) return;
            if (event.key !== 'Enter') return;
            if (!(event.metaKey || event.ctrlKey)) return;
            submit(event);
        };

        form.addEventListener('submit', submit);
        clearDraftButton?.addEventListener('click', clearDraft);
        input.addEventListener('keydown', handleKeydown);

        cleanups.push(() => {
            form.removeEventListener('submit', submit);
            clearDraftButton?.removeEventListener('click', clearDraft);
            input.removeEventListener('keydown', handleKeydown);
        });
    };

    const bindRegister = (root) => {
        if (!(root instanceof HTMLElement)) return;

        const status = root.querySelector('[data-local-note-status]');

        const setStatus = (message = '', type = 'info') => {
            if (!(status instanceof HTMLElement)) return;
            status.textContent = message;
            status.dataset.status = type;
        };

        const click = (event) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target) return;

            const revisit = target.closest('[data-local-note-revisit]');
            if (revisit instanceof HTMLElement) {
                const note = notes.find((entry) => entry.id === revisit.dataset.localNoteRevisit);
                const draftTarget = root.querySelector('[data-local-note-draft-target], [data-local-note-input]');

                if (note && (draftTarget instanceof HTMLInputElement || draftTarget instanceof HTMLTextAreaElement)) {
                    draftTarget.value = note.text;
                    draftTarget.focus();
                    setStatus('Loaded note into draft.', 'info');
                }
                // A note that references a region on this route goes back to it.
                if (note?.anchor && (!note.route || note.route === window.location.pathname)) {
                    const target = document.getElementById(note.anchor.slice(1));
                    if (target instanceof HTMLElement) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setStatus(`Revisiting ${note.anchor}.`, 'info');
                    }
                }
                return;
            }

            const remove = target.closest('[data-local-note-delete]');
            if (remove instanceof HTMLElement) {
                notes = deleteLocalNote(remove.dataset.localNoteDelete, notes);
                syncAllLocalNotes(notes);
                setStatus('Cleared note.', 'success');
                return;
            }

            const clear = target.closest('[data-local-notes-clear]');
            if (clear instanceof HTMLElement) {
                notes = clearAllLocalNotes();
                syncAllLocalNotes(notes);
                setStatus('Cleared all local notes.', 'success');
            }
        };

        root.addEventListener('click', click);
        cleanups.push(() => root.removeEventListener('click', click));
    };

    document.querySelectorAll('[data-spw-local-note-entry]').forEach(bindEntry);
    document.querySelectorAll('[data-spw-local-notes-root]').forEach(bindRegister);

    const handleStorage = (event) => {
        if (event.key !== LOCAL_NOTE_KEY) return;
        notes = readNotes();
        syncAllLocalNotes(notes);
    };

    window.addEventListener('storage', handleStorage);
    cleanups.push(() => window.removeEventListener('storage', handleStorage));

    syncAllLocalNotes(notes);

    return {
        cleanup() {
            cleanups.forEach((fn) => fn());
        },
        refresh() {
            notes = readNotes();
            syncAllLocalNotes(notes);
        }
    };
};
