// A meter's fill: its length from the meter's value and maximum, set through the CSSOM so
// apps keep style-src 'self'. The number itself is in the markup's text and
// aria-valuetext; this only draws the bar.

// The share of the maximum, from 0 to 1. A missing, negative or non-finite value is 0.
export function ratio(value: number, max: number, min = 0): number {
  const span = max - min;
  if (!Number.isFinite(value) || !Number.isFinite(span) || span <= 0) return 0;
  return Math.min(1, Math.max(0, (value - min) / span));
}

function num(s: string | null | undefined): number {
  return s == null || s === "" ? NaN : Number(s);
}

// Sets one meter's fill from its value and maximum.
export function setFill(meter: HTMLElement, value: number, max: number, min = 0): void {
  meter.style.setProperty("--cap-meter-ratio", String(ratio(value, max, min)));
}

// Reads data-value and data-max (or aria-valuenow and aria-valuemax) and draws the fill.
export function update(meter: HTMLElement): void {
  const value = num(meter.dataset.value ?? meter.getAttribute("aria-valuenow"));
  const max = num(meter.dataset.max ?? meter.getAttribute("aria-valuemax"));
  const min = num(meter.getAttribute("aria-valuemin"));
  setFill(meter, value, max, Number.isFinite(min) ? min : 0);
}

const WATCHED = ["data-value", "data-max", "aria-valuenow", "aria-valuemax", "aria-valuemin"];

// Attaches to every [data-cap="meter"] under root not yet attached, draws its fill, and
// redraws it whenever its value or maximum changes. Returns a function that detaches.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const meter of root.querySelectorAll<HTMLElement>("[data-cap='meter']:not([data-cap-ready])")) {
    meter.dataset.capReady = "";
    update(meter);
    const watch = new MutationObserver(() => update(meter));
    watch.observe(meter, { attributes: true, attributeFilter: WATCHED });
    undo.push(() => {
      watch.disconnect();
      delete meter.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
