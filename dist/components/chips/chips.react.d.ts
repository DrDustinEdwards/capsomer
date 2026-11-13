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
export declare function FilterChips<V extends string>({ label, options, value, onChange, count, size, }: FilterChipsProps<V>): import("react").JSX.Element;
export interface LinkChip {
    href: string;
    label: ReactNode;
    count?: number;
    current?: boolean;
}
export declare function LinkChips({ label, showLabel, chips, size, renderLink, }: {
    label: string;
    showLabel?: boolean;
    chips: readonly LinkChip[];
    size?: "sm" | "default" | "lg";
    renderLink?: (props: {
        href: string;
        className: string;
        "aria-current"?: "true";
        "data-size"?: string;
        children: ReactNode;
    }) => ReactNode;
}): import("react").JSX.Element;
export declare function CheckChips({ legend, name, options, checked, size, }: {
    legend: ReactNode;
    name: string;
    options: ReadonlyArray<{
        value: string;
        label: ReactNode;
        count?: number;
        disabled?: boolean;
    }>;
    checked: readonly string[];
    size?: "sm" | "default" | "lg";
}): import("react").JSX.Element;
