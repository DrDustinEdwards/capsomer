// The media library's inspector as a behavior: it opens beside the grid (a pane) or over it (a side
// sheet), fills from the tile it shows, saves by itself and never loses typed text, takes tags and
// the copy buttons, and answers its own keys. The controller owns the tiles and says which one is
// active; this owns what the inspector shows and does.
import { COPIED_MS, COPY_FAILED_MS, copyText } from "../copy/copy.js";
import { openDialog, wireDialog } from "../dialog/dialog.js";
import { fail } from "../message/message.js";
import { isImeEnter } from "../shortcuts/shortcuts.js";
import { glyphEl } from "../status/status.js";
import { createAutosave } from "./media-autosave.js";
import { chipsGroup } from "./media-filter.js";
import { fillInspector, readFields, renderSave, renderTags } from "./media-inspector.js";
import { altStateOf, parseTags } from "./media-record.js";
import { part, recordOf, syncTile, writeRecord } from "./media-tile.js";
export function createPanel(host) {
    const { root, inspector, options } = host;
    let current = null;
    let session = 0;
    const drafts = new Map();
    let autosave = null;
    let unwire = null;
    let copiedTimer = null;
    let observer = null;
    const ins = (name) => part(inspector, name);
    const draw = (state, error) => renderSave(inspector, state, error);
    const keyOf = () => current?.dataset.key ?? "";
    const defaultSave = async (key) => {
        const form = ins("form");
        if (!form)
            return;
        const body = new FormData(form);
        body.set("key", key);
        const res = await fetch(form.getAttribute("action") || location.href, {
            method: (form.getAttribute("method") || "post").toUpperCase(),
            body,
            headers: { accept: "application/json" },
        });
        if (!res.ok)
            throw new Error(`The server answered ${res.status}.`);
    };
    // Applies saved fields to the tile, so the grid, the filters and the next open read them.
    const applySaved = (tile, f) => {
        writeRecord(tile, {
            altState: altStateOf(f.alt, f.decorative),
            alt: f.alt,
            title: f.title,
            caption: f.caption,
            tags: f.tags,
        });
        syncTile(tile);
        host.saved();
    };
    const startSession = (tile) => {
        session += 1;
        const mine = session;
        autosave?.cancel();
        current = tile;
        autosave = tile
            ? createAutosave({
                save: () => {
                    // Read now: this runs the moment a save starts, before anything else can change the fields.
                    const fields = readFields(inspector);
                    const key = tile.dataset.key ?? "";
                    const send = options.save ?? defaultSave;
                    return send(key, fields).then(() => {
                        drafts.delete(key);
                        applySaved(tile, fields);
                    }, (err) => {
                        drafts.set(key, fields);
                        throw err;
                    });
                },
                onState: (s, err) => {
                    if (mine === session)
                        draw(s, err);
                    else if (s === "failed")
                        fail(`Could not save the changes to ${tile.dataset.label ?? "a file"}: ${err ?? "nothing says why"}. Open it again to retry.`);
                },
            })
            : null;
    };
    // Writes a record into the inspector's fields and lists. Idempotent: the server's own markup
    // for the first file is what this would write.
    const fill = (tile) => {
        const r = recordOf(tile);
        startSession(tile);
        fillInspector(inspector, r, drafts.get(r.key));
        host.syncRoving();
    };
    const closePending = () => void autosave?.flush();
    const show = (tile) => {
        closePending();
        fill(tile);
    };
    const saveTags = (tags) => {
        renderTags(inspector, tags, (current ? recordOf(current) : null)?.suggestedTags ?? []);
        autosave?.schedule();
        void autosave?.flush();
    };
    const haveTags = () => parseTags(ins("tags-value")?.value ?? "");
    const addTagFrom = (input) => {
        const add = parseTags(input.value);
        input.value = "";
        if (add.length === 0)
            return;
        const have = haveTags();
        saveTags([...have, ...add.filter((t) => !have.includes(t))]);
    };
    const firstField = () => {
        const alt = ins("alt");
        if (alt && !alt.disabled && !alt.closest("[hidden]"))
            return alt;
        return ins("decorative") ?? ins("title-field");
    };
    const showPane = () => {
        if (!inspector.open)
            inspector.show();
    };
    const open = (tile, o) => {
        host.setActive(tile);
        if (current !== tile)
            show(tile);
        const link = host.openLink(tile);
        if (host.modeOf() === "pane") {
            if (inspector.matches(":modal"))
                inspector.close();
            showPane();
            host.syncRoving();
            if (o.focus)
                firstField()?.focus();
        }
        else if (!inspector.open || !inspector.matches(":modal")) {
            if (inspector.open)
                inspector.close();
            unwire?.();
            unwire = wireDialog(inspector, { returnTo: link });
            openDialog(inspector, link, { focus: firstField() });
            host.syncRoving();
        }
    };
    const close = (o = { focus: true }) => {
        closePending();
        const was = inspector.open;
        if (was)
            inspector.close();
        host.syncRoving();
        if (was && o.focus)
            host.focusTile(host.active());
    };
    const copyFrom = async (btn) => {
        const value = btn.dataset.capCopy || ins("address")?.value || "";
        const what = btn.getAttribute("aria-label")?.replace(/^Copy (the )?/, "") || "address";
        const status = ins("copied");
        if (copiedTimer)
            clearTimeout(copiedTimer);
        // Emptied first, so a second copy of the same thing is announced again.
        status?.replaceChildren();
        await Promise.resolve();
        const ok = await copyText(value);
        if (status) {
            if (ok)
                status.replaceChildren(glyphEl("ok"), document.createTextNode(`Copied the ${what}.`));
            else {
                status.replaceChildren(glyphEl("crit"), "Could not copy. The address is selected: press Ctrl+C or Cmd+C.");
                ins("address")?.select();
            }
            copiedTimer = setTimeout(() => status.replaceChildren(), ok ? COPIED_MS : COPY_FAILED_MS);
        }
    };
    host.listen(inspector, "change", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement) || t.dataset.capPart !== "decorative")
            return;
        const alt = ins("alt");
        if (alt) {
            if (t.checked) {
                alt.dataset.prev = alt.value;
                alt.value = "";
                alt.disabled = true;
            }
            else {
                alt.disabled = false;
                alt.value = alt.dataset.prev ?? "";
            }
        }
        autosave?.schedule();
        void autosave?.flush();
    });
    host.listen(inspector, "input", (e) => {
        const p = e.target instanceof HTMLElement ? e.target.dataset.capPart : "";
        if (p === "alt" || p === "title-field" || p === "caption")
            autosave?.schedule();
    });
    host.listen(inspector, "focusout", (e) => {
        const t = e.target;
        if (!(t instanceof HTMLElement))
            return;
        // A field that loses focus saves what was typed in it; a tag typed and left is added.
        if (t.dataset.capPart === "tag-input") {
            if (t.value.trim())
                addTagFrom(t);
        }
        else if (/^(INPUT|TEXTAREA)$/.test(t.tagName))
            void autosave?.flush();
    });
    host.listen(inspector, "click", (e) => {
        const btn = e.target instanceof Element ? e.target.closest("button") : null;
        if (!btn)
            return;
        const p = btn.dataset.capPart;
        if (p === "close")
            close();
        else if (p === "bin" && current)
            void host.bin([keyOf()]);
        else if (p === "restore" && current)
            void host.restore([keyOf()]);
        else if (p === "retry-save")
            void autosave?.retry();
        else if (p === "show-unattached") {
            const chip = chipsGroup(root)?.querySelector(".cap-chip[data-value='unattached']");
            if (chip && chip.getAttribute("aria-pressed") !== "true")
                chip.click();
            if (chip)
                chip.focus();
        }
        else if (btn.dataset.capTag !== undefined) {
            saveTags(haveTags().filter((x) => x !== btn.dataset.capTag));
            ins("tag-input")?.focus();
        }
        else if (btn.dataset.capSuggest !== undefined) {
            saveTags([...haveTags(), btn.dataset.capSuggest]);
            ins("tag-input")?.focus();
        }
        else if (btn.dataset.capCopy !== undefined) {
            void copyFrom(btn);
        }
    });
    // Enter in the tag field adds a tag; Esc goes back to the grid (a sheet closes by itself); Alt and an
    // arrow move to the next file without leaving the field.
    host.listen(inspector, "keydown", (e) => {
        const t = e.target instanceof HTMLElement ? e.target : null;
        if (!t || e.defaultPrevented || e.isComposing || isImeEnter(e))
            return;
        if (t.dataset.capPart === "tag-input" && (e.key === "Enter" || e.key === ",")) {
            e.preventDefault();
            addTagFrom(t);
            return;
        }
        if (e.altKey && !e.ctrlKey && !e.metaKey && current) {
            const dir = e.key === "ArrowLeft" || e.key === "ArrowUp"
                ? "prev"
                : e.key === "ArrowRight" || e.key === "ArrowDown"
                    ? "next"
                    : null;
            if (dir) {
                e.preventDefault();
                const next = host.move(current, dir);
                if (next && next.dataset.state !== "uploading" && next.dataset.state !== "failed") {
                    closePending();
                    host.setActive(next);
                    fill(next);
                    next.scrollIntoView({ block: "nearest" });
                }
                return;
            }
        }
        if (e.key === "Escape" && inspector.open && !inspector.matches(":modal")) {
            e.preventDefault();
            closePending();
            host.focusTile(host.active());
        }
    });
    host.listen(inspector, "close", () => {
        unwire?.();
        unwire = null;
        host.syncRoving();
    });
    // The form's own Save button is for a page with no script; with script the pane saves itself.
    host.listen(inspector, "submit", (e) => {
        e.preventDefault();
        void autosave?.flush();
    });
    let lastMode = host.modeOf();
    if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
            const m = host.modeOf();
            if (m === lastMode)
                return;
            lastMode = m;
            if (!inspector.open)
                return;
            if (m === "pane") {
                if (inspector.matches(":modal")) {
                    inspector.close();
                    showPane();
                }
            }
            else if (!inspector.matches(":modal")) {
                closePending();
                inspector.close();
            }
            host.syncRoving();
        });
        observer.observe(root);
    }
    return {
        open,
        close,
        show,
        current: () => current,
        // The inspector follows the tile that has focus; focus stays where it is.
        follow: (tile) => {
            if (inspector.open &&
                !inspector.matches(":modal") &&
                current !== tile &&
                tile.dataset.state !== "uploading" &&
                tile.dataset.state !== "failed")
                show(tile);
        },
        // The server rendered the inspector for this tile: start its session without rewriting it.
        adopt: (tile) => {
            startSession(tile);
            draw("idle");
        },
        detach: () => {
            observer?.disconnect();
            unwire?.();
        },
    };
}
