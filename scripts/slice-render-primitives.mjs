#!/usr/bin/env node
/**
 * slice-render-primitives.mjs
 * ---------------------------------------------------------------------------
 * Turn one raw Midjourney render into a small set of candidate primitives:
 * a grid of square crops at a target tile size, plus algorithmic variants:
 *   wash     — desaturated/lightened full-bleed (type stays readable)
 *   edge     — gray edge map (structure / icon wonder)
 *   icon     — 64px high-contrast punch (motif-tier, a still of a set)
 *   nucleus  — center 55% crop (the tile's heart, often the better primitive)
 * Approximate tropes are allowed: screenshots now interpret well enough that
 * a crop can stage a theme-set and be replaced later. Promotion to a live
 * theme pack or card family still needs a named sidecar judgment.
 *
 * Uses ImageMagick (`magick`), already present, matching this repo's
 * no-new-deps discipline (see .agents/skills/image-optimize/SKILL.md).
 *
 * Usage:
 *   node scripts/slice-render-primitives.mjs <source-image> [outDir] [tileSize] [grid]
 *
 * Example:
 *   node scripts/slice-render-primitives.mjs \
 *     00.unsorted/tiles/spwashi_neutral_aesthetic_..._1.png \
 *     public/images/renders/_staged-primitives/neutral-hex \
 *     512 2
 */
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const [, , srcArg, outArg, tileArg, gridArg] = process.argv;

if (!srcArg) {
  console.error('usage: node scripts/slice-render-primitives.mjs <source-image> [outDir] [tileSize] [grid]');
  process.exit(1);
}

const SRC = path.resolve(srcArg);
const TILE = Number(tileArg) || 512;
const GRID = Number(gridArg) || 2; // GRID x GRID crops sampled across the source
const OUT_DIR = path.resolve(outArg || path.join('public/images/renders/_staged-primitives', path.basename(SRC, path.extname(SRC)).slice(0, 40)));

function identify(file) {
  const raw = execFileSync('magick', ['identify', '-format', '%w %h', file], { encoding: 'utf8' });
  const [w, h] = raw.trim().split(/\s+/).map(Number);
  return { w, h };
}

function run(args) {
  execFileSync('magick', args, { stdio: 'inherit' });
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const { w, h } = identify(SRC);
  const side = Math.min(w, h);
  const tile = Math.min(TILE, side);
  // Sample GRID x GRID crop origins spread across the source, avoiding the
  // extreme edge where MJ upscale artifacts and UI-safe margins tend to sit.
  const margin = Math.round(side * 0.06);
  const span = Math.max(1, side - tile - margin * 2);
  const positions = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const x = margin + Math.round((span * i) / Math.max(1, GRID - 1));
      const y = margin + Math.round((span * j) / Math.max(1, GRID - 1));
      positions.push({ x, y, id: `r${i}c${j}` });
    }
  }

  const manifest = [];
  for (const { x, y, id } of positions) {
    const cropBase = `${id}-${tile}`;
    const cropPng = path.join(OUT_DIR, `${cropBase}.png`);
    const cropWebp = path.join(OUT_DIR, `${cropBase}.webp`);
    const washWebp = path.join(OUT_DIR, `${cropBase}-wash.webp`);

    run([SRC, '-crop', `${tile}x${tile}+${x}+${y}`, '+repage', cropPng]);
    run([cropPng, '-quality', '72', cropWebp]);
    // Wash variant: quiet full-bleed background candidate — desaturate,
    // lighten, and drop contrast so type stays readable on top of it.
    run([
      cropPng,
      '-modulate', '112,38,100',
      '-brightness-contrast', '6x-18',
      '-quality', '72',
      washWebp,
    ]);
    const edgeWebp = path.join(OUT_DIR, `${cropBase}-edge.webp`);
    const iconWebp = path.join(OUT_DIR, `${cropBase}-icon.webp`);
    const nucleusWebp = path.join(OUT_DIR, `${cropBase}-nucleus.webp`);
    run([
      cropPng,
      '-colorspace', 'gray',
      '-edge', '1',
      '-negate',
      '-normalize',
      '-quality', '72',
      edgeWebp,
    ]);
    run([
      cropPng,
      '-colorspace', 'gray',
      '-edge', '2',
      '-negate',
      '-normalize',
      '-resize', '64x64',
      '-quality', '68',
      iconWebp,
    ]);
    run([
      cropPng,
      '-gravity', 'center',
      '-crop', '55%x55%+0+0',
      '+repage',
      '-resize', `${tile}x${tile}`,
      '-quality', '72',
      nucleusWebp,
    ]);
    await fs.unlink(cropPng);
    manifest.push({
      id, x, y, tile,
      webp: path.relative(process.cwd(), cropWebp),
      wash: path.relative(process.cwd(), washWebp),
      edge: path.relative(process.cwd(), edgeWebp),
      icon: path.relative(process.cwd(), iconWebp),
      nucleus: path.relative(process.cwd(), nucleusWebp),
    });
  }

  const sidecarStub = () => `#>asset_metadata
#:layer #!design
#:fixity #!experimental

^"spirit"{
  whimsy_name: "REPLACE_ME"
  description: "REPLACE_ME — algorithmic crop, not yet named or judged"
  visual_qualities: "REPLACE_ME"
}

^"staging"{
  source = ~"${path.relative(process.cwd(), SRC)}"
  method = "slice-render-primitives.mjs grid crop + wash/edge/icon/nucleus"
  theme_pack_candidate = "REPLACE_ME | none"
  component_genre_candidate = "REPLACE_ME | none"
  theme_set = "REPLACE_ME — a named climate a still of 3–4 tiles can ask about"
  trope = "approximate crop; screenshots interpret; replace_later allowed"
  icon_candidate = "false"
  replace_later = "true"
  promoted = "false"
}[reg=facet]

^"discovery"{
  tags: ["staged", "unreviewed", "theme-set"]
}
`;

  for (const entry of manifest) {
    const base = entry.webp.replace(/\.webp$/, '');
    await fs.writeFile(`${base}.spw`, sidecarStub());
  }

  console.log(`sliced ${manifest.length} candidate(s) from ${path.relative(process.cwd(), SRC)} -> ${path.relative(process.cwd(), OUT_DIR)}`);
  for (const m of manifest) console.log(`  ${m.webp}  (+ wash/edge/icon/nucleus, + .spw stub)`);
  console.log('\nStaged tropes — a still can ask which climate. Name the sidecar before promoting to a pack.');
}

main().catch((e) => { console.error(e); process.exit(1); });
