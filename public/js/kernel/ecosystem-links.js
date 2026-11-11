/**
 * ecosystem-links.js — addresses that carry Spw from this site to its peers.
 *
 * factshift.center lays a line out as a canvas; spw.quest is the notation as a
 * tool. Each reads Spw from its own address forms, and this file only mirrors
 * them (parser-link.js does the same for the literal parser). Pure: text and
 * options in, an href or null out, so a component renders a plain link that
 * can be copied or opened elsewhere.
 *
 *   factshift.center  /?spw=<one line>        up to 400 characters (app init/root.ts)
 *                     /#spw64=<base64url>     a whole script, read in the browser and
 *                                             never sent to a server (app spw-talk.ts)
 *                     ?<key>=<value>          configuration, only keys in its version.json
 *                                             query list, each value checked here
 *   spw.quest         /build?script=…#build   up to 1800 characters (SHARE_MAX, src/build.js)
 *                     /build#spw64=…          past that, read in the browser (readSpw64)
 *                     filename=<name>.spw     the file's name in the editor (buildFrom)
 *                     /pivot?line=<one line>  up to 200 characters (PIVOT_LIMIT, src/pivot.js)
 *
 * Names ride in the payload (.agents/plans/spw-quest/expression-first.md, ask
 * 18): a spell's name is its own #>name line, as the walk's is #>walk. A form
 * that carries a script carries the name as its first line; ?spw= holds one
 * line, so it has no room for a name and goes without one.
 */

export const FACTSHIFT_ORIGIN = 'https://factshift.center';
export const QUEST_ORIGIN = 'https://spw.quest';

/** factshift.center holds one line of up to this many characters in ?spw=. */
export const CANVAS_LINE_MAX = 400;
/** spw.quest's /build carries a whole script in ?script= up to this many characters. */
export const QUEST_SHARE_MAX = 1800;
/** spw.quest's /pivot turns one line of up to this many characters. */
export const PIVOT_LINE_MAX = 200;
/** The slots /pivot groups its turns by (GROUP_ORDER, src/pivot.js), each an anchor on the page. */
export const PIVOT_SLOTS = Object.freeze(new Set(['charge', 'subject', 'mode', 'body', 'scope', 'projection', 'join']));
/** The longest script either peer takes (spw.quest's MAX_SCRIPT); past it nothing carries. */
export const SCRIPT_MAX = 65536;

/** What each door does, said once so every component offers it in the same words. */
export const ECOSYSTEM_JOBS = Object.freeze({
  canvas: Object.freeze({ host: 'factshift.center', label: 'lay out on the canvas', title: 'Opens factshift.center with this Spw laid out as a canvas' }),
  build: Object.freeze({ host: 'spw.quest', label: 'take apart on spw.quest', title: "Opens spw.quest's editor holding this Spw" }),
  pivot: Object.freeze({ host: 'spw.quest', label: 'pivot on spw.quest', title: 'Opens spw.quest one change away from this line' }),
});

const WORD = /^[A-Za-z_][\w-]*$/;
const word = (max) => (value) => {
  const text = String(value ?? '').trim();
  return text.length <= max && WORD.test(text) ? text : null;
};
const oneOf = (pattern) => (value) => (pattern.test(String(value ?? '')) ? String(value) : null);
const flag = (value) => {
  if (value === true || value === 1 || value === '1') return '1';
  if (value === false || value === 0 || value === '0') return '0';
  return null;
};
const number = (value) => {
  const text = String(value ?? '').trim();
  return text && Number.isFinite(Number(text)) ? String(Number(text)) : null;
};
const integer = (value) => (number(value) !== null && Number.isInteger(Number(value)) ? String(Number(value)) : null);
const lineText = (max) => (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

/**
 * Configuration factshift.center reads from its address, in the order an
 * address writes it. A key the app does not read, or one that changes more
 * than this visit (reset clears its storage, doFetch reaches a server), is
 * never passed. `title` is line-only: holding a script's line retitles the page.
 */
export const FACTSHIFT_CONFIG = Object.freeze({
  mode: Object.freeze({ check: oneOf(/^(reflex|color|map|filter|node|query|story|spw)$/) }),
  display: Object.freeze({ check: oneOf(/^(nodes|words|edges)(-(nodes|words|edges))?$/) }),
  zoom: Object.freeze({ check: flag }),
  names: Object.freeze({ check: word(32) }),
  story: Object.freeze({ check: word(40) }),
  intent: Object.freeze({ check: integer }),
  charge: Object.freeze({ check: number }),
  linkStrength: Object.freeze({ check: number }),
  centerStrength: Object.freeze({ check: number }),
  velocityDecay: Object.freeze({ check: number }),
  title: Object.freeze({ check: lineText(120), lineOnly: true }),
});

/** Text as base64url of its UTF-8 bytes: the #spw64= form both peers read. */
export function toSpw64(text) {
  const bytes = new TextEncoder().encode(String(text ?? ''));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A name as a Spw word (frost-hearth → frost_hearth), or '' when nothing usable is left. */
export function spellName(raw) {
  const text = String(raw ?? '').trim().replace(/^#>/, '').replace(/[^A-Za-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
  return /^[A-Za-z_]\w*$/.test(text) ? text : '';
}

/** The name a text already carries: its first line opens with #>name. */
export function carriedName(text) {
  const first = String(text ?? '').trim().split('\n', 1)[0];
  return first.match(/^#>([A-Za-z_][\w.-]*)/)?.[1] || '';
}

/** The text with its name as its own first line, unless it already carries one. */
export function withName(text, name) {
  const body = String(text ?? '').trim();
  const spell = spellName(name);
  return !body || !spell || carriedName(body) ? body : `#>${spell}\n${body}`;
}

const query = (pairs) => pairs.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');

/** The configuration factshift.center understands, checked and in order, for one form. */
export function canvasConfig(config = {}, { form = 'line' } = {}) {
  const pairs = [];
  for (const [key, rule] of Object.entries(FACTSHIFT_CONFIG)) {
    if (!config || !Object.hasOwn(config, key) || (rule.lineOnly && form !== 'line')) continue;
    const value = rule.check(config[key]);
    if (value !== null) pairs.push([key, value]);
  }
  return pairs;
}

/**
 * A canvas on factshift.center. One line that fits goes by ?spw=, readable
 * and kept in the address; anything else goes whole by #spw64=, named.
 */
export function canvasHref(text, { name = '', config = {} } = {}) {
  const body = String(text ?? '').trim();
  if (!body) return null;
  if (!body.includes('\n') && body.length <= CANVAS_LINE_MAX) {
    return `${FACTSHIFT_ORIGIN}/?${query([['spw', body], ...canvasConfig(config, { form: 'line' })])}`;
  }
  const named = withName(body, name);
  const script = named.length <= SCRIPT_MAX ? named : body;
  if (script.length > SCRIPT_MAX) return null;
  const settings = query(canvasConfig(config, { form: 'script' }));
  return `${FACTSHIFT_ORIGIN}/${settings ? `?${settings}` : ''}#spw64=${toSpw64(script)}`;
}

/**
 * spw.quest's editor holding the script, named. Up to QUEST_SHARE_MAX it
 * travels in ?script=, so the page arrives already reading it; past that it
 * travels by #spw64=. The name, carried or given, is also the file's name.
 */
export function questBuildHref(text, { name = '' } = {}) {
  const body = String(text ?? '').trim();
  if (!body) return null;
  const named = withName(body, name);
  const script = named.length <= SCRIPT_MAX ? named : body;
  if (script.length > SCRIPT_MAX) return null;
  const file = carriedName(script);
  const pairs = file ? [['filename', `${file}.spw`]] : [];
  if (script.length <= QUEST_SHARE_MAX) return `${QUEST_ORIGIN}/build?${query([...pairs, ['script', script]])}#build`;
  return `${QUEST_ORIGIN}/build${pairs.length ? `?${query(pairs)}` : ''}#spw64=${toSpw64(script)}`;
}

/** spw.quest's pivot, one change away from a line; `slot` opens on that slot's turns. Null for a script or a line too long to turn. */
export function questPivotHref(text, { slot = '' } = {}) {
  const line = String(text ?? '').trim();
  if (!line || line.includes('\n') || line.length > PIVOT_LINE_MAX) return null;
  return `${QUEST_ORIGIN}/pivot?${query([['line', line]])}${PIVOT_SLOTS.has(slot) ? `#turn-${slot}` : ''}`;
}

const HREF = Object.freeze({
  canvas: (text, options) => canvasHref(text, options),
  build: (text, options) => questBuildHref(text, options),
  pivot: (text) => questPivotHref(text),
});

/**
 * The doors a component offers beside some Spw, in the order asked, each with
 * its href, label and title; a door whose receiver cannot take the text is left out.
 */
export function ecosystemLinks(text, { jobs = ['canvas', 'build'], name = '', config = {} } = {}) {
  return jobs
    .filter((job) => Object.hasOwn(HREF, job))
    .map((job) => ({ job, ...ECOSYSTEM_JOBS[job], href: HREF[job](text, { name, config }) }))
    .filter((door) => door.href);
}
