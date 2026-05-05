/**
 * Spw Spells
 *
 * Serializes grounded tokens into a readable spellbook so navigation can feel
 * like assembling replayable operators, scopes, and projections instead of
 * merely changing pages.
 */

import { bus } from '/public/js/kernel/spw-bus.js';
import { detectOperator, getOperatorDefinition } from '/public/js/kernel/spw-shared.js';
import { getGroundedCouplings, getGroundedRegistry, restoreCheckpoint } from '/public/js/interface/spw-haptics.js';

const SPELL_ACTION = Object.freeze({
  CAST: 'cast',
  CHECKPOINT: 'checkpoint',
  RESET: 'reset',
});

const DESTINATION_LABELS = Object.freeze({
  projection: 'surface jumps',
  scope: 'scope entries',
  settle: 'local returns',
  lens: 'topic lenses',
});
const SPELL_BUNDLE_PREFIX = 'spw-checkpoint:';
const bundleDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

let initialized = false;
let cleanupCallbacks = [];

function isCompactSpellDockViewport() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function getSpellSurface() {
  return document.body?.dataset.spwSurface || 'surface';
}

function getGroundedEntries() {
  const registry = getGroundedRegistry();
  const couplings = getGroundedCouplings();

  return registry.map((key, index) => buildSpellEntry(key, couplings[key], index)).filter(Boolean);
}

function getSpellExpression(key, coupling = {}) {
  return String(
    coupling?.expression
    || coupling?.label
    || coupling?.text
    || inferExpressionFromKey(key)
  ).trim();
}

function buildSpellEntry(key, coupling = {}, index = 0) {
  const expression = getSpellExpression(key, coupling);

  if (!expression) return null;

  const detected = detectOperator(expression) || getOperatorDefinition(coupling?.substrate || '');
  const prefix = coupling?.prefix || detected?.prefix || inferPrefix(expression);
  const postfix = coupling?.postfix || inferPostfix(expression, prefix);
  const nucleus = inferNucleus(expression, prefix, postfix);
  const operatorType = detected?.type || coupling?.substrate || 'ref';
  const destination = coupling?.destination || inferDestination(postfix, expression);

  return {
    index,
    key,
    label: coupling?.label || expression,
    expression,
    prefix,
    postfix,
    nucleus,
    operatorType,
    operatorLabel: detected?.label || operatorType,
    destination,
    href: coupling?.href || null,
    wonder: coupling?.wonder || 'orientation',
    context: coupling?.context || getSpellSurface(),
    group: coupling?.group || 'routes',
    groundedAt: coupling?.groundedAt || 0,
  };
}

function inferExpressionFromKey(key = '') {
  const value = String(key).split(':').pop() || '';
  if (value.startsWith('/')) return `~${value.replace(/\W+/g, '_')}`;
  return value.replace(/\s+/g, '_');
}

function inferPrefix(expression = '') {
  return expression.match(/^(#>|#:|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<)/)?.[0] || '~';
}

function inferPostfix(expression = '', prefix = '') {
  if (prefix === '<' && expression.endsWith('>')) return '';
  if (expression.endsWith('{')) return '{';
  if (expression.endsWith('>')) return '>';
  if (expression.endsWith('.')) return '.';
  return '';
}

function inferNucleus(expression = '', prefix = '', postfix = '') {
  if (!expression) return '';
  if (prefix === '<' && expression.endsWith('>')) {
    return expression.slice(1, -1);
  }

  let start = prefix ? expression.slice(prefix.length) : expression;
  if (postfix && start.endsWith(postfix)) {
    start = start.slice(0, -postfix.length);
  }
  return start.trim();
}

function inferDestination(postfix = '', expression = '') {
  if (postfix === '{') return 'scope';
  if (postfix === '>') return 'projection';
  if (expression.startsWith('<') && expression.endsWith('>')) return 'lens';
  return 'settle';
}

function buildSpellModel() {
  const entries = getGroundedEntries();
  const prefixCounts = countBy(entries, (entry) => entry.prefix || '.');
  const destinationCounts = countBy(entries, (entry) => entry.destination);
  const combos = buildSpellCombos(entries);

  return {
    entries,
    prefixCounts,
    destinationCounts,
    combos,
    snippet: constructSpell(entries),
  };
}

function countBy(items, getKey) {
  const counts = new Map();

  items.forEach((item, index) => {
    const key = getKey(item, index);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()];
}

function buildSpellCombos(entries) {
  const combos = new Map();

  entries.forEach((entry, index) => {
    if (index === 0) return;
    const previous = entries[index - 1];
    const comboKey = `${previous.operatorType}->${entry.destination}`;
    combos.set(comboKey, {
      key: comboKey,
      from: previous.operatorType,
      to: entry.destination,
      expression: `${previous.expression} + ${entry.expression}`,
    });
  });

  return [...combos.values()];
}

function constructSpell(entries) {
  const timestamp = new Date().toISOString();
  const lines = [
    '@cast_spell("navigation_lattice")',
    `#:surface !${getSpellSurface()}`,
    `=grounded ${entries.length}`,
    `#:at "${timestamp}"`,
    '',
    '^"replayable_navigation"{',
  ];

  entries.forEach((entry) => {
    const destination = entry.destination || 'projection';
    const href = entry.href || entry.key;
    lines.push(`  ${entry.expression} ~"${href}" #:${destination}`);
  });

  lines.push('}');
  lines.push('');
  lines.push('&"processing_hints"{');

  buildProjectionNotes(entries).forEach((note) => {
    lines.push(`  ${note}`);
  });

  lines.push('}');
  return lines.join('\n');
}

function buildProjectionNotes(entries) {
  const destinationCounts = new Map(countBy(entries, (entry) => entry.destination));
  const scopeCount = destinationCounts.get('scope') || 0;
  const projectionCount = destinationCounts.get('projection') || 0;
  const lensCount = destinationCounts.get('lens') || 0;
  const notes = [];

  if (scopeCount) notes.push(`~"scope_entries" =${scopeCount}`);
  if (projectionCount) notes.push(`>surface_jumps =${projectionCount}`);
  if (lensCount) notes.push(`<topic_lenses> =${lensCount}`);

  if (scopeCount && projectionCount) {
    notes.push('@"carry_local_scope_into_surface"');
  } else if (projectionCount) {
    notes.push('@"continue_across_pages"');
  } else if (scopeCount) {
    notes.push('@"read_down_into_sections"');
  }

  if (!notes.length) {
    notes.push('.gather_more_routes');
  }

  return notes;
}

function ensureHeaderTraceHost() {
  const header = document.querySelector('body > header, .site-header');
  if (!header) return null;

  let host = header.querySelector('.spw-header-trace');
  if (host) return host;

  host = document.createElement('div');
  host.className = 'spw-header-trace';
  header.appendChild(host);
  return host;
}

function ensureSpellDock() {
  const features = document.body?.dataset.spwFeatures?.split(/\s+/) || [];
  if (!features.includes('shell-trace') && !features.includes('spells')) {
    return null;
  }

  const host = ensureHeaderTraceHost();
  if (!host) return null;

  let dock = host.querySelector('.spw-spell-dock');
  if (dock) return dock;

  dock = document.createElement('details');
  dock.className = 'spw-spell-dock';
  dock.setAttribute('data-spw-flow', 'pretext');
  dock.dataset.textKind = 'ledger';
  dock.dataset.textDensity = 'soft';
  dock.dataset.textMeasure = 'tight';
  dock.dataset.textProjection = 'indent';

  const summary = document.createElement('summary');
  summary.className = 'spw-spell-dock-summary';
  summary.innerHTML = `
    <span class="spw-spell-dock-op">@</span>
    <span class="spw-spell-dock-label">spellbook</span>
    <span class="spw-spell-dock-count">0</span>
  `;

  const body = document.createElement('div');
  body.className = 'spw-spell-dock-body';

  dock.append(summary, body);
  host.appendChild(dock);
  return dock;
}

function updateSpellDock(model) {
  const dock = ensureSpellDock();
  if (!dock) return;
  const compactViewport = isCompactSpellDockViewport();

  const parts = getSpellDockParts(dock);

  dock.dataset.spwViewport = compactViewport ? 'compact' : 'default';
  if (parts.count) parts.count.textContent = String(model.entries.length);
  if (parts.label) parts.label.textContent = model.entries.length ? 'spellbook' : 'ground lines';

  if (!parts.body) return;

  if (!model.entries.length) {
    parts.body.innerHTML = renderEmptySpellDock();
    return;
  }

  const preview = renderSpellAtomStrip(model.entries, compactViewport ? 3 : 4);
  const destinations = renderDestinationRegisters(
    compactViewport ? model.destinationCounts.slice(0, 2) : model.destinationCounts
  );

  if (compactViewport) {
    parts.body.innerHTML = renderCompactSpellDock(preview, destinations);
    return;
  }

  parts.body.innerHTML = renderExpandedSpellDock(preview, destinations, model.snippet);
}

function getSpellDockParts(dock) {
  return {
    count: dock.querySelector('.spw-spell-dock-count'),
    label: dock.querySelector('.spw-spell-dock-label'),
    body: dock.querySelector('.spw-spell-dock-body'),
  };
}

function renderEmptySpellDock() {
  return `
    <p class="spell-note">Ground route links, page lines, or operator chips to assemble a readable navigation spell you can replay.</p>
  `;
}

function renderSpellAtomStrip(entries, limit) {
  return entries
    .slice(-limit)
    .map(renderSpellAtom)
    .join('');
}

function renderDestinationRegisters(destinationCounts = []) {
  return destinationCounts.map(([key, countValue]) => {
    const labelValue = DESTINATION_LABELS[key] || key;
    return `<span class="spell-register">${escapeHtml(labelValue)} · ${countValue}</span>`;
  }).join('');
}

function renderCompactSpellDock(preview, destinations) {
  return `
    <div class="spell-visual spell-visual--compact">${preview}</div>
    <div class="spell-register-strip">${destinations}</div>
    <p class="spell-note spell-note--compact">Replayable navigation lines. Use the full spell board on a wider surface when you want the serialized source.</p>
  `;
}

function renderExpandedSpellDock(preview, destinations, snippet) {
  return `
    <div class="spell-visual spell-visual--compact">${preview}</div>
    <div class="spell-register-strip">${destinations}</div>
    <pre class="spell-source spell-source--compact"><code>${escapeHtml(snippet)}</code></pre>
  `;
}

function updateSpellBoards(model) {
  document.querySelectorAll('[data-spw-role="spell-board"] .spell-board-content, [data-spw-role="spell-board"].spell-board-content, .spell-board-content[data-spw-role="spell-board"]').forEach((board) => {
    renderSpellBoard(board, model);
  });
}

function renderSpellBoard(board, model) {
  if (!(board instanceof HTMLElement)) return;

  if (!model.entries.length) {
    board.innerHTML = `
      <p class="frame-note">
        No navigation spell assembled yet. Follow routes, section lines, or operator chips to build a readable sequence you can replay.
      </p>
    `;
    return;
  }

  const prefixSummary = model.prefixCounts.map(([prefix, count]) => {
    const definition = detectOperator(prefix) || getOperatorDefinition(prefix);
    const label = definition?.label || prefix;
    return `<span class="spell-register">${escapeHtml(prefix)} · ${count} ${escapeHtml(label)}</span>`;
  }).join('');

  const destinationSummary = model.destinationCounts.map(([destination, count]) => {
    const label = DESTINATION_LABELS[destination] || destination;
    return `<span class="spell-register">${escapeHtml(label)} · ${count}</span>`;
  }).join('');

  const comboSummary = model.combos.length
    ? model.combos.slice(0, 4).map((combo) => (
      `<span class="spell-register">${escapeHtml(combo.from)} → ${escapeHtml(combo.to)}</span>`
    )).join('')
    : '<span class="spell-register">ground another token to complete the sequence</span>';

  board.innerHTML = `
    <div class="spell-visual">
      ${model.entries.map(renderSpellAtom).join('')}
    </div>
    <div class="spell-ledger">
      <p class="spell-note">A spell is a small replayable outcome. Prefix notation shapes intent. Postfix notation shapes what the interaction does next.</p>
      <div class="spell-register-strip">${prefixSummary}</div>
      <div class="spell-register-strip">${destinationSummary}</div>
      <div class="spell-register-strip">${comboSummary}</div>
    </div>
    <pre class="spell-source"><code>${escapeHtml(model.snippet)}</code></pre>
    <div class="spell-actions">
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.CAST}" data-spw-operator="action">
        @ cast_spell
      </button>
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.CHECKPOINT}" data-spw-operator="pragma">
        ! checkpoint
      </button>
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.RESET}" data-spw-operator="binding">
        = clear_spell
      </button>
    </div>
    ${buildSavedBundlesUI()}
  `;

  bindSpellActions(board);
}

function buildSavedBundlesUI() {
  const bundles = listSpellBundles();
  if (!bundles.length) return '';

  return renderSavedBundles(bundles);
}

function listSpellBundles() {
  return Object.keys(localStorage)
    .filter((key) => key.startsWith(SPELL_BUNDLE_PREFIX))
    .map(parseSpellBundleEntry)
    .sort((a, b) => b.savedAt - a.savedAt);
}

function parseSpellBundleEntry(key) {
  const name = key.slice(SPELL_BUNDLE_PREFIX.length);
  const parsed = parseSpellBundle(localStorage.getItem(key));
  return {
    name,
    count: Array.isArray(parsed?.registry) ? parsed.registry.length : 0,
    path: parsed?.path || '',
    savedAt: Number(parsed?.savedAt || 0),
  };
}

function renderSavedBundles(bundles) {
  return `
    <div class="spell-bundle-bank">
      <p class="spell-note">Saved working sets preserve named learning or build threads so you can return without rebuilding the whole path.</p>
      <div class="spell-bundle-grid">
        ${bundles.map(renderSavedBundleCard).join('')}
      </div>
    </div>
  `;
}

function renderSavedBundleCard(bundle) {
  return `
    <article class="spell-bundle-card">
      <div class="spell-bundle-card__header">
        <strong class="spell-bundle-card__title">${escapeHtml(bundle.name)}</strong>
        <span class="spell-register">working set</span>
      </div>
      <p class="spell-bundle-card__meta">${escapeHtml(formatSpellBundleMeta(bundle))}</p>
      <div class="spell-actions spell-actions--bundles">
        <button class="operator-chip" type="button" data-spw-spell-restore="${escapeHtml(bundle.name)}" data-spw-operator="ref">
          ~ restore "${escapeHtml(bundle.name)}"
        </button>
      </div>
    </article>
  `;
}

function parseSpellBundle(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatSpellBundleMeta(bundle) {
  const parts = [];
  if (bundle.count) parts.push(`${bundle.count} grounded`);
  if (bundle.path) parts.push(bundle.path);
  if (bundle.savedAt) parts.push(bundleDateFormatter.format(bundle.savedAt));
  return parts.join(' · ') || 'Saved working set';
}

function renderSpellAtom(entry) {
  return `
    <span class="spell-ingredient" data-spw-atom="chip" data-spw-grounded="true" data-spw-operator="${escapeHtml(entry.operatorType)}">
      <span class="spell-ingredient-prefix">${escapeHtml(entry.prefix || '')}</span>
      <span class="spell-ingredient-nucleus">${escapeHtml(entry.nucleus || entry.expression)}</span>
      <span class="spell-ingredient-postfix">${escapeHtml(entry.postfix || '')}</span>
    </span>
  `;
}

function bindSpellActions(root) {
  root.querySelectorAll('[data-spw-spell-action]').forEach((button) => {
    if (button.dataset.spwSpellBound === 'true') return;
    button.dataset.spwSpellBound = 'true';
    button.addEventListener('click', () => {
      const action = button.dataset.spwSpellAction;
      if (action === SPELL_ACTION.CAST) window.spwSpells?.cast(button);
      if (action === SPELL_ACTION.CHECKPOINT) window.spwSpells?.checkpoint(button);
      if (action === SPELL_ACTION.RESET) window.spwSpells?.reset(button);
    });
  });

  root.querySelectorAll('[data-spw-spell-restore]').forEach((button) => {
    if (button.dataset.spwSpellBound === 'true') return;
    button.dataset.spwSpellBound = 'true';
    button.addEventListener('click', () => {
      const bundleName = button.dataset.spwSpellRestore;
      window.spwSpells?.restore(bundleName, button);
    });
  });
}

function registerSpellActions() {
  window.spwSpells = {
    cast(button) {
      const snippet = buildSpellModel().snippet;
      bus.emit('spell:cast', { snippet, path: window.location.pathname });

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(snippet).then(() => {
          if (button instanceof HTMLElement) button.textContent = '@ cast (copied)';
        }).catch(() => {});
      }
    },
    checkpoint(button) {
      const name = window.prompt('Save spell or working set as:', `Working Set - ${new Date().toLocaleDateString()}`);
      if (!name) return;
      bus.emit('spell:checkpoint', { name });
      if (button instanceof HTMLElement) button.textContent = `! saved: ${name}`;
      renderAllSpellSurfaces();
    },
    restore(name, button) {
      if (!name) return;
      if (restoreCheckpoint(name) && button instanceof HTMLElement) {
        button.textContent = '~ restored';
      }
    },
    reset(button) {
      bus.emit('spell:reset', { source: 'spell-board' });
      if (button instanceof HTMLElement) button.textContent = '= cleared';
    },
  };
}

function renderAllSpellSurfaces() {
  const model = buildSpellModel();
  updateSpellDock(model);
  updateSpellBoards(model);
}

export function initSpwSpells() {
  if (initialized) {
    return {
      cleanup() {},
      refresh() {
        renderAllSpellSurfaces();
      },
    };
  }

  initialized = true;
  registerSpellActions();
  renderAllSpellSurfaces();

  cleanupCallbacks = [
    bus.on('spell:reset', renderAllSpellSurfaces),
    bus.on('spell:grounded', renderAllSpellSurfaces),
    bus.on('spell:ungrounded', renderAllSpellSurfaces),
    bus.on('spell:checkpoint-saved', renderAllSpellSurfaces),
    bus.on('spell:checkpoint-restored', renderAllSpellSurfaces),
  ];

  const handleResize = () => {
    renderAllSpellSurfaces();
  };
  const handleStorage = (event) => {
    if (
      !event.key
      || event.key.startsWith('spw-grounded')
      || event.key.startsWith('spw-coupling')
      || event.key.startsWith(SPELL_BUNDLE_PREFIX)
    ) {
      renderAllSpellSurfaces();
    }
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('storage', handleStorage);

  return {
    cleanup() {
      cleanupCallbacks.forEach((off) => off?.());
      cleanupCallbacks = [];
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
      initialized = false;
    },
    refresh() {
      renderAllSpellSurfaces();
    },
  };
}
