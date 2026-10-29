// The media library's pure helpers: the addresses of its views and filters, which actions a person
// is offered here and why the others are withheld, the count, the empty state, the upload rules in
// words, and which files the picker offers. No DOM; the React component and a server render use the
// same functions.
import type { ContentLabels, IntentResult, MediaData, MediaOffers, MediaQuery, MediaRevision, MediaSuggestions, MediaUse } from "../content/content.ts";
import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.ts";
import { altStateOf, type MediaRecord, type UsedIn } from "../media/media-record.ts";

export function nounsOf(labels: ContentLabels = {}): { noun: string; plural: string } {
  const noun = labels.noun ?? "file";
  return { noun, plural: labels.plural ?? `${noun}s` };
}

// ---------------------------------------------------------------------------------------
// Addresses.

const QUERY_ORDER: ReadonlyArray<keyof MediaQuery> = ["q", "tag", "kind", "orientation", "view", "layout", "size", "lens", "sort", "dir", "group", "cursor", "inspect", "suggest", "pick"];

export type MediaSort = NonNullable<MediaQuery["sort"]>;

// The way each of the contract's sorts runs when no direction is given (site-api v0.6.0): newest
// first, A to Z, largest first, and (v0.13.0) most used first.
export const SORT_DIR: Record<MediaSort, "asc" | "desc"> = { added: "desc", name: "asc", size: "desc", used: "desc" };

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
    params.set(k, v === true ? "1" : String(v));
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
}

// The keys that only change how the page is drawn, not which files it holds.
const DISPLAY: ReadonlyArray<keyof MediaQuery> = ["layout", "size", "group"];

// A filter, sort or view change starts again at the first page, with the inspector and the pick
// closed; opening a file (`inspect`, `pick`) and a display change (layout, size, grouping) keep the
// page it is on and the open file. A new sort starts in its own direction unless `dir` is given. The
// model's suggestions are for one file: anything but asking for them again leaves them behind.
export function withMedia(q: MediaQuery, change: Partial<MediaQuery>): MediaQuery {
  const next: MediaQuery = { ...q, ...change };
  if ("sort" in change && !("dir" in change)) delete next.dir;
  if (!("suggest" in change)) delete next.suggest;
  const keys = Object.keys(change) as Array<keyof MediaQuery>;
  const keeps = "inspect" in change || "pick" in change || "suggest" in change || (keys.length > 0 && keys.every((k) => DISPLAY.includes(k)));
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

// The content kit's names (site-api runMediaIntent), so a host passes the form straight on.
export type MediaIntent = "tag-add" | "tag-remove" | "trash" | "restore" | "delete";

export interface OfferedAction {
  intent: MediaIntent;
  label: string;
  destructive?: boolean;
}

// The bulk actions this person may run on this view of this site, in the bar's order, and a
// sentence for each one held back. Trash and Restore are an editor's (reversible, as the kit says);
// Delete is for good and the delete role's: from Trash where the site has one, from
// the library only where it has none.
export function mediaActions(data: Pick<MediaData, "offers" | "can" | "query">, labels?: ContentLabels): { bulk: OfferedAction[]; withheld: string[] } {
  const { plural } = nounsOf(labels);
  const { offers, can } = data;
  const trash = data.query.view === "trash";
  const bulk: OfferedAction[] = [];
  const withheld: string[] = [];
  if (trash) {
    if (can.edit && offers.trash) bulk.push({ intent: "restore", label: "Restore" });
    if (can.deleteMedia && offers.delete) bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
  } else {
    if (can.edit && offers.tags) bulk.push({ intent: "tag-add", label: "Add tag" }, { intent: "tag-remove", label: "Remove tag" });
    if (can.edit && offers.trash) bulk.push({ intent: "trash", label: "Move to Trash" });
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

// What a file's inspector may do here. Replacing a file's bytes changes every page that shows it and
// cannot be undone here, so it needs the delete role, as the content kit says.
// A turn, a revert and a shrink change every page that uses the file too (site-api v0.13.0), so they
// need the delete role as well; credit and the model's suggestions are an editor's.
export function inspectorOffers(data: Pick<MediaData, "offers" | "can">): {
  alt: boolean;
  tags: boolean;
  trash: boolean;
  delete: boolean;
  focus: boolean;
  caption: boolean;
  replace: boolean;
  credit: boolean;
  transform: boolean;
  revert: boolean;
  resize: number | null;
  suggest: boolean;
  embedded: boolean;
  twins: boolean;
} {
  const { offers, can } = data;
  return {
    credit: can.edit && !!offers.credit,
    transform: can.deleteMedia && !!offers.transform,
    revert: can.deleteMedia && !!offers.history,
    resize: can.deleteMedia && offers.resizePass && offers.resize ? offers.resize.maxEdge : null,
    suggest: can.edit && !!offers.suggestions && (offers.alt || offers.tags),
    embedded: !!offers.embedded,
    twins: !!offers.duplicates,
    alt: can.edit && offers.alt,
    tags: can.edit && offers.tags,
    trash: can.edit && offers.trash,
    delete: can.deleteMedia && offers.delete,
    focus: can.edit && !!offers.focus,
    caption: can.edit && !!offers.caption,
    replace: can.deleteMedia && !!offers.replace && !!offers.upload,
  };
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
  return !!(q.q || q.tag || q.lens || q.kind || q.orientation);
}

// The empty state's title and line, naming what is not there.
export function emptyWords(q: MediaQuery, labels?: ContentLabels): { kind: "nothing-yet" | "no-match" | "all-clear"; title: string; text: string } {
  const { noun, plural } = nounsOf(labels);
  if (filtered(q)) {
    const what = [q.q ? `“${q.q}”` : null, q.tag ? `tag ${q.tag}` : null, q.kind ? KIND_WORDS[q.kind].toLowerCase() : null, q.orientation ? ORIENTATION_WORDS[q.orientation].toLowerCase() : null, q.lens ? `the ${q.lens} lens` : null].filter(Boolean).join(", ");
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
  duplicates: { label: "Duplicates", hint: "Files whose bytes are exactly another file's, by content hash, never by how a picture looks. Open one to see its twins." },
  "license-expired": { label: "License ended", hint: "Files whose license end date has passed (in UTC). Renew the license, or replace the file where pages use it." },
  oversized: { label: "Oversized", hint: "Pictures with an edge longer than this site keeps at upload. Shrink them to the site's size, one by one or all on this page." },
};

// The filters (site-api v0.13.0 MEDIA_KINDS and MEDIA_ORIENTATIONS), in words, in the toolbar's order.
export const KIND_WORDS: Record<NonNullable<MediaQuery["kind"]>, string> = { image: "Images", document: "Documents", video: "Video", audio: "Audio" };
export const ORIENTATION_WORDS: Record<NonNullable<MediaQuery["orientation"]>, string> = { landscape: "Landscape", portrait: "Portrait", square: "Square" };

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

// ---------------------------------------------------------------------------------------
// The content kit's page, as the library's data.

// One file as the site-api contract gives it (MediaItem, with the kit's absolute `src`), typed here by
// shape so Capsomer needs no site-api import. The v0.13.0 fields are each on a site that keeps them.
export interface KitMediaRow {
  id: string;
  url: string;
  src: string;
  filename: string | null;
  contentType: string;
  bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  uploadedAt: string | null;
  version?: string;
  tags?: string[];
  trashedAt?: string | null;
  focus?: string | null;
  caption?: string;
  usedCount?: number;
  credit?: string;
  license?: string;
  sourceUrl?: string | null;
  licenseExpires?: string | null;
  takenAt?: string | null;
}

// The content kit's loadMedia answer (site-api v0.13.0 MediaData), by shape.
export interface KitMediaData {
  site: { name: string };
  query: Omit<MediaQuery, "layout" | "size" | "group" | "pick">;
  rows: KitMediaRow[];
  page: MediaData["page"];
  detail?: (KitMediaRow & { usedBy: MediaUse[]; twins?: Array<{ id: string; filename: string | null }>; history?: MediaRevision[]; suggestions?: MediaSuggestions | null }) | null;
  offers: MediaOffers & { media?: boolean };
  can: MediaData["can"];
}

// The content kit's loadMediaChanges answer (site-api v0.13.0 MediaChangesData), by shape: the files
// another person changed since the cursor, each as it is now (Trash included), the ids deleted for
// good, where the next poll starts, and whether more wait. `{ reload: true }`: load the page again.
export interface KitMediaChanges {
  rows: KitMediaRow[];
  removed: string[];
  changeCursor: string;
  more: boolean;
}

// A kit row as the media component's record: `url` is the site's own address for it (what Markdown and the
// copy snippets carry), `thumb` the absolute one a browser loads. A list has no usedBy, so its tiles
// carry no Unattached flag unless the site counts uses (`usedCount`, site-api v0.13.0).
export function recordOfKit(row: KitMediaRow, used?: UsedIn[]): MediaRecord {
  return {
    key: row.id,
    name: row.filename ?? row.id,
    url: row.url,
    thumb: row.src,
    kind: row.contentType.startsWith("image/") ? "image" : "document",
    type: row.contentType,
    bytes: row.bytes,
    ...(row.width != null ? { width: row.width } : {}),
    ...(row.height != null ? { height: row.height } : {}),
    ...(row.uploadedAt ? { uploaded: row.uploadedAt } : {}),
    alt: row.alt,
    altState: altStateOf(row.alt, false),
    title: "",
    caption: row.caption ?? "",
    tags: row.tags ?? [],
    used: used ?? [],
    state: row.trashedAt ? "binned" : "ready",
    ...(row.version ? { version: row.version } : {}),
    ...(used ? {} : { usedUnknown: true }),
    focus: row.focus ?? null,
    ...(row.usedCount != null ? { usedCount: row.usedCount } : {}),
    ...(row.credit !== undefined ? { credit: row.credit } : {}),
    ...(row.license !== undefined ? { license: row.license } : {}),
    ...(row.sourceUrl !== undefined ? { sourceUrl: row.sourceUrl } : {}),
    ...(row.licenseExpires !== undefined ? { licenseExpires: row.licenseExpires } : {}),
    ...(row.takenAt !== undefined ? { takenAt: row.takenAt } : {}),
  };
}

// The kit's page as MediaLibrary's data, so every host maps it the same way. `usedHref` is where a
// place that uses the file links (the host's editor); the page's tags, with their counts on this page,
// make the chip row, and the chosen tag stays in it even when no file here carries it. `view` is the
// drawing the address asks for (readMediaView) and `pick` the picker's chosen file. The inspected
// file brings its twins, its history and the model's suggestions where the kit read them.
export function mediaDataOfKit(kit: KitMediaData, options: { usedHref?: (use: MediaUse) => string; view?: Pick<MediaQuery, "layout" | "size" | "group" | "pick"> } = {}): MediaData {
  const counts = new Map<string, number>();
  for (const r of kit.rows) for (const t of r.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  if (kit.query.tag && !counts.has(kit.query.tag)) counts.set(kit.query.tag, 0);
  const href = options.usedHref ?? (() => "");
  const { media: _media, ...offers } = kit.offers;
  const detail = kit.detail;
  return {
    site: { name: kit.site.name },
    query: { ...kit.query, ...options.view },
    rows: kit.rows.map((r) => recordOfKit(r)),
    page: kit.page,
    tags: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([tag, count]) => ({ tag, count })),
    offers,
    can: kit.can,
    ...(detail !== undefined
      ? {
          inspected: detail
            ? {
                ...recordOfKit(detail, detail.usedBy.map((u) => ({ title: u.title || u.id, href: href(u), how: u.detail }))),
                ...(detail.twins ? { twins: detail.twins.map((t) => ({ key: t.id, name: t.filename ?? t.id })) } : {}),
              }
            : null,
        }
      : {}),
    ...(detail?.history ? { history: detail.history } : {}),
    ...(detail && detail.suggestions !== undefined ? { suggestions: detail.suggestions } : {}),
  };
}

// ---------------------------------------------------------------------------------------
// v0.13.0: live changes, uploads that were already stored, turns, shrinking and licenses.

// Whether a file as it is now belongs in this view: Trash or the library, and the chosen tag, kind
// and orientation. A search or a lens is the site's to answer, so a changed file that was on the
// page stays on it.
function inView(r: MediaRecord, q: MediaQuery): boolean {
  if ((q.view === "trash") !== (r.state === "binned")) return false;
  if (q.tag && !r.tags.includes(q.tag)) return false;
  if (q.kind && (q.kind === "image" || q.kind === "document") && r.kind !== q.kind) return false;
  if (q.orientation && orientationOf(r.width, r.height) !== q.orientation) return false;
  return true;
}

// The page's files with what others changed put in place: a changed file replaces its tile where it
// still belongs in this view and leaves where it does not (moved to Trash, restored, untagged); a
// file deleted for good leaves. A changed file not on this page is counted, never added, since where
// it would sort and whether the site's search would match it are the site's to say.
export function applyChanges(rows: readonly MediaRecord[], changed: ReadonlyMap<string, MediaRecord | null>, q: MediaQuery): { rows: MediaRecord[]; elsewhere: number; updated: number } {
  const on = new Set(rows.map((r) => r.key));
  const out: MediaRecord[] = [];
  let updated = 0;
  for (const r of rows) {
    if (!changed.has(r.key)) {
      out.push(r);
      continue;
    }
    updated++;
    const now = changed.get(r.key);
    if (now && inView(now, q)) out.push(now);
  }
  let elsewhere = 0;
  for (const [key, now] of changed) if (!on.has(key) && now && inView(now, q)) elsewhere++;
  return { rows: out, elsewhere, updated };
}

// Which way a picture lies, as site-api v0.13.0's orientationOf says: square when its edges differ by
// at most 1% of the longer. null for a file with no size.
export function orientationOf(width: number | undefined | null, height: number | undefined | null): "landscape" | "portrait" | "square" | null {
  if (!width || !height) return null;
  if (Math.abs(width - height) <= Math.max(width, height) / 100) return "square";
  return width > height ? "landscape" : "portrait";
}

// True when a quarter turn saves the turned picture as a new file: a site whose addresses carry the
// size (offers.replaceKeepsSize) turns a picture that is not square that way (site-api v0.13.0).
export function turnMakesCopy(item: Pick<MediaRecord, "width" | "height">, offers: Pick<MediaOffers, "replaceKeepsSize">): boolean {
  return !!offers.replaceKeepsSize && orientationOf(item.width, item.height) !== "square";
}

// True when a picture has an edge longer than the site keeps (the oversized lens's rule).
export function oversized(item: Pick<MediaRecord, "kind" | "width" | "height">, maxEdge: number | null): boolean {
  return maxEdge != null && item.kind === "image" && Math.max(item.width ?? 0, item.height ?? 0) > maxEdge;
}

// True when a license's end day (YYYY-MM-DD) is before `today`'s, in UTC, as the license-expired lens
// counts it.
export function licenseEnded(licenseExpires: string | null | undefined, today: Date = new Date()): boolean {
  return !!licenseExpires && licenseExpires < today.toISOString().slice(0, 10);
}

// The files an upload, an import or a turn left to open, read from the kit's outcomes (site-api
// v0.13.0): a file already stored (`duplicate`, whose outcome is that file), a new file, and a turned
// copy (`copyId`).
export function filesToOpen(result: Pick<IntentResult, "outcomes"> | null | undefined): Array<{ id: string; why: "duplicate" | "new" | "copy" }> {
  const out: Array<{ id: string; why: "duplicate" | "new" | "copy" }> = [];
  for (const o of result?.outcomes ?? []) {
    if (!o.ok) continue;
    if (o.copyId) out.push({ id: o.copyId, why: "copy" });
    else if (o.duplicate) out.push({ id: o.id, why: "duplicate" });
    else if (/^(Uploaded|Imported)\./.test(o.message ?? "")) out.push({ id: o.id, why: "new" });
  }
  return out;
}

// A day as words, from the date at the start of an ISO string, so it reads the same in every zone:
// "1 May 2026". The string itself when it holds no date.
export function dayWords(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

// A moment in UTC, as words: "29 October 2026, 14:05 UTC".
export function momentWords(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return iso;
  const d = new Date(at).toISOString();
  return `${dayWords(d)}, ${d.slice(11, 16)} UTC`;
}
