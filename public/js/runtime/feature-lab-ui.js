/**
 * Feature lab settings controls — session presence overrides UI.
 * Extracted from site-settings-ui so the settings page stays focused on prefs.
 */

import { BEHAVIOR_SCOPE_KEYS } from '/public/js/runtime/behavior-scopes.js';
import { parseFeatureList } from '/public/js/runtime/runtime-helpers.js';
import {
  clearFeatureLabSession,
  describeFeatureLabState,
  toggleFeatureLabToken,
} from '/public/js/runtime/feature-lab.js';

const FEATURE_LAB_CANDIDATES = Object.freeze([
  ...BEHAVIOR_SCOPE_KEYS,
  'operators',
  'navigator',
  'console',
  'metrics',
  'feature-discovery',
  'inspectability',
  'themes',
]);

function uniqueFeatureLabTokens() {
  const seen = new Set();
  const out = [];
  FEATURE_LAB_CANDIDATES.forEach((token) => {
    if (seen.has(token)) return;
    seen.add(token);
    out.push(token);
  });
  return out;
}

export function syncFeatureLabControls(root = document) {
  if (!root?.querySelectorAll) return;

  const state = describeFeatureLabState(document.body);
  const activeSet = parseFeatureList(state.active);

  root.querySelectorAll('[data-site-feature-lab-ops]').forEach((node) => {
    node.textContent = state.opsString || 'none (authored only)';
  });
  root.querySelectorAll('[data-site-feature-lab-active]').forEach((node) => {
    node.textContent = state.active || 'none';
  });
  root.querySelectorAll('[data-site-feature-lab-authored]').forEach((node) => {
    node.textContent = state.authored || 'none';
  });
  root.querySelectorAll('[data-site-feature-lab-status]').forEach((node) => {
    node.textContent = state.applied
      ? `session lab · +${state.added.length} −${state.removed.length}`
      : 'authored body features';
  });

  root.querySelectorAll('[data-site-feature-lab-toggle]').forEach((control) => {
    const token = control.getAttribute('data-site-feature-lab-toggle') || '';
    if (!token) return;
    const on = activeSet.has(token);
    control.setAttribute('aria-pressed', on ? 'true' : 'false');
    control.dataset.siteFeatureLabState = on ? 'on' : 'off';
    if (!control.getAttribute('aria-label')) {
      control.setAttribute('aria-label', `Feature lab: ${token}`);
    }
  });
}

export function ensureFeatureLabToggleStrip(root = document) {
  root.querySelectorAll?.('[data-site-feature-lab-toggles]')?.forEach((host) => {
    if (host.childElementCount > 0) return;
    uniqueFeatureLabTokens().forEach((token) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'operator-chip';
      button.setAttribute('data-site-feature-lab-toggle', token);
      button.setAttribute('data-spw-operator', 'select');
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `Feature lab: ${token}`);
      button.textContent = token;
      host.appendChild(button);
    });
  });
}

export function bindFeatureLabControls(root = document) {
  if (!(root instanceof HTMLElement) && root !== document) {
    return {
      cleanup() {},
      refresh() {},
    };
  }

  const hasHosts = Boolean(
    root.querySelector?.(
      '[data-site-feature-lab-panel], [data-site-feature-lab-toggle], [data-site-feature-lab-toggles], [data-site-feature-lab-clear]'
    )
  );
  if (!hasHosts) {
    return {
      cleanup() {},
      refresh() {},
    };
  }

  ensureFeatureLabToggleStrip(root);
  syncFeatureLabControls(root);

  const handleClick = (event) => {
    const clearBtn = event.target instanceof Element
      ? event.target.closest('[data-site-feature-lab-clear]')
      : null;
    if (clearBtn instanceof HTMLElement) {
      clearFeatureLabSession();
      window.location.reload();
      return;
    }

    const toggle = event.target instanceof Element
      ? event.target.closest('[data-site-feature-lab-toggle]')
      : null;
    if (!(toggle instanceof HTMLElement)) return;
    const token = toggle.getAttribute('data-site-feature-lab-toggle');
    if (!token) return;
    toggleFeatureLabToken(token, { body: document.body });
    window.location.reload();
  };

  root.addEventListener('click', handleClick);

  return {
    cleanup() {
      root.removeEventListener('click', handleClick);
    },
    refresh() {
      ensureFeatureLabToggleStrip(root);
      syncFeatureLabControls(root);
    },
  };
}

export const SPW_FEATURE_LAB_UI_CONTRACT = Object.freeze({
  candidates: FEATURE_LAB_CANDIDATES,
  hosts: '[data-site-feature-lab-panel], [data-site-feature-lab-toggle], [data-site-feature-lab-toggles], [data-site-feature-lab-clear]',
  portableUse:
    'bindFeatureLabControls(root) on settings (or any host with data-site-feature-lab-*). '
    + 'Session ops live in feature-lab.js; this module is presentation only.',
});
