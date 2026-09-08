import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STASH_DENY_REASON,
  WRITE_DENY_HINT,
  WRITE_DENY_REASON,
  decideHarnessWrite,
  formatHarnessStatus,
  formatPreToolUseDeny,
  isGitStash,
  isInsideRepo,
  wantsStatus,
  writeTargetOf,
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

test('the deny covers this tree, not the host plan file outside it', () => {
  assert.equal(isInsideRepo('AGENTS.md'), true);
  assert.equal(isInsideRepo('public/css/style.css'), true);
  assert.equal(isInsideRepo(''), true, 'unknown target stays denied');
  assert.equal(isInsideRepo('/Users/someone/.claude/plans/a-plan.md'), false);
  assert.equal(isInsideRepo('../elsewhere/notes.md'), false);
  assert.equal(writeTargetOf({ tool_input: { file_path: 'AGENTS.md' } }), 'AGENTS.md');

  const inTree = decideHarnessWrite(
    { tool_name: 'Write', tool_input: { file_path: 'AGENTS.md' }, permission_mode: 'plan' },
    { SPW_HARNESS_ROLE: 'patch' },
  );
  assert.equal(inTree.allow, false);
  assert.equal(inTree.reason, WRITE_DENY_REASON);

  const planFile = decideHarnessWrite(
    {
      tool_name: 'Write',
      tool_input: { file_path: '/Users/someone/.claude/plans/a-plan.md' },
      permission_mode: 'plan',
    },
    { SPW_HARNESS_ROLE: 'patch' },
  );
  assert.equal(planFile.allow, true);
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

test('PreToolUse deny payload names the block and the switch', () => {
  const payload = JSON.parse(formatPreToolUseDeny(WRITE_DENY_REASON));
  assert.equal(payload.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(payload.hookSpecificOutput.permissionDecisionReason, /Explore\/plan do not write/);
  assert.match(payload.hookSpecificOutput.permissionDecisionReason, /SPW_HARNESS_ROLE=patch/);
});

test('TTY and --status print the harness, piped JSON does not', () => {
  assert.equal(wantsStatus(['--status'], { isTTY: false }), true);
  assert.equal(wantsStatus([], { isTTY: true }), true);
  assert.equal(wantsStatus([], { isTTY: false }), false);
  assert.equal(wantsStatus(['--hook'], { isTTY: true }), false);
  const status = formatHarnessStatus({ role: 'plan' });
  assert.match(status, /role=plan write=deny/);
  assert.match(status, /npm run sense -- copy\|nouns\|ink/);
  assert.match(status, new RegExp(WRITE_DENY_HINT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
