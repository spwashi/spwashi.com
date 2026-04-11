/**
 * Spw State Inspector
 *
 * Renders small code-like state blocks for components that explicitly opt in or
 * for image surfaces already managed by the metaphysics runtime.
 *
 * The block only mutates state the underlying component already owns:
 * - operator swaps for frames with `data-spw-swappable`
 * - brace swaps for targets with `data-spw-form-options`
 * - mode swaps for existing `data-mode-group` controls
 * - form field values for opted-in settings surfaces
 * - image effect overrides for managed image surfaces
 */

import { bus } from './spw-bus.js';
import { OPERATOR_DEFINITIONS, detectOperator } from './spw-shared.js';

const TARGET_SELECTOR = [
    '[data-spw-inspect]',
    '[data-spw-image-managed="true"]'
].join(', ');

const OPERATOR_PREFIX_BY_TYPE = Object.freeze(
    Object.fromEntries(OPERATOR_DEFINITIONS.map(({ type, prefix }) => [type, prefix]))
);

const FORM_DELIMITERS = Object.freeze({
    brace: ['{', '}'],
    block: ['[', ']'],
    square: ['[', ']'],
    angle: ['<', '>'],
    circle: ['(', ')'],
    paren: ['(', ')']
});

const IMAGE_EFFECT_OPTIONS = Object.freeze(['semantic', 'pixelize', 'watercolor', 'clarify']);
const STATEFUL_PHASES = Object.freeze({
    frame: ['objective', 'neutral', 'subjective'],
    object: ['source', 'syntax', 'projection'],
    probe: ['inquiry', 'observation', 'result'],
    ref: ['local', 'remote', 'hyper'],
    action: ['idle', 'charging', 'committed'],
    stream: ['source', 'stream', 'sink'],
    pragma: ['hint', 'constraint', 'pragma']
});
let inspectorCount = 0;
const LOOP_STATE = new WeakMap();
const LOOP_TIMERS = new WeakMap();

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toSnake = (value = '') => String(value)
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const readDurationMs = (name, fallback) => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!raw) return fallback;

    if (raw.endsWith('ms')) {
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? value : fallback;
    }

    if (raw.endsWith('s')) {
        const value = Number.parseFloat(raw);
        return Number.isFinite(value) ? value * 1000 : fallback;
    }

    const value = Number.parseFloat(raw);
    return Number.isFinite(value) ? value : fallback;
};

const getLoopTiming = () => ({
    previewReleaseMs: readDurationMs('--duration-fast', 180),
    resolveMs: readDurationMs('--duration-slow', 480) * 2
});

const getTargetName = (target) => {
    if (target.dataset.spwInspect) return toSnake(target.dataset.spwInspect);
    if (target.id) return toSnake(target.id);

    const heading = target.querySelector('h1, h2, h3, figcaption, .frame-card-sigil')?.textContent;
    if (heading) return toSnake(heading);

    const imageKey = target.dataset.spwImageKey || target.getAttribute('aria-label');
    if (imageKey) return toSnake(imageKey);

    return 'state_surface';
};

const normalizeOperatorSymbol = (value = '') => {
    if (!value) return '';
    if (OPERATOR_PREFIX_BY_TYPE[value]) return OPERATOR_PREFIX_BY_TYPE[value];

    const detected = detectOperator(value);
    if (detected?.prefix) return detected.prefix;

    return value;
};

const readOperatorSymbol = (target) => {
    const sigilText = target.querySelector('.frame-sigil')?.textContent?.trim() || '';
    const explicit = target.dataset.spwOperator
        ? normalizeOperatorSymbol(target.dataset.spwOperator)
        : '';
    const detected = normalizeOperatorSymbol(sigilText);
    return explicit || detected || '#>';
};

const readOperatorType = (symbol = '') => detectOperator(symbol)?.type || null;

const parseList = (value = '') => value
    .split(',')
    .map((item) => normalizeOperatorSymbol(item.trim()))
    .filter(Boolean);

const readForm = (target) => target.dataset.spwForm || 'brace';

const readFormOptions = (target) => {
    const options = (target.dataset.spwFormOptions || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return options.length ? options : [];
};

const getDelimiters = (form) => FORM_DELIMITERS[form] || FORM_DELIMITERS.brace;

function readModeField(target) {
    const groupName = target.dataset.spwInspectModeGroup;
    if (!groupName) return null;

    const buttons = Array.from(target.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`));
    if (!buttons.length) return null;

    const active = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')
        || buttons.find((button) => button.classList.contains('is-selected'))
        || buttons[0];

    return {
        key: 'mode',
        value: active.dataset.setMode,
        options: buttons.map((button) => button.dataset.setMode),
        source: 'mode',
        interactive: true
    };
}

function readPhaseField(target) {
    if (!target.dataset.spwPhase) return null;
    return {
        key: 'phase',
        value: target.dataset.spwPhase,
        source: 'phase',
        interactive: false
    };
}

function readFormField(target, name) {
    const nodes = Array.from(target.querySelectorAll(`[name="${CSS.escape(name)}"]`));
    if (!nodes.length) return null;

    const key = toSnake(name);
    const first = nodes[0];

    if (first instanceof HTMLInputElement && first.type === 'radio') {
        const active = nodes.find((node) => node.checked) || first;
        return {
            key,
            value: active.value,
            options: nodes.map((node) => node.value),
            source: 'form',
            fieldName: name,
            interactive: true
        };
    }

    if (first instanceof HTMLInputElement && first.type === 'checkbox') {
        return {
            key,
            value: first.checked ? 'on' : 'off',
            options: ['off', 'on'],
            source: 'form',
            fieldName: name,
            interactive: true
        };
    }

    if (first instanceof HTMLSelectElement) {
        return {
            key,
            value: first.value,
            options: Array.from(first.options).map((option) => option.value),
            source: 'form',
            fieldName: name,
            interactive: true
        };
    }

    return null;
}

function readFormFields(target) {
    const names = (target.dataset.spwInspectFields || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    return names
        .map((name) => readFormField(target, name))
        .filter(Boolean);
}

function readImageFields(target) {
    if (target.dataset.spwImageManaged !== 'true') return [];

    return [
        {
            key: 'hold',
            value: target.dataset.spwHoldState
                || (target.dataset.spwVisited === 'true' ? 'settled' : 'idle'),
            source: 'image-hold',
            interactive: false,
            tone: target.dataset.spwHoldState
                ? 'activated'
                : (target.dataset.spwVisited === 'true' ? 'resolved' : 'idle')
        },
        {
            key: 'effect',
            value: target.dataset.spwImageEffectOverride || target.dataset.spwImageEffect || 'semantic',
            options: [...IMAGE_EFFECT_OPTIONS],
            source: 'image-effect',
            interactive: true
        },
        {
            key: 'visited',
            value: target.dataset.spwVisited === 'true' ? 'true' : 'false',
            source: 'image-visited',
            interactive: false
        },
        {
            key: 'realization',
            value: target.dataset.spwRealization || 'hybrid',
            source: 'image-realization',
            interactive: false
        }
    ];
}

function readLoopState(target) {
    return LOOP_STATE.get(target) || { state: 'idle', token: '', label: 'ready' };
}

function formatLoopLabel(state, token = '') {
    if (state === 'idle') return 'ready';
    if (!token) return state;
    return `${state} · ${token}`;
}

function applyLoopDataset(target, loop) {
    const inspector = target.querySelector(`[data-spw-state-block="${target.dataset.spwInspectId}"]`);
    if (!inspector) return;

    inspector.dataset.spwLoopState = loop.state;
    inspector.dataset.spwLoopToken = loop.token || '';
    inspector.dataset.spwLoopLabel = loop.label;
}

function setLoopState(target, state = 'idle', token = '') {
    const loop = {
        state,
        token: state === 'idle' ? '' : token,
        label: formatLoopLabel(state, token)
    };
    LOOP_STATE.set(target, loop);
    applyLoopDataset(target, loop);
}

function clearLoopTimer(target) {
    const timer = LOOP_TIMERS.get(target);
    if (!timer) return;
    window.clearTimeout(timer);
    LOOP_TIMERS.delete(target);
}

function scheduleLoopIdle(target, delay = getLoopTiming().previewReleaseMs) {
    clearLoopTimer(target);
    const timer = window.setTimeout(() => {
        setLoopState(target, 'idle');
        syncTarget(target);
    }, delay);
    LOOP_TIMERS.set(target, timer);
}

function previewLoop(target, token) {
    const current = readLoopState(target);
    if (current.state === 'preview' && current.token === token) return;
    if (current.state === 'activated' && current.token === token) return;
    clearLoopTimer(target);
    setLoopState(target, 'preview', token);
    syncTarget(target);
}

function activateLoop(target, token) {
    clearLoopTimer(target);
    setLoopState(target, 'activated', token);
    syncTarget(target);
}

function resolveLoop(target, token) {
    const timing = getLoopTiming();
    clearLoopTimer(target);
    setLoopState(target, 'resolved', token);
    syncTarget(target);
    pulseInspector(target);
    scheduleLoopIdle(target, timing.resolveMs);
}

function readLoopField(target) {
    const loop = readLoopState(target);
    return {
        key: 'loop',
        value: loop.state === 'idle'
            ? 'ready'
            : `${loop.state}(${loop.token || 'surface'})`,
        source: 'loop',
        interactive: false,
        tone: loop.state
    };
}

function collectFields(target) {
    const fields = [readLoopField(target)];
    const modeField = readModeField(target);
    const phaseField = readPhaseField(target);

    if (modeField) fields.push(modeField);
    if (phaseField) fields.push(phaseField);
    fields.push(...readFormFields(target));
    fields.push(...readImageFields(target));

    return fields;
}

function createInspector(target) {
    const block = document.createElement('pre');
    block.className = 'spw-state-block';
    block.dataset.spwStateBlock = target.dataset.spwInspectId;
    block.addEventListener('pointerover', (event) => {
        const token = event.target.closest('.spw-state-token[data-action]');
        if (!token) return;
        previewLoop(target, getLoopToken(token));
    });
    block.addEventListener('pointerleave', () => {
        scheduleLoopIdle(target);
    });
    block.addEventListener('focusin', (event) => {
        const token = event.target.closest('.spw-state-token[data-action]');
        if (!token) return;
        previewLoop(target, getLoopToken(token));
    });
    block.addEventListener('focusout', (event) => {
        if (block.contains(event.relatedTarget)) return;
        scheduleLoopIdle(target);
    });
    block.addEventListener('click', (event) => {
        const token = event.target.closest('.spw-state-token[data-action]');
        if (!token) return;
        event.preventDefault();
        event.stopPropagation();

        const loopToken = getLoopToken(token);
        activateLoop(target, loopToken);

        const action = token.dataset.action;
        if (action === 'operator') {
            cycleOperator(target);
        } else if (action === 'form') {
            cycleForm(target);
        } else if (action === 'value') {
            cycleFieldValue(target, token.dataset.key);
        }

        if (action === 'operator' || action === 'form') {
            resolveLoop(target, loopToken);
        }
    });

    return block;
}

function getPlacement(target) {
    return target.dataset.spwImageManaged === 'true' ? 'overlay' : 'inline';
}

function getAnchor(target) {
    return target.querySelector('.frame-topline, .frame-heading, figcaption') || target.firstElementChild;
}

function mountTarget(target) {
    if (target.dataset.spwInspectMounted === 'true') return;

    target.dataset.spwInspectMounted = 'true';
    target.dataset.spwInspectId ||= `spw-inspect-${++inspectorCount}`;

    const inspector = createInspector(target);
    const placement = getPlacement(target);
    inspector.classList.add(
        placement === 'overlay'
            ? 'spw-state-block--overlay'
            : 'spw-state-block--inline'
    );

    if (placement === 'overlay') {
        target.append(inspector);
    } else {
        const anchor = getAnchor(target);
        if (anchor?.after) {
            anchor.after(inspector);
        } else {
            target.prepend(inspector);
        }
    }

    setLoopState(target, 'idle');
    syncTarget(target);
}

function readTargetState(target) {
    const operator = readOperatorSymbol(target);
    const form = readForm(target);

    return {
        name: getTargetName(target),
        operator,
        operatorOptions: parseList(target.dataset.spwSwappable || ''),
        form,
        formOptions: readFormOptions(target),
        fields: collectFields(target)
    };
}

function renderField(field) {
    const interactive = field.interactive ? ' data-action="value"' : '';
    const classes = [
        'spw-state-token',
        'spw-state-token--val',
        field.interactive ? 'is-interactive' : '',
        field.source ? `spw-state-token--${field.source}` : '',
        field.tone ? `is-${field.tone}` : ''
    ].filter(Boolean).join(' ');

    return `  <span class="spw-state-token spw-state-token--key">${escapeHtml(field.key)}</span>: `
        + `<span class="${classes}" data-key="${escapeHtml(field.key)}"${interactive}>${escapeHtml(field.value)}</span>`;
}

function getLoopToken(token) {
    const action = token.dataset.action;
    if (action === 'operator') return 'operator';
    if (action === 'form') return 'brace';
    return token.dataset.key || 'value';
}

function renderState(state) {
    const [open, close] = getDelimiters(state.form);
    const operatorAction = state.operatorOptions.length > 1 ? ' data-action="operator"' : '';
    const formAction = state.formOptions.length > 1 ? ' data-action="form"' : '';
    const operatorClasses = [
        'spw-state-token',
        'spw-state-token--op',
        state.operatorOptions.length > 1 ? 'is-interactive' : ''
    ].filter(Boolean).join(' ');
    const braceClasses = [
        'spw-state-token',
        'spw-state-token--brace',
        state.formOptions.length > 1 ? 'is-interactive' : ''
    ].filter(Boolean).join(' ');
    const lines = state.fields.map(renderField).join('\n');

    return `<code><span class="${operatorClasses}"${operatorAction}>${escapeHtml(state.operator)}</span>`
        + `<span class="spw-state-token spw-state-token--name">${escapeHtml(state.name)}</span> `
        + `<span class="${braceClasses}"${formAction}>${escapeHtml(open)}</span>`
        + `${lines ? `\n${lines}\n` : '\n'}`
        + `<span class="${braceClasses}"${formAction}>${escapeHtml(close)}</span></code>`;
}

function syncTarget(target) {
    const inspector = target.querySelector(`[data-spw-state-block="${target.dataset.spwInspectId}"]`);
    if (!inspector) return;

    inspector.innerHTML = renderState(readTargetState(target));
}

function pulseInspector(target) {
    const inspector = target.querySelector(`[data-spw-state-block="${target.dataset.spwInspectId}"]`);
    if (!inspector) return;
    inspector.classList.remove('is-dirty');
    void inspector.offsetWidth;
    inspector.classList.add('is-dirty');
}

function setSigilPrefix(target, nextSymbol) {
    const sigil = target.querySelector('.frame-sigil');
    if (!sigil) return;

    const currentText = sigil.textContent?.trim() || '';
    const detected = detectOperator(currentText);

    if (detected?.prefix) {
        sigil.textContent = `${nextSymbol}${currentText.slice(detected.prefix.length)}`;
    } else {
        sigil.textContent = `${nextSymbol}${getTargetName(target)}`;
    }

    const type = readOperatorType(nextSymbol);
    if (type) {
        sigil.dataset.spwOperator = type;
    } else {
        delete sigil.dataset.spwOperator;
    }
}

function resetStatefulPhase(target, operatorType) {
    if (!target.hasAttribute('data-spw-stateful')) return;

    const sigil = target.querySelector('.frame-sigil');
    const initialPhase = STATEFUL_PHASES[operatorType]?.[0];
    if (!initialPhase) {
        delete target.dataset.spwPhase;
        sigil?.removeAttribute('data-spw-phase');
        sigil?.removeAttribute('data-spw-phase-prefix');
        sigil?.removeAttribute('data-spw-phase-postfix');
        target.style.removeProperty('--charge');
        return;
    }

    target.dataset.spwPhase = initialPhase;
    target.style.setProperty('--charge', '0.3');

    if (sigil) {
        sigil.dataset.spwPhase = initialPhase;
        sigil.dataset.spwPhasePrefix = initialPhase;
        sigil.removeAttribute('data-spw-phase-postfix');
    }
}

function cycleOperator(target) {
    const options = parseList(target.dataset.spwSwappable || '');
    if (options.length < 2) return;

    const current = readOperatorSymbol(target);
    const next = options[(options.indexOf(current) + 1 + options.length) % options.length];
    const nextType = readOperatorType(next);

    target.dataset.spwOperator = nextType || next;
    setSigilPrefix(target, next);
    resetStatefulPhase(target, nextType);
    window.spwInterface?.activateFrame?.(target, { source: 'state-inspector', force: true });
}

function cycleForm(target) {
    const options = readFormOptions(target);
    if (options.length < 2) return;

    const current = readForm(target);
    const next = options[(options.indexOf(current) + 1 + options.length) % options.length];
    target.dataset.spwForm = next;
    window.spwInterface?.activateFrame?.(target, { source: 'state-inspector', force: true });
}

function cycleMode(target) {
    const field = readModeField(target);
    if (!field?.options?.length) return;

    const next = field.options[(field.options.indexOf(field.value) + 1) % field.options.length];
    window.spwInterface?.setGroupMode?.(target.dataset.spwInspectModeGroup, next, {
        source: 'state-inspector',
        force: true
    });
}

function cycleFormField(target, fieldName) {
    const nodes = Array.from(target.querySelectorAll(`[name="${CSS.escape(fieldName)}"]`));
    if (!nodes.length) return;

    const first = nodes[0];

    if (first instanceof HTMLInputElement && first.type === 'radio') {
        const active = nodes.find((node) => node.checked) || first;
        const next = nodes[(nodes.indexOf(active) + 1) % nodes.length];
        next.checked = true;
        next.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }

    if (first instanceof HTMLInputElement && first.type === 'checkbox') {
        first.checked = !first.checked;
        first.dispatchEvent(new Event('change', { bubbles: true }));
        return;
    }

    if (first instanceof HTMLSelectElement) {
        const values = Array.from(first.options).map((option) => option.value);
        const next = values[(values.indexOf(first.value) + 1) % values.length];
        first.value = next;
        first.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function cycleImageEffect(target) {
    const current = target.dataset.spwImageEffectOverride || target.dataset.spwImageEffect || 'semantic';
    const next = IMAGE_EFFECT_OPTIONS[(IMAGE_EFFECT_OPTIONS.indexOf(current) + 1) % IMAGE_EFFECT_OPTIONS.length];
    target.dataset.spwImageEffectOverride = next;
    target.dispatchEvent(new CustomEvent('spw:image:refresh', {
        bubbles: true,
        detail: { reason: 'effect' }
    }));
}

function cycleFieldValue(target, key) {
    const modeField = readModeField(target);
    if (modeField?.key === key) {
        cycleMode(target);
        return;
    }

    const formField = readFormFields(target).find((field) => field.key === key);
    if (formField) {
        cycleFormField(target, formField.fieldName);
        return;
    }

    if (target.dataset.spwImageManaged === 'true' && key === 'effect') {
        cycleImageEffect(target);
    }
}

function scan(root = document) {
    const targets = root.querySelectorAll?.(TARGET_SELECTOR) || [];
    targets.forEach((target) => {
        if (!(target instanceof HTMLElement)) return;
        mountTarget(target);
        syncTarget(target);
    });
}

function refreshAll() {
    scan(document);
}

export function initSpwStateInspector() {
    scan(document);

    bus.on('image:visited', refreshAll);
    bus.on('settings:changed', refreshAll);
    document.addEventListener('spw:image:refresh', (event) => {
        const target = event.target instanceof Element
            ? event.target.closest('[data-spw-image-managed="true"]')
            : null;
        if (!(target instanceof HTMLElement)) return;

        const reason = event.detail?.reason || '';
        syncTarget(target);

        if (reason === 'effect') {
            resolveLoop(target, 'effect');
        } else if (reason === 'arming') {
            activateLoop(target, 'hold');
        } else if (reason === 'visited' || reason === 'settled') {
            resolveLoop(target, 'hold');
        } else if (reason === 'released') {
            scheduleLoopIdle(target);
        }
    });
    document.addEventListener('spw:mode-change', (event) => {
        refreshAll();
        const groupName = event.detail?.groupName;
        if (!groupName) return;

        document
            .querySelectorAll(`[data-spw-inspect-mode-group="${groupName}"]`)
            .forEach((target) => {
                if (target instanceof HTMLElement) {
                    resolveLoop(target, 'mode');
                }
            });
    });
    document.addEventListener('spw:component-semantics-ready', refreshAll);
    document.addEventListener('change', (event) => {
        const target = event.target instanceof Element
            ? event.target.closest('[data-spw-inspect]')
            : null;
        if (target instanceof HTMLElement) {
            syncTarget(target);
            const changedKey = event.target.getAttribute?.('name');
            if (changedKey) {
                resolveLoop(target, toSnake(changedKey));
            }
        }
    });
}
