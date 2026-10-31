import { type Command } from "./command-menu.ts";
export type { Command } from "./command-menu.ts";
export { SEARCHING, STOP_GROUP, STOP_HINTS, stopCommand } from "./command-menu.ts";
export interface CommandMenuProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commands: Command[];
    label?: string;
    placeholder?: string;
    bindKeys?: boolean;
    search?: (query: string, signal: AbortSignal) => Promise<Command[]>;
    searchDelay?: number;
}
export declare function CommandMenu({ open, onOpenChange, commands, label, placeholder, bindKeys, search, searchDelay }: CommandMenuProps): import("react").JSX.Element;
