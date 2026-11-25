// The view data the shared content components take, what their forms get back, and the pure helpers
// that post an intent and read its outcomes. Names from the site-api contract keep their spelling.
import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import type { MediaRecord } from "../media/media.ts";
import type { Mention, ModState, ModView } from "../moderation-queue/moderation-queue.ts";
import { plural } from "@drdustinedwards/site-helpers/text";

// Shared by every list.

export type ContentStatus = "draft" | "scheduled" | "published";

// What this person may do, decided by the host. The kit refuses any other intent whatever the
// form says; the component only hides what is refused.
export interface ContentCan {
  edit: boolean;
  publish: boolean;
  deleteContent: boolean;
  deleteMedia: boolean;
  decideMentions: boolean;
}

// A word under a row's title that only the host knows. A tone draws it as a status pill.
export interface RowNote {
  text: string;
  tone?: "info" | "ok" | "warn" | "crit";
}

// What a one-way action asks before it runs; `typeToConfirm` is the word to type for what cannot be recovered.
export interface ConfirmSpec {
  title: string;
  lead?: string;
  action: string;
  typeToConfirm?: string;
  // The button that backs out, when "Cancel" would read as the action ("Keep the update").
  cancelLabel?: string;
}

// A host's own toolbar action, posted as `intent` and run by the host's handler.
export interface ExtraAction {
  intent: string;
  label: string;
}

// A host's own column, already rendered to text by the kit: one cell per row id.
export interface ExtraColumn {
  id: string;
  label: string;
  cells: Record<string, string>;
}

// One page of a list, by cursor. Without `total` the count says what is on the page.
export interface PageInfo {
  nextCursor: string | null;
  prevCursor?: string | null;
  total?: number;
  // True when the site cannot sort: the kit sorted this page only, and the list says so.
  sortedOnPage?: boolean;
}

// One place a file is used, as the site's reference check found it.
export interface MediaUse {
  type: string;
  id: string;
  title: string;
  detail: string;
}

// The fields a form posts; `ids` repeats.
export type IntentFields = Record<string, string | string[]>;

// One item's outcome of an intent that acted on several. A refusal for one never stops the others.
export interface IntentOutcome {
  id: string;
  ok: boolean;
  message?: string;
  // On a refused media delete: every place the file is used.
  usedBy?: MediaUse[];
  // The version the item's write made, for the next write to it.
  version?: string;
  // The new file's id, where the intent made one beside this item.
  copyId?: string;
  // True when an upload or import matched a file already stored, which is `id`.
  duplicate?: boolean;
}

// The kit's ask before a one-way intent, shown as a dialog (script) or a page (no script). Posting
// it again with `fields` performs it; the typed word is posted as `confirm`.
export interface ConfirmRequest extends ConfirmSpec {
  intent: string;
  // Every item it will change, one line each. Never shortened.
  items: string[];
  fields: IntentFields;
}

export interface IntentResult {
  ok: boolean;
  // One sentence for the message region: "Unpublished 2 posts."
  message: string;
  outcomes?: IntentOutcome[];
  // The inverse, versions included: posting it undoes this result. Absent where nothing can.
  undo?: { intent: string; fields: IntentFields };
  // The item changed since it was read: what the site holds now.
  conflict?: { id: string; currentVersion: string | null };
  // Asked before a one-way intent runs. Nothing has changed yet.
  confirm?: ConfirmRequest;
  // The `preview-link` answer: the address anyone can open, and when it stops. Given once; the site keeps only a hash.
  previewLink?: { url: string; expiresAt: string };
}

// The script path: a host's function that posts the form and resolves with the result. Without it
// the forms post and the page reloads with `result`.
export type SubmitIntent = (form: FormData) => Promise<IntentResult>;

// Words a host can change: the thing the list holds ("post") and its plural.
export interface ContentLabels {
  noun?: string;
  plural?: string;
}

// What a list calls its items: the site's words, else `fallback` ("post", "file") and its "s".
export function nounsOf(
  labels: ContentLabels = {},
  fallback: string,
): { noun: string; plural: string } {
  const noun = labels.noun ?? fallback;
  return { noun, plural: labels.plural ?? `${noun}s` };
}

// "24 files", or "Showing 48 of 210 files" when the page holds fewer than the total.
export function countText(
  shown: number,
  total: number | null | undefined,
  { noun, plural: many }: { noun: string; plural: string },
): string {
  return total != null && total > shown
    ? `Showing ${shown} of ${plural(total, noun, many)}`
    : plural(shown, noun, many);
}

// Posts.

export type PostSort = "updated" | "published" | "title";

export interface PostsQuery {
  q?: string;
  status?: ContentStatus;
  kind?: string;
  tag?: string;
  // Each is named in `offers.filters`: one credited name, and published dates from and to, both
  // days included, as a date field gives them.
  author?: string;
  from?: string;
  to?: string;
  sort?: PostSort;
  // "1" is the Trash (needs `offers.trash`).
  trashed?: "1";
  cursor?: string;
}

// The list filters a site applies itself; `published` is the pair of dates.
export type PostFilter = "kind" | "tag" | "author" | "published" | "trashed";

// What the site supports.
export interface PostOffers {
  delete: boolean;
  schedule: boolean;
  tags: boolean;
  duplicate: boolean;
  // The site keeps an update waiting on a live post, so Reschedule and Cancel work on it.
  scheduledUpdates?: boolean;
  // Each is absent or false where the site lacks it: a Trash (`trash` and `restore` intents); a
  // move to a new id whose old address redirects (`rename`); shareable preview links; the filters
  // the site applies; and the names an Author filter offers.
  trash?: boolean;
  rename?: boolean;
  previewLinks?: boolean;
  filters?: PostFilter[];
  authors?: string[];
}

// An update scheduled to replace a live post: when it goes live, and the page that shows it beside
// the live version.
export interface ScheduledUpdateSummary {
  publishAt: string;
  href: string;
}

export interface PostRow {
  id: string;
  title: string;
  kind: string;
  status: ContentStatus;
  // The public path once published; null while never published.
  path: string | null;
  href: string;
  // The live page, for "View on the site". Published posts only.
  liveHref: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  // A live post with an update waiting. Absent when nothing waits.
  scheduledUpdate?: ScheduledUpdateSummary;
  // Absent: the kit reads each post before writing.
  version?: string;
  tags?: string[];
  // Everyone credited, the primary first, and the excerpt, where the site keeps them.
  authors?: string[];
  excerpt?: string;
  // When the post went to the Trash; null or absent when it is not there.
  trashedAt?: string | null;
  notes?: RowNote[];
}

export interface PostsData {
  site: { name: string };
  query: PostsQuery;
  rows: PostRow[];
  page: PageInfo;
  // Across the whole site, not the page, for the status tabs (and the Trash tab, with `trash`).
  counts?: Partial<Record<ContentStatus | "all" | "trash", number>>;
  kinds: string[];
  offers: PostOffers;
  can: ContentCan;
  // "New post": the editor with a new id. Absent where the person may not write.
  newHref?: string;
  // Per-site additions, already rendered to data.
  extra?: { columns?: ExtraColumn[]; toolbar?: ExtraAction[] };
}

// The update waiting on one live post: its source beside the live one, a unified patch from one to
// the other, and the time in words.
export interface ScheduledUpdateView {
  id: string;
  title: string;
  publishAt: string;
  when: string;
  scheduledAt: string;
  source: string;
  live: { source: string; version: string; href: string | null };
  patch: string;
  editorHref: string;
  can: ContentCan;
}

// Media.

export interface MediaQuery {
  q?: string;
  tag?: string;
  view?: "library" | "trash";
  // Tiles or rows, and the tile size: from the address if a link sets them, else the viewer's last choice.
  layout?: "grid" | "list";
  size?: "s" | "m" | "l";
  // A lens: one the site names (`offers.lenses`) or a host's own (`extra.lenses`).
  lens?: string;
  // Each sort has its own default direction when `dir` is absent. `used` (needs `offers.usage`)
  // runs most used first.
  sort?: "added" | "name" | "size" | "used";
  dir?: "asc" | "desc";
  // Headings drawn from the rows on the page, so a group never spans a page.
  group?: "folder" | "month";
  cursor?: string;
  // The file the inspector is open on.
  inspect?: string;
  // Picker mode: the file chosen, waiting for its alt text.
  pick?: string;
  // The upload dialog is open; with no script the server renders it open in the page.
  upload?: boolean;
  // Need `offers.filters`.
  orientation?: "landscape" | "portrait" | "square";
  kind?: "image" | "document" | "video" | "audio";
  // Ask the site's model about the inspected file (needs `offers.suggestions`). Only when the person
  // asks: a model costs the site money.
  suggest?: boolean;
}

// What the site supports. `upload` holds the site's limits, checked before any byte is sent; null
// where it takes no uploads.
export interface MediaOffers {
  upload: { maxBytes: number; types: string[] } | null;
  alt: boolean;
  tags: boolean;
  trash: boolean;
  delete: boolean;
  // The lenses the site answers, a chip each. Absent or empty: none.
  lenses?: string[];
  // The site keeps a focal point and a caption, and replaces a file's bytes under its own address.
  focus?: boolean;
  caption?: boolean;
  replace?: boolean;
  // A replacement must be the size of the picture it replaces, so replace asks for that size and a
  // crop is saved only as a new file.
  replaceKeepsSize?: boolean;
  // Each is absent or false where the site lacks it: duplicate detection on upload; per-file usage
  // counts and the `used` sort; orientation and kind filters; `import`; credit and license
  // (`credit`); turns and mirrors (`transform`); earlier bytes and `revert` (`history`); polling for
  // others' changes (`live`); resizing on upload (`resize`) and a pass over stored pictures
  // (`resizePass`); metadata read at upload (`embedded`); and model suggestions.
  duplicates?: boolean;
  usage?: boolean;
  filters?: boolean;
  import?: boolean;
  credit?: boolean;
  transform?: boolean;
  history?: boolean;
  live?: boolean;
  resize?: { maxEdge: number; quality: number } | null;
  resizePass?: boolean;
  embedded?: boolean;
  suggestions?: boolean;
}

// One set of a file's bytes, earlier or current: `rev` is what a revert names as `to`.
export interface MediaRevision {
  rev: string;
  at: string;
  bytes: number;
  width: number | null;
  height: number | null;
  reason: "upload" | "import" | "replace" | "transform" | "resize" | "revert";
  current: boolean;
}

// What the site's model suggests for the inspected file: only what would change it.
export interface MediaSuggestions {
  tags: string[];
  alt: string | null;
  model: string;
}

export interface MediaData {
  site: { name: string };
  query: MediaQuery;
  // `used` is filled where the kit read it, `usedUnknown` where it did not (only the inspected file
  // has usedBy).
  rows: MediaRecord[];
  // `changeCursor` (with `offers.live`): where polling for others' changes starts.
  page: PageInfo & { changeCursor?: string };
  counts?: { library?: number; trash?: number };
  // The tags in use, with how many files carry each where known.
  tags: Array<{ tag: string; count?: number }>;
  offers: MediaOffers;
  can: ContentCan;
  inspected?: MediaRecord | null;
  // The inspected file's byte history, newest first, and the model's suggestions: absent when not
  // asked, null when the site could not answer.
  history?: MediaRevision[];
  suggestions?: MediaSuggestions | null;
  // Per-site additions, already rendered to data.
  extra?: {
    lenses?: Array<{ id: string; label: string; count?: number }>;
    toolbar?: ExtraAction[];
  };
}

// What the picker gives the host: the file and the alt text for this use ("" when decorative).
export interface PickedMedia {
  id: string;
  url: string;
  alt: string;
}

// Mentions.

export type MentionStatus = ModState;

// How many mentions are in each state across the whole site, not the page, with their sum.
export type MentionCounts = Record<MentionStatus | "all", number>;

export interface MentionsQuery {
  // The tab. With none, the list opens on Waiting, or on All when nothing waits.
  view?: ModView;
  cursor?: string;
  open?: string;
}

// What the site supports. Without `reset` (back to waiting) a decision on a waiting mention has no Undo.
export interface MentionOffers {
  reset: boolean;
  delete: boolean;
  sweep: boolean;
}

export interface MentionsData {
  site: { name: string };
  query: MentionsQuery;
  // Newest first.
  rows: Mention[];
  page: PageInfo;
  counts: MentionCounts;
  // What the next sweep removes, by the site's own retention.
  expiring: { failed: number; rejected: number };
  // The site's retention rules in words.
  retention?: string;
  offers: MentionOffers;
  can: ContentCan;
}

// The script path, pure.

// A list's address with a query, its keys in one fixed order and the empty ones left out, so the
// same view is always the same address. `base` is the route (any query on it is dropped).
export function queryHref<Q extends object>(
  base: string,
  q: Q,
  order: ReadonlyArray<keyof Q>,
): string {
  const params = new URLSearchParams();
  for (const k of order) {
    const v = q[k];
    if (typeof v === "string" && v) params.set(String(k), v);
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
}

// The form an undo or confirm request posts: a list value is one field per item.
export function intentForm(intent: string, fields: IntentFields = {}): FormData {
  const form = new FormData();
  form.set("intent", intent);
  for (const [k, v] of Object.entries(fields)) {
    if (k === "intent") continue;
    for (const one of typeof v === "string" ? [v] : v) form.append(k, one);
  }
  return form;
}

// A result's outcomes as the bulk bar lists them; a deleted item keeps the name it had when posted.
export function outcomesOf(
  result: Pick<IntentResult, "outcomes">,
  names: ReadonlyMap<string, string>,
): BulkOutcome[] {
  return (result.outcomes ?? []).map((o) => ({
    id: o.id,
    label: names.get(o.id) ?? o.id,
    ok: o.ok,
    message: o.message,
    usedBy: o.usedBy?.map((u) => (u.detail ? `${u.title} (${u.detail})` : u.title)),
  }));
}
