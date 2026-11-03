import { type ReactNode } from "react";
import type { MarkdownEditorHandle, MarkdownEditorOptions } from "./markdown-editor.ts";
export type { ImageDescription, LinkTarget, MarkdownEditorHandle, MarkdownEditorOptions, Scaffold, UploadResult } from "./markdown-editor.ts";
export interface MarkdownEditorProps extends Pick<MarkdownEditorOptions, "scaffolds" | "linkTargets" | "onUpload" | "imageMarkdown" | "accept" | "lineNumbers" | "nonce" | "wordsPerMinute" | "onSave"> {
    label: ReactNode;
    ariaLabel?: string;
    name?: string;
    id?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    disabled?: boolean;
    required?: boolean;
    maxLength?: number;
    help?: ReactNode;
    error?: ReactNode;
    onReady?: (handle: MarkdownEditorHandle) => void;
}
export declare function MarkdownEditor(props: MarkdownEditorProps): import("react").JSX.Element;
