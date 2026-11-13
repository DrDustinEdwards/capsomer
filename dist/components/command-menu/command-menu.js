// The command menu: the shared dialog (components/dialog) as a palette near the top, holding a
// combobox input and the shared listbox (components/listbox) in its "input" mode: the input
// keeps focus and names the active option (aria-activedescendant). Typing filters, arrows move
// the active option, Enter runs it, Esc closes. Ctrl K, Cmd K and "/" open it, through the
// shortcut registry. Every command shows its shortcut. No framework; the React wrapper uses
// the same pure functions.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.js";
import { createListbox, filterCommands as filterItems, groupBy, matchesQuery as matches, step as stepIndex, } from "../listbox/listbox.js";
import { keysFragment, register } from "../shortcuts/shortcuts.js";
import { readStored, uid, writeStored } from "../hooks/hooks.js";
// Commands that go to each page of an app's menu ("Go to Media"), found by their group too, so
// the menu and the command menu never list different pages. `go` is the router's navigate.
export function navCommands(nav, go, group = "Go to") {
    return nav.map((e) => ({
        id: `go-${e.id}`,
        label: `Go to ${e.label}`,
        group,
        keywords: e.group ? [e.group, e.label] : [e.label],
        run: () => go(e.href),
    }));
}
// A text's pieces with the typed words marked, for a snippet: every case-insensitive match of
// a word of the query, longest words first, never overlapping.
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
// The commands a person ran last, newest first, kept per site in localStorage under `key`
// (ids only; a command no longer offered drops out). Shown, as "Recent", while nothing is typed.
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
// Every way to stop something lives in one group, so typing "stop" lists them all. A stop
// command opens the control it stands for (a switch's reason field, the confirm dialog) and
// never performs anything itself. List a stop only while there is something to stop. There is
// no "stop everything" command.
export const STOP_GROUP = "Stop";
export const STOP_HINTS = { reason: "asks a reason", preview: "preview first" };
// A stop command: group Stop, found by "stop" and "pause", its hint saying what opening it
// will ask for. `run` must only open the control.
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
// The listbox's own filtering, grouping and stepping, under the names this module has always
// exported: a case-insensitive substring over the group, the label and the keywords (so the
// name of a group finds all of it; an empty query matches all).
export const matchesQuery = matches;
export const filterCommands = filterItems;
export const step = stepIndex;
// Commands by group, in the order each group first appears.
export function groupCommands(commands) {
    return groupBy(commands, (c) => c.group);
}
export function emptyText(query) {
    return `No commands match “${query.trim()}”`;
}
// What the empty status says while a live search (the React menu's `search`) has not answered.
export const SEARCHING = "Searching…";
export const ANSWER_LABEL = "Answer this";
// Fills a snippet with its text, the typed words in <mark>; built from nodes, never from HTML.
export function markSnippet(el, query) {
    const parts = markQuery(el.textContent ?? "", query);
    el.replaceChildren(...parts.map((p) => {
        if (!p.mark)
            return document.createTextNode(p.text);
        const m = document.createElement("mark");
        m.textContent = p.text;
        return m;
    }));
}
const SEARCH_ICON = "M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z";
// Builds the dialog's markup, exactly the contract on the doc page.
export function buildMenu(commands, opts = {}) {
    const id = uid("cap-cmd");
    const d = document.createElement("dialog");
    d.className = "cap-dialog cap-cmd";
    d.dataset.cap = "command-menu";
    d.dataset.placement = "top";
    d.dataset.size = "lg";
    d.setAttribute("aria-label", "Command menu");
    const search = document.createElement("div");
    search.className = "cap-cmd-search";
    const ns = "http://www.w3.org/2000/svg";
    const icon = document.createElementNS(ns, "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("width", "16");
    icon.setAttribute("height", "16");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("fill-rule", "evenodd");
    path.setAttribute("d", SEARCH_ICON);
    icon.append(path);
    const label = document.createElement("label");
    label.className = "cap-sr-only";
    label.htmlFor = `${id}-input`;
    label.textContent = opts.label ?? "Search commands";
    const input = document.createElement("input");
    input.className = "cap-cmd-input";
    input.id = `${id}-input`;
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-controls", `${id}-list`);
    input.setAttribute("aria-autocomplete", "list");
    input.placeholder = opts.placeholder ?? "Search commands";
    search.append(icon, label, input);
    const list = document.createElement("div");
    list.className = "cap-listbox cap-cmd-list";
    list.id = `${id}-list`;
    list.dataset.controlled = "";
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-label", "Commands");
    groupCommands(commands).forEach((g, gi) => {
        const group = document.createElement("div");
        group.className = "cap-listbox-group";
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", `${id}-g${gi}`);
        const title = document.createElement("div");
        title.className = "cap-listbox-label";
        title.id = `${id}-g${gi}`;
        title.setAttribute("role", "presentation");
        title.textContent = g.group;
        group.append(title);
        for (const c of g.items) {
            const o = document.createElement("div");
            o.className = "cap-option";
            o.id = `${id}-o-${c.id}`;
            o.setAttribute("role", "option");
            o.dataset.capCommand = c.id;
            o.dataset.value = c.id;
            o.dataset.group = c.group;
            if (c.keywords?.length)
                o.dataset.keywords = c.keywords.join(",");
            const text = document.createElement("span");
            text.className = "cap-option-label";
            text.textContent = c.label;
            if (c.snippet) {
                // The filter reads the label alone, as the React menu's does.
                o.dataset.label = c.label;
                const snip = document.createElement("span");
                snip.className = "cap-cmd-snippet";
                snip.textContent = c.snippet;
                text.append(snip);
            }
            o.append(text);
            if (c.shortcut || c.hint) {
                const keys = document.createElement("span");
                keys.className = "cap-option-keys";
                if (c.hint) {
                    const sr = document.createElement("span");
                    sr.className = "cap-sr-only";
                    sr.textContent = ", ";
                    const hint = document.createElement("span");
                    hint.className = "cap-option-hint";
                    hint.textContent = c.hint;
                    keys.append(sr, hint);
                }
                if (c.shortcut) {
                    const sr = document.createElement("span");
                    sr.className = "cap-sr-only";
                    sr.textContent = ", shortcut ";
                    keys.append(sr, keysFragment(c.shortcut));
                }
                o.append(keys);
            }
            group.append(o);
        }
        list.append(group);
    });
    const empty = document.createElement("p");
    empty.className = "cap-listbox-empty";
    empty.setAttribute("role", "status");
    empty.dataset.capPart = "empty";
    const foot = document.createElement("div");
    foot.className = "cap-cmd-foot";
    foot.setAttribute("aria-hidden", "true");
    const hint = (keys, what) => {
        const s = document.createElement("span");
        keys.forEach((k, i) => {
            if (i > 0)
                s.append(" ");
            const kbd = document.createElement("kbd");
            kbd.textContent = k;
            s.append(kbd);
        });
        s.append(` ${what}`);
        return s;
    };
    foot.append(hint(["↑", "↓"], "move"), hint(["Enter"], "run"), hint(["Esc"], "close"));
    if (opts.answer)
        d.append(search, list, empty, buildAnswerBox(opts.answer.label), foot);
    else
        d.append(search, list, empty, foot);
    return d;
}
// The answer area under the list: its button, a status for a failed load, and the region.
function buildAnswerBox(label = ANSWER_LABEL) {
    const box = document.createElement("div");
    box.className = "cap-cmd-answer";
    box.dataset.capPart = "answer";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cap-btn";
    button.dataset.variant = "quiet";
    button.dataset.size = "sm";
    button.textContent = label;
    button.hidden = true;
    const status = document.createElement("p");
    status.className = "cap-cmd-answer-status";
    status.setAttribute("role", "status");
    const region = document.createElement("div");
    region.className = "cap-cmd-answer-region";
    region.tabIndex = -1;
    region.hidden = true;
    box.append(button, status, region);
    return box;
}
// Wires one menu dialog: the shared dialog's rules (Esc, the backdrop, focus handed back), the
// shared listbox over the commands (filtering, the active option, Enter, a click), and Ctrl K to
// close. `run` is called with the chosen option after the dialog has closed, and with its command
// when the option is a live result (`opts.search`).
export function attach(dialog, run, opts = {}) {
    const unwireBase = wireDialog(dialog);
    const input = dialog.querySelector("[role='combobox']");
    const list = dialog.querySelector("[role='listbox']");
    const empty = dialog.querySelector("[data-cap-part='empty']");
    if (!input || !list)
        return { open() { }, close() { }, setActive() { }, offerAnswer() { }, detach: unwireBase };
    list.dataset.controlled = "";
    // A menu written for 0.1 named keywords, group and the active option another way.
    for (const o of list.querySelectorAll("[role='option']")) {
        if (o.dataset.capKeywords && !o.dataset.keywords)
            o.dataset.keywords = o.dataset.capKeywords;
        if (o.dataset.capGroup && !o.dataset.group)
            o.dataset.group = o.dataset.capGroup;
        if (o.getAttribute("aria-selected") === "true") {
            o.removeAttribute("aria-selected");
            o.dataset.active = "";
        }
        else if (o.getAttribute("aria-selected") === "false")
            o.removeAttribute("aria-selected");
    }
    // A live search not yet answered: the list is busy, and an empty one says Searching.
    let busy = false;
    const lb = createListbox(list, {
        input,
        empty,
        homeEnd: true,
        filterInput: true,
        onFilter(count, query) {
            input.setAttribute("aria-expanded", String(count > 0));
            if (empty)
                empty.textContent = count > 0 || !query.trim() ? "" : busy ? SEARCHING : emptyText(query);
        },
    });
    list.dataset.capReady = "";
    const recentKey = opts.recentKey ?? dialog.dataset.recentKey;
    const choose = (o) => {
        if (!o)
            return;
        const typed = input.value.trim();
        dialog.close();
        if (o.dataset.capAsk !== undefined) {
            opts.ask?.run(typed);
            return;
        }
        const cmd = o.dataset.capCommand ?? "";
        if (recentKey && cmd)
            rememberRecent(recentKey, cmd);
        run(o, live.get(cmd));
    };
    // Recent (while nothing is typed: copies of the last commands run, first) and Ask (while words
    // are typed: one option, last). Rebuilt on every key, before the listbox's filter runs again.
    const extras = () => {
        for (const g of list.querySelectorAll("[data-recent], [data-ask-group]"))
            g.remove();
        const typed = input.value.trim();
        for (const s of list.querySelectorAll(".cap-cmd-snippet"))
            markSnippet(s, typed);
        if (recentKey && !typed) {
            const copies = readRecent(recentKey).flatMap((rid) => {
                const o = list.querySelector(`[role='option'][data-cap-command="${CSS.escape(rid)}"]`);
                if (!o || o.closest("[data-live]"))
                    return [];
                const copy = o.cloneNode(true);
                copy.id = `${o.id}-recent`;
                copy.dataset.group = "Recent";
                copy.hidden = false;
                delete copy.dataset.active;
                return [copy];
            });
            if (copies.length)
                list.prepend(extraGroup("Recent", "data-recent", copies));
        }
        if (opts.ask && typed) {
            const o = document.createElement("div");
            o.className = "cap-option";
            o.id = `${list.id}-ask`;
            o.setAttribute("role", "option");
            o.dataset.capAsk = "";
            o.dataset.group = "Ask";
            o.dataset.keywords = typed.toLowerCase();
            const text = document.createElement("span");
            text.className = "cap-option-label";
            text.textContent = `${opts.ask.label ?? "Ask about"} “${typed}”`;
            o.append(text);
            list.append(extraGroup("Ask", "data-ask-group", [o]));
        }
    };
    const extraGroup = (name, mark, options) => {
        const g = document.createElement("div");
        g.className = "cap-listbox-group";
        g.setAttribute("role", "group");
        g.setAttribute(mark, "");
        const title = document.createElement("div");
        title.className = "cap-listbox-label";
        title.id = `${list.id}-${mark}`;
        title.setAttribute("role", "presentation");
        title.textContent = name;
        g.setAttribute("aria-labelledby", title.id);
        g.append(title, ...options);
        return g;
    };
    const hasExtras = Boolean(recentKey || opts.ask || list.querySelector(".cap-cmd-snippet"));
    const onExtras = () => {
        extras();
        lb.filter(input.value);
    };
    // The live results: groups built as buildMenu builds them, marked data-live, after the menu's
    // own. Each keeps the query as its keyword, so the menu's filter shows it whatever its words.
    const live = new Map();
    let timer;
    let pending = null;
    const setBusy = (next) => {
        busy = next;
        if (next)
            list.setAttribute("aria-busy", "true");
        else
            list.removeAttribute("aria-busy");
    };
    const show = (commands, query) => {
        for (const g of list.querySelectorAll("[data-live]"))
            g.remove();
        live.clear();
        for (const g of buildMenu(commands).querySelectorAll(".cap-listbox-group")) {
            g.dataset.live = "";
            for (const o of g.querySelectorAll("[role='option']"))
                o.dataset.keywords = query.toLowerCase();
            list.append(g);
        }
        for (const c of commands)
            live.set(c.id, c);
        if (hasExtras || commands.some((c) => c.snippet))
            extras();
        lb.filter(input.value);
    };
    const stopSearch = () => {
        clearTimeout(timer);
        pending?.abort();
        pending = null;
    };
    const startSearch = () => {
        const ask = opts.search;
        if (!ask)
            return;
        stopSearch();
        const q = input.value.trim();
        if (!q) {
            setBusy(false);
            show([], "");
            return;
        }
        const ctrl = new AbortController();
        pending = ctrl;
        setBusy(true);
        lb.filter(input.value);
        timer = setTimeout(() => {
            ask(q, ctrl.signal).then((commands) => {
                if (ctrl.signal.aborted)
                    return;
                setBusy(false);
                show(commands, q);
            }, () => {
                if (ctrl.signal.aborted)
                    return;
                setBusy(false);
                lb.filter(input.value);
            });
        }, opts.searchDelay ?? 180);
    };
    const onClose = () => {
        stopSearch();
        setBusy(false);
    };
    // The answer under the list (opts.answer).
    const answer = opts.answer;
    const answerBox = dialog.querySelector("[data-cap-part='answer']");
    const answerButton = answerBox?.querySelector("button");
    const answerStatus = answerBox?.querySelector("[role='status']");
    const answerRegion = answerBox?.querySelector(".cap-cmd-answer-region");
    let answerRun = null;
    let answerLoading = false;
    let offered = answer?.offer ?? true;
    const showAnswerButton = () => {
        if (answerButton)
            answerButton.hidden = !(offered && !answerRun && input.value.trim());
    };
    const resetAnswer = () => {
        answerRun?.cancel();
        answerRun = null;
        answerRegion?.replaceChildren();
        if (answerRegion)
            answerRegion.hidden = true;
        if (answerStatus)
            answerStatus.textContent = "";
        offered = answer?.offer ?? true;
        showAnswerButton();
    };
    const runAnswer = async () => {
        const q = input.value.trim();
        // The button stays while the code loads, so a second press must not start a second answer.
        if (!answer || !answerRegion || !q || answerLoading || answerRun)
            return;
        answerLoading = true;
        let started;
        try {
            started = await answer.run(q, answerRegion);
        }
        catch {
            // The button stays, so the person can try again, and the status says so.
            if (answerStatus)
                answerStatus.textContent = `${answer.label ?? ANSWER_LABEL} could not load. Try again.`;
            return;
        }
        finally {
            answerLoading = false;
        }
        // The words changed or the menu closed while it loaded: this answer is for nothing shown.
        if (!dialog.open || input.value.trim() !== q) {
            started.cancel();
            answerRegion.replaceChildren();
            return;
        }
        answerRun = started;
        if (answerStatus)
            answerStatus.textContent = "";
        answerRegion.hidden = false;
        // Focus moves before the button hides: hiding a focused button drops focus to <body>, which in
        // a modal dialog leaves the person nowhere (WCAG 2.4.3).
        (answerRegion.querySelector("[tabindex='-1']") ?? answerRegion).focus();
        showAnswerButton();
    };
    const onAnswerClick = () => void runAnswer();
    // After the listbox's own input listener, so its filter has run.
    if (hasExtras)
        input.addEventListener("input", onExtras);
    if (opts.search) {
        input.addEventListener("input", startSearch);
        dialog.addEventListener("close", onClose);
    }
    if (answer) {
        input.addEventListener("input", resetAnswer);
        dialog.addEventListener("close", resetAnswer);
        answerButton?.addEventListener("click", onAnswerClick);
    }
    const onSelect = (e) => choose(e.detail.option);
    const onKey = (e) => {
        // The key that opened it closes it.
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            dialog.close();
        }
    };
    list.addEventListener("cap:option-select", onSelect);
    input.addEventListener("keydown", onKey);
    // A menu written with a query or an active option in its markup keeps them.
    const preset = lb.active();
    lb.filter(input.value);
    if (preset && !preset.hidden)
        lb.setActive(preset, { scroll: false });
    return {
        open(query = "", opener = document.activeElement) {
            if (dialog.open)
                return;
            input.value = query;
            if (answer)
                resetAnswer();
            if (hasExtras)
                extras();
            lb.filter(query);
            startSearch();
            openDialog(dialog, opener, { focus: input });
        },
        close() {
            closeDialog(dialog);
        },
        setActive: (i) => lb.setActive(i),
        offerAnswer(on) {
            offered = on;
            showAnswerButton();
        },
        detach() {
            list.removeEventListener("cap:option-select", onSelect);
            input.removeEventListener("keydown", onKey);
            input.removeEventListener("input", startSearch);
            input.removeEventListener("input", onExtras);
            dialog.removeEventListener("close", onClose);
            input.removeEventListener("input", resetAnswer);
            dialog.removeEventListener("close", resetAnswer);
            answerButton?.removeEventListener("click", onAnswerClick);
            resetAnswer();
            stopSearch();
            lb.detach();
            unwireBase();
        },
    };
}
// The menu that openCommandMenu() opens: the last one created or enhanced.
let current = null;
let unregisterKeys = null;
function ensureShortcut() {
    if (unregisterKeys)
        return;
    unregisterKeys = register({
        key: ["Mod+k", "/"],
        label: "Open the command menu",
        group: "General",
        run: () => openCommandMenu(),
    });
}
export function openCommandMenu(query = "") {
    current?.open(query);
}
// Builds a menu from a list of commands, adds it to the page, and binds Ctrl K, Cmd K and
// "/" to open it.
export function createCommandMenu(commands, opts = {}) {
    const dialog = buildMenu(commands, opts);
    document.body.append(dialog);
    const byId = new Map(commands.map((c) => [c.id, c]));
    const a = attach(dialog, (o, found) => (found ?? byId.get(o.dataset.capCommand ?? ""))?.run(), {
        search: opts.search,
        searchDelay: opts.searchDelay,
        recentKey: opts.recentKey,
        ask: opts.ask,
        answer: opts.answer,
    });
    current = a;
    ensureShortcut();
    return {
        ...a,
        dialog,
        detach() {
            a.detach();
            dialog.remove();
            if (current === a)
                current = null;
        },
    };
}
// Wires a menu written in markup: choosing an option follows its data-href, or dispatches a
// "cap-command" event (detail: { id }) on the dialog. With data-recent-key it lists recents;
// with data-ask, Ask follows data-ask-href with the words in `q`, or dispatches "cap-command"
// with { id: "ask", query }. Also wires every [data-cap-command-open] button under root, and
// binds the keys.
export function enhance(root = document) {
    const undo = [];
    for (const dialog of root.querySelectorAll("dialog.cap-cmd[data-cap='command-menu']:not([data-cap-ready])")) {
        const askHref = dialog.dataset.askHref;
        const ask = dialog.dataset.ask === undefined
            ? undefined
            : {
                label: dialog.dataset.ask || undefined,
                run: (query) => {
                    if (askHref) {
                        const url = new URL(askHref, location.href);
                        url.searchParams.set("q", query);
                        location.assign(url);
                    }
                    else
                        dialog.dispatchEvent(new CustomEvent("cap-command", { bubbles: true, detail: { id: "ask", query } }));
                },
            };
        const a = attach(dialog, (o) => {
            const href = o.dataset.href;
            if (href)
                location.assign(href);
            else
                dialog.dispatchEvent(new CustomEvent("cap-command", {
                    bubbles: true,
                    detail: { id: o.dataset.capCommand ?? o.id },
                }));
        }, { ask });
        current = a;
        undo.push(a.detach);
    }
    for (const btn of root.querySelectorAll("[data-cap-command-open]:not([data-cap-ready])")) {
        btn.dataset.capReady = "";
        const onClick = () => current?.open("", btn);
        btn.addEventListener("click", onClick);
        undo.push(() => {
            btn.removeEventListener("click", onClick);
            delete btn.dataset.capReady;
        });
    }
    ensureShortcut();
    return () => undo.forEach((f) => f());
}
