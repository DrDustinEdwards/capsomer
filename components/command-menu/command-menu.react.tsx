import { useCallback, useEffect, useId, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Dialog } from "../dialog/dialog.react.tsx";
import { Listbox, ListboxEmpty, Option, OptionGroup } from "../listbox/listbox.react.tsx";
import { isImeEnter, register } from "../shortcuts/shortcuts.ts";
import { Keys } from "../shortcuts/shortcuts.react.tsx";
import {
  emptyText,
  filterCommands,
  groupCommands,
  markQuery,
  readRecent,
  rememberRecent,
  SEARCHING,
  step,
  type Command,
} from "./command-menu.ts";

export type { Command } from "./command-menu.ts";
export {
  markQuery,
  navCommands,
  SEARCHING,
  STOP_GROUP,
  STOP_HINTS,
  stopCommand,
} from "./command-menu.ts";

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  // The input's accessible name (a visually hidden label).
  label?: string;
  placeholder?: string;
  // Binds Ctrl K, Cmd K and "/" to open it. On by default.
  bindKeys?: boolean;
  // Results from an async source as the person types (books, people, records). Called with the
  // trimmed query and an AbortSignal, `searchDelay` ms (180) after the last key, never for an
  // empty query; the signal aborts when the query changes or the menu closes. Its commands come
  // after the matching `commands`, in their own groups and order, unfiltered; their ids must not
  // repeat a command's. The last results stay until new ones arrive; a failed search keeps them.
  search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
  searchDelay?: number;
  // Remember the commands run, per site, under this localStorage key, and list the last five as
  // "Recent" while nothing is typed.
  recentKey?: string;
  // The way past the commands: with words typed, a last option "Ask about “…”" hands them on
  // (to an assistant, a site search).
  ask?: { label?: string; run: (query: string) => void };
}

// A search result's line under its label, with the typed words marked.
function Snippet({ text, query }: { text: string; query: string }) {
  return (
    <span className="cap-cmd-snippet">
      {markQuery(text, query).map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : p.text))}
    </span>
  );
}

// The shortcut caps of a command, after the words that say it is a shortcut.
function Caps({ spec }: { spec: string | string[] }) {
  return (
    <>
      <span className="cap-sr-only">, shortcut </span>
      <Keys spec={spec} />
    </>
  );
}

const SEARCH_ICON = (
  <path
    fill="currentColor"
    fillRule="evenodd"
    d="M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"
  />
);

export function CommandMenu({
  open,
  onOpenChange,
  commands,
  label = "Search commands",
  placeholder = "Search commands",
  bindKeys = true,
  search,
  searchDelay = 180,
  recentKey,
  ask,
}: CommandMenuProps) {
  const id = useId();
  const dlg = useRef<HTMLDialogElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [found, setFound] = useState<Command[]>([]);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(recentKey && open ? readRecent(recentKey) : []), [recentKey, open]);
  const shown = useMemo(() => {
    const typed = query.trim();
    const recents = typed
      ? []
      : recent.flatMap((rid) => {
          const c = commands.find((x) => x.id === rid);
          return c ? [{ ...c, id: `recent-${c.id}`, group: "Recent", run: c.run, of: c.id }] : [];
        });
    const asking: Command[] =
      ask && typed
        ? [
            {
              id: "ask",
              label: `${ask.label ?? "Ask about"} “${typed}”`,
              group: "Ask",
              run: () => ask.run(typed),
            },
          ]
        : [];
    return [...recents, ...filterCommands(commands, query), ...found, ...asking];
  }, [commands, query, found, recent, ask]);
  const groups = useMemo(() => groupCommands(shown), [shown]);
  const cur = shown.length ? Math.min(active, shown.length - 1) : -1;
  const optionId = (c: Command) => `${id}-o-${c.id}`;
  const activeCommand = cur >= 0 ? shown[cur] : undefined;

  useEffect(() => {
    if (!bindKeys) return;
    return register({
      key: ["Mod+k", "/"],
      label: "Open the command menu",
      group: "General",
      run: () => onOpenChange(true),
    });
  }, [bindKeys, onOpenChange]);

  // A fresh menu each time it opens: nothing typed, the first command active.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
  }, [open]);

  // The live search: debounced, the one before aborted, nothing for an empty query. Read through
  // a ref, so an inline function does not start a search on every render.
  const q = query.trim();
  const searchRef = useRef(search);
  useLayoutEffect(() => {
    searchRef.current = search;
  });
  const live = search != null;
  useEffect(() => {
    const run = searchRef.current;
    if (!run || !open || !q) {
      setFound([]);
      setBusy(false);
      return;
    }
    const ctrl = new AbortController();
    setBusy(true);
    const timer = setTimeout(() => {
      run(q, ctrl.signal).then(
        (results) => {
          if (ctrl.signal.aborted) return;
          setFound(results);
          setBusy(false);
        },
        () => {
          if (!ctrl.signal.aborted) setBusy(false);
        },
      );
    }, searchDelay);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [live, searchDelay, open, q]);

  useEffect(() => {
    if (activeCommand)
      document.getElementById(optionId(activeCommand))?.scrollIntoView({ block: "nearest" });
    // oxlint-disable-next-line react/exhaustive-deps -- optionId only formats ids from this menu's useId
  }, [activeCommand]);

  const setRef = useCallback((el: HTMLDialogElement | null) => {
    dlg.current = el;
  }, []);

  const choose = (c: Command | undefined) => {
    if (!c) return;
    dlg.current?.close();
    if (recentKey && c.id !== "ask") setRecent(rememberRecent(recentKey, c.of ?? c.id));
    c.run();
  };

  return (
    <Dialog
      ref={setRef}
      className="cap-cmd"
      open={open}
      onOpenChange={onOpenChange}
      placement="top"
      size="lg"
      closeButton={false}
      initialFocus={input}
      aria-label="Command menu"
    >
      <div className="cap-cmd-search">
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
          {SEARCH_ICON}
        </svg>
        <label className="cap-sr-only" htmlFor={`${id}-input`}>
          {label}
        </label>
        <input
          ref={input}
          className="cap-cmd-input"
          id={`${id}-input`}
          type="text"
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-expanded={shown.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={activeCommand ? optionId(activeCommand) : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setActive(step(cur, e.key === "ArrowDown" ? 1 : -1, shown.length));
            } else if (e.key === "Home" || e.key === "End") {
              e.preventDefault();
              setActive(e.key === "Home" ? 0 : Math.max(0, shown.length - 1));
            } else if (e.key === "Enter" && !isImeEnter(e.nativeEvent)) {
              e.preventDefault();
              choose(activeCommand);
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
              e.preventDefault();
              dlg.current?.close();
            }
          }}
        />
      </div>
      <Listbox
        id={`${id}-list`}
        className="cap-cmd-list"
        mode="input"
        controlled
        aria-label="Commands"
        aria-busy={busy || undefined}
        hidden={shown.length === 0}
      >
        {groups.map((g) => (
          <OptionGroup label={g.group} key={g.group}>
            {g.items.map((c) => (
              <Option
                key={c.id}
                id={optionId(c)}
                active={c === activeCommand}
                hint={c.hint}
                keys={c.shortcut ? <Caps spec={c.shortcut} /> : undefined}
                onPointerMove={() => {
                  const i = shown.indexOf(c);
                  if (i !== cur) setActive(i);
                }}
                // The input keeps focus: a press on an option must not take it.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => choose(c)}
              >
                {c.label}
                {c.snippet ? <Snippet text={c.snippet} query={query} /> : null}
              </Option>
            ))}
          </OptionGroup>
        ))}
      </Listbox>
      <ListboxEmpty>{shown.length === 0 ? (busy ? SEARCHING : emptyText(query)) : ""}</ListboxEmpty>
      <div className="cap-cmd-foot" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> move
        </span>
        <span>
          <kbd>Enter</kbd> run
        </span>
        <span>
          <kbd>Esc</kbd> close
        </span>
      </div>
    </Dialog>
  );
}
