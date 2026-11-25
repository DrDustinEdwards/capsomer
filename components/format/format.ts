// Numbers in words a person reads, in one module so "3 files", "2.4 MB" and "12%" read the same on
// every site. Plain functions, no DOM.

const BYTE_UNITS = ["kB", "MB", "GB", "TB"] as const;

// Binary division (1 kB is 1,024 bytes), as Windows states a size. Bytes and kB are whole; MB and
// up keep one decimal under 100 and drop a trailing ".0".
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "Unknown size";
  const sign = bytes < 0 ? "-" : "";
  let value = Math.abs(bytes);
  if (value < 1024) return `${sign}${Math.round(value)} B`;
  value /= 1024;
  let unit = 0;
  // Rounded first: 1023.96 MB shows as "1 GB", never "1024 MB".
  while (Math.round(value) >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  if (unit === 0) return `${sign}${Math.round(value)} kB`;
  const shown = value >= 100 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, "");
  return `${sign}${shown} ${BYTE_UNITS[unit]}`;
}

const GROUPED = new Intl.NumberFormat("en-US");
const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

// Exact under 10,000, then short with at most one decimal. The exact figure belongs in the accessible
// name or a title whenever the short one stands in for it.
export function shortCount(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  return Math.abs(n) < 10_000 ? GROUPED.format(n) : COMPACT.format(n);
}

// Null for no values, never NaN. `round: true` rounds the result. The caller's array is not changed.
export function median(
  values: readonly number[],
  options: { round?: boolean } = {},
): number | null {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  const value =
    sorted.length % 2 === 1
      ? (sorted[mid] as number)
      : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  return options.round ? Math.round(value) : value;
}

export interface PercentOptions {
  digits?: number;
}

// part / whole as a percent number, rounded to `digits` places. Null when the whole is 0 or less,
// or either is not a number: a rate of nothing is no data, never 0%.
export function percentOf(
  part: number,
  whole: number,
  options: PercentOptions = {},
): number | null {
  if (!Number.isFinite(part) || !Number.isFinite(whole) || whole <= 0) return null;
  const scale = 10 ** (options.digits ?? 0);
  return Math.round((part / whole) * 100 * scale) / scale;
}

export function formatPercent(value: number, options: PercentOptions = {}): string {
  if (!Number.isFinite(value)) return "No data";
  const text = options.digits === undefined ? String(value) : value.toFixed(options.digits);
  return `${text}%`;
}

export function formatBps(bps: number, options: PercentOptions = {}): string {
  return formatPercent(bps / 100, options);
}
