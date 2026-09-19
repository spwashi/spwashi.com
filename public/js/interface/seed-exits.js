/**
 * interface/seed-exits.js
 *
 * The three ways a card leaves the page, shared by every card that
 * serializes itself as a Spw block: the folio order card, the services
 * bundle, the care profile, and whatever intake comes next.
 *
 *   copy       — the block to the clipboard (kernel/copy.js transport)
 *   download   — the block as `<name>.spw.txt`: .spw names the grammar,
 *                .txt lets every mail and chat client open it
 *   screenshot — the card's capture posture, by attribute or class,
 *                whichever the card's CSS already reads
 *
 * A button reports its own outcome in place (✓ copied / ✓ saved / ! failed)
 * and returns to its label; nothing is shown before the promise resolves.
 * `bindSeedExits` wires the three by delegated click so a card that is
 * rendered after mount still has its exits.
 */

import { copyWithFallback } from '/public/js/kernel/copy.js';

const FLASH_MS = 1800;
const REVOKE_MS = 4000;

/** Show an outcome on a button, then restore its label. */
export function flashButton(button, label, state = 'success', durationMs = FLASH_MS) {
  if (!(button instanceof HTMLElement)) return;
  if (button.dataset.seedFlashOriginal === undefined) button.dataset.seedFlashOriginal = button.textContent;
  button.textContent = label;
  button.dataset.state = state;
  window.clearTimeout(Number(button.dataset.seedFlashTimer || 0));
  const timer = window.setTimeout(() => {
    button.textContent = button.dataset.seedFlashOriginal ?? button.textContent;
    delete button.dataset.state;
    delete button.dataset.seedFlashOriginal;
    delete button.dataset.seedFlashTimer;
  }, durationMs);
  button.dataset.seedFlashTimer = String(timer);
}

/** Copy a seed block; the button, when given, reports the outcome. */
export async function copySeed(text, button = null, labels = {}) {
  try {
    await copyWithFallback(String(text));
    flashButton(button, labels.copied || '✓ copied');
    return true;
  } catch {
    flashButton(button, labels.failed || '! failed', 'fail');
    return false;
  }
}

/** Save a seed block as a text file the reader can attach or send. */
export function downloadSpwText(text, filename, button = null, labels = {}) {
  try {
    const name = String(filename || 'seed').replace(/\.spw\.txt$/i, '');
    const blob = new Blob([`${String(text).replace(/\n?$/, '\n')}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.spw.txt`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_MS);
    flashButton(button, labels.saved || '✓ saved');
    return true;
  } catch {
    flashButton(button, labels.failed || '! failed', 'fail');
    return false;
  }
}

/**
 * Toggle a card's capture posture. `hook` is the attribute or class the
 * card's CSS reads: `data-screenshot-mode` (care) or `seed-card--screenshot`
 * (seed card). The button's label follows when on/off labels are given.
 */
export function toggleScreenshotMode(card, { hook = 'data-screenshot-mode', button = null, labels = null } = {}) {
  if (!(card instanceof Element)) return false;
  const isAttribute = hook.startsWith('data-');
  const on = isAttribute ? !card.hasAttribute(hook) : !card.classList.contains(hook);
  if (isAttribute) card.toggleAttribute(hook, on);
  else card.classList.toggle(hook, on);
  if (button instanceof HTMLElement && labels) button.textContent = on ? labels.on : labels.off;
  return on;
}

/**
 * Wire copy / download / screenshot by delegated click on `root`.
 *
 * options.seed      () => string           the block as the card would copy it
 * options.filename  () => string           file stem (".spw.txt" is added)
 * options.card      () => Element | null   the element that takes screenshot posture
 * options.actions   { copy, download, screenshot }  selectors matched with closest()
 * options.hook      screenshot attribute or class (see toggleScreenshotMode)
 * options.labels    { copied, saved, failed, screenshotOn, screenshotOff }
 *
 * Returns the unbind function.
 */
export function bindSeedExits(root, options = {}) {
  if (!(root instanceof Element)) return () => {};
  const actions = {
    copy: '[data-action="copy"]',
    download: '[data-action="download"]',
    screenshot: '[data-action="screenshot"]',
    ...(options.actions || {}),
  };
  const labels = options.labels || {};
  const onClick = (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const copyButton = actions.copy ? target.closest(actions.copy) : null;
    if (copyButton) {
      event.preventDefault();
      void copySeed(options.seed?.() ?? '', copyButton, labels);
      return;
    }
    const downloadButton = actions.download ? target.closest(actions.download) : null;
    if (downloadButton) {
      event.preventDefault();
      downloadSpwText(options.seed?.() ?? '', options.filename?.() ?? 'seed', downloadButton, labels);
      return;
    }
    const screenshotButton = actions.screenshot ? target.closest(actions.screenshot) : null;
    if (screenshotButton) {
      event.preventDefault();
      const card = options.card?.() ?? null;
      toggleScreenshotMode(card, {
        hook: options.hook || 'data-screenshot-mode',
        button: screenshotButton,
        labels: labels.screenshotOn ? { on: labels.screenshotOn, off: labels.screenshotOff } : null,
      });
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

export const SPW_SEED_EXITS_CONTRACT = Object.freeze({
  id: 'seed-exits',
  describes: 'seed[copy|download|screenshot]{exits} one block leaves as clipboard text, a .spw.txt file, or a capture posture',
  transport: 'kernel/copy.js copyWithFallback · Blob + <a download> · attribute or class hook',
  consumers: ['modules/cards/seed-card.js', 'modules/services/bundle-composer.js', 'modules/services/care-intake.js'],
});
