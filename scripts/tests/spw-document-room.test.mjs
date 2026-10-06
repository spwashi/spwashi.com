import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

import { projectSpwRoom } from '../../public/js/modules/tools/spw-document-project.js';
import {
  deliverDocumentLaunch,
  isSpwDocument,
  SHARE_CACHE,
  takePendingDocument,
} from '../../public/js/runtime/shell/spw-document-launch.js';

const SAMPLE = `#>spotify_trendfield
^"seed"{
  center = \`hooked strangeness\`
}[reg=facet]
^"clusters"{
  neon_machine = \`neon-machine\`
  micro_surreal = \`micro-surreal\`
}[reg=facet]
^"bridges"{
  texture = \`synthetic texture\`
}[reg=facet]
`;

describe('spw document room', () => {
  it('reads a file as a room of named blocks', () => {
    const room = projectSpwRoom(SAMPLE, 'spotify_trendfield.spw');

    assert.equal(room.title, 'spotify_trendfield');
    assert.equal(room.ok, true);
    assert.deepEqual(room.slots.seed, ['center — hooked strangeness']);
    assert.deepEqual(room.slots.clusters, ['neon_machine — neon-machine', 'micro_surreal — micro-surreal']);
    assert.deepEqual(room.slots.bridges, ['texture — synthetic texture']);
    assert.deepEqual(room.slots.axes, []);
  });

  it('keeps a file that has other blocks', () => {
    const room = projectSpwRoom('^"plate"{\n  paper = `ink`\n}[reg=facet]\n', 'ink.spw');
    assert.equal(room.blocks[0].name, 'plate');
    assert.deepEqual(room.blocks[0].items, ['paper — ink']);
    assert.deepEqual(room.slots.seed, []);
  });

  it('accepts a .spw name or the document mime type', () => {
    assert.equal(isSpwDocument({ name: 'Note.SPW', type: '' }), true);
    assert.equal(isSpwDocument({ name: 'note.txt', type: 'application/x-spw' }), true);
    assert.equal(isSpwDocument({ name: 'note.txt', type: 'text/plain' }), false);
  });

  it('holds a same-page launch until the room reads it', () => {
    const previous = globalThis.location;
    globalThis.location = { pathname: '/open/' };
    deliverDocumentLaunch({ name: 'held.spw', source: '^"seed"{ center = `held` }' });
    const pending = takePendingDocument();
    globalThis.location = previous;
    assert.equal(pending.name, 'held.spw');
    assert.equal(takePendingDocument(), null);
  });

  it('points the installed app at /open/ and keeps the share on the device', () => {
    const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
    const worker = readFileSync('sw.js', 'utf8');

    assert.equal(manifest.launch_handler.client_mode, 'focus-existing');
    assert.equal(manifest.file_handlers[0].action, '/open/');
    assert.deepEqual(manifest.file_handlers[0].accept['application/x-spw'], ['.spw']);
    assert.equal(manifest.share_target.action, '/share/spw');
    assert.equal(manifest.share_target.method, 'POST');
    assert.match(worker, new RegExp(SHARE_CACHE));
    assert.match(worker, /pathname === '\/share\/spw'/);
    assert.equal(manifest.icons.some((icon) => icon.src === '/public/images/icon-192.png'), true);
  });
});
