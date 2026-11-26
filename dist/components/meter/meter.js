// The meter's behavior: positions the fill, projection and threshold tick through the CSSOM so apps keep style-src 'self'.
// The number itself is in the markup's text and aria-valuetext; this only draws the bar.
import { enhanceEach } from "../hooks/hooks.js";
export function percent(value, max = 100, min = 0) {
    return Math.round(ratio(value, max, min) * 100);
}
export function ratio(value, max, min = 0) {
    const span = max - min;
    if (!Number.isFinite(value) || !Number.isFinite(span) || span <= 0)
        return 0;
    return Math.min(1, Math.max(0, (value - min) / span));
}
// The tone a value earns: warning from `warnAt`, critical from `critAt` (0 to 1; defaults 75% and 90%). The caller still
// writes the status word beside it: a tone is a word, a shape and a color, never color alone.
export function toneFor(value, max, options = {}) {
    const { min = 0, warnAt = 0.75, critAt = 0.9 } = options;
    const r = ratio(value, max, min);
    return r >= critAt ? "crit" : r >= warnAt ? "warn" : "ok";
}
function num(s) {
    return s == null || s === "" ? NaN : Number(s);
}
export function setBar(bar, v) {
    const min = v.min ?? 0;
    bar.style.setProperty("--cap-meter-ratio", String(ratio(v.value, v.max, min)));
    if (v.projected == null)
        bar.style.removeProperty("--cap-meter-projected");
    else
        bar.style.setProperty("--cap-meter-projected", String(Math.max(ratio(v.value, v.max, min), ratio(v.projected, v.max, min))));
    if (v.threshold == null)
        bar.style.removeProperty("--cap-meter-threshold");
    else
        bar.style.setProperty("--cap-meter-threshold", String(ratio(v.threshold, v.max, min)));
}
export function update(bar) {
    const min = num(bar.getAttribute("aria-valuemin"));
    const projected = num(bar.dataset.projected);
    const threshold = num(bar.dataset.threshold);
    setBar(bar, {
        value: num(bar.getAttribute("aria-valuenow")),
        max: num(bar.getAttribute("aria-valuemax")),
        min: Number.isFinite(min) ? min : 0,
        projected: Number.isFinite(projected) ? projected : null,
        threshold: Number.isFinite(threshold) ? threshold : null,
    });
}
const WATCHED = [
    "aria-valuenow",
    "aria-valuemax",
    "aria-valuemin",
    "data-projected",
    "data-threshold",
];
// Attaches to every [data-cap="meter"] under root, draws its bar and redraws on a value change. Returns a detach function.
export function enhance(root = document) {
    return enhanceEach(root, "meter", (meter) => {
        const bar = meter.querySelector(".cap-meter-bar");
        if (!bar)
            return;
        update(bar);
        const watch = new MutationObserver(() => update(bar));
        watch.observe(bar, { attributes: true, attributeFilter: WATCHED });
        return () => watch.disconnect();
    });
}
