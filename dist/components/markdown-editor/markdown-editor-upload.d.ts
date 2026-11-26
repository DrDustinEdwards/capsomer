import { type EditorContext } from "./markdown-editor-dom.ts";
export declare function createUploader(c: EditorContext): {
    start: (f: File) => void;
    cancel: (restoreFocus: boolean) => void;
    clearError: () => void;
};
