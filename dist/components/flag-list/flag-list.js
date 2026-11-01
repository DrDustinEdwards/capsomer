// The flag list's behavior and its pure helpers. A flag is raised against a draft by a check, a
// reviewer or an AI, and stays on the record: resolving it keeps it, with who and when. A
// suggestion a flag carries is inert until the owner applies it; nothing here applies one by
// itself. The whole record is in the delivered HTML; this module only adds what a person does
// to it (resolve, dismiss, reopen, apply, apply a batch) and keeps the anchors true to the
// current text. No framework; the React wrapper reuses the pure functions.
//
// A result is said in a polite region, a refusal in an alert. A flag is a question for the
// owner, never a decision; an open flag holds publish until it is fixed or dismissed.
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { fail, say } from "../message/message.js";
import { attachRowList } from "../row-list/row-list.js";
import { enhance as enhanceTime, parse as parseTime, text as timeText } from "../time/time.js";
import { anchorStatus, appliable, applySuggestion, countFlags, revertSuggestion, summaryLine } from "./flag-list-model.js";
export { groupFlags, countFlags, summaryLine, anchorStatus, applySuggestion, revertSuggestion, appliable } from "./flag-list-model.js";
// ---------------------------------------------------------------------------------------
// The page.
const SVG = "http://www.w3.org/2000/svg";
const GLYPHS = {
    crit: '<path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/>',
    warn: '<path fill="currentColor" fill-rule="evenodd" d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/>',
    info: '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>',
    ok: '<path fill="currentColor" fill-rule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"/>',
    nodata: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    running: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.35"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2"/>',
};
// The status component's glyph, the same drawing (components/status).
export function glyph(name) {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("class", "cap-status-glyph");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = GLYPHS[name] ?? "";
    return svg;
}
// A status: glyph, word, color.
export function statusEl(tone, word, glyphName = tone) {
    const s = document.createElement("span");
    s.className = "cap-status";
    s.dataset.tone = tone;
    s.append(glyph(glyphName), word);
    return s;
}
const READY = "data-cap-ready";
const part = (el, name) => el.querySelector(`[data-cap-part='${name}']`);
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className)
        e.className = className;
    if (text !== undefined)
        e.textContent = text;
    return e;
}
// A flag read back from its row, so the DOM stays the one source of truth.
export function readFlag(li) {
    const quote = li.querySelector(".cap-flag-quote-text")?.textContent ?? "";
    const after = li.querySelector(".cap-flag-after-text")?.textContent;
    const anchorId = li.dataset.anchorId;
    const flag = {
        id: li.dataset.flag ?? li.id,
        kind: li.dataset.kind === "advisory" ? "advisory" : "blocking",
        cause: part(li, "cause")?.textContent ?? "",
        message: li.querySelector(".cap-flag-message")?.textContent ?? "",
        state: li.dataset.state === "resolved" ? "resolved" : "open",
    };
    if (anchorId && quote) {
        flag.anchor = { id: anchorId, quote, lost: li.dataset.anchor === "lost" };
        if (li.dataset.before)
            flag.anchor.before = li.dataset.before;
        if (li.dataset.after)
            flag.anchor.after = li.dataset.after;
        const label = li.dataset.gotoLabel;
        if (label)
            flag.anchor.label = label;
    }
    if (after !== undefined && after !== null)
        flag.suggestion = { replacement: after };
    if (li.dataset.resolution)
        flag.resolution = li.dataset.resolution;
    if (li.dataset.resolvedBy)
        flag.resolvedBy = li.dataset.resolvedBy;
    if (li.dataset.resolvedAt)
        flag.resolvedAt = li.dataset.resolvedAt;
    return flag;
}
export function flagRows(root) {
    return Array.from(root.querySelectorAll("li.cap-flag"));
}
export function readFlags(root) {
    return flagRows(root).map(readFlag);
}
const WORDS = { resolved: "Resolved", dismissed: "Dismissed", applied: "Applied" };
function actionButton(kind, label, message, variant) {
    const b = el("button", "cap-btn");
    b.type = "button";
    b.dataset.size = "sm";
    if (variant)
        b.dataset.variant = variant;
    b.dataset.capPart = kind;
    b.append(label, Object.assign(el("span", "cap-sr-only"), { textContent: ` flag: ${message}` }));
    return b;
}
// Rebuilds the parts of one row that depend on its state and anchor, from its data attributes:
// the critical edge, the title (a link only while the passage is there), the resolution on the
// right, the actions, the suggestion's footer, and the line that says who closed it and when.
export function renderFlag(li, ctx) {
    const flag = readFlag(li);
    const status = anchorStatus(flag);
    li.dataset.anchor = status;
    if (flag.kind === "blocking" && flag.state === "open")
        li.dataset.tone = "crit";
    else
        delete li.dataset.tone;
    // Title: the link while the passage is found; plain words and "Anchor lost" otherwise.
    const title = li.querySelector(".cap-row-title");
    if (title && flag.anchor) {
        const describedby = li.querySelector(".cap-row-title [aria-describedby]")?.getAttribute("aria-describedby") ?? `${li.id}-s ${li.id}-d`;
        const message = el("span", "cap-flag-message", flag.message);
        if (status === "found") {
            const a = el("a");
            a.href = `#${flag.anchor.id}`;
            a.setAttribute("aria-describedby", describedby);
            a.append(message, " ", el("span", "cap-flag-goto", flag.anchor.label ?? "Go to passage"));
            title.replaceChildren(a);
        }
        else {
            const span = el("span", "cap-flag-title");
            span.append(message, " ", statusEl("nodata", "Anchor lost"));
            title.replaceChildren(span);
        }
    }
    // The state on the right.
    const meta = li.querySelector(".cap-row-meta");
    if (meta) {
        if (flag.state === "resolved") {
            const r = flag.resolution ?? "resolved";
            meta.replaceChildren(statusEl(r === "dismissed" ? "nodata" : "ok", WORDS[r]));
        }
        else
            meta.replaceChildren();
    }
    // The actions.
    const actions = li.querySelector(".cap-row-actions");
    if (actions) {
        actions.replaceChildren(...(flag.state === "open" ? [actionButton("resolve", "Resolve", flag.message), actionButton("dismiss", "Dismiss", flag.message, "quiet")] : [actionButton("reopen", "Reopen", flag.message)]));
    }
    // The quote's note and the suggestion's footer.
    const quoteNote = part(li, "anchor-note");
    if (quoteNote) {
        quoteNote.replaceChildren();
        if (status === "lost")
            quoteNote.append("The text this flag was raised on changed or was removed. Last known text:");
        else if (status === "found")
            quoteNote.append("Raised on this passage:");
        quoteNote.hidden = quoteNote.childNodes.length === 0;
    }
    const sug = li.querySelector(".cap-flag-suggestion");
    if (sug && flag.suggestion) {
        const applied = flag.state === "resolved" && flag.resolution === "applied";
        sug.dataset.state = applied ? "applied" : "inert";
        const foot = part(sug, "suggestion-foot");
        if (foot) {
            foot.replaceChildren();
            if (applied)
                foot.append(el("p", "cap-flag-note", "Applied to the draft."));
            else if (flag.state === "resolved")
                foot.append(el("p", "cap-flag-note", "Not applied. Reopen the flag to apply it."));
            else if (status !== "found")
                foot.append(el("p", "cap-flag-note", "Cannot be applied: the passage it replaces has changed or gone."));
            else if (ctx.owner) {
                const b = el("button", "cap-btn");
                b.type = "button";
                b.dataset.size = "sm";
                b.dataset.variant = "primary";
                b.dataset.capPart = "apply";
                b.append("Apply", Object.assign(el("span", "cap-sr-only"), { textContent: ` suggestion: ${flag.message}` }));
                foot.append(b, el("span", "cap-flag-note", "Nothing changes in the draft until you apply it."));
            }
            else
                foot.append(el("p", "cap-flag-note", `Only the owner${ctx.ownerName ? `, ${ctx.ownerName},` : ""} can apply this. The draft stays as it is until they do.`));
        }
    }
    // Who closed it, and when.
    const body = li.querySelector(".cap-flag-body");
    body?.querySelector(".cap-flag-resolution")?.remove();
    if (body && flag.state === "resolved") {
        const p = el("p", "cap-flag-resolution");
        p.append(`${WORDS[flag.resolution ?? "resolved"]}${flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}`);
        if (flag.resolvedAt) {
            const t = el("time", "cap-time");
            t.dataset.cap = "time";
            t.dateTime = flag.resolvedAt;
            t.textContent = timeText(parseTime(flag.resolvedAt), "relative");
            p.append(" ", t);
            enhanceTime(p);
        }
        p.append(".");
        body.append(p);
    }
}
// The text a `data-text-source` selector names: a textarea or input's value, else an element's text.
function ioFor(selector) {
    if (!selector)
        return undefined;
    const find = () => document.querySelector(selector);
    if (!find())
        return undefined;
    return {
        getText: () => {
            const e = find();
            return e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement ? e.value : (e?.textContent ?? "");
        },
        setText: (t) => {
            const e = find();
            if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) {
                e.value = t;
                e.dispatchEvent(new Event("input", { bubbles: true }));
            }
            else if (e)
                e.textContent = t;
        },
    };
}
function setCount(root, name, n) {
    for (const c of root.querySelectorAll(`[data-count='${name}']`))
        c.textContent = String(n);
}
export function attachFlagList(root, io) {
    const owner = root.hasAttribute("data-owner");
    const ctx = { owner, ownerName: root.dataset.ownerName ?? "" };
    const viewer = root.dataset.viewer ?? "";
    const list = root.querySelector(".cap-flags-list");
    const detachRows = list ? attachRowList(list) : () => { };
    const live = (text) => {
        const region = part(root, "live");
        if (!region)
            return;
        region.textContent = "";
        requestAnimationFrame(() => {
            region.textContent = text;
        });
    };
    // The page's message region says it, with Undo; without one the list's own polite region does.
    const announce = (text, opts = {}) => {
        if (document.querySelector("[data-cap='message']"))
            say(text, opts);
        else
            live(text);
    };
    const problem = (text) => {
        if (document.querySelector("[data-cap='message']"))
            fail(text);
        else
            live(text);
    };
    const emit = (li) => {
        const f = readFlag(li);
        root.dispatchEvent(new CustomEvent("cap:flag-change", { bubbles: true, detail: { id: f.id, state: f.state, resolution: f.resolution ?? null, resolvedBy: f.resolvedBy ?? null, resolvedAt: f.resolvedAt ?? null } }));
    };
    // Group headings, the summary, the filter's counts and the batch button follow the rows.
    const tally = () => {
        const flags = readFlags(root);
        const c = countFlags(flags);
        const summary = part(root, "summary");
        if (summary)
            summary.textContent = summaryLine(c);
        setCount(root, "open", c.open);
        setCount(root, "resolved", c.resolved);
        setCount(root, "all", c.total);
        for (const kind of ["blocking", "advisory"]) {
            const mine = flags.filter((f) => f.kind === kind);
            const open = mine.filter((f) => f.state === "open").length;
            const head = root.querySelector(`.cap-flag-group[data-group='${kind}'] .cap-flag-group-count`);
            if (head)
                head.textContent = `${open} open, ${mine.length - open} resolved`;
        }
        const text = io?.getText();
        const n = appliable(flags, text).length;
        const batch = part(root, "apply-all");
        if (batch) {
            batch.replaceChildren(`Apply ${n} suggestion${n === 1 ? "" : "s"}`);
            batch.hidden = n === 0 || !owner;
        }
        const note = part(root, "owner-note");
        if (note)
            note.hidden = owner || appliable(flags, text).length === 0;
    };
    // Moves the open flags to the top of their group so the record reads open first.
    const order = () => {
        if (!list)
            return;
        for (const kind of ["blocking", "advisory"]) {
            const group = list.querySelector(`.cap-flag-group[data-group='${kind}'] .cap-flag-group-rows`);
            if (!group)
                continue;
            const rows = flagRows(group);
            const sorted = [...rows.filter((r) => r.dataset.state === "open"), ...rows.filter((r) => r.dataset.state === "resolved")];
            sorted.forEach((r, i) => {
                if (group.children[i] !== r)
                    group.insertBefore(r, group.children[i] ?? null);
            });
        }
    };
    // Re-reads the text: a flag whose passage appeared or vanished is redrawn, then the counts.
    const refresh = () => {
        const text = io?.getText();
        if (text !== undefined) {
            for (const li of flagRows(root)) {
                // A closed flag keeps what it said when it was closed: it is a record, not a live check.
                if (!li.dataset.anchorId || li.dataset.state === "resolved")
                    continue;
                const next = anchorStatus(readFlag(li), text);
                if (next === li.dataset.anchor)
                    continue;
                li.dataset.anchor = next;
                renderFlag(li, ctx);
            }
        }
        tally();
    };
    // Where focus goes if the row leaves the filtered view: chosen before the change, as the next
    // visible row (or the one before it), so the order the rows are re-sorted into does not matter.
    const heirOf = (li) => {
        const visible = (e) => e.getClientRects().length > 0;
        const all = flagRows(root);
        const here = all.indexOf(li);
        return all.slice(here + 1).find(visible) ?? all.slice(0, here).reverse().find(visible) ?? null;
    };
    // After a row's state changed: focus stays in the row on its new first action, or, when the row
    // is no longer shown, goes to its heir. It is never left on nothing.
    const settle = (li, hadFocus, heir) => {
        if (!hadFocus)
            return;
        const visible = (e) => e.getClientRects().length > 0;
        const first = (row) => [...row.querySelectorAll(".cap-row-actions button"), ...row.querySelectorAll(".cap-row-title a")].find(visible);
        const target = first(li) ?? (heir ? first(heir) : undefined);
        if (target)
            return void target.focus();
        (part(root, "filter")?.querySelector("input:checked") ?? root).focus();
    };
    const stamp = (li, state, resolution) => {
        li.dataset.state = state;
        if (state === "resolved") {
            li.dataset.resolution = resolution ?? "resolved";
            if (viewer)
                li.dataset.resolvedBy = viewer;
            else
                delete li.dataset.resolvedBy;
            li.dataset.resolvedAt = new Date().toISOString();
        }
        else {
            delete li.dataset.resolution;
            delete li.dataset.resolvedBy;
            delete li.dataset.resolvedAt;
        }
    };
    const snapshot = (li) => ({ state: li.dataset.state, resolution: li.dataset.resolution, by: li.dataset.resolvedBy, at: li.dataset.resolvedAt });
    const restore = (li, s) => {
        li.dataset.state = s.state;
        for (const [k, v] of [["resolution", s.resolution], ["resolvedBy", s.by], ["resolvedAt", s.at]]) {
            if (v)
                li.dataset[k] = v;
            else
                delete li.dataset[k];
        }
    };
    const primary = (li) => () => li.querySelector(".cap-row-actions button") ?? li.querySelector(".cap-row-title a");
    const change = (li, state, resolution, said, undone) => {
        const hadFocus = li.contains(document.activeElement);
        const heir = heirOf(li);
        const before = snapshot(li);
        stamp(li, state, resolution);
        renderFlag(li, ctx);
        refresh();
        order();
        emit(li);
        settle(li, hadFocus, heir);
        announce(said, {
            undo: () => {
                restore(li, before);
                renderFlag(li, ctx);
                refresh();
                order();
                emit(li);
            },
            undone,
            returnFocus: primary(li),
        });
    };
    const applyOne = (li) => {
        if (!io || !owner)
            return;
        const flag = readFlag(li);
        const text = io.getText();
        const next = applySuggestion(text, flag);
        if (next === null) {
            refresh();
            return problem("Could not apply the suggestion: the passage it replaces has changed.");
        }
        const hadFocus = li.contains(document.activeElement);
        const heir = heirOf(li);
        const before = snapshot(li);
        // Closed first, then the text: the passage is gone once replaced, and a closed flag keeps
        // what it said, so the editor's input event must not find it open and call it lost.
        stamp(li, "resolved", "applied");
        renderFlag(li, ctx);
        io.setText(next);
        refresh();
        order();
        emit(li);
        settle(li, hadFocus, heir);
        announce("Suggestion applied to the draft.", {
            undo: () => {
                const back = revertSuggestion(io.getText(), flag);
                if (back === null)
                    throw new Error("The draft has changed around that passage since. Undo the edit in the editor instead.");
                io.setText(back);
                restore(li, before);
                renderFlag(li, ctx);
                refresh();
                order();
                emit(li);
            },
            undone: "Suggestion taken back. The passage is as it was.",
            returnFocus: primary(li),
        });
    };
    // A batch rewrites the draft, so it is previewed in the shared confirm dialog and only then done.
    const applyAll = async () => {
        if (!io || !owner)
            return;
        const rows = flagRows(root);
        const todo = rows.filter((li) => li.dataset.state === "open" && li.querySelector(".cap-flag-after-text") && li.dataset.anchor === "found");
        if (todo.length === 0)
            return;
        const flags = todo.map(readFlag);
        const quoted = (s) => `“${s}”`;
        const opener = part(root, "apply-all");
        await confirm({
            title: `Apply ${todo.length} suggestion${todo.length === 1 ? "" : "s"}?`,
            lead: "This rewrites the draft. Each replacement is listed; nothing else changes.",
            body: flags.map((f) => `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`),
            action: `Apply ${todo.length} suggestion${todo.length === 1 ? "" : "s"}`,
            returnTo: part(root, "filter")?.querySelector("input:checked") ?? null,
            perform: async () => {
                const text = io.getText();
                let next = text;
                const done = [];
                flags.forEach((f, i) => {
                    const out = applySuggestion(next, f);
                    if (out !== null) {
                        next = out;
                        done.push(i);
                    }
                });
                if (done.length === 0)
                    throw new Error("None of the passages could be found any more.");
                const before = done.map((i) => snapshot(todo[i]));
                for (const i of done) {
                    stamp(todo[i], "resolved", "applied");
                    renderFlag(todo[i], ctx);
                }
                io.setText(next);
                refresh();
                order();
                for (const i of done)
                    emit(todo[i]);
                const skipped = flags.length - done.length;
                announce(`Applied ${done.length} suggestion${done.length === 1 ? "" : "s"} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`, {
                    undo: () => {
                        let back = io.getText();
                        for (const i of [...done].reverse()) {
                            const out = revertSuggestion(back, flags[i]);
                            if (out === null)
                                throw new Error("The draft has changed around those passages since. Undo the edits in the editor instead.");
                            back = out;
                        }
                        io.setText(back);
                        done.forEach((i, k) => {
                            restore(todo[i], before[k]);
                            renderFlag(todo[i], ctx);
                        });
                        refresh();
                        order();
                        for (const i of done)
                            emit(todo[i]);
                    },
                    undone: "Suggestions taken back. The passages are as they were.",
                    returnFocus: () => (opener && !opener.hidden ? opener : (part(root, "filter")?.querySelector("input:checked") ?? null)),
                });
            },
        });
    };
    const onClick = (e) => {
        const btn = e.target.closest("button[data-cap-part]");
        if (!btn || !root.contains(btn))
            return;
        const kind = btn.dataset.capPart;
        const li = btn.closest("li.cap-flag");
        if (kind === "apply-all")
            return void applyAll();
        if (!li)
            return;
        if (kind === "resolve")
            change(li, "resolved", "resolved", "Flag resolved.", "Flag reopened.");
        else if (kind === "dismiss")
            change(li, "resolved", "dismissed", "Flag dismissed.", "Flag reopened.");
        else if (kind === "reopen")
            change(li, "open", undefined, "Flag reopened.", "Flag closed again.");
        else if (kind === "apply")
            applyOne(li);
    };
    root.addEventListener("click", onClick);
    const source = root.dataset.textSource ? document.querySelector(root.dataset.textSource) : null;
    const onInput = () => refresh();
    source?.addEventListener("input", onInput);
    tally();
    if (io)
        refresh();
    return {
        refresh,
        detach() {
            root.removeEventListener("click", onClick);
            source?.removeEventListener("input", onInput);
            detachRows();
            root.removeAttribute(READY);
        },
    };
}
// Attaches to every [data-cap="flag-list"] under root not attached yet. The text the anchors are
// read against is the element named by data-text-source (a textarea's value, or an element's
// text). Returns a function that detaches them all.
export function enhance(root = document) {
    const handles = [];
    for (const el of root.querySelectorAll("[data-cap='flag-list']:not([data-cap-ready])")) {
        el.setAttribute(READY, "");
        handles.push(attachFlagList(el, ioFor(el.dataset.textSource)));
    }
    return () => handles.forEach((h) => h.detach());
}
