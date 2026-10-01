// The attention list's behaviour: the order (worst first), the grouping of similar rows
// under one collapsed group row, and the group button that shows or hides them. No
// framework; the React wrapper uses `arrange` and the same markup.

export type AttentionTone = "crit" | "warn" | "nodata" | "info";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  title: string;
  detail?: string;
  // Relative time in words ("11 minutes ago"), or that and the exact instant for a <time>.
  when?: string | { text: string; datetime: string };
  href: string;
  // Rows that share a group key (and are not critical) collapse under one group row
  // named "<group>, <count>". The key is the group's plural name: "Notices".
  group?: string;
}

export const TONE_ORDER: readonly AttentionTone[] = ["crit", "warn", "nodata", "info"];

export const TONE_WORD: Record<AttentionTone, string> = {
  crit: "Critical",
  warn: "Warning",
  nodata: "No data",
  info: "Notice",
};

export interface AttentionRowEntry {
  kind: "row";
  item: AttentionItem;
}

export interface AttentionGroupEntry {
  kind: "group";
  key: string;
  // "Notices, 4": the group button's whole name.
  label: string;
  // The worst tone among its rows.
  tone: AttentionTone;
  items: AttentionItem[];
}

export type AttentionEntry = AttentionRowEntry | AttentionGroupEntry;

function rank(tone: AttentionTone): number {
  const r = TONE_ORDER.indexOf(tone);
  return r < 0 ? TONE_ORDER.length : r;
}

// Worst first (critical, warning, no data, notice), keeping the given order within a tone.
// Rows sharing a group key collapse into one group, placed where its worst row would be.
// A critical row is never grouped, and a group of one is just a row.
export function arrange(items: readonly AttentionItem[]): AttentionEntry[] {
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.tone) - rank(b.item.tone) || a.i - b.i)
    .map((x) => x.item);
  const size = new Map<string, number>();
  for (const it of sorted) if (it.group && it.tone !== "crit") size.set(it.group, (size.get(it.group) ?? 0) + 1);

  const out: AttentionEntry[] = [];
  const groups = new Map<string, AttentionGroupEntry>();
  for (const item of sorted) {
    const n = item.group && item.tone !== "crit" ? (size.get(item.group) ?? 0) : 0;
    if (!item.group || n < 2) {
      out.push({ kind: "row", item });
      continue;
    }
    let g = groups.get(item.group);
    if (!g) {
      g = { kind: "group", key: item.group, label: `${item.group}, ${n}`, tone: item.tone, items: [] };
      groups.set(item.group, g);
      out.push(g);
    }
    g.items.push(item);
  }
  return out;
}

// Shows or hides one group's rows and keeps its button's state true.
export function setGroup(button: HTMLElement, open: boolean): void {
  button.setAttribute("aria-expanded", String(open));
  const id = button.getAttribute("aria-controls");
  const members = id ? button.ownerDocument.getElementById(id) : null;
  if (members) members.hidden = !open;
}

export function toggleGroup(button: HTMLElement): void {
  setGroup(button, button.getAttribute("aria-expanded") !== "true");
}

// Attaches to every [data-cap="attention-list"] under root that is not attached yet.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const list of root.querySelectorAll<HTMLElement>("[data-cap='attention-list']:not([data-cap-ready])")) {
    list.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest<HTMLElement>("[data-cap-part='group-toggle']");
      if (button && list.contains(button)) toggleGroup(button);
    };
    list.addEventListener("click", onClick);
    undo.push(() => {
      list.removeEventListener("click", onClick);
      delete list.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
