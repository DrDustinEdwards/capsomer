import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { type FieldText, type FieldProps } from "./field.react.tsx";
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
