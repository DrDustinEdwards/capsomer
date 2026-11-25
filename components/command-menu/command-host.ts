// The command menu's host without React: imports nothing of the menu until the page is idle (two seconds
// at most) or Ctrl K, Cmd K, a [data-cap-command-open] button or `open` asks. Import from capsomer/behavior/command-host.
import type { Command, CommandMenu, MenuOptions } from "./command-menu.ts";

export function whenIdle(fn: () => void, timeout = 2000): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(fn, { timeout });
    return () => cancelIdleCallback(id);
  }
  const t = setTimeout(fn, 200);
  return () => clearTimeout(t);
}

// Ctrl K or Cmd K before the menu exists: the shortcut registry loads with the menu. Returns an unbind.
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
  readonly menu: CommandMenu | null;
  load: () => Promise<CommandMenu>;
  open: (query?: string, opener?: Element | null) => Promise<void>;
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
    (loading ??= import("./command-menu.ts")
      .then((m) => {
        if (detached) throw new Error("The command host was detached.");
        menu = m.createCommandMenu(commands, opts);
        // The menu binds Ctrl K itself from here on (and Ctrl K in it closes it).
        unbindKey();
        return menu;
      })
      // A failed load is not kept, so the next ask tries the chunk again.
      .catch((error: unknown) => {
        loading = null;
        throw error;
      }));
  // A warm-up nobody waits on: a failure surfaces where the menu is asked for, as `open` rejecting.
  const warm = () => void load().catch(() => {});
  const open = async (query = "", opener: Element | null = document.activeElement) => {
    (await load()).open(query, opener);
  };
  // A chunk that fails to load is said where the person asked, not left a dead shortcut (the message
  // region loads only then, so the first load stays light).
  const ask = (query = "", opener?: Element | null) =>
    open(query, opener).catch(async () =>
      (await import("../message/message.ts")).fail("The command menu could not load. Try again."),
    );
  const unbindKey = onModK(() => void ask());
  undo.push(whenIdle(warm));
  for (const btn of root.querySelectorAll<HTMLElement>(
    "[data-cap-command-open]:not([data-cap-ready])",
  )) {
    btn.dataset.capReady = "";
    const onClick = () => void ask("", btn);
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
      warm();
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
