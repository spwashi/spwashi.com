// A PNG from a colour function, with nothing but node:zlib: for app icons the
// carries draw at build time. colourAt(x, y) is asked at several points inside
// each pixel and returns [r, g, b] (0 to 255), so edges come out smooth.
import { deflateSync } from "node:zlib";

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

/** An opaque square PNG of `size` pixels, each the average of `samples`² looks at colourAt. */
export function squarePng(size, colourAt, samples = 4) {
  const rows = [];
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    for (let x = 0; x < size; x += 1) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < samples; sy += 1) for (let sx = 0; sx < samples; sx += 1) {
        const [cr, cg, cb] = colourAt(x + (sx + 0.5) / samples, y + (sy + 0.5) / samples);
        r += cr; g += cg; b += cb;
      }
      const n = samples * samples;
      row.set([Math.round(r / n), Math.round(g / n), Math.round(b / n), 255], 1 + x * 4);
    }
    rows.push(row);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

/** A colour as written, "#0b3b3a", as [r, g, b]. */
export const rgbOf = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/** A broad upper-left light over an icon, in normalized coordinates. */
export function iconLight(rgb, u, v, strength) {
  const distance = Math.hypot(u - 0.23, v - 0.18);
  const exposure = strength * (0.7 - distance);
  return rgb.map((channel) => exposure > 0
    ? channel + (255 - channel) * exposure
    : channel * (1 + exposure));
}
