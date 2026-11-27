#!/usr/bin/env node
/**
 * compile-spw-cms.mjs
 *
 * Build-time Spw CMS compiler: parses .spw/cms/*.spw with the canonical
 * workbench reader (public/js/semantic/spw-workbench-reader.js) and emits
 * static-first, scripts-off-complete HTML partials into _partials/cms/*.html.
 *
 * Usage:
 *   node scripts/compile-spw-cms.mjs          # compile all seeds
 *   node scripts/compile-spw-cms.mjs --check  # verify _partials/cms/*.html are fresh
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { parse } from '../public/js/semantic/spw-workbench-reader.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CMS_SRC_DIR = path.join(ROOT_DIR, '.spw/cms');
const CMS_OUT_DIR = path.join(ROOT_DIR, '_partials/cms');

const SEEDS = Object.freeze([
  { input: 'home-issue.spw', output: 'home-issue.html' },
  { input: 'recipes-ledger.spw', output: 'recipes-ledger.html' },
  { input: 'spw-experiments.spw', output: 'spw-experiments.html' },
]);

function unwrapLiteral(raw = '') {
  const str = String(raw ?? '');
  if (
    (str.startsWith('`') && str.endsWith('`'))
    || (str.startsWith('"') && str.endsWith('"'))
    || (str.startsWith("'") && str.endsWith("'"))
  ) {
    return str.slice(1, -1);
  }
  return str;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function identOf(node) {
  const term = node?.type === 'Expression' && node.terms?.length === 1 ? node.terms[0] : node;
  return term?.type === 'Identifier' ? term.token?.value || '' : '';
}

function isEquals(node) {
  const term = node?.type === 'Expression' && node.terms?.length === 1 ? node.terms[0] : node;
  return term?.type === 'Operation' && term.operator?.value === '=';
}

function valueOfNode(node) {
  if (!node || typeof node !== 'object') return '';
  if (node.type === 'Literal') return unwrapLiteral(node.token?.value || '');
  if (node.type === 'Identifier') return node.token?.value || '';
  if (node.type === 'PathRef') return unwrapLiteral(node.path?.token?.value || node.raw || '');
  if (node.type === 'Expression' && node.terms?.length === 1) return valueOfNode(node.terms[0]);
  return '';
}

function parseBindingsFromSequence(sequence) {
  const expressions = sequence?.expressions || [];
  const fields = {};
  for (let i = 0; i < expressions.length; i += 1) {
    const key = identOf(expressions[i]);
    if (key && isEquals(expressions[i + 1])) {
      fields[key] = valueOfNode(expressions[i + 2]);
      i += 2;
    }
  }
  return fields;
}

function sliceNodeSource(source, node) {
  const startOffset = node?.span?.start?.offset;
  const endOffset = node?.span?.end?.offset;
  if (typeof startOffset === 'number' && typeof endOffset === 'number' && endOffset > startOffset) {
    return source.slice(startOffset, endOffset).trim();
  }
  return '';
}

export function extractCmsFrames(source, fileLabel = '') {
  const parsed = parse(source);
  if (!parsed?.success || parsed.errors?.length || parsed.warnings?.length) {
    const detail = [...(parsed?.errors || []), ...(parsed?.warnings || [])]
      .map((item) => item?.message || JSON.stringify(item))
      .join('; ');
    throw new Error(`[compile-spw-cms] Parse failed in ${fileLabel}: ${detail || 'unknown error'}`);
  }

  const frames = [];
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Operation' && node.operator?.value === '^') {
      const name = unwrapLiteral(node.subject?.token?.value || '');
      if (name) {
        frames.push({
          name,
          fields: parseBindingsFromSequence(node.body?.sequence),
          rawSpw: sliceNodeSource(source, node),
        });
      }
      return;
    }
    for (const val of Object.values(node)) {
      if (Array.isArray(val)) val.forEach(walk);
      else walk(val);
    }
  }

  walk(parsed.ast);
  return frames;
}

function buildCarryUrls(spwText = '') {
  const singleLine = String(spwText)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(' ');
  const encoded = encodeURIComponent(singleLine);
  return {
    parser: '/tools/spw-parser/',
    quest: `https://spw.quest/pivot?line=${encoded}`,
    canvas: `https://factshift.center/?spw=${encoded}`,
  };
}

function renderLensGroup(fields, lensDefs) {
  const blocks = lensDefs
    .filter(({ key }) => fields[key])
    .map(({ key, lensAttr, label }) => (
      `            <p class="spw-cms-lens-copy" data-spw-copy-lens="${escapeHtml(lensAttr)}" data-spw-copy-label="${escapeHtml(label)}">${escapeHtml(fields[key])}</p>`
    ));
  return blocks.join('\n');
}

function renderTriptychCard(frame, index, lensDefs, isRotatorItem = false) {
  const { fields, rawSpw, name } = frame;
  const carry = buildCarryUrls(fields.expression || rawSpw);
  const badge = fields.badge || fields.card_no || `0${index + 1}`;
  const ratioLine = fields.ratio
    ? `\n          <p class="spw-cms-card__ratio"><code>${escapeHtml(fields.ratio)}</code></p>`
    : '';
  const routeAction = fields.route
    ? `<a class="spw-chip" href="${escapeHtml(fields.route)}" data-spw-operator="${escapeHtml(fields.route_op || 'frame')}">${escapeHtml(fields.route_label || '#>open')}</a>`
    : '';
  const hingeAside = fields.hinge_href && fields.hinge_note
    ? `
          <aside class="spw-curiosity-hinge" aria-label="Sideways connection">
            <a class="spw-chip" href="${escapeHtml(fields.hinge_href)}" data-spw-operator="potential">${escapeHtml(fields.hinge_label || '~>neighbor')}</a>
            <span>${escapeHtml(fields.hinge_note)}</span>
          </aside>`
    : '';

  const rotatorAttrs = isRotatorItem
    ? ` data-cms-rotator-item="${index}" data-cms-slug="${escapeHtml(fields.slug || name)}"`
    : '';
  const cardId = fields.id ? ` id="${escapeHtml(fields.id)}"` : '';

  return `      <article class="frame-card spw-cms-card"${cardId}${rotatorAttrs} data-cms-triptych data-cms-active-face="prose" data-spw-semantic-expression="${escapeHtml(fields.expression || 'cms[reading]{card}<spw>')}">
        <div class="spw-cms-card__head">
          <span class="spw-cms-card__badge">${escapeHtml(badge)}</span>
          <div class="spw-triptych__tabs" role="group" aria-label="Material projection" hidden>
            <button type="button" class="spw-triptych__tab" data-cms-face-btn="prose" aria-pressed="true">.prose</button>
            <button type="button" class="spw-triptych__tab" data-cms-face-btn="scan" aria-pressed="false">*scan</button>
            <button type="button" class="spw-triptych__tab" data-cms-face-btn="spw" aria-pressed="false">#&gt;spw</button>
          </div>
        </div>
        <h3>${escapeHtml(fields.title || name)}</h3>${ratioLine}
        <div class="spw-triptych__face" data-cms-face="prose">
          <div class="spw-cms-lens-stack">
${renderLensGroup(fields, lensDefs)}
          </div>${hingeAside}
        </div>
        <details class="spw-triptych__fold" data-cms-face="scan">
          <summary class="spw-triptych__summary">*scan · Studio folio</summary>
          <figure class="spw-triptych__figure">
            <img src="${escapeHtml(fields.scan_src || '')}" alt="${escapeHtml(fields.scan_alt || '')}" width="400" height="320" loading="lazy" decoding="async">
            <figcaption>${escapeHtml(fields.scan_caption || '')}</figcaption>
          </figure>
        </details>
        <details class="spw-triptych__fold" data-cms-face="spw">
          <summary class="spw-triptych__summary">#&gt;spw · Compiled seed</summary>
          <div class="spw-triptych__code">
            <pre><code class="language-spw">${escapeHtml(rawSpw)}</code></pre>
            <div class="spw-cms-card__carry">
              <a class="spw-chip" href="${escapeHtml(carry.parser)}" data-spw-operator="action">!parse[local]</a>
              <a class="spw-chip" href="${escapeHtml(carry.quest)}" target="_blank" rel="noopener" data-spw-operator="wonder">?pivot[quest]</a>
              <a class="spw-chip" href="${escapeHtml(carry.canvas)}" target="_blank" rel="noopener" data-spw-operator="perspective">@stage[canvas]</a>
            </div>
          </div>
        </details>${routeAction ? `\n        <div class="spw-cms-card__foot">${routeAction}</div>` : ''}
      </article>`;
}

function renderCuriosityGap(frame) {
  const { fields } = frame;
  return `    <article class="spw-expect-card" id="${escapeHtml(fields.id || frame.name)}" data-cms-expect data-cms-correct="${escapeHtml(fields.correct || 'b')}" data-spw-semantic-expression="${escapeHtml(fields.expression || 'probe[reading]{expect.reveal}<spw>')}">
      <div class="spw-expect-card__head">
        <span class="spw-cms-card__badge">${escapeHtml(fields.badge || '?curiosity_probe')}</span>
        <span class="spw-expect-card__status" data-cms-expect-status aria-live="polite">Commit a guess (~#expect) before opening the receipt</span>
      </div>
      <h3 class="spw-expect-card__question">${escapeHtml(fields.question || '')}</h3>
      <div class="spw-expect-card__choices" role="group" aria-label="Prediction choices">
        <button type="button" class="spw-expect-card__choice" data-cms-guess="a" aria-pressed="false">~[a] ${escapeHtml(fields.guess_a || '')}</button>
        <button type="button" class="spw-expect-card__choice" data-cms-guess="b" aria-pressed="false">~[b] ${escapeHtml(fields.guess_b || '')}</button>
        <button type="button" class="spw-expect-card__choice" data-cms-guess="c" aria-pressed="false">~[c] ${escapeHtml(fields.guess_c || '')}</button>
      </div>
      <details class="spw-expect-card__reveal" data-cms-expect-details>
        <summary>*precipitate · Reveal the invariant</summary>
        <div class="spw-expect-card__answer">
          <p><strong>${escapeHtml(fields.reveal_title || '')}</strong></p>
          <p>${escapeHtml(fields.reveal_body || '')}</p>
          <p class="spw-expect-card__wonder">${escapeHtml(fields.wonder_tail || '')}</p>
        </div>
      </details>
    </article>`;
}

function renderTheaterEndpoint(frame) {
  const { fields } = frame;
  const shots = [1, 2, 3]
    .map((n) => ({
      index: n - 1,
      slug: fields[`shot_${n}_slug`],
      spw: fields[`shot_${n}_spw`],
      url: fields[`shot_${n}_url`],
      caption: fields[`shot_${n}_caption`],
    }))
    .filter((shot) => shot.spw && shot.url);

  const first = shots[0] || { slug: 'stage', spw: '', url: 'https://attention.productions/', caption: '' };
  const presetButtons = shots
    .map((shot, idx) => (
      `          <button type="button" class="spw-theater-endpoint__preset" data-cms-shot-index="${idx}" data-cms-shot-url="${escapeHtml(shot.url)}" data-cms-shot-caption="${escapeHtml(shot.caption || '')}" data-cms-shot-spw="${escapeHtml(shot.spw)}" aria-pressed="${idx === 0 ? 'true' : 'false'}">0${idx + 1} · ${escapeHtml(shot.slug || `shot-${idx + 1}`)}</button>`
    ))
    .join('\n');

  return `    <aside class="spw-theater-endpoint" id="${escapeHtml(fields.id || frame.name)}" data-cms-theater data-cms-active-url="${escapeHtml(first.url)}" data-spw-semantic-expression="${escapeHtml(fields.expression || 'theater[shot]{viewfinder}<attention>')}">
      <div class="spw-theater-endpoint__chrome">
        <div class="spw-theater-endpoint__topline">
          <span class="spw-theater-endpoint__rec" aria-hidden="true">● REC · VIEWFINDER</span>
          <a class="spw-theater-endpoint__host" href="${escapeHtml(first.url)}" data-cms-theater-link target="_blank" rel="noopener">@attention.productions ↗</a>
        </div>
        <h3 class="spw-theater-endpoint__title">${escapeHtml(fields.title || 'attention.productions')}</h3>
        <p class="spw-theater-endpoint__lede">${escapeHtml(fields.lede || '')}</p>
        <div class="spw-theater-endpoint__presets" role="group" aria-label="Camera setups">
${presetButtons}
        </div>
        <div class="spw-theater-endpoint__stage" data-cms-theater-stage>
          <div class="spw-theater-endpoint__marks" aria-hidden="true">
            <span>┌</span><span>┐</span><span>└</span><span>┘</span>
          </div>
          <pre class="spw-theater-endpoint__notation"><code data-cms-theater-code>${escapeHtml(first.spw)}</code></pre>
          <p class="spw-theater-endpoint__caption" data-cms-theater-caption>${escapeHtml(first.caption || '')}</p>
          <div class="spw-theater-endpoint__mount-slot" data-cms-theater-slot hidden></div>
        </div>
        <div class="spw-theater-endpoint__actions">
          <button type="button" class="spw-theater-endpoint__mount-btn" data-cms-theater-mount aria-expanded="false">!mount[theater] · Roll live attention.productions stage</button>
          <span class="spw-theater-endpoint__privacy">Zero cross-origin requests until clicked · sandboxed preview</span>
        </div>
      </div>
    </aside>`;
}

export function renderSeedHtml(frames, sourceRelPath) {
  const metaFrame = frames.find((frame) => frame.name === 'meta') || { fields: {} };
  const meta = metaFrame.fields;
  const kind = meta.kind || 'cms_section';

  const homeLensDefs = [
    { key: 'lens_reading', lensAttr: 'default reading surface read', label: '.reading' },
    { key: 'lens_systems', lensAttr: 'systems syntax inspect workbench', label: '^systems' },
    { key: 'lens_play', lensAttr: 'play table ritual', label: '~play' },
    { key: 'lens_studio', lensAttr: 'studio artifacts making craft', label: '*studio' },
  ];

  const recipeLensDefs = [
    { key: 'lens_cook', lensAttr: 'default cook reading surface', label: '[cook]' },
    { key: 'lens_theory', lensAttr: 'theory systems syntax', label: '^theory' },
    { key: 'lens_garden', lensAttr: 'garden field memory', label: '~garden' },
    { key: 'lens_hospitality', lensAttr: 'hospitality play table', label: '@hospitality' },
  ];

  const lensDefs = kind === 'recipes_ledger' ? recipeLensDefs : homeLensDefs;
  const dispatches = frames.filter((frame) => frame.fields.kind === 'dispatch' || frame.fields.kind === 'ledger_card');
  const curiosityGaps = frames.filter((frame) => frame.fields.kind === 'curiosity_gap');
  const theaters = frames.filter((frame) => frame.fields.kind === 'theater');

  const isRotator = kind === 'home_issue' && dispatches.length > 1;
  const rotatorBar = isRotator
    ? `
    <div class="spw-cms-rotator-bar" data-cms-rotator-controls>
      <span class="spw-cms-rotator-bar__stamp" data-cms-close-readout>${escapeHtml(meta.close_stamp || '13-day close')}</span>
      <button type="button" class="spw-chip" data-cms-rotate-next data-spw-operator="potential">~next[dispatch]</button>
    </div>`
    : `
    <p class="spw-cms-stamp">${escapeHtml(meta.close_stamp || '')}</p>`;

  const cardsHtml = dispatches.length
    ? `
    <div class="frame-grid frame-grid--${dispatches.length >= 3 ? '3up' : '2up'} spw-cms-grid"${isRotator ? ' data-cms-rotator' : ''}>
${dispatches.map((frame, index) => renderTriptychCard(frame, index, lensDefs, isRotator)).join('\n')}
    </div>`
    : '';

  const gapsHtml = curiosityGaps.map(renderCuriosityGap).join('\n');
  const theatersHtml = theaters.map(renderTheaterEndpoint).join('\n');

  return `<!-- Generated from ${escapeHtml(sourceRelPath)} by scripts/compile-spw-cms.mjs — do not hand-edit -->
<section class="spw-frame spw-cms-band" id="${escapeHtml(meta.section_id || 'spw-cms-band')}" data-spw-kind="frame" data-cms-surface="${escapeHtml(kind)}" data-spw-semantic-expression="${escapeHtml(meta.expression || 'cms[reading]{seed}<spw>')}">
  <div class="frame-topline">
    <a class="frame-sigil" href="#${escapeHtml(meta.section_id || 'spw-cms-band')}" data-spw-operator="${escapeHtml(meta.operator || 'potential')}">${escapeHtml(meta.sigil || '~[cms]')}</a>${rotatorBar}
  </div>
  <h2>${escapeHtml(meta.title || 'Spw CMS')}</h2>
  <p class="frame-note">${escapeHtml(meta.lede || '')}</p>${gapsHtml ? `\n${gapsHtml}` : ''}${cardsHtml}${theatersHtml ? `\n${theatersHtml}` : ''}
</section>
`;
}

export async function compileAllSeeds({ check = false } = {}) {
  await fs.mkdir(CMS_OUT_DIR, { recursive: true });
  const results = [];

  for (const seed of SEEDS) {
    const srcPath = path.join(CMS_SRC_DIR, seed.input);
    const outPath = path.join(CMS_OUT_DIR, seed.output);
    const relSrc = `.spw/cms/${seed.input}`;
    const source = await fs.readFile(srcPath, 'utf8');
    const frames = extractCmsFrames(source, relSrc);
    const html = renderSeedHtml(frames, relSrc);

    if (check) {
      let existing = '';
      try {
        existing = await fs.readFile(outPath, 'utf8');
      } catch {
        throw new Error(`[compile-spw-cms] Missing generated partial: _partials/cms/${seed.output}`);
      }
      if (existing !== html) {
        throw new Error(`[compile-spw-cms] Outdated partial: _partials/cms/${seed.output} (run npm run cms:build)`);
      }
    } else {
      await fs.writeFile(outPath, html, 'utf8');
    }

    results.push({ seed: seed.input, output: `_partials/cms/${seed.output}`, frameCount: frames.length });
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const results = await compileAllSeeds({ check });
  for (const row of results) {
    console.log(`[cms:${check ? 'check' : 'build'}] ${row.seed} -> ${row.output} (${row.frameCount} frames)`);
  }
}
