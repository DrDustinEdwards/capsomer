// The moderation queue's data, its pure helpers and the markup builders (moderation-queue.ts).
import { statusEl as toneStatusEl } from "../status/status.js";
export const VIEWS = ["pending", "failed", "approved", "rejected", "all"];
export const VIEW_LABEL = {
    pending: "Waiting",
    failed: "Source not found",
    approved: "Approved",
    rejected: "Rejected",
    all: "All",
};
export const STATE_LABEL = {
    unverified: "Not yet checked",
    pending: "Waiting",
    approved: "Approved",
    rejected: "Rejected",
    failed: "Source not found",
};
export const ACTIONS = ["approve", "reject", "reset"];
export const ACTION_KEY = { approve: "a", reject: "r" };
export const DELETE_KEY = "d";
// The contract refuses a decision (422) on a mention not yet checked or whose source was not found, so those have none.
const TABLE = {
    unverified: {},
    pending: { approve: "approved", reject: "rejected" },
    approved: { reject: "rejected", reset: "pending" },
    rejected: { approve: "approved", reset: "pending" },
    failed: {},
};
export function decide(state, action, reset = false) {
    if (action === "reset" && !reset)
        return null;
    return TABLE[state][action] ?? null;
}
export function actionsFor(state, reset = false) {
    return ACTIONS.filter((a) => decide(state, a, reset) !== null);
}
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
export function summaryText(c) {
    const parts = [];
    if (c.pending > 0)
        parts.push(`${c.pending} waiting`);
    if (c.unverified > 0)
        parts.push(`${c.unverified} not yet checked`);
    return parts.length ? parts.join(", ") : "Nothing waiting";
}
export function statusOf(state) {
    const word = STATE_LABEL[state];
    switch (state) {
        case "pending":
            return { tone: "info", word, glyph: "info" };
        case "approved":
            return { tone: "ok", word, glyph: "ok" };
        case "rejected":
            return { tone: "crit", word, glyph: "crit" };
        case "unverified":
            return { tone: "nodata", word, glyph: "nodata" };
        case "failed":
            return { tone: "warn", word, glyph: "warn" };
    }
}
export const ACTION_LABEL = {
    approve: "Approve",
    reject: "Reject",
    reset: "Back to waiting",
};
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
    return who.length === 1
        ? `The mention from ${who[0]} is back where it was.`
        : `${who.length} mentions are back where they were.`;
}
// The decision that puts a mention back in `from`; null where nothing can.
export function undoAction(from, reset = false) {
    if (from === "approved")
        return "approve";
    if (from === "rejected")
        return "reject";
    if (from === "pending" && reset)
        return "reset";
    return null;
}
export const NO_UNDO_TEXT = "This site cannot undo it.";
// Decisions that can still be undone, newest last; z walks back through them.
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
// What the retention sweep will remove, from the site's own counts. Waiting and approved mentions are never swept.
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
export const EMPTY_TITLE = {
    pending: "All clear",
    failed: "No missing sources",
    approved: "Nothing approved yet",
    rejected: "Nothing rejected",
    all: "No mentions yet",
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
    return toneStatusEl(s.tone, s.word, s.glyph);
}
export function actionButton(action, who, opts = {}) {
    const key = action === "delete" ? DELETE_KEY : ACTION_KEY[action];
    const label = action === "delete" ? "Delete" : ACTION_LABEL[action];
    const b = h("button", {
        type: "button",
        class: "cap-btn",
        "data-variant": action === "delete" ? "danger" : "quiet",
        "data-size": "sm",
        "data-cap-action": action,
        "aria-keyshortcuts": key,
    });
    b.append(label);
    if (!opts.bar)
        b.append(h("span", { class: "cap-sr-only" }, ` the mention from ${who}`));
    if (key)
        b.append(h("kbd", { class: "cap-kbd", "aria-hidden": "true" }, key));
    return b;
}
