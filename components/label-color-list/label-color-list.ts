// The label color list's pure logic: a short, ordered list of labels a person names, each with one
// of the eight series colors (--series-1 to --series-8), used to mark and filter things (a scene's
// status, a task's stage). A value the list does not carry is shown as written, never refused.
// Extracted from Carrel (app/lib/writing/status.ts).

export type ColorLabel = { label: string; color: number };

// The names a person sees for the eight colors, in token order (--series-1 to --series-8; the
// palette's purple, fox, teal, sage, indigo, pine, orchid and rust).
export const COLOR_NAMES = [
  "Purple",
  "Orange",
  "Teal",
  "Sage",
  "Indigo",
  "Pine",
  "Orchid",
  "Rust",
] as const;

export const COLORS = COLOR_NAMES.length;
export const MAX_LABELS = 12;
export const MAX_LABEL_LENGTH = 40;

const SERIES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// A label's color as the series number a pill's dot takes (Pill's `series`): 1 to 8, a color past
// 8 round again, and anything that is not a number the first.
export function seriesOf(color: number): (typeof SERIES)[number] {
  return SERIES[(((Math.round(color) - 1) % COLORS) + COLORS) % COLORS] ?? 1;
}

// A starting list: each label takes the next color, round the eight.
export function colorLabels(...labels: string[]): ColorLabel[] {
  return labels.map((label, i) => ({ label, color: (i % COLORS) + 1 }));
}

// The label a value names, ignoring case and the space around it; null for an empty or unknown one.
export function labelFor(labels: readonly ColorLabel[], value: string): ColorLabel | null {
  const wanted = value.trim().toLowerCase();
  if (!wanted) return null;
  return labels.find((l) => l.label.toLowerCase() === wanted) ?? null;
}

// A list as a person submitted it: blank rows dropped, labels trimmed and their spaces closed up,
// a label twice (ignoring case) refused, a color outside 1 to 8 given the next one round. Returns
// the clean list or the sentence that says why it was refused.
export function cleanLabels(
  rows: ReadonlyArray<{ label: string; color: string | number }>,
  { max = MAX_LABELS, maxLength = MAX_LABEL_LENGTH } = {},
): { ok: true; labels: ColorLabel[] } | { ok: false; error: string } {
  const labels: ColorLabel[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const label = row.label.trim().replace(/\s+/g, " ");
    if (!label) continue;
    if (label.length > maxLength)
      return {
        ok: false,
        error: `Keep each label to ${maxLength} characters: "${label.slice(0, 20)}..." is longer.`,
      };
    const key = label.toLowerCase();
    if (seen.has(key)) return { ok: false, error: `"${label}" is in the list twice.` };
    seen.add(key);
    const color = Number(row.color);
    labels.push({
      label,
      color:
        Number.isInteger(color) && color >= 1 && color <= COLORS
          ? color
          : (labels.length % COLORS) + 1,
    });
  }
  if (labels.length === 0) return { ok: false, error: "Keep at least one label." };
  if (labels.length > max) return { ok: false, error: `Keep the list to ${max} labels.` };
  return { ok: true, labels };
}

// The editor's rows: the list, then up to `spare` empty rows to add to it, never past `max`. An
// empty row's color is the one it would take next.
export function editRows(
  labels: readonly ColorLabel[],
  { spare = 2, max = MAX_LABELS } = {},
): ColorLabel[] {
  const room = Math.max(0, Math.min(spare, max - labels.length));
  return [
    ...labels,
    ...Array.from({ length: room }, (_, i) => ({
      label: "",
      color: ((labels.length + i) % COLORS) + 1,
    })),
  ];
}

// The rows a form posted: `label` and `color` repeated, paired by position.
export function rowsFromForm(labels: readonly unknown[], colors: readonly unknown[]) {
  return labels.map((label, i) => ({ label: String(label ?? ""), color: String(colors[i] ?? "") }));
}
