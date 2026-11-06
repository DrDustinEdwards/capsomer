// The mentions list's pure helpers: the addresses of its tabs and pages, which view it opens on,
// which actions a person is offered here and why the others are withheld, the count and the empty
// state. The states, their words and the decisions are the moderation queue's (moderation-queue.ts),
// which the list is built from. No DOM; the React component and a server render use the same
// functions.
import { queryHref } from "../content/content.js";
import { EMPTY_TEXT, VIEWS, bulkActionsFor, mentionsWord } from "../moderation-queue/moderation-queue.js";
// ---------------------------------------------------------------------------------------
// Addresses.
const QUERY_ORDER = ["view", "cursor", "open"];
// The list's address with a query (content.ts, queryHref).
export function mentionsHref(base, q) {
    return queryHref(base, q, QUERY_ORDER);
}
// A tab change starts again at the first page with nothing open; opening a mention keeps the
// page it is on.
export function withMentions(q, change) {
    const next = { ...q, ...change };
    if (!("open" in change)) {
        delete next.cursor;
        delete next.open;
    }
    for (const k of Object.keys(change))
        if (change[k] === undefined)
            delete next[k];
    return next;
}
// The tab shown: the one asked for, else Waiting, else All when nothing waits (Carrel and
// dustinedwards.info already agree on this).
export function currentView(data) {
    const v = data.query.view;
    if (v && VIEWS.includes(v))
        return v;
    return data.counts.pending > 0 ? "pending" : "all";
}
const BULK_LABEL = { approve: "Approve", reject: "Reject", reset: "Back to waiting", delete: "Delete" };
// The bulk actions this person may run on this tab of this site, in the bar's order, and a
// sentence for each one held back.
export function mentionActions(data) {
    const { offers, can } = data;
    const view = currentView(data);
    const bulk = [];
    const withheld = [];
    if (can.decideMentions)
        for (const a of bulkActionsFor(view, offers.reset))
            bulk.push({ intent: a, label: BULK_LABEL[a] });
    if (can.decideMentions && offers.delete)
        bulk.push({ intent: "delete", label: "Delete", destructive: true });
    if (!can.decideMentions)
        withheld.push("You can read these mentions. Deciding them needs the site owner's role.");
    else {
        if (!offers.delete)
            withheld.push("Delete is not offered: this site keeps every mention. Reject one to keep it off its post.");
        if (!offers.reset)
            withheld.push("Back to waiting is not offered by this site, so a decision on a waiting mention has no Undo.");
    }
    return { bulk, withheld };
}
// ---------------------------------------------------------------------------------------
// Words.
// "4 mentions", "Showing 50 of 212 mentions".
export function countLine(data) {
    const n = data.rows.length;
    const total = data.counts[currentView(data)];
    return total > n ? `Showing ${n} of ${total} ${mentionsWord(total)}` : `${n} ${mentionsWord(n)}`;
}
export function emptyWords(view) {
    return { kind: view === "pending" ? "all-clear" : "nothing-yet", ...EMPTY_TEXT[view] };
}
// The sweep's button: "Remove 3 expired".
export function sweepLabel(expiring) {
    const n = expiring.failed + expiring.rejected;
    return { n, label: `Remove ${n} expired` };
}
// The kit's query from the list's address: the list names its tab `view`, the kit's filter is `status`.
// The host hands the answer to site-api's readMentionsQuery.
export function kitMentionsSearch(search) {
    const view = search.get("view");
    const cursor = search.get("cursor");
    return new URLSearchParams({ ...(view ? { status: view } : {}), ...(cursor ? { cursor } : {}) });
}
// The kit's page as the list renders it: each mention in the queue's words (the sender's name, the
// source's host as text, never a link), the counts with All, and what the site offers. Carrel and
// each site's own admin draw the same page from it.
export function mentionsDataOfKit(kit, search) {
    const open = search.get("open");
    const view = VIEWS.includes(kit.filter) ? kit.filter : "all";
    return {
        site: { name: kit.site.name },
        query: { view, ...(kit.query.cursor ? { cursor: kit.query.cursor } : {}), ...(open ? { open } : {}) },
        rows: kit.rows.map((m) => ({
            id: m.id,
            author: m.authorName ?? "An unnamed sender",
            host: URL.canParse(m.sourceUrl) ? new URL(m.sourceUrl).host : m.sourceUrl,
            url: m.sourceUrl,
            excerpt: m.excerpt ?? "",
            post: m.targetId,
            postHref: m.postHref,
            at: m.receivedAt,
            state: m.status,
            ...(m.decidedAt ? { decidedAt: m.decidedAt } : {}),
            ...(m.failureReason ? { failureReason: m.failureReason } : {}),
            version: m.version,
        })),
        page: kit.page,
        counts: { ...kit.counts, all: Object.values(kit.counts).reduce((a, b) => a + b, 0) },
        expiring: kit.expiring,
        offers: { reset: kit.offers.reset, delete: true, sweep: true },
        can: kit.can,
    };
}
