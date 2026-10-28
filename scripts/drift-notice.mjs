#!/usr/bin/env node
/**
 * Project a Drift notice into one short file a light model can read.
 * Computation stays in the checks. This only keeps where, reason, and detail.
 *
 *   node scripts/drift-notice.mjs smoke < smoke.json
 *   node scripts/drift-notice.mjs citations < citations.json
 *   node scripts/drift-notice.mjs audit < audit.json
 *   node scripts/drift-notice.mjs subjects < subjects.txt
 *   node scripts/drift-notice.mjs assemble --sha <sha> --out notice.json \
 *     --smoke smoke-receipt.json --plans plan-receipt.json \
 *     --citations citations-receipt.json --audit audit-receipt.json \
 *     --attention attention-receipt.json --built built-receipt.json \
 *     --workers workers-receipt.json --subjects subjects.txt \
 *     --ledger ledger.json --ledger-out ledger.json --summary notice.md
 *   node scripts/drift-notice.mjs carry --ledger ledger.json --job attention --base a,b
 *
 * The ledger is what stays between runs (the workflow keeps it in the
 * Actions cache). A failure stays open until the check that found it runs
 * again without it. A still or a route that failed is carried into the next
 * runs (carry), so a rotation cannot turn it green. Each open failure is new
 * (first seen this run) or standing (seen before). Advisories and pending
 * worker deploys are decisions, not drift: they are listed apart and never
 * fail the run.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const CAP = { citations: 20, audit: 15, subjects: 30, plans: 20, attention: 8 };

function clip(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function smokeReceipt(summary = {}) {
  const results = Array.isArray(summary.results) ? summary.results : [];
  const failures = [];
  const routes = [];
  for (const row of results) {
    const where = row.route || '/';
    const reasons = Array.isArray(row.failureReasons) ? row.failureReasons : [];
    const ok = row.hardOk != null ? Boolean(row.hardOk) : Boolean(row.ok);
    routes.push({
      route: where,
      ok,
      wallMs: row.wallMs ?? null,
      settled: row.settled == null ? null : Boolean(row.settled),
      consoleErrorCount: row.consoleErrorCount || 0,
      overflowXFrames: row.overflowXFrames || 0,
    });
    if (ok) continue;
    let detail = '';
    if (reasons.includes('console-error') && row.consoleErrors?.[0]) detail = clip(row.consoleErrors[0]);
    else if (reasons.includes('horizontal-overflow')) detail = `${row.overflowXFrames || 0} frame`;
    else if (row.error) detail = clip(row.error);
    failures.push({
      where,
      reason: reasons[0] || (summary.degraded ? 'http-fallback' : 'navigation'),
      detail,
    });
  }
  return {
    schema: 'smoke-receipt.v0',
    ok: summary.ok != null ? Boolean(summary.ok) : failures.length === 0,
    failures,
    routes,
  };
}

export function citationReceipt(report = {}, cap = CAP.citations) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const failing = findings.filter((row) => row.verdict === 'missing-file' || row.verdict === 'missing-anchor');
  return {
    schema: 'citation-receipt.v0',
    ok: failing.length === 0,
    scanned: report.scanned ?? null,
    pathRefs: report.pathRefs ?? null,
    failures: failing.slice(0, cap).map((row) => ({
      where: `${row.file}:${row.line}`,
      reason: row.verdict,
      detail: row.target,
    })),
    truncated: failing.length > cap,
  };
}

const SEVERITY = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 };

export function auditReceipt(report = {}, { cap = CAP.audit, gate = 'moderate' } = {}) {
  if (report.error && !report.vulnerabilities) {
    const detail = typeof report.error === 'string' ? report.error : report.error.summary || report.error.message;
    return {
      schema: 'audit-receipt.v0',
      ok: false,
      failures: [{ where: 'npm-audit', reason: 'audit-error', detail: clip(detail) }],
      moderate: 0,
      truncated: false,
    };
  }
  const gateRank = SEVERITY[gate] ?? SEVERITY.moderate;
  const rows = [];
  for (const [name, info] of Object.entries(report.vulnerabilities || {})) {
    const severity = info?.severity || 'low';
    if ((SEVERITY[severity] ?? 9) > gateRank) continue;
    const via = Array.isArray(info.via) ? info.via.find((item) => item && typeof item === 'object') : null;
    rows.push({
      where: name,
      reason: severity,
      detail: clip(via?.title || info.range || ''),
    });
  }
  rows.sort((a, b) => (SEVERITY[a.reason] ?? 9) - (SEVERITY[b.reason] ?? 9) || a.where.localeCompare(b.where));
  const listed = rows.filter((row) => row.reason === 'critical' || row.reason === 'high');
  return {
    schema: 'audit-receipt.v0',
    ok: rows.length === 0,
    failures: listed.slice(0, cap),
    moderate: rows.filter((row) => row.reason === 'moderate').length,
    truncated: listed.length > cap,
  };
}

export function subjectsReceipt(text, cap = CAP.subjects) {
  const subjects = String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);
  return {
    schema: 'subjects-receipt.v0',
    ok: true,
    failures: [],
    subjects: subjects.slice(0, cap),
    truncated: subjects.length > cap,
  };
}

/** Checks whose failures are drift: open until the same check runs clean. */
export const DRIFT_JOBS = Object.freeze(['smoke', 'attention', 'plans', 'citations', 'built']);

const JOB_NAMES = Object.freeze({
  smoke: 'Browser smoke',
  attention: 'Pocket attention',
  plans: 'Plan directory indexes',
  citations: '.spw citations',
  built: 'Built site modules',
  audit: 'Registry audit',
  workers: 'Worker deploys',
});

/** How to see a failure again on a laptop. */
export function reproduceCommand(job, where = '') {
  if (job === 'attention') return `node scripts/component-snapshots.mjs --stills --checks --viewports pocket --ids ${where} --out <scratch>`;
  if (job === 'smoke') return `npm run smoke:nav:ci -- --routes "${where}"`;
  if (job === 'plans') return 'npm run plans:index:check';
  if (job === 'citations') return 'npm run spw:integrity';
  if (job === 'built') return 'npm run build && npm run check:built';
  if (job === 'audit') return 'npm audit (the creator reviews before any fix)';
  return '';
}

function emptyLedger() {
  return { schema: 'drift-ledger.v0', updated: '', sha: '', open: {}, decide: {}, cleared: [] };
}

export function readLedger(value) {
  if (!value || typeof value !== 'object' || value.schema !== 'drift-ledger.v0') return emptyLedger();
  return {
    ...emptyLedger(),
    ...value,
    open: { ...(value.open || {}) },
    decide: { ...(value.decide || {}) },
    cleared: Array.isArray(value.cleared) ? value.cleared : [],
  };
}

/** A still's failures may name a variant (about-opening-keys); carry the still asked for. */
function stillFor(where, ran = []) {
  const match = [...ran]
    .sort((a, b) => b.length - a.length)
    .find((id) => where === id || where.startsWith(`${id}-`));
  return match || where;
}

/** The base list plus whatever this job left open, base order first. */
export function carryList(ledger, job, base = []) {
  const out = [...base];
  for (const item of Object.values(readLedger(ledger).open)) {
    if (item.job !== job) continue;
    const name = item.carry || item.where;
    if (name && !out.includes(name)) out.push(name);
  }
  return out;
}

function failureKey(job, row) {
  return `${job}|${row.where}|${row.reason}`;
}

/**
 * Fold one run's receipts into the ledger. A job that did not run leaves its
 * open failures alone. A rotating job (smoke, attention) clears only what it
 * ran; the others clear whatever they no longer list.
 */
export function updateLedger(previous, jobs = {}, { date = '', sha = '' } = {}) {
  const before = readLedger(previous);
  const ledger = { ...emptyLedger(), updated: date, sha, open: {}, decide: {}, cleared: [...before.cleared] };
  const cleared = [];

  for (const job of DRIFT_JOBS) {
    const receipt = jobs[job];
    const priorForJob = Object.entries(before.open).filter(([, item]) => item.job === job);
    if (!receipt || receipt.skipped) {
      for (const [key, item] of priorForJob) ledger.open[key] = item;
      continue;
    }
    const ran = job === 'attention'
      ? (jobs.month?.ids || [])
      : job === 'smoke'
        ? (receipt.routes || []).map((row) => row.route)
        : null;
    const failures = Array.isArray(receipt.failures) ? receipt.failures : [];
    const seen = new Set();
    for (const row of failures) {
      const key = failureKey(job, row);
      seen.add(key);
      const prior = before.open[key];
      ledger.open[key] = {
        job,
        where: row.where,
        reason: row.reason,
        detail: row.detail || '',
        reading: row.reading || '',
        carry: job === 'attention' ? stillFor(row.where, ran || []) : job === 'smoke' ? row.where : '',
        firstSeen: prior?.firstSeen || date,
        lastSeen: date,
        runs: (prior?.runs || 0) + 1,
      };
    }
    for (const [key, item] of priorForJob) {
      if (seen.has(key)) continue;
      const didRun = ran === null || ran.includes(item.carry || item.where);
      if (didRun) cleared.push({ key, job, where: item.where, reason: item.reason, firstSeen: item.firstSeen, cleared: date });
      else ledger.open[key] = item;
    }
  }

  for (const job of ['audit', 'workers']) {
    const receipt = jobs[job];
    const priorForJob = Object.entries(before.decide).filter(([, item]) => item.job === job);
    if (!receipt || receipt.skipped) {
      for (const [key, item] of priorForJob) ledger.decide[key] = item;
      continue;
    }
    const rows = job === 'audit' ? (receipt.failures || []) : (receipt.pending || []);
    for (const row of rows) {
      const key = failureKey(job, row);
      const prior = before.decide[key];
      ledger.decide[key] = {
        job,
        where: row.where,
        reason: row.reason,
        detail: row.detail || '',
        firstSeen: prior?.firstSeen || date,
        lastSeen: date,
      };
    }
  }

  ledger.cleared = [...cleared, ...ledger.cleared].slice(0, 12);
  const open = Object.entries(ledger.open).map(([key, item]) => ({ key, ...item, isNew: !before.open[key] }));
  const decide = Object.entries(ledger.decide).map(([key, item]) => ({ key, ...item, isNew: !before.decide[key] }));
  return { ledger, open, decide, cleared };
}

function cell(value) {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

/**
 * The notice as a page: what is open (new or standing, with how to see it
 * again), what waits on a decision, what cleared, and the day. The workflow
 * writes it to the run's summary, which reads without a login.
 */
export function noticeSummary(notice, folded, { month = null, subjects = null, workers = null } = {}) {
  const lines = [];
  const open = folded?.open || [];
  const decide = folded?.decide || [];
  const cleared = folded?.cleared || [];
  const sha = String(notice?.sha || '').slice(0, 8);
  const fresh = open.filter((item) => item.isNew).length;
  lines.push(`## Drift notice ${sha}`);
  lines.push('');
  lines.push(open.length
    ? `**${open.length} open** (${fresh} new, ${open.length - fresh} standing). A standing failure stays in tonight's run until it passes.`
    : '**Nothing open.**');
  lines.push('');
  if (open.length) {
    lines.push('| | check | where | reason | first seen | runs |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const item of open) {
      const reason = item.reading ? `${item.reason} (${item.reading})` : item.reason;
      lines.push(`| ${item.isNew ? 'new' : 'standing'} | ${JOB_NAMES[item.job] || item.job} | ${cell(item.where)} | ${cell(reason)} | ${item.firstSeen} | ${item.runs} |`);
    }
    lines.push('');
    lines.push('To see one again:');
    lines.push('');
    const commands = [...new Set(open.map((item) => reproduceCommand(item.job, item.carry || item.where)).filter(Boolean))];
    for (const command of commands) lines.push(`- \`${command}\``);
    lines.push('');
  }
  lines.push('### Waiting on a decision');
  lines.push('');
  if (decide.length) {
    for (const item of decide) {
      lines.push(`- ${item.isNew ? '**new** ' : ''}${JOB_NAMES[item.job] || item.job}: ${cell(item.where)} (${cell(item.reason)})${item.detail ? ` · ${cell(item.detail)}` : ''} · since ${item.firstSeen}`);
    }
  } else {
    lines.push('- Nothing.');
  }
  if (workers?.unprobed?.length) lines.push(`- Not fingerprinted yet: ${workers.unprobed.join(', ')}.`);
  lines.push('');
  if (cleared.length) {
    lines.push('### Cleared this run');
    lines.push('');
    for (const item of cleared) lines.push(`- ${JOB_NAMES[item.job] || item.job}: ${cell(item.where)} (${cell(item.reason)}), open since ${item.firstSeen}`);
    lines.push('');
  }
  if (month) {
    lines.push('### The day');
    lines.push('');
    const carried = Array.isArray(month.carried) && month.carried.length ? ` · carried: ${month.carried.join(', ')}` : '';
    const scope = month.whole ? 'the whole month (weekly)' : `day ${month.day}`;
    lines.push(`Stills for ${scope}: ${(month.ids || []).join(', ')}${carried}`);
    if (subjects?.subjects?.length) {
      lines.push('');
      lines.push(`Since yesterday: ${subjects.subjects.length} commit(s).`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

export function assembleNotice({ sha, jobs }) {
  const normalized = {};
  for (const [name, job] of Object.entries(jobs)) {
    normalized[name] = job || { ok: true, skipped: true, failures: [] };
  }
  // ok is drift only: an advisory or a pending worker deploy waits on a
  // decision and does not make the notice fail.
  const ok = Object.entries(normalized)
    .filter(([name]) => name !== 'audit' && name !== 'workers')
    .every(([, job]) => job.skipped || job.ok !== false);
  return { schema: 'drift-notice.v0', sha, ok, jobs: normalized };
}

function readStdin() {
  return readFileSync(0, 'utf8');
}

function flag(args, name) {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] || '';
}

function readJsonFile(file) {
  if (!file) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function main() {
  const [command, ...args] = process.argv.slice(2);
  let receipt;
  if (command === 'smoke') receipt = smokeReceipt(JSON.parse(readStdin() || '{}'));
  else if (command === 'citations') receipt = citationReceipt(JSON.parse(readStdin() || '{}'));
  else if (command === 'audit') receipt = auditReceipt(JSON.parse(readStdin() || '{}'));
  else if (command === 'subjects') receipt = subjectsReceipt(readStdin());
  else if (command === 'carry') {
    const base = String(flag(args, '--base') || '').split(',').map((item) => item.trim()).filter(Boolean);
    const list = carryList(readJsonFile(flag(args, '--ledger')), flag(args, '--job') || '', base);
    process.stdout.write(list.join(','));
    return;
  }
  else if (command === 'assemble') {
    const subjectsFile = flag(args, '--subjects');
    let subjects = null;
    if (subjectsFile) {
      try {
        subjects = subjectsReceipt(readFileSync(subjectsFile, 'utf8'));
      } catch {
        subjects = null;
      }
    }
    receipt = assembleNotice({
      sha: flag(args, '--sha') || '',
      jobs: {
        smoke: readJsonFile(flag(args, '--smoke')),
        plans: readJsonFile(flag(args, '--plans')),
        citations: readJsonFile(flag(args, '--citations')),
        audit: readJsonFile(flag(args, '--audit')),
        attention: readJsonFile(flag(args, '--attention')),
        month: readJsonFile(flag(args, '--month')),
        built: readJsonFile(flag(args, '--built')),
        workers: readJsonFile(flag(args, '--workers')),
        subjects,
      },
    });
    const folded = updateLedger(readJsonFile(flag(args, '--ledger')), receipt.jobs, {
      date: flag(args, '--date') || new Date().toISOString().slice(0, 10),
      sha: receipt.sha,
    });
    receipt.open = folded.open;
    receipt.decide = folded.decide;
    receipt.cleared = folded.cleared;
    const ledgerOut = flag(args, '--ledger-out');
    if (ledgerOut) {
      mkdirSync(path.dirname(path.resolve(ledgerOut)), { recursive: true });
      writeFileSync(ledgerOut, `${JSON.stringify(folded.ledger, null, 2)}\n`);
    }
    const summaryOut = flag(args, '--summary');
    if (summaryOut) {
      mkdirSync(path.dirname(path.resolve(summaryOut)), { recursive: true });
      writeFileSync(summaryOut, noticeSummary(receipt, folded, {
        month: receipt.jobs.month,
        subjects: receipt.jobs.subjects,
        workers: receipt.jobs.workers,
      }));
    }
    const out = flag(args, '--out');
    if (out) {
      mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
      writeFileSync(out, `${JSON.stringify(receipt, null, 2)}\n`);
    }
    const failed = Object.entries(receipt.jobs)
      .filter(([, job]) => job && job.ok === false)
      .map(([name]) => name);
    process.stdout.write(`[drift-notice] ok=${receipt.ok}${failed.length ? ` failed=${failed.join(',')}` : ''}\n`);
    return;
  } else {
    process.stderr.write('usage: drift-notice.mjs smoke|citations|audit|subjects|carry|assemble\n');
    process.exitCode = 2;
    return;
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
