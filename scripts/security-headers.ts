/**
 * The showcase site's security headers: its own list of what it loads, and site-runtime's builders
 * (`@dustinedwards/site-runtime`). This is the only place they are set up. The site build
 * (site/vite.config.ts) calls `writeHeadersFile` to put them in `site-dist/_headers` for every static
 * file, and the Worker (`worker/index.ts`) sends `securityHeaders` on the one response it makes itself,
 * the report endpoint. Site tooling only: the package never imports this or site-runtime.
 */

import { buildContentSecurityPolicy, reportingEndpoints } from "@dustinedwards/site-runtime/csp";
import { buildSecurityHeaders, headersFile as sharedHeadersFile, STANDARD_SECURITY_HEADERS } from "@dustinedwards/site-runtime/headers";
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";

/** The site's address (rulings.md, rule 16). */
const HOST = "capsomer.dustinedwards.info";

/** Where browsers send Content-Security-Policy violation reports; the Worker logs them. */
export const REPORT_PATH = "/csp-report";

/** The Reporting API group the policy's `report-to` names. */
const REPORT_GROUP = "csp-endpoint";

/**
 * The policy, from what the site loads beyond its own origin. Styles come from the site's own files
 * only, with dynamic values set through the CSSOM, the rule the site asks of the apps, so there is no
 * style allowance. Test results are read at runtime from the repo's results branch on
 * raw.githubusercontent.com. Images may be `data:` URLs. Cloudflare Web Analytics' injected beacon may
 * run (a public site; Dustin's analytics ruling, 2026-10-03); it reports to this origin's /cdn-cgi/rum.
 * The site shows its own pages in frames (the states pages in site/main.tsx, the specimens in
 * site/specimen.ts), so its own origin may frame it and no other.
 */
const csp = buildContentSecurityPolicy({
  sources: { img: ["data:"], connect: ["https://raw.githubusercontent.com"] },
  cloudflareWebAnalytics: true,
  framedBySameOrigin: true,
  reportUri: REPORT_PATH,
  reportTo: REPORT_GROUP,
});

/** The standard Permissions-Policy, with the clipboard's write side allowed to the site's own pages. */
const permissionsPolicy = (STANDARD_SECURITY_HEADERS["Permissions-Policy"] ?? "").replace(
  "clipboard-write=()",
  "clipboard-write=(self)",
);

/** The shared standard set with the site's deviations, which the check grades against. */
export const standardHeaders = buildSecurityHeaders({
  overrides: {
    "Permissions-Policy": {
      value: permissionsPolicy,
      reason:
        "The states pages show the detail panel's and media library's Copy buttons working (navigator.clipboard.writeText); every other feature stays denied.",
    },
    "X-Frame-Options": {
      value: "sameorigin",
      reason:
        "The site frames its own states pages and specimens (site/main.tsx, site/specimen.ts); frame-ancestors 'self' says the same to browsers that read it.",
    },
  },
});

/** Every security header the site sends, in the order `_headers` lists them. */
export const securityHeaders: Readonly<Record<string, string>> = Object.freeze({
  ...standardHeaders,
  [csp.name]: csp.value,
  // The group `report-to` names; `report-uri` covers browsers without the Reporting API.
  "Reporting-Endpoints": reportingEndpoints(REPORT_GROUP, new URL(REPORT_PATH, `https://${HOST}`)),
  // Training rights reserved (TDMRep), as the site's ai.txt says; Prelum's, like every family site.
  ...TDM_RESERVATION_HEADERS,
});

/** Vite writes hashed file names under /assets/, so they never change and may be cached for a year. */
const ASSETS_CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * The `_headers` file Workers static assets reads, from site-runtime's `headersFile`: the security set on every path,
 * and the cache rule on the hashed assets. The shared writer leaves the page policy out of `/*`, since most sites render
 * pages with their own; every page here is a static file under this one policy, so a second `/*` rule carries it
 * (Cloudflare joins the headers of every rule a path matches).
 */
export function headersFile(): string {
  const { [csp.name]: policy, ...set } = securityHeaders;
  return sharedHeadersFile(set, {
    paths: {
      "/*": { [csp.name]: policy as string },
      "/assets/*": { "Cache-Control": ASSETS_CACHE_CONTROL },
    },
  });
}

/**
 * Writes `_headers` into the built site. node:fs is fetched when called rather than imported, because
 * the Worker imports this module and the Workers runtime has no node:fs.
 */
export function writeHeadersFile(outDir: string): void {
  const { writeFileSync } = process.getBuiltinModule("node:fs");
  writeFileSync(`${outDir}/_headers`, headersFile());
}
