/**
 * Project every route into a readable .spw tree: what it keeps, its subjects,
 * its copy, its links, and the questions it asks.
 *
 * A route already says most of this about itself, in the <spw-page> attribute
 * block and in the expressions its copy carries. An attribute block is a good
 * build input and a poor thing to read: subjects, links and wonder sit in one
 * run of quoted strings, related_routes is a pipe list, and wonder is three
 * type words with no question attached. This prints the same facts as Spw, one
 * file per route, so the site reads the way the rest of the tree reads, and an
 * editor that speaks Spw can walk it: every route a reader can reach is a
 * handle to that route's own tree.
 *
 * Owners do not move. The HTML stays the owner of what it declares; the trees
 * land in .spw/gen/ (gitignored, skipped by spw:integrity and audit:spw-tree)
 * and are rebuilt, never edited. What a page cannot say about itself — what it
 * keeps — is authored once in .spw/surfaces.spw public_routes and merged in.
 * A run also registers the trees as a projection in .spw/gen/index.spw, so the
 * editor marks each tree as generated from surfaces.spw. Pages are cited from
 * the site root (~"/topics/slop/index.html#feeling"); trees cite each other
 * relatively.
 *
 *   keeps     public_routes keeps / role / bridge, when the route is listed
 *   shape     the route against its folder's family (_family.spw beside it):
 *             the section order it follows, the name it fills that order's
 *             slot with, what it holds alone, and what most siblings hold and
 *             it does not. Follows, fills and own are the route reduced to its
 *             shape; the family says whether naming the shape would save more
 *             than it costs
 *   subjects  keywords, header context, and the subject and modes of every
 *             expression in the copy
 *   copy      the lede, then each section[id] with its heading, its anchor,
 *             and the expressions it says
 *   links     the header trail, related_routes, and the other routes the copy
 *             links to
 *   wonder    each authored type as its reader question
 *             (.spw/conventions/wonder-vocabulary.spw), and kin grouped by the
 *             two or more types they share (wonder-architecture.spw#authoring)
 *
 * Usage:
 *   node scripts/spw-routes.mjs                     # report
 *   node scripts/spw-routes.mjs --route /topics/slop/   # one tree on stdout
 *   node scripts/spw-routes.mjs --diff /about/domains/bane.land/ /about/domains/boon.land/
 *                                                   # ground, edge, own of two routes
 *   node scripts/spw-routes.mjs --write             # rebuild .spw/gen/routes/
 *   npm run spw:routes -- --check                    # every tree parses, every citation lands
 */

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractMainHtml, stripMarkup, toRoutePath } from './lib/page-copy-audit.mjs';
import { readExpressionSlots } from '../public/js/semantic/expression-query.js';
import { projectionIndexText } from './lib/spw-projections.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.spw/gen/routes');
const REGISTRY = path.join(ROOT, '.spw/surfaces.spw');
const VOCABULARY = path.join(ROOT, '.spw/conventions/wonder-vocabulary.spw');
const WONDER_TYPES = ['orientation', 'constraint', 'memory', 'resonance', 'inquiry', 'projection', 'comparison'];

const args = process.argv.slice(2);
const write = args.includes('--write');
const only = args.includes('--route') ? args[args.indexOf('--route') + 1] : null;
const diffPair = args.includes('--diff') ? args.slice(args.indexOf('--diff') + 1, args.indexOf('--diff') + 3) : null;
const asRoute = (value = '') => (value === '/' || value.endsWith('/') ? value : `${value}/`);

const decode = (value = '') => String(value)
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const attrsOf = (run = '') => Object.fromEntries([...run.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)]
  .map(([, key, value]) => [key, decode(value).trim()]));
const words = (value = '') => String(value).split(/\s+/).filter(Boolean);
const handleOf = (route) => (route === '/' ? 'home' : route.slice(1, -1).replace(/[^a-z0-9]+/gi, '_').toLowerCase());
const treeOf = (route) => path.join(OUT, route === '/' ? 'home.spw' : `${route.slice(1, -1)}.spw`);
const tick = (text) => `\`${String(text).replace(/`/g, "'")}\``;
const cite = (from, file, fragment = '') => {
  const relative = path.relative(path.dirname(from), file);
  return `~"${relative.startsWith('.') ? relative : `./${relative}`}${fragment ? `#${fragment}` : ''}"`;
};
/**
 * A citation from the site root. A leading slash is a site route to
 * spw:integrity and to spw resolve (via the consumer root), so a page reads as
 * its path and not as five ../ climbs out of .spw/gen/routes/.
 */
const rooted = (file, fragment = '') => `~"/${path.relative(ROOT, file)}${fragment ? `#${fragment}` : ''}"`;

/**
 * Quote-aware attribute run. An expression attribute holds a raw `>` (its
 * `<concept>`), and `[^>]*` would end the tag there.
 */
const ATTRS = String.raw`((?:[^>"']|"[^"]*"|'[^']*')*)`;
const tagRe = (name, flags = 'i') => new RegExp(String.raw`<${name}\b${ATTRS}>`, flags);

/** Visible text, without the space an inline tag leaves before punctuation. */
const plain = (html) => stripMarkup(html).replace(/\s+([,.;:!?])/g, '$1');

/**
 * Whole sentences up to about 140 characters: a lede cut mid-clause reads
 * worse than a short one, and an opener such as "I'm Spwashi." needs the
 * sentence after it to say what the page is.
 */
function sentences(text, reach = 140) {
  // A sentence ends at punctuation followed by a space, so bane.land stays one word.
  const parts = String(text).trim().split(/(?<=[.!?]["'”’)\]]*)\s+/);
  let out = '';
  for (const part of parts) {
    out = out ? `${out} ${part}` : part;
    if (out.length >= reach) break;
  }
  return out;
}

/** Route path from an href, or null when it leaves the site or names no route. */
function routeOfHref(href, routes) {
  if (!href || /^(https?:|mailto:|tel:|#|javascript:)/i.test(href)) return null;
  const [pathname, fragment = ''] = href.split('#');
  const route = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return routes.has(route) ? { route, fragment } : null;
}

async function readQuestions() {
  const text = await readFile(VOCABULARY, 'utf8');
  return Object.fromEntries(WONDER_TYPES.map((type) => {
    const match = new RegExp(String.raw`^\s*${type}\s*=\s*\x60([^\x60]*)\x60`, 'm').exec(text);
    return [type, match ? match[1] : ''];
  }));
}

/** public_routes entries, single-line or multi-line, keyed by route path. */
async function readRegistry() {
  const text = await readFile(REGISTRY, 'utf8');
  const block = /^public_routes:\s*\.\{([\s\S]*?)^\}\[reg=facet\]/m.exec(text)?.[1] || '';
  const entries = new Map();
  for (const [, name, body] of block.matchAll(/^\s(\w+)\s*=\s*\.\{([\s\S]*?)\}\[reg=facet\]/gm)) {
    const fields = Object.fromEntries([...body.matchAll(/(\w+)\s*=\s*(~"[^"]*"|`[^`]*`|"[^"]*"|[\w-]+)/g)]
      .map(([, key, value]) => [key, value.replace(/^~?["`]|["`]$/g, '')]));
    if (!fields.path) continue;
    const file = path.relative(ROOT, path.resolve(path.dirname(REGISTRY), fields.path));
    entries.set(toRoutePath(file), { name, ...fields });
  }
  return entries;
}

function readRoute(file, html, routes) {
  const page = attrsOf(tagRe('spw-page').exec(html)?.[1]);
  const body = attrsOf(tagRe('body').exec(html)?.[1]);
  const header = attrsOf(tagRe('spw-site-header').exec(html)?.[1]);
  const mainAttrs = attrsOf(tagRe('main').exec(html)?.[1]);
  const main = extractMainHtml(html);
  const route = toRoutePath(file);

  const marks = [...main.matchAll(tagRe('section', 'gi'))]
    .map((match) => ({ match, id: attrsOf(match[1]).id }))
    .filter(({ id }) => id)
    .map(({ match, id }) => {
      const heading = new RegExp(String.raw`<h([1-6])\b${ATTRS}>([\s\S]*?)</h\1>`, 'i').exec(main.slice(match.index))?.[3] || '';
      return { at: match.index, id, heading: plain(heading), says: [], links: 0 };
    });
  const sectionAt = (offset) => [...marks].reverse().find((mark) => mark.at <= offset);

  const expressions = [...main.matchAll(/data-spw-semantic-expression="([^"]+)"/g)].map((match) => {
    const expression = decode(match[1]);
    sectionAt(match.index)?.says.push(expression);
    return expression;
  });
  const copyLinks = new Map();
  for (const match of main.matchAll(tagRe('a', 'gi'))) {
    const target = routeOfHref(attrsOf(match[1]).href, routes);
    if (!target || target.route === route) continue;
    const mark = sectionAt(match.index);
    if (mark) mark.links += 1;
    copyLinks.set(target.route, (copyLinks.get(target.route) || 0) + 1);
  }

  const subjects = new Map();
  for (const expression of expressions) {
    const { subject, mode } = readExpressionSlots(expression);
    if (!subject) continue;
    if (!subjects.has(subject)) subjects.set(subject, new Set());
    if (mode) subjects.get(subject).add(mode);
  }

  const marked = [...main.matchAll(new RegExp(String.raw`<(\w+)\b${ATTRS}>([\s\S]*?)</\1>`, 'gi'))]
    .find((match) => attrsOf(match[2])['data-spw-textual-role'] === 'lede')?.[3];
  const afterTitle = main.slice(Math.max(0, main.search(/<h1\b/i)));
  const lede = marked || [...afterTitle.matchAll(new RegExp(String.raw`<p\b${ATTRS}>([\s\S]*?)</p>`, 'gi'))]
    .map((match) => match[2]).find((inner) => words(plain(inner)).length >= 8);
  const trail = (header.nav_items || '').split('|')
    .map((item) => routeOfHref(item.slice(item.indexOf(':') + 1), routes)?.route).filter(Boolean);
  const related = (page.related_routes || body['data-spw-related-routes'] || '').split('|')
    .map((href) => routeOfHref(href.trim(), routes)).filter(Boolean);

  return {
    route,
    file,
    title: page.title || stripMarkup(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] || route),
    description: page.description || '',
    family: page.page_family || body['data-spw-page-family'] || '',
    role: page.page_role || body['data-spw-page-role'] || '',
    surface: page.surface || body['data-spw-surface'] || '',
    keywords: (page.keywords || '').split(',').map((word) => word.trim()).filter(Boolean),
    context: header.context_relevance || '',
    wonder: words(page.wonder || body['data-spw-wonder']).filter((type) => WONDER_TYPES.includes(type)),
    expression: mainAttrs['data-spw-semantic-expression'] || body['data-spw-semantic-expression'] || expressions[0] || '',
    lede: lede ? sentences(plain(lede)) : '',
    sections: marks.filter((mark) => mark.heading || mark.says.length),
    subjects,
    trail: trail.filter((target) => target !== route),
    related,
    copyLinks,
  };
}

/** Routes kin to each route, grouped by the types they share (two or more). */
function kinOf(pages) {
  const kin = new Map(pages.map((page) => [page.route, new Map()]));
  for (const a of pages) {
    for (const b of pages) {
      if (a.route >= b.route) continue;
      const shared = a.wonder.filter((type) => b.wonder.includes(type));
      if (shared.length < 2) continue;
      const key = shared.sort().join('_');
      for (const [x, y] of [[a, b], [b, a]]) {
        const groups = kin.get(x.route);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(y.route);
      }
    }
  }
  return kin;
}

/**
 * A family is the routes whose trees share a folder: the domain pages, the
 * operator pages, the topics. Read together they show a pattern and its
 * departures. A section's shape token is its id without the words of the
 * route's own slug, so bane_frame and boon_frame both read as frame.
 *
 *   baseline  what every member holds
 *   common    what two in three members or more hold; the rest are listed as missing it
 *   shapes    a section order that two or more members share, each member's
 *             own sections left out (shape_n until the creator names it)
 *   own       what one member holds and no sibling does: the route's local novelty
 */
const FAMILY_FILE = '_family.spw';
const FAMILY_KINDS = ['section', 'wonder', 'subject'];
const familyDirOf = (route) => path.dirname(treeOf(route));
const token = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const slugOf = (page) => (page.route === '/' ? ['home'] : page.route.split('/').filter(Boolean).pop().toLowerCase().split(/[^a-z0-9]+/));

/**
 * Each section's shape token, with the words of the route's own name its id
 * carried: bane-frame reads as frame and carries bane. The carried words are
 * the value a named shape would hold in its slot.
 */
function sectionTokensOf(page) {
  const slug = slugOf(page);
  const tokens = new Map();
  for (const { id } of page.sections) {
    const parts = id.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    const kept = parts.filter((part) => !slug.includes(part));
    const shapeToken = (kept.length ? kept : parts).join('_');
    if (!tokens.has(shapeToken)) tokens.set(shapeToken, kept.length && kept.length < parts.length ? parts.filter((part) => slug.includes(part)) : []);
  }
  return tokens;
}
const shapeTokensOf = (page) => [...sectionTokensOf(page).keys()];

/** The name a route puts in a shape's slot: the slug words its slot ids carry, in slug order. */
function fillOf(page, slot) {
  const carried = new Set(slot.flatMap((item) => sectionTokensOf(page).get(item) || []));
  return slugOf(page).filter((word) => carried.has(word)).join('_');
}

function describeFamily(dir, members) {
  const n = members.length;
  const holdings = new Map(members.map((page) => [page.route, {
    section: shapeTokensOf(page),
    wonder: page.wonder,
    subject: [...page.subjects.keys()],
  }]));
  const count = Object.fromEntries(FAMILY_KINDS.map((kind) => [kind, new Map()]));
  for (const held of holdings.values()) {
    for (const kind of FAMILY_KINDS) for (const item of new Set(held[kind])) count[kind].set(item, (count[kind].get(item) || 0) + 1);
  }
  const baseline = Object.fromEntries(FAMILY_KINDS.map((kind) => [kind, [...count[kind]].filter(([, c]) => c === n).map(([item]) => item)]));
  const common = [];
  const missing = new Map();
  if (n >= 3) {
    for (const kind of FAMILY_KINDS) {
      for (const [item, c] of count[kind]) {
        if (c === n || c < Math.ceil((2 * n) / 3)) continue;
        const lacking = members.filter((page) => !holdings.get(page.route)[kind].includes(item)).map((page) => page.route);
        common.push({ kind, item, lacking });
        for (const route of lacking) {
          if (!missing.has(route)) missing.set(route, Object.fromEntries(FAMILY_KINDS.map((k) => [k, []])));
          missing.get(route)[kind].push(item);
        }
      }
    }
  }
  const own = new Map();
  for (const page of members) {
    const held = holdings.get(page.route);
    const mine = {
      section: held.section.filter((item) => count.section.get(item) === 1),
      subject: held.subject.filter((item) => count.subject.get(item) === 1),
    };
    if (mine.section.length || mine.subject.length) own.set(page.route, mine);
  }
  const orders = new Map();
  for (const page of members) {
    const order = holdings.get(page.route).section.filter((item) => count.section.get(item) > 1);
    if (!order.length) continue;
    const key = order.join('.');
    if (!orders.has(key)) orders.set(key, { order, members: [] });
    orders.get(key).members.push(page.route);
  }
  // slot: the order's tokens whose ids carry every member's own name.
  // saves: tokens stated across the members, less the order stated once and cited once by each.
  const byRoute = new Map(members.map((page) => [page.route, page]));
  const shapes = [...orders.values()].filter((shape) => shape.members.length > 1)
    .sort((a, b) => b.members.length - a.members.length || b.order.length - a.order.length || a.order.join('.').localeCompare(b.order.join('.')))
    .map((shape, index) => ({
      key: `shape_${index + 1}`,
      ...shape,
      slot: shape.order.filter((item) => shape.members.every((route) => sectionTokensOf(byRoute.get(route)).get(item)?.length)),
      saves: shape.members.length * shape.order.length - (shape.order.length + shape.members.length),
    }));
  const shapeOf = new Map(shapes.flatMap((shape) => shape.members.map((route) => [route, shape.key])));
  return { dir, members, baseline, common, missing, own, shapes, shapeOf };
}

function familiesOf(pages) {
  const byDir = new Map();
  for (const page of pages) {
    const dir = familyDirOf(page.route);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(page);
  }
  return new Map([...byDir].filter(([, members]) => members.length > 1)
    .map(([dir, members]) => [dir, describeFamily(dir, members)]));
}

const familyLabelOf = (dir) => path.relative(OUT, dir) || '';

function renderFamily(family) {
  const from = path.join(family.dir, FAMILY_FILE);
  const label = familyLabelOf(family.dir);
  const set = (items) => `#[${items.join(', ')}][reg=set]`;
  const at = (route) => `@${handleOf(route)}`;
  const leaf = (route) => token(route === '/' ? 'home' : route.split('/').filter(Boolean).pop());
  const lines = [
    `# /${label ? `${label}/` : ''} family — ${family.members.length} routes: what they share, the section orders they follow, and what each holds alone.`,
    '# GENERATED by npm run spw:routes from the routes in this folder. shape_n keys are placeholders until a shape is named.',
    '',
    `#>family_${token(label) || 'site'}`,
    '#:route #!family',
    '',
    ...family.members.map((page) => `${at(page.route)}: ${cite(from, treeOf(page.route))}`),
    '',
    `among = ${family.members.length}`,
    '',
    '^"baseline"{  # every member holds these',
  ];
  for (const [kind, key] of [['section', 'sections'], ['wonder', 'wonder'], ['subject', 'subjects']]) {
    if (family.baseline[kind].length) lines.push(`  ${key} = ${set(family.baseline[kind])}`);
  }
  if (!FAMILY_KINDS.some((kind) => family.baseline[kind].length)) {
    lines.push(`  none = ${tick('no section, wonder type, or subject is held by every member')}`);
  }
  lines.push('}[reg=facet]', '');

  if (family.common.length) {
    lines.push('^"common"{  # two in three members or more hold these; the routes listed do not');
    for (const { kind, item, lacking } of family.common) lines.push(`  ${kind}_${token(item)} = ${set(lacking.map(at))}`);
    lines.push('}[reg=facet]', '');
  }

  lines.push('^"shapes"{  # section orders two or more members share, each member\'s own sections left out');
  for (const shape of family.shapes) {
    lines.push(`  ${shape.key} = .{`, `    order = {${shape.order.join('.')}}`, `    members = ${set(shape.members.map(at))}`);
    if (shape.slot.length) lines.push(`    slot = ${set(shape.slot)}  # each member's ids carry its own name here, as its fills line shows`);
    // A bare negative number does not tokenize in spw-seed, so a name that costs more than it saves says costs.
    const tally = `${shape.members.length * shape.order.length} section tokens stated across members; ${shape.order.length + shape.members.length} if this order were named once and each member cited it`;
    lines.push(shape.saves < 0 ? `    costs = ${-shape.saves}  # ${tally}` : `    saves = ${shape.saves}  # ${tally}`);
    lines.push('  }[reg=facet]');
  }
  const unshaped = family.members.filter((page) => !family.shapeOf.has(page.route)).map((page) => page.route);
  if (unshaped.length) lines.push(`  unshaped = ${set(unshaped.map(at))}  # no section order shared with a sibling`);
  lines.push('}[reg=facet]', '');

  if (family.own.size) {
    lines.push('^"own"{  # what one member holds and no sibling does');
    for (const [route, mine] of family.own) {
      lines.push(`  ${leaf(route)} = .{`, `    route = ${at(route)}`);
      if (mine.section.length) lines.push(`    sections = ${set(mine.section)}`);
      if (mine.subject.length) lines.push(`    subjects = ${set(mine.subject)}`);
      lines.push('  }[reg=facet]');
    }
    lines.push('}[reg=facet]', '');
  }
  return lines.join('\n');
}

/** The route's place in its family, for the top of its own tree. */
function renderShape(page, family) {
  const from = treeOf(page.route);
  const set = (items) => `#[${items.join(', ')}][reg=set]`;
  const lines = ['^"shape"{  # against the other routes in this folder (@family)', `  among = ${family.members.length}`];
  const shape = family.shapeOf.get(page.route);
  if (shape) lines.push(`  follows = ${cite(from, path.join(family.dir, FAMILY_FILE), shape)}`);
  const slot = family.shapes.find((candidate) => candidate.key === shape)?.slot || [];
  if (slot.length) lines.push(`  fills = ${tick(fillOf(page, slot))}  # the name its ids put in the shape's slot`);
  const mine = family.own.get(page.route);
  if (mine?.section.length) lines.push(`  own = ${set(mine.section)}`);
  if (mine?.subject.length) lines.push(`  own_subjects = ${set(mine.subject)}`);
  const lacks = family.missing.get(page.route);
  if (lacks) {
    lines.push('  missing = .{  # most siblings hold these');
    for (const [kind, key] of [['section', 'sections'], ['wonder', 'wonder'], ['subject', 'subjects']]) {
      if (lacks[kind].length) lines.push(`    ${key} = ${set(lacks[kind])}`);
    }
    lines.push('  }[reg=facet]');
  }
  lines.push('}[reg=facet]', '');
  return lines;
}

/** Every route this page links to, by trail, related_routes, or copy. */
const reachOf = (page) => new Set([...page.trail, ...page.related.map((target) => target.route), ...page.copyLinks.keys()]);

/** Subject and keyword words, without the ones so common they say nothing about kinship. */
const COMMON_WORD = 20;
function topicWordsOf(pages) {
  const raw = new Map(pages.map((page) => [page.route, new Set([
    ...page.subjects.keys(),
    ...page.keywords.map((word) => word.toLowerCase()),
  ])]));
  const count = new Map();
  for (const set of raw.values()) for (const word of set) count.set(word, (count.get(word) || 0) + 1);
  return new Map([...raw].map(([route, set]) => [route, new Set([...set].filter((word) => count.get(word) < COMMON_WORD))]));
}

/** Kin that share a subject or keyword and have no link either way, grouped by the shared word. */
function nearOf(page, { kin, byRoute, topicWords }) {
  const reach = reachOf(page);
  const near = new Map();
  for (const route of new Set([...(kin.get(page.route)?.values() || [])].flat())) {
    if (reach.has(route) || reachOf(byRoute.get(route)).has(page.route)) continue;
    for (const word of topicWords.get(page.route)) {
      if (!topicWords.get(route).has(word)) continue;
      if (!near.has(word)) near.set(word, []);
      near.get(word).push(route);
    }
  }
  return near;
}

function render(page, { kin, byRoute, topicWords, registry, questions, families }) {
  const from = treeOf(page.route);
  const authored = registry.get(page.route);
  const family = families.get(familyDirOf(page.route));
  const kinRoutes = [...new Set([...(kin.get(page.route)?.values() || [])].flat())];
  const reach = reachOf(page);
  const kinReached = kinRoutes.filter((route) => reach.has(route)).sort();
  const near = nearOf(page, { kin, byRoute, topicWords });
  const reached = new Set([
    ...page.trail,
    ...page.related.filter((target) => !target.fragment).map((target) => target.route),
    ...page.copyLinks.keys(),
    ...[...near.values()].flat(),
  ]);
  reached.delete(page.route);
  const handles = [...reached].sort().map((route) => `@${handleOf(route)}: ${cite(from, treeOf(route))}`);
  const set = (items) => `#[${items.join(', ')}][reg=set]`;
  const lines = [
    `# ${page.route} — ${page.title}`,
    ...(page.description ? [`# ${page.description}`] : []),
    `# GENERATED by npm run spw:routes from ${page.file}${authored ? ' and .spw/surfaces.spw public_routes' : ''}. Edit the source, not this.`,
    '',
    `#>route_${handleOf(page.route)}`,
    `#:route${page.surface ? ` #!${page.surface}` : ''}`,
    ...(page.family ? [`#:family ${words(page.family).map((word) => `#!${word}`).join(' ')}`] : []),
    ...(page.role ? [`#:role ${words(page.role).map((word) => `#!${word}`).join(' ')}`] : []),
    '',
    `@page: ${rooted(path.join(ROOT, page.file))}`,
    `@registry: ${rooted(REGISTRY)}`,
    ...(family ? [`@family: ${cite(from, path.join(family.dir, FAMILY_FILE))}`] : []),
    ...handles,
    '',
    ...(page.expression ? [`expression = ${page.expression}`, ''] : []),
  ];

  lines.push('^"keeps"{');
  if (authored) {
    for (const key of ['keeps', 'role', 'bridge']) if (authored[key]) lines.push(`  ${key} = ${tick(authored[key])}`);
    if (authored.status) lines.push(`  status = "${authored.status}"`);
  } else {
    lines.push(`  unwritten = ${tick(`what this route keeps is authored in @registry public_routes; ${page.route} is not listed there yet`)}`);
  }
  lines.push('}[reg=facet]', '');
  if (family) lines.push(...renderShape(page, family));

  lines.push('^"subjects"{');
  if (page.keywords.length) lines.push(`  keywords = ${set(page.keywords.map(tick))}`);
  if (page.context) lines.push(`  context = ${tick(page.context)}`);
  for (const [subject, modes] of page.subjects) lines.push(`  &${subject} = ${set([...modes].map(tick))}`);
  lines.push('}[reg=facet]', '');

  lines.push('^"copy"{');
  if (page.lede) lines.push(`  lede = ${tick(page.lede)}`);
  for (const mark of page.sections) {
    lines.push(`  ${mark.id.replace(/[^a-z0-9]+/gi, '_')} = .{`);
    if (mark.heading) lines.push(`    heading = ${tick(mark.heading)}`);
    lines.push(`    at = ${rooted(path.join(ROOT, page.file), mark.id)}`);
    for (const expression of mark.says) lines.push(`    says = ${expression}`);
    if (mark.links) lines.push(`    links = ${mark.links}`);
    lines.push('  }[reg=facet]');
  }
  lines.push('}[reg=facet]', '');

  lines.push('^"links"{');
  if (page.trail.length) lines.push(`  trail = ${set(page.trail.map((route) => `@${handleOf(route)}`))}`);
  if (page.related.length) {
    lines.push(`  related = ${set(page.related.map(({ route, fragment }) => (fragment
      ? rooted(path.join(ROOT, route.slice(1), 'index.html'), fragment)
      : `@${handleOf(route)}`)))}`);
  }
  const relatedRoutes = new Set(page.related.map(({ route }) => route));
  const copy = [...page.copyLinks.keys()].filter((route) => !relatedRoutes.has(route)).sort();
  if (copy.length) lines.push(`  copy = ${set(copy.map((route) => `@${handleOf(route)}`))}`);
  lines.push('}[reg=facet]', '');

  lines.push('^"wonder"{');
  for (const type of page.wonder) lines.push(`  ${type} = ${tick(questions[type])}`);
  const groups = kin.get(page.route);
  if (groups?.size) {
    lines.push('  kin = .{');
    for (const [key, routes] of [...groups].sort((a, b) => b[0].split('_').length - a[0].split('_').length || b[1].length - a[1].length)) {
      lines.push(`    ${key} = ${routes.length}`);
    }
    lines.push('  }[reg=facet]');
    if (kinReached.length) lines.push(`  reached = ${set(kinReached.map((route) => `@${handleOf(route)}`))}  # kin this page links to`);
  }
  if (near.size) {
    lines.push('  near = .{  # kin that share a subject or keyword, with no link either way');
    for (const [word, routes] of [...near].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))) {
      lines.push(`    ${word.replace(/[^a-z0-9]+/gi, '_')} = ${set(routes.sort().map((route) => `@${handleOf(route)}`))}`);
    }
    lines.push('  }[reg=facet]');
  }
  lines.push('}[reg=facet]', '');
  return lines.join('\n');
}

/**
 * Two routes read the way Spw was built to read two understandings: the
 * ground they share, then the edge where they stop sharing, then what each
 * holds alone. The edge opens on the first kind, in the order a tree is read,
 * where the two part (EDGE_ORDER). A line delta of the two trees counts edits;
 * this names the slot. Printed only, never written: a diff is a sitting.
 */
const EDGE_ORDER = ['expression', 'keeps', 'shape', 'sections', 'name', 'links'];
const EXPRESSION_SLOTS = ['subject', 'mode', 'body', 'projection', 'scope', 'charge'];

function renderDiff(a, b, { registry, families }) {
  const set = (items) => `#[${items.join(', ')}][reg=set]`;
  const at = (route) => `@${handleOf(route)}`;
  const shared = (x, y) => x.filter((item) => y.includes(item));
  const alone = (x, y) => x.filter((item) => !y.includes(item));
  const factsOf = (page) => {
    const family = families.get(familyDirOf(page.route));
    const shape = family?.shapeOf.get(page.route) || '';
    const slot = family?.shapes.find((candidate) => candidate.key === shape)?.slot || [];
    const slots = page.expression ? readExpressionSlots(page.expression) : null;
    return {
      shape: shape ? rooted(path.join(family.dir, FAMILY_FILE), shape) : '',
      fills: slot.length ? fillOf(page, slot) : '',
      sections: shapeTokensOf(page),
      wonder: page.wonder,
      subjects: [...page.subjects.keys()],
      reach: [...reachOf(page)].filter((route) => route !== a.route && route !== b.route).sort(),
      slots: slots && Object.fromEntries(EXPRESSION_SLOTS.map((key) => [key, [].concat(slots[key] || []).join('.')])),
      keeps: registry.get(page.route)?.keeps ? 'written' : 'unwritten',
    };
  };
  const fa = factsOf(a);
  const fb = factsOf(b);
  const pair = (x, y) => [`    a = ${x}`, `    b = ${y}`];

  const ground = [];
  const edge = new Map();
  if (fa.slots && fb.slots) {
    const same = EXPRESSION_SLOTS.filter((key) => fa.slots[key] && fa.slots[key] === fb.slots[key]);
    const moved = EXPRESSION_SLOTS.filter((key) => fa.slots[key] !== fb.slots[key]);
    if (same.length) ground.push('  expression = .{', ...same.map((key) => `    ${key} = ${tick(fa.slots[key])}`), '  }[reg=facet]');
    if (moved.length) {
      edge.set('expression', ['  expression = .{  # the slots that moved', ...moved.flatMap((key) => [
        `    ${key} = .{`, `      a = ${tick(fa.slots[key] || 'none')}`, `      b = ${tick(fb.slots[key] || 'none')}`, '    }[reg=facet]',
      ]), '  }[reg=facet]']);
    }
  } else if (a.expression || b.expression) {
    edge.set('expression', ['  expression = .{', ...pair(tick(a.expression || 'none'), tick(b.expression || 'none')), '  }[reg=facet]']);
  }
  if (fa.keeps !== fb.keeps) edge.set('keeps', ['  keeps = .{', ...pair(fa.keeps, fb.keeps), '  }[reg=facet]']);
  if (fa.shape && fa.shape === fb.shape) ground.push(`  shape = ${fa.shape}`);
  else if (fa.shape || fb.shape) edge.set('shape', ['  shape = .{', ...pair(fa.shape || 'none', fb.shape || 'none'), '  }[reg=facet]']);
  const common = shared(fa.sections, fb.sections);
  if (common.length) ground.push(`  sections = {${common.join('.')}}  # in the first route's order`);
  const parting = fa.sections.findIndex((item, index) => item !== fb.sections[index]);
  const split = parting === -1 && fb.sections.length > fa.sections.length ? fa.sections.length : parting;
  if (split !== -1) {
    edge.set('sections', [`  sections = .{  # read in order, they part at section ${split + 1}`, `    at = ${split + 1}`,
      ...pair(tick(fa.sections[split] || 'none'), tick(fb.sections[split] || 'none')), '  }[reg=facet]']);
  }
  if ((fa.fills || fb.fills) && fa.fills !== fb.fills) {
    edge.set('name', ['  name = .{  # the value each puts in its shape\'s slot', ...pair(tick(fa.fills || 'none'), tick(fb.fills || 'none')), '  }[reg=facet]']);
  }
  const aToB = reachOf(a).has(b.route) ? 1 : 0;
  const bToA = reachOf(b).has(a.route) ? 1 : 0;
  if (aToB && bToA) ground.push('  links = `each links to the other`');
  else edge.set('links', ['  links = .{', `    a_to_b = ${aToB}`, `    b_to_a = ${bToA}`, '  }[reg=facet]']);
  for (const [key, label] of [['wonder', 'wonder'], ['subjects', 'subjects']]) {
    const both = shared(fa[key], fb[key]);
    if (both.length) ground.push(`  ${label} = ${set(both)}`);
  }
  // The ground is what a reader may skim, so shared reach is a count; the edge and own keep their lists.
  const reachBoth = shared(fa.reach, fb.reach);
  if (reachBoth.length) ground.push(`  reach = ${reachBoth.length}  # other routes both link to`);

  const ownOf = (x, y) => {
    const lines = [];
    for (const [key, items] of [
      ['sections', alone(x.sections, y.sections)],
      ['wonder', alone(x.wonder, y.wonder)],
      ['subjects', alone(x.subjects, y.subjects)],
      ['reach', alone(x.reach, y.reach).map(at)],
    ]) if (items.length) lines.push(`    ${key} = ${set(items)}`);
    return lines;
  };
  const cited = [...new Set([a.route, b.route, ...alone(fa.reach, fb.reach), ...alone(fb.reach, fa.reach)])].sort();
  const first = EDGE_ORDER.find((kind) => edge.has(kind));
  return [
    `# ${a.route} against ${b.route} — the ground they share, the edge where they stop sharing, and what each holds alone.`,
    '# GENERATED by npm run spw:routes -- --diff from the two route trees. Read ground, then edge, then own.',
    '',
    `#>diff_${handleOf(a.route)}__${handleOf(b.route)}`,
    '#:route #!diff',
    '',
    ...cited.map((route) => `${at(route)}: ${rooted(treeOf(route))}`),
    '',
    `a = ${at(a.route)}`,
    `b = ${at(b.route)}`,
    '',
    '^"ground"{  # what both hold',
    ...(ground.length ? ground : ['  none = `no slot read here is shared`']),
    '}[reg=facet]',
    '',
    `^"edge"{  # where they stop sharing, in the order a tree is read: ${EDGE_ORDER.join(', ')}`,
    `  first = ${first ? tick(first) : '`none`'}`,
    ...EDGE_ORDER.flatMap((kind) => edge.get(kind) || []),
    '}[reg=facet]',
    '',
    '^"own"{  # what one holds and the other does not',
    ...[['a', ownOf(fa, fb)], ['b', ownOf(fb, fa)]].flatMap(([key, lines]) => (lines.length
      ? [`  ${key} = .{`, ...lines, '  }[reg=facet]']
      : [`  ${key} = \`nothing the other lacks\``])),
    '}[reg=facet]',
    '',
  ].join('\n');
}

function renderIndex(pages, registry, families) {
  const from = path.join(OUT, 'index.spw');
  const familyHandle = (dir) => `@family_${token(familyLabelOf(dir)) || 'site'}`;
  // Grouped by URL section, the way the folders sit; each tree carries its declared surface as a mark.
  const bySection = new Map();
  for (const page of pages) {
    const section = page.route === '/' ? 'home' : page.route.split('/')[1];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push(page);
  }
  const lines = [
    '# Routes as Spw — one tree per public route, grouped by URL section.',
    '# GENERATED by npm run spw:routes -- --write. Edit the routes and .spw/surfaces.spw, not this.',
    '',
    '#>routes_index',
    '#:route #!index',
    '',
    `@registry: ${rooted(REGISTRY)}`,
    ...pages.map((page) => `@${handleOf(page.route)}: ${cite(from, treeOf(page.route))}`),
    ...[...families.keys()].map((dir) => `${familyHandle(dir)}: ${cite(from, path.join(dir, FAMILY_FILE))}`),
    '',
    `kept = ${pages.filter((page) => registry.get(page.route)?.keeps).length}`,
    `routes = ${pages.length}`,
    `families = #[${[...families.keys()].map(familyHandle).join(', ')}][reg=set]`,
    '',
  ];
  for (const [section, list] of [...bySection].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`${section.replace(/[^a-z0-9]+/gi, '_')} = #[${list.map((page) => `@${handleOf(page.route)}`).join(', ')}][reg=set]`);
  }
  return `${lines.join('\n')}\n`;
}

const files = execFileSync('git', ['ls-files', '*index.html'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter((file) => file && !/^(public|dist|node_modules|workers|\.)/.test(file));
const htmlByFile = new Map(await Promise.all(files.map(async (file) => [file, await readFile(path.join(ROOT, file), 'utf8')])));
const routes = new Set(files.map(toRoutePath));
const pages = files.filter((file) => /<spw-page\b/i.test(htmlByFile.get(file)))
  .map((file) => readRoute(file, htmlByFile.get(file), routes))
  .sort((a, b) => a.route.localeCompare(b.route));
const context = {
  kin: kinOf(pages),
  byRoute: new Map(pages.map((page) => [page.route, page])),
  topicWords: topicWordsOf(pages),
  registry: await readRegistry(),
  questions: await readQuestions(),
  families: familiesOf(pages),
};

/** Every file one run writes: a tree per route, a family per shared folder, and the index. */
const outputs = () => new Map([
  ...pages.map((page) => [treeOf(page.route), render(page, context)]),
  ...[...context.families.values()].map((family) => [path.join(family.dir, FAMILY_FILE), renderFamily(family)]),
  [path.join(OUT, 'index.spw'), renderIndex(pages, context.registry, context.families)],
]);

/**
 * The language server's projection registry. It reads ^projection[name]{}
 * blocks from .spw/gen/index.spw: a file under root gets a "generated from"
 * lens, the spec owner gets a "projects" lens, and the owner reports the
 * projection stale when it is newer than root. Other generators may keep
 * their own blocks in that file, so a run replaces only this one.
 */
const GEN_INDEX = path.join(ROOT, '.spw/gen/index.spw');
/** Every generator's ^projection block, the routes one among them (scripts/lib/spw-projections.mjs). */
const genIndexText = (existing = '') => projectionIndexText(existing);
const readGenIndex = () => readFile(GEN_INDEX, 'utf8').catch(() => '');

/** Anchors a generated tree declares, by the forms spw-integrity reads. */
const anchorsOfTree = (text) => new Set([
  ...[...text.matchAll(/^#>([\w-]+)/gm)].map((match) => match[1]),
  ...[...text.matchAll(/\^"([^"]+)"\s*\{/g)].map((match) => match[1]),
  ...[...text.matchAll(/^\s{0,2}([\w-]+)\s*[:=]/gm)].map((match) => match[1]),
]);

/**
 * spw:integrity and spw lint skip .spw/gen/, so this is the only reader that
 * asks whether the trees parse and whether each citation lands. Trees are
 * checked in memory: a tree citation resolves against the files this run would
 * write, a tree fragment against that tree's anchors, and a page fragment
 * against the ids in that page's HTML.
 */
async function checkTrees() {
  let seed = null;
  try {
    seed = await import('../.spw/_workbench/packages/spw-seed/src/index.ts');
  } catch {
    // No tsx loader: citations are still checked; parsing is reported as skipped.
  }
  const written = outputs();
  const trees = new Set(written.keys());
  written.set(GEN_INDEX, genIndexText(await readGenIndex()));
  const idsByFile = new Map();
  const anchorsByTree = new Map();
  const problems = [];
  let citations = 0;
  for (const [from, text] of written) {
    const label = path.relative(ROOT, from);
    if (seed) {
      const result = seed.parse(text);
      if (!result.success || (result.errors || []).length) {
        const error = (result.errors || [])[0];
        problems.push(`${label} does not parse${error ? ` at ${error.position?.line}:${error.position?.column}: ${error.data?.message}` : ''}`);
      }
    }
    for (const [, target] of text.matchAll(/~"([^"]+)"/g)) {
      citations += 1;
      const [relative, fragment] = target.split('#');
      const absolute = relative.startsWith('/') ? path.join(ROOT, relative) : path.resolve(path.dirname(from), relative);
      const repoFile = path.relative(ROOT, absolute);
      if (!trees.has(absolute) && !htmlByFile.has(repoFile) && absolute !== REGISTRY) {
        problems.push(`${label} cites ${target}, which is no tree, route or registry`);
      } else if (fragment && htmlByFile.has(repoFile)) {
        if (!idsByFile.has(repoFile)) idsByFile.set(repoFile, new Set([...htmlByFile.get(repoFile).matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])));
        if (!idsByFile.get(repoFile).has(fragment)) problems.push(`${label} cites ${target}, and ${repoFile} has no id ${fragment}`);
      } else if (fragment && trees.has(absolute)) {
        if (!anchorsByTree.has(absolute)) anchorsByTree.set(absolute, anchorsOfTree(written.get(absolute)));
        if (!anchorsByTree.get(absolute).has(fragment)) problems.push(`${label} cites ${target}, which names no anchor there`);
      }
    }
  }
  for (const line of problems) console.log(`  ${line}`);
  console.log(`[spw:routes] check: ${written.size} files, ${citations} citations, ${seed ? 'parsed with spw-seed' : 'parse skipped (run through npm run spw:routes for the tsx loader)'}; ${problems.length ? `${problems.length} problems` : 'all trees parse and every citation lands'}`);
  return problems.length;
}

if (args.includes('--check')) {
  process.exit(await checkTrees() ? 1 : 0);
} else if (diffPair) {
  const [a, b] = diffPair.map((route) => context.byRoute.get(asRoute(route)));
  if (diffPair.length < 2 || !a || !b) {
    console.error(`[spw:routes] --diff needs two routes with a <spw-page> block; got ${diffPair.join(' ') || 'none'}`);
    process.exit(1);
  }
  process.stdout.write(renderDiff(a, b, context));
} else if (only) {
  const page = pages.find((candidate) => candidate.route === only);
  if (!page) {
    console.error(`[spw:routes] no route ${only}`);
    process.exit(1);
  }
  process.stdout.write(`${render(page, context)}`);
} else {
  const kept = pages.filter((page) => context.registry.get(page.route)?.keeps).length;
  const listed = pages.filter((page) => context.registry.has(page.route)).length;
  const unnamed = pages.filter((page) => !page.wonder.length).length;
  const kinCounts = pages.map((page) => new Set([...context.kin.get(page.route).values()].flat()).size).sort((a, b) => a - b);
  const nearPairs = pages.reduce((sum, page) => sum + new Set([...nearOf(page, context).values()].flat()).size, 0) / 2;
  const families = [...context.families.values()];
  const shaped = families.reduce((sum, family) => sum + family.shapeOf.size, 0);
  const owning = families.reduce((sum, family) => sum + family.own.size, 0);
  const lacking = families.reduce((sum, family) => sum + family.missing.size, 0);
  // A shaped route reduces to follows, fills and own. own is a set, so the
  // reduction loses where an own section sat when one comes before or inside the order.
  const shapeList = families.flatMap((family) => family.shapes.map((shape) => ({ family, shape })));
  const paying = shapeList.filter(({ shape }) => shape.saves > 0).sort((x, y) => y.shape.saves - x.shape.saves);
  const slotted = shapeList.filter(({ shape }) => shape.slot.length).length;
  const misplaced = families.flatMap((family) => family.shapes.flatMap((shape) => shape.members.filter((route) => {
    const tokens = shapeTokensOf(context.byRoute.get(route));
    const rebuilt = [...shape.order, ...tokens.filter((item) => !shape.order.includes(item))];
    return tokens.join('.') !== rebuilt.join('.');
  }))).length;
  if (write) {
    await rm(OUT, { recursive: true, force: true });
    for (const [file, text] of outputs()) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text.endsWith('\n') ? text : `${text}\n`);
    }
    await writeFile(GEN_INDEX, genIndexText(await readGenIndex()));
  }
  console.log(`[spw:routes] ${pages.length} routes; ${listed} in public_routes, ${kept} with keeps; ${unnamed} name no wonder type`);
  console.log(`[spw:routes] kin by two shared types: median ${kinCounts[Math.floor(kinCounts.length / 2)]} routes each; ${nearPairs} near pairs share a subject or keyword and link neither way`);
  console.log(`[spw:routes] ${families.length} families; ${families.reduce((sum, family) => sum + family.shapes.length, 0)} shapes followed by ${shaped} routes; ${owning} routes hold something no sibling holds; ${lacking} lack what most siblings hold`);
  console.log(`[spw:routes] ${paying.length} of ${shapeList.length} shapes would save section tokens if named${paying.length ? ` (most: /${familyLabelOf(paying[0].family.dir)}/ ${paying[0].shape.key}, ${paying[0].shape.saves})` : ''}; ${slotted} carry each member's name in a slot; follows + own rebuilds the section order of ${shaped - misplaced} of ${shaped} shaped routes, and ${misplaced} hold an own section before or inside their shape`);
  console.log(write
    ? `[spw:routes] wrote ${path.relative(ROOT, OUT)}/ (${pages.length} trees, ${families.length} families, index.spw) and the projections in ${path.relative(ROOT, GEN_INDEX)}`
    : '[spw:routes] --write rebuilds .spw/gen/routes/; --route /path/ prints one tree; --check parses and resolves');
}
