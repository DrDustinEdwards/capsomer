// The bulk bar's pure helpers: the count words, the outcome list and the selection a React list keeps (bulk-bar.ts has the DOM).
export function countText(n) {
    return `${n} selected`;
}
// Fills {n} and {s} in a template: "Bin {n} item{s}" gives "Bin 12 items".
export function fillCount(template, n) {
    return template.replace(/\{n\}/g, String(n)).replace(/\{s\}/g, n === 1 ? "" : "s");
}
// Every item of a destructive action, one line each. Never shortened: a preview that hides items is not one.
export function previewItems(items) {
    return items.map((i) => i.label);
}
// Refusals first: what needs the person comes before what is done.
export function orderOutcomes(outcomes) {
    return [...outcomes.filter((o) => !o.ok), ...outcomes.filter((o) => o.ok)];
}
// The outcome list's one line: "All 3 done.", "None done: 2 refused.", "2 done, 1 not done."
export function outcomeSummary(outcomes) {
    const done = outcomes.filter((o) => o.ok).length;
    const not = outcomes.length - done;
    if (not === 0)
        return done === 1 ? "Done." : `All ${done} done.`;
    if (done === 0)
        return not === 1 ? "Not done." : `None done: ${not} refused.`;
    return `${done} done, ${not} not done.`;
}
// The selection model a React list keeps. The selection that counts is always the stored ids still
// in view, in row order, so a filter that hides a row never leaves it counted or submitted.
export function visibleSelection(selected, rows) {
    return rows.filter((r) => selected.has(r.id)).map((r) => r.id);
}
// Every row in view is selected, and there is at least one (an empty page is not "all").
export function allVisibleSelected(selected, rows) {
    return rows.length > 0 && rows.every((r) => selected.has(r.id));
}
// Select all replaces the selection with the rows in view; if all are selected, clears.
export function toggleAllVisible(selected, rows) {
    return allVisibleSelected(selected, rows) ? new Set() : new Set(rows.map((r) => r.id));
}
export function toggleOne(selected, id) {
    const next = new Set(selected);
    if (next.has(id))
        next.delete(id);
    else
        next.add(id);
    return next;
}
// After an action only the items not done stay selected, so the next press retries them.
export function failedIds(outcomes) {
    return new Set(outcomes.filter((o) => !o.ok).map((o) => o.id));
}
