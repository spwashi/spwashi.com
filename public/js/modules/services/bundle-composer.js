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
 * Serialization: ^bundle[Services.Bundle ref:YYYY]{ … }
 * Share: /services/?bundle=plate,author-site#compose-a-bundle
 */
import { emitSpwAction } from '/public/js/kernel/shared.js';
import { copySeed, downloadSpwText } from '/public/js/interface/seed-exits.js';

const HOST_SELECTOR = '[data-bundle-composer]';
const PARAM = 'bundle';

const LANE_LABELS = {
  art: 'Art & illustration',
  design: 'Design & websites',
  engineering: 'Software & advisory',
  qa: 'QA across devices',
  media: 'Video, community & media',
  ecosystem: 'Ecosystem',
};

/* One word per lane for the bundle's name: "Art × Websites × QA bundle". */
const LANE_SHORT = {
  art: 'Art',
  design: 'Websites',
  engineering: 'Software',
  qa: 'QA',
  media: 'Media',
  ecosystem: 'Routing',
};

const money = (n) => `$${Math.round(n).toLocaleString('en-US')}`;

function readSkill(input) {
  const min = Number.parseFloat(input.dataset.min || '');
  const max = Number.parseFloat(input.dataset.max || '');
  return {
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
  const base = skill.max != null && skill.max !== skill.min
    ? `${money(skill.min)}–${money(skill.max)}`
    : money(skill.min);
  return `${base}${skill.open ? '+' : ''}${skill.unit ? `/${skill.unit}` : ''}`;
}

function summarize(skills) {
  const fixed = skills.filter((s) => !s.quoted && !s.unit && s.min != null);
  const recurring = skills.filter((s) => !s.quoted && s.unit);
  const quoted = skills.filter((s) => s.quoted);
  const min = fixed.reduce((sum, s) => sum + s.min, 0);
  const max = fixed.reduce((sum, s) => sum + (s.max ?? s.min), 0);
  const open = fixed.some((s) => s.open);
  const parts = [];
  if (fixed.length) parts.push(min === max ? `${money(min)}${open ? '+' : ''}` : `${money(min)}–${money(max)}${open ? '+' : ''}`);
  recurring.forEach((s) => parts.push(priceLabel(s)));
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
  return `^bundle[${lanes.join('.')}]{${skills.map((s) => s.id).join('.')}}`;
}

function block(skills, summary) {
  const year = new Date().getFullYear();
  const items = skills.map((s) => `${s.label} ${priceLabel(s)}`).join(' · ');
  const line = (key, value) => `  ${key.padEnd(10)}: "${value}"`;
  return [
    `^bundle[Services.Bundle ref:${year}]{`,
    line('lanes', summary.lanes.join(' ')),
    line('skills', skills.map((s) => s.id).join(' ')),
    line('items', items),
    line('range', summary.parts.join(' + ') || 'nothing chosen'),
    line('next', '/contact/ — or reply to this block'),
    '}',
  ].join('\n');
}

function shareHref(skills) {
  const url = new URL(window.location.href);
  if (skills.length) url.searchParams.set(PARAM, skills.map((s) => s.id).join(','));
  else url.searchParams.delete(PARAM);
  url.hash = '#compose-a-bundle';
  return url.toString();
}

export class BundleComposer {
  constructor(host) {
    this.host = host;
    this.inputs = [...host.querySelectorAll('input[type="checkbox"][name="skill"]')];
    this.readout = host.querySelector('[data-bundle-readout]');
    this.nameEl = host.querySelector('[data-bundle-name]');
    this.rangeEl = host.querySelector('[data-bundle-range]');
    this.expressionEl = host.querySelector('[data-bundle-expression]');
    this.blockEl = host.querySelector('[data-bundle-block]');
    this.countEl = host.querySelector('[data-bundle-count]');
    this.onChange = () => this.update('change');
    this.onClick = (event) => this.handleClick(event);
    host.addEventListener('change', this.onChange);
    host.addEventListener('click', this.onClick);
    this.restore();
    this.update('init');
    host.dataset.bundleComposer = 'ready';
  }

  selected() {
    return this.inputs.filter((input) => input.checked).map(readSkill);
  }

  restore() {
    const param = new URLSearchParams(window.location.search).get(PARAM);
    if (!param) return;
    const ids = new Set(param.split(',').map((s) => s.trim()).filter(Boolean));
    this.inputs.forEach((input) => { input.checked = ids.has(input.value); });
  }

  update(reason) {
    const skills = this.selected();
    const summary = summarize(skills);
    const name = bundleName(summary.lanes);
    const expr = expression(skills, summary.lanes);
    if (this.nameEl) this.nameEl.textContent = skills.length ? name : 'Pick skills to compose a bundle';
    if (this.rangeEl) this.rangeEl.textContent = skills.length ? summary.parts.join(' + ') : 'the range appears here';
    if (this.expressionEl) this.expressionEl.textContent = expr;
    if (this.blockEl) this.blockEl.textContent = skills.length ? block(skills, summary) : '';
    if (this.countEl) this.countEl.textContent = String(skills.length);
    this.host.dataset.bundleCount = String(skills.length);
    this.host.dataset.bundleLanes = summary.lanes.join(' ');
    this.host.dataset.bundleState = skills.length === 0 ? 'empty' : skills.length < 3 ? 'forming' : 'composed';
    this.inputs.forEach((input) => {
      input.closest('label')?.toggleAttribute('data-checked', input.checked);
    });
    if (reason === 'change') emitSpwAction('^bundle.compose', `${skills.length} skills · ${name}`);
  }

  handleClick(event) {
    const preset = event.target.closest('[data-bundle-preset]');
    if (preset instanceof HTMLElement) {
      event.preventDefault();
      const ids = new Set(String(preset.dataset.bundlePreset || '').split(',').map((s) => s.trim()));
      this.inputs.forEach((input) => { input.checked = ids.has(input.value); });
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
      this.inputs.forEach((input) => { input.checked = false; });
      this.update('change');
      return;
    }
    if (action === 'copy') {
      void copySeed(block(skills, summary), button);
      emitSpwAction('^bundle.copy', bundleName(summary.lanes));
      return;
    }
    if (action === 'share') {
      void copySeed(shareHref(skills), button, { copied: '✓ link copied' });
      return;
    }
    if (action === 'download') {
      downloadSpwText(block(skills, summary), `services-bundle-${new Date().getFullYear()}`, button);
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
