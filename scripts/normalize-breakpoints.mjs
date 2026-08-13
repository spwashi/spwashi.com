/**
 * Normalize width breakpoints onto a canonical ladder.
 *
 * The CSS carried 189 width media queries across 58 distinct thresholds, in a
 * mix of px and rem, with 155 of them desktop-first. Many of those thresholds
 * are not decisions — they are drift: 719, 720 and 721 all appear; so do 979,
 * 980 and 981; 760 and 768 both exist alongside `48rem`, which is 768. A ladder
 * with 58 rungs has no granularity, only noise, and mobile ends up defined by
 * subtraction from desktop rather than designed.
 *
 * This pass is deliberately the SAFE half of the work. Every threshold snaps to
 * the nearest canonical rung, and a rung is only canonical if real usage already
 * clustered there — the ladder is descriptive, not invented. No threshold moves
 * more than MAX_DRIFT_RATIO, so no layout should change at any width a person
 * can actually observe. What changes is that the set becomes countable and
 * every value is expressed in rem, so it scales with the user's text size.
 *
 * The other half — collapsing ~16 rungs into a handful of semantic tiers — does
 * move layout and is not attempted here. It needs eyes on real pages, not a
 * codemod.
 *
 * Usage:
 *   node scripts/normalize-breakpoints.mjs            # report only
 *   node scripts/normalize-breakpoints.mjs --write
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_ROOT = path.join(ROOT, 'public/css');

/**
 * Canonical rungs in px. Each one is a cluster that already dominates real
 * usage; nothing here was chosen for tidiness. Kept in px for the arithmetic
 * and emitted in rem.
 */
const LADDER = [360, 420, 480, 512, 560, 640, 720, 768, 832, 864, 896, 980, 1024, 1152, 1216, 1440];

/** A threshold may not move further than this fraction of its own value. */
const MAX_DRIFT_RATIO = 0.05;

/** Generated bundles are build output; editing them would be overwritten. */
const SKIP = ['bundles'];

const toPx = (value, unit) => (unit === 'rem' || unit === 'em' ? value * 16 : value);
const toRem = (px) => {
  const rem = px / 16;
  return `${Number.isInteger(rem) ? rem : Number(rem.toFixed(4))}rem`;
};

function nearestRung(px) {
  let best = null;
  for (const rung of LADDER) {
    const drift = Math.abs(rung - px) / px;
    if (drift > MAX_DRIFT_RATIO) continue;
    if (!best || Math.abs(rung - px) < Math.abs(best - px)) best = rung;
  }
  return best;
}

async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, out);
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

async function main() {
  const write = process.argv.includes('--write');
  const files = await collect(CSS_ROOT);

  const changes = [];
  const unmapped = new Map();
  let touchedFiles = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    let next = source;
    let fileChanges = 0;

    // Only rewrite inside @media preludes, never inside declarations.
    next = next.replace(/@media[^{]*/g, (prelude) => prelude.replace(
      /((?:min|max)-width:\s*)([0-9.]+)(px|rem|em)/g,
      (whole, head, rawValue, unit) => {
        const px = toPx(Number(rawValue), unit);
        const rung = nearestRung(px);
        if (rung === null) {
          unmapped.set(px, (unmapped.get(px) || 0) + 1);
          return whole;
        }
        const replacement = `${head}${toRem(rung)}`;
        const original = `${head}${rawValue}${unit}`;
        if (replacement !== original) {
          fileChanges += 1;
          changes.push({
            file: path.relative(ROOT, file),
            from: `${rawValue}${unit}`,
            to: toRem(rung),
            driftPx: Math.round(rung - px),
          });
        }
        return replacement;
      },
    ));

    if (fileChanges && write) {
      await writeFile(file, next, 'utf8');
      touchedFiles += 1;
    } else if (fileChanges) {
      touchedFiles += 1;
    }
  }

  const byMove = new Map();
  for (const change of changes) {
    const key = `${change.from} → ${change.to}`;
    byMove.set(key, (byMove.get(key) || 0) + 1);
  }

  console.log(`breakpoint normalization — ${write ? 'APPLIED' : 'dry run'}`);
  console.log('='.repeat(60));
  console.log(`${files.length} css files scanned, ${touchedFiles} affected, ${changes.length} thresholds rewritten\n`);

  const moves = [...byMove.entries()].sort((a, b) => b[1] - a[1]);
  for (const [move, count] of moves) {
    console.log(`  ${String(count).padStart(3)}x  ${move}`);
  }

  const drifted = changes.filter((change) => Math.abs(change.driftPx) > 0);
  const worst = drifted.sort((a, b) => Math.abs(b.driftPx) - Math.abs(a.driftPx))[0];
  console.log(`\n  ${drifted.length} of ${changes.length} moved at all; largest move ${worst ? `${worst.driftPx}px (${worst.from} → ${worst.to})` : 'none'}`);

  if (unmapped.size) {
    console.log(`\n  left alone — no rung within ${MAX_DRIFT_RATIO * 100}% (these are real decisions, not drift):`);
    for (const [px, count] of [...unmapped.entries()].sort((a, b) => a[0] - b[0])) {
      console.log(`    ${String(px).padStart(6)}px  x${count}`);
    }
  }

  if (!write) console.log('\n  re-run with --write to apply');
}

main().catch((error) => {
  console.error('[normalize-breakpoints]', error);
  process.exitCode = 1;
});
