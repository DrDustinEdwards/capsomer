import { type ReactNode } from "react";
import { type FormComponent } from "../plain-form/plain-form.react.tsx";
import { type ApprovalAction, type ApprovalItem } from "./approval-queue.ts";
export type { ApprovalAction, ApprovalItem, FormComponent };
export interface ApprovalQueueProps {
    items: ApprovalItem[];
    label: string;
    hideLabel?: boolean;
    action?: string;
    Form?: FormComponent;
    pending?: boolean;
    textLabel?: (item: ApprovalItem) => string;
    findingsLabel?: string;
    empty?: {
        title: ReactNode;
        text: ReactNode;
    };
    now?: number;
}
export declare function ApprovalQueue({ items, label, hideLabel, action, Form, pending, textLabel, findingsLabel, empty, now, }: ApprovalQueueProps): import("react").JSX.Element;
