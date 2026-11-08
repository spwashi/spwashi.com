// The reader the guide pins (PR 2 of .agents/plans/spw-quest/note-shell-design.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { PINNED_READER, PINNED_READER_BYTES, PINNED_READER_SHA256, PINNED_RELEASE, newestPublished, releaseNotice } from '../src/shell-pin.js';
import { newestFirst, readName } from '../src/parser-releases.js';

const asset = (path) => new URL(`../assets${path}`, import.meta.url);

test('the pin is the manifest entry for reader.min.js, by path, size and lowercase hex sha256', () => {
  const manifest = JSON.parse(readFileSync(asset(`/parser/${PINNED_RELEASE}/manifest.json`), 'utf8'));
  const entry = manifest.files.find((file) => file.path === 'reader.min.js');
  assert.equal(PINNED_READER, `/parser/${manifest.name}/${entry.path}`);
  assert.equal(PINNED_READER_BYTES, entry.bytes);
  assert.equal(PINNED_READER_SHA256, entry.sha256);
  const bytes = readFileSync(asset(PINNED_READER));
  assert.equal(bytes.byteLength, PINNED_READER_BYTES);
  // The encoding the shell compares: lowercase hex of SHA-256, two digits a byte.
  const hex = Array.from(createHash('sha256').update(bytes).digest(), (b) => b.toString(16).padStart(2, '0')).join('');
  assert.equal(hex, PINNED_READER_SHA256);
});

test('newestPublished orders as newestFirst does, keeps only releases and patches, and stands alone', () => {
  const names = ['2026.10.13', '2026.11.02-pre.3', '2026.11.01', '2026.11.01-patch.2', '2026.11.01-patch.1', 'nope', '2026.09.30'];
  const expected = names.filter((name) => {
    const read = readName(name);
    return read && read.kind !== 'prerelease';
  }).map((name) => ({ name })).sort(newestFirst).map((entry) => entry.name);
  assert.deepEqual(newestPublished(names.map((name) => ({ name }))), expected);
  assert.deepEqual(expected, ['2026.11.01-patch.2', '2026.11.01-patch.1', '2026.11.01', '2026.10.13', '2026.09.30']);
  assert.deepEqual(newestPublished(null), []);
  // It runs on the page by toString, so it cannot close over parser-releases.js.
  assert.doesNotMatch(newestPublished.toString(), /readName|TIER/);
});

test('the guide imports the pinned reader, carries a hidden release line, and asks for newer releases after paint', async () => {
  const page = await (await worker.fetch(new Request('https://spw.quest/'))).text();
  assert.ok(page.includes(`import { parse } from "${PINNED_READER}";`));
  assert.match(page, /<p class="note" data-release-notice hidden>Release <code data-release-name><\/code> is published\./);
  assert.ok(page.includes(`(${releaseNotice.toString()})(${JSON.stringify(PINNED_RELEASE)}, ${newestPublished.toString()});`));
  // /learn and /build keep the site bundle.
  for (const path of ['/learn', '/build']) {
    assert.ok((await (await worker.fetch(new Request(`https://spw.quest${path}`))).text()).includes('import { parse } from "/parser.js";'), path);
  }
});
