import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '../..');

test('route migration decodes metadata entities before escaping template attributes', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'spw-template-migration-'));
  const file = path.join(dir, 'index.html');
  try {
    await writeFile(file, `<!doctype html>
<html lang="en">
<head>
  <title>Spwashi • #&gt; Frame &amp; Concept</title>
  <meta name="description" content="Compare &lt;concept&gt; &amp; frame." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="https://spwashi.com/test/" />
  <link rel="stylesheet" href="/public/css/style.css" />
  <link rel="stylesheet" href="/public/css/routes/test.css?v=1" />
  <script type="module" src="/public/js/site.js"></script>
  <script type="module" src="/public/js/modules/test.js?v=1"></script>
</head>
<body data-spw-surface="software" data-spw-page-family="operator-atlas">
  <main><h1>Specimen</h1></main>
</body>
</html>
`);
    await execFileAsync(
      process.execPath,
      ['scripts/migrate-route-to-template.mjs', file],
      { cwd: ROOT },
    );
    const migrated = await readFile(file, 'utf8');
    assert.match(migrated, /title="Spwashi • #> Frame &amp; Concept"/);
    assert.match(migrated, /description="Compare &lt;concept> &amp; frame\."/);
    assert.match(migrated, /robots="noindex, nofollow"/);
    assert.match(migrated, /extra_styles="\/public\/css\/routes\/test\.css\?v=1"/);
    assert.match(migrated, /extra_scripts="\/public\/js\/modules\/test\.js\?v=1"/);
    assert.doesNotMatch(migrated, /&amp;(?:gt|lt|amp);/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
