import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';
import { STARTERS } from '../src/starters.js';
import { OPERATORS } from '../src/guide.js';
import { EXAMPLES } from '../src/examples.js';
import { PIVOT_LIMIT } from '../src/pivot.js';
import { parse } from '../../../public/js/semantic/spw-workbench-reader.js';

const errorsIn = (source) => (parse(source).diagnostics || []).filter((d) => (d.severity || 'error') === 'error');

test('every opening line and every mark\'s line parses, and travels to /pivot', () => {
  for (const { id, line } of STARTERS) {
    assert.deepEqual(errorsIn(line), [], id);
    assert.ok(line.length <= PIVOT_LIMIT, `${id} fits /pivot`);
  }
  for (const { name, line } of OPERATORS) {
    assert.ok(line, `${name} has a line`);
    assert.deepEqual(errorsIn(line), [], name);
  }
});

test('each opening line opens a file the guide keeps, and says how to ask, talk and build', () => {
  const ids = new Set(EXAMPLES.map((example) => example.id));
  for (const starter of STARTERS) {
    assert.ok(ids.has(starter.open), `${starter.id} opens ${starter.open}`);
    for (const field of ['ask', 'talk', 'build']) assert.ok(starter[field]?.length > 10, `${starter.id}.${field}`);
  }
});

test('the guide shows the opening lines under its opening, each opening in /build to change', async () => {
  const page = await (await worker.fetch(new Request('https://spw.quest/'))).text();
  const start = page.indexOf('<section id="start"');
  assert.ok(start > page.indexOf('<section class="opening"') && start < page.indexOf('<section id="try"'), 'between the opening and the files');
  for (const { id, line } of STARTERS) {
    assert.match(page, new RegExp(`id="start-${id}"`));
    assert.ok(page.includes(`href="/build?script=${encodeURIComponent(line)}#build"`), `${id} opens in /build`);
  }
});
