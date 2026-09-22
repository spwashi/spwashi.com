/**
 * What a noun rename leaves behind when it only sees one language.
 *
 * rewrite-semantic-nouns.mjs moved class="…" in HTML from site-frame and
 * operator-chip to spw-frame and spw-chip. Script-built DOM kept the old
 * names and lost its paint; selectors that listed both names now list the new
 * one twice. These checks keep either residue from coming back.
 */
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RETIRED = ['site-frame', 'operator-chip'];

/* file → why it may still name a retired noun */
const RETIRED_NOUN_ALLOW = Object.freeze({
  'public/js/interface/prompt-utils.js':
    'copy_seed stays dormant until its serialization verbs are settled — .spw/caches/serialization-register-verbs-2026-09.spw',
});

async function listFiles(dir, extension, skip = []) {
  const entries = await readdir(path.join(ROOT, dir), { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(extension))
    .map((entry) => path.relative(ROOT, path.join(entry.parentPath, entry.name)))
    .filter((file) => !skip.some((part) => file.includes(part)));
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length;
}

/** Blank comments and string bodies without moving offsets. */
function maskCss(source) {
  return source.replace(/\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/g, (match) => (
    match.startsWith('/*')
      ? match.replace(/[^\n]/g, ' ')
      : match[0] + 'x'.repeat(match.length - 2) + match[match.length - 1]
  ));
}

/** Top-level comma items of a selector list, as [start, end] offsets. */
function splitTop(masked, start, end) {
  const items = [];
  let depth = 0;
  let from = start;
  for (let index = start; index < end; index += 1) {
    const char = masked[index];
    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ',' && depth === 0) {
      items.push([from, index]);
      from = index + 1;
    }
  }
  items.push([from, end]);
  return items;
}

function repeatedItems(source, masked, start, end) {
  const seen = new Set();
  const repeats = [];
  for (const [a, b] of splitTop(masked, start, end)) {
    const item = source.slice(a, b).replace(/\s+/g, ' ').trim();
    if (!item) continue;
    if (seen.has(item)) repeats.push(item);
    seen.add(item);
  }
  return repeats;
}

export function findRepeatedSelectorItems(source) {
  const masked = maskCss(source);
  const found = [];

  for (const match of masked.matchAll(/:(?:is|where)\(/g)) {
    const start = match.index + match[0].length;
    let depth = 1;
    let index = start;
    while (index < masked.length && depth) {
      if (masked[index] === '(') depth += 1;
      else if (masked[index] === ')') depth -= 1;
      index += 1;
    }
    for (const item of repeatedItems(source, masked, start, index - 1)) {
      found.push({ line: lineOf(source, match.index), item });
    }
  }

  for (const match of masked.matchAll(/(?:^|(?<=[;{}]))([^;{}@]+)(?=\{)/g)) {
    const start = match.index;
    for (const item of repeatedItems(source, masked, start, start + match[1].length)) {
      found.push({ line: lineOf(source, start + match[1].length - match[1].trimStart().length), item });
    }
  }

  return found;
}

describe('rename residue', () => {
  it('script-built DOM and JS selectors speak the public nouns', async () => {
    const files = await listFiles('public/js', '.js', ['/generated/', '/typed/']);
    const selectorForm = new RegExp(`\\.(?:${RETIRED.join('|')})(?![\\w-])`, 'g');
    const classForm = new RegExp(
      `(?:className\\s*[:=]\\s*|class=\\\\?"|classList\\.\\w+\\(|\\bel\\(\\s*'[\\w-]+',\\s*)['"\`]?[^'"\`\\n]*(?<![\\w-])(?:${RETIRED.join('|')})(?![\\w-])`,
      'g',
    );
    const offenders = [];

    for (const file of files) {
      if (RETIRED_NOUN_ALLOW[file]) continue;
      const source = await readFile(path.join(ROOT, file), 'utf8');
      for (const pattern of [selectorForm, classForm]) {
        for (const match of source.matchAll(pattern)) {
          offenders.push(`${file}:${lineOf(source, match.index)} ${match[0].trim().slice(0, 80)}`);
        }
      }
    }

    assert.deepEqual(offenders, [], 'write spw-frame / spw-chip; the retired nouns have no paint');
  });

  it('stylesheets select the public nouns', async () => {
    const files = await listFiles('public/css', '.css', ['/bundles/']);
    const pattern = new RegExp(`\\.(?:${RETIRED.join('|')})(?![\\w-])`, 'g');
    const offenders = [];
    for (const file of files) {
      const source = await readFile(path.join(ROOT, file), 'utf8');
      const masked = maskCss(source);
      for (const match of masked.matchAll(pattern)) offenders.push(`${file}:${lineOf(source, match.index)}`);
    }
    assert.deepEqual(offenders, []);
  });

  it('no selector list names the same item twice', async () => {
    const files = await listFiles('public/css', '.css', ['/bundles/']);
    const offenders = [];
    for (const file of files) {
      const source = await readFile(path.join(ROOT, file), 'utf8');
      for (const { line, item } of findRepeatedSelectorItems(source)) {
        offenders.push(`${file}:${line} ${item.slice(0, 80)}`);
      }
    }
    assert.deepEqual(offenders, [], 'a repeated item matches nothing new; say it once');
  });

  it('tells a repeat from two items that differ only inside a string', () => {
    assert.deepEqual(findRepeatedSelectorItems(':where([a="note"], [a="lede"]) {}'), []);
    assert.deepEqual(
      findRepeatedSelectorItems('.x,\n.x {}').map((entry) => entry.item),
      ['.x'],
    );
    assert.deepEqual(
      findRepeatedSelectorItems('p :is(.a, .b, .a) {}').map((entry) => entry.item),
      ['.a'],
    );
  });
});
