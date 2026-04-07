const createConsole = () => {
    const root = document.createElement('aside');
    root.className = 'spw-console';
    root.setAttribute('aria-label', 'Spw textual interface');

    const titleLine = document.createElement('div');
    titleLine.className = 'spw-console-line';

    const titleToken = document.createElement('span');
    titleToken.className = 'frame-sigil';
    titleToken.textContent = '>surface_state';

    const titleCopy = document.createElement('span');
    titleCopy.className = 'spw-console-copy';
    titleCopy.textContent = 'textual interface';
    titleLine.append(titleToken, titleCopy);

    const frameLine = document.createElement('div');
    frameLine.className = 'spw-console-line';

    const frameLink = document.createElement('a');
    frameLink.className = 'frame-sigil spw-console-frame-link';
    frameLink.href = '#';
    frameLink.textContent = '#>frame';

    const frameLabel = document.createElement('span');
    frameLabel.className = 'spw-console-copy spw-console-frame-label';
    frameLine.append(frameLink, frameLabel);

    const modeLine = document.createElement('div');
    modeLine.className = 'spw-console-line spw-console-mode-line';

    const modeToken = document.createElement('span');
    modeToken.className = 'frame-sigil';
    modeToken.textContent = '.modes';

    const modeButtons = document.createElement('div');
    modeButtons.className = 'spw-console-mode-buttons';
    modeLine.append(modeToken, modeButtons);

    const actionLine = document.createElement('div');
    actionLine.className = 'spw-console-line';

    const actionToken = document.createElement('span');
    actionToken.className = 'frame-sigil spw-console-action-token';
    actionToken.textContent = '>surface.ready';

    const actionCopy = document.createElement('span');
    actionCopy.className = 'spw-console-copy';
    actionCopy.textContent = 'waiting for active frame';
    actionLine.append(actionToken, actionCopy);

    const spellsLine = document.createElement('div');
    spellsLine.className = 'spw-console-line spw-console-spells';
    spellsLine.innerHTML =
        '<span class="spw-spell">g</span> navigator' +
        '<span class="spw-spell">/</span> probe' +
        '<span class="spw-spell">[ ]</span> traverse';

    root.append(titleLine, frameLine, modeLine, actionLine, spellsLine);

    return {
        actionCopy,
        actionToken,
        frameLabel,
        frameLink,
        modeButtons,
        root
    };
};

const setAction = (nodes, token, copy) => {
    nodes.actionToken.textContent = token;
    nodes.actionCopy.textContent = copy;
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
        const empty = document.createElement('span');
        empty.className = 'spw-console-empty';
        empty.textContent = '~ no inline modes';
        nodes.modeButtons.appendChild(empty);
        return;
    }

    buttons.forEach((sourceButton) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'frame-sigil spw-console-token';
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
                source: 'console',
                force: true
            });
            api.activateFrame(frame, { source: 'console' });
        });

        nodes.modeButtons.appendChild(button);
    });
};

const describeFrameAction = (detail) => {
    switch (detail.source) {
    case 'viewport':
        return ['@viewport.activate', detail.headingText];
    case 'anchor':
        return ['@anchor.jump', detail.headingText];
    case 'hover':
        return ['@hover.focus', detail.headingText];
    case 'focus':
        return ['@focus.activate', detail.headingText];
    case 'hash':
        return ['~hash.resolve', detail.headingText];
    case 'navigator':
        return ['@navigator.select', detail.headingText];
    case 'console':
        return ['@console.project', detail.headingText];
    default:
        return ['@frame.activate', detail.headingText];
    }
};

const describeModeAction = (detail) => {
    const suffix = detail.label ? `${detail.groupName} -> ${detail.label}` : detail.groupName;

    switch (detail.source) {
    case 'console':
        return ['@console.project', suffix];
    case 'keyboard-mode':
        return ['@keyboard.cycle', suffix];
    case 'init':
        return ['>surface.ready', detail.frameMeta.headingText];
    default:
        return ['@mode.project', suffix];
    }
};

const onReady = () => {
    const api = window.spwInterface;
    if (!api) return;

    const nodes = createConsole();
    document.body.appendChild(nodes.root);

    const sync = (detail) => {
        const frame = detail?.frame || api.getActiveFrame();
        const meta = detail || api.getFrameMeta(frame);
        updateFrame(nodes, meta);
        renderModes(nodes, frame, api);
    };

    const initialFrame = api.getActiveFrame();
    sync(initialFrame ? api.getFrameMeta(initialFrame) : null);

    document.addEventListener('spw:frame-change', (event) => {
        sync(event.detail);
        setAction(nodes, ...describeFrameAction(event.detail));
    });

    document.addEventListener('spw:mode-change', (event) => {
        sync(event.detail.frameMeta ? { ...event.detail.frameMeta, frame: event.detail.frame } : null);
        setAction(nodes, ...describeModeAction(event.detail));
    });

    document.addEventListener('spw:action', (event) => {
        const detail = event.detail || {};
        if (!detail.token || !detail.description) return;
        setAction(nodes, detail.token, detail.description);
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
} else {
    onReady();
}
