/**
 * living-terms.mjs — the one reader of living terms.
 *
 * A living term is a word in prose that carries a concept
 * (data-spw-living-term + data-spw-concept). This module reads them out of
 * authored HTML and aggregates them per concept. It is pure apart from
 * `readLivingTerms`, which lists and reads files; everything else takes
 * strings and returns plain objects, so tests can hand it fixture HTML.
 *
 * Sources: route pages (`**\/index.html`) and `_partials/*.html`, listed
 * through git (tracked + untracked, never ignored). Ignored pages are
 * generated — the design catalog documents the attribute by name
 * (id="attr-data-spw-living-term", data-copy-target="data-spw-living-term"),
 * which a substring scan mistakes for two term tags. Partials are read
 * because a term authored there renders on every route that includes it.
 *
 * The reader reports facts only. It never drafts a definition.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

/** Note rows @haptics fills from the term (wonder also from an ancestor). */
export const NOTE_FIELDS = Object.freeze(['recognition', 'adjacent', 'contrast', 'practice', 'wonder']);
export const SENTENCE_LIMIT = 240;
export const DEFAULT_BATCH_SIZE = 7;

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);
const TEXT_BLOCKS = new Set(['p', 'li', 'dd', 'dt', 'td', 'th', 'blockquote', 'figcaption', 'caption', 'summary', 'legend', 'label', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const BOX_BLOCKS = new Set(['article', 'section', 'aside', 'div', 'details', 'figure', 'header', 'footer', 'main', 'nav', 'body', 'form', 'dl', 'ul', 'ol']);
const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)([^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*)>/g;
const TERM_ATTR = /(?:^|\s)data-spw-living-term(?=[\s=/]|$)/;
const AFFORDANCE_TITLE = /^tap[: ]/i;
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', times: '×', rarr: '→', larr: '←' };

const ATTR_PATTERNS = new Map();
export function readAttr(attrs, name) {
  if (!attrs.includes(name)) return undefined;
  let pattern = ATTR_PATTERNS.get(name);
  if (!pattern) {
    pattern = new RegExp(`(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?=[\\s/>]|$)`);
    ATTR_PATTERNS.set(name, pattern);
  }
  const m = pattern.exec(attrs);
  if (!m) return undefined;
  return m[1] ?? m[2] ?? m[3] ?? '';
}

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : Number(body.slice(1));
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole;
    }
    return ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export function plainText(html) {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/?(?:p|h[1-6]|li|dd|dt|td|th|div|section|article|header|footer|summary|figcaption|blockquote|br)\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\s+/g, ' ').trim();
}

/** Trim to about `limit` chars, keeping a window around `needle` when it is far in. */
export function trimAround(text, needle, limit = SENTENCE_LIMIT) {
  if (text.length <= limit) return text;
  const at = needle ? text.indexOf(needle) : -1;
  if (at < 0 || at + needle.length <= limit - 1) return `${text.slice(0, limit - 1).trimEnd()}…`;
  let start = Math.max(0, Math.min(at - Math.floor((limit - needle.length) / 2), text.length - limit + 2));
  let end = Math.min(text.length, start + limit - 2);
  // Snap to word edges so a window never opens or closes mid-word.
  if (start > 0) {
    const space = text.indexOf(' ', start);
    if (space >= 0 && space < at) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(' ', end);
    if (space > at + needle.length) end = space;
  }
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export function routeForSource(rel) {
  const posix = rel.split(path.sep).join('/');
  if (posix.startsWith('_partials/')) return `/${posix}`;
  const dir = path.posix.dirname(posix);
  return dir === '.' ? '/' : `/${dir}/`;
}

export function partialName(route) {
  const m = /^\/_partials\/(.+)\.html$/.exec(route);
  return m ? m[1] : null;
}

/**
 * Read one HTML source. Returns its terms, every id (candidate homes), the
 * non-term elements that declare a concept with an id (concept homes), and
 * the partials it includes with the wonder in scope where each is included
 * (the template expands includes in place, so a partial's terms inherit it).
 *
 * One path for every page: a term-less page is tokenised the same way, so
 * whether a page has a term never changes which ids or hosts it contributes.
 */
export function readTermsFromHtml(html, route) {
  const ids = new Set();
  const conceptHosts = [];
  const includes = new Set();
  const includeWonder = {};
  const terms = [];
  const stack = [];

  const lineAt = (() => {
    let cursor = 0;
    let line = 1;
    return (index) => {
      for (let nl = html.indexOf('\n', cursor); nl >= 0 && nl < index; nl = html.indexOf('\n', nl + 1)) {
        line += 1;
        cursor = nl + 1;
      }
      return line;
    };
  })();

  const close = (entry, endIndex) => {
    for (const fill of entry.pending) fill(html.slice(entry.start, endIndex));
  };

  TOKEN.lastIndex = 0;
  for (let m = TOKEN.exec(html); m; m = TOKEN.exec(html)) {
    if (!m[2]) continue; // comment
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3] || '';

    if (closing) {
      let depth = stack.length - 1;
      while (depth >= 0 && stack[depth].tag !== tag) depth -= 1;
      if (depth < 0) continue;
      while (stack.length > depth) close(stack.pop(), m.index);
      continue;
    }

    const id = readAttr(attrs, 'id');
    if (id && /^[a-z0-9-]+$/.test(id)) ids.add(id);
    const concept = readAttr(attrs, 'data-spw-concept');
    const isTerm = TERM_ATTR.test(attrs);
    if (concept && id && tag !== 'span' && !isTerm) conceptHosts.push({ concept, id });
    const included = tag === 'spw-include' ? readAttr(attrs, 'src')?.replace(/\.html$/, '') : tag === 'spw-site-footer' ? 'site-footer' : null;
    if (included) {
      includes.add(included);
      if (!(included in includeWonder)) includeWonder[included] = wonderInScope(attrs, stack) || null;
    }

    if (RAW.has(tag)) {
      const end = html.indexOf(`</${tag}`, TOKEN.lastIndex);
      TOKEN.lastIndex = end < 0 ? html.length : end;
      continue;
    }
    const selfClosing = VOID.has(tag) || /\/\s*$/.test(attrs);
    const entry = { tag, attrs, id, start: TOKEN.lastIndex, pending: [] };

    if (isTerm) {
      const term = describeTerm({ tag, attrs, route, line: lineAt(m.index), stack: [...stack, entry] });
      terms.push(term);
      const block = findBlock(stack, entry);
      let own = '';
      entry.pending.push((inner) => {
        own = plainText(inner);
        term.text = own;
      });
      block.entry.pending.push((inner) => {
        term.sentence = trimAround(plainText(inner), own || null);
      });
      if (selfClosing) close(entry, entry.start);
    }
    if (!selfClosing) stack.push(entry);
  }
  // Unclosed blocks at end of file (fragments, partials) still yield text.
  while (stack.length) close(stack.pop(), html.length);

  return { route, terms, ids: [...ids], conceptHosts, includes: [...includes], includeWonder };
}

/** The wonder @haptics resolves for an element: its own, else the nearest ancestor's. */
function wonderInScope(attrs, ancestors) {
  let wonder = readAttr(attrs, 'data-spw-wonder');
  for (let i = ancestors.length - 1; i >= 0 && wonder === undefined; i -= 1) wonder = readAttr(ancestors[i].attrs, 'data-spw-wonder');
  return wonder;
}

function findBlock(stack, self) {
  if (!TEXT_BLOCKS.has(self.tag) && BOX_BLOCKS.has(self.tag)) return { entry: self };
  for (let i = stack.length - 1; i >= 0; i -= 1) if (TEXT_BLOCKS.has(stack[i].tag)) return { entry: stack[i] };
  for (let i = stack.length - 1; i >= 0; i -= 1) if (BOX_BLOCKS.has(stack[i].tag)) return { entry: stack[i] };
  return { entry: self };
}

function describeTerm({ tag, attrs, route, line, stack }) {
  const concept = readAttr(attrs, 'data-spw-concept') || null;
  const title = readAttr(attrs, 'title') || '';
  const affordanceTitle = AFFORDANCE_TITLE.test(title);
  const ancestors = stack.slice(0, -1);
  let hostId = null;
  for (let i = stack.length - 1; i >= 0 && !hostId; i -= 1) hostId = stack[i].id || null;
  const ownWonder = readAttr(attrs, 'data-spw-wonder');
  const wonder = wonderInScope(attrs, ancestors);
  const note = {
    recognition: readAttr(attrs, 'data-spw-recognition') || null,
    adjacent: readAttr(attrs, 'data-spw-adjacent') || null,
    contrast: readAttr(attrs, 'data-spw-contrast') || null,
    practice: readAttr(attrs, 'data-spw-practice') || null,
    wonder: wonder || null,
  };
  const nestedIn = ancestors.findLast((a) => a.tag === 'a' || /(?:^|[\s-])chip(?:$|[\s_-])/.test(readAttr(a.attrs, 'class') || ''));
  return {
    route,
    line,
    element: tag,
    text: '',
    concept,
    definition: title && !affordanceTitle ? title : null,
    affordanceTitle: affordanceTitle ? title : null,
    href: tag === 'a' ? readAttr(attrs, 'href') ?? null : null,
    home: null,
    hostId,
    expression: readAttr(attrs, 'data-spw-semantic-expression') || null,
    note,
    depth: NOTE_FIELDS.filter((field) => note[field]).length,
    wonderFrom: ownWonder ? 'term' : wonder ? 'ancestor' : null,
    focusable: tag === 'span' && readAttr(attrs, 'tabindex') === '0',
    nested: nestedIn ? nestedIn.tag : null,
    sentence: '',
  };
}

/**
 * Candidate homes: any element with the concept's slug as id, or a non-term
 * host declaring the concept. An id authored in a partial renders on every
 * route that includes it; it is homed on the first of those (sorted) so a
 * footer id does not list 193 anchors. Anchors authored on the route itself
 * come first, then partial ones. Returns Map<key, string[]>.
 */
export function collectHomes(sources, inclusion = includedBy(sources)) {
  const page = new Map();
  const viaPartial = new Map();
  const add = (map, key, ref) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(ref);
  };
  for (const src of sources) {
    const partial = partialName(src.route);
    const map = partial ? viaPartial : page;
    const route = partial ? [...(inclusion.get(partial) || [])].sort()[0] : src.route;
    if (!route) continue;
    for (const id of src.ids) add(map, id, `${route}#${id}`);
    for (const host of src.conceptHosts) add(map, host.concept, `${route}#${host.id}`);
  }
  const homes = new Map();
  for (const key of new Set([...page.keys(), ...viaPartial.keys()])) {
    const own = [...(page.get(key) || [])].sort();
    homes.set(key, [...own, ...[...(viaPartial.get(key) || [])].filter((ref) => !own.includes(ref)).sort()]);
  }
  return homes;
}

export function includedBy(sources) {
  const map = new Map();
  for (const src of sources) {
    for (const name of src.includes) {
      if (!map.has(name)) map.set(name, new Set());
      map.get(name).add(src.route);
    }
  }
  return map;
}

/**
 * A partial's term has no fragment-local wonder: read it as rendered on each
 * including route, where the wonder in scope around the include fills it.
 * depth becomes the depth on most including routes (ties go deeper);
 * renderedDepths keeps the full spread.
 */
function resolvePartialTerm(term, sources, inclusion) {
  const partial = partialName(term.route);
  if (!partial) return;
  const routes = [...(inclusion.get(partial) || [])].sort();
  term.includedOn = routes;
  if (term.wonderFrom || !routes.length) return;
  const byRoute = new Map(sources.map((src) => [src.route, src]));
  const spread = new Map();
  const wonders = new Map();
  for (const route of routes) {
    const wonder = byRoute.get(route)?.includeWonder?.[partial] || null;
    const depth = term.depth + (wonder ? 1 : 0);
    spread.set(depth, (spread.get(depth) || 0) + 1);
    if (wonder) wonders.set(wonder, (wonders.get(wonder) || 0) + 1);
  }
  const [depth] = [...spread].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
  term.renderedDepths = Object.fromEntries([...spread].sort((a, b) => a[0] - b[0]));
  if (depth > term.depth) {
    term.depth = depth;
    term.wonderFrom = 'includer';
    term.includerWonder = [...wonders].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  }
}

/** Aggregate per-source reads into terms, concept rows, waiting terms and lies. */
export function aggregateTerms(sources) {
  const inclusion = includedBy(sources);
  const homes = collectHomes(sources, inclusion);
  const terms = sources.flatMap((src) => src.terms);
  for (const term of terms) {
    term.home = term.href || (homes.get(term.concept) || [])[0] || null;
    resolvePartialTerm(term, sources, inclusion);
  }
  const waiting = terms.filter((t) => !t.concept);
  const byConcept = new Map();
  for (const term of terms) {
    if (!term.concept) continue;
    const row = byConcept.get(term.concept) || { concept: term.concept, terms: 0, routes: new Set(), reach: new Set(), defined: 0, elements: new Set(), depths: [] };
    row.terms += 1;
    row.routes.add(term.route);
    const partial = partialName(term.route);
    if (partial) for (const route of inclusion.get(partial) || []) row.reach.add(route);
    else row.reach.add(term.route);
    row.elements.add(term.element);
    if (term.definition) row.defined += 1;
    row.depths.push(term.depth);
    byConcept.set(term.concept, row);
  }
  const concepts = [...byConcept.values()].map((c) => {
    const conceptHomes = homes.get(c.concept) || [];
    return {
      concept: c.concept,
      terms: c.terms,
      routes: [...c.routes].sort(),
      reach: c.reach.size,
      defined: c.defined,
      homes: conceptHomes,
      elements: [...c.elements].sort(),
      living: Boolean(c.defined || conceptHomes.length),
      depth: Math.max(...c.depths),
    };
  }).sort(byUse);
  const lies = {
    affordance: terms.filter((t) => t.affordanceTitle).map((t) => `${t.route}:${t.line} ${t.concept} · title="${t.affordanceTitle.slice(0, 40)}…"`),
    nested: terms.filter((t) => t.nested).map((t) => `${t.route}:${t.line} ${t.concept}`),
    focusable: terms.filter((t) => t.focusable).map((t) => `${t.route}:${t.line} ${t.concept}`),
  };
  const depthHistogram = Array.from({ length: NOTE_FIELDS.length + 1 }, (_, depth) => terms.filter((t) => t.depth === depth).length);
  return { terms, concepts, waiting, lies, depthHistogram, includedBy: Object.fromEntries([...inclusion].map(([k, v]) => [k, [...v].sort()])) };
}

/** Most authored tags first; ties go to the concept rendered on more routes, then by name. */
function byUse(a, b) {
  return b.terms - a.terms || b.reach - a.reach || a.concept.localeCompare(b.concept);
}

/** Where a reader can open a term: route#host, or for a partial, its first including route. */
export function termAnchor(term) {
  const partial = partialName(term.route);
  const hash = term.hostId ? `#${term.hostId}` : '';
  if (!partial) return `${term.route}${hash}`;
  const on = term.includedOn || [];
  if (!on.length) return `${term.route}${hash} (partial, included nowhere)`;
  return `${on[0]}${hash} (via _partials/${partial}${on.length > 1 ? `, on ${on.length} routes` : ''})`;
}

/** Reach histogram: how many concepts render on 1, 2, 3… routes. */
export function reachHistogram(concepts) {
  const hist = new Map();
  for (const c of concepts) hist.set(c.reach, (hist.get(c.reach) || 0) + 1);
  return [...hist].sort((a, b) => a[0] - b[0]);
}

/** The n-th batch (1-based) of decorated concepts by use, each with every sentence it lives in. */
export function batchWorksheet({ concepts, terms }, n = 1, size = DEFAULT_BATCH_SIZE) {
  const decorated = concepts.filter((c) => !c.living).sort(byUse);
  const batches = Math.max(1, Math.ceil(decorated.length / size));
  const slice = decorated.slice((n - 1) * size, n * size);
  return {
    batch: n,
    size,
    batches,
    decorated: decorated.length,
    concepts: slice.map((c) => ({
      concept: c.concept,
      terms: c.terms,
      reach: c.reach,
      routes: c.routes,
      uses: terms
        .filter((t) => t.concept === c.concept)
        .sort((a, b) => a.route.localeCompare(b.route) || a.line - b.line)
        .map((t) => ({
          anchor: termAnchor(t),
          includedOn: t.includedOn || null,
          line: t.line,
          element: t.element,
          text: t.text,
          expression: t.expression,
          depth: t.depth,
          sentence: t.sentence,
        })),
    })),
  };
}

/** List term sources under root: route pages and partials, tracked or untracked, never ignored. */
export function listTermSources(root) {
  try {
    const out = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '--', '*index.html', '_partials/*.html'], { cwd: root, encoding: 'utf8', maxBuffer: 16 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
    return [...new Set(out.split('\n').filter(Boolean))].filter((rel) => {
      const top = rel.split('/')[0];
      return !SKIP_TOP.has(top) && !rel.split('/').some((part) => part.startsWith('.'));
    }).sort();
  } catch {
    return walk(root, root).sort();
  }
}

const SKIP_TOP = new Set(['node_modules', 'dist', 'dist-vite', 'public', 'scripts', 'workers', 'src', '00.unsorted']);

function walk(root, dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || (dir === root && SKIP_TOP.has(name))) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(root, full, out);
    else if (name === 'index.html' || (path.basename(dir) === '_partials' && name.endsWith('.html'))) out.push(path.relative(root, full));
  }
  return out;
}

export function readLivingTerms({ root = process.cwd() } = {}) {
  const sources = [];
  for (const rel of listTermSources(root)) {
    let html;
    try { html = readFileSync(path.join(root, rel), 'utf8'); } catch { continue; }
    sources.push(readTermsFromHtml(html, routeForSource(rel)));
  }
  return { sources: sources.length, ...aggregateTerms(sources) };
}
