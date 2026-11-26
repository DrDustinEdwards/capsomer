// The command menu: the shared dialog as a palette over a combobox input and the shared listbox
// in "input" mode (focus stays in the input; aria-activedescendant names the active option).
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.js";
import { createListbox } from "../listbox/listbox.js";
import { register } from "../shortcuts/shortcuts.js";
import { readRecent, rememberRecent, emptyText, SEARCHING, } from "./command-menu-model.js";
import { startAnswer, focusAnswer, markSnippet, buildMenu, } from "./command-menu-build.js";
export { ANSWER_LABEL, startAnswer, focusAnswer, markSnippet, buildMenu, } from "./command-menu-build.js";
export { navCommands, markQuery, RECENT_MAX, readRecent, rememberRecent, STOP_GROUP, STOP_HINTS, stopCommand, groupCommands, emptyText, SEARCHING, } from "./command-menu-model.js";
// Wires one menu dialog on the shared dialog and listbox. `run` is called with the chosen option
// after the dialog has closed.
export function attach(dialog, run, opts = {}) {
    const unwireBase = wireDialog(dialog);
    const input = dialog.querySelector("[role='combobox']");
    const list = dialog.querySelector("[role='listbox']");
    const empty = dialog.querySelector("[data-cap-part='empty']");
    if (!input || !list)
        return { open() { }, close() { }, setActive() { }, offerAnswer() { }, detach: unwireBase };
    list.dataset.controlled = "";
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
    // Recent (nothing typed) and Ask (words typed), rebuilt on every key before the listbox filters.
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
    // Live results keep the query as their keyword, so the filter shows them whatever their words.
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
        const got = await startAnswer(answer, q, answerRegion, () => dialog.open && input.value.trim() === q);
        answerLoading = false;
        if (!got)
            return;
        if ("failed" in got) {
            if (answerStatus)
                answerStatus.textContent = got.failed;
            return;
        }
        answerRun = got.run;
        if (answerStatus)
            answerStatus.textContent = "";
        focusAnswer(answerRegion);
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
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            dialog.close();
        }
    };
    list.addEventListener("cap:option-select", onSelect);
    input.addEventListener("keydown", onKey);
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
let current = null;
let unregisterKeys = null;
function release(a) {
    a.detach();
    if (current === a)
        current = null;
}
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
            release(a);
            dialog.remove();
        },
    };
}
// Wires a menu written in markup: a choice follows its data-href or dispatches "cap-command" ({ id })
// on the dialog; data-recent-key and data-ask enable Recent and Ask.
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
        undo.push(() => release(a));
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
