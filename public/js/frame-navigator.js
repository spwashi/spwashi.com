// frame-navigator.js
//
// JetBrains-inspired tool window panel for navigating site frames and routes.
//
// Spw spell sequences (operator-to-keyboard mapping):
//   g          →  #> map spell    — toggle surface map
//   [ / ]      →  sequence spell  — traverse prev / next frame
//   / (chord)  →  ?[ probe spell  — filter frames and routes
//   Escape     →  close / deactivate

import {
    detectOperator,
    emitSpwAction,
    getFrameMeta,
    isInputFocused
} from './spw-shared.js';

let initialized = false;

const NAV_ROUTE_SELECTOR = [
    'main .frame-operators a[href]',
    'main .frame-card[href]',
    'main .operator-card[href]',
    'main .operator-ring-nav a[href]',
    'main .syntax-token[href]',
    'main .frame-list a[href]',
    'main p a[href]'
].join(', ');

const normalizePathname = (pathname = '') => {
    if (!pathname || pathname === '/') return '/';
    return pathname.replace(/\/+$/, '');
};

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();

const getCompactInternalHref = (url) => `${url.pathname || '/'}${url.hash}`;

const getRouteLabel = (link) => {
    if (link.classList.contains('frame-card')) {
        return normalizeText(link.querySelector('strong')?.textContent || link.textContent);
    }

    return normalizeText(link.textContent);
};

const collectRouteEntries = () => {
    const currentPath = normalizePathname(window.location.pathname);
    const seen = new Set();

    return Array.from(document.querySelectorAll(NAV_ROUTE_SELECTOR)).reduce((routes, link) => {
        if (link.closest('[hidden]')) return routes;

        const href = link.getAttribute('href');
        if (!href) return routes;

        let url;
        try {
            url = new URL(href, window.location.href);
        } catch {
            return routes;
        }

        if (url.origin !== window.location.origin) return routes;

        const nextPath = normalizePathname(url.pathname);
        if (nextPath === currentPath) return routes;

        const normalizedHref = `${nextPath}${url.hash}`;
        if (seen.has(normalizedHref)) return routes;
        seen.add(normalizedHref);

        const label = getRouteLabel(link);
        if (!label) return routes;

        const sourceFrame = link.closest('.site-frame');
        const sourceHeading = sourceFrame ? getFrameMeta(sourceFrame).headingText : '';
        const sigilText = normalizeText(link.querySelector('.frame-card-sigil')?.textContent || label);
        const detected = detectOperator(sigilText) || detectOperator(label);
        const compactHref = getCompactInternalHref(url);

        routes.push({
            key: normalizedHref,
            href: compactHref,
            label,
            metaText: compactHref,
            opType: detected?.type || null,
            prefix: detected?.prefix || null,
            searchText: `${label} ${sourceHeading} ${compactHref} ${sigilText}`.toLowerCase()
        });

        return routes;
    }, []);
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
    const root = document.createElement('div');
    root.className = 'spw-nav';
    root.setAttribute('aria-label', 'Surface map');

    const strip = document.createElement('div');
    strip.className = 'spw-nav-strip';

    const triggerBtn = document.createElement('button');
    triggerBtn.className = 'spw-nav-trigger';
    triggerBtn.setAttribute('aria-controls', 'spw-nav-panel');
    triggerBtn.setAttribute('aria-expanded', 'false');
    triggerBtn.setAttribute('aria-label', 'Toggle surface map (g)');
    triggerBtn.innerHTML = `
        <span class="spw-nav-strip-label">#&gt;&nbsp;map</span>
        <span class="spw-nav-strip-sublabel">boon</span>
    `;
    strip.appendChild(triggerBtn);

    const panel = document.createElement('div');
    panel.className = 'spw-nav-panel';
    panel.id = 'spw-nav-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-label', 'Surface map');
    panel.hidden = true;

    const header = document.createElement('div');
    header.className = 'spw-nav-header';

    const title = document.createElement('span');
    title.className = 'spw-nav-title';
    title.innerHTML = '<span data-spw-operator="frame">#&gt;</span>&thinsp;surface map';

    const counter = document.createElement('span');
    counter.className = 'spw-nav-counter';
    counter.setAttribute('aria-live', 'polite');
    counter.setAttribute('aria-label', 'Surface map counts');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'spw-nav-close';
    closeBtn.setAttribute('aria-label', 'Close surface map');
    closeBtn.textContent = '×';
    header.append(title, counter, closeBtn);

    const searchWrap = document.createElement('div');
    searchWrap.className = 'spw-nav-search-wrap';

    const searchLabel = document.createElement('span');
    searchLabel.className = 'spw-nav-search-op';
    searchLabel.setAttribute('aria-hidden', 'true');
    searchLabel.textContent = '?[';

    const searchInput = document.createElement('input');
    searchInput.className = 'spw-nav-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'filter frames + routes';
    searchInput.setAttribute('aria-label', 'Filter frames and routes');
    searchInput.autocomplete = 'off';
    searchWrap.append(searchLabel, searchInput);

    const list = document.createElement('ul');
    list.className = 'spw-nav-list';
    list.setAttribute('role', 'list');

    const spells = document.createElement('div');
    spells.className = 'spw-nav-spells';
    spells.setAttribute('aria-hidden', 'true');
    spells.innerHTML =
        '<span class="spw-spell">g</span> map &nbsp;' +
        '<span class="spw-spell">[ ]</span> traverse &nbsp;' +
        '<span class="spw-spell">esc</span> close';

    panel.append(header, searchWrap, list, spells);
    root.append(strip, panel);

    return { root, triggerBtn, panel, closeBtn, counter, searchInput, list };
};

// ─── List rendering ───────────────────────────────────────────────────────────

const appendSectionLabel = (list, label, count) => {
    const section = document.createElement('li');
    section.className = 'spw-nav-section-label';
    section.textContent = `${label} (${count})`;
    list.appendChild(section);
};

const appendEntry = (list, entry, onActivate) => {
    const item = document.createElement('li');
    item.className = 'spw-nav-item';

    const control = document.createElement(entry.kind === 'route' ? 'a' : 'button');
    control.className = 'spw-nav-item-btn';
    control.dataset.navKind = entry.kind;

    if (entry.kind === 'frame') {
        control.type = 'button';
        control.setAttribute('data-nav-index', String(entry.index));
    } else {
        control.href = entry.href;
        control.setAttribute('data-route-key', entry.key);
    }

    if (entry.prefix) {
        const chip = document.createElement('span');
        chip.className = 'spw-nav-op-chip';
        if (entry.opType) chip.dataset.spwOperator = entry.opType;
        chip.textContent = entry.prefix;
        chip.setAttribute('aria-hidden', 'true');
        control.appendChild(chip);
    }

    const body = document.createElement('span');
    body.className = 'spw-nav-item-body';

    const label = document.createElement('span');
    label.className = 'spw-nav-item-label';
    label.textContent = entry.label;
    body.appendChild(label);

    if (entry.metaText) {
        const meta = document.createElement('span');
        meta.className = 'spw-nav-item-meta';
        meta.textContent = entry.metaText;
        body.appendChild(meta);
    }

    control.appendChild(body);
    control.addEventListener('click', () => onActivate(entry));

    item.appendChild(control);
    list.appendChild(item);
};

const renderList = (list, frames, routes, filterText, onActivate) => {
    const query = filterText.toLowerCase();
    list.replaceChildren();

    const filteredFrames = frames
        .filter(({ meta }) => {
            if (!query) return true;

            const matchesSigil = meta.sigilText.toLowerCase().includes(query);
            const matchesHeading = meta.headingText.toLowerCase().includes(query);
            return matchesSigil || matchesHeading;
        })
        .map((entry) => ({
            ...entry,
            kind: 'frame',
            label: entry.meta.headingText,
            metaText: entry.meta.sigilText
        }));

    const filteredRoutes = routes
        .filter((entry) => !query || entry.searchText.includes(query))
        .map((entry) => ({ ...entry, kind: 'route' }));

    if (filteredFrames.length) {
        appendSectionLabel(list, 'frames', filteredFrames.length);
        filteredFrames.forEach((entry) => appendEntry(list, entry, onActivate));
    }

    if (filteredRoutes.length) {
        appendSectionLabel(list, 'routes', filteredRoutes.length);
        filteredRoutes.forEach((entry) => appendEntry(list, entry, onActivate));
    }

    if (!list.children.length) {
        const empty = document.createElement('li');
        empty.className = 'spw-nav-empty';
        empty.textContent = 'no frames or routes match';
        list.appendChild(empty);
    }

    return {
        visibleFrames: filteredFrames.length,
        visibleRoutes: filteredRoutes.length
    };
};

// ─── Active-frame tracker ────────────────────────────────────────────────────

const syncActiveItem = (list, frames, counter, counts = {}) => {
    const active = getActiveFrame();
    let activeButton = null;
    let activeVisibleIndex = -1;
    let visibleFrameIndex = 0;

    list.querySelectorAll('.spw-nav-item-btn').forEach((btn) => {
        if (btn.dataset.navKind !== 'frame') {
            btn.classList.remove('is-active');
            btn.setAttribute('aria-current', 'false');
            return;
        }

        const idx = Number(btn.dataset.navIndex);
        const isActive = frames[idx]?.frame === active;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-current', isActive ? 'true' : 'false');

        if (isActive) {
            activeVisibleIndex = visibleFrameIndex;
            activeButton = btn;
        }

        visibleFrameIndex += 1;
    });

    if (counter) {
        const frameCount = counts.visibleFrames ?? visibleFrameIndex;
        const routeCount = counts.visibleRoutes ?? 0;
        const frameCopy = activeVisibleIndex >= 0
            ? `${activeVisibleIndex + 1} / ${frameCount} frames`
            : `${frameCount} frames`;

        counter.textContent = routeCount ? `${frameCopy} | ${routeCount} routes` : frameCopy;
    }

    activeButton?.scrollIntoView({ block: 'nearest' });
};

// ─── Keyboard spells ──────────────────────────────────────────────────────────

const navigateFrames = (dir) => {
    const all = Array.from(document.querySelectorAll('.site-frame'));
    const active = getActiveFrame();
    const idx = active ? all.indexOf(active) : -1;
    const next = all.at((idx + dir + all.length) % all.length);
    if (next) {
        activateFrame(next);
        next.scrollIntoView({ behavior: 'smooth', block: 'start' });
        emitSpwAction(dir > 0 ? '@sequence.next' : '@sequence.prev', getFrameMeta(next).headingText);
    }
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const initFrameNavigator = () => {
    if (initialized) return;

    const siteFrameEls = Array.from(document.querySelectorAll('.site-frame'));
    if (!siteFrameEls.length) return;
    initialized = true;

    const frames = siteFrameEls.map((frame, index) => ({ frame, index, meta: getFrameMeta(frame) }));

    const { root, triggerBtn, panel, closeBtn, counter, searchInput, list } = buildNavigator();
    document.body.appendChild(root);

    let filterText = '';
    let counts = {
        visibleFrames: frames.length,
        visibleRoutes: 0
    };

    const refresh = () => {
        const routes = collectRouteEntries();
        counts = renderList(list, frames, routes, filterText, (entry) => {
            if (entry.kind === 'frame') {
                activateFrame(entry.frame);
                entry.frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
                emitSpwAction('@navigator.select', entry.meta.headingText);
                close();
                return;
            }

            emitSpwAction('@navigator.route', entry.label);
            close();
        });
        syncActiveItem(list, frames, counter, counts);
    };

    const open = () => {
        panel.hidden = false;
        root.classList.add('is-open');
        triggerBtn.setAttribute('aria-expanded', 'true');
        searchInput.value = '';
        filterText = '';
        refresh();
        requestAnimationFrame(() => searchInput.focus());
        emitSpwAction('#>map.open', 'surface map');
    };

    const close = (options = {}) => {
        panel.hidden = true;
        root.classList.remove('is-open');
        triggerBtn.setAttribute('aria-expanded', 'false');
        if (options.restoreFocus) triggerBtn.focus();
        emitSpwAction('!map.close', 'surface map');
    };

    const toggle = () => (panel.hidden ? open() : close());

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

    root.addEventListener('click', (event) => {
        if (event.target === root) close();
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'g' && !event.ctrlKey && !event.metaKey && !isInputFocused()) {
            event.preventDefault();
            toggle();
            return;
        }

        if (event.key === ']' && !isInputFocused()) {
            event.preventDefault();
            navigateFrames(1);
            return;
        }

        if (event.key === '[' && !isInputFocused()) {
            event.preventDefault();
            navigateFrames(-1);
            return;
        }

        if (event.key === '/' && !isInputFocused()) {
            event.preventDefault();
            if (panel.hidden) open();
            else searchInput.focus();
            return;
        }

        if (event.key === 'Escape') {
            close({ restoreFocus: !panel.hidden });
        }
    });

    const frameObserver = new MutationObserver(() => syncActiveItem(list, frames, counter, counts));
    siteFrameEls.forEach((frame) => {
        frameObserver.observe(frame, { attributes: true, attributeFilter: ['class'] });
    });

    document.addEventListener('spw:mode-change', refresh);

    refresh();
};

export { initFrameNavigator };
