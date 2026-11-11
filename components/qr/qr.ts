// The QR code: an SVG drawn from the module matrix a QR encoder returns, so Capsomer carries no
// encoder of its own. The site encodes (dustinedwards.info uses uqr: `encode(url, { ecc: "M", border: 0 }).data`)
// and passes the matrix; this draws it as one path, dark modules on a white ground with a quiet zone,
// whatever the reader's theme, because a scanner reads contrast. From dustinedwards.info
// (app/kb/procedures/qr.mjs and the procedure sheet's figure).

/** The matrix as one path, each row's runs of dark modules as rectangles, offset by the quiet zone. */
export function qrPath(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet = 2): string {
  const parts: string[] = [];
  modules.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (!row[x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < row.length && row[x]) x += 1;
      parts.push(`M${start + quiet} ${y + quiet}h${x - start}v1h-${x - start}z`);
    }
  });
  return parts.join("");
}

/** The side of the drawing in modules, quiet zone included. */
export function qrSize(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet = 2): number {
  return modules.length + 2 * quiet;
}

/** The code's name: what scanning it opens. */
export function qrLabel(url: string): string {
  return `QR code for ${url}`;
}

/** Refuses anything but an absolute http(s) address: a code a reader scans opens a page. */
export function checkQrUrl(url: string): string {
  if (!/^https?:\/\/\S+$/.test(url))
    throw new Error(`qr: a QR code encodes an absolute address; got ${JSON.stringify(url)}.`);
  return url;
}
