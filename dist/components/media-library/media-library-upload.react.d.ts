import { type ReactNode } from "react";
import { type ContentLabels, type IntentResult, type SubmitIntent } from "../content/content.ts";
export interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    scripted: boolean;
    inPage: boolean;
    closeHref: string;
    rules: {
        accept: string;
        hint: string;
        maxBytes?: number;
    } | null;
    resize: ReactNode;
    noScript: ReactNode;
    importForm: ReactNode;
    submit?: SubmitIntent;
    onDone: (result: IntentResult) => void;
    labels?: ContentLabels;
}
export declare function uploadsResult(done: Array<{
    name: string;
    result: IntentResult;
}>, plural: string): IntentResult;
export declare function UploadDialog(props: UploadDialogProps): import("react").JSX.Element | null;
