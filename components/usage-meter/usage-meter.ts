// The usage meter's behaviour: a pure assessment of one usage figure against its free
// limit (tone, projection by the reset, when it runs out, and the sentence that says so),
// and `enhance`, which sizes each bar from its ARIA values through the CSSOM. No framework;
// the React wrapper uses the same functions.
//
// The rules (approved for 0.1): warning at 75% used, or when the projection runs out before
// the reset; critical at 90%; no projection until 7 days of history.

export const MIN_HISTORY = 7;
export const WARN_AT = 0.75;
export const CRIT_AT = 0.9;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export type UsageTone = "ok" | "warn" | "crit";

export interface UsageInput {
  used: number;
  limit: number;
  // Totals of past whole periods (days), oldest first. Fewer than 7: no projection.
  history: number[];
  // When the count resets, or null for a total that does not reset (storage).
  resetsAt: number | Date | null;
  now: number | Date;
  // The length of one period; a day unless said otherwise.
  periodMs?: number;
  // A plural noun for what is counted, for "38 writes left". Optional.
  unit?: string;
  // What happens at the limit, completing "At the limit, ... until 00:00 UTC.":
  // "reads fail", "the watcher cannot save its pass". Optional.
  atLimit?: string;
}

export interface UsageAssessment {
  tone: UsageTone;
  // Used as a whole percentage of the limit.
  percent: number;
  // The projected total at the reset, or null with no projection.
  projectedAtReset: number | null;
  // When the limit is reached at the current rate (ms since the epoch), or null.
  fullAt: number | null;
  // A short status word for a warning or critical row: "Runs out before the reset".
  label: string;
  // The "why" line. It starts with `lead`, the part shown in the tone's colour.
  text: string;
  lead: string;
  // The projection in words for aria-valuetext: "projected 87 percent by the reset".
  projection: string;
}

const ms = (t: number | Date): number => (typeof t === "number" ? t : t.getTime());
const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

// A duration in plain words, rounded to the unit a person would say: "40 minutes",
// "3 hours", "2 days".
export function duration(span: number): string {
  const m = Math.max(0, Math.round(span / 60_000));
  if (m < 1) return "less than a minute";
  if (m < 60) return plural(m, "minute");
  const h = Math.round(span / HOUR);
  if (h < 48) return plural(h, "hour");
  return plural(Math.round(span / DAY), "day");
}

// "00:00 UTC". A reset is a UTC time in every provider this family uses.
export function utcClock(t: number | Date): string {
  return `${new Date(ms(t)).toISOString().slice(11, 16)} UTC`;
}

export function assess(input: UsageInput): UsageAssessment {
  const { used, limit, history, unit, atLimit } = input;
  const now = ms(input.now);
  const resetsAt = input.resetsAt == null ? null : ms(input.resetsAt);
  const periodMs = input.periodMs ?? DAY;
  const frac = limit > 0 ? used / limit : 1;
  const percent = Math.round(frac * 100);
  const left = Math.max(0, limit - used);
  const leftWords = `${left.toLocaleString("en-US")}${unit ? ` ${unit}` : ""} left.`;
  const until = resetsAt != null ? ` until ${utcClock(resetsAt)}` : "";
  const atLimitSentence = atLimit ? ` At the limit, ${atLimit}${until}.` : "";

  // The projection: today's rate so far, or the typical rate from history for the first
  // hour of a period, when today's rate is mostly noise.
  let projectedAtReset: number | null = null;
  let fullAt: number | null = null;
  const enoughHistory = history.length >= MIN_HISTORY;
  if (resetsAt != null && enoughHistory && resetsAt > now) {
    const elapsed = now - (resetsAt - periodMs);
    const recent = history.slice(-MIN_HISTORY);
    const typical = recent.reduce((a, b) => a + b, 0) / recent.length / periodMs;
    const rate = elapsed >= HOUR ? used / elapsed : typical;
    projectedAtReset = used + rate * (resetsAt - now);
    if (projectedAtReset >= limit && rate > 0 && used < limit) fullAt = now + (limit - used) / rate;
  }
  const projectedPct = projectedAtReset == null ? null : Math.round((projectedAtReset / limit) * 100);
  const noProjection =
    resetsAt == null
      ? enoughHistory
        ? "This total does not reset."
        : `No projection: ${plural(history.length, "day")} of history, ${MIN_HISTORY} needed. This total does not reset.`
      : `No projection: ${plural(history.length, "day")} of history, ${MIN_HISTORY} needed.`;

  const projection =
    used >= limit
      ? "at the limit"
      : fullAt != null
        ? `projected to run out in about ${duration(fullAt - now)}${resetsAt != null && fullAt < resetsAt ? ", before the reset" : ""}`
        : projectedPct != null
          ? `projected ${projectedPct} percent by the reset`
          : "no projection yet";

  const out = (tone: UsageTone, label: string, lead: string, text: string): UsageAssessment => ({
    tone,
    percent,
    projectedAtReset,
    fullAt,
    label,
    lead,
    text,
    projection,
  });

  if (used >= limit) {
    const lead = "At the limit";
    return out("crit", "At the limit", lead, `${lead}${atLimit ? `: ${atLimit}${until}` : ""}.`);
  }
  if (frac >= CRIT_AT) {
    const runOut = fullAt != null ? ` Full in about ${duration(fullAt - now)}.` : "";
    const why = projectedAtReset == null && resetsAt != null ? ` ${noProjection}` : "";
    return out("crit", "Nearly out", leftWords, `${leftWords}${runOut}${atLimitSentence}${why}`);
  }
  if (fullAt != null && resetsAt != null && fullAt < resetsAt) {
    const lead = `Full in about ${duration(fullAt - now)}`;
    return out("warn", "Runs out before the reset", lead, `${lead}, ${duration(resetsAt - fullAt)} before the reset.${atLimitSentence}`);
  }
  if (projectedAtReset == null || resetsAt == null) {
    const lead = resetsAt == null && enoughHistory ? "Does not reset" : "No projection";
    return out(frac >= WARN_AT ? "warn" : "ok", frac >= WARN_AT ? "Over 75% used" : "No projection yet", lead, noProjection);
  }
  const by = `about ${projectedPct}% by the reset at ${utcClock(resetsAt)}, in ${duration(resetsAt - now)}.`;
  if (frac >= WARN_AT) {
    const lead = `${percent}% used`;
    return out("warn", "Over 75% used", lead, `${lead}: ${by}`);
  }
  return out("ok", "On track", "On track", `On track: ${by}`);
}

// The bar's widths, as percentages of the limit, clamped to the bar.
export function widths(used: number, limit: number, projected: number | null): { used: number; projected: number } {
  const pct = (v: number) => (limit > 0 ? Math.min(100, Math.max(0, (v * 100) / limit)) : 100);
  const u = pct(used);
  return { used: u, projected: projected == null ? u : Math.max(u, pct(projected)) };
}

// Sizes one bar from its aria-valuenow and aria-valuemax and its data-projected (the
// projected total at the reset, in the same unit; absent with no projection).
export function sizeBar(bar: HTMLElement): void {
  const used = Number(bar.getAttribute("aria-valuenow") ?? 0);
  const limit = Number(bar.getAttribute("aria-valuemax") ?? 0);
  const raw = bar.dataset.projected;
  const w = widths(used, limit, raw == null || raw === "" ? null : Number(raw));
  bar.style.setProperty("--used", `${w.used}%`);
  bar.style.setProperty("--projected", `${w.projected}%`);
}

// Attaches to every [data-cap="usage-meter"] under root that is not attached yet, and sizes
// its bars. Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const meter of root.querySelectorAll<HTMLElement>("[data-cap='usage-meter']:not([data-cap-ready])")) {
    meter.dataset.capReady = "";
    for (const bar of meter.querySelectorAll<HTMLElement>(".cap-usage-bar")) sizeBar(bar);
    undo.push(() => {
      delete meter.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
