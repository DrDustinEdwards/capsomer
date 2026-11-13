import { type InputHTMLAttributes, type ReactElement, type ReactNode, type TextareaHTMLAttributes } from "react";
export interface FieldControlProps {
    id?: string;
    required?: boolean;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean | "true" | "false";
}
export interface FieldProps {
    label: ReactNode;
    id?: string;
    labelHidden?: boolean;
    help?: ReactNode;
    error?: ReactNode;
    announce?: boolean;
    required?: boolean;
    orientation?: "vertical" | "horizontal" | "responsive";
    children: ReactElement<FieldControlProps> | ((props: FieldControlProps & {
        id: string;
    }) => ReactNode);
    after?: ReactNode;
    action?: ReactNode;
    helpPlacement?: "before" | "after";
    showRequired?: boolean;
    size?: "short";
}
export declare function Field({ label, labelHidden, help, error, announce, required, orientation, children, after, action, helpPlacement, showRequired, id, size, }: FieldProps): import("react").JSX.Element;
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
type FieldText = Pick<FieldProps, "label" | "help" | "error" | "announce" | "required" | "helpPlacement" | "showRequired">;
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
    step?: number | "any";
    decrease?: string;
    increase?: string;
}): import("react").JSX.Element;
export declare function SearchField(props: Pick<FieldProps, "label" | "labelHidden" | "help"> & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & {
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
export declare function TextField(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "style"> & {
    action?: ReactNode;
}): import("react").JSX.Element;
export declare function RangeField(props: Omit<FieldText, "required" | "showRequired"> & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange" | "min" | "max" | "step"> & {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    format?: (value: number) => string;
    minLabel?: ReactNode;
    maxLabel?: ReactNode;
}): import("react").JSX.Element;
export declare function SlugField(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "value" | "onChange"> & {
    value: string;
    onChange: (value: string) => void;
    from?: string;
    max?: number;
}): import("react").JSX.Element;
export declare function MoneyField(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "defaultValue"> & {
    defaultCents?: number | null;
    symbol?: string;
}): import("react").JSX.Element;
export declare function DateTimeField(props: FieldText & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "defaultValue"> & {
    defaultDate?: Date | null;
    timeZone?: string;
}): import("react").JSX.Element;
export {};
