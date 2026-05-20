/**
 * Narrative instrumentation
 * ---------------------------------------------------------------------------
 * Purpose
 * - Turn prose tokens into inspectable handles without hiding the original text.
 * - Keep the behavior opt-in, reversible, and easy to read from the module tree.
 * - Let narrative mode support both discovery and debugging.
 */

import { bus } from '/public/js/kernel/bus.js';

const NARRATIVE_PROSE_SELECTOR = [
  'main p',
  'main li',
  'main blockquote',
  'main figcaption',
  '.frame-note',
  '.inline-note',
  '.spw-playable-hook',
  '.settings-note',
  '.settings-start-note',
  '.spw-narrative-copy',
  '[data-spw-narrative-copy]',
].join(', ');

const NARRATIVE_SKIP_SELECTOR = [
  '.nav *',
  'code *',
  'pre *',
  '.settings-option-copy *',
  '.vibe-widget-state *',
  '.spw-section-handle *',
  '.spw-narrative-drawer *',
  '.grammar-token',
  'a',
  'button',
].join(',');

const NARRATIVE_METADATA_SELECTOR = [
  '[data-spw-copy-depth]',
  '[data-spw-copy-label]',
  '[data-spw-copy-unit]',
  '[data-spw-copy-role]',
  '[data-spw-copy-purpose]',
  '[data-spw-semantic-expression]',
  '[data-spw-semantic-cluster]',
  '[data-spw-vocab]',
  '[data-spw-narrative-copy]',
  '[data-spw-narrative-implicit]',
].join(', ');

const NARRATIVE_IMPLICIT_CHARACTERS = new Set([
  'Spwashi',
  'Aetheris',
]);

const NARRATIVE_TOKEN_REGEX = /(@[A-Za-z0-9_]+|#[A-Za-z0-9_]+|\$[A-Za-z0-9_]+|![A-Za-z0-9_]+|\?[A-Za-z0-9_]+|["“][^"”]+["”])/g;
const NARRATIVE_DIALOGUE_ID = 'dialogue';
const NARRATIVE_DRAWER_CLASS = 'spw-narrative-drawer';
const NARRATIVE_MAX_CONTEXTS = 5;

export const SPW_NARRATIVE_INSTRUMENTATION_CONTRACT = Object.freeze({
  selector: NARRATIVE_PROSE_SELECTOR,
  skipSelector: NARRATIVE_SKIP_SELECTOR,
  metadataSelector: NARRATIVE_METADATA_SELECTOR,
  implicitSelector: '[data-spw-narrative-implicit~="characters"]',
  tokenKinds: Object.freeze(['character', 'location', 'prop', 'action', 'theme', 'dialogue']),
  resonanceFields: Object.freeze(['spwResonanceToken', 'spwResonanceProbe']),
  drawerClass: NARRATIVE_DRAWER_CLASS,
  portableUse:
    'Use this module when prose should reveal Spw tokens, narrative handles, and sentence contexts without losing the source text.',
});

const originalHtmls = new WeakMap();
let activeDrawer = null;
let currentResonanceToken = null;
let listenersBound = false;
let busUnsubscribe = null;

function escapeRegExp(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeToken(value = '') {
  return String(value || '')
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function applyNarrativeResonance(token, probe) {
  const html = document.documentElement;
  const id = normalizeToken(token);
  if (!id || id === NARRATIVE_DIALOGUE_ID) return;

  currentResonanceToken = id;
  html.dataset.spwResonanceToken = id;
  html.dataset.spwResonanceProbe = normalizeToken(probe || '');
  html.querySelectorAll('.grammar-token[data-id]').forEach((element) => {
    element.dataset.spwResonant = element.dataset.id === id ? 'true' : 'false';
  });
}

function clearNarrativeResonance() {
  currentResonanceToken = null;
  delete document.documentElement.dataset.spwResonanceToken;
  delete document.documentElement.dataset.spwResonanceProbe;
  document.documentElement.querySelectorAll('.grammar-token[data-spw-resonant]').forEach((element) => {
    delete element.dataset.spwResonant;
  });
}

function restoreNarrativeContent() {
  const proseElements = document.querySelectorAll(NARRATIVE_PROSE_SELECTOR);
  proseElements.forEach((element) => {
    if (!originalHtmls.has(element)) return;
    element.innerHTML = originalHtmls.get(element);
    originalHtmls.delete(element);
  });
}

function bindNarrativeListeners() {
  if (listenersBound) return;
  document.addEventListener('mouseenter', handleGlobalHover, true);
  document.addEventListener('mouseleave', handleGlobalHover, true);
  document.addEventListener('focusin', handleGlobalFocus, true);
  document.addEventListener('focusout', handleGlobalFocus, true);
  document.addEventListener('click', handleGlobalClick);
  document.addEventListener('keydown', handleGlobalKeydown);
  listenersBound = true;
}

function unbindNarrativeListeners() {
  if (!listenersBound) return;
  document.removeEventListener('mouseenter', handleGlobalHover, true);
  document.removeEventListener('mouseleave', handleGlobalHover, true);
  document.removeEventListener('focusin', handleGlobalFocus, true);
  document.removeEventListener('focusout', handleGlobalFocus, true);
  document.removeEventListener('click', handleGlobalClick);
  document.removeEventListener('keydown', handleGlobalKeydown);
  listenersBound = false;
}

function tokenizeElement(element) {
  if (originalHtmls.has(element)) return;
  originalHtmls.set(element, element.innerHTML);

  walkAndTokenize(element);
}

function walkAndTokenize(parent) {
  const childNodes = Array.from(parent.childNodes);

  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const value = child.nodeValue || '';
      if (!value.trim()) continue;

      const fragments = processText(value, parent);
      if (!fragments.length) continue;

      const replacement = document.createDocumentFragment();
      fragments.forEach((fragment) => replacement.appendChild(fragment));
      parent.replaceChild(replacement, child);
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    if (shouldSkipNode(child)) continue;
    walkAndTokenize(child);
  }
}

function shouldSkipNode(node) {
  if (!(node instanceof Element)) return true;
  return node.matches(NARRATIVE_SKIP_SELECTOR);
}

function processText(text, owner) {
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(NARRATIVE_TOKEN_REGEX);
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(...processImplicitTokens(text.slice(lastIndex, matchIndex), owner));
    }

    parts.push(createTokenSpan(match[0]));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(...processImplicitTokens(text.slice(lastIndex), owner));
  }

  return parts;
}

function processImplicitTokens(text, owner) {
  if (!allowsImplicitCharacters(owner)) {
    return [document.createTextNode(text)];
  }

  const words = text.split(/(\b[A-Z][A-Za-z0-9_]+\b)/);
  const parts = [];

  for (let index = 0; index < words.length; index += 1) {
    const word = words[index];
    if (!word) continue;

    if (index % 2 === 1 && NARRATIVE_IMPLICIT_CHARACTERS.has(word)) {
      parts.push(createTokenSpan(`@${word}`));
      continue;
    }

    parts.push(document.createTextNode(word));
  }

  return parts;
}

function allowsImplicitCharacters(owner) {
  if (!(owner instanceof Element)) return false;
  return Boolean(owner.closest('[data-spw-narrative-implicit~="characters"]'));
}

function createTokenSpan(tokenText) {
  const span = document.createElement('span');
  span.className = 'grammar-token';
  span.tabIndex = 0;

  const token = parseNarrativeToken(tokenText);
  if (token.kind === 'dialogue') {
    span.classList.add('token-dialogue');
    span.dataset.spwOperator = 'stream';
    span.dataset.spwNarrativeToken = 'dialogue';
    span.dataset.kind = 'dialogue';
    span.dataset.id = NARRATIVE_DIALOGUE_ID;
    span.textContent = tokenText;
    return span;
  }

  span.classList.add(`token-${token.kind}`);
  span.dataset.spwOperator = token.operator;
  span.dataset.spwNarrativeToken = token.kind;
  span.dataset.kind = token.kind;
  span.dataset.id = token.id;
  span.dataset.raw = token.value;

  const sigilSpan = document.createElement('span');
  sigilSpan.className = 'token-sigil';
  sigilSpan.textContent = token.sigil;

  span.appendChild(sigilSpan);
  span.appendChild(document.createTextNode(token.value));
  return span;
}

function parseNarrativeToken(tokenText) {
  if (tokenText.startsWith('@')) {
    return {
      kind: 'character',
      operator: 'ref',
      sigil: '~',
      value: tokenText.slice(1),
    };
  }

  if (tokenText.startsWith('#')) {
    return {
      kind: 'location',
      operator: 'frame',
      sigil: '#>',
      value: tokenText.slice(1),
    };
  }

  if (tokenText.startsWith('$')) {
    return {
      kind: 'prop',
      operator: 'object',
      sigil: '^',
      value: tokenText.slice(1),
    };
  }

  if (tokenText.startsWith('!')) {
    return {
      kind: 'action',
      operator: 'action',
      sigil: '@',
      value: tokenText.slice(1),
    };
  }

  if (tokenText.startsWith('?')) {
    return {
      kind: 'theme',
      operator: 'probe',
      sigil: '?',
      value: tokenText.slice(1),
    };
  }

  return {
    kind: 'dialogue',
    operator: 'stream',
    sigil: '',
    value: tokenText,
  };
}

function handleGlobalHover(event) {
  const target = event.target.closest?.('.grammar-token');
  if (!target) return;

  if (event.type === 'mouseenter') {
    applyNarrativeResonance(target.dataset.id, target.dataset.spwOperator);
    return;
  }

  clearNarrativeResonance();
}

function handleGlobalFocus(event) {
  const target = event.target.closest?.('.grammar-token');
  if (!target) return;

  if (event.type === 'focusin') {
    applyNarrativeResonance(target.dataset.id, target.dataset.spwOperator);
    return;
  }

  clearNarrativeResonance();
}

function handleGlobalClick(event) {
  const token = event.target.closest('.grammar-token');
  if (token) {
    event.preventDefault();
    if (token.dataset.id === NARRATIVE_DIALOGUE_ID) return;
    showInspectorDrawer(token);
    return;
  }

  if (activeDrawer && !activeDrawer.contains(event.target)) {
    dismissInspectorDrawer();
  }
}

function handleGlobalKeydown(event) {
  if (event.key === 'Escape') {
    dismissInspectorDrawer();
  }
}

function dismissInspectorDrawer() {
  if (!activeDrawer) return;
  activeDrawer.remove();
  activeDrawer = null;
}

function findOccurrences(id, name) {
  const sentences = [];
  const prose = document.querySelectorAll(NARRATIVE_PROSE_SELECTOR);
  const namePattern = new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i');

  prose.forEach((paragraph) => {
    const tokens = paragraph.querySelectorAll(`.grammar-token[data-id="${id}"]`);
    if (!tokens.length) return;

    const segments = String(paragraph.textContent || '').split(/(?<=[.?!])\s+/);
    segments.forEach((segment) => {
      if (!namePattern.test(segment) || segment.trim().length <= 4) return;
      sentences.push({ text: segment.trim(), element: paragraph });
    });
  });

  return sentences.filter((sentence, index, all) => (
    all.findIndex((other) => other.text === sentence.text) === index
  ));
}

function showInspectorDrawer(token) {
  dismissInspectorDrawer();

  const id = token.dataset.id || '';
  const name = token.dataset.raw || '';
  const kind = token.dataset.kind || 'dialogue';
  const op = token.dataset.spwOperator || 'stream';
  const sigil = token.querySelector('.token-sigil')?.textContent || '';
  const metadata = collectNarrativeMetadata(token);

  const occurrences = findOccurrences(id, name);
  const totalCount = document.querySelectorAll(`.grammar-token[data-id="${id}"]`).length;
  const seed = generateSpwSeed(name, kind, totalCount);

  const drawer = document.createElement('div');
  drawer.className = NARRATIVE_DRAWER_CLASS;
  drawer.dataset.spwMetamaterial = 'glass';
  drawer.dataset.spwDrawerState = 'open';
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'false');
  drawer.setAttribute('aria-label', `Narrative inspector for ${name}`);
  drawer.innerHTML = `
    <button class="drawer-close" aria-label="Close narrative inspector">×</button>
    <div class="drawer-header">
      <span class="operator-chip" data-spw-operator="${op}">${escapeHtml(`${sigil}${kind}`)}</span>
      <h3>${escapeHtml(name)}</h3>
    </div>
    <div class="drawer-body">
      ${buildNarrativeMetadataMarkup(metadata)}
      <div class="drawer-stats">
        <span>Occurrences on this page: <strong>${totalCount}</strong></span>
      </div>
      <div class="drawer-sentences">
        <h4>Sentence Contexts</h4>
        <ul>
          ${buildSentenceListMarkup(occurrences)}
        </ul>
      </div>
      <div class="drawer-spw-seed">
        <h4>Spw Entity Seed</h4>
        <pre><code class="language-spw">${escapeHtml(seed)}</code></pre>
        <button class="copy-seed-btn operator-chip" data-spw-operator="action">Copy Seed</button>
      </div>
    </div>
  `;

  document.body.appendChild(drawer);
  activeDrawer = drawer;

  drawer.querySelector('.drawer-close')?.addEventListener('click', dismissInspectorDrawer);
  drawer.querySelectorAll('.context-jump-btn').forEach((button, index) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const occurrence = occurrences[index];
      if (!occurrence?.element) return;

      occurrence.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      occurrence.element.classList.add('prose-pulse-highlight');
      window.setTimeout(() => {
        occurrence.element.classList.remove('prose-pulse-highlight');
      }, 1200);
    });
  });

  drawer.querySelector('.copy-seed-btn')?.addEventListener('click', (event) => {
    event.stopPropagation();
    navigator.clipboard.writeText(seed).then(() => {
      const button = drawer.querySelector('.copy-seed-btn');
      if (!button) return;
      const original = button.textContent;
      button.textContent = 'Copied!';
      button.classList.add('copy-success');
      window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('copy-success');
      }, 1500);
    }).catch(() => {
      const button = drawer.querySelector('.copy-seed-btn');
      if (!button) return;
      button.textContent = 'Copy failed';
      window.setTimeout(() => {
        button.textContent = 'Copy Seed';
      }, 1500);
    });
  });
}

function collectNarrativeMetadata(token) {
  const owner = token.closest(NARRATIVE_METADATA_SELECTOR);

  if (!owner) {
    return {
      copyDepth: '',
      copyLabel: '',
      copyUnit: '',
      copyRole: '',
      copyPurpose: '',
      semanticExpression: '',
      semanticCluster: '',
      vocab: '',
      narrativeCopy: '',
    };
  }

  return {
    copyDepth: owner.dataset.spwCopyDepth || '',
    copyLabel: owner.dataset.spwCopyLabel || '',
    copyUnit: owner.dataset.spwCopyUnit || '',
    copyRole: owner.dataset.spwCopyRole || '',
    copyPurpose: owner.dataset.spwCopyPurpose || '',
    semanticExpression: owner.dataset.spwSemanticExpression || '',
    semanticCluster: owner.dataset.spwSemanticCluster || '',
    vocab: owner.dataset.spwVocab || '',
    narrativeCopy: owner.dataset.spwNarrativeCopy || '',
  };
}

function buildNarrativeMetadataMarkup(metadata) {
  const chips = [];

  if (metadata.copyDepth) chips.push(['Copy depth', metadata.copyDepth]);
  if (metadata.copyLabel) chips.push(['Copy label', metadata.copyLabel]);
  if (metadata.copyUnit) chips.push(['Copy unit', metadata.copyUnit]);
  if (metadata.copyRole) chips.push(['Copy role', metadata.copyRole]);
  if (metadata.copyPurpose) chips.push(['Copy purpose', metadata.copyPurpose]);
  if (metadata.semanticExpression) chips.push(['Semantic expression', metadata.semanticExpression]);
  if (metadata.semanticCluster) chips.push(['Semantic cluster', metadata.semanticCluster]);
  if (metadata.vocab) chips.push(['Vocabulary', metadata.vocab]);
  if (metadata.narrativeCopy) chips.push(['Narrative copy', metadata.narrativeCopy]);

  if (!chips.length) {
    return '';
  }

  return `
    <div class="drawer-metadata">
      <h4>Copy context</h4>
      <ul class="drawer-metadata-list">
        ${chips.map(([label, value]) => `<li><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></li>`).join('')}
      </ul>
    </div>
  `;
}

function buildSentenceListMarkup(occurrences) {
  if (!occurrences.length) {
    return '<li>No clear sentence boundaries parsed.</li>';
  }

  return occurrences
    .slice(0, NARRATIVE_MAX_CONTEXTS)
    .map((occurrence, index) => (
      `<li><button class="context-jump-btn" data-index="${index}">${escapeHtml(occurrence.text)}</button></li>`
    ))
    .join('');
}

function generateSpwSeed(name, kind, count) {
  const id = normalizeToken(name);
  const seedId = `narrative_seed_${id}`;
  const quotedName = JSON.stringify(name);

  switch (kind) {
    case 'character':
      return `@${quotedName} {
  role: "character"
  id: "${id}"
  spw-consequence: "memory"
  occurrences: ${count}
  seed: "${seedId}"
}`;
    case 'location':
      return `#>${quotedName} {
  role: "location"
  id: "${id}"
  spw-surface: "spatial"
  occurrences: ${count}
  seed: "${seedId}"
}`;
    case 'prop':
      return `^${quotedName} {
  role: "prop"
  id: "${id}"
  spw-form: "object"
  occurrences: ${count}
  seed: "${seedId}"
}`;
    case 'action':
      return `@${quotedName} {
  role: "action"
  id: "${id}"
  spw-form: "expression"
  occurrences: ${count}
  seed: "${seedId}"
}`;
    case 'theme':
      return `?${quotedName} {
  role: "theme"
  id: "${id}"
  spw-form: "concept"
  occurrences: ${count}
  seed: "${seedId}"
}`;
    default:
      return `${quotedName} {
  role: "dialogue"
  occurrences: ${count}
}`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setNarrativeModeFromValue(value) {
  const mode = normalizeToken(value);
  if (mode === 'on') {
    enableNarrativeInstrumentation();
    return;
  }
  disableNarrativeInstrumentation();
}

export function initNarrativeInstrumentation() {
  const html = document.documentElement;
  setNarrativeModeFromValue(html.dataset.spwNarrativeMode);

  if (busUnsubscribe) busUnsubscribe();
  busUnsubscribe = bus.on('settings:changed', (event) => {
    const settings = event.detail || {};
    setNarrativeModeFromValue(settings.narrativeMode);
  });

  return {
    cleanup() {
      disableNarrativeInstrumentation();
      if (busUnsubscribe) {
        busUnsubscribe();
        busUnsubscribe = null;
      }
    },
  };
}

function enableNarrativeInstrumentation() {
  const proseElements = document.querySelectorAll(NARRATIVE_PROSE_SELECTOR);
  proseElements.forEach(tokenizeElement);
  bindNarrativeListeners();
}

function disableNarrativeInstrumentation() {
  restoreNarrativeContent();
  unbindNarrativeListeners();
  clearNarrativeResonance();
  dismissInspectorDrawer();
}
