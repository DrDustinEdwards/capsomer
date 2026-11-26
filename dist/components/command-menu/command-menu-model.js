// The command menu's data and pure helpers: the Command, the page and stop commands, the typed words marked, the
// recent list and the empty words (command-menu.ts has the dialog).
import { groupBy } from "../listbox/listbox.js";
import { readStored, writeStored } from "../hooks/hooks.js";
// Commands for each page of an app's menu, so the menu and the command menu list the same pages.
export function navCommands(nav, go, group = "Go to") {
    return nav.map((e) => ({
        id: `go-${e.id}`,
        label: `Go to ${e.label}`,
        group,
        keywords: e.group ? [e.group, e.label] : [e.label],
        run: () => go(e.href),
    }));
}
export function markQuery(text, query) {
    const words = [
        ...new Set(query
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 1)),
    ].sort((a, b) => b.length - a.length);
    if (!words.length)
        return [{ text, mark: false }];
    const lower = text.toLowerCase();
    const out = [];
    let at = 0;
    while (at < text.length) {
        let next = -1;
        let len = 0;
        for (const w of words) {
            const i = lower.indexOf(w, at);
            if (i >= 0 && (next < 0 || i < next || (i === next && w.length > len))) {
                next = i;
                len = w.length;
            }
        }
        if (next < 0) {
            out.push({ text: text.slice(at), mark: false });
            break;
        }
        if (next > at)
            out.push({ text: text.slice(at, next), mark: false });
        out.push({ text: text.slice(next, next + len), mark: true });
        at = next + len;
    }
    return out;
}
// The commands last run, newest first, in localStorage under `key` (ids only); shown as "Recent" while nothing is typed.
export const RECENT_MAX = 5;
export function readRecent(key) {
    try {
        const v = JSON.parse(readStored(key) ?? "[]");
        return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    }
    catch {
        return [];
    }
}
export function rememberRecent(key, id) {
    const next = [id, ...readRecent(key).filter((x) => x !== id)].slice(0, RECENT_MAX);
    writeStored(key, JSON.stringify(next));
    return next;
}
// Every way to stop something is in one group, so typing "stop" lists them all. A stop command
// only opens the control it stands for and never performs anything itself.
export const STOP_GROUP = "Stop";
export const STOP_HINTS = { reason: "asks a reason", preview: "preview first" };
// `run` must only open the control.
export function stopCommand(o) {
    return {
        id: o.id,
        label: o.label,
        group: STOP_GROUP,
        keywords: ["stop", "pause", ...(o.keywords ?? [])],
        hint: STOP_HINTS[o.ask],
        run: o.run,
    };
}
export function groupCommands(commands) {
    return groupBy(commands, (c) => c.group);
}
export function emptyText(query) {
    return `No commands match “${query.trim()}”`;
}
export const SEARCHING = "Searching…";
