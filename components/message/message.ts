// The page's one status region: the result of an action, said where the person is looking
// and never taking focus. A message with Undo stays until dismissed; `z` runs its Undo.
// No floating toast (decision, 0.1). No framework; the React wrapper uses the same helpers.
//
// What the region holds follows the Capsid Portal's lib/messages.ts (capsid/decisions.md
// 2026-09-30, "admin panels review adopted", item 3): a performed action's result, with
// Undo for a reversible change, and every failure that has no place beside its source. A
// plain result is replaced by the next one. A warning (an audit row naming you was not
// written), an Undo that failed, or a failure (a refresh, a copy) stays until you dismiss
// it, whatever happens after it: the missing audit row is the one fact that cannot be
// found later by looking.

export type ReturnFocus = HTMLElement | (() => HTMLElement | null);

export interface SayOptions {
  // Reverses the action. Runs once; the region then says what was undone.
  undo?: () => void | Promise<void>;
  // What the region says once Undo has run: "The mention from fieldnotes.example is waiting
  // again." Defaults to "Undone: " and the message.
  undone?: string;
  // A plain confirmation ("Copied") that clears itself after 4 seconds. Only when the
  // control that caused it also shows it; ignored for a message with Undo, a warning or a
  // failure.
  clears?: boolean;
  // Something that belongs with this result and that the person must not miss ("the audit
  // row naming you was not written"). The message then stays until dismissed, whatever is
  // said after it, and it keeps the warning even after its Undo has run.
  warning?: string;
  // Something that did not happen and has no control beside it to say so (a failed copy, a
  // failed refresh). The text is the failure, announced as an alert; it stays until
  // dismissed. A failure with a source goes beside it, as an alert (see Banner).
  failure?: boolean;
  // The control Undo acts on, or a function that finds it: focus goes there once Undo has
  // run (the Portal returns focus to the switch it undid). Without it, focus goes to Dismiss.
  returnFocus?: ReturnFocus;
}

// One message in the region.
export interface Message {
  id: number;
  text: string;
  warning: string | null;
  undo: SayOptions["undo"] | null;
  undone?: string;
  returnFocus?: ReturnFocus;
  // An Undo that was refused or could not run: Undo stays, and this says why.
  error: string | null;
  // Undo is running.
  busy: boolean;
  // Something that did not happen: the text is the failure.
  failure: boolean;
  clears: boolean;
}

export const CLEARS_AFTER_MS = 4000;

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

/** Whether a message stays when the next one arrives. */
export function lasting(m: Pick<Message, "warning" | "error" | "failure">): boolean {
  return m.failure || m.warning !== null || m.error !== null;
}

/** The region after `m` arrives: it first, then every lasting message before it. */
export function withMessage(all: Message[], m: Message): Message[] {
  return [m, ...all.filter(lasting)];
}

export function undoneText(text: string, undone?: string): string {
  return undone ? `Undone. ${undone}` : `Undone: ${text}`;
}

// An Undo that threw: nothing was undone, so Undo stays and this says why.
export function undoErrorText(err: unknown): string {
  const why = err instanceof Error && err.message ? ` ${err.message}` : "";
  return `Could not undo that.${why} Try again.`;
}

export function resolveFocus(f: ReturnFocus | undefined): HTMLElement | null {
  const el = typeof f === "function" ? f() : (f ?? null);
  return el?.isConnected ? el : null;
}

const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|datetime-local|month|week|time)$/;

// True where a typed z is text, not a command: text inputs, textareas, selects, editable
// content, and anything that says it is a text box or a combobox.
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement) return TEXT_INPUT.test(target.type || "text");
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return !!target.closest("[role='textbox'], [role='combobox'], [role='searchbox']");
}

// `z` alone: no Ctrl, Alt, Meta or Shift, not a held repeat, not typed into a field.
export function isUndoKey(e: KeyboardEvent): boolean {
  return e.key === "z" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && !e.repeat && !e.defaultPrevented && !isTypingTarget(e.composedPath()[0] ?? e.target);
}

// The message `z` would undo: the newest one with an Undo that is not already running.
export function currentUndo(all: Message[]): Message | undefined {
  return all.find((m) => m.undo && !m.busy);
}

interface Item {
  el: HTMLElement;
  said: HTMLElement;
  warn: HTMLElement;
  warnText: HTMLElement;
  error: HTMLElement;
  undoBtn: HTMLButtonElement;
  undoLabel: HTMLElement;
  dismissBtn: HTMLButtonElement;
}

interface Settle {
  // Focus goes here when given.
  to?: HTMLElement | null;
  // The message whose own Dismiss takes focus when its Undo button goes.
  id?: number;
  // Prefer the control that caused the message (after a Dismiss or a timer).
  origin?: boolean;
}

interface Region {
  el: HTMLElement;
  messages: Message[];
  items: Map<number, Item>;
  nextId: number;
  timers: Map<number, number>;
  // The control that had focus when the last message was said: focus goes back there when
  // a button inside the region disappears under it.
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

  el.append(text, undoBtn, dismissBtn);
  return { el, said, warn, warnText, error, undoBtn, undoLabel, dismissBtn };
}

function paint(it: Item, m: Message): void {
  it.el.dataset.id = String(m.id);
  if (lasting(m)) it.el.dataset.lasting = "";
  else delete it.el.dataset.lasting;
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
  // Every message that stays can be dismissed; one that clears itself has no buttons. While
  // Undo runs, Dismiss waits, so the answer is not hidden.
  it.dismissBtn.hidden = m.clears;
  if (m.busy) it.dismissBtn.setAttribute("aria-disabled", "true");
  else it.dismissBtn.removeAttribute("aria-disabled");
}

// Makes the region's children the messages, in order, newest first. An item that is still
// there is changed in place, so a button that has focus keeps it and a text is not said twice.
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

// After the button that had focus goes away, focus lands somewhere sensible, never on the
// body: where the caller says, else the region's own Dismiss for that message, else the
// control that caused the message, else the main region.
function settleFocus(r: Region, s: Settle): void {
  if (s.to) return s.to.focus();
  const active = document.activeElement;
  if (active && r.el.contains(active) && active.isConnected && !(active as HTMLElement).hidden) return;
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
  const ids = new Set(next.map((m) => m.id));
  for (const [id, t] of r.timers) {
    if (!ids.has(id)) {
      window.clearTimeout(t);
      r.timers.delete(id);
    }
  }
  for (const m of next) {
    if (!m.clears || r.timers.has(m.id)) continue;
    const id = m.id;
    r.timers.set(
      id,
      window.setTimeout(() => {
        r.timers.delete(id);
        set(
          r,
          r.messages.filter((x) => x.id !== id),
          { origin: true },
        );
      }, CLEARS_AFTER_MS),
    );
  }
  if (settle.to || hadFocus) settleFocus(r, settle);
}

function region(el: HTMLElement): Region {
  let r = regions.get(el);
  if (r) return r;
  r = { el, messages: [], items: new Map(), nextId: 1, timers: new Map(), origin: null };
  regions.set(el, r);
  return r;
}

// The page's region: the first one enhanced, or the first one present.
function find(): Region | null {
  const el = document.querySelector<HTMLElement>("[data-cap='message'][data-cap-ready]") ?? document.querySelector<HTMLElement>("[data-cap='message']");
  if (!el) return null;
  if (!el.hasAttribute("data-cap-ready")) enhance(el.parentNode ?? document);
  return region(el);
}

// Says a message in the page's region. Does not move focus. A plain result replaces the
// plain result before it; a warning, a failure and a failed Undo stay.
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

// Says that something did not happen. Stays until dismissed.
export function fail(text: string): void {
  say(text, { failure: true });
}

function clearIn(r: Region, id?: number): void {
  set(
    r,
    id === undefined ? [] : r.messages.filter((m) => m.id !== id),
    { origin: true },
  );
}

// Clears the page's region, lasting messages too.
export function dismiss(): void {
  const r = find();
  if (r) clearIn(r);
}

async function undoIn(r: Region, id: number): Promise<boolean> {
  const m = r.messages.find((x) => x.id === id);
  if (!m?.undo || m.busy) return false;
  const run = m.undo;
  set(
    r,
    r.messages.map((x) => (x.id === id ? { ...x, busy: true, error: null } : x)),
  );
  try {
    await run();
  } catch (err) {
    // Nothing was undone, so Undo stays available, and the message says why. It stays too.
    if (r.messages.some((x) => x.id === id)) {
      set(
        r,
        r.messages.map((x) => (x.id === id ? { ...x, busy: false, error: undoErrorText(err) } : x)),
      );
    }
    return false;
  }
  const to = resolveFocus(m.returnFocus);
  // The Undo may have said something itself, which replaced this message: then there is
  // nothing more to say. Either way it has run.
  if (!r.messages.some((x) => x.id === id)) return true;
  const said = undoneText(m.text, m.undone);
  if (m.warning !== null) {
    // A result that carried a warning keeps it, without its Undo, and the Undo's own result
    // arrives beside it.
    const kept = r.messages.map((x) => (x.id === id ? { ...x, undo: null, busy: false, error: null } : x));
    set(r, withMessage(kept, newMessage(r.nextId++, said)), { to, id });
  } else {
    set(
      r,
      r.messages.map((x) => (x.id === id ? newMessage(id, said) : x)),
      { to, id },
    );
  }
  return true;
}

// Runs the current Undo, once. Returns false when there is nothing to undo.
export function runUndo(): Promise<boolean> {
  const r = find();
  const m = r ? currentUndo(r.messages) : undefined;
  return r && m ? undoIn(r, m.id) : Promise.resolve(false);
}

// Attaches to every [data-cap="message"] under root not yet attached: the region is empty
// and takes the messages said into it, each with its own Undo and Dismiss, and `z` on the
// document. A region with data-cap-undo-key="off" leaves `z` alone (single-key shortcuts
// can be switched off). Returns a function that detaches.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='message']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    if (!el.getAttribute("role")) el.setAttribute("role", "status");
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "Results and failures");
    // A new message is read by itself; the ones before it are not read again.
    if (!el.hasAttribute("aria-atomic")) el.setAttribute("aria-atomic", "false");
    // 0.1.0's region held one text and its two buttons directly: items replace them.
    for (const old of el.querySelectorAll(":scope > [data-cap-part]:not([data-cap-part='item'])")) old.remove();
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
