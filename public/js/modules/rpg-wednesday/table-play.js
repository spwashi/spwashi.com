/**
 * Playable clocks, page hooks, and the Spw physics stage for the local kit.
 */

import bus from '/public/js/kernel/bus.js';
import { createElement } from '/public/js/modules/rpg-wednesday/dom.js';
import { composeExpression, projectTablePhysics, readTableRuntime } from '/public/js/modules/rpg-wednesday/table-physics.js';

const shown = (value, fallback) => (value == null || value === '' ? fallback : String(value));

export const gatherTableForce = ({ expression, label, kind, element = null }) => {
    const text = String(expression || '').trim() || 'table[play]{empty}<stage>';
    bus.emit('spell:capture', {
        expression: text,
        label: label || text,
        operator: 'scene',
        context: 'rpg-wednesday',
        origin: 'rpg-wednesday',
        originLabel: 'RPG Wednesday table',
        primedBy: 'table-play',
        wonder: kind || 'table',
        gestureHistory: `table->gather:${kind || 'script'}`,
        element,
    }, { target: document, element });
    return text;
};

export const createClockFace = (clock, onPick) => {
    const face = createElement('div', {
        className: 'rpg-clock-face',
        role: 'group',
        'aria-label': `${clock.name || 'Clock'} progress`,
    });
    const count = createElement('button', {
        type: 'button',
        className: 'rpg-clock-count',
        text: `${clock.progress}/${clock.segments}`,
        'aria-label': `Advance ${clock.name || 'clock'}. ${clock.progress} of ${clock.segments} filled`,
    });
    count.addEventListener('click', () => {
        const next = clock.progress >= clock.segments ? 0 : clock.progress + 1;
        onPick(next);
    });
    face.appendChild(count);
    for (let step = 1; step <= clock.segments; step += 1) {
        const pip = createElement('button', {
            type: 'button',
            className: 'rpg-clock-pip',
            text: String(step),
            'aria-pressed': step <= clock.progress ? 'true' : 'false',
            'aria-label': `Fill ${clock.name || 'clock'} to ${step} of ${clock.segments}`,
        });
        pip.addEventListener('click', () => onPick(step === clock.progress ? step - 1 : step));
        face.appendChild(pip);
    }
    return face;
};

const slug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unnamed';

const readHooks = () => {
    const root = document.querySelector('main') || document.body;
    const skip = root.querySelector('#local-gameplay-kit');
    const seen = new Set();
    const hooks = [];
    const push = (hook) => {
        if (!hook.label || seen.has(hook.expression)) return;
        seen.add(hook.expression);
        hooks.push(hook);
    };

    root.querySelectorAll('[data-spw-living-term], [data-spw-concept]').forEach((node) => {
        if (skip?.contains(node)) return;
        const concept = node.dataset.spwConcept || node.dataset.spwLivingTerm || node.textContent?.trim();
        if (!concept) return;
        push({
            kind: 'concept',
            label: concept,
            expression: `concept[table]{${slug(concept)}}`,
        });
    });

    root.querySelectorAll('img[src]').forEach((image) => {
        if (skip?.contains(image) || hooks.filter((hook) => hook.kind === 'image').length >= 4) return;
        const label = image.getAttribute('alt')?.trim() || 'page image';
        const src = image.currentSrc || image.src;
        push({
            kind: 'image',
            label,
            expression: `image[table]{${slug(label).slice(0, 48)}}`,
            swatch: /^(\/|https?:)/.test(src) && !/[()"']/.test(src) ? src : null,
        });
    });

    const style = getComputedStyle(document.documentElement);
    [
        ['teal', '--teal'],
        ['ink', '--ink'],
        ['accent', '--active-op-color'],
    ].forEach(([name, token]) => {
        const color = style.getPropertyValue(token).trim();
        push({
            kind: 'color',
            label: color ? `${name} ${color}` : name,
            expression: `color[table]{${name}}`,
            swatch: color || null,
        });
    });

    return hooks.slice(0, 12);
};

const paintReadout = (list, physics) => {
    const rows = [
        ['subject', shown(physics.subject, '— empty')],
        ['mode', shown(physics.mode, '— empty')],
        ['parts', physics.parts ? physics.parts.join(' · ') : '— empty'],
        ['projection', shown(physics.projection, '— empty')],
        ['segments', physics.segments == null ? '— fallback 4' : String(physics.segments)],
        ['gravity', physics.gravity == null ? '— empty' : String(physics.gravity)],
        ['hue', physics.hue == null ? '— empty' : `${physics.hue}°`],
        ['tick', shown(physics.tick, '— empty')],
        ['motion', physics.motion == null ? '— runtime unset' : String(physics.motion)],
        ['density', shown(physics.density, '— unset')],
        ['join', shown(physics.join, '— none')],
    ];
    list.replaceChildren(...rows.map(([name, value]) => createElement('div', {}, [
        createElement('dt', { text: name }),
        createElement('dd', { text: value }),
    ])));
    const kit = document.getElementById('local-gameplay-kit');
    if (physics.hue != null) {
        list.style.setProperty('--rpg-physics-hue', String(physics.hue));
        kit?.style.setProperty('--rpg-physics-hue', String(physics.hue));
    } else {
        list.style.removeProperty('--rpg-physics-hue');
        kit?.style.removeProperty('--rpg-physics-hue');
    }
};

export const mountTablePhysics = ({ getScript, setScript, onApplyClock, onStatus }) => {
    const raw = createElement('textarea', {
        className: 'rpg-gameplay-input rpg-table-script',
        rows: 3,
        spellcheck: 'false',
        'aria-label': 'Spw script for table physics',
        placeholder: 'clock[table]{fill.turn.weight}<stage>',
        value: getScript(),
    });
    const subject = createElement('input', { className: 'rpg-gameplay-line-input', 'aria-label': 'Subject' });
    const mode = createElement('input', { className: 'rpg-gameplay-line-input', 'aria-label': 'Mode' });
    const parts = createElement('input', { className: 'rpg-gameplay-line-input', 'aria-label': 'Parts, separated by dots' });
    const projection = createElement('input', { className: 'rpg-gameplay-line-input', 'aria-label': 'Projection' });
    const readout = createElement('dl', { className: 'rpg-physics-readout' });
    const kernel = createElement('p', { className: 'frame-note', text: 'Kernel parser: — not asked yet' });
    const hooks = createElement('div', { className: 'rpg-hook-row', 'aria-label': 'Gather page forces' });
    const apply = createElement('button', { type: 'button', className: 'spw-chip', text: '@ make a clock' });
    const gather = createElement('button', { type: 'button', className: 'spw-chip', text: '~ gather script' });
    let kernelToken = 0;
    let kernelTimer = 0;

    const treeFromScript = () => {
        const physics = projectTablePhysics(getScript(), readTableRuntime());
        if (document.activeElement !== subject) subject.value = physics.subject || '';
        if (document.activeElement !== mode) mode.value = physics.mode || '';
        if (document.activeElement !== parts) parts.value = physics.parts ? physics.parts.join('.') : '';
        if (document.activeElement !== projection) projection.value = physics.projection || '';
        paintReadout(readout, physics);
        apply.disabled = false;
        apply.textContent = physics.segments == null ? '@ clock of 4 (fallback)' : `@ clock of ${physics.segments}`;
        return physics;
    };

    const writeTree = () => {
        const next = composeExpression({
            subject: subject.value,
            mode: mode.value,
            parts: parts.value.split('.'),
            projection: projection.value,
        });
        raw.value = next;
        setScript(next);
        treeFromScript();
        askKernel();
    };

    const askKernel = () => {
        window.clearTimeout(kernelTimer);
        kernelTimer = window.setTimeout(loadKernel, 280);
    };

    const loadKernel = () => {
        const token = kernelToken + 1;
        kernelToken = token;
        const source = getScript();
        if (!source.trim()) {
            kernel.textContent = 'Kernel parser: — empty script, site shape only';
            return;
        }
        import('/public/js/semantic/spw-runtime-parser.js')
            .then((mod) => {
                if (token !== kernelToken) return;
                const parsed = mod.parseSpw(source);
                const kind = parsed?.kernel?.kind || parsed?.join?.kind || null;
                kernel.textContent = kind
                    ? `Kernel parser: ${kind}${parsed.build ? ` · ${parsed.build}` : ''}`
                    : 'Kernel parser: — no join on this line';
            })
            .catch(() => {
                if (token !== kernelToken) return;
                kernel.textContent = 'Kernel parser: — unavailable, site shape still runs';
            });
    };

    raw.addEventListener('input', () => {
        setScript(raw.value);
        treeFromScript();
        askKernel();
    });
    [subject, mode, parts, projection].forEach((input) => {
        input.addEventListener('input', writeTree);
    });
    gather.addEventListener('click', () => {
        const physics = projectTablePhysics(getScript(), readTableRuntime());
        const expression = gatherTableForce({
            expression: physics.source,
            label: physics.subject ? `${physics.subject} physics` : 'Empty table script',
            kind: 'script',
        });
        onStatus?.(`gathered ${expression}`);
    });
    apply.addEventListener('click', () => {
        const physics = projectTablePhysics(getScript(), readTableRuntime());
        onApplyClock?.({
            name: physics.subject || 'table',
            segments: physics.segments ?? 4,
            usedFallback: physics.segments == null,
        });
    });

    readHooks().forEach((hook) => {
        const button = createElement('button', {
            type: 'button',
            className: `rpg-hook-chip rpg-hook-chip--${hook.kind}`,
            text: hook.label,
        });
        if (hook.swatch && hook.kind === 'color') button.style.setProperty('--rpg-hook-swatch', hook.swatch);
        if (hook.kind === 'image' && hook.swatch) {
            button.style.backgroundImage = `url("${hook.swatch.replace(/"/g, '')}")`;
        }
        button.addEventListener('click', () => {
            gatherTableForce({ expression: hook.expression, label: hook.label, kind: hook.kind, element: button });
            onStatus?.(`gathered ${hook.kind}: ${hook.label}`);
        });
        hooks.appendChild(button);
    });

    const panel = createElement('div', {
        className: 'spw-panel rpg-gameplay-panel rpg-gameplay-panel--physics',
        id: 'rpg-kit-physics',
        'data-spw-feature': 'rpg-kit-physics',
    }, [
        createElement('h3', { text: 'Table physics' }),
        createElement('p', {
            className: 'frame-note',
            text: 'Edit the tree or the line. Empty slots stay empty and the clock falls back to 4. Density, motion, and palette come from this browser’s settings. Gather sends the force to the cauldron.',
        }),
        createElement('div', { className: 'rpg-tree-fields' }, [
            createElement('label', { className: 'rpg-gameplay-field' }, [createElement('span', { text: 'Subject' }), subject]),
            createElement('label', { className: 'rpg-gameplay-field' }, [createElement('span', { text: 'Mode' }), mode]),
            createElement('label', { className: 'rpg-gameplay-field' }, [createElement('span', { text: 'Parts' }), parts]),
            createElement('label', { className: 'rpg-gameplay-field' }, [createElement('span', { text: 'Projection' }), projection]),
        ]),
        raw,
        readout,
        kernel,
        createElement('div', { className: 'rpg-gameplay-actions' }, [apply, gather]),
        hooks,
    ]);

    treeFromScript();
    askKernel();

    return {
        panel,
        setValue(value) {
            raw.value = value || '';
            treeFromScript();
            askKernel();
        },
    };
};
