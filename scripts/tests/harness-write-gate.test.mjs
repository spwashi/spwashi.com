import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STASH_DENY_REASON,
  WRITE_DENY_REASON,
  decideHarnessWrite,
  formatPreToolUseDeny,
  isGitStash,
} from '../harness-write-gate.mjs';

test('patch role may write', () => {
  const decision = decideHarnessWrite(
    { tool_name: 'Write', tool_input: { file_path: 'about/index.html' } },
    { SPW_HARNESS_ROLE: 'patch' },
  );
  assert.equal(decision.allow, true);
});

test('explore, plan, and review roles do not write', () => {
  for (const role of ['explore', 'plan', 'review']) {
    const decision = decideHarnessWrite(
      { tool_name: 'Edit', tool_input: { file_path: 'AGENTS.md' } },
      { SPW_HARNESS_ROLE: role },
    );
    assert.equal(decision.allow, false, role);
    assert.equal(decision.reason, WRITE_DENY_REASON);
  }
});

test('Claude plan permission mode does not write', () => {
  const decision = decideHarnessWrite(
    { tool_name: 'Write', permission_mode: 'plan' },
    { SPW_HARNESS_ROLE: 'patch' },
  );
  assert.equal(decision.allow, false);
  assert.equal(decision.reason, WRITE_DENY_REASON);
});

test('git stash is always denied', () => {
  assert.equal(isGitStash('git stash'), true);
  assert.equal(isGitStash('git -C . stash push -m x'), true);
  const decision = decideHarnessWrite(
    { tool_name: 'Bash', tool_input: { command: 'git stash' } },
    { SPW_HARNESS_ROLE: 'patch' },
  );
  assert.equal(decision.allow, false);
  assert.equal(decision.reason, STASH_DENY_REASON);
});

test('plan role may still run sensors', () => {
  const decision = decideHarnessWrite(
    { tool_name: 'Bash', tool_input: { command: 'npm run wonder' } },
    { SPW_HARNESS_ROLE: 'plan' },
  );
  assert.equal(decision.allow, true);
});

test('PreToolUse deny payload names the block', () => {
  const payload = JSON.parse(formatPreToolUseDeny(WRITE_DENY_REASON));
  assert.equal(payload.hookSpecificOutput.permissionDecision, 'deny');
  assert.equal(payload.hookSpecificOutput.permissionDecisionReason, WRITE_DENY_REASON);
});
