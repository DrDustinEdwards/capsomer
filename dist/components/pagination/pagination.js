// Pagination's behavior for the client-side form (a nav of buttons carrying state as data attributes).
// A server-rendered pager of links needs no script. A click draws the list again, updates the live
// "Showing 21 to 40 of 312" line and fires `cap:page-change` so the app can load that page.
import { clamp } from "../hooks/hooks.js";
const READY = "data-cap-ready";
function clampPage(page, count) {
    return clamp(Math.floor(page) || 1, 1, count);
}
// Always seven slots when there are more than seven pages, so the width never changes; the first
// and last page are always there.
export function pageItems(page, count) {
    const n = Math.max(0, Math.floor(count));
    if (n <= 7)
        return Array.from({ length: n }, (_, i) => i + 1);
    const p = clampPage(page, n);
    if (p <= 4)
        return [1, 2, 3, 4, 5, "gap-end", n];
    if (p >= n - 3)
        return [1, "gap-start", n - 4, n - 3, n - 2, n - 1, n];
    return [1, "gap-start", p - 1, p, p + 1, "gap-end", n];
}
export function showingRange(page, perPage, total) {
    if (total <= 0 || perPage <= 0)
        return { from: 0, to: 0 };
    const from = (page - 1) * perPage + 1;
    return { from: Math.min(from, total), to: Math.min(page * perPage, total) };
}
export function statusText(page, perPage, total, noun = "items") {
    const { from, to } = showingRange(page, perPage, total);
    if (total <= 0)
        return `No ${noun}`;
    return from === to
        ? `Showing ${from} of ${total} ${noun}`
        : `Showing ${from} to ${to} of ${total} ${noun}`;
}
export function pageCountOf(total, perPage) {
    return perPage > 0 ? Math.max(1, Math.ceil(total / perPage)) : 1;
}
// The page an address asks for, `?page=` read strictly: only whole digits from 1 count, else page 1.
// A loader keeps it in range with pageEnvelope.
export function parsePage(raw) {
    if (raw == null || !/^\d+$/.test(raw))
        return 1;
    const n = Number(raw);
    return Number.isSafeInteger(n) && n >= 1 ? n : 1;
}
// Everything a list page needs from its total. `perPage` "all" shows the whole list on one page.
export function pageEnvelope(page, perPage, total) {
    const count = Math.max(0, Math.floor(total));
    const size = perPage === "all" ? Math.max(1, count) : Math.max(1, Math.floor(perPage));
    const pageCount = pageCountOf(count, size);
    const at = clampPage(page, pageCount);
    const { from, to } = showingRange(at, size, count);
    return {
        page: at,
        perPage: size,
        total: count,
        pageCount,
        offset: (at - 1) * size,
        from,
        to,
        hasPrev: at > 1,
        hasNext: at < pageCount,
    };
}
// The address of one page: empty or default parameters left out, `page` only past the first (one
// page, one address), parameter order kept.
export function pageHref(path, params, page, options = {}) {
    const key = options.param ?? "page";
    const out = new URLSearchParams();
    const entries = params instanceof URLSearchParams ? [...params.entries()] : Object.entries(params);
    for (const [name, value] of entries) {
        if (name === key || value == null || value === "" || value === false)
            continue;
        out.append(name, value === true ? "1" : String(value));
    }
    if (page > 1)
        out.set(key, String(Math.floor(page)));
    const query = out.toString();
    return query ? `${path}?${query}` : path;
}
// The pages before and after this one, for `<link rel="prev">` and `<link rel="next">` in the head.
export function pageRelLinks(page, pageCount, hrefFor) {
    const links = [];
    if (page > 1)
        links.push({ rel: "prev", href: hrefFor(page - 1) });
    if (page < pageCount)
        links.push({ rel: "next", href: hrefFor(page + 1) });
    return links;
}
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
function numberOf(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}
export function render(nav) {
    const count = numberOf(nav.dataset.pageCount, 1);
    const page = Math.min(numberOf(nav.dataset.page, 1), count);
    const perPage = numberOf(nav.dataset.perPage, 0);
    const total = Number(nav.dataset.total);
    const noun = nav.dataset.noun || "items";
    nav.dataset.page = String(page);
    // The status line is a live region, so it is updated in place: a new node would not be announced.
    let status = nav.querySelector(":scope > .cap-pagination-status");
    if (perPage > 0 && Number.isFinite(total)) {
        if (!status) {
            status = el("p", "cap-pagination-status");
            status.setAttribute("role", "status");
            nav.prepend(status);
        }
        status.textContent = statusText(page, perPage, total, noun);
    }
    const list = el("ul", "cap-pagination-list");
    const end = (kind, label, to) => {
        const item = el("li");
        const b = el("button", "cap-page", label);
        b.type = "button";
        b.dataset.kind = kind;
        if (to < 1 || to > count)
            b.setAttribute("aria-disabled", "true");
        else
            b.dataset.page = String(to);
        item.append(b);
        return item;
    };
    list.append(end("prev", nav.dataset.prevLabel || "Previous", page - 1));
    for (const it of pageItems(page, count)) {
        const item = el("li", "cap-pagination-num");
        if (typeof it === "number") {
            const b = el("button", "cap-page", String(it));
            b.type = "button";
            b.dataset.page = String(it);
            b.setAttribute("aria-label", `Page ${it}`);
            if (it === page)
                b.setAttribute("aria-current", "page");
            item.append(b);
        }
        else {
            const gap = el("span", "cap-page-gap");
            const dots = el("span", undefined, "…");
            dots.setAttribute("aria-hidden", "true");
            gap.append(dots, el("span", "cap-sr-only", "More pages"));
            item.append(gap);
        }
        list.append(item);
    }
    list.append(el("li", "cap-pagination-where", `Page ${page} of ${count}`));
    list.append(end("next", nav.dataset.nextLabel || "Next", page + 1));
    const old = nav.querySelector(":scope > .cap-pagination-list");
    if (old)
        old.replaceWith(list);
    else
        nav.append(list);
}
// Goes to a page from script. Returns whether the page changed.
export function setPage(nav, page, options = {}) {
    const count = numberOf(nav.dataset.pageCount, 1);
    const to = clampPage(page, count);
    if (to === numberOf(nav.dataset.page, 1))
        return false;
    const had = nav.contains(document.activeElement);
    const kind = document.activeElement?.dataset?.kind;
    nav.dataset.page = String(to);
    render(nav);
    if (had) {
        const again = kind
            ? nav.querySelector(`.cap-page[data-kind="${kind}"]:not([aria-disabled="true"])`)
            : null;
        (again ?? nav.querySelector('.cap-page[aria-current="page"]'))?.focus();
    }
    if (!options.silent)
        nav.dispatchEvent(new CustomEvent("cap:page-change", { bubbles: true, detail: { page: to } }));
    return true;
}
export function enhance(root = document) {
    const undo = [];
    for (const nav of root.querySelectorAll("[data-cap='pagination']")) {
        if (nav.hasAttribute(READY))
            continue;
        nav.setAttribute(READY, "");
        const click = (e) => {
            const b = e.target.closest(".cap-page");
            if (!b || !nav.contains(b))
                return;
            if (b.getAttribute("aria-disabled") === "true" || b.hasAttribute("aria-current")) {
                e.preventDefault();
                return;
            }
            if (b.tagName === "A" || !b.dataset.page)
                return; // links go where they go
            setPage(nav, Number(b.dataset.page));
        };
        nav.addEventListener("click", click);
        undo.push(() => {
            nav.removeEventListener("click", click);
            nav.removeAttribute(READY);
        });
    }
    return () => undo.forEach((f) => f());
}
