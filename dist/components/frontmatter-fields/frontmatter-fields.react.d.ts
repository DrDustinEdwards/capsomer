import { type ChangeEvent, type ReactNode } from "react";
import { type FieldSpec } from "./frontmatter-fields.ts";
export interface FrontmatterFieldsProps {
    source: string;
    onChange?: (next: string) => void;
    readOnly?: boolean;
    fields?: readonly FieldSpec[];
    extra?: "fields" | "text";
    legend?: ReactNode;
    hideEmpty?: boolean;
    raw?: boolean;
    rawSummary?: ReactNode;
    empty?: ReactNode;
    children?: ReactNode;
}
export interface TypedBox {
    /** What the box shows: what is typed, else the stored value. */
    value: string;
    /** Keeps what was just typed (call from onChange). */
    keep: (typed: string) => void;
    /** Gives the box back to the stored value (call from onBlur). */
    done: () => void;
}
export declare function useTyped(stored: string): TypedBox;
/** A text box's props from its TypedBox: what is typed kept, and each change written through `write`. */
export declare function typedProps(box: TypedBox, locked: boolean, write: (text: string) => void): {
    className: string;
    value: string;
    readOnly: boolean;
    onBlur: () => void;
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};
export declare function FrontmatterFields({ source, onChange, readOnly, fields: specs, extra, legend, hideEmpty, raw, rawSummary, empty, children, }: FrontmatterFieldsProps): import("react").JSX.Element;
export type { FieldSpec, BoxKind, FlagWords, TypedField } from "./frontmatter-fields.ts";
