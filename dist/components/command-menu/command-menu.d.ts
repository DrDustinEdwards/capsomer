import { type Command } from "./command-menu-model.ts";
import { type MenuOptions, type AttachOptions } from "./command-menu-build.ts";
export { ANSWER_LABEL, startAnswer, focusAnswer, markSnippet, buildMenu, } from "./command-menu-build.ts";
export type { MenuOptions, AnswerRun, AttachOptions } from "./command-menu-build.ts";
export { navCommands, markQuery, RECENT_MAX, readRecent, rememberRecent, STOP_GROUP, STOP_HINTS, stopCommand, groupCommands, emptyText, SEARCHING, } from "./command-menu-model.ts";
export type { Command } from "./command-menu-model.ts";
export interface Attached {
    open: (query?: string, opener?: Element | null) => void;
    close: () => void;
    setActive: (index: number) => void;
    offerAnswer: (on: boolean) => void;
    detach: () => void;
}
export declare function attach(dialog: HTMLDialogElement, run: (option: HTMLElement, found?: Command) => void, opts?: AttachOptions): Attached;
export declare function openCommandMenu(query?: string): void;
export interface CommandMenu extends Attached {
    dialog: HTMLDialogElement;
}
export declare function createCommandMenu(commands: Command[], opts?: MenuOptions): CommandMenu;
export declare function enhance(root?: ParentNode): () => void;
