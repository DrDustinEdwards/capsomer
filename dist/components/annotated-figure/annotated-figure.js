// The annotated figure: a drawing with numbered callouts on leader lines, and a key that pairs each
// number with its name. Under a mouse, a callout and its key entry light together; a tap pins one
// until the next tap. Each leader can draw itself in once the figure is in view. Extracted from
// dustinedwards.info (app/components/plate-i.tsx, plate-i-geometry.ts and app/enhance/plate.ts); the
// drawing's own shapes and coordinates stay with the site.
import { reducedMotion } from "../hooks/hooks.js";
/** A number at one decimal: coordinates in the markup stay short and stable. */
export const round1 = (n) => +n.toFixed(1);
/** `p` moved so that `from` lands on `to`, scaled by `k` about it. */
export function scalePoint(p, k, from = [0, 0], to = [0, 0]) {
    return [round1((p[0] - from[0]) * k + to[0]), round1((p[1] - from[1]) * k + to[1])];
}
/**
 * Every "x y" (or "x,y") pair in an absolute path's data passed through `map`: a path drawn on one
 * canvas, placed on another. Commands with one number (H, V) and relative commands are not pairs
 * and are left as they are, so draw the path in absolute M, L, C and Q.
 */
export function scalePathData(d, map) {
    return d.replace(/(-?\d*\.?\d+)[ ,](-?\d*\.?\d+)/g, (_, x, y) => map([Number(x), Number(y)]).join(" "));
}
/**
 * A callout whose label sits beside the drawing: a leader from `from` out to an elbow just past
 * `edge` (the drawing's half width from `cx`), then level to its tail, and the label after the tail,
 * on the right (`side` 1) or the left (-1), at height `y`.
 */
export function sideCallout(opts) {
    const { from, side, edge, cx = 0, elbow = 8, tail = 26, gap = 5, baseline = 4 } = opts;
    const y = Math.round(opts.y);
    const elbowX = cx + side * Math.round(edge + elbow);
    const tailX = cx + side * Math.round(edge + tail);
    return {
        leader: [
            [from[0], from[1], elbowX, y],
            [elbowX, y, tailX, y],
        ],
        label: { x: tailX + side * gap, y: y + baseline, anchor: side === 1 ? "start" : "end" },
    };
}
/** A view box as the attribute wants it. */
export function viewBox(v) {
    return `${v.x} ${v.y} ${v.w} ${v.h}`;
}
/** The pin after a tap on `id`: the same callout again unpins it. */
export function nextPin(pinned, id) {
    return pinned === id ? null : id;
}
// Each leader grows from its start with `transform: scale()`, which looks like the line being drawn
// and, unlike a stroke-dashoffset draw, runs on the compositor. The plain `transform` property:
// Chrome does not composite the individual transform properties on SVG. Values go through the CSSOM.
// The timing is the motion tokens: each leader's long leg draws in --dur-slow, its short leg in
// --dur-base once the long one is drawn, the leaders --dur-base apart, on the arriving --ease-out.
export function drawLeaders(svg) {
    const css = getComputedStyle(svg);
    const ms = (name, fallback) => parseFloat(css.getPropertyValue(name)) || fallback;
    const base = ms("--dur-base", 200);
    const slow = ms("--dur-slow", 400);
    const easing = css.getPropertyValue("--ease-out").trim() || "ease-out";
    svg.querySelectorAll(".cap-annotated-figure-leader").forEach((leader, i) => {
        leader.querySelectorAll("line").forEach((line, j) => {
            line.style.setProperty("transform-box", "view-box");
            line.style.setProperty("transform-origin", `${line.getAttribute("x1")}px ${line.getAttribute("y1")}px`);
            line.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], {
                duration: j === 0 ? slow : base,
                delay: i * base + base + (j === 0 ? 0 : slow),
                easing,
                fill: "backwards",
            });
        });
    });
}
/**
 * Wires one figure: its callouts and the entries of every key that names it (`data-for` its id)
 * light together. With `data-draw` on the figure, the drawing on show draws its leaders in once it
 * is in view, except under reduced motion. Returns a function that detaches.
 */
export function attach(figure) {
    const keys = figure.id
        ? [...document.querySelectorAll(`[data-for="${CSS.escape(figure.id)}"]`)]
        : [];
    const members = [figure, ...keys].flatMap((scope) => [
        ...scope.querySelectorAll("[data-callout]"),
    ]);
    let pinned = null;
    const light = (id) => {
        for (const el of members)
            el.toggleAttribute("data-lit", el.getAttribute("data-callout") === id);
    };
    const off = [];
    for (const el of members) {
        const id = el.getAttribute("data-callout") ?? "";
        // The leader and its label are drawn over the target and answer through it; the target and the
        // key entry are what a pointer reaches. No focus stops: the key already pairs them in text.
        if (el.classList.contains("cap-annotated-figure-leader"))
            continue;
        el.setAttribute("data-live", "");
        const enter = (e) => {
            if (e.pointerType === "mouse")
                light(id);
        };
        const leave = (e) => {
            if (e.pointerType === "mouse")
                light(pinned);
        };
        const click = () => {
            pinned = nextPin(pinned, id);
            light(pinned);
        };
        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
        el.addEventListener("click", click);
        off.push(() => {
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointerleave", leave);
            el.removeEventListener("click", click);
            el.removeAttribute("data-live");
        });
    }
    let observer = null;
    const shown = [...figure.querySelectorAll("svg.cap-annotated-figure-drawing")].find((s) => s.getBoundingClientRect().width > 0);
    if (figure.hasAttribute("data-draw") && shown && !reducedMotion()) {
        const r = shown.getBoundingClientRect();
        // Already in view: start now, before the next paint, so the finished drawing never flashes first.
        if (r.top < window.innerHeight && r.bottom > 0)
            drawLeaders(shown);
        else if ("IntersectionObserver" in window) {
            observer = new IntersectionObserver((entries) => {
                if (!entries.some((e) => e.isIntersecting))
                    return;
                observer?.disconnect();
                drawLeaders(shown);
            }, { threshold: 0.25 });
            observer.observe(shown);
        }
    }
    return () => {
        observer?.disconnect();
        off.forEach((f) => f());
        light(null);
    };
}
// Attaches to every [data-cap="annotated-figure"] under root not yet attached. Returns a function
// that detaches.
// The root is Element | Document | DocumentFragment, not ParentNode: under @cloudflare/workers-types
// an HTMLFormElement does not type as a ParentNode, so a site could not pass its form.
export function enhance(root = document) {
    const undo = [];
    for (const figure of root.querySelectorAll("[data-cap='annotated-figure']:not([data-cap-ready])")) {
        figure.dataset.capReady = "";
        const off = attach(figure);
        undo.push(() => {
            off();
            delete figure.dataset.capReady;
        });
    }
    return () => undo.forEach((f) => f());
}
