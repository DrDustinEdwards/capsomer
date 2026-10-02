// The command menu: a modal dialog holding a combobox and a grouped listbox
// (aria-activedescendant). Typing filters, arrows move the active option, Enter runs it,
// Esc closes. Ctrl K, Cmd K and "/" open it, through the shortcut registry. Every command
// shows its shortcut. No framework; the React wrapper uses the same pure functions.
import { isBackdropClick, rememberOpener, returnFocus, uid } from "../confirm-dialog/confirm-dialog.ts";
import { keysFragment, register } from "../shortcuts/shortcuts.ts";

export interface Command {
  id: string;
  label: string;
  group: string;
  // Other words that find it: "home" finds Overview.
  keywords?: string[];
  // The registry's spec: "g o", "r", "Mod+k". Shown in <kbd>; registering it is the app's job.
  shortcut?: string | string[];
  // A short note beside the label, in words, for what the command will do or ask: "asks a
  // reason", "preview first", an item's state. Read by a screen reader after the label.
  hint?: string;
  run: () => void;
}

// Every way to stop something lives in one group, so typing "stop" lists them all. A stop
// command opens the control it stands for (a switch's reason field, the confirm dialog) and
// never performs anything itself. List a stop only while there is something to stop. There is
// no "stop everything" command.
export const STOP_GROUP = "Stop";
export const STOP_HINTS = { reason: "asks a reason", preview: "preview first" } as const;

// A stop command: group Stop, found by "stop" and "pause", its hint saying what opening it
// will ask for. `run` must only open the control.
export function stopCommand(o: { id: string; label: string; ask: keyof typeof STOP_HINTS; keywords?: string[]; run: () => void }): Command {
  return { id: o.id, label: o.label, group: STOP_GROUP, keywords: ["stop", "pause", ...(o.keywords ?? [])], hint: STOP_HINTS[o.ask], run: o.run };
}

// Case-insensitive substring over the group, the label and the keywords, so the name of a
// group finds all of it. An empty query matches all.
export function matchesQuery(c: { label: string; group?: string; keywords?: string[] }, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [c.group ?? "", c.label, ...(c.keywords ?? [])].some((t) => t.toLowerCase().includes(needle));
}

export function filterCommands<T extends { label: string; group?: string; keywords?: string[] }>(commands: T[], query: string): T[] {
  return commands.filter((c) => matchesQuery(c, query));
}

// Commands by group, in the order each group first appears.
export function groupCommands<T extends { group: string }>(commands: T[]): Array<{ group: string; items: T[] }> {
  const out: Array<{ group: string; items: T[] }> = [];
  for (const c of commands) {
    let g = out.find((x) => x.group === c.group);
    if (!g) {
      g = { group: c.group, items: [] };
      out.push(g);
    }
    g.items.push(c);
  }
  return out;
}

export function emptyText(query: string): string {
  return `No commands match “${query.trim()}”`;
}

// Moves an index by one, stopping at the ends.
export function step(index: number, by: 1 | -1, count: number): number {
  if (count === 0) return -1;
  if (index < 0) return by === 1 ? 0 : count - 1;
  return Math.min(count - 1, Math.max(0, index + by));
}

export interface MenuOptions {
  // The input's visible label.
  label?: string;
  placeholder?: string;
}

// Builds the dialog's markup, exactly the contract on the doc page.
export function buildMenu(commands: Command[], opts: MenuOptions = {}): HTMLDialogElement {
  const id = uid("cap-cmd");
  const d = document.createElement("dialog");
  d.className = "cap-cmd";
  d.dataset.cap = "command-menu";
  d.setAttribute("aria-label", "Command menu");

  const search = document.createElement("div");
  search.className = "cap-cmd-search";
  const label = document.createElement("label");
  label.className = "cap-cmd-label";
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
  if (opts.placeholder) input.placeholder = opts.placeholder;
  search.append(label, input);

  const list = document.createElement("div");
  list.className = "cap-cmd-list";
  list.id = `${id}-list`;
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Commands");
  groupCommands(commands).forEach((g, gi) => {
    const group = document.createElement("div");
    group.className = "cap-cmd-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", `${id}-g${gi}`);
    const title = document.createElement("div");
    title.className = "cap-cmd-group-title";
    title.id = `${id}-g${gi}`;
    title.setAttribute("role", "presentation");
    title.textContent = g.group;
    group.append(title);
    for (const c of g.items) {
      const o = document.createElement("div");
      o.className = "cap-cmd-option";
      o.id = `${id}-o-${c.id}`;
      o.setAttribute("role", "option");
      o.setAttribute("aria-selected", "false");
      o.dataset.capCommand = c.id;
      o.dataset.capGroup = c.group;
      if (c.keywords?.length) o.dataset.capKeywords = c.keywords.join(",");
      const text = document.createElement("span");
      text.className = "cap-cmd-option-label";
      text.textContent = c.label;
      o.append(text);
      if (c.shortcut || c.hint) {
        const keys = document.createElement("span");
        keys.className = "cap-cmd-keys";
        if (c.hint) {
          const sr = document.createElement("span");
          sr.className = "cap-sr-only";
          sr.textContent = ", ";
          const hint = document.createElement("span");
          hint.className = "cap-cmd-hint";
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
  empty.className = "cap-cmd-empty";
  empty.setAttribute("role", "status");
  empty.dataset.capPart = "empty";

  const foot = document.createElement("div");
  foot.className = "cap-cmd-foot";
  foot.setAttribute("aria-hidden", "true");
  const hint = (keys: string[], what: string) => {
    const s = document.createElement("span");
    keys.forEach((k, i) => {
      if (i > 0) s.append(" ");
      const kbd = document.createElement("kbd");
      kbd.textContent = k;
      s.append(kbd);
    });
    s.append(` ${what}`);
    return s;
  };
  foot.append(hint(["↑", "↓"], "move"), hint(["Enter"], "run"), hint(["Esc"], "close"));

  d.append(search, list, empty, foot);
  return d;
}

export interface Attached {
  open: (query?: string, opener?: Element | null) => void;
  close: () => void;
  // Makes the option at this index among those shown the active one.
  setActive: (index: number) => void;
  detach: () => void;
}

// Wires one menu dialog: filtering, the active option, Enter, a click on an option or the
// backdrop, and focus returned on close. `run` is called with the chosen option after the
// dialog has closed.
export function attach(dialog: HTMLDialogElement, run: (option: HTMLElement) => void): Attached {
  dialog.dataset.capReady = "";
  const input = dialog.querySelector<HTMLInputElement>("[role='combobox']");
  const listbox = dialog.querySelector<HTMLElement>("[role='listbox']");
  const empty = dialog.querySelector<HTMLElement>("[data-cap-part='empty']");
  const options = () => (listbox ? [...listbox.querySelectorAll<HTMLElement>("[role='option']")] : []);
  const shown = () => options().filter((o) => !o.hidden);
  const labelOf = (o: HTMLElement) => o.querySelector(".cap-cmd-option-label")?.textContent ?? o.textContent ?? "";
  // The group an option sits in: named on it, or by the heading of the group around it.
  const groupOf = (o: HTMLElement) => o.dataset.capGroup ?? o.closest("[role='group']")?.querySelector(".cap-cmd-group-title")?.textContent ?? "";

  const activeIndex = () => shown().findIndex((o) => o.getAttribute("aria-selected") === "true");
  const setActive = (index: number, scroll = true) => {
    const list = shown();
    const target = list[index] ?? null;
    for (const o of options()) o.setAttribute("aria-selected", String(o === target));
    if (target) {
      input?.setAttribute("aria-activedescendant", target.id);
      if (scroll) target.scrollIntoView({ block: "nearest" });
    } else input?.removeAttribute("aria-activedescendant");
  };

  const filter = () => {
    const q = input?.value ?? "";
    for (const o of options()) o.hidden = !matchesQuery({ label: labelOf(o), group: groupOf(o), keywords: (o.dataset.capKeywords ?? "").split(",").filter(Boolean) }, q);
    for (const g of listbox?.querySelectorAll<HTMLElement>("[role='group']") ?? []) g.hidden = !g.querySelector("[role='option']:not([hidden])");
    const any = shown().length > 0;
    input?.setAttribute("aria-expanded", String(any));
    if (listbox) listbox.hidden = !any;
    if (empty) empty.textContent = any ? "" : emptyText(q);
    setActive(any ? 0 : -1, false);
  };

  const choose = (o: HTMLElement | undefined) => {
    if (!o) return;
    dialog.close();
    run(o);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(step(activeIndex(), e.key === "ArrowDown" ? 1 : -1, shown().length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(shown()[activeIndex()]);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      // The key that opened it closes it.
      e.preventDefault();
      dialog.close();
    }
  };
  const optionAt = (e: Event) => (e.target as Element).closest<HTMLElement>("[role='option']");
  const onMove = (e: PointerEvent) => {
    const o = optionAt(e);
    if (o && o.getAttribute("aria-selected") !== "true") setActive(shown().indexOf(o), false);
  };
  const onClick = (e: MouseEvent) => {
    const o = optionAt(e);
    if (o) return choose(o);
    if (isBackdropClick(dialog, e)) dialog.close();
  };
  const onClose = () => returnFocus(dialog);

  input?.addEventListener("input", filter);
  input?.addEventListener("keydown", onKey);
  listbox?.addEventListener("pointermove", onMove);
  dialog.addEventListener("click", onClick);
  dialog.addEventListener("close", onClose);
  // A menu written with a query or an active option in its markup keeps them.
  const preset = activeIndex();
  filter();
  if (preset > 0) setActive(preset, false);

  return {
    open(query = "", opener: Element | null = document.activeElement) {
      if (dialog.open) return;
      rememberOpener(dialog, opener);
      if (input) input.value = query;
      filter();
      dialog.showModal();
      input?.focus();
    },
    close() {
      if (dialog.open) dialog.close();
    },
    setActive: (i) => setActive(i),
    detach() {
      input?.removeEventListener("input", filter);
      input?.removeEventListener("keydown", onKey);
      listbox?.removeEventListener("pointermove", onMove);
      dialog.removeEventListener("click", onClick);
      dialog.removeEventListener("close", onClose);
      delete dialog.dataset.capReady;
    },
  };
}

// The menu that openCommandMenu() opens: the last one created or enhanced.
let current: Attached | null = null;
let unregisterKeys: (() => void) | null = null;

function ensureShortcut(): void {
  if (unregisterKeys) return;
  unregisterKeys = register({ key: ["Mod+k", "/"], label: "Open the command menu", group: "General", run: () => openCommandMenu() });
}

export function openCommandMenu(query = ""): void {
  current?.open(query);
}

export interface CommandMenu extends Attached {
  dialog: HTMLDialogElement;
}

// Builds a menu from a list of commands, adds it to the page, and binds Ctrl K, Cmd K and
// "/" to open it.
export function createCommandMenu(commands: Command[], opts: MenuOptions = {}): CommandMenu {
  const dialog = buildMenu(commands, opts);
  document.body.append(dialog);
  const byId = new Map(commands.map((c) => [c.id, c]));
  const a = attach(dialog, (o) => byId.get(o.dataset.capCommand ?? "")?.run());
  current = a;
  ensureShortcut();
  return {
    ...a,
    dialog,
    detach() {
      a.detach();
      dialog.remove();
      if (current === a) current = null;
    },
  };
}

// Wires a menu written in markup: choosing an option follows its data-href, or dispatches a
// "cap-command" event (detail: { id }) on the dialog. Also wires every
// [data-cap-command-open] button under root, and binds the keys.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>("dialog.cap-cmd[data-cap='command-menu']:not([data-cap-ready])")) {
    const a = attach(dialog, (o) => {
      const href = o.dataset.href;
      if (href) location.assign(href);
      else dialog.dispatchEvent(new CustomEvent("cap-command", { bubbles: true, detail: { id: o.dataset.capCommand ?? o.id } }));
    });
    current = a;
    undo.push(a.detach);
  }
  for (const btn of root.querySelectorAll<HTMLElement>("[data-cap-command-open]:not([data-cap-ready])")) {
    btn.dataset.capReady = "";
    const onClick = () => current?.open("", btn);
    btn.addEventListener("click", onClick);
    undo.push(() => {
      btn.removeEventListener("click", onClick);
      delete btn.dataset.capReady;
    });
  }
  ensureShortcut();
  return () => undo.forEach((f) => f());
}
