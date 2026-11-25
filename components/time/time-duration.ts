// Durations: how long, not when (time.ts has the instants). Milliseconds in, like every function there
// (`seconds * SEC`).
import { plural } from "@drdustinedwards/site-helpers/text";

export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export const whole = (n: number | null | undefined) =>
  Number.isFinite(n) ? Math.max(0, Math.floor(n as number)) : 0;

/** A number as two digits, "07". */
export const two = (n: number): string => String(n).padStart(2, "0");

// A duration as a player's timecode writes it: "4:05", "1:02:03". With hours: "always", the form
// a feed wants for <itunes:duration>: "00:04:05", "01:02:03". Negative, missing or NaN is zero.
export function timecode(
  ms: number | null | undefined,
  options: { hours?: "auto" | "always" } = {},
): string {
  const total = Math.floor(whole(ms) / SEC);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = two(total % 60);
  if (options.hours === "always") return `${two(h)}:${two(m)}:${sec}`;
  return h ? `${h}:${two(m)}:${sec}` : `${m}:${sec}`;
}

export type DurationStyle = "long" | "short" | "narrow";

export interface DurationOptions {
  // "long": "3 minutes, 12 seconds" (the default: it reads well aloud). "short": "3 min, 12 sec".
  // "narrow": "3m 12s".
  style?: DurationStyle;
  // The largest unit used: "hours" (the default: 90 minutes is "1 hour, 30 minutes") or "days".
  largest?: "hours" | "days";
}

interface DurationFormatLike {
  format(duration: Record<string, number>): string;
}
type DurationFormatCtor = new (
  locale: string,
  options: Record<string, unknown>,
) => DurationFormatLike;

const UNIT_WORDS = {
  days: ["day", "day", "d"],
  hours: ["hour", "hr", "h"],
  minutes: ["minute", "min", "m"],
  seconds: ["second", "sec", "s"],
} as const;
type Unit = keyof typeof UNIT_WORDS;

// Where Intl.DurationFormat exists (Chrome 129, Firefox 136, Safari 18.4; MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat)
// it writes the words; elsewhere the same English is written here, so a server and a browser that
// differ in support still print the same text.
function durationWords(parts: Partial<Record<Unit, number>>, style: DurationStyle): string {
  const units = (Object.keys(UNIT_WORDS) as Unit[]).filter((u) => (parts[u] ?? 0) > 0);
  // Nothing at all reads as "0 seconds". DurationFormat leaves out zero units unless told to show one.
  const zero = units.length === 0;
  if (zero) units.push("seconds");
  const ctor = (Intl as unknown as { DurationFormat?: DurationFormatCtor }).DurationFormat;
  if (ctor) {
    try {
      const out: Record<string, number> = {};
      for (const u of units) out[u] = parts[u] ?? 0;
      return new ctor("en-US", zero ? { style, secondsDisplay: "always" } : { style }).format(out);
    } catch {
      /* an engine with a partial implementation: use the fallback */
    }
  }
  const words = units.map((u) => {
    const n = parts[u] ?? 0;
    const [long, short, narrow] = UNIT_WORDS[u];
    if (style === "narrow") return `${n}${narrow}`;
    if (style === "short") return `${n} ${short}${u === "days" && n !== 1 ? "s" : ""}`;
    return plural(n, long);
  });
  return words.join(style === "narrow" ? " " : ", ");
}

function split(ms: number, largest: "hours" | "days"): Partial<Record<Unit, number>> {
  let total = Math.floor(whole(ms) / SEC);
  const out: Partial<Record<Unit, number>> = {};
  if (largest === "days") {
    out.days = Math.floor(total / 86400);
    total %= 86400;
  }
  out.hours = Math.floor(total / 3600);
  out.minutes = Math.floor((total % 3600) / 60);
  out.seconds = total % 60;
  return out;
}

// A duration in words, for a screen reader or a sentence: "3 minutes, 12 seconds", "1 hour, 2
// minutes, 3 seconds", "0 seconds". Units that are zero are left out.
export function duration(ms: number | null | undefined, options: DurationOptions = {}): string {
  return durationWords(split(whole(ms), options.largest ?? "hours"), options.style ?? "long");
}

// A rough duration to the largest unit, rounded down, for "waiting 3 hours" and "oldest 2 days":
// "less than a minute", "5 minutes", "3 hours", "2 days". The spelled-out form of a compact "3.2h".
export function span(ms: number | null | undefined): string {
  const a = whole(ms);
  if (a < MIN) return "less than a minute";
  if (a < HOUR) return duration(Math.floor(a / MIN) * MIN);
  if (a < DAY) return duration(Math.floor(a / HOUR) * HOUR);
  return duration(Math.floor(a / DAY) * DAY, { largest: "days" });
}

// How soon something scheduled fires, spelled out: "due now" once the moment has passed, then "in 5
// minutes", "in 3 hours, 20 minutes" (the hour form carries the minutes, since "in 3 hours" hides up
// to 59 of them), and "in 2 days" (a day or more drops the hours, which would be noise).
export function until(t: number, now: number = Date.now()): string {
  const d = t - now;
  if (!Number.isFinite(d)) return "";
  if (d <= 0) return "due now";
  if (d < HOUR) return `in ${duration(Math.max(1, Math.round(d / MIN)) * MIN)}`;
  if (d < DAY) {
    let hours = Math.floor(d / HOUR);
    let minutes = Math.round((d - hours * HOUR) / MIN);
    // Rounding the minutes can reach 60: carry it rather than say "3 hours, 60 minutes".
    if (minutes === 60) {
      hours += 1;
      minutes = 0;
    }
    return `in ${duration(hours * HOUR + minutes * MIN)}`;
  }
  return `in ${duration(Math.floor(d / DAY) * DAY, { largest: "days" })}`;
}
