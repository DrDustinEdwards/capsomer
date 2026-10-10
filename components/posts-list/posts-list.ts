// The posts list's pure helpers: the status of a post in words, the addresses of its filters,
// which actions a person is offered here and why the others are withheld, and the forms the
// script path posts. No DOM; the React component and a server render use the same functions.
import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import type { ContentLabels, ContentStatus, IntentFields, IntentResult, PostRow, PostsData, PostsQuery, PostSort } from "../content/content.ts";

const DAY = 86_400_000;

// ---------------------------------------------------------------------------------------
// Status.

export interface ContentStatusWords {
  // The status component's tone: Published is ok (a tick), Scheduled is a notice (a square),
  // Draft is no data yet (a dashed circle). Shape, word and colour together.
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

// The list's address with a query, its keys in one fixed order and the empty ones left out, so
// the same view is always the same address. `base` is the route (any query on it is dropped).
export function postsHref(base: string, q: PostsQuery): string {
  const params = new URLSearchParams();
  for (const k of QUERY_ORDER) {
    const v = q[k];
    if (v) params.set(k, v);
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
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

export type PostIntent = "add-tag" | "remove-tag" | "duplicate" | "unpublish" | "delete";

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
}

// One row's menu: Edit and View on the site go somewhere; the rest post an intent for this row.
export function rowActions(row: PostRow, data: Pick<PostsData, "offers" | "can">): RowAction[] {
  const { offers, can } = data;
  const items: RowAction[] = [];
  if (can.edit) items.push({ label: "Edit", value: "edit", href: row.href });
  if (row.status === "published" && row.liveHref) items.push({ label: "View on the site", value: "view", href: row.liveHref });
  if (can.publish && row.status !== "draft") items.push({ label: "Unpublish", value: "unpublish" });
  if (can.edit && offers.duplicate) items.push({ label: "Duplicate", value: "duplicate" });
  if (can.deleteContent && offers.delete) items.push({ label: "Delete", value: "delete", danger: true });
  return items;
}

// ---------------------------------------------------------------------------------------
// The script path.

// The form an IntentResult's undo, or a confirm request, posts: the intent and its fields, a list
// value as one field per item.
export function intentForm(intent: string, fields: IntentFields = {}): FormData {
  const form = new FormData();
  form.set("intent", intent);
  for (const [k, v] of Object.entries(fields)) {
    if (k === "intent") continue;
    for (const one of typeof v === "string" ? [v] : v) form.append(k, one);
  }
  return form;
}

// A result's outcomes as the bulk bar lists them, each named as the person knows it. A row that is
// gone (deleted) keeps the name it had when the form was posted.
export function outcomesOf(result: Pick<IntentResult, "outcomes">, names: ReadonlyMap<string, string>): BulkOutcome[] {
  return (result.outcomes ?? []).map((o) => ({
    id: o.id,
    label: names.get(o.id) ?? o.id,
    ok: o.ok,
    message: o.message,
    usedBy: o.usedBy?.map((u) => (u.detail ? `${u.title} (${u.detail})` : u.title)),
  }));
}
