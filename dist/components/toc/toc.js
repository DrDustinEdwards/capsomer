// The table of contents' behavior: the link for the section being read is marked
// aria-current="location" (the anchor bar's rule: the last heading above a line 35% down the
// view), and following a link moves focus to its heading and replaces the address's hash. With no
// script the links are plain in-page links.
import { goToSection, watchSections } from "../anchor-bar/anchor-bar.js";
export const MIN_ITEMS = 3;
// The headings a contents list links to, in its order.
export function linkedHeadings(nav) {
    return [...nav.querySelectorAll("a.cap-toc-link[href^='#']")]
        .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
        .filter((h) => h !== null);
}
export function markCurrent(nav, id) {
    for (const a of nav.querySelectorAll("a.cap-toc-link")) {
        if (id !== null && decodeURIComponent(a.hash.slice(1)) === id)
            a.setAttribute("aria-current", "location");
        else
            a.removeAttribute("aria-current");
    }
}
// One contents list: a click scrolls to its section, and the current section is marked as the page
// scrolls. Returns a function that undoes it.
export function attach(nav) {
    if (nav.hasAttribute("data-cap-ready"))
        return () => { };
    const headings = linkedHeadings(nav);
    if (!headings.length)
        return () => { };
    const click = (e) => {
        const a = e.target.closest("a.cap-toc-link");
        const h = a && document.getElementById(decodeURIComponent(a.hash.slice(1)));
        if (!h)
            return;
        e.preventDefault();
        goToSection(h);
    };
    nav.addEventListener("click", click);
    const stop = watchSections(headings, (id) => markCurrent(nav, id));
    nav.dataset.capReady = "";
    return () => {
        nav.removeEventListener("click", click);
        stop();
        delete nav.dataset.capReady;
    };
}
export function enhance(root = document) {
    const off = [...root.querySelectorAll('[data-cap="toc"]:not([data-cap-ready])')].map(attach);
    return () => off.forEach((f) => f());
}
