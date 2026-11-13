import { type ReactNode } from "react";
export interface RepeaterRowApi<T> {
    index: number;
    label: string;
    set: (patch: Partial<T>) => void;
    name: (key: string) => string;
}
export interface RepeaterFieldProps<T> {
    legend: ReactNode;
    help?: ReactNode;
    error?: ReactNode;
    rows: T[];
    onChange: (rows: T[]) => void;
    newRow: () => T;
    rowLabel: (index: number, row: T) => string;
    children: (row: T, api: RepeaterRowApi<T>) => ReactNode;
    addLabel?: string;
    min?: number;
    max?: number;
    reorder?: boolean;
    name?: string;
    json?: boolean;
    spare?: number;
}
export declare function RepeaterField<T>({ legend, help, error, rows, onChange, newRow, rowLabel, children, addLabel, min, max, reorder, name, json, spare, }: RepeaterFieldProps<T>): import("react").JSX.Element;
