/**
 * PWA Update Handler (Enhanced)
 *
 * Handles service worker registration, update detection, contextual install prompts
 * (including iOS Safari hint), and elegant toast notifications.
 *
 * Call `initPwaUpdateHandler()` from the site runtime. Public surface stays on
 * `window.spwPwa` (install/update prompts, dismiss, standalone helpers).
 *
 * Behavior notes:
 * • ToastManager owns toast DOM, styles, Escape dismiss, and safe-area layout
 * • Install/iOS dismissals are time-bounded (30 days), not permanent
 * • Updates only apply after explicit reload consent (`SKIP_WAITING`)
 * • Localhost can force registration with `?spw-sw-test=1`
 * • Theming uses `--pwa-toast-bg` / `--pwa-toast-text` with theme-color fallback
 */
import { annotateFloatingChromeElement } from '/public/js/kernel/dom-contracts.js';
import { shouldDisableServiceWorkerInDevelopment } from '/public/js/kernel/runtime-environment.js';

const APP_THEME_COLOR = '#1a9999';
const UPDATE_CHECK_INTERVAL = 30 * 60 * 1000;
const PROMPT_DISMISS_TTL = 30 * 24 * 60 * 60 * 1000;
const DISMISS_INSTALL_KEY = 'spw-pwa-install-dismissed';
const DISMISS_IOS_HINT_KEY = 'spw-pwa-ios-hint-dismissed';
const DEV_RELOAD_GUARD_KEY = 'spw-pwa-dev-reload-guard';

let deferredInstallPrompt = null;
let reloadOnControllerChange = false;
let initialized = false;
let latestPwaStatus = null;

const TOAST_ATTR = 'data-pwa-toast';
const noop = () => {};

// ── Global state & helpers ─────────────────────────────────────────────
const storage = {
    get(key) {
        try { return window.localStorage.getItem(key); } catch { return null; }
    },
    set(key, value) {
        try { window.localStorage.setItem(key, value); } catch {}
    },
    clear(key) {
        try { window.localStorage.removeItem(key); } catch {}
    }
};

const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

const isIosSafari = () => {
    const ua = window.navigator.userAgent;
    const isApple = /iPad|iPhone|iPod/.test(ua) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    return isApple && isSafari;
};

const promptIsDismissed = (key) => {
    const raw = storage.get(key);
    if (!raw) return false;

    // Preserve the old permanent `1` value for one final quiet period, then
    // allow the prompt to become eligible again instead of hiding it forever.
    if (raw === '1') {
        storage.set(key, String(Date.now()));
        return true;
    }

    const dismissedAt = Number.parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt) || Date.now() - dismissedAt >= PROMPT_DISMISS_TTL) {
        storage.clear(key);
        return false;
    }

    return true;
};

const rememberPromptDismissal = (key) => storage.set(key, String(Date.now()));

// ── ToastManager ───────────────────────────────────────────────────────
class ToastManager {
    constructor() {
        this.current = null;
        this.keyListener = null;
        this.ensureStyles();
    }

    ensureStyles() {
        if (document.querySelector('style[data-pwa-toast-styles]')) return;

        const style = document.createElement('style');
        style.setAttribute('data-pwa-toast-styles', '');
        style.textContent = `
            @keyframes pwaToastSlideUp {
                from { opacity: 0; transform: translateY(0.75rem); }
                to   { opacity: 1; transform: translateY(0); }
            }

            [${TOAST_ATTR}] {
                position: fixed;
                right: max(1rem, env(safe-area-inset-right));
                bottom: max(1rem, env(safe-area-inset-bottom));
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 0.9rem;
                width: min(28rem, calc(100vw - 2rem));
                max-width: calc(100vw - 2rem);
                padding: 1rem 1.1rem;
                box-sizing: border-box;
                border-radius: 0.8rem;
                background: var(--pwa-toast-bg, ${APP_THEME_COLOR});
                color: var(--pwa-toast-text, #ffffff);
                box-shadow: 0 10px 28px rgba(14, 18, 20, 0.18);
                font-family: 'JetBrains Mono', monospace;
                font-size: 0.9rem;
                line-height: 1.5;
                overflow-wrap: anywhere;
                animation: pwaToastSlideUp 220ms cubic-bezier(0.4, 0, 0.2, 1);
            }

            [${TOAST_ATTR}] > span {
                flex: 1 1 14rem;
                min-width: 0;
            }

            [${TOAST_ATTR}] button {
                padding: 0.45rem 0.8rem;
                min-height: var(--touch-target-min, 2.75rem);
                border-radius: 0.45rem;
                border: 1px solid rgba(255,255,255,0.35);
                background: rgba(255,255,255,0.18);
                color: inherit;
                font-family: inherit;
                font-size: 0.82rem;
                cursor: pointer;
                white-space: nowrap;
                transition: background-color 0.2s ease, transform 0.2s ease;
            }

            [${TOAST_ATTR}] button:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-1px);
            }

            [${TOAST_ATTR}] button[data-secondary] {
                background: transparent;
            }

            @media (max-width: 30rem) {
                [${TOAST_ATTR}] > span {
                    flex-basis: 100%;
                }
            }

            @media (prefers-reduced-motion: reduce) {
                [${TOAST_ATTR}],
                [${TOAST_ATTR}] button {
                    animation: none;
                    transition: none;
                    transform: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    show({
        kind,
        message,
        actionLabel,
        action,
        dismissLabel = 'Close',
        dismiss
    }) {
        // Prevent duplicate toasts of the same kind
        if (this.current && this.current.getAttribute(TOAST_ATTR) === kind) {
            return this.current;
        }

        // Remove any existing toast (different kind)
        if (this.current) {
            this.current.remove();
            this.current = null;
        }

        const toast = document.createElement('div');
        toast.setAttribute(TOAST_ATTR, kind);
        annotateFloatingChromeElement(toast, {
            role: 'pwa-status',
            tier: 'toast',
            mutator: 'pwa-update-handler',
            reason: `${kind}-toast`,
            stylingAxis: 'pwa-toast',
        });
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.style.cssText = ''; // styles are now in global <style>

        // Message
        const msg = document.createElement('span');
        msg.textContent = message;
        toast.appendChild(msg);

        // Action button (if any)
        if (actionLabel && typeof action === 'function') {
            const btn = this.createButton(actionLabel);
            btn.addEventListener('click', () => {
                action();
                this.dismiss();
            });
            toast.appendChild(btn);
        }

        // Dismiss button
        const dismissBtn = this.createButton(dismissLabel, true);
        dismissBtn.setAttribute('aria-label', `Dismiss ${kind} notification`);
        dismissBtn.addEventListener('click', () => {
            if (typeof dismiss === 'function') dismiss();
            this.dismiss();
        });
        toast.appendChild(dismissBtn);

        document.body.appendChild(toast);
        this.current = toast;

        // Keyboard support (Escape)
        this.attachKeyboardDismiss();

        return toast;
    }

    createButton(label, secondary = false) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        if (secondary) btn.setAttribute('data-secondary', '');
        return btn;
    }

    attachKeyboardDismiss() {
        if (this.keyListener) return;
        this.keyListener = (e) => {
            if (e.key === 'Escape' && this.current) {
                this.dismiss();
            }
        };
        window.addEventListener('keydown', this.keyListener);
    }

    dismiss() {
        if (!this.current) return;
        this.current.remove();
        this.current = null;

        if (this.keyListener) {
            window.removeEventListener('keydown', this.keyListener);
            this.keyListener = null;
        }
    }

    remove(kind) {
        if (this.current && this.current.getAttribute(TOAST_ATTR) === kind) {
            this.dismiss();
        } else {
            document.querySelector(`[${TOAST_ATTR}="${kind}"]`)?.remove();
        }
    }
}

// Global singleton
const toastManager = new ToastManager();

// ── PWA core logic ─────────────────────────────────────────────────────
const ensurePwaHeadLinks = () => {
    const ensure = (rel, href, attrs = {}) => {
        if (document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        Object.entries(attrs).forEach(([k, v]) => link.setAttribute(k, v));
        document.head.appendChild(link);
    };

    try {
        ensure('manifest', '/manifest.webmanifest');
        ensure('apple-touch-icon', '/public/images/apple-touch-icon.png');
        ensure('icon', '/favicon.ico', { type: 'image/x-icon', sizes: 'any' });
        ensure('icon', '/public/images/icon-192.png', { sizes: '192x192', type: 'image/png' });

        // Mobile web app capable
        if (!document.head.querySelector('meta[name="mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    } catch (err) {
        console.warn('[Spw PWA] Failed to ensure head links (non-fatal)', err);
    }
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
    if (!registration?.waiting) return;
    if (toastManager.current) return; // already showing something

    toastManager.show({
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

const attachUpdateTriggers = (registration) => {
    if (!registration) return noop;

    let disposed = false;
    const trigger = () => {
        if (disposed) return;
        registration.update().catch(noop);
    };

    const onVisible = () => {
        if (document.visibilityState === 'visible') {
            trigger();
        }
    };

    window.addEventListener('online', trigger);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
        disposed = true;
        window.removeEventListener('online', trigger);
        document.removeEventListener('visibilitychange', onVisible);
    };
};

const applyPwaStatus = (status) => {
    if (!status || typeof status !== 'object') return;
    latestPwaStatus = status;

    const root = document.documentElement;
    root.dataset.spwPwaWorkerVersion = String(status.version || 'unknown');
    root.dataset.spwPwaOfflineUrl = String(status.offlineUrl || '/offline/');

    const caches = Array.isArray(status.caches) ? status.caches : [];
    const entryCount = caches.reduce((total, entry) => {
        const count = Number(entry?.count);
        return total + (Number.isFinite(count) ? count : 0);
    }, 0);
    root.dataset.spwPwaCacheCount = String(caches.length);
    root.dataset.spwPwaCacheEntries = String(entryCount);
};

const requestPwaStatus = () => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return false;
    try {
        controller.postMessage({ type: 'SPW_PWA_STATUS' });
        return true;
    } catch {
        return false;
    }
};

const wirePwaStatusMessages = () => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SPW_PWA_STATUS_RESULT') {
            applyPwaStatus(event.data.status);
        }
    });
};

const maybeShowInstallPrompt = () => {
    if (shouldDisableServiceWorkerInDevelopment()) return;
    if (!initialized) return;
    if (isStandalone()) return;
    if (toastManager.current) return;

    // Web install prompt (Android/Chrome/Edge etc.)
    if (deferredInstallPrompt && !promptIsDismissed(DISMISS_INSTALL_KEY)) {
        toastManager.show({
            kind: 'install',
            message: 'Add Spwashi to your home screen. Works offline, loads instantly.',
            actionLabel: 'Install',
            action: async () => {
                const prompt = deferredInstallPrompt;
                if (!prompt) return;
                try {
                    await prompt.prompt();
                    const choice = await prompt.userChoice;
                    if (choice.outcome === 'accepted') {
                        storage.clear(DISMISS_INSTALL_KEY);
                    }
                } catch (e) { /* noop */ }
                deferredInstallPrompt = null;
                toastManager.remove('install');
            },
            dismissLabel: 'Later',
            dismiss: () => rememberPromptDismissal(DISMISS_INSTALL_KEY)
        });
        return;
    }

    // iOS Safari hint
    if (isIosSafari() && !promptIsDismissed(DISMISS_IOS_HINT_KEY)) {
        toastManager.show({
            kind: 'install',
            message: 'Tap Share, then "Add to Home Screen" to install Spwashi.',
            dismissLabel: 'Got it',
            dismiss: () => rememberPromptDismissal(DISMISS_IOS_HINT_KEY)
        });
    }
};

const disableServiceWorkerForLocalDevelopment = async () => {
    document.documentElement.dataset.spwPwaMode = 'development';

    if (!('serviceWorker' in navigator)) return;

    const hadController = Boolean(navigator.serviceWorker.controller);

    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister().catch(noop)));
    } catch (error) {
        console.warn('[Spw PWA] Failed to unregister local service workers (non-fatal)', error);
    }

    if ('caches' in window) {
        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map((name) => caches.delete(name).catch(noop)));
        } catch (error) {
            console.warn('[Spw PWA] Failed to clear local development caches (non-fatal)', error);
        }
    }

    try {
        if (hadController && !window.sessionStorage.getItem(DEV_RELOAD_GUARD_KEY)) {
            window.sessionStorage.setItem(DEV_RELOAD_GUARD_KEY, '1');
            window.location.reload();
            return;
        }

        if (!hadController) {
            window.sessionStorage.removeItem(DEV_RELOAD_GUARD_KEY);
        }
    } catch {
        // Session storage is optional here; failure should not block local dev.
    }
};

const initPwaUpdateHandler = async () => {
    if (initialized) return;
    initialized = true;

    ensurePwaHeadLinks();

    if (shouldDisableServiceWorkerInDevelopment()) {
        await disableServiceWorkerForLocalDevelopment();
        window.spwPwa = {
            init: initPwaUpdateHandler,
            showInstallPrompt: noop,
            showUpdatePrompt: noop,
            requestStatus: () => false,
            getStatus: () => latestPwaStatus,
            dismissAll: () => toastManager.dismiss(),
            isStandalone,
            mode: 'development',
            serviceWorkerEnabled: false
        };
        return;
    }

    maybeShowInstallPrompt();

    if (!('serviceWorker' in navigator)) return;

    wirePwaStatusMessages();

    // Controller change (for skipWaiting)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!reloadOnControllerChange) return;
        reloadOnControllerChange = false;
        window.location.reload();
    });

    // Register + watch
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
            console.log('[Spw PWA] Service Worker registered successfully');
            watchServiceWorker(registration);
            maybeShowUpdatePrompt(registration);
            maybeShowInstallPrompt();
            attachUpdateTriggers(registration);
            requestPwaStatus();

            // Periodic background update check
            setInterval(() => {
                registration.update().catch(noop);
            }, UPDATE_CHECK_INTERVAL);

            registration.update().catch(noop);
        })
        .catch((err) => {
            console.warn('[Spw PWA] Service Worker registration failed (non-fatal)', err);
        });

    // Install prompt listener
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        maybeShowInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
        deferredInstallPrompt = null;
        storage.clear(DISMISS_INSTALL_KEY);
        storage.clear(DISMISS_IOS_HINT_KEY);
        toastManager.remove('install');
        console.log('[Spw PWA] App installed successfully');
    });

    // Expose for debugging / advanced usage
    window.spwPwa = {
        init: initPwaUpdateHandler,
        showInstallPrompt: maybeShowInstallPrompt,
        showUpdatePrompt: async (reg) => {
            const registration = reg || await navigator.serviceWorker?.getRegistration?.();
            return maybeShowUpdatePrompt(registration);
        },
        requestStatus: requestPwaStatus,
        getStatus: () => latestPwaStatus,
        dismissAll: () => toastManager.dismiss(),
        isStandalone,
        mode: 'production',
        serviceWorkerEnabled: true
    };
};

export { initPwaUpdateHandler };
