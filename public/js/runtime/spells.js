/**
 * Spw Spells
 *
 * Serializes grounded tokens into a readable spellbook so navigation can feel
 * like assembling replayable operators, scopes, and projections instead of
 * merely changing pages.
 */

import { bus } from '/public/js/kernel/bus.js';
import { composeOpBundle, detectOperator, getOperatorDefinition, getOperatorGeometry } from '/public/js/kernel/shared.js';
import { getActiveRecentPathMemory } from '/public/js/interface/accent-palette.js';
import { getGroundedCouplings, getGroundedRegistry, getSigilCollection, restoreCheckpoint } from '/public/js/interface/haptics.js';
import { describeCognitiveState } from '/public/js/runtime/cognitive-state.js';
import { getSiteSettings } from '/public/js/kernel/site-settings.js';
import { CAULDRON_CONTRACT } from '/public/js/interface/cauldron/contract.js';

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
const HYPERMEDIA_CAPABILITIES = Object.freeze([
  Object.freeze({ key: 'trail', label: 'trail', value: 'route + hash memory' }),
  Object.freeze({ key: 'anchor', label: 'anchor', value: 'deep-link fragments' }),
  Object.freeze({ key: 'state', label: 'state', value: 'settings + Spw context' }),
  Object.freeze({ key: 'resume', label: 'resume', value: 'checkpoint working sets' }),
]);
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

function getCurrentDeepLinkState() {
  const url = new URL(window.location.href);
  const hashId = decodeURIComponent(url.hash.replace(/^#/, ''));
  const target = hashId ? document.getElementById(hashId) : null;
  const label = target instanceof HTMLElement
    ? (
      target.dataset.spwDeepLinkLabel
      || target.getAttribute('aria-label')
      || target.querySelector?.('h1, h2, h3, h4, .frame-sigil, .page-kicker')?.textContent?.trim()
      || target.id
    )
    : '';

  return {
    route: url.pathname,
    hash: url.hash,
    href: `${url.pathname}${url.search}${url.hash}`,
    label: label || (url.hash ? hashId : 'route top'),
    semanticExpression: target instanceof HTMLElement
      ? (
        target.dataset.spwSemanticExpression
        || target.dataset.spwFeature
        || target.dataset.spwKind
        || target.dataset.spwRole
        || ''
      )
      : '',
  };
}

function getGroundedEntries() {
  const registry = getGroundedRegistry();
  const couplings = getGroundedCouplings();
  const settings = (typeof window !== 'undefined' && window.spwSettings && typeof window.spwSettings.get === 'function') ? window.spwSettings.get() : (getSiteSettings ? getSiteSettings() : {});
  const density = settings.semanticDensity || 'medium';
  const physics = settings.physicsReason || 'playful';

  return registry.map((key, index) => buildSpellEntry(key, couplings[key], index, {density, physics})).filter(Boolean);
}

function getSpellExpression(key, coupling = {}) {
  return String(
    coupling?.expression
    || coupling?.label
    || coupling?.text
    || inferExpressionFromKey(key)
  ).trim();
}

function buildSpellEntry(key, coupling = {}, index = 0, context = {}) {
  const expression = getSpellExpression(key, coupling);

  if (!expression) return null;

  const detected = detectOperator(expression) || getOperatorDefinition(coupling?.substrate || '');
  const prefix = coupling?.prefix || detected?.prefix || inferPrefix(expression);
  const postfix = coupling?.postfix || inferPostfix(expression, prefix);
  const nucleus = inferNucleus(expression, prefix, postfix);
  const operatorType = detected?.type || coupling?.substrate || 'ref';
  const operatorGeometry = getOperatorGeometry(operatorType) || getOperatorGeometry(prefix);
  const destination = coupling?.destination || inferDestination(postfix, expression);
  const {density = 'medium', physics = 'playful'} = context || {};

  const vocabRich = density === 'rich';
  const spellEase = (physics.includes('spring') || physics === 'playful') ? 'fluid' : (physics === 'precise' ? 'deliberate' : 'standard');
  const enrichedPostfix = vocabRich ? (postfix + ' · ' + (coupling?.wonder || 'wonder')) : postfix;

  return {
    index,
    key,
    label: coupling?.label || expression,
    expression,
    prefix,
    postfix: enrichedPostfix,
    nucleus,
    operatorType,
    operatorLabel: detected?.label || operatorType,
    operatorGeometry,
    destination,
    href: coupling?.href || null,
    deepLink: coupling?.deepLink || null,
    deepLinkLabel: coupling?.deepLinkLabel || null,
    wonder: coupling?.wonder || 'orientation',
    context: coupling?.context || getSpellSurface(),
    group: coupling?.group || 'routes',
    groundedAt: coupling?.groundedAt || 0,
    settingsContext: {density, physics, ease: spellEase},
  };
}

function inferExpressionFromKey(key = '') {
  const value = String(key).split(':').pop() || '';
  if (value.startsWith('/')) return `~${value.replace(/\W+/g, '_')}`;
  return value.replace(/\s+/g, '_');
}

function inferPrefix(expression = '') {
  return expression.match(/^(#>|#:|#|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<|\(|\[|\{)/)?.[0] || '~';
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
  const narrationMode = document.documentElement.dataset.spwMeaningMode || 'readable';
  const deepLinkState = getCurrentDeepLinkState();
  const cognitiveState = {
    ...describeCognitiveState({
    signalCount: entries.length,
    recentPath: getActiveRecentPathMemory(),
    currentPath: window.location.pathname,
    currentSurface: getSpellSurface(),
    pageArrival: document.documentElement.dataset.spwPageArrival || '',
    pageTransitionPhase: document.documentElement.dataset.spwPageTransitionPhase || '',
    pageLiminality: document.body?.dataset.spwLiminality || '',
    }),
    narrationMode,
  };

  return {
    entries,
    prefixCounts,
    destinationCounts,
    combos,
    narrationMode,
    cognitiveState,
    deepLinkState,
    snippet: constructSpell(entries, cognitiveState, deepLinkState),
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

function constructSpell(entries, cognitiveState = null, deepLinkState = null) {
  const timestamp = new Date().toISOString();
  const route = deepLinkState?.route || window.location.pathname;
  const deepLink = deepLinkState?.href || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const anchor = deepLinkState?.hash || '#route-top';
  const anchorLabel = deepLinkState?.label || 'route top';
  const spwSemantic = deepLinkState?.semanticExpression || '.route';
  const lines = [
    '!cast_spell("navigation_lattice")',
    `#surface "${getSpellSurface()}"`,
    `#route "${escapeSpellString(route)}"`,
    `#deep_link "${escapeSpellString(deepLink)}"`,
    `@anchor "${escapeSpellString(anchor)}"`,
    `^"spw_semantics" "${escapeSpellString(spwSemantic)}"`,
    `=grounded ${entries.length}`,
    `@timestamp "${timestamp}"`,
    '',
    '^"replayable_navigation"{',
    `  #>current "${escapeSpellString(anchorLabel)}" ~"${escapeSpellString(deepLink)}" #:anchor`,
  ];

  entries.forEach((entry) => {
    const destination = entry.destination || 'projection';
    const href = entry.deepLink || entry.href || entry.key;
    const geometry = entry.operatorGeometry?.geometry || 'operator';
    const anchorMark = String(href).includes('#') ? ' @hash' : '';
    lines.push(`  ${entry.expression} ~"${escapeSpellString(href)}" #:${destination} ^${geometry}${anchorMark}`);
  });

  lines.push('}');
  lines.push('');
  lines.push('&"processing_hints"{');

  buildProjectionNotes(entries, cognitiveState, deepLinkState).forEach((note) => {
    lines.push(`  ${note}`);
  });

  if (cognitiveState) {
    lines.push(`  ~"familiarity" =${cognitiveState.familiarity}`);
    lines.push(`  ~"liminality" =${cognitiveState.liminality}`);
    if (cognitiveState.narrationMode && cognitiveState.narrationMode !== 'readable') {
      lines.push(`  ~"meaning_mode" =${cognitiveState.narrationMode}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function buildProjectionNotes(entries, cognitiveState = null, deepLinkState = null) {
  const destinationCounts = new Map(countBy(entries, (entry) => entry.destination));
  const scopeCount = destinationCounts.get('scope') || 0;
  const projectionCount = destinationCounts.get('projection') || 0;
  const lensCount = destinationCounts.get('lens') || 0;
  const anchoredCount = entries.filter((entry) => String(entry.deepLink || entry.href || '').includes('#')).length;
  const notes = [];

  if (scopeCount) notes.push(`~"scope_entries" =${scopeCount}`);
  if (projectionCount) notes.push(`>surface_jumps =${projectionCount}`);
  if (lensCount) notes.push(`<topic_lenses> =${lensCount}`);
  if (anchoredCount) notes.push(`#deep_linked_fragments =${anchoredCount}`);
  if (deepLinkState?.hash) {
    notes.push(`~"current_hash" "${escapeSpellString(deepLinkState.hash)}"`);
    notes.push('!"preserve_hash_anchor"');
  }

  if (scopeCount && projectionCount) {
    notes.push('!"carry_local_scope_into_surface"');
  } else if (projectionCount) {
    notes.push('!"continue_across_pages"');
  } else if (scopeCount) {
    notes.push('!"read_down_into_sections"');
  }

  if (!notes.length) {
    notes.push('.gather_more_routes');
  }

  if (cognitiveState?.familiarity === 'fresh') {
    notes.push('!"learn_the_shape"');
  } else if (['familiar', 'practiced'].includes(cognitiveState?.familiarity)) {
    notes.push('!"return_to_familiar_ground"');
  } else if (['fluent', 'habitual'].includes(cognitiveState?.familiarity)) {
    notes.push('!"customize_with_confidence"');
  }

  if (cognitiveState?.liminality && cognitiveState.liminality !== 'settled') {
    notes.push('!"hold_threshold_open"');
  }

  return notes;
}

function escapeSpellString(value = '') {
  return String(value)
    .replaceAll('\\', '\\\\')
    .replaceAll('"', '\\"')
    .replaceAll('\n', '\\n');
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
  dock.dataset.spwHypermediaExtension = 'trail state resume';
  dock.dataset.textKind = 'ledger';
  dock.dataset.textDensity = 'soft';
  dock.dataset.textMeasure = 'tight';
  dock.dataset.textProjection = 'indent';

  const summary = document.createElement('summary');
  summary.className = 'spw-spell-dock-summary';
  summary.innerHTML = `
    <span class="spw-spell-dock-op">@</span>
    <span class="spw-spell-dock-label">path extensions</span>
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
  dock.dataset.spwSpellFamiliarity = model.cognitiveState.familiarity;
  dock.dataset.spwSpellLiminality = model.cognitiveState.liminality;
  dock.dataset.spwSpellCognitive = model.cognitiveState.gradient;
  dock.dataset.spwSpellMeaningMode = model.narrationMode;
  if (parts.count) parts.count.textContent = String(model.entries.length);
  if (parts.label) parts.label.textContent = model.entries.length ? 'path extensions' : 'link trail';

  if (!parts.body) return;

  if (!model.entries.length) {
    parts.body.innerHTML = renderEmptySpellDock();
    return;
  }

  const preview = renderSpellAtomStrip(model.entries, compactViewport ? 3 : 4);
  const destinations = renderDestinationRegisters(
    compactViewport ? model.destinationCounts.slice(0, 2) : model.destinationCounts
  );
  const cognitive = renderCognitiveRegisters(model.cognitiveState, model.narrationMode);
  const effects = renderRuntimeEffectRegisters();
  const collection = renderSigilCollectionRegister();

  if (compactViewport) {
    parts.body.innerHTML = renderCompactSpellDock(preview, cognitive, effects, destinations, collection, model.narrationMode);
    return;
  }

  parts.body.innerHTML = renderExpandedSpellDock(preview, cognitive, effects, destinations, collection, model.snippet, model.narrationMode);
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
    ${renderCapabilityStrip()}
    <p class="spell-note">Ground links, page sections, or operator chips to extend the document with a resumable trail. The dock shows when the path is still <strong>fresh</strong>, when it becomes <strong>familiar</strong>, and when it is ready to replay.</p>
  `;
}

function renderCapabilityStrip(extra = []) {
  const items = [...HYPERMEDIA_CAPABILITIES, ...extra];
  return `
    <div class="spell-capability-strip" aria-label="Hypermedia capabilities">
      ${items.map((item) => `
        <span class="spell-capability" data-spw-hypermedia-capability="${escapeHtml(item.key)}">
          <span class="spell-capability__label">${escapeHtml(item.label)}</span>
          <span class="spell-capability__value">${escapeHtml(item.value)}</span>
        </span>
      `).join('')}
    </div>
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

function renderCognitiveRegisters(cognitiveState, narrationMode = 'readable') {
  const narrationRegisters = narrationMode && narrationMode !== 'readable'
    ? [`<span class="spell-register">meaning · ${escapeHtml(narrationMode)}</span>`]
    : [];

  return [
    `<span class="spell-register">familiarity · ${escapeHtml(cognitiveState.familiarity)}</span>`,
    `<span class="spell-register">liminality · ${escapeHtml(cognitiveState.liminality)}</span>`,
    ...narrationRegisters,
  ].join('');
}

function renderRuntimeEffectRegisters() {
  const root = document.documentElement;
  const values = [
    ['timing', root.dataset.spwInteractionTuner || 'balanced'],
    ['lighting', root.dataset.spwColorTuner || root.dataset.spwColorMode || 'system'],
    ['density', root.dataset.spwSemanticDensity || 'medium'],
    ['flavor', root.dataset.spwPedagogicalFlavor || 'neutral'],
  ];

  return values
    .map(([key, value]) => `<span class="spell-register" data-spw-effect-axis="${escapeHtml(key)}">${escapeHtml(key)} · ${escapeHtml(value)}</span>`)
    .join('');
}

function renderSigilCollectionRegister() {
  const sigils = Object.values(getSigilCollection())
    .sort((a, b) => Number(b.lastCollectedAt || 0) - Number(a.lastCollectedAt || 0))
    .slice(0, 6);

  if (!sigils.length) {
    return '<span class="spell-register">sigils · ground chips to collect</span>';
  }

  return sigils.map((sigil) => (
    `<span class="spell-register" data-spw-operator="${escapeHtml(sigil.type || '')}" data-spw-collected="true">${escapeHtml(sigil.prefix || '')} · ${escapeHtml(sigil.label || sigil.type || 'sigil')} ×${Number(sigil.count || 1)}</span>`
  )).join('');
}

function renderCompactSpellDock(preview, cognitive, effects, destinations, collection, narrationMode = 'readable') {
  const narrationNote = narrationMode === 'inspect'
    ? ' <strong>Inspect mode</strong> keeps the scaffold visible while the shape is still being learned.'
    : narrationMode === 'quiet'
      ? ' <strong>Quiet mode</strong> keeps the dock lean while it still carries the same memory.'
      : '';

  return `
    ${renderCapabilityStrip()}
    <div class="spell-visual spell-visual--compact">${preview}</div>
    <div class="spell-register-strip spell-register-strip--cognitive">${cognitive}</div>
    <div class="spell-register-strip spell-register-strip--effects">${effects}</div>
    <div class="spell-register-strip spell-register-strip--sigils">${collection}</div>
    <div class="spell-register-strip">${destinations}</div>
    <p class="spell-note spell-note--compact"><strong>Replayable hypermedia</strong>: familiar paths help you return, liminal paths show the edge you are crossing, and settings keep the trail legible.${narrationNote}</p>
  `;
}

function renderExpandedSpellDock(preview, cognitive, effects, destinations, collection, snippet, narrationMode = 'readable') {
  const narrationNote = narrationMode === 'inspect'
    ? ' <strong>Inspect mode</strong> keeps the scaffold visible while the shape is still being learned.'
    : narrationMode === 'quiet'
      ? ' <strong>Quiet mode</strong> keeps the dock lean while it still carries the same memory.'
      : '';

  return `
    ${renderCapabilityStrip()}
    <div class="spell-visual spell-visual--compact">${preview}</div>
    <div class="spell-register-strip spell-register-strip--cognitive">${cognitive}</div>
    <div class="spell-register-strip spell-register-strip--effects">${effects}</div>
    <div class="spell-register-strip spell-register-strip--sigils">${collection}</div>
    <div class="spell-register-strip">${destinations}</div>
    ${narrationNote ? `<p class="spell-note spell-note--compact">${narrationNote}</p>` : ''}
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
  board.dataset.spwSpellFamiliarity = model.cognitiveState.familiarity;
  board.dataset.spwSpellLiminality = model.cognitiveState.liminality;
  board.dataset.spwSpellCognitive = model.cognitiveState.gradient;
  board.dataset.spwSpellMeaningMode = model.narrationMode;

  if (!model.entries.length) {
    board.innerHTML = `
      <p class="frame-note">
        No path extension assembled yet. Follow links, section lines, or operator chips to build a readable sequence you can replay. Fresh paths become familiar when you ground a few more signals.
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
  const cognitiveSummary = renderCognitiveRegisters(model.cognitiveState, model.narrationMode);
  const effectSummary = renderRuntimeEffectRegisters();
  const collectionSummary = renderSigilCollectionRegister();
  const narrationNote = model.narrationMode === 'inspect'
    ? ' <strong>Inspect mode</strong> keeps the scaffold visible so the shape is easier to learn.'
    : model.narrationMode === 'quiet'
      ? ' <strong>Quiet mode</strong> keeps the spellboard compact while it still rewards return visits.'
      : '';

  board.innerHTML = `
    ${renderCapabilityStrip([
      { key: 'output', label: 'output', value: 'copy or cast a portable snippet' },
    ])}
    <div class="spell-visual">
      ${model.entries.map(renderSpellAtom).join('')}
    </div>
    <div class="spell-ledger">
      <p class="spell-note"><strong>A spell is a hypermedia extension.</strong> It saves route and hash anchors beside settings, page state, and operator geometry. The left side of an operator carries source, stance, or evidence; the right side carries argument, containment, target, or consequence. <strong>Familiarity</strong> tells you how quickly the page should feel readable. <strong>Liminality</strong> tells you whether you are entering, holding, or settled.${narrationNote}</p>
      <div class="spell-register-strip spell-register-strip--cognitive">${cognitiveSummary}</div>
      <div class="spell-register-strip spell-register-strip--effects">${effectSummary}</div>
      <div class="spell-register-strip spell-register-strip--sigils">${collectionSummary}</div>
      <div class="spell-register-strip">${prefixSummary}</div>
      <div class="spell-register-strip">${destinationSummary}</div>
      <div class="spell-register-strip">${comboSummary}</div>
    </div>
    <pre class="spell-source"><code>${escapeHtml(model.snippet)}</code></pre>
    <div class="spell-actions">
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.CAST}" data-spw-operator="action">
        ! copy extension
      </button>
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.CHECKPOINT}" data-spw-operator="pragma">
        ! save trail
      </button>
      <button class="operator-chip" type="button" data-spw-spell-action="${SPELL_ACTION.RESET}" data-spw-operator="binding">
        = clear trail
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
      <p class="spell-note">Saved working sets preserve named learning or build threads so you can return without rebuilding the whole path. A good bundle should feel <strong>easier to resume than to rediscover</strong>.</p>
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
        <button class="operator-chip" type="button" data-spw-spell-decompose="${escapeHtml(bundle.name)}" data-spw-operator="substrate" title="Reopen this spell as cauldron ingredients for editing">
          $ decompose
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
  const hasProvenance = !!(entry.gestureHistory || entry.provenance || entry.spellTrail);
  const provenance = entry.gestureHistory || entry.provenance || entry.spellTrail || '';
  const provenanceAttr = hasProvenance ? ` data-spw-garden-provenance data-spw-spell-trail="${escapeHtml(provenance)}" title="Gesture chain that grew this spell: ${escapeHtml(provenance)}"` : '';
  const provenanceChip = hasProvenance
    ? `<span class="spell-provenance__chip" aria-hidden="true">✧</span>`
    : '';
  const geometry = entry.operatorGeometry || {};
  const geometryAttrs = [
    ['data-spw-operator-left-role', geometry.leftRole],
    ['data-spw-operator-right-role', geometry.rightRole],
    ['data-spw-operator-flow', geometry.flow],
    ['data-spw-operator-brace-bias', geometry.braceBias],
    ['data-spw-operator-geometry', geometry.geometry],
    ['data-spw-operator-overload', geometry.overload],
    ['data-spw-operator-charge-role', geometry.chargeRole],
    ['data-spw-deep-link', entry.deepLink || entry.href],
    ['data-spw-deep-link-label', entry.deepLinkLabel],
  ]
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}="${escapeHtml(value)}"`)
    .join(' ');

  return `
    <span class="spell-ingredient" data-spw-atom="chip" data-spw-grounded="true" data-spw-operator="${escapeHtml(entry.operatorType)}" data-spw-op="${escapeHtml(composeOpBundle(entry.expression || entry.nucleus || ''))}" ${geometryAttrs}${provenanceAttr}>
      <span class="spell-ingredient-prefix">${escapeHtml(entry.prefix || '')}</span>
      <span class="spell-ingredient-nucleus">${escapeHtml(entry.nucleus || entry.expression)}</span>
      <span class="spell-ingredient-postfix">${escapeHtml(entry.postfix || '')}</span>
      ${provenanceChip}
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

  root.querySelectorAll('[data-spw-spell-decompose]').forEach((button) => {
    if (button.dataset.spwSpellBound === 'true') return;
    button.dataset.spwSpellBound = 'true';
    button.addEventListener('click', () => {
      const bundleName = button.dataset.spwSpellDecompose;
      window.spwSpells?.decompose(bundleName, button);
    });
  });
}

function registerSpellActions() {
  window.spwSpells = {
    cast(button) {
      const snippet = buildSpellModel().snippet;
      bus.emit('spell:cast', { snippet, path: window.location.pathname });

      // Learnability/reward via credits (similar architecture): casting surfaces the composed state as ephemeral credit.
      // Teaches that spells are replayable extractions of attention/ingredients from cauldron state.
      document.dispatchEvent(new CustomEvent('spw:discovery-reward', {
        detail: {
          label: 'Path extension',
          title: 'Extension copied',
          summary: 'Current route/hash anchors, Spw expression, page state, and operator geometry composed into a replayable hypermedia snippet. Cauldron gather, trail resume, and settings context stay connected.',
          href: '/design/palettes/#spell-cauldron-hooks',
          cta: 'See trail hooks',
          presentation: 'credits',
          rewardKind: 'spell-cauldron-literacy',
          cadence: 'reward',
        },
      }));

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(snippet).then(() => {
          if (button instanceof HTMLElement) button.textContent = '! extension copied';
        }).catch(() => {});
      }
    },
    checkpoint(button) {
      const name = window.prompt('Save deep-link trail or working set as:', `Working Set - ${new Date().toLocaleDateString()}`);
      if (!name) return;
      bus.emit('spell:checkpoint', { name });
      if (button instanceof HTMLElement) button.textContent = `! trail saved: ${name}`;
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
      if (button instanceof HTMLElement) button.textContent = '= trail cleared';
    },
    /* Decompose: reopen a saved spell as cauldron ingredients (edit = decompose,
       adjust, re-mix). Ingredients enter through the same spell:capture front
       door as hold-priming, so the cauldron owns all storage mutations. */
    decompose(name, button) {
      if (!name) return;
      const parsed = parseSpellBundle(localStorage.getItem(`${SPELL_BUNDLE_PREFIX}${name}`));
      const registry = Array.isArray(parsed?.registry) ? parsed.registry : [];
      if (!registry.length) {
        if (button instanceof HTMLElement) button.textContent = '$ nothing to decompose';
        return;
      }
      registry.slice(0, CAULDRON_CONTRACT.maxIngredients).forEach((key) => {
        const tail = String(key).split(':').pop() || String(key);
        bus.emit(CAULDRON_CONTRACT.events.capture, {
          expression: tail,
          label: tail,
          origin: 'spellbook-decompose',
          originLabel: name,
          primedBy: 'decompose',
          sourceElement: String(key),
          gestureHistory: `spell->decompose->gather:${tail}`,
        }, { target: document });
      });
      bus.emit(CAULDRON_CONTRACT.events.decomposed, {
        name,
        count: Math.min(registry.length, CAULDRON_CONTRACT.maxIngredients),
        total: registry.length,
        path: parsed?.path || '',
      });
      if (button instanceof HTMLElement) button.textContent = `$ reopened as ${Math.min(registry.length, CAULDRON_CONTRACT.maxIngredients)} ingredients`;
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
    bus.on('memory:recent-path', renderAllSpellSurfaces),
    bus.on('settings:changed', renderAllSpellSurfaces),
    bus.on('page-attention-state', renderAllSpellSurfaces),
    bus.on('page-transition-state', renderAllSpellSurfaces),
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
