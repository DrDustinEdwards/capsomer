import { jsx as _jsx } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { thumb, file, USES, FILES, lies } from "./examples-data.js";
const win = window;
win.mediaLog = [];
const queryOf = (params) => {
    const q = Object.fromEntries([...params].filter(([, v]) => v));
    return { ...q, ...(q.suggest ? { suggest: q.suggest === "1" } : {}) };
};
// The stand-in router: a GET form or a link to the library's own address changes the specimen's
// query instead of leaving the page.
export function useRouter(initial) {
    const [query, setQuery] = useState(initial);
    // One component for the specimen's life, so a re-render never remounts a form.
    const [Form] = useState(() => (props) => (_jsx("form", { ...props, onSubmit: (e) => {
            props.onSubmit?.(e);
            if (e.defaultPrevented || (props.method ?? "get") !== "get")
                return;
            e.preventDefault();
            setQuery(queryOf(new URLSearchParams(new FormData(e.currentTarget))));
        } })));
    const onClickCapture = (e) => {
        const a = e.target.closest("a[href]");
        const href = a?.getAttribute("href") ?? "";
        if (!href.startsWith("/media"))
            return;
        e.preventDefault();
        setQuery(queryOf(new URL(href, location.origin).searchParams));
    };
    return { query, Form, onClickCapture };
}
const fileWord = (n) => (n === 1 ? "file" : "files");
// The in-memory site: what the content kit would do through site-api.
let written = 1;
export function useSite(initial = FILES, keepsSize = false) {
    // The files as drawn, and the same list in a ref for an intent that reads it after an await.
    const [files, setFiles] = useState(() => initial.map((f) => ({ ...f })));
    const live = useRef(files);
    const change = (f) => {
        live.current = f(live.current);
        setFiles(live.current);
    };
    const submit = async (form) => {
        const entry = {};
        for (const k of new Set(form.keys())) {
            const all = form.getAll(k).map((v) => (v instanceof File ? `file:${v.name}` : String(v)));
            entry[k] = all.length > 1 ? all : (all[0] ?? "");
        }
        win.mediaLog.push(entry);
        await new Promise((r) => setTimeout(r, 40));
        const intent = String(form.get("intent"));
        const ids = form.getAll("ids").map(String);
        const tag = String(form.get("tags") ?? "").trim();
        // As the kit does: a single file's write needs the version the page saw, and says the one it made.
        const seen = String(form.get("versions") ?? "");
        const stale = () => {
            const now = live.current.find((f) => f.key === ids[0])?.version;
            return !!now && seen !== now;
        };
        const next = () => `v${++written}`;
        const name = (id) => live.current.find((f) => f.key === id)?.name ?? id;
        const some = (n) => (n === 1 ? `“${name(ids[0] ?? "")}”` : `${n} files`);
        switch (intent) {
            case "trash":
            case "restore": {
                const to = intent === "trash" ? "binned" : "ready";
                change((fs) => fs.map((f) => (ids.includes(f.key) ? { ...f, state: to } : f)));
                return intent === "trash"
                    ? {
                        ok: true,
                        message: `Moved ${some(ids.length)} to Trash.`,
                        undo: { intent: "restore", fields: { ids } },
                    }
                    : {
                        ok: true,
                        message: `Restored ${some(ids.length)}.`,
                        undo: { intent: "trash", fields: { ids } },
                    };
            }
            case "tag-add":
            case "tag-remove": {
                if (!tag)
                    return { ok: false, message: "Type a tag first. Nothing was changed." };
                if (ids.some((id) => !form.has(`version:${id}`)) && !form.has("versions"))
                    return {
                        ok: false,
                        message: "The page did not say which version of each file you saw, so nothing was sent.",
                    };
                const adding = intent === "tag-add";
                const changed = ids.filter((id) => live.current.find((f) => f.key === id)?.tags.includes(tag) !== adding);
                change((fs) => fs.map((f) => changed.includes(f.key)
                    ? { ...f, tags: adding ? [...f.tags, tag] : f.tags.filter((t) => t !== tag) }
                    : f));
                return {
                    ok: true,
                    message: `${adding ? "Added" : "Removed"} the tag ${tag} ${adding ? "to" : "from"} ${changed.length} ${fileWord(changed.length)}.`,
                    outcomes: ids.map((id) => ({
                        id,
                        ok: true,
                        message: changed.includes(id)
                            ? undefined
                            : adding
                                ? "Already had it."
                                : "Did not have it.",
                    })),
                    undo: changed.length
                        ? {
                            intent: adding ? "tag-remove" : "tag-add",
                            fields: {
                                ids: changed,
                                tags: tag,
                                ...Object.fromEntries(changed.map((id) => [
                                    `version:${id}`,
                                    live.current.find((f) => f.key === id)?.version ?? "",
                                ])),
                            },
                        }
                        : undefined,
                };
            }
            case "delete": {
                if (String(form.get("confirm") ?? "") !== String(ids.length)) {
                    return {
                        ok: false,
                        message: "Confirm first.",
                        confirm: {
                            intent: "delete",
                            title: `Delete ${ids.length} ${fileWord(ids.length)} for good?`,
                            lead: "A file deleted for good cannot be brought back. The site refuses one that a post still uses.",
                            items: ids.map(name),
                            action: `Delete ${ids.length} ${fileWord(ids.length)}`,
                            typeToConfirm: String(ids.length),
                            fields: { ids },
                        },
                    };
                }
                const refused = ids.filter((id) => USES[id]?.length);
                change((fs) => fs.filter((f) => !ids.includes(f.key) || refused.includes(f.key)));
                return {
                    ok: refused.length === 0,
                    message: `Deleted ${ids.length - refused.length} ${fileWord(ids.length - refused.length)} for good${refused.length ? `; ${refused.length} refused` : ""}.`,
                    outcomes: ids.map((id) => refused.includes(id)
                        ? {
                            id,
                            ok: false,
                            message: "Still used, so the site kept it.",
                            usedBy: (USES[id] ?? []).map((u) => ({
                                type: "post",
                                id: u.href,
                                title: u.title,
                                detail: u.how ?? "",
                            })),
                        }
                        : { id, ok: true }),
                };
            }
            case "alt":
            case "tags":
            case "caption": {
                const id = ids[0] ?? "";
                if (stale())
                    return {
                        ok: false,
                        message: "Changed elsewhere since this page read it. Reload and try again.",
                    };
                const version = next();
                const decorative = form.get("decorative") === "on";
                const alt = String(form.get("alt") ?? "");
                const tags = form.has("tags")
                    ? String(form.get("tags"))
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    : undefined;
                const caption = form.has("caption") ? String(form.get("caption")) : undefined;
                change((fs) => fs.map((f) => f.key !== id
                    ? f
                    : {
                        ...f,
                        ...(form.has("alt") || decorative
                            ? {
                                alt: decorative ? "" : alt,
                                altState: decorative ? "decorative" : alt.trim() ? "set" : "missing",
                            }
                            : {}),
                        ...(tags ? { tags } : {}),
                        ...(caption !== undefined ? { caption } : {}),
                        version,
                    }));
                return { ok: true, message: `Saved ${some(1)}.`, outcomes: [{ id, ok: true, version }] };
            }
            case "focus": {
                const id = ids[0] ?? "";
                const focus = form.get("clear") === "yes"
                    ? null
                    : `${Number(form.get("x")) / 100}x${Number(form.get("y")) / 100}`;
                const version = next();
                change((fs) => fs.map((f) => (f.key !== id ? f : { ...f, focus, version })));
                return {
                    ok: true,
                    message: focus ? "Focal point saved." : "Focal point cleared.",
                    outcomes: [{ id, ok: true, version }],
                };
            }
            case "replace": {
                const id = ids[0] ?? "";
                const f = form.get("file");
                if (!(f instanceof File) || !f.name)
                    return { ok: false, message: "Choose the new file." };
                change((fs) => fs.map((x) => x.key !== id
                    ? x
                    : { ...x, bytes: f.size, focus: null, thumb: thumb("#bfe3d0"), version: next() }));
                return {
                    ok: true,
                    message: `Replaced ${some(1)}. Every page that shows it shows the new one.`,
                };
            }
            case "upload": {
                const f = form.get("file");
                if (!(f instanceof File) || !f.name)
                    return { ok: false, message: "Choose a file first. Nothing was uploaded." };
                // This specimen's site already holds the bytes of any file named for the bay.
                const twin = keepsSize && f.name.includes("bay")
                    ? live.current.find((x) => x.key === "2026/10/bay-dusk.png")
                    : undefined;
                if (twin) {
                    const message = `${f.name} is already in the library as ${twin.name}, so no second copy was stored.`;
                    return {
                        ok: true,
                        message,
                        outcomes: [{ id: twin.key, ok: true, duplicate: true, message }],
                    };
                }
                const key = `2026/10/${f.name}`;
                change((fs) => [
                    file(key, "#bfe3d0", {
                        alt: String(form.get("alt") ?? ""),
                        altState: form.get("alt") ? "set" : "missing",
                        bytes: f.size,
                    }),
                    ...fs,
                ]);
                return { ok: true, message: `Uploaded “${f.name}”.`, outcomes: [{ id: key, ok: true }] };
            }
            case "import": {
                const url = String(form.get("url") ?? "");
                const key = `2026/10/${url.split("/").pop() || "import.png"}`;
                change((fs) => [
                    file(key, "#c4d8f0", {
                        alt: String(form.get("alt") ?? ""),
                        altState: form.get("alt") ? "set" : "missing",
                        sourceUrl: url,
                        usedCount: 0,
                    }),
                    ...fs,
                ]);
                return {
                    ok: true,
                    message: `Imported ${key.split("/").pop()}.`,
                    outcomes: [{ id: key, ok: true, message: "Imported." }],
                };
            }
            case "credit": {
                const id = ids[0] ?? "";
                if (stale())
                    return {
                        ok: false,
                        message: "Changed elsewhere since this page read it. Reload and try again.",
                    };
                const version = next();
                const text = (k) => String(form.get(k) ?? "").trim();
                change((fs) => fs.map((f) => f.key !== id
                    ? f
                    : {
                        ...f,
                        credit: text("credit"),
                        license: text("license"),
                        sourceUrl: text("sourceUrl") || null,
                        licenseExpires: text("licenseExpires") || null,
                        version,
                    }));
                return {
                    ok: true,
                    message: "Credit saved.",
                    outcomes: [{ id, ok: true, version, message: "Credit saved." }],
                };
            }
            case "transform": {
                const id = ids[0] ?? "";
                const op = String(form.get("op") ?? "");
                const was = live.current.find((f) => f.key === id);
                if (!was)
                    return { ok: false, message: "That file is not here." };
                const quarter = op === "rotate-90" || op === "rotate-270";
                const turned = quarter ? { width: was.height, height: was.width } : {};
                if (quarter && keepsSize && lies(was) !== "square") {
                    const copy = was.key.replace(/(\.[a-z]+)$/, "-turned$1");
                    change((fs) => [
                        {
                            ...was,
                            ...turned,
                            key: copy,
                            name: copy.split("/").pop() ?? copy,
                            version: next(),
                            usedCount: 0,
                            twins: [],
                        },
                        ...fs,
                    ]);
                    return {
                        ok: true,
                        message: `Saved the turned picture as a new file, ${copy.split("/").pop()}.`,
                        outcomes: [{ id, ok: true, copyId: copy, message: "Saved as a new file." }],
                    };
                }
                const version = next();
                change((fs) => fs.map((f) => (f.key !== id ? f : { ...f, ...turned, version })));
                return {
                    ok: true,
                    message: "Turned. Every page that uses it shows the new picture.",
                    outcomes: [{ id, ok: true, version }],
                    undo: { intent: "revert", fields: { ids: [id], versions: [version], to: "r2" } },
                };
            }
            case "revert": {
                const id = ids[0] ?? "";
                const version = next();
                change((fs) => fs.map((f) => (f.key !== id ? f : { ...f, version })));
                return {
                    ok: true,
                    message: "Reverted. Every page that uses it shows that version.",
                    outcomes: [{ id, ok: true, version }],
                };
            }
            case "resize": {
                if (String(form.get("confirm") ?? "") !== String(ids.length)) {
                    return {
                        ok: false,
                        message: "Confirm first.",
                        confirm: {
                            intent: "resize",
                            title: `Shrink ${ids.length} ${ids.length === 1 ? "picture" : "pictures"} to this site's size?`,
                            lead: "Each picture is stored again at the smaller size, and every page that uses it shows the smaller one.",
                            action: "Shrink",
                            items: ids,
                            typeToConfirm: String(ids.length),
                            fields: { ids, versions: form.getAll("versions").map(String) },
                        },
                    };
                }
                change((fs) => fs.map((f) => ids.includes(f.key) && f.width && f.height
                    ? {
                        ...f,
                        width: Math.round((f.width * 2048) / Math.max(f.width, f.height)),
                        height: Math.round((f.height * 2048) / Math.max(f.width, f.height)),
                        version: next(),
                    }
                    : f));
                return {
                    ok: true,
                    message: `Shrank ${ids.length} ${ids.length === 1 ? "picture" : "pictures"}.`,
                    outcomes: ids.map((id) => ({ id, ok: true, message: "Shrunk to the site's size." })),
                };
            }
            default:
                return { ok: false, message: `Nothing here runs “${intent}”.` };
        }
    };
    return { files, submit, change };
}
