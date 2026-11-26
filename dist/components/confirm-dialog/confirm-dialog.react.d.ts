import { type ReactNode } from "react";
import type { Answer } from "../data/data.ts";
export { ConfirmPage, ConfirmModal } from "./confirm-page.react.tsx";
export type { ConfirmFormProps, ConfirmPageProps, ConfirmModalProps, } from "./confirm-page.react.tsx";
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
export interface ConfirmAsk<T> {
    subject: T;
    opener: HTMLElement | null;
}
/**
 * The state a page keeps for its confirm dialogs, so focus goes back to the control that asked.
 * `ask(subject, event.currentTarget)` opens; spread `props` into the ConfirmDialog.
 */
export declare function useConfirmAction<T>(): {
    subject: T | null;
    ask: (subject: T, opener?: EventTarget | null) => void;
    close: () => void;
    props: {
        returnTo: HTMLElement | null | undefined;
        onClose: (performed: boolean) => void;
    };
};
export interface StepError {
    text: string;
    expired: boolean;
    field?: boolean;
}
type StepAnswer<T> = Answer<T>;
/**
 * Preview, then perform: the preview writes nothing; perform carries it out. A perform refused because its
 * preview expired drops the preview, so the next press previews again. Answers after the dialog has gone are ignored.
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
