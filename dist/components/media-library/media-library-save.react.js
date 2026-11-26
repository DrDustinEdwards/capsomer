import { useRef } from "react";
// The inspector's autosave posts the content kit's own intents, one for each field group that
// changed (`alt`, `caption`, `tags`), each on the version the last write made (site-api's
// Outcome.version), so a host passes every form straight on. What was saved, and on which version,
// is kept per file until the host's rows catch up.
export function useInspectorSave(submit, rows, inspected, iOffers) {
    const savedRef = useRef(new Map());
    return async (key, fields) => {
        if (!submit)
            return;
        const item = rows.find((r) => r.key === key) ?? (inspected?.key === key ? inspected : undefined);
        const kept = savedRef.current.get(key);
        const fresh = !kept || (item?.version !== kept.base && item?.version !== kept.version);
        const was = !fresh && kept
            ? kept.fields
            : {
                alt: item?.alt ?? "",
                decorative: item?.altState === "decorative",
                title: item?.title ?? "",
                caption: item?.caption ?? "",
                tags: item?.tags ?? [],
            };
        let version = !fresh && kept ? kept.version : item?.version;
        const base = item?.version;
        const writes = [];
        if (iOffers.alt && (fields.alt !== was.alt || fields.decorative !== was.decorative)) {
            writes.push([
                "alt",
                (f) => {
                    f.set("alt", fields.decorative ? "" : fields.alt);
                    if (fields.decorative)
                        f.set("decorative", "on");
                },
                (d) => ({ ...d, alt: fields.alt, decorative: fields.decorative }),
            ]);
        }
        if (iOffers.caption && fields.caption !== was.caption)
            writes.push([
                "caption",
                (f) => f.set("caption", fields.caption),
                (d) => ({ ...d, caption: fields.caption }),
            ]);
        if (iOffers.tags && fields.tags.join(", ") !== was.tags.join(", "))
            writes.push([
                "tags",
                (f) => f.set("tags", fields.tags.join(", ")),
                (d) => ({ ...d, tags: fields.tags }),
            ]);
        let done = was;
        for (const [intent, fill, after] of writes) {
            const form = new FormData();
            form.set("intent", intent);
            form.set("ids", key);
            if (version)
                form.set("versions", version);
            fill(form);
            const r = await submit(form);
            if (!r.ok)
                throw new Error(r.message);
            version = r.outcomes?.find((o) => o.id === key)?.version ?? version;
            done = after(done);
            savedRef.current.set(key, { base, version, fields: done });
        }
    };
}
