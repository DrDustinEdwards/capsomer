// The ambient layer's behavior: draws the hex field's hexagons once per view, and pauses every
// ambient layer while it is off screen. Every value goes through the CSSOM (style.setProperty), never a
// style attribute, so a page keeps `style-src 'self'`. The blobs and the equalizer need no drawing;
// they only take the pause.
const COLORS = [
    "var(--cap-ambient-1)",
    "var(--cap-ambient-2)",
    "var(--cap-ambient-3)",
    "var(--cap-ambient-4)",
];
// The source's ranges: size 45 to 89px, top 0 to 90%, left 0 to 95%, 25 to 44s a cycle, started up to 29s in.
export function drawHexes(field, options = {}) {
    const random = options.random ?? Math.random;
    const phone = typeof matchMedia === "function" && matchMedia("(max-width: 47.99rem)").matches;
    const count = phone ? (options.phoneCount ?? 12) : (options.count ?? 24);
    const hexes = [];
    for (let i = 0; i < count; i++) {
        const hex = document.createElement("span");
        hex.style.setProperty("--s", `${(45 + random() * 44).toFixed(1)}px`);
        hex.style.setProperty("--y", `${(random() * 90).toFixed(1)}%`);
        hex.style.setProperty("--x", `${(random() * 95).toFixed(1)}%`);
        hex.style.setProperty("--c", COLORS[i % COLORS.length] ?? "");
        hex.style.setProperty("--d", `${(25 + random() * 19).toFixed(1)}s`);
        hex.style.setProperty("--l", `${(-random() * 29).toFixed(1)}s`);
        hexes.push(hex);
    }
    field.replaceChildren(...hexes);
    return hexes;
}
// Marks the layer `data-paused` while it is off screen.
export function pauseOffscreen(layer) {
    if (typeof IntersectionObserver !== "function")
        return () => { };
    const io = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting)
            delete layer.dataset.paused;
        else
            layer.dataset.paused = "";
    });
    io.observe(layer);
    return () => io.disconnect();
}
export function enhance(root = document, options = {}) {
    const stops = [];
    for (const layer of root.querySelectorAll('[data-cap="ambient"]:not([data-cap-ready])')) {
        layer.dataset.capReady = "";
        if (layer.dataset.variant === "hex-field")
            drawHexes(layer, options);
        stops.push(pauseOffscreen(layer));
    }
    return () => {
        for (const stop of stops)
            stop();
    };
}
