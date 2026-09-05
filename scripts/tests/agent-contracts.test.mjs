import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FOCUSES,
  MODEL_SPECS,
  SHARED_EMPHASIS,
  inspectAgentAdapter,
  inspectAgentAdapters,
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
