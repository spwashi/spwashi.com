/**
 * seed-card.js
 *
 * Behavior for the annual seed card component.
 *
 * HTML says what each field is (role, operator, placeholder, meaning).
 * CSS says how the card's state manifests materially.
 * This script says when and why state changes.
 *
 * State transitions: empty → filling → complete → sealed
 * Storage: localStorage under key `seed-card:{id}`
 * Serialization: ^seed[Template year:YYYY]{...} Spw block
 */

const STORAGE_PREFIX = 'seed-card:';
const SAVE_DEBOUNCE = 600;

/** Seed card templates — pivot between these */
export const SEED_TEMPLATES = {
  newyear: {
    label: 'new year',
    sigil: '^seed[NewYear.Joy year:',
    fields: [
      { key: 'threshold', op: '>', label: 'threshold', placeholder: 'what you are crossing from → into', hint: 'The boundary. What is behind you, what is ahead.' },
      { key: 'vow',       op: '^', label: 'vow',       placeholder: 'one thing you mean, stated plainly', hint: 'One commitment. Not a resolution list — one load-bearing thing.' },
      { key: 'bundle',    op: '~', label: 'bundle',    placeholder: 'what deserves another cycle', hint: 'Compress: what carries forward. Cull the rest.' },
      { key: 'relay',     op: '~', label: 'relay',     placeholder: 'how this travels outward', hint: 'How joy spreads. A card, a meal, a message, a practice.' },
      { key: 'revisit',   op: '?[', label: 'revisit',  placeholder: 'what should return in March, with more life', hint: 'Revisit after the first charge fades. When? After you have lived with the vow a while.' },
    ],
  },
  session: {
    label: 'session',
    sigil: '^seed[Session year:',
    fields: [
      { key: 'date',      op: '@', label: 'date',      placeholder: 'YYYY-MM-DD', hint: 'The event marker.' },
      { key: 'scene',     op: '^', label: 'scene',     placeholder: 'where and what', hint: 'The setting and circumstance.' },
      { key: 'turn',      op: '>', label: 'turn',      placeholder: 'what shifted', hint: 'The pivot — what changed or was revealed.' },
      { key: 'carry',     op: '~', label: 'carry',     placeholder: 'what continues', hint: 'Open threads, unresolved questions, living arcs.' },
      { key: 'revisit',   op: '?[', label: 'revisit',  placeholder: 'return after next session', hint: 'What needs more context before it resolves.' },
    ],
  },
  wonder: {
    label: 'wonder',
    sigil: '^seed[Wonder.Prompt year:',
    fields: [
      { key: 'question',  op: '?', label: 'question',  placeholder: 'the open question', hint: 'The thing you are genuinely uncertain about.' },
      { key: 'tension',   op: '!', label: 'tension',   placeholder: 'what resists the answer', hint: 'The constraint or opposing force.' },
      { key: 'material',  op: '^', label: 'material',  placeholder: 'what substrate could hold this', hint: 'A card, a code experiment, a recipe, a diagram.' },
      { key: 'relay',     op: '~', label: 'relay',     placeholder: 'who else should wonder about this', hint: 'Who benefits from this question existing.' },
      { key: 'revisit',   op: '?[', label: 'revisit',  placeholder: 'return when you have more evidence', hint: 'This is a probe — it should come back with more life.' },
    ],
  },

  services: {
    label: 'services',
    sigil: '^seed[Services.Offer ref:',
    fields: [
      { key: 'offer',     op: '>', label: 'offer',     placeholder: 'what you bring', hint: 'State what you do, plainly. Engineering, teaching, systems design, tooling, play facilitation.' },
      { key: 'scope',     op: '^', label: 'scope',     placeholder: 'what a collaboration looks like', hint: 'What is included. What is not. What a good engagement produces.' },
      { key: 'rate',      op: '@', label: 'rate',      placeholder: 'how this is priced or negotiated', hint: 'Rate, range, or trade. Be direct. Context can soften what numbers cannot.' },
      { key: 'context',   op: '~', label: 'context',   placeholder: 'where I already work', hint: 'RPG Wednesday, Pretext.js, spw-workbench, spwashi.com — the work is visible.' },
      { key: 'contact',   op: '>', label: 'contact',   placeholder: 'how to reach me', hint: 'Email, link, or shared context. Make the first step easy.' },
    ],
  },

  ask: {
    label: 'ask',
    sigil: '^seed[Ask.Card ref:',
    fields: [
      { key: 'need',      op: '>', label: 'need',      placeholder: 'what I need right now', hint: 'Be specific. Food, a bill, supplies, time. Vague asks are harder to answer.' },
      { key: 'context',   op: '^', label: 'context',   placeholder: 'why now / what is happening', hint: 'The situation. Enough context to make the ask feel real, not performative.' },
      { key: 'amount',    op: '@', label: 'amount',    placeholder: 'how much / how many', hint: 'A number, if relevant. Or a range. Make it easy to act.' },
      { key: 'offer',     op: '~', label: 'offer',     placeholder: 'what I can offer in return', hint: 'Optional. Time, skills, a session seed, a future exchange. Or just gratitude.' },
      { key: 'relay',     op: '~', label: 'relay',     placeholder: 'how to send or respond', hint: 'A link, an address, a method. Make the path frictionless.' },
    ],
  },
};

/** Generate the Spw seed block from current field values */
function buildSeedText(template, year, values) {
  const { sigil, fields } = template;
  const header = `${sigil}${year}]`;
  const lines = fields.map(f => {
    const val = values[f.key] || '';
    return `  ${f.key.padEnd(10)}: "${val}"`;
  });
  return `${header}{\n${lines.join('\n')}\n}`;
}

/** Compute charge ratio: how many fields have content */
function computeCharge(fields, values) {
  const filled = fields.filter(f => (values[f.key] || '').trim().length > 0).length;
  return filled / fields.length;
}

/** Map charge to named state */
function chargeToState(charge) {
  if (charge === 0) return 'empty';
  if (charge === 1) return 'sealed';
  if (charge >= 0.6) return 'complete';
  return 'filling';
}

export class SeedCard {
  /**
   * @param {HTMLElement} el — the .seed-card element
   */
  constructor(el) {
    this.el = el;
    this.id = el.id || 'seed-card';
    this.storageKey = STORAGE_PREFIX + this.id;
    this.templateKey = el.dataset.template || 'newyear';
    this.template = SEED_TEMPLATES[this.templateKey];
    this.values = {};
    this._saveTimer = null;

    this._render();
    this._load();
    this._bind();
  }

  /** Build DOM from template */
  _render() {
    const { el, template } = this;
    const year = new Date().getFullYear().toString();

    // Header: sigil with editable year
    let header = el.querySelector('.seed-card-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'seed-card-header';
      el.prepend(header);
    }
    header.setAttribute('data-spw-region-flow', 'cluster');
    header.innerHTML = `
      <span class="seed-card-sigil">
        ${template.sigil}<span class="seed-card-year" contenteditable="true" spellcheck="false" aria-label="year">${year}</span>]
      </span>
    `;

    // Pivot selector
    let pivot = el.querySelector('.seed-card-pivot');
    if (!pivot) {
      pivot = document.createElement('div');
      pivot.className = 'seed-card-pivot';
      pivot.setAttribute('role', 'group');
      pivot.setAttribute('aria-label', 'seed template');
      header.after(pivot);
    }
    pivot.setAttribute('data-spw-region-flow', 'cluster');
    pivot.innerHTML = Object.entries(SEED_TEMPLATES).map(([key, tmpl]) => `
      <button type="button" class="seed-pivot-btn" data-pivot="${key}" aria-pressed="${key === this.templateKey}">
        ${tmpl.label}
      </button>
    `).join('');

    // Fields
    let fieldsEl = el.querySelector('.seed-card-fields');
    if (!fieldsEl) {
      fieldsEl = document.createElement('div');
      fieldsEl.className = 'seed-card-fields';
      pivot.after(fieldsEl);
    }
    fieldsEl.setAttribute('data-spw-region-flow', 'stack');
    fieldsEl.innerHTML = template.fields.map(f => `
      <div class="seed-field" data-field="${f.key}" data-spw-touch="edit">
        <span class="seed-field-op" aria-hidden="true">${f.op}</span>
        <label class="seed-field-label" title="${f.hint}">${f.label}</label>
        <span
          class="seed-field-value"
          contenteditable="true"
          spellcheck="false"
          data-placeholder="${f.placeholder}"
          data-field-key="${f.key}"
          aria-label="${f.label}"
          role="textbox"
          aria-multiline="true"
        ></span>
      </div>
    `).join('');

    // Footer
    let footer = el.querySelector('.seed-card-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'seed-card-footer';
      fieldsEl.after(footer);
    }
    footer.setAttribute('data-spw-region-flow', 'stack');
    footer.innerHTML = `
      <code class="seed-output" aria-live="polite" aria-label="seed notation"></code>
      <div class="seed-card-footer-row" data-spw-region-flow="cluster">
        <div class="seed-card-actions" data-spw-touch="tap" data-spw-region-flow="cluster">
          <button type="button" class="seed-action" data-action="copy">copy seed</button>
          <button type="button" class="seed-action" data-action="screenshot">screenshot</button>
          <button type="button" class="seed-action" data-action="clear">clear</button>
        </div>
        <span class="seed-autosave-status" aria-live="polite" aria-label="save status"></span>
      </div>
    `;
  }

  /** Bind events */
  _bind() {
    const { el } = this;

    // Field input
    el.addEventListener('input', e => {
      const valueEl = e.target.closest('[data-field-key]');
      if (valueEl) {
        const key = valueEl.dataset.fieldKey;
        this.values[key] = valueEl.textContent.trim();
        const fieldEl = valueEl.closest('.seed-field');
        if (fieldEl) {
          fieldEl.toggleAttribute('data-filled', this.values[key].length > 0);
        }
        this._update();
        this._scheduleSave();
      }

      // Year edit
      if (e.target.classList.contains('seed-card-year')) {
        this._update();
        this._scheduleSave();
      }
    });

    // Paste sanitization — plain text only
    el.addEventListener('paste', e => {
      if (!e.target.closest('[data-spw-touch="edit"]')) return;
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    });

    // Editing state transitions
    el.addEventListener('focusin', e => {
      if (e.target.closest('.seed-field-value')) {
        el.dataset.spwState = 'editing';
      }
    });
    el.addEventListener('focusout', e => {
      if (e.target.closest('.seed-field-value')) {
        // Only clear editing state if focus left the card entirely
        requestAnimationFrame(() => {
          if (!el.contains(document.activeElement)) {
            this._update(); // re-derive state from charge
          }
        });
      }
    });

    // Prevent Enter creating <div> in contenteditable fields
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.classList.contains('seed-field-value') && !e.shiftKey) {
        e.preventDefault();
        // Move to next field
        const allValues = [...el.querySelectorAll('.seed-field-value')];
        const idx = allValues.indexOf(e.target);
        const next = allValues[idx + 1];
        if (next) next.focus();
      }
    });

    // Click field row → focus the value
    el.addEventListener('click', e => {
      const field = e.target.closest('.seed-field');
      if (field && !e.target.isContentEditable) {
        const value = field.querySelector('.seed-field-value');
        if (value) {
          value.focus();
          // move caret to end
          const range = document.createRange();
          range.selectNodeContents(value);
          range.collapse(false);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    });

    // Actions
    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'copy') this._copy(btn);
      if (action === 'screenshot') this._toggleScreenshot();
      if (action === 'clear') this._clear();
    });

    // Pivot
    el.addEventListener('click', e => {
      const btn = e.target.closest('[data-pivot]');
      if (!btn) return;
      const key = btn.dataset.pivot;
      if (key !== this.templateKey) this._pivot(key);
    });
  }

  /** Recompute state and update DOM */
  _update() {
    const { el, template, values } = this;
    const yearEl = el.querySelector('.seed-card-year');
    const year = yearEl ? yearEl.textContent.trim() : new Date().getFullYear().toString();

    const charge = computeCharge(template.fields, values);
    const state = chargeToState(charge);

    // Only update state if not currently editing
    if (el.dataset.spwState !== 'editing') {
      el.dataset.state = state;
    }
    el.style.setProperty('--card-charge', charge.toFixed(2));

    // Seed output
    const outputEl = el.querySelector('.seed-output');
    if (outputEl) {
      if (state !== 'empty') {
        outputEl.textContent = buildSeedText(template, year, values);
      }
    }
  }

  /** Show autosave status briefly */
  _showSaveStatus(text, durationMs = 1600) {
    const status = this.el.querySelector('.seed-autosave-status');
    if (!status) return;
    clearTimeout(this._statusTimer);
    status.textContent = text;
    this._statusTimer = setTimeout(() => { status.textContent = ''; }, durationMs);
  }

  /** Copy seed text to clipboard */
  async _copy(btn) {
    const { el, template, values } = this;
    const yearEl = el.querySelector('.seed-card-year');
    const year = yearEl ? yearEl.textContent.trim() : new Date().getFullYear().toString();
    const text = buildSeedText(template, year, values);

    const original = btn.textContent;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.textContent = '✓ copied';
      btn.dataset.state = 'success';
    } catch {
      btn.textContent = '! failed';
      btn.dataset.state = 'fail';
    }
    setTimeout(() => {
      btn.textContent = original;
      delete btn.dataset.state;
    }, 1800);
  }

  /** Toggle screenshot mode */
  _toggleScreenshot() {
    this.el.classList.toggle('seed-card--screenshot');
    // ensure seed output is visible in screenshot mode
    this._update();
  }

  /** Clear all fields */
  _clear() {
    const { el } = this;
    this.values = {};
    el.querySelectorAll('.seed-field-value').forEach(v => {
      v.textContent = '';
    });
    el.querySelectorAll('.seed-field[data-filled]').forEach(f => {
      f.removeAttribute('data-filled');
    });
    el.querySelector('.seed-output').textContent = '';
    this._update();
    this._save();
  }

  /** Switch to a different template */
  _pivot(key) {
    if (!SEED_TEMPLATES[key]) return;
    this._save(); // save current before switching
    this.templateKey = key;
    this.template = SEED_TEMPLATES[key];
    this.values = {};

    // Update aria-pressed on pivot buttons
    this.el.querySelectorAll('[data-pivot]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.pivot === key);
    });

    // Re-render fields
    this._renderFields();
    this._load(); // try loading saved values for this template
    this._update();

    // Update sigil
    const yearEl = this.el.querySelector('.seed-card-year');
    const year = yearEl ? yearEl.textContent.trim() : new Date().getFullYear().toString();
    const sigilEl = this.el.querySelector('.seed-card-sigil');
    if (sigilEl && yearEl) {
      sigilEl.innerHTML = `${this.template.sigil}<span class="seed-card-year" contenteditable="true" spellcheck="false" aria-label="year">${year}</span>]`;
    }

    // Update storage key for this template
    this.storageKey = STORAGE_PREFIX + this.id + ':' + key;
  }

  _renderFields() {
    const fieldsEl = this.el.querySelector('.seed-card-fields');
    if (!fieldsEl) return;
    fieldsEl.innerHTML = this.template.fields.map(f => `
      <div class="seed-field" data-field="${f.key}">
        <span class="seed-field-op" aria-hidden="true">${f.op}</span>
        <label class="seed-field-label" title="${f.hint}">${f.label}</label>
        <span
          class="seed-field-value"
          contenteditable="true"
          spellcheck="false"
          data-placeholder="${f.placeholder}"
          data-field-key="${f.key}"
          aria-label="${f.label}"
          role="textbox"
          aria-multiline="true"
        ></span>
      </div>
    `).join('');
  }

  /** Load from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      this.values = saved.values || {};

      // Populate field elements
      this.el.querySelectorAll('.seed-field-value').forEach(el => {
        const key = el.dataset.fieldKey;
        if (key && this.values[key]) {
          el.textContent = this.values[key];
          const fieldEl = el.closest('.seed-field');
          if (fieldEl) fieldEl.setAttribute('data-filled', '');
        }
      });

      // Restore year if saved
      if (saved.year) {
        const yearEl = this.el.querySelector('.seed-card-year');
        if (yearEl) yearEl.textContent = saved.year;
      }

      this._update();
    } catch {
      // ignore parse errors
    }
  }

  /** Persist to localStorage */
  _save() {
    const yearEl = this.el.querySelector('.seed-card-year');
    const year = yearEl ? yearEl.textContent.trim() : '';
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        values: this.values,
        year,
        template: this.templateKey,
        savedAt: Date.now(),
      }));
      this._showSaveStatus('saved');
    } catch {
      this._showSaveStatus('!');
    }
  }

  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._save(), SAVE_DEBOUNCE);
  }
}

/** Initialize all .seed-card elements on the page */
export function initSeedCards() {
  document.querySelectorAll('.seed-card[data-seed-card]').forEach(el => {
    new SeedCard(el);
  });
}
