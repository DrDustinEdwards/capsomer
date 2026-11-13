// "Keep on this device": a page, and the files it uses, stored in this browser so it opens with
// no connection. Nothing is stored until the reader asks, and only the pages they ask for: the
// worker (offline-sw.js beside this file) is registered on the first press and serves a kept copy
// only when the network fails. Removing the last kept page clears the store and unregisters the
// worker, so a reader who changes their mind leaves nothing behind. A browser without service
// workers, or one whose storage is refused, is offered nothing.
export const DEFAULT_CACHE = "kept-v1";
export function keepSupported() {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "caches" in window;
}
// The worker's address with the store's name, unless it is the default.
export function workerUrl(o) {
    if (o.cache === DEFAULT_CACHE)
        return o.worker;
    const u = new URL(o.worker, location.href);
    u.searchParams.set("cache", o.cache);
    return u.pathname + u.search;
}
// Every same-origin file this page uses: its stylesheets, scripts and module chunks, images, and
// the fonts and scripts the page loaded after. Each is stored as fetched, so the kept page draws as
// it does online.
export function filesOfPage(page) {
    const urls = new Set();
    const add = (value) => {
        if (!value)
            return;
        const url = new URL(value, location.href);
        if (url.origin === location.origin)
            urls.add(url.pathname + url.search);
    };
    for (const link of document.querySelectorAll('link[rel~="stylesheet"], link[rel="modulepreload"]'))
        add(link.getAttribute("href"));
    for (const script of document.querySelectorAll("script[src]"))
        add(script.getAttribute("src"));
    for (const img of document.querySelectorAll("img[src]"))
        add(img.getAttribute("src"));
    for (const entry of performance.getEntriesByType("resource")) {
        if (["css", "script", "link", "img"].includes(entry.initiatorType))
            add(entry.name);
    }
    urls.delete(page);
    return [...urls];
}
// Looked up, never opened: opening a store creates it, and a reader who only views the page stores nothing.
export async function isKept(o) {
    return Boolean(await caches.match(o.page, { cacheName: o.cache }));
}
export async function keep(o) {
    // The page first, and it must arrive before anything is registered or stored; a file that fails
    // is left for the next keep, so one missing image costs only itself.
    const response = await fetch(o.page, { credentials: "same-origin" });
    if (!response.ok)
        throw new Error(`the page answered ${response.status}`);
    await navigator.serviceWorker.register(workerUrl(o), { scope: o.scope });
    const cache = await caches.open(o.cache);
    await cache.put(o.page, response);
    await Promise.allSettled(filesOfPage(o.page).map((url) => cache.add(url)));
}
export async function remove(o) {
    const cache = await caches.open(o.cache);
    await cache.delete(o.page);
    // The files are shared between kept pages, so they go only with the last page. A page's address
    // has no extension; a stylesheet, bundle, font or image has one.
    const pages = (await cache.keys()).filter((request) => !/\.[a-z0-9]+$/i.test(new URL(request.url).pathname));
    if (pages.length > 0)
        return;
    await caches.delete(o.cache);
    const script = new URL(o.worker, location.href).pathname;
    for (const registration of await navigator.serviceWorker.getRegistrations()) {
        const ours = [registration.active, registration.installing, registration.waiting].some((w) => w && new URL(w.scriptURL).pathname === script);
        if (ours)
            await registration.unregister();
    }
}
function options(el) {
    return {
        worker: el.dataset.worker ?? "/sw.js",
        scope: el.dataset.scope ?? "/",
        cache: el.dataset.cache ?? DEFAULT_CACHE,
        page: el.dataset.page ?? location.pathname,
    };
}
// Fills every empty [data-cap="offline-keep"] with the toggle and its status line.
export function enhance(root = document) {
    const off = [];
    if (!keepSupported())
        return () => undefined;
    for (const el of root.querySelectorAll('[data-cap="offline-keep"]:not([data-cap-ready])')) {
        const o = options(el);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "cap-btn cap-keep";
        const status = document.createElement("span");
        status.className = "cap-keep-status";
        status.setAttribute("role", "status");
        const paint = (kept) => {
            button.setAttribute("aria-pressed", String(kept));
            button.textContent = kept ? "Kept on this device" : "Keep on this device";
            button.title = kept
                ? "Press to remove the copy kept on this device"
                : "Keep a copy that opens with no connection";
        };
        const toggle = async () => {
            const kept = button.getAttribute("aria-pressed") === "true";
            button.disabled = true;
            try {
                if (kept) {
                    await remove(o);
                    paint(false);
                    status.textContent = "Removed from this device.";
                }
                else {
                    await keep(o);
                    paint(true);
                    status.textContent = "Kept on this device: it opens with no connection.";
                }
            }
            catch (error) {
                status.textContent = kept
                    ? "This copy could not be removed."
                    : "This page could not be kept on this device.";
                // Reported, not swallowed, and not thrown from an event handler's promise, where it would go unhandled.
                reportError(error);
            }
            finally {
                button.disabled = false;
            }
        };
        const click = () => void toggle();
        button.addEventListener("click", click);
        paint(false);
        el.replaceChildren(button, status);
        el.dataset.capReady = "";
        isKept(o).then(paint, () => {
            // Storage refused (a private window may): offer nothing that cannot work.
            el.replaceChildren();
        });
        off.push(() => {
            button.removeEventListener("click", click);
            el.replaceChildren();
            delete el.dataset.capReady;
        });
    }
    return () => off.forEach((f) => f());
}
