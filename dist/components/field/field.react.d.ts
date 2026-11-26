import { type InputHTMLAttributes, type Ref, type ReactElement, type ReactNode } from "react";
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
    ref?: Ref<HTMLInputElement>;
}): import("react").JSX.Element;
export declare function InputGroup(props: {
    label?: string;
    children?: ReactNode;
}): import("react").JSX.Element;
export declare function InputGroupAddon(props: {
    align?: "inline-start" | "inline-end" | "block-start" | "block-end";
    children?: ReactNode;
}): import("react").JSX.Element;
export type FieldText = Pick<FieldProps, "label" | "labelHidden" | "help" | "error" | "announce" | "required" | "helpPlacement" | "showRequired">;
export declare function splitField<T extends FieldText>(props: T): readonly [FieldText, Omit<T, "label" | "error" | "announce" | "required" | "labelHidden" | "help" | "helpPlacement" | "showRequired">];
export { PasswordInput, CharacterCount, NumberField, SearchField } from "./field-inputs.react.tsx";
export { DateInput, FieldSet, TextField, RangeField, SpanField, SlugField, MoneyField, DateTimeField, type DatePart, } from "./field-composed.react.tsx";
