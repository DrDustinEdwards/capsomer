import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Dialog } from "../dialog/dialog.react.tsx";
import { Listbox, ListboxEmpty, Option, OptionGroup } from "../listbox/listbox.react.tsx";
import { keyCaps, register } from "../shortcuts/shortcuts.ts";
import { emptyText, filterCommands, groupCommands, step, type Command } from "./command-menu.ts";

export type { Command } from "./command-menu.ts";
export { STOP_GROUP, STOP_HINTS, stopCommand } from "./command-menu.ts";

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  // The input's accessible name (a visually hidden label).
  label?: string;
  placeholder?: string;
  // Binds Ctrl K, Cmd K and "/" to open it. On by default.
  bindKeys?: boolean;
}

// The shortcut caps of a command, after the words that say it is a shortcut.
function Caps({ spec }: { spec: string | string[] }) {
  const specs = Array.isArray(spec) ? spec : [spec];
  return (
    <>
      <span className="cap-sr-only">, shortcut </span>
      {specs.map((s, i) => (
        <Fragment key={s}>
          {i > 0 ? " or " : null}
          {keyCaps(s).map((cap, j) => (
            <Fragment key={`${cap}-${j}`}>
              {j > 0 ? " " : null}
              <kbd>{cap}</kbd>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </>
  );
}

const SEARCH_ICON = <path fill="currentColor" fillRule="evenodd" d="M7 2.5a4.5 4.5 0 1 0 2.7 8.1l3 3 1.1-1.1-3-3A4.5 4.5 0 0 0 7 2.5zm0 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />;

export function CommandMenu({ open, onOpenChange, commands, label = "Search commands", placeholder = "Search commands", bindKeys = true }: CommandMenuProps) {
  const id = useId();
  const dlg = useRef<HTMLDialogElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const shown = useMemo(() => filterCommands(commands, query), [commands, query]);
  const groups = useMemo(() => groupCommands(shown), [shown]);
  const cur = shown.length ? Math.min(active, shown.length - 1) : -1;
  const optionId = (c: Command) => `${id}-o-${c.id}`;
  const activeCommand = cur >= 0 ? shown[cur] : undefined;

  useEffect(() => {
    if (!bindKeys) return;
    return register({ key: ["Mod+k", "/"], label: "Open the command menu", group: "General", run: () => onOpenChange(true) });
  }, [bindKeys, onOpenChange]);

  // A fresh menu each time it opens: nothing typed, the first command active.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
  }, [open]);

  useEffect(() => {
    if (activeCommand) document.getElementById(optionId(activeCommand))?.scrollIntoView({ block: "nearest" });
  }, [activeCommand]);

  const setRef = useCallback((el: HTMLDialogElement | null) => {
    dlg.current = el;
  }, []);

  const choose = (c: Command | undefined) => {
    if (!c) return;
    dlg.current?.close();
    c.run();
  };

  return (
    <Dialog ref={setRef} className="cap-cmd" open={open} onOpenChange={onOpenChange} placement="top" size="lg" closeButton={false} initialFocus={input} aria-label="Command menu">
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
            } else if (e.key === "Enter") {
              e.preventDefault();
              choose(activeCommand);
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
              e.preventDefault();
              dlg.current?.close();
            }
          }}
        />
      </div>
      <Listbox id={`${id}-list`} className="cap-cmd-list" mode="input" controlled aria-label="Commands" hidden={shown.length === 0}>
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
              </Option>
            ))}
          </OptionGroup>
        ))}
      </Listbox>
      <ListboxEmpty>{shown.length === 0 ? emptyText(query) : ""}</ListboxEmpty>
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
