import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALWAYS_ON_SPECS,
  FOCUSES,
  MODEL_SPECS,
  SHARED_EMPHASIS,
  SHUNT_MIN_LINES,
  countLines,
  countWords,
  inspectAgentAdapter,
  inspectAgentAdapters,
  inspectAlwaysOnFiles,
  inspectWordBudget,
} from '../check-agent-contracts.mjs';

test('agent adapters emphasize named focuses without exclusive ownership', () => {
  assert.equal(
    SHARED_EMPHASIS,
    'This adapter emphasizes one focus. AGENTS.md is the gate. Any model still follows Open first.',
  );
  assert.deepEqual(Object.keys(FOCUSES), [
    'anti-bloat',
    'constitutional',
    'exactness',
    'tool-mastery',
    'computer-use',
  ]);
  const byFile = Object.fromEntries(MODEL_SPECS.map((spec) => [spec.file, spec]));
  assert.equal(byFile['CLAUDE.md'].emphasize, 'constitutional');
  assert.equal(byFile['GROK.md'].emphasize, 'anti-bloat');
  assert.equal(byFile['GEMINI.md'].emphasize, 'tool-mastery');
  assert.equal(byFile['GPT.md'].emphasize, 'exactness');
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('verify-first'));
  assert.ok(byFile['GPT.md'].requiredPhrases.includes('one named patch'));
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

test('adapters on disk stay under the adapter word budget', () => {
  for (const spec of MODEL_SPECS) {
    const report = inspectAgentAdapter(spec, { requireTracked: false });
    assert.ok(spec.maxWords > 0);
    assert.ok(report.words <= spec.maxWords, `${spec.file}: ${report.words}w`);
  }
});
