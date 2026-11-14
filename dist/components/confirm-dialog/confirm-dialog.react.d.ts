import { type ReactElement, type ReactNode } from "react";
import type { Answer } from "../data/data.ts";
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
export declare function ConfirmPage({ action, method, hidden, title, lead, body, action_label, cancelHref, cancelLabel, typeToConfirm, reason, error, media, headingLevel, children, onCancel, renderForm, }: ConfirmPageProps): import("react").JSX.Element;
export type ConfirmModalProps = Omit<ConfirmPageProps, "headingLevel">;
export declare function ConfirmModal(props: ConfirmModalProps): import("react").JSX.Element;
/** A failed step: the server's words, and whether the preview it rested on has expired. */
export interface StepError {
    text: string;
    expired: boolean;
    /** The failure is about a field (a reason, a typed word), shown beside it. */
    field?: boolean;
}
/** What a step's request came to: `capsomer/react/data`'s Answer. */
type StepAnswer<T> = Answer<T>;
/**
 * Preview, then perform: the preview writes nothing and answers what will change (and a token);
 * perform carries it out. Every press ends in something the person can see: the preview, the
 * result, a refusal in the server's words, or why it could not be sent. A perform refused because
 * its preview expired drops the preview, so the next press previews again. Answers that arrive
 * after the dialog has gone are ignored.
 */
export declare function useTwoStep<I, P, R>({ preview, perform, onDone, onSignedOut, reachText, }: {
    preview: (input: I) => Promise<StepAnswer<P>>;
    perform: (preview: P) => Promise<StepAnswer<R>>;
    onDone: (result: R) => void;
    onSignedOut: () => void;
    reachText?: (message: string) => string;
}): {
    preview: P | null;
    pending: "perform" | "preview" | null;
    busy: boolean;
    error: StepError | null;
    setError: import("react").Dispatch<import("react").SetStateAction<StepError | null>>;
    runPreview: (input: I) => Promise<void>;
    runPerform: () => Promise<void>;
};
export {};
