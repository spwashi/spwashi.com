// mutex.buzz's app icons, drawn as PNGs with nothing but node:zlib: a honey
// cell with two ink stripes on the hive's dark ground, the favicon's mark at
// the sizes an installed app asks for. A maskable icon keeps the cell inside
// the middle 80%, where every launcher's mask leaves it whole.
import { deflateSync } from "node:zlib";

const GROUND = [0x12, 0x0d, 0x07];
const HONEY = [0xff, 0xc5, 0x3d];
const INK = [0x12, 0x0d, 0x07];

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

/** A pointy-topped hexagon's test: whether (x, y) is inside the cell of radius r at (cx, cy). */
function inHexagon(x, y, cx, cy, r) {
  const dx = Math.abs(x - cx), dy = Math.abs(y - cy);
  // Its flat sides stand at half-width r·√3/2; its slanted edges fall from the top point (0, r) to (r·√3/2, r/2).
  return dx <= (r * Math.sqrt(3)) / 2 && dy <= r - dx / Math.sqrt(3);
}

/**
 * The icon at a size, as PNG bytes. `share` is the cell's radius as a share
 * of the side: 0.42 for a plain icon, 0.34 for a maskable one.
 */
export function iconPng(size, { share = 0.42, rounded = false } = {}) {
  const S = 4;
  const c = size / 2;
  const r = size * share;
  const stripe = r * 0.2;
  const corner = rounded ? size * 0.18 : 0;
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      let rr = 0, gg = 0, bb = 0, aa = 0;
      for (let sy = 0; sy < S; sy += 1) for (let sx = 0; sx < S; sx += 1) {
        const px = x + (sx + 0.5) / S, py = y + (sy + 0.5) / S;
        // The ground: a full square, or a rounded one for the apple icon's own mask to soften.
        const qx = Math.max(corner - px, px - (size - corner), 0), qy = Math.max(corner - py, py - (size - corner), 0);
        if (corner && Math.hypot(qx, qy) > corner) continue;
        let col = GROUND;
        if (inHexagon(px, py, c, c, r)) {
          const band = py - c;
          col = Math.abs(band + r * 0.18) < stripe / 2 || Math.abs(band - r * 0.28) < stripe / 2 ? INK : HONEY;
        }
        rr += col[0]; gg += col[1]; bb += col[2]; aa += 255;
      }
      const n = S * S;
      row[1 + x * 4] = Math.round(rr / n);
      row[2 + x * 4] = Math.round(gg / n);
      row[3 + x * 4] = Math.round(bb / n);
      row[4 + x * 4] = Math.round(aa / n);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6; header[10] = 0; header[11] = 0; header[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** The icons an installed mutex.buzz uses, by file name. */
export const ICONS = Object.freeze({
  "icon-192.png": { size: 192 },
  "icon-512.png": { size: 512 },
  "icon-maskable-512.png": { size: 512, share: 0.34, purpose: "maskable" },
  "apple-touch-icon.png": { size: 180, rounded: false },
});
