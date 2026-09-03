import { REGION_SELECTOR } from '/public/js/kernel/dom-contracts.js';
import { writeDatasetValues } from '/public/js/kernel/dom-contracts.js';
import { registerDomSyncTask } from '/public/js/runtime/dom-sync-hub.js';
import { collectRegions as collectRoleRegions } from '/public/js/semantic/role-inference.js';
import { observeIntersections } from '/public/js/runtime/runtime-helpers.js';
import {
  classifyRegionRelation,
  kinIds,
  pickRegionKin,
} from '/public/js/runtime/region-kin.js';

const RAIL_ATTR = 'data-spw-page-region-rail-root';
const MIN_REGIONS = 2;

const REGION_SIGILS = Object.freeze({
  hook: '⌁',
  hub: '▣',
  cluster: '▦',
  path: '→',
  read: '¶',
  wide: '◫',
  frame: '#>',
  panel: '▣',
  surface: '◫',
  lens: '◇',
  metric: '◎',
  card: '▢',
  tune: '~',
});

const KIN_ROOT_KEYS = Object.freeze({
  similar: 'spwActiveRegionSimilar',
  contrast: 'spwActiveRegionContrast',
  resonate: 'spwActiveRegionResonate',
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

function regionSeat(node) {
  return node.getAttribute('data-spw-region') || '';
}

function regionSigil(node) {
  if (node.getAttribute('data-spw-affordance') === 'tune') return REGION_SIGILS.tune;
  const seat = regionSeat(node);
  if (seat && REGION_SIGILS[seat]) return REGION_SIGILS[seat];
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

function regionOperator(node) {
  return (
    node.getAttribute('data-spw-operator')
    || node.querySelector('.frame-sigil, .frame-heading a')?.getAttribute('data-spw-operator')
    || node.getAttribute('data-spw-role')
    || 'frame'
  );
}

function regionConsequence(node) {
  return node.getAttribute('data-spw-consequence') || null;
}

function regionWonder(node) {
  return node.getAttribute('data-spw-wonder') || null;
}

function regionLens(node) {
  return node.getAttribute('data-spw-lens') || node.getAttribute('data-spw-lens-mode') || null;
}

function collectRegions(root = document) {
  const main = root.querySelector('main');
  if (!main) return [];

  const nodes = collectRoleRegions(main)
    .filter((node) => node.id)
    .filter((node) => {
      const nested = node.parentElement?.closest(REGION_SELECTOR);
      return !(nested instanceof HTMLElement && main.contains(nested));
    });

  return nodes.map((node) => ({
    id: node.id,
    label: regionLabel(node),
    sigil: regionSigil(node),
    meta: regionMeta(node),
    componentSummary: regionComponentSummary(node),
    seat: regionSeat(node),
    operator: regionOperator(node),
    expression: node.getAttribute('data-spw-semantic-expression')
      || node.querySelector('[data-spw-semantic-expression]')?.getAttribute('data-spw-semantic-expression')
      || '',
    consequence: regionConsequence(node),
    wonder: regionWonder(node),
    lens: regionLens(node),
    harmony: node.getAttribute('data-spw-harmony') || '',
    density: node.getAttribute('data-spw-density') || '',
    occupancy: node.getAttribute('data-spw-pack-occupancy') || '',
    tune: node.getAttribute('data-spw-affordance') === 'tune',
    element: node,
  }));
}

function writeActiveKin(active, regions, links) {
  const kin = pickRegionKin(active, regions);
  const ids = kinIds(kin);
  writeDatasetValues(document.documentElement, {
    [KIN_ROOT_KEYS.similar]: ids.similar || null,
    [KIN_ROOT_KEYS.contrast]: ids.contrast || null,
    [KIN_ROOT_KEYS.resonate]: ids.resonate || null,
  });

  regions.forEach((region) => {
    if (!(region.element instanceof HTMLElement)) return;
    const relations = active ? classifyRegionRelation(active, region) : [];
    if (relations.length) {
      region.element.dataset.spwRegionRelation = relations.join(' ');
    } else {
      delete region.element.dataset.spwRegionRelation;
    }
  });

  links.forEach((link) => {
    const id = (link.getAttribute('href') || '').replace(/^#/, '');
    const target = regions.find((region) => region.id === id);
    const relations = active && target ? classifyRegionRelation(active, target) : [];
    if (relations.length) {
      link.dataset.spwRegionRelation = relations.join(' ');
    } else {
      delete link.dataset.spwRegionRelation;
    }
  });
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
    writeDatasetValues(document.documentElement, {
      spwPageRegionRail: null,
      spwActiveRegionSimilar: null,
      spwActiveRegionContrast: null,
      spwActiveRegionResonate: null,
    });
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
    if (region.operator) link.dataset.spwOperator = region.operator;
    if (region.seat) link.dataset.spwRegion = region.seat;
    if (region.consequence) link.dataset.spwConsequence = region.consequence;
    if (region.wonder) link.dataset.spwWonder = region.wonder;
    if (region.lens) link.dataset.spwLens = region.lens;
    if (region.harmony) link.dataset.spwHarmony = region.harmony;
    if (region.density) link.dataset.spwDensity = region.density;
    if (region.occupancy) link.dataset.spwPackOccupancy = region.occupancy;
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

    if (region.consequence) {
      const consequenceSpan = document.createElement('span');
      consequenceSpan.className = 'spw-page-region-rail__consequence';
      consequenceSpan.textContent = region.consequence;
      label.append(consequenceSpan);
    } else if (region.meta || region.componentSummary) {
      const meta = document.createElement('span');
      meta.className = 'spw-page-region-rail__meta';
      meta.textContent = region.componentSummary || region.meta;
      label.append(meta);
    }

    link.append(sigil, label);
    link.title = [region.label, region.consequence, region.meta, region.componentSummary].filter(Boolean).join(' — ');
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

  const visibleEntries = new Map();
  const observer = observeIntersections({
    root: null,
    rootMargin: '-20% 0px -55% 0px',
    threshold: [0, 0.12, 0.35, 0.6],
    callback(entry) {
      if (entry.isIntersecting) visibleEntries.set(entry.target, entry);
      else visibleEntries.delete(entry.target);

      const visible = [...visibleEntries.values()]
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (!visible.length) return;

      const id = visible[0].target.id;
      const activeRegion = regions.find((r) => r.id === id);

      links.forEach((link) => {
        link.dataset.spwRegionActive = link.getAttribute('href') === `#${id}` ? 'true' : 'false';
      });

      if (activeRegion) {
        writeDatasetValues(document.documentElement, {
          spwActiveRegion: id,
          spwActiveRegionSeat: activeRegion.seat || null,
          spwActiveRegionOperator: activeRegion.operator || null,
          spwActiveRegionConsequence: activeRegion.consequence || null,
          spwActiveRegionWonder: activeRegion.wonder || null,
          spwActiveRegionHarmony: activeRegion.harmony || null,
          spwActiveRegionDensity: activeRegion.density || null,
        });
        writeActiveKin(activeRegion, regions, links);
      }
    },
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

  const cleanup = () => {
    unregister();
    activeCleanup();
    activeCleanup = () => {};
    document.querySelector(`[${RAIL_ATTR}]`)?.remove();
    writeDatasetValues(document.documentElement, {
      spwPageRegionRail: null,
      spwActiveRegionSimilar: null,
      spwActiveRegionContrast: null,
      spwActiveRegionResonate: null,
    });
  };

  return {
    cleanup,
    refresh: () => refreshPageRegionRail(),
  };
}
