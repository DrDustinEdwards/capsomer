// The command menu: the shared dialog as a palette over a combobox input and the shared listbox
// in "input" mode (focus stays in the input; aria-activedescendant names the active option).
import { closeDialog, openDialog, wireDialog } from "../dialog/dialog.ts";
import { createListbox, groupBy, type Listbox } from "../listbox/listbox.ts";
import { keysFragment, register } from "../shortcuts/shortcuts.ts";
import { readStored, uid, writeStored } from "../hooks/hooks.ts";

export interface Command {
  id: string;
  label: string;
  group: string;
  keywords?: string[];
  shortcut?: string | string[];
  // A short note read by a screen reader after the label ("asks a reason", "preview first").
  hint?: string;
  snippet?: string;
  of?: string;
  run: () => void;
}

// Commands for each page of an app's menu, so the menu and the command menu list the same pages.
export function navCommands(
  nav: ReadonlyArray<{ id: string; label: string; href: string; group?: string }>,
  go: (href: string) => void,
  group = "Go to",
): Command[] {
  return nav.map((e) => ({
    id: `go-${e.id}`,
    label: `Go to ${e.label}`,
    group,
    keywords: e.group ? [e.group, e.label] : [e.label],
    run: () => go(e.href),
  }));
}

export function markQuery(text: string, query: string): Array<{ text: string; mark: boolean }> {
  const words = [
    ...new Set(
      query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 1),
    ),
  ].sort((a, b) => b.length - a.length);
  if (!words.length) return [{ text, mark: false }];
  const lower = text.toLowerCase();
  const out: Array<{ text: string; mark: boolean }> = [];
  let at = 0;
  while (at < text.length) {
    let next = -1;
    let len = 0;
    for (const w of words) {
      const i = lower.indexOf(w, at);
      if (i >= 0 && (next < 0 || i < next || (i === next && w.length > len))) {
        next = i;
        len = w.length;
      }
    }
    if (next < 0) {
      out.push({ text: text.slice(at), mark: false });
      break;
    }
    if (next > at) out.push({ text: text.slice(at, next), mark: false });
    out.push({ text: text.slice(next, next + len), mark: true });
    at = next + len;
  }
  return out;
}

// The commands last run, newest first, in localStorage under `key` (ids only); shown as "Recent" while nothing is typed.
export const RECENT_MAX = 5;
export function readRecent(key: string): string[] {
  try {
    const v = JSON.parse(readStored(key) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
export function rememberRecent(key: string, id: string): string[] {
  const next = [id, ...readRecent(key).filter((x) => x !== id)].slice(0, RECENT_MAX);
  writeStored(key, JSON.stringify(next));
  return next;
}

// Every way to stop something is in one group, so typing "stop" lists them all. A stop command
// only opens the control it stands for and never performs anything itself.
export const STOP_GROUP = "Stop";
export const STOP_HINTS = { reason: "asks a reason", preview: "preview first" } as const;

// `run` must only open the control.
export function stopCommand(o: {
  id: string;
  label: string;
  ask: keyof typeof STOP_HINTS;
  keywords?: string[];
  run: () => void;
}): Command {
  return {
    id: o.id,
    label: o.label,
    group: STOP_GROUP,
    keywords: ["stop", "pause", ...(o.keywords ?? [])],
    hint: STOP_HINTS[o.ask],
    run: o.run,
  };
}

export function groupCommands<T extends { group: string }>(
  commands: T[],
): Array<{ group: string; items: T[] }> {
  return groupBy(commands, (c) => c.group);
}

export function emptyText(query: string): string {
  return `No commands match “${query.trim()}”`;
}

export const SEARCHING = "Searching…";

export interface MenuOptions {
  label?: string;
  placeholder?: string;
  search?: AttachOptions["search"];
  searchDelay?: number;
  recentKey?: string;
  ask?: AttachOptions["ask"];
  answer?: AttachOptions["answer"];
}

// What an answer under the list hands back: cancel stops it; the menu empties the region.
export interface AnswerRun {
  cancel(): void;
}

export interface AttachOptions {
  // Results from an async source as the person types. Called with the trimmed query and an
  // AbortSignal after `searchDelay` ms, never for an empty query. Results follow the matching
  // commands, unfiltered; their ids must not repeat a command's. A failed search keeps the last results.
  search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
  searchDelay?: number;
  // Remember the commands run under this localStorage key and list the last five as "Recent".
  recentKey?: string;
  // With words typed, a last option "Ask about “…”" hands them on (data-ask, data-ask-href in markup).
  ask?: { label?: string; run: (query: string) => void };
  // An answer under the list: a button that, when pressed, calls `run` with the words and the region
  // to fill. A deliberate action, never per key, since an answer costs a model call. `offer: false`
  // hides the button until the app calls `offerAnswer(true)`.
  answer?: {
    label?: string;
    offer?: boolean;
    run: (query: string, region: HTMLElement) => AnswerRun | Promise<AnswerRun>;
  };
}

export const ANSWER_LABEL = "Answer this";

// Starts an answer for the typed words, filling `region`. Returns null (and empties the region)
// when `wanted()` is false once the code has loaded.
export async function startAnswer(
  answer: NonNullable<AttachOptions["answer"]>,
  query: string,
  region: HTMLElement,
  wanted: () => boolean,
): Promise<{ run: AnswerRun } | { failed: string } | null> {
  let run: AnswerRun;
  try {
    run = await answer.run(query, region);
  } catch {
    return { failed: `${answer.label ?? ANSWER_LABEL} could not load. Try again.` };
  }
  if (!wanted()) {
    run.cancel();
    region.replaceChildren();
    return null;
  }
  return { run };
}

// Focus moves into the answer (its first focus target, or the region) before the button hides:
// hiding a focused button drops focus to <body>, which in a modal dialog leaves the person
// nowhere (WCAG 2.4.3).
export function focusAnswer(region: HTMLElement): void {
  region.hidden = false;
  (region.querySelector<HTMLElement>("[tabindex='-1']") ?? region).focus();
}

export function markSnippet(el: HTMLElement, query: string): void {
  const parts = markQuery(el.textContent ?? "", query);
  el.replaceChildren(
    ...parts.map((p) => {
      if (!p.mark) return document.createTextNode(p.text);
      const m = document.createElement("mark");
      m.textContent = p.text;
      return m;
    }),
  );
}

const SEARCH_ICON =
  "M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z";

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
      if (c.snippet) {
        o.dataset.label = c.label;
        const snip = document.createElement("span");
        snip.className = "cap-cmd-snippet";
        snip.textContent = c.snippet;
        text.append(snip);
      }
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

  if (opts.answer) d.append(search, list, empty, buildAnswerBox(opts.answer.label), foot);
  else d.append(search, list, empty, foot);
  return d;
}

function buildAnswerBox(label = ANSWER_LABEL): HTMLElement {
  const box = document.createElement("div");
  box.className = "cap-cmd-answer";
  box.dataset.capPart = "answer";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cap-btn";
  button.dataset.variant = "quiet";
  button.dataset.size = "sm";
  button.textContent = label;
  button.hidden = true;
  const status = document.createElement("p");
  status.className = "cap-cmd-answer-status";
  status.setAttribute("role", "status");
  const region = document.createElement("div");
  region.className = "cap-cmd-answer-region";
  region.tabIndex = -1;
  region.hidden = true;
  box.append(button, status, region);
  return box;
}

export interface Attached {
  open: (query?: string, opener?: Element | null) => void;
  close: () => void;
  setActive: (index: number) => void;
  offerAnswer: (on: boolean) => void;
  detach: () => void;
}

// Wires one menu dialog on the shared dialog and listbox. `run` is called with the chosen option
// after the dialog has closed.
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
  for (const o of list.querySelectorAll<HTMLElement>("[role='option']")) {
    if (o.dataset.capKeywords && !o.dataset.keywords) o.dataset.keywords = o.dataset.capKeywords;
    if (o.dataset.capGroup && !o.dataset.group) o.dataset.group = o.dataset.capGroup;
    if (o.getAttribute("aria-selected") === "true") {
      o.removeAttribute("aria-selected");
      o.dataset.active = "";
    } else if (o.getAttribute("aria-selected") === "false") o.removeAttribute("aria-selected");
  }

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

  // Recent (nothing typed) and Ask (words typed), rebuilt on every key before the listbox filters.
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

  // Live results keep the query as their keyword, so the filter shows them whatever their words.
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
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      dialog.close();
    }
  };
  list.addEventListener("cap:option-select", onSelect);
  input.addEventListener("keydown", onKey);
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

let current: Attached | null = null;
let unregisterKeys: (() => void) | null = null;

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

// Wires a menu written in markup: a choice follows its data-href or dispatches "cap-command" ({ id })
// on the dialog; data-recent-key and data-ask enable Recent and Ask.
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
