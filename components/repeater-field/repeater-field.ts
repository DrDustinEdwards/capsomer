// The repeater's pure parts, safe on the server: reading its rows back from a posted form, and
// moving one row. No DOM.

export type Row = Record<string, string>;

// The posted name of one row's field: `links[2][url]`.
export const rowFieldName = (name: string, index: number, key: string): string =>
  `${name}[${index}][${key}]`;

// The rows a form posted for `name`, with the keys asked for. With script the repeater can post
// them as one JSON array under `name` (its `json` prop); without, each field is posted on its own
// as `name[i][key]`. Either is read here. A row whose every value is empty is dropped (a spare
// row nobody filled), and values are trimmed. A JSON field that is not an array of objects is
// null, so the action answers with an error rather than saving an empty list over the old one.
export function rowsFromForm(form: FormData, name: string, keys: readonly string[]): Row[] | null {
  const own = form.get(name);
  let rows: Row[];
  if (typeof own === "string") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(own);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed) || !parsed.every((r) => typeof r === "object" && r !== null))
      return null;
    rows = parsed.map((r: Record<string, unknown>) =>
      Object.fromEntries(keys.map((k) => [k, typeof r[k] === "string" ? r[k].trim() : ""])),
    );
  } else {
    const found = new Map<number, Row>();
    const pattern = new RegExp(
      `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\[(\\d+)\\]\\[([^\\]]+)\\]$`,
    );
    for (const [field, value] of form.entries()) {
      const m = pattern.exec(field);
      if (!m || typeof value !== "string" || !keys.includes(m[2]!)) continue;
      const i = Number(m[1]);
      const row = found.get(i) ?? Object.fromEntries(keys.map((k) => [k, ""]));
      row[m[2]!] = value.trim();
      found.set(i, row);
    }
    rows = [...found.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
  }
  return rows.filter((r) => keys.some((k) => r[k] !== ""));
}

// A copy of `list` with the item at `from` moved to `to` (both clamped to the list).
export function moveRow<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  if (from < 0 || from >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item as T);
  return next;
}

// What the status region says after a change: "Link 3 added.", "Link 2 removed.",
// "Link 2 moved up, now Link 1."
export function changeText(
  change: "added" | "removed" | "up" | "down",
  label: string,
  now?: string,
): string {
  if (change === "added" || change === "removed") return `${label} ${change}.`;
  return `${label} moved ${change}${now ? `, now ${now}` : ""}.`;
}
