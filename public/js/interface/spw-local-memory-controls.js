import { bus } from '/public/js/kernel/spw-bus.js';

const ACTION_SELECTOR = '[data-spw-memory-action]';
const STATUS_TIMEOUT_MS = 2600;

function resolveStatusNode(control) {
  if (!(control instanceof Element)) return null;

  return (
    control.closest('[data-site-settings-scope], .site-footer__settings, .site-frame, section, article, aside')
      ?.querySelector('[data-spw-memory-status], [data-site-settings-status]')
    || document.querySelector('[data-spw-memory-status], [data-site-settings-status]')
  );
}

function writeStatus(node, text) {
  if (!(node instanceof HTMLElement)) return;

  node.textContent = text;

  const existing = Number(node.dataset.spwMemoryStatusTimer || 0);
  if (existing) {
    window.clearTimeout(existing);
  }

  const timer = window.setTimeout(() => {
    if (node.textContent === text) {
      node.textContent = '';
    }
    delete node.dataset.spwMemoryStatusTimer;
  }, STATUS_TIMEOUT_MS);

  node.dataset.spwMemoryStatusTimer = String(timer);
}

function handleAction(control) {
  const action = control.dataset.spwMemoryAction || '';
  const statusNode = resolveStatusNode(control);

  switch (action) {
    case 'clear-grounded':
      bus.emit('spell:reset', { source: 'local-memory-controls' }, { target: document });
      writeStatus(statusNode, 'Cleared saved visit state for this browser.');
      break;
    default:
      break;
  }
}

export function initSpwLocalMemoryControls() {
  if (document.documentElement.dataset.spwLocalMemoryControlsInit === 'true') {
    return { cleanup() {}, refresh() {} };
  }

  document.documentElement.dataset.spwLocalMemoryControlsInit = 'true';

  const onClick = (event) => {
    const control = event.target instanceof Element
      ? event.target.closest(ACTION_SELECTOR)
      : null;

    if (!(control instanceof HTMLElement)) return;

    event.preventDefault();
    handleAction(control);
  };

  document.addEventListener('click', onClick);

  return {
    cleanup() {
      document.removeEventListener('click', onClick);
      delete document.documentElement.dataset.spwLocalMemoryControlsInit;
    },
    refresh() {},
  };
}
