/**
 * Composing Spw text from parts — one place, two output forms.
 *
 * Three surfaces build Spw from structured input: the expression lab edits an
 * inline expression, the toolmaker notebook compiles a surface block, and the
 * cauldron registers render a composed spell. Each carried its own assembly, so
 * a change to how a handle is sanitised or how a sigil is chosen had to be made
 * in whichever file happened to need it.
 *
 * The forms are genuinely different and are kept apart rather than merged:
 *
 *   expression   subject[frame]{body}<projection>
 *                inline, sits in prose, is what a cauldron ingredient renders as
 *
 *   surface      #>anchor, #:axis #!value lines, then a body
 *                a file, addressable by anchor, is what the corpus is made of
 *
 * What they share is smaller than a renderer and more useful: how a handle
 * becomes safe to address, how a sigil is chosen when none was given, and how
 * empty parts are dropped rather than rendered as empty brackets. Those are the
 * rules that were being restated, and restating them is how two surfaces drift
 * into disagreeing about what a legal handle is.
 *
 * Pure. No DOM, no storage, no parser — this builds strings from parts and
 * nothing reads them back. Parsing belongs to the kernel.
 */

/** Default when a form leaves the operator unset. Ground carries without spending. */
const DEFAULT_SIGIL = '#>';

/**
 * An addressable handle.
 *
 * Anchors are referenced by other surfaces, so the character set has to stay
 * narrow enough that a citation never needs escaping. Lowercase, word
 * characters and underscores; anything else collapses to a single underscore.
 */
export function sanitizeHandle(value = '', fallback = 'untitled') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
}

/**
 * An axis value.
 *
 * Deliberately not `sanitizeHandle`: operator sigils are legal annotation
 * values, and `#!~` is a meaningful thing to write. Running a handle sanitiser
 * over it strips every sigil to nothing and the axis silently reads as unset —
 * a failure invisible until a query by axis returns empty. Only whitespace,
 * which would break the annotation, is collapsed.
 */
function sanitizeAxisValue(value) {
  return String(value).trim().replace(/\s+/g, '_') || 'unset';
}

/** Drop empties and duplicates, preserving author order. */
function slotParts(values) {
  return (Array.isArray(values) ? values : [values])
    .map((v) => (v == null ? '' : String(v).trim()))
    .filter(Boolean)
    .filter((v, i, all) => all.indexOf(v) === i);
}

/**
 * Render the inline form.
 *
 * An absent slot is omitted rather than rendered empty: `subject[]{}` claims
 * that a frame and body were considered and found empty, which is a different
 * statement from not having said.
 */
export function composeExpression({ sigil = '', subject = '', frame = [], body = [], projection = '' } = {}) {
  const nucleus = String(subject || '').trim();
  if (!nucleus) return '';

  const framePart = slotParts(frame);
  const bodyPart = slotParts(body);
  const projectionPart = String(projection || '').trim();

  return `${sigil || ''}${nucleus}`
    + (framePart.length ? `[${framePart.join('.')}]` : '')
    + (bodyPart.length ? `{${bodyPart.join('.')}}` : '')
    + (projectionPart ? `<${projectionPart}>` : '');
}

/**
 * A mode-switch names the seat in [ ] and the interaction queue in { }.
 * Variants are siblings, not a dotted path. Do not join them with `.`.
 */
export function composeModeSeatExpression({ subject = 'lens', seat = 'mode' } = {}) {
  const nucleus = String(subject || 'lens').trim() || 'lens';
  const mode = String(seat || 'mode').trim() || 'mode';
  return `${nucleus}[${mode}]{open.sit}`;
}

/** One job per wrap. `{ }` holds a path of one ground, never sibling verbs. */
export const WRAP_JOBS = Object.freeze({
  mode: Object.freeze({ wrap: 'mode', job: 'display', verb: 'sit', body: 'open.sit' }),
  direction: Object.freeze({ wrap: 'direction', job: 'navigate', verb: 'travel', body: 'travel' }),
  scene: Object.freeze({ wrap: 'scene', job: 'learn', verb: 'enter', body: 'stage' }),
  wonder: Object.freeze({ wrap: 'wonder', job: 'learn', verb: 'inspect', body: 'kin' }),
});

export function composeWrapJobExpression({
  wrap = 'mode',
  subject = 'page',
  seat = '',
  job = '',
} = {}) {
  const spec = WRAP_JOBS[wrap] || WRAP_JOBS.mode;
  const projection = String(job || spec.job).trim() || spec.job;
  if (wrap === 'mode') {
    return `${composeModeSeatExpression({ subject, seat: seat || 'mode' })}<${projection}>`;
  }
  if (wrap === 'direction') {
    return composeExpression({
      subject: subject || 'rooms',
      body: spec.body.split('.'),
      projection,
    });
  }
  if (wrap === 'scene') {
    return composeExpression({
      sigil: '(',
      subject: subject || 'look',
      body: spec.body.split('.'),
      projection,
    });
  }
  return composeExpression({
    sigil: '?',
    subject: subject || 'spw',
    body: spec.body.split('.'),
    projection,
  });
}

export function formatWrapJobChip({ wrap = 'mode', seat = 'mode', nextLabel = 'rooms' } = {}) {
  return formatWrapJobVariants({ wrap, seat, nextLabel }).normal;
}

export function formatWrapJobVariants({
  wrap = 'mode',
  seat = 'mode',
  nextLabel = 'rooms',
  subject = 'page',
} = {}) {
  const mode = String(seat || 'mode').trim() || 'mode';
  const handle = String(nextLabel || 'rooms').trim().replace(/^#>/, '') || 'rooms';
  const expression = composeWrapJobExpression({ wrap, subject, seat: mode, job: WRAP_JOBS[wrap]?.job });
  if (wrap === 'mode') {
    return {
      entry: 'change view',
      normal: `[${mode}] sit lens`,
      technical: expression,
    };
  }
  if (wrap === 'direction') {
    return {
      entry: 'next room',
      normal: `{${handle}} next frame`,
      technical: expression,
    };
  }
  if (wrap === 'scene') {
    return {
      entry: 'look closer',
      normal: '(look) learn more',
      technical: expression,
    };
  }
  return {
    entry: 'find related',
    normal: `?[${mode}]`,
    technical: expression,
  };
}

export function describeWrapScan({
  context = 'reading',
  seat = 'mode',
  nextLabel = '',
  token = '#>',
  label = 'section',
} = {}) {
  if (context === 'inspecting') {
    return { token: `[${String(seat || 'mode').trim() || 'mode'}]`, label: 'sit lens' };
  }
  if (context === 'browsing') {
    return { token: '{ }', label: String(nextLabel || 'next frame').trim() || 'next frame' };
  }
  if (context === 'comparing') {
    return { token: '(look)', label: 'learn more' };
  }
  return { token, label };
}

/**
 * Render the surface form.
 *
 * `axes` is an object of axis name to value; each becomes a `#:name #!value`
 * line. Names take the handle rules; values do not — see sanitizeAxisValue for
 * why a sigil has to survive.
 */
export function composeSurface({ anchor = '', axes = {}, body = '', fallbackAnchor = 'untitled_note' } = {}) {
  const handle = sanitizeHandle(anchor, fallbackAnchor);

  const axisLines = Object.entries(axes)
    .filter(([, value]) => value != null && String(value).trim())
    .map(([name, value]) => `#:${sanitizeHandle(name, 'axis')} #!${sanitizeAxisValue(value)}`);

  return [
    `#>${handle}`,
    ...axisLines,
    '',
    String(body || ''),
  ].join('\n');
}

/**
 * The operator to annotate with, defaulting to ground when a form leaves it
 * unset. Sigils and operator names both pass through as written — the kernel
 * resolves either spelling, so normalising here would only pick a winner the
 * caller did not ask for.
 */
export function sigilFor(operator = '') {
  return String(operator || '').trim() || DEFAULT_SIGIL;
}

export const SPW_COMPOSE_CONTRACT = Object.freeze({
  forms: ['expression', 'surface'],
  rule: 'empty slots are omitted, never rendered empty',
  pure: true,
});
