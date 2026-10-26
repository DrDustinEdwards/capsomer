import { type ReactNode } from "react";
export interface ReasonFormProps {
    open: boolean;
    verb: string;
    onApply: (reason: string) => Promise<void>;
    onCancel: () => void;
    failed?: (err: unknown) => string;
    id?: string;
    placeholder?: string;
    onPendingChange?: (pending: boolean) => void;
}
export declare function ReasonForm({ open, verb, onApply, onCancel, failed, id, placeholder, onPendingChange }: ReasonFormProps): import("react").JSX.Element;
export interface SwitchWithReasonProps {
    label: string;
    name?: string;
    verb?: (next: boolean) => string;
    checked: boolean;
    onApply: (checked: boolean, reason: string) => Promise<void>;
    placeholder?: string;
    note?: ReactNode;
    id?: string;
}
export declare function SwitchWithReason({ label, name, verb, checked, onApply, placeholder, note, id }: SwitchWithReasonProps): import("react").JSX.Element;
