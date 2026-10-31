/**
 * The showcase site's Worker: site-runtime's `staticSite`, the one front door the family's static sites share. It
 * receives Content-Security-Policy violation reports at /csp-report (limited by CSP_REPORT_RATE_LIMIT), serves the
 * prefetch rules at /speculation-rules.json, and sends every page with the Speculation-Rules, Server-Timing and preload
 * Link headers (so Early Hints answers with a 103), and the security set from the site's registry entry
 * (@dustinedwards/site-runtime/sites, capsomer) with the TDMRep header, the set `_headers` is written from. A path with
 * no file gets site-dist/404.html with status 404 and `private, no-store`, and so does a page asked for with a cookie.
 * wrangler.jsonc runs it first for every path but /assets/*, the hashed files, which the asset server answers with the
 * immutable cache rule from `_headers`. Pages end in a slash (/make/), which the asset server's auto-trailing-slash
 * redirect keeps, so there is no canonical redirect here.
 */

import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { capsomer } from "@dustinedwards/site-runtime/sites";
import { staticSite } from "@dustinedwards/site-runtime/static-site";
// Written by the site build (scripts/preload.ts) from the hashed names in site-dist.
import preload from "./preload.generated.json";

export default staticSite({ site: capsomer, headers: TDM_RESERVATION_HEADERS, preload: preload.header, canonical: false });
