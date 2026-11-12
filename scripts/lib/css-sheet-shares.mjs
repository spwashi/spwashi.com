/**
 * css-sheet-shares.mjs — what each source sheet weighs inside a built bundle.
 *
 * scripts/css-bundle.mjs writes one provenance line before each sheet it
 * inlines (a comment holding the sheet's href). This splits a bundle on those
 * lines and returns each sheet's bytes and share, folded by the layer folder
 * the sheet lives in. Nothing is estimated: the rows, the provenance lines and
 * the header before the first sheet add up to the bundle exactly.
 */

const PROVENANCE = /^\/\* (\/public\/css\/[^\s*]+\.css) \*\/$/;

const bytesOf = (text) => Buffer.byteLength(text, 'utf8');

/**
 * @param {string} source a built bundle
 * @param {{ whenOf?: (id: string) => string | undefined }} [options] the mount timing of a module that shares a sheet's name
 */
export function readSheetShares(source = '', { whenOf = () => undefined } = {}) {
  const totalBytes = bytesOf(source);
  const lines = source.split('\n');
  const sheets = [];
  let headerBytes = 0;
  let provenanceBytes = 0;
  let current = null;

  lines.forEach((line, index) => {
    // Every line but the last carried a newline in the source.
    const size = bytesOf(line) + (index < lines.length - 1 ? 1 : 0);
    const href = line.match(PROVENANCE)?.[1];
    if (href) {
      provenanceBytes += size;
      current = { href, folder: href.split('/')[3] || '', name: href.split('/').pop().replace(/\.css$/, ''), bytes: 0 };
      sheets.push(current);
    } else if (current) {
      current.bytes += size;
    } else {
      headerBytes += size;
    }
  });

  const share = (bytes) => (totalBytes ? Number(((bytes / totalBytes) * 100).toFixed(2)) : 0);
  for (const sheet of sheets) {
    sheet.share = share(sheet.bytes);
    const when = whenOf(sheet.name);
    if (when) sheet.when = when;
  }

  const byFolder = new Map();
  for (const sheet of sheets) {
    const row = byFolder.get(sheet.folder) || { folder: sheet.folder, sheets: 0, bytes: 0 };
    row.sheets += 1;
    row.bytes += sheet.bytes;
    byFolder.set(sheet.folder, row);
  }
  const folders = [...byFolder.values()]
    .map((row) => ({ ...row, share: share(row.bytes) }))
    .sort((a, b) => b.bytes - a.bytes || a.folder.localeCompare(b.folder));

  const sheetBytes = sheets.reduce((total, sheet) => total + sheet.bytes, 0);
  return {
    totalBytes,
    headerBytes,
    provenanceBytes,
    sheetBytes,
    balanced: sheetBytes + provenanceBytes + headerBytes === totalBytes,
    folders,
    sheets,
  };
}

/** Sheets in a first-paint bundle whose only named owner mounts later than first paint. */
export function lateOwnedSheets(shares) {
  return shares.sheets
    .filter((sheet) => sheet.when && sheet.when !== 'immediate')
    .sort((a, b) => b.bytes - a.bytes);
}

export const formatKiB = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
