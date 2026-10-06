/**
 * One launch consumer for installed-app .spw opens.
 * The file text stays in this tab. Nothing is uploaded.
 * The share cache name matches sw.js (spw-document-share).
 */

export const DOCUMENT_PATH = '/open/';
export const HANDOFF_KEY = 'spw.open.handoff';
export const SHARE_CACHE = 'spw-document-share';
export const SHARE_PENDING = '/share/spw-pending';
export const MAX_DOCUMENT_BYTES = 256 * 1024;

export function isSpwDocument(file) {
  const name = String(file?.name || '').toLowerCase();
  const type = String(file?.type || '').toLowerCase();
  return name.endsWith('.spw') || type === 'application/x-spw';
}

export function onDocumentRoute() {
  const path = globalThis.location?.pathname || '';
  return path === '/open' || path === DOCUMENT_PATH;
}

function stash(detail) {
  try {
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify(detail));
  } catch {
    /* Private windows can refuse storage. The room then opens empty. */
  }
}

export function takeDocumentHandoff() {
  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    sessionStorage.removeItem(HANDOFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function takePendingDocument() {
  const pending = globalThis.__spwPendingDocument || null;
  globalThis.__spwPendingDocument = null;
  return pending;
}

export function deliverDocumentLaunch(detail) {
  if (onDocumentRoute()) {
    globalThis.__spwPendingDocument = detail;
    if (typeof globalThis.dispatchEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent('spw-document-open', { detail }));
    }
    return;
  }
  stash(detail);
  globalThis.location?.assign(DOCUMENT_PATH);
}

export function installDocumentLaunchConsumer() {
  const queue = globalThis.launchQueue;
  if (!queue || typeof queue.setConsumer !== 'function') return;
  if (globalThis.__spwDocumentLaunch) return;
  globalThis.__spwDocumentLaunch = true;

  queue.setConsumer(async ({ files = [] } = {}) => {
    const handle = files[0];
    if (!handle || typeof handle.getFile !== 'function') return;
    try {
      const file = await handle.getFile();
      if (!isSpwDocument(file)) {
        deliverDocumentLaunch({ error: 'That file is not a .spw document.' });
        return;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        deliverDocumentLaunch({ error: 'That file is larger than the 256 KiB limit for this room.' });
        return;
      }
      deliverDocumentLaunch({
        name: file.name || 'document.spw',
        source: await file.text(),
        handle: onDocumentRoute() ? handle : null,
      });
    } catch (error) {
      deliverDocumentLaunch({ error: error instanceof Error ? error.message : 'The file could not be read.' });
    }
  });
}
