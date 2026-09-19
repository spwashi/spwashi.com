#!/usr/bin/env node
/**
 * audit-operator-controls.mjs
 *
 * Reads every operator control in the authored routes — a <button> or <a>
 * that is a chip or sigil, or any element carrying data-spw-operator — and
 * checks three things the runtime cannot repair for a reader with JS off:
 *
 *   grammar     the visible label follows the chip grammar
 *               (.spw/conventions/operator-chip-grammar.spw): a sigil binds
 *               tight to its noun, actions take !verb[target], # and ? may
 *               carry spaced prose.
 *   agreement   when a label opens with a sigil and the element also authors
 *               data-spw-operator, the two name the same operator. The kernel
 *               table (public/js/kernel/operator-detection.js) is the canon;
 *               atlas slugs such as ref, probe, object resolve through its
 *               alias map, so "ref" agrees with ~ and "probe" with ?.
 *   missing     a control whose label opens with a sigil but authors no
 *               data-spw-operator. The operators module backfills it after
 *               boot, so the CSS rails keyed on the attribute only reach the
 *               control once JS has run. HTML carries the reading; the
 *               attribute belongs in the markup.
 *
 * Generated surfaces (the design catalog, capture runs) are skipped: their
 * controls come from scripts, and the scripts are where a fix would land.
 *
 *   node --import ./scripts/lib/register-public-imports.mjs scripts/audit-operator-controls.mjs [--check] [--strict] [--json] [--list=<category>]
 *
 *   --check   exit 1 on any agreement or missing finding
 *   --strict  also exit 1 on spaced-violation grammar findings
 *   --json    print the full report as JSON
 *   --list    print every finding in one category (grammar categories,
 *             disagreement, missing)
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  OPERATOR_PREFIX_RE,
  detectOperator,
  getOperatorDefinition,
} from '/public/js/kernel/operator-detection.js';

const PROJECT_ROOT = process.cwd();
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'dist-vite', '.spw', '.references', '_partials', 'renders', '_workbench']);
const GENERATED_PREFIXES = ['design/catalog/', 'design/components/captures/'];

const INLINE_PAYLOAD_OPERATORS = new Set(['#', '?']);
const CONTAINER_START = new Set(['[', '{', '(', '<']);

/* Controls the audit reads even when they author no operator. */
const CONTROL_CLASS_RE = /\b(spw-chip|frame-sigil|frame-card-sigil|frame-panel-sigil|spec-pill|frame-prompt-copy|profile-export-btn|specimen-lens-btn|spw-effect-chip|operator-chip)\b/;

/* Hosts whose own text is the token. A block host (div, section, li) that
   authors an operator describes its children; its first child's sigil is not
   its own, so agreement is not asked of it. */
const TOKEN_HOST_TAGS = new Set(['button', 'a', 'span', 'strong', 'em', 'i', 'b', 'code', 'kbd', 'mark', 'small', 'time', 'label', 'summary', 'dt']);

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const listCategory = (args.find((entry) => entry.startsWith('--list=')) || '').slice('--list='.length);

function decodeEntities(str) {
  return str
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function visibleText(innerHtml) {
  return decodeEntities(innerHtml.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function attribute(attrs, name) {
  const match = attrs.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`));
  return match ? match[1] : null;
}

function categorizeGrammar(text) {
  const prefix = (text.match(OPERATOR_PREFIX_RE) || [])[0] || null;
  if (!prefix) return 'prose';
  if (CONTAINER_START.has(prefix)) return 'container';
  const rest = text.slice(prefix.length);
  if (rest.length > 0 && /\s/.test(rest[0])) {
    return INLINE_PAYLOAD_OPERATORS.has(prefix) ? 'inline-payload' : 'spaced-violation';
  }
  return 'tight';
}

function findRouteFiles(dir, fileList = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return fileList;
  }
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) findRouteFiles(filePath, fileList);
    else if (entry.name === 'index.html') fileList.push(filePath);
  }
  return fileList;
}

function isGenerated(rel) {
  return GENERATED_PREFIXES.some((prefix) => rel.startsWith(prefix));
}

/* Matches a start tag and its balanced-enough body for button/a. Anchors and
   buttons do not nest in authored markup, so a non-greedy close is safe. */
const CONTROL_RE = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g;
const OPERATOR_HOST_RE = /<([a-z][a-z0-9-]*)\b([^>]*\bdata-spw-operator="[^"]*"[^>]*)>([\s\S]*?)<\/\1>/g;

function lineOf(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function readRoute(file) {
  const rel = path.relative(PROJECT_ROOT, file);
  const source = fs.readFileSync(file, 'utf8');
  const findings = [];
  const seen = new Set();

  const consider = (tag, attrs, inner, offset, { control }) => {
    const key = offset;
    if (seen.has(key)) return;
    seen.add(key);
    const text = visibleText(inner);
    const authored = attribute(attrs, 'data-spw-operator');
    /* A composite control keeps its sigil in a child element and follows it
       with prose (a tab, a card link). The chip grammar is not asked of it;
       the host still carries the operator its sigil names. */
    const sigilChild = /^\s*<(span|strong|b|i|code)\b[^>]*>\s*(#>|#|\.|\^|~|\?|@|\*|&|=|\$|%|!|>|<|&gt;|&lt;)+\s*<\/\1>/.test(inner);
    const composite = sigilChild && /<\/(span|strong|b|i|code)>\s*\S/.test(inner);
    const isControl = control && (CONTROL_CLASS_RE.test(attribute(attrs, 'class') || '') || authored !== null);
    if (!isControl && authored === null) return;

    const sigilOp = text ? detectOperator(text) : null;
    const authoredOp = authored ? getOperatorDefinition(authored) : null;
    const grammar = isControl ? (composite ? 'composite' : categorizeGrammar(text)) : null;
    const record = {
      file: rel,
      line: lineOf(source, offset),
      tag,
      text: text.slice(0, 60),
      className: attribute(attrs, 'class') || '',
      offset,
      tagEnd: offset + `<${tag}${attrs}>`.length,
      authored,
      sigil: sigilOp?.type || null,
      grammar,
    };

    if (grammar) findings.push({ ...record, category: grammar });
    if (authored && !authoredOp) findings.push({ ...record, category: 'unknown-operator' });
    /* An expression may name its transformation infix ($sticker>$scene reads
       the projection, not the substrate); an authored operator whose sigil
       appears past the prefix agrees by infix. */
    const infixAgrees = authoredOp?.prefix && text.slice(1).includes(authoredOp.prefix);
    if (TOKEN_HOST_TAGS.has(tag) && sigilOp && authoredOp && sigilOp.type !== authoredOp.type && !infixAgrees) {
      findings.push({ ...record, category: 'disagreement', resolved: authoredOp.type });
    }
    if (isControl && sigilOp && authored === null && (tag === 'button' || tag === 'a')) {
      findings.push({ ...record, category: 'missing' });
    }
  };

  for (const match of source.matchAll(CONTROL_RE)) {
    consider(match[1], match[2], match[3], match.index, { control: true });
  }
  for (const match of source.matchAll(OPERATOR_HOST_RE)) {
    if (match[1] === 'button' || match[1] === 'a') continue;
    consider(match[1], match[2], match[3], match.index, { control: false });
  }
  return findings;
}

function run() {
  const files = findRouteFiles(PROJECT_ROOT)
    .filter((file) => !isGenerated(path.relative(PROJECT_ROOT, file)));
  const findings = files.flatMap(readRoute);
  const counts = {};
  for (const finding of findings) counts[finding.category] = (counts[finding.category] || 0) + 1;

  const byFile = (category) => {
    const map = new Map();
    for (const finding of findings) {
      if (finding.category !== category) continue;
      map.set(finding.file, (map.get(finding.file) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const report = {
    routes: files.length,
    controls: findings.filter((entry) => entry.grammar).length,
    counts,
    disagreement: findings.filter((entry) => entry.category === 'disagreement'),
    missing: findings.filter((entry) => entry.category === 'missing'),
    spaced: findings.filter((entry) => entry.category === 'spaced-violation'),
    unknown: findings.filter((entry) => entry.category === 'unknown-operator'),
  };

  if (flag('json')) {
    console.log(JSON.stringify({ ...report, findings }, null, 2));
  } else if (listCategory) {
    for (const finding of findings.filter((entry) => entry.category === listCategory)) {
      const extra = finding.category === 'disagreement'
        ? ` sigil=${finding.sigil} authored=${finding.authored}→${finding.resolved}`
        : (finding.authored ? ` authored=${finding.authored}` : '');
      console.log(`${finding.file}:${finding.line} <${finding.tag}> "${finding.text}"${extra}`);
    }
  } else {
    console.log('--- Operator Controls Audit ---');
    console.log(`Routes scanned: ${report.routes} (generated catalog and capture runs skipped)`);
    console.log(`Controls read:  ${report.controls}\n`);
    console.log('Grammar:');
    for (const category of ['tight', 'container', 'inline-payload', 'composite', 'prose', 'spaced-violation']) {
      console.log(`  ${category.padEnd(18)} ${counts[category] || 0}`);
    }
    console.log('\nOperator attribute:');
    console.log(`  ${'disagreement'.padEnd(18)} ${counts.disagreement || 0}   sigil and data-spw-operator name different operators`);
    console.log(`  ${'missing'.padEnd(18)} ${counts.missing || 0}   sigil-led control with no data-spw-operator`);
    console.log(`  ${'unknown-operator'.padEnd(18)} ${counts['unknown-operator'] || 0}   value the kernel table cannot resolve`);
    for (const category of ['disagreement', 'missing', 'spaced-violation']) {
      const rows = byFile(category);
      if (!rows.length) continue;
      console.log(`\n${category} by route:`);
      for (const [file, count] of rows.slice(0, 20)) console.log(`  ${String(count).padStart(3)}  ${file}`);
      if (rows.length > 20) console.log(`  … ${rows.length - 20} more routes (--list=${category})`);
    }
  }

  const failing = report.disagreement.length + report.missing.length + report.unknown.length
    + (flag('strict') ? report.spaced.length : 0);
  if (flag('check') && failing) {
    console.error(`\n[audit-operator-controls] ${failing} finding(s) fail --check${flag('strict') ? ' --strict' : ''}.`);
    process.exit(1);
  }
}

run();
