// The "On this page" bar: links to a long view's sections, current one aria-current="location". Shown only for three or more
// sections taller than two screens (or data-always), measured again as the window or content resizes. The bar's own height does
// not count toward the rule, or mounting it could tip the rule it was mounted by (learned in the Portal's anchors.tsx).
import { hashId, reducedMotion } from "../hooks/hooks.js";
export function scrollParent(el) {
    for (let n = el?.parentElement ?? null; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
        const o = getComputedStyle(n).overflowY;
        if (o === "auto" || o === "scroll")
            return n;
    }
    return null;
}
// Blocks marked data-section with an id, else h2 headings with one. Only outer sections: a block inside another is not an entry.
export function sectionsIn(scope) {
    const blocks = Array.from(scope.querySelectorAll("[data-section][id]")).filter((b) => !b.parentElement?.closest("[data-section][id]"));
    return blocks.length ? blocks : Array.from(scope.querySelectorAll("h2[id]"));
}
export function sectionLabel(section) {
    return section.dataset.section ?? section.textContent?.trim() ?? section.id;
}
export function meetsRule(headings, scroller, barHeight = 0) {
    if (headings.length < 3)
        return false;
    const total = (scroller ? scroller.scrollHeight : document.documentElement.scrollHeight) - barHeight;
    const screen = scroller ? scroller.clientHeight : window.innerHeight;
    return total > 2 * screen;
}
// The last heading above a line 35% down the view, or the last heading once scrolled to the end.
export function currentSection(headings, scroller, line = 0.35) {
    const top = scroller ? scroller.getBoundingClientRect().top : 0;
    const height = scroller ? scroller.clientHeight : window.innerHeight;
    const y = top + height * line;
    let cur = null;
    for (const h of headings)
        if (h.getBoundingClientRect().top <= y)
            cur = h;
    const atEnd = scroller
        ? scroller.scrollTop > 0 &&
            scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2
        : window.scrollY > 0 &&
            window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    if (atEnd)
        cur = headings.at(-1) ?? cur;
    return cur;
}
export function watchSections(headings, onChange, scroller = scrollParent(headings[0])) {
    let last;
    const update = () => {
        const id = currentSection(headings, scroller)?.id ?? null;
        if (id !== last) {
            last = id;
            onChange(id);
        }
    };
    const io = new IntersectionObserver(update, {
        root: scroller,
        rootMargin: "0px 0px -65% 0px",
        threshold: [0, 1],
    });
    for (const h of headings)
        io.observe(h);
    // The end of the view, where the last heading may never reach the line.
    const target = scroller ?? window;
    target.addEventListener("scrollend", update);
    update();
    return () => {
        io.disconnect();
        target.removeEventListener("scrollend", update);
    };
}
// Scrolls a section under the bar, focuses it, replaces the hash (an in-page click is not a place to go Back to); `push: true` adds an entry.
export function goToSection(heading, opts = {}) {
    if (!heading.hasAttribute("tabindex"))
        heading.tabIndex = -1;
    heading.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    heading.focus({ preventScroll: true });
    if (heading.id) {
        if (opts.push)
            history.pushState(null, "", `#${heading.id}`);
        else
            history.replaceState(history.state, "", `#${heading.id}`);
    }
}
// Tells the page how tall the bar is. A vertical bar sits beside the sections, so it takes no room at their top.
export function measureBar(nav, scroller) {
    const vertical = nav.dataset.orientation === "vertical";
    (scroller ?? document.documentElement).style.setProperty("--cap-anchors-h", vertical ? "0px" : `${Math.ceil(nav.getBoundingClientRect().height)}px`);
}
export function markSections(headings) {
    for (const h of headings) {
        if (!h.hasAttribute("tabindex"))
            h.tabIndex = -1;
        h.dataset.capAnchor = "";
    }
}
// Attaches to every [data-cap="anchor-bar"] under root; an empty list is filled from the sections in its scope and kept in step.
export function enhance(root = document) {
    const undo = [];
    for (const nav of root.querySelectorAll("[data-cap='anchor-bar']:not([data-cap-ready])")) {
        nav.dataset.capReady = "";
        const scope = (nav.dataset.capScope ? document.querySelector(nav.dataset.capScope) : nav.closest("main")) ??
            document.body;
        const scroller = scrollParent(nav);
        const always = nav.hasAttribute("data-always");
        let list = nav.querySelector("ul");
        const auto = !list?.querySelector("a");
        if (!list) {
            list = document.createElement("ul");
            list.className = "cap-anchors-list";
            nav.append(list);
        }
        const ul = list;
        let filled = "";
        const fill = () => {
            const sections = sectionsIn(scope);
            const key = sections.map((s) => `${s.id}\u0000${sectionLabel(s)}`).join("\u0001");
            if (key === filled)
                return false;
            filled = key;
            ul.replaceChildren(...sections.map((s) => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = `#${s.id}`;
                a.textContent = sectionLabel(s);
                li.append(a);
                return li;
            }));
            return true;
        };
        let pairs = [];
        const resolve = () => {
            pairs = Array.from(nav.querySelectorAll("a[href^='#']"))
                .map((a) => ({ a, h: document.getElementById(hashId(a.hash.slice(1))) }))
                .filter((p) => p.h !== null);
        };
        if (auto)
            fill();
        resolve();
        let stop = null;
        const halt = () => {
            stop?.();
            stop = null;
            for (const p of pairs)
                p.a.removeAttribute("aria-current");
        };
        const apply = () => {
            if (auto && fill()) {
                halt();
                resolve();
            }
            const headings = pairs.map((p) => p.h);
            const ok = always || meetsRule(headings, scroller, nav.offsetHeight);
            // Only on a change: setting the attribute again would be a mutation, and the mutation
            // observer below would measure again, without end.
            if (nav.hidden === ok)
                nav.hidden = !ok;
            if (ok) {
                markSections(headings);
                measureBar(nav, scroller);
                stop ??= watchSections(headings, (id) => {
                    for (const p of pairs) {
                        if (p.h.id === id)
                            p.a.setAttribute("aria-current", "location");
                        else
                            p.a.removeAttribute("aria-current");
                    }
                }, scroller);
            }
            else
                halt();
        };
        const ro = new ResizeObserver(apply);
        ro.observe(scroller ?? document.documentElement);
        ro.observe(nav);
        const mo = new MutationObserver(apply);
        mo.observe(scope, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-section", "id", "hidden"],
        });
        apply();
        const onClick = (e) => {
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0)
                return;
            const a = e.target.closest("a[href^='#']");
            const pair = pairs.find((p) => p.a === a);
            if (!pair)
                return;
            e.preventDefault();
            goToSection(pair.h);
        };
        nav.addEventListener("click", onClick);
        undo.push(() => {
            halt();
            ro.disconnect();
            mo.disconnect();
            nav.removeEventListener("click", onClick);
            nav.hidden = false;
            delete nav.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
