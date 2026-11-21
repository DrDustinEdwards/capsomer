import type { Command, CommandMenu, MenuOptions } from "./command-menu.ts";
export declare function whenIdle(fn: () => void, timeout?: number): () => void;
export declare function onModK(run: () => void): () => void;
export interface CommandHost {
    readonly menu: CommandMenu | null;
    load: () => Promise<CommandMenu>;
    open: (query?: string, opener?: Element | null) => Promise<void>;
    runWhenReady: (id: string) => void;
    detach: () => void;
}
export declare function createCommandHost(commands: Command[], opts?: MenuOptions, root?: ParentNode): CommandHost;
