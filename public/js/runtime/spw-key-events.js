/**
 * spw-key-events.js
 * ---------------------------------------------------------------------------
 * Spw-backed keyboard events: potentiation (thread without collapse) and
 * actualization (commit into scene contexts other models can interpret).
 *
 * Wrap physics (do not interchange these as prev/next):
 *   [ / ]  mode seat — open the option-set, then sit in a variant
 *   { / }  direction — travel between frames
 *   ( / )  scene — enter or leave a staged host
 *   .      ground the current operator
 *   ~      hold a path without collapsing it
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue, writeStyleValue } from '/public/js/kernel/dom-contracts.js';
import { isInputFocused } from '/public/js/kernel/shared.js';
import { collapseText as normalizeText } from '/public/js/kernel/text-normalization.js';
import { readMicrointeractionPulseMs } from './pulse-beat-tuner.js';

const SCENE_HOST_SELECTOR = [
  '[data-spw-scene-interpret]',
  '[data-spw-prompt-host]',
  '.spw-scene-bed[data-spw-scene-posture]',
  '.spw-frame[data-spw-promptability="visible"]',
].join(', ');

const KEY_NAV_SELECTOR = [
  SCENE_HOST_SELECTOR,
  '.palette-probe-chip',
  '[data-site-setting-set^="paletteResonance:"]',
  '[data-spw-form]',
  '[data-spw-brace]',
  '[data-spw-anatomy]',
  '.spw-section-handle',
  '[data-spw-chrome-role="section-handle"]',
].join(', ');

const POTENTIATE_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab',
]);
const ACTUALIZE_KEYS = new Set(['Enter', ' ']);
const EXIT_KEYS = new Set(['Escape']);

let initialized = false;
let potentiatedElement = null;
let sceneStack = [];
let lastEventRecord = null;
let revealPhase = 'idle';
const revealTimers = new Set();

const REVEAL_PHASE_WEIGHT = Object.freeze({
  idle: 0,
  framing: 0.35,
  revealing: 0.72,
  revealed: 1,
  settling: 0.28,
});

function describePath(element) {
  if (!(element instanceof HTMLElement)) return '';
  if (element.id) return `#${element.id}`;
  const anatomy = element.dataset.spwAnatomy ? `[${element.dataset.spwAnatomy}]` : '';
  const kind = element.dataset.spwKind ? `<${element.dataset.spwKind}>` : element.localName;
  return `${kind}${anatomy}`;
}

function isSceneHost(element) {
  return element instanceof HTMLElement && Boolean(element.matches(SCENE_HOST_SELECTOR));
}

function resolveSceneHost(element) {
  if (!(element instanceof HTMLElement)) return null;
  const host = isSceneHost(element) ? element : element.closest(SCENE_HOST_SELECTOR);
  if (!(host instanceof HTMLElement)) return null;
  if (element !== host && element.matches('button, a[href], input, textarea, select, [role="button"]')) {
    return null;
  }
  return host;
}

function isKeyNavTarget(element) {
  return element instanceof HTMLElement && Boolean(element.matches(KEY_NAV_SELECTOR));
}

function collectSceneLanes(host) {
  if (!(host instanceof HTMLElement)) return [];
  return [...host.querySelectorAll('[data-spw-scene-lane]')].map((lane) => ({
    lane: lane.dataset.spwSceneLane || '',
    label: normalizeText(lane.querySelector('strong')?.textContent || ''),
    summary: normalizeText(lane.querySelector('span')?.textContent || ''),
  })).filter((entry) => entry.lane || entry.label || entry.summary);
}

function buildScenePacket(host) {
  if (!(host instanceof HTMLElement)) return null;

  const frame = host.closest('.spw-frame, [data-spw-kind="frame"]');
  const source = { surface: host, frame: frame || undefined };
  let spwContext = '';
  let wonderPrompt = '';

  try {
    if (window.spwPromptUtils?.serialize) {
      spwContext = window.spwPromptUtils.serialize('spw_context', source) || '';
      wonderPrompt = window.spwPromptUtils.serialize('wonder_prompt', source) || '';
    }
  } catch {
    spwContext = '';
    wonderPrompt = '';
  }

  return {
    id: host.id || describePath(host),
    path: describePath(host),
    posture: host.dataset.spwScenePosture || '',
    promptTitle: host.dataset.spwPromptTitle || '',
    seed: host.dataset.spwSeed || '',
    wonder: host.dataset.spwWonder || host.dataset.spwFieldWonder || '',
    context: host.dataset.spwContext || '',
    liminality: host.dataset.spwLiminality || '',
    lanes: collectSceneLanes(host),
    frameId: frame?.id || '',
    route: `${window.location.pathname}${window.location.hash || ''}`,
    spwContext,
    wonderPrompt,
  };
}

function clearPotentiation({ reason = 'clear' } = {}) {
  if (potentiatedElement instanceof HTMLElement) {
    writeDatasetValue(potentiatedElement, 'spwSelectionState', null, {
      source: 'spw-key-events',
      reason,
    });
    writeDatasetValue(potentiatedElement, 'spwKeyPotential', null, {
      source: 'spw-key-events',
      reason,
    });
  }
  potentiatedElement = null;
  writeDatasetValue(document.documentElement, 'spwKeySelection', null, {
    source: 'spw-key-events',
    reason,
  });
}

function potentiateTarget(element, detail = {}) {
  if (!(element instanceof HTMLElement)) return;
  if (potentiatedElement === element && detail.force !== true) return;

  clearPotentiation({ reason: 're-potentiate' });
  potentiatedElement = element;

  writeDatasetValue(element, 'spwSelectionState', 'potentiated', {
    source: 'spw-key-events',
    reason: 'potentiate',
  });
  writeDatasetValue(element, 'spwKeyPotential', describePath(element), {
    source: 'spw-key-events',
    reason: 'potentiate',
  });
  writeDatasetValue(document.documentElement, 'spwKeySelection', 'potentiated', {
    source: 'spw-key-events',
    reason: 'potentiate',
  });

  const record = {
    phase: 'potentiate',
    key: detail.key || 'focus',
    binding: detail.binding || 'selection-thread',
    target: describePath(element),
    sceneHost: describePath(resolveSceneHost(element)),
    input: detail.input || 'keyboard',
  };
  lastEventRecord = record;

  bus.emit('key:potentiated', record);
  document.dispatchEvent(new CustomEvent('spw:key-potentiated', {
    bubbles: true,
    detail: record,
  }));
}

function prefersReducedMotion(html = document.documentElement) {
  return html.dataset.spwReduceMotion === 'on';
}

function readRevealTimings(html = document.documentElement) {
  const pulseMs = readMicrointeractionPulseMs(html.ownerDocument || document);
  return {
    framing: Math.round(pulseMs * 0.5),
    thinking: Math.round(pulseMs * 0.9),
    reveal: Math.round(pulseMs * 1.15),
    settle: Math.round(pulseMs * 0.7),
    stagger: 72,
  };
}

function scheduleRevealTask(fn, delayMs) {
  const timer = window.setTimeout(() => {
    revealTimers.delete(timer);
    fn();
  }, delayMs);
  revealTimers.add(timer);
  return timer;
}

function clearRevealTasks() {
  revealTimers.forEach((timer) => window.clearTimeout(timer));
  revealTimers.clear();
}

function writeRevealPhase(phase, detail = {}) {
  revealPhase = phase || 'idle';
  const html = document.documentElement;
  const weight = REVEAL_PHASE_WEIGHT[revealPhase] ?? 0;

  writeDatasetValue(html, 'spwRevealPhase', revealPhase === 'idle' ? null : revealPhase, {
    source: 'spw-key-events',
    reason: 'reveal-phase',
  });
  writeDatasetValue(
    html,
    'spwInformationReveal',
    revealPhase === 'revealing' || revealPhase === 'revealed' ? 'on' : null,
    { source: 'spw-key-events', reason: 'information-reveal' },
  );

  html.style.setProperty('--spw-reveal-phase-weight', String(weight));
  if (detail.stagger) {
    html.style.setProperty('--spw-reveal-stagger-step', `${detail.stagger}ms`);
  }

  bus.emit('reveal:phase', { phase: revealPhase, weight, ...detail });
}

function findWonderBlock(host) {
  if (!(host instanceof HTMLElement)) return null;
  if (host.nextElementSibling?.matches?.('.spw-wonder-block')) return host.nextElementSibling;
  const nested = host.querySelector?.('.spw-wonder-block');
  return nested instanceof HTMLElement ? nested : null;
}

function syncSceneContextAttrs() {
  const html = document.documentElement;
  const top = sceneStack[sceneStack.length - 1] || null;
  const depth = sceneStack.length;

  if (depth) {
    html.style.setProperty('--spw-scene-depth', String(depth));
  } else {
    html.style.removeProperty('--spw-scene-depth');
  }

  writeDatasetValue(html, 'spwSceneDepth', depth ? String(depth) : null, {
    source: 'spw-key-events',
    reason: 'scene-stack-sync',
  });
  writeDatasetValue(html, 'spwSceneContext', top?.id || null, {
    source: 'spw-key-events',
    reason: 'scene-stack-sync',
  });
  writeDatasetValue(html, 'spwScenePosture', top?.posture || null, {
    source: 'spw-key-events',
    reason: 'scene-stack-sync',
  });
}

function revealWonderBlockStaged(host, timings = readRevealTimings()) {
  const block = findWonderBlock(host);
  if (!(block instanceof HTMLElement)) return;

  block.dataset.spwRevealSource = 'scene-enter';
  block.dataset.spwWonderBlockState = 'thinking';
  block.querySelector('[data-action="preview"]')?.setAttribute('aria-pressed', 'true');

  scheduleRevealTask(() => {
    block.dataset.spwWonderBlockState = 'revealed';
    window.spwPromptUtils?.refreshBlocks?.();
    if (!prefersReducedMotion()) {
      block.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, timings.thinking);
}

function collapseWonderBlock(host) {
  const block = findWonderBlock(host);
  if (!(block instanceof HTMLElement)) return;
  if (block.dataset.spwRevealSource !== 'scene-enter') return;

  block.dataset.spwWonderBlockState = 'idle';
  delete block.dataset.spwRevealSource;
  block.querySelector('[data-action="preview"]')?.setAttribute('aria-pressed', 'false');
  window.spwPromptUtils?.refreshBlocks?.();
}

function commitSceneEnter(host, packet, detail = {}) {
  sceneStack.push(packet);
  syncSceneContextAttrs();

  writeDatasetValue(host, 'spwSceneState', 'entered', {
    source: 'spw-key-events',
    reason: 'scene-enter',
  });
  writeDatasetValue(host, 'spwRevealFrame', 'open', {
    source: 'spw-key-events',
    reason: 'scene-reveal-open',
  });
  writeDatasetValue(host, 'spwSelectionState', 'actualized', {
    source: 'spw-key-events',
    reason: 'scene-enter',
  });
  writeDatasetValue(document.documentElement, 'spwKeySelection', 'actualized', {
    source: 'spw-key-events',
    reason: 'scene-enter',
  });

  const timings = readRevealTimings();
  revealWonderBlockStaged(host, timings);

  const record = {
    phase: 'actualize',
    key: detail.key || 'Enter',
    binding: detail.binding || 'scene-enter',
    target: packet.path,
    scene: packet,
    depth: sceneStack.length,
    input: detail.input || 'keyboard',
    revealPhase: 'revealed',
  };
  lastEventRecord = record;

  bus.emit('scene:enter', record);
  bus.emit('key:actualized', record);
  document.dispatchEvent(new CustomEvent('spw:scene-enter', {
    bubbles: true,
    detail: record,
  }));

  return record;
}

function enterScene(host, detail = {}) {
  const packet = buildScenePacket(host);
  if (!packet) return null;
  if (host.dataset.spwSceneState === 'entered') return packet;

  const timings = readRevealTimings();
  clearRevealTasks();

  writeRevealPhase('framing', { target: packet.path, stagger: timings.stagger });
  writeDatasetValue(host, 'spwRevealFrame', 'arming', {
    source: 'spw-key-events',
    reason: 'scene-framing',
  });

  if (!prefersReducedMotion()) {
    host.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  scheduleRevealTask(() => {
    writeRevealPhase('revealing', { target: packet.path, stagger: timings.stagger });
    commitSceneEnter(host, packet, detail);
    writeRevealPhase('revealed', { target: packet.path, scene: packet, stagger: timings.stagger });

    scheduleRevealTask(() => {
      writeRevealPhase('idle');
      writeDatasetValue(host, 'spwRevealFrame', 'settled', {
        source: 'spw-key-events',
        reason: 'scene-reveal-settled',
      });
      scheduleRevealTask(() => {
        if (host.dataset.spwSceneState === 'entered') {
          writeDatasetValue(host, 'spwRevealFrame', null, {
            source: 'spw-key-events',
            reason: 'scene-reveal-complete',
          });
        }
      }, timings.settle);
    }, timings.reveal);
  }, timings.framing);

  return packet;
}

function finalizeSceneExit(exited, host, detail = {}) {
  if (host instanceof HTMLElement) {
    writeDatasetValue(host, 'spwSceneState', null, {
      source: 'spw-key-events',
      reason: 'scene-exit',
    });
    writeDatasetValue(host, 'spwSelectionState', null, {
      source: 'spw-key-events',
      reason: 'scene-exit',
    });
    writeDatasetValue(host, 'spwRevealFrame', null, {
      source: 'spw-key-events',
      reason: 'scene-exit',
    });
  }

  syncSceneContextAttrs();
  clearPotentiation({ reason: 'scene-exit' });
  writeRevealPhase('idle');

  const record = {
    phase: 'exit',
    key: detail.key || 'Escape',
    binding: detail.binding || 'scene-exit',
    scene: exited,
    depth: sceneStack.length,
    input: detail.input || 'keyboard',
    revealPhase: 'idle',
  };
  lastEventRecord = record;

  bus.emit('scene:exit', record);
  bus.emit('key:released', record);
  document.dispatchEvent(new CustomEvent('spw:scene-exit', {
    bubbles: true,
    detail: record,
  }));

  return exited;
}

function cancelReveal(detail = {}) {
  if (revealPhase === 'idle') return;
  clearRevealTasks();
  document.querySelectorAll('[data-spw-reveal-frame]').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    writeDatasetValue(node, 'spwRevealFrame', null, {
      source: 'spw-key-events',
      reason: 'reveal-cancel',
    });
  });
  writeRevealPhase('idle');
  bus.emit('reveal:cancelled', { phase: revealPhase, ...detail });
}

function exitScene(detail = {}) {
  if (!sceneStack.length) return null;

  const exited = sceneStack[sceneStack.length - 1];
  const host = exited?.id ? document.getElementById(exited.id) : null;
  const timings = readRevealTimings();

  clearRevealTasks();
  writeRevealPhase('settling', { scene: exited, stagger: timings.stagger });

  if (host instanceof HTMLElement) {
    writeDatasetValue(host, 'spwRevealFrame', 'closing', {
      source: 'spw-key-events',
      reason: 'scene-exit-framing',
    });
    collapseWonderBlock(host);
  }

  scheduleRevealTask(() => {
    sceneStack.pop();
    finalizeSceneExit(exited, host, detail);
  }, timings.settle);

  return exited;
}

function actualizeSelection(event) {
  const target = potentiatedElement || resolveSceneHost(document.activeElement);
  if (!(target instanceof HTMLElement)) return false;

  const sceneHost = resolveSceneHost(target);
  if (!sceneHost) {
    const record = {
      phase: 'actualize',
      key: event.key,
      binding: 'selection-commit',
      target: describePath(target),
      input: 'keyboard',
    };
    lastEventRecord = record;
    writeDatasetValue(target, 'spwSelectionState', 'actualized', {
      source: 'spw-key-events',
      reason: 'selection-commit',
    });
    writeDatasetValue(document.documentElement, 'spwKeySelection', 'actualized', {
      source: 'spw-key-events',
      reason: 'selection-commit',
    });
    bus.emit('key:actualized', record);
    window.setTimeout(() => {
      if (target.dataset.spwSceneState !== 'entered') {
        writeDatasetValue(target, 'spwSelectionState', null, {
          source: 'spw-key-events',
          reason: 'selection-settle',
        });
      }
    }, 480);
    return true;
  }

  if (sceneHost.dataset.spwSceneState === 'entered') return false;
  enterScene(sceneHost, { key: event.key, binding: 'scene-enter' });
  return true;
}

function resolveBindingId(key, target) {
  if (target?.matches?.('.palette-probe-chip') || target?.closest?.('[data-spw-palette-probe-rail="ready"]')) {
    return 'palette-probe-rail';
  }
  if (target?.matches?.('[data-site-setting-set^="paletteResonance:"]')) return 'resonance-toolbar';
  if (target?.closest?.('.spw-section-handle, [data-spw-chrome-role="section-handle"]')) return 'section-travel';
  if (target?.closest?.('[data-spw-form], [data-spw-brace]')) return 'brace-commit';
  if (target?.closest?.('[data-spw-anatomy]')) return 'anatomy-pin';
  if (resolveSceneHost(target)) return 'scene-enter';
  if (POTENTIATE_KEYS.has(key)) return 'selection-thread';
  return 'global';
}

function collectNavigableOperators() {
  const elements = Array.from(document.querySelectorAll(
    'a.spw-chip[href], [data-spw-operator], a.spw-topic, span.spw-topic[tabindex], [data-spw-guide-badge]'
  )).filter((el) => {
    if (el.closest('[hidden]')) return false;
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  });
  return elements;
}

function traverseOperators(direction = 1) {
  const operators = collectNavigableOperators();
  if (!operators.length) return false;

  const activeIndex = operators.indexOf(document.activeElement);
  let nextIndex = 0;
  if (activeIndex >= 0) {
    nextIndex = (activeIndex + direction + operators.length) % operators.length;
  } else {
    nextIndex = direction > 0 ? 0 : operators.length - 1;
  }

  const nextEl = operators[nextIndex];
  if (nextEl instanceof HTMLElement) {
    if (!nextEl.hasAttribute('tabindex') && nextEl.tagName !== 'A' && nextEl.tagName !== 'BUTTON') {
      nextEl.setAttribute('tabindex', '0');
    }
    nextEl.focus({ preventScroll: false });
    nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    potentiateTarget(nextEl, {
      key: direction > 0 ? 'j' : 'k',
      binding: 'operator-step',
      input: 'keyboard',
    });
    return true;
  }
  return false;
}

function collectNavigableFrames() {
  return Array.from(document.querySelectorAll('.spw-frame, [data-spw-kind="frame"]')).filter((el) => {
    if (el.closest('[hidden]')) return false;
    return el.offsetWidth > 0 && el.offsetHeight > 0;
  });
}

function traverseFrames(direction = 1) {
  const frames = collectNavigableFrames();
  if (!frames.length) return false;

  const scrollY = window.scrollY + 120;
  let currentIndex = -1;
  for (let i = 0; i < frames.length; i++) {
    const rect = frames[i].getBoundingClientRect();
    const top = rect.top + window.scrollY;
    if (top <= scrollY && top + rect.height > scrollY) {
      currentIndex = i;
      break;
    }
  }

  let nextIndex = 0;
  if (currentIndex >= 0) {
    nextIndex = (currentIndex + direction + frames.length) % frames.length;
  } else {
    nextIndex = direction > 0 ? 0 : frames.length - 1;
  }

  const nextFrame = frames[nextIndex];
  if (nextFrame instanceof HTMLElement) {
    writeInteractionContext('browsing', nextFrame);
    nextFrame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const focusTarget = nextFrame.querySelector('a.frame-sigil, h1, h2, [data-spw-operator]') || nextFrame;
    if (focusTarget instanceof HTMLElement) {
      if (!focusTarget.hasAttribute('tabindex') && focusTarget.tagName !== 'A' && focusTarget.tagName !== 'BUTTON') {
        focusTarget.setAttribute('tabindex', '-1');
      }
      focusTarget.focus({ preventScroll: true });
    }
    return true;
  }
  return false;
}

function readModeButtons(switchEl) {
  if (!(switchEl instanceof HTMLElement)) return [];
  return Array.from(switchEl.querySelectorAll('[data-set-mode]')).filter((button) => (
    button instanceof HTMLElement && button.offsetWidth > 0 && button.offsetHeight > 0
  ));
}

function hasLocalKeyScope(target) {
  return Boolean(target?.closest?.('[data-spw-key-scope="local"], .rpg-asset-card'));
}

function resolveFocusedFrame() {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  return active?.closest?.('.spw-frame, [data-spw-kind="frame"]')
    || document.querySelector('.spw-frame:hover, [data-spw-kind="frame"]:hover');
}

function resolveModeSwitch() {
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  if (active?.closest?.('.mode-switch')) return active.closest('.mode-switch');
  const frame = resolveFocusedFrame();
  return frame?.querySelector?.('.mode-switch')
    || document.querySelector('.mode-switch[data-spw-mode-seat="open"]')
    || document.querySelector('.mode-switch');
}

function writeInteractionContext(context, host) {
  const html = document.documentElement;
  writeDatasetValue(html, 'spwInteractionContext', context, {
    source: 'spw-key-events',
    reason: 'wrap-context',
  });
  if (host instanceof HTMLElement) {
    writeDatasetValue(host, 'spwInteractionContext', context, {
      source: 'spw-key-events',
      reason: 'wrap-context',
    });
  }
}

function composeModeExpression(switchEl) {
  const authored = switchEl?.dataset?.spwSemanticExpression || '';
  if (authored) return authored;
  const variants = readModeButtons(switchEl)
    .map((button) => button.getAttribute('data-set-mode'))
    .filter(Boolean);
  const body = variants.length ? variants.join('.') : 'open.sit';
  return `lens[mode]{${body}}`;
}

function ensureWrapExpression(element, expression) {
  if (!(element instanceof HTMLElement) || !expression) return;
  if (element.dataset.spwSemanticExpression) return;
  writeDatasetValue(element, 'spwSemanticExpression', expression, {
    source: 'spw-key-events',
    reason: 'wrap-expression',
  });
}

function readOpenModeSwitch() {
  return document.querySelector('.mode-switch[data-spw-mode-seat="open"]');
}

function openModeSeat() {
  const switchEl = resolveModeSwitch();
  const buttons = readModeButtons(switchEl);
  if (buttons.length < 2) return false;

  document.querySelectorAll('.mode-switch[data-spw-mode-seat="open"]').forEach((node) => {
    if (node !== switchEl) closeModeSeat({ commit: false, switchEl: node });
  });

  writeDatasetValue(switchEl, 'spwModeSeat', 'open', {
    source: 'spw-key-events',
    reason: 'mode-seat-open',
  });
  if (!switchEl.getAttribute('data-spw-operator')) {
    switchEl.setAttribute('data-spw-operator', 'mode');
  }
  switchEl.setAttribute('aria-expanded', 'true');
  ensureWrapExpression(switchEl, composeModeExpression(switchEl));
  writeInteractionContext('inspecting', switchEl);

  const pressed = buttons.find((button) => button.getAttribute('aria-pressed') === 'true') || buttons[0];
  pressed.focus({ preventScroll: true });

  const record = {
    phase: 'select',
    key: '[',
    binding: 'mode-seat-open',
    group: pressed.getAttribute('data-mode-group') || '',
    variant: pressed.getAttribute('data-set-mode') || '',
    expression: switchEl.dataset.spwSemanticExpression || '',
    context: 'inspecting',
    input: 'keyboard',
  };
  lastEventRecord = record;
  bus.emit('mode:seat-open', record);
  document.dispatchEvent(new CustomEvent('spw:mode-change', { bubbles: true, detail: record }));
  return true;
}

function closeModeSeat({ commit = true, switchEl = readOpenModeSwitch() } = {}) {
  if (!(switchEl instanceof HTMLElement) || switchEl.dataset.spwModeSeat !== 'open') return false;

  const buttons = readModeButtons(switchEl);
  const focused = buttons.find((button) => button === document.activeElement);
  const pressed = buttons.find((button) => button.getAttribute('aria-pressed') === 'true');
  if (commit && focused && focused !== pressed) focused.click();

  writeDatasetValue(switchEl, 'spwModeSeat', null, {
    source: 'spw-key-events',
    reason: 'mode-seat-close',
  });
  switchEl.setAttribute('aria-expanded', 'false');
  writeInteractionContext(commit ? 'reading' : 'reading', switchEl);

  const frame = switchEl.closest('.spw-frame, [data-spw-kind="frame"]');
  const returnTarget = frame?.querySelector('.hook-sub a.spw-chip, .hook-invitation a, a.frame-sigil') || frame;
  if (returnTarget instanceof HTMLElement && returnTarget !== document.activeElement) {
    if (!returnTarget.hasAttribute('tabindex') && returnTarget.tagName !== 'A' && returnTarget.tagName !== 'BUTTON') {
      returnTarget.setAttribute('tabindex', '-1');
    }
    returnTarget.focus({ preventScroll: true });
  }

  const record = {
    phase: 'select',
    key: ']',
    binding: commit ? 'mode-seat-commit' : 'mode-seat-release',
    group: (focused || pressed)?.getAttribute('data-mode-group') || '',
    variant: (focused || pressed)?.getAttribute('data-set-mode') || '',
    input: 'keyboard',
  };
  lastEventRecord = record;
  bus.emit('mode:seat-close', record);
  return true;
}

function stepModeSeat(direction = 1) {
  const switchEl = readOpenModeSwitch();
  const buttons = readModeButtons(switchEl);
  if (buttons.length < 2) return false;
  const currentIndex = buttons.indexOf(document.activeElement);
  const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + direction + buttons.length) % buttons.length;
  buttons[nextIndex].focus({ preventScroll: true });
  return true;
}

function selectModeSeatIndex(index) {
  const switchEl = readOpenModeSwitch();
  const buttons = readModeButtons(switchEl);
  if (index < 0 || index >= buttons.length) return false;
  buttons[index].focus({ preventScroll: true });
  return true;
}

function holdCurrentOperator() {
  const active = document.activeElement;
  const target = active?.closest?.('[data-spw-operator], .spw-chip, [data-spw-resonance-key]') || potentiatedElement;
  if (!(target instanceof HTMLElement)) return false;
  potentiateTarget(target, {
    key: '~',
    binding: 'potential-hold',
    input: 'keyboard',
  });
  return true;
}

function resolveContextSceneHost() {
  const frame = resolveFocusedFrame();
  if (frame instanceof HTMLElement) {
    if (frame.matches(SCENE_HOST_SELECTOR)) return frame;
    const nested = frame.querySelector(SCENE_HOST_SELECTOR);
    if (nested instanceof HTMLElement) return nested;
  }
  return resolveSceneHost(document.activeElement)
    || document.querySelector(SCENE_HOST_SELECTOR);
}

function enterNearestScene() {
  const host = resolveContextSceneHost();
  if (!(host instanceof HTMLElement)) return false;
  ensureWrapExpression(host, host.dataset.spwSemanticExpression || 'scene[host]{enter.leave}');
  writeInteractionContext('comparing', host);
  return Boolean(enterScene(host, { key: '(', binding: 'scene-enter', input: 'keyboard' }));
}

const DENSITY_TIERS = Object.freeze(['minimal', 'normal', 'rich']);
const PHASE_TIERS = Object.freeze(['radiant', 'fluid', 'plastic', 'lattice', 'ground', 'membrane']);

function cycleSemanticDensity(direction = 1) {
  const html = document.documentElement;
  const current = html.dataset.spwSemanticDensity || 'normal';
  const currentIndex = DENSITY_TIERS.indexOf(current);
  const nextIndex = (currentIndex + direction + DENSITY_TIERS.length) % DENSITY_TIERS.length;
  const nextDensity = DENSITY_TIERS[nextIndex];

  writeDatasetValue(html, 'spwSemanticDensity', nextDensity, {
    source: 'spw-key-events',
    reason: 'cycle-semantic-density',
  });
  bus.emit('settings:density-changed', { density: nextDensity });
  document.dispatchEvent(new CustomEvent('spw:density-changed', {
    bubbles: true,
    detail: { density: nextDensity },
  }));
  return true;
}

function tunePhaseByIndex(index) {
  if (index < 0 || index >= PHASE_TIERS.length) return false;
  const phase = PHASE_TIERS[index];
  const active = document.activeElement?.closest('.spw-frame, [data-spw-kind="frame"], [data-spw-feature]') || document.documentElement;
  writeDatasetValue(active, 'spwPhase', phase, {
    source: 'spw-key-events',
    reason: 'tune-phase-by-index',
  });
  bus.emit('spw:phase-tuned', { phase, target: active });
  return true;
}

function dialTangibilityDelta(delta) {
  const active = document.activeElement?.closest('.spw-frame, [data-spw-kind="frame"], [data-spw-feature]') || document.documentElement;
  const current = parseFloat(active.dataset.spwTangibility || active.style.getPropertyValue('--spw-tangibility') || '0.5');
  const next = Math.max(0.05, Math.min(1.0, Math.round((current + delta) * 100) / 100));
  writeDatasetValue(active, 'spwTangibility', next.toFixed(2), {
    source: 'spw-key-events',
    reason: 'dial-tangibility-delta',
  });
  writeStyleValue(active, '--spw-tangibility', String(next));
  bus.emit('spw:tangibility-dialed', { tangibility: next, target: active });
  return true;
}

function groundCurrentOperator() {
  const active = document.activeElement;
  const target = active?.closest?.('[data-spw-operator], .spw-chip, [data-spw-resonance-key]') || potentiatedElement;
  if (!target) return false;

  const op = target.getAttribute('data-spw-operator') || target.getAttribute('data-spw-resonance-key') || '';
  const html = document.documentElement;
  const isCurrentlyGrounded = html.getAttribute('data-spw-grounded-operator') === op;

  if (isCurrentlyGrounded) {
    html.removeAttribute('data-spw-grounded-operator');
    html.removeAttribute('data-spw-grounded');
    bus.emit('operator:ungrounded', { operator: op });
  } else if (op) {
    html.setAttribute('data-spw-grounded-operator', op);
    html.setAttribute('data-spw-grounded', 'true');
    bus.emit('operator:grounded', { operator: op });
  }
  return true;
}

function onFocusIn(event) {
  const target = event.target;
  if (!isKeyNavTarget(target)) return;
  if (event.detail?.source === 'spw-key-events') return;

  potentiateTarget(target, {
    key: 'focus',
    binding: resolveBindingId('focus', target),
    input: event.detail?.input || 'focus',
  });
}

function onKeyDown(event) {
  if (event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;

  const inInput = isInputFocused();
  const target = event.target instanceof HTMLElement ? event.target : null;

  if (EXIT_KEYS.has(event.key)) {
    if (readOpenModeSwitch()) {
      event.preventDefault();
      closeModeSeat({ commit: false });
      return;
    }
    if (sceneStack.length || revealPhase !== 'idle') {
      event.preventDefault();
      if (sceneStack.length) {
        exitScene({ key: event.key });
      } else {
        cancelReveal({ key: event.key });
      }
      return;
    }
    if (potentiatedElement) {
      clearPotentiation({ reason: 'escape' });
      bus.emit('key:released', {
        phase: 'release',
        key: event.key,
        binding: 'selection-clear',
        input: 'keyboard',
      });
    }
    return;
  }

  // Each wrap and operator has its own physics. Do not treat brace pairs as
  // interchangeable prev/next steppers.
  if (!inInput) {
    if (!hasLocalKeyScope(target) && event.key === '[') {
      if (openModeSeat()) {
        event.preventDefault();
        return;
      }
    }
    if (!hasLocalKeyScope(target) && event.key === ']') {
      if (closeModeSeat({ commit: true })) {
        event.preventDefault();
        return;
      }
    }
    if (readOpenModeSwitch()) {
      if (event.key === 'j' || event.key === 'ArrowRight') {
        if (stepModeSeat(1)) {
          event.preventDefault();
          return;
        }
      }
      if (event.key === 'k' || event.key === 'ArrowLeft') {
        if (stepModeSeat(-1)) {
          event.preventDefault();
          return;
        }
      }
      if (event.key >= '1' && event.key <= '9') {
        if (selectModeSeatIndex(parseInt(event.key, 10) - 1)) {
          event.preventDefault();
          return;
        }
      }
    }
    if (event.key === 'v') {
      if (cycleSemanticDensity(1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === 'V') {
      if (cycleSemanticDensity(-1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key >= '1' && event.key <= '6') {
      const idx = parseInt(event.key, 10) - 1;
      if (tunePhaseByIndex(idx)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '+' || event.key === '=' || (event.shiftKey && event.key === 'ArrowUp')) {
      if (dialTangibilityDelta(0.05)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '-' || event.key === '_' || (event.shiftKey && event.key === 'ArrowDown')) {
      if (dialTangibilityDelta(-0.05)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === 'j') {
      if (traverseOperators(1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === 'k') {
      if (traverseOperators(-1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '{') {
      if (traverseFrames(-1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '}') {
      if (traverseFrames(1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '(') {
      if (enterNearestScene()) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === ')') {
      if (sceneStack.length) {
        event.preventDefault();
        writeInteractionContext('reading', resolveFocusedFrame());
        exitScene({ key: ')', binding: 'scene-exit' });
        return;
      }
    }
    if (event.key === '.') {
      if (groundCurrentOperator()) {
        writeInteractionContext('reading', document.activeElement);
        event.preventDefault();
        return;
      }
    }
    if (event.key === '~') {
      if (holdCurrentOperator()) {
        writeInteractionContext('browsing', document.activeElement);
        event.preventDefault();
        return;
      }
    }
  }

  if (ACTUALIZE_KEYS.has(event.key)) {
    if (target?.matches('a[href], input, textarea, select')) return;
    if (actualizeSelection(event)) {
      if (resolveSceneHost(potentiatedElement || target)) {
        event.preventDefault();
      }
    }
    return;
  }

  if (!POTENTIATE_KEYS.has(event.key)) return;
  if (!isKeyNavTarget(target)) return;

  const record = {
    phase: 'potentiate',
    key: event.key,
    binding: resolveBindingId(event.key, target),
    target: describePath(target),
    sceneHost: describePath(resolveSceneHost(target)),
    input: 'keyboard',
  };
  lastEventRecord = record;

  bus.emit('key:potentiated', record);
}

export function getKeyEventSnapshot() {
  return {
    selection: document.documentElement.dataset.spwKeySelection || 'idle',
    context: document.documentElement.dataset.spwInteractionContext || 'reading',
    revealPhase,
    potential: potentiatedElement?.dataset?.spwKeyPotential || '',
    lastEvent: lastEventRecord ? { ...lastEventRecord } : null,
    scene: {
      depth: sceneStack.length,
      active: sceneStack[sceneStack.length - 1] || null,
      stack: sceneStack.map((entry) => ({ ...entry })),
    },
  };
}

export function serializeKeyEventsToSpw(snapshot = getKeyEventSnapshot()) {
  const lines = [];
  lines.push('^"key_events"{');
  if (snapshot.selection && snapshot.selection !== 'idle') {
    lines.push(`  selection = "${snapshot.selection}"`);
  }
  if (snapshot.context) {
    lines.push(`  context = "${snapshot.context}"`);
  }
  if (snapshot.revealPhase && snapshot.revealPhase !== 'idle') {
    lines.push(`  reveal_phase = "${snapshot.revealPhase}"`);
  }
  if (snapshot.potential) lines.push(`  potential = "${snapshot.potential}"`);
  if (snapshot.lastEvent) {
    lines.push('  last = .{');
    lines.push(`    phase = "${snapshot.lastEvent.phase || ''}"`);
    lines.push(`    key = "${snapshot.lastEvent.key || ''}"`);
    lines.push(`    binding = "${snapshot.lastEvent.binding || ''}"`);
    if (snapshot.lastEvent.target) lines.push(`    target = "${snapshot.lastEvent.target}"`);
    lines.push('  }');
  }
  if (snapshot.scene?.active) {
    const scene = snapshot.scene.active;
    lines.push('  scene_context = .{');
    lines.push(`    id = "${scene.id || ''}"`);
    if (scene.posture) lines.push(`    posture = "${scene.posture}"`);
    if (scene.promptTitle) lines.push(`    prompt_title = "${scene.promptTitle}"`);
    if (scene.wonder) lines.push(`    wonder = "${scene.wonder}"`);
    lines.push(`    depth = ${snapshot.scene.depth || 0}`);
    if (scene.lanes?.length) {
      lines.push('    lanes = #[');
      scene.lanes.forEach((lane) => {
        lines.push(`      .{ lane="${lane.lane}" label="${lane.label}" summary="${lane.summary}" }`);
      });
      lines.push('    ][reg=set]');
    }
    lines.push('  }');
  }
  lines.push('}');
  return lines.join('\n');
}

function publishApi() {
  const api = {
    snapshot: getKeyEventSnapshot,
    serialize: () => serializeKeyEventsToSpw(getKeyEventSnapshot()),
    enterScene: (host) => enterScene(host, { input: 'api', binding: 'scene-enter' }),
    exitScene: () => exitScene({ input: 'api', binding: 'scene-exit' }),
    openModeSeat,
    closeModeSeat,
    stepModeSeat,
    clearPotentiation: () => clearPotentiation({ reason: 'api' }),
  };
  window.__SPW_KEY_EVENTS__ = api;
  window.spwKeyEvents = api;

  writeDatasetValue(document.documentElement, 'spwKeyEventsReady', 'true', {
    source: 'spw-key-events',
    reason: 'api-ready',
  });
}

export function initSpwKeyEvents(root = document) {
  if (initialized) return () => {};
  initialized = true;

  publishApi();

  if (root) {
    root.addEventListener('focusin', onFocusIn, true);
    root.addEventListener('keydown', onKeyDown, true);
  }

  return () => {
    initialized = false;
    clearRevealTasks();
    if (root) {
      root.removeEventListener('focusin', onFocusIn, true);
      root.removeEventListener('keydown', onKeyDown, true);
    }
    while (sceneStack.length) {
      const exited = sceneStack.pop();
      const host = exited?.id ? document.getElementById(exited.id) : null;
      if (host instanceof HTMLElement) {
        writeDatasetValue(host, 'spwSceneState', null, { source: 'spw-key-events', reason: 'cleanup' });
        writeDatasetValue(host, 'spwRevealFrame', null, { source: 'spw-key-events', reason: 'cleanup' });
        collapseWonderBlock(host);
      }
    }
    syncSceneContextAttrs();
    writeRevealPhase('idle');
    clearPotentiation({ reason: 'cleanup' });
    writeDatasetValue(document.documentElement, 'spwKeyEventsReady', null, {
      source: 'spw-key-events',
      reason: 'cleanup',
    });
    delete window.__SPW_KEY_EVENTS__;
    delete window.spwKeyEvents;
  };
}

export { openModeSeat, closeModeSeat, stepModeSeat, selectModeSeatIndex };

export const spwModule = {
  updates: ['attr:data-spw-key-active'],
  mount: (mod, ctx, root) => initSpwKeyEvents(root),
};