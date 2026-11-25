// The media library's pure helpers (view addresses, offered actions, copy, picker files). No DOM.
import {
  countText,
  nounsOf,
  type ContentLabels,
  type IntentResult,
  type MediaData,
  type MediaOffers,
  type MediaQuery,
  type MediaRevision,
  type MediaSuggestions,
  type MediaUse,
} from "../content/content.ts";
import { acceptLabel } from "../drop-zone/drop-zone.ts";
import { formatBytes } from "../format/format.ts";
import { altStateOf, type MediaRecord, type UsedIn } from "../media/media-record.ts";
import { formatDate } from "../time/time.ts";


const QUERY_ORDER: ReadonlyArray<keyof MediaQuery> = [
  "q",
  "tag",
  "kind",
  "orientation",
  "view",
  "layout",
  "size",
  "lens",
  "sort",
  "dir",
  "group",
  "cursor",
  "inspect",
  "suggest",
  "pick",
  "upload",
];

export type MediaSort = NonNullable<MediaQuery["sort"]>;

export const SORT_DIR: Record<MediaSort, "asc" | "desc"> = {
  added: "desc",
  name: "asc",
  size: "desc",
  used: "desc",
};

export function dirOf(q: Pick<MediaQuery, "sort" | "dir">): "asc" | "desc" {
  return q.dir ?? SORT_DIR[q.sort ?? "added"];
}

// The library's address for a query: keys in one fixed order, empty or default ones left out, so a view has one address.
export function mediaHref(base: string, q: MediaQuery): string {
  const params = new URLSearchParams();
  for (const k of QUERY_ORDER) {
    const v = q[k];
    if (
      !v ||
      (k === "view" && v === "library") ||
      (k === "layout" && v === "grid") ||
      (k === "size" && v === "m") ||
      (k === "sort" && v === "added")
    )
      continue;
    if (k === "dir" && v === SORT_DIR[q.sort ?? "added"]) continue;
    params.set(k, v === true ? "1" : String(v));
  }
  const path = base.split("?")[0] || "";
  const s = params.toString();
  return s ? `${path}?${s}` : path || "?";
}

const DISPLAY: ReadonlyArray<keyof MediaQuery> = ["layout", "size", "group"];

// A filter, sort or view change returns to page 1 and closes the inspector and pick; a display change keeps both.
// The model's suggestions are for one file, so any other change drops them.
export function withMedia(q: MediaQuery, change: Partial<MediaQuery>): MediaQuery {
  const next: MediaQuery = { ...q, ...change };
  if ("sort" in change && !("dir" in change)) delete next.dir;
  if (!("suggest" in change)) delete next.suggest;
  // The upload dialog is open only on the address that opened it.
  if (!("upload" in change)) delete next.upload;
  else if (change.upload) delete next.inspect;
  const keys = Object.keys(change) as Array<keyof MediaQuery>;
  const keeps =
    "inspect" in change ||
    "pick" in change ||
    "suggest" in change ||
    "upload" in change ||
    (keys.length > 0 && keys.every((k) => DISPLAY.includes(k)));
  if (!keeps) {
    delete next.cursor;
    delete next.inspect;
    delete next.pick;
  }
  for (const k of Object.keys(change) as Array<keyof MediaQuery>)
    if (change[k] === undefined) delete next[k];
  return next;
}


// The content kit's names (site-api runMediaIntent), so a host passes the form straight on.
export type MediaIntent = "tag-add" | "tag-remove" | "trash" | "restore" | "delete";

export interface OfferedAction {
  intent: MediaIntent;
  label: string;
  destructive?: boolean;
}

// Trash and Restore are an editor's (reversible); Delete is for good and the delete role's, from Trash where the site has one.
export function mediaActions(
  data: Pick<MediaData, "offers" | "can" | "query">,
  labels?: ContentLabels,
): { bulk: OfferedAction[]; withheld: string[] } {
  const { plural } = nounsOf(labels, "file");
  const { offers, can } = data;
  const trash = data.query.view === "trash";
  const bulk: OfferedAction[] = [];
  const withheld: string[] = [];
  if (trash) {
    if (can.edit && offers.trash) bulk.push({ intent: "restore", label: "Restore" });
    if (can.deleteMedia && offers.delete)
      bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
  } else {
    if (can.edit && offers.tags)
      bulk.push(
        { intent: "tag-add", label: "Add tag" },
        { intent: "tag-remove", label: "Remove tag" },
      );
    if (can.edit && offers.trash) bulk.push({ intent: "trash", label: "Move to Trash" });
    else if (can.deleteMedia && offers.delete)
      bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
  }
  if (!can.edit)
    withheld.push(`You can look at these ${plural}. Changing them needs an editor's role.`);
  else {
    if (!offers.alt)
      withheld.push("Alt text is set at upload here: this site cannot change it afterwards.");
  }
  return { bulk, withheld };
}

// Replacing, turning, reverting or shrinking a file changes every page that shows it and cannot be undone here, so it needs the delete role.
// Credit and the model's suggestions are an editor's.
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


export function countLine(
  data: Pick<MediaData, "rows" | "page" | "query">,
  labels?: ContentLabels,
): string {
  const base = countText(data.rows.length, data.page.total, nounsOf(labels, "file"));
  return data.query.view === "trash" ? `${base} in Trash` : base;
}

export function filtered(q: MediaQuery): boolean {
  return !!(q.q || q.tag || q.lens || q.kind || q.orientation);
}

export function emptyWords(
  q: MediaQuery,
  labels?: ContentLabels,
): { kind: "nothing-yet" | "no-match" | "all-clear"; title: string } {
  const { plural } = nounsOf(labels, "file");
  if (filtered(q)) {
    const what = [
      q.q ? `“${q.q}”` : null,
      q.tag ? `tag ${q.tag}` : null,
      q.kind ? KIND_WORDS[q.kind].toLowerCase() : null,
      q.orientation ? ORIENTATION_WORDS[q.orientation].toLowerCase() : null,
      q.lens ? `the ${q.lens} lens` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return {
      kind: "no-match",
      title: `No ${plural} match ${what}`,
    };
  }
  if (q.view === "trash")
    return {
      kind: "all-clear",
      title: "Trash is empty",
    };
  return { kind: "nothing-yet", title: `No ${plural} yet` };
}

// The upload rules in words; null when the site takes no images.
export function uploadRules(
  limits: NonNullable<MediaOffers["upload"]>,
  imagesOnly = false,
): { accept: string; hint: string } | null {
  const types = imagesOnly ? limits.types.filter((t) => t.startsWith("image/")) : limits.types;
  if (types.length === 0) return null;
  const accept = types.join(",");
  return { accept, hint: `${acceptLabel(accept)}, up to ${formatBytes(limits.maxBytes)}.` };
}

// Images that are in the library and uploaded, nothing in Trash or on its way.
export function pickable(rows: readonly MediaRecord[]): MediaRecord[] {
  return rows.filter((r) => r.kind === "image" && r.state === "ready");
}


export const LENS_WORDS: Record<string, { label: string; hint?: string }> = {
  unattached: {
    label: "Unattached",
    hint: "The site's own check finds nothing that uses these. A file placed by a page template is unattached by this measure and still live, so look before deleting.",
  },
  "no-alt": { label: "No alt text" },
  large: { label: "Over 1 MB" },
  duplicates: {
    label: "Duplicates",
    hint: "Files whose bytes are exactly another file's, by content hash, never by how a picture looks. Open one to see its twins.",
  },
  "license-expired": {
    label: "License ended",
    hint: "Files whose license end date has passed (in UTC). Renew the license, or replace the file where pages use it.",
  },
  oversized: {
    label: "Oversized",
    hint: "Pictures with an edge longer than this site keeps at upload. Shrink them to the site's size, one by one or all on this page.",
  },
};

export const KIND_WORDS: Record<NonNullable<MediaQuery["kind"]>, string> = {
  image: "Images",
  document: "Documents",
  video: "Video",
  audio: "Audio",
};
export const ORIENTATION_WORDS: Record<NonNullable<MediaQuery["orientation"]>, string> = {
  landscape: "Landscape",
  portrait: "Portrait",
  square: "Square",
};

export function lensChips(
  data: Pick<MediaData, "offers" | "extra">,
): Array<{ id: string; label: string; hint?: string; count?: number }> {
  const out: Array<{ id: string; label: string; hint?: string; count?: number }> = [];
  for (const id of data.offers.lenses ?? []) {
    const words = LENS_WORDS[id];
    const counted = data.extra?.lenses?.find((l) => l.id === id)?.count;
    if (words) out.push({ id, ...words, ...(counted != null ? { count: counted } : {}) });
  }
  for (const l of data.extra?.lenses ?? []) if (!out.some((o) => o.id === l.id)) out.push(l);
  return out;
}

export function folderOf(key: string): string {
  const at = key.lastIndexOf("/");
  return at > 0 ? key.slice(0, at) : "Top level";
}

// UTC, so a heading does not move with the reader's time zone.
export function monthOf(uploaded: string | undefined): string {
  return formatDate(uploaded, { style: "monthYear" }) ?? "No upload date";
}

// Page-local on purpose: a group never spans a page, and its count is this page's.
export function groupRows(
  rows: readonly MediaRecord[],
  group: MediaQuery["group"],
): Array<{ label: string; items: MediaRecord[] }> | null {
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

// What the address says about drawing the page, which the content kit's readMediaQuery leaves to the component.
export function readMediaView(
  search: URLSearchParams,
): Pick<MediaQuery, "layout" | "size" | "group" | "upload"> {
  const layout = search.get("layout");
  const size = search.get("size");
  const group = search.get("group");
  return {
    ...(layout === "grid" || layout === "list" ? { layout } : {}),
    ...(size === "s" || size === "m" || size === "l" ? { size } : {}),
    ...(group === "folder" || group === "month" ? { group } : {}),
    ...(search.get("upload") === "1" ? { upload: true } : {}),
  };
}


// A site-api MediaItem typed by shape, so Capsomer needs no site-api import.
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
  orientation?: "landscape" | "portrait" | "square";
}

export interface KitMediaData {
  site: { name: string };
  query: Omit<MediaQuery, "layout" | "size" | "group" | "pick" | "upload">;
  rows: KitMediaRow[];
  page: MediaData["page"];
  detail?:
    | (KitMediaRow & {
        usedBy: MediaUse[];
        twins?: Array<{ id: string; filename: string | null }>;
        history?: MediaRevision[];
        suggestions?: MediaSuggestions | null;
      })
    | null;
  offers: MediaOffers & { media?: boolean };
  can: MediaData["can"];
}

// The loadMediaChanges answer by shape. `{ reload: true }`: load the page again.
export interface KitMediaChanges {
  rows: KitMediaRow[];
  removed: string[];
  changeCursor: string;
  more: boolean;
}

// `url` is the site's own address (what Markdown carries), `thumb` the absolute one a browser loads.
// A list has no usedBy, so tiles carry no Unattached flag unless the site counts uses.
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
    ...(row.orientation ? { orientation: row.orientation } : {}),
  };
}

// The kit's page as MediaLibrary's data. The chosen tag stays in the chip row even when no file here carries it.
export function mediaDataOfKit(
  kit: KitMediaData,
  options: {
    usedHref?: (use: MediaUse) => string;
    view?: Pick<MediaQuery, "layout" | "size" | "group" | "pick" | "upload">;
  } = {},
): MediaData {
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
    tags: [...counts]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([tag, count]) => ({ tag, count })),
    offers,
    can: kit.can,
    ...(detail !== undefined
      ? {
          inspected: detail
            ? {
                ...recordOfKit(
                  detail,
                  detail.usedBy.map((u) => ({
                    title: u.title || u.id,
                    href: href(u),
                    how: u.detail,
                  })),
                ),
                ...(detail.twins
                  ? { twins: detail.twins.map((t) => ({ key: t.id, name: t.filename ?? t.id })) }
                  : {}),
              }
            : null,
        }
      : {}),
    ...(detail?.history ? { history: detail.history } : {}),
    ...(detail && detail.suggestions !== undefined ? { suggestions: detail.suggestions } : {}),
  };
}


// Whether a changed file belongs in this view. A search or lens is the site's to answer, so a file that was on the page stays.
function inView(r: MediaRecord, q: MediaQuery): boolean {
  if ((q.view === "trash") !== (r.state === "binned")) return false;
  if (q.tag && !r.tags.includes(q.tag)) return false;
  if (q.kind && (q.kind === "image" || q.kind === "document") && r.kind !== q.kind) return false;
  if (q.orientation && r.orientation !== q.orientation) return false;
  return true;
}

// A changed file not on this page is counted, never added: where it sorts and whether search matches it are the site's to say.
export function applyChanges(
  rows: readonly MediaRecord[],
  changed: ReadonlyMap<string, MediaRecord | null>,
  q: MediaQuery,
): { rows: MediaRecord[]; elsewhere: number; updated: number } {
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

// A quarter turn saves a new file on a site whose addresses carry the size, for a picture that is not square.
export function turnMakesCopy(
  item: Pick<MediaRecord, "orientation">,
  offers: Pick<MediaOffers, "replaceKeepsSize">,
): boolean {
  return !!offers.replaceKeepsSize && item.orientation !== "square";
}

export function oversized(
  item: Pick<MediaRecord, "kind" | "width" | "height">,
  maxEdge: number | null,
): boolean {
  return (
    maxEdge != null &&
    item.kind === "image" &&
    Math.max(item.width ?? 0, item.height ?? 0) > maxEdge
  );
}

// UTC, as the license-expired lens counts it.
export function licenseEnded(
  licenseExpires: string | null | undefined,
  today: Date = new Date(),
): boolean {
  return !!licenseExpires && licenseExpires < today.toISOString().slice(0, 10);
}

// The files an upload, import or turn left to open: a file already stored (`duplicate`), a new file, a turned copy (`copyId`).
export function filesToOpen(
  result: Pick<IntentResult, "outcomes"> | null | undefined,
): Array<{ id: string; why: "duplicate" | "new" | "copy" }> {
  const out: Array<{ id: string; why: "duplicate" | "new" | "copy" }> = [];
  for (const o of result?.outcomes ?? []) {
    if (!o.ok) continue;
    if (o.copyId) out.push({ id: o.copyId, why: "copy" });
    else if (o.duplicate) out.push({ id: o.id, why: "duplicate" });
    else if (/^(Uploaded|Imported)\./.test(o.message ?? "")) out.push({ id: o.id, why: "new" });
  }
  return out;
}

// UTC, so it reads the same in every zone. The string itself when it holds no date.
export const dayWords = (iso: string): string => formatDate(iso) ?? iso;

export const momentWords = (iso: string): string =>
  formatDate(iso, { style: "medium", time: true, zoneName: true }) ?? iso;
