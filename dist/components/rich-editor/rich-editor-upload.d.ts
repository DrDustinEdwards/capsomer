import type { Editor } from "@tiptap/core";
import type { RichEditorProps, Upload } from "./rich-editor-types.ts";
export declare function useImageStep(c: {
    props: {
        current: RichEditorProps;
    };
    editor: {
        current: Editor | null;
    };
    say: (text: string) => void;
    insertMarkdown: (md: string) => void;
}): {
    upload: Upload;
    error: string | null;
    alt: string;
    setAlt: import("react").Dispatch<import("react").SetStateAction<string>>;
    altRef: import("react").RefObject<HTMLInputElement | null>;
    start: (file: File) => void;
    cancel: () => void;
    insert: (decorative: boolean) => Promise<void>;
};
