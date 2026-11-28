// smut.today as a self-contained script worker: multi-audience story routes,
// room mood dial, variable beat pacing, word slots, discussable teases,
// hidden Spw configuration panel + parser, private cookie prefs, and PWA assets.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { assertIconPng } from '../../lib/png.js';
import worker from '../src/index.js';
import { DEFAULT_SPW_PRESETS, evalSpwDynamics, highlightSpw, parseSpw } from '../src/spw.js';

const get = (path, init = {}) => worker.fetch(new Request(`https://smut.today${path}`, init));

test('core routes & 4-register stories serve clean HTML with no inline scripts', async () => {
  for (const path of ['/', '/to-you/', '/pitches/', '/after-hours/', '/dispatch/', '/threshold/', '/dossier/', '/settle/']) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    const html = await res.text();
    assert.doesNotMatch(html, /<script>|\son[a-z]+=/i, `${path}: no inline script or handler`);
    assert.match(html, /<script src="\/text-scale-head\.js"><\/script>/, path);
    assert.match(html, /<script src="\/app\.js" defer><\/script>/, path);
    assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/, path);
    assert.match(html, /data-text-scale="70"/, path);
    assert.match(html, /color-mix\(in oklab,/, `${path}: uses perceptual oklab blending`);
    assert.match(res.headers.get('content-security-policy'), /script-src 'self';/, path);
    assert.match(html, /id="spw-door"/, path);
    assert.match(html, /<section class="spw-panel" id="spw-panel" hidden/, `${path}: Spw panel starts hidden`);
    assert.match(html, /class="spw-tok spw-op"/, `${path}: syntax-highlighted Spw tokens present`);
  }

  for (const retired of ['/meeting/', '/train/']) {
    const gone = await get(retired);
    assert.equal(gone.status, 404, retired);
  }
});

test('story pages provide reading controls, inline margin beats, word slots, and screenshot teases', async () => {
  for (const slug of ['after-hours', 'dispatch', 'threshold', 'dossier']) {
    const html = await (await get(`/${slug}/`)).text();
    assert.match(html, /class="reading-thread"/, slug);
    assert.match(html, /id="focus-toggle"/, slug);
    assert.match(html, /id="voices-toggle"/, slug);
    assert.match(html, /id="timed-toggle"[^>]+data-base-ms="/, slug);
    assert.match(html, /id="scale-step"/, slug);
    assert.match(html, /class="word-slot"[^>]+data-slot="/, slug);
    assert.match(html, /<details class="beat-note beat-(linger|sharpen)"/, slug);
    assert.match(html, /class="tease-shot[^"]*" data-shot-card="/, slug);
    assert.match(html, /data-shot-btn/, slug);
    assert.match(html, /data-words="/, slug);
  }
});

test('room mood dial filters index routes on GET ?mood= and /today.json exposes full catalog', async () => {
  const warmHtml = await (await get('/?mood=warm')).text();
  assert.match(warmHtml, /<html lang="en" data-mood-tint="warm">/);
  assert.match(warmHtml, /<a class="dial-pill" data-mood="warm" href="\/\?mood=warm" aria-current="true">warm<\/a>/);
  assert.match(warmHtml, /Salt on the counter/);

  const sharpHtml = await (await get('/?mood=sharp')).text();
  assert.match(sharpHtml, /<html lang="en" data-mood-tint="sharp">/);
  assert.match(sharpHtml, /Clause four/);

  const jsonRes = await get('/today.json');
  assert.equal(jsonRes.status, 200);
  const data = await jsonRes.json();
  assert.deepEqual(data.registers, ['slow', 'dirty', 'warm', 'sharp']);
  assert.equal(data.stories.length, 4);
  for (const s of data.stories) {
    assert.ok(s.audience && s.cadence && s.edition?.tease && s.edition?.couplePrompt && s.edition?.circleNote);
  }
});

test('Spw parser & evaluator configure mood, variable pause, focus mode, scale, and word slots', () => {
  const parsed = parseSpw(DEFAULT_SPW_PRESETS.protocol);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.frames.length, 4);

  const { config, ast } = evalSpwDynamics(`
    @mood{ warm }
    ~pause{ 2.4s }
    !words{ honorific: "love", touch: "knuckle" }
    >focus{ "voices" }
    =scale: 110%
  `);
  assert.equal(ast.errors.length, 0);
  assert.equal(config.mood, 'warm');
  assert.equal(config.pauseMs, 2400);
  assert.equal(config.focus, 'voices');
  assert.equal(config.scale, '110');
  assert.deepEqual(config.words, { honorific: 'love', touch: 'knuckle' });

  const broken = parseSpw('@mood{ warm ]');
  assert.ok(broken.errors.length > 0);

  const hl = highlightSpw('@mood{ sharp }');
  assert.match(hl, /spw-op">@<\/span>/);
  assert.match(hl, /spw-head">mood<\/span>/);
  assert.match(hl, /spw-brace">\{<\/span>/);
});

test('smut.today installs as a private PWA with PNG icons, manifest, pre-cached story slugs, and valid JS', async () => {
  const manifestRes = await get('/manifest.webmanifest');
  assert.equal(manifestRes.status, 200);
  const manifest = await manifestRes.json();
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/');
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable' && i.sizes === '512x512'));
  for (const icon of manifest.icons.filter((i) => i.type === 'image/png')) {
    const png = readFileSync(new URL(`../assets${icon.src}`, import.meta.url));
    assertIconPng(png, Number.parseInt(icon.sizes, 10), icon.src);
  }

  for (const jsPath of ['/app.js', '/sw.js', '/text-scale-head.js']) {
    const res = await get(jsPath);
    assert.equal(res.status, 200, jsPath);
    const code = await res.text();
    assert.doesNotThrow(() => new vm.Script(code), `${jsPath} compiles`);
    if (jsPath === '/sw.js') {
      assert.match(res.headers.get('cache-control'), /no-cache/);
      assert.match(code, /pathname\.startsWith\("\/settle"\)/, 'never caches settle route');
      for (const slug of ['after-hours', 'dispatch', 'threshold', 'dossier']) {
        assert.match(code, new RegExp(`/${slug}/`), `sw caches /${slug}/`);
      }
    }
    if (jsPath === '/app.js') {
      assert.match(code, /ROOM_KEY\s*=\s*"set\.spw-room\/1"/);
      assert.match(code, /evalSpwDynamics/);
      assert.match(code, /localStorage\.removeItem\(ROOM_KEY\)/);
    }
  }
});

test('settle cookie round-trip supports all four pace options, type-larger, move-still, and forget clear', async () => {
  const post = await get('/settle/', {
    method: 'POST',
    body: new URLSearchParams({ pace: 'sharp', type: 'larger', move: 'still' }),
  });
  assert.equal(post.status, 303);
  const cookie = post.headers.get('set-cookie');
  assert.match(cookie, /settle=pace-sharp\.type-larger\.move-still/);
  const home = await (await get('/', { headers: { Cookie: cookie.split(';')[0] } })).text();
  assert.match(home, /<html lang="en" data-type="larger" data-move="still">/);
  assert.match(home, /Clause four/);

  const clear = await get('/settle/', {
    method: 'POST',
    body: new URLSearchParams({ forget: '1' }),
  });
  assert.equal(clear.status, 303);
  assert.match(clear.headers.get('set-cookie'), /Max-Age=0/);
});

test('the corridor stays on every page, a mood travels into a room, and the peer kit is served', async () => {
  for (const path of ['/', '/to-you/', '/pitches/', '/settle/', '/after-hours/']) {
    const html = await (await get(path)).text();
    assert.match(html, /aria-label="The four rooms"/, path);
    for (const slug of ['after-hours', 'dispatch', 'threshold', 'dossier']) {
      assert.match(html, new RegExp(`href="/${slug}/"`), path);
    }
  }
  const here = await (await get('/after-hours/')).text();
  assert.match(here, /href="\/after-hours\/"[^>]*aria-current="page"/);
  assert.match(here, /Door 1 of 4/);
  const warm = await (await get('/after-hours/?mood=warm')).text();
  assert.match(warm, /data-mood-tint="warm"/);
  assert.match(warm, /href="\/dispatch\/\?mood=warm"/);

  const scale = await get('/text-scale.js');
  assert.equal(scale.status, 200);
  assert.match(await scale.text(), /export async function mountTextScale/);
  const pinchHref = (await (await get('/')).text()).match(/id="text-pinch" href="([^"]+)"/);
  assert.ok(pinchHref, 'the page names the carried pinch');
  const pinch = await get(pinchHref[1]);
  assert.equal(pinch.status, 200);
  assert.match(pinch.headers.get('content-type'), /javascript/);
});
