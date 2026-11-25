// An SVG drawn from the module matrix a QR encoder returns, so Capsomer carries no encoder. The site
// encodes (`encode(url, { ecc: "M", border: 0 }).data` with uqr) and passes the matrix; this draws one
// path, dark modules on white with a quiet zone whatever the theme, because a scanner reads contrast.

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

export function qrSize(modules: ReadonlyArray<ReadonlyArray<boolean>>, quiet = 2): number {
  return modules.length + 2 * quiet;
}

export function qrLabel(url: string): string {
  return `QR code for ${url}`;
}

/** Refuses anything but an absolute http(s) address: a code a reader scans opens a page. */
export function checkQrUrl(url: string): string {
  if (!/^https?:\/\/\S+$/.test(url))
    throw new Error(`qr: a QR code encodes an absolute address; got ${JSON.stringify(url)}.`);
  return url;
}
