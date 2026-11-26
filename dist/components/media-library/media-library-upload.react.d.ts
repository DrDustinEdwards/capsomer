import { type ReactNode } from "react";
import { type ContentLabels, type IntentResult, type SubmitIntent } from "../content/content.ts";
import type { Model } from "./media-library-model.react.tsx";
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
export declare function KeepSize({ uid, id, resize, }: {
    uid: string;
    id: string;
    resize: Model["offers"]["resize"];
}): import("react").JSX.Element | null;
export declare function UploadForm({ m }: {
    m: Model;
}): import("react").JSX.Element | null;
export declare function ImportForm({ m }: {
    m: Model;
}): import("react").JSX.Element;
