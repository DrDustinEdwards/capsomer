// The media inspector's fields: reading them, writing a record into them, the tags and the save status.
// Plain functions of the inspector element; the controller in media.ts owns when they run.
import { byteSize, copySnippets, parseTags } from "./media-record.js";
import { glyph, part } from "./media-tile.js";
const SAVE_TEXT = {
    idle: "Changes save by themselves.",
    dirty: "Unsaved changes",
    saving: "Saving…",
    saved: "Saved",
    failed: "Could not save",
};
export function readFields(inspector) {
    const ins = (name) => (inspector ? part(inspector, name) : null);
    const decorative = ins("decorative")?.checked ?? false;
    return {
        alt: decorative ? "" : (ins("alt")?.value ?? "").trim(),
        decorative,
        title: (ins("title-field")?.value ?? "").trim(),
        caption: (ins("caption")?.value ?? "").trim(),
        tags: parseTags(ins("tags-value")?.value ?? ""),
    };
}
export function renderSave(inspector, state, error) {
    const ins = (name) => (inspector ? part(inspector, name) : null);
    const wrap = ins("save");
    const status = ins("save-status");
    const alert = ins("save-error");
    const retry = ins("retry-save");
    const form = ins("form");
    if (wrap)
        wrap.dataset.state = state;
    if (form) {
        if (state === "saving")
            form.setAttribute("aria-busy", "true");
        else
            form.removeAttribute("aria-busy");
    }
    if (status) {
        if (state === "failed")
            status.replaceChildren();
        else {
            const kids = [];
            if (state === "saving")
                kids.push(glyph("running"));
            else if (state === "saved")
                kids.push(glyph("ok"));
            else if (state === "dirty")
                kids.push(glyph("info"));
            kids.push(document.createTextNode(SAVE_TEXT[state]));
            status.replaceChildren(...kids);
        }
    }
    if (alert) {
        if (state === "failed")
            alert.replaceChildren(glyph("crit"), document.createTextNode(`Could not save${error ? `: ${error.replace(/\.$/, "")}` : ""}. What you typed is still here.`));
        else
            alert.replaceChildren();
    }
    if (retry)
        retry.hidden = state !== "failed";
}
// Writes a record into the inspector's fields and lists. Idempotent: the server's own markup
// for the first file is what this would write.
export function fillInspector(inspector, r, draft) {
    const ins = (name) => (inspector ? part(inspector, name) : null);
    const set = (name, fn) => {
        const el = ins(name);
        if (el)
            fn(el);
    };
    set("title", (el) => (el.textContent = r.name));
    set("subtitle", (el) => (el.textContent = [r.type.split("/").pop()?.toUpperCase(), byteSize(r.bytes), r.width && r.height ? `${r.width} by ${r.height}` : ""].filter(Boolean).join(" · ")));
    set("preview", (img) => {
        const frame = img.closest(".cap-media-preview");
        if (r.kind === "image" && r.thumb) {
            img.hidden = false;
            img.src = r.thumb;
            frame?.querySelector(".cap-media-doc")?.remove();
        }
        else {
            img.hidden = true;
            if (frame && !frame.querySelector(".cap-media-doc")) {
                const doc = document.createElement("span");
                doc.className = "cap-media-doc";
                doc.setAttribute("aria-hidden", "true");
                doc.textContent = (r.name.split(".").pop() ?? "file").slice(0, 5).toUpperCase();
                frame.append(doc);
            }
        }
    });
    set("key", (el) => (el.value = r.key));
    const values = draft ?? { alt: r.alt, decorative: r.altState === "decorative", title: r.title, caption: r.caption, tags: r.tags };
    const alt = ins("alt");
    const deco = ins("decorative");
    if (alt && deco) {
        deco.checked = values.decorative;
        alt.value = values.decorative ? "" : values.alt;
        alt.disabled = values.decorative;
        alt.dataset.prev = "";
    }
    const imageOnly = r.kind === "image";
    for (const name of ["alt-field", "decorative-field"])
        set(name, (el) => (el.hidden = !imageOnly));
    set("alt-document", (el) => (el.hidden = imageOnly));
    set("title-field", (el) => (el.value = values.title));
    set("caption", (el) => (el.value = values.caption));
    renderTags(inspector, values.tags, r.suggestedTags ?? []);
    set("address", (el) => (el.value = r.url));
    for (const b of inspector.querySelectorAll("[data-cap-copy-kind]")) {
        const snippet = copySnippets({ url: r.url, kind: r.kind, alt: values.alt, name: r.name }).find((s) => s.id === b.dataset.capCopyKind);
        if (snippet) {
            b.dataset.capCopy = snippet.value;
            b.setAttribute("aria-label", snippet.name);
            const label = b.querySelector("[data-cap-part='copy-label']");
            if (label)
                label.textContent = snippet.label;
        }
    }
    set("copied", (el) => el.replaceChildren());
    set("facts", (dl) => {
        const rows = [
            ["Key", r.key],
            ["Type", r.type || "unknown"],
            ["Size", byteSize(r.bytes)],
            ["Dimensions", r.width && r.height ? `${r.width} by ${r.height}` : "not measured"],
            ["Uploaded", r.uploaded ?? "ships with the site"],
        ];
        dl.replaceChildren(...rows.flatMap(([k, v]) => {
            const dt = document.createElement("dt");
            dt.textContent = k;
            const dd = document.createElement("dd");
            dd.textContent = v;
            return [dt, dd];
        }));
    });
    set("used", (box) => {
        box.replaceChildren();
        if (r.used.length > 0) {
            const ul = document.createElement("ul");
            ul.className = "cap-media-used";
            for (const u of r.used) {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = u.href;
                a.textContent = u.title;
                li.append(a);
                if (u.how) {
                    const how = document.createElement("span");
                    how.className = "cap-media-used-how";
                    how.textContent = u.how;
                    li.append(how);
                }
                ul.append(li);
            }
            box.append(ul);
        }
        else {
            const p = document.createElement("p");
            p.className = "cap-media-used-empty";
            p.textContent = "Not used anywhere.";
            const note = document.createElement("p");
            note.className = "cap-media-note";
            note.append("No post cites this file. That is not proof it is unused: a page built in code can still use it, so check before you delete it. The Unattached filter lists every file like this. ");
            const show = document.createElement("button");
            show.type = "button";
            show.className = "cap-btn";
            show.dataset.variant = "link";
            show.dataset.capPart = "show-unattached";
            show.textContent = "Show unattached files";
            note.append(show);
            box.append(p, note);
        }
    });
    const binned = r.state === "binned";
    set("bin", (el) => (el.hidden = binned));
    set("restore", (el) => (el.hidden = !binned));
    renderSave(inspector, draft ? "failed" : "idle", draft ? "the last save did not go through" : undefined);
}
export function renderTags(inspector, tags, suggested) {
    const ins = (name) => (inspector ? part(inspector, name) : null);
    const list = ins("tags");
    const hidden = ins("tags-value");
    if (hidden)
        hidden.value = tags.join(", ");
    if (list) {
        list.replaceChildren(...tags.map((t) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.type = "button";
            b.className = "cap-chip";
            b.dataset.capTag = t;
            b.setAttribute("aria-label", `Remove tag ${t}`);
            b.append(t, " ");
            const x = document.createElement("span");
            x.setAttribute("aria-hidden", "true");
            x.textContent = "×";
            b.append(x);
            li.append(b);
            return li;
        }));
    }
    const sug = ins("suggestions");
    if (sug) {
        sug.replaceChildren(...suggested
            .filter((t) => !tags.includes(t))
            .map((t) => {
            const li = document.createElement("li");
            const b = document.createElement("button");
            b.type = "button";
            b.className = "cap-chip";
            b.dataset.capSuggest = t;
            b.setAttribute("aria-label", `Add suggested tag ${t}`);
            b.textContent = `+ ${t}`;
            li.append(b);
            return li;
        }));
    }
}
