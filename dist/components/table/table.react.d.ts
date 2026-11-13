import { type ReactNode } from "react";
import { type SortDirection } from "./table.ts";
type Reflow = boolean | "medium" | "wide";
export interface TableProps {
    caption: ReactNode;
    captionHidden?: boolean;
    captionBottom?: boolean;
    labelledBy?: string;
    reflow?: Reflow;
    sticky?: boolean;
    density?: "compact" | "comfortable";
    className?: string;
    tableClassName?: string;
    children?: ReactNode;
}
export declare function Table(props: TableProps): import("react").JSX.Element;
export interface Column<T> {
    key: string;
    header: ReactNode;
    label?: string;
    cell: (row: T) => ReactNode;
    num?: boolean;
    sortBy?: (row: T) => string | number;
    drop?: 1 | 2;
    note?: ReactNode;
}
export interface DataTableProps<T> extends Omit<TableProps, "children"> {
    columns: readonly Column<T>[];
    rows: readonly T[];
    rowKey: (row: T) => string;
    empty: ReactNode;
    sorted?: {
        key: string;
        direction: SortDirection;
    };
    selected?: (row: T) => boolean;
    foot?: ReactNode;
}
export declare function sortedRows<T>(rows: readonly T[], by: ((row: T) => string | number) | undefined, direction: SortDirection): T[];
export declare function DataTable<T>(props: DataTableProps<T>): import("react").JSX.Element;
export {};
