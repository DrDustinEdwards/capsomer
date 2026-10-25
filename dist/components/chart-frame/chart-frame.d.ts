export interface DataTable {
    columns: string[];
    rows: string[][];
}
export declare const escapeHtml: (value: string) => string;
export declare function numericColumns(table: DataTable): boolean[];
export declare function tableHtml(table: DataTable, label: string): string;
export interface FrameOptions {
    title: string;
    summary: string;
    chart: string;
    table: DataTable;
    tableLabel?: string;
    open?: boolean;
    meta?: string;
    level?: 2 | 3 | 4;
    id: string;
}
export declare function frameHtml(o: FrameOptions): string;
