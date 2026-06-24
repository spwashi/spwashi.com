import { REGION_SELECTOR } from '/public/js/kernel/dom-contracts.js';
import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';

const RAIL_ATTR = 'data-spw-page-region-rail-root';
const MIN_REGIONS = 2;

const REGION_SIGILS = Object.freeze({
  hook: '⌁',
  frame: '#>',
  panel: '▣',
  surface: '◫',
  lens: '◇',
  metric: '◎',
  card: '▢',
  tune: '~',
});

function readableToken(value = '', fallback = '') {
  const text = String(value || fallback || '').trim();
  if (!text) return '';
  return text
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 44);
}

function regionLabel(node) {
  const heading = node.querySelector(':scope > .frame-heading h1, :scope > .frame-heading h2, :scope > .frame-topline + h1, :scope > h1, :scope > h2, :scope > header h1, :scope > header h2');
  const text = heading?.textContent?.trim();
  if (text) return text.replace(/\s+/g, ' ').slice(0, 56);
  if (node.id) return node.id.replace(/-/g, ' ');
  const kind = node.getAttribute('data-spw-kind') || 'region';
  return kind;
}

function regionSigil(node) {
  if (node.getAttribute('data-spw-affordance') === 'tune') return REGION_SIGILS.tune;
  const kind = node.getAttribute('data-spw-kind') || 'frame';
  return REGION_SIGILS[kind] || '·';
}

function regionMeta(node) {
  const parts = [
    readableToken(node.dataset.spwRegionRole),
    readableToken(node.dataset.spwRole),
    readableToken(node.dataset.spwFeature),
  ].filter(Boolean);
  return [...new Set(parts)].slice(0, 2).join(' · ');
}

function regionComponentSummary(node) {
  const features = [...node.querySelectorAll('[data-spw-feature]')]
    .map((child) => readableToken(child.dataset.spwFeature))
    .filter(Boolean);
  const kinds = [...node.querySelectorAll('[data-spw-kind], [data-spw-component-kind]')]
    .map((child) => readableToken(child.dataset.spwKind || child.dataset.spwComponentKind))
    .filter(Boolean)
    .filter((kind) => kind !== 'frame');
  const names = [...new Set([...features, ...kinds])].slice(0, 3);
  return names.join(' · ');
}

function collectRegions(root = document) {
  const main = root.querySelector('main');
  if (!main) return [];

  const nodes = [...main.querySelectorAll(REGION_SELECTOR)]
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => {
      if (!node.id) return false;
      const nested = node.parentElement?.closest(REGION_SELECTOR);
      return !(nested instanceof HTMLElement && main.contains(nested));
    });

  return nodes.map((node) => ({
    id: node.id,
    label: regionLabel(node),
    sigil: regionSigil(node),
    meta: regionMeta(node),
    componentSummary: regionComponentSummary(node),
    tune: node.getAttribute('data-spw-affordance') === 'tune',
    element: node,
  }));
}

function ensureRailRoot() {
  let rail = document.querySelector(`[${RAIL_ATTR}]`);
  if (rail) return rail;

  rail = document.createElement('nav');
  rail.className = 'spw-page-region-rail';
  rail.setAttribute(RAIL_ATTR, '');
  rail.setAttribute('aria-label', 'Page regions');
  document.body.append(rail);
  return rail;
}

function renderRail(regions) {
  const rail = ensureRailRoot();
  rail.replaceChildren();
  rail.dataset.spwThemePack = document.documentElement.dataset.spwThemePack || 'route';
  rail.dataset.spwPaletteResonance = document.documentElement.dataset.spwPaletteResonance || 'route';
  rail.dataset.spwSemanticDensity = document.documentElement.dataset.spwSemanticDensity || 'normal';

  if (regions.length < MIN_REGIONS) {
    writeDatasetValues(document.documentElement, { spwPageRegionRail: null });
    rail.hidden = true;
    return null;
  }

  const kicker = document.createElement('p');
  kicker.className = 'spw-page-region-rail__kicker';
  kicker.textContent = 'Regions';

  const list = document.createElement('ul');
  list.className = 'spw-page-region-rail__list';

  regions.forEach((region) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'spw-page-region-rail__link';
    link.href = `#${region.id}`;
    if (region.tune) link.dataset.spwAffordance = 'tune';
    if (region.meta) link.dataset.spwRegionMeta = region.meta;
    if (region.componentSummary) link.dataset.spwAccentConcept = region.componentSummary;

    const sigil = document.createElement('span');
    sigil.className = 'spw-page-region-rail__sigil';
    sigil.setAttribute('aria-hidden', 'true');
    sigil.textContent = region.sigil;

    const label = document.createElement('span');
    label.className = 'spw-page-region-rail__label';
    const name = document.createElement('span');
    name.className = 'spw-page-region-rail__name';
    name.textContent = region.label;
    label.append(name);

    if (region.meta || region.componentSummary) {
      const meta = document.createElement('span');
      meta.className = 'spw-page-region-rail__meta';
      meta.textContent = region.componentSummary || region.meta;
      label.append(meta);
    }

    link.append(sigil, label);
    link.title = [region.label, region.meta, region.componentSummary].filter(Boolean).join(' — ');
    item.append(link);
    list.append(item);
  });

  rail.append(kicker, list);
  rail.hidden = false;
  writeDatasetValues(document.documentElement, { spwPageRegionRail: 'on' });
  return rail;
}

function bindActiveRegion(regions, rail) {
  if (!regions.length || !rail) return () => {};

  const links = [...rail.querySelectorAll('.spw-page-region-rail__link')];
  const linkById = new Map(regions.map((region, index) => [region.id, links[index]]));

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

    if (!visible.length) return;

    const id = visible[0].target.id;
    links.forEach((link) => {
      link.dataset.spwRegionActive = link.getAttribute('href') === `#${id}` ? 'true' : 'false';
    });
  }, {
    root: null,
    rootMargin: '-20% 0px -55% 0px',
    threshold: [0, 0.12, 0.35, 0.6],
  });

  regions.forEach((region) => {
    if (region.element) observer.observe(region.element);
  });

  return () => observer.disconnect();
}

let activeCleanup = () => {};

export function refreshPageRegionRail(root = document) {
  activeCleanup();
  activeCleanup = () => {};

  const regions = collectRegions(root);
  const rail = renderRail(regions);
  if (rail) {
    activeCleanup = bindActiveRegion(regions, rail);
  } else {
    document.querySelector(`[${RAIL_ATTR}]`)?.remove();
  }

  return { count: regions.length, regions };
}

export function initPageRegionRail(ctx = null) {
  const unregister = registerDomSyncTask('page-region-rail', () => refreshPageRegionRail(), ctx);
  ctx?.addCleanup?.(unregister);

  const cleanup = () => {
    unregister();
    activeCleanup();
    activeCleanup = () => {};
    document.querySelector(`[${RAIL_ATTR}]`)?.remove();
    writeDatasetValues(document.documentElement, { spwPageRegionRail: null });
  };

  ctx?.addCleanup?.(cleanup);

  return {
    cleanup,
    refresh: () => refreshPageRegionRail(),
  };
}
