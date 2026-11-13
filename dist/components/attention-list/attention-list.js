// The attention list's behavior: the order (worst first), the two tiers (problems, then
// notices), the grouping of like rows under one row that opens in place, the cap on how
// many warnings show at once, and the buttons that show or hide what they control. No
// framework; the React wrapper uses `arrange` and the same markup.
//
// The rules are the Portal's Overview (dashboard/src/lib/derive.ts: tierOf, fold,
// attentionGroups, GROUP_CHILDREN, PROBLEM_ROWS; views/Overview.tsx: NeedsAttention),
// made generic: the Portal's own feed types and its group table are the caller's here.
import { plural } from "@drdustinedwards/site-helpers/text";
import { toggleGroup } from "../disclosure/disclosure.js";
import { attachRowList } from "../row-list/row-list.js";
// A group shows up to this many rows, then a link to the view that lists them all.
export const GROUP_CHILDREN = 5;
// Past this many problem rows the rest of the warnings wait behind "N more warnings".
// Critical rows are always shown.
export const PROBLEM_ROWS = 8;
export const TONE_ORDER = ["crit", "warn", "nodata", "info"];
export const TONE_WORD = {
    crit: "Critical",
    warn: "Warning",
    nodata: "No data",
    info: "Notice",
};
function rank(tone) {
    const r = TONE_ORDER.indexOf(tone);
    return r < 0 ? TONE_ORDER.length : r;
}
// A problem (critical or warning) needs a person; a notice (no data, a notice) is a fact
// with nothing to do now. The tier follows from the tone (audit ruling 3).
export function isNotice(tone) {
    return tone === "nodata" || tone === "info";
}
function groupTitle(key, n, info) {
    return info?.title ? info.title(n) : `${key}, ${n}`;
}
// Worst first (critical, warning, no data, notice), keeping the given order within a tone.
// Then the two tiers. In the problems, rows sharing a group key fold into one group row,
// placed where its worst row would be; a critical row is never folded, and a group of one is
// just a row. Warnings past `rows` move to `more`. In the notices a group folds into a
// single row that opens its view, not into a second disclosure.
export function arrange(items, options = {}) {
    const { rows = PROBLEM_ROWS, children = GROUP_CHILDREN, groups = {} } = options;
    const sorted = items
        .map((item, i) => ({ item, i }))
        .sort((a, b) => rank(a.item.tone) - rank(b.item.tone) || a.i - b.i)
        .map((x) => x.item);
    const problemItems = sorted.filter((it) => !isNotice(it.tone));
    const noticeItems = sorted.filter((it) => isNotice(it.tone));
    const size = new Map();
    for (const it of problemItems)
        if (it.group && it.tone !== "crit")
            size.set(it.group, (size.get(it.group) ?? 0) + 1);
    const entries = [];
    const open = new Map();
    for (const item of problemItems) {
        const n = item.group && item.tone !== "crit" ? (size.get(item.group) ?? 0) : 0;
        if (!item.group || n < 2) {
            entries.push({ kind: "row", item });
            continue;
        }
        let g = open.get(item.group);
        if (!g) {
            const info = groups[item.group];
            g = {
                kind: "group",
                key: item.group,
                label: groupTitle(item.group, n, info),
                detail: info?.detail,
                when: info?.when ?? item.when,
                tone: item.tone,
                items: [],
                total: n,
                view: info?.view,
            };
            open.set(item.group, g);
            entries.push(g);
        }
        if (g.items.length < children)
            g.items.push(item);
    }
    const crit = entries.filter((e) => (e.kind === "row" ? e.item.tone : e.tone) === "crit");
    const warn = entries.filter((e) => (e.kind === "row" ? e.item.tone : e.tone) !== "crit");
    const room = Math.max(0, rows - crit.length);
    const hidden = warn.length > room ? warn.slice(room) : [];
    const problems = [...crit, ...(hidden.length ? warn.slice(0, room) : warn)];
    const noticeSize = new Map();
    for (const it of noticeItems)
        if (it.group)
            noticeSize.set(it.group, (noticeSize.get(it.group) ?? 0) + 1);
    const notices = [];
    const folded = new Set();
    for (const item of noticeItems) {
        const n = item.group ? (noticeSize.get(item.group) ?? 0) : 0;
        if (!item.group || n < 2) {
            notices.push(item);
            continue;
        }
        if (folded.has(item.group))
            continue;
        folded.add(item.group);
        const info = groups[item.group];
        notices.push({
            id: `group:${item.group}`,
            tone: item.tone,
            title: groupTitle(item.group, n, info),
            detail: info?.detail ?? item.detail,
            when: info?.when ?? item.when,
            href: info?.view?.href ?? item.href,
        });
    }
    return { problems, more: hidden, notices, noticeCount: noticeItems.length };
}
// The sentence in the header: "3 problems", "no problems".
export function problemCount(a) {
    const n = a.problems.length + a.more.length;
    return n ? plural(n, "problem") : "No problems";
}
// "All 7 in CI and merges" when the group holds more than it shows, else "Open CI and merges".
export function viewLinkText(g) {
    return g.view
        ? g.total > g.items.length
            ? `All ${g.total} in ${g.view.label}`
            : `Open ${g.view.label}`
        : "";
}
// Attaches to every [data-cap="attention-list"] under root that is not attached yet: the
// buttons that open and close, and j and k on the list (row-list's, attached here so one
// call is enough). Returns a function that detaches them all.
export function enhance(root = document) {
    const undo = [];
    for (const list of root.querySelectorAll("[data-cap='attention-list']:not([data-cap-ready])")) {
        list.dataset.capReady = "";
        const onClick = (e) => {
            const button = e.target.closest("button[aria-expanded][aria-controls]");
            if (button && list.contains(button))
                toggleGroup(button);
        };
        list.addEventListener("click", onClick);
        undo.push(() => {
            list.removeEventListener("click", onClick);
            delete list.dataset.capReady;
        });
        for (const rows of list.querySelectorAll("[data-cap='row-list']"))
            undo.push(attachRowList(rows));
    }
    return () => undo.forEach((f) => f());
}
export const URGENCY_ORDER = ["blocking", "waiting"];
export const URGENCY_TITLE = {
    blocking: "Blocking",
    waiting: "Waiting for you",
};
// The needs a view shows: "later" the ones set aside, "all" every one that is not, and a group
// name that group's ones that are not.
export function needsShown(needs, show) {
    return needs.filter((n) => show === "later"
        ? n.later !== undefined
        : n.later === undefined && (show === "all" || n.group === show));
}
// The needs in a count (a header badge, a tab's number): every one not set aside.
export function needCount(needs) {
    return needs.filter((n) => n.later === undefined).length;
}
// Moves focus off a row that is about to leave the list: to the next row's title, else the
// previous one's, else the current filter tab in the same panel, so a keyboard user keeps their
// place.
export function focusNeighbor(row, rowSelector = ".cap-need-row") {
    const list = row.closest(".cap-rows");
    const rows = list ? Array.from(list.querySelectorAll(rowSelector)) : [];
    const at = rows.indexOf(row);
    const next = rows[at + 1] ?? rows[at - 1];
    const target = next?.querySelector(".cap-row-title :is(a, button)") ??
        row.closest(".cap-panel")?.querySelector("[aria-current='page']");
    target?.focus();
}
const SEVERITY_ORDER = ["needs-you", "failing", "none"];
// The worst severity of a set of items: needs-you when any waits on a person, failing when only
// a machine fault is open, none when there are none. Needs-you wins, because only a person can
// clear it.
export function severityOf(items, waitsOnPerson) {
    const waits = typeof waitsOnPerson === "function" ? waitsOnPerson : (k) => waitsOnPerson.has(k);
    if (items.some((i) => waits(i.kind)))
        return "needs-you";
    return items.length > 0 ? "failing" : "none";
}
// The worst of several severities (an inbox's, from its apps').
export function worstSeverity(severities) {
    return SEVERITY_ORDER.find((s) => severities.includes(s)) ?? "none";
}
// The admin shell's badge tone for a severity: violet "need", red "crit", or none.
export function severityTone(s) {
    return s === "needs-you" ? "need" : s === "failing" ? "crit" : undefined;
}
