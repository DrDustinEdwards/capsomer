/**
 * The showcase site's Worker: it receives Content-Security-Policy violation reports and nothing else.
 * wrangler.jsonc runs it first only for /csp-report (`run_worker_first`), so every other request is
 * answered by Workers static assets directly, with the headers from `_headers`. The report response
 * carries the same security set, from scripts/security-headers.ts.
 */

import { receiveCspReport } from "@dustinedwards/site-runtime/csp-report";
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
    return env.ASSETS.fetch(request);
  },
};
