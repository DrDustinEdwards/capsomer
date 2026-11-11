import { type ReactNode } from "react";
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
export declare function FrontmatterFields({ source, onChange, readOnly, fields: specs, extra, legend, hideEmpty, raw, rawSummary, empty, children, }: FrontmatterFieldsProps): import("react").JSX.Element;
export type { FieldSpec, BoxKind, FlagWords, TypedField } from "./frontmatter-fields.ts";
export { LIST_HINT, LINES_HINT } from "./frontmatter-fields.ts";
