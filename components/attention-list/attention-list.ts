// The attention list's behaviour: the order (worst first), the two tiers (problems, then
// notices), the grouping of like rows under one row that opens in place, the cap on how
// many warnings show at once, and the buttons that show or hide what they control. No
// framework; the React wrapper uses `arrange` and the same markup.
//
// The rules are the Portal's Overview (dashboard/src/lib/derive.ts: tierOf, fold,
// attentionGroups, GROUP_CHILDREN, PROBLEM_ROWS; views/Overview.tsx: NeedsAttention),
// made generic: the Portal's own feed types and its group table are the caller's here.

import { attachRowList } from "../row-list/row-list.ts";

export type AttentionTone = "crit" | "warn" | "nodata" | "info";

export interface AttentionItem {
  id: string;
  tone: AttentionTone;
  title: string;
  detail?: string;
  // Relative time in words ("11 minutes ago"), or that and the exact instant for a <time>.
  when?: string | { text: string; datetime: string };
  href: string;
  // Rows that share a group key (and are not critical) fold into one row that opens in
  // place. The key names the group; what it is called is `groups[key].title`.
  group?: string;
}

// A group's title, detail and the view that lists all of its rows. Without an entry the
// group is called "<key>, <count>" and has no link to a view.
export interface AttentionGroupInfo {
  title?: (count: number) => string;
  // The facets the rows differ by: "capsid, carrel, foxhound".
  detail?: string;
  when?: string | { text: string; datetime: string };
  view?: { href: string; label: string };
}

// A group shows up to this many rows, then a link to the view that lists them all.
export const GROUP_CHILDREN = 5;
// Past this many problem rows the rest of the warnings wait behind "N more warnings".
// Critical rows are always shown.
export const PROBLEM_ROWS = 8;

export interface ArrangeOptions {
  rows?: number;
  children?: number;
  groups?: Record<string, AttentionGroupInfo>;
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
  // What the group's button says: "3 pull requests await the seat".
  label: string;
  detail?: string;
  when?: AttentionItem["when"];
  // The worst tone among its rows.
  tone: AttentionTone;
  // The first rows only (see GROUP_CHILDREN); `total` is how many the group stands for.
  items: AttentionItem[];
  total: number;
  view?: { href: string; label: string };
}

export type AttentionEntry = AttentionRowEntry | AttentionGroupEntry;

export interface Arranged {
  // Critical, then warnings, worst first: shown at once. Critical rows are never hidden.
  problems: AttentionEntry[];
  // Warnings past the cap, behind "N more warnings".
  more: AttentionEntry[];
  // Missing data and notices: facts with nothing to do now, one closed row at the foot.
  notices: AttentionItem[];
  // How many notice items the notices stand for (a folded group counts each of its rows).
  noticeCount: number;
}

function rank(tone: AttentionTone): number {
  const r = TONE_ORDER.indexOf(tone);
  return r < 0 ? TONE_ORDER.length : r;
}

// A problem (critical or warning) needs a person; a notice (no data, a notice) is a fact
// with nothing to do now. The tier follows from the tone (audit ruling 3).
export function isNotice(tone: AttentionTone): boolean {
  return tone === "nodata" || tone === "info";
}

function groupTitle(key: string, n: number, info: AttentionGroupInfo | undefined): string {
  return info?.title ? info.title(n) : `${key}, ${n}`;
}

// Worst first (critical, warning, no data, notice), keeping the given order within a tone.
// Then the two tiers. In the problems, rows sharing a group key fold into one group row,
// placed where its worst row would be; a critical row is never folded, and a group of one is
// just a row. Warnings past `rows` move to `more`. In the notices a group folds into a
// single row that opens its view, not into a second disclosure.
export function arrange(items: readonly AttentionItem[], options: ArrangeOptions = {}): Arranged {
  const { rows = PROBLEM_ROWS, children = GROUP_CHILDREN, groups = {} } = options;
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.tone) - rank(b.item.tone) || a.i - b.i)
    .map((x) => x.item);
  const problemItems = sorted.filter((it) => !isNotice(it.tone));
  const noticeItems = sorted.filter((it) => isNotice(it.tone));

  const size = new Map<string, number>();
  for (const it of problemItems) if (it.group && it.tone !== "crit") size.set(it.group, (size.get(it.group) ?? 0) + 1);
  const entries: AttentionEntry[] = [];
  const open = new Map<string, AttentionGroupEntry>();
  for (const item of problemItems) {
    const n = item.group && item.tone !== "crit" ? (size.get(item.group) ?? 0) : 0;
    if (!item.group || n < 2) {
      entries.push({ kind: "row", item });
      continue;
    }
    let g = open.get(item.group);
    if (!g) {
      const info = groups[item.group];
      g = { kind: "group", key: item.group, label: groupTitle(item.group, n, info), detail: info?.detail, when: info?.when ?? item.when, tone: item.tone, items: [], total: n, view: info?.view };
      open.set(item.group, g);
      entries.push(g);
    }
    if (g.items.length < children) g.items.push(item);
  }

  const crit = entries.filter((e) => (e.kind === "row" ? e.item.tone : e.tone) === "crit");
  const warn = entries.filter((e) => (e.kind === "row" ? e.item.tone : e.tone) !== "crit");
  const room = Math.max(0, rows - crit.length);
  const hidden = warn.length > room ? warn.slice(room) : [];
  const problems = [...crit, ...(hidden.length ? warn.slice(0, room) : warn)];

  const noticeSize = new Map<string, number>();
  for (const it of noticeItems) if (it.group) noticeSize.set(it.group, (noticeSize.get(it.group) ?? 0) + 1);
  const notices: AttentionItem[] = [];
  const folded = new Set<string>();
  for (const item of noticeItems) {
    const n = item.group ? (noticeSize.get(item.group) ?? 0) : 0;
    if (!item.group || n < 2) {
      notices.push(item);
      continue;
    }
    if (folded.has(item.group)) continue;
    folded.add(item.group);
    const info = groups[item.group];
    notices.push({ id: `group:${item.group}`, tone: item.tone, title: groupTitle(item.group, n, info), detail: info?.detail ?? item.detail, when: info?.when ?? item.when, href: info?.view?.href ?? item.href });
  }
  return { problems, more: hidden, notices, noticeCount: noticeItems.length };
}

// The sentence in the header: "3 problems", "no problems".
export function problemCount(a: Arranged): string {
  const n = a.problems.length + a.more.length;
  return n ? `${n} ${n === 1 ? "problem" : "problems"}` : "No problems";
}

// "All 7 in CI and merges" when the group holds more than it shows, else "Open CI and merges".
export function viewLinkText(g: AttentionGroupEntry): string {
  return g.view ? (g.total > g.items.length ? `All ${g.total} in ${g.view.label}` : `Open ${g.view.label}`) : "";
}

// Shows or hides what one button controls (a group's rows, the warnings past the cap, the
// notices) and keeps the button's state true. A button with data-open-label says that while
// open ("Fewer warnings") and its own text again when closed, as the Portal's does.
export function setGroup(button: HTMLElement, open: boolean): void {
  button.setAttribute("aria-expanded", String(open));
  const openLabel = button.dataset.openLabel;
  if (openLabel) {
    if (button.dataset.closedLabel === undefined) button.dataset.closedLabel = button.textContent ?? "";
    button.textContent = open ? openLabel : button.dataset.closedLabel;
  }
  const id = button.getAttribute("aria-controls");
  const members = id ? button.ownerDocument.getElementById(id) : null;
  if (members) members.hidden = !open;
}

export function toggleGroup(button: HTMLElement): void {
  setGroup(button, button.getAttribute("aria-expanded") !== "true");
}

// Attaches to every [data-cap="attention-list"] under root that is not attached yet: the
// buttons that open and close, and j and k on the list (row-list's, attached here so one
// call is enough). Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const list of root.querySelectorAll<HTMLElement>("[data-cap='attention-list']:not([data-cap-ready])")) {
    list.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest<HTMLElement>("button[aria-expanded][aria-controls]");
      if (button && list.contains(button)) toggleGroup(button);
    };
    list.addEventListener("click", onClick);
    undo.push(() => {
      list.removeEventListener("click", onClick);
      delete list.dataset.capReady;
    });
    for (const rows of list.querySelectorAll<HTMLElement>("[data-cap='row-list']")) undo.push(attachRowList(rows));
  }
  return () => undo.forEach((f) => f());
}
