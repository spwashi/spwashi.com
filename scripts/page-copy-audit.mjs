#!/usr/bin/env node
/**
 * Dispatcher for page-copy measurement audits.
 *
 * Usage:
 *   node scripts/page-copy-audit.mjs
 *   node scripts/page-copy-audit.mjs list
 *   node scripts/page-copy-audit.mjs inventory --route /about/
 *   node scripts/page-copy-audit.mjs pretext --out /tmp/pretext-pages.json
 */

import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  parseAuditArgs,
  printAuditHelp,
  runPageCopyAudit,
} from './lib/page-copy-audit.mjs';
import { accessorAudit } from './lib/page-copy-audits/accessor.mjs';
import { alignAudit } from './lib/page-copy-audits/align.mjs';
import { exprAudit } from './lib/page-copy-audits/expr.mjs';
import { inventoryAudit } from './lib/page-copy-audits/inventory.mjs';
import { pretextAudit } from './lib/page-copy-audits/pretext.mjs';
import { varietyAudit } from './lib/page-copy-audits/variety.mjs';

export const PAGE_COPY_AUDITS = Object.freeze([
  inventoryAudit,
  varietyAudit,
  pretextAudit,
  alignAudit,
  exprAudit,
  accessorAudit,
]);

const AUDITS_BY_ID = new Map(PAGE_COPY_AUDITS.map((audit) => [audit.id, audit]));

function printList() {
  process.stdout.write('page-copy audits\n');
  for (const audit of PAGE_COPY_AUDITS) {
    const browser = audit.needsBrowser ? 'chrome' : 'offline';
    process.stdout.write(`  ${audit.id.padEnd(12)} ${browser.padEnd(8)}  ${audit.title}\n`);
  }
  process.stdout.write('\nAdd a module under scripts/lib/page-copy-audits/ and register it here.\n');
}

async function main(argv = process.argv.slice(2)) {
  const first = argv[0];
  const rest = first && !first.startsWith('-') ? argv.slice(1) : argv;
  const options = parseAuditArgs(argv);

  if (options.help && !first) {
    printAuditHelp({
      name: 'page-copy-audit',
      description: 'measure authored route copy; scripts hold numbers, .spw holds judgments',
      audits: PAGE_COPY_AUDITS,
    });
    return 0;
  }

  if (!first || first === 'list' || options.list) {
    printList();
    return 0;
  }

  const audit = AUDITS_BY_ID.get(first);
  if (!audit) {
    process.stderr.write(`[audit:copy] unknown audit "${first}"\n`);
    printList();
    return 1;
  }

  return runPageCopyAudit(audit, rest);
}

export { main };

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  main().then((code) => process.exit(code ?? 0));
}
