// The theme switch's cookie and meta half: what a server-rendered site needs so the first byte carries the
// person's theme. No DOM and no framework, so it runs in a Worker, Node and the browser.
export const THEME_PREF = "cap-theme";
/** The cookie a site remembers the choice in, unless it has its own (txasm's "txasm_theme", Foxhound's "fh_theme"). */
export const THEME_COOKIE = "theme";
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
    return ["light", "dark"].map((s) => ({
        name: "theme-color",
        content: ground[s],
        media: `(prefers-color-scheme: ${s})`,
    }));
}
export function themeColorMeta(choice, ground) {
    return themeColorTags(choice, ground)
        .map((t) => `<meta name="theme-color"${t.media ? ` media="${t.media}"` : ""} content="${t.content}">`)
        .join("");
}
// The pre-paint script: run inline in the head, before the stylesheet, or the page flashes the other theme. A site with
// a Content Security Policy allows it by its hash, so the text must be exactly what this returns (hash its output).
// With no options it applies the choice remembered in localStorage. With `cookie` (the site
// keeps the choice in that cookie) it leaves alone a data-theme the server already wrote, and otherwise applies the
// cookie's choice, else localStorage's: a page served from a cache, or written with no request, still opens in the
// person's theme, and a server's answer (Foxhound's account choice) is never overruled by an older one in this browser.
export function themeScript(key = THEME_PREF, opts = {}) {
    if (!opts.cookie)
        return `try{var t=localStorage.getItem(${JSON.stringify(key)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
    return `try{var d=document.documentElement;if(!d.hasAttribute("data-theme")){var c=("; "+document.cookie).split(${JSON.stringify(`; ${opts.cookie}=`)})[1],t=c?c.split(";")[0]:localStorage.getItem(${JSON.stringify(key)});if(t==="light"||t==="dark")d.setAttribute("data-theme",t)}}catch(e){}`;
}
