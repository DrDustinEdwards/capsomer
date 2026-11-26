import { type EditorContext } from "./markdown-editor-dom.ts";
import { type Scaffold } from "./markdown-editor-edits.ts";
export declare function createToolbar(c: EditorContext, parts: {
    toolbar: HTMLElement;
    file: HTMLInputElement;
    openLink: () => void;
    insertScaffold: (s: Scaffold) => void;
}): {
    build: () => void;
    commands: {
        bold: () => void;
        italic: () => void;
        code: () => void;
        heading: () => void;
        footnote: () => void;
    };
    attach: () => () => void;
};
