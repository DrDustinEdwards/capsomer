import { type ReactNode } from "react";
export interface ChipOption<V extends string> {
    value: V;
    label: ReactNode;
    disabled?: boolean;
}
export interface FilterChipsProps<V extends string> {
    label: ReactNode;
    options: Array<ChipOption<V>>;
    value: V[];
    onChange: (value: V[]) => void;
    count: ReactNode;
    size?: "sm" | "default" | "lg";
}
export declare function FilterChips<V extends string>({ label, options, value, onChange, count, size }: FilterChipsProps<V>): import("react").JSX.Element;
