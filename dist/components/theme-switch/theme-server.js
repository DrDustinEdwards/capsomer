// The theme switch's server half: what a server-rendered site needs so the first byte already carries the person's
// theme. Read the cookie, write it, and the one-line pre-paint script for a site that remembers the choice in
// localStorage instead. No DOM and no framework, so it runs in a Worker, in Node and in the browser alike.
// dustinedwards.info, Foxhound and txasm each wrote this for themselves; it lives here once.
/** The localStorage key the theme switch remembers the choice under, unless a switch names its own (data-cap-pref). */
export const THEME_PREF = "cap-theme";
/** The cookie a site remembers the choice in, unless it has its own (txasm's "txasm_theme", Foxhound's "fh_theme"). */
export const THEME_COOKIE = "theme";
/** A year: the choice should outlast any visit gap a person would expect it to survive. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export function isThemeChoice(value) {
    return value === "light" || value === "dark";
}
// The person's remembered choice from a Cookie header (or the request carrying one), or null when they never chose,
// so the page follows the system. Anything unreadable is null too: a bad cookie costs the default theme, never a 500.
export function readThemeCookie(source, name = THEME_COOKIE) {
    const header = typeof source === "string" || source == null ? source : source.headers.get("cookie");
    if (!header)
        return null;
    for (const part of header.split(";")) {
        const at = part.indexOf("=");
        if (at < 0 || part.slice(0, at).trim() !== name)
            continue;
        try {
            const value = decodeURIComponent(part.slice(at + 1).trim());
            return isThemeChoice(value) ? value : null;
        }
        catch {
            return null;
        }
    }
    return null;
}
// The Set-Cookie value that remembers a choice: a year, the whole site, SameSite=Lax and Secure. A local http dev
// server passes secure: false.
export function themeCookie(choice, opts = {}) {
    const { name = THEME_COOKIE, maxAge = THEME_COOKIE_MAX_AGE, secure = true } = opts;
    return `${name}=${choice}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? "; Secure" : ""}`;
}
// The content of <meta name="color-scheme">: the choice, or "light dark" with none. data-theme means nothing until
// the CSS parses, so without this the canvas the browser paints between pages is light.
export function colorSchemeContent(choice) {
    return choice ?? "light dark";
}
export function themeColorTags(choice, ground) {
    if (choice)
        return [{ name: "theme-color", content: ground[choice] }];
    return ["light", "dark"].map((s) => ({ name: "theme-color", content: ground[s], media: `(prefers-color-scheme: ${s})` }));
}
// The same tags as an HTML string, for a site that writes its head as text.
export function themeColorMeta(choice, ground) {
    return themeColorTags(choice, ground)
        .map((t) => `<meta name="theme-color"${t.media ? ` media="${t.media}"` : ""} content="${t.content}">`)
        .join("");
}
// The pre-paint script for a site that remembers the choice in localStorage: run inline in the head, before the
// stylesheet, or the page flashes the other theme. A site with a Content Security Policy allows it by its hash, so
// the text must be exactly this.
export function themeScript(key = THEME_PREF) {
    return `try{var t=localStorage.getItem(${JSON.stringify(key)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
}
