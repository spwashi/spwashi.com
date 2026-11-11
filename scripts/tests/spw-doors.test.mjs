// The room and the literal parser hold whole documents, and each leaves by the
// same row of links to the peers. A door has to carry the text it was given.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ecosystemLinks } from '../../public/js/kernel/ecosystem-links.js';

const JOBS = { jobs: ['pivot', 'build', 'canvas'] };

test('a line can be turned, taken apart, or laid out; a document cannot be turned', () => {
  assert.deepEqual(ecosystemLinks('garden[care]{seed}', JOBS).map(({ job }) => job), ['pivot', 'build', 'canvas']);
  assert.deepEqual(ecosystemLinks('#>a\ngarden[care]{seed}\nsoil[wet]{rain}', JOBS).map(({ job }) => job), ['build', 'canvas']);
  assert.deepEqual(ecosystemLinks('', JOBS).filter(({ job }) => job === 'pivot'), []);
});

test('both document surfaces have a place for the doors and fill it', () => {
  for (const [page, module, hook] of [
    ['open/index.html', 'public/js/modules/tools/spw-document-room.js', 'data-document-doors'],
    ['tools/spw-parser/index.html', 'public/js/modules/tools/spw-literal-parser.js', 'data-parser-doors'],
  ]) {
    assert.match(readFileSync(page, 'utf8'), new RegExp(`class="spw-card-doors" ${hook} hidden`), page);
    const source = readFileSync(module, 'utf8');
    assert.ok(source.includes(`[${hook}]`), module);
    assert.match(source, /renderSpwDoors\(doors, source, /, module);
  }
});
