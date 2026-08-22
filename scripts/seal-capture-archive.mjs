#!/usr/bin/env node
/** Seal WIP stills into archive/images/<commit>/. No Chrome. */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sealWipToCommit, wipHasStills } from './lib/visual-capture-archive.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'design/components/captures');

if (!await wipHasStills(outDir)) {
  process.exit(0);
}
const result = await sealWipToCommit(outDir, root);
process.stdout.write(`[visual:seal] ${result.sealed} → ${result.cluster || 'none'}\n`);
