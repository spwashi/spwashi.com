/**
 * Spw Copy — unified clipboard primitive
 *
 * Single transport contract for all copy operations across the site.
 * Never shows success before the promise resolves.
 * Never hides failure — falls back to text selection instead.
 *
 * Usage:
 *   import { copyWithFallback, handleCopyButton } from './spw-copy.js';
 *
 *   await copyWithFallback(text);
 *
 *   handleCopyButton({ text, button, statusNode, selectableNode });
 */

import { bus } from './spw-bus.js';

/**
 * Copy text to clipboard.
 * Falls back to document.execCommand('copy') via hidden textarea.
 * Throws if both paths fail.
 */
export async function copyWithFallback(text) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return { ok: true, mode: 'clipboard' };
    }

    const fallback = document.createElement('textarea');
    fallback.value = text;
    fallback.readOnly = true;
    fallback.setAttribute('aria-hidden', 'true');
    fallback.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none';
    document.body.appendChild(fallback);
    fallback.focus();
    fallback.select();

    const copied = document.execCommand('copy');
    document.body.removeChild(fallback);

    if (!copied) throw new Error('copy unavailable');
    return { ok: true, mode: 'execCommand' };
}

/**
 * Select content of a node for manual copy (tap + hold on mobile).
 */
export function selectForManualCopy(node) {
    if (!node) return;
    if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
        node.focus();
        node.select();
        return;
    }
    try {
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
    } catch (_) {
        // Selection not available in this context
    }
}

const RESET_DELAY_MS = 2200;

/**
 * Manage a copy button's full interaction lifecycle.
 * Shows a loading state while the promise runs.
 * Shows success or failure inline — never speculatively.
 *
 * Options:
 *   text           — string to copy
 *   button         — the button element (optional)
 *   statusNode     — inline status text node (optional)
 *   selectableNode — node to select on failure (optional)
 *   labelCopied    — success label override (default: '✓ copied')
 *   labelFailed    — failure label override (default: '! copy — tap + hold')
 *   labelDefault   — resting label (default: current button text)
 */
export async function handleCopyButton({
    text,
    button,
    statusNode,
    selectableNode,
    labelCopied  = '✓ copied',
    labelFailed  = '! tap + hold to copy',
    labelDefault = null
}) {
    const originalLabel = labelDefault ?? button?.textContent ?? '';

    button?.setAttribute('aria-busy', 'true');
    button?.setAttribute('aria-disabled', 'true');

    try {
        await copyWithFallback(text);

        if (button) button.textContent = labelCopied;
        if (statusNode) statusNode.textContent = 'Copied.';

        bus.emit('copy:succeeded', { text: text.slice(0, 80) });

        setTimeout(() => {
            if (button) button.textContent = originalLabel;
            if (statusNode) statusNode.textContent = '';
        }, RESET_DELAY_MS);
    } catch (error) {
        if (button) button.textContent = labelFailed;
        if (statusNode) statusNode.textContent = 'Copy unavailable — tap and hold to copy.';

        selectForManualCopy(selectableNode ?? button);
        bus.emit('copy:failed', { reason: error?.message });

        setTimeout(() => {
            if (button) button.textContent = originalLabel;
            if (statusNode) statusNode.textContent = '';
        }, RESET_DELAY_MS * 1.5);
    } finally {
        button?.removeAttribute('aria-busy');
        button?.removeAttribute('aria-disabled');
    }
}
