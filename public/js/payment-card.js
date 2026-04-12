/**
 * payment-card.js
 *
 * JS-rendered payment links — handles are never present in HTML source.
 * URLs are constructed at runtime from split fragments.
 *
 * Settings: localStorage 'spw-payment-enabled' → comma-separated method IDs.
 * One method must always remain enabled (enforced on save).
 *
 * Tap-hold (420ms) on the card body → shows "adjust in settings" hint.
 */

// ── Identity ──────────────────────────────────────────────────────────────────
const HANDLE = 'spwashi';

// ── Method registry ──────────────────────────────────────────────────────────
// Links are assigned to <a> elements by JS — they are never present as href
// attributes in the HTML source. This prevents naive HTML scrapers from
// harvesting payment handles by parsing static markup. The handles themselves
// are intentionally visible in the rendered UI.
const PAYMENT_METHODS = [
    {
        id: 'cashapp',
        label: 'Cash App',
        handle: `$${HANDLE}`,
        sigil: '$',
        url: `https://cash.app/$${HANDLE}`,
    },
    {
        id: 'venmo',
        label: 'Venmo',
        handle: `@${HANDLE}`,
        sigil: 'V',
        url: `https://venmo.com/${HANDLE}`,
    },
    {
        id: 'paypal',
        label: 'PayPal',
        handle: HANDLE,
        sigil: 'P',
        url: `https://paypal.me/${HANDLE}`,
    },
    {
        id: 'github',
        label: 'GitHub Sponsors',
        handle: HANDLE,
        sigil: '♥',
        url: `https://github.com/sponsors/${HANDLE}`,
    },
];

export { PAYMENT_METHODS };

// ── Settings ─────────────────────────────────────────────────────────────────
const SETTINGS_KEY = 'spw-payment-enabled';

export function getPaymentEnabled() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const ids = raw.split(',').map(s => s.trim()).filter(id => PAYMENT_METHODS.some(m => m.id === id));
            if (ids.length) return ids;
        }
    } catch (_) { /* storage unavailable */ }
    return PAYMENT_METHODS.map(m => m.id);
}

export function setPaymentEnabled(ids) {
    const valid = ids.filter(id => PAYMENT_METHODS.some(m => m.id === id));
    const saved = valid.length ? valid : [PAYMENT_METHODS[0].id];
    try { localStorage.setItem(SETTINGS_KEY, saved.join(',')); } catch (_) {}
    document.dispatchEvent(new CustomEvent('spw:payment-settings-change', { detail: { enabled: saved } }));
    return saved;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function buildUrl(method) {
    return method.url;
}

function buildLinkEl(method) {
    const a = document.createElement('a');
    a.className = 'payment-card__link';
    a.dataset.method = method.id;
    a.dataset.spwTouch = 'tap';
    a.rel = 'noopener noreferrer';
    a.target = '_blank';
    // href set here — not in HTML source
    a.href = buildUrl(method);

    const sigil = document.createElement('span');
    sigil.className = 'payment-card__method-sigil';
    sigil.setAttribute('aria-hidden', 'true');
    sigil.textContent = method.sigil;

    const label = document.createElement('span');
    label.className = 'payment-card__method-label';
    label.textContent = method.label;

    const handle = document.createElement('span');
    handle.className = 'payment-card__method-handle';
    handle.textContent = method.handle;

    a.append(sigil, label, handle);
    return a;
}

function renderLinks(body, enabledIds) {
    body.innerHTML = '';
    PAYMENT_METHODS.filter(m => enabledIds.includes(m.id)).forEach(m => {
        body.appendChild(buildLinkEl(m));
    });
}

// ── Hold behavior ─────────────────────────────────────────────────────────────
const HOLD_MS = 420;

function attachHoldBehavior(card) {
    let timer = null;
    let hint = null;

    const showHint = () => {
        if (hint) return;
        hint = document.createElement('div');
        hint.className = 'payment-card__hint';
        hint.setAttribute('role', 'status');
        hint.innerHTML = `<a class="payment-card__hint-link" href="/settings/#payment-settings">adjust in settings →</a>`;
        card.appendChild(hint);
        requestAnimationFrame(() => hint.classList.add('is-visible'));

        setTimeout(hideHint, 3200);
    };

    const hideHint = () => {
        if (!hint) return;
        const el = hint;
        hint = null;
        el.classList.remove('is-visible');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
    };

    card.addEventListener('pointerdown', e => {
        if (e.target.closest('a.payment-card__link, a.payment-card__hint-link')) return;
        timer = setTimeout(showHint, HOLD_MS);
    }, { passive: true });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => {
        card.addEventListener(evt, () => clearTimeout(timer), { passive: true });
    });
}

// ── Init ──────────────────────────────────────────────────────────────────────
export function initPaymentCards(root = document) {
    root.querySelectorAll('[data-payment-card]').forEach(card => {
        const body = card.querySelector('[data-spw-region="body"]');
        if (!body) return;

        const render = (ids) => renderLinks(body, ids);
        render(getPaymentEnabled());
        attachHoldBehavior(card);

        // Live-update when settings change
        document.addEventListener('spw:payment-settings-change', e => {
            render(e.detail.enabled);
        });
    });
}

// ── Settings UI helper ────────────────────────────────────────────────────────
/** Render a toggle group for payment settings. Call from settings page. */
export function initPaymentSettings(container) {
    if (!container) return;
    container.innerHTML = '';

    const enabled = getPaymentEnabled();

    const group = document.createElement('div');
    group.className = 'payment-settings__toggles';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Payment options to display');

    const note = document.createElement('p');
    note.className = 'payment-settings__note frame-note';
    note.textContent = 'Choose which payment options visitors see. At least one must remain enabled.';
    container.appendChild(note);

    PAYMENT_METHODS.forEach(method => {
        const label = document.createElement('label');
        label.className = 'payment-settings__toggle';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = method.id;
        checkbox.checked = enabled.includes(method.id);
        checkbox.setAttribute('aria-label', method.label);

        const sigil = document.createElement('span');
        sigil.className = 'payment-settings__toggle-sigil';
        sigil.setAttribute('aria-hidden', 'true');
        sigil.textContent = method.sigil;

        const text = document.createElement('span');
        text.textContent = `${method.label} · ${method.handle}`;

        label.append(checkbox, sigil, text);
        group.appendChild(label);
    });

    container.appendChild(group);

    const save = () => {
        const checked = Array.from(group.querySelectorAll('input:checked')).map(el => el.value);
        const saved = setPaymentEnabled(checked);
        // Re-enforce: if only one remains, disable its checkbox to prevent unchecking
        group.querySelectorAll('input').forEach(cb => {
            cb.disabled = saved.length === 1 && cb.checked;
        });
    };

    group.addEventListener('change', save);
}
