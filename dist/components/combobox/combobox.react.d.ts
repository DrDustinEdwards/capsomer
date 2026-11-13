import { type ReactNode } from "react";
export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
    hint?: string;
}
export interface ComboboxBaseProps {
    label: string;
    items: ComboboxOption[];
    placeholder?: string;
    emptyText?: ReactNode | ((query: string) => ReactNode);
    loading?: boolean;
    loadingText?: string;
    help?: ReactNode;
    error?: ReactNode;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    id?: string;
    container?: HTMLElement | null;
    defaultOpen?: boolean;
    defaultInputValue?: string;
    search?: (query: string, signal: AbortSignal) => Promise<ComboboxOption[]>;
    searchDelay?: number;
    minSearchLength?: number;
    searchHint?: string;
    searchFailedText?: string;
}
export interface ComboboxProps extends ComboboxBaseProps {
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    clearable?: boolean;
}
export interface ComboboxFreeTextProps extends Omit<ComboboxBaseProps, "items" | "emptyText"> {
    items?: ComboboxOption[];
    value?: string;
    defaultValue?: string;
    onValueChange?: (text: string) => void;
    onPick?: (item: ComboboxOption) => void;
}
export interface ComboboxMultipleProps extends ComboboxBaseProps {
    values?: string[];
    defaultValues?: string[];
    onValuesChange?: (values: string[]) => void;
    creatable?: boolean;
    createLabel?: (text: string) => string;
}
export declare function Combobox(props: ComboboxProps): import("react").JSX.Element;
export declare function ComboboxFreeText(props: ComboboxFreeTextProps): import("react").JSX.Element;
export declare function ComboboxMultiple(props: ComboboxMultipleProps): import("react").JSX.Element;
