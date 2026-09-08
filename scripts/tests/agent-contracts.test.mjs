import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALWAYS_ON_SPECS,
  HARNESS_SPECS,
  MODEL_SPECS,
  OPEN_FIRST_LINE_OVERRIDES,
  SHARED_EMPHASIS,
  SHARED_WRITE_DENY,
  SHUNT_MIN_LINES,
  collectOpenFirstTargets,
  countLines,
  countWords,
  inspectAgentAdapter,
  inspectAgentAdapters,
  inspectAlwaysOnFiles,
  inspectHarnessFiles,
  inspectOpenFirstFiles,
  inspectWordBudget,
  openFirstSpecs,
} from '../check-agent-contracts.mjs';

test('agent adapters emphasize named focuses without exclusive ownership', () => {
  assert.equal(
    SHARED_EMPHASIS,
    'This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.',
  );
  const byFile = Object.fromEntries(MODEL_SPECS.map((spec) => [spec.file, spec]));
  assert.ok(byFile['CLAUDE.md'].requiredPhrases.includes('Constitutional Rigor'));
  assert.ok(byFile['GROK.md'].requiredPhrases.includes('Anti-Bloat & Signal'));
  assert.ok(byFile['GEMINI.md'].requiredPhrases.includes('Progressive Mastery'));
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('Contract Exactness'));
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('verify-first'));
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('one named patch'));
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('visual:checks -- --ids='));
  assert.ok(byFile['GROK.md'].requiredPhrases.includes('npm run wonder'));
  assert.ok(byFile['CLAUDE.md'].requiredPhrases.includes('spw:integrity'));
  for (const spec of MODEL_SPECS) {
    assert.ok(spec.requiredPhrases.includes(SHARED_WRITE_DENY), spec.file);
  }
});

test('adapter files on disk carry the shared emphasis sentence', () => {
  for (const spec of MODEL_SPECS) {
    const report = inspectAgentAdapter(spec, { requireTracked: false });
    assert.equal(report.ok, true, `${spec.file}: ${report.issues.join('; ')}`);
    assert.ok(report.content.includes(SHARED_EMPHASIS));
  }
});

test('inspectAgentAdapters reports every registered surface', () => {
  const reports = inspectAgentAdapters({ requireTracked: false });
  assert.equal(reports.length, 6);
  assert.ok(reports.every((report) => report.ok));
});

test('countWords splits on whitespace and ignores padding', () => {
  assert.equal(countWords('  one two  three\nfour  '), 4);
  assert.equal(countLines('a\nb\nc\n'), 3);
  assert.equal(countLines(''), 0);
});

test('word budgets fail when a gate file is oversize', () => {
  const oversize = inspectWordBudget(
    { file: 'AGENTS.md', maxWords: 10 },
    'one two three four five six seven eight nine ten eleven',
  );
  assert.equal(oversize.ok, false);
  assert.match(oversize.issues[0], /11 words exceeds budget 10/);

  const overLines = inspectWordBudget(
    { file: 'PLAN.md', maxLines: 2 },
    'a\nb\nc\n',
  );
  assert.equal(overLines.ok, false);
  assert.match(overLines.issues[0], /3 lines exceeds budget 2/);
});

test('always-on files on disk fit their word budgets', () => {
  assert.equal(ALWAYS_ON_SPECS.length, 3);
  assert.ok(SHUNT_MIN_LINES >= 200);
  const reports = inspectAlwaysOnFiles({ requireTracked: false });
  assert.equal(reports.length, 3);
  for (const report of reports) {
    assert.equal(report.ok, true, `${report.spec.file}: ${report.issues.join('; ')}`);
    assert.ok(report.words <= report.spec.maxWords);
  }
});

test('open-first targets are derived from the gate and stay inside their line budget', () => {
  const { targets, unresolved } = collectOpenFirstTargets();
  assert.ok(targets.length > 0, 'AGENTS.md Open first named no resolvable file');
  assert.deepEqual(unresolved, [], `Open first cites missing path(s): ${unresolved.join(', ')}`);

  // Files budgeted elsewhere must not be double-reported here.
  const covered = new Set([
    ...MODEL_SPECS.map((spec) => spec.file),
    ...ALWAYS_ON_SPECS.map((spec) => spec.file),
    ...HARNESS_SPECS.map((spec) => spec.file),
  ]);
  for (const target of targets) {
    assert.equal(covered.has(target), false, `${target} is budgeted twice`);
  }

  // A stale override is a lie about debt that is already paid.
  for (const file of Object.keys(OPEN_FIRST_LINE_OVERRIDES)) {
    assert.ok(targets.includes(file), `${file} has a line override but is no longer an Open first target`);
    assert.ok(
      OPEN_FIRST_LINE_OVERRIDES[file] > SHUNT_MIN_LINES,
      `${file} override is at or under SHUNT_MIN_LINES — drop the entry instead`,
    );
  }

  const { specs } = openFirstSpecs();
  for (const spec of specs) {
    assert.ok(spec.maxLines >= SHUNT_MIN_LINES, spec.file);
  }

  const reports = inspectOpenFirstFiles({ requireTracked: false });
  assert.equal(reports.length, targets.length);
  for (const report of reports) {
    assert.equal(report.ok, true, `${report.spec.file}: ${report.issues.join('; ')}`);
  }
});

test('adapters on disk stay under the adapter word budget', () => {
  for (const spec of MODEL_SPECS) {
    const report = inspectAgentAdapter(spec, { requireTracked: false });
    assert.ok(spec.maxWords > 0);
    assert.ok(report.words <= spec.maxWords, `${spec.file}: ${report.words}w`);
  }
});

test('harness files carry write-deny and cheap visual', () => {
  assert.equal(SHARED_WRITE_DENY, 'Explore/plan do not write');
  assert.equal(HARNESS_SPECS.length, 3);
  const reports = inspectHarnessFiles({ requireTracked: false });
  assert.equal(reports.length, 3);
  for (const report of reports) {
    assert.equal(report.ok, true, `${report.spec.file}: ${report.issues.join('; ')}`);
  }
});

test('AGENTS.md Sense first is a failing check, not a suggestion', () => {
  const agents = ALWAYS_ON_SPECS.find((spec) => spec.file === 'AGENTS.md');
  assert.ok(agents.requiredPhrases.includes('Sense first'));
  assert.ok(agents.requiredPhrases.includes(SHARED_WRITE_DENY));
  assert.ok(agents.requiredPhrases.includes('visual:checks -- --ids'));
  assert.ok(agents.requiredPhrases.includes('npm run sense'));
});
