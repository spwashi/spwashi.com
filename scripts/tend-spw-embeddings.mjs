/**
 * Garden pass for Spw-native embeddings.
 *
 * Plant only what can be harvested. This script labels empty topic stems
 * and reports beds; it does not wrap nouns or invent forms.
 *
 *   node scripts/tend-spw-embeddings.mjs           # report
 *   node scripts/tend-spw-embeddings.mjs --apply   # fill data-spw-topic from text
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply');

const TOPIC_FLAG_RE = /<span\s+([^>]*\bclass="[^"]*\bspw-topic\b[^"]*"[^>]*)>([^<]+)<\/span>/gi;

function slugifyTopic(text = '') {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hasTopicValue(attrs = '') {
  return /\bdata-spw-topic="[^"]+"/.test(attrs);
}

async function walkHtml(dir, acc = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'dist-vite') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtml(full, acc);
    } else if (entry.name === 'index.html') {
      acc.push(full);
    }
  }
  return acc;
}

async function tendFile(absPath) {
  const source = await fs.readFile(absPath, 'utf8');
  const unlabeled = [];
  const next = source.replace(TOPIC_FLAG_RE, (full, attrs, text) => {
    if (hasTopicValue(attrs)) return full;
    const slug = slugifyTopic(text);
    if (!slug) return full;
    unlabeled.push({ text: text.trim(), slug });
    const trimmed = attrs.trimEnd();
    return `<span ${trimmed} data-spw-topic="${slug}">${text}</span>`;
  });
  return { rel: path.relative(ROOT, absPath), unlabeled, next, changed: next !== source };
}

const files = await walkHtml(ROOT);
const reports = [];
for (const file of files) {
  const report = await tendFile(file);
  if (report.unlabeled.length) reports.push(report);
}

if (!reports.length) {
  console.log('[tend] no unlabeled .spw-topic beds');
  process.exit(0);
}

let filled = 0;
for (const report of reports) {
  console.log(`${report.rel}: ${report.unlabeled.map((row) => row.slug).join(', ')}`);
  filled += report.unlabeled.length;
  if (APPLY && report.changed) {
    await fs.writeFile(path.join(ROOT, report.rel), report.next);
  }
}

console.log(`[tend] ${filled} unlabeled topic stem${filled === 1 ? '' : 's'} on ${reports.length} route${reports.length === 1 ? '' : 's'}${APPLY ? ' — labeled' : ' — pass --apply to write slugs'}`);
