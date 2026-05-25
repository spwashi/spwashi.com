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
 * Public API kept as stable as possible for existing callers.
 */

import { bus } from '/public/js/kernel/bus.js';

const CAULDRON_KEY = 'spw-cauldron';
const MAX_INGREDIENTS = 6;

let initialized = false;

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
  const mixBtn = e.target.closest('[data-spw-cauldron-action="mix"]');
  const clearBtn = e.target.closest('[data-spw-cauldron-action="clear"]');

  if (mixBtn) {
    const result = mixIngredients();
    showOutput(result);
    e.preventDefault();
  }

  if (clearBtn) {
    clearCauldron();
    hideOutput();
    e.preventDefault();
  }
}

function handleIngredientRemoval(e) {
  const removeBtn = e.target.closest('[data-spw-cauldron-remove]');
  if (!removeBtn) return;

  const index = parseInt(removeBtn.dataset.spwCauldronRemove, 10);
  if (!Number.isNaN(index)) {
    removeIngredient(index);
    hideOutput();
  }
}

function handleIngredientInspect(e) {
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
    ingEl.style.transition = 'box-shadow 120ms ease';
    ingEl.style.boxShadow = `0 0 0 2px color-mix(in srgb, var(--component-accent, var(--active-op-color, var(--teal))) 35%, transparent)`;

    setTimeout(() => {
      if (ingEl) ingEl.style.boxShadow = '';
    }, 1400);

    // Helpful for learning without being noisy
    if (typeof console !== 'undefined') {
      console.info('[Cauldron] Inspected ingredient:', expr, origin ? `(origin: ${origin})` : '');
    }
  }
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
  return {
    expression: item.expression || item.label || '',
    label: item.label || item.expression || '',
    operator: item.operator || inferOperator(item.expression),
    wonder: item.wonder || '',
    capturedAt: item.capturedAt || Date.now(),
    ...item, // preserve any extra rich data
  };
}

function inferOperator(expression = '') {
  const match = String(expression).match(/^(#>|\\^|\\?|~|@|<|>)/);
  return match ? match[1] : '';
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

  // Richer inspectability for the taxonomy / attention model
  root.dataset.spwCauldronForceCount = String(count);
  if (count > 0) {
    const operators = [...new Set(ingredients.map(i => i.operator).filter(Boolean))];
    root.dataset.spwCauldronOperators = operators.join(' ');
  } else {
    delete root.dataset.spwCauldronOperators;
  }

  // Interaction semantics for buttons
  const mixBtn = document.querySelector('[data-spw-cauldron-action="mix"]');
  const clearBtn = document.querySelector('[data-spw-cauldron-action="clear"]');
  if (mixBtn) mixBtn.disabled = count < 2;
  if (clearBtn) clearBtn.disabled = count === 0;

  renderIngredientsList(ingredients);
}

function renderIngredientsList(ingredients) {
  const container = document.querySelector('[data-cauldron-ingredients]');
  if (!container) return;

  if (!ingredients.length) {
    container.innerHTML = '';
    return;
  }

  const html = ingredients.map((ing, idx) => {
    const op = ing.operator ? `<span class="cauldron-ingredient-op" data-spw-operator="${ing.operator}">${ing.operator}</span>` : '';
    const expr = `<span class="cauldron-ingredient-expr" data-spw-expression>${escapeHtml(ing.expression)}</span>`;

    let meta = '';
    if (ing.wonder) {
      meta += `<span class="cauldron-ingredient-meta" data-spw-wonder="${ing.wonder}">${ing.wonder}</span>`;
    }
    // Surface origin context for better learning / reduced overgeneralization
    const originText = ing.originLabel || ing.origin || ing.context;
    if (originText) {
      meta += `<span class="cauldron-ingredient-meta cauldron-origin" data-spw-origin="${escapeHtml(originText)}">${escapeHtml(originText)}</span>`;
    }

    const title = `${ing.expression}${originText ? ` (from ${originText})` : ''}`;

    return `
      <span class="cauldron-ingredient"
            data-spw-cauldron-ingredient
            data-spw-semantic-expression="${escapeHtml(ing.expression)}"
            ${ing.origin ? `data-spw-origin="${escapeHtml(ing.origin)}"` : ''}
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

  // Dedupe by expression
  if (ingredients.some(item => item.expression === expression)) return;

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
  };

  ingredients.push(ingredient);
  saveCauldron(ingredients);
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
    </div>
  `;

  // One deliberately non-authoritative crystallization
  const labels = ingredients.map(i => i.label);
  const prompt = `One scene in which ${labels.join(' and ')} interact, organized by the expressions above.`;

  // Deeper semantic projection: suggest a "cast form" that names the emergent liminality
  const forceCount = operators.length;
  const suggestedLiminality = forceCount >= 4 ? 'deep' : forceCount >= 3 ? 'nested' : forceCount >= 2 ? 'settled' : 'threshold';
  const castForm = `cast[${suggestedLiminality}]{${operators.join('+')}}`;

  let crystallizationHtml = `
    <div class="cauldron-crystallization" data-spw-cast-form="${escapeHtml(castForm)}" data-spw-liminality="${suggestedLiminality}">
      <p class="cauldron-section-label">One possible crystallization (mnemonic / prompt)</p>
      <p class="cauldron-mnemonic-note">This is one contingent phrasing someone derived from the combination above. Its value is not general — test it specifically against your own material and observe what actually transfers.</p>
      <div class="cauldron-mnemonic">${escapeHtml(prompt)}</div>
      <p class="cauldron-test-prompt">Try using the exact expressions from the Combination Record on a real page or frame. Notice what the operators actually do in situ. Suggested cast form: <code data-spw-semantic-expression="${escapeHtml(castForm)}">${escapeHtml(castForm)}</code></p>
    </div>
  `;

  return combinationHtml + crystallizationHtml;
}

export function clearCauldron() {
  saveCauldron([]);
  bus.emit('cauldron:cleared', { count: 0 });
}

/* Backwards-compatible alias for the mounting code in site.js */
export const initCompositionSpell = initCauldron;
