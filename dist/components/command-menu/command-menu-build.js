// The command menu's markup and its answer box: buildMenu makes exactly the contract on the doc page, startAnswer fills
// the region under the list (command-menu.ts wires them).
import { keysFragment } from "../shortcuts/shortcuts.js";
import { uid } from "../hooks/hooks.js";
import { markQuery, groupCommands } from "./command-menu-model.js";
export const ANSWER_LABEL = "Answer this";
// Starts an answer for the typed words, filling `region`. Returns null (and empties the region)
// when `wanted()` is false once the code has loaded.
export async function startAnswer(answer, query, region, wanted) {
    let run;
    try {
        run = await answer.run(query, region);
    }
    catch {
        return { failed: `${answer.label ?? ANSWER_LABEL} could not load. Try again.` };
    }
    if (!wanted()) {
        run.cancel();
        region.replaceChildren();
        return null;
    }
    return { run };
}
// Focus moves into the answer (its first focus target, or the region) before the button hides:
// hiding a focused button drops focus to <body>, which in a modal dialog leaves the person
// nowhere (WCAG 2.4.3).
export function focusAnswer(region) {
    region.hidden = false;
    (region.querySelector("[tabindex='-1']") ?? region).focus();
}
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
