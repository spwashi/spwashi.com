// The reader bundle carries parse with the editor's reading (roles, outline, anchors),
// so the tool proves a source the way the editor reads it without loading the parser twice.
import { renderSpwDoors } from './spw-doors.js';
import { anchors, outline, parse, roles, SPW_PARSER_BUILD } from '/public/js/semantic/spw-workbench-reader.js';
import { bracePairAt, highlightSpw, lineStarts } from '/public/js/semantic/spw-highlight.js';
import { GENRE_REASONS, readGenre } from '/public/js/semantic/spw-genre-checks.js';

import {
  createParserAppUrl,
  PARSER_LINK_MAX_SOURCE as MAX_APP_SOURCE_LENGTH,
  PARSER_NAME_PARAM as NAME_PARAM,
  PARSER_SOURCE_PARAM as SOURCE_PARAM,
} from '../../kernel/parser-link.js';

export { createParserAppUrl };
const MAX_FILE_BYTES = 256 * 1024;

export const SPW_LITERAL_PARSER_SAMPLES = Object.freeze({
  proof: 'proof[parser]{literal.ast.lossless}',
  contract: `^[literal_parser]{
  source = "Spw stays readable."
  proof = #[tokens, ast, diagnostics]
  ~<authority>"spw-workbench"
}`,
  navigation: `#>navigation[section]{
  @reads="authored expression"
  @emits=#[label, syntax_wake]
}`,
  diagnostic: 'proof § unsupported_character',
  /** Open combinatorics: same stem, different containers and binding seats. */
  beans: `<beans>
[beans]
{beans}
(beans)
beans.<
<beans>#
beans.[stew]`,
  /** Six public practice doors. Kin to About resume.practice.* handles. */
  practices: `practice[software]{business}
practice[learning]{text}
practice[illustration]{folios}
practice[design]{components}
practice[oration]{comedy}
practice[organization]{sprint}`,
  /** Language as synchronization: shape of ideas, and across spiritual vocabularies. */
  sync: `language[sync]{
  ~<god>
  ~<ideas>
}`,
  film: `practice[film]{release}
~<shot>
~<voice>`,
  year: `budget[year]{income.skill.expectation}
career[year]{heard.unknown}`,
  /** v0.4 Language evolution: claim and probe blocks with falsification contracts. */
  v04_claims: `^"claim_probe_synthesis"{
  hypothesis = "Every claim declares its falsification criteria."
  spec_ref = ~"./pillars/claim-probe-syntax.spw"
  probe = ?[claim_probes]{ !run{validate_spw} }
  falsification = "Any claim without an executable probe is rejected."
}[reg=facet]`,
  /** v0.4 Profiles: file shape declarations implying required structural blocks. */
  profiles: `!:profile "convention"
#>convention_profile[spec]{
  required_blocks = #[intent, dimensions, validation]
  fixity = #!stable
  operation = #!align
}`,
  /** Dot-crawl joins: crawl traverses complete braces rather than one identifier. */
  dot_crawl: `{kitchen}.{prep}.{bake} ~> [loaf]
(arrival).(settle).(resonate)
harvest[crop].store[silo].mill[flour]`,
  /** v0.4 Stem projection: single semantic root precipitating across substrates. */
  stem_projection: `>stem[hero_banner]{
  copy = "One root, multiple substrates."
  tokens = #["--spw-hero-intensity", "--spw-tangibility"]
  runtime = "data-spw-hero-kinetic"
  inspect = ~"#>hero_inspection"
}`,
  /** v0.4 Combinatoric genre: boonhonk pantry and transformational expressions. */
  boonhonk: `boonhonk[genre]{combine.discover.reward}
boon[honk]{invite}
bane[bone]{limit}
bone[bonk]{hit}
boon[bane]{cost}
honk[bonk]{signal}`,
  /** Discrete path count: the spatial twin of a boonhonk pair. */
  paths: `paths[grid]{east.north}
count[paths]{binomial}`,
  /** Slice-specific rates packaged as one local uphill hint. */
  gradient: `field[gradient]{uphill}
slice[x]{hold.y}
slice[y]{hold.x}`,
  /** Seed, season, table — holdings, not a single ticker. */
  holdings: `hold[seed.season.table]{identity.boundary.ledger}<policy>
seed[identity]{render.twice}
season[boundary]{no.silent.mint}`,
  beat: `beat[unary]{close}<offer>
beat[pair]{pieces}<compose>
beat[season]{portfolio}<dwell>`,
});

/** Where a sample sits, and what its script is doing. `href` is a page on this site, a section of this tool, or the workbench. */
export const SPW_LITERAL_PARSER_PLACES = Object.freeze({
  proof: {
    says: 'One line: a parser, its literal reading, an AST, and a check that the tokens rebuild the source.',
    href: '#what-this-proves',
    label: 'What this proves',
  },
  contract: {
    says: 'The source stays a note. The proof is the tokens, the tree, and the diagnostics. The authority named here is the workbench.',
    href: 'https://github.com/spwashi/spw-workbench',
    label: 'spw-workbench',
  },
  navigation: {
    says: 'A section address. @reads is the expression handed in. @emits is the set of labels that section is willing to wake.',
    href: '/topics/software/spw/#spw-operator-atlas',
    label: 'Operator atlas',
  },
  diagnostic: {
    says: 'The section sign is not a token this lexer accepts, so the diagnostic list has an error and the reconstruction is not exact.',
    href: '#proof-output',
    label: 'Diagnostics',
  },
  beans: {
    says: 'The same stem in six seats: a concept, a mode, a definition, a scene, a ground then an edge, and a concept closed then marked.',
    href: '/topics/software/spw/#concept-form-lab',
    label: 'Concept form lab',
  },
  practices: {
    says: 'Six doors. Each is a practice, a mode, and what that practice holds. The resume uses the same shape.',
    href: '/about/#resume-practices',
    label: 'Resume practices',
  },
  sync: {
    says: 'Language held as sync: two concepts, god and ideas, kept in reach without being opened.',
    href: '/about/#career-register',
    label: 'Career register',
  },
  film: {
    says: 'Film as a practice of release, with shot and voice kept in reach.',
    href: '/topics/film/#film-capacities',
    label: 'Film paths',
  },
  year: {
    says: 'A year as income, skill, and expectation, beside a career of what was heard and what is still unknown.',
    href: '/tools/budgeting/#year-mix',
    label: 'Year mix',
  },
  v04_claims: {
    says: 'A claim that names how it would fail, and a probe that would run the check.',
    href: '/topics/software/spw/#language-evolution-v04',
    label: 'Language evolution',
  },
  profiles: {
    says: 'An old file-profile header. The live convention is a path plus #:layer, #:operation, and #:fixity.',
    href: '/topics/software/spw/#language-evolution-v04',
    label: 'Header axes',
  },
  dot_crawl: {
    says: 'A dot between closed braces crawls from one to the next. A tight dot is one name. ~> carries that crawl on as a path.',
    href: '/topics/software/spw/#join-crawl',
    label: 'Joins',
  },
  stem_projection: {
    says: 'An old projection: one stem written out into copy, tokens, a runtime attribute, and a handle. Stem families are traced instead.',
    href: '/topics/software/spw/#language-evolution-v04',
    label: 'Language evolution',
  },
  boonhonk: {
    says: 'Five voices crossed as pairs: invite, limit, hit, cost, and signal. A genre, not a catalog of products.',
    href: '/play/rpg-wednesday/#rpgw-boonhonk',
    label: 'Boonhonk',
  },
  paths: {
    says: 'East and north as one grid, and the count of those paths as a binomial.',
    href: '/topics/math/combinatorics/#combinatorics-lab',
    label: 'Counting lab',
  },
  gradient: {
    says: 'One field named as uphill, then two slices that each hold the other axis.',
    href: '#sample-gradient',
    label: 'Gradient slices',
  },
  holdings: {
    says: 'A hold of seed, season, and table, projected onto policy. Identity renders twice. A season does not mint in silence.',
    href: '/topics/knowledge-bases/#versioned-holdings',
    label: 'Versioned holdings',
  },
  beat: {
    says: 'Three beats of one offer: close, compose, and dwell.',
    href: '/services/creator/#first-beat',
    label: 'First beat',
  },
});

function countAstNodes(value, depth = 0, census = { total: 0, maxDepth: 0, types: new Map() }) {
  if (!value || typeof value !== 'object') return census;
  if (typeof value.type === 'string' && /[a-z]/.test(value.type)) {
    census.total += 1;
    census.maxDepth = Math.max(census.maxDepth, depth);
    census.types.set(value.type, (census.types.get(value.type) || 0) + 1);
  }

  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    countAstNodes(child, depth + 1, census);
  }
  return census;
}

function reconstructTokens(tokens = []) {
  return tokens
    .filter((token) => token.type !== 'EOF')
    .map((token) => token.value)
    .join('');
}

function messageFromEvent(event) {
  return event?.data?.message
    || event?.data?.error
    || `${event?.rule || 'parser'} reported ${event?.type || 'an event'}`;
}

export function parseLiteralSource(source) {
  const input = String(source ?? '');
  const output = parse(input);
  const reconstruction = reconstructTokens(output.tokens);
  const astCensus = countAstNodes(output.ast);

  return {
    source: input,
    output,
    reconstruction,
    reconstructsExactly: reconstruction === input,
    astCensus: {
      total: astCensus.total,
      maxDepth: astCensus.maxDepth,
      types: Object.fromEntries([...astCensus.types.entries()].sort(([a], [b]) => a.localeCompare(b))),
    },
  };
}

function tokenDisplayValue(token) {
  if (!token.value) return '∅';
  return token.value
    .replaceAll(' ', '·')
    .replaceAll('\t', '⇥')
    .replaceAll('\n', '↵\n');
}

function renderTokens(host, tokens) {
  host.replaceChildren();
  const fragment = document.createDocumentFragment();

  tokens.forEach((token, index) => {
    const row = document.createElement('li');
    row.className = 'literal-parser-token';

    const position = token.span?.start
      ? `${token.span.start.line}:${token.span.start.column}`
      : '—';
    const kind = token.kind ? ` · ${token.kind}` : '';

    const ordinal = document.createElement('span');
    ordinal.className = 'literal-parser-token__ordinal';
    ordinal.textContent = String(index + 1).padStart(2, '0');

    const type = document.createElement('strong');
    type.textContent = `${token.type}${kind}`;

    const value = document.createElement('code');
    value.textContent = tokenDisplayValue(token);

    const span = document.createElement('span');
    span.className = 'literal-parser-token__span';
    span.textContent = position;

    row.append(ordinal, type, value, span);
    fragment.append(row);
  });

  host.append(fragment);
}

/** Role classes are prefixed so the editor's role names never meet the site's own spw-* classes. */
export const READER_CLASS_PREFIX = 'spw-role-';

/** The source as the editor reads it: highlighted HTML (shared with Spw code blocks), the outline, the anchors. */
export function readAsEditor(source, { emphasize = null } = {}) {
  const input = String(source ?? '');
  return {
    html: highlightSpw(input, roles(input), { emphasize }),
    outline: outline(input),
    anchors: anchors(input),
  };
}

/** Each outline row is a button that puts the caret on its line. */
function renderOutline(host, symbols, jump) {
  host.replaceChildren();
  const add = (list, symbol) => {
    const item = document.createElement('li');
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'literal-parser-outline__go';
    const at = symbol.selectionRange?.start || symbol.range?.start || { line: 0, character: 0 };
    go.addEventListener('click', () => jump(at.line, at.character));
    const name = document.createElement('code');
    name.textContent = symbol.name;
    go.append(name);
    if (symbol.detail) {
      const detail = document.createElement('span');
      detail.className = 'literal-parser-outline__detail';
      detail.textContent = symbol.detail;
      go.append(detail);
    }
    const line = document.createElement('span');
    line.className = 'literal-parser-outline__line';
    line.textContent = `L${at.line + 1}`;
    go.append(line);
    item.append(go);
    if (symbol.children?.length) {
      const children = document.createElement('ol');
      symbol.children.forEach((child) => add(children, child));
      item.append(children);
    }
    list.append(item);
  };
  symbols.forEach((symbol) => add(host, symbol));
  if (!symbols.length) {
    const item = document.createElement('li');
    item.dataset.tone = 'empty';
    item.textContent = 'No frames, anchors or wonders to outline.';
    host.append(item);
  }
}

/** What a file of this kind is asked: each check as a line to go to, with the reason its rule exists beneath. */
function renderGenre(host, output, source, jump) {
  const genre = readGenre(output, source);
  const row = (tone, says, why, line) => {
    const item = document.createElement('li');
    item.dataset.tone = tone;
    if (line && jump) {
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'literal-parser-diagnostic__go';
      go.textContent = `L${line} — ${says}`;
      go.addEventListener('click', () => jump(line - 1, 0));
      item.append(go);
    } else {
      item.append(says);
    }
    const reason = document.createElement('p');
    reason.className = 'literal-parser-diagnostic__why';
    reason.textContent = why;
    item.append(reason);
    host.append(item);
  };
  const identity = [...genre.layers.map((layer) => `#:${layer}`), ...genre.names.map((name) => `#>${name}`)];
  if (identity.length) row('ok', `Says what it is: ${identity.join(' ')}`, GENRE_REASONS.identity, 0);
  for (const check of genre.checks) row(check.state === 'fail' ? 'warning' : 'ok', check.says, check.why, check.line);
}

function renderDiagnostics(host, output, jump, source = '') {
  host.replaceChildren();
  const diagnostics = [
    ...output.errors.map((event) => ({ tone: 'error', event })),
    ...output.warnings.map((event) => ({ tone: 'warning', event })),
  ];

  if (!diagnostics.length) {
    const item = document.createElement('li');
    item.dataset.tone = 'ok';
    item.textContent = 'No parser diagnostics.';
    host.append(item);
  }

  diagnostics.forEach(({ tone, event }) => {
    const item = document.createElement('li');
    item.dataset.tone = tone;
    const position = event.position
      ? `L${event.position.line}:C${event.position.column}`
      : 'unknown position';
    const said = `${position} — ${messageFromEvent(event)}`;
    if (event.position && jump) {
      const go = document.createElement('button');
      go.type = 'button';
      go.className = 'literal-parser-diagnostic__go';
      go.textContent = said;
      go.addEventListener('click', () => jump(event.position.line - 1, Math.max(0, event.position.column - 1)));
      item.append(go);
    } else {
      item.textContent = said;
    }
    host.append(item);
  });
  renderGenre(host, output, source, jump);
}

function setMetric(root, name, value, tone = '') {
  const output = root.querySelector(`[data-parser-metric="${name}"]`);
  if (!(output instanceof HTMLElement)) return;
  output.textContent = String(value);
  if (tone) output.dataset.tone = tone;
  else delete output.dataset.tone;
}

function sampleKey(name = '') {
  const key = String(name || '').trim().replace(/\.spw$/i, '');
  return Object.hasOwn(SPW_LITERAL_PARSER_SAMPLES, key) ? key : '';
}

/** Show the sample's meaning and its page, and mark the button that loaded it. */
function showPlace(root, key) {
  const place = root.querySelector('[data-parser-place]');
  const note = SPW_LITERAL_PARSER_PLACES[key];
  if (place instanceof HTMLElement) {
    const says = place.querySelector('[data-parser-place-says]');
    const link = place.querySelector('[data-parser-place-link]');
    if (note && says instanceof HTMLElement && link instanceof HTMLAnchorElement) {
      says.textContent = note.says;
      link.href = note.href;
      link.textContent = note.label;
      place.hidden = false;
    } else {
      place.hidden = true;
    }
  }
  root.querySelectorAll('[data-parser-sample]').forEach((button) => {
    if (button.dataset.parserSample === key) button.setAttribute('aria-pressed', 'true');
    else button.removeAttribute('aria-pressed');
  });
}

function resolveNamedSample(name = '') {
  const key = String(name || '')
    .trim()
    .replace(/\.spw$/i, '');
  if (!key || !Object.hasOwn(SPW_LITERAL_PARSER_SAMPLES, key)) return null;
  return {
    source: SPW_LITERAL_PARSER_SAMPLES[key],
    name: `${key}.spw`,
  };
}

function readLaunchSource() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get(SOURCE_PARAM);
  const name = (params.get(NAME_PARAM) || params.get('spw_sample') || '').slice(0, 120);
  if (source !== null) {
    return {
      source: source.slice(0, MAX_FILE_BYTES),
      name,
    };
  }
  return resolveNamedSample(name) || { source: '', name };
}

function setAppLink(link, source, name) {
  if (!(link instanceof HTMLAnchorElement)) return;
  const tooLarge = source.length > MAX_APP_SOURCE_LENGTH;
  if (tooLarge) {
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    link.title = `App URLs accept up to ${MAX_APP_SOURCE_LENGTH.toLocaleString()} characters. Open this source as a .spw file instead.`;
    return;
  }

  const url = createParserAppUrl(source, name);
  link.href = url.href;
  link.removeAttribute('aria-disabled');
  link.removeAttribute('title');

  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  link.textContent = standalone ? '@ reload source in app' : '@ load source into app';
  link.target = standalone ? '_self' : '_blank';
  link.rel = standalone ? '' : 'noopener';
}

function initAppInstallAction(button) {
  if (!(button instanceof HTMLButtonElement)) return;
  const standalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (standalone) {
    button.textContent = 'App installed';
    button.disabled = true;
    return;
  }

  button.addEventListener('click', () => {
    window.spwPwa?.showInstallPrompt?.();
  });
}

function initLiteralParser(root) {
  const input = root.querySelector('[data-parser-source]');
  const tokenList = root.querySelector('[data-parser-tokens]');
  const ast = root.querySelector('[data-parser-ast]');
  const diagnostics = root.querySelector('[data-parser-diagnostics]');
  const appLink = root.querySelector('[data-parser-app-link]');
  const doors = root.querySelector('[data-parser-doors]');
  const fileInput = root.querySelector('[data-parser-file]');
  const sourceName = root.querySelector('[data-parser-source-name]');
  const status = root.querySelector('[data-parser-status]');
  const outlineList = root.querySelector('[data-parser-outline]');
  const field = root.querySelector('[data-parser-field]');
  const paint = root.querySelector('[data-parser-paint]');

  if (!(input instanceof HTMLTextAreaElement)
    || !(tokenList instanceof HTMLElement)
    || !(ast instanceof HTMLElement)
    || !(diagnostics instanceof HTMLElement)) return;

  let activeName = '';
  let timer = 0;
  // The last full reading, kept so the caret can light a brace pair without parsing again.
  let read = { text: null, tokens: [], spans: [], pair: null };

  /* ---- The painted field: the source drawn under a clear textarea, character for character. ---- */
  const live = field instanceof HTMLElement && paint instanceof HTMLElement;
  const paintPlain = () => {
    if (live) paint.textContent = `${input.value}\n`;
  };
  const paintRead = () => {
    if (!live || read.text !== input.value) return;
    const emphasize = read.pair ? new Set(read.pair) : null;
    paint.innerHTML = `${highlightSpw(read.text, read.spans, { emphasize })}\n`;
  };
  if (live) {
    // The sheet loader reaches the bus, which needs a document, so it comes in only here.
    import('/public/js/kernel/deferred-styles.js').then((styles) => styles.ensureSpwSourceStyles()).catch(() => {});
    paintPlain();
    field.dataset.live = '';
  }

  /** Put the caret on a 0-based line and column, and bring it into view. */
  const jump = (line = 0, column = 0) => {
    const starts = lineStarts(input.value);
    const lineStart = starts[Math.max(0, Math.min(line, starts.length - 1))] ?? 0;
    const lineEnd = input.value.indexOf('\n', lineStart);
    const offset = Math.min(lineStart + column, lineEnd < 0 ? input.value.length : lineEnd);
    input.focus({ preventScroll: true });
    input.setSelectionRange(offset, offset);
    field?.scrollIntoView?.({ block: 'nearest' });
    if (live) {
      const lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 20;
      const top = line * lineHeight;
      if (top < field.scrollTop || top > field.scrollTop + field.clientHeight - lineHeight * 2) {
        field.scrollTop = Math.max(0, top - field.clientHeight / 3);
      }
    }
    updatePair();
  };

  /** Light the brace under the caret and its partner. */
  const updatePair = () => {
    if (read.text !== input.value || input.selectionStart !== input.selectionEnd) {
      if (read.pair) { read.pair = null; paintRead(); }
      return;
    }
    const pair = bracePairAt(read.tokens, input.selectionStart);
    const same = pair && read.pair && pair[0] === read.pair[0] && pair[1] === read.pair[1];
    if (same || (!pair && !read.pair)) return;
    read.pair = pair;
    paintRead();
  };

  const render = () => {
    const source = input.value;
    try {
      const result = parseLiteralSource(source);
      const { output, astCensus } = result;
      renderTokens(tokenList, output.tokens);
      renderDiagnostics(diagnostics, output, jump, source);
      ast.textContent = JSON.stringify(output.ast ?? null, null, 2);
      const parseState = !output.success
        ? 'partial'
        : output.errors.length
          ? `accepted + ${output.errors.length} error${output.errors.length === 1 ? '' : 's'}`
          : 'valid';
      setMetric(root, 'parse', parseState, output.success && !output.errors.length ? 'ok' : 'error');
      setMetric(root, 'tokens', output.tokens.length);
      setMetric(root, 'nodes', astCensus.total);
      setMetric(root, 'depth', astCensus.maxDepth);
      setMetric(root, 'reconstruction', result.reconstructsExactly ? 'exact' : 'changed', result.reconstructsExactly ? 'ok' : 'error');
      setMetric(root, 'time', `${output.duration.toFixed(2)} ms`);
      read = { text: source, tokens: output.tokens, spans: roles(source), pair: null };
      if (document.activeElement === input) read.pair = bracePairAt(read.tokens, input.selectionStart);
      paintRead();
      if (outlineList instanceof HTMLElement) renderOutline(outlineList, outline(source), jump);
      setMetric(root, 'anchors', anchors(source).length);
      setAppLink(appLink, source, activeName);
      renderSpwDoors(doors, source, activeName);
      const key = sampleKey(activeName);
      showPlace(root, key && source === SPW_LITERAL_PARSER_SAMPLES[key] ? key : '');
      if (status instanceof HTMLElement) {
        status.textContent = output.success && !output.errors.length
          ? `Parsed ${output.tokens.length} tokens into ${astCensus.total} AST nodes.`
          : `Parser reported ${output.errors.length} error${output.errors.length === 1 ? '' : 's'}; its success flag is ${String(output.success)}. Source remains editable.`;
      }
    } catch (error) {
      tokenList.replaceChildren();
      ast.textContent = 'null';
      read = { text: null, tokens: [], spans: [], pair: null };
      paintPlain();
      if (outlineList instanceof HTMLElement) outlineList.replaceChildren();
      diagnostics.replaceChildren();
      const item = document.createElement('li');
      item.dataset.tone = 'error';
      item.textContent = error instanceof Error ? error.message : String(error);
      diagnostics.append(item);
      setMetric(root, 'parse', 'exception', 'error');
      if (status instanceof HTMLElement) status.textContent = 'The parser threw an exception.';
    }
  };

  const scheduleRender = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(render, 90);
  };

  const loadSource = (source, name = '') => {
    input.value = source;
    activeName = name;
    if (sourceName instanceof HTMLElement) {
      sourceName.textContent = name || 'editable literal';
    }
    paintPlain();
    render();
  };

  // Every keystroke repaints plain at once, so the text under the caret never drifts;
  // color follows on the next read.
  input.addEventListener('input', () => {
    paintPlain();
    scheduleRender();
  });
  for (const type of ['keyup', 'click', 'select', 'focus']) input.addEventListener(type, updatePair);
  input.addEventListener('blur', () => {
    releaseTab = false;
    if (read.pair) { read.pair = null; paintRead(); }
  });

  /* ---- Keys: indent with Tab, keep the indent on Enter, Esc then Tab to leave. ---- */
  let releaseTab = false;
  const insert = (text) => {
    // execCommand keeps the edit on the textarea's own undo stack; setRangeText is the fallback.
    if (!document.execCommand?.('insertText', false, text)) {
      input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };
  const indentLines = (outdent) => {
    const { value, selectionStart: from, selectionEnd: to } = input;
    const start = value.lastIndexOf('\n', from - 1) + 1;
    if (!outdent && !value.slice(from, to).includes('\n')) {
      insert('  ');
      return;
    }
    const block = value.slice(start, to);
    const changed = block.split('\n').map((line) => (outdent ? line.replace(/^( {1,2}|\t)/, '') : `  ${line}`)).join('\n');
    if (changed === block) return;
    input.setSelectionRange(start, to);
    insert(changed);
    input.setSelectionRange(start, start + changed.length);
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      releaseTab = true;
      if (status instanceof HTMLElement) status.textContent = 'Tab now leaves the editor.';
      return;
    }
    if (event.key === 'Tab') {
      if (releaseTab || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      indentLines(event.shiftKey);
      return;
    }
    releaseTab = false;
    if (event.key === 'Enter' && !event.shiftKey && !event.altKey && !event.ctrlKey && !event.metaKey && input.selectionStart === input.selectionEnd) {
      const { value, selectionStart: at } = input;
      const start = value.lastIndexOf('\n', at - 1) + 1;
      const indent = (value.slice(start).match(/^[ \t]*/) || [''])[0];
      const before = value[at - 1];
      const opens = before === '{' || before === '[' || before === '(';
      const closes = opens && value[at] === { '{': '}', '[': ']', '(': ')' }[before];
      event.preventDefault();
      if (closes) {
        insert(`\n${indent}  \n${indent}`);
        const caret = at + 1 + indent.length + 2;
        input.setSelectionRange(caret, caret);
      } else {
        insert(`\n${indent}${opens ? '  ' : ''}`);
      }
    }
  });

  root.querySelectorAll('[data-parser-sample]').forEach((button) => {
    button.addEventListener('click', () => {
      const sample = SPW_LITERAL_PARSER_SAMPLES[button.dataset.parserSample];
      if (sample) loadSource(sample, `${button.dataset.parserSample}.spw`);
    });
  });

  if (fileInput instanceof HTMLInputElement) {
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > MAX_FILE_BYTES) {
        if (status instanceof HTMLElement) status.textContent = 'That file is larger than the 256 KiB browser-demo limit.';
        fileInput.value = '';
        return;
      }
      loadSource(await file.text(), file.name);
      fileInput.value = '';
    });
  }

  const launched = readLaunchSource();
  const initial = launched.source || input.value || SPW_LITERAL_PARSER_SAMPLES.contract;
  const initialName = launched.name || (initial === SPW_LITERAL_PARSER_SAMPLES.contract ? 'contract.spw' : '');
  loadSource(initial, initialName);

  initAppInstallAction(root.querySelector('[data-parser-install]'));

  const provenance = root.querySelector('[data-parser-provenance]');
  if (provenance instanceof HTMLElement) {
    provenance.textContent = `${SPW_PARSER_BUILD.package} v${SPW_PARSER_BUILD.version} · ${SPW_PARSER_BUILD.commit}`;
  }
}

/** Catalog mount: the loader passes (ctx, root); root is the [data-parser-tool] host. */
export function initSpwLiteralParser(ctx, root) {
  const host = root instanceof Element && root.matches('[data-parser-tool]')
    ? root
    : (root?.querySelector?.('[data-parser-tool]') || document.querySelector('[data-parser-tool]'));
  if (host instanceof HTMLElement) initLiteralParser(host);
}
