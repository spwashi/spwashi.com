#!/usr/bin/env node
/**
 * Host write-deny for explore / plan / review.
 *
 * Claude Code PreToolUse stdin JSON, plus `SPW_HARNESS_ROLE`.
 * Explore/plan do not write. Never `git stash` in this tree.
 */

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const WRITE_DENY_REASON = 'Explore/plan do not write.';
export const WRITE_DENY_HINT = 'Switch to patch: SPW_HARNESS_ROLE=patch, or leave plan mode.';
export const STASH_DENY_REASON = 'Never git stash in this tree.';
export const WRITE_DENIED_ROLES = Object.freeze(['explore', 'plan', 'review']);

export function readHarnessRole(env = process.env) {
  return String(env.SPW_HARNESS_ROLE || 'patch').trim().toLowerCase();
}

export function isWriteDeniedRole(role) {
  return WRITE_DENIED_ROLES.includes(String(role || '').trim().toLowerCase());
}

export function toolNameOf(event) {
  return String(event?.tool_name || event?.toolName || '').trim();
}

export function permissionModeOf(event, env = process.env) {
  const fromEvent = event?.permission_mode || event?.permissionMode || '';
  const fromEnv = env.CLAUDE_CODE_PERMISSION_MODE || env.PERMISSION_MODE || '';
  return String(fromEvent || fromEnv).trim().toLowerCase();
}

export function bashCommandOf(event) {
  const input = event?.tool_input || event?.toolInput || {};
  return String(input.command || input.cmd || '').trim();
}

export function isGitStash(command) {
  return /\bgit(?:\s+-C\s+\S+)?\s+stash\b/.test(String(command || ''));
}

export function isWriteTool(name) {
  return /^(Write|Edit|MultiEdit|NotebookEdit|StrReplace)$/i.test(String(name || ''));
}

export function writeTargetOf(event) {
  const input = event?.tool_input || event?.toolInput || {};
  return String(input.file_path || input.filePath || input.path || '').trim();
}

/**
 * The deny protects this tree. A target outside the repo — the host's own plan
 * file under ~/.claude/plans, say — is not a tree mutation, and denying it makes
 * plan mode unable to record the plan it is asking the human to approve.
 * An unknown target stays denied: strict is the safe default.
 */
export function isInsideRepo(target, root = REPO_ROOT) {
  if (!target) return true;
  const rel = path.relative(root, path.resolve(root, target));
  return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel));
}

export function decideHarnessWrite(event = {}, env = process.env) {
  const role = readHarnessRole(env);
  const mode = permissionModeOf(event, env);
  const tool = toolNameOf(event);
  const command = bashCommandOf(event);

  if (isGitStash(command)) {
    return { allow: false, reason: STASH_DENY_REASON };
  }

  const planning = isWriteDeniedRole(role) || mode === 'plan';
  if (planning && isWriteTool(tool) && isInsideRepo(writeTargetOf(event))) {
    return { allow: false, reason: WRITE_DENY_REASON };
  }

  return { allow: true, reason: '' };
}

export function formatPreToolUseDeny(reason) {
  const message = reason === WRITE_DENY_REASON ? `${WRITE_DENY_REASON} ${WRITE_DENY_HINT}` : reason;
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: message,
    },
  });
}

export function wantsStatus(argv = process.argv.slice(2), stdin = process.stdin) {
  if (argv.includes('--hook')) return false;
  if (argv.includes('--status') || argv.includes('--help') || argv.includes('-h')) return true;
  return Boolean(stdin.isTTY);
}

export function formatHarnessStatus({ role } = {}, env = process.env) {
  const current = role || readHarnessRole(env);
  const write = isWriteDeniedRole(current) ? 'deny' : 'allow';
  return [
    `[harness] role=${current} write=${write}`,
    '[harness] sense: npm run sense -- copy|nouns|ink',
    '[harness] fixtures: npm run sense -- ids',
    `[harness] ${WRITE_DENY_REASON} ${WRITE_DENY_HINT}`,
  ].join('\n');
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  if (wantsStatus()) {
    process.stdout.write(`${formatHarnessStatus()}\n`);
    process.exit(0);
  }
  const raw = await readStdin();
  let event = {};
  if (raw.trim()) {
    try {
      event = JSON.parse(raw);
    } catch {
      event = {};
    }
  }
  const decision = decideHarnessWrite(event);
  if (!decision.allow) {
    process.stdout.write(`${formatPreToolUseDeny(decision.reason)}\n`);
    process.stderr.write(
      `${decision.reason === WRITE_DENY_REASON ? `${WRITE_DENY_REASON} ${WRITE_DENY_HINT}` : decision.reason}\n`,
    );
  }
  process.exit(0);
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main();
}
