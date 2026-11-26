// The publish gate's rows as the DOM shows them: read a row's data, draw a check's row and a destination's
// buttons (publish-gate.ts decides when).
import { statusEl } from "../status/status.js";
import { WORD, checkState, } from "./publish-gate-model.js";
export const part = (el, name) => el.querySelector(`[data-cap-part='${name}']`);
export function h(tag, className, text) {
    const e = document.createElement(tag);
    if (className)
        e.className = className;
    if (text !== undefined)
        e.textContent = text;
    return e;
}
export const TONE = {
    blocked: "crit",
    held: "info",
    ready: "ok",
    published: "ok",
};
export function stateStatus(s) {
    return statusEl(TONE[s], WORD[s], TONE[s]);
}
export function readCheck(li) {
    const c = {
        id: li.dataset.check ?? li.id,
        name: li.dataset.name ?? "",
        required: li.hasAttribute("data-required"),
        ok: li.dataset.ok === "true",
        cause: li.dataset.cause ?? "",
    };
    if (li.dataset.pass)
        c.pass = li.dataset.pass;
    if (li.dataset.href)
        c.href = li.dataset.href;
    if (li.dataset.fix)
        c.fix = li.dataset.fix;
    if (li.dataset.site)
        c.site = li.dataset.site;
    return c;
}
export function readSite(li) {
    const s = { id: li.dataset.site ?? li.id, name: li.dataset.name ?? "" };
    if (li.dataset.holdText)
        s.hold = { text: li.dataset.holdText, note: li.dataset.holdNote };
    if (li.dataset.publishedAt && li.dataset.publishedUrl)
        s.published = { at: li.dataset.publishedAt, url: li.dataset.publishedUrl };
    if (li.hasAttribute("data-first"))
        s.first = true;
    return s;
}
export function renderCheck(li, sites) {
    const c = readCheck(li);
    const st = checkState(c);
    const status = li.querySelector(".cap-row-status");
    if (status)
        status.replaceChildren(st === "failing"
            ? statusEl("crit", "Failing")
            : st === "advisory"
                ? statusEl("warn", "Advisory")
                : statusEl("ok", "Passed"));
    if (st === "failing")
        li.dataset.tone = "crit";
    else
        delete li.dataset.tone;
    const words = c.ok ? (c.pass ?? `${c.name}: passing`) : c.cause;
    const title = li.querySelector(".cap-row-title");
    if (title) {
        if (c.href) {
            const a = h("a", undefined, words);
            a.href = c.href;
            a.setAttribute("aria-describedby", `${li.id}-s ${li.id}-d`);
            title.replaceChildren(a);
        }
        else
            title.replaceChildren(Object.assign(h("span", "cap-gate-title-text"), { textContent: words }));
    }
    const detail = li.querySelector(".cap-row-detail");
    if (detail) {
        detail.replaceChildren(h("span", "cap-check-name", c.name));
        if (!c.ok && c.fix)
            detail.append(". ", h("span", "cap-check-fix", `Fix: ${c.fix}`));
    }
    const meta = li.querySelector(".cap-row-meta");
    if (meta) {
        const siteName = c.site
            ? sites.find((r) => r.dataset.site === c.site)?.dataset.name
            : undefined;
        meta.replaceChildren(...(siteName ? [document.createTextNode(`on ${siteName}`)] : []));
    }
}
export function renderActions(boxes, site, state, isBusy, summaryId) {
    for (const box of boxes) {
        const name = box.dataset.siteLabel;
        const suffix = name ? `, ${name}` : "";
        // Buttons in a row are small; the page's own publish control sets data-btn-size="default".
        const size = box.dataset.btnSize === "default" ? "" : (box.dataset.btnSize ?? "sm");
        if (state === "published") {
            const view = box.querySelector("a[data-cap-part='view']");
            const un = box.querySelector("button[data-cap-part='unpublish']");
            if (!view || !un || box.querySelector("[data-cap-part='publish']")) {
                const a = h("a", "cap-btn");
                a.dataset.capPart = "view";
                if (size)
                    a.dataset.size = size;
                a.href = site.published?.url ?? "#";
                a.textContent = "View";
                // With several destinations the name says which one; the visible word starts it.
                if (suffix)
                    a.setAttribute("aria-label", `View live page${suffix}`);
                const b = h("button", "cap-btn");
                b.type = "button";
                b.dataset.capPart = "unpublish";
                if (size)
                    b.dataset.size = size;
                b.dataset.variant = "quiet";
                b.dataset.site = site.id;
                b.textContent = "Unpublish";
                if (suffix)
                    b.setAttribute("aria-label", `Unpublish${suffix}`);
                box.replaceChildren(a, b);
            }
            else if (site.published)
                view.href = site.published.url;
            continue;
        }
        let b = box.querySelector("button[data-cap-part='publish']");
        if (!b) {
            b = h("button", "cap-btn");
            b.type = "submit";
            b.name = "intent";
            b.value = "publish";
            b.dataset.capPart = "publish";
            if (size)
                b.dataset.size = size;
            b.dataset.site = site.id;
            box.replaceChildren(b);
        }
        const label = isBusy
            ? "Publishing..."
            : state === "blocked"
                ? "Publish blocked"
                : state === "held"
                    ? "Publish held"
                    : "Publish";
        b.dataset.variant = state === "ready" || isBusy ? "primary" : "secondary";
        if (state === "ready" && !isBusy)
            b.removeAttribute("aria-disabled");
        else
            b.setAttribute("aria-disabled", "true");
        if (isBusy)
            b.setAttribute("aria-busy", "true");
        else
            b.removeAttribute("aria-busy");
        // A blocked or held button stays focusable and says why: the region's summary describes it.
        if (state === "ready" && !isBusy)
            b.removeAttribute("aria-describedby");
        else if (summaryId)
            b.setAttribute("aria-describedby", summaryId);
        if (b.textContent !== label)
            b.textContent = label;
        if (suffix)
            b.setAttribute("aria-label", `${label}${suffix}`);
        else
            b.removeAttribute("aria-label");
    }
}
