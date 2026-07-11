/**
 * Query link composer
 * ---------------------------------------------------------------------------
 * Shareable page setups for feature hubs, settings, and floating chrome.
 * Builds readable query strings from opt-in toggles + optional settings parity.
 * Can offer a setup into the cauldron as a collectible spell-like ingredient.
 */

import { bus } from '/public/js/kernel/bus.js';
import { handleCopyButton } from '/public/js/kernel/copy.js';
import {
  buildSettingsShareHref,
  settingsToQueryParams,
} from '/public/js/kernel/settings-query-parity.js';

export const QUERY_COMPOSER_SELECTOR = '[data-spw-query-composer]';

/** Default instruments — orchestration, posture, theatrics. Not storage prefs. */
export const QUERY_COMPOSER_INSTRUMENTS = Object.freeze([
  Object.freeze({
    key: 'module-visuals',
    value: 'on',
    label: 'Show mounts',
    group: 'orchestration',
    hint: 'Feature islands + load phases',
  }),
  Object.freeze({
    key: 'module-audit',
    value: 'on',
    label: 'Module audit',
    group: 'orchestration',
    hint: 'Console why/skip mount log',
  }),
  Object.freeze({
    key: 'module-delay',
    value: '450',
    label: 'Slow mounts',
    group: 'orchestration',
    hint: 'Stagger mounts so reflows read as a sequence',
  }),
  Object.freeze({
    key: 'runtime-timing',
    value: 'eager',
    label: 'Eager timing',
    group: 'orchestration',
    hint: 'Push non-core mounts earlier',
  }),
  Object.freeze({
    key: 'meaning',
    value: 'inspect',
    label: 'Inspect meaning',
    group: 'posture',
    hint: 'Semantic inspect posture',
  }),
  Object.freeze({
    key: 'view',
    value: 'inspect',
    label: 'Inspect view',
    group: 'posture',
    hint: 'Chrome that explains the page',
  }),
  Object.freeze({
    key: 'enhancement',
    value: 'rich',
    label: 'Rich enhancement',
    group: 'theatrics',
    hint: 'Louder partial ornament (settings parity)',
  }),
  Object.freeze({
    key: 'physics',
    value: 'calm',
    label: 'Calm physics',
    group: 'theatrics',
    hint: 'Quieter motion for lab screenshots',
  }),
]);

export const SPW_QUERY_COMPOSER_CONTRACT = Object.freeze({
  selector: QUERY_COMPOSER_SELECTOR,
  instruments: QUERY_COMPOSER_INSTRUMENTS,
  events: Object.freeze({
    updated: 'spw:query-composer-updated',
    offered: 'spw:query-composer-offered',
  }),
  portableUse:
    'Place data-spw-query-composer on a feature hub. bindQueryComposers() fills instruments, '
    + 'preview, copy, apply, and cauldron offer. Optional data-spw-query-composer-compact for chrome.',
});

const GROUP_LABELS = Object.freeze({
  orchestration: 'Orchestration',
  posture: 'Posture',
  theatrics: 'Theatrics',
});

function readLocation(location = globalThis.location) {
  return {
    pathname: location?.pathname || '/',
    hash: location?.hash || '',
    search: location?.search || '',
  };
}

function parseSearchParams(search = '') {
  const raw = String(search || '').replace(/^\?/, '');
  return new URLSearchParams(raw);
}

/**
 * Build a query string from selected instruments and optional settings deviations.
 * @param {Record<string, string>} instruments key → value
 * @param {{ includeSettings?: boolean, settings?: object, baseSearch?: string }} [options]
 */
export function buildQueryComposerSearch(instruments = {}, options = {}) {
  const params = new URLSearchParams();

  if (options.baseSearch) {
    parseSearchParams(options.baseSearch).forEach((value, key) => {
      params.set(key, value);
    });
  }

  Object.entries(instruments).forEach(([key, value]) => {
    if (value === '' || value == null) {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  });

  if (options.includeSettings && options.settings) {
    const fromSettings = settingsToQueryParams(options.settings, { omitDefaults: true });
    Object.entries(fromSettings).forEach(([key, value]) => {
      if (!params.has(key)) params.set(key, String(value));
    });
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}

export function buildQueryComposerHref(instruments = {}, options = {}) {
  const { pathname, hash } = readLocation(options.location);
  const search = buildQueryComposerSearch(instruments, options);
  return `${pathname}${search}${hash}`;
}

function readComposerInstruments(host) {
  const instruments = {};
  host.querySelectorAll('[data-spw-query-composer-key]').forEach((control) => {
    const key = control.getAttribute('data-spw-query-composer-key');
    if (!key) return;
    const value = control.getAttribute('data-spw-query-composer-value') || 'on';
    const on = control instanceof HTMLInputElement
      ? control.checked
      : control.getAttribute('aria-pressed') === 'true';
    if (on) instruments[key] = value;
  });
  return instruments;
}

function seedInstrumentsFromLocation(host, search = globalThis.location?.search) {
  const params = parseSearchParams(search);
  host.querySelectorAll('[data-spw-query-composer-key]').forEach((control) => {
    const key = control.getAttribute('data-spw-query-composer-key');
    const value = control.getAttribute('data-spw-query-composer-value') || 'on';
    if (!key) return;
    const active = params.get(key) === value
      || (params.has(key) && value === 'on' && params.get(key) !== 'off');
    if (control instanceof HTMLInputElement) {
      control.checked = active;
    } else {
      control.setAttribute('aria-pressed', active ? 'true' : 'false');
      control.dataset.spwQueryComposerState = active ? 'on' : 'off';
    }
  });
}

function getSettingsIfAvailable() {
  try {
    return globalThis.spwSettings?.get?.() || null;
  } catch {
    return null;
  }
}

function includeSettingsFlag(host) {
  const control = host.querySelector('[data-spw-query-composer-include-settings]');
  if (control instanceof HTMLInputElement) return control.checked;
  if (control instanceof HTMLElement) return control.getAttribute('aria-pressed') === 'true';
  return host.dataset.spwQueryComposerIncludeSettings === 'true';
}

export function syncQueryComposer(host) {
  if (!(host instanceof HTMLElement)) return null;

  const instruments = readComposerInstruments(host);
  const settings = getSettingsIfAvailable();
  const includeSettings = includeSettingsFlag(host);
  const search = buildQueryComposerSearch(instruments, {
    includeSettings,
    settings: settings || undefined,
  });
  const href = buildQueryComposerHref(instruments, {
    includeSettings,
    settings: settings || undefined,
  });

  host.dataset.spwQueryComposerSearch = search || '';
  host.dataset.spwQueryComposerHref = href;

  host.querySelectorAll('[data-spw-query-composer-preview]').forEach((node) => {
    node.textContent = search || '(authored path only)';
    if (node instanceof HTMLAnchorElement) node.href = href;
  });

  host.querySelectorAll('[data-spw-query-composer-href]').forEach((node) => {
    if (node instanceof HTMLAnchorElement) node.href = href;
  });

  const detail = { search, href, instruments, includeSettings };
  host.dispatchEvent(new CustomEvent('spw:query-composer-updated', {
    bubbles: true,
    detail,
  }));
  bus.emit?.('spw:query-composer-updated', detail);

  return detail;
}

function ensureInstrumentControls(host) {
  const fieldHost = host.querySelector('[data-spw-query-composer-fields]');
  if (!(fieldHost instanceof HTMLElement)) return;
  if (fieldHost.childElementCount > 0) return;

  const byGroup = new Map();
  QUERY_COMPOSER_INSTRUMENTS.forEach((instrument) => {
    const list = byGroup.get(instrument.group) || [];
    list.push(instrument);
    byGroup.set(instrument.group, list);
  });

  byGroup.forEach((instruments, group) => {
    const groupEl = document.createElement('div');
    groupEl.className = 'spw-query-composer__group';
    groupEl.dataset.spwQueryComposerGroup = group;

    const label = document.createElement('p');
    label.className = 'spw-query-composer__group-label';
    label.textContent = GROUP_LABELS[group] || group;
    groupEl.append(label);

    const row = document.createElement('div');
    row.className = 'spw-query-composer__chips vibe-widget-actions';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', GROUP_LABELS[group] || group);

    instruments.forEach((instrument) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'operator-chip';
      button.setAttribute('data-spw-query-composer-key', instrument.key);
      button.setAttribute('data-spw-query-composer-value', instrument.value);
      button.setAttribute('aria-pressed', 'false');
      button.dataset.spwQueryComposerState = 'off';
      button.title = instrument.hint || instrument.label;
      button.textContent = instrument.label;
      row.append(button);
    });

    groupEl.append(row);
    fieldHost.append(groupEl);
  });

  if (!host.querySelector('[data-spw-query-composer-include-settings]')) {
    const settingsRow = document.createElement('div');
    settingsRow.className = 'spw-query-composer__settings-row vibe-widget-actions';
    const settingsBtn = document.createElement('button');
    settingsBtn.type = 'button';
    settingsBtn.className = 'operator-chip';
    settingsBtn.setAttribute('data-spw-query-composer-include-settings', '');
    settingsBtn.setAttribute('aria-pressed', 'false');
    settingsBtn.textContent = 'Include settings deviations';
    settingsBtn.title = 'Merge non-default local settings into the share link';
    settingsRow.append(settingsBtn);
    fieldHost.append(settingsRow);
  }
}

function ensureChrome(host) {
  if (!host.querySelector('[data-spw-query-composer-preview]')) {
    const preview = document.createElement('code');
    preview.className = 'spw-query-composer__preview settings-query-preview';
    preview.setAttribute('data-spw-query-composer-preview', '');
    preview.textContent = '…';
    host.append(preview);
  }

  if (!host.querySelector('[data-spw-query-composer-actions]')) {
    const actions = document.createElement('div');
    actions.className = 'spw-query-composer__actions vibe-widget-actions';
    actions.setAttribute('data-spw-query-composer-actions', '');

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'operator-chip';
    copy.setAttribute('data-spw-query-composer-copy', '');
    copy.textContent = 'Copy link';

    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'operator-chip';
    apply.setAttribute('data-spw-query-composer-apply', '');
    apply.textContent = 'Apply setup';

    const offer = document.createElement('button');
    offer.type = 'button';
    offer.className = 'operator-chip';
    offer.setAttribute('data-spw-query-composer-cauldron', '');
    offer.textContent = 'Offer to cauldron';
    offer.title = 'Prime a shareable setup as a cauldron ingredient / spell capture';

    actions.append(copy, apply, offer);
    host.append(actions);
  }

  if (host.dataset.spwQueryComposerCompact === 'true' && !host.querySelector('[data-spw-query-composer-expand]')) {
    const expand = document.createElement('button');
    expand.type = 'button';
    expand.className = 'operator-chip spw-query-composer__expand';
    expand.setAttribute('data-spw-query-composer-expand', '');
    expand.setAttribute('aria-expanded', host.dataset.spwQueryComposerExpanded === 'true' ? 'true' : 'false');
    expand.textContent = host.dataset.spwQueryComposerExpanded === 'true' ? 'Collapse' : 'Expand setup';
    host.prepend(expand);
  }
}

/**
 * Fill a host that only has data-spw-query-composer (+ optional title) with full UI.
 */
export function hydrateQueryComposer(host) {
  if (!(host instanceof HTMLElement)) return host;

  if (!host.querySelector('[data-spw-query-composer-fields]')) {
    const fields = document.createElement('div');
    fields.setAttribute('data-spw-query-composer-fields', '');
    fields.className = 'spw-query-composer__fields';
    const insertBefore = host.querySelector('[data-spw-query-composer-preview], [data-spw-query-composer-actions]');
    if (insertBefore) host.insertBefore(fields, insertBefore);
    else host.append(fields);
  }

  ensureInstrumentControls(host);
  ensureChrome(host);
  seedInstrumentsFromLocation(host);
  syncQueryComposer(host);
  return host;
}

function offerToCauldron(host, detail) {
  const payload = {
    type: 'query-setup',
    label: host.getAttribute('data-spw-query-composer-label') || 'page setup link',
    href: detail.href,
    search: detail.search,
    instruments: detail.instruments,
    route: globalThis.location?.pathname || '/',
    source: 'query-link-composer',
  };

  bus.emit?.('cauldron:offer', payload);
  bus.emit?.('spell:capture', {
    snippet: detail.href,
    path: payload.route,
    kind: 'query-setup',
    source: 'query-link-composer',
  });
  bus.emit?.('spw:query-composer-offered', payload);

  document.dispatchEvent(new CustomEvent('spw:discovery-reward', {
    detail: {
      label: 'Share setup',
      title: 'Setup offered',
      summary: 'A query setup was offered to the cauldron and spell path.',
      href: detail.href,
      cta: 'Open cauldron',
      presentation: 'toast',
      cadence: 'learning',
      source: 'query-link-composer',
    },
  }));

  return payload;
}

function bindOneComposer(host) {
  if (!(host instanceof HTMLElement) || host.dataset.spwQueryComposerBound === 'true') {
    return {
      cleanup() {},
      refresh() {
        syncQueryComposer(host);
      },
    };
  }

  hydrateQueryComposer(host);
  host.dataset.spwQueryComposerBound = 'true';
  host.dataset.spwFeature = host.dataset.spwFeature || 'query-composer';

  const onClick = async (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const expand = target.closest('[data-spw-query-composer-expand]');
    if (expand instanceof HTMLElement && host.contains(expand)) {
      const next = host.dataset.spwQueryComposerExpanded !== 'true';
      host.dataset.spwQueryComposerExpanded = next ? 'true' : 'false';
      expand.setAttribute('aria-expanded', next ? 'true' : 'false');
      expand.textContent = next ? 'Collapse' : 'Expand setup';
      return;
    }

    const keyControl = target.closest('[data-spw-query-composer-key]');
    if (keyControl instanceof HTMLElement && host.contains(keyControl)) {
      if (keyControl instanceof HTMLInputElement) {
        // checkbox change fires separately
      } else {
        const next = keyControl.getAttribute('aria-pressed') !== 'true';
        keyControl.setAttribute('aria-pressed', next ? 'true' : 'false');
        keyControl.dataset.spwQueryComposerState = next ? 'on' : 'off';
      }
      syncQueryComposer(host);
      return;
    }

    const settingsToggle = target.closest('[data-spw-query-composer-include-settings]');
    if (settingsToggle instanceof HTMLElement && host.contains(settingsToggle)) {
      if (!(settingsToggle instanceof HTMLInputElement)) {
        const next = settingsToggle.getAttribute('aria-pressed') !== 'true';
        settingsToggle.setAttribute('aria-pressed', next ? 'true' : 'false');
        host.dataset.spwQueryComposerIncludeSettings = next ? 'true' : 'false';
      }
      syncQueryComposer(host);
      return;
    }

    if (target.closest('[data-spw-query-composer-copy]') && host.contains(target.closest('[data-spw-query-composer-copy]'))) {
      const detail = syncQueryComposer(host);
      const button = target.closest('[data-spw-query-composer-copy]');
      await handleCopyButton({
        text: detail?.href || window.location.href,
        button: button instanceof HTMLButtonElement ? button : undefined,
        labelCopied: '✓ copied link',
        labelFailed: '! copy failed',
        labelDefault: 'Copy link',
      });
      return;
    }

    if (target.closest('[data-spw-query-composer-apply]') && host.contains(target.closest('[data-spw-query-composer-apply]'))) {
      const detail = syncQueryComposer(host);
      if (detail?.href) window.location.assign(detail.href);
      return;
    }

    if (target.closest('[data-spw-query-composer-cauldron]') && host.contains(target.closest('[data-spw-query-composer-cauldron]'))) {
      const detail = syncQueryComposer(host);
      if (detail) offerToCauldron(host, detail);
    }
  };

  const onChange = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!host.contains(target)) return;
    if (target.hasAttribute('data-spw-query-composer-key')
      || target.hasAttribute('data-spw-query-composer-include-settings')) {
      syncQueryComposer(host);
    }
  };

  host.addEventListener('click', onClick);
  host.addEventListener('change', onChange);

  return {
    cleanup() {
      host.removeEventListener('click', onClick);
      host.removeEventListener('change', onChange);
      delete host.dataset.spwQueryComposerBound;
    },
    refresh() {
      seedInstrumentsFromLocation(host);
      syncQueryComposer(host);
    },
  };
}

/**
 * Bind all composers under root. Idempotent per host.
 */
export function bindQueryComposers(root = document) {
  const hosts = [...(root.querySelectorAll?.(QUERY_COMPOSER_SELECTOR) || [])]
    .filter((node) => node instanceof HTMLElement);

  if (!hosts.length) {
    return {
      cleanup() {},
      refresh() {},
    };
  }

  const bindings = hosts.map((host) => bindOneComposer(host));

  return {
    cleanup() {
      bindings.forEach((b) => b.cleanup());
    },
    refresh() {
      bindings.forEach((b) => b.refresh());
    },
  };
}

/**
 * Create a compact composer host for floating chrome / satchel injection.
 */
export function createQueryComposerElement(options = {}) {
  const host = document.createElement('section');
  host.className = 'spw-query-composer spw-query-composer--chrome';
  host.setAttribute('data-spw-query-composer', '');
  host.dataset.spwFeature = 'query-composer';
  host.dataset.spwQueryComposerCompact = options.compact === false ? 'false' : 'true';
  host.dataset.spwQueryComposerExpanded = options.expanded ? 'true' : 'false';
  host.setAttribute('data-spw-query-composer-label', options.label || 'share setup');
  host.setAttribute('data-spw-box-model', 'control-card');
  host.setAttribute('data-spw-measure-kind', 'objective');

  const kicker = document.createElement('p');
  kicker.className = 'spw-query-composer__kicker settings-panel-kicker';
  kicker.textContent = options.kicker || 'Share setup · query';

  const title = document.createElement('h3');
  title.className = 'spw-query-composer__title';
  title.textContent = options.title || 'Tune this page via link';

  const note = document.createElement('p');
  note.className = 'spw-query-composer__note frame-note';
  note.textContent = options.note
    || 'Build a shareable URL. Orchestration makes mounts learnable; theatrics scale ornament; cauldron can hold the setup.';

  host.append(kicker, title, note);
  hydrateQueryComposer(host);
  return host;
}

export function initQueryLinkComposer(ctx) {
  const root = ctx?.body || document;
  const binding = bindQueryComposers(root);
  // Return a mount handle only — the catalog/module-loader owns teardown.
  // Do not also ctx.addCleanup here (would double-run cleanup on destroy).
  return {
    cleanup: binding.cleanup,
    refresh: binding.refresh,
  };
}
