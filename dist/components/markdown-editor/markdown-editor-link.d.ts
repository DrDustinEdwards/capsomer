import { type EditorContext } from "./markdown-editor-dom.ts";
export declare function createLinkPalette(c: EditorContext, beforeOpen: () => void): {
    open: () => void;
    close: (restoreFocus: boolean) => void;
};
