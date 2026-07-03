import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { appendToDocument, guardCall } from '/public/js/kernel/dom-render.js';
import { applyCauldronState, computeCauldronPhase } from './contract.js';
import { isPhaseComplete } from './resonance.js';
import { getCauldron } from './storage.js';

const CHIP_SELECTOR = '.spw-cauldron-chip';
const PANEL_QUERY = '.site-footer__cauldron, [data-spw-cauldron]';
const PHASE_RAIL_SELECTOR = '[data-spw-cauldron-phase-rail]';
const COLLAPSE_QUERY = '(max-width: 720px)';

let chipScrollBound = false;
let pendingChip = null;

function createFloatingChip() {
  const chip = document.createElement('a');
  chip.className = 'spw-cauldron-chip';
  chip.href = '#memory-garden-cauldron';
  chip.id = 'spw-cauldron-chip';
  chip.dataset.spwHypermediaExtension = 'state resume';
  chip.setAttribute('aria-label', 'Open extension pocket');
  chip.hidden = true;
  chip.innerHTML = `
    <span class="spw-cauldron-chip__sigil" aria-hidden="true">◎</span>
    <span class="spw-cauldron-chip__count" data-spw-cauldron-chip-count>0</span>
    <span class="spw-cauldron-chip__phase" data-spw-cauldron-chip-phase>gather</span>
  `;
  annotateFloatingChromeElement(chip, {
    role: 'cauldron-chip',
    tier: 'docked',
    mutator: 'cauldron-chrome',
    reason: 'floating-cauldron-chip',
    stylingAxis: 'page-locomotion',
  });
  chip.addEventListener('click', (event) => {
    event.preventDefault();
    const host = document.querySelector(PANEL_QUERY);
    host?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (host instanceof HTMLElement) {
      host.dataset.spwCauldronPanel = 'open';
      host.dataset.spwCauldronPanelUser = 'open';
      syncPanelToggleLabels(host);
      host.classList.add('is-cauldron-focused');
      window.setTimeout(() => host.classList.remove('is-cauldron-focused'), 1400);
    }
  });
  return chip;
}

function ensureFloatingChip() {
  const existing = document.querySelector(CHIP_SELECTOR);
  if (existing instanceof HTMLElement) return existing;

  const chip = pendingChip instanceof HTMLElement ? pendingChip : createFloatingChip();
  pendingChip = chip;

  if (!chip.isConnected) {
    appendToDocument(chip);
  }

  return chip;
}

function syncFloatingChip() {
  const chip = ensureFloatingChip();
  if (!(chip instanceof HTMLElement)) return;

  const ingredients = getCauldron();
  const count = ingredients.length;
  const phase = computeCauldronPhase(ingredients);
  const countNode = chip.querySelector('[data-spw-cauldron-chip-count]');
  const phaseNode = chip.querySelector('[data-spw-cauldron-chip-phase]');
  if (countNode) countNode.textContent = String(count);
  if (phaseNode) {
    phaseNode.textContent = phase === 'spell-ready' ? 'cast' : phase === 'mixing' ? 'compose' : phase === 'primed' ? 'prime' : 'gather';
  }
  applyCauldronState(chip, { phase, count });

  const scrolled = window.scrollY > Math.max(420, window.innerHeight * 0.42);
  const footerVisible = (() => {
    const host = document.querySelector(PANEL_QUERY);
    if (!(host instanceof HTMLElement)) return false;
    const rect = host.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.82;
  })();
  chip.hidden = !(count > 0 && scrolled && !footerVisible);
}

const safeSyncFloatingChip = guardCall(syncFloatingChip, 'cauldron:floating-chip');

export function setupCauldronChrome() {
  if (!chipScrollBound) {
    chipScrollBound = true;
    window.addEventListener('scroll', safeSyncFloatingChip, { passive: true });
    window.addEventListener('resize', safeSyncFloatingChip, { passive: true });
  }
  safeSyncFloatingChip();
}

export function syncCauldronPhaseRail(phase) {
  document.querySelectorAll(PHASE_RAIL_SELECTOR).forEach((rail) => {
    applyCauldronState(rail, { phase });
    rail.querySelectorAll('[data-spw-phase-step]').forEach((step) => {
      const stepPhase = step.getAttribute('data-spw-phase-step');
      step.dataset.spwPhaseActive = stepPhase === phase ? 'true' : 'false';
      step.dataset.spwPhaseComplete = isPhaseComplete(stepPhase, phase) ? 'true' : 'false';
    });
  });
}

function syncPanelToggleLabels(host) {
  const toggle = host.querySelector('[data-spw-cauldron-panel-toggle]');
  if (!(toggle instanceof HTMLButtonElement)) return;
  const open = host.dataset.spwCauldronPanel !== 'compact';
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  toggle.textContent = open ? 'hide' : 'show';
  toggle.title = open ? 'Hide extension pocket' : 'Show extension pocket';
}

export function syncCauldronPanelCollapse(count) {
  document.querySelectorAll(PANEL_QUERY).forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    if (count > 0) {
      host.dataset.spwCauldronPanel = 'open';
    } else if (host.dataset.spwCauldronPanelUser !== 'open') {
      host.dataset.spwCauldronPanel = 'compact';
    }
    syncPanelToggleLabels(host);
  });
}

export function bindCauldronPanelToggle() {
  document.querySelectorAll('[data-spw-cauldron-panel-toggle]').forEach((button) => {
    if (button.dataset.spwCauldronPanelBound === 'true') return;
    button.dataset.spwCauldronPanelBound = 'true';
    button.addEventListener('click', () => {
      const host = button.closest(PANEL_QUERY);
      if (!(host instanceof HTMLElement)) return;
      const next = host.dataset.spwCauldronPanel === 'open' ? 'compact' : 'open';
      host.dataset.spwCauldronPanel = next;
      host.dataset.spwCauldronPanelUser = next === 'open' ? 'open' : '';
      syncPanelToggleLabels(host);
    });
  });
}

export { safeSyncFloatingChip as syncFloatingChip };
