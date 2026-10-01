// The page's one status region: the result of an action, said where the person is looking
// and never taking focus. A message with Undo stays until dismissed; `z` runs its Undo.
// No floating toast (decision, 0.1). No framework; the React wrapper uses the same helpers.

export interface SayOptions {
  // Reverses the action. Runs once; the region then says what was undone.
  undo?: () => void | Promise<void>;
  // What the region says once Undo has run: "The mention from fieldnotes.example is waiting
  // again." Defaults to "Undone: " and the message.
  undone?: string;
  // A plain confirmation ("Copied") that clears itself after 4 seconds. Only when the
  // control that caused it also shows it; ignored for a message with Undo.
  clears?: boolean;
}

export const CLEARS_AFTER_MS = 4000;

export function undoneText(text: string, undone?: string): string {
  return undone ? `Undone. ${undone}` : `Undone: ${text}`;
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

interface Region {
  el: HTMLElement;
  text: HTMLElement;
  undoBtn: HTMLButtonElement;
  dismissBtn: HTMLButtonElement;
  // Bumped by every say and every clear, so a late timer or a late Undo cannot act on a
  // message that has since been replaced.
  gen: number;
  undo: SayOptions["undo"] | null;
  undone?: string;
  said: string;
  pending: boolean;
  timer: number | undefined;
  // The control that had focus when the message was said: focus goes back there when a
  // button inside the region disappears under it.
  origin: Element | null;
}

const regions = new WeakMap<HTMLElement, Region>();

function part(el: HTMLElement, name: string, make: () => HTMLElement): HTMLElement {
  return el.querySelector<HTMLElement>(`[data-cap-part='${name}']`) ?? el.appendChild(make());
}

function button(name: string, cls: string, label: string, key?: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = cls;
  b.dataset.capPart = name;
  b.textContent = label;
  if (key) {
    const k = document.createElement("kbd");
    k.setAttribute("aria-hidden", "true");
    k.textContent = key;
    b.append(" ", k);
  }
  b.hidden = true;
  return b;
}

function region(el: HTMLElement): Region {
  let r = regions.get(el);
  if (r) return r;
  const text = part(el, "text", () => {
    const p = document.createElement("p");
    p.className = "cap-message-text";
    p.dataset.capPart = "text";
    return p;
  });
  const undoBtn = part(el, "undo", () => button("undo", "cap-link-btn cap-message-undo", "Undo", "z")) as HTMLButtonElement;
  const dismissBtn = part(el, "dismiss", () => button("dismiss", "cap-btn cap-message-dismiss", "Dismiss")) as HTMLButtonElement;
  r = { el, text, undoBtn, dismissBtn, gen: 0, undo: null, said: text.textContent ?? "", pending: false, timer: undefined, origin: null };
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

function focusInside(r: Region): boolean {
  return r.el.contains(document.activeElement);
}

// After the button that had focus goes away, focus lands somewhere sensible, never on the
// body: the region's Dismiss button if it is still shown, else the control that caused the
// message, else the main region.
function settleFocus(r: Region, hadFocus: boolean): void {
  if (!hadFocus) return;
  const active = document.activeElement;
  if (active && r.el.contains(active) && !(active as HTMLElement).hidden) return;
  if (!r.dismissBtn.hidden) return r.dismissBtn.focus();
  const back = r.origin instanceof HTMLElement && r.origin.isConnected ? r.origin : document.querySelector<HTMLElement>("main");
  back?.focus();
}

function show(r: Region, text: string, opts: SayOptions): void {
  window.clearTimeout(r.timer);
  r.gen += 1;
  r.undo = opts.undo ?? null;
  r.undone = opts.undone;
  r.said = text;
  r.pending = false;
  const clears = !!opts.clears && !opts.undo;
  r.undoBtn.hidden = !opts.undo;
  r.undoBtn.removeAttribute("aria-busy");
  // Every message that stays can be dismissed; one that clears itself has no buttons.
  r.dismissBtn.hidden = clears;
  // A live region does not announce the same text twice: clear it, then say it again on
  // the next frame.
  if (r.text.textContent === text) {
    r.text.textContent = "";
    const gen = r.gen;
    requestAnimationFrame(() => {
      if (r.gen === gen) r.text.textContent = text;
    });
  } else {
    r.text.textContent = text;
  }
  if (clears) {
    const gen = r.gen;
    r.timer = window.setTimeout(() => {
      if (r.gen === gen) clear(r);
    }, CLEARS_AFTER_MS);
  }
}

function clear(r: Region): void {
  const hadFocus = focusInside(r);
  window.clearTimeout(r.timer);
  r.gen += 1;
  r.undo = null;
  r.said = "";
  r.text.textContent = "";
  r.undoBtn.hidden = true;
  r.dismissBtn.hidden = true;
  settleFocus(r, hadFocus);
}

// Says a message in the page's region. Does not move focus.
export function say(text: string, opts: SayOptions = {}): void {
  const r = find();
  if (!r) {
    console.warn("capsomer message: no [data-cap='message'] region on this page.");
    return;
  }
  const active = document.activeElement;
  if (active && active !== document.body && !r.el.contains(active)) r.origin = active;
  show(r, text, opts);
}

// Clears the page's region.
export function dismiss(): void {
  const r = find();
  if (r) clear(r);
}

async function undoIn(r: Region): Promise<boolean> {
  if (!r.undo || r.pending) return false;
  const fn = r.undo;
  const gen = r.gen;
  const said = r.said;
  const hadFocus = focusInside(r);
  r.pending = true;
  r.undoBtn.setAttribute("aria-busy", "true");
  try {
    await fn();
  } catch {
    if (r.gen !== gen) return false;
    // Nothing was undone, so Undo stays available.
    r.pending = false;
    r.undoBtn.removeAttribute("aria-busy");
    r.text.textContent = "Could not undo that. Try again.";
    return false;
  }
  // The Undo may have said something itself; if not, say what was undone. Either way it
  // has run, and the Undo button is gone.
  if (r.gen === gen) show(r, undoneText(said, r.undone), {});
  settleFocus(r, hadFocus);
  return true;
}

// Runs the current Undo, once. Returns false when there is nothing to undo.
export function runUndo(): Promise<boolean> {
  const r = find();
  return r ? undoIn(r) : Promise.resolve(false);
}

// Attaches to every [data-cap="message"] under root not yet attached: the Undo and Dismiss
// buttons, and `z` on the document. A region with data-cap-undo-key="off" leaves `z` alone
// (single-key shortcuts can be switched off). Returns a function that detaches.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const el of root.querySelectorAll<HTMLElement>("[data-cap='message']:not([data-cap-ready])")) {
    el.dataset.capReady = "";
    if (!el.getAttribute("role")) el.setAttribute("role", "status");
    const r = region(el);
    const onClick = (e: MouseEvent) => {
      const b = (e.target as Element).closest("[data-cap-part]");
      if (b === r.undoBtn) void undoIn(r);
      else if (b === r.dismissBtn) clear(r);
    };
    const onKey = (e: KeyboardEvent) => {
      if (el.dataset.capUndoKey === "off" || !r.undo || !isUndoKey(e)) return;
      e.preventDefault();
      void undoIn(r);
    };
    el.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    undo.push(() => {
      el.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(r.timer);
      delete el.dataset.capReady;
    });
  }
  return () => undo.forEach((f) => f());
}
