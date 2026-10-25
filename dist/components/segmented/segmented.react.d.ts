import { type ReactNode } from "react";
export interface SegmentedOption<V extends string> {
    value: V;
    label: ReactNode;
    disabled?: boolean;
}
export interface SegmentedProps<V extends string> {
    legend: ReactNode;
    hideLegend?: boolean;
    options: Array<SegmentedOption<V>>;
    value: V | null;
    onChange: (value: V) => void;
    name?: string;
    describedBy?: string;
    size?: "sm" | "default" | "lg";
    orientation?: "horizontal" | "vertical";
    fill?: boolean;
    invalid?: boolean;
}
export declare function Segmented<V extends string>({ legend, hideLegend, options, value, onChange, name, describedBy, size, orientation, fill, invalid }: SegmentedProps<V>): import("react").JSX.Element;
