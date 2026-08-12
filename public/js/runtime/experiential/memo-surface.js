/**
 * Transient memo presentation. Prefers a roomy in-frame surface next to the
 * handle and falls back to the header memo when the frame has no room.
 */

const MEMO_TIMEOUT_MS = 2600;
const ROOMY_WIDTH_PX = 704;

function findRoomyMemoTarget(target) {
  const frame =
    target.closest('.site-frame')
    || target.closest('.frame-card, .frame-panel, .mode-panel');

  if (!frame) return null;
  if (frame.clientWidth < ROOMY_WIDTH_PX) return null;

  return frame.querySelector('.frame-topline, .frame-heading') || frame;
}

function ensureLocalMemo(root) {
  let memo = root.querySelector(':scope > .spw-context-memo');
  if (!memo) {
    memo = document.createElement('div');
    memo.className = 'spw-context-memo';
    memo.setAttribute('aria-live', 'polite');
    memo.hidden = true;
    root.appendChild(memo);
  }
  return memo;
}

/**
 * Each presenter owns one timeout, so two consumers do not clear each other.
 */
export function createMemoPresenter(options = {}) {
  let lastMemoTimeout = null;

  return function presentMemo(meta, text) {
    if (!text) return;

    const roomTarget = findRoomyMemoTarget(meta.target);
    if (roomTarget) {
      const memo = ensureLocalMemo(roomTarget);
      memo.textContent = text;
      memo.hidden = false;
      roomTarget.dataset.spwMemoWonder = meta.wonder;
      clearTimeout(lastMemoTimeout);
      lastMemoTimeout = window.setTimeout(() => {
        memo.hidden = true;
        delete roomTarget.dataset.spwMemoWonder;
      }, MEMO_TIMEOUT_MS);
      return;
    }

    const headerMemo = options.getHeaderMemo?.() || null;
    if (!headerMemo) return;

    headerMemo.textContent = text;
    headerMemo.hidden = false;
    clearTimeout(lastMemoTimeout);
    lastMemoTimeout = window.setTimeout(() => {
      headerMemo.hidden = true;
    }, MEMO_TIMEOUT_MS);
  };
}
