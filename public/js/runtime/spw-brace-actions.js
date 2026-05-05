import { emitSpwAction } from '/public/js/kernel/spw-shared.js';

const TARGET_SELECTOR = [
    '.site-frame[data-spw-form="brace"]',
    '.frame-card[data-spw-form="brace"]:not(a)',
    '.frame-panel[data-spw-form="brace"]',
    '.software-card[data-spw-form="brace"]:not(a)',
    '.mode-panel[data-spw-form="brace"]',
    '.operator-card[data-spw-form="brace"]:not(a)',
    '.persona-selector-frame[data-spw-form="brace"]'
].join(', ');

function activateFrame(target, source = 'brace-edge') {
    const frame = target.classList.contains('site-frame')
        ? target
        : target.closest('.site-frame');
    window.spwInterface?.activateFrame?.(frame || target, { source, force: true });
}

function requestInspectorDisclosure(target, action) {
    target.dispatchEvent(new CustomEvent('spw:state-block-disclosure', {
        bubbles: true,
        detail: { action }
    }));
}

function revealClosedDetails(target) {
    const detail = target.querySelector('details:not([open])');
    if (!detail) return false;
    detail.open = true;
    return true;
}

function cycleMode(target) {
    const groupName = target.dataset.spwInspectModeGroup
        || target.querySelector('[data-mode-group]')?.dataset.modeGroup;
    if (!groupName) return false;

    const buttons = Array.from(target.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`));
    if (buttons.length < 2) return false;

    const active = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')
        || buttons.find((button) => button.classList.contains('is-selected'))
        || buttons[0];
    const next = buttons[(buttons.indexOf(active) + 1) % buttons.length];
    window.spwInterface?.setGroupMode?.(groupName, next.dataset.setMode, {
        source: 'brace-edge',
        force: true
    });
    return true;
}

function cycleForm(target) {
    const options = (target.dataset.spwFormOptions || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    if (options.length < 2) return false;

    const current = target.dataset.spwForm || options[0];
    const next = options[(options.indexOf(current) + 1 + options.length) % options.length];
    target.dataset.spwForm = next;
    return true;
}

function projectToPrimaryLink(target) {
    if (target instanceof HTMLAnchorElement && target.href) {
        target.click();
        return true;
    }

    const link = target.querySelector('a[href]:not(.frame-sigil[href^="#"])');
    if (!link) return false;
    link.click();
    return true;
}

function projectToNextFrame(target) {
    const frame = target.classList.contains('site-frame')
        ? target
        : target.closest('.site-frame');
    let next = frame?.nextElementSibling || null;
    while (next && !next.classList.contains('site-frame')) {
        next = next.nextElementSibling;
    }
    if (!next) return false;

    next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activateFrame(next, 'brace-projection');
    return true;
}

function handleEntry(target) {
    activateFrame(target, 'brace-entry');
    requestInspectorDisclosure(target, 'restore');

    if (revealClosedDetails(target)) {
        emitSpwAction('@brace.entry', 'Opened the next local detail surface.');
        return;
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    emitSpwAction('@brace.entry', 'Activated the local frame boundary.');
}

function handleProjection(target) {
    let description = 'Projected to the next available surface.';
    let acted = false;

    if (cycleForm(target)) {
        description = 'Rotated the local containment form.';
        acted = true;
    } else if (cycleMode(target)) {
        description = 'Advanced the local mode surface.';
        acted = true;
    } else if (projectToPrimaryLink(target)) {
        description = 'Followed the primary projection linked from this surface.';
        acted = true;
    } else if (projectToNextFrame(target)) {
        acted = true;
    } else {
        requestInspectorDisclosure(target, 'toggle');
        description = 'Toggled the local diagnostic surface.';
        acted = true;
    }

    if (acted) emitSpwAction('>brace.project', description);
}

function mountBraceActions(target) {
    if (!(target instanceof HTMLElement) || target.dataset.spwBraceActionsMounted === 'true') return;

    target.dataset.spwBraceActionsMounted = 'true';
    target.dataset.spwBraceActions = 'on';

    const controls = document.createElement('div');
    controls.className = 'spw-brace-actions';

    const entry = document.createElement('button');
    entry.type = 'button';
    entry.className = 'spw-brace-action spw-brace-action--entry';
    entry.dataset.spwBraceEdge = 'entry';
    entry.setAttribute('aria-label', 'Activate or reveal this surface');
    entry.textContent = '{';

    const projection = document.createElement('button');
    projection.type = 'button';
    projection.className = 'spw-brace-action spw-brace-action--projection';
    projection.dataset.spwBraceEdge = 'projection';
    projection.setAttribute('aria-label', 'Project or advance from this surface');
    projection.textContent = '}';

    [entry, projection].forEach((button) => {
        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    entry.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleEntry(target);
    });

    projection.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleProjection(target);
    });

    controls.append(entry, projection);
    target.append(controls);
}

function scan(root = document) {
    root.querySelectorAll?.(TARGET_SELECTOR).forEach(mountBraceActions);
}

export function initSpwBraceActions() {
    scan(document);
    document.addEventListener('spw:component-semantics-ready', () => scan(document));
}
