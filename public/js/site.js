import {
    emitSpwEvent,
    getFrameMeta,
    getRequestedFeatures,
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
import { initAttnRegister } from './attn-register.js';

const isSoftwareRoute = () => /^\/topics\/software\/?$/.test(window.location.pathname);

/* ==========================================================================
   Module registry
   --------------------------------------------------------------------------
   Purpose
   - Track which modules are still legacy init modules and which later adopt
     a normalized registration API.
   - Record layer / scope / mindfulness metadata for future layered
     integration, local enhancement, and model-guided site awareness.
   ========================================================================== */

const createModuleRegistry = () => {
    const records = new Map();

    const normalizeMindfulness = (input = {}) => ({
        level: input.level || 'local',
        broaderPatterns: new Set(input.broaderPatterns || [])
    });

    const toSerializable = (record) => ({
        ...record,
        mindfulness: {
            ...record.mindfulness,
            broaderPatterns: [...record.mindfulness.broaderPatterns]
        },
        cleanup: undefined
    });

    const ensure = (definition) => {
        const existing = records.get(definition.id);
        if (existing) return existing;

        const record = {
            id: definition.id,
            label: definition.label || definition.id,
            api: definition.api || 'legacy-init',
            layer: definition.layer || 'misc',
            scope: definition.scope || 'site',
            optional: Boolean(definition.optional),
            status: 'registered',
            mindfulness: normalizeMindfulness(definition.mindfulness),
            source: definition.source || 'site.js',
            notes: definition.notes || '',
            cleanup: null,
            error: null,
            mountedAt: null
        };

        records.set(record.id, record);
        return record;
    };

    const register = (definition) => {
        const record = ensure(definition);
        record.label = definition.label || record.label;
        record.api = definition.api || record.api;
        record.layer = definition.layer || record.layer;
        record.scope = definition.scope || record.scope;
        record.optional = definition.optional ?? record.optional;
        record.source = definition.source || record.source;
        record.notes = definition.notes || record.notes;

        const nextMindfulness = normalizeMindfulness(definition.mindfulness || record.mindfulness);
        record.mindfulness.level = nextMindfulness.level;
        record.mindfulness.broaderPatterns = nextMindfulness.broaderPatterns;

        return record;
    };

    const markMounted = (id, cleanup = null) => {
        const record = records.get(id);
        if (!record) return;
        record.status = 'mounted';
        record.error = null;
        record.cleanup = typeof cleanup === 'function' ? cleanup : null;
        record.mountedAt = Date.now();
    };

    const markSkipped = (id, reason = 'condition-false') => {
        const record = records.get(id);
        if (!record) return;
        record.status = 'skipped';
        record.error = reason;
    };

    const markFailed = (id, error) => {
        const record = records.get(id);
        if (!record) return;
        record.status = 'failed';
        record.error = error instanceof Error ? error.message : String(error);
    };

    const setMindfulness = (id, update = {}) => {
        const record = records.get(id);
        if (!record) return null;

        if (update.level) {
            record.mindfulness.level = update.level;
        }
        if (Array.isArray(update.addPatterns)) {
            update.addPatterns.forEach((pattern) => record.mindfulness.broaderPatterns.add(pattern));
        }
        if (Array.isArray(update.removePatterns)) {
            update.removePatterns.forEach((pattern) => record.mindfulness.broaderPatterns.delete(pattern));
        }

        return toSerializable(record);
    };

    const snapshot = () => [...records.values()].map(toSerializable);

    const getByLayer = (layer) => snapshot().filter((item) => item.layer === layer);

    const destroyMounted = () => {
        [...records.values()].forEach((record) => {
            if (typeof record.cleanup === 'function') {
                try {
                    record.cleanup();
                } catch (error) {
                    console.warn(`Cleanup failed for module "${record.id}".`, error);
                }
            }
        });
    };

    const api = {
        register,
        markMounted,
        markSkipped,
        markFailed,
        setMindfulness,
        snapshot,
        getByLayer,
        destroyMounted
    };

    window.spwModules = api;
    return api;
};

/* ==========================================================================
   Boot context + helpers
   ========================================================================== */

const createBootContext = (registry) => {
    const html = document.documentElement;
    const body = document.body;
    const requestedFeatures = getRequestedFeatures();

    const blogSurface = document.querySelector('[data-spw-surface="blog"]');
    const blogRoot = blogSurface || document;

    return {
        html,
        body,
        registry,
        requestedFeatures,
        roots: {
            document,
            body,
            blog: blogRoot
        },
        flags: {
            enhance: html.dataset.spwEnhance !== 'off',
            filters: html.dataset.spwFilters !== 'off',
            charge: html.dataset.spwCharge !== 'off',
            reduceMotion: html.dataset.spwReduceMotion === 'on'
        },
        route: {
            path: window.location.pathname,
            hash: window.location.hash,
            isSoftware: isSoftwareRoute(),
            isBlog: Boolean(blogSurface),
            isRecipes: Boolean(document.querySelector('[data-spw-surface="recipes"]'))
        }
    };
};

const safeMountModule = (definition, boot, mount) => {
    boot.registry.register(definition);

    try {
        const cleanup = mount();
        boot.registry.markMounted(definition.id, cleanup);
        return cleanup;
    } catch (error) {
        boot.registry.markFailed(definition.id, error);

        if (definition.optional) {
            console.warn(`Optional module "${definition.id}" failed to initialize.`, error);
            return null;
        }

        throw error;
    }
};

const mountStaticModules = (boot, definitions) => {
    definitions.forEach((definition) => {
        safeMountModule(definition, boot, definition.mount);
    });
};

const loadAndMountFeatureModule = async (definition, boot) => {
    boot.registry.register(definition);

    if (typeof definition.when === 'function' && !definition.when(boot)) {
        boot.registry.markSkipped(definition.id);
        return;
    }

    try {
        const imported = await import(definition.path);

        if (imported?.spwModule && typeof imported.spwModule.mount === 'function') {
            const normalized = imported.spwModule;
            boot.registry.register({
                ...definition,
                api: 'registered',
                layer: normalized.layer || definition.layer,
                scope: normalized.scope || definition.scope,
                mindfulness: normalized.mindfulness || definition.mindfulness
            });

            const cleanup = await normalized.mount(boot);
            boot.registry.markMounted(definition.id, cleanup);
            return;
        }

        const initFn = imported?.[definition.exportName];
        if (typeof initFn !== 'function') {
            throw new Error(`Expected export "${definition.exportName}" in ${definition.path}`);
        }

        const cleanup = await initFn();
        boot.registry.markMounted(definition.id, cleanup);
    } catch (error) {
        boot.registry.markFailed(definition.id, error);

        if (definition.optional) {
            console.warn(`Optional feature "${definition.id}" failed to initialize.`, error);
            return;
        }

        throw error;
    }
};

/* ==========================================================================
   Existing helper behavior
   ========================================================================== */

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

    const thumb = subjectiveWall.querySelector('[data-spw-scroll-thumb]');
    const track = subjectiveWall.querySelector('.spw-subjective-scroll-track');
    const updateScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) { track.style.display = 'none'; return; }
        track.style.display = '';
        thumb.style.height = `${Math.min(100, (window.scrollY / max) * 100)}%`;
    };

    window.addEventListener('scroll', updateScroll, { passive: true });
    applyOpColor(
        window.spwInterface?.getActiveFrame?.()
            ? getFrameMeta(window.spwInterface.getActiveFrame()).opType
            : 'frame',
        window.spwInterface?.getActiveFrame?.() || null
    );
    updateScroll();
};

const initSpiritSequenceEasterEgg = () => {
    const SPIRIT_SEQUENCE = ['?', '~', '@', '&', '*', '^'];
    const SPIRIT_COLORS = [
        'hsl(268 55% 42%)',
        'hsl(210 70% 38%)',
        'hsl(180 100% 22%)',
        'hsl(160 60% 32%)',
        'hsl(36 80% 36%)',
        'hsl(180 100% 28%)',
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
            if (buffer.length) {
                resetTimeout = setTimeout(() => { buffer = []; }, 3000);
            }
        }
    });
};

/* ==========================================================================
   Boot manifests
   ========================================================================== */

const CORE_MODULES = [
    {
        id: 'shell-disclosure',
        label: 'Shell disclosure',
        api: 'legacy-init',
        layer: 'shell',
        scope: 'site',
        mindfulness: {
            level: 'site',
            broaderPatterns: ['shell', 'disclosure']
        },
        mount: () => initSpwShellDisclosure()
    },
    {
        id: 'site-core',
        label: 'Site core',
        api: 'legacy-init',
        layer: 'core',
        scope: 'site',
        mindfulness: {
            level: 'site',
            broaderPatterns: ['frame', 'mode-switch', 'hash', 'viewport']
        },
        mount: () => initSiteCore()
    },
    {
        id: 'brace-walls',
        label: 'Brace walls',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: {
            level: 'pattern-aware',
            broaderPatterns: ['frame', 'header-indicator', 'scroll']
        },
        mount: () => initBraceWalls()
    },
    {
        id: 'brace-gestures',
        label: 'Brace gestures',
        api: 'legacy-init',
        layer: 'interaction',
        scope: 'site',
        mindfulness: {
            level: 'site',
            broaderPatterns: ['gesture', 'bus', 'brace']
        },
        mount: () => initBraceGestures()
    },
    {
        id: 'spw-experiential',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['experience'] },
        mount: () => initSpwExperiential()
    },
    {
        id: 'pretext-physics',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['pretext', 'layout'] },
        mount: () => initPretextPhysics()
    },
    {
        id: 'spw-states',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['state'] },
        mount: () => initSpwStates()
    },
    {
        id: 'spw-prompt-utils',
        api: 'legacy-init',
        layer: 'utility',
        scope: 'site',
        mindfulness: { level: 'local', broaderPatterns: ['prompt'] },
        mount: () => initSpwPromptUtils()
    },
    {
        id: 'spw-haptics',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['touch', 'haptics'] },
        mount: () => initSpwHaptics()
    },
    {
        id: 'spw-guide',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['guide'] },
        mount: () => initSpwGuide()
    },
    {
        id: 'spw-spells',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['spells'] },
        mount: () => initSpwSpells()
    },
    {
        id: 'spw-lattice',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['lattice'] },
        mount: () => initSpwLattice()
    },
    {
        id: 'spw-core',
        api: 'legacy-init',
        layer: 'core',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['core'] },
        mount: () => initSpwCore()
    },
    {
        id: 'spw-smart',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['smart-behavior'] },
        mount: () => initSpwSmart()
    },
    {
        id: 'cognitive-surface',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['cognitive-surface'] },
        mount: () => initCognitiveSurface()
    },
    {
        id: 'spw-personas',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['persona'] },
        mount: () => initSpwPersonas()
    },
    {
        id: 'spw-svg-filters',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'local', broaderPatterns: ['filters'] },
        mount: () => initSpwSvgFilters()
    },
    {
        id: 'spw-canvas-accents',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'local', broaderPatterns: ['canvas', 'ornament'] },
        mount: () => initSpwCanvasAccents()
    },
    {
        id: 'brace-pivots',
        api: 'legacy-init',
        layer: 'interaction',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['brace', 'pivot'] },
        mount: () => initBracePivots()
    },
    {
        id: 'spw-gate',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'local', broaderPatterns: ['gate'] },
        mount: () => initSpwGate()
    },
    {
        id: 'spw-image-metaphysics',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['image', 'metaphysics'] },
        mount: () => initSpwImageMetaphysics()
    },
    {
        id: 'spw-visitation',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['visitation'] },
        mount: () => initSpwVisitation()
    },
    {
        id: 'spw-projection',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['projection'] },
        mount: () => initSpwProjection()
    },
    {
        id: 'spw-state-inspector',
        api: 'legacy-init',
        layer: 'utility',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['state', 'inspection'] },
        mount: () => initSpwStateInspector()
    },
    {
        id: 'spw-brace-actions',
        api: 'legacy-init',
        layer: 'interaction',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['brace', 'action'] },
        mount: () => initSpwBraceActions()
    },
    {
        id: 'topic-discovery',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['topic-discovery'] },
        mount: () => initTopicDiscovery()
    },
    {
        id: 'reactive-spine',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['reactive-spine'] },
        mount: () => initReactiveSpine()
    },
    {
        id: 'page-universe',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['page-universe'] },
        mount: () => initPageUniverse()
    },
    {
        id: 'logo-mount',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['logo', 'header'] },
        mount: () => mountLogo('.header-sigil', { href: '/', wordmark: 'Spwashi' })
    },
    {
        id: 'logo-runtime',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['logo', 'runtime'] },
        mount: () => initLogoRuntime()
    },
    {
        id: 'spirit-sequence',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'site',
        mindfulness: { level: 'local', broaderPatterns: ['easter-egg', 'walls'] },
        mount: () => initSpiritSequenceEasterEgg()
    },
    {
        id: 'site-settings-page',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['settings'] },
        mount: () => initSiteSettingsPage()
    },
    {
        id: 'attn-register',
        api: 'legacy-init',
        layer: 'enhancement',
        scope: 'route',
        mindfulness: {
            level: 'pattern-aware',
            broaderPatterns: ['charge', 'theme', 'blog']
        },
        mount: () => initAttnRegister(document.querySelector('[data-spw-surface="blog"]') || document)
    }
];

const OPTIONAL_FEATURES = [
    {
        id: 'spw-operators',
        path: './spw-operators.js',
        exportName: 'initSpwOperators',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'site', broaderPatterns: ['operators'] },
        when: (boot) => boot.requestedFeatures.has('operators')
    },
    {
        id: 'frame-metrics',
        path: './frame-metrics.js',
        exportName: 'initFrameMetrics',
        api: 'legacy-init',
        layer: 'utility',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['metrics', 'frame'] },
        when: (boot) => boot.requestedFeatures.has('metrics')
    },
    {
        id: 'frame-navigator',
        path: './frame-navigator.js',
        exportName: 'initFrameNavigator',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['navigator', 'frame'] },
        when: (boot) => boot.requestedFeatures.has('navigator')
    },
    {
        id: 'spw-console',
        path: './spw-console.js',
        exportName: 'initSpwConsole',
        api: 'legacy-init',
        layer: 'utility',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'local', broaderPatterns: ['console'] },
        when: (boot) => boot.requestedFeatures.has('console')
    },
    {
        id: 'pretext-lab',
        path: './pretext-lab.js',
        exportName: 'initPretextLab',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'route',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['pretext', 'lab'] },
        when: (boot) => boot.requestedFeatures.has('pretext-lab') || Boolean(document.querySelector('#pretext-input'))
    },
    {
        id: 'rpg-wednesday',
        path: './rpg-wednesday.js',
        exportName: 'initRpgWednesday',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'route',
        optional: true,
        mindfulness: { level: 'local', broaderPatterns: ['rpg', 'play'] },
        when: (boot) => boot.requestedFeatures.has('rpg-gameplay')
    },
    {
        id: 'media-publishing',
        path: './media-publishing.js',
        exportName: 'initMediaPublishing',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'route',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['media', 'publishing'] },
        when: (boot) => boot.requestedFeatures.has('media-publishing') || Boolean(document.querySelector('[data-media-focus], [data-media-collection]'))
    },
    {
        id: 'blog-interpreter',
        path: './blog-interpreter.js',
        exportName: 'initBlogInterpreter',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'route',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['blog', 'interpreter', 'tone', 'lens'] },
        when: (boot) => boot.requestedFeatures.has('blog-interpreter') || Boolean(document.querySelector('[data-blog-interpreter]'))
    },
    {
        id: 'recipe-semantics',
        path: './recipe-semantics.js',
        exportName: 'initRecipeSemantics',
        api: 'legacy-init',
        layer: 'surface',
        scope: 'route',
        optional: true,
        mindfulness: { level: 'local', broaderPatterns: ['recipes'] },
        when: (boot) => boot.route.isRecipes
    },
    {
        id: 'spw-pretext-presets',
        path: './spw-pretext-presets.js',
        exportName: 'initPretextPresets',
        api: 'legacy-init',
        layer: 'utility',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'pattern-aware', broaderPatterns: ['pretext', 'presets'] },
        when: () => true
    },
    {
        id: 'spw-component-semantics',
        path: './spw-component-semantics.js',
        exportName: 'initSpwComponentSemantics',
        api: 'legacy-init',
        layer: 'runtime',
        scope: 'site',
        optional: true,
        mindfulness: { level: 'site', broaderPatterns: ['component-semantics'] },
        when: () => true
    }
];

/* ==========================================================================
   Boot stages
   ========================================================================== */

const initPreflightStage = (boot) => {
    applySiteSettings();
    resetSoftwareEntryScroll();

    boot.registry.register({
        id: 'site-settings-apply',
        label: 'Apply site settings',
        api: 'legacy-init',
        layer: 'boot',
        scope: 'site',
        mindfulness: { level: 'site', broaderPatterns: ['settings'] }
    });
    boot.registry.markMounted('site-settings-apply');

    boot.registry.register({
        id: 'software-entry-scroll-reset',
        label: 'Software entry scroll reset',
        api: 'legacy-init',
        layer: 'boot',
        scope: 'route',
        mindfulness: { level: 'local', broaderPatterns: ['route', 'scroll'] }
    });
    boot.registry.markMounted('software-entry-scroll-reset');
};

const initCoreStage = (boot) => {
    mountStaticModules(boot, CORE_MODULES);
};

const initOptionalStage = async (boot) => {
    for (const feature of OPTIONAL_FEATURES) {
        await loadAndMountFeatureModule(feature, boot);
    }

    const activeFrame = window.spwInterface?.getActiveFrame?.();
    if (activeFrame) {
        emitSpwEvent('frame-change', {
            ...getFrameMeta(activeFrame),
            frame: activeFrame,
            source: 'semantics'
        });
    }
};

/* ==========================================================================
   Main boot
   ========================================================================== */

const bootSite = async () => {
    const registry = createModuleRegistry();
    const boot = createBootContext(registry);

    initPreflightStage(boot);
    initCoreStage(boot);
    await initOptionalStage(boot);
};

onDomReady(() => {
    bootSite().catch((error) => {
        console.error('Failed to initialize site runtime.', error);
    });
});