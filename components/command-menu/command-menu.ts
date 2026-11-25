// The command menu: the shared dialog (components/dialog) as a palette near the top, holding a
// combobox input and the shared listbox (components/listbox) in its "input" mode: the input
// keeps focus and names the active option (aria-activedescendant). Typing filters, arrows move
// the active option, Enter runs it, Esc closes. Ctrl K, Cmd K and "/" open it, through the
// shortcut registry. Every command shows its shortcut. No framework; the React wrapper uses
// the same pure functions.
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";
import { createListbox, type Listbox } from "../listbox/listbox.ts";
import { register } from "../shortcuts/shortcuts.ts";
import {
  type Command,
  readRecent,
  rememberRecent,
  emptyText,
  SEARCHING,
} from "./command-menu-model.ts";
import {
  type MenuOptions,
  type AnswerRun,
  type AttachOptions,
  startAnswer,
  focusAnswer,
  markSnippet,
  buildMenu,
} from "./command-menu-build.ts";
export {
  ANSWER_LABEL,
  startAnswer,
  focusAnswer,
  markSnippet,
  buildMenu,
} from "./command-menu-build.ts";
export type { MenuOptions, AnswerRun, AttachOptions } from "./command-menu-build.ts";
export {
  navCommands,
  markQuery,
  RECENT_MAX,
  readRecent,
  rememberRecent,
  STOP_GROUP,
  STOP_HINTS,
  stopCommand,
  groupCommands,
  emptyText,
  SEARCHING,
} from "./command-menu-model.ts";
export type { Command } from "./command-menu-model.ts";

export interface Attached {
  open: (query?: string, opener?: Element | null) => void;
  close: () => void;
  // Makes the option at this index among those shown the active one.
  setActive: (index: number) => void;
  // Offers the answer under the list for the words typed now, or withdraws it (opts.answer).
  offerAnswer: (on: boolean) => void;
  detach: () => void;
}

// Wires one menu dialog: the shared dialog's rules (Esc, the backdrop, focus handed back), the
// shared listbox over the commands (filtering, the active option, Enter, a click), and Ctrl K to
// close. `run` is called with the chosen option after the dialog has closed, and with its command
// when the option is a live result (`opts.search`).
export function attach(
  dialog: HTMLDialogElement,
  run: (option: HTMLElement, found?: Command) => void,
  opts: AttachOptions = {},
): Attached {
  const unwireBase = wireDialog(dialog);
  const input = dialog.querySelector<HTMLInputElement>("[role='combobox']");
  const list = dialog.querySelector<HTMLElement>("[role='listbox']");
  const empty = dialog.querySelector<HTMLElement>("[data-cap-part='empty']");
  if (!input || !list)
    return { open() {}, close() {}, setActive() {}, offerAnswer() {}, detach: unwireBase };
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

  // A live search not yet answered: the list is busy, and an empty one says Searching.
  let busy = false;
  const lb: Listbox = createListbox(list, {
    input,
    empty,
    homeEnd: true,
    filterInput: true,
    onFilter(count, query) {
      input.setAttribute("aria-expanded", String(count > 0));
      if (empty)
        empty.textContent = count > 0 || !query.trim() ? "" : busy ? SEARCHING : emptyText(query);
    },
  });
  list.dataset.capReady = "";

  const recentKey = opts.recentKey ?? dialog.dataset.recentKey;
  const choose = (o: HTMLElement | null | undefined) => {
    if (!o) return;
    const typed = input.value.trim();
    dialog.close();
    if (o.dataset.capAsk !== undefined) {
      opts.ask?.run(typed);
      return;
    }
    const cmd = o.dataset.capCommand ?? "";
    if (recentKey && cmd) rememberRecent(recentKey, cmd);
    run(o, live.get(cmd));
  };

  // Recent (while nothing is typed: copies of the last commands run, first) and Ask (while words
  // are typed: one option, last). Rebuilt on every key, before the listbox's filter runs again.
  const extras = () => {
    for (const g of list.querySelectorAll("[data-recent], [data-ask-group]")) g.remove();
    const typed = input.value.trim();
    for (const s of list.querySelectorAll<HTMLElement>(".cap-cmd-snippet")) markSnippet(s, typed);
    if (recentKey && !typed) {
      const copies = readRecent(recentKey).flatMap((rid) => {
        const o = list.querySelector<HTMLElement>(
          `[role='option'][data-cap-command="${CSS.escape(rid)}"]`,
        );
        if (!o || o.closest("[data-live]")) return [];
        const copy = o.cloneNode(true) as HTMLElement;
        copy.id = `${o.id}-recent`;
        copy.dataset.group = "Recent";
        copy.hidden = false;
        delete copy.dataset.active;
        return [copy];
      });
      if (copies.length) list.prepend(extraGroup("Recent", "data-recent", copies));
    }
    if (opts.ask && typed) {
      const o = document.createElement("div");
      o.className = "cap-option";
      o.id = `${list.id}-ask`;
      o.setAttribute("role", "option");
      o.dataset.capAsk = "";
      o.dataset.group = "Ask";
      o.dataset.keywords = typed.toLowerCase();
      const text = document.createElement("span");
      text.className = "cap-option-label";
      text.textContent = `${opts.ask.label ?? "Ask about"} “${typed}”`;
      o.append(text);
      list.append(extraGroup("Ask", "data-ask-group", [o]));
    }
  };
  const extraGroup = (name: string, mark: string, options: HTMLElement[]) => {
    const g = document.createElement("div");
    g.className = "cap-listbox-group";
    g.setAttribute("role", "group");
    g.setAttribute(mark, "");
    const title = document.createElement("div");
    title.className = "cap-listbox-label";
    title.id = `${list.id}-${mark}`;
    title.setAttribute("role", "presentation");
    title.textContent = name;
    g.setAttribute("aria-labelledby", title.id);
    g.append(title, ...options);
    return g;
  };
  const hasExtras = Boolean(recentKey || opts.ask || list.querySelector(".cap-cmd-snippet"));
  const onExtras = () => {
    extras();
    lb.filter(input.value);
  };

  // The live results: groups built as buildMenu builds them, marked data-live, after the menu's
  // own. Each keeps the query as its keyword, so the menu's filter shows it whatever its words.
  const live = new Map<string, Command>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: AbortController | null = null;
  const setBusy = (next: boolean) => {
    busy = next;
    if (next) list.setAttribute("aria-busy", "true");
    else list.removeAttribute("aria-busy");
  };
  const show = (commands: Command[], query: string) => {
    for (const g of list.querySelectorAll("[data-live]")) g.remove();
    live.clear();
    for (const g of buildMenu(commands).querySelectorAll<HTMLElement>(".cap-listbox-group")) {
      g.dataset.live = "";
      for (const o of g.querySelectorAll<HTMLElement>("[role='option']"))
        o.dataset.keywords = query.toLowerCase();
      list.append(g);
    }
    for (const c of commands) live.set(c.id, c);
    if (hasExtras || commands.some((c) => c.snippet)) extras();
    lb.filter(input.value);
  };
  const stopSearch = () => {
    clearTimeout(timer);
    pending?.abort();
    pending = null;
  };
  const startSearch = () => {
    const ask = opts.search;
    if (!ask) return;
    stopSearch();
    const q = input.value.trim();
    if (!q) {
      setBusy(false);
      show([], "");
      return;
    }
    const ctrl = new AbortController();
    pending = ctrl;
    setBusy(true);
    lb.filter(input.value);
    timer = setTimeout(() => {
      ask(q, ctrl.signal).then(
        (commands) => {
          if (ctrl.signal.aborted) return;
          setBusy(false);
          show(commands, q);
        },
        () => {
          if (ctrl.signal.aborted) return;
          setBusy(false);
          lb.filter(input.value);
        },
      );
    }, opts.searchDelay ?? 180);
  };
  const onClose = () => {
    stopSearch();
    setBusy(false);
  };

  // The answer under the list (opts.answer).
  const answer = opts.answer;
  const answerBox = dialog.querySelector<HTMLElement>("[data-cap-part='answer']");
  const answerButton = answerBox?.querySelector<HTMLButtonElement>("button");
  const answerStatus = answerBox?.querySelector<HTMLElement>("[role='status']");
  const answerRegion = answerBox?.querySelector<HTMLElement>(".cap-cmd-answer-region");
  let answerRun: AnswerRun | null = null;
  let answerLoading = false;
  let offered = answer?.offer ?? true;
  const showAnswerButton = () => {
    if (answerButton) answerButton.hidden = !(offered && !answerRun && input.value.trim());
  };
  const resetAnswer = () => {
    answerRun?.cancel();
    answerRun = null;
    answerRegion?.replaceChildren();
    if (answerRegion) answerRegion.hidden = true;
    if (answerStatus) answerStatus.textContent = "";
    offered = answer?.offer ?? true;
    showAnswerButton();
  };
  const runAnswer = async () => {
    const q = input.value.trim();
    // The button stays while the code loads, so a second press must not start a second answer.
    if (!answer || !answerRegion || !q || answerLoading || answerRun) return;
    answerLoading = true;
    const got = await startAnswer(
      answer,
      q,
      answerRegion,
      () => dialog.open && input.value.trim() === q,
    );
    answerLoading = false;
    if (!got) return;
    if ("failed" in got) {
      if (answerStatus) answerStatus.textContent = got.failed;
      return;
    }
    answerRun = got.run;
    if (answerStatus) answerStatus.textContent = "";
    focusAnswer(answerRegion);
    showAnswerButton();
  };
  const onAnswerClick = () => void runAnswer();
  // After the listbox's own input listener, so its filter has run.
  if (hasExtras) input.addEventListener("input", onExtras);
  if (opts.search) {
    input.addEventListener("input", startSearch);
    dialog.addEventListener("close", onClose);
  }
  if (answer) {
    input.addEventListener("input", resetAnswer);
    dialog.addEventListener("close", resetAnswer);
    answerButton?.addEventListener("click", onAnswerClick);
  }
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
      if (answer) resetAnswer();
      if (hasExtras) extras();
      lb.filter(query);
      startSearch();
      openDialog(dialog, opener, { focus: input });
    },
    close() {
      closeDialog(dialog);
    },
    setActive: (i) => lb.setActive(i),
    offerAnswer(on) {
      offered = on;
      showAnswerButton();
    },
    detach() {
      list.removeEventListener("cap:option-select", onSelect);
      input.removeEventListener("keydown", onKey);
      input.removeEventListener("input", startSearch);
      input.removeEventListener("input", onExtras);
      dialog.removeEventListener("close", onClose);
      input.removeEventListener("input", resetAnswer);
      dialog.removeEventListener("close", resetAnswer);
      answerButton?.removeEventListener("click", onAnswerClick);
      resetAnswer();
      stopSearch();
      lb.detach();
      unwireBase();
    },
  };
}

// The menu that openCommandMenu() opens: the last one created or enhanced.
let current: Attached | null = null;
let unregisterKeys: (() => void) | null = null;

// A menu taken down is no longer the one Ctrl K opens.
function release(a: Attached): void {
  a.detach();
  if (current === a) current = null;
}

function ensureShortcut(): void {
  if (unregisterKeys) return;
  unregisterKeys = register({
    key: ["Mod+k", "/"],
    label: "Open the command menu",
    group: "General",
    run: () => openCommandMenu(),
  });
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
  const a = attach(dialog, (o, found) => (found ?? byId.get(o.dataset.capCommand ?? ""))?.run(), {
    search: opts.search,
    searchDelay: opts.searchDelay,
    recentKey: opts.recentKey,
    ask: opts.ask,
    answer: opts.answer,
  });
  current = a;
  ensureShortcut();
  return {
    ...a,
    dialog,
    detach() {
      release(a);
      dialog.remove();
    },
  };
}

// Wires a menu written in markup: choosing an option follows its data-href, or dispatches a
// "cap-command" event (detail: { id }) on the dialog. With data-recent-key it lists recents;
// with data-ask, Ask follows data-ask-href with the words in `q`, or dispatches "cap-command"
// with { id: "ask", query }. Also wires every [data-cap-command-open] button under root, and
// binds the keys.
export function enhance(root: ParentNode = document): () => void {
  const undo: Array<() => void> = [];
  for (const dialog of root.querySelectorAll<HTMLDialogElement>(
    "dialog.cap-cmd[data-cap='command-menu']:not([data-cap-ready])",
  )) {
    const askHref = dialog.dataset.askHref;
    const ask =
      dialog.dataset.ask === undefined
        ? undefined
        : {
            label: dialog.dataset.ask || undefined,
            run: (query: string) => {
              if (askHref) {
                const url = new URL(askHref, location.href);
                url.searchParams.set("q", query);
                location.assign(url);
              } else
                dialog.dispatchEvent(
                  new CustomEvent("cap-command", { bubbles: true, detail: { id: "ask", query } }),
                );
            },
          };
    const a = attach(
      dialog,
      (o) => {
        const href = o.dataset.href;
        if (href) location.assign(href);
        else
          dialog.dispatchEvent(
            new CustomEvent("cap-command", {
              bubbles: true,
              detail: { id: o.dataset.capCommand ?? o.id },
            }),
          );
      },
      { ask },
    );
    current = a;
    undo.push(() => release(a));
  }
  for (const btn of root.querySelectorAll<HTMLElement>(
    "[data-cap-command-open]:not([data-cap-ready])",
  )) {
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
