// capsomer/build: the one way a site without a CSS bundler (a static build script, a specimen, an explorer) turns
// Capsomer's stylesheets and behavior modules into the files it serves. Node only. Carrel's www, Prelum's specimen and
// Capsid's explorer each had their own inlineCss, font copy and script bundler; this is that code once.
import { cpSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The package's own root, so a part is named by its path in the package ("components/button/button.css"). */
export const CAPSOMER_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const IMPORT = /@import\s+(?:url\()?"([^"]+)"\)?(?:\s+layer\(([^)]+)\))?\s*;/g;

/**
 * A stylesheet with every @import read in place, a layered import inside its layer. A relative path resolves beside
 * the file; a bare specifier ("enarratio/base.css", "capsomer/button.css") resolves as a bundler would, from the file.
 *
 * @param {string} file
 * @returns {string}
 */
export function inlineCss(file) {
  const require = createRequire(resolve(file));
  return readFileSync(file, "utf8").replace(IMPORT, (_, path, layer) => {
    const inner = inlineCss(/^[./]/.test(path) ? join(dirname(file), path) : require.resolve(path));
    return layer ? `@layer ${layer} {\n${inner}\n}` : inner;
  });
}

/** A part named by its short component name ("button") or its path in the package ("tokens/site-capsid.css"). */
function partFile(/** @type {string} */ part) {
  if (part.endsWith(".css")) return join(CAPSOMER_ROOT, part);
  return join(CAPSOMER_ROOT, "components", part, `${part}.css`);
}

/**
 * One stylesheet with Capsomer in it, in the order its layers expect: the fonts (their files under `fontsUrl`), the
 * tokens, the family (inside cap.tokens), base, the link system, then each part, the site's token layer and the
 * site's own CSS last.
 *
 * @param {{
 *   family?: string,
 *   site?: string,
 *   parts?: readonly string[],
 *   fonts?: boolean,
 *   fontsUrl?: string,
 *   prose?: boolean,
 *   before?: readonly string[],
 *   after?: readonly string[],
 * }} [options]
 * @returns {string}
 */
export function capsomerStylesheet({
  family,
  site,
  parts = [],
  fonts = true,
  fontsUrl = "fonts/",
  prose = false,
  before = [],
  after = [],
} = {}) {
  const css = [];
  if (fonts)
    css.push(inlineCss(join(CAPSOMER_ROOT, "css", "fonts.css")).replaceAll("../fonts/", fontsUrl));
  css.push(...before);
  css.push(inlineCss(join(CAPSOMER_ROOT, "css", "tokens.css")));
  if (family)
    css.push(
      `@layer cap.tokens {\n${inlineCss(join(CAPSOMER_ROOT, "tokens", `family-${family}.css`))}\n}`,
    );
  css.push(inlineCss(join(CAPSOMER_ROOT, "css", "base.css")));
  // The link system's kinds after the base, as components/link/link.md asks.
  css.push(inlineCss(partFile("link")));
  if (prose) css.push(inlineCss(join(CAPSOMER_ROOT, "css", "prose.css")));
  for (const part of parts) if (part !== "link") css.push(inlineCss(partFile(part)));
  if (site) css.push(inlineCss(join(CAPSOMER_ROOT, "tokens", `site-${site}.css`)));
  css.push(...after);
  return css.join("\n\n");
}

/**
 * Copies Capsomer's font files to `to`, where capsomerStylesheet's `fontsUrl` points.
 *
 * @param {string} to
 */
export function copyFonts(to) {
  cpSync(join(CAPSOMER_ROOT, "fonts"), to, { recursive: true });
}

/**
 * A stylesheet minified with Lightning CSS, which keeps layers and cascade order. Lightning CSS comes with Vite; a
 * site without it installs `lightningcss`.
 *
 * @param {string} css
 * @returns {Promise<string>}
 */
export async function minifyCss(css) {
  const { transform } = await import("lightningcss");
  const { code } = transform({ filename: "capsomer.css", code: Buffer.from(css), minify: true });
  return code.toString();
}

/**
 * A browser script bundled as one minified file, Capsomer's behavior modules and every lazy import inlined, so one
 * script hash or integrity value covers all of it. Rolldown comes with Vite; a site without it installs `rolldown`.
 *
 * @param {string} entry
 * @param {{ format?: "esm" | "iife", name?: string }} [options]
 * @returns {Promise<string>}
 */
export async function bundleScript(entry, { format = "esm", name } = {}) {
  const { rolldown } = await import("rolldown");
  const built = await rolldown({ input: entry, platform: "browser", logLevel: "silent" });
  const { output } = await built.generate({
    format,
    name,
    minify: true,
    inlineDynamicImports: true,
  });
  await built.close();
  const [chunk] = output;
  if (output.length !== 1 || chunk?.type !== "chunk")
    throw new Error(`${entry}: expected one chunk`);
  return chunk.code;
}
