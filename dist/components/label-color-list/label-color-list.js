// The label color list's pure logic: an ordered list of labels, each with one of the eight series colors. A value the list does not carry is shown as written, never refused.
export const COLOR_NAMES = [
    "Purple",
    "Orange",
    "Teal",
    "Sage",
    "Indigo",
    "Pine",
    "Orchid",
    "Rust",
];
export const COLORS = COLOR_NAMES.length;
export const MAX_LABELS = 12;
export const MAX_LABEL_LENGTH = 40;
const SERIES = [1, 2, 3, 4, 5, 6, 7, 8];
// A label's color as a series number 1 to 8; past 8 goes round again, a non-number gives 1.
export function seriesOf(color) {
    return SERIES[(((Math.round(color) - 1) % COLORS) + COLORS) % COLORS] ?? 1;
}
export function colorLabels(...labels) {
    return labels.map((label, i) => ({ label, color: (i % COLORS) + 1 }));
}
export function labelFor(labels, value) {
    const wanted = value.trim().toLowerCase();
    if (!wanted)
        return null;
    return labels.find((l) => l.label.toLowerCase() === wanted) ?? null;
}
// Cleans a submitted list: blank rows dropped, spaces closed up, a repeated label (ignoring case) refused, a bad color given the next. Returns the list or the reason.
export function cleanLabels(rows, { max = MAX_LABELS, maxLength = MAX_LABEL_LENGTH } = {}) {
    const labels = [];
    const seen = new Set();
    for (const row of rows) {
        const label = row.label.trim().replace(/\s+/g, " ");
        if (!label)
            continue;
        if (label.length > maxLength)
            return {
                ok: false,
                error: `Keep each label to ${maxLength} characters: "${label.slice(0, 20)}..." is longer.`,
            };
        const key = label.toLowerCase();
        if (seen.has(key))
            return { ok: false, error: `"${label}" is in the list twice.` };
        seen.add(key);
        const color = Number(row.color);
        labels.push({
            label,
            color: Number.isInteger(color) && color >= 1 && color <= COLORS
                ? color
                : (labels.length % COLORS) + 1,
        });
    }
    if (labels.length === 0)
        return { ok: false, error: "Keep at least one label." };
    if (labels.length > max)
        return { ok: false, error: `Keep the list to ${max} labels.` };
    return { ok: true, labels };
}
export function editRows(labels, { spare = 2, max = MAX_LABELS } = {}) {
    const room = Math.max(0, Math.min(spare, max - labels.length));
    return [
        ...labels,
        ...Array.from({ length: room }, (_, i) => ({
            label: "",
            color: ((labels.length + i) % COLORS) + 1,
        })),
    ];
}
export function rowsFromForm(labels, colors) {
    return labels.map((label, i) => ({ label: String(label ?? ""), color: String(colors[i] ?? "") }));
}
