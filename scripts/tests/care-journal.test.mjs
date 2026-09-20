import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEntry, readJournal, imagePrompt } from '../../public/js/modules/services/care-journal.js';

test('journal refuses corrupt or ambiguous saved entries', () => {
  assert.deepEqual(readJournal(null), []);
  for (const raw of ['oops', '{}', '{"version":2,"entries":[]}', '{"version":1,"entries":[{}]}', '{"version":1,"entries":[{"id":"a"},{"id":"a"}]}']) {
    assert.throws(() => readJournal(raw));
  }
});
test('journal constrains stored colors and oversized input', () => {
  const entry = normalizeEntry({ background: 'url(https://example.com)', title: 'x'.repeat(13000), figure: '<img src=x onerror=alert(1)>' });
  assert.equal(entry.background, '#233b46');
  assert.equal(entry.title.length, 12000);
  assert.equal(entry.figure, '<img src=x onerror=alert(1)>'); // Renderer must use textContent.
});
test('image packet excludes private journal and conversation fields', () => {
  const entry = normalizeEntry({ title: 'private name', moment: 'private memory', return: 'private discussion', image: 'a window', detail: 'rain', change: 'sunlight' });
  const packet = imagePrompt(entry);
  assert.match(packet, /Image: a window\n  Detail: rain\n    Another possibility: sunlight/);
  assert.doesNotMatch(packet, /private/);
  assert.equal(imagePrompt(normalizeEntry({ moment: 'private' })), '');
});
