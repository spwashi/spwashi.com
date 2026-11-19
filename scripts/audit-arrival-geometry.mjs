#!/usr/bin/env node
/**
 * audit-arrival-geometry.mjs
 * ---------------------------------------------------------------------------
 * Cross-layer CSS <-> JS arrival geometry contract.
 *
 * Module contracts previously checked attribute naming hygiene without asking
 * whether a passive runtime write (IMMEDIATE | VISIBLE | IDLE | SETTLED | REGION)
 * activates a layout-mutating CSS rule after first paint. This audit joins
 * MODULE_DEFS.updates against authored public/css/ rules and fails whenever a
 * new passive-attr -> CSS-layout coupling appears outside interaction/debug gates.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { MODULE_DEFS } from '../public/js/runtime/catalog/index.js';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_BASELINE_PATH = path.join(ROOT_DIR, 'scripts', 'arrival-geometry-baseline.json');
const PREPAINT_STATE_PATH = path.join(ROOT_DIR, 'public', 'js', 'runtime', 'arrival', 'prepaint-state.js');

export const PASSIVE_MOUNT_PHASES = Object.freeze(new Set([
  'immediate',
  'visible',
  'idle',
  'settled',
  'region',
]));

export const LAYOUT_MUTATING_PROPERTY_RE = /^(container-type|container|display|position|width|height|inline-size|block-size|min-width|max-width|min-height|max-height|min-inline-size|max-inline-size|min-block-size|max-block-size|padding|padding-|margin|margin-|gap|row-gap|column-gap|grid-template|grid-column|grid-row|flex|flex-direction|flex-wrap|align-self|justify-self|font-size|line-height|content)$/;

export const INTERACTION_OR_DEBUG_GATE_RE = /(:hover|:focus|:active|data-spw-gesture|data-spw-debug|data-spw-legible|data-spw-inspect|data-spw-module-visuals="on"|data-spw-capture-mode|data-spw-cognitive-handles="on"|data-spw-show-semantic-metadata="on"|data-spw-feature-learning="on"|data-spw-display-layer="(?:inspect|editor)"|data-state~="active"|data-spw-region-mark|data-spw-region-charge|data-spw-state-inspector|data-spw-cauldron-open|data-spw-open|aria-expanded="true"|aria-pressed="true")/;

function camelToDataAttr(key) {
  return `data-${String(key).replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`;
}

export function collectPrepaintSettledRootAttrs(rootDir = ROOT_DIR) {
  const prepaintFile = rootDir === ROOT_DIR
    ? PREPAINT_STATE_PATH
    : path.join(rootDir, 'public', 'js', 'runtime', 'arrival', 'prepaint-state.js');
  const settled = new Set();
  if (!fs.existsSync(prepaintFile)) return settled;
  const source = fs.readFileSync(prepaintFile, 'utf8');
  for (const m of source.matchAll(/html\.dataset\.(spw[A-Za-z0-9]+)\s*=/g)) {
    settled.add(camelToDataAttr(m[1]));
  }
  return settled;
}

function splitTopLevelSelectors(selector) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i];
    if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    else if (ch === ',' && depth === 0) {
      parts.push(selector.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(selector.slice(start).trim());
  return parts.filter(Boolean);
}

export function isOutOfFlowPseudoRule(selector, declMap) {
  const pos = (declMap.get('position') || '').replace(/\s*!important\s*$/i, '').trim().toLowerCase();
  if (pos !== 'absolute' && pos !== 'fixed') return false;
  const branches = splitTopLevelSelectors(selector);
  return branches.length > 0 && branches.every((branch) => /::(?:before|after)\s*$/.test(branch));
}

export function collectPassiveRuntimeAttrs(catalog = MODULE_DEFS, { prepaintSettled = null } = {}) {
  const attrOwners = new Map();
  for (const def of catalog) {
    if (!PASSIVE_MOUNT_PHASES.has(def?.when)) continue;
    for (const upd of def.updates || []) {
      const match = String(upd).match(/(data-spw-[a-z0-9-]+)/);
      if (!match) continue;
      const attr = match[1];
      if (!attrOwners.has(attr)) attrOwners.set(attr, []);
      attrOwners.get(attr).push(`${def.id}(${def.when})`);
    }
  }
  if (prepaintSettled && prepaintSettled.size > 0) {
    for (const [attr, owners] of [...attrOwners.entries()]) {
      const unique = [...new Set(owners)];
      if (prepaintSettled.has(attr) && unique.length === 1 && unique[0] === 'site-settings(immediate)') {
        attrOwners.delete(attr);
      }
    }
  }
  return attrOwners;
}

export function analyzeCssSource(cssText, attrOwners, fileLabel = '<inline>') {
  const cleaned = String(cssText || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const hits = new Map();
  const ruleRe = /([^{}@;]+)\{([^{}]+)\}/g;
  let match;

  const attrMatchers = [...attrOwners.entries()].map(([attr, owners]) => [
    attr,
    owners,
    new RegExp(`\\[${attr}(?=[\\]=~|^$*\\s])`),
  ]);

  while ((match = ruleRe.exec(cleaned))) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    const body = match[2];
    if (!selector || INTERACTION_OR_DEBUG_GATE_RE.test(selector)) continue;

    const props = [];
    const declMap = new Map();
    for (const decl of body.split(';')) {
      const idx = decl.indexOf(':');
      if (idx < 0) continue;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      declMap.set(prop, val);
      if (LAYOUT_MUTATING_PROPERTY_RE.test(prop)) props.push(prop);
    }
    if (!props.length) continue;
    if (isOutOfFlowPseudoRule(selector, declMap)) continue;

    for (const [attr, owners, attrRe] of attrMatchers) {
      if (!attrRe.test(selector)) continue;
      const key = `${attr} :: ${fileLabel}`;
      if (!hits.has(key)) {
        hits.set(key, {
          key,
          attr,
          file: fileLabel,
          owners: [...new Set(owners)].sort(),
          count: 0,
          props: new Set(),
        });
      }
      const row = hits.get(key);
      row.count += 1;
      for (const prop of props) row.props.add(prop);
    }
  }

  return [...hits.values()].map((row) => ({
    key: row.key,
    attr: row.attr,
    file: row.file,
    count: row.count,
    props: [...row.props].sort(),
    owners: row.owners,
  }));
}

function walkAuthoredCss(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'bundles') continue;
      walkAuthoredCss(full, out);
    } else if (entry.name.endsWith('.css')) {
      out.push(full);
    }
  }
  return out;
}

export function scanArrivalGeometry({ rootDir = ROOT_DIR, catalog = MODULE_DEFS } = {}) {
  const prepaintSettled = collectPrepaintSettledRootAttrs(rootDir);
  const attrOwners = collectPassiveRuntimeAttrs(catalog, { prepaintSettled });
  const cssDir = path.join(rootDir, 'public', 'css');
  const cssFiles = walkAuthoredCss(cssDir).sort();
  const findings = [];

  for (const absFile of cssFiles) {
    const rel = path.relative(rootDir, absFile).split(path.sep).join('/');
    if (rel === 'public/css/effects/debug.css' || rel === 'public/css/modes/capture.css') continue;
    const cssText = fs.readFileSync(absFile, 'utf8');
    findings.push(...analyzeCssSource(cssText, attrOwners, rel));
  }

  findings.sort((a, b) => a.key.localeCompare(b.key));
  return {
    passiveAttrCount: attrOwners.size,
    cssFilesScanned: cssFiles.length,
    findings,
  };
}

export function diffAgainstBaseline(findings, baselineEntries = {}) {
  const added = [];
  const grown = [];
  const resolved = [];
  const held = [];
  const liveByKey = new Map(findings.map((row) => [row.key, row]));

  for (const row of findings) {
    const baseCount = baselineEntries[row.key];
    if (baseCount === undefined) {
      added.push(row);
    } else if (row.count > baseCount) {
      grown.push({ ...row, baselineCount: baseCount });
    } else {
      held.push(row);
    }
  }

  for (const key of Object.keys(baselineEntries)) {
    if (!liveByKey.has(key)) resolved.push(key);
  }

  return { added, grown, resolved, held };
}

function runCli() {
  const args = new Set(process.argv.slice(2));
  const asJson = args.has('--json');
  const updateBaseline = args.has('--update-baseline');
  const strict = args.has('--strict');

  const scan = scanArrivalGeometry();
  const entries = Object.fromEntries(scan.findings.map((row) => [row.key, row.count]));

  if (updateBaseline) {
    const payload = {
      generatedAt: new Date().toISOString().slice(0, 10),
      note: 'Held passive runtime-attr -> CSS layout couplings. Shrink toward zero; never grow.',
      entries,
    };
    fs.writeFileSync(DEFAULT_BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`[audit:arrival-geometry] updated baseline: ${scan.findings.length} couplings across ${scan.passiveAttrCount} passive attrs`);
    return;
  }

  const baseline = fs.existsSync(DEFAULT_BASELINE_PATH)
    ? JSON.parse(fs.readFileSync(DEFAULT_BASELINE_PATH, 'utf8'))
    : { entries: {} };
  const diff = diffAgainstBaseline(scan.findings, baseline.entries || {});
  const failed = strict
    ? scan.findings.length > 0
    : diff.added.length > 0 || diff.grown.length > 0;

  if (asJson) {
    console.log(JSON.stringify({
      ok: !failed,
      passiveAttrCount: scan.passiveAttrCount,
      cssFilesScanned: scan.cssFilesScanned,
      totalCouplings: scan.findings.length,
      held: diff.held.length,
      resolved: diff.resolved.length,
      added: diff.added,
      grown: diff.grown,
    }, null, 2));
  } else {
    if (diff.added.length) {
      console.error('[audit:arrival-geometry] NEW passive runtime-attr -> CSS layout couplings:');
      for (const row of diff.added) {
        console.error(`  + ${row.count}x ${row.key} (${row.props.join(', ')}) <- ${row.owners.join(', ')}`);
      }
    }
    if (diff.grown.length) {
      console.error('[audit:arrival-geometry] GROWN passive runtime-attr -> CSS layout couplings:');
      for (const row of diff.grown) {
        console.error(`  ^ ${row.baselineCount}->${row.count}x ${row.key} (${row.props.join(', ')}) <- ${row.owners.join(', ')}`);
      }
    }
    const status = failed ? 'failed' : 'ok';
    const note = diff.resolved.length ? ` · ${diff.resolved.length} resolved (shrink baseline)` : '';
    console.log(`[audit:arrival-geometry] ${status} — ${diff.held.length} held · ${diff.added.length} new · ${diff.grown.length} grown${note} · ${scan.passiveAttrCount} passive attrs`);
  }

  if (failed) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
