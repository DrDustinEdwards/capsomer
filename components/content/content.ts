// capsomer/content: the view data the shared content components take, what their forms get back,
// and the two pure helpers every one of them uses to post an intent and read its outcomes.
//
// The design (docs/design/design-content-components.md, sections 2.2 to 2.4) puts the server half,
// the "content kit", in site-api (job "site-api: the content kit and localClient", S1). That kit
// had not shipped when these were written, so they are defined here from the design and are to be
// reconciled with S1's own types when it does. Where a name came from the site-api contract
// (v0.5.0, src/contract.ts) it is kept: ContentStatus, MediaUse, MentionStatus, MentionCounts.
import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import type { MediaRecord } from "../media/media.ts";
import type { Mention, ModState, ModView } from "../moderation-queue/moderation-queue.ts";

// ---------------------------------------------------------------------------------------
// Shared by every list.

// A post's state on its site. The contract's own words.
export type ContentStatus = "draft" | "scheduled" | "published";

// What this person may do here, decided by the host (Carrel's roles, or a site admin signed in
// through Access, who gets everything). The kit refuses an intent the person may not run, whatever
// the form says; the component only hides what is refused.
export interface ContentCan {
  edit: boolean;
  publish: boolean;
  deleteContent: boolean;
  deleteMedia: boolean;
  decideMentions: boolean;
}

// A word under a row's title that only the host knows: "2 AI drafts waiting", "New draft",
// "Held by a flag". A tone draws it as a status pill; without one it is a quiet pill.
export interface RowNote {
  text: string;
  tone?: "info" | "ok" | "warn" | "crit";
}

// What a one-way action asks before it runs: the confirm dialog's title, lead and button, and the
// word to type for what cannot be recovered.
export interface ConfirmSpec {
  title: string;
  lead?: string;
  action: string;
  typeToConfirm?: string;
  // The button that backs out, when "Cancel" would read as the action ("Keep the update").
  cancelLabel?: string;
}

// A host's own toolbar action (dustinedwards.info's Ask index maintenance), posted as `intent`
// and run by the host's own handler. Rendered in a fixed place with fixed markup.
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

// One page of a list, by cursor. `total` arrives with site-api v0.6; until then the count says
// what is on the page.
export interface PageInfo {
  nextCursor: string | null;
  prevCursor?: string | null;
  total?: number;
  // True while the site cannot sort (site-api v0.5): the kit sorted this page only, and the
  // list says so.
  sortedOnPage?: boolean;
}

// One place a file is used, as the site's reference check found it (site-api MediaUse).
export interface MediaUse {
  type: string;
  id: string;
  title: string;
  detail: string;
}

// The fields a form posts, as the kit reads them back: `ids` repeats.
export type IntentFields = Record<string, string | string[]>;

// One item's outcome of an intent that acted on several. A refusal for one never stops the others.
export interface IntentOutcome {
  id: string;
  ok: boolean;
  message?: string;
  // On a refused media delete: every place the file is used.
  usedBy?: MediaUse[];
  // The version the item's write made (site-api's Outcome.version), for the next write to it.
  version?: string;
  // The new file's id, where the intent made one beside this item (a quarter turn saved as a new
  // file, site-api v0.13.0 Outcome.copyId).
  copyId?: string;
  // True when an upload or import matched a file already stored, which is `id` (site-api v0.13.0).
  duplicate?: boolean;
}

// The kit asks before a one-way intent: the component shows this as the confirm dialog (with
// script) or the confirm page (without), and posting it again with `fields` performs it. The
// typed word, when asked, is posted as `confirm`.
export interface ConfirmRequest extends ConfirmSpec {
  intent: string;
  // Every item it will change, one line each. Never shortened.
  items: string[];
  fields: IntentFields;
}

// What a posted intent gives back, for the message region, the bulk bar's outcome list and Undo.
export interface IntentResult {
  ok: boolean;
  // One sentence for the message region: "Unpublished 2 posts."
  message: string;
  outcomes?: IntentOutcome[];
  // The inverse, versions included: posting it undoes this result. Absent where nothing can
  // undo it (a first decision on a waiting mention before site-api v0.6, a duplicate on a site
  // with no delete).
  undo?: { intent: string; fields: IntentFields };
  // The item changed since it was read: what the site holds now.
  conflict?: { id: string; currentVersion: string | null };
  // Asked before a one-way intent runs. Nothing has changed yet.
  confirm?: ConfirmRequest;
  // The posts list's `preview-link` (site-api v0.17.0 PreviewLink): the page anyone with the
  // address can open, and when it stops working. The site answers it once and keeps only a hash.
  previewLink?: { url: string; expiresAt: string };
}

// The script path: a host passes a function that posts the form and resolves with the action's
// result (in React Router, a useFetcher wrapper). Without it the forms post and the page reloads
// with `result`.
export type SubmitIntent = (form: FormData) => Promise<IntentResult>;

// Words a host needs to change: the thing the list holds ("post", "article") and its plural.
export interface ContentLabels {
  noun?: string;
  plural?: string;
}

// ---------------------------------------------------------------------------------------
// Posts.

export type PostSort = "updated" | "published" | "title";

export interface PostsQuery {
  q?: string;
  status?: ContentStatus;
  kind?: string;
  tag?: string;
  // site-api v0.17.0, each with its name in `offers.filters`: one credited name, and the published
  // dates from and to, both days included, as a date field gives them ("2026-10-01").
  author?: string;
  from?: string;
  to?: string;
  sort?: PostSort;
  // "1": the Trash (site-api v0.17.0 `trashed=true`, with `offers.trash`).
  trashed?: "1";
  cursor?: string;
}

// The list filters a site applies itself (site-api v0.17.0 CONTENT_FILTERS, from
// `capabilities.contentFilters`); `published` is the pair of dates.
export type PostFilter = "kind" | "tag" | "author" | "published" | "trashed";

// What the site supports, read from its capabilities by the kit.
export interface PostOffers {
  delete: boolean;
  schedule: boolean;
  tags: boolean;
  duplicate: boolean;
  // The site keeps an update waiting on a live post (site-api v0.10.0), so Reschedule and Cancel
  // work on it.
  scheduledUpdates?: boolean;
  // site-api v0.17.0, each absent or false where the site lacks it: a Trash that posts go to and
  // come back from (`contentTrash`, the `trash` and `restore` intents); a move to a new id whose old
  // address redirects (`contentRename`, `rename`); shareable preview links (`previewLinks`,
  // `preview-link`); the filters the site applies (`contentFilters`); and the names an Author
  // filter offers, the primary ones the site credits.
  trash?: boolean;
  rename?: boolean;
  previewLinks?: boolean;
  filters?: PostFilter[];
  authors?: string[];
}

// An update scheduled to replace a live post (site-api v0.10.0): when it goes live, and the page
// that shows it beside the live version (the host's, else the editor).
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
  // Where the title links: Carrel's editor, or the site's own.
  href: string;
  // The live page, for "View on the site". Published posts only.
  liveHref: string | null;
  publishAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  // A live post with an update waiting. Absent when nothing waits.
  scheduledUpdate?: ScheduledUpdateSummary;
  // Present from site-api v0.6; the kit reads each post before writing otherwise.
  version?: string;
  tags?: string[];
  // site-api v0.17.0, where the site keeps the post fields: everyone credited, the primary first,
  // and the excerpt.
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

// The update waiting on one live post, for the page that shows it (site-api's loadScheduledUpdate,
// v0.10.0): its source beside the live one, a unified patch from one to the other, and the time
// in words ("2030-01-01 15:00 UTC").
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

// ---------------------------------------------------------------------------------------
// Media.

export interface MediaQuery {
  q?: string;
  tag?: string;
  // The library, or the trash (with mediaTrash).
  view?: "library" | "trash";
  // Tiles or rows, and the tile size: in the address when a link sets them, otherwise the viewer's
  // last choice, remembered in this browser (MediaLibrary).
  layout?: "grid" | "list";
  size?: "s" | "m" | "l";
  // A lens: one the site names (site-api v0.6.0 MediaLens: unattached, no-alt, large, through
  // `offers.lenses`) or a host's own (`extra.lenses`).
  lens?: string;
  // The site-api contract's sorts (v0.6.0 MEDIA_SORTS) and direction, as the kit reads them. Each sort
  // has its own direction (newest, A to Z, largest first) when `dir` is absent. `used` (site-api
  // v0.13.0, with `offers.usage`) runs most used first.
  sort?: "added" | "name" | "size" | "used";
  dir?: "asc" | "desc";
  // Headings over the page's files: by the folder in each file's id, or by the month it was uploaded.
  // Drawn by the component from the rows it has, so a group never spans a page.
  group?: "folder" | "month";
  cursor?: string;
  // The file the inspector is open on: the kit reads it with where it is used.
  inspect?: string;
  // Picker mode: the file chosen, waiting for its alt text.
  pick?: string;
  // site-api v0.13.0, with `offers.filters`: which way a picture lies, and what a file is.
  orientation?: "landscape" | "portrait" | "square";
  kind?: "image" | "document" | "video" | "audio";
  // site-api v0.13.0, with `offers.suggestions`: ask the site's model about the inspected file
  // (`suggest=1` in the address). Only when the person asks: a model costs the site money.
  suggest?: boolean;
}

// What the site supports, read from its capabilities by the kit. `upload` is the site's own limits
// (capabilities.mediaUpload), checked before any byte is sent; null where it takes no uploads.
export interface MediaOffers {
  upload: { maxBytes: number; types: string[] } | null;
  alt: boolean;
  tags: boolean;
  trash: boolean;
  delete: boolean;
  // The lenses the site answers (site-api v0.6.0 `capabilities.mediaLenses`, the kit's
  // `offers.lenses`): a chip each, with the contract's meaning in words. Absent or empty: none.
  lenses?: string[];
  // site-api v0.10.0, the kit's offers of the same names: the site keeps a focal point and a caption,
  // and replaces a file's bytes under its own address. Absent: not offered.
  focus?: boolean;
  caption?: boolean;
  replace?: boolean;
  // site-api v0.11.0 (`capabilities.mediaReplaceKeepsSize`): a replacement must be the size of the
  // picture it replaces, so replace asks for that size and a crop is saved only as a new file.
  replaceKeepsSize?: boolean;
  // site-api v0.13.0, the kit's offers of the same names, each absent or false where the site lacks
  // it: an upload of bytes the site holds answers that file (and the inspected file names its twins);
  // rows carry how many places use them and the list sorts by `used`; the orientation and kind
  // filters; the `import` intent; credit, license, source and license end (the `credit` intent);
  // turns and mirrors (`transform`); the file's earlier bytes and `revert`; polling for what others
  // changed (`changes`); what uploads shrink to (`resize`) and a pass over stored pictures
  // (`resizePass`, the `resize` intent); metadata read from the file at upload (`embedded`); and the
  // site's model's suggestions (`suggest`).
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

// One set of a file's bytes, earlier or current (site-api v0.13.0 MediaRevision): `rev` is what a
// revert names as `to`.
export interface MediaRevision {
  rev: string;
  at: string;
  bytes: number;
  width: number | null;
  height: number | null;
  reason: "upload" | "import" | "replace" | "transform" | "resize" | "revert";
  current: boolean;
}

// What the site's model suggests for the inspected file (site-api v0.13.0 MediaSuggestionView): only
// what would change it, each for the person to accept or leave.
export interface MediaSuggestions {
  tags: string[];
  alt: string | null;
  model: string;
}

export interface MediaData {
  site: { name: string };
  query: MediaQuery;
  // One page of files, as the media component's records: `used` filled where the kit read it,
  // `usedUnknown` where it did not (a list has no usedBy; the inspected file does).
  rows: MediaRecord[];
  // `changeCursor` (site-api v0.13.0, with `offers.live`): where polling for others' changes starts.
  page: PageInfo & { changeCursor?: string };
  counts?: { library?: number; trash?: number };
  // The tags in use, for the chip row, with how many files carry each where the kit knows.
  tags: Array<{ tag: string; count?: number }>;
  offers: MediaOffers;
  can: ContentCan;
  // The file in the inspector (?inspect=), read with every place it is used.
  inspected?: MediaRecord | null;
  // The inspected file's byte history, newest first (with `offers.history`), and the model's
  // suggestions for it: absent when not asked (no `suggest`), null when the site could not answer.
  history?: MediaRevision[];
  suggestions?: MediaSuggestions | null;
  // Per-site additions, already rendered to data: lenses (dustinedwards.info's unattached,
  // duplicates, no alt), and toolbar actions.
  extra?: { lenses?: Array<{ id: string; label: string; count?: number }>; toolbar?: ExtraAction[] };
}

// What the picker gives the host: the file and the alt text the person wrote for this use ("" when
// they said it is decorative).
export interface PickedMedia {
  id: string;
  url: string;
  alt: string;
}

// ---------------------------------------------------------------------------------------
// Mentions.

// A mention's state, the contract's own words (site-api MentionStatus).
export type MentionStatus = ModState;

// How many mentions are in each state across the whole site, not the page (site-api
// MentionCounts), with their sum.
export type MentionCounts = Record<MentionStatus | "all", number>;

export interface MentionsQuery {
  // The tab. With none, the list opens on Waiting, or on All when nothing waits.
  view?: ModView;
  cursor?: string;
  // The mention opened in place (its whole excerpt, its source, the exact times).
  open?: string;
}

// What the site supports, read from its capabilities by the kit. `reset` is site-api v0.6's
// decision "reset" (back to waiting): without it a decision on a waiting mention has no Undo.
export interface MentionOffers {
  reset: boolean;
  delete: boolean;
  sweep: boolean;
}

export interface MentionsData {
  site: { name: string };
  query: MentionsQuery;
  // One page of mentions, newest first, each as the moderation queue's Mention.
  rows: Mention[];
  page: PageInfo;
  counts: MentionCounts;
  // What the next sweep removes, by the site's own retention (site-api MentionList.expiring).
  expiring: { failed: number; rejected: number };
  // The site's retention in words, from its rules: "A mention whose source was not found is
  // removed after 30 days, a rejected one after 90."
  retention?: string;
  offers: MentionOffers;
  can: ContentCan;
}

// ---------------------------------------------------------------------------------------
// The script path, pure.

// The form an IntentResult's undo, or a confirm request, posts: the intent and its fields, a list
// value as one field per item.
// A list's address with a query, its keys in one fixed order and the empty ones left out, so the
// same view is always the same address. `base` is the route (any query on it is dropped).
export function queryHref<Q extends object>(base: string, q: Q, order: ReadonlyArray<keyof Q>): string {
  const params = new URLSearchParams();
  for (const k of order) {
    const v = q[k];
    if (typeof v === "string" && v) params.set(String(k), v);
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
}

export function intentForm(intent: string, fields: IntentFields = {}): FormData {
  const form = new FormData();
  form.set("intent", intent);
  for (const [k, v] of Object.entries(fields)) {
    if (k === "intent") continue;
    for (const one of typeof v === "string" ? [v] : v) form.append(k, one);
  }
  return form;
}

// A result's outcomes as the bulk bar lists them, each named as the person knows it. An item that
// is gone (deleted) keeps the name it had when the form was posted.
export function outcomesOf(result: Pick<IntentResult, "outcomes">, names: ReadonlyMap<string, string>): BulkOutcome[] {
  return (result.outcomes ?? []).map((o) => ({
    id: o.id,
    label: names.get(o.id) ?? o.id,
    ok: o.ok,
    message: o.message,
    usedBy: o.usedBy?.map((u) => (u.detail ? `${u.title} (${u.detail})` : u.title)),
  }));
}
