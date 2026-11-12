// A material word drawn as a square image, at build time, with nothing but Node.
// Midjourney takes an image by its address, so every listed material gets a file
// it can fetch (/terrazzo.png) and use as a style reference or image prompt; the
// page draws the same file, so the image a reader copies is the one they see.
//
// Each class has a pattern written as lightness over the tile; the word gives the
// hue (the same hash the page uses). Noise is periodic over the tile, so tiles
// repeat without a seam. The PNG is indexed, sixteen tones of one hue at four bits
// a pixel, which keeps a 384px tile to tens of kilobytes. Same word, same bytes.
import { deflateSync } from "node:zlib";

export const TILE = 384;
const SAT = { paper: 22, textile: 48, stone: 10, wood: 42, metal: 6, glass: 30, ceramic: 52, pigment: 72, polymer: 18, organic: 46, phenomenon: 36 };

export const hash = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const mix = (n) => { let x = Math.imul((n ^ (n >>> 16)) >>> 0, 0x45d9f3b); x = Math.imul((x ^ (x >>> 16)) >>> 0, 0x45d9f3b); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t) => t * t * (3 - 2 * t);

/** Value noise with `cells` lattice cells across the tile, wrapping at its edges; the lattice is computed once. */
function periodic(seed, cells) {
  const lattice = new Float64Array(cells * cells);
  for (let i = 0; i < cells; i += 1) for (let j = 0; j < cells; j += 1) lattice[i * cells + j] = mix(seed * 7919 + i * 104729 + j * 1299709);
  const scale = cells / TILE;
  return (x, y) => {
    const fx = x * scale, fy = y * scale;
    const i = Math.floor(fx), j = Math.floor(fy), u = smooth(fx - i), v = smooth(fy - j);
    const i0 = ((i % cells) + cells) % cells, j0 = ((j % cells) + cells) % cells, i1 = (i0 + 1) % cells, j1 = (j0 + 1) % cells;
    const a = lattice[i0 * cells + j0], b = lattice[i1 * cells + j0], c = lattice[i0 * cells + j1], d = lattice[i1 * cells + j1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** Octaves of periodic noise, coarse to fine, 0 to 1. */
function fbm(seed, base, octaves) {
  const layers = Array.from({ length: octaves }, (_, k) => periodic(seed + k, base * 2 ** k));
  return (x, y) => { let sum = 0, amp = 0.5, norm = 0; for (const n of layers) { sum += amp * n(x, y); norm += amp; amp /= 2; } return sum / norm; };
}

/**
 * Nearest and second-nearest jittered points on a wrapping grid, for cells and
 * drops: one point a cell, computed once, the 3×3 around a pixel searched.
 * Returns d1 and leaves d2 in `cellsOf.second`, so no pixel allocates.
 */
function cellsOf(seed, count) {
  const step = TILE / count;
  const px = new Float64Array(count * count), py = new Float64Array(count * count);
  for (let i = 0; i < count; i += 1) for (let j = 0; j < count; j += 1) {
    px[i * count + j] = (0.15 + 0.7 * mix(seed + i * 31 + j * 17)) * step;
    py[i * count + j] = (0.15 + 0.7 * mix(seed + i * 13 + j * 47 + 5)) * step;
  }
  return (x, y) => {
    const ci = Math.floor(x / step), cj = Math.floor(y / step);
    let d1 = Infinity, d2 = Infinity;
    for (let di = -1; di <= 1; di += 1) for (let dj = -1; dj <= 1; dj += 1) {
      const gi = ci + di, gj = cj + dj, wi = ((gi % count) + count) % count, wj = ((gj % count) + count) % count;
      const dx = x - (gi * step + px[wi * count + wj]), dy = y - (gj * step + py[wi * count + wj]);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    cellsOf.second = d2;
    return d1;
  };
}
cellsOf.second = 0;

/** Each class as lightness over the tile, 0 dark to 1 light. */
const PATTERNS = {
  paper(seed) { const n = fbm(seed, 6, 5); return (x, y) => 0.8 + 0.18 * (n(x, y) - 0.5) - (y % 32 < 1.2 ? 0.22 : 0); },
  textile(seed) {
    const n = fbm(seed, 12, 3), w = 12;
    return (x, y) => { const over = (Math.floor(x / w) + Math.floor(y / w)) % 2; const t = over ? Math.sin(Math.PI * (x % w) / w) : Math.sin(Math.PI * (y % w) / w); return 0.35 + 0.4 * t + 0.15 * (n(x, y) - 0.5); };
  },
  stone(seed) {
    const n = fbm(seed, 4, 5), vein = fbm(seed + 9, 3, 4), grit = periodic(seed + 21, 96);
    return (x, y) => { const v = Math.abs(vein(x, y) - 0.5) < 0.012 ? -0.3 : 0; return 0.62 + 0.3 * (n(x, y) - 0.5) + v + (grit(x, y) > 0.86 ? -0.25 : 0); };
  },
  wood(seed) { const n = fbm(seed, 3, 4), streak = periodic(seed + 3, 64); return (x, y) => 0.5 + 0.22 * Math.sin(2 * Math.PI * (y / 24 + 3 * n(x, y))) + 0.1 * (streak(x, y) - 0.5); },
  metal(seed) { const brush = fbm(seed, 2, 3), fine = periodic(seed + 5, 192); return (x, y) => 0.66 + 0.16 * Math.cos(2 * Math.PI * x / TILE) + 0.12 * (brush(x * 0.25, y) - 0.5) + 0.12 * (fine(x * 0.05, y) - 0.5); },
  glass(seed) {
    const drops = cellsOf(seed, 8), n = fbm(seed, 4, 3);
    return (x, y) => { const d1 = drops(x, y); const base = 0.45 + 0.3 * ((x + y) / (2 * TILE)) + 0.1 * (n(x, y) - 0.5); if (d1 > 9) return base; return d1 < 3 ? 0.95 : 0.3; };
  },
  ceramic(seed) {
    const crack = cellsOf(seed, 6), n = fbm(seed, 4, 3), tile = 96;
    return (x, y) => { if (x % tile < 3 || y % tile < 3) return 0.22; const d1 = crack(x, y), d2 = cellsOf.second; return 0.72 + 0.08 * (n(x, y) - 0.5) - (d2 - d1 < 1.6 ? 0.25 : 0); };
  },
  pigment(seed) {
    const blooms = cellsOf(seed, 3), n = fbm(seed, 6, 5), grain = periodic(seed + 7, 128);
    return (x, y) => { const d1 = blooms(x, y); const bloom = Math.max(0, 1 - d1 / 70); return 0.9 - 0.45 * bloom * (0.7 + 0.6 * n(x, y)) - (grain(x, y) > 0.8 ? 0.06 : 0) - (Math.abs(d1 - 70) < 2 ? 0.12 : 0); };
  },
  polymer(seed) {
    const n = fbm(seed, 8, 3), step = 48;
    return (x, y) => { const cx = (x % step) - step / 2, cy = (y % step) - step / 2, d = Math.hypot(cx, cy); if (d < 14) return 0.62 - 0.25 * (cy / 14); return d < 16 ? 0.18 : 0.3 + 0.05 * (n(x, y) - 0.5); };
  },
  organic(seed) { const cells = cellsOf(seed, 10), n = fbm(seed, 6, 4); return (x, y) => { const d1 = cells(x, y), d2 = cellsOf.second; return 0.62 + 0.12 * (n(x, y) - 0.5) - (d2 - d1 < 2.5 ? 0.35 : 0) - 0.1 * Math.min(1, d1 / 20); }; },
  phenomenon(seed) {
    const n = fbm(seed, 3, 4), cx = TILE * mix(seed), cy = TILE * mix(seed + 1);
    return (x, y) => { let dx = Math.abs(x - cx), dy = Math.abs(y - cy); dx = Math.min(dx, TILE - dx); dy = Math.min(dy, TILE - dy); return 0.58 + 0.28 * Math.sin(Math.hypot(dx, dy) / 6 + 4 * n(x, y)); };
  },
};

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  return [0, 8, 4].map((n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))));
}

const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

/** A material as PNG bytes: sixteen tones of the word's hue, four bits a pixel. */
export function materialPng(material) {
  const h = hash(material.slug) % 360, s = SAT[material.cls] ?? 30;
  const light = (PATTERNS[material.cls] ?? PATTERNS.paper)(hash(material.slug) % 100000);
  const row = 1 + TILE / 2;
  const raw = Buffer.alloc(row * TILE);
  for (let y = 0; y < TILE; y += 1) {
    raw[y * row] = 0;
    for (let x = 0; x < TILE; x += 2) {
      const a = Math.round(clamp(light(x, y)) * 15), b = Math.round(clamp(light(x + 1, y)) * 15);
      raw[y * row + 1 + x / 2] = (a << 4) | b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(TILE, 0); ihdr.writeUInt32BE(TILE, 4);
  ihdr[8] = 4; ihdr[9] = 3; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const palette = Buffer.from(Array.from({ length: 16 }, (_, i) => hslToRgb(h, s, 16 + i * 5.2)).flat());
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("PLTE", palette), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}
