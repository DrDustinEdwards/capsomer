import { type ReactNode, type SelectHTMLAttributes } from "react";
export interface SelectOption {
    value: string;
    label: ReactNode;
    disabled?: boolean;
}
export interface SelectGroupOption {
    group: string;
    options: SelectOption[];
}
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "style" | "children" | "className" | "size"> {
    options: Array<SelectOption | SelectGroupOption>;
    size?: "sm" | "default";
    native?: boolean;
}
export declare function Select(props: SelectProps): import("react").JSX.Element;
