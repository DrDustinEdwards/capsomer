import { type Command } from "./command-menu.ts";
export type { Command } from "./command-menu.ts";
export { markQuery, navCommands, SEARCHING, STOP_GROUP, STOP_HINTS, stopCommand, } from "./command-menu.ts";
export { useCommandHost } from "./command-host.react.tsx";
export interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commands: Command[];
    label?: string;
    placeholder?: string;
    bindKeys?: boolean;
    search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
    searchDelay?: number;
    recentKey?: string;
    ask?: {
        label?: string;
        run: (query: string) => void;
    };
}
export declare function CommandMenu({ open, onOpenChange, commands, label, placeholder, bindKeys, search, searchDelay, recentKey, ask, }: CommandMenuProps): import("react").JSX.Element;
