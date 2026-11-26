import {} from "../content/content.js";
import { altStateOf } from "../media/media-record.js";
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
        tags: [...counts]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([tag, count]) => ({ tag, count })),
        offers,
        can: kit.can,
        ...(detail !== undefined
            ? {
                inspected: detail
                    ? {
                        ...recordOfKit(detail, detail.usedBy.map((u) => ({
                            title: u.title || u.id,
                            href: href(u),
                            how: u.detail,
                        }))),
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
