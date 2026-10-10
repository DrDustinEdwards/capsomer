// capsomer/content: the view data the shared content components take, what their forms get back,
// and the two pure helpers every one of them uses to post an intent and read its outcomes.
//
// The design (docs/design/design-content-components.md, sections 2.2 to 2.4) puts the server half,
// the "content kit", in site-api (job "site-api: the content kit and localClient", S1). That kit
// had not shipped when these were written, so they are defined here from the design and are to be
// reconciled with S1's own types when it does. Where a name came from the site-api contract
// (v0.5.0, src/contract.ts) it is kept: ContentStatus, MediaUse.
import type { BulkOutcome } from "../bulk-bar/bulk-bar.ts";
import type { MediaRecord } from "../media/media.ts";

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
  sort?: PostSort;
  cursor?: string;
}

// What the site supports, read from its capabilities by the kit.
export interface PostOffers {
  delete: boolean;
  schedule: boolean;
  tags: boolean;
  duplicate: boolean;
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
  // Present from site-api v0.6; the kit reads each post before writing otherwise.
  version?: string;
  tags?: string[];
  notes?: RowNote[];
}

export interface PostsData {
  site: { name: string };
  query: PostsQuery;
  rows: PostRow[];
  page: PageInfo;
  // Across the whole site, not the page, for the status tabs.
  counts?: Partial<Record<ContentStatus | "all", number>>;
  kinds: string[];
  offers: PostOffers;
  can: ContentCan;
  // "New post": the editor with a new id. Absent where the person may not write.
  newHref?: string;
  // Per-site additions, already rendered to data.
  extra?: { columns?: ExtraColumn[]; toolbar?: ExtraAction[] };
}

// ---------------------------------------------------------------------------------------
// Media.

export interface MediaQuery {
  q?: string;
  tag?: string;
  // The library, or the trash (with mediaTrash).
  view?: "library" | "trash";
  // Tiles or rows, kept in the address.
  layout?: "grid" | "list";
  // A host's lens (dustinedwards.info's unattached, duplicates): extensions until site-api v0.6.
  lens?: string;
  cursor?: string;
  // The file the inspector is open on: the kit reads it with where it is used.
  inspect?: string;
  // Picker mode: the file chosen, waiting for its alt text.
  pick?: string;
}

// What the site supports, read from its capabilities by the kit. `upload` is the site's own limits
// (capabilities.mediaUpload), checked before any byte is sent; null where it takes no uploads.
export interface MediaOffers {
  upload: { maxBytes: number; types: string[] } | null;
  alt: boolean;
  tags: boolean;
  trash: boolean;
  delete: boolean;
}

export interface MediaData {
  site: { name: string };
  query: MediaQuery;
  // One page of files, as the media component's records: `used` filled where the kit read it,
  // `usedUnknown` where it did not (a list has no usedBy; the inspected file does).
  rows: MediaRecord[];
  page: PageInfo;
  counts?: { library?: number; trash?: number };
  // The tags in use, for the chip row, with how many files carry each where the kit knows.
  tags: Array<{ tag: string; count?: number }>;
  offers: MediaOffers;
  can: ContentCan;
  // The file in the inspector (?inspect=), read with every place it is used.
  inspected?: MediaRecord | null;
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
// The script path, pure.

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
