/**
 * toolmaker-submissions.js (Workshop Field Notebook & Specimen Scratchpad)
 * --------------------------------------------------------------------------
 * Interactive workbench for drafting personal field notes, specimens, operator
 * sketches, and IDE workshop observations throughout Spwashi.
 *
 * Provides live reactive preview, .spw block compilation, local auto-save,
 * clipboard export, and session feature lab synergy testing.
 * ========================================================================== */

import { writeDatasetValue } from './runtime-helpers.js';
import { toggleFeatureLabToken } from './feature-lab.js';
import { composeSurface, sigilFor, sanitizeHandle } from '/public/js/semantic/spw-compose.js';

export const NOTEBOOK_STORAGE_KEY = 'spw-workshop-notebook-draft';

const NOTEBOOK_PRESETS = Object.freeze({
  specimen: {
    kicker: 'Specimen & Proof',
    defaultTitle: 'container_query_liminality_edge',
    defaultCategory: 'layout-physics',
    defaultOperator: '#>',
    defaultRole: 'channel',
    defaultBody: `^"specimen"{
  surface: "software"
  problem: "Container query evaluation on nested cards causes 1px subpixel jitter during CSS zoom."
  falsification: "A nested frame with [data-spw-form=brace] must remain steady across 80% to 120% scale."
  proposed_patch: "Apply round() on container inline padding to snap to whole pixel boundaries."
}`,
  },
  operator: {
    kicker: 'Operator Sketch',
    defaultTitle: 'modality_shift_operator',
    defaultCategory: 'syntax',
    defaultOperator: '@',
    defaultRole: 'transformer',
    defaultBody: `^"operator_sketch"{
  sigil: "@~"
  name: "potential_perspective"
  metaphysics: "Holds a perspective open without committing to a concrete camera or viewpoint."
  electrostatic_role: "transformer"
  discharge_kind: "project"
  affordances: #[
    "scrub-viewpoint-without-locking-state"
    "project-lens-overlay"
  ]
}`,
  },
  dispatch: {
    kicker: 'Workshop Field Note',
    defaultTitle: 'ide_spatial_ergonomics_observation',
    defaultCategory: 'ide-ergonomics',
    defaultOperator: '~',
    defaultRole: 'ground',
    defaultBody: `^"field_note"{
  topic: "Spatial Keychords for Dialect Navigation"
  observation: "When moving across 3+ nested code layers, modal keybindings cause cognitive thrash. Spatial pan-rails preserve peripheral attention better than popup modals."
  reproducible_bed: "Tested in Spw operator atlas using [data-spw-layout=split]."
}`,
  },
  lab: {
    kicker: 'Practice Bed / Lab',
    defaultTitle: 'harmonic_wave_palette_probe',
    defaultCategory: 'mechanics',
    defaultOperator: '?',
    defaultRole: 'inductor',
    defaultBody: `^"practice_bed"{
  medium: "interactive-canvas"
  inputs: #[ "pointer-x" ; "dwell-duration" ]
  energy_model: "resonant-spring"
  zero_dep_proof: "Vanilla JS + Canvas2D, under 120 lines."
}`,
  },
});

/**
 * The notebook's shape, expressed through the shared composer.
 *
 * The axis set and the fallback anchor are what make this a notebook rather
 * than any other surface. Assembling the lines is not, and was duplicated.
 */
function compileSpwBlock(formState) {
  const { mode, title, category, operator, role, body } = formState;
  return composeSurface({
    anchor: title,
    fallbackAnchor: 'untitled_note',
    axes: {
      notebook: 'field_note',
      category: category || 'syntax',
      mode,
      operator: sigilFor(operator),
      role: role || 'terminal',
    },
    body,
  });
}

export function initToolmakerSubmissions(root = document) {
  const container = root instanceof HTMLElement && root.matches?.('[data-spw-feature="toolmaker-submissions"]')
    ? root
    : root.querySelector?.('[data-spw-feature="toolmaker-submissions"]');

  if (!container || container.dataset.spwSubmissionsBound) return;
  container.dataset.spwSubmissionsBound = 'true';

  let currentMode = 'specimen';

  const modeButtons = container.querySelectorAll('[data-submission-mode]');
  const titleInput = container.querySelector('[data-draft-field="title"]');
  const categorySelect = container.querySelector('[data-draft-field="category"]');
  const operatorSelect = container.querySelector('[data-draft-field="operator"]');
  const roleSelect = container.querySelector('[data-draft-field="role"]');
  const bodyTextarea = container.querySelector('[data-draft-field="body"]');

  const previewHandle = container.querySelector('[data-preview="handle"]');
  const previewKicker = container.querySelector('[data-preview="kicker"]');
  const previewCategory = container.querySelector('[data-preview="category"]');
  const previewRole = container.querySelector('[data-preview="role"]');
  const previewCode = container.querySelector('[data-preview="code"]');
  const previewCard = container.querySelector('.specimen-preview-card');

  const copyBtn = container.querySelector('[data-action="copy-spw"]');
  const resetBtn = container.querySelector('[data-action="reset-note"]');
  const labTestBtn = container.querySelector('[data-action="test-lab"]');
  const statusNote = container.querySelector('[data-status-note]');

  function getFormState() {
    return {
      mode: currentMode,
      title: titleInput?.value || NOTEBOOK_PRESETS[currentMode].defaultTitle,
      category: categorySelect?.value || NOTEBOOK_PRESETS[currentMode].defaultCategory,
      operator: operatorSelect?.value || NOTEBOOK_PRESETS[currentMode].defaultOperator,
      role: roleSelect?.value || NOTEBOOK_PRESETS[currentMode].defaultRole,
      body: bodyTextarea?.value || NOTEBOOK_PRESETS[currentMode].defaultBody,
    };
  }

  function saveToStorage() {
    try {
      const state = getFormState();
      localStorage.setItem(NOTEBOOK_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore storage errors */
    }
  }

  function restoreFromStorage() {
    try {
      const raw = localStorage.getItem(NOTEBOOK_STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (!state || typeof state !== 'object') return false;

      currentMode = state.mode || 'specimen';
      if (titleInput && state.title) titleInput.value = state.title;
      if (categorySelect && state.category) categorySelect.value = state.category;
      if (operatorSelect && state.operator) operatorSelect.value = state.operator;
      if (roleSelect && state.role) roleSelect.value = state.role;
      if (bodyTextarea && state.body) bodyTextarea.value = state.body;

      modeButtons.forEach((btn) => {
        const isActive = btn.getAttribute('data-submission-mode') === currentMode;
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      return true;
    } catch {
      return false;
    }
  }

  function syncPreview() {
    const state = getFormState();
    const handle = sanitizeHandle(state.title);
    const sigil = state.operator || '#>';

    if (previewHandle) previewHandle.textContent = `${sigil}${handle}`;
    if (previewKicker) previewKicker.textContent = NOTEBOOK_PRESETS[state.mode]?.kicker || 'Field Note';
    if (previewCategory) previewCategory.textContent = state.category;
    if (previewRole) {
      previewRole.textContent = `role: ${state.role}`;
      writeDatasetValue(previewRole, 'spwElectrostaticRole', state.role);
    }
    if (previewCode) {
      previewCode.textContent = compileSpwBlock(state);
    }
    if (previewCard) {
      writeDatasetValue(previewCard, 'spwOperator', state.operator);
      writeDatasetValue(previewCard, 'spwElectrostaticRole', state.role);
    }

    saveToStorage();
  }

  function loadPreset(mode) {
    if (!NOTEBOOK_PRESETS[mode]) return;
    currentMode = mode;

    modeButtons.forEach((btn) => {
      const isActive = btn.getAttribute('data-submission-mode') === mode;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const preset = NOTEBOOK_PRESETS[mode];
    if (titleInput) titleInput.value = preset.defaultTitle;
    if (categorySelect) categorySelect.value = preset.defaultCategory;
    if (operatorSelect) operatorSelect.value = preset.defaultOperator;
    if (roleSelect) roleSelect.value = preset.defaultRole;
    if (bodyTextarea) bodyTextarea.value = preset.defaultBody;

    syncPreview();
  }

  // Bind Mode Buttons
  modeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = btn.getAttribute('data-submission-mode');
      loadPreset(mode);
    });
  });

  // Bind Input Changes
  [titleInput, categorySelect, operatorSelect, roleSelect, bodyTextarea].forEach((el) => {
    el?.addEventListener('input', syncPreview);
    el?.addEventListener('change', syncPreview);
  });

  // Bind Copy Action
  copyBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const code = compileSpwBlock(getFormState());
    try {
      await navigator.clipboard.writeText(code);
      if (statusNote) {
        statusNote.textContent = '✓ Spw note copied to clipboard!';
        statusNote.classList.add('is-active');
        setTimeout(() => {
          statusNote.classList.remove('is-active');
          statusNote.textContent = '';
        }, 3200);
      }
    } catch (err) {
      console.warn('Clipboard write failed', err);
      if (statusNote) statusNote.textContent = 'Copy failed. Select code directly from preview.';
    }
  });

  // Bind Reset / Clear Note Action
  resetBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    loadPreset(currentMode);
    if (statusNote) {
      statusNote.textContent = '↺ Draft reset to template defaults.';
      statusNote.classList.add('is-active');
      setTimeout(() => {
        statusNote.classList.remove('is-active');
        statusNote.textContent = '';
      }, 2400);
    }
  });

  // Bind Feature Lab Test Action
  labTestBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    const state = getFormState();
    const token = `note-${state.mode}`;
    toggleFeatureLabToken(token);
    if (statusNote) {
      statusNote.textContent = `⚡ Session flag "+${token}" toggled. Reloading workbench...`;
      statusNote.classList.add('is-active');
      setTimeout(() => location.reload(), 600);
    }
  });

  // Initial load from local storage or preset
  if (!restoreFromStorage()) {
    syncPreview();
  } else {
    syncPreview();
  }
}

