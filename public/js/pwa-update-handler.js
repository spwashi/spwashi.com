/*
 * PWA Update Handler
 * Handles service worker registration plus contextual install/update prompts.
 */

const APP_THEME_COLOR = '#1a9999';
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;
const DISMISS_INSTALL_KEY = 'spw-pwa-install-dismissed';
const DISMISS_IOS_HINT_KEY = 'spw-pwa-ios-hint-dismissed';

let deferredInstallPrompt = null;
let reloadOnControllerChange = false;
let initialized = false;

const TOAST_ATTR = 'data-pwa-toast';

const noop = () => {};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    maybeShowInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    clearStoredValue(DISMISS_INSTALL_KEY);
    clearStoredValue(DISMISS_IOS_HINT_KEY);
    removeToast('install');
  });
}

const initPwaUpdateHandler = () => {
  if (initialized) return;
  initialized = true;

  ensurePwaHeadLinks();
  maybeShowInstallPrompt();

  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloadOnControllerChange) return;
    reloadOnControllerChange = false;
    window.location.reload();
  });

  navigator.serviceWorker.register('/sw.js').then((registration) => {
    watchServiceWorker(registration);
    maybeShowUpdatePrompt(registration);
    maybeShowInstallPrompt();

    window.setInterval(() => {
      registration.update().catch(noop);
    }, UPDATE_CHECK_INTERVAL);

    registration.update().catch(noop);
  }).catch((err) => {
    console.warn('Service Worker registration failed:', err);
  });
};

const watchServiceWorker = (registration) => {
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;

    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        maybeShowUpdatePrompt(registration);
      }
    });
  });

  if (registration.waiting) {
    maybeShowUpdatePrompt(registration);
  }
};

const maybeShowUpdatePrompt = (registration) => {
  if (!registration.waiting) return;
  if (document.querySelector(`[${TOAST_ATTR}="update"]`)) return;

  showToast({
    kind: 'update',
    message: 'A fresh version of this site is ready.',
    actionLabel: 'Reload',
    action: () => {
      const waitingWorker = registration.waiting;
      if (!waitingWorker) {
        window.location.reload();
        return;
      }

      reloadOnControllerChange = true;
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  });
};

const maybeShowInstallPrompt = () => {
  if (!initialized) return;
  if (isStandalone()) return;
  if (document.querySelector(`[${TOAST_ATTR}="update"]`)) return;

  if (deferredInstallPrompt && !getStoredValue(DISMISS_INSTALL_KEY)) {
    showToast({
      kind: 'install',
      message: 'Add Spwashi to your home screen. Works offline, loads instantly.',
      actionLabel: 'Install',
      action: async () => {
        const prompt = deferredInstallPrompt;
        if (!prompt) return;

        prompt.prompt();
        try {
          await prompt.userChoice;
        } catch (error) {
          noop(error);
        }

        deferredInstallPrompt = null;
        removeToast('install');
      },
      dismissLabel: 'Later',
      dismiss: () => {
        setStoredValue(DISMISS_INSTALL_KEY, '1');
      }
    });
    return;
  }

  if (isIosSafari() && !getStoredValue(DISMISS_IOS_HINT_KEY)) {
    showToast({
      kind: 'install',
      message: 'Tap Share, then "Add to Home Screen" to install Spwashi.',
      dismissLabel: 'Got it',
      dismiss: () => {
        setStoredValue(DISMISS_IOS_HINT_KEY, '1');
      }
    });
  }
};

const showToast = ({
  kind,
  message,
  actionLabel,
  action,
  dismissLabel = 'Close',
  dismiss
}) => {
  const existingToast = document.querySelector(`[${TOAST_ATTR}]`);
  if (existingToast?.getAttribute(TOAST_ATTR) === kind) {
    return existingToast;
  }

  if (existingToast) {
    existingToast.remove();
  }

  ensureToastStyles();

  const toast = document.createElement('div');
  toast.setAttribute(TOAST_ATTR, kind);
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.9rem;
    width: min(28rem, calc(100vw - 2rem));
    padding: 1rem 1.1rem;
    border-radius: 0.8rem;
    background: ${APP_THEME_COLOR};
    color: #ffffff;
    box-shadow: 0 10px 28px rgba(14, 18, 20, 0.18);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    z-index: 9999;
    animation: pwaToastSlideUp 220ms ease;
  `;

  const messageNode = document.createElement('span');
  messageNode.style.flex = '1';
  messageNode.textContent = message;
  toast.appendChild(messageNode);

  if (actionLabel && typeof action === 'function') {
    const actionButton = createToastButton(actionLabel);
    actionButton.addEventListener('click', () => {
      action();
    });
    toast.appendChild(actionButton);
  }

  const dismissButton = createToastButton(dismissLabel, true);
  dismissButton.setAttribute('aria-label', dismissLabel);
  dismissButton.addEventListener('click', () => {
    if (typeof dismiss === 'function') {
      dismiss();
    }
    toast.remove();
  });
  toast.appendChild(dismissButton);

  document.body.appendChild(toast);

  return toast;
};

const createToastButton = (label, isSecondary = false) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.cssText = `
    padding: 0.45rem 0.8rem;
    border-radius: 0.45rem;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: ${isSecondary ? 'transparent' : 'rgba(255, 255, 255, 0.18)'};
    color: #ffffff;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.82rem;
    cursor: pointer;
    white-space: nowrap;
  `;
  return button;
};

const ensureToastStyles = () => {
  if (document.querySelector('style[data-pwa-toast-styles]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-pwa-toast-styles', '');
  style.textContent = `
    @keyframes pwaToastSlideUp {
      from {
        opacity: 0;
        transform: translateY(0.75rem);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
};

const ensurePwaHeadLinks = () => {
  ensureHeadLink('apple-touch-icon', '/public/images/apple-touch-icon.png');
  ensureHeadLink('icon', '/favicon.ico', { sizes: '32x32' });
  ensureHeadLink('icon', '/public/images/favicon.svg', { type: 'image/svg+xml' });
  ensureHeadLink('icon', '/public/images/icon-192.png', {
    sizes: '192x192',
    type: 'image/png'
  });
  ensureMobileCapableMeta();
};

const ensureHeadLink = (rel, href, attributes = {}) => {
  if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;

  Object.entries(attributes).forEach(([name, value]) => {
    link.setAttribute(name, value);
  });

  document.head.appendChild(link);
};

const ensureMobileCapableMeta = () => {
  if (document.head.querySelector('meta[name="mobile-web-app-capable"]')) {
    return;
  }

  const meta = document.createElement('meta');
  meta.name = 'mobile-web-app-capable';
  meta.content = 'yes';
  document.head.appendChild(meta);
};

const isStandalone = () => (
  window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true
);

const isIosSafari = () => {
  const userAgent = window.navigator.userAgent;
  const isAppleMobile = /iPad|iPhone|iPod/.test(userAgent)
    || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS/.test(userAgent);
  return isAppleMobile && isSafari;
};

const getStoredValue = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
};

const setStoredValue = (key, value) => {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    noop(error);
  }
};

const clearStoredValue = (key) => {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    noop(error);
  }
};

const removeToast = (kind) => {
  document.querySelector(`[${TOAST_ATTR}="${kind}"]`)?.remove();
};

export { initPwaUpdateHandler };
