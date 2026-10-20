/**
 * The showcase site's Worker: it receives Content-Security-Policy violation reports and nothing else.
 * wrangler.jsonc runs it first only for /csp-report (`run_worker_first`), so every other request is
 * answered by Workers static assets directly, with the headers from `_headers`. The report response
 * carries the same security set, from scripts/security-headers.ts.
 */

import { receiveCspReport } from "@dustinedwards/site-runtime/csp-report";
import { REPORT_PATH, securityHeaders } from "../scripts/security-headers.ts";

/** The assets binding wrangler provides as `env.ASSETS`. */
export interface Env {
  readonly ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === REPORT_PATH) {
      return receiveCspReport(request, { headers: securityHeaders });
    }
    return env.ASSETS.fetch(request);
  },
};
