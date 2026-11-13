// The command menu's host without React, light: it imports nothing of the menu until the page
// is idle (requestIdleCallback, two seconds at most), or until Ctrl K, Cmd K, a
// [data-cap-command-open] button or `open` asks for it, and then loads command-menu.ts and builds
// the menu. Import it from capsomer/behavior/command-host so the first load carries only this.
import type { Command, CommandMenu, MenuOptions } from "./command-menu.ts";

// Calls `fn` once the page is idle, `timeout` ms at most; returns a cancel.
export function whenIdle(fn: () => void, timeout = 2000): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  }
  const t = setTimeout(fn, 200);
  return () => clearTimeout(t);
}

// Ctrl K or Cmd K before the menu is there, by a plain listener: the shortcut registry (and the
// dialog it brings) loads with the menu, which binds the keys itself. Returns an unbind.
export function onModK(run: () => void): () => void {
  const onKey = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      run();
    }
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

export interface CommandHost {
  // The menu, once built.
  readonly menu: CommandMenu | null;
  // Loads and builds the menu now (once); resolves to it.
  load: () => Promise<CommandMenu>;
  open: (query?: string, opener?: Element | null) => Promise<void>;
  // Runs the command with this id now, and starts loading the menu.
  runWhenReady: (id: string) => void;
  detach: () => void;
}

export function createCommandHost(
  commands: Command[],
  opts: MenuOptions = {},
  root: ParentNode = document,
): CommandHost {
  let menu: CommandMenu | null = null;
  let loading: Promise<CommandMenu> | null = null;
  let detached = false;
  const undo: Array<() => void> = [];
  const load = () =>
    (loading ??= import("./command-menu.ts").then((m) => {
      if (detached) throw new Error("The command host was detached.");
      menu = m.createCommandMenu(commands, opts);
      // The menu binds Ctrl K itself from here on (and Ctrl K in it closes it).
      unbindKey();
      return menu;
    }));
  const open = async (query = "", opener: Element | null = document.activeElement) => {
    (await load()).open(query, opener);
  };
  const unbindKey = onModK(() => void open());
  undo.push(whenIdle(() => void load().catch(() => {})));
  for (const btn of root.querySelectorAll<HTMLElement>(
    "[data-cap-command-open]:not([data-cap-ready])",
  )) {
    btn.dataset.capReady = "";
    const onClick = () => void open("", btn);
    btn.addEventListener("click", onClick);
    undo.push(() => {
      btn.removeEventListener("click", onClick);
      delete btn.dataset.capReady;
    });
  }
  return {
    get menu() {
      return menu;
    },
    load,
    open,
    runWhenReady(id) {
      void load().catch(() => {});
      commands.find((c) => c.id === id)?.run();
    },
    detach() {
      detached = true;
      unbindKey();
      undo.forEach((f) => f());
      menu?.detach();
      menu = null;
    },
  };
}
