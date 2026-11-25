// The bulk bar's pure helpers: the count words, the outcome list and the selection a React list keeps (bulk-bar.ts has the DOM).

export interface BulkItem {
  // What the app calls it (the checkbox's value).
  id: string;
  // What the person calls it: a filename, a post title. Listed in the preview.
  label: string;
}

// "3 selected".
export function countText(n: number): string {
  return `${n} selected`;
}

// Fills {n} and {s} in a template: "Bin {n} item{s}" gives "Bin 12 items" and "Bin 1 item".
export function fillCount(template: string, n: number): string {
  return template.replace(/\{n\}/g, String(n)).replace(/\{s\}/g, n === 1 ? "" : "s");
}

// Every item of a destructive action, one line each, for the confirm dialog's list. The title
// carries the count; the list is not shortened, because a preview that hides items is not one.
export function previewItems(items: readonly BulkItem[]): string[] {
  return items.map((i) => i.label);
}

// One item's outcome after an action that acted on several, for the bar's outcome list. A site
// can refuse one item and do the rest, so each says its own result.
export interface BulkOutcome {
  id: string;
  label: string;
  ok: boolean;
  // Why it was not done, or a note on what was: "Changed since you opened it."
  message?: string;
  // Where it is still used, when that is why it was refused: one line each.
  usedBy?: readonly string[];
}

// The outcomes to list, refusals first: what needs the person comes before what is done.
export function orderOutcomes(outcomes: readonly BulkOutcome[]): BulkOutcome[] {
  return [...outcomes.filter((o) => !o.ok), ...outcomes.filter((o) => o.ok)];
}

// The outcome list's one line: "All 3 done.", "None done: 2 refused.", "2 done, 1 not done."
export function outcomeSummary(outcomes: readonly BulkOutcome[]): string {
  const done = outcomes.filter((o) => o.ok).length;
  const not = outcomes.length - done;
  if (not === 0) return done === 1 ? "Done." : `All ${done} done.`;
  if (done === 0) return not === 1 ? "Not done." : `None done: ${not} refused.`;
  return `${done} done, ${not} not done.`;
}

// The selection model a React list keeps (a server-rendered list keeps it in its checkboxes). The
// one idea: the selection that counts is always the stored ids that are still in view, in the
// rows' order, so a filter that hides a row can never leave it counted, gated or submitted.
export function visibleSelection(
  selected: ReadonlySet<string>,
  rows: ReadonlyArray<{ id: string }>,
): string[] {
  return rows.filter((r) => selected.has(r.id)).map((r) => r.id);
}

// Every row in view is selected, and there is at least one (an empty page is not "all").
export function allVisibleSelected(
  selected: ReadonlySet<string>,
  rows: ReadonlyArray<{ id: string }>,
): boolean {
  return rows.length > 0 && rows.every((r) => selected.has(r.id));
}

// Select all: the selection becomes exactly the rows in view (replaced, not merged); all already: clears.
export function toggleAllVisible(
  selected: ReadonlySet<string>,
  rows: ReadonlyArray<{ id: string }>,
): Set<string> {
  return allVisibleSelected(selected, rows) ? new Set() : new Set(rows.map((r) => r.id));
}

export function toggleOne(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

// After an action: exactly the items that were not done stay selected, so the next press retries
// those and nothing else.
export function failedIds(outcomes: readonly BulkOutcome[]): Set<string> {
  return new Set(outcomes.filter((o) => !o.ok).map((o) => o.id));
}
