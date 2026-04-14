/**
 * Spw Spells
 *
 * Gathers grounded tokens into a Spw collection that can be cast —
 * shared as a prompt, saved as a checkpoint, or crystallized into a plan.
 *
 * A spell is the serialized form of accumulated wonder: what you've
 * encountered, what substrate it lives in, and what the system infers
 * you might want to explore next.
 */

import { bus } from './spw-bus.js';
import { getGroundedRegistry } from './spw-haptics.js';

function getCurrentSpellSnippet() {
    return constructSpell(getGroundedRegistry());
}

function registerSpellActions() {
    window.spwSpells = {
        cast(button) {
            const snippet = getCurrentSpellSnippet();
            bus.emit('spell:cast', { snippet, path: window.location.pathname });

            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(snippet).then(() => {
                    if (button instanceof HTMLElement) {
                        button.textContent = '@ cast (copied)';
                    }
                }).catch(() => {});
            }
        },
        checkpoint() {
            bus.emit('spell:checkpoint', {
                name: `spell_${Date.now()}`
            });
        }
    };
}

export function initSpwSpells() {
    registerSpellActions();

    const spellBoards = document.querySelectorAll('[data-spw-role="spell-board"]');

    spellBoards.forEach(board => {
        updateSpellBoard(board);

        document.addEventListener('click', (e) => {
            if (e.target.closest('.operator-chip, .syntax-token, .spec-pill')) {
                setTimeout(() => updateSpellBoard(board), 80);
            }
        });

        bus.on('spell:reset',      () => updateSpellBoard(board));
        bus.on('spell:grounded',   () => updateSpellBoard(board));
        bus.on('spell:ungrounded', () => updateSpellBoard(board));
    });
}

function updateSpellBoard(board) {
    const registry = getGroundedRegistry();

    if (!registry.length) {
        board.innerHTML = `
            <p class="frame-note">
                No concepts grounded yet.
                Hold any operator chip or sigil — when it settles, it joins your spell.
            </p>`;
        return;
    }

    const spellSnippet = constructSpell(registry);
    board.innerHTML = `
        <div class="spell-visual" data-spw-operator="stream">
            ${registry.map(key => {
                const label = key.split(':').pop();
                return `<span class="spell-ingredient"
                              data-spw-atom="chip"
                              data-spw-grounded="true"
                              data-spw-operator="baseline">
                            <span data-spw-atom-prefix>.</span>
                            <span data-spw-atom-nucleus>${label}</span>
                        </span>`;
            }).join('')}
        </div>
        <pre class="spell-source"><code>${escapeHtml(spellSnippet)}</code></pre>
        <div class="spell-actions">
            <button class="operator-chip" type="button"
                    data-spw-operator="action"
                    onclick="spwSpells?.cast(this)">
                @ cast_spell
            </button>
            <button class="operator-chip" type="button"
                    data-spw-operator="pragma"
                    onclick="spwSpells?.checkpoint()">
                ! checkpoint
            </button>
        </div>
    `;

    registerSpellActions();
}

function constructSpell(registry) {
    const timestamp = new Date().toISOString();
    const phase     = document.body.dataset.spwLatticePhase || 'curiosity';

    let spw = `@cast_spell("consideration_circuit")\n`;
    spw += `#:at "${timestamp}"\n`;
    spw += `@phase .${phase}\n\n`;

    spw += `^"ingredients"{\n`;
    registry.forEach(key => {
        const [surface, name] = key.includes(':') ? key.split(':') : ['surface', key];
        spw += `  ${(surface || 'surface').toLowerCase()}: ~"${name || key}"\n`;
    });
    spw += `}\n\n`;

    spw += `?[cognitive_bridge]{\n`;
    spw += `  !prompt{ "Analyze these considered concepts and suggest a Staff-level engineering path." }\n`;
    spw += `  ~"${window.location.pathname}"\n`;
    spw += `}`;

    return spw;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
