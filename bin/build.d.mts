// Types for capsomer/build (bin/build.mjs). Node only.
/** The package's own root. */
export const CAPSOMER_ROOT: string;
/** A stylesheet with every @import read in place, a layered import inside its layer. */
export function inlineCss(file: string, seen?: Set<string>): string;
export interface StylesheetOptions {
  /** The color family, inside cap.tokens ("teal" reads tokens/family-teal.css). */
  family?: string;
  /** The site's token layer ("capsid" reads tokens/site-capsid.css), after the parts. */
  site?: string;
  /** Components by name ("button") or paths in the package ("css/enarratio.css"), in order. */
  parts?: readonly string[];
  /** Capsomer's faces first (default true), their files under fontsUrl. */
  fonts?: boolean;
  /** Where copyFonts put the files, relative to the stylesheet (default "fonts/"). */
  fontsUrl?: string;
  /** css/prose.css after the link system. */
  prose?: boolean;
  /** CSS before the tokens (a site's own @font-face). */
  before?: readonly string[];
  /** CSS after everything (the site's own stylesheet). */
  after?: readonly string[];
}
/** One stylesheet with Capsomer in it, in the order its layers expect. */
export function capsomerStylesheet(options?: StylesheetOptions): string;
/** Copies Capsomer's font files to `to`. */
export function copyFonts(to: string): void;
/** Minified with Lightning CSS (layers and cascade order kept). */
export function minifyCss(css: string): Promise<string>;
/** A browser script bundled as one minified file, every lazy import inlined. */
export function bundleScript(
  entry: string,
  options?: { format?: "esm" | "iife"; name?: string },
): Promise<string>;
