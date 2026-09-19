/**
 * interface/intake.js
 *
 * A general intake: chips the reader taps to describe a situation, a note
 * they may add, a charge that rises as the picture fills in, and a card the
 * page generates from the answers. Care intake is the first consumer; any
 * onboarding that asks "what brings you here" is the same process with
 * different chips and a different card.
 *
 * The markup carries the vocabulary, so the page reads with JavaScript off:
 *
 *   [data-<ns>-key="situation"][data-<ns>-val="anxiety"][data-<ns>-multi="true"]  a chip
 *   textarea[data-<ns>-key="note"]                                               a note
 *   [data-<ns>-generate]  [data-<ns>-reset]  [data-<ns>-output]                   the exits
 *
 * `ns` is the attribute stem the page already uses (care → data-care-*), so
 * a new intake needs no new attribute family. State lives in localStorage
 * under `storageKey`; nothing leaves the device.
 */

const DEFAULT_LABELS = Object.freeze({
  generate: '!generate',
  regenerate: '!regenerate',
});

function readState(storageKey) {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeState(storageKey, state) {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* storage is a convenience */ }
}

/**
 * How much of the picture is filled in: each declared field counts one,
 * the note counts a half, so a card is offered as soon as one chip is down
 * and reads as full only when every field has an answer.
 */
export function computeIntakeCharge(state, fields = [], noteKey = 'note') {
  const filled = fields.filter((key) => {
    const value = state[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
  const note = noteKey && String(state[noteKey] || '').trim() ? 0.5 : 0;
  const total = fields.length + (noteKey ? 0.5 : 0);
  return total ? Math.min((filled + note) / total, 1) : 0;
}

/**
 * Bind an intake to `root`.
 *
 * options.ns          attribute stem (default 'intake')
 * options.storageKey  localStorage key (default `spw:${ns}-intake`)
 * options.fields      keys that count toward the charge
 * options.noteKey     the free-text key (default 'note'; null for none)
 * options.render      (state) => HTML string for the generated card; the caller escapes
 * options.onChange    (state, charge) => void after every change; the consumer
 *                     writes its own charge token there, so the CSS it reads
 *                     keeps one static owner
 * options.labels      { generate, regenerate }
 *
 * Returns { state, charge, refresh, generate, reset, destroy }.
 */
export function createIntake(root, options = {}) {
  if (!(root instanceof Element)) return null;
  const ns = options.ns || 'intake';
  const storageKey = options.storageKey || `spw:${ns}-intake`;
  const fields = Array.isArray(options.fields) ? options.fields : [];
  const noteKey = options.noteKey === undefined ? 'note' : options.noteKey;
  const labels = { ...DEFAULT_LABELS, ...(options.labels || {}) };
  const attr = (name) => `data-${ns}-${name}`;
  const chipSelector = `[${attr('key')}][${attr('val')}]`;
  const dataKey = (name) => `${ns}${name[0].toUpperCase()}${name.slice(1)}`;

  const state = readState(storageKey);
  const note = noteKey ? root.querySelector(`[${attr('key')}="${noteKey}"]`) : null;
  const output = root.querySelector(`[${attr('output')}]`);
  const generateButton = root.querySelector(`[${attr('generate')}]`);

  const charge = () => computeIntakeCharge(state, fields, noteKey);

  const restoreChips = () => {
    root.querySelectorAll(chipSelector).forEach((chip) => {
      const key = chip.dataset[dataKey('key')];
      const val = chip.dataset[dataKey('val')];
      const saved = state[key];
      const active = Array.isArray(saved) ? saved.includes(val) : saved === val;
      chip.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  };

  const refresh = () => {
    const level = charge();
    if (generateButton instanceof HTMLButtonElement) {
      generateButton.disabled = level < 0.1;
      generateButton.textContent = level >= 0.1 && output && !output.hidden && output.childElementCount
        ? labels.regenerate
        : labels.generate;
    }
    options.onChange?.(state, level);
  };

  const pressChip = (chip) => {
    const key = chip.dataset[dataKey('key')];
    const val = chip.dataset[dataKey('val')];
    const multi = chip.dataset[dataKey('multi')] === 'true';
    if (multi) {
      const current = Array.isArray(state[key]) ? state[key] : [];
      const index = current.indexOf(val);
      if (index >= 0) current.splice(index, 1);
      else current.push(val);
      state[key] = current;
      chip.setAttribute('aria-pressed', index >= 0 ? 'false' : 'true');
    } else {
      root.querySelectorAll(`[${attr('key')}="${key}"][${attr('val')}]`).forEach((other) => {
        other.setAttribute('aria-pressed', 'false');
      });
      state[key] = val;
      chip.setAttribute('aria-pressed', 'true');
    }
    writeState(storageKey, state);
    refresh();
  };

  const generate = () => {
    if (!output || typeof options.render !== 'function') return;
    output.innerHTML = options.render(state);
    output.removeAttribute('hidden');
    output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    refresh();
  };

  const reset = () => {
    try { localStorage.removeItem(storageKey); } catch { /* see writeState */ }
    Object.keys(state).forEach((key) => delete state[key]);
    root.querySelectorAll(chipSelector).forEach((chip) => chip.setAttribute('aria-pressed', 'false'));
    if (note && 'value' in note) note.value = '';
    if (output) {
      output.innerHTML = '';
      output.setAttribute('hidden', '');
    }
    refresh();
  };

  const onClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const chip = target.closest(chipSelector);
    if (chip && root.contains(chip)) { pressChip(chip); return; }
    if (target.closest(`[${attr('generate')}]`)) { generate(); return; }
    if (target.closest(`[${attr('reset')}]`)) reset();
  };

  const onInput = () => {
    if (!note || !noteKey) return;
    state[noteKey] = String(note.value || '').trim();
    writeState(storageKey, state);
    refresh();
  };

  restoreChips();
  if (note && noteKey && state[noteKey] && 'value' in note) note.value = state[noteKey];
  root.addEventListener('click', onClick);
  note?.addEventListener('input', onInput);
  refresh();

  return {
    state,
    charge,
    refresh,
    generate,
    reset,
    destroy() {
      root.removeEventListener('click', onClick);
      note?.removeEventListener('input', onInput);
    },
  };
}

export const SPW_INTAKE_CONTRACT = Object.freeze({
  id: 'intake',
  describes: 'intake[chips|note]{charge → card} tap what fits, add one thing, generate a card the exits can carry',
  markup: 'data-<ns>-key · data-<ns>-val · data-<ns>-multi · data-<ns>-generate · data-<ns>-reset · data-<ns>-output',
  consumers: ['modules/services/care-intake.js'],
});
