// The two-handle range: two native range inputs on one track, so the keyboard and a form submit
// work with no script. Script keeps the low handle under the high one (a step apart), fills the
// track between them, writes the span into the output, and fires `cap:range-commit` a quarter
// second after a handle stops, so a list filters once, not on every pixel.
export const COMMIT_DELAY_MS = 250;
export const COMMIT_EVENT = "cap:range-commit";
// A value's share of the track, "0.00%" to "100.00%": the single slider's --cap-range-fill too.
export function rangeFill(value, min, max) {
    return `${(max > min ? ((value - min) / (max - min)) * 100 : 0).toFixed(2)}%`;
}
// The low and high values kept a step apart and inside the track.
export function clampPair(low, high, { min, max, step }, moved) {
    const lo = Math.max(min, Math.min(low, max));
    const hi = Math.max(min, Math.min(high, max));
    if (moved === "low")
        return [Math.min(lo, hi - step), hi];
    return [lo, Math.max(hi, lo + step)];
}
// A press on the track away from the thumbs (WCAG 2.5.7: a single pointer sets a handle without a
// drag): the value under the pointer, on a step, and the handle nearer to it, the low one on a tie
// below the span and the high one above it. RTL tracks run from the right.
export function trackPick(track, clientX, [low, high], { min, max, step }) {
    const box = track.getBoundingClientRect();
    const rtl = getComputedStyle(track).direction === "rtl";
    const share = box.width > 0 ? (clientX - box.left) / box.width : 0;
    const raw = min + Math.max(0, Math.min(1, rtl ? 1 - share : share)) * (max - min);
    const value = Math.max(min, Math.min(max, min + Math.round((raw - min) / step) * step));
    const which = Math.abs(value - low) < Math.abs(value - high) || value < low ? "low" : "high";
    return { which, value };
}
// The words for a value: data-currency (whole units of a currency, in cents when data-cents),
// with "+" on the top of the track when data-open-top says the top means "and more".
export function formatValue(root, value, max) {
    const cents = root.dataset.cents !== undefined;
    const n = cents ? value / 100 : value;
    const currency = root.dataset.currency;
    const text = new Intl.NumberFormat(document.documentElement.lang || "en-US", {
        ...(currency ? { style: "currency", currency } : {}),
        maximumFractionDigits: 0,
    }).format(n);
    return root.dataset.openTop !== undefined && value >= max ? `${text}+` : text;
}
function parts(root) {
    const [low, high] = root.querySelectorAll("input.cap-range-slider-input");
    const out = root.querySelector(".cap-range-slider-value");
    return { low, high, out };
}
// Writes the fill and the words from the inputs' values.
export function paint(root) {
    const { low, high, out } = parts(root);
    if (!low || !high)
        return;
    const min = Number(low.min);
    const max = Number(low.max);
    root.style.setProperty("--cap-range-lo", rangeFill(Number(low.value), min, max));
    root.style.setProperty("--cap-range-hi", rangeFill(Number(high.value), min, max));
    const lo = formatValue(root, Number(low.value), max);
    const hi = formatValue(root, Number(high.value), max);
    low.setAttribute("aria-valuetext", lo);
    high.setAttribute("aria-valuetext", hi);
    if (out)
        out.textContent = `${lo} – ${hi}`;
}
export function enhance(root = document) {
    const off = [];
    for (const el of root.querySelectorAll('[data-cap="range-slider"]:not([data-cap-ready])')) {
        const { low, high } = parts(el);
        if (!low || !high)
            continue;
        let timer;
        const bounds = () => ({
            min: Number(low.min),
            max: Number(low.max),
            step: Number(low.step) || 1,
        });
        const input = (e) => {
            const moved = e.target === low ? "low" : "high";
            const [lo, hi] = clampPair(Number(low.value), Number(high.value), bounds(), moved);
            low.value = String(lo);
            high.value = String(hi);
            paint(el);
            clearTimeout(timer);
            timer = setTimeout(() => el.dispatchEvent(new CustomEvent(COMMIT_EVENT, {
                bubbles: true,
                detail: { low: lo, high: hi },
            })), COMMIT_DELAY_MS);
        };
        const track = low.parentElement;
        const press = (e) => {
            if (e.target !== track || e.button !== 0 || !track)
                return;
            // No mousedown after it, whose default would take the focus off the handle again.
            e.preventDefault();
            const { which, value } = trackPick(track, e.clientX, [Number(low.value), Number(high.value)], bounds());
            const handle = which === "low" ? low : high;
            handle.value = String(value);
            handle.focus();
            handle.dispatchEvent(new Event("input", { bubbles: true }));
        };
        low.addEventListener("input", input);
        high.addEventListener("input", input);
        track?.addEventListener("pointerdown", press);
        el.dataset.capReady = "";
        paint(el);
        off.push(() => {
            clearTimeout(timer);
            low.removeEventListener("input", input);
            high.removeEventListener("input", input);
            track?.removeEventListener("pointerdown", press);
            delete el.dataset.capReady;
        });
    }
    return () => off.forEach((f) => f());
}
