// The posts list's pure helpers: a post's status in words, its filters' addresses, which actions
// a person is offered and why others are withheld, and the forms the script path posts. No DOM.
import { DAY, toMs } from "../time/time.js";
import { countText, nounsOf, queryHref, } from "../content/content.js";
const utcDay = (ms) => Math.floor(ms / DAY);
// How far off a scheduled time is, in whole UTC days. Past it, the site has not published it yet.
export function inDays(at, now) {
    const t = toMs(at);
    if (!Number.isFinite(t))
        return "";
    if (t <= now)
        return "due now";
    const days = utcDay(t) - utcDay(now);
    if (days <= 0)
        return "today";
    if (days === 1)
        return "tomorrow";
    return `in ${days} days`;
}
export function contentStatus(status, publishAt = null, now = Date.now()) {
    switch (status) {
        case "published":
            return { tone: "ok", word: "Published" };
        case "scheduled":
            return publishAt
                ? { tone: "info", word: "Scheduled", when: inDays(publishAt, now) }
                : { tone: "info", word: "Scheduled" };
        case "draft":
            return { tone: "nodata", word: "Draft" };
    }
}
export function rowStatus(row, now = Date.now()) {
    const st = contentStatus(row.status, row.publishAt, now);
    if (row.status === "published" && row.scheduledUpdate)
        return { ...st, note: `update ${inDays(row.scheduledUpdate.publishAt, now)}` };
    return st.when ? { ...st, note: st.when } : st;
}
export const STATUS_TABS = [
    { status: undefined, label: "All" },
    { status: "draft", label: "Drafts" },
    { status: "scheduled", label: "Scheduled" },
    { status: "published", label: "Published" },
];
export const SORTS = [
    { value: "updated", label: "Last updated" },
    { value: "published", label: "Last published" },
    { value: "title", label: "Title" },
];
// How long a post stays in the Trash before the site deletes it for good (site-api TRASH_DAYS).
const TRASH_DAYS = 30;
export function trashLine(labels) {
    const { plural } = nounsOf(labels, "post");
    return `${plural.charAt(0).toUpperCase() + plural.slice(1)} in Trash are deleted for good ${TRASH_DAYS} days after they were moved there.`;
}
export function countLine(data, labels) {
    const counted = countText(data.rows.length, data.page.total, nounsOf(labels, "post"));
    const base = data.query?.trashed ? `${counted} in Trash` : counted;
    return data.page.sortedOnPage ? `${base}, sorted on this page only` : base;
}
export function authorLine(authors) {
    const [first, ...rest] = authors ?? [];
    if (!first)
        return "";
    return rest.length ? `By ${first} with ${rest.join(", ")}` : `By ${first}`;
}
// Filters other than the page, order and view: what the empty state says is hiding rows, and what
// Clear filters takes away.
export function filtered(q) {
    return !!(q.q || q.kind || q.tag || q.author || q.from || q.to);
}
export const NO_FILTERS = {
    q: undefined,
    kind: undefined,
    tag: undefined,
    author: undefined,
    from: undefined,
    to: undefined,
};
export function emptyWords(q, labels) {
    const { plural } = nounsOf(labels, "post");
    if (filtered(q)) {
        const dates = q.from && q.to
            ? `published ${q.from} to ${q.to}`
            : q.from
                ? `published from ${q.from}`
                : q.to
                    ? `published by ${q.to}`
                    : null;
        const what = [
            q.q ? `“${q.q}”` : null,
            q.kind ? `kind ${q.kind}` : null,
            q.tag ? `tag ${q.tag}` : null,
            q.author ? `author ${q.author}` : null,
            dates,
        ]
            .filter(Boolean)
            .join(", ");
        return {
            kind: "no-match",
            title: `No ${plural}${q.trashed ? " in Trash" : ""} match ${what}`,
        };
    }
    if (q.trashed)
        return { kind: "all-clear", title: "Trash is empty" };
    switch (q.status) {
        case "draft":
            return { kind: "nothing-yet", title: "No drafts" };
        case "scheduled":
            return { kind: "nothing-yet", title: "Nothing scheduled" };
        case "published":
            return { kind: "nothing-yet", title: "Nothing published yet" };
        default:
            return { kind: "nothing-yet", title: `No ${plural} yet` };
    }
}
const QUERY_ORDER = [
    "q",
    "status",
    "trashed",
    "kind",
    "tag",
    "author",
    "from",
    "to",
    "sort",
    "cursor",
];
export function postsHref(base, q) {
    return queryHref(base, q, QUERY_ORDER);
}
export function withFilter(q, change) {
    const next = { ...q, ...change };
    delete next.cursor;
    for (const k of Object.keys(change))
        if (change[k] === undefined)
            delete next[k];
    return next;
}
// The bulk actions this person may run here, in the bar's order, with a sentence for each one held
// back so a missing button is never a mystery. Shown only when the site offers it (data.offers)
// and the person may run it (data.can). Where the site has a Trash, Move to Trash is the normal
// way out and Delete for good is the delete role's, in the Trash only.
export function postActions(data, labels) {
    const { plural } = nounsOf(labels, "post");
    const { offers, can } = data;
    const bulk = [];
    const withheld = [];
    if (offers.trash && data.query?.trashed) {
        if (can.edit)
            bulk.push({ intent: "restore", label: "Restore" });
        if (can.deleteContent && offers.delete)
            bulk.push({ intent: "delete", label: "Delete for good", destructive: true });
        if (!can.edit)
            withheld.push(`You can read these ${plural}. Restoring them needs an editor's role.`);
        return { bulk, withheld };
    }
    if (can.edit && offers.tags)
        bulk.push({ intent: "tag-add", label: "Add tag" }, { intent: "tag-remove", label: "Remove tag" });
    if (can.edit && offers.duplicate)
        bulk.push({ intent: "duplicate", label: "Duplicate" });
    if (can.publish)
        bulk.push({ intent: "unpublish", label: "Unpublish" });
    if (can.edit && offers.trash)
        bulk.push({ intent: "trash", label: "Move to Trash" });
    else if (can.deleteContent && offers.delete)
        bulk.push({ intent: "delete", label: "Delete", destructive: true });
    if (!can.edit)
        withheld.push(`You can read these ${plural}. Changing them needs an editor's role.`);
    if (can.edit && !can.publish)
        withheld.push(`Unpublishing needs a publisher's role.`);
    return { bulk, withheld };
}
// The time a row's schedule goes out: a live post's waiting update, or a scheduled post's own.
export function scheduledTime(row) {
    if (row.status === "published")
        return row.scheduledUpdate?.publishAt ?? null;
    return row.status === "scheduled" ? row.publishAt : null;
}
// One row's menu: Edit and View on the site go somewhere; the rest post an intent for this row.
// A scheduled post or a live post's waiting update can be rescheduled (`publishAt`), and a live
// post's update canceled (`cancel-schedule`, one-way, so a danger item). A live post's Rename…
// needs a publisher, since its address changes. A post in the Trash offers only Restore and Delete for good.
export function rowActions(row, data) {
    const { offers, can } = data;
    const items = [];
    if (offers.trash && row.trashedAt) {
        if (can.edit)
            items.push({ label: "Restore", value: "restore" });
        if (can.deleteContent && offers.delete)
            items.push({ label: "Delete for good", value: "delete", danger: true });
        return items;
    }
    if (can.edit)
        items.push({ label: "Edit", value: "edit", href: row.href });
    if (row.status === "published" && row.liveHref)
        items.push({ label: "View on the site", value: "view", href: row.liveHref });
    const at = scheduledTime(row);
    const update = row.status === "published" ? row.scheduledUpdate : undefined;
    const moves = can.publish && offers.scheduledUpdates === true;
    if (update)
        items.push({ label: "View the scheduled update", value: "view-update", href: update.href });
    // Reschedule… and Cancel the update act in place with script (a dialog, a confirmation);
    // with no script they go to the page that does it: the update's own, or the editor.
    if (moves && at)
        items.push({
            label: "Reschedule…",
            value: "reschedule",
            href: update?.href ?? row.href,
            publishAt: at,
        });
    if (can.publish && row.status !== "draft")
        items.push({ label: "Unpublish", value: "unpublish" });
    if (can.edit && offers.duplicate)
        items.push({ label: "Duplicate", value: "duplicate" });
    if (can.edit && offers.rename && (row.status === "draft" || can.publish))
        items.push({ label: "Rename…", value: "rename", href: row.href });
    if (can.edit && offers.previewLinks)
        items.push({ label: "Get a preview link", value: "preview-link" });
    if (can.edit && offers.trash)
        items.push({ label: "Move to Trash", value: "trash" });
    if (moves && update)
        items.push({
            label: "Cancel the update",
            value: "cancel-schedule",
            href: update.href,
            danger: true,
        });
    if (can.deleteContent && offers.delete && !offers.trash)
        items.push({ label: "Delete", value: "delete", danger: true });
    return items;
}
