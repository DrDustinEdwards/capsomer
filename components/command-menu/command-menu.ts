// The command menu: the shared dialog (components/dialog) as a palette near the top, holding a
// combobox input and the shared listbox (components/listbox) in its "input" mode: the input
// keeps focus and names the active option (aria-activedescendant). Typing filters, arrows move
// the active option, Enter runs it, Esc closes. Ctrl K, Cmd K and "/" open it, through the
// shortcut registry. Every command shows its shortcut. No framework; the React wrapper uses
// the same pure functions.
import { closeDialog, openDialog, uid, wireDialog } from "../dialog/dialog.ts";
import { createListbox, filterCommands as filterItems, groupBy, matchesQuery as matches, step as stepIndex, type Listbox } from "../listbox/listbox.ts";
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

// The listbox's own filtering, grouping and stepping, under the names this module has always
// exported: a case-insensitive substring over the group, the label and the keywords (so the
// name of a group finds all of it; an empty query matches all).
export const matchesQuery = matches;
export const filterCommands = filterItems;
export const step = stepIndex;

// Commands by group, in the order each group first appears.
export function groupCommands<T extends { group: string }>(commands: T[]): Array<{ group: string; items: T[] }> {
  return groupBy(commands, (c) => c.group);
}

export function emptyText(query: string): string {
  return `No commands match “${query.trim()}”`;
}

export interface MenuOptions {
  // The input's accessible name (a visually hidden label).
  label?: string;
  // Shown in the empty input; "Search commands" by default.
  placeholder?: string;
}

const SEARCH_ICON = "M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z";

// Builds the dialog's markup, exactly the contract on the doc page.
export function buildMenu(commands: Command[], opts: MenuOptions = {}): HTMLDialogElement {
  const id = uid("cap-cmd");
  const d = document.createElement("dialog");
  d.className = "cap-dialog cap-cmd";
  d.dataset.cap = "command-menu";
  d.dataset.placement = "top";
  d.dataset.size = "lg";
  d.setAttribute("aria-label", "Command menu");

  const search = document.createElement("div");
  search.className = "cap-cmd-search";
  const ns = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(ns, "svg");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("fill", "currentColor");
  path.setAttribute("fill-rule", "evenodd");
  path.setAttribute("d", SEARCH_ICON);
  icon.append(path);
  const label = document.createElement("label");
  label.className = "cap-sr-only";
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
  input.placeholder = opts.placeholder ?? "Search commands";
  search.append(icon, label, input);

  const list = document.createElement("div");
  list.className = "cap-listbox cap-cmd-list";
  list.id = `${id}-list`;
  list.dataset.controlled = "";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Commands");
  groupCommands(commands).forEach((g, gi) => {
    const group = document.createElement("div");
    group.className = "cap-listbox-group";
    group.setAttribute("role", "group");
    group.setAttribute("aria-labelledby", `${id}-g${gi}`);
    const title = document.createElement("div");
    title.className = "cap-listbox-label";
    title.id = `${id}-g${gi}`;
    title.setAttribute("role", "presentation");
    title.textContent = g.group;
    group.append(title);
    for (const c of g.items) {
      const o = document.createElement("div");
      o.className = "cap-option";
      o.id = `${id}-o-${c.id}`;
      o.setAttribute("role", "option");
      o.dataset.capCommand = c.id;
      o.dataset.value = c.id;
      o.dataset.group = c.group;
      if (c.keywords?.length) o.dataset.keywords = c.keywords.join(",");
      const text = document.createElement("span");
      text.className = "cap-option-label";
      text.textContent = c.label;
      o.append(text);
      if (c.shortcut || c.hint) {
        const keys = document.createElement("span");
        keys.className = "cap-option-keys";
        if (c.hint) {
          const sr = document.createElement("span");
          sr.className = "cap-sr-only";
          sr.textContent = ", ";
          const hint = document.createElement("span");
          hint.className = "cap-option-hint";
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
  empty.className = "cap-listbox-empty";
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

// Wires one menu dialog: the shared dialog's rules (Esc, the backdrop, focus handed back), the
// shared listbox over the commands (filtering, the active option, Enter, a click), and Ctrl K to
// close. `run` is called with the chosen option after the dialog has closed.
export function attach(dialog: HTMLDialogElement, run: (option: HTMLElement) => void): Attached {
  const unwireBase = wireDialog(dialog);
  const input = dialog.querySelector<HTMLInputElement>("[role='combobox']");
  const list = dialog.querySelector<HTMLElement>("[role='listbox']");
  const empty = dialog.querySelector<HTMLElement>("[data-cap-part='empty']");
  if (!input || !list) return { open() {}, close() {}, setActive() {}, detach: unwireBase };
  list.dataset.controlled = "";
  // A menu written for 0.1 named keywords, group and the active option another way.
  for (const o of list.querySelectorAll<HTMLElement>("[role='option']")) {
    if (o.dataset.capKeywords && !o.dataset.keywords) o.dataset.keywords = o.dataset.capKeywords;
    if (o.dataset.capGroup && !o.dataset.group) o.dataset.group = o.dataset.capGroup;
    if (o.getAttribute("aria-selected") === "true") {
      o.removeAttribute("aria-selected");
      o.dataset.active = "";
    } else if (o.getAttribute("aria-selected") === "false") o.removeAttribute("aria-selected");
  }

  const lb: Listbox = createListbox(list, {
    input,
    empty,
    homeEnd: true,
    filterInput: true,
    onFilter(count, query) {
      input.setAttribute("aria-expanded", String(count > 0));
      if (empty) empty.textContent = count === 0 && query.trim() ? emptyText(query) : "";
    },
  });
  list.dataset.capReady = "";

  const choose = (o: HTMLElement | null | undefined) => {
    if (!o) return;
    dialog.close();
    run(o);
  };
  const onSelect = (e: Event) => choose((e as CustomEvent<{ option: HTMLElement }>).detail.option);
  const onKey = (e: KeyboardEvent) => {
    // The key that opened it closes it.
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.close();
    }
  };
  list.addEventListener("cap:option-select", onSelect);
  input.addEventListener("keydown", onKey);
  // A menu written with a query or an active option in its markup keeps them.
  const preset = lb.active();
  lb.filter(input.value);
  if (preset && !preset.hidden) lb.setActive(preset, { scroll: false });

  return {
    open(query = "", opener: Element | null = document.activeElement) {
      if (dialog.open) return;
      input.value = query;
      lb.filter(query);
      openDialog(dialog, opener, { focus: input });
    },
    close() {
      closeDialog(dialog);
    },
    setActive: (i) => lb.setActive(i),
    detach() {
      list.removeEventListener("cap:option-select", onSelect);
      input.removeEventListener("keydown", onKey);
      lb.detach();
      unwireBase();
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
