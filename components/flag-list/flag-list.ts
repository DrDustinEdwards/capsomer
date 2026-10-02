// The flag list's behaviour and its pure helpers. A flag is raised against a draft by a check, a
// reviewer or an AI, and stays on the record: resolving it keeps it, with who and when. A
// suggestion a flag carries is inert until the owner applies it; nothing here applies one by
// itself. The whole record is in the delivered HTML; this module only adds what a person does
// to it (resolve, dismiss, reopen, apply, apply a batch) and keeps the anchors true to the
// current text. No framework; the React wrapper reuses the pure functions.
//
// Extracted from the site admin's check feedback (app/lib/editor/feedback.ts: a result is said
// in a polite region, a refusal in an alert) and Carrel's flags (a flag is a question for the
// owner, never a decision; an open flag holds publish until it is fixed or dismissed).

import { confirm } from "../confirm-dialog/confirm-dialog.ts";
import { fail, say, type SayOptions } from "../message/message.ts";
import { attachRowList } from "../row-list/row-list.ts";
import { enhance as enhanceTime, parse as parseTime, text as timeText } from "../time/time.ts";

export type FlagKind = "blocking" | "advisory";
export type FlagState = "open" | "resolved";
// How a resolved flag was closed: fixed, dismissed as not a problem, or by applying its suggestion.
export type Resolution = "resolved" | "dismissed" | "applied";
export type AnchorStatus = "found" | "lost" | "none";

export interface FlagAnchor {
  // The id of the passage in the page (the link is href="#id").
  id: string;
  // The quoted words, exactly as they were when the flag was raised. The last known text
  // when the anchor is lost.
  quote: string;
  // A few words either side, to tell one occurrence of the quote from another.
  before?: string;
  after?: string;
  // Used when no current text is given: the server already knows the passage has gone.
  lost?: boolean;
  // The link's words. Default "Go to passage".
  label?: string;
}

export interface FlagSuggestion {
  replacement: string;
  // Who or what suggested it ("Style check", "AI reviewer"). A suggestion never applies itself.
  by?: string;
}

export interface Flag {
  id: string;
  kind: FlagKind;
  // What rule fired, in words: "Every factual claim needs a source."
  cause: string;
  // What is wrong, in a sentence. The flag's title.
  message: string;
  // Who or what raised it.
  raisedBy?: string;
  anchor?: FlagAnchor;
  suggestion?: FlagSuggestion;
  state: FlagState;
  resolution?: Resolution;
  resolvedBy?: string;
  // An ISO timestamp.
  resolvedAt?: string;
}

// ---------------------------------------------------------------------------------------
// Pure helpers.

const byState = (a: Flag, b: Flag) => Number(a.state === "resolved") - Number(b.state === "resolved");

// Blocking first, then advisory; within each, open flags before resolved ones, in the order given.
export function groupFlags(flags: readonly Flag[]): { blocking: Flag[]; advisory: Flag[] } {
  const stable = (kind: FlagKind) =>
    flags
      .map((f, i) => [f, i] as const)
      .filter(([f]) => f.kind === kind)
      .sort(([a, i], [b, j]) => byState(a, b) || i - j)
      .map(([f]) => f);
  return { blocking: stable("blocking"), advisory: stable("advisory") };
}

export interface FlagCounts {
  // Open flags by kind.
  blocking: number;
  advisory: number;
  open: number;
  resolved: number;
  total: number;
}

export function countFlags(flags: readonly Flag[]): FlagCounts {
  const open = flags.filter((f) => f.state === "open");
  const blocking = open.filter((f) => f.kind === "blocking").length;
  return { blocking, advisory: open.length - blocking, open: open.length, resolved: flags.length - open.length, total: flags.length };
}

// "2 blocking, 3 advisory, 4 resolved". With nothing open it says so.
export function summaryLine(c: FlagCounts): string {
  if (c.total === 0) return "No flags";
  if (c.open === 0) return `No open flags, ${c.resolved} resolved`;
  return `${c.blocking} blocking, ${c.advisory} advisory, ${c.resolved} resolved`;
}

// Every place the quote occurs in the text, as start offsets.
function occurrences(text: string, quote: string): number[] {
  const at: number[] = [];
  if (!quote) return at;
  for (let i = text.indexOf(quote); i !== -1; i = text.indexOf(quote, i + 1)) at.push(i);
  return at;
}

// The occurrence the flag means: the one whose neighbours match the recorded context, else the first.
function pick(text: string, a: FlagAnchor, hits: number[]): number {
  if (hits.length > 1 && (a.before || a.after)) {
    const fit = hits.find((i) => (!a.before || text.slice(Math.max(0, i - a.before.length), i) === a.before) && (!a.after || text.slice(i + a.quote.length, i + a.quote.length + a.after.length) === a.after));
    if (fit !== undefined) return fit;
  }
  return hits[0] ?? -1;
}

// Whether the quoted passage is still in the text. "none": the flag is not anchored to text.
// Without a text, the flag's own `lost` mark is believed.
export function anchorStatus(flag: Pick<Flag, "anchor">, text?: string): AnchorStatus {
  const a = flag.anchor;
  if (!a || !a.quote) return "none";
  if (text === undefined) return a.lost ? "lost" : "found";
  return text.includes(a.quote) ? "found" : "lost";
}

// The text with the suggestion put in place of the quoted passage; null when the flag has no
// suggestion or its anchor has gone. Pure: it never touches the page.
export function applySuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null {
  const a = flag.anchor;
  if (!a || !flag.suggestion) return null;
  const i = pick(text, a, occurrences(text, a.quote));
  if (i < 0) return null;
  return text.slice(0, i) + flag.suggestion.replacement + text.slice(i + a.quote.length);
}

// The inverse, for Undo: puts the quote back where the replacement now is. null when the
// replacement is not there any more (the draft was edited since).
export function revertSuggestion(text: string, flag: Pick<Flag, "anchor" | "suggestion">): string | null {
  const a = flag.anchor;
  const s = flag.suggestion;
  if (!a || !s || !s.replacement) return null;
  const i = text.indexOf(s.replacement);
  if (i < 0) return null;
  return text.slice(0, i) + a.quote + text.slice(i + s.replacement.length);
}

// The flags whose suggestion can be applied now: open, with a suggestion, and the passage still there.
export function appliable(flags: readonly Flag[], text?: string): Flag[] {
  return flags.filter((f) => f.state === "open" && f.suggestion && anchorStatus(f, text) === "found");
}

// ---------------------------------------------------------------------------------------
// The page.

const SVG = "http://www.w3.org/2000/svg";
const GLYPHS: Record<string, string> = {
  crit: '<path fill="currentColor" fill-rule="evenodd" d="M5 1h6l4 4v6l-4 4H5l-4-4V5zM7.2 4h1.6v5H7.2zM7.2 10.4h1.6V12H7.2z"/>',
  warn: '<path fill="currentColor" fill-rule="evenodd" d="M8 1.2 15.4 14H.6zM7.3 6h1.4v4H7.3zM7.3 11h1.4v1.4H7.3z"/>',
  info: '<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path fill="currentColor" d="M7.2 7h1.6v5H7.2zM7.2 4h1.6v1.7H7.2z"/>',
  ok: '<path fill="currentColor" fill-rule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 1 0 8 1zM3.9 9l3 3 5.2-5.6-1.4-1.4-3.8 4.2-1.6-1.6z"/>',
  nodata: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.6 2.2"/>',
  running: '<circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" stroke-width="1.6" opacity="0.35"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M8 1.8a6.2 6.2 0 0 1 6.2 6.2"/>',
};

// The status component's glyph, the same drawing (components/status).
export function glyph(name: keyof typeof GLYPHS | string): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("class", "cap-status-glyph");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.innerHTML = GLYPHS[name] ?? "";
  return svg;
}

// A status: glyph, word, colour.
export function statusEl(tone: "crit" | "warn" | "ok" | "info" | "nodata", word: string, glyphName: string = tone): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = "cap-status";
  s.dataset.tone = tone;
  s.append(glyph(glyphName), word);
  return s;
}

const READY = "data-cap-ready";
const part = <T extends HTMLElement = HTMLElement>(el: ParentNode, name: string) => el.querySelector<T>(`[data-cap-part='${name}']`);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// A flag read back from its row, so the DOM stays the one source of truth.
export function readFlag(li: HTMLElement): Flag {
  const quote = li.querySelector(".cap-flag-quote-text")?.textContent ?? "";
  const after = li.querySelector(".cap-flag-after-text")?.textContent;
  const anchorId = li.dataset.anchorId;
  const flag: Flag = {
    id: li.dataset.flag ?? li.id,
    kind: li.dataset.kind === "advisory" ? "advisory" : "blocking",
    cause: part(li, "cause")?.textContent ?? "",
    message: li.querySelector(".cap-flag-message")?.textContent ?? "",
    state: li.dataset.state === "resolved" ? "resolved" : "open",
  };
  if (anchorId && quote) {
    flag.anchor = { id: anchorId, quote, lost: li.dataset.anchor === "lost" };
    if (li.dataset.before) flag.anchor.before = li.dataset.before;
    if (li.dataset.after) flag.anchor.after = li.dataset.after;
    const label = li.dataset.gotoLabel;
    if (label) flag.anchor.label = label;
  }
  if (after !== undefined && after !== null) flag.suggestion = { replacement: after };
  if (li.dataset.resolution) flag.resolution = li.dataset.resolution as Resolution;
  if (li.dataset.resolvedBy) flag.resolvedBy = li.dataset.resolvedBy;
  if (li.dataset.resolvedAt) flag.resolvedAt = li.dataset.resolvedAt;
  return flag;
}

export function flagRows(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>("li.cap-flag"));
}

export function readFlags(root: ParentNode): Flag[] {
  return flagRows(root).map(readFlag);
}

const WORDS: Record<Resolution, string> = { resolved: "Resolved", dismissed: "Dismissed", applied: "Applied" };

function actionButton(kind: string, label: string, message: string, variant?: string): HTMLButtonElement {
  const b = el("button", "cap-btn");
  b.type = "button";
  b.dataset.size = "sm";
  if (variant) b.dataset.variant = variant;
  b.dataset.capPart = kind;
  b.append(label, Object.assign(el("span", "cap-sr-only"), { textContent: ` flag: ${message}` }));
  return b;
}

interface Ctx {
  owner: boolean;
  ownerName: string;
}

// Rebuilds the parts of one row that depend on its state and anchor, from its data attributes:
// the critical edge, the title (a link only while the passage is there), the resolution on the
// right, the actions, the suggestion's footer, and the line that says who closed it and when.
export function renderFlag(li: HTMLElement, ctx: Ctx): void {
  const flag = readFlag(li);
  const status = anchorStatus(flag);
  li.dataset.anchor = status;
  if (flag.kind === "blocking" && flag.state === "open") li.dataset.tone = "crit";
  else delete li.dataset.tone;

  // Title: the link while the passage is found; plain words and "Anchor lost" otherwise.
  const title = li.querySelector<HTMLElement>(".cap-row-title");
  if (title && flag.anchor) {
    const describedby = li.querySelector(".cap-row-title [aria-describedby]")?.getAttribute("aria-describedby") ?? `${li.id}-s ${li.id}-d`;
    const message = el("span", "cap-flag-message", flag.message);
    if (status === "found") {
      const a = el("a");
      a.href = `#${flag.anchor.id}`;
      a.setAttribute("aria-describedby", describedby);
      a.append(message, " ", el("span", "cap-flag-goto", flag.anchor.label ?? "Go to passage"));
      title.replaceChildren(a);
    } else {
      const span = el("span", "cap-flag-title");
      span.append(message, " ", statusEl("nodata", "Anchor lost"));
      title.replaceChildren(span);
    }
  }

  // The state on the right.
  const meta = li.querySelector<HTMLElement>(".cap-row-meta");
  if (meta) {
    if (flag.state === "resolved") {
      const r = flag.resolution ?? "resolved";
      meta.replaceChildren(statusEl(r === "dismissed" ? "nodata" : "ok", WORDS[r]));
    } else meta.replaceChildren();
  }

  // The actions.
  const actions = li.querySelector<HTMLElement>(".cap-row-actions");
  if (actions) {
    actions.replaceChildren(...(flag.state === "open" ? [actionButton("resolve", "Resolve", flag.message), actionButton("dismiss", "Dismiss", flag.message, "quiet")] : [actionButton("reopen", "Reopen", flag.message)]));
  }

  // The quote's note and the suggestion's footer.
  const quoteNote = part(li, "anchor-note");
  if (quoteNote) {
    quoteNote.replaceChildren();
    if (status === "lost") quoteNote.append("The text this flag was raised on changed or was removed. Last known text:");
    else if (status === "found") quoteNote.append("Raised on this passage:");
    quoteNote.hidden = quoteNote.childNodes.length === 0;
  }
  const sug = li.querySelector<HTMLElement>(".cap-flag-suggestion");
  if (sug && flag.suggestion) {
    const applied = flag.state === "resolved" && flag.resolution === "applied";
    sug.dataset.state = applied ? "applied" : "inert";
    const foot = part(sug, "suggestion-foot");
    if (foot) {
      foot.replaceChildren();
      if (applied) foot.append(el("p", "cap-flag-note", "Applied to the draft."));
      else if (flag.state === "resolved") foot.append(el("p", "cap-flag-note", "Not applied. Reopen the flag to apply it."));
      else if (status !== "found") foot.append(el("p", "cap-flag-note", "Cannot be applied: the passage it replaces has changed or gone."));
      else if (ctx.owner) {
        const b = el("button", "cap-btn");
        b.type = "button";
        b.dataset.size = "sm";
        b.dataset.variant = "primary";
        b.dataset.capPart = "apply";
        b.append("Apply", Object.assign(el("span", "cap-sr-only"), { textContent: ` suggestion: ${flag.message}` }));
        foot.append(b, el("span", "cap-flag-note", "Nothing changes in the draft until you apply it."));
      } else foot.append(el("p", "cap-flag-note", `Only the owner${ctx.ownerName ? `, ${ctx.ownerName},` : ""} can apply this. The draft stays as it is until they do.`));
    }
  }

  // Who closed it, and when.
  const body = li.querySelector<HTMLElement>(".cap-flag-body");
  body?.querySelector(".cap-flag-resolution")?.remove();
  if (body && flag.state === "resolved") {
    const p = el("p", "cap-flag-resolution");
    p.append(`${WORDS[flag.resolution ?? "resolved"]}${flag.resolvedBy ? ` by ${flag.resolvedBy}` : ""}`);
    if (flag.resolvedAt) {
      const t = el("time", "cap-time");
      t.dataset.cap = "time";
      t.dateTime = flag.resolvedAt;
      t.textContent = timeText(parseTime(flag.resolvedAt), "relative");
      p.append(" ", t);
      enhanceTime(p);
    }
    p.append(".");
    body.append(p);
  }
}

// ---------------------------------------------------------------------------------------

export interface FlagTextIO {
  getText(): string;
  setText(text: string): void;
}

export interface FlagListHandle {
  // Re-reads the current text and updates every flag's anchor, the counts and the batch button.
  refresh(): void;
  detach(): void;
}

// The text a `data-text-source` selector names: a textarea or input's value, else an element's text.
function ioFor(selector: string | undefined): FlagTextIO | undefined {
  if (!selector) return undefined;
  const find = () => document.querySelector<HTMLElement>(selector);
  if (!find()) return undefined;
  return {
    getText: () => {
      const e = find();
      return e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement ? e.value : (e?.textContent ?? "");
    },
    setText: (t) => {
      const e = find();
      if (e instanceof HTMLTextAreaElement || e instanceof HTMLInputElement) {
        e.value = t;
        e.dispatchEvent(new Event("input", { bubbles: true }));
      } else if (e) e.textContent = t;
    },
  };
}

function setCount(root: HTMLElement, name: string, n: number): void {
  for (const c of root.querySelectorAll<HTMLElement>(`[data-count='${name}']`)) c.textContent = String(n);
}

export function attachFlagList(root: HTMLElement, io?: FlagTextIO): FlagListHandle {
  const owner = root.hasAttribute("data-owner");
  const ctx: Ctx = { owner, ownerName: root.dataset.ownerName ?? "" };
  const viewer = root.dataset.viewer ?? "";
  const list = root.querySelector<HTMLElement>(".cap-flags-list");
  const detachRows = list ? attachRowList(list) : () => {};

  const live = (text: string) => {
    const region = part(root, "live");
    if (!region) return;
    region.textContent = "";
    requestAnimationFrame(() => {
      region.textContent = text;
    });
  };
  // The page's message region says it, with Undo; without one the list's own polite region does.
  const announce = (text: string, opts: SayOptions = {}) => {
    if (document.querySelector("[data-cap='message']")) say(text, opts);
    else live(text);
  };
  const problem = (text: string) => {
    if (document.querySelector("[data-cap='message']")) fail(text);
    else live(text);
  };

  const emit = (li: HTMLElement) => {
    const f = readFlag(li);
    root.dispatchEvent(new CustomEvent("cap:flag-change", { bubbles: true, detail: { id: f.id, state: f.state, resolution: f.resolution ?? null, resolvedBy: f.resolvedBy ?? null, resolvedAt: f.resolvedAt ?? null } }));
  };

  // Group headings, the summary, the filter's counts and the batch button follow the rows.
  const tally = () => {
    const flags = readFlags(root);
    const c = countFlags(flags);
    const summary = part(root, "summary");
    if (summary) summary.textContent = summaryLine(c);
    setCount(root, "open", c.open);
    setCount(root, "resolved", c.resolved);
    setCount(root, "all", c.total);
    for (const kind of ["blocking", "advisory"] as const) {
      const mine = flags.filter((f) => f.kind === kind);
      const open = mine.filter((f) => f.state === "open").length;
      const head = root.querySelector<HTMLElement>(`.cap-flag-group[data-group='${kind}'] .cap-flag-group-count`);
      if (head) head.textContent = `${open} open, ${mine.length - open} resolved`;
    }
    const text = io?.getText();
    const n = appliable(flags, text).length;
    const batch = part<HTMLButtonElement>(root, "apply-all");
    if (batch) {
      batch.replaceChildren(`Apply ${n} suggestion${n === 1 ? "" : "s"}`);
      batch.hidden = n === 0 || !owner;
    }
    const note = part(root, "owner-note");
    if (note) note.hidden = owner || appliable(flags, text).length === 0;
  };

  // Moves the open flags to the top of their group so the record reads open first.
  const order = () => {
    if (!list) return;
    for (const kind of ["blocking", "advisory"] as const) {
      const group = list.querySelector<HTMLElement>(`.cap-flag-group[data-group='${kind}'] .cap-flag-group-rows`);
      if (!group) continue;
      const rows = flagRows(group);
      const sorted = [...rows.filter((r) => r.dataset.state === "open"), ...rows.filter((r) => r.dataset.state === "resolved")];
      sorted.forEach((r, i) => {
        if (group.children[i] !== r) group.insertBefore(r, group.children[i] ?? null);
      });
    }
  };

  // Re-reads the text: a flag whose passage appeared or vanished is redrawn, then the counts.
  const refresh = () => {
    const text = io?.getText();
    if (text !== undefined) {
      for (const li of flagRows(root)) {
        // A closed flag keeps what it said when it was closed: it is a record, not a live check.
        if (!li.dataset.anchorId || li.dataset.state === "resolved") continue;
        const next = anchorStatus(readFlag(li), text);
        if (next === li.dataset.anchor) continue;
        li.dataset.anchor = next;
        renderFlag(li, ctx);
      }
    }
    tally();
  };

  // Where focus goes if the row leaves the filtered view: chosen before the change, as the next
  // visible row (or the one before it), so the order the rows are re-sorted into does not matter.
  const heirOf = (li: HTMLElement): HTMLElement | null => {
    const visible = (e: HTMLElement) => e.getClientRects().length > 0;
    const all = flagRows(root);
    const here = all.indexOf(li);
    return all.slice(here + 1).find(visible) ?? all.slice(0, here).reverse().find(visible) ?? null;
  };

  // After a row's state changed: focus stays in the row on its new first action, or, when the row
  // is no longer shown, goes to its heir. It is never left on nothing.
  const settle = (li: HTMLElement, hadFocus: boolean, heir: HTMLElement | null) => {
    if (!hadFocus) return;
    const visible = (e: HTMLElement) => e.getClientRects().length > 0;
    const first = (row: HTMLElement) => [...row.querySelectorAll<HTMLElement>(".cap-row-actions button"), ...row.querySelectorAll<HTMLElement>(".cap-row-title a")].find(visible);
    const target = first(li) ?? (heir ? first(heir) : undefined);
    if (target) return void target.focus();
    (part(root, "filter")?.querySelector<HTMLElement>("input:checked") ?? root).focus();
  };

  const stamp = (li: HTMLElement, state: FlagState, resolution?: Resolution) => {
    li.dataset.state = state;
    if (state === "resolved") {
      li.dataset.resolution = resolution ?? "resolved";
      if (viewer) li.dataset.resolvedBy = viewer;
      else delete li.dataset.resolvedBy;
      li.dataset.resolvedAt = new Date().toISOString();
    } else {
      delete li.dataset.resolution;
      delete li.dataset.resolvedBy;
      delete li.dataset.resolvedAt;
    }
  };

  const snapshot = (li: HTMLElement) => ({ state: li.dataset.state as FlagState, resolution: li.dataset.resolution as Resolution | undefined, by: li.dataset.resolvedBy, at: li.dataset.resolvedAt });
  const restore = (li: HTMLElement, s: ReturnType<typeof snapshot>) => {
    li.dataset.state = s.state;
    for (const [k, v] of [["resolution", s.resolution], ["resolvedBy", s.by], ["resolvedAt", s.at]] as const) {
      if (v) li.dataset[k] = v;
      else delete li.dataset[k];
    }
  };

  const primary = (li: HTMLElement) => () => li.querySelector<HTMLElement>(".cap-row-actions button") ?? li.querySelector<HTMLElement>(".cap-row-title a");

  const change = (li: HTMLElement, state: FlagState, resolution: Resolution | undefined, said: string, undone: string) => {
    const hadFocus = li.contains(document.activeElement);
    const heir = heirOf(li);
    const before = snapshot(li);
    stamp(li, state, resolution);
    renderFlag(li, ctx);
    refresh();
    order();
    emit(li);
    settle(li, hadFocus, heir);
    announce(said, {
      undo: () => {
        restore(li, before);
        renderFlag(li, ctx);
        refresh();
        order();
        emit(li);
      },
      undone,
      returnFocus: primary(li),
    });
  };

  const applyOne = (li: HTMLElement) => {
    if (!io || !owner) return;
    const flag = readFlag(li);
    const text = io.getText();
    const next = applySuggestion(text, flag);
    if (next === null) {
      refresh();
      return problem("Could not apply the suggestion: the passage it replaces has changed.");
    }
    const hadFocus = li.contains(document.activeElement);
    const heir = heirOf(li);
    const before = snapshot(li);
    // Closed first, then the text: the passage is gone once replaced, and a closed flag keeps
    // what it said, so the editor's input event must not find it open and call it lost.
    stamp(li, "resolved", "applied");
    renderFlag(li, ctx);
    io.setText(next);
    refresh();
    order();
    emit(li);
    settle(li, hadFocus, heir);
    announce("Suggestion applied to the draft.", {
      undo: () => {
        const back = revertSuggestion(io.getText(), flag);
        if (back === null) throw new Error("The draft has changed around that passage since. Undo the edit in the editor instead.");
        io.setText(back);
        restore(li, before);
        renderFlag(li, ctx);
        refresh();
        order();
        emit(li);
      },
      undone: "Suggestion taken back. The passage is as it was.",
      returnFocus: primary(li),
    });
  };

  // A batch rewrites the draft, so it is previewed in the shared confirm dialog and only then done.
  const applyAll = async () => {
    if (!io || !owner) return;
    const rows = flagRows(root);
    const todo = rows.filter((li) => li.dataset.state === "open" && li.querySelector(".cap-flag-after-text") && li.dataset.anchor === "found");
    if (todo.length === 0) return;
    const flags = todo.map(readFlag);
    const quoted = (s: string) => `“${s}”`;
    const opener = part<HTMLElement>(root, "apply-all");
    await confirm({
      title: `Apply ${todo.length} suggestion${todo.length === 1 ? "" : "s"}?`,
      lead: "This rewrites the draft. Each replacement is listed; nothing else changes.",
      body: flags.map((f) => `${quoted(f.anchor?.quote ?? "")} becomes ${quoted(f.suggestion?.replacement ?? "")}`),
      action: `Apply ${todo.length} suggestion${todo.length === 1 ? "" : "s"}`,
      returnTo: part<HTMLElement>(root, "filter")?.querySelector<HTMLElement>("input:checked") ?? null,
      perform: async () => {
        const text = io.getText();
        let next = text;
        const done: number[] = [];
        flags.forEach((f, i) => {
          const out = applySuggestion(next, f);
          if (out !== null) {
            next = out;
            done.push(i);
          }
        });
        if (done.length === 0) throw new Error("None of the passages could be found any more.");
        const before = done.map((i) => snapshot(todo[i] as HTMLElement));
        for (const i of done) {
          stamp(todo[i] as HTMLElement, "resolved", "applied");
          renderFlag(todo[i] as HTMLElement, ctx);
        }
        io.setText(next);
        refresh();
        order();
        for (const i of done) emit(todo[i] as HTMLElement);
        const skipped = flags.length - done.length;
        announce(`Applied ${done.length} suggestion${done.length === 1 ? "" : "s"} to the draft.${skipped ? ` ${skipped} skipped: the passage changed.` : ""}`, {
          undo: () => {
            let back = io.getText();
            for (const i of [...done].reverse()) {
              const out = revertSuggestion(back, flags[i] as Flag);
              if (out === null) throw new Error("The draft has changed around those passages since. Undo the edits in the editor instead.");
              back = out;
            }
            io.setText(back);
            done.forEach((i, k) => {
              restore(todo[i] as HTMLElement, before[k] as ReturnType<typeof snapshot>);
              renderFlag(todo[i] as HTMLElement, ctx);
            });
            refresh();
            order();
            for (const i of done) emit(todo[i] as HTMLElement);
          },
          undone: "Suggestions taken back. The passages are as they were.",
          returnFocus: () => (opener && !opener.hidden ? opener : (part<HTMLElement>(root, "filter")?.querySelector<HTMLElement>("input:checked") ?? null)),
        });
      },
    });
  };

  const onClick = (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>("button[data-cap-part]");
    if (!btn || !root.contains(btn)) return;
    const kind = btn.dataset.capPart;
    const li = btn.closest<HTMLElement>("li.cap-flag");
    if (kind === "apply-all") return void applyAll();
    if (!li) return;
    if (kind === "resolve") change(li, "resolved", "resolved", "Flag resolved.", "Flag reopened.");
    else if (kind === "dismiss") change(li, "resolved", "dismissed", "Flag dismissed.", "Flag reopened.");
    else if (kind === "reopen") change(li, "open", undefined, "Flag reopened.", "Flag closed again.");
    else if (kind === "apply") applyOne(li);
  };
  root.addEventListener("click", onClick);

  const source = root.dataset.textSource ? document.querySelector(root.dataset.textSource) : null;
  const onInput = () => refresh();
  source?.addEventListener("input", onInput);

  tally();
  if (io) refresh();

  return {
    refresh,
    detach() {
      root.removeEventListener("click", onClick);
      source?.removeEventListener("input", onInput);
      detachRows();
      root.removeAttribute(READY);
    },
  };
}

// Attaches to every [data-cap="flag-list"] under root not attached yet. The text the anchors are
// read against is the element named by data-text-source (a textarea's value, or an element's
// text). Returns a function that detaches them all.
export function enhance(root: ParentNode = document): () => void {
  const handles: FlagListHandle[] = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='flag-list']:not([data-cap-ready])")) {
    el.setAttribute(READY, "");
    handles.push(attachFlagList(el, ioFor(el.dataset.textSource)));
  }
  return () => handles.forEach((h) => h.detach());
}
