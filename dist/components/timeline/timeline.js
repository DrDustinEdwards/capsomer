// The timeline's behavior: the line between the steps fills from the first to the last once the
// timeline scrolls into view (200px early). With no script, and with reduced motion, it is drawn
// full. The fill is a transform, so nothing is measured and a resize needs no work.
// One timeline: fills its line once it nears the view. Returns a function that undoes it.
export function attach(el) {
    if (el.hasAttribute("data-cap-ready"))
        return () => { };
    el.dataset.capReady = "";
    const io = new IntersectionObserver(([e]) => {
        if (!e?.isIntersecting)
            return;
        io.disconnect();
        el.dataset.shown = "";
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => {
        io.disconnect();
        delete el.dataset.capReady;
        delete el.dataset.shown;
    };
}
export function enhance(root = document) {
    const off = [
        ...root.querySelectorAll('[data-cap="timeline"]:not([data-cap-ready])'),
    ].map(attach);
    return () => off.forEach((f) => f());
}
