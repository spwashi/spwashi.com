// Shared clean-still capture mode across attention.productions, texture.website, and tealstripesvibes.com.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STILL_MODES, nextStillMode, stillLabel } from '../../lib/clean-still.js';

const workers = path.dirname(path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))));
const HOSTS = [
  { dir: 'attention-productions', script: 'attention.js', css: 'attention.css' },
  { dir: 'texture-website', script: 'texture.js', css: 'texture.css' },
  { dir: 'tealstripesvibes', script: 'tealstripes.js', css: 'tealstripes.css' },
];

test('the clean-still ring steps studio -> plate -> pure -> studio with clear labels', () => {
  assert.deepEqual(STILL_MODES, ['', 'plate', 'pure']);
  assert.equal(nextStillMode(''), 'plate');
  assert.equal(nextStillMode('plate'), 'pure');
  assert.equal(nextStillMode('pure'), '');
  assert.equal(stillLabel(''), 'Still');
  assert.equal(stillLabel('plate'), 'Still: plate');
  assert.equal(stillLabel('pure'), 'Still: pure');
});

test('each visual host carries the identical clean-still module, links its stylesheet, and mounts it', () => {
  const libJs = readFileSync(path.join(workers, 'lib', 'clean-still.js'), 'utf8');
  const libCss = readFileSync(path.join(workers, 'lib', 'clean-still.css'), 'utf8');
  for (const host of HOSTS) {
    const assets = path.join(workers, host.dir, 'assets');
    assert.equal(readFileSync(path.join(assets, 'clean-still.js'), 'utf8'), libJs, `${host.dir}/assets/clean-still.js matches workers/lib/clean-still.js`);
    assert.equal(readFileSync(path.join(assets, 'clean-still.css'), 'utf8'), libCss, `${host.dir}/assets/clean-still.css matches workers/lib/clean-still.css`);
    const html = readFileSync(path.join(assets, 'index.html'), 'utf8');
    assert.ok(html.includes('href="/clean-still.css"'), `${host.dir} links /clean-still.css`);
    const js = readFileSync(path.join(assets, host.script), 'utf8');
    assert.match(js, /mountCleanStill\(/, `${host.dir} mounts mountCleanStill`);
    const css = readFileSync(path.join(assets, host.css), 'utf8');
    assert.match(css, /:root\[data-still/, `${host.dir} defines clean-still hiding rules`);
  }
});
