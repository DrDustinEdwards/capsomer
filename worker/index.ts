/**
 * The showcase site's Worker: site-runtime's `staticSite`, the front door the family's static sites
 * share. It takes CSP violation reports at /csp-report, serves /speculation-rules.json, and adds the
 * Speculation-Rules, Server-Timing, preload Link (so Early Hints answers with a 103) and security
 * headers from the site's registry entry. A path with no file, or a page asked for with a cookie,
 * gets site-dist/404.html with status 404 and `private, no-store`. wrangler.jsonc runs it first for
 * every path but /assets/* (hashed files, served immutable). Pages end in a slash, which the asset
 * server's auto-trailing-slash redirect keeps, so there is no canonical redirect here.
 *
 * It also answers /network.json for the front page's network board (site/network-board.ts): each
 * site's lamp from its own /health, read here because those answers carry no CORS header. Held at
 * the edge for a minute so readers never fan out to the six sites.
 */

import { serveMarkdownCopies } from "@drdustinedwards/site-helpers/llms";
import { TDM_RESERVATION_HEADERS } from "@drdustinedwards/site-helpers/robots";
import { jsonResponse } from "@dustinedwards/site-runtime/http";
import { capsomer } from "@dustinedwards/site-runtime/sites";
import { staticSite, type StaticSiteEnv } from "@dustinedwards/site-runtime/static-site";
import { FAMILY_SITES } from "../components/family-footer/family-footer.ts";
import { lampOf } from "../site/network-board.ts";
// Written by the site build (scripts/preload.ts) from the hashed names in site-dist.
import preload from "./preload.generated.json";

const site = staticSite({
  site: capsomer,
  siteName: "Capsomer",
  headers: TDM_RESERVATION_HEADERS,
  preload: preload.header,
  canonical: false,
});
const NETWORK_PATH = "/network.json";
const HOLD_SECONDS = 60;
const TIMEOUT_MS = 4000;

async function lamp(href: string, own: URL, request: Request, env: StaticSiteEnv) {
  try {
    // Capsomer's own /health is this Worker's: ask the handler directly rather than going out and back in.
    const response =
      new URL(href).host === own.host
        ? await site.fetch(new Request(new URL("/health", own), { headers: request.headers }), env)
        : await fetch(new URL("/health", href), {
            headers: { accept: "application/health+json" },
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
    const body = (await response.json()) as { status?: unknown };
    return lampOf(body.status);
  } catch {
    return lampOf(undefined);
  }
}

async function network(
  request: Request,
  env: StaticSiteEnv,
  ctx?: { waitUntil(p: Promise<unknown>): void },
) {
  const url = new URL(request.url);
  const cache = (globalThis as { caches?: { default?: Cache } }).caches?.default;
  const key = new Request(new URL(NETWORK_PATH, url));
  const held = await cache?.match(key);
  if (held) return held;
  const lamps = await Promise.all(
    FAMILY_SITES.map(async (s) => [s.id, await lamp(s.href, url, request, env)] as const),
  );
  const response = jsonResponse(
    { sites: Object.fromEntries(lamps), time: new Date().toISOString() },
    200,
    { "cache-control": `public, max-age=${HOLD_SECONDS}`, "x-robots-tag": "noindex" },
  );
  if (cache) ctx?.waitUntil(cache.put(key, response.clone()));
  return response;
}

// Each page's Markdown copy (/icons.md, or Accept: text/markdown) and llms-full.txt are files `npm run site` writes with
// prelum-markdown; serveMarkdownCopies answers them.
const pages = serveMarkdownCopies(
  (request: Request, env: StaticSiteEnv) => site.fetch(request, env),
  {
    origin: capsomer.origin,
  },
);

export default {
  fetch(
    request: Request,
    env: StaticSiteEnv,
    ctx?: { waitUntil(p: Promise<unknown>): void },
  ): Promise<Response> {
    if (new URL(request.url).pathname === NETWORK_PATH && request.method === "GET")
      return network(request, env, ctx);
    return pages(request, env);
  },
};
