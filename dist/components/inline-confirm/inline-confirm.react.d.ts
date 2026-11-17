import { type ReactNode } from "react";
import type { FormComponent } from "../plain-form/plain-form.react.tsx";
export type { FormComponent };
export interface InlineConfirmProps {
    label: ReactNode;
    labelDetail?: string;
    question: ReactNode;
    confirmLabel: ReactNode;
    cancelLabel?: ReactNode;
    openHref: string;
    closeHref: string;
    defaultOpen?: boolean;
    pending?: boolean;
    pendingLabel?: ReactNode;
    tone?: "danger" | "default";
    size?: "sm" | "default";
    form?: FormComponent | "form";
    method?: "post" | "get";
    action?: string;
    children?: ReactNode;
}
export declare function InlineConfirm({ label, labelDetail, question, confirmLabel, cancelLabel, openHref, closeHref, defaultOpen, pending, pendingLabel, tone, size, form, method, action, children, }: InlineConfirmProps): import("react").JSX.Element;
