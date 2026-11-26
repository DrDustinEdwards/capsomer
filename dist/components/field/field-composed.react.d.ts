import { type FieldsetHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { type FieldText } from "./field.react.tsx";
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
export declare function FieldSet(props: Omit<FieldText, "label" | "helpPlacement" | "showRequired"> & {
    legend: ReactNode;
    id?: string;
    children: ReactNode;
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
export declare function SpanField(props: Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children"> & {
    label: ReactNode;
    names: {
        from: string;
        to: string;
    };
    options: readonly {
        value: string;
        label: ReactNode;
    }[];
    from?: string | number | null;
    to?: string | number | null;
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
