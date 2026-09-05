/** Surface map: native route links, visible frames, and reversible keyboard navigation. */
import {
    annotateFloatingChromeElement,
    syncFloatingChromeState,
} from '/public/js/kernel/dom-contracts.js';
import { projectFeatureRouteContext } from '/public/js/kernel/feature-route-context.js';
import { normalizePathname } from '/public/js/kernel/route-utils.js';
import {
    detectOperator,
    emitSpwAction,
    getFrameMeta,
    isInputFocused
} from '/public/js/kernel/shared.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { collapseText as normalizeText } from '/public/js/kernel/text-normalization.js';

const NAV_ROUTE_SELECTOR = [
    'main .frame-operators a[href]',
    'main .frame-card[href]',
    'main .operator-card[href]',
    'main .operator-ring-nav a[href]',
    'main .syntax-token[href]',
    'main .spw-chip[href]',
    'main .frame-list a[href]',
    'main p a[href]'
].join(', ');

const getCompactInternalHref = (url) => `${url.pathname || '/'}${url.search}${url.hash}`;
const scrollBehavior = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const collectFrames = () => Array.from(document.querySelectorAll('main .spw-frame'))
    .filter(frame => !frame.closest('[hidden], [inert]'));
const focusFrame = (frame) => {
    if (!frame.hasAttribute('tabindex')) {
        frame.setAttribute('tabindex', '-1');
        frame.addEventListener('blur', () => frame.removeAttribute('tabindex'), { once: true });
    }
    frame.focus({ preventScroll: true });
    frame.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
};

const isNavigatorHidden = () => getSiteSettings().navigatorDisplay === 'hidden';

const getRouteLabel = (link) => {
    const visible = link.classList.contains('frame-card')
        ? normalizeText(link.querySelector('strong')?.textContent || link.textContent)
        : normalizeText(link.textContent);
    if (visible) return visible;
    // Icon-only or whitespace links would otherwise be dropped — fall back to the
    // accessible name so the route still surfaces in the map.
    return normalizeText(
        link.dataset.spwNavLabel || link.getAttribute('aria-label') || link.getAttribute('title') || ''
    );
};

const collectRouteEntries = () => {
    const currentPath = normalizePathname(window.location.pathname);
    const seen = new Set();
    return Array.from(document.querySelectorAll(NAV_ROUTE_SELECTOR)).reduce((routes, link) => {
        if (link.closest('[hidden]')) return routes;
        const href = link.getAttribute('href');
        if (!href) return routes;

        let url;
        try { url = new URL(href, window.location.href); } catch { return routes; }
        if (url.origin !== window.location.origin) return routes;

        const nextPath = normalizePathname(url.pathname);
        if (nextPath === currentPath && url.search === window.location.search) return routes;

        const normalizedHref = `${nextPath}${url.search}${url.hash}`;
        if (seen.has(normalizedHref)) return routes;
        seen.add(normalizedHref);

        const label = getRouteLabel(link);
        if (!label) return routes;

        const sourceFrame = link.closest('.spw-frame');
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
        window.spwInterface.activateFrame(target, { source: 'navigator', force: true });
        return;
    }
    collectFrames().forEach(frame => {
        if (frame === target) {
            frame.dataset.state = 'active';
        } else {
            delete frame.dataset.state;
        }
    });
};

const getActiveFrame = () =>
    window.spwInterface?.getActiveFrame?.() || document.querySelector('.spw-frame[data-state~="active"]');

// ─── Core Navigator Class ───────────────────────────────────────────────────
class SpwFrameNavigator {
    constructor() {
        this.root = null;
        this.panel = null;
        this.triggerBtn = null;
        this.closeBtn = null;
        this.counter = null;
        this.searchInput = null;
        this.list = null;
        this.frames = [];
        this.filterText = '';
        this.counts = { visibleFrames: 0, visibleRoutes: 0 };
        this.frameObserver = null;
        this.abort = new AbortController();
        this.refreshRaf = 0;
        this.initialized = false;
        this.isOpen = () => this.panel && !this.panel.hidden;
    }

    init() {
        if (this.initialized) return;
        const siteFrameEls = collectFrames();
        if (!siteFrameEls.length) return;

        this.initialized = true;
        projectFeatureRouteContext(document.documentElement, {
            source: 'frame-navigator',
            reason: 'init',
        });
        this.buildUI();
        document.body.appendChild(this.root);

        this.attachListeners();
        this.refresh();

        console.log('[Spw Frame Navigator] Initialized successfully — surface map ready');
    }

    buildUI() {
        this.root = document.createElement('div');
        this.root.className = 'spw-nav';
        annotateFloatingChromeElement(this.root, {
            role: 'surface-map',
            tier: 'floating',
            mutator: 'frame-navigator',
            reason: 'surface-map',
            stylingAxis: 'navigator-chrome',
        });
        this.root.setAttribute('aria-label', 'Surface map');
        this.root.dataset.spwNavState = 'closed';

        // Strip + trigger
        const strip = document.createElement('div');
        strip.className = 'spw-nav-strip';

        this.triggerBtn = document.createElement('button');
        this.triggerBtn.className = 'spw-nav-trigger';
        this.triggerBtn.setAttribute('aria-controls', 'spw-nav-panel');
        this.triggerBtn.setAttribute('aria-expanded', 'false');
        this.triggerBtn.setAttribute('aria-label', 'Toggle surface map (g)');
        this.triggerBtn.innerHTML = `
            <span class="spw-nav-strip-label">#&gt;&nbsp;map</span>
            <span class="spw-nav-strip-sublabel">objective</span>
        `;
        strip.appendChild(this.triggerBtn);
        this.root.appendChild(strip);

        // Panel
        this.panel = document.createElement('div');
        this.panel.className = 'spw-nav-panel';
        this.panel.id = 'spw-nav-panel';
        this.panel.setAttribute('role', 'dialog');
        this.panel.setAttribute('aria-modal', 'false');
        this.panel.setAttribute('aria-label', 'Surface map');
        annotateFloatingChromeElement(this.panel, {
            role: 'surface-map-panel',
            tier: 'priority',
            mutator: 'frame-navigator',
            reason: 'surface-map-panel',
            stylingAxis: 'navigator-chrome',
        });
        this.panel.hidden = true;

        // Header
        const header = document.createElement('div');
        header.className = 'spw-nav-header';

        const title = document.createElement('span');
        title.className = 'spw-nav-title';
        title.id = 'spw-nav-panel-title';
        title.innerHTML = '<span data-spw-operator="frame">#&gt;</span>&thinsp;surface map';

        // Wire aria-labelledby now that title id exists
        this.panel.setAttribute('aria-labelledby', 'spw-nav-panel-title');

        this.counter = document.createElement('span');
        this.counter.className = 'spw-nav-counter';
        this.counter.id = 'spw-nav-counter';
        this.counter.setAttribute('aria-live', 'polite');
        this.counter.setAttribute('aria-label', 'Surface map counts');

        this.closeBtn = document.createElement('button');
        this.closeBtn.className = 'spw-nav-close';
        this.closeBtn.setAttribute('aria-label', 'Close surface map');
        this.closeBtn.textContent = '×';

        header.append(title, this.counter, this.closeBtn);
        this.panel.appendChild(header);

        // Search
        const searchWrap = document.createElement('div');
        searchWrap.className = 'spw-nav-search-wrap';

        const searchLabel = document.createElement('span');
        searchLabel.className = 'spw-nav-search-op';
        searchLabel.setAttribute('aria-hidden', 'true');
        searchLabel.textContent = '?[';

        this.searchInput = document.createElement('input');
        this.searchInput.className = 'spw-nav-search';
        this.searchInput.type = 'search';
        this.searchInput.placeholder = 'filter frames + routes';
        this.searchInput.setAttribute('aria-label', 'Filter frames and routes');
        this.searchInput.setAttribute('aria-describedby', 'spw-nav-counter');
        this.searchInput.autocomplete = 'off';

        searchWrap.append(searchLabel, this.searchInput);
        this.panel.appendChild(searchWrap);

        // List
        this.list = document.createElement('ul');
        this.list.className = 'spw-nav-list';
        this.list.setAttribute('role', 'list');
        this.panel.appendChild(this.list);

        // Spells footer
        const spells = document.createElement('div');
        spells.className = 'spw-nav-spells';
        spells.setAttribute('aria-hidden', 'true');

        const spellG = document.createElement('span'); spellG.className = 'spw-spell'; spellG.textContent = 'g';
        const spellBrackets = document.createElement('span'); spellBrackets.className = 'spw-spell'; spellBrackets.textContent = '[ ]';
        const spellSlash = document.createElement('span'); spellSlash.className = 'spw-spell'; spellSlash.textContent = '/';
        const spellEsc = document.createElement('span'); spellEsc.className = 'spw-spell'; spellEsc.textContent = 'esc';
        const spellSite = document.createElement('button');
        spellSite.type = 'button';
        spellSite.className = 'spw-runtime-settings-link';
        spellSite.setAttribute('data-spw-site-search-open', '');
        spellSite.textContent = '⌘K site';

        spells.append(
            spellG, document.createTextNode(' map '),
            spellBrackets, document.createTextNode(' traverse '),
            spellSlash, document.createTextNode(' filter '),
            spellEsc, document.createTextNode(' close '),
            spellSite,
            document.createTextNode(' · '),
            document.createElement('a') // settings link (created below)
        );

        const settingsLink = spells.lastElementChild;
        settingsLink.className = 'spw-runtime-settings-link';
        settingsLink.href = '/settings/';
        settingsLink.textContent = 'settings';

        this.panel.appendChild(spells);
        this.root.appendChild(this.panel);
    }

    listen(target, type, handler) {
        target.addEventListener(type, handler, { signal: this.abort.signal });
    }

    destroy() {
        this.abort.abort();
        this.frameObserver?.disconnect();
        cancelAnimationFrame(this.refreshRaf);
        this.close();
        this.root?.remove();
        this.initialized = false;
    }

    attachListeners() {
        // Trigger & close
        this.listen(this.triggerBtn, 'click', () => this.toggle());
        this.listen(this.closeBtn, 'click', () => this.close({ restoreFocus: true }));

        // Search
        this.listen(this.searchInput, 'input', () => {
            this.filterText = this.searchInput.value;
            this.refresh();
        });

        this.listen(this.searchInput, 'keydown', (e) => {
            const buttons = Array.from(this.list.querySelectorAll('.spw-nav-item-btn'));
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                buttons[0]?.focus();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                buttons[0]?.click();
            }
        });

        // List keyboard navigation
        this.listen(this.list, 'keydown', (e) => {
            const current = e.target.closest('.spw-nav-item-btn');
            if (!current) return;
            const buttons = Array.from(this.list.querySelectorAll('.spw-nav-item-btn'));
            const idx = buttons.indexOf(current);
            if (idx < 0) return;

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const dir = e.key === 'ArrowDown' ? 1 : -1;
                const next = (idx + dir + buttons.length) % buttons.length;
                buttons[next]?.focus();
                return;
            }
            if (e.key === 'Home') { e.preventDefault(); buttons[0]?.focus(); return; }
            if (e.key === 'End') { e.preventDefault(); buttons[buttons.length - 1]?.focus(); }
        });

        // Click outside panel
        this.listen(this.root, 'click', (e) => {
            if (e.target === this.root) this.close();
        });

        // Global keyboard spells
        this.listen(window, 'keydown', (e) => {
            if (e.defaultPrevented || e.isComposing) return;
            if (e.key === 'Escape' && this.isOpen()) {
                e.preventDefault();
                this.close({ restoreFocus: true });
                return;
            }
            if (isInputFocused() || e.ctrlKey || e.metaKey || e.altKey) return;

            if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !isNavigatorHidden()) {
                e.preventDefault();
                this.toggle();
                return;
            }
            if (e.key === '}') {
                e.preventDefault();
                this.navigateFrames(1);
                return;
            }
            if (e.key === '{') {
                e.preventDefault();
                this.navigateFrames(-1);
                return;
            }
            if (e.key === '/' && !isNavigatorHidden()) {
                e.preventDefault();
                if (this.panel.hidden) this.open();
                else this.searchInput.focus();
                return;
            }
            if (e.key === 'Escape') {
                this.close({ restoreFocus: !this.panel.hidden });
            }
        });

        // Dynamic frame tracking
        this.frameObserver = new MutationObserver((records) => {
            if (!this.isOpen()) return;
            if (records.every(record => record.attributeName === 'data-state')) {
                this.syncActiveItem(this.list, this.frames, this.counter, this.counts);
                return;
            }
            cancelAnimationFrame(this.refreshRaf);
            this.refreshRaf = requestAnimationFrame(() => this.refresh());
        });
        const main = document.querySelector('main');
        if (main) this.frameObserver.observe(main, {
            childList: true, subtree: true, attributes: true,
            attributeFilter: ['hidden', 'inert', 'data-state'],
        });

        // Initial frames will be observed after first refresh
        this.listen(document, 'spw:mode-change', () => this.refresh());
        this.listen(document, 'spw:settings-change', (e) => {
            if (e.detail?.navigatorDisplay === 'hidden') this.close();
        });
    }

    updateFrames() {
        this.frames = collectFrames()
            .map((frame, index) => ({
                frame,
                index,
                meta: getFrameMeta(frame)
            }));
        return this.frames;
    }

    refresh() {
        if (!this.list) return;

        projectFeatureRouteContext(document.documentElement, {
            source: 'frame-navigator',
            reason: 'refresh',
        });

        const frames = this.updateFrames();
        const routes = collectRouteEntries();

        this.counts = this.renderList(this.list, frames, routes, this.filterText, (entry) => {
            if (entry.kind === 'frame') {
                activateFrame(entry.frame);
                focusFrame(entry.frame);
                emitSpwAction('@navigator.select', entry.meta.headingText);
                this.close();
                return;
            }
            emitSpwAction('@navigator.route', entry.label);
            this.close();
        });

        this.syncActiveItem(this.list, frames, this.counter, this.counts);


    }

    renderList(list, frames, routes, filterText, onActivate) {
        const query = filterText.toLowerCase();
        list.replaceChildren();

        const filteredFrames = frames
            .filter(({ meta }) => !query ||
                meta.sigilText.toLowerCase().includes(query) ||
                meta.headingText.toLowerCase().includes(query))
            .map(entry => ({
                ...entry,
                kind: 'frame',
                label: entry.meta.headingText,
                metaText: entry.meta.sigilText
            }));

        const filteredRoutes = routes
            .filter(entry => !query || entry.searchText.includes(query))
            .map(entry => ({ ...entry, kind: 'route' }));

        if (filteredFrames.length) {
            this.appendSectionLabel(list, 'frames', filteredFrames.length);
            filteredFrames.forEach(entry => this.appendEntry(list, entry, onActivate));
        }
        if (filteredRoutes.length) {
            this.appendSectionLabel(list, 'routes', filteredRoutes.length);
            filteredRoutes.forEach(entry => this.appendEntry(list, entry, onActivate));
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
    }

    appendSectionLabel(list, label, count) {
        const section = document.createElement('li');
        section.className = 'spw-nav-section-label';
        section.setAttribute('role', 'separator');
        section.textContent = `${label} (${count})`;
        list.appendChild(section);
    }

    appendEntry(list, entry, onActivate) {
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

        const labelEl = document.createElement('span');
        labelEl.className = 'spw-nav-item-label';
        labelEl.textContent = entry.label;
        // Labels truncate with an ellipsis (CSS) — expose the full text on hover.
        labelEl.title = entry.label;
        body.appendChild(labelEl);

        // Skip meta that only echoes the label (e.g. a frame whose sigil matches its heading).
        const metaIsDistinct = entry.metaText
            && entry.metaText.toLowerCase() !== entry.label.toLowerCase();
        if (metaIsDistinct) {
            const meta = document.createElement('span');
            meta.className = 'spw-nav-item-meta';
            meta.textContent = entry.metaText;
            meta.title = entry.metaText;
            body.appendChild(meta);
        }

        control.appendChild(body);
        this.listen(control, 'click', () => onActivate(entry));

        item.appendChild(control);
        list.appendChild(item);
    }

    syncActiveItem(list, frames, counter, counts = {}) {
        const active = getActiveFrame();
        let activeVisibleIndex = -1;
        let visibleFrameIndex = 0;
        let activeButton = null;

        list.querySelectorAll('.spw-nav-item-btn').forEach(btn => {
            if (btn.dataset.navKind !== 'frame') {
                btn.classList.remove('is-active');
                btn.removeAttribute('aria-current');
                return;
            }
            const idx = Number(btn.dataset.navIndex);
            const isActive = frames[idx]?.frame === active;
            btn.classList.toggle('is-active', isActive);
            if (isActive) {
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.removeAttribute('aria-current');
            }

            if (isActive) {
                activeVisibleIndex = visibleFrameIndex;
                activeButton = btn;
            }
            visibleFrameIndex++;
        });

        if (counter) {
            const frameCount = counts.visibleFrames ?? visibleFrameIndex;
            const routeCount = counts.visibleRoutes ?? 0;
            const frameCopy = activeVisibleIndex >= 0
                ? `${activeVisibleIndex + 1} / ${frameCount} frames`
                : `${frameCount} frames`;
            counter.textContent = routeCount ? `${frameCopy} | ${routeCount} routes` : frameCopy;
        }

        // Only chase the active item into view while the panel is actually open —
        // refresh() also runs on mode/settings changes when the map is closed.
        if (this.isOpen()) {
            activeButton?.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
        }
    }

    navigateFrames(dir) {
        const all = collectFrames();
        const active = getActiveFrame();
        const idx = active ? all.indexOf(active) : -1;
        const nextIndex = idx < 0 ? (dir > 0 ? 0 : all.length - 1) : (idx + dir + all.length) % all.length;
        const next = all[nextIndex];
        if (next) {
            activateFrame(next);
            focusFrame(next);
            emitSpwAction(dir > 0 ? '@sequence.next' : '@sequence.prev', getFrameMeta(next).headingText);
        }
    }

    open() {
        if (isNavigatorHidden()) return;
        this.panel.hidden = false;
        this.root.classList.add('is-open');
        this.root.dataset.spwNavState = 'open';
        this.triggerBtn.setAttribute('aria-expanded', 'true');
        this.searchInput.value = '';
        this.filterText = '';
        this.refresh();
        requestAnimationFrame(() => { if (this.isOpen()) this.searchInput.focus(); });
        emitSpwAction('#>map.open', 'surface map');
        syncFloatingChromeState(document, {
            source: 'frame-navigator',
            reason: 'surface-map-open',
        });
    }

    close(options = {}) {
        if (!this.panel) return;
        const wasOpen = !this.panel.hidden;
        this.panel.hidden = true;
        this.root.classList.remove('is-open');
        this.root.dataset.spwNavState = 'closed';
        this.triggerBtn.setAttribute('aria-expanded', 'false');
        if (options.restoreFocus) this.triggerBtn.focus();
        if (wasOpen) emitSpwAction('!map.close', 'surface map');
        syncFloatingChromeState(document, {
            source: 'frame-navigator',
            reason: 'surface-map-close',
        });
    }

    toggle() {
        if (isNavigatorHidden()) return;
        this.isOpen() ? this.close() : this.open();
    }
}

// ─── Singleton & public API ─────────────────────────────────────────────────
let navigatorInstance = null;

const initFrameNavigator = () => {
    if (navigatorInstance?.initialized) return unmountFrameNavigator;
    navigatorInstance = new SpwFrameNavigator();
    navigatorInstance.init();

    // Debug / advanced API
    if (typeof window !== 'undefined') {
        window.spwNavigator = {
            open: () => navigatorInstance?.open(),
            close: (opts) => navigatorInstance?.close(opts),
            toggle: () => navigatorInstance?.toggle(),
            refresh: () => navigatorInstance?.refresh(),
            isOpen: () => navigatorInstance?.isOpen() || false
        };
    }
    return unmountFrameNavigator;
};

const unmountFrameNavigator = () => {
    if (!navigatorInstance) return;
    navigatorInstance.destroy();
    navigatorInstance = null;
    if (typeof window !== 'undefined' && window.spwNavigator) {
        delete window.spwNavigator;
    }
};

export { initFrameNavigator, unmountFrameNavigator as unmount };

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'frame-navigator',
  mount: () => initFrameNavigator(),
  describes: 'surface-map[frames|routes] keyboard-spells[g|traverse|filter] navigator chrome',
  timingArc: 'enhance-navigator',
  effectScope: 'floating-chrome listeners bus root-state',
});

export const spwModule = SPW_MODULE_EXPORT;
