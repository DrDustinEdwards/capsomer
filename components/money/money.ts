// Money as a person reads it: an amount in minor units (the integer a payment processor stores and
// sends) and an ISO 4217 code, shown in that currency's own places. One module, so JPY never shows
// as a hundredth of itself and KWD keeps its three places on every site.
//
// The places follow Stripe's minor-unit table (stripe.com/docs/currencies), the one the network's
// payments use: zero-decimal currencies are stored whole, three-decimal ones in thousandths, and
// ISK and UGX are sent as hundredths but shown whole. A code this table does not name has two.

const ZERO_DECIMAL = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);
const THREE_DECIMAL = new Set(["bhd", "jod", "kwd", "omr", "tnd"]);
// Sent as two-decimal values whose decimals are always 00: divided by 100, shown with none.
const WHOLE_SENT_AS_HUNDREDTHS = new Set(["isk", "ugx"]);

// How many places the stored integer carries: 0 (JPY), 3 (KWD) or 2 (everything else).
export function currencyExponent(currency: string): 0 | 2 | 3 {
  const code = currency.toLowerCase();
  if (ZERO_DECIMAL.has(code)) return 0;
  if (THREE_DECIMAL.has(code)) return 3;
  return 2;
}

// The places a person sees, which differ from the stored ones only for ISK and UGX.
function shownDigits(currency: string): number {
  return WHOLE_SENT_AS_HUNDREDTHS.has(currency.toLowerCase()) ? 0 : currencyExponent(currency);
}

// 1234 USD minor units is 12.34; 5000 JPY is 5000; 12345 KWD is 12.345.
export function toMajorUnits(minor: number, currency: string): number {
  return minor / 10 ** currencyExponent(currency);
}

// The inverse, rounded to a whole minor unit: 12.345 USD is 1235.
export function fromMajorUnits(major: number, currency: string): number {
  return Math.round(major * 10 ** currencyExponent(currency));
}

// The figure with its places and nothing else ("50.00", "5000", "12.345"): a CSV cell, a form
// field's value, a prompt. No grouping, no symbol.
export function plainMajorAmount(minor: number, currency: string): string {
  return toMajorUnits(minor, currency).toFixed(shownDigits(currency));
}

const formatters = new Map<string, Intl.NumberFormat>();

function format(minor: number, currency: string, digits: number): string {
  const code = currency.toUpperCase();
  const key = `${code}:${digits}`;
  let f = formatters.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch {
      // Intl refuses a malformed code: the figure and the code as given, never a throw in a page.
      return `${toMajorUnits(minor, currency).toFixed(digits)} ${code}`;
    }
    formatters.set(key, f);
  }
  return f.format(toMajorUnits(minor, currency));
}

// "$1,234.56", "¥5,000", "KWD 12.345", "-$45.00".
export function formatMoney(minor: number, currency: string): string {
  return format(minor, currency, shownDigits(currency));
}

// Whole units, rounded (not cut): 1060 cents is "$11". For a tile or an axis where cents are noise.
export function formatMoneyShort(minor: number, currency: string): string {
  return format(minor, currency, 0);
}

// A change with its sign always written: "+$120", "-$45", "+$0". Short unless `exact`.
export function signedMoney(
  minor: number,
  currency: string,
  options: { exact?: boolean } = {},
): string {
  const shown = (options.exact ? formatMoney : formatMoneyShort)(Math.abs(minor), currency);
  return `${minor < 0 ? "-" : "+"}${shown}`;
}

export interface CurrencyAmount {
  currency: string;
  // The amount in minor units (cents for USD, yen for JPY).
  cents: number;
}

// Orders totals by currency code, so a page lists them the same way every time.
export function byCurrencyCode(a: { currency: string }, b: { currency: string }): number {
  return a.currency.localeCompare(b.currency);
}

// Totals in several currencies, side by side, each in its own: "$1,200.00 · €80.00". Never summed
// across currencies. None reads as zero in `empty` (USD unless the page has its own currency).
export function formatAmounts(
  rows: readonly CurrencyAmount[],
  options: { short?: boolean; empty?: string } = {},
): string {
  const one = options.short ? formatMoneyShort : formatMoney;
  if (rows.length === 0) return one(0, options.empty ?? "usd");
  return rows.map((r) => one(r.cents, r.currency)).join(" · ");
}

// What a person typed in a money field, as minor units: "1,234.5" USD is 123450, "5000" JPY is 5000.
// Null for blank, not a number, or below zero: the form says so instead of saving a wrong amount.
export function parseMoneyInput(raw: string, currency: string): number | null {
  const text = raw
    .trim()
    .replace(/[,\s]/g, "")
    .replace(/^[$€£¥]/, "");
  if (text === "" || !/^\d*\.?\d*$/.test(text)) return null;
  const major = Number(text);
  if (!Number.isFinite(major) || major < 0) return null;
  return fromMajorUnits(major, currency);
}
