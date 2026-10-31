import { type InputHTMLAttributes, type ReactElement, type ReactNode } from "react";
export interface FieldControlProps {
    id?: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
}
export interface FieldProps {
    label: ReactNode;
    help?: ReactNode;
    error?: ReactNode;
    announce?: boolean;
    required?: boolean;
    orientation?: "vertical" | "horizontal" | "responsive";
    children: ReactElement<FieldControlProps>;
}
export declare function Field({ label, help, error, announce, required, orientation, children }: FieldProps): import("react").JSX.Element;
export declare function Check(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style"> & {
    type?: "checkbox" | "radio";
    label: ReactNode;
    variant?: "card";
    indeterminate?: boolean;
}): import("react").JSX.Element;
export declare function Range(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "min" | "max"> & {
    value: number;
    min?: number;
    max?: number;
}): import("react").JSX.Element;
export declare function InputGroup(props: {
    label?: string;
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function InputGroupAddon(props: {
    align?: "inline-start" | "inline-end" | "block-start" | "block-end";
    children?: ReactNode;
}): import("react").JSX.Element;
