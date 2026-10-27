/**
 * The wonder lifecycle the harvest reads (theory-map-2026-10.spw ^"lifecycle"):
 * the marks a block carries, which probes --run may execute, and how a run
 * becomes a receipt that still waits on a reader's verdict.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  answerInSet,
  gapsOf,
  lifecycleOf,
  observationOf,
  parseWonders,
  pipeStages,
  probeKind,
  readProbeLines,
  renderRuns,
  safeProbeCommand,
  streamLineOf,
} from '../wonder.mjs';

const BLOCK = [
  '#>wonder_sample',
  '?["Does the shelf part at the name?"]{',
  '  ~#expect: "At the name, since both are one family."',
  '  ~#unblocks: "the compare view"',
  '  ~#probe(run)',
  '  !probe{ "rg -n \\"first =\\" out.spw | head -1" }',
  '  $%[part.name, part.body]',
  '}',
].join('\n');

test('a block reads its lifecycle marks, and a quoted probe is unescaped for the shell', () => {
  const [wonder] = parseWonders(BLOCK, 'x.spw');
  assert.equal(wonder.expect, 'At the name, since both are one family.');
  assert.equal(wonder.unblocks, 'the compare view');
  assert.equal(wonder.probeKind, 'run');
  assert.deepEqual(wonder.probes, ['rg -n "first =" out.spw | head -1']);
  assert.deepEqual(gapsOf(wonder), []);
});

test('a wonder is open, then probed by a stream line, then answered or retired by its own marks', () => {
  const [wonder] = parseWonders(BLOCK, 'x.spw');
  assert.equal(lifecycleOf(wonder), 'open');
  const probed = readProbeLines(' >>[2026-10-27 13:32] probe — wonder_sample: parted at the name.\n >>[2026-10-20] decide — wonder_other is not a probe line.');
  assert.deepEqual([...probed], [['wonder_sample', '2026-10-27']]);
  assert.equal(lifecycleOf(wonder, probed), 'probed');
  assert.equal(lifecycleOf({ ...wonder, answer: 'part.name — it parts at the name' }, probed), 'answered');
  assert.equal(lifecycleOf({ ...wonder, retired: 'the shelf moved' }, probed), 'retired');
});

test('a wonder inside a wonder is its own question, and its marks stay its own', () => {
  const source = [
    '#>wonder_outer',
    '?["Does depth open onto smaller questions?"]{',
    '  #>wonder_inner',
    '  ?["Does the inner one stand alone?"]{',
    '    ~#expect: "Yes."',
    '    !probe{ "rg -c x y" }',
    '    $%[inner.alone, inner.leans]',
    '  }',
    '  !probe{ "read both" }',
    '  $%[depth.frames, depth.flat]',
    '}',
    '^"frame"{',
    '  ?["A sibling held by a frame, not a wonder?"]{',
    '    !probe{ "read" }',
    '  }',
    '}',
  ].join('\n');
  const [outer, inner, sibling] = parseWonders(source, 'x.spw');
  assert.deepEqual([outer.id, inner.id], ['wonder_outer', 'wonder_inner']);
  assert.equal(inner.parent, 'wonder_outer');
  assert.deepEqual(outer.children, ['wonder_inner']);
  assert.deepEqual(outer.probes, ['read both']);
  assert.equal(outer.expect, '');
  assert.deepEqual(outer.measures, ['$%[depth.frames, depth.flat]']);
  assert.equal(inner.expect, 'Yes.');
  assert.equal(sibling.parent, '');
});

test('an answer names an alternative from its set, or the contour says it does not', () => {
  const [wonder] = parseWonders(BLOCK, 'x.spw');
  assert.equal(answerInSet({ ...wonder, answer: 'part.name' }), true);
  assert.deepEqual(gapsOf({ ...wonder, answer: 'somewhere else' }), ['answer outside its set']);
  assert.deepEqual(gapsOf({ ...wonder, expect: '', probes: [], measures: [] }), ['probe', 'expect', '$% set']);
});

test('a probe is a command only when it reads as one; an instruction that opens with a command name is a reading', () => {
  assert.equal(probeKind("rg -n 'a|b' x.js"), 'run');
  assert.equal(probeKind('grep swipe in x.js. if the count is 0, look at y'), 'read');
  assert.equal(probeKind('npm run reasons — read the exclusive holdings'), 'read');
  assert.equal(probeKind('open the page on a phone'), 'read');
  assert.equal(probeKind('open the page', 'run'), 'run');
});

test('pipes inside quotes stay in the pattern; chains, redirects and substitutions outside quotes are refused', () => {
  assert.deepEqual(pipeStages("rg -n 'a|b' x | wc -l"), ["rg -n 'a|b' x", 'wc -l']);
  assert.deepEqual(pipeStages('rg "a;b" x'), ['rg "a;b" x']);
  assert.equal(pipeStages('rg a x; rm -rf y'), null);
  assert.equal(pipeStages('rg a x > out'), null);
  assert.equal(pipeStages('rg a x && ls'), null);
  assert.equal(pipeStages('rg "$(whoami)" x'), null);
  assert.equal(pipeStages('rg `whoami` x'), null);
  assert.deepEqual(pipeStages("rg '$(literal)' x"), ["rg '$(literal)' x"]);
});

test('--run executes only reading commands', () => {
  for (const command of [
    "rg -c 'unblocks = ' x.spw",
    "git log --since=2026-09-01 --format=%s | cut -c1-2 | sort | uniq -c",
    'npm run -s spw:routes -- --diff /a/ /b/',
    "npm run -s wonder 2>&1 | grep 'site wonders'",
    'npm run spw -- --help --json',
    "sed -n '1,4p' x",
  ]) assert.equal(safeProbeCommand(command).ok, true, command);
  for (const command of [
    'npm run spw:routes -- --write',
    'npm run audit:root-writes',
    'npm run audit:layer-flip -- --bundle=home',
    'npm run sense -- ink home',
    'npm run plans:index:check -- --receipt r.json',
    "sed -i '' s/a/b/ x",
    'find . -name x -delete',
    'git checkout main',
    'node -e "1"',
    'rm x',
  ]) assert.equal(safeProbeCommand(command).ok, false, command);
});

test('a run becomes a receipt in the claim protocol terms, with the verdict left to a reader', () => {
  const [wonder] = parseWonders(BLOCK, '/repo/.spw/caches/x.spw');
  assert.equal(observationOf('one\ntwo\n\nthree', '', 2), 'two / three');
  assert.equal(observationOf('', 'rg: x: No such file'), 'rg: x: No such file');
  const observation = observationOf('\u001b[1m24:  first = `name`\u001b[0m\n', '');
  assert.equal(observation, "24:  first = 'name'");
  const run = { wonder, probe: wonder.probes[0], exit: 0, ms: 12, observation };
  const text = renderRuns([run], { stamp: '2026-10-27 13:32', revision: 'abc12345' });
  assert.match(text, /^\s+wonder_sample: \.\{$/m);
  assert.match(text, /run_id = `2026-10-27T13:32-wonder_sample`/);
  assert.match(text, /effect_boundary = #read/);
  assert.match(text, /source_revision = `abc12345`/);
  assert.match(text, /verdict = `needs-review`/);
  assert.match(streamLineOf(run, '2026-10-27 13:32'), /^>>\[2026-10-27 13:32\] probe — wonder_sample: exit 0, printed "24:  first = 'name'"\. Against ~#expect/);
  assert.equal(readProbeLines(streamLineOf(run, '2026-10-27 13:32')).get('wonder_sample'), '2026-10-27');
});
