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

const CAULDRON_KEY = 'spw-cauldron';
const MAX_INGREDIENTS = 6;

let initialized = false;

/* Temporal consequence trackers for live garden state mirrors (home inspector + design surfaces).
   These let the consequence of a hold on a living-term or mode pill remain visible after the gesture ends,
   directly supporting "effects easy to trace" and "states easy to traverse". */
let lastGestureTrace = '';
let lastPlantedTrailSignature = '';

/**
 * Initialize the cauldron system.
 * Listens for captures (from region menus, gestures, etc.) and wires footer UI.
 */
export function initCauldron() {
  if (initialized) return;
  initialized = true;

  // Legacy event name preserved for compatibility with region-menu and haptics flows.
  bus.on('spell:capture', onCapture);

  document.body.addEventListener('click', handleCauldronUIActions, true);

  // Support for future richer ingredient list UI
  document.body.addEventListener('click', handleIngredientRemoval, true);

  // Basic inspectability: clicking an ingredient (not the remove) surfaces it for reflection
  document.body.addEventListener('click', handleIngredientInspect, true);

  syncCauldronState();
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

  if (mixBtn) {
    const result = mixIngredients();
    const html = typeof result === 'string' ? result : result.html || result;
    showOutput(html);
    // Functional result available for agents/spells: result.functional
    e.preventDefault();
  }

  if (clearBtn) {
    clearCauldron();
    hideOutput();
    e.preventDefault();
  }

  if (pruneBtn) {
    pruneStale();
    hideOutput();
    e.preventDefault();
  }

  if (nourishBtn) {
    // Nourish the most recent ingredient as a simple "tend" gesture
    const ingredients = getCauldron();
    if (ingredients.length) nourishIngredient(ingredients.length - 1);
    e.preventDefault();
  }

  if (plantBtn) {
    // Memory gardening: "plant" the current gathering as a durable spell/checkpoint
    const ingredients = getCauldron();
    if (ingredients.length >= 1) {
      const expr = ingredients.map(i => i.expression).join(' + ');
      const gestureSummary = ingredients
        .map(i => i.primedBy || i.chargeContext)
        .filter(Boolean)
        .join('·');
      const trailSig = gestureSummary ? `garden{${expr}}·${gestureSummary}` : `garden{${expr}}`;
      lastPlantedTrailSignature = trailSig.length > 52 ? trailSig.slice(0, 49) + '…' : trailSig;

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

    // Helpful for learning without being noisy
    if (typeof console !== 'undefined') {
      console.info('[Cauldron] Inspected ingredient:', expr, origin ? `(origin: ${origin})` : '');
    }
  }
}

function announceCauldronStatus(message) {
  if (!message) return;
  document.querySelectorAll('[data-cauldron-status]').forEach((node) => {
    node.textContent = message;
  });
}

/* ==========================================================================
   Output Display
   ========================================================================== */

function showOutput(htmlContent) {
  const output = document.querySelector('[data-cauldron-output]');
  const textBox = document.querySelector('[data-cauldron-text]');
  if (output && textBox) {
    // The HTML from mixIngredients now contains explicit sections:
    // "Combination Record" (raw Spw forces) and "Crystallization" (one limited use).
    // This markup itself is part of the learning design.
    textBox.innerHTML = htmlContent;
    output.hidden = false;
  }
}

function hideOutput() {
  const output = document.querySelector('[data-cauldron-output]');
  if (output) output.hidden = true;
}

/* ==========================================================================
   Core State Management (richer ingredient model)
   ========================================================================== */

function getCauldron() {
  try {
    const raw = JSON.parse(localStorage.getItem(CAULDRON_KEY) || '[]');
    // Normalize older simple {expression, label} items
    return raw.map(normalizeIngredient).filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeIngredient(item) {
  if (!item) return null;
  if (typeof item === 'string') {
    return { expression: item, label: item, capturedAt: Date.now() };
  }
  const normalized = {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: item.operator || inferOperator(item.expression),
    wonder: item.wonder || '',
    capturedAt: item.capturedAt || Date.now(),
    ...item, // preserve any extra rich data
  };

  // Numericity integration (proper architecture extension, not ad-hoc surface):
  // Numbers/rhythmic allocations. The baker's dozen (13-modulo) specifics are an easter egg layer — functional in quantifier derivation but not announced in primary surfaces.
  // become typed ingredients with derived quantifiers for selection/discovery paths.
  // This makes categories of numbers first-class for cauldron → spell → navigation flows
  // and keeps them "in mind" via existing mirrors (ideal for video narration/editing).
  if (isNumericalConcept(normalized.expression)) {
    normalized.type = 'numerical';
    const parsed = parseNumericalValue(normalized.expression);
    if (parsed) {
      normalized.value = parsed.value;
      normalized.unit = parsed.unit;
      normalized.quantifiers = deriveNumericityQuantifiers([normalized]);
    }
  }

  return normalized;
}

function isNumericalConcept(expr = '') {
  const s = String(expr).toLowerCase();
  return /\b(13|200|10k|10000|day|step|video|trace|mod|per|across|dimensional|epoch|chunk)\b/.test(s);
}

function parseNumericalValue(expr = '') {
  const match = String(expr).match(/(\d+)(k?)\s*[- ]?(day|step|video|trace|chunk|epoch)?/i);
  if (!match) return null;
  let val = parseInt(match[1], 10);
  if (match[2] === 'k') val *= 1000;
  return { value: val, unit: match[3] || 'count' };
}

function deriveNumericityQuantifiers(ingredients = []) {
  const nums = ingredients.filter(i => i.type === 'numerical' && typeof i.value === 'number');
  if (!nums.length) return [];

  const suggestions = new Set();
  nums.forEach(n => {
    const v = n.value;
    const u = n.unit || 'unit';
    suggestions.add(`mod-${v}`);
    suggestions.add(`per-${v}-${u}`);
    suggestions.add(`across-${v}-trace`);
    // The 13-modulo "baker's dozen" derivation is the easter-egg heart of the numericity system.
    // It powers real quantifiers for users who engage, but is not surfaced in main prose or default UI.
    if (v % 13 === 0 || v === 13) suggestions.add('mod-13-allocation');
    suggestions.add(`dimensional-${Math.min(3, Math.floor(v / 50) || 1)}`);
  });
  return Array.from(suggestions);
}

function inferOperator(expression = '') {
  const match = String(expression).match(/^(#>|\\^|\\?|~|@|<|>)/);
  return match ? match[1] : '';
}

/* ==========================================================================
   Lifecycle + Memory Gardening Primitives
   (smallest additive layer for phase awareness and tending)
   ========================================================================== */

const GARDEN_PRUNE_DAYS = 30; // default threshold for "stale" in the memory garden

function computeIngredientPhase(ing) {
  if (!ing || !ing.capturedAt) return 'gathering';
  const ageMs = Date.now() - Number(ing.capturedAt);
  const days = ageMs / (1000 * 60 * 60 * 24);
  if (days > GARDEN_PRUNE_DAYS * 1.5) return 'decayed';
  if (days > GARDEN_PRUNE_DAYS) return 'mature';
  if (ing.wonder || ing.operator) return 'resonant';
  return 'gathering';
}

function computeCauldronPhase(ingredients = []) {
  if (!ingredients.length) return 'empty';
  const hasRecent = ingredients.some(i => {
    const days = (Date.now() - Number(i.capturedAt || 0)) / (1000 * 60 * 60 * 24);
    return days < 3;
  });
  const count = ingredients.length;
  if (hasRecent && count >= 2) return 'resonant';
  if (count >= 4) return 'mature';
  return 'gathering';
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

function saveCauldron(cauldron) {
  const trimmed = cauldron.slice(-MAX_INGREDIENTS);
  localStorage.setItem(CAULDRON_KEY, JSON.stringify(trimmed));
  syncCauldronState();
  bus.emit('cauldron:updated', {
    count: trimmed.length,
    items: trimmed,
  });
}

function syncCauldronState() {
  const ingredients = getCauldron();
  const count = ingredients.length;

  const root = document.documentElement;
  root.dataset.spwCauldronCount = String(count);

  // Lifecycle phase for CSS, mirrors, and runtime awareness (the core of the enhancement)
  const phase = computeCauldronPhase(ingredients);
  root.dataset.spwCauldronPhase = phase;
  syncCauldronHosts(ingredients, phase);

  // Richer inspectability for the taxonomy / attention model
  root.dataset.spwCauldronForceCount = String(count);
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
  document.querySelectorAll('[data-cauldron-count]').forEach((node) => {
    node.textContent = String(count);
  });
  document.querySelectorAll('[data-spw-cauldron-operators]').forEach((node) => {
    const operators = root.dataset.spwCauldronOperators;
    node.textContent = operators ? `· forces: ${operators}` : '';
  });
  document.querySelectorAll('[data-spw-cauldron-action="prune"], [data-spw-cauldron-action="nourish"], [data-spw-cauldron-action="plant"]')
    .forEach((button) => { button.disabled = count === 0; });

  renderIngredientsList(ingredients);
  renderCauldronMirrors(ingredients, phase);
}

function syncCauldronHosts(ingredients, phase) {
  const count = ingredients.length;
  const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))].join(' ');
  document.querySelectorAll('[data-spw-cauldron]').forEach((host) => {
    host.dataset.spwCauldronPhase = phase;
    host.dataset.spwCauldronCount = String(count);
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
  const compactTrace = traceParts.length ? traceParts.join(' · ') : (lastGestureTrace || '');

  // Last gesture for the "what just happened" immediate signal
  const lastIng = ingredients[ingredients.length - 1];
  const lastGesture = lastIng
    ? (lastIng.gestureHistory || lastIng.primedBy || lastIng.chargeContext || lastGestureTrace || 'direct attention')
    : (lastGestureTrace || '—');

  document.querySelectorAll('[data-spw-cauldron-mirror]').forEach((mirror) => {
    mirror.dataset.spwCauldronPhase = phase;
    mirror.dataset.spwCauldronCount = String(count);
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
      trailEl.textContent = lastPlantedTrailSignature ? `trail: ${lastPlantedTrailSignature}` : '';
      if (lastPlantedTrailSignature) trailEl.dataset.spwSpellTrail = lastPlantedTrailSignature;
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
    return;
  }

  // Small tightening: only re-render when the signature changes (avoids unnecessary DOM churn on frequent syncs)
  const signature = ingredients.map(i => `${i.expression}|${i.capturedAt || 0}`).join('~');
  if (container.dataset.lastSignature === signature) return;
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

    const title = `${ing.expression}${originText ? ` (from ${originText})` : ''}`;

    return `
      <span class="cauldron-ingredient"
            data-spw-cauldron-ingredient
            data-spw-semantic-expression="${escapeHtml(ing.expression)}"
            data-spw-ingredient-phase="${phase}"
            ${ing.origin ? `data-spw-origin="${escapeHtml(ing.origin)}"` : ''}
            ${ing.primedBy ? `data-spw-ingredient-primed="${escapeHtml(ing.primedBy)}"` : ''}
            tabindex="0"
            role="group"
            aria-label="Ingredient: ${escapeHtml(ing.expression)}"
            title="${escapeHtml(title)}">
        ${op}${expr}
        ${meta ? `<span class="cauldron-ingredient-meta-group">${meta}</span>` : ''}
        <button type="button" class="cauldron-ingredient-remove" data-spw-cauldron-remove="${idx}" aria-label="Remove ${escapeHtml(ing.expression)}">×</button>
      </span>
    `;
  }).join('');

  container.innerHTML = html;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ==========================================================================
   Public / Semi-public API
   ========================================================================== */

function onCapture(event) {
  const detail = event.detail || {};
  const expression = detail.expression || detail.semantic?.expression;
  if (!expression) return;

  const ingredients = getCauldron();

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

  // Record for live temporal consequence mirrors (the hold on a living-term now has visible afterlife)
  if (ingredient.gestureHistory || ingredient.primedBy) {
    lastGestureTrace = ingredient.gestureHistory || ingredient.primedBy || ingredient.chargeContext || '';
  }

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
      ? `Refreshed primed ingredient from ${ingredient.originLabel || 'charged brace'}: ${ingredient.label}.`
      : `Refreshed ingredient: ${ingredient.label}.`;
    announceCauldronStatus(message);
    bus.emit('cauldron:ingredient-refreshed', {
      expression,
      item: ingredients[existingIndex],
      index: existingIndex,
    });
    return;
  }

  ingredients.push(ingredient);
  saveCauldron(ingredients);
  const message = ingredient.primedBy
    ? `Primed ingredient gathered from ${ingredient.originLabel || 'charged brace'}: ${ingredient.label}.`
    : `Ingredient gathered: ${ingredient.label}.`;
  announceCauldronStatus(message);
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
    const trailSig = lastPlantedTrailSignature || `garden-mix{${expressions.join(' + ')}}`;
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

export function clearCauldron() {
  saveCauldron([]);
  bus.emit('cauldron:cleared', { count: 0 });
}

/* Backwards-compatible alias for the mounting code in site.js */
export const initCompositionSpell = initCauldron;

/* Public helpers for runtime mirrors, design labs, and inline instrumentation */
export { computeCauldronPhase, computeIngredientPhase, pruneStale, nourishIngredient, getCauldron as getCauldronIngredients };

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
