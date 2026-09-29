import assert from 'node:assert/strict';
import test from 'node:test';

import { dirtyCssPaths, formatDoctor, parseProbeProcesses } from '../qa-doctor.mjs';

const PS = [
  '  101     1   01:02:03 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --remote-debugging-port=9400 --user-data-dir=/var/folders/x/T/spw-headless-abc about:blank',
  '  102   101   01:02:03 /Applications/Google Chrome.app/Contents/Frameworks/Helper --type=renderer --user-data-dir=/var/folders/x/T/spw-headless-abc',
  '  103     1      12:00 /usr/local/bin/node scripts/dev-server.mjs --host 127.0.0.1 --port 5123',
  '  104   900      00:05 /usr/local/bin/node scripts/dev-server.mjs --host 127.0.0.1 --port 5124',
  '  105     1      00:05 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome --remote-debugging-port=9222 --user-data-dir=/Users/me/Chrome',
  '  106     1      00:05 node node_modules/vite/bin/vite.js --host 127.0.0.1',
].join('\n');

test('probe processes: only harness signatures, helpers skipped, ppid 1 is orphan', () => {
  const rows = parseProbeProcesses(PS);
  assert.deepEqual(rows.map((row) => [row.pid, row.kind, row.orphan]), [
    [101, 'chrome', true],
    [103, 'dev-server', true],
    [104, 'dev-server', false],
  ]);
});

test('dirty css paths come from porcelain, renames included', () => {
  assert.deepEqual(
    dirtyCssPaths(' M public/css/shell/a.css\n?? public/css/b.css\n M public/css/README.md\n'),
    ['public/css/shell/a.css', 'public/css/b.css'],
  );
});

test('doctor output names the next command only where it helps', () => {
  const text = formatDoctor({
    ok: false,
    ms: 12,
    checks: [
      { name: 'loopback', ok: true, detail: 'bind + fetch :1' },
      { name: 'orphans', ok: false, detail: '1 orphaned', next: 'npm run sense -- doctor --reap' },
    ],
  });
  assert.match(text, /FAIL orphans/);
  assert.match(text, /→ npm run sense -- doctor --reap/);
  assert.match(text, /ground unsound/);
  assert.equal(text.match(/→/g).length, 1);
});
