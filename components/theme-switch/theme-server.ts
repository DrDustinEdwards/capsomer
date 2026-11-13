// The theme switch's server half: what a server-rendered site needs so the first byte already carries the person's
// theme. Read the cookie, write it, and the one-line pre-paint script for a site that remembers the choice in
// localStorage instead. No DOM and no framework, so it runs in a Worker, in Node and in the browser alike.
// dustinedwards.info, Foxhound and txasm each wrote this for themselves; it lives here once.

import { mediaType, redirectResponse, textResponse } from "@dustinedwards/site-runtime/http";

const isJson = (request: Request): boolean =>
  mediaType(request.headers.get("content-type")) === "application/json";

export type ThemeChoice = "light" | "dark";

/** The localStorage key the theme switch remembers the choice under, unless a switch names its own (data-cap-pref). */
export const THEME_PREF = "cap-theme";

/** The cookie a site remembers the choice in, unless it has its own (txasm's "txasm_theme", Foxhound's "fh_theme"). */
export const THEME_COOKIE = "theme";
/** A year: the choice should outlast any visit gap a person would expect it to survive. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark";
}

// The person's remembered choice from a Cookie header (or the request carrying one), or null when they never chose,
// so the page follows the system. Anything unreadable is null too: a bad cookie costs the default theme, never a 500.
export function readThemeCookie(
  source: Request | string | null | undefined,
  name = THEME_COOKIE,
): ThemeChoice | null {
  const header =
    typeof source === "string" || source == null ? source : source.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const at = part.indexOf("=");
    if (at < 0 || part.slice(0, at).trim() !== name) continue;
    try {
      const value = decodeURIComponent(part.slice(at + 1).trim());
      return isThemeChoice(value) ? value : null;
    } catch {
      return null;
    }
  }
  return null;
}

// The Set-Cookie value that remembers a choice: a year, the whole site, SameSite=Lax and Secure. A local http dev
// server passes secure: false.
export function themeCookie(
  choice: ThemeChoice,
  opts: { name?: string; maxAge?: number; secure?: boolean } = {},
): string {
  const { name = THEME_COOKIE, maxAge = THEME_COOKIE_MAX_AGE, secure = true } = opts;
  return `${name}=${choice}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}

// The content of <meta name="color-scheme">: the choice, or "light dark" with none. data-theme means nothing until
// the CSS parses, so without this the canvas the browser paints between pages is light.
export function colorSchemeContent(choice: ThemeChoice | null): "light" | "dark" | "light dark" {
  return choice ?? "light dark";
}

// The <meta name="theme-color"> tags as descriptors ({ name, content, media }), so a phone's browser bar matches the
// page's ground in both themes: one for a person's choice, or one per scheme (with its media query) when they never
// chose. `ground` is the site's --ground in each theme, as literal colors: browser chrome resolves no custom property.
// A React Layout renders them with <ThemeColor> (capsomer/react/theme-switch); a meta() can return them as they are.
// The theme switch keeps the tags in step when the person switches (theme-switch.ts).
export interface ThemeColorTag {
  name: "theme-color";
  content: string;
  media?: string;
}

export function themeColorTags(
  choice: ThemeChoice | null,
  ground: { light: string; dark: string },
): ThemeColorTag[] {
  if (choice) return [{ name: "theme-color", content: ground[choice] }];
  return (["light", "dark"] as const).map((s) => ({
    name: "theme-color",
    content: ground[s],
    media: `(prefers-color-scheme: ${s})`,
  }));
}

// The same tags as an HTML string, for a site that writes its head as text.
export function themeColorMeta(
  choice: ThemeChoice | null,
  ground: { light: string; dark: string },
): string {
  return themeColorTags(choice, ground)
    .map(
      (t) =>
        `<meta name="theme-color"${t.media ? ` media="${t.media}"` : ""} content="${t.content}">`,
    )
    .join("");
}

// The pre-paint script: run inline in the head, before the stylesheet, or the page flashes the other theme. A site with
// a Content Security Policy allows it by its hash, so the text must be exactly what this returns (hash its output).
// With no options it applies the choice remembered in localStorage, the 0.1.0 script, unchanged. With `cookie` (the site
// keeps the choice in that cookie) it leaves alone a data-theme the server already wrote, and otherwise applies the
// cookie's choice, else localStorage's: a page served from a cache, or written with no request, still opens in the
// person's theme, and a server's answer (Foxhound's account choice) is never overruled by an older one in this browser.
export function themeScript(key = THEME_PREF, opts: { cookie?: string } = {}): string {
  if (!opts.cookie)
    return `try{var t=localStorage.getItem(${JSON.stringify(key)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
  return `try{var d=document.documentElement;if(!d.hasAttribute("data-theme")){var c=("; "+document.cookie).split(${JSON.stringify(`; ${opts.cookie}=`)})[1],t=c?c.split(";")[0]:localStorage.getItem(${JSON.stringify(key)});if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}}catch(e){}`;
}

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
  let text: string;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (text.length > THEME_BODY_MAX) return null;
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
