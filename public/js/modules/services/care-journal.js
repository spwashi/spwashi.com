/** Private, explicitly saved journal. No shared prompt memory or network calls. */
export const STORAGE_KEY = 'spw:care-journal:v1';
const TEXT_FIELDS = ['title', 'moment', 'return', 'image', 'detail', 'change', 'keep', 'setting', 'figure', 'action'];
const COLORS = { background: '#233b46', ground: '#6b8374', accent: '#e4bb79' };
const FIELDS = [...TEXT_FIELDS, ...Object.keys(COLORS)];

export function normalizeEntry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid entry');
  const entry = {};
  for (const key of TEXT_FIELDS) entry[key] = typeof value[key] === 'string' ? value[key].slice(0, 12000) : '';
  for (const [key, fallback] of Object.entries(COLORS)) {
    entry[key] = /^#[0-9a-f]{6}$/i.test(value[key]) ? value[key] : fallback;
  }
  entry.id = typeof value.id === 'string' ? value.id.slice(0, 100) : '';
  entry.updated = typeof value.updated === 'string' ? value.updated.slice(0, 40) : '';
  return entry;
}

export function readJournal(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.entries) || data.entries.length > 500) throw new Error('Invalid journal');
  const entries = data.entries.map(normalizeEntry);
  if (entries.some(entry => !entry.id) || new Set(entries.map(entry => entry.id)).size !== entries.length) throw new Error('Invalid entry IDs');
  return entries;
}

export function imagePrompt(entry) {
  const labels = { image: 'Image', detail: '  Detail', change: '    Another possibility', keep: '    Keep', setting: 'Setting', figure: 'Figure or object', action: 'Action' };
  const lines = Object.entries(labels).filter(([key]) => entry[key]?.trim()).map(([key, label]) => `${label}: ${entry[key].trim()}`);
  if (!lines.length) return '';
  return [...lines, `Colors: background ${entry.background}; ground ${entry.ground}; figure ${entry.accent}`].join('\n');
}

export function mount(ctxOrRoot, rootArg) {
  const root = rootArg instanceof Element ? rootArg : (ctxOrRoot instanceof Element ? ctxOrRoot : null);
  if (!root) return () => {};
  const form = root.matches('#care-journal') ? root : root.querySelector('#care-journal');
  if (!form) return;
  const byId = id => form.querySelector(`#journal-${id}`);
  const status = message => { byId('status').textContent = message; };
  const abort = new AbortController();
  const on = (el, event, fn) => el.addEventListener(event, fn, { signal: abort.signal });
  let entries = [];
  let selected = '';
  let dirty = false;
  let readable = true;
  let snapshot = null;
  try {
    snapshot = localStorage.getItem(STORAGE_KEY);
    entries = readJournal(snapshot);
  } catch {
    readable = false;
  }
  const value = () => normalizeEntry(Object.fromEntries(FIELDS.map(key => [key, byId(key).value])));
  function preview() {
    const entry = value();
    for (const key of Object.keys(COLORS)) byId(`paint-${key}`).setAttribute('fill', entry[key]);
    const scene = ['setting', 'figure', 'action'].map(key => entry[key].trim()).filter(Boolean).join(' · ');
    byId('scene-caption').textContent = scene || 'Add a setting, figure, or action to name your scene.';
    byId('scene-description').textContent = `${scene || 'A background, ground, and central figure.'} Colors: ${entry.background}, ${entry.ground}, ${entry.accent}.`;
    byId('prompt').value = imagePrompt(entry);
  }
  function list() {
    const select = byId('entries');
    select.replaceChildren(new Option('New entry', ''));
    for (const entry of entries) select.add(new Option(entry.title || entry.updated.slice(0, 10) || 'Untitled entry', entry.id));
    select.value = selected;
    byId('delete').disabled = !selected || !readable;
    byId('export').disabled = !entries.length;
    byId('save').disabled = !readable;
  }
  function load(id) {
    const entry = entries.find(item => item.id === id) || normalizeEntry({});
    selected = entry.id;
    for (const key of FIELDS) byId(key).value = entry[key];
    dirty = false;
    list();
    preview();
  }
  function persist(next) {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== snapshot) {
        status('This journal changed in another tab. Your draft is still here; copy it before reloading to see those changes.');
        return false;
      }
      const raw = next.length ? JSON.stringify({ version: 1, entries: next }) : null;
      if (raw === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, raw);
      snapshot = raw;
      entries = next;
      return true;
    } catch {
      status('Could not save to this browser. Your draft is still here; copy it before leaving. Saved entries have not been replaced.');
      return false;
    }
  }
  const mayLeave = () => !dirty || window.confirm('Discard unsaved changes to this entry?');
  on(form, 'submit', event => event.preventDefault());
  on(form, 'input', event => {
    if (!FIELDS.includes(event.target.name)) return;
    dirty = true;
    preview();
    status('Unsaved changes. Choose Save on this device to keep them.');
  });
  on(byId('save'), 'click', () => {
    const entry = value();
    if (!TEXT_FIELDS.some(key => entry[key].trim()) && Object.keys(COLORS).every(key => entry[key] === COLORS[key])) {
      status('Add a word or change a color before saving.');
      return;
    }
    if (!selected && entries.length >= 500) { status('This journal holds 500 entries. Export a backup and delete an entry before adding another.'); return; }
    entry.id = selected || crypto.randomUUID();
    entry.updated = new Date().toISOString();
    const next = [entry, ...entries.filter(item => item.id !== entry.id)];
    if (!persist(next)) return;
    selected = entry.id;
    dirty = false;
    list();
    status('Saved on this device. Nothing was sent.');
  });
  on(byId('entries'), 'change', () => {
    const next = byId('entries').value;
    if (!mayLeave()) { byId('entries').value = selected; return; }
    load(next);
    status(selected ? 'Saved entry opened. Changes are saved only when you choose Save.' : 'New unsaved entry.');
  });
  on(byId('new'), 'click', () => { if (mayLeave()) { load(''); status('New unsaved entry.'); byId('title').focus(); } });
  on(byId('delete'), 'click', () => {
    if (!selected || !window.confirm('Delete this saved entry and its current draft from this browser? Exported copies will remain.')) return;
    if (persist(entries.filter(entry => entry.id !== selected))) { load(''); status('Entry deleted from this browser.'); }
  });
  on(byId('export'), 'click', () => {
    const blob = new Blob([JSON.stringify({ version: 1, entries }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'private-journal.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`Exported saved entries only${dirty ? '; your current changes are not saved' : ''}. The file contains private writing; keep it somewhere you trust.`);
  });
  on(window, 'beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
  byId('fields').disabled = false;
  load('');
  status(readable ? 'Ready. Nothing new is saved until you choose Save on this device.' : 'Saved journal could not be read. Saving is disabled to protect existing data. You can still write and copy a draft.');
  return () => abort.abort();
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'care-journal', mount,
  describes: 'journal[entry|image|scene|color] private explicit-save notebook',
  timingArc: 'visible-feature', effectScope: 'local-dom storage',
});
