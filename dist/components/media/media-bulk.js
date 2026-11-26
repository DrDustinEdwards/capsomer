// What the library does to several files at once, and to one from its Trash and Restore buttons:
// bin, restore, copy the addresses, delete for good, and add or remove a tag. Each is the bulk
// bar's handler, with its Undo, over the tiles the controller hands in.
import { copyText } from "../copy/copy.js";
import { performBulk } from "../bulk-bar/bulk-bar.js";
import { applyBulkTag } from "./media-actions.js";
import { parseTags } from "./media-record.js";
import { recordOf, syncTile, writeRecord } from "./media-tile.js";
const recordFields = (t) => {
    const r = recordOf(t);
    return {
        alt: r.alt,
        decorative: r.altState === "decorative",
        title: r.title,
        caption: r.caption,
        tags: r.tags,
    };
};
export function createBulk({ options, byKey, refresh, counts, returnTo }) {
    const rawBin = async (keys, to) => {
        const before = keys.map((k) => ({ k, state: byKey(k)?.dataset.state ?? "ready" }));
        for (const k of keys) {
            const t = byKey(k);
            if (!t)
                continue;
            writeRecord(t, { state: to });
            syncTile(t);
        }
        refresh();
        try {
            await (to === "binned" ? options.bin : options.restore)?.(keys);
        }
        catch (err) {
            for (const b of before) {
                const t = byKey(b.k);
                if (t) {
                    t.dataset.state = b.state;
                    syncTile(t);
                }
            }
            refresh();
            throw err;
        }
    };
    const itemsOf = (keys) => keys.map((k) => ({ id: k, label: byKey(k)?.dataset.label ?? k }));
    const bin = (keys) => performBulk({
        action: "bin",
        items: itemsOf(keys),
        run: () => rawBin(keys, "binned"),
        undo: () => rawBin(keys, "ready"),
        said: keys.length === 1
            ? `Moved ${byKey(keys[0] ?? "")?.dataset.label ?? "the file"} to Trash.`
            : "Moved {n} files to Trash.",
        undone: keys.length === 1 ? "Put it back in the library." : "Put {n} files back in the library.",
        returnTo: returnTo(),
    });
    const restore = (keys) => performBulk({
        action: "restore",
        items: itemsOf(keys),
        run: () => rawBin(keys, "ready"),
        undo: () => rawBin(keys, "binned"),
        said: keys.length === 1
            ? `Restored ${byKey(keys[0] ?? "")?.dataset.label ?? "the file"} to the library.`
            : "Restored {n} files to the library.",
        undone: keys.length === 1 ? "Put it back in Trash." : "Put {n} files back in Trash.",
        returnTo: returnTo(),
    });
    // Bulk tags: add or remove one tag across the selection; undo reverses exactly what changed.
    function tagHandler(adding) {
        const changed = new WeakMap();
        const apply = async (items, value, add) => {
            const tag = (value ?? "").trim().toLowerCase();
            if (!tag)
                throw new Error("name a tag first");
            const result = await applyBulkTag({
                ids: items.map((i) => i.id),
                wanted: tag,
                adding: add,
                missing: "no longer in the library",
                read: async (id) => {
                    const t = byKey(id);
                    return t ? { item: t, tags: parseTags(t.dataset.tags ?? "") } : null;
                },
                write: async (id, t, tags) => {
                    await options.save?.(id, { ...recordFields(t), tags });
                    t.dataset.tags = tags.join(", ");
                },
            });
            changed.set(items, result.done);
            if (result.failed.length > 0)
                throw new Error(result.failed.join("; "));
            counts();
        };
        return {
            run: (items, value) => apply(items, value, adding),
            undo: async (items, value) => {
                const did = changed.get(items) ?? [];
                await apply(items.filter((i) => did.includes(i.id)), value, !adding);
            },
            said: adding ? "Added the tag to {n} file{s}." : "Removed the tag from {n} file{s}.",
            undone: adding ? "Took the tag off {n} file{s}." : "Put the tag back on {n} file{s}.",
        };
    }
    const ids = (items) => items.map((i) => i.id);
    const handlers = () => ({
        bin: {
            run: (items) => rawBin(ids(items), "binned"),
            undo: (items) => rawBin(ids(items), "ready"),
            said: "Moved {n} file{s} to Trash.",
            undone: "Put {n} file{s} back in the library.",
        },
        restore: {
            run: (items) => rawBin(ids(items), "ready"),
            undo: (items) => rawBin(ids(items), "binned"),
            said: "Restored {n} file{s} to the library.",
            undone: "Put {n} file{s} back in Trash.",
        },
        copy: {
            run: async (items) => {
                const urls = items.map((i) => byKey(i.id)?.dataset.url ?? "").filter(Boolean);
                if (!(await copyText(urls.join("\n"))))
                    throw new Error("the browser refused the clipboard");
            },
            said: "Copied the address of {n} file{s}.",
        },
        delete: {
            run: async (items) => {
                await options.delete?.(ids(items));
                for (const i of items)
                    byKey(i.id)?.remove();
                refresh();
            },
            said: "Deleted {n} file{s} for good.",
        },
        "add-tag": tagHandler(true),
        "remove-tag": tagHandler(false),
    });
    return { bin, restore, handlers };
}
