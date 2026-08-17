#!/usr/bin/env node
/**
 * Measure authored route copy with Pretext.
 *
 * Thin wrapper around the shared page-copy audit runner.
 * Prefer `node scripts/page-copy-audit.mjs pretext` for new audits.
 *
 * Usage:
 *   node scripts/measure-page-pretext.mjs
 *   node scripts/measure-page-pretext.mjs --json
 *   node scripts/measure-page-pretext.mjs --out /tmp/pretext-pages.json
 *   node scripts/measure-page-pretext.mjs --route /topics/software/pretext/
 */

import { runPageCopyAudit } from './lib/page-copy-audit.mjs';
import { pretextAudit } from './lib/page-copy-audits/pretext.mjs';

const code = await runPageCopyAudit(pretextAudit, process.argv.slice(2));
process.exit(code ?? 0);
