/**
 * spw-expression.js — <spw-expression>, a mutable expression.
 *
 * The creator, 2026-11-08: "improve ergonomics of Spw navigation across the
 * site; imagine a component representing a mutable expression". This is the
 * first pilot of authored custom elements as module hosts: light DOM, state on
 * the element (.spw/caches/spw-navigation-ergonomics-2026-11.spw).
 *
 * An expression such as #>home[reading]{folio_stack} is a row of slots, and
 * each slot is a handle a reader can turn:
 *   tap        the slot's choices open beneath the expression, the current one marked
 *   swipe ← →  step to the neighbouring value; an edge is an edge, nothing wraps
 *   hold       peek: name where a step lands on each side, without going
 *   keys       Tab between slots; ← → step; Enter or Space open; Escape closes
 * A turn dispatches spw:expression-change { slot, value, from, choice, source },
 * cancelable. The host says what a turn does (travel to a section, switch a
 * lens). When nothing prevents it and the choice carries an href, the element
 * follows it. The expression's text is the caption a screenshot keeps.
 */
import { GESTURE_MEASURE } from '/public/js/kernel/gesture-measure.js';

export const SPW_EXPRESSION_TAG = 'spw-expression';
export const EXPRESSION_CHANGE_EVENT = 'spw:expression-change';

/** Each slot's walls, in the order a line reads them. */
export const SLOT_WALLS = Object.freeze({
  subject: Object.freeze(['', '']),
  mode: Object.freeze(['[', ']']),
  scene: Object.freeze(['(', ')']),
  body: Object.freeze(['{', '}']),
  projection: Object.freeze(['<', '>']),
});

/** What a slot is called aloud. */
const SLOT_SAYS = Object.freeze({ subject: 'Page', mode: 'Lens', scene: 'Scene', body: 'Section', projection: 'About' });

/** The neighbour of a value among a slot's choices, or null at an edge. */
export function stepChoice(choices = [], value = '', delta = 1) {
  if (!Array.isArray(choices) || !choices.length) return null;
  const index = choices.findIndex((choice) => choice.value === value);
  const next = (index < 0 ? 0 : index) + delta;
  return next >= 0 && next < choices.length ? choices[next] : null;
}

/** The expression as one line of Spw. */
export function expressionText(model = {}) {
  const slots = (model.slots || []).map((slot) => {
    const [open, close] = SLOT_WALLS[slot.name] || ['', ''];
    return `${open}${slot.value || ''}${close}`;
  });
  return `${model.operator || ''}${slots.join('')}`;
}

/** A slot's place among its choices, for a screen reader: "Section: folio_stack, 2 of 17". */
export function slotSummary(slot) {
  const choices = slot.choices || [];
  const index = choices.findIndex((choice) => choice.value === slot.value);
  const where = index >= 0 ? `, ${index + 1} of ${choices.length}` : '';
  const label = choices[index]?.label && choices[index].label !== slot.value ? ` (${choices[index].label})` : '';
  return `${SLOT_SAYS[slot.name] || slot.name}: ${slot.value || 'none'}${label}${where}`;
}

const normalizeModel = (model = {}) => ({
  operator: String(model.operator || ''),
  slots: (model.slots || [])
    .filter((slot) => slot && SLOT_WALLS[slot.name])
    .map((slot) => ({
      name: slot.name,
      value: String(slot.value ?? ''),
      choices: (slot.choices || []).map((choice) => ({
        value: String(choice.value ?? ''),
        label: String(choice.label ?? choice.value ?? ''),
        href: choice.href ? String(choice.href) : '',
      })),
    })),
});

const STYLE_ID = 'spw-expression-style';
const CSS = `
spw-expression { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0; min-inline-size: 0; font-family: var(--site-mono-font, ui-monospace, monospace); }
spw-expression .spw-expression__op { color: var(--op-frame-color, currentColor); font-weight: 600; }
spw-expression .spw-expression__wall { font-weight: 600; }
spw-expression .spw-expression__wall[data-half="open"] { color: var(--grammar-objective-brace-color, hsl(188 58% 32%)); }
spw-expression .spw-expression__wall[data-half="close"] { color: var(--grammar-subjective-brace-color, hsl(342 48% 36%)); }
spw-expression .spw-expression__slot {
  appearance: none; display: inline-flex; align-items: center; min-block-size: var(--touch-target-compact, 2.25rem);
  margin: 0; padding: 0 0.15em; border: 0; border-radius: 0.3em;
  background: none; color: inherit; font: inherit; cursor: pointer; touch-action: pan-y;
  text-decoration: underline dashed; text-decoration-thickness: 1px; text-underline-offset: 0.28em;
}
spw-expression .spw-expression__slot:hover, spw-expression .spw-expression__slot[aria-expanded="true"] { background: color-mix(in srgb, var(--active-op-color, var(--teal, #008080)) 12%, transparent); }
spw-expression .spw-expression__slot:focus-visible { outline: 2px solid var(--active-op-color, var(--teal, #008080)); outline-offset: 2px; }
spw-expression .spw-expression__choices { display: flex; flex-wrap: wrap; flex-basis: 100%; gap: 0.25rem; max-block-size: 40vh; margin: 0.35rem 0 0; padding: 0; overflow: auto; list-style: none; }
spw-expression .spw-expression__choices li { max-inline-size: 100%; margin: 0; }
spw-expression .spw-expression__choices button {
  min-block-size: var(--touch-target-compact, 2.25rem); padding: 0 0.6em; border: 1px solid var(--line, rgba(0, 0, 0, 0.14)); border-radius: 0.5rem;
  max-inline-size: 100%; background: var(--surface-strong, #fff); color: inherit; font: inherit; font-size: 0.86em; text-align: start; white-space: normal; overflow-wrap: anywhere; cursor: pointer;
}
spw-expression .spw-expression__choices button[aria-current="true"] { border-color: var(--active-op-color, var(--teal, #008080)); font-weight: 600; }
spw-expression .spw-expression__choices .spw-expression__choice-label { margin-inline-start: 0.4em; font-family: var(--site-serif-font, Georgia, serif); font-weight: 400; }
spw-expression .spw-expression__peek { flex-basis: 100%; margin: 0.2rem 0 0; color: var(--ink-soft, currentColor); font-size: 0.8em; }
spw-expression .spw-expression__peek:empty { display: none; }
@media (pointer: coarse) { spw-expression .spw-expression__slot, spw-expression .spw-expression__choices button { min-block-size: var(--touch-target-min, 44px); } }
`;

function ensureStyles(doc) {
  if (!doc?.head || doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}

function span(doc, className, text, attrs = {}) {
  const node = doc.createElement('span');
  node.className = className;
  node.textContent = text;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

const ElementBase = globalThis.HTMLElement ?? class {};

export class SpwExpressionElement extends ElementBase {
  #model = { operator: '', slots: [] };
  #open = '';
  #bound = false;
  #press = null;
  #suppressClick = false;

  connectedCallback() {
    ensureStyles(this.ownerDocument);
    if (!this.hasAttribute('role')) this.setAttribute('role', 'group');
    this.#bind();
    this.#render();
  }

  get model() {
    return normalizeModel(this.#model);
  }

  set model(next) {
    this.#model = normalizeModel(next);
    if (this.isConnected) this.#render();
  }

  /** The expression as one line of Spw. */
  get text() {
    return expressionText(this.#model);
  }

  /** Set a slot without a turn (the host moved; the expression follows). */
  setValue(name, value) {
    const slot = this.#model.slots.find((candidate) => candidate.name === name);
    if (!slot || slot.value === String(value)) return;
    slot.value = String(value);
    if (this.isConnected) this.#render();
  }

  /** Turn a slot to a choice: the host may take the turn; otherwise an href is followed. */
  turn(name, choice, source = 'tap') {
    const slot = this.#model.slots.find((candidate) => candidate.name === name);
    if (!slot || !choice) return false;
    const from = slot.value;
    const event = new CustomEvent(EXPRESSION_CHANGE_EVENT, {
      bubbles: true,
      cancelable: true,
      detail: { slot: name, value: choice.value, from, choice, source },
    });
    const followed = this.dispatchEvent(event);
    slot.value = choice.value;
    this.#open = '';
    this.#render();
    this.#say(slot.name === 'body' && choice.label ? `${choice.value}: ${choice.label}` : `${SLOT_SAYS[name] || name}: ${choice.value}`);
    if (followed && choice.href) globalThis.location?.assign(choice.href);
    return true;
  }

  #say(text) {
    const peek = this.querySelector('.spw-expression__peek');
    if (peek) peek.textContent = text;
  }

  #render() {
    const doc = this.ownerDocument;
    const focused = this.contains(doc.activeElement) ? doc.activeElement?.dataset?.spwSlot || doc.activeElement?.dataset?.choice : '';
    const parts = [];
    if (this.#model.operator) parts.push(span(doc, 'spw-expression__op', this.#model.operator, { 'aria-hidden': 'true' }));
    for (const slot of this.#model.slots) {
      const [open, close] = SLOT_WALLS[slot.name];
      if (open) parts.push(span(doc, 'spw-expression__wall', open, { 'data-half': 'open', 'aria-hidden': 'true' }));
      const button = doc.createElement('button');
      button.type = 'button';
      button.className = 'spw-expression__slot';
      button.dataset.spwSlot = slot.name;
      button.textContent = slot.value || '…';
      button.setAttribute('aria-expanded', String(this.#open === slot.name));
      button.setAttribute('aria-label', `${slotSummary(slot)}. Open choices; arrow keys step`);
      parts.push(button);
      if (close) parts.push(span(doc, 'spw-expression__wall', close, { 'data-half': 'close', 'aria-hidden': 'true' }));
    }
    const open = this.#model.slots.find((slot) => slot.name === this.#open);
    if (open) {
      const list = doc.createElement('ul');
      list.className = 'spw-expression__choices';
      list.setAttribute('aria-label', `${SLOT_SAYS[open.name] || open.name} choices`);
      for (const choice of open.choices) {
        const item = doc.createElement('li');
        const button = doc.createElement('button');
        button.type = 'button';
        button.dataset.choice = choice.value;
        button.dataset.forSlot = open.name;
        if (choice.value === open.value) button.setAttribute('aria-current', 'true');
        button.append(span(doc, 'spw-expression__choice-value', choice.value));
        if (choice.label && choice.label !== choice.value) button.append(span(doc, 'spw-expression__choice-label', choice.label));
        item.append(button);
        list.append(item);
      }
      parts.push(list);
    }
    const said = this.querySelector('.spw-expression__peek')?.textContent || '';
    const peek = span(doc, 'spw-expression__peek', said, { role: 'status' });
    parts.push(peek);
    this.replaceChildren(...parts);
    this.dataset.spwExpressionText = this.text;
    if (focused) this.querySelector(`[data-spw-slot="${focused}"], [data-choice="${focused}"]`)?.focus();
  }

  #slotFor(target) {
    const button = target?.closest?.('.spw-expression__slot');
    return button && this.contains(button) ? this.#model.slots.find((slot) => slot.name === button.dataset.spwSlot) : null;
  }

  #step(slot, delta, source) {
    const next = stepChoice(slot.choices, slot.value, delta);
    if (!next) {
      this.#say(delta > 0 ? `${slot.value} is the last ${SLOT_SAYS[slot.name]?.toLowerCase() || 'value'}` : `${slot.value} is the first ${SLOT_SAYS[slot.name]?.toLowerCase() || 'value'}`);
      return;
    }
    this.turn(slot.name, next, source);
    this.querySelector(`[data-spw-slot="${slot.name}"]`)?.focus();
  }

  #peek(slot) {
    const prev = stepChoice(slot.choices, slot.value, -1);
    const next = stepChoice(slot.choices, slot.value, 1);
    const side = (choice) => (choice ? `${choice.value}${choice.label && choice.label !== choice.value ? ` (${choice.label})` : ''}` : 'edge');
    this.#say(`‹ ${side(prev)} · ${side(next)} ›`);
  }

  #bind() {
    if (this.#bound) return;
    this.#bound = true;
    this.addEventListener('click', (event) => {
      if (this.#suppressClick) {
        this.#suppressClick = false;
        event.preventDefault();
        return;
      }
      const choice = event.target?.closest?.('[data-choice]');
      if (choice && this.contains(choice)) {
        const slot = this.#model.slots.find((candidate) => candidate.name === choice.dataset.forSlot);
        this.turn(slot?.name, slot?.choices.find((candidate) => candidate.value === choice.dataset.choice), 'choice');
        this.querySelector(`[data-spw-slot="${slot?.name}"]`)?.focus();
        return;
      }
      const slot = this.#slotFor(event.target);
      if (!slot) return;
      this.#open = this.#open === slot.name ? '' : slot.name;
      this.#render();
    });
    this.addEventListener('keydown', (event) => {
      const slot = this.#slotFor(event.target);
      if (event.key === 'Escape' && this.#open) {
        const name = this.#open;
        this.#open = '';
        this.#render();
        this.querySelector(`[data-spw-slot="${name}"]`)?.focus();
        event.preventDefault();
        return;
      }
      if (!slot) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        event.stopPropagation();
        this.#step(slot, event.key === 'ArrowRight' ? 1 : -1, 'key');
      }
    });
    this.addEventListener('pointerdown', (event) => {
      const slot = this.#slotFor(event.target);
      if (!slot || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const press = { slot, x: event.clientX, y: event.clientY, held: false, timer: 0 };
      press.timer = setTimeout(() => {
        press.held = true;
        this.#peek(slot);
      }, GESTURE_MEASURE.holdMs);
      this.#press = press;
    });
    const release = (event) => {
      const press = this.#press;
      this.#press = null;
      if (!press) return;
      clearTimeout(press.timer);
      const dx = (event.clientX ?? press.x) - press.x;
      const dy = (event.clientY ?? press.y) - press.y;
      const swipe = Math.abs(dx) >= GESTURE_MEASURE.swipeMinPx && Math.abs(dx) >= Math.abs(dy) * GESTURE_MEASURE.swipeDominance;
      if (swipe) {
        this.#suppressClick = true;
        event.stopPropagation();
        this.#step(press.slot, dx < 0 ? 1 : -1, 'swipe');
      } else if (press.held) {
        this.#suppressClick = true;
      }
    };
    this.addEventListener('pointerup', release);
    this.addEventListener('pointercancel', () => {
      if (this.#press) clearTimeout(this.#press.timer);
      this.#press = null;
    });
  }
}

if (globalThis.customElements && !globalThis.customElements.get(SPW_EXPRESSION_TAG)) {
  globalThis.customElements.define(SPW_EXPRESSION_TAG, SpwExpressionElement);
}
