import type { ReactNode } from "react";
export interface LogColumn<Row> {
    key: string;
    label: string;
    num?: boolean;
    mono?: boolean;
    cell: (row: Row) => ReactNode;
}
export interface LogViewProps<Row> {
    caption: string;
    showCaption?: boolean;
    columns: LogColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row) => string;
    truncated?: boolean;
    truncatedNote?: ReactNode;
    note?: ReactNode;
    emptyLabel?: string;
    empty: ReactNode;
}
export declare function LogView<Row>({ caption, showCaption, columns, rows, rowKey, truncated, truncatedNote, note, emptyLabel, empty, }: LogViewProps<Row>): import("react").JSX.Element;
