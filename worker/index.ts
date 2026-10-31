/**
 * The showcase site's Worker: it receives Content-Security-Policy violation reports and answers paths with no file.
 * wrangler.jsonc runs it first only for /csp-report (`run_worker_first`), so every request for a file is
 * answered by Workers static assets directly, with the headers from `_headers`. The report response
 * carries the same security set, from scripts/security-headers.ts. A GET or HEAD for a path with no file reaches
 * the Worker (`not_found_handling` is none), which sends the 404 page with charset=utf-8: no `_headers` rule can match
 * a path that has no file, so the asset server's own 404 page went out as a bare text/html (ASVS 4.1.1).
 */

import { receiveCspReport } from "@dustinedwards/site-runtime/csp-report";
import { applyHeaderSet } from "@dustinedwards/site-runtime/headers";
import { REPORT_PATH, securityHeaders } from "../scripts/security-headers.ts";

/** The assets binding and the report endpoint's rate limit (wrangler.jsonc). */
export interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
  readonly CSP_REPORT_RATE_LIMIT: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === REPORT_PATH) {
      // Keyed on the edge-set client address, which is counted and never logged; a refusal drops the report (still 204).
      const allow = async (r: Request) =>
        (await env.CSP_REPORT_RATE_LIMIT.limit({ key: r.headers.get("CF-Connecting-IP") ?? "unknown" })).success;
      return receiveCspReport(request, { headers: securityHeaders, allow });
    }
    if (request.method !== "GET" && request.method !== "HEAD") return env.ASSETS.fetch(request);
    // The 404 page is site-dist/404.html, served at /404 by the assets' html_handling. It carries the site's security
    // set itself, and applyHeaderSet adds charset=utf-8 to the bare text/html.
    const page = await env.ASSETS.fetch(new Request(new URL("/404", request.url)));
    const notFound = new Response(request.method === "HEAD" ? null : page.body, { status: 404, headers: page.headers });
    applyHeaderSet(notFound.headers, securityHeaders);
    return notFound;
  },
};
