/**
 * Spw Spells
 *
 * Serializes grounded tokens into a readable spellbook so navigation can feel
 * like collecting operators, scopes, and projections instead of merely
 * changing pages.
 */

import { bus } from './spw-bus.js';
import { detectOperator, getOperatorDefinition } from './spw-shared.js';
import { getGroundedCouplings, getGroundedRegistry } from './spw-haptics.js';

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

let initialized = false;
let cleanupCallbacks = [];

function isCompactSpellDockViewport() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function getGroundedEntries() {
  const registry = getGroundedRegistry();
  const couplings = getGroundedCouplings();

  return registry.map((key, index) => buildSpellEntry(key, couplings[key], index)).filter(Boolean);
}

function buildSpellEntry(key, coupling = {}, index = 0) {
  const expression = String(
    coupling?.expression
    || coupling?.label
    || coupling?.text
    || inferExpressionFromKey(key)
  ).trim();

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
    context: coupling?.context || document.body?.dataset?.spwSurface || 'surface',
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
  const prefixCounts = new Map();
  const destinationCounts = new Map();
  const combos = new Map();

  entries.forEach((entry, index) => {
    prefixCounts.set(entry.prefix || '.', (prefixCounts.get(entry.prefix || '.') || 0) + 1);
    destinationCounts.set(entry.destination, (destinationCounts.get(entry.destination) || 0) + 1);

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

  return {
    entries,
    prefixCounts: [...prefixCounts.entries()],
    destinationCounts: [...destinationCounts.entries()],
    combos: [...combos.values()],
    snippet: constructSpell(entries),
  };
}

function constructSpell(entries) {
  const timestamp = new Date().toISOString();
  const surface = document.body?.dataset.spwSurface || 'surface';

  const lines = [
    '@cast_spell("navigation_lattice")',
    `#:surface !${surface}`,
    `=grounded ${entries.length}`,
    `#:at "${timestamp}"`,
    '',
    '^"collected_navigation"{',
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
  const scopeCount = entries.filter((entry) => entry.destination === 'scope').length;
  const projectionCount = entries.filter((entry) => entry.destination === 'projection').length;
  const lensCount = entries.filter((entry) => entry.destination === 'lens').length;
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

  const count = dock.querySelector('.spw-spell-dock-count');
  const label = dock.querySelector('.spw-spell-dock-label');
  const body = dock.querySelector('.spw-spell-dock-body');

  dock.dataset.spwViewport = compactViewport ? 'compact' : 'default';
  if (count) count.textContent = String(model.entries.length);
  if (label) {
    label.textContent = model.entries.length
      ? 'spellbook'
      : 'collect lines';
  }

  if (!body) return;

  if (!model.entries.length) {
    body.innerHTML = `
      <p class="spell-note">Ground route links, page lines, or operator chips to collect a readable navigation spell.</p>
    `;
    return;
  }

  const preview = model.entries
    .slice(-(compactViewport ? 3 : 4))
    .map(renderSpellAtom)
    .join('');
  const destinationCounts = compactViewport
    ? model.destinationCounts.slice(0, 2)
    : model.destinationCounts;
  const destinations = destinationCounts.map(([key, countValue]) => {
    const labelValue = DESTINATION_LABELS[key] || key;
    return `<span class="spell-register">${escapeHtml(labelValue)} · ${countValue}</span>`;
  }).join('');

  if (compactViewport) {
    body.innerHTML = `
      <div class="spell-visual spell-visual--compact">${preview}</div>
      <div class="spell-register-strip">${destinations}</div>
      <p class="spell-note spell-note--compact">Collected navigation lines. Use the full spell board on a wider surface when you want the serialized source.</p>
    `;
    return;
  }

  body.innerHTML = `
    <div class="spell-visual spell-visual--compact">${preview}</div>
    <div class="spell-register-strip">${destinations}</div>
    <pre class="spell-source spell-source--compact"><code>${escapeHtml(model.snippet)}</code></pre>
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
        No navigation spell collected yet. Follow routes, section lines, or operator chips to gather a readable sequence.
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
    : '<span class="spell-register">collect another token to form a sequence</span>';

  board.innerHTML = `
    <div class="spell-visual">
      ${model.entries.map(renderSpellAtom).join('')}
    </div>
    <div class="spell-ledger">
      <p class="spell-note">Prefix notation shapes intent. Postfix notation shapes what the interaction does next.</p>
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
  `;

  bindSpellActions(board);
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
      bus.emit('spell:checkpoint', { name: `spell_${Date.now()}` });
      if (button instanceof HTMLElement) button.textContent = '! checkpointed';
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
    bus.on('spell:checkpoint-restored', renderAllSpellSurfaces),
  ];

  const handleResize = () => {
    renderAllSpellSurfaces();
  };
  const handleStorage = (event) => {
    if (!event.key || event.key.startsWith('spw-grounded') || event.key.startsWith('spw-coupling')) {
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
