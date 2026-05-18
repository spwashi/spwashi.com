/**
 * Spw Composition Spell (The Cauldron)
 *
 * Purpose
 * - Manage a local "cauldron" of captured semantic expressions.
 * - Allow mixing terms to generate creative prompts, story seeds, or trope ideas.
 * - Encourage novel combinations and discovery of Spw vocabulary.
 */

import { bus } from '/public/js/kernel/bus.js';
import { writeDatasetValue } from '/public/js/kernel/dom-contracts.js';

const CAULDRON_KEY = 'spw-cauldron';
const MAX_INGREDIENTS = 5;

let initialized = false;

export function initCompositionSpell() {
  if (initialized) return;
  initialized = true;

  bus.on('spell:capture', onCapture);

  document.body.addEventListener('click', (e) => {
    const mixBtn = e.target.closest('[data-spw-cauldron-action="mix"]');
    const clearBtn = e.target.closest('[data-spw-cauldron-action="clear"]');

    if (mixBtn) {
      const prompt = mixIngredients();
      showOutput(prompt);
    }

    if (clearBtn) {
      clearCauldron();
      hideOutput();
    }
  });

  syncCauldronState();
}

function showOutput(text) {
  const output = document.querySelector('[data-cauldron-output]');
  const textBox = document.querySelector('[data-cauldron-text]');
  if (output && textBox) {
    textBox.textContent = text;
    output.hidden = false;
  }
}

function hideOutput() {
  const output = document.querySelector('[data-cauldron-output]');
  if (output) output.hidden = true;
}

function getCauldron() {
  try {
    return JSON.parse(localStorage.getItem(CAULDRON_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCauldron(cauldron) {
  localStorage.setItem(CAULDRON_KEY, JSON.stringify(cauldron.slice(-MAX_INGREDIENTS)));
  syncCauldronState();
}

function onCapture(event) {
  const { expression, label } = event.detail;
  if (!expression) return;

  const cauldron = getCauldron();
  if (cauldron.some(item => item.expression === expression)) return;

  cauldron.push({ expression, label, capturedAt: Date.now() });
  saveCauldron(cauldron);

  bus.emit('cauldron:updated', { count: cauldron.length, items: cauldron });
}

function syncCauldronState() {
  const count = getCauldron().length;
  document.documentElement.dataset.spwCauldronCount = String(count);
}

export function mixIngredients() {
  const cauldron = getCauldron();
  if (cauldron.length < 2) return "Add more ingredients to the cauldron...";

  const expressions = cauldron.map(item => item.expression);
  const labels = cauldron.map(item => item.label);

  // Simple mixing logic for now: combine labels into a "Trope Prompt"
  const prompt = `Compose a scene where ${labels.join(' meets ')}.

  Structural constraint: use Spw semantics [${expressions.join(' + ')}] to organize the beats.`;

  return prompt;
}

export function clearCauldron() {
  saveCauldron([]);
  bus.emit('cauldron:cleared', {});
}
