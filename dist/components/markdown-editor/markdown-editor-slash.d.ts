import { type EditorContext } from "./markdown-editor-dom.ts";
import type { Scaffold } from "./markdown-editor-edits.ts";
export declare function createSlashMenu(c: EditorContext, choose: (s: Scaffold) => void): {
    sync: () => void;
    close: () => void;
    isOpen: () => boolean;
    holds: (to: EventTarget | null) => boolean;
    focusFirst: () => void | undefined;
};
