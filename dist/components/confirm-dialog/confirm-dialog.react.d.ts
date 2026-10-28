import { type ReactElement, type ReactNode } from "react";
export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    lead?: ReactNode;
    body: string[];
    action: string;
    typeToConfirm?: string;
    reason?: {
        label?: string;
        note?: string;
    };
    perform: (reason: string) => Promise<void>;
    onClose: (performed: boolean) => void;
    cancelLabel?: string;
    returnTo?: HTMLElement | null;
    media?: boolean;
}
export declare function ConfirmDialog(props: ConfirmDialogProps): import("react").JSX.Element;
export interface ConfirmFormProps {
    className: string;
    "data-cap": string;
    action?: string;
    method: "post" | "get";
    role: string;
    "aria-labelledby": string;
    "aria-describedby"?: string;
    children: ReactNode;
}
export interface ConfirmPageProps {
    action?: string;
    method?: "post" | "get";
    hidden?: Record<string, string | readonly string[]>;
    title: string;
    lead?: ReactNode;
    body?: string[];
    action_label?: string;
    cancelHref: string;
    cancelLabel?: string;
    typeToConfirm?: string;
    reason?: {
        label?: string;
        note?: string;
    };
    error?: ReactNode;
    media?: boolean;
    headingLevel?: "h1" | "h2";
    children?: ReactNode;
    onCancel?: () => void;
    renderForm?: (props: ConfirmFormProps) => ReactElement;
}
export declare function ConfirmPage({ action, method, hidden, title, lead, body, action_label, cancelHref, cancelLabel, typeToConfirm, reason, error, media, headingLevel, children, onCancel, renderForm }: ConfirmPageProps): import("react").JSX.Element;
export type ConfirmModalProps = Omit<ConfirmPageProps, "headingLevel">;
export declare function ConfirmModal(props: ConfirmModalProps): import("react").JSX.Element;
