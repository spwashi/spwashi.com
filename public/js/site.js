import {
    emitSpwEvent,
    getFrameMeta,
    getRequestedFeatures,
    loadFeature,
    onDomReady
} from './spw-shared.js';

const initSiteCore = () => {
    const frames = Array.from(document.querySelectorAll('.site-frame'));
    const state = {
        activeFrame: null,
        activeFrameId: null,
        groupModes: new Map()
    };

    const activateFrame = (frame, options = {}) => {
        if (!frame) return;

        const meta = getFrameMeta(frame);
        const changed = state.activeFrame !== frame;

        frames.forEach((item) => item.classList.toggle('is-active-frame', item === frame));
        state.activeFrame = frame;
        state.activeFrameId = meta.id;

        if (changed || options.force) {
            emitSpwEvent('frame-change', {
                ...meta,
                frame,
                source: options.source || 'direct'
            });
        }
    };

    const resolveTargetFrame = (selector) => {
        if (!selector || !selector.startsWith('#')) return null;
        const target = document.querySelector(selector);
        if (!target) return null;
        if (target.classList.contains('site-frame')) return target;
        return target.closest('.site-frame');
    };

    const activateFromHash = () => {
        const hashTarget = resolveTargetFrame(window.location.hash);
        if (hashTarget) {
            activateFrame(hashTarget, { source: 'hash', force: true });
            return true;
        }
        return false;
    };

    const setGroupMode = (groupName, modeValue, options = {}) => {
        const buttons = Array.from(
            document.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`)
        );
        const panels = Array.from(
            document.querySelectorAll(`[data-mode-group="${groupName}"][data-mode-panel]`)
        );

        if (!buttons.length && !panels.length) return;

        const nextMode = modeValue || buttons[0]?.dataset.setMode || panels[0]?.dataset.modePanel;
        if (!nextMode) return;

        const changed = state.groupModes.get(groupName) !== nextMode;
        state.groupModes.set(groupName, nextMode);

        buttons.forEach((button) => {
            const active = button.dataset.setMode === nextMode;
            button.classList.toggle('is-selected', active);
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            if (button.closest('.mode-switch')) {
                button.setAttribute('tabindex', active ? '0' : '-1');
            }
        });

        panels.forEach((panel) => {
            const active = panel.dataset.modePanel === nextMode;
            panel.hidden = !active;
            panel.classList.toggle('is-active-panel', active);
        });

        const activePanel = panels.find((panel) => panel.dataset.modePanel === nextMode);
        const activeButton = buttons.find((button) => button.dataset.setMode === nextMode);
        const frame = activePanel?.closest('.site-frame') || activeButton?.closest('.site-frame');
        if (frame) {
            activateFrame(frame, {
                source: options.source || 'mode-switch',
                force: options.force
            });
        }

        if (changed || options.force) {
            emitSpwEvent('mode-change', {
                groupName,
                modeValue: nextMode,
                label: activeButton?.textContent.trim() || nextMode,
                frame,
                frameMeta: getFrameMeta(frame),
                source: options.source || 'mode-switch'
            });
        }
    };

    const getActiveFrame = () => (
        state.activeFrame
        || frames.find((frame) => frame.id === state.activeFrameId)
        || document.querySelector('.site-frame.is-active-frame')
        || null
    );

    window.spwInterface = {
        activateFrame,
        emit: emitSpwEvent,
        getActiveFrame,
        getFrameMeta,
        getState: () => ({
            activeFrame: getActiveFrame(),
            activeFrameId: state.activeFrameId,
            groupModes: Object.fromEntries(state.groupModes)
        }),
        resolveTargetFrame,
        setGroupMode
    };

    const anchorSelector = '.frame-sigil[href^="#"], .operator-chip[href^="#"]';
    const frameContextSelector = '.frame-card, .frame-panel, .mode-panel, .site-figure, .syntax-token, .frame-list a';

    const getClosestMatch = (target, selector) => (
        target instanceof Element ? target.closest(selector) : null
    );

    const activateFrameFromNode = (node, source) => {
        const frame = node?.closest('.site-frame');
        if (!frame) return;
        activateFrame(frame, { source });
    };

    document.addEventListener('click', (event) => {
        const anchor = getClosestMatch(event.target, anchorSelector);
        if (!anchor) return;

        const targetFrame = resolveTargetFrame(anchor.getAttribute('href'));
        if (targetFrame) {
            activateFrame(targetFrame, { source: 'anchor', force: true });
        }
    });

    document.addEventListener('pointerover', (event) => {
        const node = getClosestMatch(event.target, frameContextSelector);
        if (!node) return;
        if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
        activateFrameFromNode(node, 'hover');
    });

    document.addEventListener('focusin', (event) => {
        const node = getClosestMatch(event.target, frameContextSelector);
        if (node) activateFrameFromNode(node, 'focus');
    });

    const groupedNodes = Array.from(document.querySelectorAll('[data-mode-group]'));
    const groupNames = Array.from(
        new Set(groupedNodes.map((node) => node.dataset.modeGroup).filter(Boolean))
    );

    groupNames.forEach((groupName) => {
        const buttons = Array.from(
            document.querySelectorAll(`[data-mode-group="${groupName}"][data-set-mode]`)
        );
        const initialMode = buttons.find((button) => button.getAttribute('aria-pressed') === 'true')?.dataset.setMode
            || buttons[0]?.dataset.setMode;

        buttons.forEach((button) => {
            button.addEventListener('click', () => {
                setGroupMode(groupName, button.dataset.setMode, {
                    source: 'mode-switch',
                    force: true
                });
            });

            const switchRoot = button.closest('.mode-switch');
            if (!switchRoot) return;

            button.addEventListener('keydown', (event) => {
                if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();

                const switchButtons = buttons.filter((candidate) => candidate.closest('.mode-switch') === switchRoot);
                const currentIndex = switchButtons.indexOf(button);

                if (event.key === 'Home') {
                    setGroupMode(groupName, switchButtons[0].dataset.setMode, {
                        source: 'keyboard-mode',
                        force: true
                    });
                    switchButtons[0].focus();
                    return;
                }

                if (event.key === 'End') {
                    const last = switchButtons[switchButtons.length - 1];
                    setGroupMode(groupName, last.dataset.setMode, {
                        source: 'keyboard-mode',
                        force: true
                    });
                    last.focus();
                    return;
                }

                const direction = event.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (currentIndex + direction + switchButtons.length) % switchButtons.length;
                const nextButton = switchButtons[nextIndex];
                setGroupMode(groupName, nextButton.dataset.setMode, {
                    source: 'keyboard-mode',
                    force: true
                });
                nextButton.focus();
            });
        });

        if (initialMode) {
            setGroupMode(groupName, initialMode, { source: 'init', force: true });
        }
    });

    if ('IntersectionObserver' in window && frames.length > 1) {
        const visibleFrames = new Map();
        let viewportSyncId = 0;

        const syncViewportFrame = () => {
            viewportSyncId = 0;

            const candidates = frames
                .map((frame) => ({
                    frame,
                    ratio: visibleFrames.get(frame) || 0,
                    top: frame.getBoundingClientRect().top
                }))
                .filter(({ ratio, top }) => ratio > 0 || (top < window.innerHeight * 0.45 && top > -window.innerHeight * 0.5));

            if (!candidates.length) return;

            candidates.sort((a, b) => {
                if (b.ratio !== a.ratio) return b.ratio - a.ratio;
                const targetTop = window.innerHeight * 0.18;
                return Math.abs(a.top - targetTop) - Math.abs(b.top - targetTop);
            });

            activateFrame(candidates[0].frame, { source: 'viewport' });
        };

        const scheduleViewportSync = () => {
            cancelAnimationFrame(viewportSyncId);
            viewportSyncId = requestAnimationFrame(syncViewportFrame);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                visibleFrames.set(
                    entry.target,
                    entry.isIntersecting ? entry.intersectionRatio : 0
                );
            });
            scheduleViewportSync();
        }, {
            threshold: [0, 0.12, 0.24, 0.4, 0.6, 0.8],
            rootMargin: '-18% 0px -42% 0px'
        });

        frames.forEach((frame) => observer.observe(frame));
        window.addEventListener('scroll', scheduleViewportSync, { passive: true });
        window.addEventListener('resize', scheduleViewportSync);
    }

    if (!activateFromHash() && frames[0]) {
        activateFrame(frames[0], { source: 'init', force: true });
    }

    window.addEventListener('hashchange', activateFromHash);
};

const initOptionalFeatures = async () => {
    const features = getRequestedFeatures();

    if (features.has('operators')) {
        await loadFeature('./spw-operators.js', 'initSpwOperators');
    }

    const loads = [];

    if (features.has('metrics')) {
        loads.push(loadFeature('./frame-metrics.js', 'initFrameMetrics'));
    }

    if (features.has('navigator')) {
        loads.push(loadFeature('./frame-navigator.js', 'initFrameNavigator'));
    }

    if (features.has('console')) {
        loads.push(loadFeature('./spw-console.js', 'initSpwConsole'));
    }

    if (features.has('pretext-lab') || document.querySelector('#pretext-input')) {
        loads.push(loadFeature('./pretext-lab.js', 'initPretextLab'));
    }

    await Promise.all(loads);
    await loadFeature('./spw-component-semantics.js', 'initSpwComponentSemantics');
};

onDomReady(() => {
    initSiteCore();

    initOptionalFeatures().catch((error) => {
        console.error('Failed to initialize optional site features.', error);
    });
});
