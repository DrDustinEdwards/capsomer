// Draft compare: two versions of a text, compared by sentence and then by word.
//
// Three parts, all plain TypeScript with no framework and nothing that touches the page at
// import time, so a server (or node's test runner) can use the first two:
//   1. the diff:      diffWords, diffSentences, splitSentences, analyze (draft-compare-diff.ts)
//   2. the renderer:  renderCompare(before, after, options) returns the HTML string
//                     (draft-compare-render.ts; renderPatch, for a git patch, in draft-compare-patch.ts)
//   3. the behavior: enhance(root) wires the jump keys, the view memory and "expand all" (here)
//
// The HTML holds every view (side by side, inline, changes only) so a reader without script
// still gets all of it; the radios in the bar choose which one shows, in CSS.

import { singleKeysOff } from "../row-list/row-list.ts";
import { type CompareView, STORAGE_KEY, VIEWS } from "./draft-compare-render.ts";

export { tokenize, countWords, commonSubsequence, diffWords, splitSentences, diffSentences, analyze, analyse, countsText } from "./draft-compare-diff.ts"; // codespell:ignore
export type { Op, WordPart, DiffOptions, Sentence, Entry, SentenceOptions, Counts, Analysis } from "./draft-compare-diff.ts";
export { VIEWS, STORAGE_KEY, esc, renderCompare } from "./draft-compare-render.ts";
export type { CompareView, CompareSide, RunKind, RunSpan, CompareLabels, CompareOptions } from "./draft-compare-render.ts";
export { parsePatch, patchCounts, patchCountsText, revisionPair, renderPatch } from "./draft-compare-patch.ts";
export type { PatchOp, PatchLine, PatchHunk, PatchFile, PatchOptions, PatchCounts } from "./draft-compare-patch.ts";

// ---------------------------------------------------------------------------------------
// The behavior
// ---------------------------------------------------------------------------------------

const READY = "data-cap-ready";

function readView(): CompareView | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : null;
  } catch {
    return null;
  }
}

function writeView(v: CompareView): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Private windows and blocked storage: the choice simply is not remembered.
  }
}

// The view the radios show now.
export function currentView(root: Element): CompareView {
  const v = root.querySelector<HTMLInputElement>(".cap-compare-bar input[type='radio']:checked")?.value;
  return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : "side";
}

// Chooses a view (the radio the CSS reads). Fires no event.
export function setView(root: Element, view: CompareView): void {
  const radio = root.querySelector<HTMLInputElement>(`.cap-compare-bar input[type='radio'][value='${view}']`);
  if (radio) radio.checked = true;
}

const isTextEntry = (e: KeyboardEvent): boolean => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return true;
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  if (t.isContentEditable || /^(TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role='combobox'], [role='textbox']")) return true;
  return t.tagName === "INPUT" && !/^(radio|checkbox|button)$/.test((t as HTMLInputElement).type);
};

function attach(root: HTMLElement): () => void {
  const live = root.querySelector<HTMLElement>("[data-cap-part='live']");
  const total = root.querySelectorAll<HTMLElement>("[data-jump]").length;
  let current = 0;
  const undo: Array<() => void> = [];

  for (const b of root.querySelectorAll<HTMLElement>("[data-cap-part='prev'], [data-cap-part='next']")) b.hidden = total === 0;

  // The remembered view.
  const remember = root.dataset.remember !== "off";
  if (remember) {
    const stored = readView();
    if (stored) setView(root, stored);
  }
  const onView = (e: Event) => {
    const t = e.target as HTMLInputElement;
    if (remember && t.matches("input[type='radio']")) writeView(t.value as CompareView);
  };
  root.querySelector(".cap-compare-bar")?.addEventListener("change", onView);
  undo.push(() => root.querySelector(".cap-compare-bar")?.removeEventListener("change", onView));

  const target = (n: number): HTMLElement | null => {
    const view = root.querySelector<HTMLElement>(`.cap-compare-view[data-view='${currentView(root)}']`);
    return view?.querySelector<HTMLElement>(`[data-change='${n}']`) ?? null;
  };

  const goTo = (n: number) => {
    if (total === 0) return;
    current = ((((n - 1) % total) + total) % total) + 1;
    for (const el of root.querySelectorAll<HTMLElement>("[data-change]")) {
      if (el.dataset.change === String(current)) el.setAttribute("data-current", "");
      else el.removeAttribute("data-current");
    }
    for (const a of root.querySelectorAll<HTMLElement>("[data-jump]")) {
      if (a.dataset.jump === String(current)) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
    const el = target(current);
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: "center" });
    if (live) live.textContent = `Change ${current} of ${total}: ${el.dataset.added ?? 0} words added, ${el.dataset.removed ?? 0} removed.`;
  };

  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const link = t.closest<HTMLElement>("[data-jump]");
    if (link && root.contains(link)) {
      e.preventDefault();
      goTo(Number(link.dataset.jump));
      return;
    }
    const part = t.closest<HTMLElement>("[data-cap-part]")?.dataset.capPart;
    if (part === "next") goTo(current + 1);
    else if (part === "prev") goTo(current === 0 ? total : current - 1);
    else if (part === "expand") toggleAll(root);
  };
  root.addEventListener("click", onClick);
  undo.push(() => root.removeEventListener("click", onClick));

  // n and p: single keys, so they honor the page's switch for them, never act while typing,
  // and act only when focus is inside the compare or it is the page's primary one.
  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.key !== "n" && e.key !== "p")) return;
    if (isTextEntry(e) || singleKeysOff() || total === 0) return;
    const active = document.activeElement;
    const owns = (active && root.contains(active)) || (root.hasAttribute("data-cap-primary") && !active?.closest("dialog[open], [role='dialog'], [role='menu'], [role='listbox']"));
    if (!owns) return;
    e.preventDefault();
    if (e.key === "n") goTo(current + 1);
    else goTo(current === 0 ? total : current - 1);
  };
  document.addEventListener("keydown", onKey);
  undo.push(() => document.removeEventListener("keydown", onKey));

  // "Expand all" appears when something is folded, and says which way it will go.
  const expand = root.querySelector<HTMLButtonElement>("[data-cap-part='expand']");
  const gaps = () => [...root.querySelectorAll<HTMLDetailsElement>("details[data-cap-part='gap']")];
  const syncExpand = () => {
    if (!expand) return;
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

// Opens every folded passage, or closes them all when every one is open.
export function toggleAll(root: Element): void {
  const gaps = [...root.querySelectorAll<HTMLDetailsElement>("details[data-cap-part='gap']")];
  const open = !gaps.every((d) => d.open);
  for (const d of gaps) d.open = open;
}

// Attaches to every [data-cap="draft-compare"] under root (or root itself) not yet attached.
// Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const found = [...root.querySelectorAll<HTMLElement>("[data-cap='draft-compare']:not([data-cap-ready])")];
  if (root instanceof HTMLElement && root.matches("[data-cap='draft-compare']:not([data-cap-ready])")) found.unshift(root);
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
