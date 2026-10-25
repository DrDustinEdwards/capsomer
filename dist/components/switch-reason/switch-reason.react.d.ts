import { type ReactNode } from "react";
export interface SwitchWithReasonProps {
    label: string;
    name?: string;
    verb?: (next: boolean) => string;
    checked: boolean;
    onApply: (checked: boolean, reason: string) => Promise<void>;
    placeholder?: string;
    note?: ReactNode;
}
export declare function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note }: SwitchWithReasonProps): import("react").JSX.Element;
