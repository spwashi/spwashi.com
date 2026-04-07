// spw-operators.js
//
// Reads Spw operator prefixes from sigil text and annotates elements with
// data-spw-operator, making the grammar visible as interaction semantics.
//
// Operator family reference (from .spw workbench):
//   #>name     frame declaration — names and anchors a unit
//   #:layer    layer marker — marks the interpretive role of a frame
//   ^"name"    object — holds structured, inspectable content
//   ~"path"    reference — carries a path or literal anchor
//   ?[...]     probe — stores a question or interactive unit
//   @action    action — triggers a behavior or projection
//   *stream    stream — connects to dynamic or event-driven content
//   !pragma    pragma — encodes a runtime constraint or hint
//   >surface   surface — a projected or rendered view

const OPERATORS = [
    { pattern: /^#>/, type: 'frame',   label: 'frame declaration' },
    { pattern: /^#:/, type: 'layer',   label: 'layer marker' },
    { pattern: /^\^/, type: 'object',  label: 'object' },
    { pattern: /^~/,  type: 'ref',     label: 'reference' },
    { pattern: /^\?/, type: 'probe',   label: 'probe' },
    { pattern: /^@/,  type: 'action',  label: 'action' },
    { pattern: /^\*/, type: 'stream',  label: 'stream' },
    { pattern: /^!/,  type: 'pragma',  label: 'pragma' },
    { pattern: /^>/,  type: 'surface', label: 'surface' },
];

const detect = (text) => {
    for (const op of OPERATORS) {
        if (op.pattern.test(text)) return op;
    }
    return null;
};

let initialized = false;

// Attach data-spw-operator and a descriptive title to each matching sigil.
const annotateSignals = () => {
    const sigils = Array.from(
        document.querySelectorAll('.frame-sigil, .frame-card-sigil, .syntax-token')
    );

    for (const sigil of sigils) {
        const text = sigil.textContent.trim();
        const op = detect(text);
        if (op && !sigil.dataset.spwOperator) {
            sigil.dataset.spwOperator = op.type;
            if (!sigil.title) sigil.title = op.label;
        }
    }
};

// Probe sigils (?[...]) live in frames that also have mode panels.
// Connect them so clicking the sigil activates the frame's first panel
// (or any panel whose data-mode-panel matches the probe name).
const wireProbeSigils = () => {
    const probeSigils = Array.from(
        document.querySelectorAll('[data-spw-operator="probe"][href^="#"]')
    );

    for (const sigil of probeSigils) {
        const frame = sigil.closest('.site-frame');
        if (!frame) continue;

        const panels = Array.from(frame.querySelectorAll('[data-mode-panel]'));
        if (!panels.length) continue;

        // Extract probe name from ?["name"] or ?[name]
        const match = sigil.textContent.match(/\?\[["']?([^\]"']+)/);
        const probeName = match ? match[1].toLowerCase().replace(/\s+/g, '_') : null;

        const target = probeName
            ? panels.find((p) => p.dataset.modePanel === probeName) || panels[0]
            : panels[0];

        if (target && target.hidden) {
            sigil.addEventListener('click', (e) => {
                if (sigil.tagName === 'A') e.preventDefault();

                if (target.dataset.modeGroup && target.dataset.modePanel && window.spwInterface?.setGroupMode) {
                    window.spwInterface.setGroupMode(target.dataset.modeGroup, target.dataset.modePanel, {
                        source: 'probe',
                        force: true
                    });
                } else {
                    target.hidden = false;
                    target.classList.add('is-active-panel');
                }

                if (window.spwInterface?.activateFrame) {
                    window.spwInterface.activateFrame(frame, {
                        source: 'probe',
                        force: true
                    });
                }
            });
        }
    }
};

// Ref sigils (~"path") surface their reference path as an accessible description.
const annotateRefs = () => {
    const refSigils = Array.from(
        document.querySelectorAll('[data-spw-operator="ref"]')
    );

    for (const sigil of refSigils) {
        const text = sigil.textContent.trim();
        const match = text.match(/~["#]?([^"}\s]+)/);
        if (match) {
            const ref = match[1].replace(/['"]/g, '');
            sigil.setAttribute('aria-label', `reference: ${ref}`);
            if (!sigil.title) sigil.title = `~"${ref}"`;
        }
    }
};

const initSpwOperators = () => {
    if (initialized) return;
    initialized = true;

    annotateSignals();
    wireProbeSigils();
    annotateRefs();

    // Re-run when mode panels swap in new sigils (dynamic content).
    const observer = new MutationObserver(() => annotateSignals());
    observer.observe(document.body, { childList: true, subtree: true });
};

export { initSpwOperators };
