#!/usr/bin/env node
/**
 * audit-braces.mjs — does each brace a route writes keep the brace contract?
 *
 * .spw/conventions/semantic-braces.spw and ornament-contract.spw say what a
 * brace means in markup; nothing read the routes against them. This walks
 * every route and reports five drifts:
 *
 *   open-sigil      a frame sigil that opens a brace (ends in `{`) on a
 *                   host without data-spw-form="brace", so brace-actions
 *                   never mounts and the `{` promises a move that is absent
 *   brace-value     data-spw-brace outside objective | subjective, the two
 *                   values grammar/syntax.css paints (braceBias words such
 *                   as balanced or objective-to-subjective land unpainted)
 *   ornament-host   .spw-ornament-brace on a host without a brace form,
 *                   which ornament-contract.spw forbids
 *   header-sigil    a .header-sigil with no data-spw-operator, so the mark
 *                   that opens the page names no operator
 *   delimiters      .spw-delimiter `{` and `}` counts that do not match
 *
 * The host is the nearest opening tag above the sigil or ornament that
 * carries data-spw-kind, which every frame and panel does. Enrolling a host
 * in the brace form mounts brace-actions there, so open-sigil findings are a
 * browser decision, not a sweep.
 *
 * Reports only; it does not gate check:local. Record: .spw/audits/brace-contract-2026-09.spw
 *
 * Usage: npm run audit:braces [-- --json] [-- --all]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const ROOT = process.cwd();
const IGNORED = [/^design\/components\//, /^design\/catalog\//, /^00\./, /^public\//, /^docs\//, /^workers\//, /^src\//, /^\.\w/];
const PAINTED_BRACES = new Set(['objective', 'subjective']);
const KINDS = ['open-sigil', 'brace-value', 'ornament-host', 'header-sigil', 'delimiters'];

function routeFiles() {
  return execFileSync('git', ['ls-files', '*index.html'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && !IGNORED.some((re) => re.test(file)));
}

function lineAt(html, index) {
  return html.slice(0, index).split('\n').length;
}

function hostBefore(html, index) {
  const before = html.slice(0, index);
  const re = /<(section|article|div|aside|figure|li)\b[^>]*\bdata-spw-kind="[^"]*"[^>]*>/g;
  let host = null;
  for (let match = re.exec(before); match; match = re.exec(before)) host = match[0];
  return host;
}

function isBraceHost(tag) {
  return Boolean(tag && /\bdata-spw-form="brace"/.test(tag));
}

function audit(file) {
  const html = readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, ' '));
  const findings = [];
  const add = (kind, index, note) => findings.push({ kind, file, line: lineAt(html, index), note });

  for (const m of html.matchAll(/<a\b[^>]*class="[^"]*\bframe-sigil\b[^"]*"[^>]*>([^<]*)<\/a>/g)) {
    if (m[1].trim().endsWith('{') && !isBraceHost(hostBefore(html, m.index))) add('open-sigil', m.index, m[1].trim());
  }
  for (const m of html.matchAll(/\bdata-spw-brace="([^"]*)"/g)) {
    if (!PAINTED_BRACES.has(m[1])) add('brace-value', m.index, m[1]);
  }
  for (const m of html.matchAll(/class="[^"]*\bspw-ornament-brace\b[^"]*"/g)) {
    if (!isBraceHost(hostBefore(html, m.index))) add('ornament-host', m.index, 'host lacks data-spw-form="brace"');
  }
  for (const m of html.matchAll(/<a\b[^>]*class="[^"]*\bheader-sigil\b[^"]*"[^>]*>/g)) {
    if (!/\bdata-spw-operator="/.test(m[0])) add('header-sigil', m.index, m[0].match(/href="([^"]*)"/)?.[1] || '');
  }
  const opens = [...html.matchAll(/class="[^"]*\bspw-delimiter\b[^"]*"[^>]*>\s*\{\s*</g)].length;
  const closes = [...html.matchAll(/class="[^"]*\bspw-delimiter\b[^"]*"[^>]*>\s*\}\s*</g)].length;
  if (opens !== closes) add('delimiters', 0, `${opens} { / ${closes} }`);
  return findings;
}

const args = new Set(process.argv.slice(2));
const files = routeFiles();
const findings = files.flatMap(audit);

if (args.has('--json')) {
  process.stdout.write(`${JSON.stringify({ routes: files.length, findings }, null, 2)}\n`);
} else {
  const counts = KINDS.map((kind) => `${findings.filter((f) => f.kind === kind).length} ${kind}`);
  console.log(`[braces] ${files.length} routes; ${counts.join(', ')}`);
  for (const kind of KINDS) {
    const rows = findings.filter((f) => f.kind === kind);
    const shown = args.has('--all') ? rows : rows.slice(0, 8);
    for (const f of shown) console.log(`  ${kind.padEnd(13)} ${f.file}:${f.line}  ${f.note}`);
    if (rows.length > shown.length) console.log(`  ${kind.padEnd(13)} … ${rows.length - shown.length} more (--all)`);
  }
}
