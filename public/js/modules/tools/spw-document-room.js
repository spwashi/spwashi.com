/**
 * /open/ — a local .spw file as a room.
 * Parse, read, edit, and download stay in the browser.
 */

import { parserHref } from '../../kernel/parser-link.js';
import { projectSpwRoom } from './spw-document-project.js';
import {
  MAX_DOCUMENT_BYTES,
  SHARE_CACHE,
  SHARE_PENDING,
  takeDocumentHandoff,
  takePendingDocument,
} from '../../runtime/shell/spw-document-launch.js';

const SLOT_LABELS = {
  seed: 'Seed',
  source: 'Source',
  axes: 'Axes',
  clusters: 'Clusters',
  bridges: 'Bridges',
  operators: 'Operators',
  queries: 'Queries',
};

function clear(node) {
  node?.replaceChildren();
}

function addItem(list, text) {
  const item = document.createElement('li');
  item.textContent = text;
  list.append(item);
}

function renderRoom(host, room) {
  clear(host);
  const heading = document.createElement('h2');
  heading.id = 'spw-document-title';
  heading.textContent = room.title;
  host.append(heading);

  const filled = Object.entries(room.slots).filter(([, items]) => items.length);
  const blocks = filled.length
    ? filled.map(([name, items]) => ({ name: SLOT_LABELS[name] || name, items }))
    : room.blocks.map((block) => ({ name: block.name, items: block.items }));

  if (!blocks.length) {
    const note = document.createElement('p');
    note.textContent = 'This file has no named blocks yet. Raw and Mutate still hold the source.';
    host.append(note);
    return;
  }

  for (const block of blocks) {
    const section = document.createElement('section');
    section.className = 'spw-panel';
    const label = document.createElement('h3');
    label.textContent = block.name;
    section.append(label);
    const list = document.createElement('ul');
    (block.items.length ? block.items : ['—']).forEach((item) => addItem(list, item));
    section.append(list);
    host.append(section);
  }
}

function renderGraph(host, room) {
  clear(host);
  const nodes = room.blocks.flatMap((block) => block.items.map((item) => `${block.name}: ${item}`));
  const links = room.slots.bridges.length ? room.slots.bridges : room.links;
  const nodeList = document.createElement('ul');
  (nodes.length ? nodes : ['No blocks to graph.']).forEach((item) => addItem(nodeList, item));
  host.append(nodeList);
  if (links.length) {
    const label = document.createElement('h3');
    label.textContent = 'Links';
    host.append(label);
    const list = document.createElement('ul');
    links.forEach((item) => addItem(list, item));
    host.append(list);
  }
}

async function readSharedDocument() {
  if (!('caches' in window)) return null;
  const cache = await caches.open(SHARE_CACHE);
  const pending = await cache.match(SHARE_PENDING);
  if (!pending) return null;
  await cache.delete(SHARE_PENDING);
  const source = await pending.text();
  const encoded = pending.headers.get('x-spw-name') || '';
  let name = 'shared.spw';
  try {
    name = decodeURIComponent(encoded) || name;
  } catch {
    name = encoded || name;
  }
  return { name, source };
}

function downloadDocument(name, source) {
  const blob = new Blob([source], { type: 'application/x-spw' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.toLowerCase().endsWith('.spw') ? name : `${name}.spw`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function writeHandle(handle, source) {
  if (!handle || typeof handle.createWritable !== 'function') return false;
  const writable = await handle.createWritable();
  await writable.write(source);
  await writable.close();
  return true;
}

export function initSpwDocumentRoom(ctx, root) {
  const host = root instanceof HTMLElement && root.id === 'spw-document'
    ? root
    : document.querySelector('#spw-document');
  if (!(host instanceof HTMLElement)) return;

  const status = host.querySelector('[data-document-status]');
  const roomView = host.querySelector('[data-document-room]');
  const extra = host.querySelector('[data-document-extra]');
  const editor = host.querySelector('[data-document-editor]');
  const fileInput = host.querySelector('[data-document-file]');
  const parserLink = host.querySelector('[data-document-parser]');
  const buttons = [...host.querySelectorAll('[data-document-view]')];

  let documentName = '';
  let source = '';
  let handle = null;
  let mode = 'room';

  const say = (text) => {
    if (status instanceof HTMLElement) status.textContent = text;
  };

  const show = (next) => {
    mode = next;
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.documentView === mode));
    });
    if (extra instanceof HTMLElement) extra.hidden = mode === 'room';
    if (!(editor instanceof HTMLTextAreaElement) || !(extra instanceof HTMLElement)) return;
    if (mode === 'raw' || mode === 'mutate') {
      editor.hidden = false;
      editor.readOnly = mode === 'raw';
      editor.value = source;
      extra.querySelector('[data-document-graph]')?.replaceChildren();
    } else if (mode === 'graph') {
      editor.hidden = true;
      const graph = extra.querySelector('[data-document-graph]');
      if (graph instanceof HTMLElement) renderGraph(graph, projectSpwRoom(source, documentName));
    }
  };

  const paint = () => {
    const room = projectSpwRoom(source, documentName);
    if (roomView instanceof HTMLElement) renderRoom(roomView, room);
    if (parserLink instanceof HTMLAnchorElement) {
      const href = parserHref(source, documentName);
      if (href) {
        parserLink.href = href;
        parserLink.hidden = false;
      } else {
        parserLink.hidden = true;
        parserLink.removeAttribute('href');
      }
    }
    if (mode !== 'room') show(mode);
    const problem = room.message || (room.errorCount
      ? `Parser reported ${room.errorCount} error${room.errorCount === 1 ? '' : 's'}. The source is still here.`
      : '');
    say(problem || (source
      ? `${documentName || 'Document'} stays in this browser.`
      : 'Choose a .spw file, or open one with the installed app.'));
  };

  const openDocument = ({ name = '', source: next = '', handle: nextHandle = null, error = '' } = {}) => {
    if (error) {
      say(error);
      return;
    }
    documentName = name || 'document.spw';
    source = String(next ?? '');
    handle = nextHandle;
    mode = 'room';
    show('room');
    paint();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => show(button.dataset.documentView || 'room'));
  });

  host.querySelector('[data-document-save]')?.addEventListener('click', async () => {
    if (editor instanceof HTMLTextAreaElement && mode === 'mutate') source = editor.value;
    try {
      if (await writeHandle(handle, source)) {
        say(`Saved ${documentName} back to the opened file.`);
        paint();
        return;
      }
    } catch {
      /* Fall through to a download when the handle is read-only. */
    }
    downloadDocument(documentName || 'document.spw', source);
    say('Downloaded a copy. This browser did not have a writable handle for the opened file.');
  });

  host.querySelector('[data-document-export]')?.addEventListener('click', () => {
    if (editor instanceof HTMLTextAreaElement && mode === 'mutate') source = editor.value;
    downloadDocument(documentName || 'document.spw', source);
    say(`Exported ${documentName || 'document.spw'}.`);
  });

  if (editor instanceof HTMLTextAreaElement) {
    editor.addEventListener('input', () => {
      if (mode !== 'mutate') return;
      source = editor.value;
      const room = projectSpwRoom(source, documentName);
      if (roomView instanceof HTMLElement) renderRoom(roomView, room);
    });
  }

  if (fileInput instanceof HTMLInputElement) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      fileInput.value = '';
      if (!file) return;
      const allowed = file.name.toLowerCase().endsWith('.spw')
        || file.type.toLowerCase() === 'application/x-spw';
      if (!allowed) {
        say('Choose a .spw file.');
        return;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        say('That file is larger than the 256 KiB limit for this room.');
        return;
      }
      openDocument({ name: file.name, source: await file.text() });
    });
  }

  window.addEventListener('spw-document-open', (event) => {
    openDocument(takePendingDocument() || event.detail || {});
  });

  const params = new URLSearchParams(window.location.search);
  const flagged = params.get('shared') || params.get('document');
  const flaggedMessage = {
    rejected: 'That file is not a .spw document.',
    large: 'That file is larger than the 256 KiB limit for this room.',
    empty: 'The share did not include a file.',
  }[flagged];

  const launched = takePendingDocument();
  const handoff = takeDocumentHandoff();
  if (launched?.error) say(launched.error);
  else if (launched) openDocument(launched);
  else if (handoff?.error) say(handoff.error);
  else if (handoff?.source) openDocument(handoff);
  else if (flaggedMessage && flagged !== '1') say(flaggedMessage);
  else if (!source) paint();

  if (params.get('shared') === '1') {
    readSharedDocument()
      .then((shared) => {
        if (shared?.source) openDocument(shared);
        else if (!handoff?.source) say('The shared file was already read, or this browser has no share waiting.');
      })
      .catch(() => say('The shared file could not be read from this browser.'));
  }
}
