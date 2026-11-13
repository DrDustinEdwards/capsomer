import { type ReactNode } from "react";
import { type RichTextTag } from "./rich-text-field.ts";
export interface RichTextFieldProps {
    name: string;
    label: ReactNode;
    tags: readonly RichTextTag[];
    initialHTML?: string;
    help?: ReactNode;
    error?: ReactNode;
    required?: boolean;
    lines?: "single" | "multi";
    wordCount?: boolean;
    describedBy?: string;
    onValueChange?: (value: string) => void;
}
export declare function RichTextField({ name, label, tags, initialHTML, help, error, required, lines, wordCount, describedBy, onValueChange, }: RichTextFieldProps): import("react").JSX.Element;
