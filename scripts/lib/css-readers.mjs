/**
 * Which stylesheets read a name: data-spw-* attributes, [data-*] selectors,
 * and var(--*) reads, across authored CSS (bundles excluded, since they only
 * repeat their sources). The runtime atlas uses it for its JS→CSS edges; the
 * portable audit uses it to say which stylesheets travel with a module.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

function walkCss(root, dir, out = []) {
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const child = `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (child !== 'public/css/bundles') walkCss(root, child, out);
    } else if (entry.name.endsWith('.css')) {
      out.push(child);
    }
  }
  return out;
}

/** token → sorted stylesheet paths that read it. */
export function buildCssReaderIndex(root) {
  const readers = new Map();
  for (const file of walkCss(root, 'public/css').sort()) {
    const text = readFileSync(path.join(root, file), 'utf8');
    const found = new Set([
      ...[...text.matchAll(/data-spw-[a-z0-9-]+/g)].map((match) => match[0]),
      ...[...text.matchAll(/var\(\s*(--[a-z0-9-]+)/g)].map((match) => match[1]),
      ...[...text.matchAll(/\[(data-[a-z0-9-]+)/g)].map((match) => match[1]),
    ]);
    for (const token of found) readers.set(token, [...(readers.get(token) || []), file]);
  }
  return readers;
}
