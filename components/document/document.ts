// The document's root: the attributes that put a page under its family and site layer, and the
// start of a page that does not. One home for what every site's root.tsx and site.ts wrote by hand.
// Extracted from bsw, julieedwards-info, germomics and txasm (root.tsx, app/site.ts, germomics app/lib/hydration.ts)
// in 0.131.0.

export interface DocumentScope {
  // A Capsomer family (data-family): purple, fox, teal, navy, forest, amber and the rest.
  family?: string;
  // A site layer (data-cap-site), from SITES in tokens/sites.mjs.
  site?: string;
  // A pinned theme (data-theme), or none to follow the system.
  theme?: "light" | "dark" | null;
}

// The attributes for <html> or a wrapper. Undefined values are left out, so a spread writes only what is set.
export function documentAttrs({ family, site, theme }: DocumentScope): Record<string, string> {
  const attrs: Record<string, string> = {};
  if (family) attrs["data-family"] = family;
  if (site) attrs["data-cap-site"] = site;
  if (theme === "light" || theme === "dark") attrs["data-theme"] = theme;
  return attrs;
}

export type Starter = () => unknown;

// Starts a page that does not hydrate: runs each part (Capsomer's enhance functions, the site's islands) in order,
// each on its own, so one that throws never stops the rest, and reports what failed. Call it after site-runtime's
// startPage() (./page-client), which installs the Trusted Types policy every part writes through.
export function startSite(
  parts: readonly Starter[],
  report: (error: unknown) => void = (e) => console.error(e),
): number {
  let failed = 0;
  for (const part of parts) {
    try {
      const r = part();
      if (r instanceof Promise) r.catch(report);
    } catch (error) {
      failed++;
      report(error);
    }
  }
  return failed;
}
