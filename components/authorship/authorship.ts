// Authorship marks: who wrote each passage of a text, shown or hidden by one switch.
//
// A passage is a "run" (`.cap-run` with data-kind "you", "ai" or "quoted"). This module has the
// pure counting (countWords, summarise, summaryText, summaryHtml: safe on a server and in node's
// test runner) and the behaviour (enhance: the switch, the remembered choice, the summary).

import { countWords } from "../draft-compare/draft-compare.ts";
import { syncWord } from "../switch/switch.ts";

export type Kind = "you" | "ai" | "quoted";
export const KINDS: readonly Kind[] = ["you", "ai", "quoted"];

// What each kind is called in the summary line, and on a run's label.
export const KIND_WORD: Record<Kind, string> = { you: "you", ai: "AI", quoted: "quoted" };
export const KIND_LABEL: Record<Kind, string> = { you: "You", ai: "AI", quoted: "Quoted" };

export { countWords };

export interface RunInput {
  kind: Kind;
  // Either the words already counted, or the text to count.
  words?: number;
  text?: string;
}

export interface Share {
  kind: Kind;
  words: number;
  // A whole number; the three always add up to 100 (largest remainder), 0 when nothing is marked.
  percent: number;
}

export interface Summary {
  total: number;
  // All three kinds, in the order you, AI, quoted.
  shares: Share[];
  // "62% you, 31% AI, 7% quoted by words": kinds with no words are left out.
  text: string;
}

// Word counts per kind, as percentages that add up to 100, and the sentence that says them.
export function summarise(runs: readonly RunInput[]): Summary {
  const words: Record<Kind, number> = { you: 0, ai: 0, quoted: 0 };
  for (const r of runs) {
    if (!(r.kind in words)) continue;
    words[r.kind] += r.words ?? countWords(r.text ?? "");
  }
  const total = words.you + words.ai + words.quoted;
  // Largest remainder: floor every share, then give the spare points to the biggest remainders.
  const raw = KINDS.map((kind) => ({ kind, exact: total === 0 ? 0 : (words[kind] / total) * 100 }));
  const floors = raw.map((r) => Math.floor(r.exact));
  let spare = total === 0 ? 0 : 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rem: r.exact - Math.floor(r.exact) })).sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const o of order) {
    if (spare <= 0) break;
    floors[o.i] = (floors[o.i] ?? 0) + 1;
    spare--;
  }
  const shares: Share[] = KINDS.map((kind, i) => ({ kind, words: words[kind], percent: floors[i] ?? 0 }));
  return { total, shares, text: summaryText(shares) };
}

export function summaryText(shares: Share[]): string {
  const shown = shares.filter((s) => s.words > 0);
  if (shown.length === 0) return "No marked passages";
  return `${shown.map((s) => `${s.percent}% ${KIND_WORD[s.kind]}`).join(", ")} by words`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// The summary as html, for a server to write: the line, the bar (drawn by enhance, which sets
// each segment's width), and the word counts in text.
export function summaryHtml(summary: Summary, label = "Authorship"): string {
  const segs = summary.shares.map((s) => `<span class="cap-authorship-seg" data-kind="${s.kind}" data-share="${s.percent}"></span>`).join("");
  const notes = summary.shares
    .filter((s) => s.words > 0)
    .map((s) => `<span>${KIND_LABEL[s.kind]}: ${s.words.toLocaleString("en")} ${s.words === 1 ? "word" : "words"}</span>`)
    .join("");
  return `<div class="cap-meter cap-authorship-summary" data-cap-part="summary"><span class="cap-meter-label">${esc(label)}</span><span class="cap-meter-value" data-cap-part="text">${esc(summary.text)}</span><span class="cap-meter-bar" aria-hidden="true">${segs}</span><span class="cap-meter-note" data-cap-part="notes">${notes}</span></div>`;
}

// ---------------------------------------------------------------------------------------
// The behaviour
// ---------------------------------------------------------------------------------------

export const STORAGE_KEY = "cap-authorship";
const READY = "data-cap-ready";

function stored(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "on" ? true : v === "off" ? false : null;
  } catch {
    return null;
  }
}

function remember(shown: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, shown ? "on" : "off");
  } catch {
    // Private windows and blocked storage: the choice is just not remembered.
  }
}

// Every run's words, counted once: text inside a run belongs to the nearest run around it, a
// label never counts, and text outside any run is not marked so it is left out.
export function collectRuns(root: Element): RunInput[] {
  const totals = new Map<Element, number>();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = (n as Text).parentElement;
    if (!parent || parent.closest(".cap-run-label, .cap-authorship-bar")) continue;
    const run = parent.closest(".cap-run");
    if (!run || !root.contains(run)) continue;
    totals.set(run, (totals.get(run) ?? 0) + countWords(n.textContent ?? ""));
  }
  const out: RunInput[] = [];
  for (const [run, words] of totals) {
    const kind = (run as HTMLElement).dataset.kind as Kind | undefined;
    if (kind && KINDS.includes(kind)) out.push({ kind, words });
  }
  return out;
}

// Draws the summary's bar: each segment's share of the width, through the CSSOM so apps keep
// style-src 'self'.
function drawBar(summary: Element, shares: Share[]): void {
  for (const seg of summary.querySelectorAll<HTMLElement>(".cap-authorship-seg")) {
    const share = shares.find((s) => s.kind === seg.dataset.kind);
    seg.dataset.share = String(share?.percent ?? 0);
    seg.style.setProperty("--cap-share", String(share?.percent ?? 0));
  }
}

// Counts the runs inside root and rewrites its summary (the line, the word counts, the bar).
export function refresh(root: Element): Summary {
  const summary = summarise(collectRuns(root));
  const el = root.querySelector<HTMLElement>("[data-cap-part='summary']");
  if (el) {
    const line = el.querySelector("[data-cap-part='text']");
    if (line) line.textContent = summary.text;
    const notes = el.querySelector("[data-cap-part='notes']");
    if (notes) {
      notes.replaceChildren(
        ...summary.shares
          .filter((s) => s.words > 0)
          .map((s) => {
            const span = document.createElement("span");
            span.textContent = `${KIND_LABEL[s.kind]}: ${s.words.toLocaleString("en")} ${s.words === 1 ? "word" : "words"}`;
            return span;
          }),
      );
    }
    drawBar(el, summary.shares);
  }
  return summary;
}

export function isShown(root: Element): boolean {
  return root.getAttribute("data-authorship") !== "off";
}

// Shows or hides the marks: data-authorship on the container, the switch to match. With
// `persist` (the default, unless the container says data-remember="off") the choice is kept.
export function setShown(root: HTMLElement, shown: boolean, persist = root.dataset.remember !== "off"): void {
  root.setAttribute("data-authorship", shown ? "on" : "off");
  const input = root.querySelector<HTMLInputElement>(".cap-authorship-bar input[role='switch']");
  if (input && input.checked !== shown) input.checked = shown;
  const label = input?.closest("label");
  if (label) syncWord(label);
  if (persist) remember(shown);
}

function attach(root: HTMLElement): () => void {
  const input = root.querySelector<HTMLInputElement>(".cap-authorship-bar input[role='switch']");
  const keep = root.dataset.remember !== "off";
  const was = keep ? stored() : null;
  if (was !== null) setShown(root, was, false);
  else if (input) setShown(root, input.checked && isShown(root), false);
  refresh(root);
  const onChange = () => input && setShown(root, input.checked);
  input?.addEventListener("change", onChange);
  return () => input?.removeEventListener("change", onChange);
}

// Attaches to every [data-cap="authorship"] under root (or root itself) not yet attached:
// applies the remembered choice, wires the switch, and counts the summary. Returns a function
// that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const found = [...root.querySelectorAll<HTMLElement>("[data-cap='authorship']:not([data-cap-ready])")];
  if (root instanceof HTMLElement && root.matches("[data-cap='authorship']:not([data-cap-ready])")) found.unshift(root);
  const undo: Array<() => void> = [];
  for (const el of found) {
    el.setAttribute(READY, "");
    const off = attach(el);
    undo.push(() => {
      off();
      el.removeAttribute(READY);
    });
  }
  return () => undo.forEach((f) => f());
}
