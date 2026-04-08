/*
 * PWA Update Handler
 * Shows a toast notification when a new version is available
 * Handles service worker lifecycle and update checking
 */

const initPwaUpdateHandler = () => {
  // Register service worker
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/public/sw.js').catch((err) => {
    console.warn('Service Worker registration failed:', err);
  });

  // Listen for update messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_AVAILABLE') {
      showUpdateToast(event.data.newVersion);
    }
  });

  // Check for updates every 10 minutes
  setInterval(() => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CHECK_UPDATE'
      });
    }
  }, 10 * 60 * 1000);

  // Initial update check on load
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CHECK_UPDATE'
    });
  }
};

const showUpdateToast = (newVersion) => {
  // Check if toast already exists
  if (document.querySelector('[data-pwa-update-toast]')) {
    return;
  }

  // Create toast container
  const toast = document.createElement('div');
  toast.setAttribute('data-pwa-update-toast', '');
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.style.cssText = `
    position: fixed;
    bottom: 1.5rem;
    right: 1.5rem;
    max-width: 24rem;
    padding: 1rem 1.25rem;
    background: var(--teal, hsl(180 100% 28%));
    color: white;
    border-radius: 0.6rem;
    box-shadow: 0 8px 24px rgba(14, 18, 20, 0.16);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: slideUp 300ms ease;
  `;

  // Add animation styles if not already present
  if (!document.querySelector('style[data-pwa-toast-animation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-pwa-toast-animation', '');
    style.textContent = `
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(1rem);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Toast content
  const message = document.createElement('span');
  message.style.flex = '1';
  message.textContent = `Update available (${newVersion})`;

  const reloadBtn = document.createElement('button');
  reloadBtn.textContent = 'Reload';
  reloadBtn.style.cssText = `
    padding: 0.5rem 0.85rem;
    background: rgba(255, 255, 255, 0.18);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 0.4rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: background 120ms ease;
  `;

  reloadBtn.addEventListener('mouseenter', () => {
    reloadBtn.style.background = 'rgba(255, 255, 255, 0.28)';
  });
  reloadBtn.addEventListener('mouseleave', () => {
    reloadBtn.style.background = 'rgba(255, 255, 255, 0.18)';
  });

  reloadBtn.addEventListener('click', () => {
    window.location.reload();
  });

  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Dismiss update notification');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    background: transparent;
    color: white;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    line-height: 1;
    opacity: 0.6;
    transition: opacity 120ms ease;
  `;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.opacity = '1';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.opacity = '0.6';
  });

  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  toast.appendChild(message);
  toast.appendChild(reloadBtn);
  toast.appendChild(closeBtn);
  document.body.appendChild(toast);

  // Auto-remove after 30 seconds
  setTimeout(() => {
    toast.remove();
  }, 30 * 1000);
};

export { initPwaUpdateHandler };
