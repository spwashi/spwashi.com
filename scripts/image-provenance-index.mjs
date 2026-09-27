#!/usr/bin/env node
/**
 * Write public/js/generated/image-provenance.js from the image sidecars
 * (scripts/lib/image-provenance-records.mjs). `--check` exits 1 when the
 * module is stale instead of writing it.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

import {
  PROVENANCE_MODULE,
  collectProvenanceRecords,
  renderProvenanceModule,
} from './lib/image-provenance-records.mjs';

const records = collectProvenanceRecords();
const next = renderProvenanceModule(records);
let current = '';
try { current = readFileSync(PROVENANCE_MODULE, 'utf8'); } catch { current = ''; }

const marked = records.filter((record) => record.kind).length;
if (process.argv.includes('--check')) {
  if (current !== next) {
    console.error(`[images] ${PROVENANCE_MODULE} is stale; run npm run images:provenance`);
    process.exit(1);
  }
  console.log(`[images] ${PROVENANCE_MODULE} is current (${marked} recorded stems)`);
} else {
  if (current !== next) writeFileSync(PROVENANCE_MODULE, next);
  console.log(`[images] ${current === next ? 'unchanged' : 'wrote'} ${PROVENANCE_MODULE} (${marked} recorded stems)`);
}
