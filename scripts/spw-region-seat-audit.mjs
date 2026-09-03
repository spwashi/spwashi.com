/**
 * Find data-spw-region authored on an element that is not a .spw-frame.
 *
 * data-spw-region is seat-exclusive: region-seats.css and
 * projection-attenuation.css gate every selector on the .spw-frame class,
 * so an element that carries the attribute without that class gets no seat
 * layout from it — no container-type, no wash/seam color, no prose measure.
 * That is different from being generally inert: foundation.css,
 * electrostatic-affordances.css, and card-ecology.css read the SAME
 * attribute name for an unrelated, lighter salience/channel system that has
 * no .spw-frame requirement at all. The two systems sharing one attribute
 * name is what let a 2026-09-03 pass introduce a nested non-seat panel with
 * data-spw-region="path" that silently shadowed its true ancestor seat for
 * any .closest('[data-spw-region]') lookup, while doing nothing visually.
 *
 * data-spw-region-role is the correct attribute for a non-seat element that
 * wants the salience/channel treatment (or any freeform page-shell/job
 * label): it is read anywhere, no .spw-frame required. See
 * .spw/conventions/region-component-ecology.spw#region_vs_region_role.
 *
 * This script finds the drift back if it recurs. It does not fix anything.
 *
 * Usage:
 *   node scripts/spw-region-seat-audit.mjs         # report
 *   node scripts/spw-region-seat-audit.mjs --json  # machine-readable
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jsonOut = process.argv.includes('--json');

const files = execSync("git ls-files '*.html'", { cwd: ROOT })
  .toString()
  .trim()
  .split('\n')
  .filter((f) => f && !f.startsWith('dist'));

const findings = [];

for (const file of files) {
  const src = readFileSync(path.join(ROOT, file), 'utf8');
  const re = /data-spw-region="([a-z-]+)"/g;
  let match;
  while ((match = re.exec(src))) {
    const tagStart = src.lastIndexOf('<', match.index);
    const tagEnd = src.indexOf('>', match.index);
    const tag = src.slice(tagStart, tagEnd + 1);
    const hasFrameClass = /class="[^"]*\bspw-frame\b[^"]*"/.test(tag);
    if (hasFrameClass) continue;
    const line = src.slice(0, match.index).split('\n').length;
    const hasRegionRole = /data-spw-region-role="/.test(tag);
    findings.push({ file, line, region: match[1], hasRegionRole });
  }
}

if (jsonOut) {
  console.log(JSON.stringify({ findings, count: findings.length }, null, 2));
} else if (!findings.length) {
  console.log('[region-seat-audit] no data-spw-region without .spw-frame — clean.');
} else {
  console.log(`[region-seat-audit] ${findings.length} data-spw-region authorings with no .spw-frame class:`);
  for (const f of findings) {
    console.log(
      `  ${f.file}:${f.line}  region="${f.region}"`
      + (f.hasRegionRole ? '  (also carries data-spw-region-role — the bare region is redundant, drop it)' : '  (no region-role either — check whether this belongs on a real seat, migrate to data-spw-region-role, or should be dropped)'),
    );
  }
}

process.exitCode = findings.length ? 1 : 0;
