/**
 * rail-crumb.js — the travel rail read as a breadcrumb, a demo behind
 * ?spw-rail=crumb (.spw/caches/home-renovation-2026-11.spw#rail).
 *
 * The creator, 2026-11-08: the rail button "isn't immediately clear and doesn't
 * feel very useful in screenshots"; the rail could be "more breadcrumb-like with
 * typographical mindfulness and Spw anatomy utilizing symmetry and operational
 * physics". The rail keeps its sections, travel, swipes and kin. In this form:
 *
 * - The place is the section's own sigil holding its heading, written as Spw:
 *   *folio_stack{ The October drop, and the studio }. The open brace takes the
 *   objective color, the close brace the subjective one, and the heading sets in
 *   the serif, because it is the page's sentence and not a tool.
 * - Opened, the route frame leads (#>home ›), and the moves are operators doing
 *   what their physics says: ^ lifts to the top, ‹ › step to the neighbours,
 *   ~ similar (superposition defer), % contrast (scalar observation; the
 *   creator's "probably", held as tentative), # resonate.
 * - The crumb is the toggle, so the word "rail" goes; the layer key and ↓ step
 *   aside in this form.
 * - Gatherable words read ~n (potential), not ⌁, which is not an operator.
 * - The ground is opaque, so body text no longer reads through.
 *
 * Nothing here is the default until the creator approves it live, at 390 px
 * and 1440 px. With the flag absent, section-handle.js renders as before.
 */

// spw-expression.js's change event; that module loads only under this flag, so the name is restated here.
const EXPRESSION_CHANGE_EVENT = 'spw:expression-change';

const STYLE_ID = 'spw-rail-crumb-style';
const FORM_ATTR = 'data-spw-handle-form';
const FORM = 'crumb';

/** The flag: ?spw-rail=crumb, or the form already set on <html> by a test. */
export function readRailCrumb() {
  try {
    return new URLSearchParams(globalThis.location?.search || '').get('spw-rail') === FORM
      || document.documentElement.getAttribute(FORM_ATTR) === FORM;
  } catch {
    return false;
  }
}

/** True when this shell renders as the breadcrumb. */
export const isRailCrumb = (node) => Boolean(node?.closest?.(`[${FORM_ATTR}="${FORM}"]`));

const OPERATOR_ONLY = /^[#.^~?@*&=$%!:<>]{1,2}$/;

/**
 * The place as a breadcrumb: the route frame, the section's authored sigil
 * (or its operator with the section's handle), and its heading as the body.
 */
export function crumbPlace(info = {}, route = 'home', handleOf = (value) => value, heading = '') {
  const raw = String(info.token || '').trim();
  const token = !raw || OPERATOR_ONLY.test(raw)
    ? `${raw || '#>'}${handleOf(info.id || '') || 'section'}`
    : raw;
  // A label that is itself a sigil (a frame whose top line names it) gives way to the section's heading.
  const given = String(info.label || '').trim();
  const sigilLike = !given || given === token || /^[#.^~?@*&=$%!:<>]/.test(given);
  const label = (sigilLike ? String(heading || '').trim().replace(/\s+/g, ' ') : given) || given || 'this section';
  return { route: `#>${route || 'home'}`, token, label };
}

/** What a screen reader hears on the crumb, which opens and closes the moves. */
export function crumbLabel(place, activeIndex, sectionCount, compact) {
  const where = `${place.label}, ${place.token}, section ${activeIndex + 1} of ${sectionCount}`;
  return `${where}. ${compact ? 'Show' : 'Hide'} the moves`;
}

const CSS = `
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] {
  background:
    linear-gradient(var(--surface-strong, rgba(255, 255, 255, 0.94)), var(--surface-strong, rgba(255, 255, 255, 0.94))),
    Canvas;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
  border-radius: 0.75rem;
  /* Floating chrome rests at 0.92; over reading text the crumb takes a ground the text cannot read through. */
  opacity: 1 !important;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-current {
  background: transparent;
}
/* Opened, the place is also a mutable expression: page[lens]{section}, each slot a dial. */
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] > spw-expression {
  order: -1;
  flex: 1 0 100%;
  padding-inline: 0.35rem;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"][data-spw-handle-shell-state="collapsed"] > spw-expression {
  display: none;
}
/* The expression carries the route, so the crumb row does not repeat it. */
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"]:has(> spw-expression) .spw-rail-crumb-route {
  display: none;
}
/* One reading per cell: the geometry hint and cadence belong to the inspector, not the crumb. */
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] :is(.spw-section-handle-current-form, .spw-section-handle-current-cadence) {
  display: none !important;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] :is([data-spw-handle-target="toggle"], [data-spw-handle-target="layer"], [data-spw-handle-target="bottom"]) {
  display: none !important;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-current {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  min-inline-size: 0;
  flex: 1 1 auto;
  font-family: var(--site-mono-font, ui-monospace, monospace);
  text-decoration: none;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-current-copy {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  min-inline-size: 0;
}
.spw-rail-crumb-route {
  margin-inline-end: 0.4em;
  color: var(--ink-soft, currentColor);
  font-family: var(--site-mono-font, ui-monospace, monospace);
  white-space: nowrap;
}
.spw-section-handle-shell[data-spw-handle-shell-state="collapsed"] .spw-rail-crumb-route {
  display: none;
}
/* The layer key and narrow widths hide the token (section-context.css); here it is the place's name. */
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-current .spw-section-handle-current-token {
  display: inline;
  max-width: none;
  flex: 0 0 auto;
  white-space: nowrap;
}
.spw-rail-crumb-brace {
  font-family: var(--site-mono-font, ui-monospace, monospace);
  font-weight: 600;
}
.spw-rail-crumb-brace[data-half="open"] {
  margin-inline: 0.05em 0.3em;
  color: var(--grammar-objective-brace-color, hsl(188 58% 32%));
}
.spw-rail-crumb-brace[data-half="close"] {
  margin-inline: 0.3em 0.5em;
  color: var(--grammar-subjective-brace-color, hsl(342 48% 36%));
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-current-label {
  overflow: hidden;
  min-inline-size: 0;
  font-family: var(--site-serif-font, Georgia, serif);
  font-size: 1.02em;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-progress {
  margin-inline-start: 0.1em;
  color: var(--ink-soft, currentColor);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.spw-section-handle-shell[${FORM_ATTR}="${FORM}"] .spw-section-handle-cauldron {
  margin-inline-end: 0.45em;
  white-space: nowrap;
}
`;

function ensureStyles(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}

function brace(doc, half, text) {
  const node = doc.createElement('span');
  node.className = 'spw-rail-crumb-brace';
  node.dataset.half = half;
  node.setAttribute('aria-hidden', 'true');
  node.textContent = text;
  return node;
}

function relabel(button, compact, balanced, ariaLabel) {
  if (!(button instanceof HTMLElement)) return;
  const compactLabel = button.querySelector('[data-spw-kin-rung="compact"]');
  const balancedLabel = button.querySelector('[data-spw-kin-rung="balanced"]');
  if (compactLabel) compactLabel.textContent = compact;
  if (balancedLabel) balancedLabel.textContent = balanced;
  if (!compactLabel && !balancedLabel) {
    const glyph = button.querySelector('span') || button;
    glyph.textContent = compact;
  }
  if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
}

/**
 * Turn a built rail shell into the breadcrumb form. Idempotent; leaves every
 * listener section-handle.js attaches in place.
 */
export function applyRailCrumb(shell) {
  if (!(shell instanceof HTMLElement) || shell.getAttribute(FORM_ATTR) === FORM) return;
  const doc = shell.ownerDocument || document;
  ensureStyles(doc);
  shell.setAttribute(FORM_ATTR, FORM);

  const current = shell.querySelector('.spw-section-handle-current');
  const copy = shell.querySelector('.spw-section-handle-current-copy');
  const label = shell.querySelector('.spw-section-handle-current-label');
  if (current instanceof HTMLElement) {
    const route = doc.createElement('span');
    route.className = 'spw-rail-crumb-route';
    route.setAttribute('aria-hidden', 'true');
    current.prepend(route);
    current.setAttribute('role', 'button');
    current.setAttribute('aria-expanded', 'false');
    // A link answers Enter; as a button the crumb answers Space too.
    current.addEventListener('keydown', (event) => {
      if (event.key !== ' ') return;
      event.preventDefault();
      current.click();
    });
  }
  if (copy instanceof HTMLElement && label instanceof HTMLElement) {
    copy.insertBefore(brace(doc, 'open', '{'), label);
    label.after(brace(doc, 'close', '}'));
  }
  const sigil = shell.querySelector('.spw-section-handle-cauldron-sigil');
  if (sigil) sigil.textContent = '~';

  relabel(shell.querySelector('[data-spw-handle-target="top"]'), '^', '^', 'Lift to the top of the page');
  const contrast = shell.querySelector('[data-spw-handle-target="contrast"]');
  relabel(contrast, '%', '%contrast', 'Compare a contrasting region');
  if (contrast instanceof HTMLElement) contrast.setAttribute('data-spw-operator', 'normalize');
}

/** Keep the crumb's expanded state in step with the shell's. */
export function syncRailCrumbExpanded(shell, compact) {
  if (!isRailCrumb(shell)) return;
  const current = shell.querySelector('.spw-section-handle-current');
  if (current instanceof HTMLElement) current.setAttribute('aria-expanded', compact ? 'false' : 'true');
}

/** The site's own pages, from the header's navigation, as the page slot's choices. */
export function readRouteChoices(doc = document, handleOf = (value) => value) {
  const seen = new Set();
  const choices = [];
  for (const link of doc.querySelectorAll('body > header nav a[href], .site-header nav a[href]')) {
    let url;
    try {
      url = new URL(link.getAttribute('href'), doc.baseURI);
    } catch {
      continue;
    }
    if (url.origin !== globalThis.location?.origin || seen.has(url.pathname)) continue;
    seen.add(url.pathname);
    const segments = url.pathname.split('/').filter(Boolean);
    const value = handleOf(segments[segments.length - 1] || 'home') || 'home';
    choices.push({ value, label: (link.textContent || '').trim().replace(/\s+/g, ' '), href: url.pathname });
  }
  return choices;
}

/** The page's working views (Home's lens buttons), as the lens slot's choices. */
export function readLensChoices(doc = document) {
  return [...doc.querySelectorAll('main .mode-switch [data-set-mode]')].map((button) => ({
    value: button.getAttribute('data-set-mode'),
    label: (button.querySelector('span')?.textContent || button.textContent || '').trim(),
    pressed: button.getAttribute('aria-pressed') === 'true',
  }));
}

/**
 * Mount the mutable expression in an opened crumb: page[lens]{section}. A page
 * turn follows its link; a lens turn presses that lens's own button; a section
 * turn travels the rail. The rail keeps it in step through syncCrumbExpression.
 */
export function mountCrumbExpression(shell, { route, routes = [], lenses = [], sections = [], current = 0, onTravel } = {}) {
  if (!isRailCrumb(shell) || shell.querySelector(':scope > spw-expression')) return null;
  const doc = shell.ownerDocument || document;
  const element = doc.createElement('spw-expression');
  element.setAttribute('aria-label', 'Where you are, as Spw. Turn a slot to move: page, lens, section');
  const slots = [{ name: 'subject', value: route, choices: routes.some((choice) => choice.value === route) ? routes : [{ value: route, label: route }, ...routes] }];
  if (lenses.length) slots.push({ name: 'mode', value: (lenses.find((lens) => lens.pressed) || lenses[0]).value, choices: lenses });
  slots.push({ name: 'body', value: sections[current]?.value || '', choices: sections });
  element.model = { operator: '#>', slots };
  element.addEventListener(EXPRESSION_CHANGE_EVENT, (event) => {
    const { slot, value } = event.detail || {};
    if (slot === 'body') {
      event.preventDefault();
      const index = sections.findIndex((section) => section.value === value);
      if (index >= 0) onTravel?.(index);
    } else if (slot === 'mode') {
      event.preventDefault();
      [...doc.querySelectorAll('main .mode-switch [data-set-mode]')].find((button) => button.getAttribute('data-set-mode') === value)?.click();
    }
  });
  shell.querySelector('.spw-section-handle-current')?.after(element);
  return element;
}

/** Keep the expression's section and lens in step with the page. */
export function syncCrumbExpression(shell, { section } = {}) {
  const element = shell?.querySelector?.(':scope > spw-expression');
  if (!element) return;
  if (section) element.setValue('body', section);
  const pressed = (shell.ownerDocument || document).querySelector('main .mode-switch [data-set-mode][aria-pressed="true"]');
  if (pressed) element.setValue('mode', pressed.getAttribute('data-set-mode'));
}
