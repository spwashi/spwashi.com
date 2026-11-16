// attention.productions as files: a shot composer whose address is the shot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CSP, MATERIALS_MODULE, carried } from '../carry.mjs';
import { DEFAULT_SUBJECT, LADDERS, MATERIAL_OFFER, PHRASES, RATIOS, SHAPES } from '../src/vocabulary.js';
import { MATERIALS } from '../src/materials.js';
import { FIRST_SHOT, addressOf, dayShot, geometryOf, nearestFocus, promptOf, readShot, slug, spwOf } from '../src/compose.js';
import { MATERIALS as TEXTURE_MATERIALS } from '../../texture-website/src/vocabulary.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import { parse as parsePinned } from '../../spw-quest/assets/parser/2026.10.13/reader.min.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const assets = path.join(root, 'assets');
const DAY = '2026-11-16';

test('the unit is files only, and every unknown path falls back to the page', () => {
  const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.main, undefined);
  assert.equal(config.assets.not_found_handling, 'single-page-application');
});

test('each carried file is what carry.mjs writes, and the composer the page imports is the one tested here', async () => {
  for (const [file, body] of await carried()) assert.equal(readFileSync(path.join(assets, file), 'utf8'), body, `assets/${file}: run node workers/attention-productions/carry.mjs`);
  assert.equal(readFileSync(path.join(root, 'src/materials.js'), 'utf8'), MATERIALS_MODULE);
  assert.deepEqual(MATERIALS.map((m) => m.slug), TEXTURE_MATERIALS.map((m) => m.slug), 'the materials are texture.website\'s');
  // The paths the host answered under site-hub-next are files here, so none falls back to the page.
  for (const file of ['favicon.svg', 'robots.txt', 'ecosystem.json', 'registry.json']) assert.ok((await carried()).some(([name]) => name === file), file);
});

test('every word has its phrase and its shape, ratios are whole numbers, and the offered surfaces are texture.website\'s', () => {
  for (const [key, words] of Object.entries(LADDERS)) {
    for (const word of words) assert.ok(word in PHRASES[key], `${key} ${word}`);
    assert.equal(new Set(words.map(slug)).size, words.length, `${key}: words read apart in the address`);
  }
  for (const key of ['shot', 'lens', 'light', 'focus']) for (const word of LADDERS[key]) assert.ok(SHAPES[key][word], `${key} ${word} is drawn`);
  for (const word of LADDERS.ratio) assert.match(RATIOS[word].ar, /^\d+:\d+$/, `${word}: --ar takes whole numbers`);
  for (const s of MATERIAL_OFFER) assert.ok(MATERIALS.some((m) => m.slug === s), s);
});

test('an address reads as a shot and writes back as the same address', () => {
  const shot = readShot('/a-projector-beam', '?shot=wide&lens=anamorphic&light=sodium-night&move=dolly-in&ratio=scope&focus=right-third&material=rain-on-glass', DAY);
  assert.equal(shot.subject, 'a projector beam');
  assert.deepEqual([shot.shot, shot.lens, shot.light, shot.move, shot.ratio, shot.focus, shot.material.slug, shot.named], ['wide', 'anamorphic', 'sodium night', 'dolly-in', 'scope', 'right third', 'rain-on-glass', true]);
  const again = readShot(...addressOf(shot).split('?').map((part, i) => (i ? `?${part}` : part)), DAY);
  assert.deepEqual({ ...again, day: '' }, { ...shot, day: '' });
  // What the address leaves out, the date picks, and a date can be fixed.
  const day = readShot('/', '', DAY);
  assert.equal(day.subject, DEFAULT_SUBJECT);
  assert.equal(day.named, false);
  for (const key of Object.keys(LADDERS)) assert.equal(day[key], dayShot(DAY)[key]);
  assert.deepEqual(readShot('/', '?day=2026-12-25', DAY).day, '2026-12-25');
  const season = new Set(Array.from({ length: 30 }, (_, i) => JSON.stringify(dayShot(`2026-12-${String(i + 1).padStart(2, '0')}`))));
  assert.ok(season.size > 25, `each day has its own shot (${season.size} of 30)`);
});

test('a hostile path is words, an unknown word is the day\'s, and an unlisted material carries no --sref', () => {
  const hostile = readShot(`/${encodeURIComponent('<script>alert(1)</script>')}`, '?shot=<b>&material=../../etc', DAY);
  assert.equal(hostile.subject, 'script alert 1 script');
  assert.equal(hostile.shot, dayShot(DAY).shot);
  assert.equal(hostile.material, null);
  assert.doesNotMatch(promptOf(hostile).midjourney, /--sref|</);
  assert.equal(readShot('/%E0%A4%A', '', DAY).subject, DEFAULT_SUBJECT, 'a malformed escape is no subject');
  assert.ok(readShot(`/${'a'.repeat(200)}`, '', DAY).subject.length <= 80);
});

test('the prompt is film language with Midjourney\'s parameters, and the plain prompt has none', () => {
  const shot = readShot('/a-laminated-folio', '?shot=close-up&lens=85mm&light=lamplight&move=still&ratio=scope&focus=left-third&material=vellum', DAY);
  const { midjourney, plain } = promptOf(shot);
  assert.equal(plain, 'close-up shot of a laminated folio, subject on the left third, 85mm lens, shallow depth of field, warm practical lamplight, vellum surfaces, cinematic film still');
  assert.equal(midjourney, `${plain} --ar 239:100 --sref https://texture.website/vellum.png --sw 250 --no text, letters, logo, watermark`);
  assert.doesNotMatch(plain, /--/);
});

test('every word of every ladder writes Spw lines that read whole on both readers, with no // in them', () => {
  const read = (line) => [parse(line, { eventPolicy: 'none' }), parsePinned(line)];
  for (const [key, words] of Object.entries(LADDERS)) {
    for (const word of words) {
      const lines = spwOf({ ...FIRST_SHOT, [key]: word, material: MATERIALS.find((m) => m.slug === 'terrazzo') });
      assert.doesNotMatch(lines, /\/\//, 'a // would open a comment');
      for (const result of read(lines)) {
        assert.ok(result.success && !result.completeness?.proseFallback && result.errors.length === 0, `${key} ${word}: ${lines}`);
      }
    }
  }
});

test('the viewfinder\'s geometry keeps the frame in the canvas, the focus on its third, and blur in four levels', () => {
  for (const ratio of LADDERS.ratio) {
    const g = geometryOf({ ...FIRST_SHOT, ratio });
    assert.ok(g.frame.x >= 0 && g.frame.y >= 0 && g.frame.x + g.frame.w <= 1200.1 && g.frame.y + g.frame.h <= 800.1, ratio);
    assert.ok(Math.abs(g.frame.w / g.frame.h - RATIOS[ratio].w / RATIOS[ratio].h) < 0.01, `${ratio} keeps its shape`);
  }
  const g = geometryOf({ ...FIRST_SHOT, lens: 'macro' });
  assert.equal(nearestFocus(g, g.focus.x, g.focus.y), FIRST_SHOT.focus);
  for (const s of g.sheets) assert.ok([0, 1, 2, 3].includes(s.blur));
  assert.equal(g.sheets[2].blur, 0, 'the subject is sharp');
});

test('the page reads with scripts off: the first prompt is written, and nothing inline needs a looser policy', () => {
  const page = readFileSync(path.join(assets, 'index.html'), 'utf8');
  assert.ok(page.includes(promptOf(FIRST_SHOT).midjourney.replace(/&/g, '&amp;')), 'the first prompt is in the page');
  // The page is about the pictures and the shot, not about who makes them (the creator, 2026-11-16).
  assert.doesNotMatch(page, /Spwashi|spwashi\.com|\bI'm\b|\bI\b/, 'no first person and no owner on the page');
  assert.ok(page.includes('<iframe src="https://mutex.buzz/now/"'), 'the frame from mutex.buzz stays');
  for (const href of ['https://autonomous.feedback/attention.productions', 'https://texture.website/', 'https://factshift.center/']) assert.ok(page.includes(`href="${href}"`), href);
  assert.doesNotMatch(page, /\sstyle=|<style|<script>|\son[a-z]+=/i, 'no inline style, script or handler');
  assert.doesNotMatch(CSP, /unsafe-inline/);
  assert.match(CSP, /img-src 'self' https:\/\/texture\.website/);
  assert.match(CSP, /frame-src https:\/\/mutex\.buzz/);
  const words = [...page.matchAll(/<a href="([^"]+)" data-word=/g)].map((m) => m[1]);
  assert.equal(words.length, Object.values(LADDERS).flat().length + 1 + MATERIAL_OFFER.length, 'each word is a link to its address');
});
