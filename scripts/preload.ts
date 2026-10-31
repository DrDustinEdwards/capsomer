/**
 * The home page's preload `Link` header (site-runtime `./preload`), from the built site: the stylesheet the home page
 * links and the two faces its first screen paints in, Schibsted Grotesk (headings and interface) and Source Serif 4
 * (prose). Vite hashes their names, so they are read from site-dist after each build and written to
 * worker/preload.generated.json, which the Worker bundles. A build missing one of them fails rather than preloading
 * nothing.
 */

import { preloads } from "@dustinedwards/site-runtime/preload";

const FACES = [/\/assets\/schibsted-grotesk-latin-wght-normal-[\w-]+\.woff2/, /\/assets\/source-serif-4-latin-wght-normal-[\w-]+\.woff2/];

/** The `Link` header value for the home page in `outDir`. */
function homePreloadHeader(outDir: string): string {
  const { readFileSync } = process.getBuiltinModule("node:fs");
  const html = readFileSync(`${outDir}/index.html`, "utf8");
  // Vite marks its stylesheet links crossorigin, so the preload must match, or the browser fetches the file twice.
  const styles = [...html.matchAll(/<link rel="stylesheet"([^>]*)href="(\/assets\/[^"]+\.css)"/g)].map((m) => ({
    href: m[2] as string,
    cors: /\bcrossorigin\b/.test(m[1] as string),
  }));
  if (!styles.length) throw new Error("preload: site-dist/index.html links no stylesheet under /assets/.");
  const css = styles.map(({ href }) => readFileSync(`${outDir}${href}`, "utf8")).join("\n");
  const fonts = FACES.map((face) => {
    const href = face.exec(css)?.[0];
    if (!href) throw new Error(`preload: the home page's stylesheet names no font matching ${face}.`);
    return href;
  });
  return preloads([
    ...styles.map(({ href, cors }) => ({ href, as: "style" as const, ...(cors ? { crossOrigin: "anonymous" as const } : {}) })),
    ...fonts.map((href) => ({ href, as: "font" as const, type: "font/woff2" })),
  ]).header;
}

/** Writes worker/preload.generated.json for the site built into `outDir`. */
export function writePreloadFile(outDir: string, workerDir: string): void {
  const { writeFileSync } = process.getBuiltinModule("node:fs");
  writeFileSync(`${workerDir}/preload.generated.json`, `${JSON.stringify({ header: homePreloadHeader(outDir) })}\n`);
}
