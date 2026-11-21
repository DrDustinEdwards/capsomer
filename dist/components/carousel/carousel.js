// The carousel: a native scroll-snap track, so it swipes, scrolls by trackpad and by keyboard before
// (and without) script. This module wires the Previous and Next buttons and the markers, keeps the
// current marker in step while the track scrolls, and says "Slide N of M" once a scroll settles.
// Built to Chrome's Modern Web Guidance carousel guide: controls only start scrolling and never set
// state; state is read from the settled scroll position; rapid presses build on the pending target;
// with three or more slides (and sibling-count() support) Previous and Next loop by parking an end
// slide beside the current one with CSS `order` (carousel.css reads --current), never cloning or
// moving a slide in the DOM; otherwise the buttons disable at the ends.
export function partsOf(root) {
    const track = root.querySelector(".cap-carousel-track");
    if (!track)
        return null;
    return {
        root,
        track,
        slides: [...track.children].filter((c) => c instanceof HTMLElement),
        markers: [...root.querySelectorAll(".cap-carousel-markers button")],
        prev: root.querySelector('[data-cap-dir="prev"]'),
        next: root.querySelector('[data-cap-dir="next"]'),
        status: root.querySelector(".cap-carousel-status"),
    };
}
// The status message for a slide; a carousel may name its own with data-cap-status="Testimonial {n} of {total}".
export function statusText(template, n, total) {
    return (template ?? "Slide {n} of {total}")
        .replace("{n}", String(n))
        .replace("{total}", String(total));
}
// Whether the track can loop: three slides at least, and the parking rule's sibling-count().
export function canLoop(count) {
    return (count >= 3 && typeof CSS !== "undefined" && CSS.supports("order", "calc(sibling-count() * 1)"));
}
const vertical = (track) => track.closest(".cap-carousel")?.dataset.axis === "block";
// The middle of an element and of the track's viewport, on the track's own scrolling axis only.
function middle(el, block) {
    return block ? el.offsetTop + el.offsetHeight / 2 : el.offsetLeft + el.offsetWidth / 2;
}
function viewMiddle(track, block) {
    return block
        ? track.scrollTop + track.clientHeight / 2
        : track.scrollLeft + track.clientWidth / 2;
}
export function attach(parts) {
    const { track, slides, markers, prev, next, status, root } = parts;
    const block = vertical(track);
    const loops = root.dataset.loop !== "off" && canLoop(slides.length);
    root.toggleAttribute("data-cap-loops", loops);
    // Offsets are measured against the track.
    if (getComputedStyle(track).position === "static")
        track.style.setProperty("position", "relative");
    let pending = null;
    let marked = -1;
    let settled = 0;
    const nearest = () => {
        const mid = viewMiddle(track, block);
        let best = 0;
        slides.forEach((s, i) => {
            if (Math.abs(middle(s, block) - mid) < Math.abs(middle(slides[best], block) - mid))
                best = i;
        });
        return best;
    };
    // Slides as they sit on screen, which differs from DOM order while one is parked.
    const visual = () => [...slides].sort((a, b) => (block ? a.offsetTop - b.offsetTop : a.offsetLeft - b.offsetLeft));
    const mark = (i) => {
        if (i === marked)
            return;
        marked = i;
        markers.forEach((m, k) => m.setAttribute("aria-current", String(k === i)));
    };
    const scrollTo = (i) => {
        pending = i;
        mark(i);
        const delta = middle(slides[i], block) - viewMiddle(track, block);
        track.scrollBy(block ? { top: delta } : { left: delta });
    };
    const step = (dir) => {
        const order = visual();
        const to = order[order.indexOf(slides[pending ?? nearest()]) + dir];
        if (to)
            scrollTo(slides.indexOf(to));
    };
    // Parking: carousel.css orders the first and last slides from --current. The current slide's
    // offset is measured before and after, and the track scrolled by the difference in the same task,
    // with snapping off and the axis locked for two frames (iOS Safari otherwise paints one frame of
    // the reordered layout).
    const park = (i) => {
        const offset = (el) => (block ? el.offsetTop : el.offsetLeft);
        const scrolled = () => (block ? track.scrollTop : track.scrollLeft);
        const before = offset(slides[i]) - scrolled();
        track.style.setProperty("--current", String(i));
        const shift = offset(slides[i]) - scrolled() - before;
        if (shift !== 0) {
            const axis = block ? "overflow-y" : "overflow-x";
            track.style.setProperty("scroll-snap-type", "none");
            track.style.setProperty(axis, "hidden");
            track.scrollBy({ [block ? "top" : "left"]: shift, behavior: "instant" });
            track.style.removeProperty("scroll-snap-type");
            requestAnimationFrame(() => requestAnimationFrame(() => track.style.removeProperty(axis)));
        }
        const last = slides.length - 1;
        slides.forEach((s, k) => {
            const parked = (k === 0 && i >= last - 1) || (k === last && i <= 1);
            s.inert = parked && k !== i;
        });
    };
    const settle = (announce) => {
        const i = nearest();
        pending = null;
        mark(i);
        if (loops)
            park(i);
        else {
            const order = visual();
            if (prev)
                prev.disabled = slides[i] === order[0];
            if (next)
                next.disabled = slides[i] === order[order.length - 1];
        }
        if (announce && status && i !== settled)
            status.textContent = statusText(root.dataset.capStatus, i + 1, slides.length);
        settled = i;
    };
    let frame = 0;
    const onScroll = () => {
        if (pending !== null || frame)
            return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            mark(nearest());
        });
    };
    let timer;
    const onScrollDebounced = () => {
        clearTimeout(timer);
        timer = setTimeout(() => settle(true), 120);
    };
    const onScrollEnd = () => settle(true);
    const hasScrollEnd = "onscrollend" in window;
    track.addEventListener("scroll", onScroll, { passive: true });
    if (hasScrollEnd)
        track.addEventListener("scrollend", onScrollEnd);
    else
        track.addEventListener("scroll", onScrollDebounced, { passive: true });
    const onPrev = () => step(-1);
    const onNext = () => step(1);
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    const markerHandlers = markers.map((m, i) => {
        const h = () => scrollTo(i);
        m.addEventListener("click", h);
        return h;
    });
    settle(false);
    // Start on the first slide's own snap position (centered, with a peek on each side), at once:
    // parking leaves it where it was, and the browser's own re-snap would land a frame or more later.
    {
        const delta = middle(slides[settled], block) - viewMiddle(track, block);
        if (Math.abs(delta) >= 1)
            track.scrollBy({ [block ? "top" : "left"]: delta, behavior: "instant" });
    }
    return () => {
        track.removeEventListener("scroll", onScroll);
        track.removeEventListener("scrollend", onScrollEnd);
        track.removeEventListener("scroll", onScrollDebounced);
        prev?.removeEventListener("click", onPrev);
        next?.removeEventListener("click", onNext);
        markers.forEach((m, i) => m.removeEventListener("click", markerHandlers[i]));
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        track.style.removeProperty("--current");
        slides.forEach((s) => (s.inert = false));
        root.removeAttribute("data-cap-loops");
    };
}
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll('[data-cap="carousel"]:not([data-cap-ready])')) {
        const parts = partsOf(el);
        if (!parts)
            continue;
        el.setAttribute("data-cap-ready", "");
        const detach = attach(parts);
        undo.push(() => {
            detach();
            el.removeAttribute("data-cap-ready");
        });
    }
    return () => undo.forEach((u) => u());
}
