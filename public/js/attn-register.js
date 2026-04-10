/**
 * Attentional Register + Touch Semantics
 *
 * Charge phrases and badges on the blog surface are non-selectable
 * (CSS handles that). Tapping a marked phrase that is NOT a link adds
 * its charge key to a session-scoped register — a running ?[probe] of
 * what draws attention.
 *
 * The register appears as a floating bar. Tap a chip to remove it.
 * Swipe down on the bar to clear. Swipe horizontally on the atelier
 * theme toggle to pivot between light and dark.
 */

const REGISTER_KEY = 'spw-attn-register';

const BADGE_SELECTORS = [
  '[data-spw-charge-key]',
  '.spec-pill',
  '.field-note-tag',
  '.specimen-api-tag',
  '.specimen-index-tag',
  '.blog-chip-list li'
].join(',');

const SWIPE_MIN_PX = 40;

/* ── Register state ── */

const loadTerms = () => {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(REGISTER_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const saveTerms = (terms) => {
  try {
    sessionStorage.setItem(REGISTER_KEY, JSON.stringify([...terms]));
  } catch { /* storage unavailable */ }
};

const terms = loadTerms();

const termFor = (node) => (
  node.dataset.spwChargeKey
  || node.textContent.trim()
);

const displayTerm = (term) => term.replace(/-/g, ' ');

/* ── Register UI ── */

const ensureBar = () => {
  let bar = document.querySelector('[data-attn-register]');
  if (bar) return bar;

  bar = document.createElement('aside');
  bar.setAttribute('data-attn-register', '');
  bar.setAttribute('role', 'log');
  bar.setAttribute('aria-label', 'Attentional register');
  document.body.appendChild(bar);
  return bar;
};

const renderRegister = () => {
  const existing = document.querySelector('[data-attn-register]');
  if (!terms.size) {
    existing?.remove();
    return;
  }

  const bar = ensureBar();
  bar.innerHTML = '';

  const label = document.createElement('span');
  label.className = 'attn-label';
  label.textContent = '?[';
  bar.appendChild(label);

  const list = document.createElement('span');
  list.className = 'attn-terms';

  terms.forEach((term) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'attn-chip';
    chip.textContent = displayTerm(term);
    chip.setAttribute('aria-label', `Remove "${term}"`);
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      terms.delete(term);
      saveTerms(terms);
      syncBadgeStates();
      renderRegister();
    });
    list.appendChild(chip);
  });

  bar.appendChild(list);

  const closing = document.createElement('span');
  closing.className = 'attn-label';
  closing.textContent = ']';
  bar.appendChild(closing);

  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'attn-clear';
  clear.textContent = '× clear';
  clear.setAttribute('aria-label', 'Clear register');
  clear.addEventListener('click', (e) => {
    e.stopPropagation();
    terms.clear();
    saveTerms(terms);
    syncBadgeStates();
    renderRegister();
  });
  bar.appendChild(clear);
};

/* ── Badge state sync ── */

const syncBadgeStates = () => {
  document.querySelectorAll(BADGE_SELECTORS).forEach((badge) => {
    const term = termFor(badge);
    if (terms.has(term)) {
      badge.setAttribute('data-attn-active', '');
    } else {
      badge.removeAttribute('data-attn-active');
    }
  });
};

/* ── Badge tap ── */

const initBadgeTap = () => {
  document.addEventListener('click', (e) => {
    const badge = e.target.closest(BADGE_SELECTORS);
    if (!badge) return;

    // Don't intercept actual links
    if (badge.tagName === 'A' || badge.closest('a')) return;

    const term = termFor(badge);
    if (!term) return;

    e.preventDefault();

    if (terms.has(term)) {
      terms.delete(term);
      badge.removeAttribute('data-attn-active');
    } else {
      terms.add(term);
      badge.setAttribute('data-attn-active', '');
    }

    saveTerms(terms);
    renderRegister();
  });

  syncBadgeStates();
};

/* ── Swipe: theme toggle ── */

const initThemeSwipe = () => {
  const toggle = document.querySelector('.atelier-theme-toggle');
  if (!toggle) return;

  let startX = 0;
  let startY = 0;

  toggle.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  toggle.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;

    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dy) > Math.abs(dx)) return;

    const current = document.body.dataset.theme || 'atelier-light';
    const next = current === 'atelier-light' ? 'atelier-dark' : 'atelier-light';
    document.body.dataset.theme = next;

    document.querySelectorAll('[data-theme-set]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.themeSet === next));
    });
  }, { passive: true });
};

/* ── Swipe: dismiss register ── */

const initRegisterSwipe = () => {
  let startY = 0;

  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('[data-attn-register]')) return;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!e.target.closest('[data-attn-register]')) return;
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > SWIPE_MIN_PX) {
      terms.clear();
      saveTerms(terms);
      syncBadgeStates();
      renderRegister();
    }
  }, { passive: true });
};

/* ── Init ── */

const initAttnRegister = () => {
  initBadgeTap();
  initThemeSwipe();
  initRegisterSwipe();
  renderRegister();
};

export { initAttnRegister };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAttnRegister);
} else {
  initAttnRegister();
}
