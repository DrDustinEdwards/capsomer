import { type InputHTMLAttributes } from "react";
import { type FieldProps } from "../field/field.react.tsx";
export declare function DatePicker(props: Pick<FieldProps, "label" | "help" | "error" | "announce" | "required"> & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "style" | "min" | "max"> & {
    min?: string;
    max?: string;
}): import("react").JSX.Element;
