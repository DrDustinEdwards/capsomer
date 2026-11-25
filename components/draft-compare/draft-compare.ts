// Draft compare: two versions of a text, compared by sentence then word. The diff (draft-compare-diff.ts) and renderer
// (draft-compare-render.ts) touch nothing at import time, so a server can use them; enhance(root) wires the behavior here.
// The HTML holds every view so a reader without script gets all of it; the bar's radios choose which shows, in CSS.

import { singleKeysOff } from "../shortcuts/shortcuts.ts";
import { isTypingKey, listOwnsKeys } from "../row-list/row-list.ts";
import { type CompareView, STORAGE_KEY, VIEWS } from "./draft-compare-render.ts";
import { enhanceEach, readStored, writeStored } from "../hooks/hooks.ts";

export {
  tokenize,
  commonSubsequence,
  diffWords,
  splitSentences,
  diffSentences,
  analyze,
  countsText,
} from "./draft-compare-diff.ts";
export type {
  Op,
  WordPart,
  DiffOptions,
  Sentence,
  Entry,
  SentenceOptions,
  Counts,
  Analysis,
} from "./draft-compare-diff.ts";
export { VIEWS, STORAGE_KEY, renderCompare } from "./draft-compare-render.ts";
export type {
  CompareView,
  CompareSide,
  RunKind,
  RunSpan,
  CompareLabels,
  CompareOptions,
} from "./draft-compare-render.ts";
export { choicesOf, merged, mergePlan, startPicks } from "./draft-compare-merge.ts";
export type {
  MergeBlock,
  MergeChoice,
  MergePick,
  MergePlan,
  MergeSegment,
} from "./draft-compare-merge.ts";
export {
  parsePatch,
  patchCounts,
  patchCountsText,
  revisionPair,
  renderPatch,
  unifiedPatch,
  hasChanges,
} from "./draft-compare-patch.ts";
export type {
  PatchOp,
  PatchLine,
  PatchHunk,
  PatchFile,
  PatchOptions,
  PatchCounts,
  UnifiedSide,
  UnifiedOptions,
} from "./draft-compare-patch.ts";

function readView(): CompareView | null {
  const v = readStored(STORAGE_KEY);
  return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : null;
}

function writeView(v: CompareView): void {
  writeStored(STORAGE_KEY, v);
}

export function currentView(root: Element): CompareView {
  const v = root.querySelector<HTMLInputElement>(
    ".cap-compare-bar input[type='radio']:checked",
  )?.value;
  return v && (VIEWS as readonly string[]).includes(v) ? (v as CompareView) : "side";
}

export function setView(root: Element, view: CompareView): void {
  const radio = root.querySelector<HTMLInputElement>(
    `.cap-compare-bar input[type='radio'][value='${view}']`,
  );
  if (radio) radio.checked = true;
}

function attach(root: HTMLElement): () => void {
  const live = root.querySelector<HTMLElement>("[data-cap-part='live']");
  const total = root.querySelectorAll<HTMLElement>("[data-jump]").length;
  let current = 0;
  const undo: Array<() => void> = [];

  for (const b of root.querySelectorAll<HTMLElement>(
    "[data-cap-part='prev'], [data-cap-part='next']",
  ))
    b.hidden = total === 0;

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
    const view = root.querySelector<HTMLElement>(
      `.cap-compare-view[data-view='${currentView(root)}']`,
    );
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
    if (live)
      live.textContent = `Change ${current} of ${total}: ${el.dataset.added ?? 0} words added, ${el.dataset.removed ?? 0} removed.`;
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
    if (isTypingKey(e) || singleKeysOff() || total === 0 || !listOwnsKeys(root)) return;
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

export function toggleAll(root: Element): void {
  const gaps = [...root.querySelectorAll<HTMLDetailsElement>("details[data-cap-part='gap']")];
  const open = !gaps.every((d) => d.open);
  for (const d of gaps) d.open = open;
}

// Attaches to every [data-cap="draft-compare"] under root and returns a detach function. The root is Element | Document |
// DocumentFragment, not ParentNode: under @cloudflare/workers-types an HTMLFormElement is not a ParentNode.
export function enhance(root: Element | Document | DocumentFragment = document): () => void {
  return enhanceEach(root, "draft-compare", attach);
}
