// wap.mom as files: every printed page is carried out of the worker into assets/,
// and the worker runs only where it reads something (carry-pages.mjs, wrangler.jsonc).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/index.js';
import { addresses, carried } from '../carry-pages.mjs';
import { printed } from '../src/catalog.js';

const root = path.dirname(fileURLToPath(new URL('../wrangler.jsonc', import.meta.url)));
const config = JSON.parse(readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8').replace(/^\s*\/\/.*$/gm, ''));
const get = (p) => worker.fetch(new Request(`https://wap.mom${p}`), {});

test('the worker runs only for the cabinet and a figure drawn without script; everything else is a file', () => {
  assert.deepEqual(config.assets.run_worker_first, ['/cabinet', '/cabinet/*', '/*/draw']);
  assert.equal(config.assets.not_found_handling, '404-page');
});

test('each carried file is what the worker prints, and every sitemap address has one', async () => {
  for (const [file, body] of await carried()) {
    assert.equal(readFileSync(path.join(root, 'assets', file), 'utf8'), body, `assets/${file}: run node workers/wap-mom/carry-pages.mjs`);
  }
  const files = new Map(addresses());
  const sitemap = readFileSync(path.join(root, 'assets', 'sitemap.xml'), 'utf8');
  for (const [, address] of sitemap.matchAll(/<loc>https:\/\/wap\.mom([^<]*)<\/loc>/g)) {
    assert.ok(files.has(address), `${address} is in the sitemap and carried`);
    assert.ok(existsSync(path.join(root, 'assets', files.get(address))), address);
  }
});

test('a figure posts its controls to the issue\'s /draw, which the worker draws and keeps out of the index', async () => {
  const issue = printed.find((each) => readFileSync(path.join(root, 'assets', each.slug, 'index.html'), 'utf8').includes('class="fig-controls"'));
  assert.ok(issue, 'some printed issue has a figure with controls');
  const page = readFileSync(path.join(root, 'assets', issue.slug, 'index.html'), 'utf8');
  assert.ok(page.includes(`action="/${issue.slug}/draw#fig-${issue.slug}"`), issue.slug);
  const drawn = await get(`/${issue.slug}/draw`);
  assert.equal(drawn.status, 200);
  assert.equal(drawn.headers.get('X-Robots-Tag'), 'noindex, follow');
  assert.match(await drawn.text(), /class="fig-controls"/);
});
