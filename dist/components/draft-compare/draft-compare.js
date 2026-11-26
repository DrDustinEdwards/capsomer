// Draft compare: two versions of a text, compared by sentence then word. The diff (draft-compare-diff.ts) and renderer
// (draft-compare-render.ts) touch nothing at import time, so a server can use them; enhance(root) wires the behavior here.
// The HTML holds every view so a reader without script gets all of it; the bar's radios choose which shows, in CSS.
import { singleKeysOff } from "../shortcuts/shortcuts.js";
import { isTypingKey, listOwnsKeys } from "../row-list/row-list.js";
import { STORAGE_KEY, VIEWS } from "./draft-compare-render.js";
import { enhanceEach, readStored, writeStored } from "../hooks/hooks.js";
export { tokenize, commonSubsequence, diffWords, splitSentences, diffSentences, analyze, countsText, } from "./draft-compare-diff.js";
export { VIEWS, STORAGE_KEY, renderCompare } from "./draft-compare-render.js";
export { choicesOf, merged, mergePlan, startPicks } from "./draft-compare-merge.js";
export { parsePatch, patchCounts, patchCountsText, revisionPair, renderPatch, unifiedPatch, hasChanges, } from "./draft-compare-patch.js";
function readView() {
    const v = readStored(STORAGE_KEY);
    return v && VIEWS.includes(v) ? v : null;
}
function writeView(v) {
    writeStored(STORAGE_KEY, v);
}
export function currentView(root) {
    const v = root.querySelector(".cap-compare-bar input[type='radio']:checked")?.value;
    return v && VIEWS.includes(v) ? v : "side";
}
export function setView(root, view) {
    const radio = root.querySelector(`.cap-compare-bar input[type='radio'][value='${view}']`);
    if (radio)
        radio.checked = true;
}
function attach(root) {
    const live = root.querySelector("[data-cap-part='live']");
    const total = root.querySelectorAll("[data-jump]").length;
    let current = 0;
    const undo = [];
    for (const b of root.querySelectorAll("[data-cap-part='prev'], [data-cap-part='next']"))
        b.hidden = total === 0;
    const remember = root.dataset.remember !== "off";
    if (remember) {
        const stored = readView();
        if (stored)
            setView(root, stored);
    }
    const onView = (e) => {
        const t = e.target;
        if (remember && t.matches("input[type='radio']"))
            writeView(t.value);
    };
    root.querySelector(".cap-compare-bar")?.addEventListener("change", onView);
    undo.push(() => root.querySelector(".cap-compare-bar")?.removeEventListener("change", onView));
    const target = (n) => {
        const view = root.querySelector(`.cap-compare-view[data-view='${currentView(root)}']`);
        return view?.querySelector(`[data-change='${n}']`) ?? null;
    };
    const goTo = (n) => {
        if (total === 0)
            return;
        current = ((((n - 1) % total) + total) % total) + 1;
        for (const el of root.querySelectorAll("[data-change]")) {
            if (el.dataset.change === String(current))
                el.setAttribute("data-current", "");
            else
                el.removeAttribute("data-current");
        }
        for (const a of root.querySelectorAll("[data-jump]")) {
            if (a.dataset.jump === String(current))
                a.setAttribute("aria-current", "true");
            else
                a.removeAttribute("aria-current");
        }
        const el = target(current);
        if (!el)
            return;
        el.focus();
        el.scrollIntoView({ block: "center" });
        if (live)
            live.textContent = `Change ${current} of ${total}: ${el.dataset.added ?? 0} words added, ${el.dataset.removed ?? 0} removed.`;
    };
    const onClick = (e) => {
        const t = e.target;
        const link = t.closest("[data-jump]");
        if (link && root.contains(link)) {
            e.preventDefault();
            goTo(Number(link.dataset.jump));
            return;
        }
        const part = t.closest("[data-cap-part]")?.dataset.capPart;
        if (part === "next")
            goTo(current + 1);
        else if (part === "prev")
            goTo(current === 0 ? total : current - 1);
        else if (part === "expand")
            toggleAll(root);
    };
    root.addEventListener("click", onClick);
    undo.push(() => root.removeEventListener("click", onClick));
    // n and p: single keys, so they honor the page's switch for them, never act while typing,
    // and act only when focus is inside the compare or it is the page's primary one.
    const onKey = (e) => {
        if (e.defaultPrevented || (e.key !== "n" && e.key !== "p"))
            return;
        if (isTypingKey(e) || singleKeysOff() || total === 0 || !listOwnsKeys(root))
            return;
        e.preventDefault();
        if (e.key === "n")
            goTo(current + 1);
        else
            goTo(current === 0 ? total : current - 1);
    };
    document.addEventListener("keydown", onKey);
    undo.push(() => document.removeEventListener("keydown", onKey));
    // "Expand all" appears when something is folded, and says which way it will go.
    const expand = root.querySelector("[data-cap-part='expand']");
    const gaps = () => [...root.querySelectorAll("details[data-cap-part='gap']")];
    const syncExpand = () => {
        if (!expand)
            return;
        const all = gaps();
        expand.hidden = all.length === 0;
        const open = all.length > 0 && all.every((d) => d.open);
        expand.setAttribute("aria-pressed", String(open));
        expand.textContent = open ? "Collapse unchanged" : "Expand all unchanged";
    };
    syncExpand();
    root.addEventListener("toggle", syncExpand, true);
    undo.push(() => root.removeEventListener("toggle", syncExpand, true));
    return () => undo.forEach((f) => f());
}
export function toggleAll(root) {
    const gaps = [...root.querySelectorAll("details[data-cap-part='gap']")];
    const open = !gaps.every((d) => d.open);
    for (const d of gaps)
        d.open = open;
}
// Attaches to every [data-cap="draft-compare"] under root and returns a detach function. The root is Element | Document |
// DocumentFragment, not ParentNode: under @cloudflare/workers-types an HTMLFormElement is not a ParentNode.
export function enhance(root = document) {
    return enhanceEach(root, "draft-compare", attach);
}
