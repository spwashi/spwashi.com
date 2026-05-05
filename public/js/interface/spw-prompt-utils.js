import { bus } from '/public/js/spw-bus.js';
import { serializeLatticeToSpw } from '/public/js/spw-lattice.js';
import { getSiteSettings, getSiteSettingModifiers } from '/public/js/site-settings.js';

const DEFAULTS = Object.freeze({
    frameSelector: '.site-frame[data-spw-promptability="visible"]',
    frameCopySelector: '.frame-prompt-copy',
    accentHostSelector: '[data-spw-prompt-host]',
    wonderBlockSelector: '.spw-wonder-block',
    groundedSelector: '[data-spw-grounded="true"]',
    guidedSelector: '[data-spw-guided="true"]',
    titleSelector: 'h1, h2, h3',
    descriptionSelector: 'p',
    maxDescriptionLength: 180,
    maxWonderPreviewLength: 180,
    registryStorageKey: 'spw-grounded-registry',
    promptBundleStorageKey: 'spw-prompt-runtime',
    defaultOperator: '#>',
    defaultPhase: 'neutral',
    defaultRole: 'content',
    promptTargets: Object.freeze({
        spw_context: 'spw_context',
        wonder_prompt: 'wonder_prompt',
        image_prompt: 'image_prompt',
        midjourney_prompt: 'midjourney_prompt',
        prompt_bundle_json: 'prompt_bundle_json',
        frame_seed_bundle: 'frame_seed_bundle',
    }),
});

const PERSONA_DESCRIPTORS = Object.freeze({
    viewer: [
        'clean geometric clarity',
        'mathematical harmony',
        'subtle cyan lighting',
        'paper-like textures',
    ],
    doodler: [
        'expressive ink washes',
        'vibrant chromatic shifts',
        'hand-drawn lattices',
        'fluid blooming flows',
    ],
    scribe: [
        'dense technical blueprints',
        'precise architectural lines',
        'cyanotype aesthetic',
        'data-rich overlays',
    ],
});

const PRESET_ALIASES = Object.freeze({
    calm: 'hearth',
    rich: 'loom',
    developer: 'workshop',
    accessible: 'access',
    hearth: 'hearth',
    loom: 'loom',
    workshop: 'workshop',
    access: 'access',
});

const CLIMATE_TO_PROMPT_BIAS = Object.freeze({
    orient: ['orientation', 'entry', 'noticing'],
    anchor: ['naming', 'stability', 'constraint'],
    weave: ['comparison', 'relation', 'mapping'],
    rehearse: ['practice', 'variation', 'retrieval'],
    offer: ['publication', 'teaching', 'clarity'],
});

const PROMPT_QUERY_TARGET_ALIASES = Object.freeze({
    context: 'spw_context',
    seed: 'spw_context',
    prompt: 'wonder_prompt',
    wonder: 'wonder_prompt',
    image: 'image_prompt',
    midjourney: 'midjourney_prompt',
    bundle: 'frame_seed_bundle',
    json: 'prompt_bundle_json',
});

const PROMPT_QUERY_GENERATOR_ALIASES = Object.freeze({
    generic: 'generic',
    image: 'generic',
    midjourney: 'midjourney',
    chatgpt: 'chatgpt-images',
    'chatgpt-images': 'chatgpt-images',
    'chatgpt-image': 'chatgpt-images',
    'gpt-image': 'chatgpt-images',
    'gpt-image-1.5': 'chatgpt-images',
    'gpt-image-2': 'chatgpt-images',
    gemini: 'gemini',
    firefly: 'firefly',
    ideogram: 'ideogram',
});

const PROMPT_QUERY_GENERATOR_LABELS = Object.freeze({
    generic: 'image generators',
    midjourney: 'Midjourney',
    'chatgpt-images': 'ChatGPT Images',
    gemini: 'Gemini',
    firefly: 'Adobe Firefly',
    ideogram: 'Ideogram',
});

function createPromptRuntime(options = {}) {
    const config = { ...DEFAULTS, ...options };

    return {
        config,
        serializers: new Map(),
        signalProviders: new Map(),
        normalizers: [],
        cleanup: [],
    };
}

export function initSpwPromptUtils(options = {}) {
    const runtime = createPromptRuntime(options);

    registerDefaultSignalProviders(runtime);
    registerDefaultNormalizers(runtime);
    registerDefaultSerializers(runtime);

    initFrameCopyButtons(runtime);
    initWonderBlocks(runtime);
    attachBus(runtime);

    const api = {
        registerSignalProvider(name, fn) {
            runtime.signalProviders.set(name, fn);
        },
        registerNormalizer(fn) {
            runtime.normalizers.push(fn);
        },
        registerSerializer(name, fn) {
            runtime.serializers.set(name, fn);
        },
        collect(source = {}) {
            return collectPromptContext(runtime, source);
        },
        serialize(target, source = {}) {
            return serializePrompt(runtime, target, source);
        },
        refreshBlocks() {
            refreshWonderBlocks(runtime);
        },
        getTargets() {
            return { ...runtime.config.promptTargets };
        },
        destroy() {
            runtime.cleanup.forEach((fn) => {
                try {
                    fn?.();
                } catch (error) {
                    console.warn('[PromptUtils] Cleanup failed.', error);
                }
            });
        },
    };

    window.spwPromptUtils = api;
    return () => api.destroy();
}

/* ==========================================================================
   Registration
   ========================================================================== */

function registerDefaultSignalProviders(runtime) {
    runtime.signalProviders.set('settings', () => {
        const settings = getSiteSettings();
        const modifiers = getSiteSettingModifiers(settings);

        return {
            settings,
            modifiers,
            preset: {
                active: normalizePresetAlias(
                    document.querySelector('[data-preset].is-applied')?.dataset.preset
                    || document.body.dataset.spwPreset
                    || null
                ),
            },
        };
    });

    runtime.signalProviders.set('route', () => {
        return {
            route: {
                path: window.location.pathname,
                hash: window.location.hash,
                surface: document.body.dataset.spwSurface || 'site',
            },
        };
    });

    runtime.signalProviders.set('prompt-query', (_, source, config) => {
        return {
            promptQuery: readPromptQuery(window.location.search, config.promptTargets),
        };
    });

    runtime.signalProviders.set('rhythm', () => {
        return {
            rhythm: {
                phase: document.documentElement.dataset.spwPhase || 'ambient',
                beat: Number(document.documentElement.dataset.spwBeat || 0),
                measure: Number(document.documentElement.dataset.spwMeasure || 0),
                playing: document.documentElement.dataset.spwPlaying === 'on',
            },
        };
    });

    runtime.signalProviders.set('persona', () => {
        return {
            persona: document.body.dataset.spwPersona || 'viewer',
        };
    });

    runtime.signalProviders.set('active-frame', (_, source) => {
        const frameSource =
            source.frame
            || window.spwInterface?.getActiveFrame?.()
            || document.querySelector('.site-frame.is-active-frame');

        if (!frameSource) return { frame: null };

        return {
            frame: frameSource instanceof Element
                ? extractFrameContext(frameSource, runtime.config)
                : frameSource,
        };
    });

    runtime.signalProviders.set('grounded', (_, source, config) => {
        const grounded = Array.from(document.querySelectorAll(config.groundedSelector))
            .map((el) => normalizeText(el.textContent))
            .filter(Boolean);

        return {
            grounded: uniqueList([
                ...grounded,
                ...readGroundedRegistry(config.registryStorageKey),
            ]),
        };
    });

    runtime.signalProviders.set('guidance', (_, source, config) => {
        const guidedNodes = Array.from(document.querySelectorAll(config.guidedSelector));
        const activeGuided = guidedNodes
            .filter((node) => node.closest('.site-frame.is-active-frame') || node.matches('.site-frame.is-active-frame'));

        const reasons = activeGuided
            .map((node) => normalizeText(node.querySelector('.spw-component-meta')?.dataset.spwGuideReason || node.dataset.spwGuideReason || ''))
            .filter(Boolean);

        return {
            guidance: {
                enabled: getSiteSettings().cognitiveHandles === 'on',
                semanticMetadataVisible: getSiteSettings().showSemanticMetadata === 'on',
                guidedCount: guidedNodes.length,
                activeGuidedCount: activeGuided.length,
                reasons: uniqueList(reasons),
            },
        };
    });

    runtime.signalProviders.set('lattice', () => {
        let lattice = '';
        try {
            lattice = serializeLatticeToSpw?.() || '';
        } catch (error) {
            console.warn('[PromptUtils] Lattice serialization failed.', error);
        }
        return { lattice };
    });
}

function registerDefaultNormalizers(runtime) {
    runtime.normalizers.push((context) => {
        const persona = context.persona || 'viewer';
        const settings = context.settings || {};
        const modifiers = context.modifiers || {};
        const climateId = settings.currentDevelopmentalClimate || 'orient';
        const promptQuery = context.promptQuery || {};
        const generator = normalizePromptQueryGenerator(promptQuery.generator);

        return {
            ...context,
            descriptors: PERSONA_DESCRIPTORS[persona] || PERSONA_DESCRIPTORS.viewer,
            climateBias: CLIMATE_TO_PROMPT_BIAS[climateId] || CLIMATE_TO_PROMPT_BIAS.orient,
            promptQuery: {
                ...promptQuery,
                target: normalizePromptTargetName(promptQuery.target, DEFAULTS.promptTargets),
                generator,
                generatorLabel: generator ? PROMPT_QUERY_GENERATOR_LABELS[generator] || '' : '',
                hasOverrides: Boolean(
                    promptQuery.open
                    || promptQuery.host
                    || promptQuery.focus
                    || promptQuery.note
                    || generator
                ),
            },
            semanticMode: {
                density: settings.semanticDensity || 'minimal',
                operatorPresentation: settings.operatorPresentation || 'symbolic',
                metadataVisible: settings.showSemanticMetadata === 'on',
                cognitiveHandles: settings.cognitiveHandles === 'on',
                relationalVisualization: settings.relationalVisualization === 'on',
                enhancementLevel: settings.enhancementLevel || 'minimal',
                infospaceComplexity: settings.infospaceComplexity || 'simple',
            },
            architecturalTone: {
                clarity: modifiers.ecology?.clarity ?? 0,
                pressure: modifiers.ecology?.pressure ?? 0,
                atmosphere: modifiers.ecology?.atmosphere ?? 0,
                resonance: modifiers.ecology?.resonance ?? 0,
                densityFactor: modifiers.semantic?.densityFactor ?? 1,
                enhancementFactor: modifiers.semantic?.enhancementFactor ?? 1,
            },
        };
    });

    runtime.normalizers.push((context) => {
        const frame = context.frame;
        const grounded = Array.isArray(context.grounded) ? context.grounded : [];

        return {
            ...context,
            frameSummary: frame
                ? [frame.title, frame.role, frame.operator, frame.phase].filter(Boolean)
                : [],
            groundedSummary: grounded.length
                ? grounded
                : ['technical wonder', 'interactive systems', 'semantic structures'],
        };
    });
}

function registerDefaultSerializers(runtime) {
    const { promptTargets } = runtime.config;

    runtime.serializers.set(promptTargets.spw_context, (context) => {
        return serializePromptContextToSpw(context);
    });

    runtime.serializers.set(promptTargets.wonder_prompt, (context) => {
        return serializeWonderPrompt(context);
    });

    runtime.serializers.set(promptTargets.image_prompt, (context) => {
        return serializeImagePrompt(context);
    });

    runtime.serializers.set(promptTargets.midjourney_prompt, (context) => {
        return `${serializeImagePrompt(context)}, hyper-detailed, cinematic composition, 8k, --ar 16:9`;
    });

    runtime.serializers.set(promptTargets.prompt_bundle_json, (context) => {
        return JSON.stringify(context, null, 2);
    });

    runtime.serializers.set(promptTargets.frame_seed_bundle, (context) => {
        return serializeFrameSeedBundle(context);
    });
}

/* ==========================================================================
   Frame copy UI
   ========================================================================== */

function initFrameCopyButtons(runtime) {
    document.querySelectorAll(runtime.config.frameSelector).forEach((frame) => {
        if (!frame.id) return;

        const title = normalizeText(frame.querySelector(runtime.config.titleSelector)?.textContent || frame.id || 'frame');
        const mount = frame.querySelector(':scope > .frame-topline, :scope > .frame-heading');
        const instrumentation = new Set(
            (frame.dataset.spwInstrumentation || '')
                .split(/\s+/)
                .map((item) => item.trim())
                .filter(Boolean)
        );
        let btn = frame.querySelector(runtime.config.frameCopySelector);
        if (!(btn instanceof HTMLButtonElement)) {
            btn = document.createElement('button');
            btn.className = 'frame-prompt-copy';
            btn.innerHTML = '<span class="log-op">$</span> copy_seed';
            (mount || frame).appendChild(btn);
        }

        if (btn.dataset.spwPromptCopyBound === 'true') return;

        btn.type = 'button';
        btn.dataset.spwInstrumentation = 'prompt-copy';
        btn.dataset.spwComponent = 'prompt.copy';
        btn.dataset.spwDebugSource = 'spw-prompt-utils';
        btn.dataset.promptTarget = runtime.config.promptTargets.spw_context;
        btn.setAttribute('aria-label', `Copy prompt seed for ${title}`);

        instrumentation.add('prompt-copy');
        frame.dataset.spwInstrumentation = [...instrumentation].join(' ');
        frame.dataset.spwDebugSource ||= 'spw-prompt-utils';

        if (!mount && getComputedStyle(frame).position === 'static') {
            frame.style.position = 'relative';
        }

        btn.dataset.spwPromptCopyBound = 'true';

        btn.addEventListener('click', async (event) => {
            event.stopPropagation();

            const text = serializePrompt(runtime, runtime.config.promptTargets.spw_context, { frame });
            await copyToClipboard(text, btn);

            bus.emit('prompt:copied', {
                target: runtime.config.promptTargets.spw_context,
                frameId: frame.id,
            });
        });
    });
}

/* ==========================================================================
   Wonder blocks
   ========================================================================== */

function initWonderBlocks(runtime) {
    document.querySelectorAll(runtime.config.accentHostSelector).forEach((surface) => {
        const next = surface.nextElementSibling;
        if (next?.matches(runtime.config.wonderBlockSelector)) return;

        const source = resolvePromptSource(surface, runtime.config);
        const promptTitle =
            surface.dataset.spwPromptTitle
            || source.frame?.id
            || source.frame?.title
            || 'prompt_seed';
        const promptTeaser =
            surface.dataset.spwPromptTeaser
            || 'Reveal a route-shaped prompt from this surface.';
        const block = document.createElement('section');
        block.className = 'spw-wonder-block';
        block.dataset.promptBlock = 'wonder';
        block.dataset.spwWonderBlockState = 'idle';
        block.dataset.spwPromptTitle = promptTitle;
        block.dataset.spwPromptTeaser = promptTeaser;

        if (source.frame?.id) {
            block.dataset.promptFrame = source.frame.id;
        }

        if (surface.id) {
            block.dataset.promptHost = surface.id;
        }

        block.innerHTML = `
            <div class="wonder-header">
                <span class="log-op">?</span>
                <span class="wonder-title">${escapeHtml(promptTitle)}</span>
                <div class="wonder-actions">
                    <button type="button" class="wonder-action" data-action="preview" aria-pressed="false">show_seed</button>
                    <button type="button" class="wonder-action" data-target="wonder_prompt">copy_prompt</button>
                    <button type="button" class="wonder-action" data-target="image_prompt">copy_image</button>
                    <button type="button" class="wonder-action" data-target="spw_context">copy_context</button>
                </div>
            </div>
            <div class="wonder-body" data-wonder-text>${escapeHtml(promptTeaser)}</div>
        `;

        surface.after(block);

        applyPromptQueryState(runtime, block);

        const previewButton = block.querySelector('[data-action="preview"]');
        previewButton?.addEventListener('click', () => {
            const expanded = previewButton.getAttribute('aria-pressed') === 'true';
            const nextExpanded = !expanded;

            if (!block.dataset.promptPreviewTarget) {
                block.dataset.promptPreviewTarget = runtime.config.promptTargets.wonder_prompt;
            }

            previewButton.setAttribute('aria-pressed', nextExpanded ? 'true' : 'false');
            block.dataset.spwWonderBlockState = nextExpanded ? 'revealed' : 'idle';
            refreshWonderBlock(runtime, block);
        });

        block.querySelectorAll('[data-target]').forEach((button) => {
            button.addEventListener('click', async () => {
                const target = button.dataset.target;
                const text = serializePrompt(runtime, runtime.config.promptTargets[target] ? runtime.config.promptTargets[target] : target, resolveBlockPromptSource(block, runtime.config));
                await copyToClipboard(text, button);
                block.dataset.promptPreviewTarget = runtime.config.promptTargets[target] ? runtime.config.promptTargets[target] : target;
                block.dataset.spwWonderBlockState = target === 'image_prompt' ? 'expanded' : 'revealed';
                previewButton?.setAttribute('aria-pressed', 'true');
                refreshWonderBlock(runtime, block);

                bus.emit('prompt:copied', { target });
            });
        });
    });

    refreshWonderBlocks(runtime);
}

function refreshWonderBlocks(runtime) {
    document.querySelectorAll(runtime.config.wonderBlockSelector).forEach((block) => {
        refreshWonderBlock(runtime, block);
    });
}

/* ==========================================================================
   Bus integration
   ========================================================================== */

function attachBus(runtime) {
    const refresh = () => refreshWonderBlocks(runtime);

    const offs = [
        bus.on('settings:changed', refresh),
        bus.on('frame:activated', refresh),
        bus.on('operator:phased', refresh),
        bus.on('development:shifted', refresh),
        bus.on('spirit:shifted', refresh),
        bus.on('rhythm:phase', refresh),
        bus.on('rhythm:pulse', refresh),
        bus.on('spell:grounded', refresh),
        bus.on('lattice:cycled', refresh),
        bus.on('gate:unlocked', refresh),
    ];

    runtime.cleanup.push(...offs);
}

/* ==========================================================================
   Collection + serialization
   ========================================================================== */

function collectPromptContext(runtime, source = {}) {
    let context = {};

    runtime.signalProviders.forEach((provider, name) => {
        try {
            Object.assign(context, provider(runtime, source, runtime.config) || {});
        } catch (error) {
            console.warn(`[PromptUtils] Signal provider "${name}" failed.`, error);
        }
    });

    runtime.normalizers.forEach((normalize) => {
        try {
            context = normalize(context, runtime, source) || context;
        } catch (error) {
            console.warn('[PromptUtils] Normalizer failed.', error);
        }
    });

    return context;
}

function serializePrompt(runtime, target, source = {}) {
    const serializer = runtime.serializers.get(target);
    if (typeof serializer !== 'function') {
        throw new Error(`No serializer registered for target "${target}"`);
    }

    const context = collectPromptContext(runtime, source);
    const result = serializer(context, runtime, source);

    bus.emit('prompt:serialized', {
        target,
        hasFrame: Boolean(context.frame),
        route: context.route?.path || '',
        climate: context.settings?.currentDevelopmentalClimate || '',
    });

    return result;
}

/* ==========================================================================
   Serializers
   ========================================================================== */

function serializePromptContextToSpw(context) {
    const frame = context.frame;
    const settings = context.settings || {};
    const rhythm = context.rhythm || {};
    const guidance = context.guidance || {};
    const promptQuery = context.promptQuery || {};

    const title = frame?.title || 'untitled';
    const id = frame?.id || 'surface';
    const operator = frame?.operator || '#>';
    const role = frame?.role || 'content';
    const phase = frame?.phase || 'neutral';

    let out = `${operator}${id}\n`;
    out += `#:layer #!${role}\n`;
    out += `#:phase .${phase}\n\n`;

    out += `^"${escapeString(title)}"{\n`;
    if (frame?.description) out += `  summary: "${escapeString(frame.description)}"\n`;
    if (frame?.url) out += `  url: "${escapeString(frame.url)}"\n`;
    if (context.route?.path) out += `  route: "${escapeString(context.route.path)}"\n`;
    out += `  surface: "${escapeString(context.route?.surface || 'site')}"\n`;
    out += `  climate: "${escapeString(settings.currentDevelopmentalClimate || 'orient')}"\n`;
    out += `  semantic_density: "${escapeString(settings.semanticDensity || 'minimal')}"\n`;
    out += `  operator_presentation: "${escapeString(settings.operatorPresentation || 'symbolic')}"\n`;
    out += `  rhythm_phase: "${escapeString(rhythm.phase || 'ambient')}"\n`;
    out += `  rhythm_beat: ${Number(rhythm.beat || 0)}\n`;
    out += `}\n\n`;

    if (guidance.enabled || guidance.activeGuidedCount > 0) {
        out += `^"guidance"{\n`;
        out += `  enabled: ${guidance.enabled ? 'true' : 'false'}\n`;
        out += `  semantic_metadata_visible: ${guidance.semanticMetadataVisible ? 'true' : 'false'}\n`;
        out += `  active_guided_count: ${Number(guidance.activeGuidedCount || 0)}\n`;
        if (guidance.reasons?.length) {
            out += `  reasons: ${JSON.stringify(guidance.reasons)}\n`;
        }
        out += `}\n\n`;
    }

    if (context.grounded?.length) {
        out += `^"consideration_register"{\n`;
        out += `  grounded_concepts: ${JSON.stringify(context.grounded)}\n`;
        out += `}\n\n`;
    }

    if (context.lattice) {
        out += `${context.lattice}\n`;
    }

    if (promptQuery.hasOverrides) {
        out += `\n^"prompt_link"{\n`;
        out += `  target: "${escapeString(promptQuery.target || 'wonder_prompt')}"\n`;
        if (promptQuery.host) out += `  host: "${escapeString(promptQuery.host)}"\n`;
        if (promptQuery.generatorLabel) out += `  generator: "${escapeString(promptQuery.generatorLabel)}"\n`;
        if (promptQuery.focus) out += `  focus: "${escapeString(promptQuery.focus)}"\n`;
        if (promptQuery.note) out += `  note: "${escapeString(promptQuery.note)}"\n`;
        out += `}\n`;
    }

    return out.trim();
}

function serializeWonderPrompt(context) {
    const promptQuery = context.promptQuery || {};
    const subject = context.groundedSummary.join(', ');
    const descriptors = context.descriptors.join(', ');
    const climateBias = context.climateBias.join(', ');
    const frameText = context.frame?.title
        ? `active frame emphasis on ${context.frame.title}`
        : 'distributed frame emphasis';
    const semanticText = [
        `${context.semanticMode.density} semantic density`,
        `${context.semanticMode.operatorPresentation} operator presentation`,
        context.semanticMode.metadataVisible ? 'visible semantic metadata' : 'implicit semantic metadata',
        context.semanticMode.cognitiveHandles ? 'guided cognitive handles' : 'quiet cognitive handles',
    ].join(', ');

    const rhythmText = context.rhythm.playing
        ? `rhythmic state, phase ${context.rhythm.phase}, beat ${context.rhythm.beat}, measure ${context.rhythm.measure}`
        : `resting state, phase ${context.rhythm.phase}`;

    return [
        `Concept collage of ${subject}`,
        descriptors,
        climateBias,
        semanticText,
        rhythmText,
        frameText,
        promptQuery.focus ? `focus on ${promptQuery.focus}` : null,
        promptQuery.note ? `preserve ${promptQuery.note}` : null,
        'materially rich interface thinking',
        'technical art',
        'diagrammatic atmosphere',
    ].filter(Boolean).join(', ');
}

function serializeImagePrompt(context) {
    const wonder = serializeWonderPrompt(context);
    const tone = context.architecturalTone || {};
    const densityWord =
        tone.densityFactor > 1.05 ? 'layered'
        : tone.densityFactor < 0.95 ? 'clear'
        : 'balanced';

    return [
        wonder,
        `${densityWord} composition`,
        `clarity ${round2(tone.clarity || 0)}`,
        `atmosphere ${round2(tone.atmosphere || 0)}`,
        `resonance ${round2(tone.resonance || 0)}`,
        'high detail',
    ].join(', ');
}

function serializeFrameSeedBundle(context) {
    return [
        serializePromptContextToSpw(context),
        '',
        '/* prompt bundle */',
        JSON.stringify({
            route: context.route,
            settings: {
                currentDevelopmentalClimate: context.settings?.currentDevelopmentalClimate,
                semanticDensity: context.settings?.semanticDensity,
                operatorPresentation: context.settings?.operatorPresentation,
                enhancementLevel: context.settings?.enhancementLevel,
            },
            rhythm: context.rhythm,
            descriptors: context.descriptors,
            grounded: context.grounded,
        }, null, 2),
    ].join('\n');
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function extractFrameContext(frame, config) {
    const title = normalizeText(frame.querySelector(config.titleSelector)?.textContent || 'untitled');
    const description = truncateText(
        normalizeText(frame.querySelector(config.descriptionSelector)?.textContent || ''),
        config.maxDescriptionLength
    );

    return {
        id: frame.id || '',
        operator: frame.dataset.spwOperator || config.defaultOperator,
        phase: frame.dataset.spwPhase || config.defaultPhase,
        role: frame.dataset.spwRole || config.defaultRole,
        title,
        description,
        url: `${window.location.origin}${window.location.pathname}${frame.id ? `#${frame.id}` : ''}`,
    };
}

function resolvePromptSource(node, config) {
    const surface = node instanceof Element ? node : null;
    const frameEl = surface?.closest('.site-frame');

    return {
        frame: frameEl ? extractFrameContext(frameEl, config) : null,
        surface,
    };
}

function resolveBlockPromptSource(block, config) {
    if (!(block instanceof Element)) return {};

    const frameId = block.dataset.promptFrame || '';
    const hostId = block.dataset.promptHost || '';
    const frameEl = frameId ? document.getElementById(frameId) : block.closest('.site-frame');
    const hostEl = hostId ? document.getElementById(hostId) : null;

    return {
        frame: frameEl ? extractFrameContext(frameEl, config) : null,
        surface: hostEl || null,
    };
}

function refreshWonderBlock(runtime, block) {
    if (!(block instanceof Element)) return;

    const state = block.dataset.spwWonderBlockState || 'idle';
    const source = resolveBlockPromptSource(block, runtime.config);
    const context = collectPromptContext(runtime, source);
    const previewTarget = getWonderPreviewTarget(block, runtime);
    const serializer = runtime.serializers.get(previewTarget);
    const livePreview = truncateText(
        typeof serializer === 'function' ? serializer(context, runtime, source) : '',
        runtime.config.maxWonderPreviewLength
    );
    const teaser = buildWonderTeaser(block, context);
    const body = block.querySelector('[data-wonder-text]');

    if (body) {
        body.textContent = state === 'idle' ? teaser : (livePreview || teaser);
    }
}

function applyPromptQueryState(runtime, block) {
    const query = readPromptQuery(window.location.search, runtime.config.promptTargets);
    if (!query.open || !isWonderBlockTargeted(block, query)) return;

    block.dataset.promptPreviewTarget = query.target || runtime.config.promptTargets.wonder_prompt;
    block.dataset.spwWonderBlockState =
        block.dataset.promptPreviewTarget === runtime.config.promptTargets.spw_context
        || block.dataset.promptPreviewTarget === runtime.config.promptTargets.wonder_prompt
            ? 'revealed'
            : 'expanded';

    block.querySelector('[data-action="preview"]')?.setAttribute('aria-pressed', 'true');
}

function buildWonderTeaser(block, context) {
    const teaser = block.dataset.spwPromptTeaser || 'Reveal a route-shaped prompt from this surface.';
    const promptQuery = context.promptQuery || {};
    const details = [
        promptQuery.focus ? `focus: ${promptQuery.focus}` : '',
        promptQuery.generatorLabel ? `generator: ${promptQuery.generatorLabel}` : '',
        promptQuery.note ? `note: ${promptQuery.note}` : '',
    ].filter(Boolean);

    return details.length ? `${teaser} ${details.join(' • ')}` : teaser;
}

function getWonderPreviewTarget(block, runtime) {
    return normalizePromptTargetName(
        block?.dataset?.promptPreviewTarget || runtime.config.promptTargets.wonder_prompt,
        runtime.config.promptTargets
    );
}

function isWonderBlockTargeted(block, query) {
    if (!(block instanceof Element)) return false;
    if (!query.host) return true;

    return [block.dataset.promptHost, block.dataset.promptFrame]
        .map((value) => normalizeText(value))
        .filter(Boolean)
        .includes(normalizeText(query.host));
}

function readPromptQuery(search = '', promptTargets = DEFAULTS.promptTargets) {
    const params = new URLSearchParams(search || '');
    const target = normalizePromptTargetName(params.get('spw_prompt_target'), promptTargets);

    return {
        open: isTruthyQueryValue(params.get('spw_prompt_open')),
        host: normalizePromptQueryText(params.get('spw_prompt_host'), 96),
        target,
        focus: normalizePromptQueryText(params.get('spw_prompt_focus'), 160),
        note: normalizePromptQueryText(params.get('spw_prompt_note'), 180),
        generator: normalizePromptQueryGenerator(params.get('spw_prompt_generator')),
    };
}

function normalizePromptTargetName(value, promptTargets = DEFAULTS.promptTargets) {
    if (!value) return promptTargets.wonder_prompt;

    const raw = normalizeText(value).toLowerCase();
    const normalized = PROMPT_QUERY_TARGET_ALIASES[raw] || raw;

    if (promptTargets[normalized]) return promptTargets[normalized];
    if (Object.values(promptTargets).includes(normalized)) return normalized;
    return promptTargets.wonder_prompt;
}

function normalizePromptQueryGenerator(value) {
    if (!value) return '';
    return PROMPT_QUERY_GENERATOR_ALIASES[normalizeText(value).toLowerCase()] || '';
}

function normalizePromptQueryText(value, max = 120) {
    return normalizeText(value || '').slice(0, max);
}

function isTruthyQueryValue(value) {
    return ['1', 'true', 'open', 'yes', 'on'].includes(normalizeText(value).toLowerCase());
}

function normalizePresetAlias(name) {
    if (!name) return null;
    return PRESET_ALIASES[name] || name;
}

function readGroundedRegistry(storageKey) {
    try {
        const raw = localStorage.getItem(storageKey);
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? uniqueList(parsed) : [];
    } catch {
        return [];
    }
}

function normalizeText(value = '') {
    return String(value).replace(/\s+/g, ' ').trim();
}

function truncateText(value = '', max = 160) {
    const text = normalizeText(value);
    return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
}

function uniqueList(values = []) {
    return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function escapeString(value = '') {
    return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function round2(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

async function copyToClipboard(text, btn) {
    const { handleCopyButton } = await import('/public/js/spw-copy.js');
    const original = btn.innerHTML;

    await handleCopyButton({
        text,
        button: btn,
        labelCopied: '<span class="log-op">✓</span> copied',
        labelFailed: '<span class="log-op">!</span> copy',
        labelDefault: original,
    });
}
