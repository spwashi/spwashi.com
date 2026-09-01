import {
    getFrameMeta,
    getPageSurface,
    matchesMaxWidth
} from '/public/js/kernel/shared.js';
import { bus } from '/public/js/kernel/bus.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { writeLensModeState } from '/public/js/runtime/lens-modes.js';

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

const normalizeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const formatHistoryMeta = (meta = {}) => {
    const bits = [
        meta.source,
        meta.frame,
        meta.surface,
        meta.scope,
    ].map(normalizeText).filter(Boolean);

    return bits.length ? bits.join(' · ') : '';
};

const getBusDiagnostics = () => {
    try {
        return bus.getDiagnostics?.() || null;
    } catch {
        return null;
    }
};

const getActiveFrame = () =>
    document.querySelector('.site-frame[data-state~="active"], .site-frame[data-spw-active="true"]')
    || document.querySelector('.site-frame');

const createConsoleInterface = () => ({
    getActiveFrame,
    getFrameMeta,
    activateFrame(frame, options = {}) {
        if (!(frame instanceof HTMLElement)) return;
        document.querySelectorAll('.site-frame').forEach((candidate) => {
            const active = candidate === frame;
            candidate.dataset.spwActive = active ? 'true' : 'false';
            if (active) candidate.dataset.state = 'active';
            else delete candidate.dataset.state;
        });

        document.dispatchEvent(new CustomEvent('spw:frame-change', {
            detail: {
                ...getFrameMeta(frame),
                frame,
                source: options.source || 'console',
            },
        }));
    },
    setGroupMode(group, mode, options = {}) {
        if (!group || !mode) return;
        const buttons = [...document.querySelectorAll(`[data-mode-group="${CSS.escape(group)}"][data-set-mode]`)];
        const detail = writeLensModeState({
            group,
            mode,
            buttons,
            source: options.source || 'console',
            setTransientState: (element) => {
                element.dataset.spwLensState = 'changed';
            },
        });
        if (detail) {
            bus.emit('frame:mode', {
                ...detail,
                frameMeta: getFrameMeta(getActiveFrame()),
            });
        }
    },
});

const describeConsoleDiagnostics = (frame, detail = {}) => {
    const frameMeta = detail?.frameMeta || (frame ? detail : null) || null;
    const surface = getPageSurface() || 'surface';
    const frameLabel = normalizeText(frameMeta?.headingText || frameMeta?.sigilText || frameMeta?.id || 'no active frame');
    const modeLabel = normalizeText(
        frameMeta?.modeLabel
        || frameMeta?.mode
        || frame?.dataset?.state
        || 'no inline mode'
    );
    const busDiagnostics = getBusDiagnostics();
    const latest = busDiagnostics?.latest;
    const latestLabel = latest?.eventName
        ? `${latest.eventName}${latest.source ? ` (${latest.source})` : ''}`
        : 'no recent bus event';
    const historyLabel = busDiagnostics
        ? `${busDiagnostics.historySize}/${busDiagnostics.historyLimit}`
        : 'unavailable';
    const layoutShiftState = document.documentElement.dataset.spwLayoutShiftState || '';
    const layoutShiftCount = document.documentElement.dataset.spwLayoutShiftCount || '';
    const layoutShiftTotal = document.documentElement.dataset.spwLayoutShiftTotal || '';
    const layoutShiftLabel = layoutShiftState
        ? `${layoutShiftState}${layoutShiftCount ? ` · ${layoutShiftCount}` : ''}${layoutShiftTotal ? ` · ${layoutShiftTotal}` : ''}`
        : '';

    return [
        `surface ${surface}`,
        `frame ${frameLabel}`,
        `mode ${modeLabel}`,
        `bus ${historyLabel}`,
        `latest ${latestLabel}`,
        layoutShiftLabel ? `layout ${layoutShiftLabel}` : '',
    ].filter(Boolean).join(' · ');
};

const describeFrameSelection = (detail = {}, frame = null) => {
    const frameMeta = detail?.frameMeta || detail || {};
    const heading = normalizeText(frameMeta.headingText || frameMeta.sigilText || frameMeta.id || 'unknown frame');
    const source = normalizeText(detail.source || 'frame');
    const surface = normalizeText(getPageSurface() || 'surface');
    const mode = normalizeText(frame?.dataset?.state || frameMeta.mode || 'idle');

    return {
        source,
        frame: heading,
        surface,
        scope: mode,
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
    annotateFloatingChromeElement(root, {
        role: 'console',
        tier: 'priority',
        mutator: 'console',
        reason: 'runtime-console',
        stylingAxis: 'console-chrome',
    });
    // Initial material resonance (sync later with settings like satchel).
    const initMat = document.documentElement.dataset.spwBaseMetamaterial || 'glass';
    root.dataset.spwMetamaterial = initMat;

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

    const diagnosticsLine = el('div', 'spw-console-line spw-console-diagnostics-line');
    const diagnosticsToken = el('span', 'frame-sigil spw-console-diagnostics-token');
    diagnosticsToken.textContent = '?debug';
    const diagnosticsCopy = el('span', 'spw-console-copy spw-console-diagnostics-copy');
    diagnosticsCopy.textContent = 'bus unavailable';
    diagnosticsLine.append(diagnosticsToken, diagnosticsCopy);

    // History rows
    const historyList = el('ol', 'spw-console-history', { 'aria-label': 'Recent actions' });

    // Spell footer
    const spellsLine = el('div', 'spw-console-line spw-console-spells');
    spellsLine.innerHTML =
        '<span class="spw-spell">g</span> map' +
        '<span class="spw-spell">/</span> probe' +
        '<span class="spw-spell">[ ]</span> traverse' +
        '<a class="spw-runtime-settings-link" href="/settings/">settings</a>';

    body.append(headerLine, frameLine, modeLine, diagnosticsLine, actionLine, historyList, spellsLine);
    root.append(collapsedBar, body);

    return {
      actionCopy,
      actionToken,
      body,
      collapseBtn,
      collapsedBar,
      collapsedToken,
      expandBtn,
      diagnosticsCopy,
      diagnosticsToken,
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

    entries.forEach((entry, i) => {
        const item = el('li', 'spw-console-history-item');
        item.style.setProperty('--history-age', String(i));
        item.dataset.spwConsoleToken = entry.token;
        if (entry.meta?.source) item.dataset.spwConsoleSource = entry.meta.source;
        if (entry.meta?.eventName) item.dataset.spwConsoleEvent = entry.meta.eventName;
        if (entry.meta?.surface) item.dataset.spwConsoleSurface = entry.meta.surface;
        item.title = formatHistoryMeta(entry.meta) || entry.copy;

        const tok = el('span', 'spw-console-history-token');
        tok.textContent = entry.token;

        const desc = el('span', 'spw-console-history-copy');
        desc.textContent = entry.copy;

        const meta = formatHistoryMeta(entry.meta);
        if (meta) {
            const info = el('span', 'spw-console-history-meta');
            info.textContent = meta;
            item.append(tok, desc, info);
        } else {
            item.append(tok, desc);
        }

        nodes.historyList.appendChild(item);
    });
};

// ─── State setters ────────────────────────────────────────────────────────────

const setAction = (nodes, history, token, copy, meta = {}) => {
    history.push({
        token,
        copy,
        meta: {
            ...meta,
            surface: meta.surface || getPageSurface() || 'surface',
        },
        ts: Date.now(),
    });
    nodes.actionToken.textContent = token;
    nodes.actionCopy.textContent = copy;
    nodes.collapsedToken.textContent = token;
    renderHistory(nodes, history);
};

const updateFrame = (nodes, detail) => {
    nodes.frameLink.textContent = detail.sigilText;
    nodes.frameLink.href = detail.id ? `#${detail.id}` : '#';
    nodes.frameLabel.textContent = detail.headingText;
    nodes.frameLink.title = detail.headingText || detail.id || 'active frame';
    nodes.frameLabel.title = detail.description || detail.context || detail.headingText || 'active frame';
};

const updateDiagnostics = (nodes, frame, detail = {}) => {
    const summary = describeConsoleDiagnostics(frame, detail);
    nodes.diagnosticsToken.textContent = '?debug';
    nodes.diagnosticsCopy.textContent = summary;
    nodes.diagnosticsCopy.title = summary;
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
        const button = el('button', 'operator-chip spw-console-mode-btn', { type: 'button' });
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
    const groupName = detail.groupName || detail.group || 'mode';
    const label = detail.label || detail.mode || detail.setMode || '';
    const suffix = label ? `${groupName} -> ${label}` : groupName;
    switch (detail.source) {
    case 'console':       return ['@console.project',  suffix];
    case 'keyboard-mode': return ['@keyboard.cycle',   suffix];
    case 'init':          return ['>surface.ready',    detail.frameMeta?.headingText || suffix];
    default:              return ['@mode.project',     suffix];
    }
};

const describeDevelopmentAction = (detail = {}) => {
    const phase = detail.phase || detail.climate || 'orient';
    const label = detail.authorLabel || detail.label || phase;
    return ['~climate.shift', `${phase}: ${label}`];
};

const describeSemanticSnapshot = (detail = {}) => {
    const count = detail.count || detail.snapshots?.length || 0;
    const field = detail.field || {};
    const roles = field.roles?.slice(0, 3).join(', ') || 'roles';
    const instrumentation = field.instrumentation?.slice(0, 3).join(', ') || 'no extra instrumentation';
    return ['^semantic.field', `${count} components; ${roles}; ${instrumentation}`];
};

const describeRuntimeRefresh = (detail = {}) => {
    const route = detail.route || getPageSurface() || 'surface';
    return ['@runtime.refresh', `${route} regions and component projections resynced`];
};

const DEFAULT_LAYOUT_SHIFT_DEFAULTS = Object.freeze(['normal flow', 'intrinsic sizing', 'auto layout']);

const readDiagnosticsLevel = () => (
    document.documentElement.dataset.spwBusDiagnostics
    || document.body?.dataset?.spwBusDiagnostics
    || getSiteSettings().busDiagnostics
    || 'off'
);

const formatLayoutShiftValue = (value = 0) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0';
    const digits = numeric < 0.01 ? 4 : 3;
    return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

const readLayoutShiftAudit = () => {
    const { dataset } = document.documentElement;
    const state = dataset.spwLayoutShiftState || '';
    if (!state) return null;

    const count = Number(dataset.spwLayoutShiftCount || 0);
    const totalValue = Number(dataset.spwLayoutShiftTotal || 0);
    const lastValue = Number(dataset.spwLayoutShiftLast || 0);
    const recentInputCount = Number(dataset.spwLayoutShiftRecentInputCount || 0);
    const outcome = dataset.spwLayoutShiftOutcome || 'stable';

    if (
        state === 'observing'
        && !count
        && !recentInputCount
        && !totalValue
        && !lastValue
    ) {
        return null;
    }

    return {
        state,
        count,
        totalValue,
        lastValue,
        recentInputCount,
        outcome,
        cssDefaults: [...DEFAULT_LAYOUT_SHIFT_DEFAULTS],
        nativeDefaults: [...DEFAULT_LAYOUT_SHIFT_DEFAULTS],
    };
};

const renderCollapseControls = (nodes, isCollapsed) => {
    const label = isCollapsed ? 'Expand Spw console' : 'Collapse Spw console';
    const openGlyph = isCollapsed ? '▼' : '▲';
    const closeGlyph = isCollapsed ? '▲' : '▼';

    nodes.expandBtn.setAttribute('aria-label', label);
    nodes.expandBtn.textContent = openGlyph;
    nodes.collapseBtn.textContent = closeGlyph;
};

const describeLayoutShiftAction = (detail = {}) => {
    if (detail.state === 'unsupported') {
        return [
            '!layout.audit',
            detail.error
                ? `layout stability observer unsupported: ${detail.error}`
                : 'layout stability observer unsupported',
        ];
    }

    if (
        detail.state === 'observing'
        && !detail.count
        && !detail.recentInputCount
        && !detail.totalValue
    ) {
        return ['!layout.audit', 'layout stability observer active'];
    }

    const batchValue = formatLayoutShiftValue(detail.batchValue ?? detail.value ?? 0);
    const totalValue = formatLayoutShiftValue(detail.totalValue ?? detail.total ?? 0);
    const metric = detail.metric || 'CLS';
    const counted = detail.count ?? detail.entries?.filter((entry) => !entry.hadRecentInput).length ?? 0;
    const ignored = detail.recentInputCount
        ?? detail.entries?.filter((entry) => entry.hadRecentInput).length
        ?? 0;
    const sources = detail.sourceCount ?? detail.sources?.length ?? 0;
    const outcome = detail.outcome || 'stable';
    const outcomeCopy = detail.outcomeSummary || outcome;
    const defaults = detail.nativeDefaults?.length
        ? detail.nativeDefaults.join(', ')
        : detail.cssDefaults?.length
            ? detail.cssDefaults.join(', ')
            : DEFAULT_LAYOUT_SHIFT_DEFAULTS.join(', ');
    const defaultsSuffix = detail.diagnosticsLevel === 'verbose' ? `; native defaults ${defaults}` : '';
    const suffix = ignored ? `, ${ignored} ignored` : '';
    const sourceSuffix = sources ? `; ${sources} source${sources === 1 ? '' : 's'}` : '';

    return [
        '!layout.shift',
        `${outcomeCopy}: ${batchValue} ${metric}; ${counted} counted${suffix}; total ${totalValue}${sourceSuffix}${defaultsSuffix}`,
    ];
};

const shouldNarrateDiagnostics = (level = 'basic') => {
    const current = readDiagnosticsLevel();
    if (current === 'verbose') return true;
    return level === 'basic' && current === 'basic';
};

const getDefaultCollapsedState = (storageKey, settings = getSiteSettings()) => {
    const params = new URLSearchParams(window.location.search);
    const diagnosticIntent = [
        params.get('diagnostics'),
        params.get('spw-diagnostics'),
        params.get('debug'),
        params.get('spw-debug'),
        params.get('log'),
        params.get('spw-log'),
    ].some((value = '') => /layout|diagnostic|debug|shift/i.test(String(value)));

    if (diagnosticIntent) return false;
    if (settings.consoleDisplay === 'expanded') return false;
    if (settings.consoleDisplay === 'collapsed' || settings.consoleDisplay === 'hidden') return true;

    let storedCollapsed = null;
    try {
        storedCollapsed = localStorage.getItem(storageKey);
    } catch {
        storedCollapsed = null;
    }

    const prefersCompactConsole = matchesMaxWidth(700);
    const forceCompactConsole = prefersCompactConsole && getPageSurface() === 'software';

    if (forceCompactConsole) return true;
    if (storedCollapsed === null) return prefersCompactConsole;
    return storedCollapsed === 'true';
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────

const initSpwConsole = () => {
    if (initialized && document.querySelector('.spw-console')) return;
    if (initialized) initialized = false;

    const api = window.spwInterface || createConsoleInterface();
    if (!window.spwInterface) window.spwInterface = api;
    initialized = true;

    const history = makeRingBuffer(HISTORY_SIZE);
    const nodes = createConsole();
    document.body.appendChild(nodes.root);
    // Ephemeral chrome + satchel resonance: sync material for glass/matte, participate in settings for configurable feedback/learnability (e.g. enhancement-level affects idle opacity, history verbosity, transient feedback richness).
    const syncConsoleMaterial = () => {
      const mat = document.documentElement.dataset.spwBaseMetamaterial || document.documentElement.dataset.spwMetamaterial || 'glass';
      nodes.root.dataset.spwMetamaterial = mat;
    };
    syncConsoleMaterial();
    const feedbackLevel = () => document.documentElement.dataset.spwEnhancementLevel || 'standard';
    // Example: richer feedback = less idle fade, more history shown.
    const applyFeedback = () => {
      const level = feedbackLevel();
      const idleOpacity = level === 'minimal' ? '0.92' : (level === 'rich' ? '0.6' : '0.76');
      nodes.root.style.setProperty('--console-idle-opacity', idleOpacity);
      if (level === 'rich') nodes.root.classList.add('feedback-rich');
      else nodes.root.classList.remove('feedback-rich');
    };
    applyFeedback();
    // Listen for settings changes (like satchel reapply).
    document.addEventListener('spw:settings:changed', () => { syncConsoleMaterial(); applyFeedback(); }, { passive: true });
    if (window.spwSettings && window.spwSettings.bus) {
      // if bus available
    }
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
    let collapsed = getDefaultCollapsedState(STORAGE_KEY);

    const applyCollapsed = (value, animate = false) => {
        collapsed = value;
        try {
            localStorage.setItem(STORAGE_KEY, String(value));
        } catch {
            // The console can still respond for the current page.
        }
        nodes.root.classList.toggle('is-collapsed', value);
        nodes.root.dataset.spwConsoleState = value ? 'collapsed' : 'expanded';
        if (animate) nodes.root.classList.add('is-animating');
        renderCollapseControls(nodes, value);
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
        const frame = detail?.frame || api.getActiveFrame();
        const meta = detail || (frame ? api.getFrameMeta(frame) : null);
        if (meta) updateFrame(nodes, meta);
        renderModes(nodes, frame, api);
        updateDiagnostics(nodes, frame, meta || {});
    };

    const refresh = () => {
        const frame = api.getActiveFrame();
        sync(frame ? api.getFrameMeta(frame) : null);
    };

    const initial = api.getActiveFrame();
    sync(initial ? api.getFrameMeta(initial) : null);
    if (shouldNarrateDiagnostics('basic')) {
        const layoutShiftAudit = readLayoutShiftAudit();
        if (layoutShiftAudit) {
            setAction(nodes, history, ...describeLayoutShiftAction(layoutShiftAudit), {
                source: 'layout-shift-audit',
                eventName: 'spw:layout-shift',
                frame: 'layout stability',
                scope: layoutShiftAudit.state,
            });
        }
    }
    wake();

    window.spwConsole = {
        collapse: () => applyCollapsed(true, true),
        expand: () => applyCollapsed(false, true),
        getDiagnostics: () => ({
            collapsed,
            surface: getPageSurface() || 'surface',
            frame: api.getFrameMeta(api.getActiveFrame?.() || initial || null),
            bus: getBusDiagnostics(),
            layoutShift: readLayoutShiftAudit(),
        }),
        getHistory: () => history.all().map((entry) => ({ ...entry })),
        refresh,
    };

    // ── Event subscriptions ──
    document.addEventListener('spw:frame-change', (event) => {
        sync(event.detail);
        setAction(nodes, history, ...describeFrameAction(event.detail), describeFrameSelection(event.detail, api.getActiveFrame()));
        wake();
    });

    document.addEventListener('spw:mode-change', (event) => {
        const frameMeta = event.detail.frameMeta
            ? { ...event.detail.frameMeta, frame: event.detail.frame }
            : null;
        sync(frameMeta);
        setAction(nodes, history, ...describeModeAction(event.detail), {
            source: event.detail?.source || 'mode-change',
            frame: normalizeText(event.detail?.frameMeta?.headingText || event.detail?.frameMeta?.sigilText || 'mode'),
            scope: event.detail?.groupName || 'mode',
        });
        wake();
    });

    document.addEventListener('spw:action', (event) => {
        const detail = event.detail || {};
        if (!detail.token || !detail.description) return;
        setAction(nodes, history, detail.token, detail.description, {
            source: detail.source || 'action',
            frame: detail.frame || detail.label || 'action',
            scope: detail.kind || detail.relation || 'gesture',
            eventName: detail.eventName || detail.name || 'spw:action',
        });
        wake();
    });

    document.addEventListener('spw:settings-change', (event) => {
        const display = event.detail?.consoleDisplay;
        if (display === 'expanded') applyCollapsed(false, true);
        if (display === 'collapsed' || display === 'hidden') applyCollapsed(true, true);
    });

    document.addEventListener('spw:development-shifted', (event) => {
        if (!shouldNarrateDiagnostics('basic')) return;
        setAction(nodes, history, ...describeDevelopmentAction(event.detail), {
            source: 'development-shift',
            frame: event.detail?.authorLabel || event.detail?.label || 'development',
            scope: event.detail?.phase || event.detail?.climate || 'climate',
            eventName: 'spw:development-shifted',
        });
        wake();
    });

    document.addEventListener('spw:semantic-snapshot', (event) => {
        if (!shouldNarrateDiagnostics('verbose')) return;
        setAction(nodes, history, ...describeSemanticSnapshot(event.detail), {
            source: 'semantic-snapshot',
            frame: event.detail?.field?.roles?.[0] || 'semantic field',
            scope: event.detail?.field?.instrumentation?.[0] || 'semantic',
            eventName: 'spw:semantic-snapshot',
        });
        wake();
    });

    document.addEventListener('spw:runtime-refresh', (event) => {
        if (!shouldNarrateDiagnostics('verbose')) return;
        setAction(nodes, history, ...describeRuntimeRefresh(event.detail), {
            source: 'runtime-refresh',
            frame: event.detail?.route || getPageSurface() || 'surface',
            scope: 'runtime',
            eventName: 'spw:runtime-refresh',
        });
        wake();
    });

    document.addEventListener('spw:layout-shift', (event) => {
        if (!shouldNarrateDiagnostics('basic')) return;
        setAction(nodes, history, ...describeLayoutShiftAction(event.detail), {
            source: 'layout-shift',
            frame: event.detail?.outcome || 'layout',
            scope: event.detail?.state || 'layout',
            eventName: 'spw:layout-shift',
        });
        wake();
    });
};

export function unmountSpwConsole() {
    initialized = false;
}

export { initSpwConsole, unmountSpwConsole as unmount };

export const SPW_MODULE_EXPORT = Object.freeze({
    id: 'console',
    mount: () => {
        initSpwConsole();
        return unmountSpwConsole;
    },
    describes: 'console[frame|mode|bus|layout] diagnostics[screenshot]',
    timingArc: 'idle-diagnostics',
    effectScope: 'floating-chrome bus root-state',
});

export const spwModule = SPW_MODULE_EXPORT;
