// The moderation queue's behavior: a and r approve or reject the row under focus at once, with Undo (z) where the site can
// reverse it; d deletes after a confirm; x selects; j and k move. The page arrives with every row in the HTML; this adds what a
// person's action creates. The states are the site-api contract's own.
import { plural } from "@drdustinedwards/site-helpers/text";
import { confirm } from "../confirm-dialog/confirm-dialog.js";
import { toggleGroup } from "../disclosure/disclosure.js";
import { ensureRegion, say } from "../message/message.js";
import { queueKey } from "../row-list/row-list.js";
import { enhance as enhanceShortcuts, register, singleKeysOff } from "../shortcuts/shortcuts.js";
import { enhance as enhanceTime, nowFor } from "../time/time.js";
import { ACTION_KEY, DELETE_KEY, NO_UNDO_TEXT, actionsFor, countStates, decide, decidedText, mentionsWord, sweepLines, undoAction, undoStack, undoneText, } from "./moderation-queue-model.js";
import { rowsOf, listOf, rowTitleButton, visible, resetOn, deleteOn, mentionOf, paintRow, refresh, selectedRows, syncSelection, expiringRows, focusTargetAfter, focusAfter, } from "./moderation-queue-rows.js";
export { mentionOf, refresh, syncSelection } from "./moderation-queue-rows.js";
export { VIEWS, VIEW_LABEL, STATE_LABEL, ACTIONS, ACTION_KEY, DELETE_KEY, decide, actionsFor, bulkActionsFor, inView, countStates, summaryText, statusOf, ACTION_LABEL, decidedText, undoneText, undoAction, NO_UNDO_TEXT, undoStack, sweepLines, mentionsWord, EMPTY_TITLE, statusEl, actionButton, } from "./moderation-queue-model.js";
const READY = "data-cap-ready";
const contexts = new WeakMap();
function applyState(root, row, to, decidedAt) {
    row.dataset.state = to;
    if (decidedAt)
        row.dataset.decided = decidedAt;
    else
        delete row.dataset.decided;
    paintRow(root, row);
}
function undoThen(ctx, entry) {
    return () => {
        undoEntry(ctx, entry);
        const prior = ctx.stack.peek();
        if (prior)
            say(`${undoneText(entry.who)} Earlier: ${decidedText(prior.action, prior.who)}`, {
                undo: undoThen(ctx, prior),
            });
        else
            say(undoneText(entry.who));
    };
}
function undoEntry(ctx, entry) {
    const { root, stack } = ctx;
    stack.remove((e) => e === entry);
    const to = {};
    const back = [];
    for (const row of rowsOf(root)) {
        const was = entry.from[row.dataset.id ?? ""];
        if (!was)
            continue;
        to[row.dataset.id ?? ""] = was.state;
        applyState(root, row, was.state, was.decidedAt);
        back.push(row);
    }
    refresh(root);
    // Focus goes to the first mention that came back, since Undo's own button is gone by now.
    const first = back.find(visible);
    if (first)
        rowTitleButton(first)?.focus();
    root.dispatchEvent(new CustomEvent("cap:mod-undone", { bubbles: true, detail: { ids: entry.ids, to } }));
}
// Decides these rows at once and returns the ids that moved. A row the table does not allow is left alone.
export function decideRows(root, rows, action, opts = {}) {
    const ctx = contexts.get(root);
    const reset = resetOn(root);
    const moved = [];
    const from = {};
    const to = {};
    const decidedAt = new Date(nowFor(root).now).toISOString();
    // Focus is on one of these rows or on the (rebuilt) bulk button just pressed; either way it moves to the next row.
    const hadFocus = rows.some((r) => r.contains(document.activeElement)) ||
        !!root.querySelector("[data-cap='bulk-bar']")?.contains(document.activeElement);
    const target = hadFocus && opts.focus !== false ? focusTargetAfter(root, rows) : null;
    for (const row of rows) {
        const m = mentionOf(row);
        const next = decide(m.state, action, reset);
        if (!next)
            continue;
        from[m.id] = { state: m.state, decidedAt: m.decidedAt };
        to[m.id] = next;
        applyState(root, row, next, next === "pending" ? undefined : decidedAt);
        moved.push(row);
    }
    if (moved.length === 0)
        return [];
    refresh(root);
    if (hadFocus && opts.focus !== false)
        focusAfter(root, target);
    const ids = moved.map((r) => r.dataset.id ?? "");
    root.dispatchEvent(new CustomEvent("cap:mod-decided", {
        bubbles: true,
        detail: {
            ids,
            action,
            from: Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v.state])),
            to,
        },
    }));
    if (ctx && opts.announce !== false) {
        const entry = { ids, who: moved.map((r) => r.dataset.author ?? ""), action, from };
        const text = [decidedText(action, entry.who), opts.note].filter(Boolean).join(" ");
        if (Object.values(from).every((f) => undoAction(f.state, reset))) {
            ctx.stack.push(entry);
            say(text, { undo: undoThen(ctx, entry) });
        }
        else
            say(`${text} ${NO_UNDO_TEXT}`);
    }
    return ids;
}
// Delete is for good: previewed in a confirm dialog with focus on Cancel, the count typed.
async function deleteRows(root, rows) {
    if (rows.length === 0)
        return;
    const ctx = contexts.get(root);
    const ids = rows.map((r) => r.dataset.id ?? "");
    const who = rows.map((r) => r.dataset.author ?? "");
    const one = rows.length === 1;
    const target = focusTargetAfter(root, rows);
    await confirm({
        title: one ? `Delete the mention from ${who[0]}?` : `Delete ${rows.length} mentions?`,
        lead: "This cannot be undone. Reject it instead to keep it off the post and keep the record.",
        body: rows.map((r) => `From ${r.dataset.author ?? ""} (${r.dataset.host ?? ""})`),
        action: one ? "Delete the mention" : `Delete ${rows.length} mentions`,
        typeToConfirm: String(rows.length),
        returnTo: target,
        perform: async () => {
            for (const r of rows)
                r.remove();
            ctx?.stack.remove((e) => e.ids.some((id) => ids.includes(id)));
            refresh(root);
            root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids } }));
            say(one ? `Deleted the mention from ${who[0]}.` : `Deleted ${rows.length} mentions.`);
        },
    });
    if (!root.contains(document.activeElement))
        focusAfter(root, target);
}
async function sweepExpired(root) {
    const doomed = expiringRows(root);
    if (doomed.length === 0)
        return;
    const counts = countStates(doomed.map((r) => mentionOf(r)));
    const n = doomed.length;
    await confirm({
        title: `Remove ${n} expired ${mentionsWord(n)}?`,
        lead: "This cannot be undone. Nothing that is waiting or approved is touched.",
        body: sweepLines(counts),
        action: "Remove them",
        returnTo: root.querySelector("[data-cap-part='sweep']"),
        perform: async () => {
            const ids = doomed.map((r) => r.dataset.id ?? "");
            for (const r of doomed)
                r.remove();
            contexts.get(root)?.stack.remove((e) => e.ids.some((id) => ids.includes(id)));
            refresh(root);
            root.dispatchEvent(new CustomEvent("cap:mod-deleted", { bubbles: true, detail: { ids } }));
            say(`Removed ${n} expired ${mentionsWord(n)}.`);
        },
    });
}
// A decision leaves the rows it does not apply to and says so.
export async function run(root, rows, action) {
    if (action === "delete")
        return deleteOn(root) ? deleteRows(root, rows) : undefined;
    const n = rows.filter((r) => actionsFor(mentionOf(r).state, true).length === 0).length;
    const note = n > 0
        ? `${plural(n, "was", "were")} left as ${n === 1 ? "it was" : "they were"}: there is nothing to decide about a mention not yet checked or whose source was not found.`
        : undefined;
    const moved = decideRows(root, rows, action, { note });
    if (moved.length === 0 && note)
        say(note);
}
export function setView(root, view) {
    root.dataset.view = view;
    for (const box of root.querySelectorAll("[data-cap-part='select']"))
        box.checked = false;
    const radio = root.querySelector(`[data-cap-part='view'][value='${view}']`);
    if (radio && !radio.checked)
        radio.checked = true;
    refresh(root);
}
// Listed in the sheet, never run from the registry: they act on the row that has focus, inside the queue only.
export const QUEUE_SHORTCUTS = [
    { key: "j", label: "Next row" },
    { key: "k", label: "Previous row" },
    { key: "a", label: "Approve the row" },
    { key: "r", label: "Reject the row" },
    { key: "d", label: "Delete the row, after a confirm" },
    { key: "x", label: "Select the row" },
];
// Attaches to every [data-cap="moderation-queue"] under root and returns a detach function. The root is Element | Document |
// DocumentFragment, not ParentNode: under @cloudflare/workers-types an HTMLFormElement is not a ParentNode.
export function enhance(root = document) {
    const undo = [];
    for (const el of root.querySelectorAll("[data-cap='moderation-queue']")) {
        if (el.hasAttribute(READY))
            continue;
        el.setAttribute(READY, "");
        const ctx = { root: el, stack: undoStack() };
        contexts.set(el, ctx);
        enhanceTime(el);
        ensureRegion(el);
        undo.push(enhanceShortcuts(el));
        for (const s of QUEUE_SHORTCUTS)
            undo.push(register({ ...s, group: "Moderation queue", when: () => false, run: () => { } }));
        const list = listOf(el);
        const rowOf = (n) => n?.closest(".cap-mq-row") ?? null;
        const onClick = (e) => {
            const t = e.target;
            const toggle = t.closest(".cap-row-title button[aria-expanded]");
            if (toggle && el.contains(toggle))
                return toggleGroup(toggle);
            const act = t.closest("[data-cap-action]");
            if (act && el.contains(act)) {
                const action = act.dataset.capAction;
                const row = rowOf(act);
                void run(el, row ? [row] : selectedRows(el), action);
                return;
            }
            if (t.closest(".cap-bulk-clear")) {
                for (const box of el.querySelectorAll("[data-cap-part='select']"))
                    box.checked = false;
                syncSelection(el);
                (list?.querySelector(".cap-mq-row:not([hidden]) .cap-row-title button") ??
                    null)?.focus();
                return;
            }
            const sweep = t.closest("[data-cap-part='sweep']");
            if (sweep) {
                if (sweep.getAttribute("aria-disabled") !== "true")
                    void sweepExpired(el);
                return;
            }
        };
        const onChange = (e) => {
            const t = e.target;
            if (t.matches("[data-cap-part='select']"))
                syncSelection(el);
            else if (t.matches("[data-cap-part='select-all']")) {
                for (const row of rowsOf(el).filter(visible)) {
                    const box = row.querySelector("[data-cap-part='select']");
                    if (box)
                        box.checked = t.checked;
                }
                syncSelection(el);
            }
            else if (t.matches("[data-cap-part='view']"))
                setView(el, t.value);
        };
        const onKey = (e) => {
            if (!list || !queueKey(e, list))
                return;
            const key = e.key;
            if (!["a", "r", "d", "x"].includes(key))
                return;
            const row = rowOf(document.activeElement);
            if (!row || !list.contains(row) || document.querySelector("dialog:modal"))
                return;
            e.preventDefault();
            if (key === "x") {
                const box = row.querySelector("[data-cap-part='select']");
                if (box) {
                    box.checked = !box.checked;
                    syncSelection(el);
                }
                return;
            }
            // The focused row, or every selected row when the focused one is part of the selection.
            const picked = selectedRows(el);
            const rows = picked.includes(row) ? picked : [row];
            if (key === DELETE_KEY)
                return void run(el, rows, "delete");
            const action = Object.keys(ACTION_KEY).find((a) => ACTION_KEY[a] === key);
            if (!action || rows.every((r) => !decide(mentionOf(r).state, action, resetOn(el))))
                return;
            void run(el, rows, action);
        };
        // Single keys off: pressing them does nothing, so the hints and announced keys go quiet.
        const syncKeys = () => {
            const off = singleKeysOff();
            for (const b of el.querySelectorAll("[aria-keyshortcuts], [data-keys]")) {
                if (off && b.hasAttribute("aria-keyshortcuts")) {
                    b.dataset.keys = b.getAttribute("aria-keyshortcuts") ?? "";
                    b.removeAttribute("aria-keyshortcuts");
                }
                else if (!off && b.dataset.keys) {
                    b.setAttribute("aria-keyshortcuts", b.dataset.keys);
                    delete b.dataset.keys;
                }
            }
        };
        const observer = new MutationObserver(syncKeys);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-cap-single-keys"],
        });
        const reapply = new MutationObserver(() => singleKeysOff() && syncKeys());
        reapply.observe(el, { childList: true, subtree: true });
        el.addEventListener("click", onClick);
        el.addEventListener("change", onChange);
        document.addEventListener("keydown", onKey);
        refresh(el);
        undo.push(() => {
            el.removeEventListener("click", onClick);
            el.removeEventListener("change", onChange);
            document.removeEventListener("keydown", onKey);
            observer.disconnect();
            reapply.disconnect();
            contexts.delete(el);
            el.removeAttribute(READY);
        });
    }
    return () => undo.forEach((f) => f());
}
