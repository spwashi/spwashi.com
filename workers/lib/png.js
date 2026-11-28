/** Check the format of a full-bleed app icon exported as opaque RGB PNG. */
export function assertIconPng(bytes, size, name) {
  if (bytes.length < 33 ||
      bytes.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
      bytes.toString("ascii", 12, 16) !== "IHDR" ||
      bytes.readUInt32BE(16) !== size || bytes.readUInt32BE(20) !== size ||
      bytes[24] !== 8 || bytes[25] !== 2) {
    throw new Error(`${name} must be an opaque ${size}×${size} RGB PNG`);
  }
  for (let offset = 8; offset + 12 <= bytes.length; ) {
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (type === "tRNS") throw new Error(`${name} must not contain transparency`);
    if (type === "IEND" && offset + 12 === bytes.length) return bytes;
    offset += 12 + bytes.readUInt32BE(offset);
  }
  throw new Error(`${name} is missing a complete PNG trailer`);
}
