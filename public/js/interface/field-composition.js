/** Deliberate cauldron-to-field handoff. Field contents never enter shared memory. */
export const TEXT_FIELD_SELECTOR = 'textarea, input:not([type]), input[type="text"]';

export function canCompose(field) {
  if (!field?.matches?.(TEXT_FIELD_SELECTOR) || field.readOnly || field.matches(':disabled')) return false;
  if (field.closest('[inert], [hidden], dialog, [data-spw-floating-chrome]')) return false;
  const purpose = `${field.autocomplete || ''} ${field.name || ''} ${field.id || ''}`;
  return !/password|one-time-code|username|email|cc-|credit|token|secret|api[-_]?key/i.test(purpose);
}

export function planInsertion(value, text, start, end, mode, maxLength = -1) {
  const insertion = String(text || '');
  const from = mode === 'append' ? value.length : Math.max(0, Math.min(start, value.length));
  const to = mode === 'append' ? value.length : Math.max(from, Math.min(end, value.length));
  const separator = mode === 'append' && value && !/\s$/.test(value) ? '\n' : '';
  const inserted = separator + insertion;
  const next = value.slice(0, from) + inserted + value.slice(to);
  return { next, from, to, inserted, caret: from + inserted.length, fits: maxLength < 0 || next.length <= maxLength };
}

export function ingredientText(ingredient, format = 'words') {
  const candidates = format === 'expression'
    ? [ingredient.expression, ingredient.label, ingredient.text]
    : [ingredient.text, ingredient.label, ingredient.operand, ingredient.expression];
  return candidates.find(value => typeof value === 'string' && value.trim())?.trim() || '';
}

export function mount(ctxOrRoot, rootArg) {
  const root = rootArg instanceof Element ? rootArg : (ctxOrRoot instanceof Element ? ctxOrRoot : document.querySelector('main'));
  if (!root) return () => {};
  const abort = new AbortController();
  const on = (el, type, fn) => el.addEventListener(type, fn, { signal: abort.signal });
  const toolbar = document.createElement('div');
  toolbar.className = 'spw-field-tools';
  toolbar.setAttribute('role', 'group');
  toolbar.setAttribute('aria-label', 'Writing tools');
  toolbar.innerHTML = '<button type="button" class="spw-chip">From cauldron</button><button type="button" class="spw-chip" hidden>Undo insertion</button><output></output><span role="status"></span>';
  const [openButton, undoButton] = toolbar.querySelectorAll('button');
  const count = toolbar.querySelector('output');
  const status = toolbar.querySelector('[role="status"]');
  const dialog = document.createElement('dialog');
  dialog.className = 'spw-field-picker';
  dialog.setAttribute('aria-label', 'Populate from cauldron');
  dialog.innerHTML = `
    <h2>From your cauldron</h2>
    <p class="spw-field-destination"></p>
    <p>Choose a gathered fragment and review it here. This does not add your writing to the cauldron. Your form keeps its usual save behavior.</p>
    <label>Gathered fragment <select class="spw-field-source"></select></label>
    <label>Use as <select class="spw-field-format"><option value="words">Words</option><option value="expression">Spw expression</option></select></label>
    <label>Preview <textarea class="spw-field-preview" rows="5" readonly></textarea></label>
    <p class="spw-field-message" role="status"></p>
    <div class="spw-field-actions"><button type="button" class="spw-chip">Insert at cursor</button><button type="button" class="spw-chip">Append</button><button type="button" class="spw-chip">Cancel</button></div>`;
  document.body.append(dialog);
  const source = dialog.querySelector('.spw-field-source');
  const format = dialog.querySelector('.spw-field-format');
  const preview = dialog.querySelector('.spw-field-preview');
  const message = dialog.querySelector('.spw-field-message');
  const [insertButton, appendButton, cancelButton] = dialog.querySelectorAll('button');
  let target = null;
  let selection = { start: 0, end: 0, value: '' };
  let ingredients = [];
  let undo = null;
  let opening = false;

  const syncTools = () => {
    if (!target) return;
    count.textContent = target.maxLength >= 0 ? `${target.value.length} / ${target.maxLength}` : '';
    undoButton.hidden = !undo || undo.field !== target || undo.after !== target.value;
  };
  const rememberSelection = () => {
    if (target) selection = { start: target.selectionStart ?? target.value.length, end: target.selectionEnd ?? target.value.length, value: target.value };
  };
  const attach = field => {
    if (!canCompose(field) || !root.contains(field)) return;
    if (target !== field) status.textContent = '';
    target = field;
    const anchor = field.closest('label') || field;
    if (anchor.nextElementSibling !== toolbar) anchor.after(toolbar);
    toolbar.hidden = false;
    rememberSelection();
    syncTools();
  };
  const updatePreview = () => {
    preview.value = ingredientText(ingredients[Number(source.value)] || {}, format.value);
    const empty = !preview.value;
    insertButton.disabled = empty;
    appendButton.disabled = empty;
    message.textContent = empty ? 'Your cauldron has no usable fragments yet. Gather a page fragment with the cauldron, then return to this field.' : '';
  };
  // Listen on document rather than only the module root: visible modules are
  // mounted after the field may already hold focus, and form builders can move
  // controls between local wrappers while they are being edited.
  on(document, 'focusin', event => {
    if (root.contains(event.target)) attach(event.target);
  });
  document.addEventListener('focus', event => {
    if (root.contains(event.target)) attach(event.target);
  }, { capture: true, signal: abort.signal });
  on(document, 'pointerdown', event => {
    if (root.contains(event.target)) attach(event.target);
  });
  on(root, 'focusout', event => { if (event.target === target) rememberSelection(); });
  on(root, 'input', event => { if (event.target === target) syncTools(); });
  on(root, 'keyup', event => { if (event.target === target) rememberSelection(); });
  on(root, 'pointerup', event => { if (event.target === target) rememberSelection(); });
  on(document, 'focusin', event => {
    if (!dialog.open && event.target !== target && !toolbar.contains(event.target)) toolbar.hidden = true;
  });
  on(openButton, 'pointerdown', rememberSelection);
  on(openButton, 'click', async () => {
    if (opening || !target || !canCompose(target)) return;
    opening = true;
    const field = target;
    openButton.disabled = true;
    try {
      const { getCauldron } = await import('/public/js/semantic/cauldron/storage.js');
      if (abort.signal.aborted || target !== field || !field.isConnected || !canCompose(field)) return;
      ingredients = getCauldron().filter(item => ingredientText(item));
      source.replaceChildren();
      ingredients.forEach((item, index) => source.add(new Option(ingredientText(item).slice(0, 100), String(index))));
      source.disabled = !ingredients.length;
      format.value = 'words';
      dialog.querySelector('.spw-field-destination').textContent = `For: ${field.labels?.[0]?.textContent.trim() || field.getAttribute('aria-label') || field.placeholder || 'this field'}`;
      insertButton.textContent = selection.start !== selection.end ? 'Replace selected text' : 'Insert at cursor';
      updatePreview();
      dialog.showModal();
    } catch {
      status.textContent = 'Could not open the cauldron. Your writing is unchanged.';
    } finally {
      opening = false;
      openButton.disabled = false;
    }
  });
  on(source, 'change', updatePreview);
  on(format, 'change', updatePreview);
  const close = () => { dialog.close(); if (target?.isConnected) target.focus({ preventScroll: true }); };
  on(cancelButton, 'click', close);
  on(dialog, 'cancel', event => { event.preventDefault(); close(); });
  const insert = mode => {
    if (!target?.isConnected || !canCompose(target) || !preview.value) return;
    if (target.value !== selection.value) { message.textContent = 'This field changed while the picker was open. Cancel and reopen it to keep those changes.'; return; }
    const text = target instanceof HTMLInputElement ? preview.value.replace(/[\r\n]+/g, ' ') : preview.value;
    const plan = planInsertion(target.value, text, selection.start, selection.end, mode, target.maxLength);
    // Single-line inputs must not acquire a newline from the append separator.
    if (target instanceof HTMLInputElement) {
      plan.next = plan.next.replace(/[\r\n]+/g, ' ');
      plan.inserted = plan.inserted.replace(/[\r\n]+/g, ' ');
    }
    if (!plan.fits) { message.textContent = `This would exceed the field's ${target.maxLength}-character limit. Choose a shorter fragment; nothing has changed.`; return; }
    if (!target.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: plan.inserted }))) return;
    const before = target.value;
    target.setRangeText(plan.inserted, plan.from, plan.to, 'end');
    undo = { field: target, before, after: target.value, start: selection.start, end: selection.end };
    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: plan.inserted }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    close();
    status.textContent = 'Inserted from cauldron.';
    syncTools();
  };
  on(insertButton, 'click', () => insert('insert'));
  on(appendButton, 'click', () => insert('append'));
  on(undoButton, 'click', () => {
    if (!undo || undo.field !== target || undo.after !== target.value || !canCompose(target)) return;
    if (!target.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'historyUndo' }))) return;
    const last = undo;
    undo = null;
    target.value = last.before;
    target.setSelectionRange(last.start, last.end);
    target.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'historyUndo' }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    target.focus({ preventScroll: true });
    status.textContent = 'Insertion undone.';
    syncTools();
  });
  queueMicrotask(() => attach(document.activeElement));
  return () => { abort.abort(); dialog.remove(); toolbar.remove(); target = null; undo = null; };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'field-composition', mount,
  describes: 'field[write]{cauldron.preview.insert.undo}',
  timingArc: 'visible-enhancement', effectScope: 'local-dom',
});
