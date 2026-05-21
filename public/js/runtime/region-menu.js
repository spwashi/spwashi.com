import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';
import { bus } from '/public/js/kernel/bus.js';
import {
  collectSemanticBraceMatches,
  deriveSemanticBraceExpression,
  parseSemanticBraceExpression,
} from '/public/js/semantic/semantic-braces.js';
import { normalizeText, normalizeToken } from '/public/js/semantic/semantic-utils.js';

const TARGET_SELECTOR = [
  '.spw-delimiter',
  '.frame-sigil',
  '.frame-card-sigil',
  '.operator-chip',
  '[data-spw-feature]',
  '[data-spw-semantic-expression]',
  '[data-spw-semantic-root]',
].join(', ');

const MENU_ID = 'spw-region-menu';
const PREVIEW_DELAY_MS = Object.freeze({
  calm: 780,
  responsive: 520,
  expressive: 360,
});

let activeTarget = null;
let activeMatches = [];
let activeIndex = 0;
let previewTimer = null;
let previewTarget = null;

export function initSpwRegionMenu(root = document) {
  const doc = root?.nodeType === Node.DOCUMENT_NODE ? root : document;
  const body = doc.body;
  if (!body || body.dataset.spwRegionMenuInit === '1') return;

  body.dataset.spwRegionMenuInit = '1';
  body.addEventListener('click', onClick, true);
  body.addEventListener('contextmenu', onContextMenu, true);
  body.addEventListener('pointerenter', onPointerEnter, true);
  body.addEventListener('pointerleave', onPointerLeave, true);
  body.addEventListener('keydown', onKeyDown, true);
}

function onClick(event) {
  const target = resolveTarget(event.target);
  if (!target) return;

  if (target.classList.contains('spw-delimiter')) {
    event.preventDefault();
    openMenu(target);
    return;
  }

  if (event.altKey || event.metaKey || target.dataset.spwRegionPreview === 'true') {
    if (isNavigable(target) && !event.altKey && !event.metaKey) return;
    event.preventDefault();
    openMenu(target);
  }
}

function onContextMenu(event) {
  const target = resolveTarget(event.target);
  if (!target) return;

  event.preventDefault();
  openMenu(target);
}

function onPointerEnter(event) {
  const target = resolveTarget(event.target);
  if (!target) return;

  clearPreviewTimer();
  previewTimer = window.setTimeout(() => {
    previewTarget = target;
    writeDatasetValue(target, 'spwRegionPreview', 'true');
    writeDatasetValue(document.documentElement, 'spwRegionPreviewing', 'true');
  }, getPreviewDelay());
}

function onPointerLeave(event) {
  const target = resolveTarget(event.target);
  if (!target) return;

  clearPreviewTimer();
  if (previewTarget === target) {
    writeDatasetValue(target, 'spwRegionPreview', null);
    writeDatasetValue(document.documentElement, 'spwRegionPreviewing', null);
    previewTarget = null;
  }
}

function onKeyDown(event) {
  const menu = document.getElementById(MENU_ID);

  if (event.key === 'Escape') {
    closeMenu();
    return;
  }

  if (menu?.contains(event.target)) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveMenuFocus(menu, event.key === 'ArrowDown' ? 1 : -1);
    }
    return;
  }

  const target = resolveTarget(event.target);
  if (!target) return;

  if ((event.key === 'Enter' && event.altKey) || event.key === '?') {
    event.preventDefault();
    openMenu(target);
  }
}

function resolveTarget(node) {
  return node?.closest?.(TARGET_SELECTOR) || null;
}

function isNavigable(target) {
  return target instanceof HTMLAnchorElement && target.hasAttribute('href');
}

function openMenu(target) {
  activeTarget = target;

  const semantic = resolveSemantic(target);
  const frame = target.closest('.site-frame, [data-spw-kind], [data-spw-role]') || document.body;
  activeMatches = semantic.family ? collectRegionMatches(document, semantic.family) : [];
  activeIndex = Math.max(0, activeMatches.indexOf(target));

  setRegionFocus(target, semantic);

  const menu = ensureMenu();
  menu.replaceChildren(buildMenuContent(target, semantic, frame));
  positionMenu(menu, target);
  writeDatasetValue(menu, 'spwState', 'open');
  writeDatasetValue(target, 'spwRegionMenuTarget', 'true');
  document.documentElement.dataset.spwRegionMenu = 'open';
  bus.emit?.('region-menu:opened', {
    target,
    semantic,
    matchCount: activeMatches.length,
    contract: Object.fromEntries(buildContract(target, semantic, frame)),
  });

  const firstButton = menu.querySelector('button');
  firstButton?.focus?.({ preventScroll: true });
}

function ensureMenu() {
  let menu = document.getElementById(MENU_ID);
  if (menu) return menu;

  menu = document.createElement('div');
  menu.id = MENU_ID;
  menu.className = 'spw-region-menu';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Spw region menu');
  document.body.appendChild(menu);
  return menu;
}

function buildMenuContent(target, semantic, frame) {
  const fragment = document.createDocumentFragment();
  const title = document.createElement('p');
  title.className = 'spw-region-menu__title';
  title.textContent = semantic.key || semantic.expression || readableTarget(target);
  fragment.appendChild(title);

  const summary = document.createElement('p');
  summary.className = 'spw-region-menu__summary';
  summary.textContent = buildSummary(semantic, target, frame);
  fragment.appendChild(summary);

  const contract = buildContract(target, semantic, frame);
  if (contract.length) {
    const list = document.createElement('dl');
    list.className = 'spw-region-menu__contract';
    contract.forEach(([label, value]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const desc = document.createElement('dd');
      desc.textContent = value;
      list.append(term, desc);
    });
    fragment.appendChild(list);
  }

  if (shouldShowTuningHandles()) {
    const handles = document.createElement('div');
    handles.className = 'spw-region-menu__handles';
    [
      ['salience', 'Salience', '--spw-salience'],
      ['charge', 'Charge', '--charge'],
    ].forEach(([id, label, variable]) => {
      const row = document.createElement('div');
      row.className = 'spw-region-menu__handle-row';
      const labelEl = document.createElement('label');
      labelEl.textContent = label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = '0';
      input.max = '1';
      input.step = '0.01';
      input.value = readUnitValue(getComputedStyle(target).getPropertyValue(variable));
      input.addEventListener('input', (event) => {
        target.style.setProperty(variable, event.target.value);
        writeDatasetValue(target, `spw${id.charAt(0).toUpperCase() + id.slice(1)}`, event.target.value);
        bus.emit?.('region-menu:tuned', {
          target,
          id,
          value: event.target.value,
          variable,
        });
      });
      row.append(labelEl, input);
      handles.appendChild(row);
    });
    fragment.appendChild(handles);
  }

  // Composition Suggestions
  const suggestions = buildSuggestions(semantic, target);
  if (suggestions.length) {
    const suggestTitle = document.createElement('p');
    suggestTitle.className = 'spw-region-menu__subtitle';
    suggestTitle.textContent = 'Suggested Spells';
    fragment.appendChild(suggestTitle);

    const list = document.createElement('div');
    list.className = 'spw-region-menu__suggestions';
    suggestions.forEach(([label, spell]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'spw-suggestion-chip';
      button.textContent = label;
      button.title = spell;
      button.addEventListener('click', () => {
        copyToClipboard(spell, button);
      });
      list.appendChild(button);
    });
    fragment.appendChild(list);
  }

  const actions = [
    ['focus', 'Focus matches', () => focusMatches(target, semantic)],
    ['next', 'Next variant', () => moveMatch(1)],
    ['prev', 'Previous variant', () => moveMatch(-1)],
    ['capture', 'Capture spell', () => captureSpell(target, semantic)],
    ['charge', 'Charge region', () => toggleRegionCharge(target)],
    ['copy', 'Copy Spw seed', () => copySeed(target, semantic, frame)],
    ['clear', 'Clear focus', () => clearRegionFocus()],
  ];

  actions.forEach(([action, label, handler]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.dataset.spwRegionAction = action;
    button.textContent = label;
    button.addEventListener('click', handler);
    fragment.appendChild(button);
  });

  return fragment;
}

function captureSpell(target, semantic) {
  bus.emit?.('spell:capture', {
    expression: semantic.expression || readableTarget(target),
    label: semantic.rootLabel || readableTarget(target),
  });
  writeDatasetValue(target, 'spwCaptured', 'true');
  setTimeout(() => writeDatasetValue(target, 'spwCaptured', null), 800);
}

function buildSuggestions(semantic, target) {
  const suggestions = [];
  const family = semantic.family;
  const operator = target.dataset.spwOperator || 'frame';

  if (family) {
    suggestions.push([`?${family}`, `?{${family}}`]);
    suggestions.push([`@${family}`, `@action{${family}}`]);
    suggestions.push([`*${family}`, `*stream{${family}}`]);
  }

  if (semantic.behavior) {
    suggestions.push([`${semantic.root} -> ${semantic.behavior}`, `${operator}{${semantic.root}{${semantic.behavior}}}`]);
  }

  return suggestions;
}

async function copyToClipboard(text, element) {
  try {
    await navigator.clipboard?.writeText(text);
    const originalText = element.textContent;
    element.textContent = 'Copied!';
    setTimeout(() => element.textContent = originalText, 1000);
  } catch {
    window.prompt('Copy Spw spell', text);
  }
}

function resolveSemantic(target) {
  const explicit = deriveSemanticBraceExpression(target);
  if (explicit?.expression || explicit?.root) return explicit;

  const text = readableTarget(target);
  const inferred = inferExpressionFromText(text);
  return parseSemanticBraceExpression(inferred || text);
}

function inferExpressionFromText(text) {
  const cleaned = normalizeText(text).replace(/^#>|^\^|^~|^\?|^@|^\*|^>|^\$|^%|^\./, '');
  if (!cleaned) return '';
  if (/[\[{<]/.test(cleaned)) return cleaned;
  return cleaned.replace(/^"+|"+$/g, '');
}

function readableTarget(target) {
  return normalizeText(
    target?.dataset?.spwSemanticExpression
    || target?.dataset?.spwMeaning
    || target?.dataset?.spwFeature
    || target?.dataset?.spwSigil
    || target?.textContent
    || 'region'
  );
}

function buildSummary(semantic, target, frame) {
  const parts = [];
  const operator = target.dataset.spwOperator || 'region';
  const feature = target.dataset.spwFeature || frame?.dataset?.spwFeature || '';
  const frameName =
    frame?.querySelector?.(':scope > header h1, :scope > header h2, :scope > .frame-heading h2, :scope > .frame-topline .frame-sigil')
      ?.textContent
    || frame?.id
    || 'current frame';

  if (feature) parts.push(`feature ${feature}`);
  if (semantic.rootLabel) parts.push(`root ${semantic.rootLabel}`);
  if (semantic.variantLabel) parts.push(`variant ${semantic.variantLabel}`);
  if (semantic.behaviorLabel) parts.push(`behavior ${semantic.behaviorLabel}`);
  if (semantic.lensLabel) parts.push(`lens ${semantic.lensLabel}`);

  const suffix = parts.length ? parts.join(' · ') : 'no parsed brace parts yet';
  return `${operator} in ${normalizeText(frameName)} · ${suffix}`;
}

function buildContract(target, semantic, frame) {
  const source = target.closest('[data-spw-reading-cue], [data-spw-input], [data-spw-operation], [data-spw-return]');
  const fields = [
    ['Feature', source?.dataset.spwFeature || target.dataset.spwFeature || frame?.dataset?.spwFeature],
    ['Cue', source?.dataset.spwReadingCue || target.dataset.spwReadingCue],
    ['Input', source?.dataset.spwInput || target.dataset.spwInput || semantic.rootLabel],
    ['Operation', source?.dataset.spwOperation || target.dataset.spwOperation || semantic.behaviorLabel],
    ['Return', source?.dataset.spwReturn || target.dataset.spwReturn || frame?.dataset?.spwConsequence],
    ['Tone', source?.dataset.spwTone || target.dataset.spwTone || frame?.dataset?.spwContext],
  ];

  return fields.filter(([, value]) => normalizeText(value));
}

function positionMenu(menu, target) {
  const rect = target.getBoundingClientRect();
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty('--spw-region-menu-x', `${Math.max(12, rect.left)}px`);
  rootStyle.setProperty('--spw-region-menu-y', `${Math.max(12, rect.bottom + 8)}px`);
  menu.style.left = 'var(--spw-region-menu-x)';
  menu.style.top = 'var(--spw-region-menu-y)';
}

function focusMatches(target, semantic) {
  if (!semantic.family) return;
  setRegionFocus(target, semantic, true);
}

function setRegionFocus(target, semantic, expanded = true) {
  if (!semantic.family) return;
  clearRegionFocus(false);

  activeMatches = collectRegionMatches(document, semantic.family);
  activeIndex = Math.max(0, activeMatches.indexOf(target));

  activeMatches.forEach((node, index) => {
    writeDatasetValue(node, 'spwSemanticExpanded', expanded ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticFamily', semantic.family);
    writeDatasetValue(node, 'spwSemanticRoot', semantic.root || semantic.family);
    writeDatasetValue(node, 'spwSemanticMatch', expanded && node !== target ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticFocused', expanded && node === target ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticOrdinal', String(index + 1));
  });

  document.documentElement.dataset.spwSemanticFocusRoot = semantic.family;
  document.documentElement.dataset.spwSemanticFocusCount = String(activeMatches.length);
}

function moveMatch(direction) {
  if (!activeMatches.length) return;

  activeIndex = (activeIndex + direction + activeMatches.length) % activeMatches.length;
  const next = activeMatches[activeIndex];
  if (!(next instanceof HTMLElement)) return;

  activeMatches.forEach((node) => {
    writeDatasetValue(node, 'spwSemanticFocused', node === next ? 'true' : null);
    writeDatasetValue(node, 'spwSemanticMatch', node === next ? null : 'true');
  });

  next.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  next.focus?.({ preventScroll: true });
}

function toggleRegionCharge(target) {
  const frame = target.closest('.site-frame, [data-spw-kind], [data-spw-role]');
  if (!(frame instanceof HTMLElement)) return;
  const next = frame.dataset.spwRegionCharge === 'active' ? null : 'active';
  writeDatasetValue(frame, 'spwRegionCharge', next);
  bus.emit?.('region-menu:charged', {
    frame,
    active: next === 'active',
  });
}

async function copySeed(target, semantic, frame) {
  const seed = buildSeed(target, semantic, frame);

  try {
    await navigator.clipboard?.writeText(seed);
    writeDatasetValue(target, 'spwCopied', 'true');
    setTimeout(() => writeDatasetValue(target, 'spwCopied', null), 900);
  } catch {
    window.prompt?.('Copy Spw seed', seed);
  }
}

function buildSeed(target, semantic, frame) {
  const route = document.body?.dataset.spwSurface || normalizeToken(location.pathname || 'site');
  const region = normalizeToken(
    target.dataset.spwFeature
    || frame?.dataset?.spwFeature
    || frame?.id
    || frame?.dataset?.spwRole
    || 'region'
  );
  const operator = target.dataset.spwOperator || 'frame';
  const expression = semantic.key || semantic.expression || readableTarget(target);
  return `${route}<${region}> ${operator}{${expression}}`;
}

function clearRegionFocus(close = true) {
  document
    .querySelectorAll('[data-spw-semantic-focused], [data-spw-semantic-match], [data-spw-semantic-expanded], [data-spw-region-menu-target]')
    .forEach((node) => {
      writeDatasetValue(node, 'spwSemanticFocused', null);
      writeDatasetValue(node, 'spwSemanticMatch', null);
      writeDatasetValue(node, 'spwSemanticExpanded', null);
      writeDatasetValue(node, 'spwRegionMenuTarget', null);
    });

  document.documentElement.removeAttribute('data-spw-semantic-focus-root');
  document.documentElement.removeAttribute('data-spw-semantic-focus-count');

  if (close) closeMenu();
}

function collectRegionMatches(root, family) {
  const matches = collectSemanticBraceMatches(root, family);
  const seen = new Set(matches);
  const scope = root instanceof Element ? root : document;

  scope
    .querySelectorAll?.('[data-spw-semantic-expression], [data-spw-semantic-key], [data-spw-semantic-root]')
    .forEach((node) => {
      if (seen.has(node)) return;
      const semantic = deriveSemanticBraceExpression(node);
      if (semantic?.family !== family) return;
      seen.add(node);
      matches.push(node);
    });

  return matches;
}

function closeMenu() {
  const menu = document.getElementById(MENU_ID);
  if (menu) {
    writeDatasetValue(menu, 'spwState', 'closed');
  }
  document.documentElement.removeAttribute('data-spw-region-menu');
  activeTarget?.focus?.({ preventScroll: true });
  activeTarget = null;
}

function moveMenuFocus(menu, direction) {
  const items = [...menu.querySelectorAll('button')];
  if (!items.length) return;
  const index = Math.max(0, items.indexOf(document.activeElement));
  const next = (index + direction + items.length) % items.length;
  items[next].focus();
}

function clearPreviewTimer() {
  if (previewTimer) {
    window.clearTimeout(previewTimer);
    previewTimer = null;
  }
}

function getPreviewDelay() {
  const tuner = document.documentElement.dataset.spwInteractionTuner || 'calm';
  return PREVIEW_DELAY_MS[tuner] || PREVIEW_DELAY_MS.calm;
}

function shouldShowTuningHandles() {
  const html = document.documentElement.dataset;
  return (
    html.spwShowSemanticMetadata === 'on'
    || html.spwCognitiveHandles === 'on'
    || html.spwInteractionTuner === 'expressive'
    || html.spwSemanticDensity === 'rich'
  );
}

function readUnitValue(value = '') {
  const number = Number.parseFloat(String(value).trim());
  if (!Number.isFinite(number)) return '0';
  return String(Math.max(0, Math.min(1, number)));
}
