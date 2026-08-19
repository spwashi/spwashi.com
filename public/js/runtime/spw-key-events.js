/**
 * spw-key-events.js
 * ---------------------------------------------------------------------------
 * Spw-backed keyboard events: potentiation (thread without collapse) and
 * actualization (commit into scene contexts other models can interpret).
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

function cycleActiveFrameMode(direction = 1) {
  const activeFrame = document.activeElement?.closest?.('.spw-frame, [data-spw-kind="frame"]')
    || document.querySelector('.spw-frame:hover, [data-spw-kind="frame"]:hover')
    || document.querySelector('.spw-frame, [data-spw-kind="frame"]');
  if (!activeFrame) return false;

  const modeButtons = Array.from(activeFrame.querySelectorAll('.mode-switch button, [data-set-mode]'));
  if (modeButtons.length <= 1) return false;

  const activeIndex = modeButtons.findIndex((btn) => btn.getAttribute('aria-pressed') === 'true');
  let nextIndex = 0;
  if (activeIndex >= 0) {
    nextIndex = (activeIndex + direction + modeButtons.length) % modeButtons.length;
  } else {
    nextIndex = direction > 0 ? 0 : modeButtons.length - 1;
  }

  const nextBtn = modeButtons[nextIndex];
  if (nextBtn instanceof HTMLElement) {
    nextBtn.click();
    nextBtn.focus();
    return true;
  }
  return false;
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

  // Handle Spw-native navigation, mode switches, and verbosity when not editing text
  if (!inInput) {
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
    if (event.key === '[') {
      if (cycleActiveFrameMode(-1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === ']') {
      if (cycleActiveFrameMode(1)) {
        event.preventDefault();
        return;
      }
    }
    if (event.key === '.' || event.key === '~') {
      if (groundCurrentOperator()) {
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

export const spwModule = {
  updates: ['attr:data-spw-key-active'],
  mount: (mod, ctx, root) => initSpwKeyEvents(root),
};