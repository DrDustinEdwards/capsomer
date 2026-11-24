// The theme route, apart from theme-cookie.ts so the browser's switch does not bundle its server helpers.

import { readCapped } from "@dustinedwards/site-runtime/body";
import { mediaType, redirectResponse, textResponse } from "@dustinedwards/site-runtime/http";
import { isThemeChoice, THEME_COOKIE, themeCookie, type ThemeChoice } from "./theme-cookie.ts";

const isJson = (request: Request): boolean =>
  mediaType(request.headers.get("content-type")) === "application/json";

// The page a theme post goes back to: the Referer, only when it is this site's own. The Referer is the sender's to
// write, so anything else is "/" and the route is no open redirect. A path that starts "//" is refused too:
// `Location: //evil.example` is protocol-relative and resolves against another host (dustinedwards.info's
// return-to.mjs, where this was first written).
export function themeReturnTo(request: Request): string {
  const referer = request.headers.get("referer");
  if (!referer) return "/";
  try {
    const url = new URL(referer);
    if (url.origin !== new URL(request.url).origin || url.pathname.startsWith("//")) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}

// A theme body is one short field; anything longer is not one.
const THEME_BODY_MAX = 1024;

// The choice a theme request carries: `theme=light|dark` from a form (the no-script ThemeForm), or `{ "theme": ... }`
// from a fetch (an onSave hook). Anything else, a body over 1 KB included, is null.
export async function readThemeChoice(request: Request): Promise<ThemeChoice | null> {
  let text: string | null;
  try {
    text = await readCapped(request, THEME_BODY_MAX);
  } catch {
    return null;
  }
  if (text === null) return null;
  if (isJson(request)) {
    try {
      const body: unknown = JSON.parse(text);
      const value = body && typeof body === "object" ? (body as { theme?: unknown }).theme : null;
      return isThemeChoice(value) ? value : null;
    } catch {
      return null;
    }
  }
  const value = new URLSearchParams(text).get("theme");
  return isThemeChoice(value) ? value : null;
}

export interface ThemeActionOptions {
  /** The site's cookie ("theme" by default); false writes none (a signed-in account keeps the choice instead). */
  cookie?: string | false;
  /** false for a local http dev server. */
  secure?: boolean;
  /** Saves the choice for the signed-in person (their account row), before the response is written. */
  save?: (choice: ThemeChoice) => void | Promise<unknown>;
}

// The site's theme route (POST /theme), whole: read the choice, save it where the site keeps it, and answer. A form
// post (no script) gets 303 back to the page it came from, which the server then renders in the new theme; a fetch
// (JSON) gets 204. A missing or bad choice is 400, never a silent default. Every answer is no-store. The site checks
// the request's origin first (site-runtime's refuseCrossSite), as for any post.
export async function themeAction(
  request: Request,
  opts: ThemeActionOptions = {},
): Promise<Response> {
  const { cookie = THEME_COOKIE, secure = true, save } = opts;
  const choice = await readThemeChoice(request);
  if (!choice) return textResponse("Theme must be light or dark.\n", 400);
  if (save) await save(choice);
  const headers = new Headers({ "cache-control": "private, no-store" });
  if (cookie !== false) headers.set("set-cookie", themeCookie(choice, { name: cookie, secure }));
  if (isJson(request)) return new Response(null, { status: 204, headers });
  return redirectResponse(themeReturnTo(request), 303, headers);
}
