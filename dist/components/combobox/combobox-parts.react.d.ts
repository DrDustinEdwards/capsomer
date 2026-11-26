import { type ReactNode, type RefObject } from "react";
import type { ComboboxBaseProps, ComboboxOption } from "./combobox.react.tsx";
export interface Group {
    value: string;
    items: ComboboxOption[];
}
export declare const MAKE = "\u0001make:";
export declare const tidy: (text: string) => string;
export declare const Cross: ({ size }: {
    size?: number;
}) => import("react").JSX.Element;
export declare const defaultEmpty: (query: string) => ReactNode;
export declare function grouped(items: ComboboxOption[]): ComboboxOption[] | Group[];
export declare function Hint({ item }: {
    item: ComboboxOption;
}): import("react").JSX.Element | null;
export declare function Popup({ isGrouped, loading, loadingText, empty, container, anchor, multiple, }: {
    isGrouped: boolean;
    loading: boolean;
    loadingText: string;
    empty: ReactNode;
    container?: HTMLElement | null;
    anchor?: RefObject<HTMLElement | null>;
    multiple: boolean;
}): import("react").JSX.Element;
interface Found {
    items: ComboboxOption[];
    loading: boolean;
    failed: boolean;
    short: boolean;
}
export declare function useOptionSearch(search: ComboboxBaseProps["search"], delay: number, min: number): [Found, (query: string) => void];
export declare function pool(known: ComboboxOption[], found: ComboboxOption[]): ComboboxOption[];
export declare function searchEmpty(found: Found, query: string, hint: string, failed: string): ReactNode;
export declare function Field({ label, labelId, inputId, required, help, helpId, error, errorId, children, }: {
    label: string;
    labelId: string;
    inputId: string;
    required: boolean;
    help?: ReactNode;
    helpId: string;
    error?: ReactNode;
    errorId: string;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
