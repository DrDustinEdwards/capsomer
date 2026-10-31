import { type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes } from "react";
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
    children: ReactElement<FieldControlProps> | ((props: FieldControlProps & {
        id: string;
    }) => ReactNode);
    after?: ReactNode;
}
export declare function Field({ label, help, error, announce, required, orientation, children, after }: FieldProps): import("react").JSX.Element;
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
type FieldText = Pick<FieldProps, "label" | "help" | "error" | "announce" | "required">;
export declare function PasswordInput(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "autoComplete"> & {
    autoComplete?: "current-password" | "new-password";
}): import("react").JSX.Element;
export declare function CharacterCount(props: FieldText & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "style" | "value" | "maxLength"> & {
    value: string;
    limit: number;
    words?: boolean;
}): import("react").JSX.Element;
export declare function NumberField(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange" | "min" | "max" | "step"> & {
    value: number | null;
    onChange: (value: number | null) => void;
    min?: number;
    max?: number;
    step?: number;
    decrease?: string;
    increase?: string;
}): import("react").JSX.Element;
export declare function SearchField(props: Pick<FieldProps, "label" | "help"> & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & {
    value: string;
    onChange: (value: string) => void;
    action?: string;
    landmark?: string;
}): import("react").JSX.Element;
export type DatePart = "day" | "month" | "year";
export declare function DateInput(props: Omit<FieldText, "label"> & {
    legend: ReactNode;
    name: string;
    value: Record<DatePart, string>;
    onChange: (value: Record<DatePart, string>) => void;
    invalid?: DatePart[];
    autoComplete?: "bday";
    order?: DatePart[];
}): import("react").JSX.Element;
export {};
