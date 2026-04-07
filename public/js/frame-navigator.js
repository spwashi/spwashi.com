// frame-navigator.js
//
// JetBrains-inspired tool window panel for navigating site frames.
//
// Spw spell sequences (operator-to-keyboard mapping):
//   g          →  #> go spell     — toggle frame navigator
//   [ / ]      →  sequence spell  — traverse prev / next frame
//   / (chord)  →  ?[ probe spell  — filter frames by text
//   Escape     →  close / deactivate

// ─── Frame metadata ───────────────────────────────────────────────────────────

const emitAction = (token, description) => {
    document.dispatchEvent(new CustomEvent('spw:action', {
        detail: { token, description }
    }));
};

const getFrameMeta = (frame) => {
    // Prefer the first frame-sigil for operator context.
    // Prefer h1 > h2 as the readable label.
    const sigil   = frame.querySelector('.frame-sigil');
    const heading = frame.querySelector('h1, h2');
    const opType  = sigil?.dataset.spwOperator ?? null;
    const sigilTx = sigil?.textContent.trim() ?? '';

    // Derive a short operator prefix for the chip.
    const PREFIX_MAP = {
        frame:   '#>',  object: '^"',  ref:    '~"',
        probe:   '?[',  action: '@',   layer:  '#:',
        surface: '>',   stream: '*',   pragma: '!',
    };
    const prefix = opType ? (PREFIX_MAP[opType] ?? opType) : null;

    return {
        id:          frame.id,
        opType,
        prefix,
        sigilText:   sigilTx,
        headingText: heading?.textContent.trim() ?? frame.id ?? '(frame)',
    };
};

// ─── Frame activation (mirrors site.js logic without coupling) ───────────────

const activateFrame = (target) => {
    if (window.spwInterface?.activateFrame) {
        window.spwInterface.activateFrame(target, {
            source: 'navigator',
            force: true
        });
        return;
    }

    document.querySelectorAll('.site-frame').forEach((frame) => {
        frame.classList.toggle('is-active-frame', frame === target);
    });
};

const getActiveFrame = () => (
    window.spwInterface?.getActiveFrame?.()
    || document.querySelector('.site-frame.is-active-frame')
);

// ─── Navigator construction ───────────────────────────────────────────────────

const buildNavigator = () => {
    // Root container — sits at the left edge.
    const root = document.createElement('div');
    root.className = 'spw-nav';
    root.setAttribute('aria-label', 'Frame navigator');

    // Trigger strip — the JetBrains tool window stripe.
    const strip = document.createElement('div');
    strip.className = 'spw-nav-strip';

    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'spw-nav-trigger';
    triggerBtn.setAttribute('aria-controls', 'spw-nav-panel');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-label', 'Toggle frame navigator (g)');
    triggerBtn.innerHTML = '<span class="spw-nav-strip-label">#&gt;&nbsp;frames</span>';
    strip.appendChild(triggerBtn);

    // Panel.
    const panel = document.createElement('div');
    panel.className = 'spw-nav-panel';
    panel.id = 'spw-nav-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Frame navigator');
    panel.hidden = true;

    // Panel header.
    const header = document.createElement('div');
    header.className = 'spw-nav-header';

    const title = document.createElement('span');
    title.className = 'spw-nav-title';
    title.innerHTML = '<span data-spw-operator="frame">#&gt;</span>&thinsp;frames';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'spw-nav-close';
    closeBtn.setAttribute('aria-label', 'Close navigator');
    closeBtn.textContent = '×';
    header.append(title, closeBtn);

    // Search field — the ?[ probe slot.
    const searchWrap = document.createElement('div');
    searchWrap.className = 'spw-nav-search-wrap';

    const searchLabel = document.createElement('span');
    searchLabel.className = 'spw-nav-search-op';
    searchLabel.setAttribute('aria-hidden', 'true');
    searchLabel.textContent = '?[';

    const searchInput = document.createElement('input');
    searchInput.className = 'spw-nav-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'filter frames';
    searchInput.setAttribute('aria-label', 'Filter frames');
    searchInput.autocomplete = 'off';
    searchWrap.append(searchLabel, searchInput);

    // Frame list.
    const list = document.createElement('ul');
    list.className = 'spw-nav-list';
    list.setAttribute('role', 'list');

    // Spell hint footer.
    const spells = document.createElement('div');
    spells.className = 'spw-nav-spells';
    spells.setAttribute('aria-hidden', 'true');
    spells.innerHTML =
        '<span class="spw-spell">g</span> toggle &nbsp;' +
        '<span class="spw-spell">[ ]</span> traverse &nbsp;' +
        '<span class="spw-spell">esc</span> close';

    panel.append(header, searchWrap, list, spells);
    root.append(strip, panel);

    return { root, triggerBtn, panel, closeBtn, searchInput, list };
};

// ─── List rendering ───────────────────────────────────────────────────────────

const renderList = (list, frames, filterText, onActivate) => {
    const query = filterText.toLowerCase();
    list.replaceChildren();

    frames.forEach(({ frame, meta }, index) => {
        const matchesSigil   = meta.sigilText.toLowerCase().includes(query);
        const matchesHeading = meta.headingText.toLowerCase().includes(query);
        if (query && !matchesSigil && !matchesHeading) return;

        const item = document.createElement('li');
        item.className = 'spw-nav-item';

        const btn = document.createElement('button');
        btn.className = 'spw-nav-item-btn';
        btn.setAttribute('data-nav-index', String(index));

        if (meta.prefix) {
            const chip = document.createElement('span');
            chip.className = 'spw-nav-op-chip';
            if (meta.opType) chip.dataset.spwOperator = meta.opType;
            chip.textContent = meta.prefix;
            chip.setAttribute('aria-hidden', 'true');
            btn.appendChild(chip);
        }

        const label = document.createElement('span');
        label.className = 'spw-nav-item-label';
        label.textContent = meta.headingText;
        btn.appendChild(label);

        btn.addEventListener('click', () => onActivate(frame));
        item.appendChild(btn);
        list.appendChild(item);
    });

    if (!list.children.length) {
        const empty = document.createElement('li');
        empty.className = 'spw-nav-empty';
        empty.textContent = 'no frames match';
        list.appendChild(empty);
    }
};

// ─── Active-frame tracker ────────────────────────────────────────────────────

const syncActiveItem = (list, frames) => {
    const active = getActiveFrame();
    list.querySelectorAll('.spw-nav-item-btn').forEach((btn) => {
        const idx  = Number(btn.dataset.navIndex);
        const isActive = frames[idx]?.frame === active;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
};

// ─── Keyboard spells ──────────────────────────────────────────────────────────

const isInputFocused = () => {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
};

const navigateFrames = (dir) => {
    const all = Array.from(document.querySelectorAll('.site-frame'));
    const active = getActiveFrame();
    const idx  = active ? all.indexOf(active) : -1;
    const next = all.at((idx + dir + all.length) % all.length);
    if (next) {
        activateFrame(next);
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
        emitAction(dir > 0 ? '@sequence.next' : '@sequence.prev', getFrameMeta(next).headingText);
    }
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const onReady = () => {
    const siteFrameEls = Array.from(document.querySelectorAll('.site-frame'));
    if (!siteFrameEls.length) return;

    const frames = siteFrameEls.map((frame) => ({ frame, meta: getFrameMeta(frame) }));

    const { root, triggerBtn, panel, closeBtn, searchInput, list } = buildNavigator();
    document.body.appendChild(root);

    let filterText = '';

    const refresh = () => {
        renderList(list, frames, filterText, (frame) => {
            activateFrame(frame);
            frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
            emitAction('@navigator.select', getFrameMeta(frame).headingText);
            close();
        });
        syncActiveItem(list, frames);
    };

    const open = () => {
        panel.hidden = false;
        root.classList.add('is-open');
        triggerBtn.setAttribute('aria-expanded', 'true');
        searchInput.value = '';
        filterText = '';
        refresh();
        requestAnimationFrame(() => searchInput.focus());
        emitAction('#>frames.open', 'frame navigator');
    };

    const close = (options = {}) => {
        panel.hidden = true;
        root.classList.remove('is-open');
        triggerBtn.setAttribute('aria-expanded', 'false');
        if (options.restoreFocus) triggerBtn.focus();
        emitAction('!frames.close', 'frame navigator');
    };

    const toggle = () => (panel.hidden ? open() : close());

    // Controls.
    triggerBtn.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);

    searchInput.addEventListener('input', () => {
        filterText = searchInput.value;
        refresh();
    });

    searchInput.addEventListener('keydown', (event) => {
        const buttons = Array.from(list.querySelectorAll('.spw-nav-item-btn'));

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            buttons[0]?.focus();
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            buttons[0]?.click();
        }
    });

    list.addEventListener('keydown', (event) => {
        const current = event.target.closest('.spw-nav-item-btn');
        if (!current) return;

        const buttons = Array.from(list.querySelectorAll('.spw-nav-item-btn'));
        const currentIndex = buttons.indexOf(current);
        if (currentIndex < 0) return;

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const direction = event.key === 'ArrowDown' ? 1 : -1;
            const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
            buttons[nextIndex]?.focus();
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            buttons[0]?.focus();
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            buttons[buttons.length - 1]?.focus();
        }
    });

    // Close on backdrop click (clicking root outside the panel).
    root.addEventListener('click', (e) => {
        if (e.target === root) close();
    });

    // ── Keyboard spells ──
    window.addEventListener('keydown', (e) => {
        // g spell: #> go — toggle navigator.
        if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !isInputFocused()) {
            e.preventDefault();
            toggle();
            return;
        }

        // ] spell: next frame in sequence.
        if (e.key === ']' && !isInputFocused()) {
            e.preventDefault();
            navigateFrames(1);
            return;
        }

        // [ spell: previous frame in sequence.
        if (e.key === '[' && !isInputFocused()) {
            e.preventDefault();
            navigateFrames(-1);
            return;
        }

        // / spell: ?[ probe — open navigator with focus on search.
        if (e.key === '/' && !isInputFocused()) {
            e.preventDefault();
            if (panel.hidden) open();
            else searchInput.focus();
            return;
        }

        if (e.key === 'Escape') {
            close({ restoreFocus: !panel.hidden });
        }
    });

    // Sync active indicator when site.js activates frames.
    const frameObserver = new MutationObserver(() => syncActiveItem(list, frames));
    siteFrameEls.forEach((f) => frameObserver.observe(f, { attributes: true, attributeFilter: ['class'] }));

    refresh();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
} else {
    onReady();
}
