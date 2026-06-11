import { computeCauldronPhase } from './contract.js';
import { isPhaseComplete } from './resonance.js';
import { getCauldron } from './storage.js';

const CHIP_SELECTOR = '.spw-cauldron-chip';
const PANEL_QUERY = '.site-footer__cauldron, [data-spw-cauldron]';
const PHASE_RAIL_SELECTOR = '[data-spw-cauldron-phase-rail]';
const COLLAPSE_QUERY = '(max-width: 720px)';

let chipScrollBound = false;

function ensureFloatingChip() {
  let chip = document.querySelector(CHIP_SELECTOR);
  if (chip instanceof HTMLElement) return chip;

  chip = document.createElement('a');
  chip.className = 'spw-cauldron-chip';
  chip.href = '#memory-garden-cauldron';
  chip.id = 'spw-cauldron-chip';
  chip.dataset.spwFloatingChrome = 'true';
  chip.dataset.spwChromeTier = 'floating';
  chip.dataset.spwChromeRole = 'cauldron-chip';
  chip.setAttribute('aria-label', 'Jump to memory garden cauldron');
  chip.hidden = true;
  chip.innerHTML = `
    <span class="spw-cauldron-chip__sigil" aria-hidden="true">◎</span>
    <span class="spw-cauldron-chip__count" data-spw-cauldron-chip-count>0</span>
    <span class="spw-cauldron-chip__phase" data-spw-cauldron-chip-phase>gather</span>
  `;
  chip.addEventListener('click', (event) => {
    event.preventDefault();
    const host = document.querySelector(PANEL_QUERY);
    host?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (host instanceof HTMLElement) {
      host.dataset.spwCauldronPanel = 'open';
      host.classList.add('is-cauldron-focused');
      window.setTimeout(() => host.classList.remove('is-cauldron-focused'), 1400);
    }
  });
  document.body.append(chip);
  return chip;
}

function syncFloatingChip() {
  const chip = ensureFloatingChip();
  const ingredients = getCauldron();
  const count = ingredients.length;
  const phase = computeCauldronPhase(ingredients);
  const countNode = chip.querySelector('[data-spw-cauldron-chip-count]');
  const phaseNode = chip.querySelector('[data-spw-cauldron-chip-phase]');
  if (countNode) countNode.textContent = String(count);
  if (phaseNode) {
    phaseNode.textContent = phase === 'spell-ready' ? 'cast' : phase === 'mixing' ? 'compose' : phase === 'primed' ? 'prime' : 'gather';
  }
  chip.dataset.spwCauldronPhase = phase;
  chip.dataset.spwCauldronCount = String(count);

  const scrolled = window.scrollY > Math.max(420, window.innerHeight * 0.42);
  const footerVisible = (() => {
    const host = document.querySelector(PANEL_QUERY);
    if (!(host instanceof HTMLElement)) return false;
    const rect = host.getBoundingClientRect();
    return rect.top < window.innerHeight * 0.82;
  })();
  chip.hidden = !(count > 0 && scrolled && !footerVisible);
}

export function setupCauldronChrome() {
  if (!chipScrollBound) {
    chipScrollBound = true;
    window.addEventListener('scroll', syncFloatingChip, { passive: true });
    window.addEventListener('resize', syncFloatingChip, { passive: true });
  }
  syncFloatingChip();
}

export function syncCauldronPhaseRail(phase) {
  document.querySelectorAll(PHASE_RAIL_SELECTOR).forEach((rail) => {
    rail.dataset.spwCauldronPhase = phase;
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
  toggle.title = open ? 'Collapse cauldron panel' : 'Expand cauldron panel';
}

export function syncCauldronPanelCollapse(count) {
  const compact = window.matchMedia(COLLAPSE_QUERY).matches;
  document.querySelectorAll(PANEL_QUERY).forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    if (!compact) {
      host.dataset.spwCauldronPanel = 'open';
      syncPanelToggleLabels(host);
      return;
    }
    if (count > 0) host.dataset.spwCauldronPanel = 'open';
    else if (!host.dataset.spwCauldronPanel) host.dataset.spwCauldronPanel = 'compact';
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
      syncPanelToggleLabels(host);
    });
  });
}

export { syncFloatingChip };