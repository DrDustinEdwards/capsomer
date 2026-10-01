import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { isBackdropClick, rememberOpener, returnFocus } from "../confirm-dialog/confirm-dialog.ts";
import { keyCaps, register } from "../shortcuts/shortcuts.ts";
import { emptyText, filterCommands, groupCommands, step, type Command } from "./command-menu.ts";

export type { Command } from "./command-menu.ts";

export interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: Command[];
  // The input's visible label.
  label?: string;
  placeholder?: string;
  // Binds Ctrl K, Cmd K and "/" to open it. On by default.
  bindKeys?: boolean;
}

function Keys({ spec }: { spec: string | string[] }) {
  const specs = Array.isArray(spec) ? spec : [spec];
  return (
    <span className="cap-cmd-keys">
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
    </span>
  );
}

export function CommandMenu({ open, onOpenChange, commands, label = "Search commands", placeholder, bindKeys = true }: CommandMenuProps) {
  const id = useId();
  const dlg = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setActive(0);
      rememberOpener(d, document.activeElement);
      d.showModal();
      input.current?.focus();
    } else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (activeCommand) document.getElementById(optionId(activeCommand))?.scrollIntoView({ block: "nearest" });
  }, [activeCommand]);

  const choose = (c: Command | undefined) => {
    if (!c) return;
    dlg.current?.close();
    c.run();
  };

  return (
    <dialog
      ref={dlg}
      className="cap-cmd"
      data-cap="command-menu"
      aria-label="Command menu"
      onClose={() => {
        const d = dlg.current;
        if (d) returnFocus(d);
        onOpenChange(false);
      }}
      onClick={(e) => {
        const d = dlg.current;
        if (d && isBackdropClick(d, e.nativeEvent)) d.close();
      }}
    >
      <div className="cap-cmd-search">
        <label className="cap-cmd-label" htmlFor={`${id}-input`}>
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
      <div className="cap-cmd-list" id={`${id}-list`} role="listbox" aria-label="Commands" hidden={shown.length === 0}>
        {groups.map((g, gi) => (
          <div className="cap-cmd-group" role="group" aria-labelledby={`${id}-g${gi}`} key={g.group}>
            <div className="cap-cmd-group-title" id={`${id}-g${gi}`} role="presentation">
              {g.group}
            </div>
            {g.items.map((c) => (
              <div
                key={c.id}
                id={optionId(c)}
                className="cap-cmd-option"
                role="option"
                aria-selected={c === activeCommand}
                onPointerMove={() => {
                  const i = shown.indexOf(c);
                  if (i !== cur) setActive(i);
                }}
                onClick={() => choose(c)}
              >
                <span className="cap-cmd-option-label">{c.label}</span>
                {c.shortcut ? <Keys spec={c.shortcut} /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="cap-cmd-empty" role="status">
        {shown.length === 0 ? emptyText(query) : ""}
      </p>
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
    </dialog>
  );
}
