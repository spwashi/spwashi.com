/**
 * Capture-plan brain for component + region ecology visual testing.
 *
 * Two tracks:
 *   qa      — device-reason viewports (pocket / fold / broadsheet) and their media queries
 *   social  — unique content-fit stills plus named feed crops that turn a combination
 *             into a postable card
 *
 * Pure functions. The Chrome runner consumes jobs; tests consume the same plan.
 */

import { createHash } from 'node:crypto';

export const FLOWS = Object.freeze(['page', 'region', 'component', 'template']);
export const DEFAULT_QA_FLOWS = Object.freeze(['region', 'component']);
export const DEFAULT_QA_VIEWPORTS = Object.freeze(['phone', 'desktop']);
export const DEFAULT_ECOLOGY_VIEWPORTS = Object.freeze(['pocket', 'fold', 'desktop']);
export const DEFAULT_SOCIAL_ASPECTS = Object.freeze(['fit', 'square']);
export const REGION_SEATS = Object.freeze(['hook', 'hub', 'cluster', 'path', 'read', 'wide']);
export const SIZE_REASONS = Object.freeze(['device-reason', 'pretext-fit', 'social-crop']);
export const SIZE_TOKENS = Object.freeze(['measure-compact', 'measure-card', 'measure-reading']);

/**
 * Public names for generated stills. Not Storybook stories.
 *
 * print      — isolated card on the compose.css bed (manufactured part)
 * situation  — component + live copy seated in a room (environmental context)
 * set        — a Midjourney-style grid of situations for review / direction
 * clip       — anatomy without the room
 * page       — the whole factory floor
 */
export const ASSET_KINDS = Object.freeze({
  page: Object.freeze({
    id: 'page',
    flow: 'page',
    name: 'page still',
    wonder: 'The factory floor. Chrome and packing context.',
  }),
  situation: Object.freeze({
    id: 'situation',
    flow: 'region',
    name: 'situation',
    wonder: 'The component at work in a room, with real copy. Not a story.',
  }),
  clip: Object.freeze({
    id: 'clip',
    flow: 'component',
    name: 'clip',
    wonder: 'Anatomy without the room.',
  }),
  print: Object.freeze({
    id: 'print',
    flow: 'template',
    name: 'print',
    wonder: 'The manufactured part on the compose.css bed. You take the part, not the shop.',
  }),
  set: Object.freeze({
    id: 'set',
    flow: null,
    name: 'situation set',
    wonder: 'A grid of situations for review and direction — the Midjourney screenshot of the plate.',
  }),
});

export const COST_BANDS = Object.freeze({
  plan: Object.freeze({ id: 'plan', chrome: false, ms: 10, learn: 'Pure Spw plan. Always cheap.' }),
  check: Object.freeze({ id: 'check', chrome: false, ms: 80, learn: 'Fixture contracts. No render.' }),
  set: Object.freeze({ id: 'set', chrome: true, ms: 2500, learn: 'One specimen nav, then a plate of situation clips. Review like a Midjourney grid.' }),
  print: Object.freeze({ id: 'print', chrome: true, ms: 800, learn: 'Isolated compose.css print. No site-shell nav.' }),
});

export const SEAT_PRIORITY = Object.freeze(['hook', 'path', 'cluster', 'hub', 'read', 'wide']);

/**
 * Tooling across a range of intelligence. Same still, four readings.
 * Visitors never wait on a model. A capable LLM is an editor-side option.
 */
export const INTELLIGENCE_BANDS = Object.freeze({
  mosey: Object.freeze({
    id: 'mosey',
    asks: 'What can a passerby notice without a glossary?',
  }),
  search: Object.freeze({
    id: 'search',
    asks: 'What words make this component findable in site search and crawls?',
  }),
  agent: Object.freeze({
    id: 'agent',
    asks: 'What contract does a weaker agent need to recapture this without taste?',
  }),
  llm: Object.freeze({
    id: 'llm',
    asks: 'What prompt would a capable model use to restage or describe this still?',
  }),
});

export function intelligencePrompt(band, job = {}, snapshot = {}) {
  const mosey = job.wonder || marketingPrompt(job, snapshot) || job.captureValue || job.label || '';
  if (band === 'mosey') return mosey;
  if (band === 'search') {
    return [job.label, job.seat, job.sizeToken, job.sizeReason, job.captureValue, job.wonder]
      .filter(Boolean)
      .join(' · ');
  }
  if (band === 'agent') {
    return [
      `Recapture ${job.id || job.fixtureId || 'fixture'}`,
      job.flow,
      job.viewportId || job.aspect,
      job.sizeReason,
      job.selector && `selector ${job.selector}`,
      job.sizeToken,
    ].filter(Boolean).join(' · ');
  }
  if (band === 'llm') {
    return [
      `Describe this ${job.kind || 'component'} as one still.`,
      job.sizeReason && `Size reason: ${job.sizeReason}.`,
      job.sizeToken && `Measure: ${job.sizeToken}.`,
      mosey,
      job.lens?.asks || '',
      'Do not invent chrome. Name the Spw relationship (seat, operator, packing) that makes the ratio inevitable.',
    ].filter(Boolean).join(' ');
  }
  return mosey;
}

export function intelligencePrompts(job, snapshot = {}) {
  return {
    mosey: intelligencePrompt('mosey', job, snapshot),
    search: intelligencePrompt('search', job, snapshot),
    agent: intelligencePrompt('agent', job, snapshot),
    llm: intelligencePrompt('llm', job, snapshot),
  };
}

export function componentSearchEntries({
  componentFixtures = [],
  ecologyFixtures = [],
} = {}) {
  const fromComponent = componentFixtures.map((fixture) => ({
    route: fixture.specimenRoute,
    title: fixture.label,
    kind: 'component',
    componentId: fixture.id,
    wonder: fixture.wonder || fixture.captureValue || '',
    pageRole: 'component-specimen',
    nestRoot: 'design',
    nestLabel: 'components',
    depth: 2,
    haystack: [
      fixture.label,
      fixture.id,
      'component',
      fixture.captureValue,
      fixture.wonder,
      fixture.sizeToken,
      fixture.selector,
      fixture.specimenRoute,
    ].filter(Boolean).join(' ').toLowerCase(),
  }));
  const fromEcology = ecologyFixtures.map((fixture) => ({
    route: fixture.specimenRoute,
    title: fixture.label,
    kind: 'component',
    componentId: fixture.id,
    seat: fixture.seat,
    wonder: fixture.wonder || fixture.captureValue || '',
    pageRole: 'region-specimen',
    nestRoot: String(fixture.specimenRoute || '/').split('/').filter(Boolean)[0] || 'home',
    nestLabel: fixture.seat,
    depth: 1,
    haystack: [
      fixture.label,
      fixture.id,
      fixture.seat,
      'region',
      'ecology',
      fixture.captureValue,
      fixture.wonder,
      fixture.sizeToken,
      fixture.selector,
    ].filter(Boolean).join(' ').toLowerCase(),
  }));
  return [...fromComponent, ...fromEcology];
}

/**
 * Design dimensions that make a still more or less visible / tangible.
 * Opt-in lenses — not a default factorial. Each asks a sizing or Spw question.
 */
export const VISIBILITY_LENSES = Object.freeze({
  density: Object.freeze({
    id: 'density',
    query: 'density',
    attr: 'data-spw-density',
    values: Object.freeze(['compact', 'roomy']),
    asks: 'Does the measure token still hold when packing changes?',
    spw: 'Occupancy ↔ measure. Compact is not a crop.',
  }),
  enhancement: Object.freeze({
    id: 'enhancement',
    query: 'enhancement',
    attr: 'data-spw-enhancement-level',
    values: Object.freeze(['quiet', 'rich']),
    asks: 'What is structural vs ornament?',
    spw: 'Quiet isolates the relationship; rich shows the field.',
  }),
  tangibility: Object.freeze({
    id: 'tangibility',
    query: null,
    attr: 'data-spw-tangibility',
    values: Object.freeze(['0.45', '0.95']),
    asks: 'Does the object still occupy space when it recedes?',
    spw: 'Tangibility is presence, not opacity as decoration.',
  }),
  labels: Object.freeze({
    id: 'labels',
    query: 'meaning',
    attr: 'data-spw-label-posture',
    values: Object.freeze(['named', 'silent']),
    asks: 'Does the Spw relationship survive without captions?',
    spw: 'Silent labels test whether the sigil still reads.',
  }),
});

export function applyVisibilityLenses(jobs, lensIds = []) {
  const lenses = (lensIds || []).map((id) => VISIBILITY_LENSES[id]).filter(Boolean);
  if (!lenses.length) return jobs;
  const out = [];
  for (const job of jobs) {
    out.push(job);
    if (job.canvas !== 'card' && job.track !== 'social') continue;
    for (const lens of lenses) {
      for (const value of lens.values) {
        const next = {
          ...job,
          lens: { id: lens.id, value, attr: lens.attr, query: lens.query, asks: lens.asks, spw: lens.spw },
          wonder: job.wonder || lens.asks,
        };
        next.file = String(job.file || '').replace(
          /(\.[a-z]+)$/,
          `--${lens.id}-${String(value).replace('.', 'p')}$1`,
        );
        out.push(next);
      }
    }
  }
  return out;
}

/**
 * Why this still is this size. QA uses device-reason media queries.
 * Unique cards use the pretext/copy measure. Named social stills are crops.
 */
export function sizeReasonFor(job) {
  if (job.track === 'social' && job.aspect && job.aspect !== 'fit') return 'social-crop';
  if (job.track === 'social' || job.aspect === 'fit' || job.flow === 'template') return 'pretext-fit';
  return 'device-reason';
}

export function sizeTokenFor(fixture) {
  if (SIZE_TOKENS.includes(fixture?.sizeToken)) return fixture.sizeToken;
  if (fixture?.seat === 'hook' || fixture?.seat === 'read') return 'measure-reading';
  if (fixture?.seat === 'path') return 'measure-compact';
  return 'measure-card';
}

export function marketingPrompt(job, snapshot = {}) {
  if (job.lens?.asks) return job.lens.asks;
  if (snapshot.wrap === 'volatile') {
    return `This ${job.label || 'region'} will not hold one line. That wrap is the still.`;
  }
  if (snapshot.wrap === 'responsive') {
    return `This ${job.label || 'region'} changes line count with width. Recapture is the teaser.`;
  }
  if (job.seat === 'cluster' && (job.viewportId === 'fold' || job.viewportId === 'tablet')) {
    return 'Leftover frames wrapping inside a desk — not a two-column main.';
  }
  if (job.wonder) return job.wonder;
  if (job.sizeReason === 'pretext-fit') {
    return 'The card is sized to the copy measure. The ratio is a consequence.';
  }
  return null;
}

export function enhancementHint(job, snapshot = {}) {
  if (snapshot.wrap === 'volatile') {
    return 'Wrap is volatile — tighten copy or the measure token before locking a social still.';
  }
  if (snapshot.wrap === 'responsive' && job.track === 'social') {
    return 'Wrap responds across widths — recapture pocket and fold before posting.';
  }
  if (job.seat === 'cluster' && (job.viewportId === 'fold' || job.viewportId === 'tablet')) {
    return 'Fold cluster: leftover frames should wrap inside the desk, not split main.';
  }
  if (job.sizeReason === 'pretext-fit' && snapshot.widthClass === 'xs') {
    return 'Pretext width-class is xs — the unique ratio may be starving the copy.';
  }
  return null;
}

/** Device reasons used for QA. Aliases map onto harness viewport ids. */
export const DEVICE_REASONS = Object.freeze({
  pocket: Object.freeze({
    id: 'pocket',
    viewport: 'phone',
    width: 390,
    height: 844,
    media: '(max-width: 45rem) and (max-aspect-ratio: 3/4)',
    wonder: 'One hand. Tall. The region has to stand without leftover tracks.',
  }),
  fold: Object.freeze({
    id: 'fold',
    viewport: 'tablet',
    width: 768,
    height: 1024,
    media: '(min-width: 45rem) and (max-width: 61.24rem) and (min-aspect-ratio: 3/4) and (max-aspect-ratio: 4/3)',
    wonder: 'Square-ish desk. Leftover frames wrap inside cluster seats; main is not two equal columns.',
  }),
  broadsheet: Object.freeze({
    id: 'broadsheet',
    viewport: 'desktop',
    width: 1440,
    height: 900,
    media: '(min-width: 61.25rem)',
    wonder: 'Room to spare. Cluster leftover tracks and years 3-up should actually spend it.',
  }),
});

/**
 * Named social canvases. `fit` is the unique precipitate: the still is the
 * component's own box, not a feed crop. Named ratios are the postable versions.
 */
export const SOCIAL_ASPECTS = Object.freeze({
  fit: Object.freeze({
    id: 'fit',
    ratio: null,
    ratioLabel: 'content-fit',
    width: null,
    height: null,
    wonder: 'The card is the component physics. Ratio is a consequence, not a crop.',
  }),
  square: Object.freeze({
    id: 'square',
    ratio: 1,
    ratioLabel: '1/1',
    width: 1080,
    height: 1080,
    wonder: 'Equal pressure — chip, card, and region compete on one plane.',
  }),
  portrait: Object.freeze({
    id: 'portrait',
    ratio: 4 / 5,
    ratioLabel: '4/5',
    width: 1080,
    height: 1350,
    wonder: 'Feed portrait. Leftover packing and years 3-up become the intrigue.',
  }),
  story: Object.freeze({
    id: 'story',
    ratio: 9 / 16,
    ratioLabel: '9/16',
    width: 1080,
    height: 1920,
    wonder: 'Pocket height — one region, one breath.',
  }),
  landscape: Object.freeze({
    id: 'landscape',
    ratio: 16 / 9,
    ratioLabel: '16/9',
    width: 1920,
    height: 1080,
    wonder: 'Broadsheet still. Cluster leftover tracks read as a desk.',
  }),
  og: Object.freeze({
    id: 'og',
    ratio: 1.91,
    ratioLabel: '1.91/1',
    width: 1200,
    height: 630,
    wonder: 'Link preview. Hook copy has to survive a short crop.',
  }),
});

export const VIEWPORT_ALIASES = Object.freeze({
  pocket: 'phone',
  fold: 'tablet',
  broadsheet: 'desktop',
  phone: 'phone',
  phablet: 'phablet',
  tablet: 'tablet',
  laptop: 'laptop',
  desktop: 'desktop',
  wide: 'wide',
});

export function sha8(text) {
  return createHash('sha256').update(String(text || '')).digest('hex').slice(0, 8);
}

export function extFor(format) {
  return format === 'jpeg' ? 'jpg' : format;
}

export function routePath(route) {
  return String(route || '/').split('#')[0] || '/';
}

export function routeFileId(route) {
  return routePath(route).replace(/^\/|\/$/g, '').replaceAll('/', '--') || 'home';
}

export function navigationKey(route, viewportId) {
  return `${routePath(route)}|${viewportId}`;
}

export function ratioLabel(width, height) {
  if (!width || !height) return null;
  const r = width / height;
  for (const aspect of Object.values(SOCIAL_ASPECTS)) {
    if (aspect.ratio && Math.abs(aspect.ratio - r) < 0.025) return aspect.ratioLabel;
  }
  return `${Math.round(r * 100) / 100}`;
}

export function cropToAspect(box, aspect, padding = 0) {
  if (!box) return null;
  const spec = typeof aspect === 'string' ? SOCIAL_ASPECTS[aspect] : aspect;
  const padded = {
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
    viewportX: (box.viewportX ?? 0) - padding,
    viewportY: (box.viewportY ?? 0) - padding,
  };
  if (!spec || spec.id === 'fit' || !spec.ratio) {
    return {
      ...padded,
      aspect: 'fit',
      ratioLabel: ratioLabel(padded.width, padded.height),
    };
  }

  const target = spec.ratio;
  const current = padded.width / Math.max(1, padded.height);
  let { x, y, width, height, viewportX, viewportY } = padded;
  if (current > target) {
    width = padded.height * target;
    x = padded.x + (padded.width - width) / 2;
    viewportX = padded.viewportX + (padded.width - width) / 2;
  } else {
    height = padded.width / target;
    y = padded.y + (padded.height - height) / 2;
    viewportY = padded.viewportY + (padded.height - height) / 2;
  }
  return {
    x,
    y,
    width,
    height,
    viewportX,
    viewportY,
    aspect: spec.id,
    ratioLabel: spec.ratioLabel,
  };
}

export const CLIP_MAX_HEIGHT = 8000;

/** Header-only text from a region/component still — the clip missed the specimen. */
export function looksLikeShellChrome(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  return /^(#>\s*)?SPWASHI\b/i.test(t) && /\bROUTES\b/i.test(t) && t.length < 480;
}

/**
 * Clip in CSS pixels.
 * `document` space is the element's page box (captureBeyondViewport).
 * `viewport` space is the visible slice after scroll.
 */
export function clipForBox(box, viewport, padding, aspect, {
  space = 'document',
  maxHeight = CLIP_MAX_HEIGHT,
} = {}) {
  const cropped = cropToAspect(box, aspect || 'fit', padding);
  if (!cropped) return null;
  if (space === 'viewport') {
    const vpW = viewport?.width || 1440;
    const vpH = viewport?.height || 900;
    const viewportX = Math.max(0, Math.floor(cropped.viewportX ?? 0));
    const viewportY = Math.max(0, Math.floor(cropped.viewportY ?? 0));
    return {
      x: viewportX,
      y: viewportY,
      width: Math.max(2, Math.min(vpW - viewportX, Math.ceil(cropped.width))),
      height: Math.max(2, Math.min(vpH - viewportY, Math.ceil(cropped.height))),
      scale: 1,
      aspect: cropped.aspect,
      ratioLabel: cropped.ratioLabel,
      coordinateSpace: 'viewport',
      captureBeyondViewport: false,
    };
  }
  return {
    x: Math.max(0, Math.floor(cropped.x)),
    y: Math.max(0, Math.floor(cropped.y)),
    width: Math.max(2, Math.ceil(cropped.width)),
    height: Math.max(2, Math.min(maxHeight, Math.ceil(cropped.height))),
    scale: 1,
    aspect: cropped.aspect,
    ratioLabel: cropped.ratioLabel,
    coordinateSpace: 'document',
    captureBeyondViewport: true,
  };
}

export function clipSpaceForJob(job) {
  if (!job || job.flow === 'page') return null;
  if (job.canvas === 'card' || job.flow === 'template' || job.flow === 'region' || job.flow === 'component') {
    return 'document';
  }
  return 'document';
}

export function isMissedSpecimen(job, box) {
  if (!job || job.flow === 'page' || job.canvas === 'card') return false;
  return looksLikeShellChrome(box?.text);
}

export function viewportMatchesScenario(viewportId, layoutScenarios) {
  if (!layoutScenarios?.length) return true;
  const resolved = VIEWPORT_ALIASES[viewportId] || viewportId;
  const reason = Object.values(DEVICE_REASONS).find((entry) => entry.id === viewportId);
  const reasonViewport = reason?.viewport;
  return layoutScenarios.includes(viewportId)
    || layoutScenarios.includes(resolved)
    || (reasonViewport ? layoutScenarios.includes(reasonViewport) : false);
}

export function deviceReasonFor(viewportId) {
  return DEVICE_REASONS[viewportId]
    || Object.values(DEVICE_REASONS).find((entry) => entry.viewport === viewportId)
    || null;
}

function jobFile(job, format) {
  const ext = extFor(format);
  if (job.track === 'social') {
    const aspect = job.aspect || 'fit';
    const kind = job.kind === 'ecology' ? 'ecology' : job.id;
    return `captures/social--${kind}--${aspect}--${job.flow}.${ext}`;
  }
  if (job.flow === 'page') {
    return `captures/page--${routeFileId(job.specimenRoute)}--${job.viewportId}.${ext}`;
  }
  if (job.kind === 'ecology') {
    return `captures/ecology--${job.id}--${job.viewportId}--${job.flow}.${ext}`;
  }
  return `captures/${job.id}--${job.viewportId}--${job.flow}.${ext}`;
}

function sourceFilesForComponent(fixture) {
  return [fixture.snippet, fixture.cssOwner].filter(Boolean);
}

function sourceFilesForEcology(fixture) {
  const routeFile = `${routePath(fixture.specimenRoute).replace(/^\//, '')}index.html`.replace(/^index.html$/, 'index.html');
  return [routeFile, fixture.cssOwner, 'public/css/systems/region-seats.css', 'public/css/shell/layout.css'].filter(Boolean);
}

export function fingerprintJob(job, hashes = {}) {
  return sha8([
    job.kind,
    job.id,
    job.track,
    job.flow,
    job.viewportId,
    job.aspect || '',
    job.lens ? `${job.lens.id}:${job.lens.value}` : '',
    job.selector || '',
    hashes.snippet || '',
    hashes.css || '',
  ].join('|'));
}

export function jobTouchesChanged(job, changedFiles) {
  if (!changedFiles?.length) return true;
  return job.sourceFiles.some((file) => changedFiles.some((changed) => (
    changed === file
    || changed.endsWith(`/${file}`)
    || file.endsWith(changed)
  )));
}

export function shouldSkipJob(job, { priorFingerprints, existingFiles } = {}) {
  if (!job.fingerprint || !job.file) return false;
  const known = priorFingerprints instanceof Set
    ? priorFingerprints.has(job.fingerprint)
    : Boolean(priorFingerprints?.[job.fingerprint]);
  const exists = existingFiles instanceof Set
    ? existingFiles.has(job.file)
    : Boolean(existingFiles?.[job.file]);
  return known && exists;
}

export function groupJobsByNavigation(jobs) {
  const groups = [];
  const index = new Map();
  for (const job of jobs) {
    if (job.flow === 'template' || job.canvas === 'card') {
      groups.push({
        key: `card|${job.id}|${job.viewportId}|${job.aspect || 'qa'}`,
        route: null,
        viewportId: job.viewportId,
        canvas: 'card',
        jobs: [job],
      });
      continue;
    }
    const key = `${navigationKey(job.specimenRoute, job.viewportId)}|${job.lens ? `${job.lens.id}:${job.lens.value}` : 'plain'}`;
    if (!index.has(key)) {
      const group = { key, route: job.specimenRoute, viewportId: job.viewportId, canvas: 'specimen', jobs: [] };
      index.set(key, group);
      groups.push(group);
    }
    index.get(key).jobs.push(job);
  }
  return groups;
}

function pushPageJob(jobs, seen, fixture, viewport, format) {
  const key = navigationKey(fixture.specimenRoute, viewport.id);
  if (seen.has(key)) return;
  seen.add(key);
  const reason = deviceReasonFor(viewport.id);
  const job = {
    kind: 'component',
    id: `page-${routeFileId(fixture.specimenRoute)}`,
    fixtureId: fixture.id,
    label: `${fixture.specimenRoute} page`,
    track: 'qa',
    flow: 'page',
    viewportId: viewport.id,
    specimenRoute: fixture.specimenRoute,
    selector: null,
    regionSelector: null,
    seat: null,
    aspect: null,
    canvas: 'specimen',
    snippet: fixture.snippet,
    cssOwner: fixture.cssOwner,
    sourceFiles: sourceFilesForComponent(fixture),
    captureValue: 'Full specimen route — chrome and packing context.',
    wonder: reason?.wonder || 'Does the component still belong on a page?',
    sizeReason: 'device-reason',
    sizeToken: sizeTokenFor(fixture),
    media: reason?.media || null,
    publish: ['design-review', 'agent-brief', 'page-pipeline'],
  };
  job.file = jobFile(job, format);
  jobs.push(job);
}

export function buildComponentJobs(fixtures, {
  flows = DEFAULT_QA_FLOWS,
  viewports = [],
  format = 'jpeg',
} = {}) {
  const jobs = [];
  const pageSeen = new Set();
  for (const fixture of fixtures) {
    const fixtureFlows = Array.isArray(fixture.captureFlows) && fixture.captureFlows.length
      ? fixture.captureFlows
      : FLOWS;
    const activeFlows = flows.filter((flow) => fixtureFlows.includes(flow));
    if (!activeFlows.length) continue;

    for (const viewport of viewports) {
      if (!viewportMatchesScenario(viewport.id, fixture.layoutScenarios)) continue;
      if (activeFlows.includes('page')) {
        pushPageJob(jobs, pageSeen, fixture, viewport, format);
      }
      for (const flow of activeFlows) {
        if (flow === 'page') continue;
        const selector = flow === 'region' ? (fixture.regionSelector || fixture.selector) : fixture.selector;
        if (flow === 'region' && !fixture.regionSelector) continue;
        const job = {
          kind: 'component',
          id: fixture.id,
          fixtureId: fixture.id,
          label: fixture.label,
          track: 'qa',
          flow,
          viewportId: viewport.id,
          specimenRoute: flow === 'template' ? null : fixture.specimenRoute,
          selector,
          regionSelector: fixture.regionSelector || null,
          seat: null,
          aspect: null,
          canvas: flow === 'template' ? 'card' : 'specimen',
          snippet: fixture.snippet,
          cssOwner: fixture.cssOwner,
          sourceFiles: sourceFilesForComponent(fixture),
          captureValue: fixture.captureValue || '',
          wonder: fixture.wonder || fixture.captureValue || '',
          sizeReason: flow === 'template' ? 'pretext-fit' : 'device-reason',
          sizeToken: sizeTokenFor(fixture),
          media: deviceReasonFor(viewport.id)?.media || null,
          publish: fixture.publishTargets || ['design-review', 'agent-brief'],
        };
        job.file = jobFile(job, format);
        jobs.push(job);
      }
    }
  }
  return jobs;
}

export function buildEcologyJobs(fixtures, {
  viewports = [],
  seats = null,
  format = 'jpeg',
} = {}) {
  const seatFilter = seats?.length ? new Set(seats) : null;
  const jobs = [];
  for (const fixture of fixtures) {
    if (seatFilter && !seatFilter.has(fixture.seat)) continue;
    for (const viewport of viewports) {
      if (!viewportMatchesScenario(viewport.id, fixture.layoutScenarios)) continue;
      const reason = deviceReasonFor(viewport.id);
      const job = {
        kind: 'ecology',
        id: fixture.id,
        fixtureId: fixture.id,
        label: fixture.label,
        track: 'qa',
        flow: 'region',
        viewportId: viewport.id,
        specimenRoute: fixture.specimenRoute,
        selector: fixture.selector,
        regionSelector: fixture.selector,
        seat: fixture.seat,
        aspect: null,
        canvas: 'specimen',
        snippet: null,
        cssOwner: fixture.cssOwner,
        sourceFiles: sourceFilesForEcology(fixture),
        captureValue: fixture.captureValue || '',
        wonder: fixture.wonder || reason?.wonder || fixture.captureValue || '',
        sizeReason: 'device-reason',
        sizeToken: sizeTokenFor(fixture),
        media: reason?.media || null,
        publish: ['layout-qa', 'design-review', 'agent-brief'],
      };
      job.file = jobFile(job, format);
      jobs.push(job);
    }
  }
  return jobs;
}

export function buildSocialJobs(fixtures, {
  aspects = DEFAULT_SOCIAL_ASPECTS,
  format = 'jpeg',
  ecology = false,
} = {}) {
  const jobs = [];
  for (const fixture of fixtures) {
    const declared = Array.isArray(fixture.socialAspects) && fixture.socialAspects.length
      ? fixture.socialAspects
      : ['fit'];
    const active = aspects.filter((id) => declared.includes(id) && SOCIAL_ASPECTS[id]);
    for (const aspectId of active) {
      const spec = SOCIAL_ASPECTS[aspectId];
      const isEcology = ecology || fixture.kind === 'ecology' || Boolean(fixture.seat);
      const job = {
        kind: isEcology ? 'ecology' : 'component',
        id: fixture.id,
        fixtureId: fixture.id,
        label: fixture.label,
        track: 'social',
        flow: isEcology ? 'region' : 'template',
        viewportId: isEcology ? 'desktop' : (spec.id === 'fit' ? 'desktop' : spec.id),
        specimenRoute: isEcology ? fixture.specimenRoute : null,
        selector: isEcology ? fixture.selector : (fixture.selector || null),
        regionSelector: fixture.regionSelector || fixture.selector || null,
        seat: fixture.seat || null,
        aspect: spec.id,
        canvas: isEcology ? 'specimen' : 'card',
        snippet: fixture.snippet || null,
        cssOwner: fixture.cssOwner,
        sourceFiles: isEcology ? sourceFilesForEcology(fixture) : sourceFilesForComponent(fixture),
        captureValue: fixture.captureValue || '',
        wonder: fixture.wonder || spec.wonder,
        synergy: fixture.synergy || null,
        sizeReason: spec.id === 'fit' ? 'pretext-fit' : 'social-crop',
        sizeToken: sizeTokenFor(fixture),
        media: null,
        publish: ['social-still', 'marketing-teaser', 'design-review', 'agent-brief', 'external-art'],
      };
      job.file = jobFile(job, format);
      jobs.push(job);
    }
  }
  return jobs;
}

export function socialViewport(aspectId) {
  const spec = SOCIAL_ASPECTS[aspectId];
  if (!spec || spec.id === 'fit') {
    return { id: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, hasTouch: false };
  }
  return {
    id: spec.id,
    width: spec.width,
    height: spec.height,
    deviceScaleFactor: 1,
    mobile: spec.id === 'story',
    hasTouch: spec.id === 'story',
  };
}

export function templateDocumentHtml(base, snippetHtml, { aspect = 'fit', sizeToken = 'measure-card', lens = null } = {}) {
  const spec = SOCIAL_ASPECTS[aspect] || SOCIAL_ASPECTS.fit;
  const token = SIZE_TOKENS.includes(sizeToken) ? sizeToken : 'measure-card';
  const measureWidth = `min(100%, var(--${token}, 42ch))`;
  const lensAttr = lens?.attr && lens?.value ? `${lens.attr}="${lens.value}"` : '';
  const hostStyle = spec.id === 'fit'
    ? `width:${measureWidth};container-type:inline-size;`
    : `aspect-ratio:${spec.ratioLabel.replace('/', ' / ')};width:${measureWidth};max-height:100%;overflow:hidden;display:grid;place-items:center;`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <base href="${base}/"/>
  <title>Spw component card</title>
  <link rel="stylesheet" href="${base}/public/css/compose.css"/>
  <style>
    html, body { margin: 0; padding: 0; }
    body { min-height: 100vh; display: grid; place-items: center; padding: 1.5rem; box-sizing: border-box; background: #f4efe6; }
    .spw-template-capture-host { ${hostStyle} }
  </style>
</head>
<body
  data-spw-surface="software"
  data-spw-capture-flow="template"
  data-spw-capture-aspect="${spec.id}"
  data-spw-size-reason="${spec.id === 'fit' ? 'pretext-fit' : 'social-crop'}"
  data-spw-size-token="${token}"
  ${lensAttr}
  data-spw-theme-pack="glass-console">
  <div class="spw-template-capture-host" data-spw-capture-host="template" data-spw-aspect="${spec.id}" data-spw-size-token="${token}">
    ${snippetHtml}
  </div>
</body>
</html>`;
}

export function summarizePlan(jobs) {
  const groups = groupJobsByNavigation(jobs);
  const specimenNavs = groups.filter((group) => group.canvas === 'specimen').length;
  const cardNavs = groups.filter((group) => group.canvas === 'card').length;
  return {
    jobs: jobs.length,
    groups: groups.length,
    specimenNavs,
    cardNavs,
    byTrack: {
      qa: jobs.filter((job) => job.track === 'qa').length,
      social: jobs.filter((job) => job.track === 'social').length,
    },
    byKind: {
      component: jobs.filter((job) => job.kind === 'component').length,
      ecology: jobs.filter((job) => job.kind === 'ecology').length,
    },
    byFlow: Object.fromEntries(FLOWS.map((flow) => [flow, jobs.filter((job) => job.flow === flow).length])),
  };
}

export function buildCapturePlan({
  componentFixtures = [],
  ecologyFixtures = [],
  flows = DEFAULT_QA_FLOWS,
  viewports = [],
  aspects = [],
  ids = null,
  seats = null,
  includeComponents = true,
  includeEcology = false,
  includeSocial = false,
  includeQa = true,
  format = 'jpeg',
  changedFiles = null,
  lenses = [],
} = {}) {
  const idFilter = ids?.length ? new Set(ids) : null;
  const components = includeComponents
    ? componentFixtures.filter((fixture) => !idFilter || idFilter.has(fixture.id))
    : [];
  const ecology = includeEcology
    ? ecologyFixtures.filter((fixture) => !idFilter || idFilter.has(fixture.id))
    : [];

  let jobs = [];
  if (includeQa) {
    if (components.length) jobs = jobs.concat(buildComponentJobs(components, { flows, viewports, format }));
    if (ecology.length) jobs = jobs.concat(buildEcologyJobs(ecology, { viewports, seats, format }));
  }
  if (includeSocial) {
    if (components.length) {
      jobs = jobs.concat(buildSocialJobs(components, { aspects, format, ecology: false }));
    }
    if (ecology.length) {
      jobs = jobs.concat(buildSocialJobs(ecology, { aspects, format, ecology: true }));
    }
  }
  if (lenses.length) jobs = applyVisibilityLenses(jobs, lenses);
  if (changedFiles?.length) jobs = jobs.filter((job) => jobTouchesChanged(job, changedFiles));

  const groups = groupJobsByNavigation(jobs);
  return { jobs, groups, summary: summarizePlan(jobs) };
}

export function assetKindFor(job) {
  if (job?.track === 'social' && job?.canvas === 'card') return ASSET_KINDS.print;
  if (job?.flow === 'region' || job?.kind === 'ecology') return ASSET_KINDS.situation;
  if (job?.flow === 'component') return ASSET_KINDS.clip;
  if (job?.flow === 'template') return ASSET_KINDS.print;
  if (job?.flow === 'page') return ASSET_KINDS.page;
  return ASSET_KINDS.situation;
}

export function jobCost(job) {
  if (!job) return COST_BANDS.plan;
  if (job.canvas === 'card' || job.flow === 'template') return COST_BANDS.print;
  return COST_BANDS.set;
}

export function estimatePlanCost(jobs = []) {
  const groups = groupJobsByNavigation(jobs);
  const setNavs = groups.filter((group) => group.canvas === 'specimen').length;
  const prints = groups.filter((group) => group.canvas === 'card').length;
  const estMs = setNavs * COST_BANDS.set.ms + prints * COST_BANDS.print.ms;
  return {
    chrome: setNavs + prints > 0,
    setNavs,
    prints,
    estMs,
    learn: setNavs
      ? `${setNavs} situation-set navs (~${COST_BANDS.set.ms}ms each, clips share a nav) · ${prints} prints (~${COST_BANDS.print.ms}ms, no shell)`
      : prints
        ? `${prints} prints on the compose.css bed. No site shell.`
        : 'Plan only. No Chrome.',
  };
}

export function parseSpwCaptureTokens(tokens = [], knownIds = []) {
  const seats = [];
  const aspects = [];
  const viewports = [];
  const lenses = [];
  const ids = [];
  const expressions = [];
  let wantSet = false;
  let wantPrint = false;
  let wantSituation = false;
  for (const raw of tokens) {
    const token = String(raw || '').trim();
    if (!token || token.startsWith('-')) continue;
    if (token === 'set' || token === 'plate') wantSet = true;
    else if (token === 'print' || token === 'prints') wantPrint = true;
    else if (token === 'situation' || token === 'situations') wantSituation = true;
    else if (REGION_SEATS.includes(token)) seats.push(token);
    else if (SOCIAL_ASPECTS[token]) aspects.push(token);
    else if (DEVICE_REASONS[token] || VIEWPORT_ALIASES[token]) viewports.push(token);
    else if (VISIBILITY_LENSES[token]) lenses.push(token);
    else if (knownIds.includes(token)) ids.push(token);
    else if (/[\[{<]/.test(token)) expressions.push(token);
    else ids.push(token);
  }
  return {
    seats,
    aspects,
    viewports,
    lenses,
    ids,
    expressions,
    ecology: wantSituation || seats.length > 0,
    social: wantPrint || aspects.length > 0,
    set: wantSet,
  };
}

export function formatCapturePlanSpw(plan, { cost = null } = {}) {
  const jobs = plan?.jobs || [];
  const estimate = cost || estimatePlanCost(jobs);
  const lines = [
    '#>visual_capture',
    '#:plan #!situation #!print',
    `cost = \`${estimate.learn}\``,
    `priority = ${SEAT_PRIORITY.join(' > ')}`,
    'learn = `Situation sets share a nav. Prints skip the shell. Lenses multiply. Do not open Chrome to learn the plan.`',
    '',
  ];
  for (const job of jobs) {
    const kind = assetKindFor(job);
    const seat = job.seat || job.aspect || 'seat';
    const where = job.viewportId || job.aspect || '';
    const projection = where ? `<${where}>` : '';
    lines.push(`${job.id}[${seat}]{${kind.id}}${projection} = \`${jobCost(job).id} ~${jobCost(job).ms}ms\``);
  }
  return `${lines.join('\n')}\n`;
}
