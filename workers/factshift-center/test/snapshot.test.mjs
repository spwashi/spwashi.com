import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const version = JSON.parse(readFileSync(new URL('version.json', root), 'utf8'));
const html = readFileSync(new URL('assets/index.html', root), 'utf8');

test('the snapshot is the 0.0.2-alpha frame', () => {
  assert.equal(version.app, 'app.factshift.com');
  assert.equal(version.version, '0.0.2-alpha');
  assert.equal(version.script, 'factshift-center');
  assert.match(html, /data-app="factshift"/);
  assert.match(html, /data-app-version="0\.0\.2-alpha"/);
  assert.match(html, /<title>&lt;concept&gt;<\/title>/);
  assert.ok(version.query.includes('charge'));
  assert.ok(version.query.includes('velocityDecay'));
});
