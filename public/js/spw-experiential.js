/**
 * Spw Experiential Cohesion
 * 
 * Implements site-wide breadcrumbs as Spw spells and expressions.
 * Provides hooks for learning Spw constructs through interactive components.
 */

export function initSpwExperiential() {
    initSpellBreadcrumbs();
    initOperatorLearning();
}

/**
 * Spell Breadcrumbs: Path as Spw Expression
 * 
 * Maps the current DOM hierarchy and route to a valid Spw spell.
 * Example: #>topics #:surface !software ~"renderers"
 */
function initSpellBreadcrumbs() {
    const header = document.querySelector('header');
    if (!header) return;

    const pathBar = document.createElement('div');
    pathBar.className = 'spw-spell-path';
    pathBar.setAttribute('aria-label', 'Spw Location Spell');
    
    // Insert after nav or at the end of header
    const nav = header.querySelector('nav');
    if (nav) {
        nav.after(pathBar);
    } else {
        header.appendChild(pathBar);
    }

    const updatePath = () => {
        const url = new URL(window.location.href);
        const surface = document.body.dataset.spwSurface || 'root';
        const pathParts = url.pathname.split('/').filter(p => p && p !== 'topics');
        
        let spell = `<span class="spell-op">#></span><span class="spell-node">spwashi</span> `;
        spell += `<span class="spell-op">#:surface</span> <span class="spell-node">!${surface}</span> `;
        
        pathParts.forEach((part, i) => {
            const isLast = i === pathParts.length - 1;
            spell += `<span class="spell-op">~</span><span class="spell-node ${isLast ? 'spell-current' : ''}">"${part}"</span> `;
        });

        // Add hash if exists
        if (url.hash) {
            spell += `<span class="spell-sep">#</span><span class="spell-node">${url.hash.slice(1)}</span>`;
        }

        pathBar.innerHTML = spell;
    };

    window.addEventListener('popstate', updatePath);
    window.addEventListener('hashchange', updatePath);
    updatePath();

    // Listen for frame activations (custom event from brace-gestures or intersection)
    document.addEventListener('spw:brace:activate', (e) => {
        const id = e.target.id;
        if (id) {
            const currentUrl = new URL(window.location.href);
            currentUrl.hash = id;
            // Update without triggering full scroll if possible, or just update UI
            updatePath();
        }
    });
}

/**
 * Operator Learning: Interactive Probes
 * 
 * Injects small Spw 'probes' into the UI that explain operators on hover.
 */
function initOperatorLearning() {
    const operators = document.querySelectorAll('.frame-sigil, [data-spw-operator]');
    
    operators.forEach(op => {
        op.addEventListener('mouseenter', () => {
            const text = op.textContent.trim();
            const symbol = text.match(/^[#>^?~!@*&=%$%]+/)?.[0];
            if (symbol) {
                // Show a mini-probe explanation in the console/metrics bar if active
                const console = document.querySelector('.spw-console');
                if (console) {
                    const msg = document.createElement('div');
                    msg.className = 'console-log';
                    msg.innerHTML = `<span class="log-op">?</span> [operator_inquiry] <span class="log-meta">${symbol}</span>: ${getOperatorDefinition(symbol)}`;
                    console.appendChild(msg);
                    console.scrollTop = console.scrollHeight;
                }
            }
        });
    });

    initBookmarkRegistry();
}

/**
 * Bookmark Registry: Pinned Frames as a Collection
 * 
 * Populates the [data-spw-bookmarks-root] on the settings page.
 */
function initBookmarkRegistry() {
    const root = document.querySelector('[data-spw-bookmarks-root]');
    if (!root) return;

    const render = () => {
        const pins = JSON.parse(localStorage.getItem('spw-pins') || '{}');
        const keys = Object.keys(pins);

        if (keys.length === 0) {
            root.innerHTML = '<p class="inline-note">No pinned frames yet. Hold a component for >420ms to pin it.</p>';
            return;
        }

        let html = `<pre><code><span class="spell-op">^[</span><span class="spell-node">pinned_frames</span><span class="spell-op">]</span><span class="spell-sep">{</span>\n`;
        
        keys.forEach(key => {
            const pin = pins[key];
            html += `  <span class="spell-node">${pin.id}</span>: <span class="spell-op">~</span><a href="${pin.page}#${pin.id}" class="spell-node">"${pin.page}"</a> <span class="spell-meta">(${new Date(pin.timestamp).toLocaleDateString()})</span>\n`;
        });

        html += `<span class="spell-sep">}</span></code></pre>`;
        
        const clearBtn = document.createElement('button');
        clearBtn.className = 'operator-chip';
        clearBtn.style.marginTop = '1rem';
        clearBtn.innerHTML = '<span class="spell-op">!</span> reset_pins';
        clearBtn.onclick = () => {
            localStorage.removeItem('spw-pins');
            render();
            // Also unpin everything on current page if any
            document.querySelectorAll('[data-spw-pinned]').forEach(el => delete el.dataset.spwPinned);
        };

        root.innerHTML = html;
        root.appendChild(clearBtn);
    };

    render();
    // Re-render if pins change while page is open
    window.addEventListener('storage', (e) => {
        if (e.key === 'spw-pins') render();
    });
}

function getOperatorDefinition(sym) {
    const defs = {
        '#>': 'frame — names a navigable/queryable unit',
        '#:': 'layer — marks an interpretive or pragmatic role',
        '^':  'object — holds structured, inspectable content',
        '~':  'ref — points to an external path or internal anchor',
        '?':  'probe — signals a question, query, or interactive unit',
        '@':  'action — commits a behavior or projection',
        '*':  'stream — connects to dynamic or event-driven data',
        '!':  'pragma — encodes a local constraint or hint',
        '>':  'surface — identifies a projected or rendered view'
    };
    return defs[sym] || 'spw construct';
}
