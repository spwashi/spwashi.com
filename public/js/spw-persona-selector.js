/**
 * Spw Persona Selector
 *
 * Injects a persona picker into the workbench, allowing users to switch
 * between viewer@, doodler@, and scribe@ technical lenses.
 *
 * The selector is itself a Spw-operator group (@personas) with chips
 * that reflect the current active state via the bus.
 */

import { bus } from './spw-bus.js';

export function initPersonaSelector() {
    let mount = document.querySelector('[data-spw-surface="personas"]');
    if (!mount) {
        // Try to inject into header if present, else body
        const header = document.querySelector('header');
        mount = document.createElement('div');
        mount.setAttribute('data-spw-surface', 'personas');
        mount.className = 'persona-selector-mount';
        if (header) {
            header.appendChild(mount);
        } else {
            document.body.appendChild(mount);
        }
    }

    renderSelector(mount);

    bus.on('persona:active', () => renderSelector(mount));
}

function renderSelector(mount) {
    const active = document.body.dataset.spwPersona || 'viewer';

    mount.innerHTML = `
        <div class="persona-selector-frame" data-spw-operator="action" data-spw-form="brace">
            <span class="frame-sigil" data-spw-operator="action">@personas</span>
            <div class="persona-chips">
                <button class="persona-chip ${active === 'viewer' ? 'is-active' : ''}" 
                        data-persona="viewer" title="Viewer persona: Clean and focused">
                    <span class="persona-sigil">.</span>viewer
                </button>
                <button class="persona-chip ${active === 'doodler' ? 'is-active' : ''}" 
                        data-persona="doodler" title="Doodler persona: Visual flourishes">
                    <span class="persona-sigil">*</span>doodler
                </button>
                <button class="persona-chip ${active === 'scribe' ? 'is-active' : ''}" 
                        data-persona="scribe" title="Scribe persona: Technical metadata">
                    <span class="persona-sigil">$</span>scribe
                </button>
            </div>
        </div>
    `;

    mount.querySelectorAll('.persona-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const persona = btn.dataset.persona;
            bus.emit('persona:shift', { persona });
        });
    });
}
