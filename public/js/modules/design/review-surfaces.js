/**
 * modules/design/review-surfaces.js
 * ---------------------------------------------------------------------------
 * SVG/data-state affordances for design review and asset review slices.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const REVIEW_PROFILES = Object.freeze({
  'asset-review': {
    label: 'Asset review',
    summary: 'Use this slice to compare public images, generated variants, and image sidecars before promoting them into the larger catalog.',
    verbs: ['scan', 'promote', 'archive'],
    nodeClass: 'surface',
  },
  'token-review': {
    label: 'Token review',
    summary: 'Use this slice to inspect the semantic register, route settings, and CSS token families without the full catalog wall.',
    verbs: ['inspect', 'align', 'tune'],
    nodeClass: 'probe',
  },
  'design-lab': {
    label: 'Lab slice',
    summary: 'Use this slice to compare the shorter control surface with the larger experiment page and carry the smallest useful handoff.',
    verbs: ['probe', 'compare', 'carry'],
    nodeClass: 'frame',
  },
});

const NODE_CLASS_CYCLE = ['surface', 'frame', 'probe', 'ref', 'action'];

function makeSvgEl(tag) {
  return document.createElementNS(SVG_NS, tag);
}

function wrapLabel(label, max = 18) {
  const words = String(label || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return ['item'];

  const lines = [];
  let current = words.shift();

  for (const word of words) {
    if ((current + ' ' + word).length <= max) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  lines.push(current);
  return lines.slice(0, 2);
}

function buildNodePositions(count) {
  const positions = [];
  const center = { x: 120, y: 96 };

  if (count <= 1) {
    return [{ x: 120, y: 38 }];
  }

  const radius = count <= 3 ? 56 : count <= 5 ? 62 : 70;
  const yScale = 0.82;
  const angleOffset = -Math.PI / 2;

  for (let index = 0; index < count; index += 1) {
    const angle = angleOffset + ((Math.PI * 2) * index) / count;
    positions.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius * yScale,
    });
  }

  return positions;
}

function createChip(text, href, key) {
  const link = document.createElement('a');
  link.className = 'review-link-chip';
  link.href = href;
  link.dataset.reviewKey = key;
  link.textContent = text;
  return link;
}

function createVerb(text) {
  const item = document.createElement('span');
  item.className = 'review-verb-chip';
  item.textContent = text;
  return item;
}

function createConstellation(profile, links) {
  const figure = document.createElement('figure');
  figure.className = 'spw-svg-figure review-constellation';
  figure.dataset.spwSvgTuneMotion = 'paused';

  const svg = makeSvgEl('svg');
  svg.classList.add('spw-svg-surface', 'review-constellation__svg');
  svg.setAttribute('viewBox', '0 0 240 192');
  svg.setAttribute('role', 'img');

  const titleId = `${profile.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-review-map`;
  const title = makeSvgEl('title');
  title.id = titleId;
  title.textContent = `${profile.label} map`;
  svg.setAttribute('aria-labelledby', titleId);
  svg.appendChild(title);

  const desc = makeSvgEl('desc');
  desc.textContent = `${profile.label} links arranged as a small review constellation.`;
  svg.appendChild(desc);

  const center = makeSvgEl('g');
  center.setAttribute('aria-hidden', 'true');
  center.classList.add(`op-node--${profile.nodeClass}`);

  const centerHalo = makeSvgEl('circle');
  centerHalo.classList.add('spw-svg-node', 'spw-svg-node--surface');
  centerHalo.setAttribute('cx', '120');
  centerHalo.setAttribute('cy', '96');
  centerHalo.setAttribute('r', '28');

  const centerLabel = makeSvgEl('text');
  centerLabel.classList.add('spw-svg-label');
  centerLabel.setAttribute('x', '120');
  centerLabel.setAttribute('y', '101');
  centerLabel.setAttribute('text-anchor', 'middle');
  centerLabel.textContent = profile.label;

  center.appendChild(centerHalo);
  center.appendChild(centerLabel);
  svg.appendChild(center);

  const positions = buildNodePositions(links.length);
  const svgLinks = [];

  links.forEach((link, index) => {
    const position = positions[index];
    const nodeType = NODE_CLASS_CYCLE[index % NODE_CLASS_CYCLE.length];
    const key = `review-node-${index}`;

    const flow = makeSvgEl('line');
    flow.classList.add('spw-svg-flow', 'review-constellation__flow');
    flow.dataset.reviewKey = key;
    flow.setAttribute('x1', '120');
    flow.setAttribute('y1', '96');
    flow.setAttribute('x2', String(position.x));
    flow.setAttribute('y2', String(position.y));
    svg.appendChild(flow);

    const anchor = makeSvgEl('a');
    anchor.setAttribute('href', link.href);
    anchor.setAttributeNS(XLINK_NS, 'href', link.href);
    anchor.dataset.reviewKey = key;
    anchor.classList.add('review-constellation__link', `op-node--${nodeType}`);

    const group = makeSvgEl('g');
    group.setAttribute('aria-hidden', 'false');

    const node = makeSvgEl('circle');
    node.classList.add('spw-svg-node', `spw-svg-node--${nodeType}`, 'review-constellation__node');
    node.setAttribute('cx', String(position.x));
    node.setAttribute('cy', String(position.y));
    node.setAttribute('r', String(index % 2 === 0 ? 15 : 14));

    const label = makeSvgEl('text');
    label.classList.add('spw-svg-label', 'review-constellation__label');
    label.setAttribute('x', String(position.x));
    label.setAttribute('y', String(position.y + (position.y < 96 ? 28 : -20)));
    label.setAttribute('text-anchor', 'middle');
    const labelLines = wrapLabel(link.label, index % 2 === 0 ? 16 : 14);
    labelLines.forEach((line, lineIndex) => {
      const span = makeSvgEl('tspan');
      span.setAttribute('x', String(position.x));
      span.setAttribute('dy', lineIndex === 0 ? '0' : '1.15em');
      span.textContent = line;
      label.appendChild(span);
    });

    const titleNode = makeSvgEl('title');
    titleNode.textContent = `${link.label}: ${link.href}`;
    anchor.appendChild(titleNode);
    group.appendChild(node);
    group.appendChild(label);
    anchor.appendChild(group);
    svg.appendChild(anchor);

    svgLinks.push({ key, anchor, flow });
  });

  figure.appendChild(svg);

  const caption = document.createElement('figcaption');
  caption.className = 'review-constellation__caption';
  caption.textContent = 'Hover a chip or node to keep a link in focus.';
  figure.appendChild(caption);

  return { figure, svgLinks };
}

function activateReviewState(root, key, links, chips = []) {
  root.dataset.spwReviewActive = key || '';
  links.forEach(({ anchor, flow }) => {
    const isActive = key && anchor.dataset.reviewKey === key;
    anchor.dataset.reviewActive = isActive ? 'true' : 'false';
    if (isActive) {
      anchor.setAttribute('aria-current', 'true');
    } else {
      anchor.removeAttribute('aria-current');
    }
    flow.dataset.reviewActive = isActive ? 'true' : 'false';
  });
  chips.forEach((chip) => {
    const isActive = key && chip.dataset.reviewKey === key;
    chip.dataset.reviewActive = isActive ? 'true' : 'false';
    if (isActive) {
      chip.setAttribute('aria-current', 'true');
    } else {
      chip.removeAttribute('aria-current');
    }
  });
}

function initRailInteractions(rail, links, chips, fallbackKey) {
  const setFromTarget = (target) => {
    const item = target?.closest?.('[data-review-key]');
    if (!item) return;
    const key = item.dataset.reviewKey;
    if (!key) return;
    activateReviewState(rail, key, links, chips);
  };

  const reset = () => activateReviewState(rail, fallbackKey, links, chips);

  const handlePointerOver = (event) => setFromTarget(event.target);
  const handleFocusIn = (event) => setFromTarget(event.target);
  const handlePointerLeave = () => reset();
  const handleFocusOut = () => {
    if (rail.contains(document.activeElement)) return;
    reset();
  };

  rail.addEventListener('pointerover', handlePointerOver);
  rail.addEventListener('focusin', handleFocusIn);
  rail.addEventListener('pointerleave', handlePointerLeave);
  rail.addEventListener('focusout', handleFocusOut);

  return () => {
    rail.removeEventListener('pointerover', handlePointerOver);
    rail.removeEventListener('focusin', handleFocusIn);
    rail.removeEventListener('pointerleave', handlePointerLeave);
    rail.removeEventListener('focusout', handleFocusOut);
  };
}

export function initDesignReviewSurfaces(ctx, root) {
  if (!(root instanceof Node)) {
    root = document;
  }
  const body = root.body || document.body;
  const profile = REVIEW_PROFILES[body?.dataset?.spwPageRole];

  if (!profile) return () => {};

  const main = root.querySelector('main');
  if (!(main instanceof HTMLElement)) return () => {};

  if (main.querySelector('.spw-review-rail')) return () => {};

  const source = main.querySelector('.catalog-main') || main;
  const toc = source.querySelector('.catalog-toc');
  if (!(toc instanceof HTMLElement)) return () => {};

  const tocLinks = [...toc.querySelectorAll('a[href]')]
    .map((link, index) => {
      if (!(link instanceof HTMLAnchorElement)) return null;
      const label = link.textContent?.trim() || link.getAttribute('aria-label') || `link ${index + 1}`;
      return {
        key: `review-link-${index}`,
        href: link.href,
        label,
      };
    })
    .filter(Boolean);

  if (!tocLinks.length) return () => {};

  const rail = document.createElement('aside');
  rail.className = 'spw-gutter-rail spw-review-rail';
  rail.setAttribute('aria-label', `${profile.label} companion rail`);
  rail.dataset.spwReviewRole = body.dataset.spwPageRole;

  const summaryCard = document.createElement('section');
  summaryCard.className = 'review-surface-card review-surface-card--summary';

  const kicker = document.createElement('p');
  kicker.className = 'review-surface-kicker';
  kicker.textContent = profile.label;

  const heading = document.createElement('h2');
  heading.className = 'review-surface-title';
  heading.textContent = 'Quick review rail';

  const summary = document.createElement('p');
  summary.className = 'review-surface-lede';
  summary.textContent = profile.summary;

  const verbs = document.createElement('div');
  verbs.className = 'review-verb-row';
  profile.verbs.forEach((verb) => verbs.appendChild(createVerb(verb)));

  summaryCard.append(kicker, heading, summary, verbs);

  const { figure, svgLinks } = createConstellation(profile, tocLinks);

  const linksCard = document.createElement('section');
  linksCard.className = 'review-surface-card review-surface-card--links';

  const linksHeading = document.createElement('h3');
  linksHeading.className = 'review-surface-subtitle';
  linksHeading.textContent = 'Jump links';

  const linkGrid = document.createElement('nav');
  linkGrid.className = 'review-link-grid';
  linkGrid.setAttribute('aria-label', `${profile.label} jump links`);

  const chips = tocLinks.map((link) => {
    const chip = createChip(link.label, link.href, link.key);
    linkGrid.appendChild(chip);
    return chip;
  });

  const prompt = document.createElement('p');
  prompt.className = 'review-surface-note';
  prompt.textContent = 'Hover or focus a chip to keep the matching diagram node awake.';

  linksCard.append(linksHeading, linkGrid, prompt);

  rail.append(summaryCard, figure, linksCard);
  main.appendChild(rail);

  const fallbackKey = tocLinks[0].key;
  activateReviewState(rail, fallbackKey, svgLinks, chips);

  return initRailInteractions(rail, svgLinks, chips, fallbackKey);
}
