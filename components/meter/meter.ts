// The meter's behaviour: where the fill, the projection and the threshold tick sit on the
// bar, set through the CSSOM so apps keep style-src 'self'. The number itself is in the
// markup's text and aria-valuetext; this only draws the bar. The usage meter, the stat tile
// and any app's bar use these same functions.

export type MeterTone = "ok" | "warn" | "crit";

// The share of the span, from 0 to 1. A missing, negative or non-finite value is 0.
export function ratio(value: number, max: number, min = 0): number {
  const span = max - min;
  if (!Number.isFinite(value) || !Number.isFinite(span) || span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / span));
}

// The tone a value earns by threshold: warning from `warnAt` of the span, critical from
// `critAt` (both 0 to 1; the defaults are the usage meter's 75% and 90%). The caller still
// writes the status word beside it: a tone is a word, a shape and a colour, never colour.
export function toneFor(value: number, max: number, options: { min?: number; warnAt?: number; critAt?: number } = {}): MeterTone {
  const { min = 0, warnAt = 0.75, critAt = 0.9 } = options;
  const r = ratio(value, max, min);
  return r >= critAt ? "crit" : r >= warnAt ? "warn" : "ok";
}

function num(s: string | null | undefined): number {
  return s == null || s === "" ? NaN : Number(s);
}

export interface BarValues {
  value: number;
  max: number;
  min?: number;
  // The projected value at the end of the period, in the same unit; null or absent: none.
  projected?: number | null;
  // Where the threshold tick sits, in the same unit; null or absent: no tick.
  threshold?: number | null;
}

// Sets one bar's positions from its values.
export function setBar(bar: HTMLElement, v: BarValues): void {
  const min = v.min ?? 0;
  bar.style.setProperty("--cap-meter-ratio", String(ratio(v.value, v.max, min)));
  if (v.projected == null) bar.style.removeProperty("--cap-meter-projected");
  else bar.style.setProperty("--cap-meter-projected", String(Math.max(ratio(v.value, v.max, min), ratio(v.projected, v.max, min))));
  if (v.threshold == null) bar.style.removeProperty("--cap-meter-threshold");
  else bar.style.setProperty("--cap-meter-threshold", String(ratio(v.threshold, v.max, min)));
}

// Reads a bar's aria-valuenow, aria-valuemin, aria-valuemax, data-projected and
// data-threshold and draws it.
export function update(bar: HTMLElement): void {
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

const WATCHED = ["aria-valuenow", "aria-valuemax", "aria-valuemin", "data-projected", "data-threshold"];

// Attaches to every [data-cap="meter"] under root (or root itself) not yet attached, draws
// its bar, and redraws it whenever a value changes. Returns a function that detaches.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  const found = [...root.querySelectorAll<HTMLElement>("[data-cap='meter']:not([data-cap-ready])")];
  if (root instanceof HTMLElement && root.matches("[data-cap='meter']:not([data-cap-ready])")) found.unshift(root);
  for (const meter of found) {
    meter.dataset.capReady = "";
    const bar = meter.querySelector<HTMLElement>(".cap-meter-bar");
    if (bar) {
      update(bar);
      const watch = new MutationObserver(() => update(bar));
      watch.observe(bar, { attributes: true, attributeFilter: WATCHED });
      undo.push(() => watch.disconnect());
    }
    undo.push(() => {
      delete meter.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
