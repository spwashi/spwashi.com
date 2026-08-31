/**
 * Capture-plan brain for component + region ecology visual testing.
 *
 * Two tracks:
 *   qa      — device-reason viewports (pocket / fold / broadsheet) and their media queries
 *   social  — unique content-fit stills plus named feed crops that turn a combination
 *             into a postable card
 *
 * QA still vs anatomy:
 *   page / --stills  — the device frame a person would screenshot (one subject)
 *   region           — the seat's document box, which may be several viewports tall
 *
 * Pure functions. The Chrome runner consumes jobs; tests consume the same plan.
 */

import { createHash } from 'node:crypto';

import { VIEWPORT_STILL_CHECKS, VIEWPORT_STILL_RECIPES } from './viewport-still-recipes.mjs';

export const FLOWS = Object.freeze(['page', 'region', 'component', 'template']);
export const DEFAULT_QA_FLOWS = Object.freeze(['region', 'component']);
export const DEFAULT_QA_VIEWPORTS = Object.freeze(['pocket', 'fold', 'broadsheet']);
export const DEFAULT_ECOLOGY_VIEWPORTS = Object.freeze(['pocket', 'fold', 'broadsheet']);
export const LAYOUT_STACK = Object.freeze(['posture', 'seat', 'pack', 'gravity', 'resonance', 'still']);
export const DEFAULT_SOCIAL_ASPECTS = Object.freeze(['fit', 'square']);
/** Live capture must not inherit the 60s CDP default. Font/image waits race these caps. */
export const CAPTURE_MEASURE = Object.freeze({
  evaluateTimeoutMs: 8000,
  fontWaitMs: 1200,
  imageWaitMs: 2000,
  importWaitMs: 2500,
});
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
      `stack ${LAYOUT_STACK.join('>')}`,
      job.flow,
      job.seat && `seat ${job.seat}`,
      job.viewportId || job.aspect,
      job.sizeReason,
      job.media && `media ${job.media}`,
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

/**
 * Describe what occupies a captured box without treating prose density as
 * layout authority. An image-led card is not vacant merely because it has few
 * characters, and a light composition is a review clue rather than a repair.
 */
export function assessCaptureOccupancy(job = {}, snapshot = {}) {
  const text = snapshot.text ?? '';
  const textLength = snapshot.textLength ?? text.length ?? 0;
  const area = snapshot.area ?? (snapshot.width && snapshot.height ? snapshot.width * snapshot.height : 0);
  const childCount = snapshot.childCount ?? 0;
  const mediaCount = snapshot.mediaCount ?? 0;
  const interactiveCount = snapshot.interactiveCount ?? 0;
  const characterDensity = area > 0 ? (textLength / area) * 1000 : 0;

  if (area <= 0) {
    return { occupancy: 'unknown', reason: 'unmeasured-box', characterDensity, mediaCount, interactiveCount };
  }
  if (!textLength && !mediaCount && !childCount) {
    return { occupancy: 'empty', reason: 'no-rendered-content', characterDensity, mediaCount, interactiveCount };
  }
  if (mediaCount > 0 && textLength < 24) {
    return { occupancy: 'visual-led', reason: 'media-carries-presence', characterDensity, mediaCount, interactiveCount };
  }

  const presenceUnits = textLength + (mediaCount * 180) + (interactiveCount * 24);
  const presenceDensity = presenceUnits / Math.max(1, area / 1000);
  const occupancy = presenceDensity < 0.45
    ? 'light'
    : presenceDensity > 3.2
      ? 'dense'
      : 'balanced';

  return {
    occupancy,
    reason: occupancy === 'light' ? 'low-presence-density' : null,
    characterDensity,
    mediaCount,
    interactiveCount,
  };
}

function expressionToken(value = '', fallback = 'unknown') {
  const token = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return token || fallback;
}

/** A capture annotation, kept separate from the component's authored expression. */
export function formatCaptureExpression(job = {}, snapshot = {}) {
  const mode = expressionToken(job.aspect || job.viewportId || 'fit', 'fit');
  const flow = expressionToken(job.flow || 'component', 'component');
  const sizeReason = expressionToken(job.sizeReason || sizeReasonFor(job), 'device-reason');
  const occupancy = expressionToken(snapshot.occupancy || 'unknown', 'unknown');
  const subject = expressionToken(
    snapshot.semantics?.feature
      || snapshot.semantics?.kind
      || job.fixtureId
      || job.id
      || job.kind,
    'component',
  );
  return `still[${mode}]{${flow}.${sizeReason}.${occupancy}}<${subject}>`;
}

export function enhancementHint(job, snapshot = {}) {
  const occupancy = assessCaptureOccupancy(job, snapshot);
  if (occupancy.occupancy === 'empty') {
    return 'Capture box is empty — check fixture hydration or selector ownership before reviewing composition.';
  }
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
  const subject = assessViewportSubject(job, snapshot);
  if (subject.fit === 'overflows-viewport') {
    return subject.hint;
  }
  return null;
}

/**
 * A region clip may be several device-frames tall. Subject judgment belongs
 * on a viewport still; the tall clip is anatomy.
 */
export function assessViewportSubject(job = {}, snapshot = {}, viewport = null) {
  const vh = viewport?.height
    || DEVICE_REASONS[job.viewportId]?.height
    || Object.values(DEVICE_REASONS).find((entry) => entry.viewport === job.viewportId)?.height
    || 0;
  const boxH = snapshot.height || 0;
  if (!vh || !boxH) {
    return { fit: 'unknown', viewportsTall: null, hint: null };
  }
  const viewportsTall = Number((boxH / vh).toFixed(2));
  if ((job.flow === 'region' || job.kind === 'ecology') && !job.still && viewportsTall > 1.25) {
    return {
      fit: 'overflows-viewport',
      viewportsTall,
      hint: 'Region is taller than one device frame. Use a viewport still (--stills) for subject judgment; keep the region clip for anatomy.',
    };
  }
  if (job.still || job.flow === 'page') {
    return {
      fit: viewportsTall <= 1.15 ? 'fills-frame' : 'in-frame',
      viewportsTall,
      hint: null,
    };
  }
  return { fit: 'in-frame', viewportsTall, hint: null };
}

/** Compositor blanks compress hard. A small real clip can be well under 40KB. */
export function isBlankStill(buffer, job, clip = null) {
  const bytes = buffer?.length || 0;
  const pixels = Math.max(0, (clip?.width || 0) * (clip?.height || 0));
  if (bytes < 800) return true;
  if (job?.flow === 'page' && bytes < 48000) return true;
  if (pixels > 10000 && bytes / pixels < 0.025 && bytes < 25000) return true;
  if ((job?.flow === 'component' || job?.flow === 'template') && bytes < 500) return true;
  return false;
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
  phablet: Object.freeze({
    id: 'phablet',
    viewport: 'phablet',
    width: 430,
    height: 932,
    media: '(max-width: 45rem) and (min-width: 26.25rem) and (max-aspect-ratio: 3/4)',
    wonder: 'Tall one-hand. Chip rows and wrap before leftover tracks; not a second pocket alias.',
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
    const rawX = cropped.viewportX ?? 0;
    const rawY = cropped.viewportY ?? 0;
    const viewportX = Math.max(0, Math.floor(rawX));
    const viewportY = Math.max(0, Math.floor(rawY));
    const adjustedWidth = cropped.width + Math.min(0, rawX);
    const adjustedHeight = cropped.height + Math.min(0, rawY);
    return {
      x: viewportX,
      y: viewportY,
      width: Math.max(2, Math.min(vpW - viewportX, Math.ceil(adjustedWidth))),
      height: Math.max(2, Math.min(vpH - viewportY, Math.ceil(adjustedHeight))),
      scale: 1,
      aspect: cropped.aspect,
      ratioLabel: cropped.ratioLabel,
      coordinateSpace: 'viewport',
      captureBeyondViewport: false,
    };
  }
  const rawDocX = cropped.x ?? 0;
  const rawDocY = cropped.y ?? 0;
  const docX = Math.max(0, Math.floor(rawDocX));
  const docY = Math.max(0, Math.floor(rawDocY));
  const adjustedDocWidth = cropped.width + Math.min(0, rawDocX);
  const adjustedDocHeight = cropped.height + Math.min(0, rawDocY);
  return {
    x: docX,
    y: docY,
    width: Math.max(2, Math.ceil(adjustedDocWidth)),
    height: Math.max(2, Math.min(maxHeight, Math.ceil(adjustedDocHeight))),
    scale: 1,
    aspect: cropped.aspect,
    ratioLabel: cropped.ratioLabel,
    coordinateSpace: 'document',
    captureBeyondViewport: true,
  };
}

export function clipSpaceForJob(job) {
  if (job?.clipSpace === 'viewport' || job?.clipSpace === 'document') return job.clipSpace;
  // Page and named viewport stills are the device frame, including chrome.
  if (!job || job.flow === 'page' || job.still) return null;
  if (job.canvas === 'card' || job.flow === 'template' || job.flow === 'region' || job.flow === 'component') {
    return 'document';
  }
  return 'document';
}

export function isMissedSpecimen(job, box) {
  if (!job || job.flow === 'page' || job.canvas === 'card') return false;
  return looksLikeShellChrome(box?.text);
}

function viewportFamily(id) {
  const alias = VIEWPORT_ALIASES[id] || id;
  const reason = DEVICE_REASONS[id]
    || Object.values(DEVICE_REASONS).find((entry) => entry.id === id || entry.viewport === id);
  return new Set([id, alias, reason?.id, reason?.viewport].filter(Boolean));
}

export function viewportMatchesScenario(viewportId, layoutScenarios) {
  if (!layoutScenarios?.length) return true;
  const wanted = viewportFamily(viewportId);
  return layoutScenarios.some((scenario) => {
    for (const token of viewportFamily(scenario)) {
      if (wanted.has(token)) return true;
    }
    return false;
  });
}

export function deviceReasonFor(viewportId) {
  return DEVICE_REASONS[viewportId]
    || Object.values(DEVICE_REASONS).find((entry) => entry.viewport === viewportId)
    || null;
}

export function browseStem(job) {
  return String(job?.id || 'still')
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    || 'still';
}

export function conditionClusterKey(conditions = {}, attention = {}) {
  const pack = conditions?.themePack ? String(conditions.themePack) : '';
  const dark = conditions?.colorMode === 'dark';
  const hc = conditions?.highContrast === 'on' || conditions?.highContrast === true;
  if (pack && dark && hc) return `${pack}-dark-high-contrast`;
  if (pack && dark) return `${pack}-dark`;
  if (pack && hc) return `${pack}-high-contrast`;
  if (pack) return pack;
  if (hc && dark) return 'dark-high-contrast';
  if (hc) return 'high-contrast';
  if (dark) return 'dark-mode';
  if (conditions?.reducedMotion === 'reduce' || conditions?.reducedMotion === true) return 'reduced-motion';
  if (attention?.section || attention?.probe) return 'section-pin';
  return '';
}

export function captureSearchParams(conditions = {}, attention = {}) {
  const params = new URLSearchParams();
  if (conditions.colorMode) params.set('color-mode', conditions.colorMode);
  if (conditions.themePack) params.set('theme', conditions.themePack);
  if (conditions.highContrast === 'on' || conditions.highContrast === true) {
    params.set('high-contrast', 'on');
  }
  if (conditions.enhancement) params.set('enhancement', conditions.enhancement);
  if (attention.section) params.set('pin', attention.section);
  if (attention.probe) params.set('probe', attention.probe);
  return params;
}

export function specimenNavigationKey(job) {
  const lens = job?.lens ? `${job.lens.id}:${job.lens.value}` : 'plain';
  const env = conditionClusterKey(job?.conditions);
  const pin = job?.attention?.section || '';
  return `${job?.specimenRoute || '/'}|${job?.viewportId || ''}|${env}|${pin}|${lens}`;
}

/** Folder a person arrows through in the file tree. JSON and errors stay out. */
export function browseCluster(job) {
  if (job?.track === 'social' || job?.canvas === 'card' || job?.flow === 'template') return 'social';
  const viewport = job?.viewportId || 'desktop';
  const env = conditionClusterKey(job?.conditions, job?.attention);
  return env ? `${viewport}--${env}` : viewport;
}

function browseRank(job) {
  const recipe = VIEWPORT_STILL_RECIPES.findIndex((recipe) => recipe.id === job?.id);
  if (recipe >= 0) return recipe;
  if (job?.still) return 50;
  if (job?.flow === 'page') return 80;
  const seat = SEAT_PRIORITY.indexOf(job?.seat);
  if (seat >= 0) return 100 + seat;
  return 200;
}

export function compareBrowseOrder(a, b) {
  const rank = browseRank(a) - browseRank(b);
  if (rank) return rank;
  return String(a?.id || '').localeCompare(String(b?.id || ''));
}

export function jobFile(job, format = 'jpeg') {
  const ext = extFor(format);
  const stem = browseStem(job);
  if (job?.track === 'social' || job?.canvas === 'card' || job?.flow === 'template') {
    return `captures/social/${stem}--${job.aspect || 'fit'}.${ext}`;
  }
  const cluster = browseCluster(job);
  if (job?.walk) {
    const slug = routeFileId(job.specimenRoute);
    return `captures/${cluster}/${slug}--00000.${ext}`;
  }
  const seq = String(job?.browseIndex || 1).padStart(2, '0');
  return `captures/${cluster}/${seq}-${stem}.${ext}`;
}

export function errorFile(kind, job, format = 'jpeg') {
  const ext = extFor(format);
  const cluster = job?.viewportId || browseCluster(job) || 'qa';
  return `captures/errors/${cluster}--${kind}--${browseStem(job)}.${ext}`;
}

/** Number stills inside each viewport folder so arrow-key preview follows review order. */
export function assignBrowsePaths(jobs, format = 'jpeg') {
  const clusters = new Map();
  for (const job of jobs || []) {
    const cluster = browseCluster(job);
    if (!clusters.has(cluster)) clusters.set(cluster, []);
    clusters.get(cluster).push(job);
  }
  for (const group of clusters.values()) {
    group.sort(compareBrowseOrder);
    group.forEach((job, index) => {
      job.browseIndex = index + 1;
      job.file = jobFile(job, format);
    });
  }
  return jobs || [];
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
    const key = specimenNavigationKey(job);
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
  flows = ['region'],
} = {}) {
  const seatFilter = seats?.length ? new Set(seats) : null;
  const wantRegion = !flows?.length || flows.includes('region');
  const wantPage = Boolean(flows?.includes('page'));
  const jobs = [];
  const pageSeen = new Set();
  for (const fixture of fixtures) {
    if (seatFilter && !seatFilter.has(fixture.seat)) continue;
    for (const viewport of viewports) {
      if (!viewportMatchesScenario(viewport.id, fixture.layoutScenarios)) continue;
      const reason = deviceReasonFor(viewport.id);
      if (wantPage) {
        pushPageJob(jobs, pageSeen, fixture, viewport, format);
      }
      if (!wantRegion) continue;
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

function stillJobFromRecipe(recipe, viewport, format) {
  const reason = deviceReasonFor(viewport.id);
  return {
    kind: 'ecology',
    id: recipe.id,
    fixtureId: recipe.fixtureId || recipe.id,
    label: recipe.label,
    track: 'qa',
    flow: 'page',
    still: true,
    viewportId: viewport.id,
    specimenRoute: recipe.specimenRoute,
    selector: recipe.selector,
    regionSelector: recipe.selector,
    seat: recipe.seat || null,
    aspect: null,
    canvas: 'specimen',
    snippet: null,
    cssOwner: recipe.cssOwner || null,
    sourceFiles: [...(recipe.sourceFiles || [])],
    captureValue: recipe.captureValue || '',
    wonder: recipe.wonder || reason?.wonder || recipe.captureValue || '',
    sizeReason: 'device-reason',
    sizeToken: 'measure-reading',
    media: reason?.media || null,
    prepare: recipe.prepare || null,
    conditions: recipe.conditions || null,
    attention: recipe.attention || null,
    publish: ['layout-qa', 'design-review', 'agent-brief'],
  };
}

export function buildViewportStillJobs(recipes = VIEWPORT_STILL_RECIPES, {
  viewports = [],
  format = 'jpeg',
  ids = null,
  seats = null,
  includeChecks = false,
  checkRecipes = VIEWPORT_STILL_CHECKS,
} = {}) {
  const idFilter = ids instanceof Set ? ids : (ids?.length ? new Set(ids) : null);
  const catalog = includeChecks ? [...recipes, ...checkRecipes] : [...recipes];
  const jobs = [];
  for (const recipe of catalog) {
    if (idFilter && !idFilter.has(recipe.id) && !idFilter.has(recipe.fixtureId)) continue;
    if (seats?.length && recipe.seat && !seats.includes(recipe.seat)) continue;
    for (const viewport of viewports) {
      if (!viewportMatchesScenario(viewport.id, recipe.layoutScenarios)) continue;
      jobs.push(stillJobFromRecipe(recipe, viewport, format));
    }
  }
  return assignBrowsePaths(jobs, format);
}

export function buildWalkJobs({
  routes = ['/'],
  viewports = [],
  format = 'jpeg',
  maxSlices = 8,
  conditions = null,
} = {}) {
  const jobs = [];
  for (const route of routes) {
    for (const viewport of viewports) {
      jobs.push({
        kind: 'ecology',
        id: `walk-${routeFileId(route)}`,
        fixtureId: routeFileId(route),
        label: `Walk ${route}`,
        track: 'qa',
        flow: 'page',
        still: true,
        walk: true,
        maxSlices,
        viewportId: viewport.id,
        specimenRoute: route,
        selector: null,
        regionSelector: null,
        seat: null,
        aspect: null,
        canvas: 'specimen',
        snippet: null,
        cssOwner: null,
        sourceFiles: [],
        captureValue: 'Viewport-tall slices from the top of the route to the bottom.',
        wonder: 'A walk should reach the last screen, not stop after the opening.',
        sizeReason: 'device-reason',
        sizeToken: 'measure-reading',
        media: deviceReasonFor(viewport.id)?.media || null,
        prepare: null,
        conditions,
        attention: null,
        publish: ['layout-qa', 'design-review', 'agent-brief'],
      });
    }
  }
  return assignBrowsePaths(jobs, format);
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
  includeStills = false,
  includeChecks = false,
  includeWalk = false,
  walkRoutes = ['/'],
  maxSlices = 8,
  stillRecipes = VIEWPORT_STILL_RECIPES,
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
    if (ecology.length) jobs = jobs.concat(buildEcologyJobs(ecology, { viewports, seats, format, flows }));
  }
  if (includeStills) {
    jobs = jobs.concat(buildViewportStillJobs(stillRecipes, {
      viewports,
      format,
      ids: idFilter,
      seats,
      includeChecks,
    }));
  }
  if (includeWalk) {
    jobs = jobs.concat(buildWalkJobs({
      routes: walkRoutes,
      viewports,
      format,
      maxSlices,
    }));
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
  assignBrowsePaths(jobs, format);
  const groups = groupJobsByNavigation(jobs);
  return { jobs, groups, summary: summarizePlan(jobs) };
}

export function assetKindFor(job) {
  if (job?.track === 'social' && job?.canvas === 'card') return ASSET_KINDS.print;
  if (job?.still || job?.flow === 'page') return ASSET_KINDS.page;
  if (job?.flow === 'region' || job?.kind === 'ecology') return ASSET_KINDS.situation;
  if (job?.flow === 'component') return ASSET_KINDS.clip;
  if (job?.flow === 'template') return ASSET_KINDS.print;
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
  let wantStills = false;
  let wantChecks = false;
  let wantWalk = false;
  for (const raw of tokens) {
    const token = String(raw || '').trim();
    if (!token || token.startsWith('-')) continue;
    if (token === 'set' || token === 'plate') wantSet = true;
    else if (token === 'print' || token === 'prints') wantPrint = true;
    else if (token === 'situation' || token === 'situations') wantSituation = true;
    else if (token === 'still' || token === 'stills' || token === 'page') wantStills = true;
    else if (token === 'check' || token === 'checks') wantChecks = true;
    else if (token === 'walk') wantWalk = true;
    else if (token === 'survey') {
      wantStills = true;
      wantChecks = true;
      wantWalk = true;
    }
    else if (token === 'ambient') wantStills = true;
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
    stills: wantStills,
    checks: wantChecks,
    walk: wantWalk,
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
    `stack = \`${LAYOUT_STACK.join(' > ')}\``,
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
