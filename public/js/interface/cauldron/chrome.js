import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { appendToDocument, guardCall } from '/public/js/kernel/dom-render.js';
import { applyCauldronState, computeCauldronPhase } from '/public/js/semantic/cauldron/contract.js';
import { isPhaseComplete } from './resonance.js';
import { getCauldron } from '/public/js/semantic/cauldron/storage.js';

const CHIP_SELECTOR = '.spw-cauldron-chip';
const PANEL_QUERY = '.site-footer__cauldron, [data-spw-cauldron]';
const PHASE_RAIL_SELECTOR = '[data-spw-cauldron-phase-rail]';
let cauldronDialog = null;
let restorePanel = null;

function ensureCauldronDialog() {
  if (cauldronDialog) return cauldronDialog;
  const dialog = document.createElement('dialog');
  if (typeof dialog.showModal !== 'function') return null;
  dialog.id = 'spw-cauldron-dialog';
  dialog.className = 'spw-cauldron-dialog';
  annotateFloatingChromeElement(dialog, {
    role: 'cauldron-dialog', island: 'cauldron-dialog', tier: 'drawer',
    mutator: 'cauldron-chrome', reason: 'cauldron-open', stylingAxis: 'cauldron',
  });
  dialog.setAttribute('aria-labelledby', 'spw-cauldron-title');
  dialog.setAttribute('aria-describedby', 'spw-cauldron-purpose');
  dialog.innerHTML = `
    <header class="spw-cauldron-dialog__header">
      <div><h2 id="spw-cauldron-title" tabindex="-1" autofocus>Cauldron</h2>
      <p id="spw-cauldron-purpose">Gather fragments. Find a connection. Keep what works.</p></div>
      <button type="button" class="spw-cauldron-dialog__close" aria-label="Close cauldron">Close <span aria-hidden="true">×</span></button>
    </header>`;
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  let backdropPress = false;
  const outside = (event) => {
    const rect = dialog.getBoundingClientRect();
    return event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom);
  };
  dialog.addEventListener('pointerdown', (event) => { backdropPress = outside(event); });
  dialog.addEventListener('click', (event) => {
    if (backdropPress && outside(event)) dialog.close();
    backdropPress = false;
  });
  dialog.addEventListener('close', () => {
    if (dialog.open) return; // Ignore a queued close from an earlier opening.
    restorePanel?.();
    restorePanel = null;
    safeSyncFloatingChip();
  });
  // A source link must leave the modal before the page can receive focus.
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('a[href]')) closeCauldronDialog();
  });
  document.body.append(dialog);
  cauldronDialog = dialog;
  return dialog;
}

export function openCauldronDialog(trigger = document.activeElement) {
  const host = document.querySelector(PANEL_QUERY);
  if (!(host instanceof HTMLElement)) return;
  const dialog = ensureCauldronDialog();
  if (!dialog) {
    host.closest('details')?.setAttribute('open', '');
    host.dataset.spwCauldronPanel = 'open';
    syncPanelToggleLabels(host);
    host.scrollIntoView({ block: 'center' });
    return;
  }
  if (dialog.open) return;
  restorePanel?.();
  restorePanel = null;
  const placeholder = document.createComment('cauldron home');
  const previousPanel = host.dataset.spwCauldronPanel;
  host.before(placeholder);
  restorePanel = () => {
    placeholder.replaceWith(host);
    host.dataset.spwCauldronPanel = previousPanel;
    syncPanelToggleLabels(host);
    footerPanelVisible = measureFooterPanelVisible(host);
    safeSyncFloatingChip();
    if (trigger instanceof HTMLElement && trigger.isConnected) {
      // Clearing can empty the chip while its modal is open. Keep the opener
      // available through focus restoration; it may yield after focus leaves.
      if (trigger === document.querySelector(CHIP_SELECTOR)) trigger.hidden = false;
      trigger.focus({ preventScroll: true });
    }
  };
  host.dataset.spwCauldronPanel = 'open';
  dialog.append(host);
  dialog.showModal();
  dialog.scrollTop = 0;
  safeSyncFloatingChip();
}

export function closeCauldronDialog() {
  if (!cauldronDialog?.open) return;
  cauldronDialog.close();
  // Restore synchronously so a source-jump can focus the page in this event.
  restorePanel?.();
  restorePanel = null;
}

let chipScrollBound = false;
let pendingChip = null;

function createFloatingChip() {
  const chip = document.createElement('a');
  chip.className = 'spw-cauldron-chip';
  chip.href = '#memory-garden-cauldron';
  chip.id = 'spw-cauldron-chip';
  chip.dataset.spwHypermediaExtension = 'state resume';
  chip.setAttribute('aria-label', 'Open the cauldron — what you are holding');
  chip.setAttribute('aria-haspopup', 'dialog');
  chip.setAttribute('aria-controls', 'spw-cauldron-dialog');
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
    openCauldronDialog(chip);
  });
  chip.addEventListener('blur', () => safeSyncFloatingChip());
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

  const hidden = cauldronDialog?.open
    || !(document.activeElement === chip || (count > 0 && !readFooterPanelVisible()));
  if (chip.hidden !== hidden) chip.hidden = hidden;
}

/* The chip yields while the cauldron panel is on screen: its top above 82% of
   the viewport and its bottom below the viewport top. An IntersectionObserver
   with that bottom inset reports the crossing once, so scrolling no longer
   reads layout on every event. */
let footerPanelVisible = false;
let footerPanelObserver = null;

function measureFooterPanelVisible(host) {
  const rect = host.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.82 && rect.bottom > 0;
}

function readFooterPanelVisible() {
  if (footerPanelObserver) return footerPanelVisible;
  const host = document.querySelector(PANEL_QUERY);
  return host instanceof HTMLElement ? measureFooterPanelVisible(host) : false;
}

function observeFooterPanel() {
  if (typeof IntersectionObserver !== 'function') return false;
  const host = document.querySelector(PANEL_QUERY);
  if (!(host instanceof HTMLElement)) return false;
  footerPanelVisible = measureFooterPanelVisible(host);
  footerPanelObserver = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1];
    if (!entry || entry.isIntersecting === footerPanelVisible) return;
    footerPanelVisible = entry.isIntersecting;
    safeSyncFloatingChip();
  }, { rootMargin: '0px 0px -18% 0px' });
  footerPanelObserver.observe(host);
  return true;
}

const safeSyncFloatingChip = guardCall(syncFloatingChip, 'cauldron:floating-chip');

export function setupCauldronChrome() {
  if (!chipScrollBound) {
    chipScrollBound = true;
    ensureCauldronDialog();
    document.querySelectorAll('a[href="#memory-garden-cauldron"]').forEach((link) => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.setAttribute('aria-controls', 'spw-cauldron-dialog');
    });
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href="#memory-garden-cauldron"]');
      if (!link || link.matches(CHIP_SELECTOR) || event.defaultPrevented
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      openCauldronDialog(link);
    });
    if (!observeFooterPanel()) {
      window.addEventListener('scroll', safeSyncFloatingChip, { passive: true });
      window.addEventListener('resize', safeSyncFloatingChip, { passive: true });
    }
  }
  safeSyncFloatingChip();
}

export function syncCauldronPhaseRail(phase) {
  document.querySelectorAll(PHASE_RAIL_SELECTOR).forEach((rail) => {
    applyCauldronState(rail, { phase });
    rail.querySelectorAll('[data-spw-phase-step]').forEach((step) => {
      const stepPhase = step.getAttribute('data-spw-phase-step');
      step.dataset.spwPhaseActive = stepPhase === phase ? 'true' : 'false';
      if (stepPhase === phase) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
      step.dataset.spwPhaseComplete = isPhaseComplete(stepPhase, phase) ? 'true' : 'false';
    });
  });
}

function syncPanelToggleLabels(host) {
  const toggle = host.querySelector('[data-spw-cauldron-panel-toggle]');
  if (!(toggle instanceof HTMLButtonElement)) return;
  toggle.removeAttribute('aria-expanded');
  toggle.textContent = 'Open cauldron';
  toggle.title = 'Open the composition palette';
  toggle.setAttribute('aria-label', 'Open cauldron');
}

export function syncCauldronPanelCollapse(count) {
  document.querySelectorAll(PANEL_QUERY).forEach((host) => {
    if (!(host instanceof HTMLElement)) return;
    if (host.closest('dialog[open]')) return;
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
    // The partial ships the toggle hidden: without this module it opens nothing.
    button.hidden = false;
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'spw-cauldron-dialog');
    button.addEventListener('click', () => {
      openCauldronDialog(button);
    });
  });
}

export { safeSyncFloatingChip as syncFloatingChip };
