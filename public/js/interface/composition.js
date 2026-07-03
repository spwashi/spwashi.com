/**
 * Spw Cauldron — Semantic Ingredient Vessel
 *
 * This module manages the Composition Cauldron: a deliberate gathering space
 * for semantic expressions (Spw "ingredients") before they are mixed/cast into
 * new forms (prompts, seeds, or stabilized spells).
 *
 * Philosophy (aligned with operators-as-forces model):
 * - Operators (#>, ^, ?, ~, @, etc.) are elemental forces.
 * - The cauldron is the phase of *collection and resonance* (gathering forces).
 * - Mixing is the moment of *emergence* — a new semantic form or "cast spell"
 *   arises from the interaction of collected forces.
 * - This directly supports the scientifically-social component taxonomy:
 *   stable, inspectable patterns arise from repeated gathering + casting rhythms.
 *
 * The cauldron is intentionally distinct from (but compatible with):
 * - Haptics grounding (the act of settling attention on something).
 * - Spells/checkpoints (the serialized, replayable results of a cast).
 *
 * Lifecycle + memory gardening (added in this enhancement):
 * - Ingredients and the vessel itself carry phase data attrs (gathering | resonant | mature | decayed | empty)
 *   derived from recency (capturedAt) and context (wonder/operator presence). CSS, runtime mirrors,
 *   and inspectors can react without timers.
 * - Gardening actions (prune stale, nourish/tend, plant as durable spell) turn passive collection
 *   into reflective tending — the "garden" metaphor for long-term semantic memory.
 *
 * Public API kept as stable as possible for existing callers. New actions and phase attrs are additive.
 */

import { bus } from '/public/js/kernel/bus.js';
import { composeOpBundle } from '/public/js/kernel/shared.js';
import { guardCall } from '/public/js/kernel/dom-render.js';
import {
  CAULDRON_CONTRACT,
  GARDEN_PRUNE_DAYS,
  MAX_INGREDIENTS,
  applyCauldronState,
  computeCauldronPhase,
  computeIngredientPhase,
  countPrimeableSources,
  getCauldronStatusCopy,
} from './cauldron/contract.js';
import {
  bindCauldronPanelToggle,
  setupCauldronChrome,
  syncCauldronPanelCollapse,
  syncCauldronPhaseRail,
  syncFloatingChip,
} from './cauldron/chrome.js';
import { deriveNumericityQuantifiers, isNumericalConcept, parseNumericalValue } from './cauldron/helpers.js';
import { escapeHtml, getCauldron, inferOperator, normalizeIngredient } from './cauldron/storage.js';
import { cauldronTrace, recordGestureTrace, recordPlantedTrail } from './cauldron/trace.js';
import {
  clearMixOutputState,
  detectIngredientArrival,
  pulseCauldronFeedback,
  pulseNewIngredient,
  setLastMixSignature,
  shouldHideStaleMixOutput,
  syncCollectedSourceMarks,
  syncDiscoverabilityCues,
  syncGardenHealth,
  syncOperatorResonance,
} from './cauldron/resonance.js';
import { canUndo, clearUndoStack, popUndoSnapshot, pushUndoSnapshot } from './cauldron/undo.js';

let initialized = false;
let cleanupHandle = null;
let spellPreviewWasReady = false;

/**
 * Initialize the cauldron system.
 * Listens for captures (from region menus, gestures, etc.) and wires footer UI.
 */
export function initCauldron() {
  if (initialized) return cleanupHandle;
  initialized = true;

  const unsubCapture = bus.on('spell:capture', onCapture);

  document.body.addEventListener('click', handleCauldronUIActions, true);
  document.body.addEventListener('click', handleIngredientRemoval, true);
  document.body.addEventListener('click', handleIngredientInspect, true);

  setupCauldronChrome();
  bindCauldronPanelToggle();
  document.addEventListener('spw:settings:changed', syncCauldronState, { passive: true });
  document.addEventListener('spw:settings-change', syncCauldronState, { passive: true });

  syncCauldronState();

  cleanupHandle = () => {
    unsubCapture();
    document.body.removeEventListener('click', handleCauldronUIActions, true);
    document.body.removeEventListener('click', handleIngredientRemoval, true);
    document.body.removeEventListener('click', handleIngredientInspect, true);
    document.removeEventListener('spw:settings:changed', syncCauldronState);
    document.removeEventListener('spw:settings-change', syncCauldronState);
    initialized = false;
    cleanupHandle = null;
  };

  return cleanupHandle;
}

/* ==========================================================================
   UI Action Handlers (footer + future ingredient list)
   ========================================================================== */

function handleCauldronUIActions(e) {
  if (!(e.target instanceof Element)) return;
  const mixBtn = e.target.closest('[data-spw-cauldron-action="mix"]');
  const clearBtn = e.target.closest('[data-spw-cauldron-action="clear"]');
  const pruneBtn = e.target.closest('[data-spw-cauldron-action="prune"]');
  const nourishBtn = e.target.closest('[data-spw-cauldron-action="nourish"]');
  const plantBtn = e.target.closest('[data-spw-cauldron-action="plant"]');
  const undoBtn = e.target.closest('[data-spw-cauldron-action="undo"]');

  if (mixBtn) {
    const ingredients = getCauldron();
    const mixSignature = ingredients.map((item) => `${item.expression}|${item.capturedAt || 0}`).join('~');
    const result = mixIngredients();
    const html = typeof result === 'string' ? result : result.html || result;
    showOutput(html, mixSignature);
    flashCauldronAction(mixBtn, 'cast');
    // Functional result available for agents/spells: result.functional
    e.preventDefault();

    // Learnability/reward credit (credits architecture) for mix/cast action.
    rewardSpellCauldronAction('mix-cast', {
      title: 'Mixed → emergent spell',
      summary: 'Ingredients combined. The cauldron phase turns collection (state) into a castable, replayable form. Reward for using the emergence mechanic.',
    });
  }

  if (clearBtn) {
    clearCauldron();
    hideOutput();
    flashCauldronAction(clearBtn, 'clear');
    e.preventDefault();
  }

  if (undoBtn) {
    undoCauldron();
    hideOutput();
    flashCauldronAction(undoBtn, 'undo');
    e.preventDefault();
  }

  if (pruneBtn) {
    pruneStale();
    hideOutput();
    flashCauldronAction(pruneBtn, 'prune');
    pulseCauldronFeedback('prune');
    // Learnability/reward for pruning (state hygiene as positive gardening act).
    rewardSpellCauldronAction('prune', {
      title: 'Pruned stale',
      summary: 'Old ingredients removed. Healthy cauldron state is curated; reward for reflective tending.',
    });
    e.preventDefault();
  }

  if (nourishBtn) {
    // Nourish the most recent ingredient as a simple "tend" gesture
    const ingredients = getCauldron();
    if (ingredients.length) nourishIngredient(ingredients.length - 1);
    flashCauldronAction(nourishBtn, 'nourish');
    pulseCauldronFeedback('nourish');
    // Learnability: nourishing is "tend" reward for active state management.
    rewardSpellCauldronAction('nourish', {
      title: 'Nourished / tended',
      summary: 'Recent ingredient reinforced. Cauldron state rewards ongoing attention (not just one-time collect).',
    });
    e.preventDefault();
  }

  if (plantBtn) {
    // Memory gardening: "plant" the current gathering as a durable spell/checkpoint
    const ingredients = getCauldron();
    if (ingredients.length >= 1) {
      flashCauldronAction(plantBtn, 'plant');
      pulseCauldronFeedback('plant');
      const expr = ingredients.map(i => i.expression).join(' + ');
      const gestureSummary = ingredients
        .map(i => i.primedBy || i.chargeContext)
        .filter(Boolean)
        .join('·');
      const trailSig = gestureSummary ? `garden{${expr}}·${gestureSummary}` : `garden{${expr}}`;
      recordPlantedTrail(trailSig.length > 52 ? trailSig.slice(0, 49) + '…' : trailSig);

      bus.emit('spell:capture', {
        expression: `cast[garden]{${expr}}`,
        label: 'Planted garden mix',
        origin: 'cauldron',
        originLabel: 'memory garden',
        wonder: 'cultivation',
        // Deeper composition bridge: carry gesture history from the ingredients
        // so the resulting spell/trail can remember how the forces were gathered.
        gestureHistory: gestureSummary || null,
        ingredientGestures: ingredients.map(i => ({
          expression: i.expression,
          primedBy: i.primedBy,
          chargeContext: i.chargeContext,
        })),
      });
      // Optionally clear after planting to keep the garden cycle clean
      // clearCauldron();

      // Learnability/reward credit (credits architecture) for plant. Enhances state UX by surfacing the committed state (with gesture) as ephemeral "credits".
      rewardSpellCauldronAction('plant', {
        title: 'Planted as durable spell',
        summary: 'Gathering committed to trail/checkpoint. The cauldron state (ingredients + gesture history + primed) becomes replayable navigation. Reward for the collect → compose → persist loop.',
      });
    }
    e.preventDefault();
  }

  if (e.target.closest('[data-spw-cauldron-action="vision"]')) {
    // Prompting UX bridge: turn current cauldron into a Daily Vision Seed packet
    // and navigate toward the Midjourney bench (or open with prefilled context).
    const ingredients = getCauldron();
    if (ingredients.length) {
      const expr = ingredients.map(i => i.expression).join(' + ');
      const gestureHistory = ingredients.map(i => i.primedBy || i.chargeContext).filter(Boolean).join('·');
      const promptSeed = `Daily observation as vision: ${expr}. Render with quiet domestic light, garden texture, subtle resonance. Use as Library ward or character private vision. Gesture history: ${gestureHistory || 'direct'}.`;
      // Store a lightweight vision seed for the bench to pick up
      try {
        sessionStorage.setItem('spw-pending-vision-seed', JSON.stringify({
          expression: expr,
          prompt: promptSeed,
          origin: 'cauldron',
          capturedAt: Date.now(),
          gestureHistory,
        }));
      } catch (_) {}
      // Navigate to Midjourney bench (it will check for the pending seed on load)
      window.location.href = '/tools/midjourney/#reference-packets';
    }
    e.preventDefault();
  }

  // Re-gather: makes the consequence of a prior hold traversable again — brings the most recent
  // tended material back into immediate view (scrolls to Memory Garden Cauldron + re-syncs mirrors).
  const reGatherBtn = e.target.closest('[data-spw-cauldron-action="re-gather"]');
  if (reGatherBtn) {
    const ingredients = getCauldron();
    if (ingredients.length) {
      const last = ingredients[ingredients.length - 1];
      // Re-render mirrors and list immediately (the data already exists; this gives the "temporal momentum" click)
      renderIngredientsList(ingredients);
      const phase = computeCauldronPhase(ingredients);
      renderCauldronMirrors(ingredients, phase);
      syncCauldronHosts(ingredients, phase);

      // Surface the cauldron in the footer so the full history + re-gather affordances are reachable
      const footerCauldron = document.querySelector('.site-footer__cauldron, [data-spw-cauldron]');
      if (footerCauldron) {
        footerCauldron.scrollIntoView({ behavior: 'smooth', block: 'center' });
        footerCauldron.classList.add('is-recently-tended');
        setTimeout(() => footerCauldron.classList.remove('is-recently-tended'), 1400);
      }
      announceCauldronStatus(`Re-gathered: ${last.label || last.expression}. The garden still holds the attention that created it.`);
      rewardSpellCauldronAction('re-gather', {
        title: 'Re-gathered from spell',
        summary: 'Spell trail fed back into cauldron. State is bidirectional: cast produces replayable attention that can be re-collected.',
      });
    } else {
      // If nothing in cauldron yet but we have a trace, at least surface the footer as the place consequences live
      const footerCauldron = document.querySelector('.site-footer__cauldron, [data-spw-cauldron]');
      if (footerCauldron) footerCauldron.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    e.preventDefault();
  }

  // Spell-side re-gather / vision actions (from the enhanced crystallization output in cauldron-text after plant/mix).
  // Mirrors the Garden State re-gather exactly so the spell (the planted result) has the same traversable momentum.
  const spellReGather = e.target.closest('[data-spw-spell-action="re-gather"]');
  if (spellReGather) {
    const trail = spellReGather.dataset.spwSpellTrail || '';
    const ingredients = getCauldron();
    if (ingredients.length) {
      renderIngredientsList(ingredients);
      const phase = computeCauldronPhase(ingredients);
      renderCauldronMirrors(ingredients, phase);
      syncCauldronHosts(ingredients, phase);

      const footerCauldron = document.querySelector('.site-footer__cauldron, [data-spw-cauldron]');
      if (footerCauldron) {
        footerCauldron.scrollIntoView({ behavior: 'smooth', block: 'center' });
        footerCauldron.classList.add('is-recently-tended');
        setTimeout(() => footerCauldron.classList.remove('is-recently-tended'), 1400);
      }
      announceCauldronStatus(`Re-gathered from spell trail${trail ? `: ${trail}` : ''}. The attention that grew this spell is still held in the garden.`);
    }
    e.preventDefault();
  }

  const spellVision = e.target.closest('[data-spw-spell-action="vision-from-spell"]');
  if (spellVision) {
    const ingredients = getCauldron();
    if (ingredients.length) {
      const expr = ingredients.map(i => i.expression).join(' + ');
      const gestureHistory = ingredients.map(i => i.primedBy || i.chargeContext).filter(Boolean).join('·');
      const trail = spellVision.dataset.spwSpellTrail || '';
      const promptSeed = `Spell trail as vision: ${expr}. From garden trace: ${gestureHistory || trail || 'direct'}. Render with quiet domestic light, garden texture, subtle resonance. Use as Library ward or character private vision.`;
      try {
        sessionStorage.setItem('spw-pending-vision-seed', JSON.stringify({
          expression: expr,
          prompt: promptSeed,
          origin: 'spell-trail',
          capturedAt: Date.now(),
          gestureHistory: gestureHistory || trail,
          spellTrail: trail,
        }));
      } catch (_) {}
      window.location.href = '/tools/midjourney/#reference-packets';
    }
    e.preventDefault();
  }
}

function handleIngredientRemoval(e) {
  if (!(e.target instanceof Element)) return;
  const removeBtn = e.target.closest('[data-spw-cauldron-remove]');
  if (!removeBtn) return;

  const index = parseInt(removeBtn.dataset.spwCauldronRemove, 10);
  if (!Number.isNaN(index)) {
    removeIngredient(index);
    hideOutput();
  }
}

function handleIngredientInspect(e) {
  if (!(e.target instanceof Element)) return;
  const ingEl = e.target.closest('.cauldron-ingredient');
  if (!ingEl || e.target.closest('.cauldron-ingredient-remove')) return;

  // Category hook: if clicked a wonder/operator meta inside ingredient, highlight all page items of that category (in addition to the main expression jump).
  const metaWonder = e.target.closest('[data-spw-wonder]');
  const metaOp = e.target.closest('[data-spw-operator]');
  if (metaWonder || metaOp) {
    const cat = (metaWonder ? metaWonder.getAttribute('data-spw-wonder') : null) || (metaOp ? metaOp.getAttribute('data-spw-operator') : null);
    if (cat) {
      document.querySelectorAll(`[data-spw-wonder="${CSS.escape(cat)}"], [data-spw-operator="${CSS.escape(cat)}"]`).forEach(n => {
        n.classList.add('is-cauldron-jump-target', 'cauldron-highlight');
        n.dataset.spwCauldronCategory = cat;
        setTimeout(() => {
          n.classList.remove('is-cauldron-jump-target', 'cauldron-highlight');
          delete n.dataset.spwCauldronCategory;
        }, 1800);
      });
    }
  }

  // Lightweight inspectability: surface the full semantic expression + origin for reflection
  // In a fuller system this could open a richer inspector or highlight related operators on page.
  const expr = ingEl.dataset.spwSemanticExpression || ingEl.querySelector('[data-spw-expression]')?.textContent;
  const origin = ingEl.dataset.spwOrigin;

  if (expr) {
    // Emit for any listeners (e.g. future inspectors, console, design hub)
    bus.emit?.('cauldron:ingredient-inspected', { expression: expr, origin, element: ingEl });

    // Gentle visual feedback + console for immediate learning value
    ingEl.dataset.spwIngredientInspect = 'active';

    setTimeout(() => {
      if (ingEl) delete ingEl.dataset.spwIngredientInspect;
    }, 1400);

    // Cauldron hook: jump to + highlight the source/interactable item(s) on page for this ingredient.
    // Supports direct expression match or text/concept fuzzy for living terms, braces, operators (interactables).
    // Categories: if meta wonder/operator present on ingredient, highlight matching category items too.
    const targets = findPageTargetsForCauldronIngredient(ingEl, expr);
    if (targets.length) {
      const first = targets[0];
      const deepLinkState = ensureElementDeepLink(first, expr);
      if (deepLinkState.href) {
        ingEl.dataset.spwDeepLink = deepLinkState.href;
        ingEl.dataset.spwDeepLinkLabel = deepLinkState.label;
        ingEl.dataset.spwSemanticExpression = deepLinkState.semanticExpression || expr;
        if (window.history?.replaceState) {
          window.history.replaceState(window.history.state, '', deepLinkState.href);
        }
      }
      first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      first.classList.add('is-cauldron-jump-target', 'cauldron-highlight');
      const cat = ingEl.querySelector('[data-spw-wonder]')?.getAttribute('data-spw-wonder') ||
                  ingEl.querySelector('[data-spw-operator]')?.getAttribute('data-spw-operator');
      if (cat) first.dataset.spwCauldronCategory = cat;
      // Attentional refinement: mark for subvocal rehearsal resonance (ties to attention-architecture handle + probe)
      first.dataset.spwAttention = 'rehearsal';
      setTimeout(() => {
        first.classList.remove('is-cauldron-jump-target', 'cauldron-highlight');
        if (cat) delete first.dataset.spwCauldronCategory;
        if (first.dataset.spwAttention === 'rehearsal') delete first.dataset.spwAttention;
      }, 2400);

      // Learnability/reward using credits architecture (similar to module application credits / film-credits).
      // The jump + highlight + category makes the cauldron's state (collected forces + origins + gestures) traversable and "rehearsable".
      // Reward text teaches the bidirectional contract while surfacing live state (count/phase/primed).
      rewardSpellCauldronAction('hook-jump', {
        title: 'Cauldron hook: follow the trail',
        summary: 'Collected ingredient jumped back to its living source and hash anchor (with temp highlight + category echo). This is the state UX half of spell/cauldron: the garden remembers the attention that fed it.',
        why: 'First-class reward for using the hook improves learnability of prime → collect → re-engage cycle. Ties to attentional rehearsal and subvocal operators.',
      });
    }

    // Helpful for learning without being noisy
    if (typeof console !== 'undefined') {
      console.info('[Cauldron] Inspected ingredient:', expr, origin ? `(origin: ${origin})` : '');
    }
  }
}

/** Cauldron hook helper: locate interactable page items (living terms, charged braces, operators, etc.)
 *  that match the ingredient's expression or category (wonder/operator) for jump+highlight.
 *  Returns array of elements; caller does scroll + temp class + data-spw-cauldron-category for styling.
 */
function findPageTargetsForCauldronIngredient(ingEl, expr) {
  if (!expr && !ingEl) return [];
  const results = new Set();
  const deepLink = ingEl?.dataset?.spwDeepLink || '';
  const hashId = deepLink.includes('#') ? deepLink.split('#').pop() : '';
  if (hashId) {
    const linkedTarget = document.getElementById(decodeURIComponent(hashId));
    if (linkedTarget) results.add(linkedTarget);
  }
  const escaped = expr ? CSS.escape(expr) : '';
  // Direct matches via data attrs that cauldron/render uses
  if (expr) {
    document.querySelectorAll(`[data-spw-semantic-expression="${escaped}"], [data-spw-expression="${escaped}"]`).forEach(n => results.add(n));
  }
  // Living terms / interactables by concept or text content (common for primed/holdable items)
  const interactables = document.querySelectorAll('.spw-living-term, [data-spw-living-term], [data-spw-form="brace"], [data-spw-operator]');
  interactables.forEach(n => {
    const concept = (n.dataset.spwConcept || n.getAttribute('data-spw-living-term') || n.textContent || '').toLowerCase();
    if (expr && concept.includes(expr.toLowerCase())) results.add(n);
  });
  // Category support: if ingredient has wonder or operator meta, find all matching on page (for "or categories")
  const wonderMeta = ingEl ? ingEl.querySelector('[data-spw-wonder]') : null;
  const opMeta = ingEl ? ingEl.querySelector('[data-spw-operator]') : null;
  if (wonderMeta) {
    const w = wonderMeta.getAttribute('data-spw-wonder');
    if (w) document.querySelectorAll(`[data-spw-wonder="${CSS.escape(w)}"]`).forEach(n => results.add(n));
  }
  if (opMeta) {
    const o = opMeta.getAttribute('data-spw-operator');
    if (o) document.querySelectorAll(`[data-spw-operator="${CSS.escape(o)}"]`).forEach(n => results.add(n));
  }
  return Array.from(results);
}

function resolveCaptureDeepLink(detail = {}, sourceElement = null, expression = '') {
  if (detail.deepLink) {
    return {
      href: String(detail.deepLink),
      label: detail.deepLinkLabel || detail.label || expression,
      semanticExpression: detail.semanticExpression || detail.semantic?.expression || expression,
    };
  }

  if (detail.href && String(detail.href).includes('#')) {
    return {
      href: String(detail.href),
      label: detail.deepLinkLabel || detail.label || expression,
      semanticExpression: detail.semanticExpression || detail.semantic?.expression || expression,
    };
  }

  if (sourceElement instanceof HTMLElement) {
    return ensureElementDeepLink(sourceElement, expression);
  }

  const currentHash = window.location.hash;
  if (currentHash) {
    return {
      href: `${window.location.pathname}${window.location.search}${currentHash}`,
      label: detail.deepLinkLabel || detail.label || expression || currentHash.slice(1),
      semanticExpression: detail.semanticExpression || detail.semantic?.expression || expression,
    };
  }

  return {
    href: `${window.location.pathname}${window.location.search}`,
    label: detail.deepLinkLabel || detail.label || expression || 'route',
    semanticExpression: detail.semanticExpression || detail.semantic?.expression || expression,
  };
}

function ensureElementDeepLink(element, fallbackLabel = '') {
  if (!(element instanceof HTMLElement)) {
    return { href: '', label: fallbackLabel, semanticExpression: fallbackLabel };
  }

  if (!element.id) {
    const seed = slugForDeepLink(
      fallbackLabel
      || element.dataset.spwSemanticExpression
      || element.dataset.spwFeature
      || element.textContent
      || 'fragment'
    );
    let id = seed;
    let index = 2;
    while (document.getElementById(id)) {
      id = `${seed}-${index}`;
      index += 1;
    }
    element.id = id;
  }

  const href = `${window.location.pathname}${window.location.search}#${element.id}`;
  const label = (
    element.dataset.spwDeepLinkLabel
    || element.getAttribute('aria-label')
    || element.querySelector?.('h1, h2, h3, h4, .frame-sigil, .page-kicker')?.textContent?.trim()
    || fallbackLabel
    || element.id
  );
  const semanticExpression = (
    element.dataset.spwSemanticExpression
    || element.dataset.spwFeature
    || element.dataset.spwKind
    || fallbackLabel
    || element.id
  );

  element.dataset.spwDeepLink = href;
  element.dataset.spwDeepLinkLabel = label;
  if (!element.dataset.spwSemanticExpression && semanticExpression) {
    element.dataset.spwSemanticExpression = semanticExpression;
  }

  return { href, label, semanticExpression };
}

function slugForDeepLink(value = '') {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 56);
  return `spw-${slug || 'fragment'}`;
}

function announceCauldronStatus(message) {
  if (!message) return;
  document.querySelectorAll('[data-cauldron-status]').forEach((node) => {
    const target = node.matches('[data-cauldron-status-text]')
      ? node
      : node.querySelector?.('[data-cauldron-status-text]') || node;
    target.textContent = message;
  });
}

/** Learnability / reward improvement using the ephemeral credits architecture (similar to application credits and film-credits roll).
 *  On meaningful spell/cauldron interactions (hook jump, mix, plant, tend/remove, re-gather), surface a transient
 *  "credits" style notice that teaches the concept (bidirectional hook, emergence via mix, gardening, state as phase/gesture/primed)
 *  while showing current state summary. This makes the cauldron/spell UX more rewarding and learnable without
 *  always-visible clutter. Respects the same floating chrome contract (material, timeout, touch, responsiveness).
 *  Triggered after the action + any jump/highlight so the "state change + verification" feels like post-action credits.
 */
function rewardSpellCauldronAction(actionType, extra = {}) {
  try {
    const ingredients = typeof getCauldron === 'function' ? getCauldron() : [];
    const count = ingredients.length;
    const phase = typeof computeCauldronPhase === 'function' ? computeCauldronPhase(ingredients) : 'unknown';
    const hasPrimed = ingredients.some(i => i.primedBy);
    const summaryBase = `Cauldron: ${count} ingredients · phase ${phase}${hasPrimed ? ' · some primed' : ''}.`;
    const detail = {
      label: 'Spell / Cauldron',
      title: extra.title || `${actionType} • state update`,
      summary: `${summaryBase} ${extra.summary || 'This interaction teaches gathering → emergence → replay.'}`,
      href: '/design/palettes/#spell-cauldron-hooks',
      cta: 'Practice hooks & demos',
      why: extra.why || 'Rewards engagement with the memory garden; the ephemeral credit makes the abstract contract (prime, mix, follow-trail, plant) concrete and narratable.',
      presentation: 'credits',
      rewardKind: 'spell-cauldron-literacy',
      cadence: 'reward',
      ...extra,
    };
    document.dispatchEvent(new CustomEvent('spw:discovery-reward', { detail }));
  } catch (_) {
    // non-fatal; learnability reward is additive
  }
}

/* ==========================================================================
   Output Display
   ========================================================================== */

function showOutput(htmlContent, signature = '') {
  const output = document.querySelector('[data-cauldron-output]');
  const textBox = document.querySelector('[data-cauldron-text]');
  if (output && textBox) {
    textBox.innerHTML = htmlContent;
    output.hidden = false;
    output.dataset.spwCauldronOutputState = 'fresh';
    setLastMixSignature(signature);
    pulseCauldronFeedback('mix');
  }
}

function hideOutput() {
  const output = document.querySelector('[data-cauldron-output]');
  if (output) {
    output.hidden = true;
    delete output.dataset.spwCauldronOutputState;
  }
  clearMixOutputState();
}

/* ==========================================================================
   Core State Management (richer ingredient model)
   ========================================================================== */

function syncIngredientAvailability() {
  const count = countPrimeableSources();
  document.documentElement.dataset.spwIngredientAvailability = count > 0 ? 'available' : 'scarce';
  document.documentElement.dataset.spwIngredientSourceCount = String(count);
  document.querySelectorAll('[data-cauldron-availability]').forEach((node) => {
    node.textContent = count > 0 ? ` ${count} possible ingredients nearby.` : ' Move through the page to find primeable handles.';
  });
}

function flashCauldronAction(button, state = 'active') {
  if (!(button instanceof HTMLElement)) return;
  button.dataset.spwCauldronActionState = state;
  window.setTimeout(() => {
    if (button.dataset.spwCauldronActionState === state) {
      delete button.dataset.spwCauldronActionState;
    }
  }, 240);
}

function syncSpellPreview(ingredients, phase) {
  const count = ingredients.length;
  const ready = count >= 2;
  const becameReady = ready && !spellPreviewWasReady;
  spellPreviewWasReady = ready;
  const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))];
  const operatorSequence = operators.length ? operators.join(' ') : '~ $ ! ^';

  document.querySelectorAll('[data-spw-spell-candidate]').forEach((preview) => {
    preview.hidden = !ready;
    preview.dataset.spwSpellState = ready ? 'draft' : 'empty';
    preview.dataset.spwOperatorSequence = operatorSequence;
    const meta = preview.querySelector('[data-spw-slot="meta"]');
    const body = preview.querySelector('[data-spw-slot="body"]');
    if (meta) meta.textContent = `extension draft · ${count} fragments · ${phase}`;
    if (body) {
      body.textContent = operators.length
        ? `${operatorSequence} → extension draft`
        : '~ link → $ state → ! transform → ^ proof';
    }
    if (becameReady) {
      preview.dataset.spwSpellReveal = 'true';
      window.setTimeout(() => {
        if (preview.dataset.spwSpellReveal === 'true') delete preview.dataset.spwSpellReveal;
      }, 480);
    }
  });
}

function pruneStale(days = GARDEN_PRUNE_DAYS) {
  const ingredients = getCauldron();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  const next = ingredients.filter(i => Number(i.capturedAt || 0) >= cutoff);
  if (next.length === ingredients.length) return ingredients; // nothing pruned
  saveCauldron(next);
  bus.emit('cauldron:gardened', { action: 'prune', pruned: ingredients.length - next.length, remaining: next.length });
  return next;
}

/** Simple "nourish" — touch the capturedAt of an ingredient to keep it alive in the garden */
function nourishIngredient(index) {
  const ingredients = getCauldron();
  if (index < 0 || index >= ingredients.length) return;
  ingredients[index] = { ...ingredients[index], capturedAt: Date.now() };
  saveCauldron(ingredients);
  bus.emit('cauldron:gardened', { action: 'nourish', index });
}

function saveCauldron(cauldron, options = {}) {
  const { recordUndo = true } = options;
  const trimmed = cauldron.slice(-MAX_INGREDIENTS);
  const serialized = JSON.stringify(trimmed);
  const existing = localStorage.getItem(CAULDRON_CONTRACT.storageKey);

  if (recordUndo && existing !== serialized) {
    pushUndoSnapshot(getCauldron());
  }

  localStorage.setItem(CAULDRON_CONTRACT.storageKey, serialized);
  syncCauldronState();
  bus.emit('cauldron:updated', {
    count: trimmed.length,
    items: trimmed,
  });
}

function undoCauldron() {
  const previous = popUndoSnapshot();
  if (!previous) {
    announceCauldronStatus('Nothing to undo in the memory garden yet.');
    return false;
  }

  saveCauldron(previous, { recordUndo: false });
  announceCauldronStatus(`Restored previous gathering (${previous.length} ingredient${previous.length === 1 ? '' : 's'}).`);
  bus.emit('cauldron:gardened', { action: 'undo', remaining: previous.length });
  return true;
}

function syncCauldronState() {
  const ingredients = getCauldron();
  const count = ingredients.length;

  if (shouldHideStaleMixOutput(ingredients)) {
    hideOutput();
  }

  const root = document.documentElement;

  const phase = computeCauldronPhase(ingredients);
  const availableSources = countPrimeableSources();
  syncIngredientAvailability();
  syncCollectedSourceMarks(ingredients);
  syncOperatorResonance(ingredients);
  syncDiscoverabilityCues(count, phase, availableSources);
  applyCauldronState(root, { phase, count });
  syncCauldronHosts(ingredients, phase);

  if (count > 0) {
    const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))];
    root.dataset.spwCauldronOperators = operators.join(' ');
  } else {
    delete root.dataset.spwCauldronOperators;
  }

  // Interaction semantics for buttons (existing + new gardening actions)
  const mixBtn = document.querySelector('[data-spw-cauldron-action="mix"]');
  const clearBtn = document.querySelector('[data-spw-cauldron-action="clear"]');
  if (mixBtn) mixBtn.disabled = count < 2;
  if (clearBtn) clearBtn.disabled = count === 0;
  document.querySelectorAll('[data-cauldron-status-text]').forEach((node) => {
    node.textContent = getCauldronStatusCopy(count, phase);
  });
  document.querySelectorAll('[data-cauldron-count]').forEach((node) => {
    node.textContent = String(count);
  });
  document.querySelectorAll('[data-spw-cauldron-operators]').forEach((node) => {
    const operators = root.dataset.spwCauldronOperators;
    node.textContent = operators ? `· forces: ${operators}` : '';
  });
  document.querySelectorAll('[data-spw-cauldron-action="prune"], [data-spw-cauldron-action="nourish"], [data-spw-cauldron-action="plant"], [data-spw-cauldron-action="vision"]')
    .forEach((button) => {
      const action = button.dataset.spwCauldronAction;
      if (action === 'plant' || action === 'vision') {
        button.disabled = count < 1;
      } else {
        button.disabled = count === 0;
      }
    });
  document.querySelectorAll('[data-spw-cauldron-action="undo"]').forEach((button) => {
    button.disabled = !canUndo();
  });

  renderIngredientsList(ingredients);
  renderCauldronMirrors(ingredients, phase);
  syncSpellPreview(ingredients, phase);
  syncCauldronPhaseRail(phase);
  syncCauldronPanelCollapse(count);
  syncFloatingChip();
}

function syncCauldronHosts(ingredients, phase) {
  const count = ingredients.length;
  const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))].join(' ');
  const hosts = document.querySelectorAll('[data-spw-cauldron]');
  syncGardenHealth(hosts, ingredients);
  hosts.forEach((host) => {
    applyCauldronState(host, { phase, count });
    host.dataset.spwHypermediaExtension = 'state output resume';
    if (operators) {
      host.dataset.spwCauldronOperators = operators;
    } else {
      delete host.dataset.spwCauldronOperators;
    }
  });
}

function renderCauldronMirrors(ingredients, phase) {
  const count = ingredients.length;
  const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))].join(' ') || 'none';

  // Build compact temporal trace from ingredients that carry gesture history (the momentum we want visible)
  const traceParts = [];
  ingredients.forEach((ing) => {
    if (ing.gestureHistory) traceParts.push(ing.gestureHistory);
    else if (ing.primedBy) traceParts.push(ing.primedBy);
  });
  const compactTrace = traceParts.length ? traceParts.join(' · ') : (cauldronTrace.lastGesture || '');

  // Last gesture for the "what just happened" immediate signal
  const lastIng = ingredients[ingredients.length - 1];
  const lastGesture = lastIng
    ? (lastIng.gestureHistory || lastIng.primedBy || lastIng.chargeContext || cauldronTrace.lastGesture || 'direct attention')
    : (cauldronTrace.lastGesture || '—');

  document.querySelectorAll('[data-spw-cauldron-mirror]').forEach((mirror) => {
    applyCauldronState(mirror, { phase, count });
    const phaseEl = mirror.querySelector('[data-spw-mirror-label="phase"]');
    const countEl = mirror.querySelector('[data-spw-mirror-label="count"]');
    const operatorsEl = mirror.querySelector('[data-spw-mirror-label="operators"]');
    if (phaseEl) phaseEl.textContent = `phase: ${phase}`;
    if (countEl) countEl.textContent = `count: ${count}`;
    if (operatorsEl) operatorsEl.textContent = `operators: ${operators}`;

    // Numericity visibility in mirrors (keeps numbers + their quantifiers "in mind" for narration/video)
    const numerics = ingredients.filter(i => i.type === 'numerical' && i.quantifiers);
    if (numerics.length) {
      const numMeta = numerics.map(n => `${n.value}${n.unit ? '-' + n.unit : ''} → ${ (n.quantifiers || []).slice(0,2).join('/') }`).join(' · ');
      // Append to an existing or new mirror label if present; otherwise it stays in console/inspector
      const numEl = mirror.querySelector('[data-spw-mirror-label="numericity"]');
      if (numEl) numEl.textContent = `numericity: ${numMeta}`;
    }

    // New consequence labels for temporal momentum (home garden inspector + any other mirror)
    const lastGestureEl = mirror.querySelector('[data-spw-mirror-label="last-gesture"]');
    const traceEl = mirror.querySelector('[data-spw-mirror-label="trace"]');
    const trailEl = mirror.querySelector('[data-spw-mirror-label="trail"]');
    if (lastGestureEl) {
      lastGestureEl.textContent = lastGesture.length > 42 ? lastGesture.slice(0, 39) + '…' : lastGesture;
      lastGestureEl.dataset.spwGestureProvenance = lastGesture;
    }
    if (traceEl) {
      traceEl.textContent = compactTrace ? `trace: ${compactTrace.length > 48 ? compactTrace.slice(0, 45) + '…' : compactTrace}` : '';
      if (compactTrace) traceEl.dataset.spwGestureTrace = compactTrace;
    }
    if (trailEl) {
      trailEl.textContent = cauldronTrace.lastPlantedTrail ? `trail: ${cauldronTrace.lastPlantedTrail}` : '';
      if (cauldronTrace.lastPlantedTrail) trailEl.dataset.spwSpellTrail = cauldronTrace.lastPlantedTrail;
    }

    // Show re-gather affordance only when there is actually something whose consequence can be traversed
    const reGather = mirror.querySelector('[data-spw-cauldron-action="re-gather"]');
    if (reGather) reGather.hidden = count === 0;
  });

  // Also update the dedicated home KERNEL ENTRY carried value (direct answer to "consequences visible with momentum")
  updateGardenCarriedDisplay(lastGesture, compactTrace);
}

function updateGardenCarriedDisplay(lastGesture, trace) {
  const carriedValue = document.querySelector('[data-spw-garden-carried-value]');
  if (!carriedValue) return;
  const surface = document.body?.dataset?.spwSurface;
  if (surface !== 'home') return;

  const display = lastGesture && lastGesture !== '—' ? lastGesture : (trace || '—');
  carriedValue.textContent = display.length > 36 ? display.slice(0, 33) + '…' : display;
  carriedValue.dataset.spwLastCarried = display;
}

function renderIngredientsList(ingredients) {
  const container = document.querySelector('[data-cauldron-ingredients]');
  if (!container) return;

  if (!ingredients.length) {
    container.innerHTML = '';
    delete container.dataset.lastSignature;
    return;
  }

  const signature = ingredients.map(i => `${i.expression}|${i.deepLink || ''}|${i.capturedAt || 0}`).join('~');
  const previousSignature = container.dataset.lastSignature || '';
  if (previousSignature === signature) return;
  const arrival = detectIngredientArrival(ingredients, previousSignature);
  container.dataset.lastSignature = signature;

  const html = ingredients.map((ing, idx) => {
    const op = ing.operator ? `<span class="cauldron-ingredient-op" data-spw-operator="${ing.operator}">${ing.operator}</span>` : '';
    const expr = `<span class="cauldron-ingredient-expr" data-spw-expression>${escapeHtml(ing.expression)}</span>`;

    const phase = computeIngredientPhase(ing);
    let meta = '';
    if (ing.wonder) {
      meta += `<span class="cauldron-ingredient-meta" data-spw-wonder="${ing.wonder}">${ing.wonder}</span>`;
    }
    // Surface origin context for better learning / reduced overgeneralization
    const originText = ing.originLabel || ing.origin || ing.context;
    if (originText) {
      meta += `<span class="cauldron-ingredient-meta cauldron-origin" data-spw-origin="${escapeHtml(originText)}">${escapeHtml(originText)}</span>`;
    }
    // Lightweight age for memory gardening visibility (CSS can style .decayed etc.)
    if (ing.capturedAt) {
      const ageDays = Math.floor((Date.now() - Number(ing.capturedAt)) / (1000 * 60 * 60 * 24));
      meta += `<span class="cauldron-ingredient-meta cauldron-age" data-spw-age="${ageDays}">${ageDays}d</span>`;
    }
    // Primed containment bridge (additive, inspectable): surfaced only when the
    // ingredient arrived via charged brace gesture. Gives immediate learning signal
    // that the cauldron gathered local value from a primed containment form.
    if (ing.primedBy) {
      const primedLabel = ing.primedBy === 'brace-containment-charge' ? 'primed' : escapeHtml(ing.primedBy);
      meta += `<span class="cauldron-ingredient-meta cauldron-primed" data-spw-ingredient-primed="${escapeHtml(ing.primedBy)}">${primedLabel}</span>`;
    }
    // Traceability for effects (Patch 010): if this ingredient carries gesture history from a living-term or brace, surface a short trace so the user can see exactly which attention created it.
    if (ing.gestureHistory) {
      meta += `<span class="cauldron-ingredient-meta cauldron-gesture-trace" data-spw-gesture-trace title="Gesture chain that created this ingredient">${escapeHtml(ing.gestureHistory)}</span>`;
    }

    if (ing.deepLink) {
      const deepLinkLabel = ing.deepLinkLabel || (String(ing.deepLink).includes('#') ? 'hash anchor' : 'route anchor');
      meta += `<span class="cauldron-ingredient-meta cauldron-deep-link" data-spw-deep-link="${escapeHtml(ing.deepLink)}">${escapeHtml(deepLinkLabel)}</span>`;
    }

    // Numericity quantifier surfacing (integrated, not brittle): when a numerical ingredient is present,
    // show its derived quantifiers as first-class options for selection/discovery in spells/navigation.
    if (ing.type === 'numerical' && Array.isArray(ing.quantifiers) && ing.quantifiers.length) {
      const qList = ing.quantifiers.slice(0, 4).map(q => `<span class="cauldron-numericity-quantifier" data-spw-quantifier="${escapeHtml(q)}">${escapeHtml(q)}</span>`).join(' ');
      meta += `<span class="cauldron-ingredient-meta cauldron-numericity">${qList}</span>`;
    }

    // Deeper higher-order dimension / resource modeling wiring (from budgeting macros and similar tools).
    // When an ingredient carries a dimensions array (higher-order resource model), surface it cleanly
    // as inspectable meta chips. This makes complex, shareable, query-string-loaded models visible
    // and traceable inside the cauldron without extra UI.
    if (Array.isArray(ing.dimensions) && ing.dimensions.length) {
      const dimList = ing.dimensions.slice(0, 5).map(d => `<span class="cauldron-dimension-chip" data-spw-dimension="${escapeHtml(d)}">${escapeHtml(d)}</span>`).join(' ');
      meta += `<span class="cauldron-ingredient-meta cauldron-dimensions" data-higher-order="${ing.higherOrder ? 'true' : 'false'}">${dimList}</span>`;
    }

    const title = `${ing.expression}${originText ? ` (from ${originText})` : ''}${ing.deepLink ? ` - ${ing.deepLink}` : ''}`;

    return `
      <span class="cauldron-ingredient"
            data-spw-cauldron-ingredient
            data-spw-ingredient-state="collected"
            data-spw-op="${escapeHtml(composeOpBundle(ing.semanticExpression || ing.expression))}"
            data-spw-semantic-expression="${escapeHtml(ing.semanticExpression || ing.expression)}"
            data-spw-ingredient-phase="${phase}"
            data-spw-source-route="${escapeHtml(ing.origin || ing.context || '')}"
            data-spw-source-element="${escapeHtml(ing.sourceElement || ing.expression)}"
            ${ing.deepLink ? `data-spw-deep-link="${escapeHtml(ing.deepLink)}"` : ''}
            ${ing.deepLinkLabel ? `data-spw-deep-link-label="${escapeHtml(ing.deepLinkLabel)}"` : ''}
            ${ing.origin ? `data-spw-origin="${escapeHtml(ing.origin)}"` : ''}
            ${ing.primedBy ? `data-spw-ingredient-primed="${escapeHtml(ing.primedBy)}"` : ''}
            tabindex="0"
            role="group"
            data-spw-hypermedia-extension="state-fragment"
            aria-label="Saved hypermedia fragment: ${escapeHtml(ing.expression)}"
            title="${escapeHtml(title)}">
        ${op}${expr}
        ${meta ? `<span class="cauldron-ingredient-meta-group">${meta}</span>` : ''}
        <button type="button" class="cauldron-ingredient-remove" data-spw-cauldron-remove="${idx}" aria-label="Remove ${escapeHtml(ing.expression)}">×</button>
      </span>
    `;
  }).join('');

  container.innerHTML = html;

  if (arrival?.expression) {
    pulseNewIngredient(container, arrival.expression);
  }
}

/* ==========================================================================
   Public / Semi-public API
   ========================================================================== */

function onCapture(event) {
  const detail = event.detail || {};
  const expression = detail.expression || detail.semantic?.expression;
  if (!expression) return;

  const ingredients = getCauldron();
  const sourceElement = detail.element instanceof HTMLElement
    ? detail.element
    : (detail.target instanceof HTMLElement ? detail.target : null);
  const deepLinkState = resolveCaptureDeepLink(detail, sourceElement, expression);

  // Improve origin context for learning value (where this semantic came from)
  const origin = detail.origin
    || detail.context
    || (typeof document !== 'undefined' ? document.body?.dataset?.spwSurface : null)
    || '';

  const ingredient = {
    expression,
    label: detail.label || detail.rootLabel || expression,
    operator: detail.operator || inferOperator(expression),
    wonder: detail.wonder || detail.semantic?.wonder || '',
    context: detail.context || origin,
    origin: origin,                    // explicit origin for inspectability
    originLabel: detail.originLabel || detail.contextLabel || origin,
    capturedAt: Date.now(),
    // Primed containment alignment (additive): carries the brace charge context
    // so the cauldron can surface "local value gathered from a charged containment".
    primedBy: detail.primedBy || null,
    chargeContext: detail.chargeContext || null,
    // Deeper composition: preserve gesture history when a spell/capture feeds the cauldron
    // (supports re-hydration and prompt enrichment).
    gestureHistory: detail.gestureHistory || detail.gestureChain || null,
    sourceElement: detail.sourceElement || detail.key || null,
    deepLink: deepLinkState.href || null,
    deepLinkLabel: deepLinkState.label || null,
    semanticExpression: deepLinkState.semanticExpression || expression,
  };

  // Numericity: if this capture is a number concept (from living-term on rhythm text etc.),
  // enrich it so the cauldron can derive responsive quantifiers automatically.
  if (isNumericalConcept(expression)) {
    const parsed = parseNumericalValue(expression);
    if (parsed) {
      ingredient.type = 'numerical';
      ingredient.value = parsed.value;
      ingredient.unit = parsed.unit;
      ingredient.quantifiers = deriveNumericityQuantifiers([ingredient]);
    }
  }

  recordGestureTrace(ingredient);

  const existingIndex = ingredients.findIndex(item => item.expression === expression);
  if (existingIndex >= 0) {
    ingredients[existingIndex] = {
      ...ingredients[existingIndex],
      ...Object.fromEntries(
        Object.entries(ingredient).filter(([, value]) => value !== '' && value != null)
      ),
      capturedAt: Date.now(),
    };
    saveCauldron(ingredients);
    const message = ingredient.primedBy
      ? `Refreshed primed deep-link fragment from ${ingredient.originLabel || 'charged brace'}: ${ingredient.label}.`
      : `Refreshed linkable fragment: ${ingredient.label}.`;
    announceCauldronStatus(message);
    bus.emit('cauldron:ingredient-refreshed', {
      expression,
      item: ingredients[existingIndex],
      index: existingIndex,
    });
    pulseCauldronFeedback('refresh', { expression });
    return;
  }

  ingredients.push(ingredient);
  saveCauldron(ingredients);
  const message = ingredient.primedBy
    ? `Primed deep-link fragment gathered from ${ingredient.originLabel || 'charged brace'}: ${ingredient.label}.`
    : `Linkable fragment gathered: ${ingredient.label}.`;
  announceCauldronStatus(message);
  pulseCauldronFeedback('gather', { expression });
}

export function addIngredient(ingredient) {
  if (!ingredient?.expression) return;
  const ingredients = getCauldron();
  if (ingredients.some(i => i.expression === ingredient.expression)) return;

  const normalized = normalizeIngredient(ingredient);
  // Ensure origin is captured when manually added
  if (!normalized.origin && ingredient.context) {
    normalized.origin = ingredient.context;
    normalized.originLabel = ingredient.originLabel || ingredient.context;
  }

  ingredients.push(normalized);
  saveCauldron(ingredients);
}

export function removeIngredient(index) {
  const ingredients = getCauldron();
  if (index < 0 || index >= ingredients.length) return;

  ingredients.splice(index, 1);
  saveCauldron(ingredients);
}

export function getIngredients() {
  return getCauldron();
}

/**
 * Mixing as a learning instrument.
 *
 * The goal is to help the learner develop accurate familiarity with the
 * *specific* semantic forces and expressions that were gathered, rather than
 * treating the resulting mnemonic as inherently valuable or generalizable.
 *
 * Output structure:
 * - "Combination Record": Transparent view of exactly what was combined,
 *   using Spw markup (operators, expressions, brace-form suggestions).
 * - "One possible crystallization": The mnemonic/prompt, explicitly labeled
 *   as one contingent use. The learner is encouraged to test it specifically
 *   instead of forming broad conclusions about "why it worked."
 */
export function mixIngredients() {
  const ingredients = getCauldron();
  if (ingredients.length < 2) {
    return `<p class="cauldron-mix-note">Add at least two ingredients. The value is in noticing what specific forces you gathered and how they actually interact on a real surface.</p>`;
  }

  const expressions = ingredients.map(i => i.expression);
  const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))];

  // Functional application support: return structured data for programmatic use (spells, agents, beats)
  const functionalMix = {
    ingredients: ingredients.map(i => ({ ...i })),
    operators,
    expressions,
    // Brace/physics context for enhanced emergence (reads current site state for "physics" of the cast)
    braceContext: document.documentElement?.dataset?.spwActiveBraceForm || 'brace',
    physicsContext: {
      rhythmTempo: getComputedStyle(document.documentElement).getPropertyValue('--spw-site-rhythm-tempo').trim() || '1',
      climate: document.documentElement?.dataset?.spwDevelopmentalClimate || 'neutral',
    },
  };

  // Build a readable "Combination Record" using Spw-style markup
  let combinationHtml = `
    <div class="cauldron-combination-record">
      <p class="cauldron-section-label">Combination Record — what was actually combined</p>
      <div class="cauldron-forces">
        ${operators.length ? `Forces: ${operators.map(op => `<span class="op-chip" data-spw-operator="${op.replace(/[^#>?@~!*^<]+/g, '')}">${op}</span>`).join(' ')}` : ''}
      </div>
      <div class="cauldron-expressions">
        ${expressions.map(expr => `<code data-spw-semantic-expression="${escapeHtml(expr)}">${escapeHtml(expr)}</code>`).join(' <span class="cauldron-plus">+</span> ')}
      </div>
      <details class="cauldron-functional" data-spw-functional-application>
        <summary>Functional mix (for agents/spells)</summary>
        <pre data-spw-semantic-expression="mix[functional]{${operators.join('+')}}"><code>${escapeHtml(JSON.stringify(functionalMix, null, 2))}</code></pre>
      </details>
    </div>
  `;

  // One deliberately non-authoritative crystallization, now enhanced with brace/physics awareness
  const labels = ingredients.map(i => i.label);
  const physicsNote = ` (rhythm ${functionalMix.physicsContext.rhythmTempo}, ${functionalMix.physicsContext.climate} climate, ${functionalMix.braceContext} form)`;
  const prompt = `One scene in which ${labels.join(' and ')} interact, organized by the expressions above${physicsNote}.`;

  // Deeper semantic projection: suggest a "cast form" that names the emergent liminality + physics
  const forceCount = operators.length;
  const suggestedLiminality = forceCount >= 4 ? 'deep' : forceCount >= 3 ? 'nested' : forceCount >= 2 ? 'settled' : 'threshold';
  const castForm = `cast[${suggestedLiminality}:${functionalMix.braceContext}]{${operators.join('+')}} ${functionalMix.physicsContext.climate}`;

  let crystallizationHtml = `
    <div class="cauldron-crystallization" data-spw-cast-form="${escapeHtml(castForm)}" data-spw-liminality="${suggestedLiminality}" data-spw-brace-physics="${functionalMix.braceContext}">
      <p class="cauldron-section-label">One possible crystallization (mnemonic / prompt) — brace/physics aware</p>
      <p class="cauldron-mnemonic-note">This is one contingent phrasing someone derived from the combination above. Its value is not general — test it specifically against your own material and observe what actually transfers. Includes current brace form and site physics for richer emergence.</p>
      <div class="cauldron-mnemonic">${escapeHtml(prompt)}</div>
      <p class="cauldron-test-prompt">Try using the exact expressions from the Combination Record on a real page or frame. Notice what the operators actually do in situ. Suggested cast form: <code data-spw-semantic-expression="${escapeHtml(castForm)}">${escapeHtml(castForm)}</code></p>
    </div>
  `;

  // Spell enhancement (Patch 012 continuation): when the mix came from garden gestures (living-terms, holds, primed slices),
  // surface the full temporal provenance directly in the crystallization output. This is the "spell" the user sees
  // after ^ plant or @ mix. It now carries the same visible consequence + re-gather affordances as the Garden State mirror.
  const gardenProvenance = ingredients
    .map(i => i.gestureHistory || i.primedBy || i.chargeContext)
    .filter(Boolean)
    .join(' · ');
  if (gardenProvenance) {
    const trailSig = cauldronTrace.lastPlantedTrail || `garden-mix{${expressions.join(' + ')}}`;
    crystallizationHtml += `
      <div class="cauldron-garden-provenance spell-provenance" data-spw-garden-provenance data-spw-spell-trail="${escapeHtml(trailSig)}">
        <span class="spell-provenance__label">garden trace</span>
        <span class="spell-provenance__trace" title="Full gesture chain that created this spell">${escapeHtml(gardenProvenance)}</span>
        <button type="button" class="garden-action spell-action" data-spw-spell-action="re-gather" data-spw-spell-trail="${escapeHtml(trailSig)}">re-gather</button>
        <button type="button" class="garden-action spell-action" data-spw-spell-action="vision-from-spell" data-spw-spell-trail="${escapeHtml(trailSig)}">vision seed</button>
      </div>
    `;
    // Attach to functional data so spell boards / atoms downstream can consume it
    functionalMix.gestureHistory = gardenProvenance;
    functionalMix.spellTrail = trailSig;
  }

  // Return both human HTML and functional data for spells/agents/beats
  return { html: combinationHtml + crystallizationHtml, functional: functionalMix };
}

export const refreshCauldronState = guardCall(syncCauldronState, 'cauldron:refresh');

export function clearCauldron() {
  saveCauldron([]);
  clearUndoStack();
  bus.emit('cauldron:cleared', { count: 0 });
}

/* Backwards-compatible alias for the mounting code in site.js */
export const initCompositionSpell = initCauldron;

/* Public helpers for runtime mirrors, design labs, and inline instrumentation */
export {
  CAULDRON_CONTRACT,
  computeCauldronPhase,
  computeIngredientPhase,
  pruneStale,
  nourishIngredient,
  getCauldron as getCauldronIngredients,
};

/**
 * Capture current observation beat/artifact as a cauldron ingredient (Phase 3 QA integration).
 * Wires beats directly into spell/cauldron architecture.
 */
export async function captureBeatAsIngredient() {
  try {
    const mod = await import('/public/js/runtime/observation-beats.js');
    const artifact = mod.captureCurrentBeatArtifact({ source: 'cauldron-capture' });
    if (artifact) {
      const ingredients = getCauldron();
      ingredients.push({
        expression: `beat[qa]{${artifact.id || 'current'}}`,
        label: `Observation beat ${artifact.id?.slice(-6) || ''}`,
        operator: '#>',
        wonder: 'trace',
        capturedAt: Date.now(),
        origin: 'qa-beat',
        context: artifact.mode,
        beatArtifact: artifact,  // full functional payload
      });
      const trimmed = ingredients.slice(-6);
      saveCauldron(trimmed);
      bus.emit('cauldron:updated', { count: trimmed.length, source: 'beat-capture' });
      return artifact;
    }
  } catch (e) {
    console.warn('[cauldron] beat capture failed', e);
  }
  return null;
}
