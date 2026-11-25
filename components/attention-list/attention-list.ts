// The attention list: order (worst first), two tiers (problems, then notices), grouping of like rows under one
// row that opens in place, the cap on visible warnings, and the show/hide buttons. The React wrapper uses `arrange`.
//

import { plural } from "@drdustinedwards/site-helpers/text";
import { toggleGroup } from "../disclosure/disclosure.ts";
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
  group?: string;
}

// A group's title, detail and the view that lists all of its rows. Without an entry the
// group is called "<key>, <count>" and has no link to a view.
export interface AttentionGroupInfo {
  title?: (count: number) => string;
  // The facets the rows differ by: "api, docs, web".
  detail?: string;
  when?: string | { text: string; datetime: string };
  view?: { href: string; label: string };
}

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
  label: string;
  detail?: string;
  when?: AttentionItem["when"];
  tone: AttentionTone;
  items: AttentionItem[];
  total: number;
  view?: { href: string; label: string };
}

export type AttentionEntry = AttentionRowEntry | AttentionGroupEntry;

export interface Arranged {
  problems: AttentionEntry[];
  more: AttentionEntry[];
  notices: AttentionItem[];
  noticeCount: number;
}

function rank(tone: AttentionTone): number {
  const r = TONE_ORDER.indexOf(tone);
  return r < 0 ? TONE_ORDER.length : r;
}

// A problem needs a person; a notice is a fact with nothing to do now.
export function isNotice(tone: AttentionTone): boolean {
  return tone === "nodata" || tone === "info";
}

function groupTitle(key: string, n: number, info: AttentionGroupInfo | undefined): string {
  return info?.title ? info.title(n) : `${key}, ${n}`;
}

// Worst first, keeping the given order within a tone. In the problems, rows sharing a group key fold into one
// row placed where its worst row would be (never a critical row). Warnings past `rows` move to `more`.
export function arrange(items: readonly AttentionItem[], options: ArrangeOptions = {}): Arranged {
  const { rows = PROBLEM_ROWS, children = GROUP_CHILDREN, groups = {} } = options;
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => rank(a.item.tone) - rank(b.item.tone) || a.i - b.i)
    .map((x) => x.item);
  const problemItems = sorted.filter((it) => !isNotice(it.tone));
  const noticeItems = sorted.filter((it) => isNotice(it.tone));

  const size = new Map<string, number>();
  for (const it of problemItems)
    if (it.group && it.tone !== "crit") size.set(it.group, (size.get(it.group) ?? 0) + 1);
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
      g = {
        kind: "group",
        key: item.group,
        label: groupTitle(item.group, n, info),
        detail: info?.detail,
        when: info?.when ?? item.when,
        tone: item.tone,
        items: [],
        total: n,
        view: info?.view,
      };
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
  for (const it of noticeItems)
    if (it.group) noticeSize.set(it.group, (noticeSize.get(it.group) ?? 0) + 1);
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
    notices.push({
      id: `group:${item.group}`,
      tone: item.tone,
      title: groupTitle(item.group, n, info),
      detail: info?.detail ?? item.detail,
      when: info?.when ?? item.when,
      href: info?.view?.href ?? item.href,
    });
  }
  return { problems, more: hidden, notices, noticeCount: noticeItems.length };
}

export function problemCount(a: Arranged): string {
  const n = a.problems.length + a.more.length;
  return n ? plural(n, "problem") : "No problems";
}

export function viewLinkText(g: AttentionGroupEntry): string {
  return g.view
    ? g.total > g.items.length
      ? `All ${g.total} in ${g.view.label}`
      : `Open ${g.view.label}`
    : "";
}

// Attaches to every [data-cap="attention-list"] under root: the open/close buttons, and j and k on the list.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const list of root.querySelectorAll<HTMLElement>(
    "[data-cap='attention-list']:not([data-cap-ready])",
  )) {
    list.dataset.capReady = "";
    const onClick = (e: MouseEvent) => {
      const button = (e.target as Element).closest<HTMLElement>(
        "button[aria-expanded][aria-controls]",
      );
      if (button && list.contains(button)) toggleGroup(button);
    };
    list.addEventListener("click", onClick);
    undo.push(() => {
      list.removeEventListener("click", onClick);
      delete list.dataset.capReady;
    });
    for (const rows of list.querySelectorAll<HTMLElement>("[data-cap='row-list']"))
      undo.push(attachRowList(rows));
  }
  return () => undo.forEach((f) => f());
}

// A work queue (Carrel's Home): what waits on one person, each need with one main action and Later, which
// sets it aside until tomorrow morning.

// Blocking: something is stuck until the person acts. Waiting: the work is theirs to pick up.
export type NeedUrgency = "blocking" | "waiting";

export const URGENCY_ORDER: readonly NeedUrgency[] = ["blocking", "waiting"];

export const URGENCY_TITLE: Record<NeedUrgency, string> = {
  blocking: "Blocking",
  waiting: "Waiting for you",
};

export interface Need<G extends string = string> {
  id: string;
  // The app's own kind of need ("ai", "due", "flags"): the filter tabs pick by it.
  group: G;
  urgency: NeedUrgency;
  title: string;
  detail?: string;
  // The one main action, as a link.
  action: { label: string; href: string };
  // When it started waiting, ISO, or null.
  at: string | null;
  // Set aside with Later: when it comes back, ISO. Such a need is off the list and out of the
  // count until then.
  later?: string;
}

export function needsShown<G extends string>(
  needs: readonly Need<G>[],
  show: "all" | "later" | G,
): Need<G>[] {
  return needs.filter((n) =>
    show === "later"
      ? n.later !== undefined
      : n.later === undefined && (show === "all" || n.group === show),
  );
}

// Moves focus off a row that is about to leave the list: to the next row's title, else the
// previous one's, else the current filter tab in the same panel, so a keyboard user keeps their
// place.
export function focusNeighbor(row: HTMLElement, rowSelector = ".cap-need-row"): void {
  const list = row.closest(".cap-rows");
  const rows = list ? Array.from(list.querySelectorAll<HTMLElement>(rowSelector)) : [];
  const at = rows.indexOf(row);
  const next = rows[at + 1] ?? rows[at - 1];
  const target =
    next?.querySelector<HTMLElement>(".cap-row-title :is(a, button)") ??
    row.closest(".cap-panel")?.querySelector<HTMLElement>("[aria-current='page']");
  target?.focus();
}

// The shape of Capsid's inbox feed. The kinds are the sender's; which wait on a person decides the severity.

export type InboxSeverity = "needs-you" | "failing" | "none";

export interface InboxItem<K extends string = string> {
  title: string;
  kind: K;
  link: string | null;
  since: string;
  job?: string;
}

export interface InboxApp<K extends string = string> {
  namespace: string;
  name: string;
  count: number;
  severity: InboxSeverity;
  items: InboxItem<K>[];
}

export interface Inbox<K extends string = string> {
  generated: string;
  count: number;
  severity: InboxSeverity;
  apps: InboxApp<K>[];
}

// The worst severity of a set: needs-you when any waits on a person, failing when only a machine fault is open.
export function severityOf<K extends string>(
  items: readonly Pick<InboxItem<K>, "kind">[],
  waitsOnPerson: ReadonlySet<K> | ((kind: K) => boolean),
): InboxSeverity {
  const waits =
    typeof waitsOnPerson === "function" ? waitsOnPerson : (k: K) => waitsOnPerson.has(k);
  if (items.some((i) => waits(i.kind))) return "needs-you";
  return items.length > 0 ? "failing" : "none";
}
