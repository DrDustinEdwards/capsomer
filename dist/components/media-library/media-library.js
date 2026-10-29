import { acceptLabel, formatBytes } from "../drop-zone/drop-zone.js";
import { altStateOf } from "../media/media-record.js";
export function nounsOf(labels = {}) {
    const noun = labels.noun ?? "file";
    return { noun, plural: labels.plural ?? `${noun}s` };
}
// ---------------------------------------------------------------------------------------
// Addresses.
const QUERY_ORDER = ["q", "tag", "view", "layout", "size", "lens", "sort", "dir", "group", "cursor", "inspect", "pick"];
// The way each of the contract's sorts runs when no direction is given (site-api v0.6.0): newest
// first, A to Z, largest first.
export const SORT_DIR = { added: "desc", name: "asc", size: "desc" };
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
        params.set(k, v);
    }
    const path = base.split("?")[0] || "";
    const s = params.toString();
    return s ? `${path}?${s}` : path || "?";
}
// The keys that only change how the page is drawn, not which files it holds.
const DISPLAY = ["layout", "size", "group"];
// A filter, sort or view change starts again at the first page, with the inspector and the pick
// closed; opening a file (`inspect`, `pick`) and a display change (layout, size, grouping) keep the
// page it is on and the open file. A new sort starts in its own direction unless `dir` is given.
export function withMedia(q, change) {
    const next = { ...q, ...change };
    if ("sort" in change && !("dir" in change))
        delete next.dir;
    const keys = Object.keys(change);
    const keeps = "inspect" in change || "pick" in change || (keys.length > 0 && keys.every((k) => DISPLAY.includes(k)));
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
export function inspectorOffers(data) {
    const { offers, can } = data;
    return {
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
    return !!(q.q || q.tag || q.lens);
}
// The empty state's title and line, naming what is not there.
export function emptyWords(q, labels) {
    const { noun, plural } = nounsOf(labels);
    if (filtered(q)) {
        const what = [q.q ? `“${q.q}”` : null, q.tag ? `tag ${q.tag}` : null, q.lens ? `the ${q.lens} lens` : null].filter(Boolean).join(", ");
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
};
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
// carry no Unattached flag.
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
    };
}
// The kit's page as MediaLibrary's data, so every host maps it the same way. `usedHref` is where a
// place that uses the file links (the host's editor); the page's tags, with their counts on this page,
// make the chip row, and the chosen tag stays in it even when no file here carries it. `view` is the
// drawing the address asks for (readMediaView) and `pick` the picker's chosen file.
export function mediaDataOfKit(kit, options = {}) {
    const counts = new Map();
    for (const r of kit.rows)
        for (const t of r.tags ?? [])
            counts.set(t, (counts.get(t) ?? 0) + 1);
    if (kit.query.tag && !counts.has(kit.query.tag))
        counts.set(kit.query.tag, 0);
    const href = options.usedHref ?? (() => "");
    const { media: _media, ...offers } = kit.offers;
    return {
        site: { name: kit.site.name },
        query: { ...kit.query, ...options.view },
        rows: kit.rows.map((r) => recordOfKit(r)),
        page: kit.page,
        tags: [...counts].sort(([a], [b]) => a.localeCompare(b)).map(([tag, count]) => ({ tag, count })),
        offers,
        can: kit.can,
        ...(kit.detail !== undefined
            ? { inspected: kit.detail ? recordOfKit(kit.detail, kit.detail.usedBy.map((u) => ({ title: u.title || u.id, href: href(u), how: u.detail }))) : null }
            : {}),
    };
}
