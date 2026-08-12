/**
 * Attention posture preview panel and header action sync.
 */

import {
  annotateFloatingChromeElement,
  syncFloatingChromeState,
  writeDatasetValue,
} from '/public/js/kernel/dom-contracts.js';

const ATTENTION_RELATION_LABELS = Object.freeze({
  breath: 'breath',
  'inner-weather': 'inner weather',
  'dimensional-scan': 'dimensional scan',
  'immediate-field': 'immediate field',
  witness: 'witness',
  'reciprocity-proof': 'reciprocity / proof',
  'horizon-systems': 'horizon systems',
  'cultural-fermentation': 'cultural fermentation',
  stewardship: 'stewardship',
});

export function getAttentionRelationLabel(value, fallback) {
  const normalized = String(value || fallback || '').trim();
  if (!normalized) return '';
  return ATTENTION_RELATION_LABELS[normalized] || normalized.replace(/-/g, ' ');
}

export function getCurrentAttentionPosture() {
  const settings = window.spwSettings?.get?.() || {};
  const root = document.documentElement.dataset || {};
  const self = settings.attentionSelfRelation || root.spwAttentionSelfRelation || 'breath';
  const local = settings.attentionLocalRelation || root.spwAttentionLocalRelation || 'immediate-field';
  const global = settings.attentionGlobalRelation || root.spwAttentionGlobalRelation || 'horizon-systems';

  return {
    self,
    local,
    global,
    label: [
      getAttentionRelationLabel(self, 'breath'),
      getAttentionRelationLabel(local, 'immediate-field'),
      getAttentionRelationLabel(global, 'horizon-systems'),
    ].filter(Boolean).join(' / '),
  };
}

export function syncAttentionPosturePanel(panel, posture = getCurrentAttentionPosture()) {
  if (!(panel instanceof HTMLElement)) return;

  const self = panel.querySelector('[data-spw-attention-panel-self]');
  const local = panel.querySelector('[data-spw-attention-panel-local]');
  const global = panel.querySelector('[data-spw-attention-panel-global]');
  const summary = panel.querySelector('[data-spw-attention-panel-summary]');

  if (self) self.textContent = getAttentionRelationLabel(posture.self, 'breath');
  if (local) local.textContent = getAttentionRelationLabel(posture.local, 'immediate-field');
  if (global) global.textContent = getAttentionRelationLabel(posture.global, 'horizon-systems');
  if (summary) {
    summary.textContent = `${posture.label}. Media Cauldron reads this posture when shaping seed prompts.`;
  }
}

export function syncHeaderActions(header) {
  if (!(header instanceof HTMLElement)) return;
  const posture = getCurrentAttentionPosture();
  const pill = header.querySelector('.spw-attention-posture-pill');
  const label = pill?.querySelector('[data-spw-attention-posture-label]');
  const panel = header.querySelector('.spw-attention-posture-panel');

  if (pill instanceof HTMLElement) {
    pill.dataset.spwAttentionPosture = `${posture.self} ${posture.local} ${posture.global}`;
    pill.dataset.spwAttentionSelfRelation = posture.self;
    pill.dataset.spwAttentionLocalRelation = posture.local;
    pill.dataset.spwAttentionGlobalRelation = posture.global;
    pill.setAttribute('aria-label', `Preview attention posture. Current posture: ${posture.label}.`);
    pill.title = `Preview attention posture: ${posture.label}.`;
  }

  if (label) {
    label.textContent = posture.label || 'self / local / global';
  }

  syncAttentionPosturePanel(panel, posture);
}

export function ensureAttentionPosturePanel(header, pill) {
  if (!(header instanceof HTMLElement) || !(pill instanceof HTMLElement)) return null;
  let panel = header.querySelector('.spw-attention-posture-panel');
  if (panel instanceof HTMLElement) return panel;

  const panelId = 'spw-attention-posture-panel';
  panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'spw-attention-posture-panel';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Attention posture preview');
  panel.dataset.spwFeature = 'attention-posture-preview';
  panel.dataset.spwChromeIsland = 'attention-posture-preview';
  panel.dataset.spwPopupState = 'closed';
  annotateFloatingChromeElement(panel, {
    role: 'persona-tooltip',
    tier: 'header',
    mutator: 'shell-disclosure',
    reason: 'attention-posture-preview',
    stylingAxis: 'shell-popup',
  });
  panel.innerHTML = `
    <div class="spw-attention-posture-panel__topline">
      <strong>Attention posture</strong>
    </div>
    <p class="spw-attention-posture-panel__summary" data-spw-attention-panel-summary></p>
    <dl class="spw-attention-posture-panel__values">
      <div><dt>Self</dt><dd data-spw-attention-panel-self></dd></div>
      <div><dt>Local</dt><dd data-spw-attention-panel-local></dd></div>
      <div><dt>Global</dt><dd data-spw-attention-panel-global></dd></div>
    </dl>
    <a class="spw-attention-posture-panel__action" href="/settings/#attention-posture-settings">Open settings</a>
    <button type="button" class="spw-attention-posture-panel__close" data-spw-attention-panel-close aria-label="Close attention posture preview">Close</button>
  `;

  pill.setAttribute('aria-haspopup', 'dialog');
  pill.setAttribute('aria-expanded', 'false');
  pill.setAttribute('aria-controls', panelId);
  pill.insertAdjacentElement('afterend', panel);
  syncAttentionPosturePanel(panel);
  return panel;
}

export function setAttentionPosturePanelOpen(header, open, { focusPill = false } = {}) {
  if (!(header instanceof HTMLElement)) return;
  const pill = header.querySelector('.spw-attention-posture-pill');
  const panel = header.querySelector('.spw-attention-posture-panel');
  if (!(pill instanceof HTMLElement) || !(panel instanceof HTMLElement)) return;

  const nextOpen = !!open;
  panel.hidden = !nextOpen;
  pill.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  header.dataset.spwAttentionPosturePanel = nextOpen ? 'open' : 'closed';
  writeDatasetValue(panel, 'spwPopupState', nextOpen ? 'open' : 'closed');
  syncAttentionPosturePanel(panel);
  syncFloatingChromeState(document, {
    source: 'shell-disclosure',
    reason: nextOpen ? 'attention-posture-opened' : 'attention-posture-closed',
  });

  if (!nextOpen && focusPill) {
    pill.focus();
  }
}
