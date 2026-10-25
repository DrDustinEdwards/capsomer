// The moderation queue's data, its pure helpers and the markup builders (moderation-queue.ts).
import { GLYPHS, glyphSvg } from "../message/message.js";
export const VIEWS = ["pending", "failed", "approved", "rejected", "all"];
export const VIEW_LABEL = { pending: "Waiting", failed: "Source not found", approved: "Approved", rejected: "Rejected", all: "All" };
export const STATE_LABEL = { unverified: "Not yet checked", pending: "Waiting", approved: "Approved", rejected: "Rejected", failed: "Source not found" };
export const ACTIONS = ["approve", "reject", "reset"];
// The key that decides the row under focus. Back to waiting has none: it is the rare one.
export const ACTION_KEY = { approve: "a", reject: "r" };
// The key that deletes, after a confirm.
export const DELETE_KEY = "d";
// The transition table: every state to the states a decision can reach. The contract refuses a
// decision on a mention not yet checked or whose source was not found (422), so they have none.
const TABLE = {
    unverified: {},
    pending: { approve: "approved", reject: "rejected" },
    approved: { reject: "rejected", reset: "pending" },
    rejected: { approve: "approved", reset: "pending" },
    failed: {},
};
// Where a decision takes a mention, or null where it does nothing (approving what is approved,
// deciding what cannot be decided, or Back to waiting on a site that does not offer it).
export function decide(state, action, reset = false) {
    if (action === "reset" && !reset)
        return null;
    return TABLE[state][action] ?? null;
}
// Which decisions a state offers, in the order the buttons show.
export function actionsFor(state, reset = false) {
    return ACTIONS.filter((a) => decide(state, a, reset) !== null);
}
// The decisions the bulk bar offers in a view. In All they are the two decisions; a row they do
// not apply to is left alone and said.
export function bulkActionsFor(view, reset = false) {
    if (view === "all")
        return ["approve", "reject"];
    if (view === "failed")
        return [];
    return actionsFor(view, reset);
}
export function inView(state, view) {
    return view === "all" || state === view;
}
export function countStates(items) {
    const c = { unverified: 0, pending: 0, approved: 0, rejected: 0, failed: 0, all: 0 };
    for (const m of items) {
        c[m.state] += 1;
        c.all += 1;
    }
    return c;
}
// The live line: what is left to do. "3 waiting", "3 waiting, 1 not yet checked", "Nothing
// waiting".
export function summaryText(c) {
    const parts = [];
    if (c.pending > 0)
        parts.push(`${c.pending} waiting`);
    if (c.unverified > 0)
        parts.push(`${c.unverified} not yet checked`);
    return parts.length ? parts.join(", ") : "Nothing waiting";
}
const NOTICE_GLYPH = '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>';
const NODATA_GLYPH = '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5 8h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>';
// A status is a shape, a word and a colour.
export function statusOf(state) {
    const word = STATE_LABEL[state];
    switch (state) {
        case "pending":
            return { tone: "info", word, glyph: NOTICE_GLYPH };
        case "approved":
            return { tone: "ok", word, glyph: GLYPHS.ok };
        case "rejected":
            return { tone: "crit", word, glyph: GLYPHS.failure };
        case "unverified":
            return { tone: "nodata", word, glyph: NODATA_GLYPH };
        case "failed":
            return { tone: "warn", word, glyph: GLYPHS.warning };
    }
}
export const ACTION_LABEL = { approve: "Approve", reject: "Reject", reset: "Back to waiting" };
// What a decision says: "Rejected the mention from Rosa Park."
export function decidedText(action, who) {
    const noun = who.length === 1 ? `the mention from ${who[0]}` : `${who.length} mentions`;
    switch (action) {
        case "approve":
            return `Approved ${noun}.`;
        case "reject":
            return `Rejected ${noun}.`;
        case "reset":
            return `Put ${noun} back to waiting.`;
    }
}
export function undoneText(who) {
    return who.length === 1 ? `The mention from ${who[0]} is back where it was.` : `${who.length} mentions are back where they were.`;
}
// The decision that puts a mention back in `from`: the opposite decision between approved and
// rejected, which every site has; Back to waiting for a waiting one, only where the site offers
// it. Null where nothing can.
export function undoAction(from, reset = false) {
    if (from === "approved")
        return "approve";
    if (from === "rejected")
        return "reject";
    if (from === "pending" && reset)
        return "reset";
    return null;
}
// Said after a decision on a waiting mention, on a site that cannot put one back to waiting.
export const NO_UNDO_TEXT = "This site cannot put a mention back to waiting, so there is no Undo; the other decision is one key away.";
// The decisions that can still be undone, newest last. The message region offers Undo for the
// newest; once it is done the one before is offered, so z walks back through the list.
export function undoStack(max = 20) {
    let items = [];
    return {
        push(entry) {
            items.push(entry);
            if (items.length > max)
                items = items.slice(items.length - max);
        },
        pop: () => items.pop(),
        peek: () => items[items.length - 1],
        remove(match) {
            items = items.filter((e) => !match(e));
        },
        clear() {
            items = [];
        },
        get size() {
            return items.length;
        },
    };
}
// What the retention sweep will remove, one line per kind, from the site's own counts (the
// contract's `expiring`). Waiting and approved mentions are never swept.
export function sweepLines(expiring) {
    const out = [];
    if (expiring.failed)
        out.push(`${expiring.failed} whose source was not found`);
    if (expiring.rejected)
        out.push(`${expiring.rejected} rejected`);
    return out;
}
export function mentionsWord(n) {
    return n === 1 ? "mention" : "mentions";
}
export const EMPTY_TEXT = {
    pending: { title: "All clear", text: "No mentions are waiting. Approved and rejected are one filter away." },
    failed: { title: "No missing sources", text: "Every mention's source page was found." },
    approved: { title: "Nothing approved yet", text: "Approved mentions show on their post." },
    rejected: { title: "Nothing rejected", text: "Rejected mentions wait here until the site's retention removes them." },
    all: { title: "No mentions yet", text: "When another site links to a post, its mention arrives here." },
};
export function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v === undefined || v === false)
            continue;
        el.setAttribute(k, v === true ? "" : v);
    }
    el.append(...kids);
    return el;
}
export function statusEl(state) {
    const s = statusOf(state);
    return h("span", { class: "cap-status", "data-tone": s.tone }, glyphSvg(s.glyph), s.word);
}
// A decision's button: a real button with its key shown and announced (aria-keyshortcuts).
export function actionButton(action, who, opts = {}) {
    const key = action === "delete" ? DELETE_KEY : ACTION_KEY[action];
    const label = action === "delete" ? "Delete" : ACTION_LABEL[action];
    const b = h("button", { type: "button", class: "cap-btn", "data-variant": action === "delete" ? "danger" : "quiet", "data-size": "sm", "data-cap-action": action, "aria-keyshortcuts": key });
    b.append(label);
    if (!opts.bar)
        b.append(h("span", { class: "cap-sr-only" }, ` the mention from ${who}`));
    if (key)
        b.append(h("kbd", { class: "cap-kbd", "aria-hidden": "true" }, key));
    return b;
}
