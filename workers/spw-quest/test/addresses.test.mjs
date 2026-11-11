// /llms.txt describes what can be done here by address (src/addresses.js). A
// description that drifts from the worker misleads the reader it was written
// for, so each example is called, with no script, the way a fetch would.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { ADDRESSES, ADDRESS_INDEX, addressHref } from '../src/addresses.js';
import { SHARE_MAX } from '../src/build.js';
import { PIVOT_LIMIT } from '../src/pivot.js';
import { LINE_LIMIT } from '../src/reader.js';
import { FACTSHIFT_LIMIT } from '../src/specimens.js';
import { EXAMPLES } from '../src/examples.js';
import { STEPS } from '../src/steps.js';

const get = (path) => worker.fetch(new Request(`https://spw.quest${path}`), {});

test('every address the index names answers, and the index is the llms.txt form', async () => {
  for (const address of ADDRESSES) {
    const href = addressHref(address);
    const response = await get(href);
    assert.ok([200, 302].includes(response.status), `${address.name}: ${href} answers ${response.status}`);
    assert.ok(ADDRESS_INDEX.includes(`[${address.name}](https://spw.quest${href})`), address.name);
    // Strict clients refuse these unencoded, and a fetch never sends a fragment.
    assert.doesNotMatch(href, /[[\]{}<>#]/, `${address.name}: ${href} is percent-encoded`);
  }
  const llms = await get('/llms.txt');
  assert.equal(await llms.text(), ADDRESS_INDEX);
  assert.match(llms.headers.get('content-type'), /^text\/plain/);
  assert.match(ADDRESS_INDEX, /^# spw\.quest\n\n> /);
  assert.ok(new TextEncoder().encode(ADDRESS_INDEX).length < 5000, 'the index stays small enough to read whole');
  assert.ok(ADDRESS_INDEX.includes('[Initialize a repository](https://spw.quest/init)'), 'the index still leads to the recipe');
  // The recipe keeps its own address.
  assert.match(await (await get('/init')).text(), /^# spw\.quest — initialize a mounted Spw workbench/);
});

test('the index names what the worker actually takes', () => {
  const read = ADDRESSES.find(({ name }) => name === 'Read a file').takes;
  for (const { id } of EXAMPLES) assert.ok(read.includes(id), `example ${id}`);
  const check = ADDRESSES.find(({ name }) => name === 'Check a line').takes;
  for (const { id } of STEPS) assert.ok(check.includes(id), `panel ${id}`);
  const says = (name, limit) => assert.ok(ADDRESSES.find((address) => address.name === name).takes.includes(String(limit)), `${name}: ${limit}`);
  says('Pivot', PIVOT_LIMIT);
  says('Take apart', SHARE_MAX);
  says('Check a line', LINE_LIMIT);
  says('Canvas', FACTSHIFT_LIMIT);
});

test('what the index says about Find is what Find does: the answer first, the shelf after it', async () => {
  const page = await (await get('/specimens?q=recipe%5B*%5D')).text();
  assert.ok(page.length > 200_000 && page.length < 320_000, `about 280 KB (${page.length})`);
  assert.ok(page.indexOf('id="found"') > 0 && page.indexOf('id="found"') < page.indexOf('id="pressed"'), 'the matches come before the shelf');
});

test('a refusal says how to ask again', async () => {
  const none = await get('/canvas');
  assert.equal(none.status, 404);
  const said = await none.text();
  assert.match(said, /\/canvas\?line=home%5Bhook%5D/);
  assert.match(said, /\/llms\.txt/);
  const long = await get(`/canvas?line=${'x'.repeat(450)}`);
  assert.equal(long.status, 400);
  assert.match(await long.text(), /450 characters and the canvas holds 400/);
  const missing = await get('/nowhere');
  assert.equal(missing.status, 404);
  assert.equal(await missing.text(), 'Not found: /nowhere\nEvery address this site answers is at https://spw.quest/llms.txt\n');
});
