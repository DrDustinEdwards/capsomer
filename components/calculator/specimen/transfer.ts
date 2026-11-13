// The specimen's arithmetic: a site's monthly data transfer from its visits and its page weight.
// A site passes its own `run`; this one only shows the shape a run returns.
import type { CalculatorField, CalculatorResult } from "../calculator.ts";

export const FIELDS: CalculatorField[] = [
  { name: "visits", label: "Visits per month", value: "25000", hint: "25000 or 2.5 x 10^4." },
  {
    name: "weight",
    label: "Page weight",
    unit: "KB",
    value: "1800",
    source: { href: "https://example.com/reports/page-weight", label: "Example Co annual report" },
  },
];

const read = (s: string | undefined): number => {
  const t = String(s ?? "")
    .replace(/,/g, "")
    .replace(/\s*x\s*10\^(-?\d+)/, "e$1")
    .trim();
  return t === "" ? Number.NaN : Number(t);
};
const plain = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const power = (n: number) => {
  const e = Math.floor(Math.log10(n));
  return `${plain(Number((n / 10 ** e).toPrecision(3)))} x 10^${e}`;
};

export function runTransfer(values: Record<string, string | undefined>): CalculatorResult {
  const visits = read(values.visits);
  const weight = read(values.weight);
  if (!Number.isFinite(visits) || visits <= 0)
    return { ok: false, error: "Enter the visits per month, greater than 0." };
  if (!Number.isFinite(weight) || weight <= 0)
    return { ok: false, error: "Enter the page weight in KB, greater than 0." };
  const kb = visits * weight;
  const gb = kb / 1e6;
  return {
    ok: true,
    sections: [
      {
        heading: "Monthly transfer",
        result: `${plain(gb)} GB per month`,
        steps: [
          `Data per month: ${plain(visits)} visits x ${plain(weight)} KB = ${power(kb)} KB.`,
          `In gigabytes: ${power(kb)} KB / 10^6 = ${plain(gb)} GB.`,
        ],
        notes: ["1 GB is 10^6 KB here, as hosts bill it."],
      },
    ],
  };
}
