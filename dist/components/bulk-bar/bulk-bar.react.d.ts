import { type ReactNode } from "react";
import { type BulkItem, type BulkOutcome } from "./bulk-bar.ts";
export type { BulkOutcome };
export interface BulkBarAction {
    id: string;
    label: ReactNode;
    destructive?: boolean;
    confirmTitle?: string;
    confirmLead?: string;
    confirmAction?: string;
    said?: string;
    undone?: string;
    submit?: boolean;
    run?: (items: readonly BulkItem[]) => void | Promise<void>;
    undo?: (items: readonly BulkItem[]) => void | Promise<void>;
    disabled?: boolean;
}
export interface BulkBarProps {
    items: readonly BulkItem[];
    actions: readonly BulkBarAction[];
    onClear: () => void;
    total?: number;
    onSelectAll?: () => void;
    detail?: ReactNode;
    position?: "bottom" | "top";
    returnTo?: HTMLElement | null;
    children?: ReactNode;
    label?: string;
    form?: string;
    prompt?: string;
    outcomes?: readonly BulkOutcome[];
    onDismissOutcomes?: () => void;
}
export declare function BulkBar({ items, actions, onClear, total, onSelectAll, detail, position, returnTo, children, label, form, prompt, outcomes, onDismissOutcomes }: BulkBarProps): import("react").JSX.Element;
