#!/usr/bin/env node
/**
 * audit-page-structure.mjs — does each route close what it opens, and can
 * each part of it be addressed?
 *
 * A browser forgives an unclosed <section> by nesting everything after it
 * inside, so a frame can swallow the rest of a page and still render. This
 * walks the tags inside <main> of every tracked route with a stack and
 * reports the forgiveness, then counts a few things an editor needs in order
 * to point at a part of a page:
 *
 *   unbalanced   a tag never closed, or a close with nothing open
 *   raw-capsule  an unknown tag such as <offer>: a Spw capsule written as
 *                text without &lt; &gt;, which browsers drop
 *   heading-skip a heading more than one level below the one before it
 *   section-id   a section labelled by "<name>-title" with no id of its own
 *   img-size     an <img> without width and height, so its room is not reserved
 *   button-type  a <button> with no type
 *   script-only  a <button> outside a form, without popovertarget or
 *                commandfor, that the markup does not hide: with scripts off
 *                it offers a press nothing answers. The note names the hook
 *                a script would answer (data-site-setting-set, data-set-mode…).
 *                Without scripts, modes/hydration.css withdraws lens switches
 *                (data-set-mode), which never count, and shows settings
 *                chips switched off, so a group of them counts only when no
 *                scripts-off note follows it
 *
 * Reports only; it does not gate check:local. Record:
 * .spw/audits/page-structure-2026-10.spw
 *
 * Usage: npm run audit:page-structure [-- --json] [-- --all] [-- --kind=unbalanced]
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const ROOT = process.cwd();
const IGNORED = [/^design\/components\//, /^design\/catalog\//, /^00\./, /^public\//, /^docs\//, /^workers\//, /^src\//, /^\.\w/, /^dist/, /^_partials\//, /^offline\//];
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const OPTIONAL_END = new Set(['p', 'li', 'dt', 'dd', 'option', 'tr', 'td', 'th', 'thead', 'tbody', 'tfoot', 'colgroup', 'caption']);
const KNOWN = new Set(('a abbr address article aside audio b bdi bdo blockquote button canvas cite code data datalist del details dfn dialog div dl em fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup i iframe ins kbd label legend main map mark menu meter nav noscript object ol optgroup output picture pre progress q rp rt ruby s samp search section select slot small span strong sub summary sup table template textarea time u ul var video').split(' '));
const KINDS = ['unbalanced', 'raw-capsule', 'heading-skip', 'section-id', 'img-size', 'button-type', 'script-only'];
const HIDDEN_ATTR = /(?:^|\s)hidden(?=[\s=/]|$)/;
const SCRIPTS_OFF_NOTE = '<spw-include src="scripts-off-tuning">';
// The attribute a script reads to answer a press, so findings group by behavior.
const scriptHook = (attrs) => /\s(data-(?:site-setting-set|set-mode|spw-action|action|spw-copy|copy)[a-z-]*)=/.exec(attrs)?.[1]
  || /\s(data-(?!spw-operator|spw-handle)[a-z-]+)=/.exec(attrs)?.[1]
  || `.${/\sclass="([^"\s]+)/.exec(attrs)?.[1] || 'button'}`;
// Whole start or end tags with their quoted values, so a capsule inside an attribute does not end the tag.
const TAG = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;

const blank = (text) => text.replace(/[^\n]/g, ' ');

function routeFiles() {
  return execFileSync('git', ['ls-files', '*index.html'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .filter((file) => file && !IGNORED.some((re) => re.test(file)));
}

export function auditPage(file, source) {
  const html = source
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/<(script|style|pre|code|textarea|svg|template)\b[\s\S]*?<\/\1>/g, blank);
  const start = html.indexOf('<main');
  const end = html.lastIndexOf('</main>');
  if (start < 0 || end < 0) return [];
  const main = html.slice(start, end);
  const lineAt = (index) => html.slice(0, start + index).split('\n').length;
  const findings = [];
  const add = (kind, index, note) => findings.push({ kind, file, line: lineAt(index), note });

  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const settle = (entry, end) => {
    if (!entry.chips || main.slice(end).trimStart().startsWith(SCRIPTS_OFF_NOTE)) return;
    for (const index of entry.chips) add('script-only', index, 'data-site-setting-set, no scripts-off note');
  };
  const stack = [];
  let lastHeading = 0;
  for (const m of main.matchAll(TAG)) {
    const [, close, rawTag, attrs, selfClosing] = m;
    const tag = rawTag.toLowerCase();
    if (!close) {
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1]);
        if (lastHeading && level - lastHeading > 1) add('heading-skip', m.index, `h${lastHeading} → h${level}`);
        lastHeading = level;
      }
      if (tag === 'img' && !(/\bwidth=/.test(attrs) && /\bheight=/.test(attrs))) add('img-size', m.index, /\bsrc="([^"]*)"/.exec(attrs)?.[1] || 'img');
      if (tag === 'button' && !/\btype=/.test(attrs)) add('button-type', m.index, 'no type');
      if (tag === 'button' && !/\s(popovertarget|commandfor)=/.test(attrs) && !HIDDEN_ATTR.test(attrs)
        && !stack.some((entry) => entry.tag === 'form' || entry.hidden)) {
        const hook = scriptHook(attrs);
        // A settings chip waits for its group to close: a scripts-off note after it answers the press.
        if (hook === 'data-site-setting-set' && stack.length) (stack.at(-1).chips ||= []).push(m.index);
        else if (hook !== 'data-set-mode') add('script-only', m.index, hook);
      }
      if (tag === 'section' && !/\sid="/.test(attrs)) {
        const label = /aria-labelledby="([^"\s]+)-title"/.exec(attrs)?.[1];
        if (label && !ids.has(label)) add('section-id', m.index, `could be #${label}`);
      }
      if (!KNOWN.has(tag) && !VOID.has(tag) && !OPTIONAL_END.has(tag) && !tag.includes('-')) add('raw-capsule', m.index, `<${tag}>`);
    }
    if (VOID.has(tag) || OPTIONAL_END.has(tag) || selfClosing || tag.includes('-') || !KNOWN.has(tag)) continue;
    if (!close) { stack.push({ tag, index: m.index, hidden: HIDDEN_ATTR.test(attrs) }); continue; }
    if (stack.length && stack.at(-1).tag === tag) { settle(stack.pop(), m.index + m[0].length); continue; }
    const open = stack.findLastIndex((entry) => entry.tag === tag);
    if (open < 0) { add('unbalanced', m.index, `stray </${tag}>`); continue; }
    for (const entry of stack.slice(open + 1)) add('unbalanced', entry.index, `<${entry.tag}> never closed (met </${tag}> at line ${lineAt(m.index)})`);
    for (const entry of stack.slice(open)) settle(entry, m.index + m[0].length);
    stack.length = open;
  }
  for (const entry of stack.slice(1)) add('unbalanced', entry.index, `<${entry.tag}> never closed before </main>`);
  for (const entry of stack) settle(entry, main.length);
  return findings;
}

const isMain = process.argv[1] && process.argv[1].endsWith('audit-page-structure.mjs');
if (isMain) {
  const args = process.argv.slice(2);
  const only = args.find((arg) => arg.startsWith('--kind='))?.slice(7);
  const files = routeFiles();
  const findings = files.flatMap((file) => auditPage(file, readFileSync(file, 'utf8')));
  if (args.includes('--json')) {
    process.stdout.write(`${JSON.stringify(findings)}\n`);
  } else {
    const counts = Object.fromEntries(KINDS.map((kind) => [kind, findings.filter((f) => f.kind === kind).length]));
    console.log(`[page-structure] ${files.length} routes; ${KINDS.map((kind) => `${counts[kind]} ${kind}`).join(', ')}`);
    const cap = args.includes('--all') ? Infinity : 8;
    for (const kind of KINDS.filter((k) => !only || k === only)) {
      const rows = findings.filter((f) => f.kind === kind);
      for (const row of rows.slice(0, cap)) console.log(`  ${kind.padEnd(13)} ${row.file}:${row.line}  ${row.note}`);
      if (rows.length > cap) console.log(`  ${kind.padEnd(13)} … ${rows.length - cap} more (--all)`);
    }
  }
}
