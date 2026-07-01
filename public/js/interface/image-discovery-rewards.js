import { cleanText } from '/public/js/kernel/feed-utils.js';

const FIGURE_SELECTOR = '[data-spw-image-reward], [data-spw-image-discovery]';
const STORAGE_KEY = 'spw-image-discovery-rewards';
const REWARD_EVENT = 'spw:discovery-reward';

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readSeen() {
  try {
    return safeParse(sessionStorage.getItem(STORAGE_KEY), {});
  } catch {
    return {};
  }
}

function writeSeen(next) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Session storage is optional; rewards still work without persistence.
  }
}

function figureKey(figure) {
  return cleanText(
    figure.dataset.spwImageReward
    || figure.dataset.spwImageDiscovery
    || figure.dataset.spwImageKey
    || figure.dataset.spwSeed
    || figure.id
    || figure.querySelector('img')?.getAttribute('src')
    || 'image-discovery'
  );
}

function textFromFigure(figure, selector) {
  return cleanText(figure.querySelector(selector)?.textContent || '');
}

function rewardPayload(figure) {
  const key = figureKey(figure);
  const caption = textFromFigure(figure, 'figcaption');
  const strong = textFromFigure(figure, 'figcaption strong');
  const img = figure.querySelector('img');
  const routePath = `${window.location.pathname}${figure.id ? `#${figure.id}` : ''}`;

  return {
    id: key,
    source: 'image-discovery',
    label: cleanText(figure.dataset.spwDiscoveryLabel || 'Image discovery'),
    title: cleanText(figure.dataset.spwDiscoveryTitle || strong || img?.alt || 'Image discovered'),
    summary: cleanText(figure.dataset.spwDiscoverySummary || caption || img?.alt || 'A visual seed is now available to inspect.'),
    href: cleanText(figure.dataset.spwDiscoveryHref || figure.querySelector('a[href]')?.getAttribute('href') || routePath),
    cta: cleanText(figure.dataset.spwDiscoveryCta || 'Open image path'),
    why: cleanText(figure.dataset.spwDiscoveryWhy || 'Image discoveries can become route memory, prompt seeds, and later collection rewards.'),
    presentation: cleanText(figure.dataset.spwDiscoveryPresentation || 'toast'),
    cadence: cleanText(figure.dataset.spwDiscoveryCadence || 'reward'),
    cadenceDay: cleanText(figure.dataset.spwDiscoveryDay || ''),
    cadenceMotion: cleanText(figure.dataset.spwDiscoveryMotion || ''),
    rewardKind: cleanText(figure.dataset.spwDiscoveryReward || 'image-seed'),
    productionSeed: cleanText(figure.dataset.spwDiscoveryProduction || ''),
    promotion: {
      kind: 'image-reward',
      theme: cleanText(figure.dataset.spwDiscoveryTheme || 'signal'),
      handles: cleanText(figure.dataset.spwDiscoveryHandles || '')
        .split(/\s+/)
        .filter(Boolean),
    },
  };
}

function markDiscovered(figure, seen) {
  const key = figureKey(figure);
  if (!key || seen[key]) return;

  seen[key] = Date.now();
  writeSeen(seen);
  figure.dataset.spwImageDiscovered = 'true';
  figure.dataset.spwImageInteractionState = 'discovered';

  document.dispatchEvent(new CustomEvent(REWARD_EVENT, {
    detail: rewardPayload(figure),
    bubbles: true,
  }));
}

function primeFigure(figure) {
  figure.dataset.spwImageDiscoveryState = 'ready';
  if (!figure.hasAttribute('tabindex')) figure.setAttribute('tabindex', '0');
  if (!figure.getAttribute('aria-label')) {
    const title = cleanText(figure.dataset.spwDiscoveryTitle || textFromFigure(figure, 'figcaption strong'));
    if (title) figure.setAttribute('aria-label', `Discover image reward: ${title}`);
  }
}

export function initImageDiscoveryRewards(root = document) {
  const figures = [...root.querySelectorAll(FIGURE_SELECTOR)]
    .filter((figure) => figure instanceof HTMLElement);
  if (!figures.length) return () => {};

  const seen = readSeen();
  const controller = new AbortController();
  figures.forEach(primeFigure);

  const reveal = (figure) => markDiscovered(figure, seen);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: [0.5, 0.75] });

    figures.forEach((figure) => observer.observe(figure));
    controller.signal.addEventListener('abort', () => observer.disconnect(), { once: true });
  }

  figures.forEach((figure) => {
    figure.addEventListener('focusin', () => reveal(figure), { signal: controller.signal });
    figure.addEventListener('click', () => reveal(figure), { signal: controller.signal });
  });

  return () => controller.abort();
}
