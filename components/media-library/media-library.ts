// The media library's pure helpers: the addresses of its views and filters, which actions a person
// is offered here and why the others are withheld, the count, the empty state, the upload rules in
// words, and which files the picker offers. No DOM; the React component and a server render use the
// same functions.
import type { ContentLabels, MediaData, MediaOffers, MediaQuery } from "../content/content.ts";
import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.ts";
import type { MediaRecord } from "../media/media.ts";

export function nounsOf(labels: ContentLabels = {}): { noun: string; plural: string } {
  const noun = labels.noun ?? "file";
  return { noun, plural: labels.plural ?? `${noun}s` };
}

// ---------------------------------------------------------------------------------------
// Addresses.

const QUERY_ORDER: ReadonlyArray<keyof MediaQuery> = ["q", "tag", "view", "layout", "size", "lens", "sort", "dir", "group", "cursor", "inspect", "pick"];

export type MediaSort = NonNullable<MediaQuery["sort"]>;

// The way each of the contract's sorts runs when no direction is given (site-api v0.6.0): newest
// first, A to Z, largest first.
export const SORT_DIR: Record<MediaSort, "asc" | "desc"> = { added: "desc", name: "asc", size: "desc" };

// The direction a query sorts in: its own, or its sort's.
export function dirOf(q: Pick<MediaQuery, "sort" | "dir">): "asc" | "desc" {
  return q.dir ?? SORT_DIR[q.sort ?? "added"];
}

// The library's address with a query, its keys in one fixed order and the empty or default ones
// left out, so the same view is always the same address. `base` is the route.
export function mediaHref(base: string, q: MediaQuery): string {
  const params = new URLSearchParams();
  for (const k of QUERY_ORDER) {
    const v = q[k];
    if (!v || (k === "view" && v === "library") || (k === "layout" && v === "grid") || (k === "size" && v === "m") || (k === "sort" && v === "added")) continue;
    if (k === "dir" && v === SORT_DIR[q.sort ?? "added"]) continue;
    params.set(k, v);
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
}

// The keys that only change how the page is drawn, not which files it holds.
const DISPLAY: ReadonlyArray<keyof MediaQuery> = ["layout", "size", "group"];

// A filter, sort or view change starts again at the first page, with the inspector and the pick
// closed; opening a file (`inspect`, `pick`) and a display change (layout, size, grouping) keep the
// page it is on and the open file. A new sort starts in its own direction unless `dir` is given.
export function withMedia(q: MediaQuery, change: Partial<MediaQuery>): MediaQuery {
  const next: MediaQuery = { ...q, ...change };
  if ("sort" in change && !("dir" in change)) delete next.dir;
  const keys = Object.keys(change) as Array<keyof MediaQuery>;
  const keeps = "inspect" in change || "pick" in change || (keys.length > 0 && keys.every((k) => DISPLAY.includes(k)));
  if (!keeps) {
    delete next.cursor;
    delete next.inspect;
    delete next.pick;
  }
  for (const k of Object.keys(change) as Array<keyof MediaQuery>) if (change[k] === undefined) delete next[k];
  return next;
}

// ---------------------------------------------------------------------------------------
// What is offered.

export type MediaIntent = "add-tags" | "remove-tags" | "trash" | "restore" | "delete";

export interface OfferedAction {
  intent: MediaIntent;
  label: string;
  destructive?: boolean;
}

// The bulk actions this person may run on this view of this site, in the bar's order, and a
// sentence for each one held back. Delete is for good: from Trash where the site has one, from
// the library only where it has none.
export function mediaActions(data: Pick<MediaData, "offers" | "can" | "query">, labels?: ContentLabels): { bulk: OfferedAction[]; withheld: string[] } {
  const { plural } = nounsOf(labels);
  const { offers, can } = data;
  const trash = data.query.view === "trash";
  const bulk: OfferedAction[] = [];
  const withheld: string[] = [];
  if (trash) {
    if (can.deleteMedia && offers.trash) bulk.push({ intent: "restore", label: "Restore" });
    if (can.deleteMedia && offers.delete) bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
  } else {
    if (can.edit && offers.tags) bulk.push({ intent: "add-tags", label: "Add tag" }, { intent: "remove-tags", label: "Remove tag" });
    if (can.deleteMedia && offers.trash) bulk.push({ intent: "trash", label: "Move to Trash" });
    else if (can.deleteMedia && offers.delete) bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
  }
  if (!can.edit) withheld.push(`You can look at these ${plural}. Changing them needs an editor's role.`);
  else {
    if (!offers.upload && !trash) withheld.push("Uploads are not offered by this site.");
    if (!offers.alt) withheld.push("Alt text is set at upload here: this site cannot change it afterwards.");
    if (!offers.tags && !trash) withheld.push(`Tags are not offered: this site keeps no tags on its ${plural}.`);
  }
  if (can.deleteMedia && !offers.delete && (trash || !offers.trash)) withheld.push(`Delete is not offered: this site cannot delete ${plural}.`);
  return { bulk, withheld };
}

// What a file's inspector may do here.
export function inspectorOffers(data: Pick<MediaData, "offers" | "can">): { alt: boolean; tags: boolean; trash: boolean; delete: boolean } {
  const { offers, can } = data;
  return { alt: can.edit && offers.alt, tags: can.edit && offers.tags, trash: can.deleteMedia && offers.trash, delete: can.deleteMedia && offers.delete };
}

// ---------------------------------------------------------------------------------------
// Words.

// "24 files", "Showing 48 of 210 files", "3 files in Trash".
export function countLine(data: Pick<MediaData, "rows" | "page" | "query">, labels?: ContentLabels): string {
  const { noun, plural } = nounsOf(labels);
  const n = data.rows.length;
  const total = data.page.total;
  const word = (k: number) => (k === 1 ? noun : plural);
  const base = total != null && total > n ? `Showing ${n} of ${total} ${word(total)}` : `${n} ${word(n)}`;
  return data.query.view === "trash" ? `${base} in Trash` : base;
}

export function filtered(q: MediaQuery): boolean {
  return !!(q.q || q.tag || q.lens);
}

// The empty state's title and line, naming what is not there.
export function emptyWords(q: MediaQuery, labels?: ContentLabels): { kind: "nothing-yet" | "no-match" | "all-clear"; title: string; text: string } {
  const { noun, plural } = nounsOf(labels);
  if (filtered(q)) {
    const what = [q.q ? `“${q.q}”` : null, q.tag ? `tag ${q.tag}` : null, q.lens ? `the ${q.lens} lens` : null].filter(Boolean).join(", ");
    return { kind: "no-match", title: `No ${plural} match ${what}`, text: "Clear the filters to see every one." };
  }
  if (q.view === "trash") return { kind: "all-clear", title: "Trash is empty", text: `A ${noun} moved to Trash waits here until it is restored or deleted for good.` };
  return { kind: "nothing-yet", title: `No ${plural} yet`, text: `Upload the first ${noun} and it shows here.` };
}

// The site's upload rules in words, for the drop zone's hint: "PNG, JPEG and WebP, up to 5 MB".
// The picker takes images only; null when the site takes none.
export function uploadRules(limits: NonNullable<MediaOffers["upload"]>, imagesOnly = false): { accept: string; hint: string } | null {
  const types = imagesOnly ? limits.types.filter((t) => t.startsWith("image/")) : limits.types;
  if (types.length === 0) return null;
  const accept = types.join(",");
  return { accept, hint: `${acceptLabel(accept)}, up to ${formatBytes(limits.maxBytes)}.` };
}

// The picker's files: images that are in the library and uploaded, nothing in Trash or on its
// way.
export function pickable(rows: readonly MediaRecord[]): MediaRecord[] {
  return rows.filter((r) => r.kind === "image" && r.state === "ready");
}

// ---------------------------------------------------------------------------------------
// The view: lenses, groups, and what the address says about how to draw the page.

// The site-api contract's lenses (v0.6.0 MEDIA_LENSES), in words: what each chip shows.
export const LENS_WORDS: Record<string, { label: string; hint: string }> = {
  unattached: { label: "Unattached", hint: "The site's own check finds nothing that uses these. A file placed by a page template is unattached by this measure and still live, so look before deleting." },
  "no-alt": { label: "No alt text", hint: "Images with no alt text written yet." },
  large: { label: "Over 1 MB", hint: "Files larger than one mebibyte." },
};

// The lens chips: the contract's lenses the site names, then a host's own, each once.
export function lensChips(data: Pick<MediaData, "offers" | "extra">): Array<{ id: string; label: string; hint?: string; count?: number }> {
  const out: Array<{ id: string; label: string; hint?: string; count?: number }> = [];
  for (const id of data.offers.lenses ?? []) {
    const words = LENS_WORDS[id];
    const counted = data.extra?.lenses?.find((l) => l.id === id)?.count;
    if (words) out.push({ id, ...words, ...(counted != null ? { count: counted } : {}) });
  }
  for (const l of data.extra?.lenses ?? []) if (!out.some((o) => o.id === l.id)) out.push(l);
  return out;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// The folder a file's id puts it in: everything before its last "/", or "Top level".
export function folderOf(key: string): string {
  const at = key.lastIndexOf("/");
  return at > 0 ? key.slice(0, at) : "Top level";
}

// The month a file was uploaded, in UTC, so a heading does not move with the reader's time zone.
export function monthOf(uploaded: string | undefined): string {
  const at = uploaded ? Date.parse(uploaded) : Number.NaN;
  if (Number.isNaN(at)) return "No upload date";
  const d = new Date(at);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// The page's files under headings, each group in the order its first file came, so the sort still
// reads down the page. Page-local on purpose: a group never spans a page, and its count is this page's.
export function groupRows(rows: readonly MediaRecord[], group: MediaQuery["group"]): Array<{ label: string; items: MediaRecord[] }> | null {
  if (group !== "folder" && group !== "month") return null;
  const groups = new Map<string, MediaRecord[]>();
  for (const r of rows) {
    const label = group === "folder" ? folderOf(r.key) : monthOf(r.uploaded);
    const list = groups.get(label);
    if (list) list.push(r);
    else groups.set(label, [r]);
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}

// What the address says about drawing the page, which the content kit's readMediaQuery leaves to the
// component: the layout, the tile size and the grouping. A host merges it into the kit's query.
export function readMediaView(search: URLSearchParams): Pick<MediaQuery, "layout" | "size" | "group"> {
  const layout = search.get("layout");
  const size = search.get("size");
  const group = search.get("group");
  return {
    ...(layout === "grid" || layout === "list" ? { layout } : {}),
    ...(size === "s" || size === "m" || size === "l" ? { size } : {}),
    ...(group === "folder" || group === "month" ? { group } : {}),
  };
}
