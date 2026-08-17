/**
 * interactive-expression-lab.js
 * --------------------------------------------------------------------------
 * In-situ editable Spw expressions with delimiter geometry, boundary-aware
 * autocompletion, differential comparison (<concept>, (scene), [mode], {payload}),
 * site search integration, route discovery, local persistence for screenshotting,
 * and live cauldron resonance.
 * ========================================================================== */

import {
  describeSpwDimensionality,
  describeSpwExpression,
} from '/public/js/semantic/spw-expression-geometry.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

const STORAGE_KEY = 'spw-edited-expressions';

const KNOWN_ROUTES = Object.freeze({
  software: '/topics/software/',
  spw: '/topics/software/spw/',
  atlas: '/topics/software/spw/',
  workbench: '/topics/software/spw/',
  math: '/topics/math/',
  calculus: '/topics/math/calculus/',
  physics: '/topics/physics/',
  culinary: '/recipes/',
  kitchen: '/recipes/',
  recipes: '/recipes/',
  session: '/play/rpg-wednesday/',
  rpg: '/play/rpg-wednesday/',
  gameplay: '/play/rpg-wednesday/',
  palettes: '/design/palettes/',
  spectral: '/design/palettes/',
  design: '/design/',
  craft: '/craft/',
  about: '/about/',
  services: '/services/',
  plans: '/plans/',
  play: '/play/',
  settings: '/settings/',
});

const BOUNDARY_SEMANTICS = Object.freeze({
  capsule: {
    label: 'Concept / Topic',
    role: 'concept',
    open: '<',
    close: '>',
    glyph: '< >',
    description: 'Opens a topical boundary; indexes into kin concept nodes.',
    suggestions: ['software', 'math', 'syntax', 'physics', 'grammar', 'culinary', 'dialogue', 'material'],
  },
  scope: {
    label: 'Scene / Midprocess',
    role: 'scene',
    open: '(',
    close: ')',
    glyph: '( )',
    description: 'Stages an ephemeral midprocess or runtime interaction posture.',
    suggestions: ['reading', 'perusal', 'inspection', 'session', 'encounter', 'craft', 'tending'],
  },
  frame: {
    label: 'Mode / Lens Variant',
    role: 'mode',
    open: '[',
    close: ']',
    glyph: '[ ]',
    description: 'Selects a discrete presentation lens, variant, or layout mode.',
    suggestions: ['reading', 'inspect', 'compare', 'build', 'field', 'workshop', 'atlas'],
  },
  body: {
    label: 'Payload / Practice',
    role: 'practice',
    open: '{',
    close: '}',
    glyph: '{ }',
    description: 'Holds operational payloads, ingredient sets, or practices for cauldron digestion.',
    suggestions: ['combine', 'discover', 'reward', 'sear', 'emulsify', 'align', 'resonate', 'balance'],
  },
});

function readStoredExpressions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredExpressions(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function resolveRouteForExpression(geometry) {
  const candidates = [
    geometry.root?.toLowerCase(),
    ...geometry.channels.map((c) => c.toLowerCase()),
    ...geometry.tokens.filter((t) => t.type === 'text').map((t) => t.value.trim().toLowerCase()),
  ].filter(Boolean);

  for (const token of candidates) {
    if (KNOWN_ROUTES[token]) {
      return { token, href: KNOWN_ROUTES[token] };
    }
  }
  return null;
}

let activeHud = null;
let activeHudTarget = null;
let activeHudGeometry = null;
let hudPositionFrame = 0;

function hideActiveHud(target = null) {
  if (!activeHud || (target && target !== activeHudTarget)) return;
  activeHud.classList.remove('is-visible');
  activeHudTarget = null;
  activeHudGeometry = null;
  if (hudPositionFrame) {
    window.cancelAnimationFrame(hudPositionFrame);
    hudPositionFrame = 0;
  }
}

function syncHudPosition() {
  hudPositionFrame = 0;
  if (!activeHud?.classList.contains('is-visible') || !activeHudTarget?.isConnected) return;

  const targetRect = activeHudTarget.getBoundingClientRect();
  const hudRect = activeHud.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportLeft = viewport?.offsetLeft || 0;
  const viewportTop = viewport?.offsetTop || 0;
  const viewportWidth = viewport?.width || window.innerWidth;
  const viewportHeight = viewport?.height || window.innerHeight;
  const gutter = 12;
  const minLeft = viewportLeft + gutter;
  const maxLeft = Math.max(minLeft, viewportLeft + viewportWidth - hudRect.width - gutter);
  const minTop = viewportTop + gutter;
  const maxTop = Math.max(minTop, viewportTop + viewportHeight - hudRect.height - gutter);
  const below = targetRect.bottom + 6;
  const above = targetRect.top - hudRect.height - 6;
  const preferredTop = below + hudRect.height <= viewportTop + viewportHeight - gutter
    ? below
    : above;

  activeHud.style.left = `${Math.max(minLeft, Math.min(targetRect.left, maxLeft))}px`;
  activeHud.style.top = `${Math.max(minTop, Math.min(preferredTop, maxTop))}px`;
}

function scheduleHudPosition() {
  if (hudPositionFrame || !activeHud?.classList.contains('is-visible') || !activeHudTarget) return;
  hudPositionFrame = window.requestAnimationFrame(syncHudPosition);
}

function ensureHud() {
  if (activeHud) return activeHud;

  const hud = document.createElement('div');
  hud.className = 'spw-expression-hud';
  hud.setAttribute('role', 'dialog');
  hud.setAttribute('aria-label', 'Spw Expression Geometry & Discovery HUD');

  hud.innerHTML = `
    <div class="spw-expression-hud__header">
      <span class="spw-expression-hud__title">Geometry &amp; Boundary Lens</span>
      <span class="spec-pill" data-hud="wake">unbounded</span>
    </div>
    <ol class="spw-expression-hud__dimensions" aria-label="Expression dimensions from handle to replay path">
      <li data-hud-dimension="0">
        <a href="/topics/software/#software-surface">
          <span class="spw-expression-hud__order">0D</span>
          <strong>Handle</strong>
          <small data-hud-dimension-status>in source</small>
        </a>
      </li>
      <li data-hud-dimension="1">
        <a href="/topics/software/spw/#operator-ring">
          <span class="spw-expression-hud__order">1D</span>
          <strong>Vector</strong>
          <small data-hud-dimension-status>operator</small>
        </a>
      </li>
      <li data-hud-dimension="2">
        <a href="/topics/software/spw/#concept-form-lab">
          <span class="spw-expression-hud__order">2D</span>
          <strong>Form</strong>
          <small data-hud-dimension-status>boundary</small>
        </a>
      </li>
      <li data-hud-dimension="3">
        <a href="/topics/software/#semantic-fields">
          <span class="spw-expression-hud__order">3D</span>
          <strong>Field</strong>
          <small data-hud-dimension-status>host context</small>
        </a>
      </li>
      <li data-hud-dimension="4">
        <a href="/settings/#spell-board">
          <span class="spw-expression-hud__order">4D</span>
          <strong>Path</strong>
          <small data-hud-dimension-status>runtime replay</small>
        </a>
      </li>
    </ol>
    <div class="spw-expression-hud__forms">
      <button type="button" class="spw-form-morph-btn" data-morph="frame" title="Select as Mode/Variant [ ]">
        <span class="spw-form-glyph">[mode]</span>
        <span>Variant</span>
      </button>
      <button type="button" class="spw-form-morph-btn" data-morph="body" title="Hold as Payload/Practice { }">
        <span class="spw-form-glyph">{payload}</span>
        <span>Practice</span>
      </button>
      <button type="button" class="spw-form-morph-btn" data-morph="capsule" title="Open as Concept/Topic < >">
        <span class="spw-form-glyph">&lt;concept&gt;</span>
        <span>Topic</span>
      </button>
      <button type="button" class="spw-form-morph-btn" data-morph="scope" title="Stage as Scene/Midprocess ( )">
        <span class="spw-form-glyph">(scene)</span>
        <span>Midprocess</span>
      </button>
    </div>
    <div class="spw-expression-hud__suggestions" data-hud="suggestions"></div>
    <div class="spw-expression-hud__nav-strip" data-hud="nav-strip">
      <a class="spw-hud-nav-link" data-hud="route-link" href="#" hidden>
        <span>➔</span> <span data-hud="route-label">Navigate to Route</span>
      </a>
      <button type="button" class="spw-hud-search-btn" data-hud="search-btn">
        <span>🔍</span> Search in Site Index
      </button>
    </div>
  `;

  hud.addEventListener('click', (event) => {
    const button = event.target.closest?.('.spw-form-morph-btn');
    if (!button || !activeHudTarget || !activeHudGeometry) return;

    event.preventDefault();
    const targetForm = button.getAttribute('data-morph');
    const targetConfig = BOUNDARY_SEMANTICS[targetForm];
    if (!targetConfig) return;

    const root = activeHudGeometry.root || 'stem';
    const firstToken = activeHudGeometry.channels[0] || 'token';
    activeHudTarget.textContent = `${root}${targetConfig.open}${firstToken}${targetConfig.close}`;
    activeHudTarget.dispatchEvent(new Event('input', { bubbles: true }));
    activeHudTarget.focus({ preventScroll: true });
  });

  hud.addEventListener('focusout', () => {
    window.setTimeout(() => {
      const focused = document.activeElement;
      if (!hud.contains(focused) && focused !== activeHudTarget) hideActiveHud();
    }, 0);
  });

  document.body.appendChild(hud);
  window.addEventListener('resize', scheduleHudPosition, { passive: true });
  window.addEventListener('scroll', scheduleHudPosition, { passive: true, capture: true });
  window.visualViewport?.addEventListener('resize', scheduleHudPosition, { passive: true });
  window.visualViewport?.addEventListener('scroll', scheduleHudPosition, { passive: true });
  activeHud = hud;
  return hud;
}

export function initInteractiveExpressionLab(root = document) {
  const elements = root.querySelectorAll?.('[data-spw-interactive-expression], .spw-interactive-expression, [data-spw-semantic-expression][data-spw-editable="true"]');
  if (!elements || !elements.length) return;

  const stored = readStoredExpressions();
  const pagePath = location.pathname;

  elements.forEach((el, index) => {
    if (el.dataset.spwExpressionLabBound) return;
    el.dataset.spwExpressionLabBound = 'true';

    const exprKey = el.dataset.spwExpressionKey || `${pagePath}#expr-${index}`;
    const authored = el.dataset.spwAuthoredExpression || el.textContent.trim();
    el.dataset.spwAuthoredExpression = authored;

    // Restore saved edit if present
    if (stored[exprKey] && stored[exprKey] !== authored) {
      el.textContent = stored[exprKey];
      el.dataset.spwEdited = 'true';
      writeDatasetValue(el, 'spwCharge', 'charged');
    }

    el.setAttribute('contenteditable', 'plaintext-only');
    el.setAttribute('spellcheck', 'false');

    let currentGeometry = describeSpwExpression(el.textContent.trim());

    function positionHud(target) {
      const hud = ensureHud();
      activeHudTarget = target;
      updateHudDisplay(target);
      hud.classList.add('is-visible');
      scheduleHudPosition();
    }

    function updateHudDisplay(target) {
      if (!activeHud) return;
      const text = target.textContent.trim();
      currentGeometry = describeSpwExpression(text);
      activeHudGeometry = currentGeometry;

      const wakeLabel = activeHud.querySelector('[data-hud="wake"]');
      if (wakeLabel) wakeLabel.textContent = currentGeometry.wake || 'root';

      const hostContext = target.closest('section[id], article[id], main[id], body');
      const dimensionality = describeSpwDimensionality(text, {
        hostContext: hostContext?.id || hostContext?.dataset?.spwSurface || 'page',
        runtimePath: '/settings/#spell-board',
      });
      const currentOrder = dimensionality.authoredThrough;

      activeHud.querySelectorAll('[data-hud-dimension]').forEach((item) => {
        const order = Number(item.getAttribute('data-hud-dimension'));
        const dimension = dimensionality.dimensions[order];
        const status = item.querySelector('[data-hud-dimension-status]');
        const link = item.querySelector('a');
        const labels = {
          authored: 'in source',
          contextual: 'host context',
          runtime: 'replay path',
          available: 'next layer',
        };

        item.dataset.dimensionState = dimension?.state || 'available';
        if (status) status.textContent = labels[dimension?.state] || labels.available;
        if (link) {
          if (order === 0) {
            link.href = hostContext?.id ? `#${hostContext.id}` : `${location.pathname}${location.search}`;
          }
          if (order === currentOrder) link.setAttribute('aria-current', 'step');
          else link.removeAttribute('aria-current');
        }
      });

      // Mark active form morph buttons
      activeHud.querySelectorAll('.spw-form-morph-btn').forEach((btn) => {
        const form = btn.getAttribute('data-morph');
        const isActive = currentGeometry.forms.includes(form);
        btn.classList.toggle('is-active', isActive);
      });

      // Update contextual suggestions
      const suggestionsHost = activeHud.querySelector('[data-hud="suggestions"]');
      if (suggestionsHost) {
        suggestionsHost.innerHTML = '';
        const primaryForm = currentGeometry.forms[0] || 'frame';
        const config = BOUNDARY_SEMANTICS[primaryForm] || BOUNDARY_SEMANTICS.frame;

        config.suggestions.forEach((suggestion) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'spw-suggestion-chip';
          chip.textContent = `${config.open}${suggestion}${config.close}`;
          chip.addEventListener('click', (e) => {
            e.preventDefault();
            const root = currentGeometry.root || 'stem';
            target.textContent = `${root}${config.open}${suggestion}${config.close}`;
            target.dispatchEvent(new Event('input', { bubbles: true }));
          });
          suggestionsHost.appendChild(chip);
        });
      }

      // Check route navigation match
      const matchedRoute = resolveRouteForExpression(currentGeometry);
      const routeLink = activeHud.querySelector('[data-hud="route-link"]');
      const routeLabel = activeHud.querySelector('[data-hud="route-label"]');
      if (routeLink && routeLabel) {
        if (matchedRoute) {
          routeLink.href = matchedRoute.href;
          routeLabel.textContent = `Jump to ${matchedRoute.token} (${matchedRoute.href})`;
          routeLink.hidden = false;
        } else {
          routeLink.hidden = true;
        }
      }

      // Wire search button
      const searchBtn = activeHud.querySelector('[data-hud="search-btn"]');
      if (searchBtn) {
        searchBtn.onclick = (e) => {
          e.preventDefault();
          const cleanQuery = currentGeometry.root || text.replace(/[{}\[\]()<>\s]+/g, ' ').trim();
          if (window.spwSearch?.open) {
            window.spwSearch.open({ query: cleanQuery, source: 'interactive-expression' });
          } else {
            location.href = `/search/?q=${encodeURIComponent(cleanQuery)}`;
          }
        };
      }
    }

    // Focus & Input Listeners
    el.addEventListener('focus', () => {
      positionHud(el);
    });

    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const matched = resolveRouteForExpression(currentGeometry);
        if (matched) {
          location.href = matched.href;
        } else if (window.spwSearch?.open) {
          window.spwSearch.open({ query: currentGeometry.root || el.textContent.trim(), source: 'expression-enter' });
        }
      }
    });

    el.addEventListener('input', () => {
      const val = el.textContent.trim();
      const currentStored = readStoredExpressions();
      if (val !== authored) {
        currentStored[exprKey] = val;
        el.dataset.spwEdited = 'true';
        writeDatasetValue(el, 'spwCharge', 'charged');
      } else {
        delete currentStored[exprKey];
        delete el.dataset.spwEdited;
      }
      writeStoredExpressions(currentStored);
      updateHudDisplay(el);
      scheduleHudPosition();

      // Emit event for cauldron & wonder memory
      window.dispatchEvent(new CustomEvent('spw:expression-tuned', {
        bubbles: true,
        detail: { key: exprKey, expression: val, geometry: currentGeometry },
      }));
    });

    el.addEventListener('blur', () => {
      setTimeout(() => {
        if (!document.activeElement?.closest?.('.spw-expression-hud')) {
          hideActiveHud(el);
        }
      }, 200);
    });
  });
}
