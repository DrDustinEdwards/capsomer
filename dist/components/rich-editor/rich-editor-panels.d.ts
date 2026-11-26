import type { Editor } from "@tiptap/core";
import type { LinkTarget, Scaffold } from "../markdown-editor/markdown-editor.ts";
import type { Palette, Upload } from "./rich-editor-types.ts";
export declare function ImageStep(props: {
    uid: string;
    upload: NonNullable<Upload>;
    alt: string;
    setAlt: (alt: string) => void;
    error: string | null;
    altRef: React.RefObject<HTMLInputElement | null>;
    insert: (decorative: boolean) => void;
    cancel: () => void;
}): import("react").JSX.Element;
export declare function LinkPalette(props: {
    uid: string;
    palette: Palette;
    setPalette: (p: Palette) => void;
    matches: LinkTarget[];
    typedUrl: string | null;
    panelRef: React.RefObject<HTMLDivElement | null>;
    close: (restore: boolean) => void;
    apply: (href: string, title: string) => void;
}): import("react").JSX.Element;
export declare function SlashMenu(props: {
    scaffolds: Scaffold[];
    menuRef: React.RefObject<HTMLUListElement | null>;
    editor: () => Editor | null;
    close: () => void;
    choose: (s: Scaffold) => void;
}): import("react").JSX.Element;
