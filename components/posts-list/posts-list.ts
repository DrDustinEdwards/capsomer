// The posts list's pure helpers: the status of a post in words, the addresses of its filters,
// which actions a person is offered here and why the others are withheld, and the forms the
// script path posts. No DOM; the React component and a server render use the same functions.
import { DAY } from "../time/time.ts";
import { queryHref, type ContentLabels, type ContentStatus, type PostRow, type PostsData, type PostsQuery, type PostSort } from "../content/content.ts";

// ---------------------------------------------------------------------------------------
// Status.

export interface ContentStatusWords {
  // The status component's tone: Published is ok (a tick), Scheduled is a notice (a square),
  // Draft is no data yet (an empty circle with a bar). Shape, word and color together.
  tone: "ok" | "info" | "nodata";
  word: string;
  // For a scheduled post: when it goes out, "in 3 days", "today", "tomorrow", "due now".
  when?: string;
}

const utcDay = (ms: number) => Math.floor(ms / DAY);

// How far off a scheduled time is, in whole UTC days. Past it, the site has not published it yet.
export function inDays(at: string, now: number): string {
  const t = Date.parse(at);
  if (!Number.isFinite(t)) return "";
  if (t <= now) return "due now";
  const days = utcDay(t) - utcDay(now);
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

// The one mapping from a content status to its words, for every list and editor that shows one
// (Carrel wrote it inline six times).
export function contentStatus(status: ContentStatus, publishAt: string | null = null, now: number = Date.now()): ContentStatusWords {
  switch (status) {
    case "published":
      return { tone: "ok", word: "Published" };
    case "scheduled":
      return publishAt ? { tone: "info", word: "Scheduled", when: inDays(publishAt, now) } : { tone: "info", word: "Scheduled" };
    case "draft":
      return { tone: "nodata", word: "Draft" };
  }
}

// A row's status on one line: the status word, then what is due, after a middle dot:
// "Scheduled · in 3 days", "Published · update in 2 days".
export function rowStatus(row: Pick<PostRow, "status" | "publishAt" | "scheduledUpdate">, now: number = Date.now()): ContentStatusWords & { note?: string } {
  const st = contentStatus(row.status, row.publishAt, now);
  if (row.status === "published" && row.scheduledUpdate) return { ...st, note: `update ${inDays(row.scheduledUpdate.publishAt, now)}` };
  return st.when ? { ...st, note: st.when } : st;
}

// ---------------------------------------------------------------------------------------
// Words.

export function nounsOf(labels: ContentLabels = {}): { noun: string; plural: string } {
  const noun = labels.noun ?? "post";
  return { noun, plural: labels.plural ?? `${noun}s` };
}

export const STATUS_TABS: ReadonlyArray<{ status: ContentStatus | undefined; label: string }> = [
  { status: undefined, label: "All" },
  { status: "draft", label: "Drafts" },
  { status: "scheduled", label: "Scheduled" },
  { status: "published", label: "Published" },
];

export const SORTS: ReadonlyArray<{ value: PostSort; label: string }> = [
  { value: "updated", label: "Last updated" },
  { value: "published", label: "Last published" },
  { value: "title", label: "Title" },
];

// "12 posts", "Showing 50 of 120 posts", and a note when the site could only sort this page.
export function countLine(data: Pick<PostsData, "rows" | "page">, labels?: ContentLabels): string {
  const { noun, plural } = nounsOf(labels);
  const n = data.rows.length;
  const total = data.page.total;
  const word = (k: number) => (k === 1 ? noun : plural);
  const base = total != null && total > n ? `Showing ${n} of ${total} ${word(total)}` : `${n} ${word(n)}`;
  return data.page.sortedOnPage ? `${base}, sorted on this page only` : base;
}

// Filters in the query other than the page and the order: what the empty state says is hiding rows.
export function filtered(q: PostsQuery): boolean {
  return !!(q.q || q.kind || q.tag);
}

// The empty state's title and line, naming what is not there.
export function emptyWords(q: PostsQuery, labels?: ContentLabels): { kind: "nothing-yet" | "no-match"; title: string; text: string } {
  const { plural } = nounsOf(labels);
  if (filtered(q)) {
    const what = [q.q ? `“${q.q}”` : null, q.kind ? `kind ${q.kind}` : null, q.tag ? `tag ${q.tag}` : null].filter(Boolean).join(", ");
    return { kind: "no-match", title: `No ${plural} match ${what}`, text: "Clear the filters to see every one." };
  }
  switch (q.status) {
    case "draft":
      return { kind: "nothing-yet", title: "No drafts", text: `Every ${nounsOf(labels).noun} here is scheduled or published.` };
    case "scheduled":
      return { kind: "nothing-yet", title: "Nothing scheduled", text: "A scheduled post shows here until it goes out." };
    case "published":
      return { kind: "nothing-yet", title: "Nothing published yet", text: "Published posts show here." };
    default:
      return { kind: "nothing-yet", title: `No ${plural} yet`, text: `The first ${nounsOf(labels).noun} you start shows here.` };
  }
}

// ---------------------------------------------------------------------------------------
// Addresses.

const QUERY_ORDER: ReadonlyArray<keyof PostsQuery> = ["q", "status", "kind", "tag", "sort", "cursor"];

// The list's address with a query (content.ts, queryHref).
export function postsHref(base: string, q: PostsQuery): string {
  return queryHref(base, q, QUERY_ORDER);
}

// A filter link changes one thing and starts again at the first page.
export function withFilter(q: PostsQuery, change: Partial<PostsQuery>): PostsQuery {
  const next: PostsQuery = { ...q, ...change };
  delete next.cursor;
  for (const k of Object.keys(change) as Array<keyof PostsQuery>) if (change[k] === undefined) delete next[k];
  return next;
}

// ---------------------------------------------------------------------------------------
// What is offered.

export type PostIntent = "add-tag" | "remove-tag" | "duplicate" | "unpublish" | "delete" | "reschedule" | "cancel-schedule";

export interface OfferedAction {
  intent: PostIntent;
  label: string;
  destructive?: boolean;
}

// The bulk actions this person may run on this site, in the bar's order, and a sentence for each
// one held back, so a missing button is never a mystery. An action shows only when the site
// offers it (data.offers) and the person may run it (data.can).
export function postActions(data: Pick<PostsData, "offers" | "can">, labels?: ContentLabels): { bulk: OfferedAction[]; withheld: string[] } {
  const { plural } = nounsOf(labels);
  const { offers, can } = data;
  const bulk: OfferedAction[] = [];
  const withheld: string[] = [];
  if (can.edit && offers.tags) bulk.push({ intent: "add-tag", label: "Add tag" }, { intent: "remove-tag", label: "Remove tag" });
  if (can.edit && offers.duplicate) bulk.push({ intent: "duplicate", label: "Duplicate" });
  if (can.publish) bulk.push({ intent: "unpublish", label: "Unpublish" });
  if (can.deleteContent && offers.delete) bulk.push({ intent: "delete", label: "Delete", destructive: true });
  if (!can.edit) withheld.push(`You can read these ${plural}. Changing them needs an editor's role.`);
  else if (!offers.tags) withheld.push(`Tags are not offered: this site keeps no tags on its ${plural}.`);
  if (can.edit && !offers.duplicate) withheld.push(`Duplicate is not offered by this site.`);
  if (can.edit && !can.publish) withheld.push(`Unpublishing needs a publisher's role.`);
  if (can.deleteContent && !offers.delete) withheld.push(`Delete is not offered: this site cannot delete ${plural}.`);
  return { bulk, withheld };
}

export interface RowAction {
  label: string;
  value: string;
  href?: string;
  danger?: boolean;
  // Reschedule: the time it moves from, which the menu's time field starts at.
  publishAt?: string;
}

// The time a row's schedule goes out: its waiting update's on a live post, its own on a scheduled
// one. null when nothing is scheduled.
export function scheduledTime(row: Pick<PostRow, "status" | "publishAt" | "scheduledUpdate">): string | null {
  if (row.status === "published") return row.scheduledUpdate?.publishAt ?? null;
  return row.status === "scheduled" ? row.publishAt : null;
}

// One row's menu: Edit and View on the site go somewhere; the rest post an intent for this row.
// With scheduled updates (site-api v0.10.0) a scheduled post or a live post's waiting update can
// be moved (`reschedule`, with `publishAt`), and a live post's update canceled (`cancel-schedule`,
// one-way, so it is a danger item); a scheduled post is canceled by Unpublish, as before.
export function rowActions(row: PostRow, data: Pick<PostsData, "offers" | "can">): RowAction[] {
  const { offers, can } = data;
  const items: RowAction[] = [];
  if (can.edit) items.push({ label: "Edit", value: "edit", href: row.href });
  if (row.status === "published" && row.liveHref) items.push({ label: "View on the site", value: "view", href: row.liveHref });
  const at = scheduledTime(row);
  const update = row.status === "published" ? row.scheduledUpdate : undefined;
  const moves = can.publish && offers.scheduledUpdates === true;
  if (update) items.push({ label: "View the scheduled update", value: "view-update", href: update.href });
  // Reschedule… and Cancel the update act in place with script (a dialog, a confirmation);
  // with no script they go to the page that does it: the update's own, or the editor.
  if (moves && at) items.push({ label: "Reschedule…", value: "reschedule", href: update?.href ?? row.href, publishAt: at });
  if (can.publish && row.status !== "draft") items.push({ label: "Unpublish", value: "unpublish" });
  if (can.edit && offers.duplicate) items.push({ label: "Duplicate", value: "duplicate" });
  if (moves && update) items.push({ label: "Cancel the update", value: "cancel-schedule", href: update.href, danger: true });
  if (can.deleteContent && offers.delete) items.push({ label: "Delete", value: "delete", danger: true });
  return items;
}

// ---------------------------------------------------------------------------------------
// The reschedule time field.

const pad = (n: number) => String(n).padStart(2, "0");

// An ISO time as a datetime-local value in this browser's zone ("2030-01-01T16:00").
export function localInputValue(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// A datetime-local value, read in this browser's zone, as the UTC time the kit takes
// ("2030-01-01T15:00:00Z"). "" for an empty or impossible value.
export function isoFromLocal(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString().replace(/\.\d{3}Z$/, "Z") : "";
}

// ---------------------------------------------------------------------------------------
// The script path's helpers live with the shared types; still exported from here.
export { intentForm, outcomesOf } from "../content/content.ts";
