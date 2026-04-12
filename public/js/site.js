import {
    emitSpwEvent,
    getFrameMeta,
    getRequestedFeatures,
    loadFeature,
    onDomReady
} from './spw-shared.js';
import {
    applySiteSettings,
    initSiteSettingsPage,
    shouldUseViewportActivation
} from './site-settings.js';
import './spirit-phase-dynamics.js';
import './electromagnetic-containers.js';
import { initBraceGestures } from './brace-gestures.js';
import { initSpwExperiential } from './spw-experiential.js';
import { initPretextPhysics } from './spw-pretext-physics.js';
import { initSpwStates } from './spw-states.js';
import { initSpwPromptUtils } from './spw-prompt-utils.js';
import { initSpwHaptics } from './spw-haptics.js';
import { initSpwGuide } from './spw-guide.js';
import { initSpwSpells } from './spw-spells.js';
import { initSpwLattice } from './spw-lattice.js';
import { initSpwCore } from './spw-core.js';
import { initSpwSmart } from './spw-smart.js';
import { initCognitiveSurface } from './spw-cognitive-surface.js';
import { initSpwPersonas } from './spw-personas.js';
import { initSpwSvgFilters } from './spw-svg-filters.js';
import { initSpwCanvasAccents } from './spw-canvas-accents.js';
import { initBracePivots } from './spw-brace-pivots.js';
import { initSpwGate } from './spw-gate.js';
import { initSpwImageMetaphysics } from './spw-image-metaphysics.js';
import { initSpwVisitation } from './spw-visitation.js';
import { initSpwProjection } from './spw-projection.js';
import { initSpwStateInspector } from './spw-state-inspector.js';
import { initSpwShellDisclosure } from './spw-shell-disclosure.js';
import { initSpwBraceActions } from './spw-brace-actions.js';
import { initTopicDiscovery } from './spw-topic-discovery.js';
import { initReactiveSpine } from './spw-reactive-spine.js';
import { initPageUniverse } from './spw-page-universe.js';
import { mountLogo, initLogoRuntime } from './spw-logo-runtime.js';

const isSoftwareRoute = () => /^\/topics\/software\/?$/.test(window.location.pathname);

const resetSoftwareEntryScroll = () => {
    if (!isSoftwareRoute()) return;
    if (window.location.hash) return;

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        if (document.scrollingElement) {
            document.scrollingElement.scrollTop = 0;
            document.scrollingElement.scrollLeft = 0;
        }
    };

    scrollToTop();
    requestAnimationFrame(scrollToTop);
    window.addEventListener('pageshow', scrollToTop, { once: true });
    window.addEventListener('load', scrollToTop, { once: true });
};

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
    const frameContextSelector = '.frame-card, .operator-card, .frame-panel, .mode-panel, .site-figure, .syntax-token, .frame-list a';

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
            if (!shouldUseViewportActivation()) return;

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
        document.addEventListener('spw:settings-change', (event) => {
            if (event.detail?.viewportActivation === 'on') {
                scheduleViewportSync();
            }
        });
    }

    if (!activateFromHash() && frames[0]) {
        activateFrame(frames[0], { source: 'init', force: true });
    }

    window.addEventListener('hashchange', activateFromHash);
};

const initBraceWalls = () => {
    const humanizeToken = (value = '') => value.replace(/-/g, ' ');

    const readOperatorVar = (opType, suffix, fallback) => {
        const styles = getComputedStyle(document.documentElement);
        return (
            styles.getPropertyValue(`--op-${opType}-${suffix}`).trim()
            || styles.getPropertyValue(`--op-frame-${suffix}`).trim()
            || fallback
        );
    };

    const getIndicatorText = (frame, opType = 'frame') => {
        const parts = [opType];
        const role = frame?.dataset.spwRole;
        const liminality = frame?.dataset.spwLiminality;
        const selection = frame?.dataset.spwSelection;

        if (role && role !== 'context') {
            parts.push(humanizeToken(role));
        } else if (liminality && liminality !== 'settled' && liminality !== 'ambient') {
            parts.push(humanizeToken(liminality));
        }

        if (selection && !['ambient', 'addressable'].includes(selection)) {
            parts.push(humanizeToken(selection));
        }

        return parts.join(' · ');
    };

    const applyOpColor = (opType = 'frame', frame = null) => {
        const root = document.documentElement;
        root.style.setProperty('--active-op-color', readOperatorVar(opType, 'color', 'hsl(180 100% 28%)'));
        root.style.setProperty('--active-op-border', readOperatorVar(opType, 'border', 'rgba(0,128,128,0.34)'));
        const slot = document.querySelector('[data-header-op-slot]');
        if (slot) slot.textContent = getIndicatorText(frame, opType);
    };

    document.addEventListener('spw:frame-change', (e) => applyOpColor(e.detail?.opType, e.detail?.frame));
    document.documentElement.dataset.spwBraceAxis = 'objective-subjective';

    const objectiveWall = document.createElement('div');
    objectiveWall.className = 'spw-objective-wall spw-boon-wall';
    objectiveWall.setAttribute('aria-hidden', 'true');
    objectiveWall.innerHTML = `
        <span class="spw-objective-wall-char spw-boon-wall-char">{</span>
        <span class="spw-objective-label">objective</span>
    `;
    document.body.appendChild(objectiveWall);

    const subjectiveWall = document.createElement('div');
    subjectiveWall.className = 'spw-subjective-wall spw-bane-wall';
    subjectiveWall.setAttribute('aria-hidden', 'true');
    subjectiveWall.innerHTML = `
        <span class="spw-subjective-wall-char spw-bane-wall-char">}</span>
        <span class="spw-subjective-label spw-bane-label">subjective</span>
        <div class="spw-subjective-scroll-track spw-bane-scroll-track">
            <div class="spw-subjective-scroll-thumb spw-bane-scroll-thumb" data-spw-scroll-thumb></div>
        </div>
    `;
    document.body.appendChild(subjectiveWall);

    // Scroll tracking
    const thumb = subjectiveWall.querySelector('[data-spw-scroll-thumb]');
    const track = subjectiveWall.querySelector('.spw-subjective-scroll-track');
    const updateScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) { track.style.display = 'none'; return; }
        track.style.display = '';
        thumb.style.height = `${Math.min(100, (window.scrollY / max) * 100)}%`;
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    applyOpColor(window.spwInterface?.getActiveFrame?.() ? getFrameMeta(window.spwInterface.getActiveFrame()).opType : 'frame', window.spwInterface?.getActiveFrame?.() || null);
    updateScroll();
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

    if (features.has('rpg-gameplay')) {
        loads.push(loadFeature('./rpg-wednesday.js', 'initRpgWednesday'));
    }

    if (features.has('media-publishing') || document.querySelector('[data-media-focus], [data-media-collection]')) {
        loads.push(loadFeature('./media-publishing.js', 'initMediaPublishing'));
    }

    if (features.has('blog-interpreter') || document.querySelector('[data-blog-interpreter]')) {
        loads.push(loadFeature('./blog-interpreter.js', 'initBlogInterpreter'));
    }

    if (document.querySelector('[data-spw-surface="recipes"]')) {
        loads.push(loadFeature('./recipe-semantics.js', 'initRecipeSemantics'));
    }

    loads.push(loadFeature('./spw-pretext-presets.js', 'initPretextPresets'));

    await Promise.all(loads);
    await loadFeature('./spw-component-semantics.js', 'initSpwComponentSemantics');

    const activeFrame = window.spwInterface?.getActiveFrame?.();
    if (activeFrame) {
        emitSpwEvent('frame-change', {
            ...getFrameMeta(activeFrame),
            frame: activeFrame,
            source: 'semantics'
        });
    }
};

const initSpiritSequenceEasterEgg = () => {
    const SPIRIT_SEQUENCE = ['?', '~', '@', '&', '*', '^'];
    const SPIRIT_COLORS = [
        'hsl(268 55% 42%)',  // ? probe
        'hsl(210 70% 38%)',  // ~ ref
        'hsl(180 100% 22%)', // @ action
        'hsl(160 60% 32%)',  // & stream
        'hsl(36 80% 36%)',   // * object
        'hsl(180 100% 28%)', // ^ frame
    ];

    let buffer = [];
    let resetTimeout = null;

    const isInputFocused = () => {
        const tag = document.activeElement?.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
    };

    const triggerSpiritCycle = () => {
        const objectiveWall = document.querySelector('.spw-objective-wall, .spw-boon-wall');
        const subjectiveWall = document.querySelector('.spw-subjective-wall, .spw-bane-wall');

        // Pulse the perspective walls through operator colors.
        let step = 0;
        const pulse = setInterval(() => {
            const color = SPIRIT_COLORS[step % SPIRIT_COLORS.length];
            document.documentElement.style.setProperty('--active-op-color', color);
            if (objectiveWall) objectiveWall.style.color = color;
            if (subjectiveWall) subjectiveWall.style.color = color;
            step++;
            if (step >= SPIRIT_COLORS.length * 2) {
                clearInterval(pulse);
                if (objectiveWall) objectiveWall.style.color = '';
                if (subjectiveWall) subjectiveWall.style.color = '';
            }
        }, 140);

        // Toast message
        const toast = document.createElement('div');
        toast.className = 'spw-spirit-toast';
        toast.setAttribute('aria-live', 'polite');
        toast.textContent = "You've traced the spirit cycle.";
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('is-visible'));
        setTimeout(() => {
            toast.classList.remove('is-visible');
            toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        }, 2800);
    };

    document.addEventListener('keydown', (e) => {
        if (isInputFocused()) { buffer = []; return; }
        if (e.metaKey || e.ctrlKey || e.altKey) return;

        const key = e.key;
        const expected = SPIRIT_SEQUENCE[buffer.length];
        if (key === expected) {
            buffer.push(key);
            clearTimeout(resetTimeout);
            if (buffer.length === SPIRIT_SEQUENCE.length) {
                buffer = [];
                triggerSpiritCycle();
            } else {
                resetTimeout = setTimeout(() => { buffer = []; }, 3000);
            }
        } else {
            buffer = key === SPIRIT_SEQUENCE[0] ? [key] : [];
            clearTimeout(resetTimeout);
            if (buffer.length) resetTimeout = setTimeout(() => { buffer = []; }, 3000);
        }
    });
};

onDomReady(() => {
    applySiteSettings();
    resetSoftwareEntryScroll();
    initSpwShellDisclosure();
    initSiteCore();
    initBraceWalls();
    initBraceGestures();
    initSpwExperiential();
    initPretextPhysics();
    initSpwStates();
    initSpwPromptUtils();
    initSpwHaptics();
    initSpwGuide();
    initSpwSpells();
    initSpwLattice();
    initSpwCore();
    initSpwSmart();
    initCognitiveSurface();
    initSpwPersonas();
    initSpwSvgFilters();
    initSpwCanvasAccents();
    initBracePivots();
    initSpwGate();
    initSpwImageMetaphysics();
    initSpwVisitation();
    initSpwProjection();
    initSpwStateInspector();
    initSpwBraceActions();
    initTopicDiscovery();
    initReactiveSpine();
    initPageUniverse();
    mountLogo('.header-sigil', { href: '/', wordmark: 'Spwashi' });
    initLogoRuntime();
    initSpiritSequenceEasterEgg();
    initSiteSettingsPage();

    initOptionalFeatures().catch((error) => {
        console.error('Failed to initialize optional site features.', error);
    });
});
