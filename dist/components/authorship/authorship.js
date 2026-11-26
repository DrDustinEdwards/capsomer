// Authorship marks: who wrote each passage of a text, shown or hidden by one switch. A passage is a
// "run" (`.cap-run` with data-kind "you", "ai" or "quoted"). Counting is pure (safe on a server and in
// node's test runner); `enhance` adds the switch, the remembered choice and the summary.
import { escapeHtml as esc } from "@dustinedwards/site-runtime/html";
import { wordCount } from "@drdustinedwards/site-helpers/text";
import { syncWord } from "../switch/switch.js";
import { enhanceEach, readStored, writeStored } from "../hooks/hooks.js";
export const KINDS = ["you", "ai", "quoted"];
export const KIND_WORD = { you: "you", ai: "AI", quoted: "quoted" };
export const KIND_LABEL = { you: "You", ai: "AI", quoted: "Quoted" };
export function summarize(runs) {
    const words = { you: 0, ai: 0, quoted: 0 };
    for (const r of runs) {
        if (!(r.kind in words))
            continue;
        words[r.kind] += r.words ?? wordCount(r.text ?? "");
    }
    const total = words.you + words.ai + words.quoted;
    const raw = KINDS.map((kind) => ({ kind, exact: total === 0 ? 0 : (words[kind] / total) * 100 }));
    const floors = raw.map((r) => Math.floor(r.exact));
    let spare = total === 0 ? 0 : 100 - floors.reduce((a, b) => a + b, 0);
    const order = raw
        .map((r, i) => ({ i, rem: r.exact - Math.floor(r.exact) }))
        .sort((a, b) => b.rem - a.rem || a.i - b.i);
    for (const o of order) {
        if (spare <= 0)
            break;
        floors[o.i] = (floors[o.i] ?? 0) + 1;
        spare--;
    }
    const shares = KINDS.map((kind, i) => ({
        kind,
        words: words[kind],
        percent: floors[i] ?? 0,
    }));
    return { total, shares, text: summaryText(shares) };
}
export function summaryText(shares) {
    const shown = shares.filter((s) => s.words > 0);
    if (shown.length === 0)
        return "No marked passages";
    return `${shown.map((s) => `${s.percent}% ${KIND_WORD[s.kind]}`).join(", ")} by words`;
}
// The summary as html, for a server to write; `enhance` draws the bar and sets each segment's width.
export function summaryHtml(summary, label = "Authorship") {
    const segs = summary.shares
        .map((s) => `<span class="cap-authorship-seg" data-kind="${s.kind}" data-share="${s.percent}"></span>`)
        .join("");
    const notes = summary.shares
        .filter((s) => s.words > 0)
        .map((s) => `<span>${KIND_LABEL[s.kind]}: ${s.words.toLocaleString("en")} ${s.words === 1 ? "word" : "words"}</span>`)
        .join("");
    return `<div class="cap-meter cap-authorship-summary" data-cap-part="summary"><span class="cap-meter-label">${esc(label)}</span><span class="cap-meter-value" data-cap-part="text">${esc(summary.text)}</span><span class="cap-meter-bar" aria-hidden="true">${segs}</span><span class="cap-meter-note" data-cap-part="notes">${notes}</span></div>`;
}
export const STORAGE_KEY = "cap-authorship";
function stored() {
    const v = readStored(STORAGE_KEY);
    return v === "on" ? true : v === "off" ? false : null;
}
function remember(shown) {
    writeStored(STORAGE_KEY, shown ? "on" : "off");
}
// Every run's words, counted once: text inside a run belongs to the nearest run around it, a label
// never counts, and text outside any run is left out.
export function collectRuns(root) {
    const totals = new Map();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const parent = n.parentElement;
        if (!parent || parent.closest(".cap-run-label, .cap-authorship-bar"))
            continue;
        const run = parent.closest(".cap-run");
        if (!run || !root.contains(run))
            continue;
        totals.set(run, (totals.get(run) ?? 0) + wordCount(n.textContent ?? ""));
    }
    const out = [];
    for (const [run, words] of totals) {
        const kind = run.dataset.kind;
        if (kind && KINDS.includes(kind))
            out.push({ kind, words });
    }
    return out;
}
// Draws the summary's bar through the CSSOM so apps keep style-src 'self'.
function drawBar(summary, shares) {
    for (const seg of summary.querySelectorAll(".cap-authorship-seg")) {
        const share = shares.find((s) => s.kind === seg.dataset.kind);
        seg.dataset.share = String(share?.percent ?? 0);
        seg.style.setProperty("--cap-share", String(share?.percent ?? 0));
    }
}
export function refresh(root) {
    const summary = summarize(collectRuns(root));
    const el = root.querySelector("[data-cap-part='summary']");
    if (el) {
        const line = el.querySelector("[data-cap-part='text']");
        if (line)
            line.textContent = summary.text;
        const notes = el.querySelector("[data-cap-part='notes']");
        if (notes) {
            notes.replaceChildren(...summary.shares
                .filter((s) => s.words > 0)
                .map((s) => {
                const span = document.createElement("span");
                span.textContent = `${KIND_LABEL[s.kind]}: ${s.words.toLocaleString("en")} ${s.words === 1 ? "word" : "words"}`;
                return span;
            }));
        }
        drawBar(el, summary.shares);
    }
    return summary;
}
export function isShown(root) {
    return root.getAttribute("data-authorship") !== "off";
}
// Shows or hides the marks. With `persist` (default, unless data-remember="off") the choice is kept.
export function setShown(root, shown, persist = root.dataset.remember !== "off") {
    root.setAttribute("data-authorship", shown ? "on" : "off");
    const input = root.querySelector(".cap-authorship-bar input[role='switch']");
    if (input && input.checked !== shown)
        input.checked = shown;
    const label = input?.closest("label");
    if (label)
        syncWord(label);
    if (persist)
        remember(shown);
}
function attach(root) {
    const input = root.querySelector(".cap-authorship-bar input[role='switch']");
    const keep = root.dataset.remember !== "off";
    const was = keep ? stored() : null;
    if (was !== null)
        setShown(root, was, false);
    else if (input)
        setShown(root, input.checked && isShown(root), false);
    refresh(root);
    const onChange = () => input && setShown(root, input.checked);
    input?.addEventListener("change", onChange);
    return () => input?.removeEventListener("change", onChange);
}
// Attaches to every [data-cap="authorship"] under root not yet attached. Returns a detach function.
export function enhance(root = document) {
    return enhanceEach(root, "authorship", attach);
}
