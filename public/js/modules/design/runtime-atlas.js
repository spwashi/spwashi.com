/**
 * runtime-atlas.js — an explorer over public/data/runtime-atlas.json.
 *
 * The page already reads without this: the static family table and the
 * ratchets are written into the HTML by scripts/generate-runtime-atlas.mjs.
 * This module adds the relating: filter modules by family, host tier, or the
 * role of what they write; open one to read its contract as Spw, see which
 * stylesheets key on what it writes and which bus events it speaks; follow a
 * stylesheet back to every module that feeds it; replay a move from git's
 * rename record; and walk the handles the folio sidecars share.
 *
 * ?spw-atlas=<module-id> or #atlas-<module-id> opens a module on arrival.
 */

import { parserHref } from '../../kernel/parser-link.js';

const HOST_SELECTOR = '[data-runtime-atlas]';
const SOURCE = '/public/data/runtime-atlas.json';
const REPO = 'https://github.com/spwashi/spwashi.com/blob/main/';
const TIER_WORDS = Object.freeze({
  host: 'its own markup',
  document: 'the page\'s html, body, or window',
  shell: 'this site\'s chrome',
  memory: 'origin storage',
  channel: 'a bus',
  platform: 'network, service worker, or clipboard',
});

let mounted = null;

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function option(value, label, selected) {
  return h('option', { value, selected: value === selected }, label);
}

function readFocus() {
  const query = new URLSearchParams(location.search).get('spw-atlas');
  if (query) return query;
  const hash = location.hash.match(/^#atlas-([a-z0-9-]+)$/i)?.[1];
  return hash || null;
}

function writeFocus(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set('spw-atlas', id);
  else url.searchParams.delete('spw-atlas');
  history.replaceState(history.state, '', url);
}

function modulesFeeding(atlas, file) {
  return atlas.modules.filter((module) => module.writes.some(({ names }) => names.some((name) => (atlas.readers[name] || []).includes(file))));
}

function renderCard(atlas, module, state) {
  const readersOf = (name) => atlas.readers[name] || [];
  const writes = module.writes.map(({ role, names }) => h('div', { class: 'runtime-atlas__writes' },
    h('p', { class: 'runtime-atlas__role' }, `![${role}]`),
    h('ul', {}, names.map((name) => {
      const readers = readersOf(name);
      return h('li', {},
        h('code', {}, name),
        readers.length
          ? h('span', { class: 'runtime-atlas__readers' }, ' read by ', readers.map((file, index) => [
            index ? ', ' : '',
            h('button', { type: 'button', class: 'runtime-atlas__link', 'data-runtime-atlas-reader': file, onclick: () => state.showReader(file) }, file.replace('public/css/', '')),
          ]))
          : h('span', { class: 'runtime-atlas__readers runtime-atlas__readers--none' }, ' read by no stylesheet'));
    }))));
  const needs = Object.entries(TIER_WORDS).filter(([tier]) => module.tiers.includes(tier) && tier !== 'host');
  return h('article', { class: 'runtime-atlas__card', 'aria-labelledby': `atlas-card-${module.id}` },
    h('h3', { id: `atlas-card-${module.id}` }, module.id),
    module.describes ? h('p', { class: 'runtime-atlas__describes' }, module.describes) : null,
    h('p', { class: 'runtime-atlas__where' },
      `${module.layer} · ${module.when} · `,
      module.file ? h('a', { href: `${REPO}${module.file}`, rel: 'noopener noreferrer', target: '_blank' }, module.file.replace('public/js/', '')) : 'no load path'),
    h('pre', { class: 'runtime-atlas__spw', 'aria-label': `${module.id} contract as Spw` }, h('code', {}, module.spw.join('\n'))),
    h('p', { class: 'runtime-atlas__host', 'data-runtime-atlas-portability': module.portability },
      h('strong', {}, module.portability), ' — ',
      needs.length ? `another page must provide ${needs.map(([, words]) => words).join('; ')}.` : 'its markup and stylesheet suffice on another page.'),
    writes.length ? writes : h('p', {}, 'Declares no writes.'),
    module.bus.emits.length || module.bus.hears.length
      ? h('p', { class: 'runtime-atlas__bus' },
        module.bus.emits.length ? ['emits ', h('code', {}, module.bus.emits.join(' '))] : null,
        module.bus.emits.length && module.bus.hears.length ? ' · ' : null,
        module.bus.hears.length ? ['hears ', h('code', {}, module.bus.hears.join(' '))] : null)
      : null,
    h('p', {},
      h('a', { href: `?spw-atlas=${module.id}#runtime-atlas` }, 'Link to this module'),
      ' · ',
      h('a', { href: parserHref(module.spw.join('\n'), `${module.id}.contract.spw`) }, 'Read this contract in the parser')));
}

function renderReader(atlas, file, state) {
  const feeders = modulesFeeding(atlas, file);
  return h('article', { class: 'runtime-atlas__card' },
    h('h3', {}, file.replace('public/css/', '')),
    h('p', {}, `${feeders.length} module${feeders.length === 1 ? '' : 's'} write names this stylesheet reads.`),
    h('ul', { class: 'runtime-atlas__chips' }, feeders.map((module) => h('li', {},
      h('button', { type: 'button', class: 'runtime-atlas__module', 'data-runtime-atlas-portability': module.portability, onclick: () => state.select(module.id) }, module.id)))),
    h('p', {}, h('a', { href: `${REPO}${file}`, rel: 'noopener noreferrer', target: '_blank' }, 'Read the stylesheet')));
}

function flip(stage, move, reduce) {
  const chips = [...stage.querySelectorAll('.runtime-atlas__file')];
  const first = new Map(chips.map((chip) => [chip, chip.getBoundingClientRect()]));
  for (const chip of chips) stage.querySelector(`[data-runtime-atlas-bin="${chip.dataset.runtimeAtlasTo}"] ul`)?.append(chip);
  stage.dataset.runtimeAtlasStage = 'after';
  if (reduce) return;
  chips.forEach((chip, index) => {
    const a = first.get(chip);
    const b = chip.getBoundingClientRect();
    chip.animate(
      [{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }],
      { duration: 520, delay: Math.min(index * 9, 700), easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' },
    );
  });
  void move;
}

function renderMoves(atlas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const commits = atlas.moves;
  const box = h('div', { class: 'runtime-atlas__moves' });
  const stage = h('div', { class: 'runtime-atlas__stage', 'aria-live': 'polite' });
  const play = (commit) => {
    const bins = [...new Set(commit.moves.map((move) => move.to.split('/').slice(0, -1).join('/')))].sort();
    const flat = h('ul', { class: 'runtime-atlas__flat', 'aria-label': 'Before' }, commit.moves.map((move) => h('li', {
      class: 'runtime-atlas__file',
      'data-runtime-atlas-to': move.to.split('/').slice(0, -1).join('/'),
      title: `${move.from} → ${move.to}`,
    }, move.from.split('/').pop())));
    stage.replaceChildren(
      h('p', { class: 'runtime-atlas__demo' }, `A replay from git's rename record: ${commit.date}, ${commit.moves.length} files. A demo of the move, not a timing claim.`),
      flat,
      h('div', { class: 'runtime-atlas__bins' }, bins.map((bin) => h('section', { 'data-runtime-atlas-bin': bin },
        h('h4', {}, bin.replace('public/js/', '')), h('ul', {})))),
    );
    stage.dataset.runtimeAtlasStage = 'before';
    requestAnimationFrame(() => requestAnimationFrame(() => flip(stage, commit, reduce)));
  };
  box.append(
    h('ol', { class: 'runtime-atlas__timeline' }, commits.map((commit) => h('li', {},
      h('button', { type: 'button', class: 'runtime-atlas__link', onclick: () => play(commit) }, `${commit.date} · ${commit.moves.length} moved`),
      ' ', h('span', {}, commit.subject)))),
    stage,
  );
  return box;
}

function renderHandles(atlas) {
  const pieces = new Map(atlas.folios.pieces.map((piece) => [piece.stem, piece]));
  const out = h('div', { class: 'runtime-atlas__handles-out', 'aria-live': 'polite' });
  const show = (entry) => out.replaceChildren(
    h('p', {}, h('code', {}, entry.handle), ` joins ${entry.pieces.length} piece${entry.pieces.length === 1 ? '' : 's'}:`),
    h('ul', {}, entry.pieces.map((stem) => {
      const piece = pieces.get(stem);
      const no = piece?.id?.match(/^folio-2026-(\d{2})-(\d{2})-(\d{2})$/);
      const href = no ? `/design/folios/#folio-${no[1] === '09' && no[2] === '26' ? '' : `${no[1]}${no[2]}-`}${no[3]}` : `/${piece?.dir || ''}/${stem}-hero.webp`;
      return h('li', {}, h('a', { href }, piece?.title || stem), piece?.opens ? h('span', { class: 'runtime-atlas__opens' }, ` ${piece.opens}`) : null);
    })));
  return h('div', { class: 'runtime-atlas__handles' },
    h('ul', { class: 'runtime-atlas__chips' }, atlas.folios.handles.filter((entry) => entry.pieces.length > 1).map((entry) => h('li', {},
      h('button', { type: 'button', class: 'runtime-atlas__handle', onclick: () => show(entry) }, `${entry.handle} ${entry.pieces.length}`)))),
    out);
}

function build(host, atlas) {
  const state = { family: '', portability: '', role: '', text: '', focus: readFocus() };
  const families = [...new Set(atlas.modules.map((module) => module.family || 'elsewhere'))].sort();
  const roles = [...new Set(atlas.modules.flatMap((module) => module.writes.map((write) => write.role)))].sort();
  const map = h('div', { class: 'runtime-atlas__map' });
  const detail = h('div', { class: 'runtime-atlas__detail', 'aria-live': 'polite' },
    h('p', {}, 'Choose a module to read its contract.'));
  const count = h('p', { class: 'runtime-atlas__count', 'aria-live': 'polite' });

  const matches = (module) => (!state.family || (module.family || 'elsewhere') === state.family)
    && (!state.portability || module.portability === state.portability)
    && (!state.role || module.writes.some((write) => write.role === state.role))
    && (!state.text || `${module.id} ${module.describes || ''} ${module.writes.flatMap((write) => write.names).join(' ')}`.toLowerCase().includes(state.text));

  const draw = () => {
    const shown = atlas.modules.filter(matches);
    count.textContent = `${shown.length} of ${atlas.modules.length} modules`;
    map.replaceChildren(...families.map((family) => {
      const members = shown.filter((module) => (module.family || 'elsewhere') === family);
      if (!members.length) return null;
      return h('section', { class: 'runtime-atlas__family' },
        h('h3', {}, family),
        h('ul', { class: 'runtime-atlas__chips' }, members.map((module) => h('li', {},
          h('button', {
            type: 'button',
            class: 'runtime-atlas__module',
            'data-runtime-atlas-portability': module.portability,
            'aria-pressed': String(state.focus === module.id),
            onclick: () => state.select(module.id),
          }, module.id)))));
    }).filter(Boolean));
  };

  state.select = (id) => {
    const module = atlas.modules.find((entry) => entry.id === id);
    if (!module) return;
    state.focus = id;
    writeFocus(id);
    host.dataset.runtimeAtlasFocus = id;
    detail.replaceChildren(renderCard(atlas, module, state));
    draw();
  };
  state.showReader = (file) => {
    detail.replaceChildren(renderReader(atlas, file, state));
  };

  const select = (label, key, values, words = (value) => value) => h('label', { class: 'runtime-atlas__control' }, label,
    h('select', { onchange: (event) => { state[key] = event.target.value; draw(); } },
      option('', 'all', state[key]), values.map((value) => option(value, words(value), state[key]))));

  const controls = h('div', { class: 'runtime-atlas__controls' },
    h('label', { class: 'runtime-atlas__control' }, 'Find',
      h('input', { type: 'search', placeholder: 'id, describes, or a written name', oninput: (event) => { state.text = event.target.value.trim().toLowerCase(); draw(); } })),
    select('Family', 'family', families),
    select('Host', 'portability', ['portable', 'host-policy', 'site-only']),
    select('Writes', 'role', roles, (role) => `![${role}]`),
    count);

  const ui = h('div', { class: 'runtime-atlas__ui' },
    controls,
    h('div', { class: 'runtime-atlas__split' }, map, detail),
    h('details', { class: 'runtime-atlas__section' }, h('summary', {}, 'Moves: the tree changing'), renderMoves(atlas)),
    h('details', { class: 'runtime-atlas__section' }, h('summary', {}, 'Folio handles: the content the sidecars index'), renderHandles(atlas)));

  host.append(ui);
  host.dataset.runtimeAtlasState = 'ready';
  draw();
  if (state.focus) state.select(state.focus);
  return ui;
}

export async function initRuntimeAtlas() {
  const host = document.querySelector(HOST_SELECTOR);
  if (!host || mounted) return () => {};
  mounted = { host, ui: null };
  host.dataset.runtimeAtlasState = 'loading';
  try {
    const response = await fetch(host.dataset.runtimeAtlasSrc || SOURCE);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const atlas = await response.json();
    if (mounted) mounted.ui = build(host, atlas);
  } catch (error) {
    host.dataset.runtimeAtlasState = 'failed';
    host.append(h('p', { class: 'runtime-atlas__failed', role: 'status' }, `The atlas data did not load (${error.message}); the table above still reads.`));
  }
  return () => {
    mounted?.ui?.remove();
    delete host.dataset.runtimeAtlasState;
    delete host.dataset.runtimeAtlasFocus;
    mounted = null;
  };
}

export const SPW_MODULE_EXPORT = Object.freeze({
  id: 'runtime-atlas',
  mount: () => initRuntimeAtlas(),
  describes: 'atlas[families|contracts|edges|moves|handles]{relate.replay}<runtime> read the site\'s structures and how they changed',
});
