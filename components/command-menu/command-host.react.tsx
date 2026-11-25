// The command menu's host in React: imports nothing of the menu until the page is idle (two seconds at
// most) or the menu is asked for. Import from capsomer/react/command-host so a route's first load stays light.
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { onModK, whenIdle } from "./command-host.ts";
import type { Command } from "./command-menu.ts";
import type { CommandMenuProps } from "./command-menu.react.tsx";

// `ready` turns true when the page is idle or a shortcut, a button or `runWhenReady` asks first. A command
// asked for before then runs as soon as the menu is ready.
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
