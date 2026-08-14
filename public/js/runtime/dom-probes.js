/**
 * DOM probes — a Spw expression that answers about the page it is printed on.
 *
 * The routes carry 1,115 `<code>` blocks and 99 `<pre>` blocks, and not one of
 * them does anything. Meanwhile __SPW_SITE__ exposes eleven probe namespaces
 * that can only be reached from a console. A reader looking at a claim about
 * this page has no way to check it from the page.
 *
 * So a code block may carry `data-spw-probe` holding a Spw expression, and the
 * expression resolves against the live document:
 *
 *   ?shells[count]{}          how many elements sit in each liminality band
 *   ?walls[count]{}           braces and declared region purposes
 *   ?expressions[count]{}     authored expressions on this page
 *   ?kin[of]{subject}         expressions here sharing that subject
 *   ?field[arrival]{}         whether this page can conduct an arrival at all
 *   ?gathered[count]{term}    what the reader is carrying, optionally filtered
 *   ?overlap[here]{}          how much of the gathering belongs to this page
 *   ?spell[register]{}        what the gathering composes to, per register
 *
 * The subject names what is being asked about, the frame names how, and the body
 * carries an argument when one is needed — the same three slots the cauldron
 * renders into, so a probe reads like every other expression on the site rather
 * than like a function call that wandered in.
 *
 * Every result is written back as `data-spw-semantic-expression`, which makes an
 * answered probe a cauldron ingredient. Gathering a probe gathers a measurement
 * of the page you were standing on when you took it.
 *
 * Reads only. Nothing here mutates page state, and a probe that cannot resolve
 * says so rather than throwing — an unanswerable probe is a finding about the
 * page, not an error.
 */

import { composeRegisters, composedExpression } from '/public/js/interface/cauldron/registers.js';

const ATTR = Object.freeze({
  probe: 'data-spw-probe',
  state: 'data-spw-probe-state',
  result: 'data-spw-probe-result',
  expression: 'data-spw-semantic-expression',
});

const SHELL_BANDS = ['entry', 'threshold', 'deep', 'projected', 'settled'];

/**
 * Resolvers, keyed by subject. Each returns { value, reading } — the number and
 * the sentence, because a count without a reading is a number a reader has to
 * interpret alone.
 */
const RESOLVERS = {
  shells(_frame, _body, doc) {
    const bands = SHELL_BANDS
      .map((band) => [band, doc.querySelectorAll(`[data-spw-liminality="${band}"]`).length])
      .filter(([, n]) => n > 0);
    const total = bands.reduce((sum, [, n]) => sum + n, 0);
    return {
      value: bands.map(([band, n]) => `${band}:${n}`).join(' '),
      reading: bands.length > 1
        ? `${bands.length} bands over ${total} seats — this page has an interior`
        : 'one band or none — nothing here is crossed',
    };
  },

  walls(_frame, _body, doc) {
    const braces = doc.querySelectorAll('[data-spw-form="brace"]').length;
    const purposes = doc.querySelectorAll('[data-spw-region-purpose]').length;
    return {
      value: `${braces + purposes}`,
      reading: braces + purposes > 0
        ? `${braces} braces and ${purposes} declared purposes — potential can develop across these`
        : 'no walls, so no potential difference can form',
    };
  },

  expressions(_frame, _body, doc) {
    const nodes = doc.querySelectorAll(`[${ATTR.expression}]`);
    const distinct = new Set([...nodes].map((n) => n.getAttribute(ATTR.expression)));
    return {
      value: `${distinct.size}`,
      reading: `${nodes.length} elements carrying ${distinct.size} distinct expressions`,
    };
  },

  kin(_frame, body, doc) {
    if (!body) return { value: '', reading: 'kin needs a subject in the body' };
    const nodes = [...doc.querySelectorAll(`[${ATTR.expression}]`)];
    const sharing = nodes.filter((n) => (n.getAttribute(ATTR.expression) || '').startsWith(`${body}[`));
    return {
      value: `${sharing.length}`,
      reading: sharing.length
        ? `${sharing.length} expressions on this page share the subject ${body}`
        : `nothing here shares the subject ${body}`,
    };
  },

  /**
   * What the reader is carrying. A probe that reads the cauldron changes as the
   * reader gathers, so the same snippet on the same page answers differently
   * once they have collected something — the page describes the visit rather
   * than only itself.
   */
  gathered(_frame, body) {
    let items = [];
    try {
      items = JSON.parse(globalThis.localStorage?.getItem('spw-cauldron') || '[]');
    } catch {
      items = [];
    }
    if (!items.length) {
      return { value: '0', reading: 'nothing gathered yet — this reads differently once you collect something' };
    }
    if (body) {
      const matching = items.filter((i) => String(i?.expression || '').includes(body));
      return {
        value: `${matching.length}`,
        reading: matching.length
          ? `${matching.length} of ${items.length} gathered fragments mention ${body}`
          : `${items.length} gathered, none mentioning ${body}`,
      };
    }
    const operators = new Set(items.map((i) => i?.operator).filter(Boolean));
    return {
      value: `${items.length}`,
      reading: `${items.length} gathered across ${operators.size || 1} operator${operators.size === 1 ? '' : 's'}`,
    };
  },

  /**
   * Whether what the reader has gathered touches this page. The strongest form
   * of a snippet that changes: it reports the intersection of the visit and the
   * surface, so it is empty for a newcomer and specific for someone returning.
   */
  overlap(_frame, _body, doc) {
    let items = [];
    try {
      items = JSON.parse(globalThis.localStorage?.getItem('spw-cauldron') || '[]');
    } catch {
      items = [];
    }
    const here = new Set([...doc.querySelectorAll(`[${ATTR.expression}]`)]
      .map((n) => (n.getAttribute(ATTR.expression) || '').split('[')[0])
      .filter(Boolean));
    const shared = items.filter((i) => here.has(String(i?.expression || '').split('[')[0]));
    return {
      value: `${shared.length}`,
      reading: shared.length
        ? `${shared.length} gathered fragments share a subject with this page`
        : 'nothing you have gathered belongs to this page yet',
    };
  },

  /**
   * What the gathering amounts to, by each register's own composition rule.
   *
   * The other cauldron probes count. This one reads — valence sums, liminality
   * spans, fixity takes the least settled, and the result is a point in each
   * register rather than a tally. A reader watching this change as they gather is
   * watching a spell acquire coordinates.
   *
   * `?spell[valence]{}` narrows to one register; the bare form gives the whole
   * composed expression.
   */
  spell(frame) {
    let items = [];
    try {
      items = JSON.parse(globalThis.localStorage?.getItem('spw-cauldron') || '[]');
    } catch {
      items = [];
    }
    if (!items.length) {
      return { value: composedExpression([]), reading: 'an empty spell — every register sits at its identity' };
    }

    const composed = composeRegisters(items);
    if (frame && frame !== 'compose' && composed[frame]) {
      return { value: String(composed[frame].value), reading: composed[frame].reading };
    }
    return {
      value: composedExpression(items),
      reading: `${items.length} ingredients — ${composed.valence.reading}`,
    };
  },

  field(_frame, _body, doc) {
    const state = doc.documentElement.getAttribute('data-spw-arrival-field') || 'unreported';
    return {
      value: state,
      reading: state === 'conductive'
        ? 'this page can carry a perceptible arrival'
        : `arrival is ${state} here`,
    };
  },
};

/** subject[frame]{body} — the same shape the rest of the site writes. */
function parseProbe(expression = '') {
  const match = String(expression).trim().match(/^\??([\w-]+)(?:\[([^\]]*)\])?(?:\{([^}]*)\})?/);
  if (!match) return null;
  return { subject: match[1], frame: match[2] || '', body: match[3] || '' };
}

/** Answer one probe element. Never throws; an unresolvable probe reports itself. */
export function runProbe(element, doc = document) {
  const raw = element?.getAttribute?.(ATTR.probe);
  const parsed = parseProbe(raw);
  if (!parsed) {
    element?.setAttribute?.(ATTR.state, 'unparseable');
    return null;
  }

  const resolver = RESOLVERS[parsed.subject];
  if (!resolver) {
    element.setAttribute(ATTR.state, 'unknown');
    element.setAttribute(ATTR.result, `no resolver for ${parsed.subject}`);
    return null;
  }

  let answer;
  try {
    answer = resolver(parsed.frame, parsed.body, doc);
  } catch {
    element.setAttribute(ATTR.state, 'failed');
    return null;
  }

  element.setAttribute(ATTR.state, 'answered');
  element.setAttribute(ATTR.result, answer.value);
  element.setAttribute('title', answer.reading);
  // An answered probe is gatherable: the expression carries what was asked and
  // what this page replied, so a captured probe is a measurement with a place.
  element.setAttribute(
    ATTR.expression,
    `${parsed.subject}[${parsed.frame || 'count'}]{${answer.value.replace(/[^\w.:-]/g, '.')}}`,
  );
  return answer;
}

/** Answer every probe in a root. */
export function runProbes(root = document) {
  const found = [...root.querySelectorAll(`[${ATTR.probe}]`)];
  let answered = 0;
  for (const element of found) {
    if (runProbe(element, root.ownerDocument || document)) answered += 1;
  }
  return { found: found.length, answered };
}

export function initDomProbes(ctx = {}) {
  if (typeof document === 'undefined') return () => {};
  runProbes(document);

  // Re-answer after a soft navigation; the page a probe describes has changed.
  const bus = ctx.bus || globalThis.__SPW_SITE__?.bus;
  const off = bus?.on?.('spw:runtime-refresh', () => runProbes(document)) || null;

  return () => {
    off?.();
    document.querySelectorAll(`[${ATTR.state}]`).forEach((node) => {
      node.removeAttribute(ATTR.state);
      node.removeAttribute(ATTR.result);
    });
  };
}

export const DOM_PROBES_CONTRACT = Object.freeze({
  attrs: ATTR,
  subjects: Object.keys(RESOLVERS),
  shape: 'subject[frame]{body}',
  rule: 'read-only; an unresolvable probe reports itself rather than throwing',
});

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'dom-probes',
  mount: (ctx) => initDomProbes(ctx),
  describes: 'probe[dom]{subject.frame.body}<answered>',
  updates: [
    'inspect:data-spw-probe-state',
    'inspect:data-spw-probe-result',
    'residue:data-spw-semantic-expression',
  ],
  timingArc: 'idle-inspection',
  effectScope: 'local-dom bus',
});
