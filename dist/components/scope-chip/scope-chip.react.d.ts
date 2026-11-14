import { type ReactElement, type ReactNode } from "react";
export type ScopeOption = {
    value: string;
    label: string;
};
export type ScopeFormProps = {
    method: "get";
    action?: string;
    className: string;
    "data-cap": string;
    "data-cap-ready"?: string;
    children: ReactNode;
};
export interface ScopeChipProps {
    options: ScopeOption[];
    value: string;
    label: string;
    all?: string | null;
    name?: string;
    keep?: Record<string, string | undefined>;
    action?: string;
    renderForm?: (props: ScopeFormProps) => ReactElement;
}
export declare function ScopeChip({ options, value, label, all, name, keep, action, renderForm, }: ScopeChipProps): import("react").JSX.Element;
