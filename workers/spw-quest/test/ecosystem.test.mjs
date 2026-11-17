/**
 * Cross-ecosystem interoperability and marketing-value tests for spw.quest samples.
 *
 * Exercises what a creator, engineer, or model actually pastes or elaborates
 * across the connected surfaces:
 *   - spw.quest starters, examples, build scripts, physics lines, and /llms.txt answers
 *   - spwashi.com public specimens, service/offer routes, and parser reconstruction
 *   - factshift.center canvas addresses (?spw= lines and #spw64= scripts)
 *   - texture.website material .spw sheets
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import worker from '../src/index.js';
import { ANSWER_EXAMPLES, cardReading } from '../src/answer.js';
import { ADDRESS_INDEX } from '../src/addresses.js';
import { BUILD_KINDS } from '../src/build.js';
import { EXAMPLES, exampleById } from '../src/examples.js';
import { readFile } from '../src/file-reader.js';
import { PHYSICS_LINES } from '../src/physics.js';
import { SPECIMENS } from '../src/specimens.js';
import { STARTERS } from '../src/starters.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';
import {
  canvasHref,
  questBuildHref,
  questPivotHref,
} from '../../../public/js/kernel/ecosystem-links.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const TEXTURE_DIR = path.join(ROOT, 'workers/texture-website/assets');

const get = (reqPath, headers = {}) => worker.fetch(new Request(`https://spw.quest${reqPath}`, { headers }), {});
const text = async (reqPath, headers = {}) => (await get(reqPath, headers)).text();
const quietParse = (src) => parse(src, { eventPolicy: 'none' });
const decodeSpw64 = (href) => {
  const hash = new URL(href).hash.replace(/^#spw64=/, '');
  return Buffer.from(hash, 'base64url').toString('utf8');
};

test('every spw.quest starter elaborates on /pivot and /physics, opens its example, and bridges to spwashi.com and factshift.center', async () => {
  for (const starter of STARTERS) {
    const parsed = quietParse(starter.line);
    assert.equal(parsed.success, true, `${starter.id} parses`);
    assert.deepEqual(parsed.errors, [], `${starter.id} has 0 parse errors`);

    const pivotHtml = await text(`/pivot?line=${encodeURIComponent(starter.line)}`);
    assert.match(pivotHtml, /id="turn-mode"/, `${starter.id} generates mode turns on /pivot`);
    assert.match(pivotHtml, /id="turn-body"/, `${starter.id} generates body-join turns on /pivot`);
    assert.match(pivotHtml, /id="turn-projection"/, `${starter.id} generates projection turns on /pivot`);

    const physicsHtml = await text(`/physics?line=${encodeURIComponent(starter.line)}`);
    assert.match(physicsHtml, /id="stage"/, `${starter.id} renders physics floor`);

    const canvas = canvasHref(starter.line);
    assert.equal(new URL(canvas).searchParams.get('spw'), starter.line, `${starter.id} fits factshift ?spw=`);

    const build = questBuildHref(starter.line, { name: starter.id });
    assert.equal(new URL(build).searchParams.get('script'), `#>${starter.id}\n${starter.line}`);

    const pivot = questPivotHref(starter.line);
    assert.equal(new URL(pivot).searchParams.get('line'), starter.line);

    const examplePage = await text(`/?example=${encodeURIComponent(starter.open)}`);
    assert.match(examplePage, new RegExp(`>${exampleById(starter.open).file.replace('.', '\\.')}<`), `${starter.id} opens ${starter.open}`);
  }
});

test('flagship spwashi.com offer, creator, art, and software words surface real site pages through spw.quest /card and /card.txt', async () => {
  const marketingTerms = [
    ['offer<card>', '/services/creator/'],
    ['services<card>', '/services/'],
    ['creator<card>', '/services/creator/'],
    ['art<card>', '/design/folios/'],
    ['design<card>', '/design/'],
    ['software<card>', '/topics/software/'],
    ['story<card>', '/'],
  ];

  for (const [line, expectedRoutePrefix] of marketingTerms) {
    const reading = cardReading(line);
    assert.ok(reading.kin.length > 0, `${line} finds kin specimens on spwashi.com`);
    assert.ok(reading.pages.some((url) => url.startsWith(`https://spwashi.com${expectedRoutePrefix}`)), `${line} links back to ${expectedRoutePrefix}`);

    const cardTxt = await text(`/card.txt?line=${encodeURIComponent(line)}`);
    assert.match(cardTxt, /Lines spwashi\.com holds for this word:/);
    assert.ok(cardTxt.includes(`https://spwashi.com${expectedRoutePrefix}`), `${line} card.txt cites ${expectedRoutePrefix}`);

    const cardHtml = await text(`/card?line=${encodeURIComponent(line)}`);
    assert.ok(cardHtml.includes(`https://spwashi.com${expectedRoutePrefix}`), `${line} /card HTML links ${expectedRoutePrefix}`);
    assert.ok(cardHtml.includes('https://factshift.center/?spw='), `${line} /card bridges to canvas`);
    assert.ok(cardHtml.includes('https://spwashi.com/tools/spw-parser/?spw_source='), `${line} /card bridges back to literal parser`);
  }
});

test('every specimen exported from flagship spwashi.com creator/services/about/art routes parses cleanly and pivots on spw.quest', async () => {
  const flagship = SPECIMENS.filter(
    (s) => !s.reading.file && ['/', '/services/', '/services/creator/', '/about/', '/art/'].includes(s.route),
  );
  assert.ok(flagship.length >= 20, `expected >=20 flagship expressions, got ${flagship.length}`);

  for (const specimen of flagship.slice(0, 24)) {
    const parsed = quietParse(specimen.line);
    assert.equal(parsed.success, true, `${specimen.route}: ${specimen.line}`);
    assert.deepEqual(parsed.errors, [], `${specimen.route}: ${specimen.line}`);
    assert.ok(canvasHref(specimen.line), `${specimen.id} builds a canvas link`);
    assert.ok(questBuildHref(specimen.line, { name: specimen.id }), `${specimen.id} builds a /build link`);
  }

  // Spot-check pivot & physics on flagship single-subject expressions.
  const pivots = flagship.filter((s) => !s.reading.slots?.join).slice(0, 6);
  for (const specimen of pivots) {
    const pv = await text(`/pivot?s=${encodeURIComponent(specimen.id)}`);
    assert.match(pv, /id="turn-/, `${specimen.id} opens on /pivot`);
    assert.ok(pv.includes(`spwashi.com${specimen.route}`), `${specimen.id} credits its spwashi.com origin`);
  }
});

test('every spw.quest example file, build kind, physics floor line, and answer specimen carries cleanly to factshift.center and /build', () => {
  for (const example of EXAMPLES) {
    const parsed = quietParse(example.script);
    assert.deepEqual(parsed.errors, [], `example ${example.id} has 0 parse errors`);
    const fileReading = readFile(example.script);
    assert.equal(fileReading.ok, true, `file-reader accepts ${example.id}`);
    const canvas = canvasHref(example.script, { name: example.id });
    assert.ok(canvas.includes('#spw64='), `${example.id} encodes as #spw64=`);
    assert.ok(decodeSpw64(canvas).includes(example.script.split('\n')[0]), `${example.id} #spw64= round-trips`);
    assert.ok(questBuildHref(example.script, { name: example.id }), `${example.id} builds a /build link`);
  }

  for (const kind of BUILD_KINDS) {
    assert.deepEqual(quietParse(kind.script).errors, [], `BUILD_KINDS.${kind.kind} parses cleanly`);
    assert.equal(readFile(kind.script).ok, true, `file-reader accepts BUILD_KINDS.${kind.kind}`);
    const canvas = canvasHref(kind.script, { name: kind.kind });
    assert.ok(decodeSpw64(canvas).includes(kind.script), `${kind.kind} #spw64= preserves full script`);
  }

  for (const entry of PHYSICS_LINES) {
    assert.deepEqual(quietParse(entry.line).errors, [], `PHYSICS_LINES: ${entry.line}`);
    assert.ok(canvasHref(entry.line), `canvasHref works on ${entry.line}`);
  }

  for (const [name, src] of Object.entries(ANSWER_EXAMPLES)) {
    assert.deepEqual(quietParse(src).errors, [], `ANSWER_EXAMPLES.${name}`);
    assert.equal(readFile(src).ok, true, `file-reader accepts ANSWER_EXAMPLES.${name}`);
    const canvas = canvasHref(src, { name });
    assert.ok(canvas, `ANSWER_EXAMPLES.${name} carries to canvas`);
  }

  assert.match(ADDRESS_INDEX, /\^seed\[Session\]/);
  assert.match(ADDRESS_INDEX, /\^seed\["porch notes"\]/);
});

test('every texture.website material .spw sheet parses, exhibits particle aims, and elaborates on spw.quest and factshift.center', async () => {
  const files = readdirSync(TEXTURE_DIR).filter((name) => name.endsWith('.spw')).sort();
  assert.ok(files.length >= 60, `expected >=60 material .spw files, got ${files.length}`);

  for (const file of files) {
    const src = readFileSync(path.join(TEXTURE_DIR, file), 'utf8');
    const parsed = quietParse(src);
    assert.equal(parsed.success, true, file);
    assert.deepEqual(parsed.errors, [], file);

    const reading = readFile(src);
    assert.ok(reading.names.length >= 1, `${file} carries #> anchor`);
    assert.ok(reading.tags.length >= 2, `${file} carries #:layer and #!kind particle tags`);

    const line = src.split('\n').find((entry) => entry.startsWith('~'));
    assert.ok(line, `${file} carries a ~material[class]{...} line`);
    assert.ok(canvasHref(line)?.includes('?spw='), `${file} line fits factshift.center ?spw=`);
    assert.ok(canvasHref(src)?.includes('#spw64='), `${file} full script carries by #spw64=`);
    assert.ok(questPivotHref(line), `${file} line opens on /pivot`);
  }

  const vellum = readFileSync(path.join(TEXTURE_DIR, 'vellum.spw'), 'utf8')
    .split('\n').find((entry) => entry.startsWith('~'));
  const pivotHtml = await text(`/pivot?line=${encodeURIComponent(vellum)}`);
  assert.match(pivotHtml, /id="turn-mode"/);
  assert.match(pivotHtml, /id="turn-body"/);
});

test('capsule-prefixed prose beats and compound marks (~^) preserve parse shape under logical revision', async () => {
  const before = '^seed[...]{...}\n<prose> ~^light[green]{"bob clicks the sofa"}';
  const after = '^seed[...]{...}\n<prose> ~^light[green]{"bob clicks the switch"}';

  const treeBefore = quietParse(before);
  const treeAfter = quietParse(after);
  assert.deepEqual(treeBefore.errors, []);
  assert.deepEqual(treeAfter.errors, []);

  const tokenKinds = (out) => out.tokens.map((t) => `${t.type}:${t.kind || ''}`);
  assert.deepEqual(tokenKinds(treeBefore), tokenKinds(treeAfter));
  assert.equal(readFile(before).ok, true);
  assert.match(await text(`/pivot?line=${encodeURIComponent('<prose> ~^light[green]{"bob clicks the sofa"}')}`), /id="turn-mode"/);
});

test('cinema and debate examples pass both log and wonder checks, open on /, and pivot per line', async () => {
  for (const id of ['cinema', 'debate']) {
    const example = exampleById(id);
    assert.ok(example, `${id} exists in EXAMPLES`);
    const reading = readFile(example.script);
    assert.equal(reading.ok, true, id);
    const failed = reading.checks.filter((check) => check.state === 'fail');
    assert.deepEqual(failed, [], `${id} checks pass without failure`);
    assert.ok(reading.checks.some((check) => /date and a kind/.test(check.says)), `${id} passes log check`);
    assert.ok(reading.checks.some((check) => /carries a probe/.test(check.says)), `${id} passes wonder check`);

    const page = await text(`/?example=${encodeURIComponent(id)}`);
    assert.ok(page.includes(example.file), `${id} renders on /`);
    assert.ok(canvasHref(example.script, { name: id })?.includes('#spw64='), `${id} links to canvas`);
    assert.ok(page.includes(`https://spwashi.com/tools/spw-parser/?spw_source=${encodeURIComponent(example.script)}#literal-parser`), `${id} links straight to spwashi.com parser`);
  }

  // Career stages and multiparty speaker readings share uniform slot geometry for side-by-side comparison.
  const senior = '!lock[cut_two]{color, foley, title_cards}(thesis_suite)<master>';
  assert.match(await text(`/pivot?line=${encodeURIComponent(senior)}`), /id="turn-mode"/);
  const maya = '@maya[picture]{pacing, sound_lock}(friday)<cut>';
  assert.match(await text(`/pivot?line=${encodeURIComponent(maya)}`), /id="turn-scope"/);
});
