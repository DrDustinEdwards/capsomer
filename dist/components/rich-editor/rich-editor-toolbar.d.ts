import type { Editor } from "@tiptap/core";
export type Tool = {
    id: string;
    label: string;
    hint?: string;
    keys?: string;
    paths: string[];
    glyph?: string;
    run: () => void;
};
/** The formatting tools, each running against the editor as it is when pressed. */
export declare function formattingTools(c: {
    editor: () => Editor | null;
    markdown: (e: Editor) => string;
    openPalette: () => void;
    chooseImage: (() => void) | null;
}): Tool[];
export declare function Toolbar(props: {
    tools: Tool[];
    blocks: Tool[];
    active: number;
    setActive: (i: number) => void;
    off: boolean;
    barRef: React.RefObject<HTMLDivElement | null>;
}): import("react").JSX.Element;
