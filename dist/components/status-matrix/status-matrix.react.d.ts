import type { ReactNode } from "react";
import { type GlyphName, type Tone } from "../status/status.react.tsx";
export interface MatrixCell {
    tone: Tone;
    glyph?: GlyphName;
    label: string;
    reason?: string;
}
export interface MatrixColumn {
    id: string;
    name: string;
}
export interface MatrixRow {
    id: string;
    name: ReactNode;
    text: string;
    cells: Record<string, MatrixCell | undefined>;
}
export interface StatusMatrixProps {
    caption: string;
    showCaption?: boolean;
    columns: MatrixColumn[];
    rows: MatrixRow[];
    emptyLabel?: string;
}
export declare function StatusMatrix({ caption, showCaption, columns, rows, emptyLabel, }: StatusMatrixProps): import("react").JSX.Element;
export declare function MatrixKey({ items, }: {
    items: Array<{
        tone: Tone;
        glyph?: GlyphName;
        label: string;
    }>;
}): import("react").JSX.Element;
