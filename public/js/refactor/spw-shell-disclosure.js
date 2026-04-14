import {
    emitSpwAction,
    matchesMaxWidth
} from './spw-shared.js';

const MOBILE_BREAKPOINT_PX = 720;

const isMobileShell = () => matchesMaxWidth(MOBILE_BREAKPOINT_PX);

export function initSpwShellDisclosure() {
    const header = document.querySelector('body > header, .site-header');
    const nav = header?.querySelector('nav');
    const navList = nav?.querySelector('ul');
    if (!header || !nav || !navList || header.dataset.spwShellDisclosureInit === 'true') return;

    header.dataset.spwShellDisclosureInit = 'true';
    nav.id ||= 'spw-shell-nav';

    const toggle = document.createElement('button');
    toggle.className = 'spw-nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', nav.id);
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.innerHTML = `
        <span class="spw-nav-toggle-glyph" aria-hidden="true"></span>
        <span class="spw-nav-toggle-label">menu</span>
    `;

    const sigil = header.querySelector('.header-sigil');
    if (sigil?.after) {
        sigil.after(toggle);
    } else {
        header.prepend(toggle);
    }

    const setOpen = (open, source = 'system') => {
        const next = open ? 'open' : 'closed';
        header.dataset.spwMenu = next;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.hidden = isMobileShell() ? !open : false;

        if (source === 'user') {
            emitSpwAction(
                open ? '@shell.open' : '@shell.close',
                open ? 'Navigation links expanded.' : 'Navigation links collapsed.'
            );
        }
    };

    const sync = (source = 'sync') => {
        if (!isMobileShell()) {
            setOpen(true, source);
            return;
        }

        const currentlyOpen = header.dataset.spwMenu === 'open';
        setOpen(currentlyOpen && source !== 'init' ? currentlyOpen : false, source);
    };

    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setOpen(header.dataset.spwMenu !== 'open', 'user');
    });

    toggle.addEventListener('pointerdown', (event) => {
        event.stopPropagation();
    });

    nav.addEventListener('click', (event) => {
        const link = event.target.closest('a[href]');
        if (!link || !isMobileShell()) return;
        setOpen(false, 'user');
    });

    document.addEventListener('click', (event) => {
        if (!isMobileShell()) return;
        if (header.dataset.spwMenu !== 'open') return;
        if (header.contains(event.target)) return;
        setOpen(false, 'user');
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!isMobileShell() || header.dataset.spwMenu !== 'open') return;
        setOpen(false, 'user');
        toggle.focus();
    });

    window.addEventListener('resize', () => sync('resize'));
    window.addEventListener('hashchange', () => {
        if (isMobileShell()) setOpen(false, 'sync');
    });

    sync('init');
}
