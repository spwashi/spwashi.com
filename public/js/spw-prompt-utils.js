import { bus } from './spw-bus.js';
import { serializeLatticeToSpw } from './spw-lattice.js';

export function initSpwPromptUtils() {
    initFrameCopyButtons();
    initWonderBlocks();
}

function initFrameCopyButtons() {
    const frames = document.querySelectorAll('.site-frame');
    frames.forEach(frame => {
        if (!frame.id || frame.querySelector('.frame-prompt-copy')) return;
        const copyBtn = document.createElement('button');
        copyBtn.className = 'frame-prompt-copy';
        copyBtn.innerHTML = '<span class="log-op">$</span> copy_context';
        frame.style.position = 'relative';
        frame.appendChild(copyBtn);

        copyBtn.onclick = (e) => {
            e.stopPropagation();
            const snippet = serializeFrameToSpw(frame);
            copyToClipboard(snippet, copyBtn);
        };
    });
}

function initWonderBlocks() {
    // Shared wonder blocks that appear sporadically or near canvases
    const surfaces = document.querySelectorAll('.spw-accent-host, .spw-svg-surface');
    surfaces.forEach(surface => {
        const block = document.createElement('div');
        block.className = 'spw-wonder-block';
        block.innerHTML = `
            <div class="wonder-header">
                <span class="log-op">?</span> wonder_and_consideration
                <button class="wonder-action" data-action="hydrate">#&gt;hydrate_for_midjourney</button>
            </div>
            <div class="wonder-body" data-wonder-text>Wait for resonance...</div>
        `;
        surface.after(block);

        block.querySelector('[data-action="hydrate"]').onclick = () => {
            const prompt = serializeWonderPrompt();
            copyToClipboard(prompt, block.querySelector('[data-action="hydrate"]'));
        };
    });

    // Update wonder text on bus events
    bus.on('spell:grounded', (e) => {
        const blocks = document.querySelectorAll('[data-wonder-text]');
        const prompt = serializeWonderPrompt();
        blocks.forEach(b => b.textContent = prompt.slice(0, 140) + '...');
    });
}

function serializeWonderPrompt() {
    const persona = document.body.dataset.spwPersona || 'viewer';
    const phase   = document.body.dataset.spwLatticePhase || 'curiosity';
    const grounded = Array.from(document.querySelectorAll('[data-spw-grounded="true"]'))
        .map(el => el.textContent.trim().toLowerCase());

    const descriptors = {
        viewer:  'clean geometric clarity, mathematical harmony, subtle cyan lighting, paper-like textures',
        doodler: 'expressive ink washes, vibrant chromatic shifts, hand-drawn lattices, fluid blooming flows',
        scribe:  'dense technical blueprints, precise architectural lines, cyanotype aesthetic, data-rich overlays'
    };

    const basePrompt = `Concept collage of ${grounded.join(', ') || 'technical wonder'}, ${descriptors[persona]}, in the state of ${phase}, hyper-detailed, technical art, 8k, --ar 16:9`;
    return basePrompt;
}

async function copyToClipboard(text, btn) {
    const { handleCopyButton } = await import('./spw-copy.js');
    const original = btn.innerHTML;
    await handleCopyButton({
        text,
        button: btn,
        labelCopied:  '<span class="log-op">✓</span> copied',
        labelFailed:  '<span class="log-op">!</span> copy',
        labelDefault: original
    });
}

function serializeFrameToSpw(frame) {
    const id = frame.id;
    const op = frame.dataset.spwOperator || '#>';
    const phase = frame.dataset.spwPhase || 'neutral';
    const role = frame.dataset.spwRole || 'content';
    
    let spw = `${op}${id}\n`;
    spw += `#:layer #!${role}\n`;
    spw += `#:phase .${phase}\n\n`;
    
    const title = frame.querySelector('h1, h2, h3')?.textContent.trim() || 'untitled';
    const description = frame.querySelector('p')?.textContent.trim() || '';
    
    spw += `^"${title}"{\n`;
    spw += `  summary: "${description.slice(0, 100)}..."\n`;
    spw += `  url: "${window.location.origin}${window.location.pathname}#${id}"\n`;
    spw += `}\n\n`;
    
    const registry = JSON.parse(localStorage.getItem('spw-grounded-registry') || '[]');
    if (registry.length > 0) {
        spw += `^"consideration_register"{\n`;
        spw += `  grounded_concepts: ${JSON.stringify(registry)}\n`;
        spw += `}\n\n`;
    }

    spw += serializeLatticeToSpw();
    return spw;
}
