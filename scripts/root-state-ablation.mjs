#!/usr/bin/env node
/**
 * Does the page look any different without these root tokens? Measured.
 *
 * Before a runtime stops writing a token to <html> or <body>, or a rule moves
 * from one root to the other, the question is whether any element's computed
 * style depends on that token where it sits now. This loads a route from
 * source in headless Chrome, waits for arrival to go quiet, freezes
 * transitions and animations, and in one synchronous pass: reads the computed
 * style of every element and its ::before and ::after, removes the tokens,
 * reads again, restores them, and names each element and property that moved
 * and the token that moved it. No script runs between the reads, so the
 * answer is the cascade's alone; a script that reads the token is a separate,
 * static question.
 *
 * Token sets:
 *   body-mirror   every attribute and inline custom property on <body> that
 *                 <html> carries with the same value and the HTML did not author
 *   root-modules  the loader's per-module annotation on <html> and <body>
 *                 (data-spw-module-*, data-spw-feature-mount-trigger,
 *                 data-spw-region-state) that the HTML did not author
 *   html-to-body  the reverse: copy onto <body> every <html> token it lacks
 *                 that the HTML did not author, as a runtime that wrote both
 *                 roots would. After moving state to <html> alone, this set
 *                 moving nothing means the move changed nothing.
 *   side:name     one token, e.g. body:data-spw-capture-mode or html:--spw-x
 *
 *   npm run audit:root-ablation
 *   npm run audit:root-ablation -- --routes /,/about/ --sets body-mirror,root-modules
 *   npm run audit:root-ablation -- --sets body:data-spw-reading-groove --json
 *
 * Exit: 0 every set inert · 1 a set moved some element's style · 2 no browser
 * or runtime · 3 loopback unavailable.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const MODULE_ANNOTATION_PATTERN = /^data-spw-(module(-|$)|feature-mount-trigger$|region-state$)/;

/**
 * Runs before any page script: records the attributes the parser gave <html>
 * and <body>, so a set can leave authored markup alone.
 */
export const AUTHORED_ROOTS_SOURCE = `(() => {
  if (window.__spwAuthoredRoots) return;
  const authored = { html: null, body: null };
  window.__spwAuthoredRoots = authored;
  const take = () => {
    if (!authored.html && document.documentElement) authored.html = document.documentElement.getAttributeNames();
    if (!authored.body && document.body) authored.body = document.body.getAttributeNames();
    return authored.html && authored.body;
  };
  if (take()) return;
  const watcher = new MutationObserver(() => { if (take()) watcher.disconnect(); });
  watcher.observe(document, { childList: true, subtree: true });
})()`;

/**
 * Pure: which tokens a set names, given what each root carries now.
 * `roots` is { html: { attrs: {name: value}, props: {name: value} }, body: … };
 * `authored` is { html: [names], body: [names] }. Returns [{ side, kind, name }].
 */
export function resolveAblationSet(spec, roots, authored = { html: [], body: [] }) {
  const authoredOn = (side) => new Set(authored?.[side] || []);
  const tokens = [];
  if (spec === 'body-mirror') {
    const kept = authoredOn('body');
    for (const [name, value] of Object.entries(roots.body?.attrs || {})) {
      if (kept.has(name) || !name.startsWith('data-')) continue;
      if (roots.html?.attrs?.[name] === value) tokens.push({ side: 'body', kind: 'attr', name });
    }
    for (const [name, value] of Object.entries(roots.body?.props || {})) {
      if (roots.html?.props?.[name] === value) tokens.push({ side: 'body', kind: 'prop', name });
    }
    return tokens;
  }
  if (spec === 'html-to-body') {
    const kept = authoredOn('html');
    for (const [name, value] of Object.entries(roots.html?.attrs || {})) {
      if (kept.has(name) || !name.startsWith('data-') || Object.hasOwn(roots.body?.attrs || {}, name)) continue;
      tokens.push({ side: 'body', kind: 'attr', name, op: 'add', value });
    }
    for (const [name, value] of Object.entries(roots.html?.props || {})) {
      if (!Object.hasOwn(roots.body?.props || {}, name)) tokens.push({ side: 'body', kind: 'prop', name, op: 'add', value });
    }
    return tokens;
  }
  if (spec === 'root-modules') {
    for (const side of ['html', 'body']) {
      const kept = authoredOn(side);
      for (const name of Object.keys(roots[side]?.attrs || {})) {
        if (!kept.has(name) && MODULE_ANNOTATION_PATTERN.test(name)) tokens.push({ side, kind: 'attr', name });
      }
    }
    return tokens;
  }
  const match = String(spec).match(/^(html|body):(.+)$/);
  if (!match) throw new Error(`unknown token set "${spec}": use body-mirror, root-modules, or html:name / body:name`);
  const [, side, name] = match;
  const kind = name.startsWith('--') ? 'prop' : 'attr';
  const present = kind === 'prop' ? roots[side]?.props?.[name] : roots[side]?.attrs?.[name];
  return present === undefined ? [] : [{ side, kind, name }];
}

/**
 * In-page, synchronous. Takes the resolved tokens and returns which elements
 * moved, how, and under which token. Kept as a string so it ships to the page
 * unchanged; it has no imports.
 */
export const ABLATION_PAGE_SOURCE = `((tokens, sampleLimit) => {
  const started = performance.now();
  const roots = { html: document.documentElement, body: document.body };
  const PSEUDOS = [null, '::before', '::after'];
  const freeze = document.createElement('style');
  freeze.textContent = '*,*::before,*::after{transition:none!important;animation-play-state:paused!important}';
  document.head.append(freeze);
  for (const animation of document.getAnimations()) animation.pause();
  const elements = Array.from(document.querySelectorAll('*')).filter((el) => el !== freeze);
  // Standard properties only: a custom property reaches the screen through
  // one of them, and the site defines thousands, which would make each read
  // ten times slower without adding an answer.
  const rootStyle = getComputedStyle(document.documentElement);
  const NAMES = [];
  for (let i = 0; i < rootStyle.length; i += 1) if (!rootStyle[i].startsWith('--')) NAMES.push(rootStyle[i]);
  const read = (el, pseudo) => {
    const cs = getComputedStyle(el, pseudo);
    if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return 'none';
    let text = '';
    for (const name of NAMES) text += name + ':' + cs.getPropertyValue(name) + ';';
    return text;
  };
  const hash = (text) => {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  const remove = (list) => list.map((token) => {
    const el = roots[token.side];
    if (token.op === 'add') {
      if (token.kind === 'prop') {
        el.style.setProperty(token.name, token.value);
        return () => el.style.removeProperty(token.name);
      }
      el.setAttribute(token.name, token.value);
      return () => el.removeAttribute(token.name);
    }
    if (token.kind === 'prop') {
      const value = el.style.getPropertyValue(token.name);
      const priority = el.style.getPropertyPriority(token.name);
      el.style.removeProperty(token.name);
      return () => el.style.setProperty(token.name, value, priority);
    }
    const value = el.getAttribute(token.name);
    el.removeAttribute(token.name);
    return () => el.setAttribute(token.name, value);
  });
  const restore = (undo) => { for (const fn of undo.reverse()) fn(); };

  const before = new Map();
  elements.forEach((el, index) => PSEUDOS.forEach((pseudo) => before.set(index + '|' + pseudo, hash(read(el, pseudo)))));
  const readMs = performance.now() - started;

  let undo = remove(tokens);
  const moved = [];
  const afterText = new Map();
  elements.forEach((el, index) => PSEUDOS.forEach((pseudo) => {
    const key = index + '|' + pseudo;
    const text = read(el, pseudo);
    if (hash(text) !== before.get(key)) { moved.push(key); afterText.set(key, text); }
  }));
  restore(undo);

  const parse = (text) => {
    const map = new Map();
    for (const part of text.split(';')) {
      const at = part.indexOf(':');
      if (at > 0) map.set(part.slice(0, at), part.slice(at + 1));
    }
    return map;
  };
  const label = (el) => {
    const parts = [];
    for (let node = el; node && parts.length < 3; node = node.parentElement) {
      let part = node.localName;
      if (node.id) part += '#' + node.id;
      else if (node.classList.length) part += '.' + node.classList[0];
      parts.unshift(part);
      if (node.id) break;
    }
    return parts.join(' > ');
  };
  const rows = moved.map((key) => {
    const [index, pseudoKey] = key.split('|');
    const pseudo = pseudoKey === 'null' ? null : pseudoKey;
    const el = elements[Number(index)];
    const was = parse(read(el, pseudo));
    const now = parse(afterText.get(key));
    const props = [];
    for (const name of new Set([...was.keys(), ...now.keys()])) {
      if (was.get(name) !== now.get(name)) props.push({ name, before: was.get(name) ?? null, after: now.get(name) ?? null });
    }
    return { key, el: label(el), pseudo, props, tokens: [] };
  });

  // A row that does not come back after the restore moved for some other
  // reason (layout that depends on its own history, such as scroll anchoring);
  // it is reported as unstable and left out of attribution.
  const rowRead = (row) => {
    const [index, pseudoKey] = row.key.split('|');
    return hash(read(elements[Number(index)], pseudoKey === 'null' ? null : pseudoKey));
  };
  for (const row of rows) row.unstable = rowRead(row) !== before.get(row.key);
  const stable = rows.filter((row) => !row.unstable);

  // Attribution by halving: remove half the tokens, keep the rows that still
  // move, and split again until one token is left. A few culprits among a
  // hundred tokens cost a dozen rounds instead of a hundred. A row that moves
  // only when tokens from both halves are gone stays unattributed.
  const attribute = (list, candidates) => {
    if (!candidates.length) return;
    if (list.length === 1) {
      for (const row of candidates) row.tokens.push(list[0].side + ':' + list[0].name);
      return;
    }
    const half = Math.ceil(list.length / 2);
    for (const part of [list.slice(0, half), list.slice(half)]) {
      const partUndo = remove(part);
      const still = candidates.filter((row) => rowRead(row) !== before.get(row.key));
      restore(partUndo);
      attribute(part, still);
    }
  };
  attribute(tokens, stable);

  freeze.remove();
  for (const animation of document.getAnimations()) animation.play();
  const byToken = {};
  for (const row of stable) {
    for (const token of row.tokens.length ? row.tokens : ['(only together)']) {
      const entry = byToken[token] || (byToken[token] = { elements: 0, props: {} });
      entry.elements += 1;
      for (const prop of row.props) entry.props[prop.name] = (entry.props[prop.name] || 0) + 1;
    }
  }
  return {
    elements: elements.length,
    tokens: tokens.map((token) => token.side + ':' + token.name),
    moved: stable.length,
    unstable: rows.length - stable.length,
    byToken,
    rows: stable.slice(0, sampleLimit).map(({ key, unstable, ...row }) => ({ ...row, props: row.props.slice(0, 8) })),
    unstableRows: rows.filter((row) => row.unstable).slice(0, 8).map(({ key, unstable, tokens, ...row }) => ({ ...row, props: row.props.slice(0, 4) })),
    readMs: Math.round(readMs),
    totalMs: Math.round(performance.now() - started),
  };
})`;

const READ_ROOTS_SOURCE = `(() => {
  const side = (el) => {
    const attrs = {};
    for (const name of el.getAttributeNames()) attrs[name] = el.getAttribute(name);
    const props = {};
    for (let i = 0; i < el.style.length; i += 1) {
      const name = el.style[i];
      if (name.startsWith('--')) props[name] = el.style.getPropertyValue(name);
    }
    return { attrs, props };
  };
  return {
    roots: { html: side(document.documentElement), body: side(document.body) },
    authored: window.__spwAuthoredRoots || { html: [], body: [] },
  };
})()`;

/**
 * Orders a set's per-token tally (built in the page over every moved row, not
 * only the sampled ones): most elements first, each token's properties by
 * how many elements they moved on.
 */
export function summarizeAblation(result = {}) {
  return Object.entries(result.byToken || {})
    .map(([token, entry]) => ({
      token,
      elements: entry.elements,
      props: Object.entries(entry.props).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name),
    }))
    .sort((a, b) => b.elements - a.elements || a.token.localeCompare(b.token));
}

export function formatAblation(route, set, result) {
  const unstable = result.unstable ? `, ${result.unstable} unstable` : '';
  const lines = [`${route}  ${set}: ${result.tokens.length} token(s), ${result.elements} elements, ${result.moved} moved${unstable}  (${result.totalMs}ms)`];
  if (!result.moved) return lines.join('\n');
  for (const entry of summarizeAblation(result)) {
    lines.push(`  ${entry.token}  ${entry.elements} element(s)  ${entry.props.slice(0, 6).join(', ')}`);
  }
  for (const row of (result.rows || []).slice(0, 6)) {
    const prop = row.props[0];
    lines.push(`    ${row.el}${row.pseudo || ''}  ${prop ? `${prop.name}: ${prop.before} → ${prop.after}` : ''}`);
  }
  return lines.join('\n');
}

function flag(args, name) {
  const at = args.indexOf(name);
  if (at >= 0) return args[at + 1];
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return inline ? inline.slice(name.length + 1) : null;
}

async function main() {
  const args = process.argv.slice(2);
  const say = (line) => process.stderr.write(`[root-ablation] ${line}\n`);
  const harness = await import('./lib/chrome-headless-harness.mjs');
  const { checkLoopback } = await import('./qa-doctor.mjs');

  const routes = (flag(args, '--routes') || '/').split(',').map((route) => route.trim()).filter(Boolean);
  const sets = (flag(args, '--sets') || 'body-mirror,root-modules').split(',').map((set) => set.trim()).filter(Boolean);
  const observeMs = Number(flag(args, '--observe')) || 12000;
  const quietMs = Number(flag(args, '--quiet')) || 6000;
  const maxObserveMs = Math.max(observeMs, Number(flag(args, '--max-observe')) || 90000);
  const sampleLimit = Number(flag(args, '--samples')) || 40;
  const evaluateMs = Number(flag(args, '--evaluate-timeout')) || 600000;
  const receiptFile = flag(args, '--receipt');

  const loopback = await checkLoopback();
  if (!loopback.ok) {
    say(loopback.detail);
    say(`→ ${loopback.next}`);
    return 3;
  }
  const chromePath = await harness.resolveChrome(flag(args, '--chrome'));
  if (!chromePath || typeof WebSocket === 'undefined') {
    say(chromePath ? 'global WebSocket unavailable (Node 22+ required for CDP)' : 'Chrome/Chromium not found');
    return 2;
  }

  let devChild = null;
  let chromeChild = null;
  const shutdown = harness.installShutdown([
    () => harness.killProcessTree(chromeChild),
    () => harness.killProcessTree(devChild),
  ]);

  try {
    let base = (flag(args, '--base') || '').replace(/\/$/, '');
    if (!base) {
      const spawned = harness.spawnDevServer(await harness.pickFreePort());
      devChild = spawned.child;
      base = await spawned.ready;
    }
    say(`source at ${base}; sets ${sets.join(', ')}; arrival watched until ${quietMs}ms pass with no new mount`);

    const debugPort = 9333 + Math.floor(Math.random() * 400);
    chromeChild = await harness.openChrome(chromePath, await harness.createChromeProfileDir('spw-ablate-'), debugPort);

    const report = { schema: 'root-state-ablation.v0', routes: {} };
    let moved = false;
    for (const route of routes) {
      const target = await harness.newPageTarget(debugPort);
      const session = new harness.CdpSession(target.webSocketDebuggerUrl);
      await session.open();
      try {
        await session.send('Page.enable');
        await session.send('Page.addScriptToEvaluateOnNewDocument', { source: AUTHORED_ROOTS_SOURCE });
        await harness.navigateAndProbe(session, { url: `${base}${route}`, settleMs: 10000, timeoutMs: 45000, logBrowser: false });
        const startedAt = Date.now();
        let lastCount = -1;
        let lastChangeAt = Date.now();
        while (Date.now() - startedAt < maxObserveMs) {
          await harness.sleep(1500);
          const count = await harness.evaluateProbe(session, `(window.__SPW_SITE__?.snapshotModules?.() || []).filter((row) => row.status === 'mounted').length`, 20000).catch(() => lastCount);
          if (count !== lastCount) {
            lastCount = count;
            lastChangeAt = Date.now();
          }
          if (Date.now() - startedAt >= observeMs && Date.now() - lastChangeAt >= quietMs) break;
        }
        const { roots, authored } = await harness.evaluateProbe(session, READ_ROOTS_SOURCE, 20000);
        report.routes[route] = { mounted: lastCount, sets: {} };
        for (const set of sets) {
          const tokens = resolveAblationSet(set, roots, authored);
          const result = tokens.length
            ? await harness.evaluateProbe(session, `${ABLATION_PAGE_SOURCE}(${JSON.stringify(tokens)}, ${sampleLimit})`, evaluateMs)
            : { elements: 0, tokens: [], moved: 0, byToken: {}, rows: [], readMs: 0, totalMs: 0 };
          report.routes[route].sets[set] = { ...result, summary: summarizeAblation(result) };
          if (result.moved) moved = true;
          if (!args.includes('--json')) process.stdout.write(`${formatAblation(route, set, result)}\n`);
        }
      } finally {
        session.close();
        await harness.closePageTarget(debugPort, target);
      }
    }

    if (receiptFile) {
      mkdirSync(path.dirname(path.resolve(receiptFile)), { recursive: true });
      writeFileSync(receiptFile, `${JSON.stringify(report, null, 2)}\n`);
    }
    if (args.includes('--json')) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return moved ? 1 : 0;
  } finally {
    shutdown();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code), (error) => {
    process.stderr.write(`[root-ablation] ${error?.stack || error}\n`);
    process.exit(2);
  });
}
