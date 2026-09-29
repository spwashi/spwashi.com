/**
 * modules/services/bundle-composer.js
 *
 * Compose a bundle: pick the skills you want from one person and a team,
 * read the range the pricing ladder already states for them, and take the
 * bundle away as a Spw block, a file, or a link.
 *
 * HTML holds every skill as a checkbox with its lane and price on the input,
 * so the list reads and prints with JavaScript off. This script only sums,
 * names, serializes, and remembers.
 *
 * Granular items carry a count input (data-qty-for) beside their checkbox;
 * a count above one travels as id:count in presets, links, and the block.
 *
 * Serialization: ^bundle[Services.Bundle ref:YYYY]{ … }
 * Share: /services/?bundle=fix:3,page-check,author-site#compose-a-bundle
 */
import { emitSpwAction } from '/public/js/kernel/shared.js';
import { copySeed, downloadSpwText } from '/public/js/interface/seed-exits.js';
import { NAME_SETS, SEQUENCE, dealFor, dealRule, dealsVisible, inSeason, isMutated, normalizeMutation, rhythmFor, rhythmLine } from './offer-rhythm.js';

const HOST_SELECTOR = '[data-bundle-composer]';
const PARAM = 'bundle';

const LANE_LABELS = {
  small: 'Small jobs',
  art: 'Art & illustration',
  design: 'Design & websites',
  engineering: 'Software & advisory',
  qa: 'QA across devices',
  media: 'Video, community & media',
  ecosystem: 'Ecosystem',
};

/* One word per lane for the bundle's name: "Art × Websites × QA bundle". */
const LANE_SHORT = {
  small: 'Small jobs',
  art: 'Art',
  design: 'Websites',
  engineering: 'Software',
  qa: 'QA',
  media: 'Media',
  ecosystem: 'Routing',
};

const MUTATION_KEY = 'spw.services.rhythm-mutation';

function loadMutation() {
  try { return normalizeMutation(JSON.parse(localStorage.getItem(MUTATION_KEY) || '{}')); } catch { return normalizeMutation(); }
}

function saveMutation(mutation) {
  try { localStorage.setItem(MUTATION_KEY, JSON.stringify(mutation)); } catch { /* per-reader convenience only */ }
}

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

/* "fix:3,page-check" → Map { fix → 3, page-check → 1 } */
function parseSelection(text) {
  const picks = new Map();
  String(text || '').split(',').forEach((part) => {
    const [id, count] = part.trim().split(':');
    if (!id) return;
    const n = Number.parseInt(count || '1', 10);
    picks.set(id, Number.isFinite(n) && n > 0 ? n : 1);
  });
  return picks;
}

const selectionToken = (skill) => (skill.qty > 1 ? `${skill.id}:${skill.qty}` : skill.id);

function readSkill(input, qtyInput) {
  const min = Number.parseFloat(input.dataset.min || '');
  const max = Number.parseFloat(input.dataset.max || '');
  const qty = Number.parseInt(qtyInput?.value || '1', 10);
  return {
    qty: Number.isFinite(qty) && qty > 0 ? qty : 1,
    each: input.dataset.each || '',
    id: input.value,
    label: input.dataset.label || input.value,
    lane: input.dataset.lane || 'ecosystem',
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
    open: input.dataset.open === 'true',
    unit: input.dataset.unit || '',
    quoted: input.dataset.quoted === 'true',
    note: input.dataset.note || '',
  };
}

function priceLabel(skill) {
  if (skill.quoted) return 'quoted';
  if (skill.min == null) return 'free';
  const n = skill.qty || 1;
  const lo = skill.min * n;
  const hi = (skill.max ?? skill.min) * n;
  const base = hi !== lo ? `${money(lo)}–${money(hi)}` : money(lo);
  return `${base}${skill.open ? '+' : ''}${skill.unit ? `/${skill.unit}` : ''}`;
}

const itemLabel = (skill) => (skill.qty > 1 ? `${skill.label} ×${skill.qty}` : skill.label);

function rangeText(min, max, open, unit = '') {
  const base = min === max ? money(min) : `${money(min)}–${money(max)}`;
  return `${base}${open ? '+' : ''}${unit ? `/${unit}` : ''}`;
}

function summarize(skills) {
  const fixed = skills.filter((s) => !s.quoted && !s.unit && s.min != null);
  const recurring = skills.filter((s) => !s.quoted && s.unit);
  const quoted = skills.filter((s) => s.quoted);
  const min = fixed.reduce((sum, s) => sum + s.min * s.qty, 0);
  const max = fixed.reduce((sum, s) => sum + (s.max ?? s.min) * s.qty, 0);
  const open = fixed.some((s) => s.open);
  const parts = [];
  if (fixed.length) parts.push(rangeText(min, max, open));
  /* Monthly lines sum into one rate, so tending + a retainer reads as one bill. */
  const units = [...new Set(recurring.map((s) => s.unit))];
  units.forEach((unit) => {
    const lines = recurring.filter((s) => s.unit === unit);
    const lo = lines.reduce((sum, s) => sum + s.min * s.qty, 0);
    const hi = lines.reduce((sum, s) => sum + (s.max ?? s.min) * s.qty, 0);
    parts.push(rangeText(lo, hi, lines.some((s) => s.open), unit));
  });
  if (quoted.length) parts.push(`${quoted.length} quoted`);
  const lanes = [...new Set(skills.map((s) => s.lane))];
  return { min, max, open, parts, lanes, fixed, recurring, quoted };
}

function bundleName(lanes) {
  if (!lanes.length) return 'an empty bundle';
  const names = lanes.map((lane) => LANE_SHORT[lane] || LANE_LABELS[lane] || lane);
  return `${names.join(' × ')} bundle`;
}

function expression(skills, lanes) {
  if (!skills.length) return '^bundle[]{}';
  return `^bundle[${lanes.join('.')}]{${skills.map(selectionToken).join('.')}}`;
}

/* Today's rhythm deal, applied to the ladder price; the list price stays on the skill. */
function withDeal(skill, rhythm, dealsOn) {
  const off = dealsOn && rhythm ? dealFor(rhythm, skill.id) : 0;
  if (!off || skill.quoted || skill.min == null) return skill;
  const cut = (n) => (n == null ? n : Math.round(n * (1 - off)));
  return { ...skill, off, listMin: skill.min, listMax: skill.max, min: cut(skill.min), max: cut(skill.max) };
}

function block(skills, summary, rhythm) {
  const year = new Date().getFullYear();
  const items = skills.map((s) => `${itemLabel(s)} ${priceLabel(s)}`).join(' · ');
  const line = (key, value) => `  ${key.padEnd(10)}: "${value}"`;
  return [
    `^bundle[Services.Bundle ref:${year}]{`,
    line('lanes', summary.lanes.join(' ')),
    line('skills', skills.map(selectionToken).join(' ')),
    line('items', items),
    line('range', summary.parts.join(' + ') || 'nothing chosen'),
    ...(skills.some((s) => s.off) ? [line('deal', `${skills.filter((s) => s.off).map((s) => `${s.label} −${Math.round(s.off * 100)}%`).join(' · ')} (rule: ${dealRule()})`)] : []),
    ...(rhythm ? [line('rhythm', rhythmLine(rhythm).expression)] : []),
    line('next', '/contact/ — or reply to this block'),
    '}',
  ].join('\n');
}

function shareHref(skills) {
  const url = new URL(window.location.href);
  if (skills.length) url.searchParams.set(PARAM, skills.map(selectionToken).join(','));
  else url.searchParams.delete(PARAM);
  url.hash = '#compose-a-bundle';
  return url.toString();
}

export class BundleComposer {
  constructor(host) {
    this.host = host;
    this.inputs = [...host.querySelectorAll('input[type="checkbox"][name="skill"]')];
    this.qtyInputs = new Map(
      [...host.querySelectorAll('input[data-qty-for]')].map((input) => [input.dataset.qtyFor, input]),
    );
    this.presets = [...host.querySelectorAll('[data-bundle-preset]')];
    this.rhythmEl = host.querySelector('[data-bundle-rhythm]');
    this.mutationControls = host.querySelector('[data-bundle-rhythm-mutate]');
    this.rhythm = rhythmFor(new Date(), loadMutation());
    this.dealsOn = dealsVisible();
    this.readout = host.querySelector('[data-bundle-readout]');
    this.nameEl = host.querySelector('[data-bundle-name]');
    this.rangeEl = host.querySelector('[data-bundle-range]');
    this.expressionEl = host.querySelector('[data-bundle-expression]');
    this.blockEl = host.querySelector('[data-bundle-block]');
    this.countEl = host.querySelector('[data-bundle-count]');
    this.onChange = (event) => {
      /* Setting a count means you want the item: check it rather than make you click twice. */
      const qtyFor = event?.target?.dataset?.qtyFor;
      if (qtyFor) {
        const box = this.inputs.find((input) => input.value === qtyFor);
        if (box && !box.checked) box.checked = true;
      }
      this.update('change');
    };
    this.onClick = (event) => this.handleClick(event);
    host.addEventListener('change', this.onChange);
    host.addEventListener('click', this.onClick);
    this.markSeason();
    this.captionPresets();
    this.restore();
    this.update('init');
    host.dataset.bundleComposer = 'ready';
  }

  selected() {
    return this.inputs
      .filter((input) => input.checked)
      .map((input) => withDeal(readSkill(input, this.qtyInputs.get(input.value)), this.rhythm, this.dealsOn));
  }

  /* Lanes in season today get a quiet mark; a deal, when the reader asked for deals, says its size. */
  markSeason() {
    this.inputs.forEach((input) => {
      const label = input.closest('label');
      if (!label) return;
      const season = inSeason(this.rhythm, input.value);
      label.toggleAttribute('data-rhythm-season', season);
      const off = this.dealsOn ? dealFor(this.rhythm, input.value) : 0;
      const note = label.querySelector(':scope > small');
      if (note && off) note.dataset.rhythmDeal = `−${Math.round(off * 100)}% today`;
      else if (note) delete note.dataset.rhythmDeal;
    });
    if (this.rhythmEl) {
      const { expression, words } = rhythmLine(this.rhythm);
      this.rhythmEl.hidden = false;
      this.rhythmEl.innerHTML = '';
      const code = document.createElement('code');
      code.textContent = expression;
      this.rhythmEl.append(code, ` ${words} Marked lanes are in season${this.dealsOn ? '; a few carry a small deal' : ''}.`);
    }
    if (this.mutationControls) {
      this.mutationControls.hidden = false;
      const reset = this.mutationControls.querySelector('[data-rhythm-mutate="ground"]');
      if (reset) reset.hidden = !isMutated(this.rhythm);
    }
  }

  /* A reader mutates how the month reads: rotate the thirteen, or name them another way. Emphasis follows; prices do not. */
  mutate(kind) {
    const current = this.rhythm.mutation;
    const sets = Object.keys(NAME_SETS);
    const next = kind === 'rotate'
      ? { ...current, rotate: current.rotate + 1 }
      : kind === 'names'
        ? { ...current, names: sets[(sets.indexOf(current.names) + 1) % sets.length] }
        : { rotate: 0, names: 'canon' };
    this.rhythm = rhythmFor(new Date(), next);
    saveMutation(this.rhythm.mutation);
    this.markSeason();
    this.captionPresets();
    this.update('change');
    const { operator } = this.rhythm;
    emitSpwAction('~bundle.rhythm', `${kind}: today reads as ${operator.sigil} ${operator.name} (${SEQUENCE.length} in the cycle)`);
  }

  apply(picks) {
    this.inputs.forEach((input) => {
      input.checked = picks.has(input.value);
      const qty = this.qtyInputs.get(input.value);
      if (qty) qty.value = String(Math.min(picks.get(input.value) || 1, Number(qty.max) || 99));
    });
  }

  /* Each preset states its own range, read from the same inputs the readout sums. */
  captionPresets() {
    this.presets.forEach((button) => {
      const picks = parseSelection(button.dataset.bundlePreset);
      const skills = this.inputs
        .filter((input) => picks.has(input.value))
        .map((input) => withDeal({ ...readSkill(input), qty: picks.get(input.value) }, this.rhythm, this.dealsOn));
      const range = summarize(skills).parts.join(' + ');
      if (!range) return;
      button.dataset.presetRange = range;
      button.setAttribute('aria-description', `${button.title || ''} · ${range}`);
      button.dataset.presetSignature = [...picks].map(([id, n]) => (n > 1 ? `${id}:${n}` : id)).sort().join(',');
    });
  }

  restore() {
    const param = new URLSearchParams(window.location.search).get(PARAM);
    if (!param) return;
    this.apply(parseSelection(param));
  }

  update(reason) {
    const skills = this.selected();
    const summary = summarize(skills);
    const name = bundleName(summary.lanes);
    const expr = expression(skills, summary.lanes);
    if (this.nameEl) this.nameEl.textContent = skills.length ? name : 'Pick skills to compose a bundle';
    if (this.rangeEl) this.rangeEl.textContent = skills.length ? summary.parts.join(' + ') : 'the range appears here';
    if (this.expressionEl) this.expressionEl.textContent = expr;
    if (this.blockEl) this.blockEl.textContent = skills.length ? block(skills, summary, this.rhythm) : '';
    if (this.countEl) this.countEl.textContent = String(skills.length);
    this.host.dataset.bundleCount = String(skills.length);
    this.host.dataset.bundleLanes = summary.lanes.join(' ');
    this.host.dataset.bundleState = skills.length === 0 ? 'empty' : skills.length < 3 ? 'forming' : 'composed';
    this.inputs.forEach((input) => {
      input.closest('label')?.toggleAttribute('data-checked', input.checked);
    });
    const signature = skills.map(selectionToken).sort().join(',');
    this.presets.forEach((button) => {
      button.setAttribute('aria-pressed', String(Boolean(signature) && button.dataset.presetSignature === signature));
    });
    if (reason === 'change') emitSpwAction('^bundle.compose', `${skills.length} skills · ${name}`);
  }

  handleClick(event) {
    const mutation = event.target.closest('[data-rhythm-mutate]');
    if (mutation instanceof HTMLElement) {
      event.preventDefault();
      this.mutate(mutation.dataset.rhythmMutate);
      return;
    }
    const preset = event.target.closest('[data-bundle-preset]');
    if (preset instanceof HTMLElement) {
      event.preventDefault();
      this.apply(parseSelection(preset.dataset.bundlePreset));
      this.update('change');
      return;
    }
    const button = event.target.closest('[data-bundle-action]');
    if (!(button instanceof HTMLElement)) return;
    event.preventDefault();
    const action = button.dataset.bundleAction;
    const skills = this.selected();
    const summary = summarize(skills);
    if (action === 'clear') {
      this.apply(new Map());
      this.update('change');
      return;
    }
    if (action === 'copy') {
      void copySeed(block(skills, summary, this.rhythm), button);
      emitSpwAction('^bundle.copy', bundleName(summary.lanes));
      return;
    }
    if (action === 'share') {
      void copySeed(shareHref(skills), button, { copied: '✓ link copied' });
      return;
    }
    if (action === 'download') {
      downloadSpwText(block(skills, summary, this.rhythm), `services-bundle-${new Date().getFullYear()}`, button);
    }
  }

  destroy() {
    this.host.removeEventListener('change', this.onChange);
    this.host.removeEventListener('click', this.onClick);
    delete this.host.dataset.bundleComposer;
  }
}

const instances = new Map();

export function initBundleComposers(ctx, root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  scope.querySelectorAll(HOST_SELECTOR).forEach((host) => {
    if (instances.has(host)) return;
    instances.set(host, new BundleComposer(host));
  });
  return () => unmountBundleComposers();
}

export function unmountBundleComposers() {
  instances.forEach((instance) => instance.destroy());
  instances.clear();
}

export { unmountBundleComposers as unmount };
