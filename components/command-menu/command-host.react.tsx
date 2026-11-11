// The command menu's host in React, light: `useCommandHost` and `LazyCommandMenu` import nothing
// of the menu until the page is idle (requestIdleCallback, two seconds at most) or the menu is
// asked for; then the menu is loaded with lazy(). Import them from capsomer/react/command-host so
// every route's first load carries only this.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { onModK, whenIdle } from "./command-host.ts";
import type { Command } from "./command-menu.ts";
import type { CommandMenuProps } from "./command-menu.react.tsx";

// `ready` turns true when the page is idle, or at once when a shortcut, a button (`setOpen`) or
// `runWhenReady` asks before then; render the menu only then (LazyCommandMenu does). Ctrl K or
// Cmd K before then opens it. A command asked for before the menu is ready runs as soon as it is.
export function useCommandHost(commands: readonly Command[]) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const pending = useRef<string | null>(null);
  useEffect(() => whenIdle(() => setReady(true)), []);
  useEffect(() => {
    if (ready) return;
    return onModK(() => {
      setReady(true);
      setOpen(true);
    });
  }, [ready]);
  useEffect(() => {
    if (!ready || !pending.current) return;
    const id = pending.current;
    pending.current = null;
    commands.find((c) => c.id === id)?.run();
  }, [ready, commands]);
  return {
    // Render the CommandMenu only while this is true.
    ready,
    open,
    setOpen: (next: boolean) => {
      if (next) setReady(true);
      setOpen(next);
    },
    runWhenReady: (id: string) => {
      if (ready) commands.find((c) => c.id === id)?.run();
      else {
        pending.current = id;
        setReady(true);
      }
    },
  };
}

export type CommandHostState = ReturnType<typeof useCommandHost>;

const Menu = lazy(() =>
  import("./command-menu.react.tsx").then((m) => ({ default: m.CommandMenu })),
);

// The menu, loaded with lazy() once the host is ready, open and closed by the host.
export function LazyCommandMenu({
  host,
  ...props
}: Omit<CommandMenuProps, "open" | "onOpenChange"> & { host: CommandHostState }) {
  if (!host.ready) return null;
  return (
    <Suspense fallback={null}>
      <Menu open={host.open} onOpenChange={host.setOpen} {...props} />
    </Suspense>
  );
}
