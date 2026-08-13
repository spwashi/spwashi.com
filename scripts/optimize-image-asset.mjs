/**
 * Optimize a render into the tiered, multi-format asset the conventions ask for.
 *
 * .spw/conventions/asset-management.spw#optimization already specifies size
 * tiers per surface and quality targets per tier, but the work was being done
 * by hand each time — which is how the 2026-08-13 study briefly ended up in the
 * repo as 7.5MB of raw PNG, and how a master got deleted before its tiers were
 * generated. This encodes the convention so the next study is one command.
 *
 * Tiers and quality come from the convention, not from taste:
 *
 *   illustrations   thumb 256 / display 512 / hero 1024
 *   motifs          icon 64 / display 256 / large 512
 *   rpg_wednesday   thumb 320 / display 640 / hero 1024
 *   pretext_lab     thumb 400 / display 800 / hero 1200
 *   quality         thumb 40 / display 60 / hero 75
 *
 * AVIF and WebP only. PNG tiers are deliberately omitted: both formats have
 * universal support in the browsers this site targets, and a PNG tier
 * outweighs every other variant combined. The master stays in renders/.
 *
 * Requires avifenc, cwebp and magick on PATH.
 *
 * Usage:
 *   node scripts/optimize-image-asset.mjs <source> --surface illustrations --name spirit-name
 *   node scripts/optimize-image-asset.mjs <source> --surface motifs --name seal --dry-run
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Straight from conventions/asset-management.spw#optimization.size_tiers. */
const SURFACE_TIERS = {
  illustrations: { thumb: 256, display: 512, hero: 1024 },
  motifs: { icon: 64, display: 256, large: 512 },
  rpg_wednesday: { thumb: 320, display: 640, hero: 1024 },
  pretext_lab: { thumb: 400, display: 800, hero: 1200 },
};

/** quality_targets, with WebP offset up since it needs more bits for parity. */
const TIER_QUALITY = {
  thumb: 40, icon: 40, display: 60, hero: 75, large: 60,
};
const WEBP_OFFSET = 18;

const SURFACE_DIR = {
  illustrations: 'public/images/assets/illustrations',
  motifs: 'public/images/assets/motifs',
  rpg_wednesday: 'public/images/assets/rpg-wednesday',
  pretext_lab: 'public/images/assets/pretext-lab',
};

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : fallback;
}

const kb = async (file) => Math.round((await stat(file)).size / 1024);

async function main() {
  const source = process.argv[2];
  const surface = arg('surface', 'illustrations');
  const name = arg('name');
  const dryRun = process.argv.includes('--dry-run');

  if (!source || !name) {
    console.error('usage: optimize-image-asset.mjs <source> --surface <surface> --name <spirit-name>');
    process.exitCode = 1;
    return;
  }
  const tiers = SURFACE_TIERS[surface];
  if (!tiers) {
    console.error(`unknown surface "${surface}" — expected one of ${Object.keys(SURFACE_TIERS).join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const outDir = path.join(ROOT, SURFACE_DIR[surface]);
  await mkdir(outDir, { recursive: true });

  // Never upscale: a 512 master asked for at hero 1024 would be interpolated
  // detail presented as resolution.
  const { stdout: dims } = await run('magick', ['identify', '-format', '%w %h', source]);
  const [width] = dims.trim().split(/\s+/).map(Number);

  const made = [];
  for (const [tier, size] of Object.entries(tiers)) {
    if (size > width) {
      console.log(`  skip ${tier} (${size}px) — master is only ${width}px wide`);
      continue;
    }
    const quality = TIER_QUALITY[tier] ?? 60;
    const scratch = path.join(ROOT, `.tmp-optimize-${tier}.png`);
    const avif = path.join(outDir, `${name}-${tier}.avif`);
    const webp = path.join(outDir, `${name}-${tier}.webp`);

    if (dryRun) {
      console.log(`  would write ${path.relative(ROOT, avif)} + .webp at ${size}px q${quality}`);
      continue;
    }

    await run('magick', [source, '-resize', `${size}x${size}`, scratch]);
    await run('avifenc', ['-q', String(quality), scratch, avif]);
    await run('cwebp', ['-q', String(Math.min(100, quality + WEBP_OFFSET)), '-quiet', scratch, '-o', webp]);
    await run('rm', [scratch]);
    made.push({ tier, size, quality, avif: await kb(avif), webp: await kb(webp) });
  }

  for (const entry of made) {
    console.log(`  ${entry.tier.padEnd(8)} ${String(entry.size).padStart(4)}px q${entry.quality}  ${String(entry.avif).padStart(4)}KB avif  ${String(entry.webp).padStart(4)}KB webp`);
  }
  if (made.length) {
    console.log(`\n  wrote ${made.length * 2} variants to ${SURFACE_DIR[surface]}/`);
    console.log('  next: write the .spw sidecar and register the study in .spw/assets.spw');
  }
}

main().catch((error) => {
  console.error('[optimize-image-asset]', error.message || error);
  process.exitCode = 1;
});
