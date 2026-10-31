import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.js";
import { altStateOf } from "../media/media-record.js";
export function nounsOf(labels = {}) {
    const noun = labels.noun ?? "file";
    return { noun, plural: labels.plural ?? `${noun}s` };
}
// ---------------------------------------------------------------------------------------
// Addresses.
const QUERY_ORDER = ["q", "tag", "kind", "orientation", "view", "layout", "size", "lens", "sort", "dir", "group", "cursor", "inspect", "suggest", "pick"];
// The way each of the contract's sorts runs when no direction is given (site-api v0.6.0): newest
// first, A to Z, largest first, and (v0.13.0) most used first.
export const SORT_DIR = { added: "desc", name: "asc", size: "desc", used: "desc" };
// The direction a query sorts in: its own, or its sort's.
export function dirOf(q) {
    return q.dir ?? SORT_DIR[q.sort ?? "added"];
}
// The library's address with a query, its keys in one fixed order and the empty or default ones
// left out, so the same view is always the same address. `base` is the route.
export function mediaHref(base, q) {
    const params = new URLSearchParams();
    for (const k of QUERY_ORDER) {
        const v = q[k];
        if (!v || (k === "view" && v === "library") || (k === "layout" && v === "grid") || (k === "size" && v === "m") || (k === "sort" && v === "added"))
            continue;
        if (k === "dir" && v === SORT_DIR[q.sort ?? "added"])
            continue;
        params.set(k, v === true ? "1" : String(v));
    }
    const path = base.split("?")[0] || "";
    const s = params.toString();
    return s ? `${path}?${s}` : path || "?";
}
// The keys that only change how the page is drawn, not which files it holds.
const DISPLAY = ["layout", "size", "group"];
// A filter, sort or view change starts again at the first page, with the inspector and the pick
// closed; opening a file (`inspect`, `pick`) and a display change (layout, size, grouping) keep the
// page it is on and the open file. A new sort starts in its own direction unless `dir` is given. The
// model's suggestions are for one file: anything but asking for them again leaves them behind.
export function withMedia(q, change) {
    const next = { ...q, ...change };
    if ("sort" in change && !("dir" in change))
        delete next.dir;
    if (!("suggest" in change))
        delete next.suggest;
    const keys = Object.keys(change);
    const keeps = "inspect" in change || "pick" in change || "suggest" in change || (keys.length > 0 && keys.every((k) => DISPLAY.includes(k)));
    if (!keeps) {
        delete next.cursor;
        delete next.inspect;
        delete next.pick;
    }
    for (const k of Object.keys(change))
        if (change[k] === undefined)
            delete next[k];
    return next;
}
// The bulk actions this person may run on this view of this site, in the bar's order, and a
// sentence for each one held back. Trash and Restore are an editor's (reversible, as the kit says);
// Delete is for good and the delete role's: from Trash where the site has one, from
// the library only where it has none.
export function mediaActions(data, labels) {
    const { plural } = nounsOf(labels);
    const { offers, can } = data;
    const trash = data.query.view === "trash";
    const bulk = [];
    const withheld = [];
    if (trash) {
        if (can.edit && offers.trash)
            bulk.push({ intent: "restore", label: "Restore" });
        if (can.deleteMedia && offers.delete)
            bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
    }
    else {
        if (can.edit && offers.tags)
            bulk.push({ intent: "tag-add", label: "Add tag" }, { intent: "tag-remove", label: "Remove tag" });
        if (can.edit && offers.trash)
            bulk.push({ intent: "trash", label: "Move to Trash" });
        else if (can.deleteMedia && offers.delete)
            bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
    }
    if (!can.edit)
        withheld.push(`You can look at these ${plural}. Changing them needs an editor's role.`);
    else {
        if (!offers.upload && !trash)
            withheld.push("Uploads are not offered by this site.");
        if (!offers.alt)
            withheld.push("Alt text is set at upload here: this site cannot change it afterwards.");
        if (!offers.tags && !trash)
            withheld.push(`Tags are not offered: this site keeps no tags on its ${plural}.`);
    }
    if (can.deleteMedia && !offers.delete && (trash || !offers.trash))
        withheld.push(`Delete is not offered: this site cannot delete ${plural}.`);
    return { bulk, withheld };
}
// What a file's inspector may do here. Replacing a file's bytes changes every page that shows it and
// cannot be undone here, so it needs the delete role, as the content kit says.
// A turn, a revert and a shrink change every page that uses the file too (site-api v0.13.0), so they
// need the delete role as well; credit and the model's suggestions are an editor's.
export function inspectorOffers(data) {
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
export function countLine(data, labels) {
    const { noun, plural } = nounsOf(labels);
    const n = data.rows.length;
    const total = data.page.total;
    const word = (k) => (k === 1 ? noun : plural);
    const base = total != null && total > n ? `Showing ${n} of ${total} ${word(total)}` : `${n} ${word(n)}`;
    return data.query.view === "trash" ? `${base} in Trash` : base;
}
export function filtered(q) {
    return !!(q.q || q.tag || q.lens || q.kind || q.orientation);
}
// The empty state's title and line, naming what is not there.
export function emptyWords(q, labels) {
    const { noun, plural } = nounsOf(labels);
    if (filtered(q)) {
        const what = [q.q ? `“${q.q}”` : null, q.tag ? `tag ${q.tag}` : null, q.kind ? KIND_WORDS[q.kind].toLowerCase() : null, q.orientation ? ORIENTATION_WORDS[q.orientation].toLowerCase() : null, q.lens ? `the ${q.lens} lens` : null].filter(Boolean).join(", ");
        return { kind: "no-match", title: `No ${plural} match ${what}`, text: "Clear the filters to see every one." };
    }
    if (q.view === "trash")
        return { kind: "all-clear", title: "Trash is empty", text: `A ${noun} moved to Trash waits here until it is restored or deleted for good.` };
    return { kind: "nothing-yet", title: `No ${plural} yet`, text: `Upload the first ${noun} and it shows here.` };
}
// The site's upload rules in words, for the drop zone's hint: "PNG, JPEG and WebP, up to 5 MB".
// The picker takes images only; null when the site takes none.
export function uploadRules(limits, imagesOnly = false) {
    const types = imagesOnly ? limits.types.filter((t) => t.startsWith("image/")) : limits.types;
    if (types.length === 0)
        return null;
    const accept = types.join(",");
    return { accept, hint: `${acceptLabel(accept)}, up to ${formatBytes(limits.maxBytes)}.` };
}
// The picker's files: images that are in the library and uploaded, nothing in Trash or on its
// way.
export function pickable(rows) {
    return rows.filter((r) => r.kind === "image" && r.state === "ready");
}
// ---------------------------------------------------------------------------------------
// The view: lenses, groups, and what the address says about how to draw the page.
// The site-api contract's lenses (v0.6.0 MEDIA_LENSES), in words: what each chip shows.
export const LENS_WORDS = {
    unattached: { label: "Unattached", hint: "The site's own check finds nothing that uses these. A file placed by a page template is unattached by this measure and still live, so look before deleting." },
    "no-alt": { label: "No alt text", hint: "Images with no alt text written yet." },
    large: { label: "Over 1 MB", hint: "Files larger than one mebibyte." },
    duplicates: { label: "Duplicates", hint: "Files whose bytes are exactly another file's, by content hash, never by how a picture looks. Open one to see its twins." },
    "license-expired": { label: "License ended", hint: "Files whose license end date has passed (in UTC). Renew the license, or replace the file where pages use it." },
    oversized: { label: "Oversized", hint: "Pictures with an edge longer than this site keeps at upload. Shrink them to the site's size, one by one or all on this page." },
};
// The filters (site-api v0.13.0 MEDIA_KINDS and MEDIA_ORIENTATIONS), in words, in the toolbar's order.
export const KIND_WORDS = { image: "Images", document: "Documents", video: "Video", audio: "Audio" };
export const ORIENTATION_WORDS = { landscape: "Landscape", portrait: "Portrait", square: "Square" };
// The lens chips: the contract's lenses the site names, then a host's own, each once.
export function lensChips(data) {
    const out = [];
    for (const id of data.offers.lenses ?? []) {
        const words = LENS_WORDS[id];
        const counted = data.extra?.lenses?.find((l) => l.id === id)?.count;
        if (words)
            out.push({ id, ...words, ...(counted != null ? { count: counted } : {}) });
    }
    for (const l of data.extra?.lenses ?? [])
        if (!out.some((o) => o.id === l.id))
            out.push(l);
    return out;
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
// The folder a file's id puts it in: everything before its last "/", or "Top level".
export function folderOf(key) {
    const at = key.lastIndexOf("/");
    return at > 0 ? key.slice(0, at) : "Top level";
}
// The month a file was uploaded, in UTC, so a heading does not move with the reader's time zone.
export function monthOf(uploaded) {
    const at = uploaded ? Date.parse(uploaded) : Number.NaN;
    if (Number.isNaN(at))
        return "No upload date";
    const d = new Date(at);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
// The page's files under headings, each group in the order its first file came, so the sort still
// reads down the page. Page-local on purpose: a group never spans a page, and its count is this page's.
export function groupRows(rows, group) {
    if (group !== "folder" && group !== "month")
        return null;
    const groups = new Map();
    for (const r of rows) {
        const label = group === "folder" ? folderOf(r.key) : monthOf(r.uploaded);
        const list = groups.get(label);
        if (list)
            list.push(r);
        else
            groups.set(label, [r]);
    }
    return [...groups].map(([label, items]) => ({ label, items }));
}
// What the address says about drawing the page, which the content kit's readMediaQuery leaves to the
// component: the layout, the tile size and the grouping. A host merges it into the kit's query.
export function readMediaView(search) {
    const layout = search.get("layout");
    const size = search.get("size");
    const group = search.get("group");
    return {
        ...(layout === "grid" || layout === "list" ? { layout } : {}),
        ...(size === "s" || size === "m" || size === "l" ? { size } : {}),
        ...(group === "folder" || group === "month" ? { group } : {}),
    };
}
// A kit row as the media component's record: `url` is the site's own address for it (what Markdown and the
// copy snippets carry), `thumb` the absolute one a browser loads. A list has no usedBy, so its tiles
// carry no Unattached flag unless the site counts uses (`usedCount`, site-api v0.13.0).
export function recordOfKit(row, used) {
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
// The kit's page as MediaLibrary's data, so every host maps it the same way. `usedHref` is where a
// place that uses the file links (the host's editor); the page's tags, with their counts on this page,
// make the chip row, and the chosen tag stays in it even when no file here carries it. `view` is the
// drawing the address asks for (readMediaView) and `pick` the picker's chosen file. The inspected
// file brings its twins, its history and the model's suggestions where the kit read them.
export function mediaDataOfKit(kit, options = {}) {
    const counts = new Map();
    for (const r of kit.rows)
        for (const t of r.tags ?? [])
            counts.set(t, (counts.get(t) ?? 0) + 1);
    if (kit.query.tag && !counts.has(kit.query.tag))
        counts.set(kit.query.tag, 0);
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
function inView(r, q) {
    if ((q.view === "trash") !== (r.state === "binned"))
        return false;
    if (q.tag && !r.tags.includes(q.tag))
        return false;
    if (q.kind && (q.kind === "image" || q.kind === "document") && r.kind !== q.kind)
        return false;
    if (q.orientation && r.orientation !== q.orientation)
        return false;
    return true;
}
// The page's files with what others changed put in place: a changed file replaces its tile where it
// still belongs in this view and leaves where it does not (moved to Trash, restored, untagged); a
// file deleted for good leaves. A changed file not on this page is counted, never added, since where
// it would sort and whether the site's search would match it are the site's to say.
export function applyChanges(rows, changed, q) {
    const on = new Set(rows.map((r) => r.key));
    const out = [];
    let updated = 0;
    for (const r of rows) {
        if (!changed.has(r.key)) {
            out.push(r);
            continue;
        }
        updated++;
        const now = changed.get(r.key);
        if (now && inView(now, q))
            out.push(now);
    }
    let elsewhere = 0;
    for (const [key, now] of changed)
        if (!on.has(key) && now && inView(now, q))
            elsewhere++;
    return { rows: out, elsewhere, updated };
}
// True when a quarter turn saves the turned picture as a new file: a site whose addresses carry the
// size (offers.replaceKeepsSize) turns a picture that is not square that way (site-api v0.13.0), by
// the orientation the kit gives.
export function turnMakesCopy(item, offers) {
    return !!offers.replaceKeepsSize && item.orientation !== "square";
}
// True when a picture has an edge longer than the site keeps (the oversized lens's rule).
export function oversized(item, maxEdge) {
    return maxEdge != null && item.kind === "image" && Math.max(item.width ?? 0, item.height ?? 0) > maxEdge;
}
// True when a license's end day (YYYY-MM-DD) is before `today`'s, in UTC, as the license-expired lens
// counts it.
export function licenseEnded(licenseExpires, today = new Date()) {
    return !!licenseExpires && licenseExpires < today.toISOString().slice(0, 10);
}
// The files an upload, an import or a turn left to open, read from the kit's outcomes (site-api
// v0.13.0): a file already stored (`duplicate`, whose outcome is that file), a new file, and a turned
// copy (`copyId`).
export function filesToOpen(result) {
    const out = [];
    for (const o of result?.outcomes ?? []) {
        if (!o.ok)
            continue;
        if (o.copyId)
            out.push({ id: o.copyId, why: "copy" });
        else if (o.duplicate)
            out.push({ id: o.id, why: "duplicate" });
        else if (/^(Uploaded|Imported)\./.test(o.message ?? ""))
            out.push({ id: o.id, why: "new" });
    }
    return out;
}
// A day as words, from the date at the start of an ISO string, so it reads the same in every zone:
// "1 May 2026". The string itself when it holds no date.
export function dayWords(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m)
        return iso;
    return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}
// A moment in UTC, as words: "29 October 2026, 14:05 UTC".
export function momentWords(iso) {
    const at = Date.parse(iso);
    if (Number.isNaN(at))
        return iso;
    const d = new Date(at).toISOString();
    return `${dayWords(d)}, ${d.slice(11, 16)} UTC`;
}
