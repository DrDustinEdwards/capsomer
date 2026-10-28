import { type ReactNode } from "react";
export interface ComboboxOption {
    value: string;
    label: string;
    disabled?: boolean;
    group?: string;
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
}
export interface ComboboxProps extends ComboboxBaseProps {
    value?: string | null;
    defaultValue?: string | null;
    onValueChange?: (value: string | null) => void;
    clearable?: boolean;
}
export interface ComboboxMultipleProps extends ComboboxBaseProps {
    values?: string[];
    defaultValues?: string[];
    onValuesChange?: (values: string[]) => void;
    creatable?: boolean;
    createLabel?: (text: string) => string;
}
export declare function Combobox(props: ComboboxProps): import("react").JSX.Element;
export declare function ComboboxMultiple(props: ComboboxMultipleProps): import("react").JSX.Element;
