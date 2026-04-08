let initialized = false;

// ─── Ring buffer for action history ──────────────────────────────────────────

const HISTORY_SIZE = 5;

const makeRingBuffer = (size) => {
    const buf = [];
    return {
        push(item) {
            buf.unshift(item);
            if (buf.length > size) buf.pop();
        },
        all() { return [...buf]; }
    };
};

// ─── DOM construction ─────────────────────────────────────────────────────────

const el = (tag, className, attrs = {}) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
};

const createConsole = () => {
    const root = el('aside', 'spw-console', { 'aria-label': 'Spw textual interface' });

    // ── Collapsed bar (always visible, clicking expands) ──
    const collapsedBar = el('div', 'spw-console-collapsed-bar');

    const collapsedToken = el('span', 'frame-sigil spw-console-action-token');
    collapsedToken.textContent = '>surface.ready';

    const expandBtn = el('button', 'spw-console-expand-btn', { 'aria-label': 'Expand Spw console', type: 'button' });
    expandBtn.textContent = '▲';
    collapsedBar.append(collapsedToken, expandBtn);

    // ── Expanded body ──
    const body = el('div', 'spw-console-body');

    // Header row: title + collapse button
    const headerLine = el('div', 'spw-console-line spw-console-header-line');
    const titleToken = el('span', 'frame-sigil');
    titleToken.textContent = '>surface_state';
    const titleCopy = el('span', 'spw-console-copy');
    titleCopy.textContent = 'textual interface';
    const collapseBtn = el('button', 'spw-console-collapse-btn', { 'aria-label': 'Collapse Spw console', type: 'button' });
    collapseBtn.textContent = '▼';
    headerLine.append(titleToken, titleCopy, collapseBtn);

    // Frame row
    const frameLine = el('div', 'spw-console-line');
    const frameLink = el('a', 'frame-sigil spw-console-frame-link');
    frameLink.href = '#';
    frameLink.textContent = '#>frame';
    const frameLabel = el('span', 'spw-console-copy spw-console-frame-label');
    frameLine.append(frameLink, frameLabel);

    // Mode row
    const modeLine = el('div', 'spw-console-line spw-console-mode-line');
    const modeToken = el('span', 'frame-sigil');
    modeToken.textContent = '.modes';
    const modeButtons = el('div', 'spw-console-mode-buttons');
    modeLine.append(modeToken, modeButtons);

    // Current action row
    const actionLine = el('div', 'spw-console-line');
    const actionToken = el('span', 'frame-sigil spw-console-action-token');
    actionToken.textContent = '>surface.ready';
    const actionCopy = el('span', 'spw-console-copy');
    actionCopy.textContent = 'waiting for active frame';
    actionLine.append(actionToken, actionCopy);

    // History rows
    const historyList = el('ol', 'spw-console-history', { 'aria-label': 'Recent actions' });

    // Spell footer
    const spellsLine = el('div', 'spw-console-line spw-console-spells');
    spellsLine.innerHTML =
        '<span class="spw-spell">g</span> map' +
        '<span class="spw-spell">/</span> probe' +
        '<span class="spw-spell">[ ]</span> traverse';

    body.append(headerLine, frameLine, modeLine, actionLine, historyList, spellsLine);
    root.append(collapsedBar, body);

    return {
        actionCopy,
        actionToken,
        body,
        collapseBtn,
        collapsedBar,
        collapsedToken,
        expandBtn,
        frameLabel,
        frameLink,
        historyList,
        modeButtons,
        root
    };
};

// ─── History rendering ────────────────────────────────────────────────────────

const renderHistory = (nodes, history) => {
    nodes.historyList.replaceChildren();
    const entries = history.all();
    if (!entries.length) return;

    entries.forEach(([token, copy], i) => {
        const item = el('li', 'spw-console-history-item');
        item.style.setProperty('--history-age', String(i));

        const tok = el('span', 'spw-console-history-token');
        tok.textContent = token;

        const desc = el('span', 'spw-console-history-copy');
        desc.textContent = copy;

        item.append(tok, desc);
        nodes.historyList.appendChild(item);
    });
};

// ─── State setters ────────────────────────────────────────────────────────────

const setAction = (nodes, history, token, copy) => {
    history.push([token, copy]);
    nodes.actionToken.textContent = token;
    nodes.actionCopy.textContent = copy;
    nodes.collapsedToken.textContent = token;
    renderHistory(nodes, history);
};

const updateFrame = (nodes, detail) => {
    nodes.frameLink.textContent = detail.sigilText;
    nodes.frameLink.href = detail.id ? `#${detail.id}` : '#';
    nodes.frameLabel.textContent = detail.headingText;
};

const renderModes = (nodes, frame, api) => {
    nodes.modeButtons.replaceChildren();

    if (!frame) return;

    const buttons = Array.from(
        frame.querySelectorAll('.mode-switch [data-set-mode][data-mode-group]')
    );

    if (!buttons.length) {
        const empty = el('span', 'spw-console-empty');
        empty.textContent = '~ no inline modes';
        nodes.modeButtons.appendChild(empty);
        return;
    }

    buttons.forEach((sourceButton) => {
        const button = el('button', 'frame-sigil spw-console-token', { type: 'button' });
        button.textContent = sourceButton.textContent.trim();
        button.dataset.modeGroup = sourceButton.dataset.modeGroup || '';
        button.dataset.setMode = sourceButton.dataset.setMode || '';

        const pressed = sourceButton.getAttribute('aria-pressed') === 'true';
        button.classList.toggle('is-selected', pressed);
        button.setAttribute('aria-pressed', pressed ? 'true' : 'false');

        if (sourceButton.dataset.spwOperator) {
            button.dataset.spwOperator = sourceButton.dataset.spwOperator;
        }

        button.addEventListener('click', () => {
            api.setGroupMode(button.dataset.modeGroup, button.dataset.setMode, {
                source: 'console', force: true
            });
            api.activateFrame(frame, { source: 'console' });
        });

        nodes.modeButtons.appendChild(button);
    });
};

// ─── Describe helpers (unchanged logic) ──────────────────────────────────────

const describeFrameAction = (detail) => {
    switch (detail.source) {
    case 'viewport':   return ['@viewport.activate',  detail.headingText];
    case 'anchor':     return ['@anchor.jump',         detail.headingText];
    case 'hover':      return ['@hover.focus',         detail.headingText];
    case 'focus':      return ['@focus.activate',      detail.headingText];
    case 'hash':       return ['~hash.resolve',        detail.headingText];
    case 'navigator':  return ['@navigator.select',    detail.headingText];
    case 'console':    return ['@console.project',     detail.headingText];
    default:           return ['@frame.activate',      detail.headingText];
    }
};

const describeModeAction = (detail) => {
    const suffix = detail.label ? `${detail.groupName} -> ${detail.label}` : detail.groupName;
    switch (detail.source) {
    case 'console':       return ['@console.project',  suffix];
    case 'keyboard-mode': return ['@keyboard.cycle',   suffix];
    case 'init':          return ['>surface.ready',    detail.frameMeta.headingText];
    default:              return ['@mode.project',     suffix];
    }
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const initSpwConsole = () => {
    if (initialized) return;

    const api = window.spwInterface;
    if (!api) return;
    initialized = true;

    const history = makeRingBuffer(HISTORY_SIZE);
    const nodes = createConsole();
    document.body.appendChild(nodes.root);
    const IDLE_DELAY = 2600;
    let idleTimer = 0;

    const scheduleIdle = () => {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => {
            if (nodes.root.matches(':hover') || nodes.root.matches(':focus-within')) return;
            nodes.root.classList.add('is-idle');
        }, IDLE_DELAY);
    };

    const wake = () => {
        nodes.root.classList.remove('is-idle');
        scheduleIdle();
    };

    // ── Collapse / expand ──
    const STORAGE_KEY = 'spw-console-collapsed';
    let collapsed = localStorage.getItem(STORAGE_KEY) === 'true';

    const applyCollapsed = (value, animate = false) => {
        collapsed = value;
        localStorage.setItem(STORAGE_KEY, String(value));
        nodes.root.classList.toggle('is-collapsed', value);
        if (animate) nodes.root.classList.add('is-animating');
        nodes.expandBtn.setAttribute('aria-label', value ? 'Expand Spw console' : 'Collapse Spw console');
        nodes.expandBtn.textContent = value ? '▲' : '▲';
        nodes.collapseBtn.textContent = value ? '▲' : '▼';
        wake();
    };

    nodes.collapseBtn.addEventListener('click', () => applyCollapsed(true, true));
    nodes.expandBtn.addEventListener('click',   () => applyCollapsed(false, true));

    nodes.root.addEventListener('animationend', () => nodes.root.classList.remove('is-animating'));
    nodes.root.addEventListener('transitionend', () => nodes.root.classList.remove('is-animating'));
    nodes.root.addEventListener('pointerenter', () => nodes.root.classList.remove('is-idle'));
    nodes.root.addEventListener('pointerleave', scheduleIdle);
    nodes.root.addEventListener('focusin', () => nodes.root.classList.remove('is-idle'));
    nodes.root.addEventListener('focusout', () => {
        requestAnimationFrame(() => {
            if (!nodes.root.matches(':focus-within')) scheduleIdle();
        });
    });

    applyCollapsed(collapsed);

    // ── Initial state ──
    const sync = (detail) => {
        const frame  = detail?.frame || api.getActiveFrame();
        const meta   = detail || (frame ? api.getFrameMeta(frame) : null);
        if (meta) updateFrame(nodes, meta);
        renderModes(nodes, frame, api);
    };

    const initial = api.getActiveFrame();
    sync(initial ? api.getFrameMeta(initial) : null);
    wake();

    // ── Event subscriptions ──
    document.addEventListener('spw:frame-change', (event) => {
        sync(event.detail);
        setAction(nodes, history, ...describeFrameAction(event.detail));
        wake();
    });

    document.addEventListener('spw:mode-change', (event) => {
        const frameMeta = event.detail.frameMeta
            ? { ...event.detail.frameMeta, frame: event.detail.frame }
            : null;
        sync(frameMeta);
        setAction(nodes, history, ...describeModeAction(event.detail));
        wake();
    });

    document.addEventListener('spw:action', (event) => {
        const detail = event.detail || {};
        if (!detail.token || !detail.description) return;
        setAction(nodes, history, detail.token, detail.description);
        wake();
    });
};

export { initSpwConsole };
