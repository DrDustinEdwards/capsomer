// The page's one status region: results said where the person is looking, never taking focus.
// A message with Undo stays until dismissed (`z` runs it). A warning, a failed Undo or a failure
// stays too, since a missing audit row cannot be found later.
import { isTyping, singleKeysOff } from "../shortcuts/shortcuts.ts";
import { glyphParts, type GlyphName } from "../status/status.ts";
import { setStaticHtml } from "../trusted-html/trusted-html.ts";

export type ReturnFocus = HTMLElement | (() => HTMLElement | null);

export interface SayOptions {
  undo?: () => void | Promise<void>;
  undone?: string;
  // A plain confirmation that clears itself after 4 seconds; ignored with Undo, a warning or a failure.
  clears?: boolean;
  // Something the person must not miss; the message stays until dismissed.
  warning?: string;
  // Something that did not happen and has no control beside it; announced as an alert, stays until dismissed.
  failure?: boolean;
  // The control Undo acts on, or a function that finds it; focus goes there after Undo, else to Dismiss.
  returnFocus?: ReturnFocus;
}

export interface Message {
  id: number;
  text: string;
  warning: string | null;
  undo: SayOptions["undo"] | null;
  undone?: string;
  returnFocus?: ReturnFocus;
  error: string | null;
  busy: boolean;
  failure: boolean;
  clears: boolean;
}

const CLEARS_AFTER_MS = 4000;

export function newMessage(id: number, text: string, opts: SayOptions = {}): Message {
  const warning = opts.warning ?? null;
  const failure = !!opts.failure;
  return {
    id,
    text,
    warning,
    undo: opts.undo ?? null,
    undone: opts.undone,
    returnFocus: opts.returnFocus,
    error: null,
    busy: false,
    failure,
    clears: !!opts.clears && !opts.undo && warning === null && !failure,
  };
}

export function lasting(m: Pick<Message, "warning" | "error" | "failure">): boolean {
  return m.failure || m.warning !== null || m.error !== null;
}

export function withMessage(all: Message[], m: Message): Message[] {
  return [m, ...all.filter(lasting)];
}

function undoneText(text: string, undone?: string): string {
  return undone ? `Undone. ${undone}` : `Undone: ${text}`;
}

function undoErrorText(err: unknown): string {
  const why = err instanceof Error && err.message ? ` ${err.message}` : "";
  return `Could not undo that.${why} Try again.`;
}

export function undoBusy(all: Message[], id: number): Message[] {
  return all.map((x) => (x.id === id ? { ...x, busy: true, error: null } : x));
}

export function undoFailed(all: Message[], id: number, err: unknown): Message[] {
  return all.map((x) => (x.id === id ? { ...x, busy: false, error: undoErrorText(err) } : x));
}

// The list once Undo ran; a result that carried a warning keeps it, without its Undo.
export function undoDone(all: Message[], m: Message, nextId: () => number): Message[] {
  const said = undoneText(m.text, m.undone);
  if (m.warning === null) return all.map((x) => (x.id === m.id ? newMessage(m.id, said) : x));
  const kept = all.map((x) => (x.id === m.id ? { ...x, undo: null, busy: false, error: null } : x));
  return withMessage(kept, newMessage(nextId(), said));
}

export function syncTimers(
  timers: Map<number, number>,
  next: Message[],
  onClear: (id: number) => void,
): void {
  const ids = new Set(next.map((m) => m.id));
  for (const [id, t] of timers) {
    if (!ids.has(id)) {
      window.clearTimeout(t);
      timers.delete(id);
    }
  }
  for (const m of next) {
    if (!m.clears || timers.has(m.id)) continue;
    const id = m.id;
    timers.set(
      id,
      window.setTimeout(() => {
        timers.delete(id);
        onClear(id);
      }, CLEARS_AFTER_MS),
    );
  }
}

export function resolveFocus(f: ReturnFocus | undefined): HTMLElement | null {
  const el = typeof f === "function" ? f() : (f ?? null);
  return el?.isConnected ? el : null;
}

export function isUndoKey(e: KeyboardEvent): boolean {
  return (
    e.key === "z" &&
    !singleKeysOff() &&
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    !e.shiftKey &&
    !e.repeat &&
    !e.defaultPrevented &&
    !isTyping(e.composedPath()[0] ?? e.target)
  );
}

export function currentUndo(all: Message[]): Message | undefined {
  return all.find((m) => m.undo && !m.busy);
}

// The leading glyph per kind, as inner svg markup; hidden from screen readers.
export type MessageKind = "ok" | "warning" | "failure";

const KIND_GLYPH: Record<MessageKind, GlyphName> = { ok: "ok", warning: "warn", failure: "crit" };
export const kindGlyph = (kind: MessageKind): string => glyphParts(KIND_GLYPH[kind]);

export function messageKind(m: Pick<Message, "warning" | "error" | "failure">): MessageKind {
  return m.failure ? "failure" : m.warning !== null || m.error !== null ? "warning" : "ok";
}

interface Item {
  el: HTMLElement;
  glyph: SVGElement;
  said: HTMLElement;
  warn: HTMLElement;
  warnText: HTMLElement;
  error: HTMLElement;
  undoBtn: HTMLButtonElement;
  undoLabel: HTMLElement;
  dismissBtn: HTMLButtonElement;
}

interface Settle {
  to?: HTMLElement | null;
  id?: number;
  origin?: boolean;
}

interface Region {
  el: HTMLElement;
  messages: Message[];
  items: Map<number, Item>;
  nextId: number;
  timers: Map<number, number>;
  // Focus goes back here when a button inside the region disappears under it.
  origin: Element | null;
}

const regions = new WeakMap<HTMLElement, Region>();

function make(tag: string, className?: string, part?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (part) el.dataset.capPart = part;
  return el;
}

function buildItem(): Item {
  const el = make("div", "cap-message-item", "item");
  const glyph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  glyph.setAttribute("class", "cap-message-glyph");
  glyph.setAttribute("viewBox", "0 0 16 16");
  glyph.setAttribute("aria-hidden", "true");
  glyph.setAttribute("focusable", "false");
  const text = make("p", "cap-message-text", "text");
  const said = make("span", undefined, "said");
  const warn = make("span", "cap-message-warning");
  warn.hidden = true;
  const bold = make("b");
  bold.textContent = "Warning:";
  const warnText = make("span");
  warn.append(" ", bold, " ", warnText);
  const error = make("span", "cap-message-error");
  error.setAttribute("role", "alert");
  error.hidden = true;
  text.append(said, warn, error);

  const undoBtn = make("button", "cap-link-btn cap-message-undo", "undo") as HTMLButtonElement;
  undoBtn.type = "button";
  const undoLabel = make("span");
  undoLabel.textContent = "Undo";
  const kbd = make("kbd");
  kbd.setAttribute("aria-hidden", "true");
  kbd.textContent = "z";
  undoBtn.append(undoLabel, " ", kbd);

  const dismissBtn = make("button", "cap-btn cap-message-dismiss", "dismiss") as HTMLButtonElement;
  dismissBtn.type = "button";
  dismissBtn.textContent = "Dismiss";

  el.append(glyph, text, undoBtn, dismissBtn);
  return { el, glyph, said, warn, warnText, error, undoBtn, undoLabel, dismissBtn };
}

function paint(it: Item, m: Message): void {
  it.el.dataset.id = String(m.id);
  if (lasting(m)) it.el.dataset.lasting = "";
  else delete it.el.dataset.lasting;
  const kind = messageKind(m);
  if (it.el.dataset.kind !== kind) {
    it.el.dataset.kind = kind;
    setStaticHtml(it.glyph, kindGlyph(kind));
  }
  if (it.said.textContent !== m.text) it.said.textContent = m.text;
  if (m.failure) it.said.setAttribute("role", "alert");
  else it.said.removeAttribute("role");
  it.warn.hidden = m.warning === null;
  if (it.warnText.textContent !== (m.warning ?? "")) it.warnText.textContent = m.warning ?? "";
  it.error.hidden = m.error === null;
  if (it.error.textContent !== (m.error ?? "")) it.error.textContent = m.error ?? "";
  it.undoBtn.hidden = !m.undo;
  if (m.busy) it.undoBtn.setAttribute("aria-busy", "true");
  else it.undoBtn.removeAttribute("aria-busy");
  it.undoLabel.textContent = m.busy ? "Undoing..." : "Undo";
  // While Undo runs, Dismiss waits so the answer is not hidden.
  it.dismissBtn.hidden = m.clears;
  if (m.busy) it.dismissBtn.setAttribute("aria-disabled", "true");
  else it.dismissBtn.removeAttribute("aria-disabled");
}

// An item still there is changed in place, so a focused button keeps focus and a text is not said twice.
function render(r: Region): void {
  const live = new Set(r.messages.map((m) => m.id));
  for (const [id, it] of r.items) {
    if (!live.has(id)) {
      it.el.remove();
      r.items.delete(id);
    }
  }
  let ref = r.el.firstElementChild;
  for (const m of r.messages) {
    let it = r.items.get(m.id);
    const fresh = !it;
    if (!it) {
      it = buildItem();
      r.items.set(m.id, it);
    }
    paint(it, m);
    if (!fresh && it.el === ref) ref = ref.nextElementSibling;
    else r.el.insertBefore(it.el, ref);
  }
}

function focusInside(r: Region): boolean {
  return r.el.contains(document.activeElement);
}

// After the focused button goes away, focus lands somewhere sensible, never on the body.
function settleFocus(r: Region, s: Settle): void {
  if (s.to) return s.to.focus();
  const active = document.activeElement;
  if (active && r.el.contains(active) && active.isConnected && !(active as HTMLElement).hidden)
    return;
  const back = r.origin instanceof HTMLElement && r.origin.isConnected ? r.origin : null;
  if (s.origin) return (back ?? document.querySelector<HTMLElement>("main"))?.focus();
  const own = s.id !== undefined ? r.items.get(s.id)?.dismissBtn : undefined;
  if (own && !own.hidden) return own.focus();
  const any = r.el.querySelector<HTMLButtonElement>("[data-cap-part='dismiss']:not([hidden])");
  if (any) return any.focus();
  (back ?? document.querySelector<HTMLElement>("main"))?.focus();
}

function set(r: Region, next: Message[], settle: Settle = {}): void {
  const hadFocus = focusInside(r);
  r.messages = next;
  render(r);
  syncTimers(r.timers, next, (id) =>
    set(
      r,
      r.messages.filter((x) => x.id !== id),
      { origin: true },
    ),
  );
  if (settle.to || hadFocus) settleFocus(r, settle);
}

function region(el: HTMLElement): Region {
  let r = regions.get(el);
  if (r) return r;
  r = { el, messages: [], items: new Map(), nextId: 1, timers: new Map(), origin: null };
  regions.set(el, r);
  return r;
}

function find(): Region | null {
  const el =
    document.querySelector<HTMLElement>("[data-cap='message'][data-cap-ready]") ??
    document.querySelector<HTMLElement>("[data-cap='message']");
  if (!el) return null;
  if (!el.hasAttribute("data-cap-ready")) enhance(el.parentNode ?? document);
  return region(el);
}

export function say(text: string, opts: SayOptions = {}): void {
  const r = find();
  if (!r) {
    console.warn("capsomer message: no [data-cap='message'] region on this page.");
    return;
  }
  const active = document.activeElement;
  if (active && active !== document.body && !r.el.contains(active)) r.origin = active;
  set(r, withMessage(r.messages, newMessage(r.nextId++, text, opts)));
}

export function fail(text: string): void {
  say(text, { failure: true });
}

function clearIn(r: Region, id?: number): void {
  set(r, id === undefined ? [] : r.messages.filter((m) => m.id !== id), { origin: true });
}

export function dismiss(): void {
  const r = find();
  if (r) clearIn(r);
}

async function undoIn(r: Region, id: number): Promise<boolean> {
  const m = r.messages.find((x) => x.id === id);
  if (!m?.undo || m.busy) return false;
  const run = m.undo;
  set(r, undoBusy(r.messages, id));
  try {
    await run();
  } catch (err) {
    if (r.messages.some((x) => x.id === id)) set(r, undoFailed(r.messages, id, err));
    return false;
  }
  const to = resolveFocus(m.returnFocus);
  if (r.messages.some((x) => x.id === id))
    set(
      r,
      undoDone(r.messages, m, () => r.nextId++),
      { to, id },
    );
  return true;
}

export function runUndo(): Promise<boolean> {
  const r = find();
  const m = r ? currentUndo(r.messages) : undefined;
  return r && m ? undoIn(r, m.id) : Promise.resolve(false);
}

export function ensureRegion(after: Element): void {
  if (document.querySelector("[data-cap='message']")) return;
  const region = document.createElement("div");
  region.className = "cap-message";
  region.dataset.cap = "message";
  after.after(region);
  enhance(region.parentNode ?? document);
}

// `z` is off while single-key shortcuts are, or for a region with data-cap-undo-key="off".
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>(
    "[data-cap='message']:not([data-cap-ready])",
  )) {
    el.dataset.capReady = "";
    if (!el.getAttribute("role")) el.setAttribute("role", "status");
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "Results and failures");
    // A new message is read by itself; the ones before it are not read again.
    if (!el.hasAttribute("aria-atomic")) el.setAttribute("aria-atomic", "false");
    for (const old of el.querySelectorAll(":scope > [data-cap-part]:not([data-cap-part='item'])"))
      old.remove();
    const r = region(el);
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const id = Number(target.closest<HTMLElement>("[data-cap-part='item']")?.dataset.id);
      const part = target.closest("[data-cap-part]")?.getAttribute("data-cap-part");
      if (Number.isNaN(id)) return;
      if (part === "undo") void undoIn(r, id);
      else if (part === "dismiss" && !r.messages.find((x) => x.id === id)?.busy) clearIn(r, id);
    };
    const onKey = (e: KeyboardEvent) => {
      if (el.dataset.capUndoKey === "off" || !isUndoKey(e)) return;
      const m = currentUndo(r.messages);
      if (!m) return;
      e.preventDefault();
      void undoIn(r, m.id);
    };
    el.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    undo.push(() => {
      el.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      for (const t of r.timers.values()) window.clearTimeout(t);
      r.timers.clear();
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
