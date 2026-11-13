// The timeline's behavior: the line between the steps fills from the first to the last once the
// timeline scrolls into view (200px early). With no script, and with reduced motion, it is drawn
// full. The fill is a transform, so nothing is measured and a resize needs no work.
export function enhance(root = document) {
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            if (!e.isIntersecting)
                continue;
            io.unobserve(e.target);
            e.target.dataset.shown = "";
        }
    }, { rootMargin: "200px" });
    const els = [
        ...root.querySelectorAll('[data-cap="timeline"]:not([data-cap-ready])'),
    ];
    for (const el of els) {
        el.dataset.capReady = "";
        io.observe(el);
    }
    return () => {
        io.disconnect();
        for (const el of els) {
            delete el.dataset.capReady;
            delete el.dataset.shown;
        }
    };
}
