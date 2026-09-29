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
 *     --attention attention-receipt.json --subjects subjects.txt
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

export function assembleNotice({ sha, jobs }) {
  const normalized = {};
  for (const [name, job] of Object.entries(jobs)) {
    normalized[name] = job || { ok: true, skipped: true, failures: [] };
  }
  const ok = Object.values(normalized).every((job) => job.skipped || job.ok !== false);
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
        subjects,
      },
    });
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
    process.stderr.write('usage: drift-notice.mjs smoke|citations|audit|subjects|assemble\n');
    process.exitCode = 2;
    return;
  }
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
