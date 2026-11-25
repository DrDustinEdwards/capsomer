// The command menu's markup and its answer box: buildMenu makes exactly the contract on the doc page, startAnswer fills
// the region under the list (command-menu.ts wires them).
import { keysFragment } from "../shortcuts/shortcuts.ts";
import { uid } from "../hooks/hooks.ts";
import { type Command, markQuery, groupCommands } from "./command-menu-model.ts";

export interface MenuOptions {
  // The input's accessible name (a visually hidden label).
  label?: string;
  // Shown in the empty input; "Search commands" by default.
  placeholder?: string;
  // Live results as the person types, as the React menu's `search`: see AttachOptions.
  search?: AttachOptions["search"];
  searchDelay?: number;
  // Recents and Ask, as the React menu's: see AttachOptions.
  recentKey?: string;
  ask?: AttachOptions["ask"];
  // An answer under the list, as attach's: buildMenu reads only its label.
  answer?: AttachOptions["answer"];
}

// What an answer under the list hands back: cancel stops it (the query changed, the menu
// closed) and empties nothing itself; the menu empties the region.
export interface AnswerRun {
  cancel(): void;
}

export interface AttachOptions {
  // Results from an async source as the person types (books, people, records). Called with the
  // trimmed query and an AbortSignal, `searchDelay` ms (180) after the last key, never for an
  // empty query; the signal aborts when the query changes or the menu closes. Its commands come
  // after the matching commands, in their own groups and order, unfiltered; their ids must not
  // repeat a command's. The last results stay until new ones arrive; a failed search keeps them.
  search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
  searchDelay?: number;
  // Remember the commands run, per site, under this localStorage key, and list the last five as
  // "Recent" while nothing is typed. In markup: data-recent-key on the dialog.
  recentKey?: string;
  // With words typed, a last option "Ask about “…”" hands them on (an assistant, a site
  // search). In markup: data-ask (its words, "Ask about" when empty) and data-ask-href.
  ask?: { label?: string; run: (query: string) => void };
  // An answer under the list, in the menu itself (an AI answer about the typed words): a quiet
  // button with `label` ("Answer this" when empty), shown while words are typed and the answer
  // is offered. Pressing it calls `run` with the words and the region to fill (it may load its
  // code first and return a promise); focus moves into the region and the button hides. Typing
  // again or closing cancels it and empties the region. A deliberate second action, never on
  // each key, since an answer costs a model call. `offer: false` keeps the button hidden for each
  // new query until the app calls `offerAnswer(true)` (when its search says answers are on).
  answer?: {
    label?: string;
    offer?: boolean;
    run: (query: string, region: HTMLElement) => AnswerRun | Promise<AnswerRun>;
  };
}

export const ANSWER_LABEL = "Answer this";

// Starts an answer for the words typed, filling `region`, for the menu without React and the
// React menu alike. A failed load gives the words the status says (the button stays, so the
// person can try again). When `wanted()` is false once the code has loaded (the words changed or
// the menu closed), the answer is for nothing shown: it is canceled, the region emptied, and
// null returned.
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

// Fills a snippet with its text, the typed words in <mark>; built from nodes, never from HTML.
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
      if (c.snippet) {
        // The filter reads the label alone, as the React menu's does.
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

// The answer area under the list: its button, a status for a failed load, and the region.
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
