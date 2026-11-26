import type { Command } from "./command-menu.ts";
import type { CommandMenuProps } from "./command-menu.react.tsx";
export declare function useCommandHost(commands: readonly Command[]): {
    ready: boolean;
    open: boolean;
    setOpen: (next: boolean) => void;
    runWhenReady: (id: string) => void;
};
export type CommandHostState = ReturnType<typeof useCommandHost>;
export declare function LazyCommandMenu({ host, ...props }: Omit<CommandMenuProps, "open" | "onOpenChange"> & {
    host: CommandHostState;
}): import("react").JSX.Element | null;
